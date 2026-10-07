-- Practice (Latihan Soal): Level + Organize by
-- ============================================================================
-- Sebelumnya bank soal Script Practice disimpan datar (source_id kosong).
-- Sekarang Practice punya pilihan Level (N5..N1) dan Organize by, sama seperti
-- Lessons / Home / Flashcard. Organize by untuk Practice memakai daftar
-- organize_sources milik aksaranya (kind = kotoba / bunpo / kanji), jadi
-- "Minna no Nihongo", "Genki", dst. yang sudah ada langsung bisa dipakai.
--
-- Yang dilakukan:
--   1. Soal lama yang source_id-nya kosong dipindah ke Organize by pertama
--      di level & aksaranya (biasanya "Minna no Nihongo"), supaya tetap muncul.
--   2. Index (script, source_id, question_type) untuk query Practice.
--
-- WAJIB dijalankan SETELAH 2026_add_soal_script_and_type.sql (kolom script &
-- question_type harus sudah ada) — kalau belum, file ini berhenti dengan pesan jelas.
-- Aman dijalankan berulang kali.

begin;

do $$
declare
  lvl text;
  tbl text;
begin
  foreach lvl in array array['n5', 'n4', 'n3', 'n2', 'n1'] loop
    tbl := 'soal_entries_' || lvl;

    if to_regclass('public.' || tbl) is null then
      raise notice 'Tabel % tidak ditemukan, dilewati.', tbl;
      continue;
    end if;

    -- kolom script & question_type berasal dari 2026_add_soal_script_and_type.sql
    if not exists (
      select 1 from information_schema.columns
       where table_schema = 'public' and table_name = tbl and column_name = 'question_type'
    ) or not exists (
      select 1 from information_schema.columns
       where table_schema = 'public' and table_name = tbl and column_name = 'script'
    ) then
      raise exception 'Tabel % belum punya kolom script/question_type. Jalankan dulu 2026_add_soal_script_and_type.sql, lalu jalankan file ini lagi.', tbl;
    end if;

    -- 1. backfill soal lama tanpa Organize by
    execute format(
      $q$
      update public.%I t
         set source_id = (
           select s.id
             from public.organize_sources s
            where s.kind = t.script
              and s.tier = upper(%L)
            order by s.sort_order, s.id
            limit 1
         )
       where t.source_id is null
         and t.question_type is not null
         and exists (
           select 1 from public.organize_sources s
            where s.kind = t.script and s.tier = upper(%L)
         )
      $q$,
      tbl, lvl, lvl
    );

    -- 2. index untuk Practice
    execute format(
      'create index if not exists %I on public.%I (script, source_id, question_type)',
      tbl || '_practice_idx', tbl
    );
  end loop;
end
$$;

notify pgrst, 'reload schema';

commit;

-- CEK HASIL (harusnya 0 baris = semua soal sudah punya Organize by):
-- select 'n5' lvl, count(*) from public.soal_entries_n5 where question_type is not null and source_id is null
-- union all select 'n4', count(*) from public.soal_entries_n4 where question_type is not null and source_id is null
-- union all select 'n3', count(*) from public.soal_entries_n3 where question_type is not null and source_id is null
-- union all select 'n2', count(*) from public.soal_entries_n2 where question_type is not null and source_id is null
-- union all select 'n1', count(*) from public.soal_entries_n1 where question_type is not null and source_id is null;
