import { useLang } from "@/i18n/LangContext";
import { SCRIPTS } from "@/data/scripts";
import { useConquest } from "@/state/ConquestContext";
import { useQuiz } from "@/state/QuizContext";
import {
  isJlptScript,
  jlptPassMark,
  JLPT_PASS_PERCENT,
} from "@/data/jlptConquest";

type ConquestStoryProps = {
  scriptKey: string;
  phaseIndex: number;
  onBack: () => void;
  onContinue: () => void;
};

export default function ConquestStory({
  scriptKey,
  phaseIndex,
  onBack,
  onContinue,
}: ConquestStoryProps) {
  const { t } = useLang();
  const { getStory } = useConquest();
  const { state } = useQuiz();

  const story = getStory(scriptKey);
  if (!story) return null;

  const phase = story.phases[phaseIndex];
  if (!phase) return null;

  const script = SCRIPTS[scriptKey as keyof typeof SCRIPTS];
  const isFinal = phaseIndex === story.phases.length - 1;

  const boundaries = state.conquestPhaseBoundaries;
  const phaseLen = boundaries
    ? boundaries[phaseIndex + 1] - boundaries[phaseIndex]
    : 0;

  // Kotoba / Bunpō / Kanji: Penaklukan ala ujian JLPT (per Tier, pilihan ganda)
  const isJlpt = isJlptScript(scriptKey);

  const eyebrow =
    phaseIndex === 0
      ? t(isJlpt ? "conquestStory.jlptEyebrowStart" : "conquestStory.eyebrowStart")
      : isFinal
        ? t(isJlpt ? "conquestStory.jlptEyebrowFinal" : "conquestStory.eyebrowFinal")
        : t(isJlpt ? "conquestStory.jlptEyebrowNext" : "conquestStory.eyebrowNext");

  return (
    <section id="screen-conquest-story" className="conquest-story">
      <div className="quiz-back-row">
        <button
          className="quiz-back"
          type="button"
          data-i18n="conquest.cancelConquest"
          onClick={onBack}
        >
          {t("conquest.cancelConquest")}
        </button>
      </div>

      <div className="conquest-story-card">
        <div className="eyebrow">{eyebrow}</div>
        <h2 className="conquest-story-title">
          {t("conquestStory.titleWithScript", {
            label: phase.label,
            script: script.label,
          })}
        </h2>
        <p className="conquest-story-text">{phase.text}</p>
        <p className="conquest-story-meta">
          {isJlpt
            ? t("conquestStory.jlptMeta", {
                count: phaseLen,
                percent: JLPT_PASS_PERCENT,
                need: jlptPassMark(phaseLen),
              })
            : t("conquestStory.meta", {
                count: phaseLen,
                diff: t("conquestStory.diffLabel"),
              })}
        </p>
      </div>

      <button
        className="primary danger"
        type="button"
        data-i18n="conquest.startThisChapter"
        onClick={onContinue}
      >
        {isJlpt
          ? t("conquestStory.startThisTier")
          : t("conquest.startThisChapter")}
      </button>
    </section>
  );
}
