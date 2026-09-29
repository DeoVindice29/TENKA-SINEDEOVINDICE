-- Jalankan file ini di Supabase SQL Editor (Project > SQL Editor > New query).
-- Aman dijalankan berulang: pakai "if not exists" / "create or replace".
--
-- Sistem role baru:
--   dev   = akses penuh (semua menu Admin Panel + alat dev di app: skip soal,
--           buka semua kunci, reset penaklukan, ubah role, hapus akun)
--   admin = cuma bisa tambah/ubah materi (Kotoba, Kanji, Bunpō) dan Latihan
--   (kosong) = pengguna biasa
--
-- Akun yang emailnya ada di public.admin_emails (admin lama) OTOMATIS jadi
-- dev dan rolenya tidak bisa diubah dari Admin Panel — ini jaring pengaman
-- supaya tidak ada skenario semua dev terkunci keluar.

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'dev')),
  updated_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

-- Tidak ada policy insert/update/delete untuk klien: role HANYA bisa diubah
-- lewat fungsi set_user_role() di bawah (security definer, khusus dev).
-- User boleh baca baris rolenya sendiri.
drop policy if exists "read own role" on public.user_roles;
create policy "read own role" on public.user_roles
  for select to authenticated using (user_id = auth.uid());

-- 'dev' | 'admin' | null
create or replace function public.app_role()
returns text
language sql
security definer
set search_path = public
as $$
  select case
    when exists (
      select 1 from public.admin_emails ae where ae.email = auth.email()
    ) then 'dev'
    else (select ur.role from public.user_roles ur where ur.user_id = auth.uid())
  end;
$$;

grant execute on function public.app_role() to authenticated;

create or replace function public.is_dev()
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.app_role() = 'dev';
$$;

grant execute on function public.is_dev() to authenticated;

-- is_admin() tetap dipakai policy RLS konten (kotoba/kanji/bunpo/judul
-- section) dan gerbang Admin Panel, sekarang artinya "admin ATAU dev".
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.app_role() is not null;
$$;

grant execute on function public.is_admin() to authenticated;

-- Daftar role semua akun (khusus dev) buat halaman Pengguna.
-- locked = true → dev bawaan dari admin_emails, rolenya tidak bisa diubah.
create or replace function public.admin_list_roles()
returns table (user_id uuid, role text, locked boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_dev() then
    raise exception 'not authorized';
  end if;

  return query
    select u.id,
           case when ae.email is not null then 'dev' else ur.role end,
           (ae.email is not null)
    from auth.users u
    left join public.admin_emails ae on ae.email = u.email
    left join public.user_roles ur on ur.user_id = u.id
    where ae.email is not null or ur.role is not null;
end;
$$;

grant execute on function public.admin_list_roles() to authenticated;

-- Ubah role akun: new_role = 'dev' | 'admin' | 'user' ('user' = cabut role).
create or replace function public.set_user_role(target_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_dev() then
    raise exception 'not authorized';
  end if;
  if new_role not in ('dev', 'admin', 'user') then
    raise exception 'role tidak valid: %', new_role;
  end if;
  if target_id = auth.uid() then
    raise exception 'tidak bisa mengubah role akun sendiri';
  end if;
  if exists (
    select 1 from auth.users u
    join public.admin_emails ae on ae.email = u.email
    where u.id = target_id
  ) then
    raise exception 'role akun ini dikunci (dev bawaan)';
  end if;

  if new_role = 'user' then
    delete from public.user_roles where user_id = target_id;
  else
    insert into public.user_roles (user_id, role)
    values (target_id, new_role)
    on conflict (user_id) do update
      set role = excluded.role, updated_at = now();
  end if;
end;
$$;

grant execute on function public.set_user_role(uuid, text) to authenticated;

-- Hapus akun sekarang khusus dev (sebelumnya semua admin bisa).
create or replace function public.admin_delete_user(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_dev() then
    raise exception 'not authorized';
  end if;
  delete from auth.users where id = target_id;
end;
$$;

grant execute on function public.admin_delete_user(uuid) to authenticated;
