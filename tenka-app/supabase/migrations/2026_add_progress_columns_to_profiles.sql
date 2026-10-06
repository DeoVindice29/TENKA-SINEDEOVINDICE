-- Jalankan file ini di Supabase SQL Editor (Project > SQL Editor > New query).
-- Aman dijalankan di database yang sudah ada data: pakai "if not exists" /
-- "add column if not exists" jadi tidak akan menghapus apa pun.
--
-- Latar belakang: progres pangkat (rank_index), status taklukan skrip yang
-- jadi basis misi (conquery), dan koleksi title penaklukan (conquest_titles)
-- sebelumnya cuma disimpan di localStorage browser (global, bukan per-akun),
-- jadi kalau ganti-ganti akun di browser yang sama progresnya bisa "ketuker".
-- Kolom conquery & conquest_titles ini yang jadi tempat nyimpen progres itu
-- per-akun di server. rank_index kemungkinan sudah ada dari sebelumnya (kode
-- lama sudah menulis ke situ), tapi tetap dijaga dengan "if not exists".

alter table public.profiles
  add column if not exists rank_index integer not null default 0;

alter table public.profiles
  add column if not exists conquery jsonb not null default '{}'::jsonb;

alter table public.profiles
  add column if not exists conquest_titles jsonb not null default '{}'::jsonb;

-- Catatan RLS: kolom-kolom ini ikut ke row `profiles` yang sudah ada, jadi
-- otomatis kena policy select/update "user boleh baca & ubah row miliknya
-- sendiri" yang dipakai kolom username/avatar_url/rank_index yang lain di
-- tabel ini. Kalau ternyata policy update `profiles` di project ini masih
-- membatasi daftar kolom tertentu (bukan `for update using (auth.uid() =
-- id)` yang longgar), tambahkan `conquery` dan `conquest_titles` ke daftar
-- kolom yang boleh diubah situ juga.
