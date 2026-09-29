-- Pisah nama Chapter / Sub Chapter per jenis konten.
--
-- Sebelum: satu tabel section_titles dipakai bareng Kotoba, Kanji, dan Bunpō,
--          jadi chapter yang dibuat di Kotoba ikut muncul di Bunpō/Kanji.
-- Sesudah: section_titles_kotoba, section_titles_kanji, section_titles_bunpo.
--
-- JALANKAN SETELAH 2026_split_entries_per_tier.sql (butuh tabel *_entries_n5 dst).
--
-- Isi awal tiap tabel baru:
--   * kotoba : semua baris section_titles lama (chapter yang ada sekarang milik Kotoba).
--   * kanji / bunpo : hanya baris yang benar-benar dipakai entri Kanji / Bunpō,
--     plus penanda tier (chapter 0, sub_tier 0). Jadi kalau Kanji/Bunpō belum
--     punya data, tree-nya mulai kosong.
--
-- section_titles lama TIDAK dihapus: di-rename jadi section_titles_old sebagai cadangan.
-- Aman dijalankan ulang (dilewati kalau section_titles sudah di-rename).

begin;

do $$
declare
  kind text;
  lvl  text;
  tbl  text;
  ent  text;
begin
  if to_regclass('public.section_titles') is null then
    raise notice 'Tabel section_titles tidak ditemukan, dilewati.';
    return;
  end if;

  foreach kind in array array['kotoba', 'kanji', 'bunpo'] loop
    tbl := 'section_titles_' || kind;

    execute format('create table if not exists public.%I (like public.section_titles including all)', tbl);

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

    if kind = 'kotoba' then
      execute format('insert into public.%I select * from public.section_titles on conflict do nothing', tbl);
    else
      foreach lvl in array array['N5', 'N4', 'N3', 'N2', 'N1'] loop
        ent := kind || '_entries_' || lower(lvl);
        execute format(
          $q$
          insert into public.%1$I
          select st.* from public.section_titles st
          where st.tier = %3$L
            and (
              (st.chapter = 0 and st.sub_tier = 0)
              or (st.sub_tier <> 0 and exists (
                    select 1 from public.%2$I e
                    where e.chapter = st.chapter and e.sub_tier = st.sub_tier))
              or (st.sub_tier = 0 and st.chapter <> 0 and exists (
                    select 1 from public.%2$I e
                    where e.chapter = st.chapter))
            )
          on conflict do nothing
          $q$,
          tbl, ent, lvl
        );
      end loop;
    end if;
  end loop;

  alter table public.section_titles rename to section_titles_old;
end
$$;

notify pgrst, 'reload schema';

commit;

-- CEK HASIL: Kotoba harus sama dengan section_titles_old; Kanji/Bunpō boleh lebih sedikit.
-- select 'kotoba' as jenis, count(*) from public.section_titles_kotoba
-- union all select 'kanji', count(*) from public.section_titles_kanji
-- union all select 'bunpo', count(*) from public.section_titles_bunpo
-- union all select 'old', count(*) from public.section_titles_old;
--
-- HAPUS CADANGAN (nanti, kalau sudah pasti aman):
-- drop table public.section_titles_old;
