-- Jalankan file ini di Supabase SQL Editor (Project > SQL Editor > New query).
-- Aman dijalankan berulang: pakai "if not exists" / "create or replace".
--
-- Latar belakang: halaman Statistik di Admin Panel (grafik "Aktivitas Pengguna"
-- dan tabel "Konten Terpopuler") butuh catatan aktivitas belajar. Aplikasi
-- menulis satu baris ke tabel ini untuk tiap kejadian:
--   active            -> pengguna membuka app (maks. sekali per hari per akun)
--   practice_session  -> satu kuis/latihan sampai ke layar hasil
--   conquest_cleared  -> Penaklukan berhasil diselesaikan
--   answer            -> satu jawaban soal (dipakai buat percobaan & akurasi)

create table if not exists public.activity_events (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('active', 'practice_session', 'conquest_cleared', 'answer')),
  script      text,
  item        text check (item is null or char_length(item) <= 200),
  hint        text check (hint is null or char_length(hint) <= 200),
  correct     boolean,
  created_at  timestamptz not null default now()
);

create index if not exists activity_events_kind_created_idx
  on public.activity_events (kind, created_at desc);

alter table public.activity_events enable row level security;

-- Pengguna hanya boleh menulis catatan atas namanya sendiri. Tidak ada policy
-- select: data cuma bisa dibaca lewat fungsi khusus dev di bawah.
drop policy if exists "users insert own activity" on public.activity_events;
create policy "users insert own activity" on public.activity_events
  for insert to authenticated with check (auth.uid() = user_id);

-- Aktivitas harian: pengguna aktif, sesi latihan, dan Penaklukan selesai per hari.
create or replace function public.dev_activity_daily(p_since timestamptz, p_tz text default 'UTC')
returns table (day date, active_users bigint, practice_sessions bigint, conquests_cleared bigint)
language sql
security definer
set search_path = public
stable
as $$
  select
    (e.created_at at time zone p_tz)::date,
    count(distinct e.user_id) filter (where e.kind = 'active'),
    count(*) filter (where e.kind = 'practice_session'),
    count(*) filter (where e.kind = 'conquest_cleared')
  from public.activity_events e
  where public.is_dev()
    and e.kind <> 'answer'
    and e.created_at >= p_since
  group by 1
  order by 1;
$$;

-- Jumlah pengguna unik yang aktif di satu rentang waktu.
create or replace function public.dev_active_users(p_since timestamptz, p_until timestamptz default now())
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select count(distinct e.user_id)
  from public.activity_events e
  where public.is_dev()
    and e.kind = 'active'
    and e.created_at >= p_since
    and e.created_at < p_until;
$$;

-- Konten yang paling sering dilatih: percobaan & jawaban benar sejak p_since,
-- plus periode sebelumnya (p_prev_since sampai p_since) buat panah naik/turun.
create or replace function public.dev_most_practiced(p_since timestamptz, p_prev_since timestamptz, p_limit int default 5)
returns table (
  script_key text,
  item_text text,
  hint_text text,
  n_attempts bigint,
  n_correct bigint,
  prev_attempts bigint,
  prev_correct bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    e.script,
    e.item,
    max(e.hint),
    count(*) filter (where e.created_at >= p_since),
    count(*) filter (where e.created_at >= p_since and e.correct),
    count(*) filter (where e.created_at < p_since),
    count(*) filter (where e.created_at < p_since and e.correct)
  from public.activity_events e
  where public.is_dev()
    and e.kind = 'answer'
    and e.item is not null
    and e.created_at >= p_prev_since
  group by e.script, e.item
  having count(*) filter (where e.created_at >= p_since) > 0
  order by 4 desc, e.script, e.item
  limit p_limit;
$$;

grant execute on function public.dev_activity_daily(timestamptz, text) to authenticated;
grant execute on function public.dev_active_users(timestamptz, timestamptz) to authenticated;
grant execute on function public.dev_most_practiced(timestamptz, timestamptz, int) to authenticated;
