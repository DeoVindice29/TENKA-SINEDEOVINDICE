// Naskah "peri pemandu" buat intro pertama kali masuk web — dipakai
// IntroGuide (src/components/Intro/IntroGuide.tsx). Tiap langkah punya
// ekspresi chibi sendiri (harus cocok nama file di src/assets/chibi/,
// lihat src/lib/chibiAvatar.ts) supaya mukanya ikut berubah sesuai isi
// omongannya, bukan cuma teksnya doang yang ganti.
export type IntroStep = {
  expression: string;
  messageKey: string;
};

export const INTRO_STEPS: IntroStep[] = [
  { expression: "spirit", messageKey: "guide.intro.0" },
  { expression: "pointing", messageKey: "guide.intro.1" },
  { expression: "nerd", messageKey: "guide.intro.2" },
  { expression: "ready", messageKey: "guide.intro.3" },
  { expression: "love", messageKey: "guide.intro.4" },
  { expression: "proud", messageKey: "guide.intro.5" },
  { expression: "celebrate", messageKey: "guide.intro.6" },
];

export const INTRO_SEEN_KEY = "tenka:introSeen";
