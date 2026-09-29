-- Pisah data kotoba / kanji / bunpo per level JLPT.
--
-- Sebelum: kotoba_entries, kanji_entries, bunpo_entries (semua level jadi satu,
--          dibedakan kolom `tier`).
-- Sesudah: 15 tabel — kotoba_entries_n5 ... kotoba_entries_n1,
--          kanji_entries_n5 ... kanji_entries_n1,
--          bunpo_entries_n5 ... bunpo_entries_n1.
--
-- Tabel lama TIDAK dihapus: cuma di-rename jadi *_old sebagai cadangan.
-- Setelah aplikasi dicek jalan normal, baru boleh di-drop manual (lihat bagian
-- paling bawah). section_titles tetap satu tabel bersama (kuncinya sudah
-- mengandung tier).
--
-- Aman dijalankan ulang: tabel lama yang sudah di-rename akan dilewati.

begin;

do $$
declare
  kind text;
  lvl  text;
  src  text;
  tbl  text;
begin
  foreach kind in array array['kotoba', 'kanji', 'bunpo'] loop
    src := kind || '_entries';

    if to_regclass('public.' || src) is null then
      raise notice 'Tabel % tidak ditemukan, dilewati.', src;
      continue;
    end if;

    foreach lvl in array array['N5', 'N4', 'N3', 'N2', 'N1'] loop
      tbl := src || '_' || lower(lvl);

      -- 1. Tabel baru dengan struktur sama persis (kolom, default, identity, index).
      execute format(
        'create table if not exists public.%I (like public.%I including all)',
        tbl, src
      );

      -- 2. Tabel level ini hanya boleh berisi tier-nya sendiri.
      execute format('alter table public.%I drop constraint if exists %I', tbl, tbl || '_tier_check');
      execute format('alter table public.%I add constraint %I check (tier = %L)', tbl, tbl || '_tier_check', lvl);
      execute format('alter table public.%I alter column tier set default %L', tbl, lvl);

      -- 3. RLS + policy, sama seperti tabel lama (baca publik, tulis khusus admin).
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

      -- 4. Salin data level ini (id lama dipertahankan).
      execute format(
        'insert into public.%I overriding system value select * from public.%I where tier = %L on conflict (id) do nothing',
        tbl, src, lvl
      );

      -- 5. Geser counter id supaya entri baru tidak bentrok dengan id yang disalin.
      execute format(
        'select setval(pg_get_serial_sequence(%L, %L), coalesce((select max(id) from public.%I), 0) + 1, false)',
        'public.' || tbl, 'id', tbl
      );
    end loop;

    -- 6. Tabel lama disingkirkan dari jalur aplikasi (dijadikan cadangan).
    execute format('alter table public.%I rename to %I', src, src || '_old');
  end loop;
end
$$;

notify pgrst, 'reload schema';

commit;

-- ---------------------------------------------------------------------------
-- CEK HASIL (jalankan setelah migrasi): "lama" harus sama dengan "baru".
-- Kalau ada selisih, berarti ada baris di tabel lama yang nilai tier-nya bukan
-- N5/N4/N3/N2/N1 (mis. huruf kecil) — datanya masih aman di tabel *_old.
--
-- select 'kotoba' as jenis,
--        (select count(*) from public.kotoba_entries_old) as lama,
--        (select count(*) from public.kotoba_entries_n5) + (select count(*) from public.kotoba_entries_n4)
--        + (select count(*) from public.kotoba_entries_n3) + (select count(*) from public.kotoba_entries_n2)
--        + (select count(*) from public.kotoba_entries_n1) as baru
-- union all
-- select 'kanji',
--        (select count(*) from public.kanji_entries_old),
--        (select count(*) from public.kanji_entries_n5) + (select count(*) from public.kanji_entries_n4)
--        + (select count(*) from public.kanji_entries_n3) + (select count(*) from public.kanji_entries_n2)
--        + (select count(*) from public.kanji_entries_n1)
-- union all
-- select 'bunpo',
--        (select count(*) from public.bunpo_entries_old),
--        (select count(*) from public.bunpo_entries_n5) + (select count(*) from public.bunpo_entries_n4)
--        + (select count(*) from public.bunpo_entries_n3) + (select count(*) from public.bunpo_entries_n2)
--        + (select count(*) from public.bunpo_entries_n1);
--
-- HAPUS CADANGAN (nanti, kalau semua sudah dipastikan aman):
-- drop table public.kotoba_entries_old;
-- drop table public.kanji_entries_old;
-- drop table public.bunpo_entries_old;
