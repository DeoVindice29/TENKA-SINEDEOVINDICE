import type { ReactNode } from "react";
import type { Bilingual } from "@/data/types";
import { useLang } from "@/i18n/LangContext";

type LearnSectionProps = {
  /** id stabil (dipakai Kotoba, karena section-nya di-mount malas) */
  id?: string;
  title: Bilingual;
  count: number;
  countLabel: string;
  desc: Bilingual;
  children: ReactNode;
};

export default function LearnSection({
  id,
  title,
  count,
  countLabel,
  desc,
  children,
}: LearnSectionProps) {
  const { lang } = useLang();

  const tf = (entry: Bilingual | string): string => {
    if (typeof entry === "string") return entry;
    return entry[lang] || entry.en || entry.id || "";
  };

  return (
    <div className="learn-section" id={id}>
      <h2 className="learn-section-title">
        {tf(title)}{" "}
        <span className="count">
          {count} {countLabel}
        </span>
      </h2>
      <p className="learn-section-desc">{tf(desc)}</p>
      {children}
    </div>
  );
}
