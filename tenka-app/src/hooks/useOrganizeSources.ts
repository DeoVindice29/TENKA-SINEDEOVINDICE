import { useEffect, useState } from "react";
import type { ContentKind, OrganizeSourceRow } from "@/lib/contentTypes";
import { fetchOrganizeSources } from "@/lib/organizeSources";

/**
 * Daftar "Organize by" (Minna no Nihongo, Genki, dst) untuk satu jenis konten,
 * semua level sekaligus — satu request kecil. `ready` false selama masih dimuat.
 */
export function useOrganizeSources(kind: ContentKind): { sources: OrganizeSourceRow[]; ready: boolean } {
  const [sources, setSources] = useState<OrganizeSourceRow[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchOrganizeSources(kind).then((rows) => {
      if (cancelled) return;
      setSources(rows);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  return { sources, ready };
}
