import { useLang } from "@/i18n/LangContext";
import type { Bilingual } from "@/data/types";
import type { SkillSource } from "@/hooks/useSkillSource";

// Pilihan cakupan latihan Listening / Speaking: Chapter → Sub Chapter
// (default "Semua" = acak dari seluruh Category). Sub Chapter baru muncul
// setelah satu Chapter dipilih.

type Props = {
  src: SkillSource;
  /** jumlah kata yang tersedia untuk cakupan terpilih */
  available: number;
};

// "Chapter 1 — People & Relationships" → { num: "1", name: "People & Relationships" }
function split(title: string, re: RegExp): { num: string; name: string } | null {
  const m = title.match(re);
  return m ? { num: m[1], name: (m[2] ?? "").trim() } : null;
}

export default function SkillScopePicker({ src, available }: Props) {
  const { t, lang } = useLang();
  const tf = (b: Bilingual) => b[lang] || b.en || b.id || "";

  if (src.chapters.length === 0) return null;
  const chapter = src.chapters.find((c) => c.id === src.chapterId);

  const parse = (title: Bilingual, re: RegExp) => {
    const full = tf(title);
    const p = split(full, re);
    return p ? { num: p.num, name: p.name || p.num } : { num: "", name: full };
  };
  const chapterParts = (c: Bilingual) =>
    parse(c, /^(?:Chapter|Bab)\s*(\d+)\s*(?:[—–-]\s*(.*))?$/i);
  const subParts = (c: Bilingual) =>
    parse(c, /^Sub\s*Chapter\s*([\d.]+)\s*(?:[—–-]\s*(.*))?$/i);

  const chip = (
    key: string,
    active: boolean,
    parts: { num: string; name: string },
    onClick: () => void,
    wide = false,
  ) => (
    <button
      key={key}
      type="button"
      className={`sk-chip ${active ? "active" : ""} ${wide ? "wide" : ""}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {parts.num && <span className="sk-chip-num">{parts.num}</span>}
      <span className="sk-chip-name">{parts.name}</span>
    </button>
  );
  const all = { num: "", name: t("skill.all") };

  return (
    <div className="source-switch-wrap sk-scope">
      <div className="source-switch" role="group" aria-label="Chapter">
        <span className="source-switch-label">{t("skill.chapter")}</span>
        <div className="sk-grid">
          {chip("all", src.chapterId === "all", all, () => src.setChapterId("all"), true)}
          {src.chapters.map((c) =>
            chip(c.id, src.chapterId === c.id, chapterParts(c.title), () =>
              src.setChapterId(c.id),
            ),
          )}
        </div>
      </div>

      {chapter && chapter.subs.length > 0 && (
        <div className="source-switch" role="group" aria-label="Sub Chapter">
          <span className="source-switch-label">{t("skill.subChapter")}</span>
          <div className="sk-grid sk-grid-sub">
            {chip("all", src.subId === "all", all, () => src.setSubId("all"), true)}
            {chapter.subs.map((x) =>
              chip(x.id, src.subId === x.id, subParts(x.title), () =>
                src.setSubId(x.id),
              ),
            )}
          </div>
        </div>
      )}

      <p className="source-switch-hint">{t("skill.available", { count: available })}</p>
    </div>
  );
}
