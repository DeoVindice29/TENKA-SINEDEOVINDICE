import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { useUI } from "@/state/UIContext";
import { useSpeech } from "@/hooks/useSpeech";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useLevelUnlock } from "@/hooks/useLevelUnlock";
import { READING_STORIES, type ReadingStory } from "@/data/readingStories";
import ContentSourceSwitch from "@/components/ContentSourceSwitch";
import type { KotobaLevel } from "@/lib/kotobaSupabase";
import { parseReading, storySentences, toKana, toKanji } from "@/lib/readingText";
import type { Bilingual } from "@/data/types";
import PageHero from "@/components/PageHero";
import ScrollTopButton from "@/components/ScrollTopButton";

// Latihan Membaca — satu paragraf panjang per cerita, tiap kata punya arti.
// Pengaturan di layar baca (semua on/off, diingat di localStorage):
//  - furigana di atas kanji
//  - arti tiap kata (tampil di bawah kata). Ketuk kata → arti + suara kata itu.
//  - terjemahan paragraf
//  - ukuran teks (A-/A+), tandai cerita selesai

type Lang = "en" | "id";

const tb = (b: Bilingual, lang: Lang) => b[lang] || b.en || b.id;

function JpText({ src, furigana }: { src: string; furigana: boolean }) {
  return (
    <>
      {parseReading(src).map((s, i) => {
        if (!s.ruby) return <Fragment key={i}>{s.text}</Fragment>;
        if (furigana) {
          return (
            <ruby key={i}>
              {s.text}
              <rt>{s.ruby}</rt>
            </ruby>
          );
        }
        return <Fragment key={i}>{s.text}</Fragment>;
      })}
    </>
  );
}

function Chip({
  checked,
  onChange,
  label,
  icon,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  icon: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      className={`rd-chip ${checked ? "on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className="rd-chip-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="rd-chip-label">{label}</span>
      <span className="rd-chip-check" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="m5 12.5 4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}

const SpeakerIcon = () => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
  </svg>
);

export default function ReadingScreen() {
  const { t, lang } = useLang();
  const { setSessionActive } = useUI();
  const { speak, supported } = useSpeech();
  const { resolveLevel } = useLevelUnlock();

  const [level, setLevel] = useLocalStorage<KotobaLevel>("tenka:reading:level", "N5");
  const [furigana, setFurigana] = useLocalStorage<boolean>("tenka:reading:furigana", true);
  const [gloss, setGloss] = useLocalStorage<boolean>("tenka:reading:gloss", false);
  const [showTr, setShowTr] = useLocalStorage<boolean>("tenka:reading:tr", false);

  const [storyId, setStoryId] = useState<string | null>(null);
  const [size, setSize] = useLocalStorage<number>("tenka:reading:size", 1);
  const [doneIds, setDoneIds] = useLocalStorage<string[]>("tenka:reading:done", []);
  const [selected, setSelected] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const playTokenRef = useRef(0);

  const story: ReadingStory | undefined = READING_STORIES.find((s) => s.id === storyId);
  const effectiveLevel: KotobaLevel = resolveLevel(level);
  const stories = READING_STORIES.filter((s) => s.level === effectiveLevel);

  const stopAudio = useCallback(() => {
    playTokenRef.current++;
    setPlaying(false);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => {
    setSessionActive(story !== undefined);
    return () => setSessionActive(false);
  }, [story, setSessionActive]);

  useEffect(() => () => stopAudio(), [stopAudio]);

  const openStory = (id: string) => {
    stopAudio();
    setSelected(null);
    setStoryId(id);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const closeStory = () => {
    stopAudio();
    setSelected(null);
    setStoryId(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const markDone = (id: string) =>
    setDoneIds((d) => (d.includes(id) ? d : [...d, id]));

  const sizeIdx = Math.min(2, Math.max(0, Number.isFinite(size) ? size : 1));

  const sentences = useMemo(() => (story ? storySentences(story.text) : []), [story]);

  const togglePlay = () => {
    if (playing) return stopAudio();
    const token = ++playTokenRef.current;
    setPlaying(true);
    const run = (i: number) => {
      if (token !== playTokenRef.current) return;
      if (i >= sentences.length) {
        setPlaying(false);
        return;
      }
      speak(sentences[i], null, () => run(i + 1));
    };
    run(0);
  };

  const pickWord = (i: number) => {
    if (!story) return;
    const tk = story.text[i];
    if (!tk.m) return;
    setSelected((cur) => (cur === i ? null : i));
    stopAudio();
    speak(toKana(tk.t), null);
  };

  const sel = story && selected !== null ? story.text[selected] : null;

  // ───────────── Tampilan satu cerita ─────────────
  if (story) {
    const showRuby = furigana;
    const isDone = doneIds.includes(story.id);
    const nextStory = stories[stories.findIndex((s2) => s2.id === story.id) + 1];

    return (
      <section id="screen-reading">
        <div className="ps-sheet">
          <div className="ps-topbar">
            <button type="button" className="ps-back" onClick={closeStory}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M15 5l-7 7 7 7"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {t("reading.back")}
            </button>
          </div>

          <header className="ps-title-card">
            <div className="ps-title-accent" aria-hidden="true" />
            <div className="ps-title-body">
              <span className="ps-title-icon" aria-hidden="true">
                {story.emoji}
              </span>
              <div>
                <h2 className="ps-title rd-jp">
                  <JpText src={story.title} furigana={furigana} />
                </h2>
                <p className="ps-title-desc">{tb(story.titleTr, lang)}</p>
                <p className="ps-title-meta">
                  {story.level} · {t("reading.sentenceCount", { count: sentences.length })}
                </p>
              </div>
            </div>
          </header>

          <div className="rd-toolbar">
            <div className="rd-chips" role="group" aria-label={t("reading.options")}>
              <Chip checked={furigana} onChange={setFurigana} icon="あ" label={t("reading.furigana")} />
              <Chip checked={gloss} onChange={setGloss} icon="文" label={t("reading.wordMeaning")} />
              <Chip checked={showTr} onChange={setShowTr} icon="訳" label={t("reading.translation")} />
            </div>
            <div className="rd-toolbar-end">
              <div className="rd-size" role="group" aria-label={t("reading.textSize")}>
                <button
                  type="button"
                  className="rd-size-btn"
                  aria-label={t("reading.smaller")}
                  disabled={sizeIdx === 0}
                  onClick={() => setSize(sizeIdx - 1)}
                >
                  <span style={{ fontSize: "0.8rem" }}>A</span>
                </button>
                <button
                  type="button"
                  className="rd-size-btn"
                  aria-label={t("reading.larger")}
                  disabled={sizeIdx === 2}
                  onClick={() => setSize(sizeIdx + 1)}
                >
                  <span style={{ fontSize: "1.15rem" }}>A</span>
                </button>
              </div>
              <button
                type="button"
                className={`ls-play rd-play ${playing ? "speaking" : ""}`}
                disabled={!supported}
                onClick={togglePlay}
              >
                <SpeakerIcon />
                <span>{playing ? t("reading.stop") : t("reading.playAll")}</span>
              </button>
            </div>
          </div>

          <article className="rd-passage-card">
            <p
              className={`rd-passage rd-jp size-${sizeIdx} ${
                gloss ? "has-gloss" : ""
              } ${showRuby ? "has-ruby" : ""}`}
              lang="ja"
            >
              {story.text.map((tk, i) =>
                tk.m ? (
                  <span
                    key={i}
                    role="button"
                    tabIndex={0}
                    className={`rd-w ${tk.p ? "is-p" : ""} ${selected === i ? "is-sel" : ""}`}
                    onClick={() => pickWord(i)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        pickWord(i);
                      }
                    }}
                  >
                    <span className="rd-w-jp">
                      <JpText src={tk.t} furigana={furigana} />
                    </span>
                    {gloss && <span className="rd-gloss">{tb(tk.m, lang)}</span>}
                  </span>
                ) : (
                  <span key={i} className="rd-punct">
                    {tk.t}
                  </span>
                ),
              )}
            </p>
          </article>

          <div className={`rd-wordbar ${sel?.m ? "has" : ""}`} aria-live="polite">
            {sel?.m ? (
              <>
                <div className="rd-wordbar-main">
                  <b className="rd-jp">{toKanji(sel.t)}</b>
                  {toKanji(sel.t) !== toKana(sel.t) && (
                    <span className="rd-wordbar-kana">{toKana(sel.t)}</span>
                  )}
                  <span className="rd-wordbar-mean">{tb(sel.m, lang)}</span>
                </div>
                <div className="rd-wordbar-actions">
                  <button
                    type="button"
                    className="rd-icon-btn"
                    aria-label={t("reading.playWord")}
                    disabled={!supported}
                    onClick={() => speak(toKana(sel.t), null)}
                  >
                    <SpeakerIcon />
                  </button>
                  <button
                    type="button"
                    className="rd-icon-btn"
                    aria-label={t("reading.close")}
                    onClick={() => setSelected(null)}
                  >
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M6 6l12 12M18 6 6 18"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <span className="rd-wordbar-hint">
                <span aria-hidden="true">👆</span> {t("reading.tapHint")}
              </span>
            )}
          </div>

          {showTr && (
            <section className="rd-card rd-translation">
              <h3 className="rd-card-title">{t("reading.translation")}</h3>
              <p>{tb(story.tr, lang)}</p>
            </section>
          )}

          <footer className="rd-end">
            <button
              type="button"
              className={`rd-done ${isDone ? "is-done" : ""}`}
              onClick={() => markDone(story.id)}
              disabled={isDone}
            >
              <span aria-hidden="true">{isDone ? "✓" : "○"}</span>
              {isDone ? t("reading.finished") : t("reading.markDone")}
            </button>
            {nextStory ? (
              <button
                type="button"
                className="rd-next"
                onClick={() => {
                  markDone(story.id);
                  openStory(nextStory.id);
                }}
              >
                {t("reading.next")}
                <svg viewBox="0 0 24 24" width={18} height={18} fill="none" aria-hidden="true">
                  <path
                    d="M9 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : (
              <button type="button" className="rd-next" onClick={closeStory}>
                {t("reading.allStories")}
              </button>
            )}
          </footer>
        </div>
        <ScrollTopButton id="btn-reading-scrolltop" />
      </section>
    );
  }

  // ───────────── Daftar cerita ─────────────
  return (
    <section id="screen-reading">
      <PageHero
        variant="practice"
        eyebrow={t("reading.eyebrow")}
        title={t("reading.title")}
        sub={t("reading.sub")}
      />

      <ContentSourceSwitch
        level={effectiveLevel}
        onLevelChange={setLevel}
        hideCategory
      />


      {stories.length === 0 && (
        <p className="learn-no-results">
          {t("reading.noStories", { level: effectiveLevel })}
        </p>
      )}

      {stories.length > 0 && (
      <>
      <div className="flash-section-label">
        {t("reading.storiesLabel")}
        <span className="rd-progress">
          {stories.filter((s2) => doneIds.includes(s2.id)).length} / {stories.length}
        </span>
      </div>
      <div className="rd-story-grid">
        {stories.map((s) => {
          const done = doneIds.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              className={`rd-story ${done ? "is-done" : ""}`}
              onClick={() => openStory(s.id)}
            >
              <span className="rd-story-glyph" aria-hidden="true">
                {s.emoji}
              </span>
              <span className="rd-story-info">
                <span className="rd-story-name rd-jp" lang="ja">
                  <JpText src={s.title} furigana={false} />
                </span>
                <span className="rd-story-tr">{tb(s.titleTr, lang)}</span>
                <span className="rd-story-meta">
                  <span className="rd-tag">{s.level}</span>
                  <span>
                    {t("reading.sentenceCount", {
                      count: s.text.filter((tk) => tk.t === "。").length,
                    })}
                  </span>
                  {done && <span className="rd-tag ok">✓ {t("reading.finished")}</span>}
                </span>
              </span>
              <svg className="rd-story-go" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M9 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          );
        })}
      </div>
      </>
      )}
    </section>
  );
}
