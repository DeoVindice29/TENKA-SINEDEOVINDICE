-- Daftar email semua akun, khusus dev. Dipakai halaman Users di Dev Panel
-- (baris kedua di bawah nama). Kalau migrasi ini belum dijalankan, halaman
-- Users tetap jalan, cuma emailnya tidak tampil.
create or replace function public.admin_list_emails()
returns table (user_id uuid, email text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_dev() then
    raise exception 'not authorized';
  end if;

  return query
    select u.id, u.email::text
    from auth.users u;
end;
$$;

grant execute on function public.admin_list_emails() to authenticated;
