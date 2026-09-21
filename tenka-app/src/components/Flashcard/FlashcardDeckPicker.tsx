import { useLang } from "@/i18n/LangContext";
import { useUI } from "@/state/UIContext";
import { useFlash } from "@/state/FlashContext";
import {
  buildDeckCardDescriptors,
  getBuiltinDeckDefs,
  type FlashDeckRef,
} from "@/data/flashDecks";
import FlashcardImport from "./FlashcardImport";
import ScrollTopButton from "@/components/ScrollTopButton";

type FlashcardDeckPickerProps = {
  onPickDeck: (ref: FlashDeckRef, label: string, forceAll: boolean) => void;
};

export default function FlashcardDeckPicker({
  onPickDeck,
}: FlashcardDeckPickerProps) {
  const { t } = useLang();
  const { setScreen } = useUI();
  const { dueSummary, getCustomDecks, deleteCustomDeck, reloadFlag, reload } =
    useFlash();

  void reloadFlag;

  const builtinDefs = getBuiltinDeckDefs();
  const customDecks = getCustomDecks();

  return (
    <>
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
        <div className="eyebrow">{t("flash.eyebrow")}</div>
        <h1 className="learn-title">{t("flash.title")}</h1>
        <p className="sub">{t("flash.sub")}</p>
      </header>

      <div className="flash-section-label">{t("flash.builtinHeading")}</div>
      <div className="flash-deck-grid">
        {builtinDefs.map((d, i) => {
          const descs = buildDeckCardDescriptors(d.ref);
          const stat = dueSummary(descs.map((x) => x.id));
          const allClear = stat.fresh + stat.learning + stat.due === 0;
          return (
            <button
              key={i}
              type="button"
              className="flash-deck-card"
              onClick={() => onPickDeck(d.ref, d.label, false)}
            >
              <span className="flash-deck-glyph">📇</span>
              <span className="flash-deck-info">
                <span className="flash-deck-name">{d.label}</span>
                {allClear ? (
                  <span className="flash-deck-caughtup">
                    {t("flash.caughtUp")}
                  </span>
                ) : (
                  <span className="flash-deck-stats">
                    <span className="fds-item">
                      <span className="fds-label">{t("flash.new")}</span>
                      <span className="fds-num fds-new">{stat.fresh}</span>
                    </span>
                    <span className="fds-item">
                      <span className="fds-label">{t("flash.learn")}</span>
                      <span className="fds-num fds-learn">{stat.learning}</span>
                    </span>
                    <span className="fds-item">
                      <span className="fds-label">{t("flash.due")}</span>
                      <span className="fds-num fds-due">{stat.due}</span>
                    </span>
                  </span>
                )}
              </span>
              <span className="flash-deck-arrow">→</span>
            </button>
          );
        })}
      </div>

      <div className="flash-section-label">{t("flash.myDecksHeading")}</div>
      <div className="flash-deck-grid">
        {customDecks.length === 0 ? (
          <p className="flash-empty-hint">{t("flash.noCustomDecks")}</p>
        ) : (
          customDecks.map((deck) => (
            <div key={deck.id} className="flash-deck-card flash-deck-custom">
              <button
                type="button"
                className="flash-deck-main"
                onClick={() =>
                  onPickDeck(
                    { kind: "custom", deckId: deck.id },
                    deck.name,
                    false,
                  )
                }
              >
                <span className="flash-deck-glyph">📦</span>
                <span className="flash-deck-info">
                  <span className="flash-deck-name">{deck.name}</span>
                  <span className="flash-deck-count">
                    {deck.cards.length} {t("flash.cards")}
                  </span>
                </span>
                <span className="flash-deck-arrow">→</span>
              </button>
              <button
                type="button"
                className="flash-deck-delete"
                aria-label={t("flash.deleteDeck")}
                onClick={() => {
                  if (confirm(t("flash.confirmDelete", { name: deck.name }))) {
                    deleteCustomDeck(deck.id);
                    reload();
                  }
                }}
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>

      <FlashcardImport onImported={reload} />

      <ScrollTopButton id="btn-flashdeck-scrolltop" />
    </>
  );
}
