import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/state/AuthContext";
import { useConquest } from "@/state/ConquestContext";
import { CONQUEST_TITLES } from "@/data/titles";
import { SCRIPTS } from "@/data/scripts";

type Props = {
  /** kalau diisi → tombol kecil buat aksara itu saja (dipakai di layar awal);
   *  kalau kosong → daftar semua aksara + "Reset semua" (dipakai di Settings) */
  scriptKey?: string;
};

// Khusus akun dev: reset status penaklukan biar bisa ngecek ulang cerita
// tiap Tier dari awal, tanpa harus ngerjain ulang soalnya. Klik pertama =
// minta konfirmasi (3 detik), klik kedua baru benar-benar reset — pola yang
// sama dengan tombol Back di kuis.
export default function AdminConquestReset({ scriptKey }: Props) {
  const { isDev } = useAuth();
  const { isConquered, resetConquest, reloadFlag } = useConquest();
  void reloadFlag;

  const [armed, setArmed] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  if (!isDev) return null;

  const press = (target: string) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (armed !== target) {
      setArmed(target);
      timerRef.current = window.setTimeout(() => setArmed(null), 3000);
      return;
    }
    setArmed(null);
    resetConquest(target);
  };

  const labelOf = (key: string) =>
    SCRIPTS[key as keyof typeof SCRIPTS]?.label ?? key;

  // ---- mode satu aksara (layar awal) ----
  if (scriptKey) {
    if (!isConquered(scriptKey)) return null;
    const isArmed = armed === scriptKey;
    return (
      <div className="admin-reset-inline">
        <span className="admin-skip-tag">DEV</span>
        <button
          type="button"
          className={`admin-reset-btn${isArmed ? " armed" : ""}`}
          onClick={() => press(scriptKey)}
          title="Hapus status takluk aksara ini supaya Penaklukan bisa diulang dari Tier 1"
        >
          {isArmed
            ? "Yakin? Klik lagi untuk reset"
            : `↺ Reset penaklukan ${labelOf(scriptKey)}`}
        </button>
      </div>
    );
  }

  // ---- mode daftar (Settings → Progress) ----
  const keys = Object.keys(CONQUEST_TITLES);
  const anyConquered = keys.some((k) => isConquered(k));
  return (
    <details className="about-details">
      <summary>Dev · Reset Penaklukan</summary>
      <p className="about-intro">
        Hapus status takluk (title, misi, dan pangkat dihitung ulang). Rekor
        speedrun tidak ikut terhapus.
      </p>
      <div className="speedrun-records">
        {keys.map((key) => {
          const done = isConquered(key);
          const isArmed = armed === key;
          return (
            <div key={key} className="speedrun-record-row">
              <span className="speedrun-record-emoji">
                {CONQUEST_TITLES[key].emoji}
              </span>
              <span className="speedrun-record-label">{labelOf(key)}</span>
              {done ? (
                <button
                  type="button"
                  className={`admin-reset-btn${isArmed ? " armed" : ""}`}
                  onClick={() => press(key)}
                >
                  {isArmed ? "Yakin?" : "↺ Reset"}
                </button>
              ) : (
                <span className="speedrun-record-time no-record">
                  belum takluk
                </span>
              )}
            </div>
          );
        })}
        <button
          type="button"
          className={`admin-reset-btn admin-reset-btn--all${
            armed === "all" ? " armed" : ""
          }`}
          disabled={!anyConquered}
          onClick={() => press("all")}
        >
          {armed === "all" ? "Yakin? Klik lagi untuk reset semua" : "↺ Reset semua"}
        </button>
      </div>
    </details>
  );
}
