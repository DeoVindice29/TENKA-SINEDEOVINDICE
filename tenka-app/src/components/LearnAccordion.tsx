import { useState, type ReactNode } from "react";
import { useLang } from "@/i18n/LangContext";

type Group = {
  id: string;
  chapterNum: number;
  title: { en: string; id: string };
  desc: { en: string; id: string };
  children: ReactNode;
};

type LearnAccordionProps = {
  groups: Group[];
};

export default function LearnAccordion({ groups }: LearnAccordionProps) {
  const { lang } = useLang();
  const [openId, setOpenId] = useState<string | null>(null);

  const tf = (entry: { en: string; id: string }): string =>
    entry[lang] || entry.en || entry.id || "";

  return (
    <div className="learn-accordion">
      {groups.map((group) => {
        const isOpen = openId === group.id;
        return (
          <div key={group.id} className="tier-group">
            <button
              type="button"
              className={`tier-group-header ${isOpen ? "open" : ""}`}
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? null : group.id)}
            >
              <span className="tier-group-chapter">
                Chapter {group.chapterNum}
              </span>
              <span className="tier-group-text">
                <span className="tier-group-title">{tf(group.title)}</span>
                <span className="tier-group-desc">{tf(group.desc)}</span>
              </span>
              <span className="tier-group-caret" aria-hidden="true" />
            </button>
            <div className={`tier-group-panel-wrap ${isOpen ? "open" : ""}`}>
              <div className="tier-group-panel learn-group-content">
                {group.children}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
