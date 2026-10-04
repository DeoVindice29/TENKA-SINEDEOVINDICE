import { useCallback, useEffect, useState } from "react";
import {
  SFX_EVENT,
  getSfxSettings,
  setSfxSettings,
  type SfxSettings,
} from "@/lib/sfx";

/** Pengaturan efek suara (nyala/mati + volume), sinkron antar komponen. */
export function useSfxSettings(): [SfxSettings, (p: Partial<SfxSettings>) => void] {
  const [s, setS] = useState<SfxSettings>(() => ({ ...getSfxSettings() }));

  useEffect(() => {
    const sync = () => setS({ ...getSfxSettings() });
    window.addEventListener(SFX_EVENT, sync);
    return () => window.removeEventListener(SFX_EVENT, sync);
  }, []);

  const update = useCallback((p: Partial<SfxSettings>) => setSfxSettings(p), []);
  return [s, update];
}
