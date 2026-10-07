/**
 * Penanda aktif yang "meluncur" untuk semua nav/tab.
 *
 * Setiap container yang cocok SELECTOR otomatis diberi atribut `data-slide`.
 * Engine mengukur posisi elemen aktif (.active / .on / aria-selected) lalu
 * menggerakkan penanda (pseudo-element ::before, lihat slide-nav.css) menuju
 * posisi itu dengan easing di tiap frame. Karena target diukur ulang setiap
 * frame, penanda juga ikut mulus saat tab aktif sedang melebar/menyempit
 * (nav bawah HP), bukan cuma saat tab berpindah tempat.
 *
 * Posisi ditulis lewat CSS variable (--sx, --sy, --sw, --sh, --so) langsung ke
 * elemen, tanpa re-render React dan tanpa menyisipkan elemen ke DOM React.
 */

const SELECTOR =
  ".script-tabs, .sidebar-nav, .st-tabs, .source-switch-seg, .practice-seg, .adm-seg, .adm-lang-toggle, .timer-options, .difficulty-options, .quiz-variant-options, .range-mode-toggle, .range-random-options";
const ACTIVE = ".active, .on, [aria-selected='true'], [aria-current='page']";
const SETTLE_MS = 520; // lebih lama dari transisi flex-grow nav HP (380ms)
const TAU_MS = 75; // makin kecil = makin cepat menyusul target
const EPS = 0.25;

type Box = { x: number; y: number; w: number; h: number };

class SlideNav {
  private cur: Box | null = null;
  private raf = 0;
  private last = 0;
  private until = 0;
  private readonly mo: MutationObserver;
  private readonly ro: ResizeObserver;

  constructor(readonly el: HTMLElement) {
    el.setAttribute("data-slide", "");
    this.mo = new MutationObserver(() => this.kick());
    this.mo.observe(el, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class", "aria-selected", "aria-current", "hidden"],
    });
    this.ro = new ResizeObserver(() => this.kick());
    this.ro.observe(el);
    this.kick(true);
  }

  destroy() {
    this.mo.disconnect();
    this.ro.disconnect();
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  /** minta penanda menyusul posisi aktif; snap = langsung loncat tanpa animasi */
  kick(snap = false) {
    if (snap) this.cur = null;
    this.until = performance.now() + SETTLE_MS;
    if (snap) this.step(performance.now()); // tulis sinkron sebelum paint
    if (!this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    }
  }

  private measure(): Box | null {
    const a = this.el.querySelector<HTMLElement>(ACTIVE);
    if (!a) return null;
    const r = a.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return null;
    const c = this.el.getBoundingClientRect();
    return {
      x: r.left - c.left - this.el.clientLeft + this.el.scrollLeft,
      y: r.top - c.top - this.el.clientTop + this.el.scrollTop,
      w: r.width,
      h: r.height,
    };
  }

  private write(b: Box | null) {
    const s = this.el.style;
    if (!b) {
      s.setProperty("--so", "0");
      return;
    }
    s.setProperty("--sx", `${b.x.toFixed(2)}px`);
    s.setProperty("--sy", `${b.y.toFixed(2)}px`);
    s.setProperty("--sw", `${b.w.toFixed(2)}px`);
    s.setProperty("--sh", `${b.h.toFixed(2)}px`);
    s.setProperty("--so", "1");
  }

  /** satu langkah animasi; return true bila masih perlu frame berikutnya */
  private step(now: number): boolean {
    const t = this.measure();
    if (!t) {
      this.cur = null;
      this.write(null);
      return false;
    }
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!this.cur || reduce) {
      this.cur = { ...t };
      this.write(this.cur);
      return now < this.until;
    }
    const dt = Math.min(64, Math.max(0, now - this.last));
    this.last = now;
    const k = 1 - Math.exp(-dt / TAU_MS);
    const c = this.cur;
    let moving = false;
    (["x", "y", "w", "h"] as const).forEach((key) => {
      const d = t[key] - c[key];
      if (Math.abs(d) < EPS) c[key] = t[key];
      else {
        c[key] += d * k;
        moving = true;
      }
    });
    this.write(c);
    return moving || now < this.until;
  }

  private tick = (now: number) => {
    this.raf = 0;
    if (this.step(now)) this.raf = requestAnimationFrame(this.tick);
  };
}

let started = false;

export function initSlideNav() {
  if (started || typeof document === "undefined") return;
  started = true;

  const bound = new WeakMap<Element, SlideNav>();
  const live = new Set<SlideNav>();

  const scan = () => {
    document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
      if (bound.has(el)) return;
      const s = new SlideNav(el);
      bound.set(el, s);
      live.add(s);
    });
    live.forEach((s) => {
      if (!s.el.isConnected) {
        s.destroy();
        live.delete(s);
      }
    });
  };

  new MutationObserver(scan).observe(document.body, {
    childList: true,
    subtree: true,
  });
  scan();

  window.addEventListener("resize", () => live.forEach((s) => s.kick(true)));
  document.fonts?.ready.then(() => live.forEach((s) => s.kick(true)));
}
