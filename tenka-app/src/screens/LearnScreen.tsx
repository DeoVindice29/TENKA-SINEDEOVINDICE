import { useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { useUI, type ScriptKey } from "@/state/UIContext";
import {
  GOJUON_HIRAGANA,
  HIRAGANA_SOKUON_WORDS,
  HIRAGANA_CHOON_WORDS,
  HIRAGANA_HATSUON_WORDS,
} from "@/data/hiragana";
import {
  GOJUON_KATAKANA,
  KATAKANA_SOKUON_WORDS,
  KATAKANA_CHOONPU_WORDS,
  KATAKANA_HATSUON_WORDS,
  KATAKANA_TOKUSHUON_W_WORDS,
  KATAKANA_TOKUSHUON_F_WORDS,
  KATAKANA_TOKUSHUON_V_WORDS,
  KATAKANA_TOKUSHUON_TD_WORDS,
  KATAKANA_TOKUSHUON_SHCHJ_WORDS,
  KATAKANA_TOKUSHUON_TS_WORDS,
  KATAKANA_TOKUSHUON_OTHER_WORDS,
} from "@/data/katakana";
import {
  KANJI_N5_CH1,
  KANJI_N5_CH2,
  KANJI_N5_CH3,
  KANJI_N5_CH4,
  KANJI_N5_CH5,
  KANJI_N5_CH6,
  KANJI_N5_CH7,
  KANJI_N5_CH8,
  KANJI_N5_CH9,
} from "@/data/kanjiN5";
import {
  KOTOBA_N5_CHAPTERS,
  KOTOBA_N5_LEVEL_TEXT,
  KOTOBA_TIER_KEYS,
  KOTOBA_TIER_GROUPS,
} from "@/data/kotobaN5";
import {
  BUNPO_N5_CHAPTERS,
  BUNPO_N5_LEVEL_TEXT,
  BUNPO_N5_TIER_KEYS,
} from "@/data/bunpoN5";
import GojuonTable from "@/components/GojuonTable";
import VocabList from "@/components/VocabList";
import LearnSection from "@/components/LearnSection";
import KanjiGrid from "@/components/KanjiGrid";
import GrammarCard from "@/components/GrammarCard";
import LearnAccordion from "@/components/LearnAccordion";

const TABS: { key: ScriptKey; glyph: string; label: string }[] = [
  { key: "hiragana", glyph: "あ", label: "Hiragana" },
  { key: "katakana", glyph: "ア", label: "Katakana" },
  { key: "kotoba", glyph: "語", label: "Kotoba" },
  { key: "bunpo", glyph: "文", label: "Bunpō" },
  { key: "kanji", glyph: "漢", label: "Kanji" },
];

export default function LearnScreen() {
  const { t } = useLang();
  const { setScreen, currentScript } = useUI();
  const [tab, setTab] = useState<ScriptKey>(currentScript);

  return (
    <section id="screen-learn">
      <div className="quiz-back-row">
        <button
          className="quiz-back"
          type="button"
          data-i18n="common.back"
          onClick={() => setScreen("start")}
        >
          {t("common.back")}
        </button>
      </div>

      <header className="learn-header">
        <div className="eyebrow">{t("learn.eyebrow")}</div>
        <h1 className="learn-title">{t("learn.title")}</h1>
        <p className="sub">{t("learn.sub")}</p>
      </header>

      <div className="script-tabs" id="learn-script-tabs" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.key}
            className={`script-tab ${tab === item.key ? "active" : ""}`}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
          >
            {item.glyph}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div id="learn-tables">
        {tab === "hiragana" && (
          <>
            <LearnSection
              title={{ en: "Gojūon — Basic", id: "Gojūon — Dasar" }}
              count={46}
              countLabel={t("learn.characters")}
              desc={{
                en: "The 46 core characters. This is the foundation you need to memorize first.",
                id: "46 karakter inti. Ini fondasi yang wajib dihafal duluan.",
              }}
            >
              <GojuonTable rows={GOJUON_HIRAGANA.tier1 as any} />
            </LearnSection>

            <LearnSection
              title={{
                en: "Dakuten & Handakuten — Dotted",
                id: "Dakuten & Handakuten — Bertitik",
              }}
              count={25}
              countLabel={t("learn.characters")}
              desc={{
                en: "A double mark or small circle changes how the character is read.",
                id: "Tanda titik dua atau lingkaran kecil mengubah cara baca.",
              }}
            >
              <GojuonTable rows={GOJUON_HIRAGANA.tier2 as any} />
            </LearnSection>

            <LearnSection
              title={{ en: "Yōon — Combined", id: "Yōon — Gabungan" }}
              count={33}
              countLabel={t("learn.characters")}
              desc={{
                en: "A consonant + small ゃゅょ, read together as one syllable.",
                id: "Konsonan + ゃゅょ kecil yang dibaca sebagai satu suku kata.",
              }}
            >
              <GojuonTable rows={GOJUON_HIRAGANA.tier3 as any} />
            </LearnSection>

            <LearnSection
              title={{ en: "Sokuon — Small っ", id: "Sokuon — っ Kecil" }}
              count={HIRAGANA_SOKUON_WORDS.length}
              countLabel={t("learn.words")}
              desc={{
                en: "A small っ before a consonant means a short held pause.",
                id: "っ kecil sebelum konsonan berarti jeda singkat.",
              }}
            >
              <VocabList items={HIRAGANA_SOKUON_WORDS as any} />
            </LearnSection>

            <LearnSection
              title={{ en: "Chōon — Long Vowel", id: "Chōon — Vokal Panjang" }}
              count={HIRAGANA_CHOON_WORDS.length}
              countLabel={t("learn.words")}
              desc={{
                en: "A long vowel sound made by doubling the vowel.",
                id: "Bunyi vokal panjang yang dibuat dengan menggandakan vokalnya.",
              }}
            >
              <VocabList items={HIRAGANA_CHOON_WORDS as any} />
            </LearnSection>

            <LearnSection
              title={{ en: "Hatsuon — Nasal ん", id: "Hatsuon — ん Nasal" }}
              count={HIRAGANA_HATSUON_WORDS.length}
              countLabel={t("learn.words")}
              desc={{
                en: "ん shifts its sound depending on what comes after it.",
                id: "ん berubah bunyinya tergantung huruf sesudahnya.",
              }}
            >
              <VocabList items={HIRAGANA_HATSUON_WORDS as any} />
            </LearnSection>
          </>
        )}

        {tab === "katakana" && (
          <>
            <LearnSection
              title={{ en: "Gojūon — Basic", id: "Gojūon — Dasar" }}
              count={46}
              countLabel={t("learn.characters")}
              desc={{
                en: "The 46 core katakana characters, mostly used for loanwords.",
                id: "46 karakter inti katakana, biasanya dipakai untuk kata serapan.",
              }}
            >
              <GojuonTable rows={GOJUON_KATAKANA.tier1 as any} />
            </LearnSection>

            <LearnSection
              title={{
                en: "Dakuten & Handakuten — Dotted",
                id: "Dakuten & Handakuten — Bertitik",
              }}
              count={25}
              countLabel={t("learn.characters")}
              desc={{
                en: "Just like hiragana, the dot marks change how the consonant is read.",
                id: "Sama seperti hiragana, tanda titik mengubah cara baca konsonannya.",
              }}
            >
              <GojuonTable rows={GOJUON_KATAKANA.tier2 as any} />
            </LearnSection>

            <LearnSection
              title={{ en: "Yōon — Combined", id: "Yōon — Gabungan" }}
              count={33}
              countLabel={t("learn.characters")}
              desc={{
                en: "A consonant + small ャュョ, read together as one syllable.",
                id: "Konsonan + ャュョ kecil, dibaca sebagai satu suku kata.",
              }}
            >
              <GojuonTable rows={GOJUON_KATAKANA.tier3 as any} />
            </LearnSection>

            <LearnSection
              title={{ en: "Sokuon — Small ッ", id: "Sokuon — ッ Kecil" }}
              count={KATAKANA_SOKUON_WORDS.length}
              countLabel={t("learn.words")}
              desc={{
                en: "A small ッ doubles the consonant that follows it.",
                id: "ッ kecil menggandakan konsonan sesudahnya.",
              }}
            >
              <VocabList items={KATAKANA_SOKUON_WORDS as any} />
            </LearnSection>

            <LearnSection
              title={{
                en: "Chōonpu — Long Vowel Mark",
                id: "Chōonpu — Tanda Vokal Panjang",
              }}
              count={KATAKANA_CHOONPU_WORDS.length}
              countLabel={t("learn.words")}
              desc={{
                en: "The dash ー lengthens the vowel right before it.",
                id: "Tanda garis ー memanjangkan vokal tepat sebelumnya.",
              }}
            >
              <VocabList items={KATAKANA_CHOONPU_WORDS as any} />
            </LearnSection>

            <LearnSection
              title={{ en: "Hatsuon — Nasal ン", id: "Hatsuon — ン Nasal" }}
              count={KATAKANA_HATSUON_WORDS.length}
              countLabel={t("learn.words")}
              desc={{
                en: "ン shifts its sound depending on what comes after it.",
                id: "ン berubah bunyinya tergantung huruf sesudahnya.",
              }}
            >
              <VocabList items={KATAKANA_HATSUON_WORDS as any} />
            </LearnSection>

            <LearnSection
              title={{ en: "Tokushuon — W", id: "Tokushuon — W" }}
              count={KATAKANA_TOKUSHUON_W_WORDS.length}
              countLabel={t("learn.words")}
              desc={{
                en: "ウ + small ィ/ェ/ォ for wi/we/wo sounds.",
                id: "ウ + ィ/ェ/ォ kecil untuk bunyi wi/we/wo.",
              }}
            >
              <VocabList items={KATAKANA_TOKUSHUON_W_WORDS as any} />
            </LearnSection>

            <LearnSection
              title={{ en: "Tokushuon — F", id: "Tokushuon — F" }}
              count={KATAKANA_TOKUSHUON_F_WORDS.length}
              countLabel={t("learn.words")}
              desc={{
                en: "フ + small ァ/ィ/ェ/ォ for fa/fi/fe/fo sounds.",
                id: "フ + ァ/ィ/ェ/ォ kecil untuk bunyi fa/fi/fe/fo.",
              }}
            >
              <VocabList items={KATAKANA_TOKUSHUON_F_WORDS as any} />
            </LearnSection>

            <LearnSection
              title={{ en: "Tokushuon — V", id: "Tokushuon — V" }}
              count={KATAKANA_TOKUSHUON_V_WORDS.length}
              countLabel={t("learn.words")}
              desc={{
                en: "ヴ + small ァ/ィ/ェ/ォ for va/vi/ve/vo sounds.",
                id: "ヴ + ァ/ィ/ェ/ォ kecil untuk bunyi va/vi/ve/vo.",
              }}
            >
              <VocabList items={KATAKANA_TOKUSHUON_V_WORDS as any} />
            </LearnSection>

            <LearnSection
              title={{ en: "Tokushuon — T & D", id: "Tokushuon — T & D" }}
              count={KATAKANA_TOKUSHUON_TD_WORDS.length}
              countLabel={t("learn.words")}
              desc={{
                en: "テ/デ + small ィ for ti/di, and ト/ド + small ゥ for tu/du.",
                id: "テ/デ + ィ kecil untuk ti/di, dan ト/ド + ゥ kecil untuk tu/du.",
              }}
            >
              <VocabList items={KATAKANA_TOKUSHUON_TD_WORDS as any} />
            </LearnSection>

            <LearnSection
              title={{
                en: "Tokushuon — Sh, Ch, J",
                id: "Tokushuon — Sh, Ch, J",
              }}
              count={KATAKANA_TOKUSHUON_SHCHJ_WORDS.length}
              countLabel={t("learn.words")}
              desc={{
                en: "シ/チ/ジ + small ェ for she/che/je sounds.",
                id: "シ/チ/ジ + ェ kecil untuk bunyi she/che/je.",
              }}
            >
              <VocabList items={KATAKANA_TOKUSHUON_SHCHJ_WORDS as any} />
            </LearnSection>

            <LearnSection
              title={{ en: "Tokushuon — Ts", id: "Tokushuon — Ts" }}
              count={KATAKANA_TOKUSHUON_TS_WORDS.length}
              countLabel={t("learn.words")}
              desc={{
                en: "ツ + small ァ/ィ/ェ/ォ for tsa/tsi/tse/tso sounds.",
                id: "ツ + ァ/ィ/ェ/ォ kecil untuk bunyi tsa/tsi/tse/tso.",
              }}
            >
              <VocabList items={KATAKANA_TOKUSHUON_TS_WORDS as any} />
            </LearnSection>

            <LearnSection
              title={{ en: "Tokushuon — Other", id: "Tokushuon — Lainnya" }}
              count={KATAKANA_TOKUSHUON_OTHER_WORDS.length}
              countLabel={t("learn.words")}
              desc={{
                en: "Rarer extended katakana — イェ, クァ/グァ, デュ.",
                id: "Katakana tambahan yang lebih jarang — イェ, クァ/グァ, デュ.",
              }}
            >
              <VocabList items={KATAKANA_TOKUSHUON_OTHER_WORDS as any} />
            </LearnSection>
          </>
        )}

        {tab === "kanji" && (
          <>
            <LearnSection
              title={{
                en: "Chapter 1 — Numbers & Counting",
                id: "Chapter 1 — Angka & Jumlah",
              }}
              count={KANJI_N5_CH1.length}
              countLabel={t("learn.characters")}
              desc={{
                en: "14 kanji: numbers and counting.",
                id: "14 kanji: angka dan hitungan.",
              }}
            >
              <KanjiGrid items={KANJI_N5_CH1} />
            </LearnSection>

            <LearnSection
              title={{
                en: "Chapter 2 — Nature, Elements & Weather",
                id: "Chapter 2 — Alam, Elemen & Cuaca",
              }}
              count={KANJI_N5_CH2.length}
              countLabel={t("learn.characters")}
              desc={{
                en: "11 kanji: nature and the elements.",
                id: "11 kanji: alam dan unsur-unsurnya.",
              }}
            >
              <KanjiGrid items={KANJI_N5_CH2} />
            </LearnSection>

            <LearnSection
              title={{
                en: "Chapter 3 — Time & Seasons",
                id: "Chapter 3 — Waktu & Musim",
              }}
              count={KANJI_N5_CH3.length}
              countLabel={t("learn.characters")}
              desc={{
                en: "11 kanji: time of day and calendar words.",
                id: "11 kanji: waktu dalam sehari dan kalender.",
              }}
            >
              <KanjiGrid items={KANJI_N5_CH3} />
            </LearnSection>

            <LearnSection
              title={{
                en: "Chapter 4 — Direction & Position",
                id: "Chapter 4 — Arah & Posisi",
              }}
              count={KANJI_N5_CH4.length}
              countLabel={t("learn.characters")}
              desc={{
                en: "10 kanji: directions and positions.",
                id: "10 kanji: arah dan posisi.",
              }}
            >
              <KanjiGrid items={KANJI_N5_CH4} />
            </LearnSection>

            <LearnSection
              title={{
                en: "Chapter 5 — People, Family & Relationships",
                id: "Chapter 5 — Manusia, Keluarga & Hubungan",
              }}
              count={KANJI_N5_CH5.length}
              countLabel={t("learn.characters")}
              desc={{
                en: "12 kanji: people, family, and body parts.",
                id: "12 kanji: orang, keluarga, dan anggota tubuh.",
              }}
            >
              <KanjiGrid items={KANJI_N5_CH5} />
            </LearnSection>

            <LearnSection
              title={{
                en: "Chapter 6 — Traits, Size & Colors",
                id: "Chapter 6 — Sifat, Ukuran & Warna",
              }}
              count={KANJI_N5_CH6.length}
              countLabel={t("learn.characters")}
              desc={{
                en: "12 kanji: traits, sizes, and colors.",
                id: "12 kanji: sifat, ukuran, dan warna.",
              }}
            >
              <KanjiGrid items={KANJI_N5_CH6} />
            </LearnSection>

            <LearnSection
              title={{
                en: "Chapter 7 — Places, Buildings & Transportation",
                id: "Chapter 7 — Tempat, Bangunan & Transportasi",
              }}
              count={KANJI_N5_CH7.length}
              countLabel={t("learn.characters")}
              desc={{
                en: "11 kanji: places, buildings, and transportation.",
                id: "11 kanji: tempat, bangunan, dan transportasi.",
              }}
            >
              <KanjiGrid items={KANJI_N5_CH7} />
            </LearnSection>

            <LearnSection
              title={{
                en: "Chapter 8 — Basic Verbs & Activities",
                id: "Chapter 8 — Kata Kerja Dasar & Aktivitas",
              }}
              count={KANJI_N5_CH8.length}
              countLabel={t("learn.characters")}
              desc={{
                en: "10 kanji: basic everyday verbs.",
                id: "10 kanji: kata kerja dasar sehari-hari.",
              }}
            >
              <KanjiGrid items={KANJI_N5_CH8} />
            </LearnSection>

            <LearnSection
              title={{
                en: "Chapter 9 — Life Concepts & More Verbs",
                id: "Chapter 9 — Konsep Kehidupan & Kata Kerja Tambahan",
              }}
              count={KANJI_N5_CH9.length}
              countLabel={t("learn.characters")}
              desc={{
                en: "9 kanji: everyday life concepts and more verbs.",
                id: "9 kanji: konsep kehidupan sehari-hari dan kata kerja tambahan.",
              }}
            >
              <KanjiGrid items={KANJI_N5_CH9} />
            </LearnSection>
          </>
        )}

        {tab === "kotoba" && (
          <LearnAccordion
            groups={KOTOBA_TIER_GROUPS.map((g) => ({
              id: g.id,
              chapterNum: g.chapterNum,
              title: {
                en: g.title.en.replace(/^Chapter\s*\d+\s*—\s*/i, ""),
                id: g.title.id.replace(/^Chapter\s*\d+\s*—\s*/i, ""),
              },
              desc: g.desc,
              children: (
                <>
                  {g.tierKeys.map((tk) => {
                    const idx = KOTOBA_TIER_KEYS.indexOf(tk);
                    const items = KOTOBA_N5_CHAPTERS[idx];
                    const meta =
                      KOTOBA_N5_LEVEL_TEXT[
                        tk as keyof typeof KOTOBA_N5_LEVEL_TEXT
                      ];
                    return (
                      <LearnSection
                        key={tk}
                        title={meta?.title ?? { en: tk, id: tk }}
                        count={items.length}
                        countLabel={t("learn.words")}
                        desc={
                          meta?.desc ?? {
                            en: `${items.length} words.`,
                            id: `${items.length} kata.`,
                          }
                        }
                      >
                        <VocabList items={items as any} />
                      </LearnSection>
                    );
                  })}
                </>
              ),
            }))}
          />
        )}

        {tab === "bunpo" && (
          <>
            {BUNPO_N5_TIER_KEYS.map((tk, idx) => {
              const items = BUNPO_N5_CHAPTERS[idx];
              const meta =
                BUNPO_N5_LEVEL_TEXT[tk as keyof typeof BUNPO_N5_LEVEL_TEXT];
              return (
                <LearnSection
                  key={tk}
                  title={meta?.title ?? { en: tk, id: tk }}
                  count={items.length}
                  countLabel={t("learn.patterns")}
                  desc={
                    meta?.desc ?? {
                      en: `${items.length} patterns.`,
                      id: `${items.length} pola.`,
                    }
                  }
                >
                  <GrammarCard items={items as any} />
                </LearnSection>
              );
            })}
          </>
        )}
      </div>
    </section>
  );
}
