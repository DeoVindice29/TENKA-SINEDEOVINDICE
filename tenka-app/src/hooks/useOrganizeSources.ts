import { useEffect, useState } from "react";
import type { ContentKind, OrganizeSourceRow } from "@/lib/contentTypes";
import { fetchOrganizeSources } from "@/lib/organizeSources";

/**
 * Daftar "Organize by" (Minna no Nihongo, Genki, dst) untuk satu jenis konten,
 * semua level sekaligus — satu request kecil. `ready` false selama masih dimuat.
 * Hasil disimpan bersama `kind`-nya, jadi saat `kind` berganti (mis. pindah tab
 * Kotoba -> Bunpō) daftar milik kind sebelumnya tidak dianggap siap.
 */
export function useOrganizeSources(kind: ContentKind): { sources: OrganizeSourceRow[]; ready: boolean } {
  const [state, setState] = useState<{ kind: ContentKind; sources: OrganizeSourceRow[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchOrganizeSources(kind).then((rows) => {
      if (cancelled) return;
      setState({ kind, sources: rows });
    });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  if (!state || state.kind !== kind) return { sources: [], ready: false };
  return { sources: state.sources, ready: true };
}
