-- Kutipan/tips yang tampil di kartu sidebar (app utama + Admin Panel).
--
-- Sebelumnya isinya statis di src/data/sidebarQuotes.ts. Sekarang bisa
-- ditambah, diubah, diurutkan, dan dinonaktifkan dari Admin Panel (menu
-- "Kutipan"). Kalau tabel ini kosong / belum ada, app otomatis jatuh ke
-- daftar bawaan di sidebarQuotes.ts — jadi aman dijalankan kapan saja.
--
-- text_id / text_en: satu baris teks = satu baris di kartu; pindah baris
-- pakai Enter (disimpan sebagai "\n").
--
-- Baca: siapa saja (kartu tampil di app). Tambah/ubah: admin & dev.
-- Hapus: khusus dev (sama seperti materi).
--
-- Aman dijalankan ulang.

begin;

create table if not exists public.sidebar_quotes (
  id          bigint generated always as identity primary key,
  text_id     text not null default '',
  text_en     text not null default '',
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  constraint sidebar_quotes_has_text check (length(btrim(text_id)) > 0 or length(btrim(text_en)) > 0)
);

create index if not exists sidebar_quotes_order_idx
  on public.sidebar_quotes (sort_order, id);

alter table public.sidebar_quotes enable row level security;

drop policy if exists "public read" on public.sidebar_quotes;
create policy "public read" on public.sidebar_quotes for select using (true);

drop policy if exists "admin write insert" on public.sidebar_quotes;
create policy "admin write insert" on public.sidebar_quotes
  for insert to authenticated with check (public.is_admin());

drop policy if exists "admin write update" on public.sidebar_quotes;
create policy "admin write update" on public.sidebar_quotes
  for update to authenticated using (public.is_admin());

drop policy if exists "admin write delete" on public.sidebar_quotes;
create policy "admin write delete" on public.sidebar_quotes
  for delete to authenticated using (public.is_dev());

notify pgrst, 'reload schema';

commit;
