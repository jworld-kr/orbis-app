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
  depth: number; // 0..1, used for parallax
};

type Props = {
  density?: number; // stars per 10000 px^2
  parallaxStrength?: number;
  className?: string;
};

export default function Starfield({
  density = 0.16,
  parallaxStrength = 14,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const dprRef = useRef(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let raf = 0;
    let running = true;

    const setup = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dprRef.current = dpr;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const isMobile = w < 768;
      const effectiveDensity = isMobile ? density * 0.55 : density;
      const count = Math.floor((w * h) / 10000 * effectiveDensity * 10);

      const stars: Star[] = [];
      for (let i = 0; i < count; i++) {
        const depth = Math.random();
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 0.9 + 0.25 + depth * 0.6,
          baseAlpha: 0.18 + Math.random() * 0.55,
          amp: 0.12 + Math.random() * 0.3,
          speed: 0.0004 + Math.random() * 0.0009,
          phase: Math.random() * Math.PI * 2,
          depth,
        });
      }
      starsRef.current = stars;
    };

    const onResize = () => setup();
    setup();

    const onMouse = (e: MouseEvent) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      mouseRef.current.tx = (e.clientX / w - 0.5) * 2;
      mouseRef.current.ty = (e.clientY / h - 0.5) * 2;
    };

    const draw = (t: number) => {
      if (!running) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      ctx.clearRect(0, 0, w, h);

      // ease mouse
      mouseRef.current.x += (mouseRef.current.tx - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.ty - mouseRef.current.y) * 0.04;

      const stars = starsRef.current;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const breathe = reduceMotion
          ? 0
          : Math.sin(t * s.speed + s.phase) * s.amp;
        const alpha = Math.max(0, Math.min(1, s.baseAlpha + breathe));
        const px = s.x - mouseRef.current.x * parallaxStrength * s.depth;
        const py = s.y - mouseRef.current.y * parallaxStrength * s.depth;

        // soft glow for brighter stars
        if (s.r > 1) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(245, 247, 250, ${alpha * 0.08})`;
          ctx.arc(px, py, s.r * 3.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.fillStyle = `rgba(245, 247, 250, ${alpha})`;
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouse);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, [density, parallaxStrength]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-hidden
    />
  );
}
