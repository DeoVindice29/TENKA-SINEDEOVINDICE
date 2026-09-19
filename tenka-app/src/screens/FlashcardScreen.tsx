import { useState } from "react";
import FlashcardDeckPicker from "@/components/Flashcard/FlashcardDeckPicker";
import FlashcardStudy from "@/components/Flashcard/FlashcardStudy";
import type { FlashDeckRef } from "@/data/flashDecks";

export default function FlashcardScreen() {
  const [picked, setPicked] = useState<{
    ref: FlashDeckRef;
    label: string;
  } | null>(null);

  const handleBack = () => setPicked(null);

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
