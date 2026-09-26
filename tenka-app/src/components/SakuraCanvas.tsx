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

/**
 * Decorative falling sakura petals, rendered behind the auth card.
 * Purely cosmetic — respects prefers-reduced-motion by skipping the animation.
 */
export default function SakuraCanvas({
  className = "login-sakura-canvas",
}: {
  className?: string;
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

    const makePetal = (): Petal => ({
      x: Math.random() * width,
      y: Math.random() * -height,
      size: Math.random() * 8 + 6,
      speedY: Math.random() * 1.2 + 0.8,
      speedX: Math.random() * 0.8 - 0.4,
      angle: Math.random() * Math.PI * 2,
      spin: Math.random() * 0.03 - 0.015,
      opacity: Math.random() * 0.5 + 0.3,
      color: COLORS[Math.random() > 0.5 ? 0 : 1],
    });

    const petals: Petal[] = Array.from({ length: 35 }, makePetal);

    const resize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", resize);

    let frameId: number;
    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of petals) {
        p.y += p.speedY;
        p.x += Math.sin(p.angle) * 0.5 + p.speedX;
        p.angle += p.spin;
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
    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
