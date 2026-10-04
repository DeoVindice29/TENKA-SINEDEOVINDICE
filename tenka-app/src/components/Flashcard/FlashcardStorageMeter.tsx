import { useEffect, useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { useFlash } from "@/state/FlashContext";
import { getAllMediaBytes, getStorageEstimate } from "@/lib/flashMedia";

function formatBytes(n: number): string {
  if (n < 1024) return `${Math.round(n)} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 100 ? v.toFixed(0) : v.toFixed(1)} ${units[i]}`;
}

// Pemakaian penyimpanan browser (untuk situs ini) + total ukuran audio &
// gambar deck impor. Dihitung ulang tiap ada deck yang ditambah / dihapus.
export default function FlashcardStorageMeter() {
  const { t } = useLang();
  const { reloadFlag } = useFlash();
  const [est, setEst] = useState<{ usage: number; quota: number } | null>(null);
  const [media, setMedia] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    const run = () => {
      void Promise.all([getStorageEstimate(), getAllMediaBytes()]).then(
        ([e, m]) => {
          if (!alive) return;
          setEst(e);
          setMedia(m);
        },
      );
    };
    run();
    // hapus media berjalan di latar belakang → hitung sekali lagi sebentar kemudian
    const timer = window.setTimeout(run, 700);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [reloadFlag]);

  if (!est && media === null) return null;

  const pct = est ? Math.min(100, (est.usage / est.quota) * 100) : 0;
  const low = pct >= 80;

  return (
    <div className="flash-storage" aria-live="polite">
      <div className="flash-storage-title">{t("flash.storageTitle")}</div>
      {est && (
        <>
          <div
            className={`flash-storage-bar${low ? " is-low" : ""}`}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
          >
            <span style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }} />
          </div>
          <div className="flash-storage-text">
            {t("flash.storageUsed", {
              used: formatBytes(est.usage),
              total: formatBytes(est.quota),
              free: formatBytes(Math.max(0, est.quota - est.usage)),
            })}
          </div>
        </>
      )}
      {media !== null && (
        <div className="flash-storage-text">
          {t("flash.storageMedia", { size: formatBytes(media) })}
        </div>
      )}
      {low && <div className="flash-storage-warn">⚠️ {t("flash.storageLow")}</div>}
    </div>
  );
}
