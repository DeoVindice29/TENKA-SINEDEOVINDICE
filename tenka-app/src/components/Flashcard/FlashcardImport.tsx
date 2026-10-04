import { useRef, useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { useFlash } from "@/state/FlashContext";
import { parseApkgFile, type ApkgStage } from "@/utils/apkgParser";
import { saveDeckMedia } from "@/lib/flashMedia";
import { Spinner } from "@/components/ui/Loader";
import Button from "@/components/ui/Button";
import FlashcardStorageMeter from "./FlashcardStorageMeter";

type FlashcardImportProps = {
  onImported?: () => void;
  /** dipanggil dari tombol "Belajar sekarang" setelah impor berhasil */
  onStudy?: (deckId: string, name: string) => void;
};

type Stage = ApkgStage | "save";

type ImportResult = {
  id: string;
  name: string;
  cards: number;
  audio: number;
  images: number;
  missing: number;
};

const STEPS: { key: Stage; label: string }[] = [
  { key: "zip", label: "flash.stepZip" },
  { key: "cards", label: "flash.stepCards" },
  { key: "media", label: "flash.stepMedia" },
  { key: "save", label: "flash.stepSave" },
];

export default function FlashcardImport({
  onImported,
  onStudy,
}: FlashcardImportProps) {
  const { t } = useLang();
  const { addCustomDeck, deleteCustomDeck } = useFlash();
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragging, setDragging] = useState(false);

  const busy = stage !== null;

  const openPicker = () => {
    if (!busy) inputRef.current?.click();
  };

  const importFile = async (file: File) => {
    if (!/\.apkg$/i.test(file.name)) {
      setResult(null);
      setError(t("flash.importWrongType"));
      return;
    }

    setError("");
    setResult(null);
    setStage("zip");

    try {
      const { name, cards, media, stats } = await parseApkgFile(file, setStage);

      setStage("save");
      const id = addCustomDeck(name, cards, {
        audio: stats.audio,
        images: stats.images,
      });
      if (!id) throw new Error(t("flash.storageFull"));

      // audio & gambar → IndexedDB; kalau gagal (penyimpanan penuh) deck
      // dibatalkan seluruhnya biar tidak ada deck setengah jadi
      if (media.size > 0) {
        const saved = await saveDeckMedia(id, media);
        if (!saved) {
          deleteCustomDeck(id);
          throw new Error(t("flash.storageFull"));
        }
      }

      setResult({
        id,
        name,
        cards: cards.length,
        audio: stats.audio,
        images: stats.images,
        missing: stats.missing,
      });
      onImported?.();
    } catch (err) {
      setError(
        t("flash.importFailed", {
          msg: (err as Error).message || String(err),
        }),
      );
    } finally {
      setStage(null);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void importFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (busy) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void importFile(file);
  };

  const stepIndex = stage ? STEPS.findIndex((s) => s.key === stage) : -1;

  return (
    <div className="flash-import-box">
      <input
        ref={inputRef}
        type="file"
        accept=".apkg"
        className="hidden"
        onChange={handleFile}
      />

      {busy ? (
        <ol className="flash-import-steps" aria-live="polite" aria-busy="true">
          {STEPS.map((s, i) => {
            const state =
              i < stepIndex ? "done" : i === stepIndex ? "active" : "todo";
            return (
              <li key={s.key} className={`flash-import-step ${state}`}>
                <span className="flash-import-step-mark" aria-hidden="true">
                  {state === "done" ? "✓" : state === "active" ? <Spinner size={14} /> : ""}
                </span>
                <span>{t(s.label)}</span>
              </li>
            );
          })}
        </ol>
      ) : result ? (
        <div className="flash-import-result" role="status">
          <div className="flash-import-result-head">
            <span className="flash-import-result-icon" aria-hidden="true">
              ✅
            </span>
            <strong>{t("flash.importDone", { name: result.name })}</strong>
          </div>
          <div className="flash-import-chips">
            <span className="flash-import-chip">
              📇 {t("flash.chipCards", { count: result.cards })}
            </span>
            {result.audio > 0 && (
              <span className="flash-import-chip">
                🔊 {t("flash.chipAudio", { count: result.audio })}
              </span>
            )}
            {result.images > 0 && (
              <span className="flash-import-chip">
                🖼️ {t("flash.chipImages", { count: result.images })}
              </span>
            )}
          </div>
          {result.missing > 0 && (
            <p className="flash-import-warn">
              ⚠️ {t("flash.importMissing", { count: result.missing })}
            </p>
          )}
          <div className="flash-import-actions">
            {onStudy && (
              <Button
                type="button"
                onClick={() => onStudy(result.id, result.name)}
              >
                {t("flash.studyNow")}
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setResult(null)}
            >
              {t("flash.importAnother")}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div className="flash-import-error" role="alert">
              <p>{error}</p>
              <p className="flash-import-error-hint">
                {t("flash.importFailHint")}
              </p>
            </div>
          )}
          <div
            className={`flash-dropzone${dragging ? " is-dragging" : ""}`}
            role="button"
            tabIndex={0}
            onClick={openPicker}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openPicker();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <span className="flash-dropzone-icon" aria-hidden="true">
              {dragging ? "📂" : "📥"}
            </span>
            <span className="flash-dropzone-title">
              {t(dragging ? "flash.importDropActive" : "flash.importDrop")}
            </span>
            <span className="flash-dropzone-sub">{t("flash.importDropSub")}</span>
            <span className="flash-dropzone-btn">{t("flash.importBtn")}</span>
          </div>
        </>
      )}

      <FlashcardStorageMeter />

      <p className="flash-import-hint">{t("flash.importHint")}</p>
    </div>
  );
}
