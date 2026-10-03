-- Script Practice (Admin Panel): bank soal dikelompokkan per aksara + tipe soal
-- ============================================================================
-- Halaman Script Practice di Admin Panel menampilkan soal per aksara
-- (Kotoba / Bunpō / Kanji) lalu per tipe soal (mis. Find the Kanji, Find the
-- Reading, Best Word, Correct Sentence). Jadi tiap baris soal_entries_<level>
-- perlu tahu dia milik aksara & tipe yang mana.
--
--   1. kolom `script`        : 'kotoba' | 'bunpo' | 'kanji' (default 'kotoba')
--   2. kolom `question_type` : kunci tipe soal (write, reading, fill, usage,
--                              meaning, particle, conjugation, arrange)
--   3. source_id boleh kosong : daftar Script Practice itu datar (tanpa
--                              Organize by / Chapter / Sub Chapter)
--   4. nomor urut soal dihitung per (script, question_type), bukan per
--      Sub Chapter lagi
--
-- Soal lama (yang dibuat lewat pohon Chapter / Sub Chapter) tidak dihapus —
-- kolom question_type-nya kosong, jadi tidak muncul di daftar tipe mana pun.
-- Aman dijalankan berulang kali.

begin;

create or replace function public.set_soal_sort_order() returns trigger
language plpgsql as $fn$
begin
  if new.sort_order is null or new.sort_order = 0 then
    execute format(
      'select coalesce(max(sort_order), 0) + 1 from %I.%I where script = $1 and question_type is not distinct from $2',
      tg_table_schema, tg_table_name
    ) into new.sort_order using new.script, new.question_type;
  end if;
  return new;
end;
$fn$;

do $$
declare
  lvl text;
  tbl text;
begin
  foreach lvl in array array['n5', 'n4', 'n3', 'n2', 'n1'] loop
    tbl := 'soal_entries_' || lvl;

    if to_regclass('public.' || tbl) is null then
      raise notice 'Tabel % tidak ditemukan, dilewati.', tbl;
      continue;
    end if;

    execute format('alter table public.%I add column if not exists script text not null default %L', tbl, 'kotoba');
    execute format('alter table public.%I add column if not exists question_type text', tbl);
    execute format('alter table public.%I alter column source_id drop not null', tbl);

    execute format('alter table public.%I drop constraint if exists %I', tbl, tbl || '_script_check');
    execute format(
      'alter table public.%I add constraint %I check (script in (%L, %L, %L))',
      tbl, tbl || '_script_check', 'kotoba', 'bunpo', 'kanji'
    );

    execute format(
      'create index if not exists %I on public.%I (script, question_type)',
      tbl || '_script_type_idx', tbl
    );

    execute format('drop trigger if exists %I on public.%I', tbl || '_sort_order', tbl);
    execute format(
      'create trigger %I before insert on public.%I for each row execute function public.set_soal_sort_order()',
      tbl || '_sort_order', tbl
    );
  end loop;
end
$$;

notify pgrst, 'reload schema';

commit;

-- CEK HASIL:
-- select table_name, column_name from information_schema.columns
--   where table_name like 'soal_entries_%' and column_name in ('script', 'question_type') order by 1, 2;
