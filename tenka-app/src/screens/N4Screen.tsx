import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { useUI } from "@/state/UIContext";
import { supabase } from "@/lib/supabaseClient";
import {
  TABLE_NAME,
  type KotobaRow,
  type KanjiRow,
  type BunpoRow,
  type SectionTitleRow,
} from "@/lib/contentTypes";
import { fetchSectionTitles } from "@/lib/sectionTitles";
import type { Bilingual, KotobaEntry, KanjiEntry, BunpoEntry } from "@/data/types";
import PageHero from "@/components/PageHero";
import LearnAccordion from "@/components/LearnAccordion";
import LearnSection from "@/components/LearnSection";
import VocabList from "@/components/VocabList";
import KanjiGrid from "@/components/KanjiGrid";
import GrammarCard from "@/components/GrammarCard";
import ScrollTopButton from "@/components/ScrollTopButton";

type N4Tab = "kotoba" | "bunpo" | "kanji";

const TABS: { key: N4Tab; glyph: string; label: string }[] = [
  { key: "kotoba", glyph: "語", label: "Kotoba" },
  { key: "bunpo", glyph: "文", label: "Bunpō" },
  { key: "kanji", glyph: "漢", label: "Kanji" },
];

/** Nama sub-tier dari section_titles kalau ada, kalau nggak "Bab/Chapter x.y". */
function subTierTitle(
  titles: SectionTitleRow[],
  chapter: number,
  subTier: number
): Bilingual {
  const match = titles.find(
    (row) => row.chapter === chapter && row.sub_tier === subTier
  );
  return {
    en: match?.title_en || `Chapter ${chapter}.${subTier}`,
    id: match?.title_id || `Bab ${chapter}.${subTier}`,
  };
}

function toKotobaEntry(row: KotobaRow): KotobaEntry {
  return [
    row.kana,
    row.romaji,
    { en: row.meaning_en, id: row.meaning_id },
    row.example,
    row.segments ?? [],
    { en: row.example_translation_en, id: row.example_translation_id },
    row.kanji_word,
    row.kanji_example,
    row.usage_en || row.usage_id
      ? { en: row.usage_en ?? "", id: row.usage_id ?? "" }
      : "",
  ];
}

function toKanjiEntry(row: KanjiRow): KanjiEntry {
  return [row.kanji, row.reading, { en: row.meaning_en, id: row.meaning_id }, row.kana];
}

function toBunpoEntry(row: BunpoRow): BunpoEntry {
  return [
    row.pattern,
    row.example,
    { en: row.meaning_en, id: row.meaning_id },
    row.segments ?? [],
    row.blank_version ?? "",
    { en: row.example_translation_en, id: row.example_translation_id },
    row.usage_note_en || row.usage_note_id
      ? { en: row.usage_note_en ?? "", id: row.usage_note_id ?? "" }
      : "",
  ];
}

type SubGroup<Row> = { subTier: number; items: Row[] };
type ChapterBucket<Row> = {
  chapter: number;
  sample: string;
  subGroups: SubGroup<Row>[];
};

/** Kelompokkan baris flat jadi Chapter -> Sub-tier, keduanya terurut naik. */
function groupByChapter<Row extends { chapter: number; sub_tier: number }>(
  rows: Row[],
  sampleOf: (row: Row) => string
): ChapterBucket<Row>[] {
  const chapterMap = new Map<number, Map<number, Row[]>>();
  rows.forEach((row) => {
    if (!chapterMap.has(row.chapter)) chapterMap.set(row.chapter, new Map());
    const subMap = chapterMap.get(row.chapter)!;
    if (!subMap.has(row.sub_tier)) subMap.set(row.sub_tier, []);
    subMap.get(row.sub_tier)!.push(row);
  });

  return Array.from(chapterMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([chapter, subMap]) => {
      const subGroups = Array.from(subMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([subTier, items]) => ({ subTier, items }));
      const firstRow = subGroups[0]?.items[0];
      return { chapter, sample: firstRow ? sampleOf(firstRow) : "", subGroups };
    });
}

export default function N4Screen() {
  const { t } = useLang();
  const { setScreen } = useUI();

  const [tab, setTab] = useState<N4Tab>("kotoba");
  const [kotoba, setKotoba] = useState<KotobaRow[]>([]);
  const [kanji, setKanji] = useState<KanjiRow[]>([]);
  const [bunpo, setBunpo] = useState<BunpoRow[]>([]);
  const [sectionTitles, setSectionTitles] = useState<SectionTitleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const [k, kj, b, titles] = await Promise.all([
        supabase.from(TABLE_NAME.kotoba).select("*").eq("tier", "N4").order("chapter").order("sub_tier").order("id"),
        supabase.from(TABLE_NAME.kanji).select("*").eq("tier", "N4").order("chapter").order("sub_tier").order("id"),
        supabase.from(TABLE_NAME.bunpo).select("*").eq("tier", "N4").order("chapter").order("sub_tier").order("id"),
        fetchSectionTitles("N4"),
      ]);
      if (cancelled) return;
      const firstError = k.error || kj.error || b.error;
      if (firstError) {
        setError(firstError.message);
      } else {
        setKotoba((k.data ?? []) as KotobaRow[]);
        setKanji((kj.data ?? []) as KanjiRow[]);
        setBunpo((b.data ?? []) as BunpoRow[]);
        setSectionTitles(titles);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const kotobaChapters = useMemo(
    () => groupByChapter(kotoba, (row) => row.kana),
    [kotoba]
  );
  const kanjiChapters = useMemo(
    () => groupByChapter(kanji, (row) => row.kanji),
    [kanji]
  );
  const bunpoChapters = useMemo(
    () => groupByChapter(bunpo, (row) => row.pattern),
    [bunpo]
  );

  // Bentuk grup accordion (satu per Chapter) buat tab yang lagi aktif —
  // sama persis strukturnya dengan accordion Kotoba di layar Belajar N5.
  const kotobaGroups = useMemo(
    () =>
      kotobaChapters.map((c) => ({
        id: `n4-kotoba-ch-${c.chapter}`,
        chapterNum: c.chapter,
        sample: c.sample,
        title: { en: `Chapter ${c.chapter}`, id: `Bab ${c.chapter}` },
        desc: {
          en: t("n4.chapterDesc", {
            count: c.subGroups.reduce((sum, sg) => sum + sg.items.length, 0),
            label: "words",
            groups: c.subGroups.length,
          }),
          id: t("n4.chapterDesc", {
            count: c.subGroups.reduce((sum, sg) => sum + sg.items.length, 0),
            label: "kata",
            groups: c.subGroups.length,
          }),
        },
        render: () => (
          <>
            {c.subGroups.map((sg) => (
              <LearnSection
                key={sg.subTier}
                title={subTierTitle(sectionTitles, c.chapter, sg.subTier)}
                count={sg.items.length}
                countLabel={t("learn.words")}
                desc={{ en: t("n4.subTierDescKotoba"), id: t("n4.subTierDescKotoba") }}
              >
                <VocabList items={sg.items.map(toKotobaEntry)} />
              </LearnSection>
            ))}
          </>
        ),
      })),
    [kotobaChapters, sectionTitles, t]
  );

  const kanjiGroups = useMemo(
    () =>
      kanjiChapters.map((c) => ({
        id: `n4-kanji-ch-${c.chapter}`,
        chapterNum: c.chapter,
        sample: c.sample,
        title: { en: `Chapter ${c.chapter}`, id: `Bab ${c.chapter}` },
        desc: {
          en: t("n4.chapterDesc", {
            count: c.subGroups.reduce((sum, sg) => sum + sg.items.length, 0),
            label: "characters",
            groups: c.subGroups.length,
          }),
          id: t("n4.chapterDesc", {
            count: c.subGroups.reduce((sum, sg) => sum + sg.items.length, 0),
            label: "karakter",
            groups: c.subGroups.length,
          }),
        },
        render: () => (
          <>
            {c.subGroups.map((sg) => (
              <LearnSection
                key={sg.subTier}
                title={subTierTitle(sectionTitles, c.chapter, sg.subTier)}
                count={sg.items.length}
                countLabel={t("learn.characters")}
                desc={{ en: t("n4.subTierDescKanji"), id: t("n4.subTierDescKanji") }}
              >
                <KanjiGrid items={sg.items.map(toKanjiEntry)} />
              </LearnSection>
            ))}
          </>
        ),
      })),
    [kanjiChapters, sectionTitles, t]
  );

  const bunpoGroups = useMemo(
    () =>
      bunpoChapters.map((c) => ({
        id: `n4-bunpo-ch-${c.chapter}`,
        chapterNum: c.chapter,
        sample: c.sample,
        title: { en: `Chapter ${c.chapter}`, id: `Bab ${c.chapter}` },
        desc: {
          en: t("n4.chapterDesc", {
            count: c.subGroups.reduce((sum, sg) => sum + sg.items.length, 0),
            label: "patterns",
            groups: c.subGroups.length,
          }),
          id: t("n4.chapterDesc", {
            count: c.subGroups.reduce((sum, sg) => sum + sg.items.length, 0),
            label: "pola",
            groups: c.subGroups.length,
          }),
        },
        render: () => (
          <>
            {c.subGroups.map((sg) => (
              <LearnSection
                key={sg.subTier}
                title={subTierTitle(sectionTitles, c.chapter, sg.subTier)}
                count={sg.items.length}
                countLabel={t("learn.patterns")}
                desc={{ en: t("n4.subTierDescBunpo"), id: t("n4.subTierDescBunpo") }}
              >
                <GrammarCard items={sg.items.map(toBunpoEntry)} />
              </LearnSection>
            ))}
          </>
        ),
      })),
    [bunpoChapters, sectionTitles, t]
  );

  const activeGroups =
    tab === "kotoba" ? kotobaGroups : tab === "kanji" ? kanjiGroups : bunpoGroups;
  const emptyKey =
    tab === "kotoba" ? "n4.emptyKotoba" : tab === "kanji" ? "n4.emptyKanji" : "n4.emptyBunpo";

  return (
    <section id="screen-n4">
      <div className="quiz-back-row">
        <button className="quiz-back" type="button" onClick={() => setScreen("start")}>
          {"< Back"}
        </button>
      </div>

      <PageHero
        variant="learn"
        eyebrow={t("n4.eyebrow")}
        title={t("n4.title")}
        sub={t("n4.sub")}
      />

      <div className="script-tabs" id="n4-tabs" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.key}
            className={`script-tab ${tab === item.key ? "active" : ""}`}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => {
              setTab(item.key);
              window.scrollTo({ top: 0, behavior: "instant" });
            }}
          >
            <span className="script-tab-icon">{item.glyph}</span>
            <span className="script-tab-label">{item.label}</span>
          </button>
        ))}
      </div>

      {loading && <p className="learn-no-results">{t("n4.loading")}</p>}
      {error && (
        <p className="learn-no-results" style={{ color: "#c0392b" }}>
          {t("n4.loadError")}: {error}
        </p>
      )}

      {!loading && !error && (
        <>
          {activeGroups.length > 0 ? (
            <LearnAccordion groups={activeGroups} />
          ) : (
            <p className="learn-no-results">{t(emptyKey)}</p>
          )}
        </>
      )}

      <ScrollTopButton id="btn-n4-scrolltop" />
    </section>
  );
}
