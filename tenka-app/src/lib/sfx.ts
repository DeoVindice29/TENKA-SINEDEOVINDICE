// Efek suara aplikasi (benar, salah, timer, menang, dst.).
//
// Semua suara DISINTESIS langsung lewat Web Audio API — tidak ada file audio
// yang perlu diunduh, jadi ringan dan langsung bunyi, baik di web maupun di
// HP. Pengaturan (nyala/mati + volume) disimpan di localStorage dan
// disinkronkan antar komponen lewat custom event.

export type SfxName =
  | "click"
  | "correct"
  | "wrong"
  | "timeout"
  | "tick"
  | "streak"
  | "flip"
  | "rateAgain"
  | "rateHard"
  | "rateGood"
  | "rateEasy"
  | "matchOk"
  | "matchBad"
  | "roundClear"
  | "win"
  | "lose"
  | "record"
  | "countdown"
  | "go";

export type SfxSettings = { enabled: boolean; volume: number };

const KEY = "tenka:sfx";
export const SFX_EVENT = "tenka:sfx-change";
const DEFAULTS: SfxSettings = { enabled: true, volume: 0.6 };

let settings: SfxSettings = readSettings();

function readSettings(): SfxSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const p = JSON.parse(raw) as Partial<SfxSettings>;
    return {
      enabled: typeof p.enabled === "boolean" ? p.enabled : DEFAULTS.enabled,
      volume:
        typeof p.volume === "number" && isFinite(p.volume)
          ? Math.min(1, Math.max(0, p.volume))
          : DEFAULTS.volume,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function getSfxSettings(): SfxSettings {
  return settings;
}

export function setSfxSettings(patch: Partial<SfxSettings>) {
  settings = {
    enabled: patch.enabled ?? settings.enabled,
    volume: Math.min(1, Math.max(0, patch.volume ?? settings.volume)),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // storage diblokir — pengaturan tetap berlaku selama sesi
  }
  if (master) master.gain.value = masterGain();
  window.dispatchEvent(new Event(SFX_EVENT));
}

/* ------------------------------------------------------------------ */
/* Mesin suara                                                         */
/* ------------------------------------------------------------------ */

type AudioCtor = typeof AudioContext;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;

// kurva volume agar slider terasa lebih natural (bukan linear)
const masterGain = () => Math.pow(settings.volume, 1.6) * 0.9;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor: AudioCtor | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioCtor })
        .webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = masterGain();
      // limiter ringan supaya akord tidak "pecah"
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 6;
      master.connect(comp);
      comp.connect(ctx.destination);
    } catch {
      ctx = null;
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  return ctx;
}

// Browser (terutama mobile) hanya mengizinkan suara setelah sentuhan pertama.
if (typeof window !== "undefined") {
  const unlock = () => {
    getCtx();
    if (ctx && ctx.state === "running") {
      ["pointerdown", "touchend", "keydown", "click"].forEach((e) =>
        window.removeEventListener(e, unlock, true),
      );
    }
  };
  ["pointerdown", "touchend", "keydown", "click"].forEach((e) =>
    window.addEventListener(e, unlock, { capture: true, passive: true }),
  );
}

type ToneOpts = {
  type?: OscillatorType;
  gain?: number;
  /** frekuensi akhir (glide) */
  to?: number;
  attack?: number;
  /** low-pass cutoff supaya suara lebih lembut */
  lp?: number;
};

function tone(
  c: AudioContext,
  freq: number,
  start: number,
  dur: number,
  o: ToneOpts = {},
) {
  if (!master) return;
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(freq, t0);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
  const peak = o.gain ?? 0.3;
  const atk = o.attack ?? 0.008;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + atk);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let node: AudioNode = osc;
  if (o.lp) {
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = o.lp;
    osc.connect(f);
    node = f;
  }
  node.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(
  c: AudioContext,
  start: number,
  dur: number,
  gain: number,
  from: number,
  to: number,
) {
  if (!master) return;
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t0 = c.currentTime + start;
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = 0.9;
  f.frequency.setValueAtTime(from, t0);
  f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

// nada (Hz)
const N = {
  G3: 196, C4: 262, Eb4: 311, G4: 392, A4: 440, B4: 494,
  C5: 523, D5: 587, E5: 659, G5: 784, A5: 880, C6: 1047, E6: 1319,
};

const PLAYERS: Record<SfxName, (c: AudioContext) => void> = {
  click: (c) => tone(c, 620, 0, 0.05, { type: "triangle", gain: 0.12 }),

  correct: (c) => {
    tone(c, N.E5, 0, 0.16, { type: "triangle", gain: 0.3 });
    tone(c, N.A5, 0.08, 0.28, { type: "triangle", gain: 0.3 });
    tone(c, N.E6, 0.08, 0.28, { type: "sine", gain: 0.07 });
  },

  wrong: (c) => {
    tone(c, 220, 0, 0.2, { type: "sawtooth", gain: 0.2, to: 150, lp: 900 });
    tone(c, 165, 0.14, 0.3, { type: "sawtooth", gain: 0.2, to: 110, lp: 800 });
  },

  timeout: (c) => {
    tone(c, N.A4, 0, 0.16, { type: "square", gain: 0.12, lp: 1400 });
    tone(c, 349, 0.17, 0.16, { type: "square", gain: 0.12, lp: 1400 });
    tone(c, 262, 0.34, 0.34, { type: "square", gain: 0.12, lp: 1400 });
  },

  tick: (c) => tone(c, 1500, 0, 0.045, { type: "square", gain: 0.1, lp: 3000 }),

  streak: (c) => {
    [N.C5, N.E5, N.G5, N.C6].forEach((f, i) =>
      tone(c, f, i * 0.06, 0.2, { type: "triangle", gain: 0.2 }),
    );
    tone(c, N.E6, 0.26, 0.35, { type: "sine", gain: 0.1 });
  },

  flip: (c) => {
    noise(c, 0, 0.09, 0.22, 900, 3200);
    tone(c, 420, 0, 0.06, { type: "triangle", gain: 0.06, to: 700 });
  },

  rateAgain: (c) =>
    tone(c, 200, 0, 0.22, { type: "triangle", gain: 0.26, to: 140, lp: 900 }),
  rateHard: (c) => tone(c, 330, 0, 0.18, { type: "triangle", gain: 0.24 }),
  rateGood: (c) => {
    tone(c, N.C5, 0, 0.16, { type: "triangle", gain: 0.24 });
    tone(c, N.E5, 0.07, 0.22, { type: "triangle", gain: 0.24 });
  },
  rateEasy: (c) => {
    tone(c, N.E5, 0, 0.14, { type: "triangle", gain: 0.24 });
    tone(c, N.G5, 0.07, 0.14, { type: "triangle", gain: 0.24 });
    tone(c, N.C6, 0.14, 0.3, { type: "triangle", gain: 0.24 });
  },

  matchOk: (c) => {
    tone(c, 720, 0, 0.09, { type: "sine", gain: 0.3, to: 1080 });
    tone(c, 1320, 0.07, 0.14, { type: "triangle", gain: 0.14 });
  },
  matchBad: (c) =>
    tone(c, 190, 0, 0.17, { type: "square", gain: 0.13, to: 140, lp: 700 }),

  roundClear: (c) => {
    [N.G4, N.C5, N.E5].forEach((f, i) =>
      tone(c, f, i * 0.09, 0.22, { type: "triangle", gain: 0.24 }),
    );
  },

  win: (c) => {
    [N.C5, N.E5, N.G5].forEach((f, i) =>
      tone(c, f, i * 0.12, 0.22, { type: "triangle", gain: 0.26 }),
    );
    tone(c, N.C6, 0.38, 0.75, { type: "triangle", gain: 0.26 });
    tone(c, N.E5, 0.38, 0.75, { type: "sine", gain: 0.12 });
    tone(c, N.G5, 0.38, 0.75, { type: "sine", gain: 0.12 });
  },

  lose: (c) => {
    [N.G4, N.Eb4, N.C4, N.G3].forEach((f, i) =>
      tone(c, f, i * 0.2, i === 3 ? 0.7 : 0.26, {
        type: "sawtooth",
        gain: 0.14,
        lp: 900,
      }),
    );
  },

  record: (c) => {
    [N.G5, N.C6, N.E6].forEach((f, i) =>
      tone(c, f, i * 0.08, 0.3, { type: "sine", gain: 0.16 }),
    );
    tone(c, 1568, 0.3, 0.6, { type: "triangle", gain: 0.14 });
  },

  countdown: (c) => tone(c, 660, 0, 0.13, { type: "sine", gain: 0.32 }),
  go: (c) => {
    tone(c, 990, 0, 0.4, { type: "sine", gain: 0.3 });
    tone(c, 1320, 0, 0.4, { type: "triangle", gain: 0.12 });
  },
};

export function playSfx(name: SfxName) {
  if (!settings.enabled || settings.volume <= 0) return;
  const c = getCtx();
  if (!c) return;
  try {
    PLAYERS[name](c);
  } catch {
    // jangan sampai efek suara merusak alur kuis
  }
}
