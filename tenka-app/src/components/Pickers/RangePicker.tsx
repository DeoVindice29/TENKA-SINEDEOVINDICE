import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { useUI } from "@/state/UIContext";
import { getRandomCountSteps, getRangeItems } from "@/utils/range";

type DdKey = "from" | "to";

const svgProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const ShuffleIcon = () => (
  <svg {...svgProps}>
    <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
  </svg>
);
const ListIcon = () => (
  <svg {...svgProps}>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
);
const PencilIcon = () => (
  <svg {...svgProps}>
    <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

// Dropdown kustom "Dari"/"Sampai" + mode "Acak" (jumlah soal 10/20/Semua + ketik sendiri, dibatasi biar selalu muat 1 baris).
export default function RangePicker() {
  const { t } = useLang();
  const {
    currentScript,
    selectedMode,
    rangeMode,
    setRangeMode,
    rangeFrom,
    setRangeFrom,
    rangeTo,
    setRangeTo,
    randomCount,
    setRandomCount,
  } = useUI();

  const items = useMemo(
    () => (selectedMode ? getRangeItems(currentScript, selectedMode) : []),
    [currentScript, selectedMode],
  );
  const total = items.length;
  const steps = useMemo(() => getRandomCountSteps(total), [total]);

  const [open, setOpen] = useState<DdKey | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  // Teks mentah yang lagi diketik di kotak "ketik sendiri" — null kalau kotak
  // itu lagi gak difokus/gak dipakai (biar gak dipaksa ke-clamp tiap huruf).
  const [customDraft, setCustomDraft] = useState<string | null>(null);

  // tingkatan baru dipilih → rentang kembali ke seluruh tingkatan, mode
  // kembali ke "Pilih Rentang", dan opsi jumlah acak disiapkan ulang.
  useLayoutEffect(() => {
    if (total === 0) return;
    setOpen(null);
    setRangeFrom(0);
    setRangeTo(total - 1);
    setRangeMode("manual");
    setRandomCount(steps.includes(randomCount) ? randomCount : steps[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScript, selectedMode, total]);

  // klik di luar dropdown / tekan Esc → tutup
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".range-dd")) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("click", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // dropdown dibuka → item aktif digulir ke area yang terlihat
  useEffect(() => {
    if (!open) return;
    rootRef.current
      ?.querySelector(`#range-${open}-list .range-option.active`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open]);

  if (!selectedMode || total === 0) return null;

  const from = Math.max(0, Math.min(rangeFrom, total - 1));
  const to = Math.max(from, Math.min(rangeTo, total - 1));

  // jumlah acak aktif = angka yang dipilih, dibatasi 1..total
  const activeRandomCount = Math.min(Math.max(randomCount, 1), total);
  const isCustomActive = !steps.includes(activeRandomCount);

  const commitCustomDraft = (raw: string) => {
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n) && n > 0) {
      setRandomCount(Math.min(n, total));
    }
    setCustomDraft(null);
  };

  const pick = (key: DdKey, index: number) => {
    if (key === "from") {
      setRangeFrom(index);
      if (index > to) setRangeTo(index);
    } else {
      setRangeTo(index);
      if (index < from) setRangeFrom(index);
    }
    setOpen(null);
  };

  const hint =
    rangeMode === "random"
      ? t("range.randomHint", { count: Math.min(randomCount, total), total })
      : to - from + 1 === 1
        ? t("range.oneSelected", { from: items[from].kana })
        : t("range.manySelected", {
            count: to - from + 1,
            from: items[from].kana,
            to: items[to].kana,
          });

  const renderDd = (key: DdKey, index: number) => {
    const item = items[index];
    const isOpen = open === key;
    return (
      <div className="range-field">
        <label id={`range-${key}-label`}>
          {key === "from" ? t("range.from") : t("range.to")}
        </label>
        <div className="range-dd" id={`range-${key}-dd`}>
          <button
            type="button"
            className="range-dd-trigger"
            id={`range-${key}-trigger`}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-labelledby={`range-${key}-label`}
            onClick={() => setOpen(isOpen ? null : key)}
          >
            <span className="range-dd-kana">{item.kana}</span>
            <span className="range-dd-sub">{item.romaji || item.arti}</span>
            <span className="range-dd-caret">▾</span>
          </button>
          <ul
            className={`range-dd-list ${isOpen ? "" : "hidden"}`}
            id={`range-${key}-list`}
            role="listbox"
            tabIndex={-1}
          >
            {items.map((opt, i) => (
              <li
                key={i}
                role="option"
                aria-selected={i === index}
                className={`range-option ${
                  opt.batch % 2 === 0 ? "batch-a" : "batch-b"
                } ${i === index ? "active" : ""}`}
                data-index={i}
                onClick={() => pick(key, i)}
              >
                <span className="range-opt-kana">{opt.kana}</span>
                {opt.romaji && (
                  <span className="range-opt-romaji">{opt.romaji}</span>
                )}
                {opt.arti && <span className="range-opt-arti">{opt.arti}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="range-picker" id="range-picker" ref={rootRef}>
      <span className="settings-label">{t("range.label")}</span>

      <div className="range-mode-toggle" id="range-mode-toggle">
        <button
          type="button"
          className={`range-mode-btn ${rangeMode === "random" ? "active" : ""}`}
          onClick={() => {
            setOpen(null);
            setRangeMode("random");
          }}
        >
          <ShuffleIcon />
          <span>{t("range.random")}</span>
        </button>
        <button
          type="button"
          className={`range-mode-btn ${rangeMode === "manual" ? "active" : ""}`}
          onClick={() => {
            setOpen(null);
            setRangeMode("manual");
          }}
        >
          <ListIcon />
          <span>{t("range.chooseRange")}</span>
        </button>
      </div>

      {rangeMode === "manual" && (
        <div className="range-row" id="range-row">
          {renderDd("from", from)}
          {renderDd("to", to)}
        </div>
      )}

      {rangeMode === "random" && (
        <div className="range-random" id="range-random">
          <label className="range-random-label">
            {t("range.randomCountLabel")}
          </label>
          <div className="range-random-options" id="range-random-options">
            {steps.map((n) => (
              <button
                key={n}
                type="button"
                className={`range-count-btn ${
                  !isCustomActive && n === activeRandomCount ? "active" : ""
                }`}
                onClick={() => {
                  setRandomCount(n);
                  setCustomDraft(null);
                }}
              >
                {n === total ? t("range.all", { n }) : String(n)}
              </button>
            ))}
            <span className="range-count-custom">
              <PencilIcon />
              <input
                type="number"
                inputMode="numeric"
                className={`range-count-btn range-count-input ${
                  isCustomActive ? "active" : ""
                }`}
                aria-label={t("range.customCountAria")}
                placeholder={t("range.customCount")}
                min={1}
                max={total}
                value={
                  customDraft ??
                  (isCustomActive ? String(activeRandomCount) : "")
                }
                onChange={(e) => setCustomDraft(e.target.value)}
                onFocus={(e) => setCustomDraft(e.target.value)}
                onBlur={(e) => commitCustomDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
              />
            </span>
          </div>
        </div>
      )}

      <p className="range-hint" id="range-hint">
        {hint}
      </p>
    </div>
  );
}
