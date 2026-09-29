-- Lapisan "Organize by" di antara Level (N5..N1) dan Chapter.
--
-- Sebelum: Level -> Chapter -> Sub Chapter -> entri. Semua data Supabase
--          otomatis dianggap "Minna no Nihongo".
-- Sesudah: Level -> Organize by -> Chapter -> Sub Chapter -> entri.
--          Organize by = sumber/cara menyusun materi (Minna no Nihongo, Genki,
--          Tema lain, dst). Admin bisa tambah, ganti nama, dan hapus.
--
-- Perubahan:
--   1. Tabel baru organize_sources (per jenis konten + level, jadi Kotoba,
--      Kanji, dan Bunpō masing-masing punya daftar sendiri — sama seperti
--      Chapter yang sudah dipisah per jenis konten).
--   2. Tiap (jenis, level) diisi satu baris awal "Minna no Nihongo".
--   3. Kolom source_id di 15 tabel entri (*_entries_n5 ... _n1) dan 3 tabel
--      section_titles_<jenis>. Data lama otomatis masuk "Minna no Nihongo".
--   4. Kunci unik section_titles_<jenis> jadi (source_id, chapter, sub_tier).
--
-- Menghapus satu baris organize_sources ikut menghapus semua entri & nama
-- chapter di dalamnya (on delete cascade). Data "Topic" bawaan app (file di
-- src/data) tidak tersentuh sama sekali.
--
-- Aman dijalankan ulang.

begin;

create table if not exists public.organize_sources (
  id          bigint generated always as identity primary key,
  kind        text not null check (kind in ('kotoba', 'kanji', 'bunpo')),
  tier        text not null check (tier in ('N5', 'N4', 'N3', 'N2', 'N1')),
  name_id     text not null default '',
  name_en     text not null default '',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists organize_sources_kind_tier_idx
  on public.organize_sources (kind, tier, sort_order, id);

alter table public.organize_sources enable row level security;

drop policy if exists "public read" on public.organize_sources;
create policy "public read" on public.organize_sources for select using (true);

drop policy if exists "admin write insert" on public.organize_sources;
create policy "admin write insert" on public.organize_sources
  for insert to authenticated with check (public.is_admin());

drop policy if exists "admin write update" on public.organize_sources;
create policy "admin write update" on public.organize_sources
  for update to authenticated using (public.is_admin());

drop policy if exists "admin write delete" on public.organize_sources;
create policy "admin write delete" on public.organize_sources
  for delete to authenticated using (public.is_dev());

do $$
declare
  v_kind text;
  v_lvl  text;
  tbl  text;
  pk   text;
  sid  bigint;
begin
  foreach v_kind in array array['kotoba', 'kanji', 'bunpo'] loop
    foreach v_lvl in array array['N5', 'N4', 'N3', 'N2', 'N1'] loop
      -- 2. Baris awal "Minna no Nihongo" (hanya kalau (jenis, level) ini belum punya sumber).
      if not exists (select 1 from public.organize_sources where organize_sources.kind = v_kind and organize_sources.tier = v_lvl) then
        insert into public.organize_sources (kind, tier, name_id, name_en, sort_order)
        values (v_kind, v_lvl, 'Minna no Nihongo', 'Minna no Nihongo', 0);
      end if;

      -- Sumber pertama (tertua) = tempat data lama dipindahkan.
      select id into sid
      from public.organize_sources
      where organize_sources.kind = v_kind and organize_sources.tier = v_lvl
      order by sort_order, id
      limit 1;

      -- 3a. Tabel entri: kolom source_id, isi data lama, lalu wajib terisi.
      tbl := v_kind || '_entries_' || lower(v_lvl);
      execute format(
        'alter table public.%I add column if not exists source_id bigint references public.organize_sources(id) on delete cascade',
        tbl
      );
      execute format('update public.%I set source_id = %L where source_id is null', tbl, sid);
      execute format('alter table public.%I alter column source_id set not null', tbl);
      execute format('create index if not exists %I on public.%I (source_id, chapter, sub_tier)', tbl || '_source_idx', tbl);
    end loop;

    -- 3b. section_titles_<jenis>: source_id ikut level barisnya.
    tbl := 'section_titles_' || v_kind;
    execute format(
      'alter table public.%I add column if not exists source_id bigint references public.organize_sources(id) on delete cascade',
      tbl
    );
    execute format(
      $q$
      update public.%I st
      set source_id = (
        select s.id from public.organize_sources s
        where s.kind = %L and s.tier = st.tier
        order by s.sort_order, s.id
        limit 1
      )
      where st.source_id is null
      $q$,
      tbl, v_kind
    );
    execute format('alter table public.%I alter column source_id set not null', tbl);

    -- 4. Ganti primary key (tier, chapter, sub_tier) -> unik (source_id, chapter, sub_tier).
    select c.conname into pk
    from pg_constraint c
    where c.conrelid = ('public.' || tbl)::regclass and c.contype = 'p';
    if pk is not null then
      execute format('alter table public.%I drop constraint %I', tbl, pk);
    end if;
    execute format('drop index if exists public.%I', tbl || '_source_key');
    execute format(
      'create unique index %I on public.%I (source_id, chapter, sub_tier)',
      tbl || '_source_key', tbl
    );
  end loop;
end
$$;

notify pgrst, 'reload schema';

commit;

-- CEK HASIL: tiap (jenis, level) harus punya minimal satu sumber, dan tidak boleh
-- ada entri tanpa sumber.
-- select kind, tier, count(*) from public.organize_sources group by 1, 2 order by 1, 2;
