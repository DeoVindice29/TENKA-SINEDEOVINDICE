-- Bank soal mode Latihan (menu Admin Panel: Latihan -> Soal).
--
-- Strukturnya sengaja sama dengan materi (Kotoba / Kanji / Bunpō):
--   Level (N5..N1) -> Organize by -> Chapter -> Sub Chapter -> soal
--
-- Yang dibuat:
--   1. organize_sources.kind boleh bernilai 'soal' (daftar Organize by khusus soal).
--   2. section_titles_soal  : nama Chapter / Sub Chapter khusus soal.
--   3. soal_entries_n5 ... soal_entries_n1 : soal pilihan ganda per level.
--   4. Tiap level diberi satu Organize by awal "Minna no Nihongo".
--
-- JALANKAN SETELAH 2026_add_organize_sources.sql dan 2026_add_entry_sort_order.sql
-- (butuh tabel organize_sources dan fungsi set_entry_sort_order()).
--
-- Aman dijalankan ulang.

begin;

-- 1. organize_sources.kind: izinkan 'soal' ------------------------------------
do $$
declare
  c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    where con.conrelid = 'public.organize_sources'::regclass
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%kind%'
  loop
    execute format('alter table public.organize_sources drop constraint %I', c.conname);
  end loop;
end
$$;

alter table public.organize_sources
  add constraint organize_sources_kind_check
  check (kind in ('kotoba', 'kanji', 'bunpo', 'soal'));

-- Organize by awal untuk soal (satu per level, hanya kalau belum ada).
insert into public.organize_sources (kind, tier, name_id, name_en, sort_order)
select 'soal', lvl, 'Minna no Nihongo', 'Minna no Nihongo', 0
from unnest(array['N5', 'N4', 'N3', 'N2', 'N1']) as lvl
where not exists (
  select 1 from public.organize_sources s where s.kind = 'soal' and s.tier = lvl
);

-- 2. section_titles_soal -------------------------------------------------------
create table if not exists public.section_titles_soal (
  tier      text not null,
  source_id bigint not null references public.organize_sources(id) on delete cascade,
  chapter   integer not null,
  sub_tier  integer not null,
  title_en  text not null default '',
  title_id  text not null default ''
);

create unique index if not exists section_titles_soal_source_key
  on public.section_titles_soal (source_id, chapter, sub_tier);

alter table public.section_titles_soal enable row level security;

drop policy if exists "public read" on public.section_titles_soal;
create policy "public read" on public.section_titles_soal for select using (true);

drop policy if exists "admin write insert" on public.section_titles_soal;
create policy "admin write insert" on public.section_titles_soal
  for insert to authenticated with check (public.is_admin());

drop policy if exists "admin write update" on public.section_titles_soal;
create policy "admin write update" on public.section_titles_soal
  for update to authenticated using (public.is_admin());

drop policy if exists "admin write delete" on public.section_titles_soal;
create policy "admin write delete" on public.section_titles_soal
  for delete to authenticated using (public.is_admin());

-- 3. soal_entries_<level> ------------------------------------------------------
do $$
declare
  lvl text;
  tbl text;
begin
  foreach lvl in array array['n5', 'n4', 'n3', 'n2', 'n1'] loop
    tbl := 'soal_entries_' || lvl;

    execute format(
      $q$
      create table if not exists public.%I (
        id                      bigint generated always as identity primary key,
        tier                    text not null default %L check (tier = %L),
        source_id               bigint not null references public.organize_sources(id) on delete cascade,
        chapter                 integer not null default 1,
        sub_tier                integer not null default 1,
        sort_order              integer not null default 0,
        question                text not null,
        question_translation_id text,
        question_translation_en text,
        options                 jsonb not null,
        answer_index            integer not null default 0,
        explanation_id          text,
        explanation_en          text,
        created_at              timestamptz not null default now(),
        constraint %I check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 6),
        constraint %I check (answer_index >= 0 and answer_index < jsonb_array_length(options))
      )
      $q$,
      tbl, upper(lvl), upper(lvl), tbl || '_options_check', tbl || '_answer_check'
    );

    execute format(
      'create index if not exists %I on public.%I (source_id, chapter, sub_tier)',
      tbl || '_source_idx', tbl
    );

    execute format('alter table public.%I enable row level security', tbl);

    execute format('drop policy if exists "public read" on public.%I', tbl);
    execute format('create policy "public read" on public.%I for select using (true)', tbl);

    execute format('drop policy if exists "admin write insert" on public.%I', tbl);
    execute format(
      'create policy "admin write insert" on public.%I for insert to authenticated with check (public.is_admin())',
      tbl
    );

    execute format('drop policy if exists "admin write update" on public.%I', tbl);
    execute format(
      'create policy "admin write update" on public.%I for update to authenticated using (public.is_admin())',
      tbl
    );

    execute format('drop policy if exists "admin write delete" on public.%I', tbl);
    execute format(
      'create policy "admin write delete" on public.%I for delete to authenticated using (public.is_admin())',
      tbl
    );

    -- soal baru otomatis dapat nomor urut paling akhir di Sub Chapter-nya
    execute format('drop trigger if exists %I on public.%I', tbl || '_sort_order', tbl);
    execute format(
      'create trigger %I before insert on public.%I for each row execute function public.set_entry_sort_order()',
      tbl || '_sort_order', tbl
    );
  end loop;
end
$$;

notify pgrst, 'reload schema';

commit;

-- CEK HASIL:
-- select kind, tier, count(*) from public.organize_sources where kind = 'soal' group by 1, 2 order by 2;
-- select table_name from information_schema.tables where table_name like 'soal_entries_%' order by 1;
