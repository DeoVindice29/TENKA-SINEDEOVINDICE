import { useEffect, useMemo, useState } from "react";
import AdminSkipTools from "@/components/Admin/AdminSkipTools";
import { useLang } from "@/i18n/LangContext";
import { useUI } from "@/state/UIContext";
import { SCRIPTS } from "@/data/scripts";
import { appendStudyLog } from "@/state/flashStats";
import { computeRangeIndices } from "@/utils/range";

// Kana: 4 pasang per ronde. Kotoba & Kanji: 5 pasang (tile lebih lebar karena
// isinya kata + arti). Bunpō: 4 pasang (pola / kalimat bisa panjang).
const KANA_ROUND_SIZE = 4;
const WORD_ROUND_SIZE = 5;
const BUNPO_ROUND_SIZE = 4;

type PoolShape = Record<string, readonly (readonly string[])[]>;

type Pair = [string, string];

type TileState = {
  text: string;
  pairIndex: number;
  side: "kana" | "romaji";
  matched: boolean;
  /** Teks pasangan yang benar untuk tile kiri (dipakai buat cek jawaban). */
  answer: string;
};

function buildRounds(pairs: Pair[], size: number): Pair[][] {
  const shuffled = [...pairs];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  // Isi tiap ronde sambil menghindari dua tile kanan yang teksnya sama dalam
  // satu ronde (mis. dua pola dengan arti yang sama, atau じ/ぢ → "ji") supaya
  // papan tidak membingungkan. Kalau terpaksa (tidak ada ronde lain yang muat),
  // duplikat tetap boleh — pengecekan jawaban berbasis teks, jadi tetap adil.
  const count = Math.max(1, Math.ceil(shuffled.length / size));
  const rounds: Pair[][] = Array.from({ length: count }, () => []);
  shuffled.forEach((pair) => {
    const open = rounds.filter((r) => r.length < size);
    const clean = open.find((r) => !r.some((q) => q[1] === pair[1]));
    (clean ?? open[0]).push(pair);
  });
  if (rounds.length > 1 && rounds[rounds.length - 1].length === 1) {
    const last = rounds.pop()!;
    rounds[rounds.length - 1] = rounds[rounds.length - 1].concat(last);
  }
  return rounds;
}

function fmtTime(ms: number): string {
  const totalCs = Math.floor(ms / 10);
  const m = Math.floor(totalCs / 6000);
  const s = Math.floor((totalCs % 6000) / 100);
  const cs = totalCs % 100;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(
    cs,
  ).padStart(2, "0")}`;
}

export default function MatchScreen() {
  const { t } = useLang();
  const {
    setScreen,
    matchScript,
    matchMode,
    quizVariant,
    rangeMode,
    rangeFrom,
    rangeTo,
    randomCount,
  } = useUI();
  // Hiragana/Katakana = huruf ↔ romaji; Kotoba/Kanji/Bunpō = tile berisi teks
  // yang lebih panjang, jadi pakai tata letak "words".
  const isWords = matchScript !== "hiragana" && matchScript !== "katakana";
  const isBunpo = matchScript === "bunpo";
  const isSentence = isBunpo && quizVariant === "kalimat";
  const roundSize = isBunpo
    ? BUNPO_ROUND_SIZE
    : isWords
      ? WORD_ROUND_SIZE
      : KANA_ROUND_SIZE;

  const pairs: Pair[] = useMemo(() => {
    if (!matchMode) return [];
    const script = SCRIPTS[matchScript];
    const data = (
      script.data as unknown as Record<string, readonly (readonly string[])[]>
    )[matchMode];
    if (!data) return [];

    if (!isWords) {
      return data.map((item) => [String(item[0]), String(item[1])] as Pair);
    }

    // Kotoba / Kanji / Bunpō. Rentang soal (Pilih Rentang / Acak) dari layar
    // Start ikut dipakai; tipe soal menentukan isi kolom kanan:
    //  - Kotoba : kata ↔ arti, atau ↔ romaji (tipe "Romaji")
    //  - Kanji  : kanji ↔ arti, atau ↔ bacaan hiragana (tipe "Hiragana")
    //  - Bunpō  : pola ↔ fungsi, atau kalimat rumpang ↔ pola (tipe "Kalimat").
    //    "Campuran" (both) dipakai sebagai pola ↔ fungsi biar papan konsisten.
    const extra = script as unknown as {
      dataRomaji?: PoolShape;
      dataKalimatBlank?: PoolShape;
    };
    const altPool = isBunpo
      ? quizVariant === "kalimat"
        ? extra.dataKalimatBlank?.[matchMode]
        : undefined
      : quizVariant === "romaji"
        ? extra.dataRomaji?.[matchMode]
        : undefined;
    const picked = computeRangeIndices(data.length, {
      mode: rangeMode,
      from: rangeFrom,
      to: rangeTo,
      randomCount,
    });
    return picked
      .map((i) => {
        // pool alternatif: [kiri, kanan] sudah lengkap (Bunpō kalimat) atau
        // cuma kanan-nya yang diganti (bacaan) — kiri tetap kata/kanji.
        const left = isBunpo && altPool ? altPool[i]?.[0] : data[i][0];
        const right = altPool ? altPool[i]?.[1] : data[i][1];
        return [String(left ?? ""), String(right ?? "")] as Pair;
      })
      .filter((p) => p[0] !== "" && p[1] !== "");
  }, [
    matchScript,
    matchMode,
    isWords,
    isBunpo,
    quizVariant,
    rangeMode,
    rangeFrom,
    rangeTo,
    randomCount,
  ]);

  const [rounds, setRounds] = useState<Pair[][]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [kanaTiles, setKanaTiles] = useState<TileState[]>([]);
  const [romajiTiles, setRomajiTiles] = useState<TileState[]>([]);
  const [selectedKana, setSelectedKana] = useState<number | null>(null);
  const [selectedRomaji, setSelectedRomaji] = useState<number | null>(null);
  const [wrongKana, setWrongKana] = useState<number | null>(null);
  const [wrongRomaji, setWrongRomaji] = useState<number | null>(null);
  const [matchedCount, setMatchedCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (pairs.length === 0) return;
    setRounds(buildRounds(pairs, roundSize));
    setRoundIndex(0);
    setMistakes(0);
    setMatchedCount(0);
    setDone(false);
    setStartTime(Date.now());
  }, [pairs, roundSize]);

  useEffect(() => {
    if (rounds.length === 0) return;
    const round = rounds[roundIndex];
    if (!round) return;

    const kanaOrder = round.map((_, i) => i);
    const romajiOrder = round.map((_, i) => i);
    for (let i = kanaOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [kanaOrder[i], kanaOrder[j]] = [kanaOrder[j], kanaOrder[i]];
    }
    for (let i = romajiOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [romajiOrder[i], romajiOrder[j]] = [romajiOrder[j], romajiOrder[i]];
    }

    setKanaTiles(
      kanaOrder.map((pi) => ({
        text: round[pi][0],
        pairIndex: pi,
        side: "kana",
        matched: false,
        answer: round[pi][1],
      })),
    );
    setRomajiTiles(
      romajiOrder.map((pi) => ({
        text: round[pi][1],
        pairIndex: pi,
        side: "romaji",
        matched: false,
        answer: round[pi][1],
      })),
    );
    setSelectedKana(null);
    setSelectedRomaji(null);
    setWrongKana(null);
    setWrongRomaji(null);
  }, [rounds, roundIndex]);

  useEffect(() => {
    if (done) return;
    const interval = window.setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 100);
    return () => window.clearInterval(interval);
  }, [startTime, done]);

  const checkMatch = (kanaIdx: number, romajiIdx: number) => {
    const kana = kanaTiles[kanaIdx];
    const romaji = romajiTiles[romajiIdx];

    // Cek lewat teks jawaban (bukan index) — dua kata dengan arti yang sama
    // (atau kana kembar spt じ/ぢ) tetap dianggap benar kalau dipasangkan ke
    // tile arti mana pun yang cocok.
    if (kana.answer === romaji.text) {
      const newKana = [...kanaTiles];
      const newRomaji = [...romajiTiles];
      newKana[kanaIdx] = { ...kana, matched: true };
      newRomaji[romajiIdx] = { ...romaji, matched: true };
      setKanaTiles(newKana);
      setRomajiTiles(newRomaji);
      appendStudyLog("match", "match", "good");
      setMatchedCount((c) => c + 1);
      setSelectedKana(null);
      setSelectedRomaji(null);

      const total = newKana.filter((t) => t.matched).length;
      if (total === newKana.length) {
        window.setTimeout(() => {
          if (roundIndex + 1 >= rounds.length) {
            setDone(true);
          } else {
            setRoundIndex((r) => r + 1);
          }
        }, 500);
      }
    } else {
      appendStudyLog("match", "match", "again");
      setMistakes((m) => m + 1);
      setWrongKana(kanaIdx);
      setWrongRomaji(romajiIdx);
      window.setTimeout(() => {
        setSelectedKana(null);
        setSelectedRomaji(null);
        setWrongKana(null);
        setWrongRomaji(null);
      }, 450);
    }
  };

  const handleKanaClick = (idx: number) => {
    if (kanaTiles[idx].matched || wrongKana !== null) return;
    if (selectedKana === idx) {
      setSelectedKana(null);
      return;
    }
    setSelectedKana(idx);

    if (selectedRomaji !== null) {
      checkMatch(idx, selectedRomaji);
    }
  };

  const handleRomajiClick = (idx: number) => {
    if (romajiTiles[idx].matched || wrongRomaji !== null) return;
    if (selectedRomaji === idx) {
      setSelectedRomaji(null);
      return;
    }
    setSelectedRomaji(idx);

    if (selectedKana !== null) {
      checkMatch(selectedKana, idx);
    }
  };

  const totalPairs = pairs.length;

  if (pairs.length === 0) {
    return (
      <section id="screen-match">
        <div className="quiz-topbar">
          <button
            className="quiz-pill-btn quiz-back"
            type="button"
            data-i18n="common.back"
            onClick={() => setScreen("start")}
          >
            <span>{t("common.back")}</span>
          </button>
        </div>
        <div className="quiz-card">
          <p>No match started.</p>
        </div>
      </section>
    );
  }

  if (done) {
    return (
      <section id="screen-match">
        <div className="quiz-topbar">
          <button
            className="quiz-pill-btn quiz-back"
            type="button"
            data-i18n="common.back"
            onClick={() => setScreen("start")}
          >
            <span>{t("common.back")}</span>
          </button>
        </div>
        <div className="quiz-card">
          <div className="match-done">
            <p className="match-done-title">{t("matchMode.doneTitle")}</p>
            <p className="match-done-sub">
              {t("matchMode.doneSub", {
                pairs: totalPairs,
                mistakes: String(mistakes),
                time: fmtTime(elapsed),
              })}
            </p>
            <button
              className="primary"
              type="button"
              onClick={() => {
                setRounds(buildRounds(pairs, roundSize));
                setRoundIndex(0);
                setMistakes(0);
                setMatchedCount(0);
                setDone(false);
                setStartTime(Date.now());
              }}
            >
              {t("matchMode.playAgain")}
            </button>
            <button
              className="ghost"
              type="button"
              data-i18n="common.back"
              onClick={() => setScreen("start")}
            >
              {t("common.back")}
            </button>
          </div>
        </div>
      </section>
    );
  }

  const roundPct =
    rounds.length > 0 ? ((roundIndex + 1) / rounds.length) * 100 : 0;

  return (
    <section id="screen-match">
      <AdminSkipTools
        skipAllLabel="Skip → selesai"
        onSkipAll={() => setDone(true)}
      />
      <div className="quiz-topbar">
        <button
          className="quiz-pill-btn quiz-back"
          type="button"
          data-i18n="common.back"
          onClick={() => setScreen("start")}
        >
          <span>{t("common.back")}</span>
        </button>

        <div className="quiz-progress-center">
          <div className="quiz-progress-text">
            {t("matchMode.roundProgress", {
              current: roundIndex + 1,
              total: rounds.length,
            })}
          </div>
          <div className="quiz-progress-bar" aria-hidden="true">
            <div
              className="quiz-progress-fill"
              style={{ width: `${roundPct}%` }}
            />
          </div>
        </div>

        <button
          className="quiz-pill-btn quiz-restart"
          type="button"
          data-i18n="matchMode.restart"
          onClick={() => {
            setRounds(buildRounds(pairs, roundSize));
            setRoundIndex(0);
            setMistakes(0);
            setMatchedCount(0);
            setStartTime(Date.now());
          }}
        >
          <span>{t("matchMode.restart")}</span>
        </button>
      </div>

      <div className="quiz-card">
        <p className="match-mode-instruction">
          {t(
            isSentence
              ? "matchMode.instructionBunpoKalimat"
              : isBunpo
                ? "matchMode.instructionBunpo"
                : matchScript === "kanji"
                  ? "matchMode.instructionKanji"
                  : isWords
                    ? "matchMode.instructionKotoba"
                    : "matchMode.instruction",
          )}
        </p>

        <div
          className={`match-board${isWords ? " words" : ""}${
            isSentence ? " sentences" : ""
          }`}
        >
        <div className="match-col">
          {kanaTiles.map((tile, idx) => {
            const classes = ["match-tile"];
            if (tile.matched) classes.push("matched");
            if (selectedKana === idx && !tile.matched) classes.push("selected");
            if (wrongKana === idx) classes.push("wrong");
            return (
              <button
                key={idx}
                type="button"
                className={classes.join(" ")}
                disabled={tile.matched}
                onClick={() => handleKanaClick(idx)}
              >
                {tile.text}
              </button>
            );
          })}
        </div>
        <div className="match-col">
          {romajiTiles.map((tile, idx) => {
            const classes = ["match-tile"];
            if (tile.matched) classes.push("matched");
            if (selectedRomaji === idx && !tile.matched)
              classes.push("selected");
            if (wrongRomaji === idx) classes.push("wrong");
            return (
              <button
                key={idx}
                type="button"
                className={classes.join(" ")}
                disabled={tile.matched}
                onClick={() => handleRomajiClick(idx)}
              >
                {tile.text}
              </button>
            );
          })}
        </div>
      </div>

      <div className="match-bottom-row">
        <p className="match-progress-count">
          {matchedCount} / {totalPairs}
        </p>
        <div className="match-mistakes">
          <span className="match-mistakes-icon" /> {mistakes}
        </div>
      </div>
      </div>
    </section>
  );
}
