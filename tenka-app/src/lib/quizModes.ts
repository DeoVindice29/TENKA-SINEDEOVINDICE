import { SCRIPTS } from "@/data/scripts";
import { onQuizLangChange, pickLang } from "@/lib/quizLang";
import type {
  Bilingual,
  BunpoEntry,
  KanjiEntry,
  KotobaEntry,
} from "@/data/types";

/**
 * Bentuk minimal view Supabase yang dibutuhkan kuis & kartu tingkatan Home.
 * KotobaLevelView dan ContentLevelView (Bunpō/Kanji) sama-sama memenuhinya,
 * jadi lib/quizModes.ts tidak perlu mengimpor keduanya (hindari impor melingkar).
 */
export type QuizViewLike = {
  kind: "kotoba" | "bunpo" | "kanji";
  level: string;
  allKey: string;
  total: number;
  chapters: {
    id: string;
    chapter: number;
    sample: string;
    title: Bilingual;
    desc: Bilingual;
    subGroups: {
      key: string;
      title: Bilingual;
      desc: Bilingual;
      items: any[];
    }[];
  }[];
};

/**
 * Mendaftarkan Bunpō / Kanji dari Supabase (Minna no Nihongo, dst) ke SCRIPTS
 * sebagai "mode" kuis tambahan, SUPAYA seluruh alur kuis yang sudah ada —
 * RangePicker, startQuiz, Choices, Feedback, label di layar kuis, Restart —
 * bisa dipakai apa adanya. Semuanya membaca SCRIPTS[script].data[mode] (dan
 * dataKalimat, dataTranslation, dst dengan kunci mode yang sama), jadi cukup
 * mengisi kunci-kunci itu; tidak ada kode kuis yang perlu tahu soal Supabase.
 *
 * Satu sub chapter = satu mode (key = ContentSubGroupView.key), ditambah satu
 * mode "All Mixed" per view (view.allKey). Data bawaan (tier1.., all) tidak
 * disentuh — kunci Supabase selalu diawali "sb-".
 *
 * Isi soal mengikuti persis bentuk data bawaan (lihat data/scripts.ts), dan
 * arti / terjemahan mengikuti bahasa yang dipilih (en / id) lewat pickLang,
 * dan disusun ulang otomatis tiap bahasa berganti.
 */

type Pair = readonly [string, string];
type Pairs = Record<string, Pair[]>;
type Loose = {
  data: Pairs;
  dataRomaji?: Pairs;
  dataKanji?: Pairs;
  dataUsage?: Pairs;
  dataKana?: Pairs;
  dataKalimat?: Pairs;
  dataKalimatBlank?: Pairs;
  dataTranslation?: Pairs;
  dataNote?: Pairs;
  levelText: Record<
    string,
    { title: Bilingual; sample: string; desc: Bilingual }
  >;
};

// Arti / terjemahan / catatan mengikuti bahasa yang sedang dipilih (en / id).
const en = pickLang;

// View yang sudah didaftarkan — disimpan supaya bisa disusun ulang saat
// bahasa berganti (isi soal dibuat sekali, jadi harus di-build ulang).
const registeredViews = new Map<string, QuizViewLike>();

const KIND_EN = {
  kotoba: "vocabulary words",
  bunpo: "grammar patterns",
  kanji: "kanji",
} as const;
const KIND_ID = {
  kotoba: "kata kosakata",
  bunpo: "pola tata bahasa",
  kanji: "kanji",
} as const;

const ALL_TITLE: Bilingual = { en: "All Mixed", id: "Semua Campur" };

export function registerQuizView(view: QuizViewLike): void {
  registeredViews.set(`${view.kind}:${view.allKey}`, view);
  const cfg = SCRIPTS[view.kind] as unknown as Loose;
  cfg.dataRomaji = cfg.dataRomaji ?? {};
  cfg.dataKana = cfg.dataKana ?? {};
  cfg.dataKanji = cfg.dataKanji ?? {};
  cfg.dataUsage = cfg.dataUsage ?? {};
  cfg.dataKalimat = cfg.dataKalimat ?? {};
  cfg.dataKalimatBlank = cfg.dataKalimatBlank ?? {};
  cfg.dataTranslation = cfg.dataTranslation ?? {};
  cfg.dataNote = cfg.dataNote ?? {};

  // kumpulkan semua sub chapter + isi "All Mixed" sambil jalan
  const all = {
    data: [] as Pair[],
    romaji: [] as Pair[],
    kalimat: [] as Pair[],
    blank: [] as Pair[],
    translation: [] as Pair[],
    note: [] as Pair[],
    kanjiForm: [] as Pair[],
    usage: [] as Pair[],
  };

  const put = (
    key: string,
    parts: {
      data: Pair[];
      romaji: Pair[];
      kalimat: Pair[];
      blank: Pair[];
      translation: Pair[];
      note: Pair[];
      kanjiForm: Pair[];
      usage: Pair[];
    },
  ) => {
    cfg.data[key] = parts.data;
    if (view.kind === "kotoba") {
      cfg.dataRomaji![key] = parts.romaji;
      cfg.dataKanji![key] = parts.kanjiForm;
      cfg.dataUsage![key] = parts.usage;
    } else if (view.kind === "kanji") {
      cfg.dataRomaji![key] = parts.romaji;
      cfg.dataKana![key] = parts.romaji;
    } else {
      cfg.dataKalimat![key] = parts.kalimat;
      cfg.dataKalimatBlank![key] = parts.blank;
      cfg.dataTranslation![key] = parts.translation;
      cfg.dataNote![key] = parts.note;
    }
  };

  const sampleOf = (first: Pair | undefined, more: Pair[]) =>
    [first, ...more.slice(0, 2)]
      .filter(Boolean)
      .map((p) => (p as Pair)[0])
      .join(" ");

  view.chapters.forEach((ch) =>
    ch.subGroups.forEach((sg) => {
      const parts = {
        data: [] as Pair[],
        romaji: [] as Pair[],
        kalimat: [] as Pair[],
        blank: [] as Pair[],
        translation: [] as Pair[],
        note: [] as Pair[],
        kanjiForm: [] as Pair[],
        usage: [] as Pair[],
      };

      if (view.kind === "kotoba") {
        (sg.items as KotobaEntry[]).forEach((e) => {
          const word = e[0];
          parts.data.push([word, en(e[2])]);
          parts.romaji.push([word, e[1]]);
          parts.kanjiForm.push([word, e[6] || ""]);
          parts.usage.push([word, en(e[8])]);
        });
      } else if (view.kind === "bunpo") {
        (sg.items as BunpoEntry[]).forEach((e) => {
          const pattern = e[0];
          parts.data.push([pattern, en(e[2])]);
          parts.kalimat.push([e[1], pattern]);
          parts.blank.push([e[4] ?? "", pattern]);
          parts.translation.push([pattern, en(e[5])]);
          parts.note.push([pattern, en(e[6])]);
        });
      } else {
        (sg.items as KanjiEntry[]).forEach((e) => {
          parts.data.push([e[0], en(e[2])]);
          parts.romaji.push([e[0], e[3] || e[1]]);
        });
      }

      put(sg.key, parts);
      cfg.levelText[sg.key] = {
        title: sg.title,
        sample: sampleOf(parts.data[0], parts.data.slice(1)),
        desc: sg.desc,
      };

      all.data.push(...parts.data);
      all.romaji.push(...parts.romaji);
      all.kalimat.push(...parts.kalimat);
      all.blank.push(...parts.blank);
      all.translation.push(...parts.translation);
      all.note.push(...parts.note);
      all.kanjiForm.push(...parts.kanjiForm);
      all.usage.push(...parts.usage);
    }),
  );

  put(view.allKey, all);
  cfg.levelText[view.allKey] = {
    title: ALL_TITLE,
    sample: sampleOf(all.data[0], all.data.slice(1)),
    desc: {
      en: `All ${view.total} ${view.level} ${KIND_EN[view.kind]} shuffled together.`,
      id: `Seluruh ${view.total} ${KIND_ID[view.kind]} ${view.level} diacak jadi satu.`,
    },
  };
}

onQuizLangChange(() => {
  registeredViews.forEach((view) => registerQuizView(view));
});

/** Mode kuis dari Supabase selalu berawalan "sb-" (data bawaan tidak pernah). */
export function isSupabaseQuizMode(mode: string | null | undefined): boolean {
  return !!mode && mode.startsWith("sb-");
}
