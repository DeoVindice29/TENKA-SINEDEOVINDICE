-- Tabel profile user (username + foto profil + rank), 1-1 sama auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  avatar_url text,
  rank_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migration guard buat database yang udah ada (tabel lama belum punya kolom rank_index)
alter table public.profiles add column if not exists rank_index integer not null default 0;

-- Kolom bio (fitur lama) udah gak dipakai lagi — dibuang bareng constraint-nya.
alter table public.profiles drop constraint if exists profiles_bio_length;
alter table public.profiles drop column if exists bio;

alter table public.profiles enable row level security;

drop policy if exists "public read profiles" on public.profiles;
create policy "public read profiles" on public.profiles
  for select using (true);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- Hapus akun pengguna (dipanggil dari Admin Panel → Pengguna). Jalan sebagai
-- security definer supaya bisa menghapus baris di auth.users (yang gak boleh
-- disentuh langsung lewat role authenticated); public.profiles ikut kehapus
-- otomatis lewat "on delete cascade" di atas. Dibatasi cuma buat admin.
create or replace function public.admin_delete_user(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  delete from auth.users where id = target_id;
end;
$$;

grant execute on function public.admin_delete_user(uuid) to authenticated;

-- Tiap ada user baru sign up (lewat Google OAuth), otomatis bikin baris
-- profile kosong, avatar-nya diisi awal dari foto Google (bisa diganti user nanti)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, avatar_url)
  values (new.id, new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage bucket buat user upload foto profil sendiri
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatar public read" on storage.objects;
create policy "avatar public read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatar user upload" on storage.objects;
create policy "avatar user upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatar user update" on storage.objects;
create policy "avatar user update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatar user delete" on storage.objects;
create policy "avatar user delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
