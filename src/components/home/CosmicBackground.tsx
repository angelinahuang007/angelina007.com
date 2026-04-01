'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

interface Star {
  x: number;
  y: number;
  z: number;
  radius: number;
  opacity: number;
  trail: { x: number; y: number }[];
}

const TRAIL_LENGTH = 20;

// Smoothed mouse state — acts like gravity, easing toward actual mouse
interface SmoothMouse {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  active: boolean;
  warmup: number; // 0 to 1, ramps up after mouse enters
}

function updateSmoothMouse(sm: SmoothMouse, dt: number) {
  if (!sm.active) return;
  // Ramp up warmup from 0 → 1 over ~1.5 seconds
  sm.warmup = Math.min(1, sm.warmup + dt * 0.7);
  // Easing factor increases with warmup: starts sluggish, gets tighter
  const ease = 0.02 + sm.warmup * 0.08;
  sm.x += (sm.targetX - sm.x) * ease;
  sm.y += (sm.targetY - sm.y) * ease;
}

// ──────────────────────────────────────
// DARK MODE — stars with trails + gravity mouse
// ──────────────────────────────────────

function drawDarkMode(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  stars: Star[],
  sm: SmoothMouse,
  time: number
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const mx = sm.x;
  const my = sm.y;
  const mousePixelX = (mx * 0.5 + 0.5) * canvas.width;
  const mousePixelY = (my * 0.5 + 0.5) * canvas.height;

  const projected: { sx: number; sy: number; opacity: number }[] = [];

  for (const star of stars) {
    star.z -= 1.2;
    if (star.z <= 1) {
      star.z = 1200;
      star.x = (Math.random() - 0.5) * canvas.width * 1.5;
      star.y = (Math.random() - 0.5) * canvas.height * 1.5;
      star.trail = [];
    }

    const perspective = 500 / star.z;
    const parallaxScale = 1 - star.z / 1200;
    const sx = cx + (star.x + mx * 60 * parallaxScale) * perspective;
    const sy = cy + (star.y + my * 60 * parallaxScale) * perspective;
    const depthOpacity = parallaxScale * star.opacity;

    star.trail.unshift({ x: sx, y: sy });
    if (star.trail.length > TRAIL_LENGTH) star.trail.length = TRAIL_LENGTH;

    // Trail line
    if (star.trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(star.trail[0].x, star.trail[0].y);
      for (let i = 1; i < star.trail.length; i++) {
        ctx.lineTo(star.trail[i].x, star.trail[i].y);
      }
      ctx.strokeStyle = `rgba(180, 200, 255, ${depthOpacity * 0.12})`;
      ctx.lineWidth = Math.max(star.radius * perspective * 0.5, 0.3);
      ctx.stroke();

      for (let i = 1; i < star.trail.length; i++) {
        const t = i / star.trail.length;
        const trailAlpha = depthOpacity * (1 - t) * 0.3;
        const trailR = star.radius * perspective * (1 - t * 0.7) * 0.4;
        ctx.fillStyle = `rgba(180, 200, 255, ${trailAlpha})`;
        ctx.beginPath();
        ctx.arc(star.trail[i].x, star.trail[i].y, Math.max(trailR, 0.15), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Star head
    const r = star.radius * perspective * 0.9;
    const twinkle = 0.6 + 0.4 * Math.sin(time * 4 + star.x * 0.1 + star.y * 0.1);
    const alpha = depthOpacity * twinkle;
    ctx.fillStyle = `rgba(220, 225, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();

    if (star.z < 200 && r > 1) {
      ctx.fillStyle = `rgba(200, 210, 255, ${alpha * 0.12})`;
      ctx.beginPath();
      ctx.arc(sx, sy, r * 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    projected.push({ sx, sy, opacity: depthOpacity });
  }

  // Constellation near mouse
  if (sm.active) {
    const CONNECTION_RADIUS = 200;
    const MAX_LINE_DIST = 140;
    const nearMouse = projected.filter((s) => {
      const dx = s.sx - mousePixelX;
      const dy = s.sy - mousePixelY;
      return dx * dx + dy * dy < CONNECTION_RADIUS * CONNECTION_RADIUS;
    });

    for (let i = 0; i < nearMouse.length; i++) {
      const a = nearMouse[i];
      const distToMouse = Math.sqrt((a.sx - mousePixelX) ** 2 + (a.sy - mousePixelY) ** 2);
      const mouseLineAlpha = (1 - distToMouse / CONNECTION_RADIUS) * a.opacity * 0.25;

      ctx.strokeStyle = `rgba(130, 150, 255, ${mouseLineAlpha})`;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(mousePixelX, mousePixelY);
      ctx.stroke();

      for (let j = i + 1; j < nearMouse.length; j++) {
        const b = nearMouse[j];
        const dist = Math.sqrt((a.sx - b.sx) ** 2 + (a.sy - b.sy) ** 2);
        if (dist < MAX_LINE_DIST) {
          const lineAlpha = (1 - dist / MAX_LINE_DIST) * Math.min(a.opacity, b.opacity) * 0.2;
          ctx.strokeStyle = `rgba(130, 150, 255, ${lineAlpha})`;
          ctx.lineWidth = 0.4;
          ctx.beginPath();
          ctx.moveTo(a.sx, a.sy);
          ctx.lineTo(b.sx, b.sy);
          ctx.stroke();
        }
      }
    }

    // Mouse glow
    const gradient = ctx.createRadialGradient(mousePixelX, mousePixelY, 0, mousePixelX, mousePixelY, 250);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.04)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

// ──────────────────────────────────────
// LIGHT MODE — warm blobs + cute cat chasing mouse
// ──────────────────────────────────────

interface CatState {
  x: number;
  y: number;
  frame: number;
  facingRight: boolean;
  state: 'idle' | 'walk' | 'sit';
  stateTimer: number;
}

function drawCat(ctx: CanvasRenderingContext2D, cat: CatState, scale: number) {
  const s = scale;
  ctx.save();
  ctx.translate(cat.x, cat.y);
  if (!cat.facingRight) {
    ctx.scale(-1, 1);
  }

  const bounce = cat.state === 'walk' ? Math.sin(cat.frame * 0.3) * 2 : 0;
  const tailWag = Math.sin(cat.frame * 0.15) * 0.3;

  // Tail
  ctx.strokeStyle = 'rgba(80, 80, 80, 0.6)';
  ctx.lineWidth = s * 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-s * 10, -s * 4 + bounce);
  ctx.quadraticCurveTo(
    -s * 18, -s * 12 + Math.sin(tailWag) * s * 6,
    -s * 16, -s * 18 + Math.sin(tailWag) * s * 4
  );
  ctx.stroke();

  // Body
  ctx.fillStyle = 'rgba(70, 70, 70, 0.55)';
  ctx.beginPath();
  ctx.ellipse(0, bounce, s * 12, s * 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = 'rgba(70, 70, 70, 0.6)';
  ctx.beginPath();
  ctx.arc(s * 10, -s * 6 + bounce, s * 7, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.fillStyle = 'rgba(60, 60, 60, 0.6)';
  ctx.beginPath();
  ctx.moveTo(s * 6, -s * 12 + bounce);
  ctx.lineTo(s * 4, -s * 20 + bounce);
  ctx.lineTo(s * 11, -s * 13 + bounce);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(s * 13, -s * 12 + bounce);
  ctx.lineTo(s * 15, -s * 20 + bounce);
  ctx.lineTo(s * 18, -s * 11 + bounce);
  ctx.closePath();
  ctx.fill();

  // Inner ears
  ctx.fillStyle = 'rgba(180, 140, 140, 0.4)';
  ctx.beginPath();
  ctx.moveTo(s * 6.5, -s * 13 + bounce);
  ctx.lineTo(s * 5.5, -s * 18 + bounce);
  ctx.lineTo(s * 10, -s * 13.5 + bounce);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(s * 13.5, -s * 12.5 + bounce);
  ctx.lineTo(s * 15, -s * 18 + bounce);
  ctx.lineTo(s * 17, -s * 12 + bounce);
  ctx.closePath();
  ctx.fill();

  // Eyes
  const blink = Math.sin(cat.frame * 0.05) > 0.95;
  if (blink) {
    ctx.strokeStyle = 'rgba(40, 40, 40, 0.7)';
    ctx.lineWidth = s * 1;
    ctx.beginPath();
    ctx.moveTo(s * 7, -s * 6 + bounce);
    ctx.lineTo(s * 9.5, -s * 6 + bounce);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 12, -s * 6 + bounce);
    ctx.lineTo(s * 14.5, -s * 6 + bounce);
    ctx.stroke();
  } else {
    ctx.fillStyle = 'rgba(40, 40, 40, 0.75)';
    ctx.beginPath();
    ctx.arc(s * 8, -s * 6.5 + bounce, s * 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 13, -s * 6.5 + bounce, s * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Eye highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(s * 8.5, -s * 7.2 + bounce, s * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 13.5, -s * 7.2 + bounce, s * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Nose
  ctx.fillStyle = 'rgba(180, 120, 120, 0.6)';
  ctx.beginPath();
  ctx.arc(s * 10.5, -s * 4.5 + bounce, s * 0.8, 0, Math.PI * 2);
  ctx.fill();

  // Whiskers
  ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
  ctx.lineWidth = s * 0.5;
  // Left
  ctx.beginPath();
  ctx.moveTo(s * 6, -s * 4 + bounce);
  ctx.lineTo(s * -2, -s * 5 + bounce);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(s * 6, -s * 3 + bounce);
  ctx.lineTo(s * -2, -s * 2 + bounce);
  ctx.stroke();
  // Right
  ctx.beginPath();
  ctx.moveTo(s * 15, -s * 4 + bounce);
  ctx.lineTo(s * 22, -s * 5 + bounce);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(s * 15, -s * 3 + bounce);
  ctx.lineTo(s * 22, -s * 2 + bounce);
  ctx.stroke();

  // Legs (when walking)
  if (cat.state === 'walk') {
    const legPhase = cat.frame * 0.3;
    ctx.fillStyle = 'rgba(65, 65, 65, 0.5)';
    // Front legs
    ctx.beginPath();
    ctx.ellipse(s * 7, s * 6 + Math.sin(legPhase) * 2, s * 2, s * 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(s * 3, s * 6 + Math.sin(legPhase + Math.PI) * 2, s * 2, s * 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Back legs
    ctx.beginPath();
    ctx.ellipse(-s * 6, s * 5 + Math.sin(legPhase + Math.PI / 2) * 2, s * 2.5, s * 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-s * 10, s * 5 + Math.sin(legPhase + Math.PI * 1.5) * 2, s * 2.5, s * 4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Sitting — tucked legs
    ctx.fillStyle = 'rgba(65, 65, 65, 0.45)';
    ctx.beginPath();
    ctx.ellipse(s * 6, s * 5, s * 3, s * 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-s * 6, s * 5, s * 3, s * 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawLightMode(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  sm: SmoothMouse,
  time: number,
  cat: CatState
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const w = canvas.width;
  const h = canvas.height;
  const offsetX = sm.x * 120;
  const offsetY = sm.y * 90;

  // Deeper warm blobs
  const blobs = [
    { x: w * 0.15 + offsetX * 0.4, y: h * 0.2 + offsetY * 0.3, r: w * 0.5, color: [255, 170, 100], alpha: 0.3 },
    { x: w * 0.75 - offsetX * 0.25, y: h * 0.15 - offsetY * 0.2, r: w * 0.45, color: [255, 150, 80], alpha: 0.22 },
    { x: w * 0.5 + offsetX * 0.2, y: h * 0.75 + offsetY * 0.3, r: w * 0.4, color: [190, 160, 255], alpha: 0.18 },
    { x: w * 0.9 - offsetX * 0.15, y: h * 0.55 - offsetY * 0.15, r: w * 0.38, color: [255, 190, 130], alpha: 0.25 },
    { x: w * 0.35 + offsetX * 0.1, y: h * 0.6 + offsetY * 0.1, r: w * 0.35, color: [255, 180, 120], alpha: 0.18 },
  ];

  for (const blob of blobs) {
    const breathe = 1 + 0.06 * Math.sin(time * 0.6 + blob.x * 0.002);
    const r = blob.r * breathe;
    const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, r);
    const [cr, cg, cb] = blob.color;
    grad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${blob.alpha})`);
    grad.addColorStop(0.4, `rgba(${cr}, ${cg}, ${cb}, ${blob.alpha * 0.45})`);
    grad.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  // Mouse warm glow
  if (sm.active) {
    const mouseX = (sm.x * 0.5 + 0.5) * w;
    const mouseY = (sm.y * 0.5 + 0.5) * h;
    const mouseGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 300);
    mouseGrad.addColorStop(0, 'rgba(255, 185, 120, 0.2)');
    mouseGrad.addColorStop(0.5, 'rgba(255, 200, 150, 0.08)');
    mouseGrad.addColorStop(1, 'rgba(255, 210, 170, 0)');
    ctx.fillStyle = mouseGrad;
    ctx.fillRect(0, 0, w, h);
  }

  // Cat following mouse
  if (sm.active) {
    const targetX = (sm.targetX * 0.5 + 0.5) * w;
    const targetY = (sm.targetY * 0.5 + 0.5) * h;
    const dx = targetX - cat.x;
    const dy = targetY - cat.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 80) {
      cat.state = 'walk';
      const speed = Math.min(dist * 0.03, 3);
      cat.x += (dx / dist) * speed;
      cat.y += (dy / dist) * speed;
      cat.facingRight = dx > 0;
    } else {
      cat.state = 'sit';
    }
  }
  cat.frame++;

  drawCat(ctx, cat, 1.2);
}

// ──────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────

export function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const smoothMouseRef = useRef<SmoothMouse>({
    x: 0, y: 0, targetX: 0, targetY: 0, active: false, warmup: 0,
  });
  const catRef = useRef<CatState>({
    x: 0, y: 0, frame: 0, facingRight: true, state: 'idle', stateTimer: 0,
  });
  const rafRef = useRef<number>(0);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mounted) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Init cat in center
    catRef.current.x = canvas.width / 2;
    catRef.current.y = canvas.height * 0.7;

    // Init stars
    starsRef.current = Array.from({ length: 250 }, () => ({
      x: (Math.random() - 0.5) * canvas.width * 1.5,
      y: (Math.random() - 0.5) * canvas.height * 1.5,
      z: Math.random() * 1200,
      radius: Math.random() * 1.8 + 0.3,
      opacity: Math.random() * 0.7 + 0.2,
      trail: [],
    }));

    const handleMouseMove = (e: MouseEvent) => {
      const sm = smoothMouseRef.current;
      sm.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      sm.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!sm.active) {
        sm.active = true;
        sm.warmup = 0;
        // Start from far away so it eases in
        sm.x = sm.targetX * 0.3;
        sm.y = sm.targetY * 0.3;
      }
    };

    const handleMouseLeave = () => {
      smoothMouseRef.current.active = false;
      smoothMouseRef.current.warmup = 0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    let lastTime = performance.now();
    let time = 0;

    const animate = (now: number) => {
      if (!ctx || !canvas) return;
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      time += 0.008;

      updateSmoothMouse(smoothMouseRef.current, dt);

      const isDark = document.documentElement.classList.contains('dark');

      if (isDark) {
        drawDarkMode(ctx, canvas, starsRef.current, smoothMouseRef.current, time);
      } else {
        drawLightMode(ctx, canvas, smoothMouseRef.current, time, catRef.current);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [mounted, resolvedTheme]);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 -z-10"
      style={{ pointerEvents: 'none' }}
    />
  );
}
