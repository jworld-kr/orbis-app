"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  amp: number;
  speed: number;
  phase: number;
  vx: number;
  streak: number;
};

type Shooter = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  length: number;
};

type Props = {
  /** 0..1 — overall density multiplier */
  density?: number;
  /** Whether to spawn occasional shooting stars */
  shooters?: boolean;
  className?: string;
};

/**
 * Quiet, sensual starfield: stars drift left at parallax speeds, breathe
 * gently, foreground stars trail subtle streaks, occasional shooting stars.
 * Used as the ambient backdrop across multiple "deep space" sections so the
 * tone reads as continuous.
 */
export default function DriftingStars({
  density = 1,
  shooters = true,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const shootersRef = useRef<Shooter[]>([]);
  const lastShooterRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let last = performance.now();

    const setup = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const baseDensity = w < 768 ? 0.55 : 0.85;
      const total = Math.floor(((w * h) / 1700) * baseDensity * density);

      let seed = 17;
      const rand = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };

      const stars: Star[] = [];
      for (let i = 0; i < total; i++) {
        const sizeRoll = rand();
        const r =
          sizeRoll > 0.982
            ? 1.8
            : sizeRoll > 0.93
              ? 1.2
              : sizeRoll > 0.7
                ? 0.7
                : 0.45;
        const depth = r / 1.8;
        stars.push({
          x: rand() * w,
          y: rand() * h,
          r,
          baseAlpha: 0.22 + rand() * 0.6,
          amp: 0.18 + rand() * 0.3,
          speed: 0.0006 + rand() * 0.0014,
          phase: rand() * Math.PI * 2,
          vx: -(2 + depth * 16),
          streak: depth,
        });
      }
      starsRef.current = stars;
      shootersRef.current = [];
    };

    const spawnShooter = (w: number, h: number) => {
      const startX = w + 60;
      const startY = h * (0.05 + Math.random() * 0.55);
      const angle = Math.PI + (Math.random() * 0.18 - 0.09);
      const speed = 380 + Math.random() * 220;
      shootersRef.current.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.4 + 30,
        life: 1.6,
        maxLife: 1.6,
        length: 80 + Math.random() * 70,
      });
    };

    const draw = (t: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;

      ctx.clearRect(0, 0, w, h);

      const stars = starsRef.current;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        if (!reduceMotion) {
          s.x += s.vx * dt;
          if (s.x < -10) {
            s.x = w + 10;
            s.y = Math.random() * h;
          }
        }
        const breathe = reduceMotion
          ? 0
          : Math.sin(t * s.speed + s.phase) * s.amp;
        const alpha = Math.max(0, Math.min(1, s.baseAlpha + breathe));

        if (s.r > 1) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(245, 247, 250, ${alpha * 0.18})`;
          ctx.arc(s.x, s.y, s.r * 3.6, 0, Math.PI * 2);
          ctx.fill();
        }

        if (!reduceMotion && s.streak > 0.45) {
          const trailLen = s.streak * 6 + 2;
          const grad = ctx.createLinearGradient(s.x, s.y, s.x + trailLen, s.y);
          grad.addColorStop(0, `rgba(245, 247, 250, ${alpha * 0.55})`);
          grad.addColorStop(1, `rgba(245, 247, 250, 0)`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = s.r * 0.9;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x + trailLen, s.y);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(245, 247, 250, ${alpha})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (shooters && !reduceMotion) {
        const since = (t - lastShooterRef.current) / 1000;
        const expected = 11 + Math.random() * 4;
        if (since > expected) {
          spawnShooter(w, h);
          lastShooterRef.current = t;
        }

        const sh = shootersRef.current;
        for (let i = sh.length - 1; i >= 0; i--) {
          const s = sh[i];
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.life -= dt;
          const lifeT = Math.max(0, s.life / s.maxLife);
          const inFade = Math.min(1, (1 - lifeT) / 0.15);
          const outFade = Math.min(1, lifeT / 0.5);
          const alpha = Math.min(inFade, outFade);

          const len = s.length;
          const ang = Math.atan2(s.vy, s.vx);
          const tailX = s.x - Math.cos(ang) * len;
          const tailY = s.y - Math.sin(ang) * len;
          const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
          grad.addColorStop(0, `rgba(245, 247, 250, ${alpha * 0.95})`);
          grad.addColorStop(1, `rgba(245, 247, 250, 0)`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.4;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();

          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.arc(s.x, s.y, 1.4, 0, Math.PI * 2);
          ctx.fill();

          if (s.life <= 0 || s.x < -200 || s.y > h + 200) {
            sh.splice(i, 1);
          }
        }
      }

      raf = requestAnimationFrame(draw);
    };

    setup();
    raf = requestAnimationFrame(draw);
    const onResize = () => setup();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [density, shooters]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className ?? ""}`}
      aria-hidden
    />
  );
}
