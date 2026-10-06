-- Hapus data materi khusus role dev.
--
-- Sebelum: policy "admin write delete" memakai is_admin() (admin ATAU dev), jadi
--          admin juga bisa menghapus entri / nama chapter lewat API.
-- Sesudah: hanya is_dev() yang boleh DELETE di:
--          - 15 tabel entri (kotoba/kanji/bunpo _entries_n5 ... _n1)
--          - 3 tabel section_titles_<jenis>
--          - organize_sources
--          Admin tetap bisa menambah dan mengubah (insert/update tidak berubah).
--
-- JALANKAN SETELAH 2026_add_user_roles_dev_admin.sql dan
-- 2026_add_organize_sources.sql (butuh fungsi is_dev() dan tabel organize_sources).
-- Aman dijalankan ulang.
--
-- Catatan: menghapus satu organize_sources oleh dev tetap ikut menghapus isinya
-- lewat on delete cascade (dijalankan database, bukan oleh admin).

begin;

do $$
declare
  kind text;
  lvl  text;
  tbl  text;
begin
  foreach kind in array array['kotoba', 'kanji', 'bunpo'] loop
    foreach lvl in array array['n5', 'n4', 'n3', 'n2', 'n1'] loop
      tbl := kind || '_entries_' || lvl;
      execute format('drop policy if exists "admin write delete" on public.%I', tbl);
      execute format(
        'create policy "admin write delete" on public.%I for delete to authenticated using (public.is_dev())',
        tbl
      );
    end loop;

    tbl := 'section_titles_' || kind;
    execute format('drop policy if exists "admin write delete" on public.%I', tbl);
    execute format(
      'create policy "admin write delete" on public.%I for delete to authenticated using (public.is_dev())',
      tbl
    );
  end loop;
end
$$;

drop policy if exists "admin write delete" on public.organize_sources;
create policy "admin write delete" on public.organize_sources
  for delete to authenticated using (public.is_dev());

notify pgrst, 'reload schema';

commit;
