-- Soal "Arrange the Sentence (★)" Bunpō yang bisa ditambah lewat admin.
-- Bentuk barisnya = tipe ArrangeQuestion di src/data/bunpoArrange.ts.
create table if not exists public.bunpo_arrange (
  id          uuid primary key default gen_random_uuid(),
  prefix      text not null default '',
  parts       text[] not null check (array_length(parts, 1) = 4),
  suffix      text not null default '',
  star        smallint not null check (star between 0 and 3),
  full        text not null,
  meaning_id  text not null default '',
  meaning_en  text not null default '',
  note        text,
  created_at  timestamptz not null default now()
);

alter table public.bunpo_arrange enable row level security;

-- semua user login boleh membaca soal; hanya admin/dev yang boleh menulis
drop policy if exists "bunpo_arrange read" on public.bunpo_arrange;
create policy "bunpo_arrange read" on public.bunpo_arrange
  for select to authenticated using (true);

drop policy if exists "bunpo_arrange write" on public.bunpo_arrange;
create policy "bunpo_arrange write" on public.bunpo_arrange
  for all to authenticated
  using (public.app_role() in ('admin', 'dev'))
  with check (public.app_role() in ('admin', 'dev'));
