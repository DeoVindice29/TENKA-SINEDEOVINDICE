import { useEffect, useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { useFlash } from "@/state/FlashContext";
import {
  dbDeckKey,
  getCachedDbDeckCards,
  loadDbDeckCards,
  type DbDeckCard,
  type DbDeckRef,
} from "@/lib/flashDbDecks";
import type { FlashDeckRef } from "@/data/flashDecks";

type Stat = { fresh: number; learning: number; due: number };

/** Satu kartu deck di daftar (dipakai deck bawaan & deck dari Category). */
export function DeckCardButton({
  title,
  stat,
  note,
  disabled,
  onClick,
}: {
  title: string;
  /** null = angka belum siap; tampilkan `note` */
  stat: Stat | null;
  note?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  const { t } = useLang();
  const allClear = !!stat && stat.fresh + stat.learning + stat.due === 0;
  return (
    <button
      type="button"
      className="flash-deck-card"
      disabled={disabled}
      onClick={onClick}
    >
      <span className="flash-deck-glyph">📇</span>
      <span className="flash-deck-info">
        <span className="flash-deck-name">{title}</span>
        {!stat ? (
          <span className="flash-deck-count">{note ?? "…"}</span>
        ) : allClear ? (
          <span className="flash-deck-caughtup">{t("flash.caughtUp")}</span>
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
}

/**
 * Deck dari satu "Category" (konten yang ditambahkan admin). Isinya dimuat
 * dari Supabase (cache bareng layar Lessons) supaya angka Baru/Belajar/Ulang
 * bisa tampil.
 */
export default function DbDeckCardView({
  deckRef,
  title,
  label,
  onPick,
}: {
  deckRef: DbDeckRef;
  /** nama di kartu = nama Category */
  title: string;
  /** judul di layar belajar */
  label: string;
  onPick: (ref: FlashDeckRef, label: string, forceAll: boolean) => void;
}) {
  const { t } = useLang();
  const { dueSummary, reloadFlag } = useFlash();
  void reloadFlag;

  const key = dbDeckKey(deckRef);
  const [cards, setCards] = useState<DbDeckCard[] | null>(() =>
    getCachedDbDeckCards(deckRef),
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    const cached = getCachedDbDeckCards(deckRef);
    if (cached) {
      setCards(cached);
      return;
    }
    setCards(null);
    loadDbDeckCards(deckRef).then((res) => {
      if (cancelled) return;
      if (res.error !== null) setFailed(true);
      else setCards(res.cards);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const empty = !!cards && cards.length === 0;
  const stat = cards && !empty ? dueSummary(cards.map((c) => c.id)) : null;

  return (
    <DeckCardButton
      title={title}
      stat={stat}
      note={
        failed
          ? t("flash.adminLoadError")
          : empty
            ? t("flash.emptyDeck")
            : "…"
      }
      disabled={empty}
      onClick={() => onPick(deckRef, label, false)}
    />
  );
}
