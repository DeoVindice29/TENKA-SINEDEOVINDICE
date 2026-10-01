import { useEffect, useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { useSidebarQuotes } from "@/lib/sidebarQuotes";
import { IconSakura } from "@/admin/adminIcons";

// Kutipan yang diketik huruf per huruf, ditahan sebentar, dihapus, lalu ganti
// ke kutipan berikutnya — sama seperti kartu promo di sidebar app utama,
// dan memakai sumber kutipan yang sama (tabel sidebar_quotes, fallback SIDEBAR_QUOTES). Tampil di bawah
// menu Latihan di sidebar Admin/Dev Panel.
const TYPE_MS = 2500;
const HOLD_MS = 5000;
const DELETE_MS = 2500;

export default function AdminQuote() {
  const { lang } = useLang();
  const quotes = useSidebarQuotes();
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * quotes.length));
  const [typedLength, setTypedLength] = useState(0);

  useEffect(() => {
    const q = quotes[quoteIndex % quotes.length] ?? quotes[0];
    const fullText = q.lines[lang].join("\n");
    const timers: number[] = [];
    const after = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(fn, ms));
    };
    const charDelay = fullText.length > 0 ? TYPE_MS / fullText.length : TYPE_MS;
    const deleteDelay = fullText.length > 0 ? DELETE_MS / fullText.length : DELETE_MS;

    const typeStep = (i: number) => {
      setTypedLength(i);
      if (i < fullText.length) after(charDelay, () => typeStep(i + 1));
      else after(HOLD_MS, () => deleteStep(fullText.length - 1));
    };
    const deleteStep = (i: number) => {
      if (i < 0) {
        setTypedLength(0);
        after(300, () => {
          if (quotes.length > 1) setQuoteIndex((prev) => (prev + 1) % quotes.length);
          else typeStep(1);
        });
        return;
      }
      setTypedLength(i);
      after(deleteDelay, () => deleteStep(i - 1));
    };

    setTypedLength(0);
    after(charDelay, () => typeStep(1));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [quoteIndex, lang, quotes]);

  const quote = quotes[quoteIndex % quotes.length] ?? quotes[0];
  const full = quote.lines[lang].join("\n");
  const typedLines = full.slice(0, typedLength).split("\n");

  return (
    <div className="adm-quote" aria-label={full.replace(/\n/g, " ")}>
      <IconSakura className="adm-quote-icon" aria-hidden="true" />
      <p className="adm-quote-text" aria-hidden="true">
        {typedLines.map((line, i) => (
          <span key={i}>
            {line}
            {i < typedLines.length - 1 && <br />}
          </span>
        ))}
        <span className="adm-quote-cursor" />
      </p>
      {quote.author && <span className="adm-quote-author">{quote.author}</span>}
    </div>
  );
}
