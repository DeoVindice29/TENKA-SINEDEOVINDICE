import { useUI, type ScriptKey } from "@/state/UIContext";
import { getConqueredTitles } from "@/data/titles";

const SCRIPTS: { key: ScriptKey; glyph: string; label: string }[] = [
  { key: "hiragana", glyph: "あ", label: "Hiragana" },
  { key: "katakana", glyph: "ア", label: "Katakana" },
  { key: "kotoba", glyph: "語", label: "Kotoba" },
  { key: "bunpo", glyph: "文", label: "Bunpō" },
  { key: "kanji", glyph: "漢", label: "Kanji" },
];

export default function ScriptTabs() {
  const {
    currentScript,
    setCurrentScript,
    setSelectedMode,
    setQuizVariant,
    selectedDifficulty,
    setSelectedDifficulty,
  } = useUI();
  const earned = getConqueredTitles();

  const handleClick = (key: ScriptKey) => {
    setCurrentScript(key);
    setSelectedMode(null); // reset mode saat ganti script
    // tipe soal antar-script tidak sama (Romaji vs Fungsi/Partikel), jadi
    // kembali ke default supaya tidak nyangkut dari script sebelumnya
    setQuizVariant("meaning");
    // Hard (ketik sendiri) cuma ada di Hiragana/Katakana
    if (selectedDifficulty === "hard" && key !== "hiragana" && key !== "katakana") {
      setSelectedDifficulty("easy");
    }
  };

  return (
    <div
      className="script-tabs"
      id="script-tabs"
      role="tablist"
      aria-label="Choose a script"
    >
      {SCRIPTS.map((s) => (
        <button
          key={s.key}
          className={`script-tab ${
            currentScript === s.key ? "active" : ""
          } ${earned[s.key] ? "conquered" : ""}`}
          type="button"
          role="tab"
          aria-selected={currentScript === s.key}
          onClick={() => handleClick(s.key)}
        >
          <span className="script-tab-icon">
            {s.glyph}
            <span className="tab-conquered-badge" />
          </span>
          <span className="script-tab-label">{s.label}</span>
        </button>
      ))}
    </div>
  );
}
