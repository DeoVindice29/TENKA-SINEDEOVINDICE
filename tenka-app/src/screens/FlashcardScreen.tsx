import { useEffect, useState } from "react";
import FlashcardDeckPicker from "@/components/Flashcard/FlashcardDeckPicker";
import FlashcardStudy from "@/components/Flashcard/FlashcardStudy";
import type { FlashDeckRef } from "@/data/flashDecks";
import { useUI } from "@/state/UIContext";

export default function FlashcardScreen() {
  const { pendingFlashDeck, setPendingFlashDeck } = useUI();
  const [picked, setPicked] = useState<{
    ref: FlashDeckRef;
    label: string;
  } | null>(
    pendingFlashDeck
      ? {
          ref: { kind: pendingFlashDeck.kind, tierKey: pendingFlashDeck.tierKey },
          label: pendingFlashDeck.label,
        }
      : null,
  );

  // sekali pakai: begitu dibuka, permintaan dari layar lain dibersihkan supaya
  // kembali ke deck picker tidak melempar balik ke deck yang sama.
  useEffect(() => {
    if (pendingFlashDeck) setPendingFlashDeck(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBack = () => setPicked(null);

  // buka/tutup deck = ganti "layar": selalu mulai dari atas
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [picked]);

  if (picked) {
    return (
      <section id="screen-flashcard">
        <FlashcardStudy
          deckRef={picked.ref}
          deckLabel={picked.label}
          onBack={handleBack}
        />
      </section>
    );
  }

  return (
    <section id="screen-flashdeck">
      <FlashcardDeckPicker
        onPickDeck={(ref, label) => setPicked({ ref, label })}
      />
    </section>
  );
}
