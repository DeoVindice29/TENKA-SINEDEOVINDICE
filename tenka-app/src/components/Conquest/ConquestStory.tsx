import { useLang } from "@/i18n/LangContext";
import { SCRIPTS } from "@/data/scripts";
import { useConquest } from "@/state/ConquestContext";

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

  const story = getStory(scriptKey);
  if (!story) return null;

  const phase = story.phases[phaseIndex];
  if (!phase) return null;

  const script = SCRIPTS[scriptKey as keyof typeof SCRIPTS];
  const isFinal = phaseIndex === story.phases.length - 1;

  const eyebrow =
    phaseIndex === 0
      ? t("conquestStory.eyebrowStart")
      : isFinal
        ? t("conquestStory.eyebrowFinal")
        : t("conquestStory.eyebrowNext");

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
      </div>

      <button
        className="primary danger"
        type="button"
        data-i18n="conquest.startThisChapter"
        onClick={onContinue}
      >
        {t("conquest.startThisChapter")}
      </button>
    </section>
  );
}
