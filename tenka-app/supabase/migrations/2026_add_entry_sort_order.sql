-- Urutan entri di dalam Sub Chapter (bisa digeser naik/turun dari Admin Panel).
-- Berlaku untuk kotoba / kanji / bunpo di semua level (N5..N1).
--
-- 1. Tambah kolom sort_order (default 0).
-- 2. Isi awal: nomori 1..n per (source_id, chapter, sub_tier) menurut id,
--    jadi urutan yang sekarang tidak berubah.
-- 3. Trigger: entri baru otomatis dapat nomor paling akhir di Sub Chapter-nya
--    (kalau sort_order tidak diisi), jadi kode insert yang lama tetap jalan.
--
-- Aman dijalankan ulang.

begin;

create or replace function public.set_entry_sort_order() returns trigger
language plpgsql as $fn$
begin
  if new.sort_order is null or new.sort_order = 0 then
    execute format(
      'select coalesce(max(sort_order), 0) + 1 from %I.%I where source_id = $1 and chapter = $2 and sub_tier = $3',
      tg_table_schema, tg_table_name
    ) into new.sort_order using new.source_id, new.chapter, new.sub_tier;
  end if;
  return new;
end;
$fn$;

do $$
declare
  kind text;
  lvl  text;
  tbl  text;
begin
  foreach kind in array array['kotoba', 'kanji', 'bunpo'] loop
    foreach lvl in array array['n5', 'n4', 'n3', 'n2', 'n1'] loop
      tbl := kind || '_entries_' || lvl;

      if to_regclass('public.' || tbl) is null then
        raise notice 'Tabel % tidak ditemukan, dilewati.', tbl;
        continue;
      end if;

      execute format('alter table public.%I add column if not exists sort_order integer not null default 0', tbl);

      execute format(
        'update public.%I t set sort_order = r.rn
           from (select id, row_number() over (partition by source_id, chapter, sub_tier order by id) as rn
                 from public.%I) r
          where t.id = r.id and t.sort_order = 0',
        tbl, tbl
      );

      execute format('drop trigger if exists %I on public.%I', tbl || '_sort_order', tbl);
      execute format(
        'create trigger %I before insert on public.%I for each row execute function public.set_entry_sort_order()',
        tbl || '_sort_order', tbl
      );
    end loop;
  end loop;
end $$;

notify pgrst, 'reload schema';

commit;
