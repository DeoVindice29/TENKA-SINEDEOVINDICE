import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { useUI } from "@/state/UIContext";
import { SCRIPTS } from "@/data/scripts";

const ROUND_SIZE = 4;

type Pair = [string, string];

type TileState = {
  text: string;
  pairIndex: number;
  side: "kana" | "romaji";
  matched: boolean;
};

function buildRounds(pairs: Pair[]): Pair[][] {
  const shuffled = [...pairs];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const rounds: Pair[][] = [];
  for (let i = 0; i < shuffled.length; i += ROUND_SIZE) {
    rounds.push(shuffled.slice(i, i + ROUND_SIZE));
  }
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
  const { setScreen, matchScript, matchMode } = useUI();

  const pairs: Pair[] = useMemo(() => {
    if (!matchMode) return [];
    const script = SCRIPTS[matchScript];
    const data = (
      script.data as unknown as Record<string, readonly (readonly string[])[]>
    )[matchMode];
    if (!data) return [];
    return data.map((item) => [String(item[0]), String(item[1])] as Pair);
  }, [matchScript, matchMode]);

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
    setRounds(buildRounds(pairs));
    setRoundIndex(0);
    setMistakes(0);
    setMatchedCount(0);
    setDone(false);
    setStartTime(Date.now());
  }, [pairs]);

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
      })),
    );
    setRomajiTiles(
      romajiOrder.map((pi) => ({
        text: round[pi][1],
        pairIndex: pi,
        side: "romaji",
        matched: false,
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

    if (kana.pairIndex === romaji.pairIndex) {
      const newKana = [...kanaTiles];
      const newRomaji = [...romajiTiles];
      newKana[kanaIdx] = { ...kana, matched: true };
      newRomaji[romajiIdx] = { ...romaji, matched: true };
      setKanaTiles(newKana);
      setRomajiTiles(newRomaji);
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
        <p>No match started.</p>
      </section>
    );
  }

  if (done) {
    return (
      <section id="screen-match">
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
              setRounds(buildRounds(pairs));
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
      </section>
    );
  }

  return (
    <section id="screen-match">
      <div className="quiz-back-row">
        <button
          className="quiz-back"
          type="button"
          data-i18n="common.back"
          onClick={() => setScreen("start")}
        >
          {t("common.back")}
        </button>
        <button
          className="quiz-back"
          type="button"
          data-i18n="matchMode.restart"
          onClick={() => {
            setRounds(buildRounds(pairs));
            setRoundIndex(0);
            setMistakes(0);
            setMatchedCount(0);
            setStartTime(Date.now());
          }}
        >
          {t("matchMode.restart")}
        </button>
      </div>

      <div className="quiz-top">
        <div className="quiz-progress-text">
          {t("matchMode.roundProgress", {
            current: roundIndex + 1,
            total: rounds.length,
          })}
        </div>
        <div className="match-mistakes">
          <span className="match-mistakes-icon" /> {mistakes}
        </div>
      </div>

      <p className="match-mode-instruction">{t("matchMode.instruction")}</p>

      <div className="match-board">
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

      {matchedCount > 0 && (
        <p
          style={{
            textAlign: "center",
            color: "var(--ink-soft)",
            fontSize: 12,
          }}
        >
          {matchedCount} / {totalPairs}
        </p>
      )}
    </section>
  );
}
