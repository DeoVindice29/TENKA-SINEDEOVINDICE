import { useLang } from "@/i18n/LangContext";
import { useFlash } from "@/state/FlashContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useLevelUnlock } from "@/hooks/useLevelUnlock";
import { useOrganizeSources } from "@/hooks/useOrganizeSources";
import {
  buildDeckCardDescriptors,
  getBuiltinDeckDefs,
  type FlashDeckRef,
} from "@/data/flashDecks";
import ContentSourceSwitch, {
  resolveOrganize,
  type OrganizeBy,
} from "@/components/ContentSourceSwitch";
import { LoadingState } from "@/components/ui/Loader";
import { sourceName } from "@/lib/organizeSources";
import type { KotobaLevel } from "@/lib/kotobaSupabase";
import FlashcardImport from "./FlashcardImport";
import DbDeckCardView, { DeckCardButton } from "./FlashcardAdminDecks";
import ScrollTopButton from "@/components/ScrollTopButton";
import PageHero from "@/components/PageHero";

type PickDeck = (ref: FlashDeckRef, label: string, forceAll: boolean) => void;

type FlashcardDeckPickerProps = {
  onPickDeck: PickDeck;
};

type Kind = "kotoba" | "kanji";
type Tab = Kind | "mine";

/**
 * Daftar deck satu jenis (Kotoba / Kanji): pilih Level + "Organize by" persis
 * seperti di Lessons & Home. Topik (N5) = deck bawaan app; Organize by lain =
 * konten yang ditambahkan admin.
 */
function KindDecks({ kind, onPickDeck }: { kind: Kind; onPickDeck: PickDeck }) {
  const { t, lang } = useLang();
  const { dueSummary, reloadFlag } = useFlash();
  void reloadFlag;

  const [storedLevel, setLevel] = useLocalStorage<KotobaLevel>(
    `tenka:lvl:flash:${kind}`,
    "N5",
  );
  const [storedOrg, setOrg] = useLocalStorage<OrganizeBy>(
    `tenka:org:flash:${kind}`,
    "topic",
  );

  // level yang masih terkunci jatuh ke level terbuka sebelumnya (hanya saat
  // render — pilihan tersimpan tidak ditimpa)
  const { resolveLevel } = useLevelUnlock();
  const level = resolveLevel(storedLevel);

  const { sources, ready } = useOrganizeSources(kind);
  const organize = resolveOrganize(level, storedOrg, sources, ready);
  const source =
    organize.sourceId !== null
      ? sources.find((s) => s.id === organize.sourceId)
      : undefined;

  const kindLabel = t(kind === "kotoba" ? "flash.tabKotoba" : "flash.tabKanji");

  let list;
  if (organize.pending) {
    list = <LoadingState label={t("flash.adminLoading")} compact />;
  } else if (organize.value === "topic") {
    const defs = getBuiltinDeckDefs().filter((d) => d.ref.kind === kind);
    list = (
      <div className="flash-deck-grid">
        {defs.map((d, i) => {
          const descs = buildDeckCardDescriptors(d.ref);
          return (
            <DeckCardButton
              key={i}
              title={d.label}
              stat={dueSummary(descs.map((x) => x.id))}
              onClick={() => onPickDeck(d.ref, d.label, false)}
            />
          );
        })}
      </div>
    );
  } else if (source) {
    const name = sourceName(source, lang);
    list = (
      <div className="flash-deck-grid">
        <DbDeckCardView
          deckRef={{
            kind: "db",
            content: kind,
            level,
            sourceId: source.id,
          }}
          title={name}
          label={`${name} — ${kindLabel} ${level}`}
          onPick={onPickDeck}
        />
      </div>
    );
  } else {
    list = <p className="flash-empty-hint">{t("flash.noSourceDecks")}</p>;
  }

  return (
    <>
      <ContentSourceSwitch
        level={level}
        organize={organize}
        sources={sources}
        onLevelChange={setLevel}
        onOrganizeChange={setOrg}
      />
      <div className="flash-picker-list">{list}</div>
    </>
  );
}

export default function FlashcardDeckPicker({
  onPickDeck,
}: FlashcardDeckPickerProps) {
  const { t } = useLang();
  const { getCustomDecks, deleteCustomDeck, reloadFlag, reload } = useFlash();
  const [tab, setTab] = useLocalStorage<Tab>("tenka:flash:tab", "kotoba");

  void reloadFlag;

  const customDecks = getCustomDecks();
  const activeTab: Tab = tab === "kanji" || tab === "mine" ? tab : "kotoba";

  const tabs: { key: Tab; label: string }[] = [
    { key: "kotoba", label: t("flash.tabKotoba") },
    { key: "kanji", label: t("flash.tabKanji") },
    {
      key: "mine",
      label:
        customDecks.length > 0
          ? `${t("flash.tabImported")} (${customDecks.length})`
          : t("flash.tabImported"),
    },
  ];

  return (
    <>
      <PageHero
        variant="flash"
        eyebrow={t("flash.eyebrow")}
        title={t("flash.title")}
        sub={t("flash.sub")}
      />

      <div className="flash-kind-tabs">
        <div className="source-switch-seg" role="tablist">
          {tabs.map((x) => (
            <button
              key={x.key}
              type="button"
              role="tab"
              aria-selected={activeTab === x.key}
              className={`source-pill ${activeTab === x.key ? "active" : ""}`}
              onClick={() => setTab(x.key)}
            >
              {x.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab !== "mine" && (
        <KindDecks key={activeTab} kind={activeTab} onPickDeck={onPickDeck} />
      )}

      {activeTab === "mine" && (
        <div className="flash-picker-list">
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
                      <span className="flash-deck-meta">
                        <span className="flash-deck-count">
                          {deck.cards.length} {t("flash.cards")}
                        </span>
                        {!deck.media &&
                          deck.cards.some((cd) =>
                            (cd.front + cd.back).includes("🖼️"),
                          ) && (
                            <span className="flash-deck-badge flash-deck-stale">
                              ⚠️ {t("flash.reimportNeeded")}
                            </span>
                          )}
                        {deck.media && deck.media.audio > 0 && (
                          <span
                            className="flash-deck-badge"
                            title={t("flash.chipAudio", {
                              count: deck.media.audio,
                            })}
                          >
                            🔊 {deck.media.audio}
                          </span>
                        )}
                        {deck.media && deck.media.images > 0 && (
                          <span
                            className="flash-deck-badge"
                            title={t("flash.chipImages", {
                              count: deck.media.images,
                            })}
                          >
                            🖼️ {deck.media.images}
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="flash-deck-arrow">→</span>
                  </button>
                  <button
                    type="button"
                    className="flash-deck-delete"
                    aria-label={t("flash.deleteDeck")}
                    onClick={() => {
                      if (
                        confirm(t("flash.confirmDelete", { name: deck.name }))
                      ) {
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

          <FlashcardImport
            onImported={reload}
            onStudy={(deckId, name) =>
              onPickDeck({ kind: "custom", deckId }, name, false)
            }
          />
        </div>
      )}

      <ScrollTopButton id="btn-flashdeck-scrolltop" />
    </>
  );
}
