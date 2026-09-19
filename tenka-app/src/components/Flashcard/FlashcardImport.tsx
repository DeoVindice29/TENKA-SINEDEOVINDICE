import { useRef, useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { useFlash } from "@/state/FlashContext";
import { parseApkgFile } from "@/utils/apkgParser";

type FlashcardImportProps = {
  onImported?: () => void;
};

export default function FlashcardImport({ onImported }: FlashcardImportProps) {
  const { t } = useLang();
  const { addCustomDeck } = useFlash();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const [statusClass, setStatusClass] = useState("");
  const [busy, setBusy] = useState(false);

  const handleClick = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBusy(true);
    setStatus(t("flash.importing"));
    setStatusClass("pending");

    try {
      const { name, cards } = await parseApkgFile(file);
      const id = addCustomDeck(name, cards);
      if (!id) throw new Error(t("flash.storageFull"));
      setStatus(t("flash.importSuccess", { name, count: cards.length }));
      setStatusClass("ok");
      onImported?.();
    } catch (err) {
      setStatus(
        t("flash.importFailed", {
          msg: (err as Error).message || String(err),
        }),
      );
      setStatusClass("err");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flash-import-box">
      <button
        className="secondary"
        type="button"
        disabled={busy}
        onClick={handleClick}
      >
        {t("flash.importBtn")}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".apkg"
        className="hidden"
        onChange={handleFile}
      />
      <p className={`flash-import-status ${statusClass}`}>{status}</p>
      <p className="flash-import-hint">{t("flash.importHint")}</p>
    </div>
  );
}
