import { useCallback, useEffect, useRef, useState } from "react";

const isAndroid =
  typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
const isMobile =
  typeof navigator !== "undefined" &&
  /android|iphone|ipad|ipod/i.test(navigator.userAgent);

// Android Chrome kadang mengembalikan kode bahasa "ja_JP" (underscore) dan
// daftar voice-nya baru terisi belakangan — normalkan sebelum dibandingkan.
const normLang = (l?: string) => (l || "").replace("_", "-").toLowerCase();

export function useSpeech() {
  const jaVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const requestIdRef = useRef(0);
  // Chrome (terutama mobile) bisa membuang utterance yang tidak direferensikan
  // sebelum selesai bicara → onend tidak pernah terpanggil & suara putus.
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speakTimerRef = useRef<number | null>(null);
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;
  // "checking" = masih menunggu daftar voice; "missing" = sampai batas waktu
  // tetap tidak ada voice Jepang (HP perlu instal data suara).
  const [voiceStatus, setVoiceStatus] = useState<
    "checking" | "ok" | "missing"
  >("checking");

  useEffect(() => {
    if (!supported) return;
    const pick = () => {
      const voices = speechSynthesis.getVoices();
      jaVoiceRef.current =
        voices.find((v) => normLang(v.lang) === "ja-jp") ||
        voices.find((v) => normLang(v.lang).startsWith("ja")) ||
        null;
      if (jaVoiceRef.current) setVoiceStatus("ok");
    };
    pick();
    speechSynthesis.addEventListener("voiceschanged", pick);
    // beberapa HP mengisi daftar voice tanpa event "voiceschanged"
    const retry = window.setInterval(() => {
      if (jaVoiceRef.current) return window.clearInterval(retry);
      pick();
    }, 500);
    const stop = window.setTimeout(() => {
      window.clearInterval(retry);
      if (!jaVoiceRef.current) setVoiceStatus("missing");
    }, 6000);
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", pick);
      window.clearInterval(retry);
      window.clearTimeout(stop);
    };
  }, [supported]);

  // Mobile memblokir suara sebelum ada sentuhan pengguna. Buka "kunci"-nya
  // pada gestur pertama (pointer / touch / klik) dengan utterance senyap.
  useEffect(() => {
    if (!supported) return;
    let unlocked = false;
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      try {
        speechSynthesis.resume();
        const primer = new SpeechSynthesisUtterance(" ");
        primer.volume = 0;
        primer.lang = "ja-JP";
        speechSynthesis.speak(primer);
      } catch {
        // ignore
      }
      events.forEach((e) => document.removeEventListener(e, unlock, true));
    };
    const events = ["pointerdown", "touchstart", "touchend", "click"];
    events.forEach((e) =>
      document.addEventListener(e, unlock, { capture: true, passive: true }),
    );
    return () =>
      events.forEach((e) => document.removeEventListener(e, unlock, true));
  }, [supported]);

  // Workaround bug Chrome desktop (suara berhenti setelah ~15 detik). JANGAN
  // dijalankan di mobile: pause()/resume() di Android justru mematikan suara.
  useEffect(() => {
    if (!supported || isMobile) return;
    const interval = setInterval(() => {
      if (speechSynthesis.speaking) {
        speechSynthesis.pause();
        speechSynthesis.resume();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [supported]);

  useEffect(
    () => () => {
      if (speakTimerRef.current) window.clearTimeout(speakTimerRef.current);
    },
    [],
  );

  const speak = useCallback(
    (text: string, btnEl?: HTMLElement | null, onEnd?: () => void) => {
      if (!supported || !text) return;
      const requestId = ++requestIdRef.current;

      document
        .querySelectorAll(".speaking")
        .forEach((b) => b.classList.remove("speaking"));
      if (btnEl) btnEl.classList.add("speaking");

      if (speakTimerRef.current) window.clearTimeout(speakTimerRef.current);

      const synth = speechSynthesis;
      const busy = synth.speaking || synth.pending;
      if (busy) synth.cancel();

      const run = () => {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = "ja-JP";
        if (jaVoiceRef.current) {
          utter.voice = jaVoiceRef.current;
          utter.lang = jaVoiceRef.current.lang;
        }
        utter.rate = isAndroid ? 0.9 : 0.85;
        utter.volume = 1;

        const cleanup = () => {
          if (requestId === requestIdRef.current && btnEl) {
            btnEl.classList.remove("speaking");
          }
          if (utterRef.current === utter) utterRef.current = null;
        };
        utter.onend = () => {
          cleanup();
          if (requestId === requestIdRef.current) onEnd?.();
        };
        utter.onerror = () => {
          cleanup();
          // error sungguhan (bukan karena dibatalkan oleh speak() berikutnya)
          // tetap dianggap selesai supaya antrean tidak macet
          if (requestId === requestIdRef.current) onEnd?.();
        };

        utterRef.current = utter;
        try {
          synth.resume();
        } catch {
          // ignore
        }
        synth.speak(utter);
      };

      // cancel() yang langsung disusul speak() sering membuat utterance
      // berikutnya ikut terbuang di Android/iOS — beri jeda singkat.
      if (busy) speakTimerRef.current = window.setTimeout(run, 80);
      else run();
    },
    [supported],
  );

  return { speak, supported, voiceStatus };
}
