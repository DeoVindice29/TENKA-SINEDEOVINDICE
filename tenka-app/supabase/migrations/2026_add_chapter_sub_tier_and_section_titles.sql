-- Jalankan file ini di Supabase SQL Editor (Project > SQL Editor > New query).
-- Aman dijalankan di database yang sudah ada data: pakai "if not exists" /
-- "add column if not exists" jadi tidak akan menghapus apa pun.

-- 1) Kolom chapter & sub_tier yang dipakai kode (AdminContentManager,
--    N4Screen) tapi belum ada di tabel -> ini penyebab error
--    "Could not find the 'chapter' column of 'kotoba_entries' in the
--    schema cache" saat edit/tambah data.
alter table public.kotoba_entries add column if not exists chapter integer not null default 1;
alter table public.kotoba_entries add column if not exists sub_tier integer not null default 1;

alter table public.kanji_entries add column if not exists chapter integer not null default 1;
alter table public.kanji_entries add column if not exists sub_tier integer not null default 1;

alter table public.bunpo_entries add column if not exists chapter integer not null default 1;
alter table public.bunpo_entries add column if not exists sub_tier integer not null default 1;

-- 2) Tabel baru buat nama tiap (tier, chapter, sub_tier), misal
--    "Tier 1.1 — Personal Pronouns & Greetings" — biar sub-tier baru yang
--    ditambah lewat admin panel bisa dikasih nama, sama kayak N5.
create table if not exists public.section_titles (
  tier text not null,
  chapter integer not null,
  sub_tier integer not null,
  title_en text not null default '',
  title_id text not null default '',
  primary key (tier, chapter, sub_tier)
);

alter table public.section_titles enable row level security;

drop policy if exists "public read section_titles" on public.section_titles;
create policy "public read section_titles" on public.section_titles
  for select using (true);

drop policy if exists "admin write section_titles insert" on public.section_titles;
create policy "admin write section_titles insert" on public.section_titles
  for insert to authenticated with check (public.is_admin());

drop policy if exists "admin write section_titles update" on public.section_titles;
create policy "admin write section_titles update" on public.section_titles
  for update to authenticated using (public.is_admin());

drop policy if exists "admin write section_titles delete" on public.section_titles;
create policy "admin write section_titles delete" on public.section_titles
  for delete to authenticated using (public.is_admin());
