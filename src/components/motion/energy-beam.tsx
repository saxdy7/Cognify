'use client';

import React, { useEffect, useRef } from 'react';

interface EnergyBeamProps {
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  fadeSpeed: number;
  color: string;
}

export const EnergyBeam: React.FC<EnergyBeamProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

      const resize = () => {
        if (!canvas) return;
        const rect = canvas.parentElement?.getBoundingClientRect();
        width = Math.max(rect?.width || 0, window.innerWidth);
        height = Math.max(rect?.height || 0, window.innerHeight);
        dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      };

      resize();
      window.addEventListener('resize', resize);

      // Particle pool for floating embers and energy sparks matching Cognify palette
      const colors = [
        'rgba(255, 107, 0, ',    // Vibrant Cyber Orange
        'rgba(255, 150, 20, ',   // Electric Amber
        'rgba(255, 75, 10, ',    // Fiery Orange-Red
        'rgba(255, 210, 50, ',   // Gold shimmer
        'rgba(129, 140, 248, ',  // Electric Indigo accent
      ];

      const particleCount = 80;
      const particles: Particle[] = [];

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * (width || window.innerWidth),
          y: Math.random() * (height || window.innerHeight),
          vx: (Math.random() - 0.5) * 0.5,
          vy: -Math.random() * 0.7 - 0.2, // Drift upward
          size: Math.random() * 2.8 + 0.8,
          alpha: Math.random() * 0.7 + 0.2,
          fadeSpeed: (Math.random() * 0.008 + 0.003) * (Math.random() > 0.5 ? 1 : -1),
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }

      let time = 0;

      const render = () => {
        time += 0.012;

        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        // ─── 1. Flowing Harmonic Energy Wave Beams ───
        const cx = width / 2;
        const cy = height * 0.44;

        const beamCurves = [
          {
            amplitude: 130,
            frequency: 0.0032,
            speed: 1.8,
            phase: 0,
            color: 'rgba(255, 115, 0, 0.45)',
            blurColor: 'rgba(255, 107, 0, 0.9)',
            lineWidth: 3.5,
          },
          {
            amplitude: 95,
            frequency: 0.0042,
            speed: -1.3,
            phase: Math.PI / 3,
            color: 'rgba(255, 165, 0, 0.5)',
            blurColor: 'rgba(255, 150, 0, 0.95)',
            lineWidth: 2.8,
          },
          {
            amplitude: 160,
            frequency: 0.0024,
            speed: 1.1,
            phase: Math.PI / 1.5,
            color: 'rgba(255, 80, 10, 0.4)',
            blurColor: 'rgba(255, 70, 0, 0.85)',
            lineWidth: 4,
          },
          {
            amplitude: 75,
            frequency: 0.0055,
            speed: -1.9,
            phase: Math.PI,
            color: 'rgba(255, 215, 60, 0.4)',
            blurColor: 'rgba(255, 200, 0, 0.9)',
            lineWidth: 2.2,
          },
          {
            amplitude: 115,
            frequency: 0.0036,
            speed: 1.4,
            phase: Math.PI * 1.35,
            color: 'rgba(129, 140, 248, 0.35)', // Electric Indigo accent beam
            blurColor: 'rgba(99, 102, 241, 0.8)',
            lineWidth: 2.5,
          },
        ];

        ctx.globalCompositeOperation = 'screen';

        beamCurves.forEach((curve) => {
          ctx.beginPath();
          ctx.shadowBlur = 28;
          ctx.shadowColor = curve.blurColor;
          ctx.strokeStyle = curve.color;
          ctx.lineWidth = curve.lineWidth;

            for (let x = 0; x <= width; x += 6) {
              const wave1 = Math.sin(x * curve.frequency + time * curve.speed + curve.phase) * curve.amplitude;
              const wave2 = Math.cos(x * 0.0016 - time * 0.75) * (curve.amplitude * 0.35);
              const taper = Math.sin((x / width) * Math.PI); // Naturally pinches toward edge
              const y = cy + (wave1 + wave2) * Math.max(0.08, taper);

              if (x === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
          });

        // ─── 2. Radiant Core Light Burst ───
        const coreGradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, width * 0.45);
        coreGradient.addColorStop(0, 'rgba(255, 125, 15, 0.3)');
        coreGradient.addColorStop(0.35, 'rgba(255, 90, 0, 0.15)');
        coreGradient.addColorStop(0.7, 'rgba(255, 60, 0, 0.05)');
        coreGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(cx, cy, width * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // ─── 3. Floating Energy Sparks & Embers ───
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha += p.fadeSpeed;

          if (p.alpha > 0.85 || p.alpha < 0.15) {
            p.fadeSpeed = -p.fadeSpeed;
          }

          if (p.y < -20) {
            p.y = height + 20;
            p.x = Math.random() * width;
          }
          if (p.x < -20) p.x = width + 20;
          if (p.x > width + 20) p.x = -20;

          ctx.beginPath();
          ctx.shadowBlur = 12;
          ctx.shadowColor = p.color + '0.95)';
          ctx.fillStyle = p.color + Math.max(0.05, p.alpha) + ')';
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.restore();

        animationFrameId = requestAnimationFrame(render);
      };

      render();

      return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationFrameId);
      };
    }, []);

  return (
    <div className={`relative w-full h-full overflow-hidden pointer-events-none ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
};
