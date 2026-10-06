import { useEffect, useRef } from "react";

type Petal = {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  angle: number;
  spin: number;
  opacity: number;
  color: string;
};

const COLORS = ["#FF79C6", "#F8A5C2"];
// Palet dark mode (opsional via prop `nightBlue`): kelopak biru-indigo biar
// nyambung sama bg malam & dekorasi bunga biru di bubble panduan.
const NIGHT_COLORS = ["#7F95FF", "#A9B8FF", "#6AA8FF"];

/**
 * Decorative falling sakura petals, rendered behind the auth card.
 * Purely cosmetic — respects prefers-reduced-motion by skipping the animation.
 * `density` (petal count) and `speed` (multiplier on fall/drift speed) let
 * callers tone it down for smaller/busier spots (e.g. IntroGuide) without
 * touching the default look used on the login page.
 */
export default function SakuraCanvas({
  className = "login-sakura-canvas",
  density = 35,
  speed = 1,
  nightBlue = false,
}: {
  className?: string;
  density?: number;
  speed?: number;
  /** Di dark mode kelopaknya jadi biru (default: tetap pink). */
  nightBlue?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const isNight = () =>
      nightBlue && document.documentElement.getAttribute("data-theme") === "dark";

    const makePetal = (): Petal => ({
      x: Math.random() * width,
      y: Math.random() * -height,
      size: Math.random() * 8 + 6,
      speedY: (Math.random() * 1.2 + 0.8) * speed,
      speedX: (Math.random() * 0.8 - 0.4) * speed,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() * 0.03 - 0.015) * speed,
      opacity: Math.random() * 0.5 + 0.3,
      color: isNight()
        ? NIGHT_COLORS[Math.floor(Math.random() * NIGHT_COLORS.length)]
        : COLORS[Math.random() > 0.5 ? 0 : 1],
    });

    const petals: Petal[] = Array.from({ length: density }, makePetal);

    const resize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", resize);

    // Kecepatan dihitung per waktu (bukan per frame), jadi layar 90/120Hz tidak
    // membuat bunga jatuh 2x lebih cepat. Di HP dibuat lebih pelan lagi.
    const phone = window.matchMedia("(max-width: 680px)");
    const PHONE_FACTOR = 0.5;

    let frameId: number;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / (1000 / 60), 3); // 1 = satu frame di 60Hz
      last = now;
      const k = dt * (phone.matches ? PHONE_FACTOR : 1);
      ctx.clearRect(0, 0, width, height);
      for (const p of petals) {
        p.y += p.speedY * k;
        p.x += (Math.sin(p.angle) * 0.5 + p.speedX) * k;
        p.angle += p.spin * k;
        if (p.y > height + 20 || p.x < -20 || p.x > width + 20) {
          Object.assign(p, makePetal(), { y: Math.random() * -40 });
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame((t) => {
      last = t;
      tick(t);
    });

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
