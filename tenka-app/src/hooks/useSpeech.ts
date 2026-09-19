import { useCallback, useEffect, useRef } from "react";

export function useSpeech() {
  const jaVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const requestIdRef = useRef(0);
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!supported) return;
    const pick = () => {
      const voices = speechSynthesis.getVoices();
      jaVoiceRef.current =
        voices.find((v) => v.lang === "ja-JP") ||
        voices.find((v) => v.lang?.startsWith("ja")) ||
        null;
    };
    pick();
    speechSynthesis.addEventListener("voiceschanged", pick);
    return () => speechSynthesis.removeEventListener("voiceschanged", pick);
  }, [supported]);

  useEffect(() => {
    if (!supported) return;
    let unlocked = false;
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      try {
        speechSynthesis.resume();
        const primer = new SpeechSynthesisUtterance("");
        primer.volume = 0;
        speechSynthesis.speak(primer);
      } catch {
        // ignore
      }
    };
    document.addEventListener("pointerdown", unlock, {
      once: true,
      capture: true,
    });
    return () =>
      document.removeEventListener("pointerdown", unlock, { capture: true });
  }, [supported]);

  useEffect(() => {
    if (!supported) return;
    const interval = setInterval(() => {
      if (speechSynthesis.speaking) {
        speechSynthesis.pause();
        speechSynthesis.resume();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [supported]);

  const speak = useCallback(
    (text: string, btnEl?: HTMLElement | null) => {
      if (!supported || !text) return;
      const requestId = ++requestIdRef.current;

      document
        .querySelectorAll(".speaking")
        .forEach((b) => b.classList.remove("speaking"));
      if (btnEl) btnEl.classList.add("speaking");

      speechSynthesis.cancel();
      speechSynthesis.resume();

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "ja-JP";
      if (jaVoiceRef.current) utter.voice = jaVoiceRef.current;
      utter.rate = 0.85;

      const cleanup = () => {
        if (requestId === requestIdRef.current && btnEl) {
          btnEl.classList.remove("speaking");
        }
      };
      utter.onend = cleanup;
      utter.onerror = cleanup;
      speechSynthesis.speak(utter);
    },
    [supported],
  );

  return { speak, supported };
}
