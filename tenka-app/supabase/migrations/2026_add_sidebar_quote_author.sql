-- Nama penulis kutipan (opsional), tampil kecil di kanan bawah kartu sidebar.
-- Aman dijalankan ulang.
alter table public.sidebar_quotes add column if not exists author text;
notify pgrst, 'reload schema';
