import { useEffect, useRef } from "react";
import type p5Type from "p5";

type TerminalArtBackgroundProps = {
  /** "running" spawns flowing particles; "idle" shows the ambient dot field. */
  mode: "idle" | "running";
  /** RGB color of the running-state particles. */
  color: string;
};

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;
  const int = Number.parseInt(value, 16);
  if (Number.isNaN(int)) {
    return [100, 100, 100];
  }
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

type AmbientDot = { x: number; y: number; vx: number; vy: number; size: number; phase: number };
type Particle = {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  speed: number;
  color: [number, number, number];
  size: number;
  alpha: number;
  wobble: number;
};

/**
 * Generative-art canvas rendered behind the algorithm terminal.
 * Idle: a slow-drifting constellation of dots. Running: colored particles
 * streaming left-to-right in the active algorithm's color.
 * Honours prefers-reduced-motion by rendering nothing.
 */
export function TerminalArtBackground({ mode, color }: TerminalArtBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ mode, color });

  useEffect(() => {
    stateRef.current = { mode, color };
  }, [mode, color]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      return;
    }

    const host = hostRef.current;
    if (!host) {
      return;
    }

    let instance: p5Type | undefined;
    let cancelled = false;

    void import("p5").then(({ default: P5 }) => {
      if (cancelled || !hostRef.current) {
        return;
      }

      let ambientDots: AmbientDot[] = [];
      let particles: Particle[] = [];
      let time = 0;

      const sketch = (p: p5Type) => {
        const initAmbient = () => {
          const count = Math.floor((p.width * p.height) / 2800) + 8;
          ambientDots = [];
          for (let i = 0; i < count; i += 1) {
            ambientDots.push({
              x: p.random(p.width),
              y: p.random(p.height),
              vx: p.random(-0.12, 0.12),
              vy: p.random(-0.12, 0.12),
              size: p.random(1, 2.8),
              phase: p.random(p.TWO_PI),
            });
          }
        };

        const spawnParticles = (count: number) => {
          const col = hexToRgb(stateRef.current.color);
          for (let i = 0; i < count; i += 1) {
            particles.push({
              fromX: 0,
              fromY: p.random(p.height * 0.15, p.height * 0.85),
              toX: p.width,
              toY: p.random(p.height * 0.15, p.height * 0.85),
              progress: 0,
              speed: 0.006 + p.random(0, 0.008),
              color: col,
              size: p.random(1.5, 4),
              alpha: 1,
              wobble: p.random(p.TWO_PI),
            });
          }
        };

        const drawAmbient = () => {
          for (const d of ambientDots) {
            d.x += d.vx;
            d.y += d.vy;
            if (d.x < -10) d.x = p.width + 10;
            if (d.x > p.width + 10) d.x = -10;
            if (d.y < -10) d.y = p.height + 10;
            if (d.y > p.height + 10) d.y = -10;
            const pulse = p.sin(time * 1.6 + d.phase) * 0.25 + 0.75;
            p.fill(255, 255, 255, 12 * pulse);
            p.noStroke();
            p.circle(d.x, d.y, d.size * pulse);
          }
          p.strokeWeight(0.4);
          for (let i = 0; i < ambientDots.length; i += 1) {
            for (let j = i + 1; j < ambientDots.length; j += 1) {
              const dx = ambientDots[i].x - ambientDots[j].x;
              const dy = ambientDots[i].y - ambientDots[j].y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 60) {
                p.stroke(255, 255, 255, (1 - dist / 60) * 4);
                p.line(ambientDots[i].x, ambientDots[i].y, ambientDots[j].x, ambientDots[j].y);
              }
            }
          }
        };

        const updateParticles = () => {
          for (let i = particles.length - 1; i >= 0; i -= 1) {
            const pt = particles[i];
            pt.progress += pt.speed;
            pt.alpha = Math.min(1, pt.progress * 4) * (1 - Math.max(0, (pt.progress - 0.6) / 0.4));
            if (pt.progress >= 1) particles.splice(i, 1);
          }
          if (particles.length > 300) particles.splice(0, particles.length - 300);
        };

        const drawParticles = () => {
          for (const pt of particles) {
            const t = pt.progress;
            const cx1x = pt.fromX + p.width * 0.3;
            const cx1y = pt.fromY + p.sin(t * 3 + pt.wobble) * 8;
            const cx2x = pt.toX - p.width * 0.3;
            const cx2y = pt.toY + p.cos(t * 3 + pt.wobble) * 8;
            const px = p.bezierPoint(pt.fromX, cx1x, cx2x, pt.toX, t);
            const py = p.bezierPoint(pt.fromY, cx1y, cx2y, pt.toY, t);
            const [r, g, b] = pt.color;
            p.fill(r, g, b, pt.alpha * 200);
            p.noStroke();
            p.circle(px, py, pt.size);
            if (t > 0.025) {
              const t2 = t - 0.025;
              const px2 = p.bezierPoint(pt.fromX, cx1x, cx2x, pt.toX, t2);
              const py2 = p.bezierPoint(pt.fromY, cx1y, cx2y, pt.toY, t2);
              p.stroke(r, g, b, pt.alpha * 35);
              p.strokeWeight(pt.size * 0.5);
              p.line(px, py, px2, py2);
            }
          }
        };

        p.setup = () => {
          const node = hostRef.current;
          const width = node?.offsetWidth ?? 600;
          const height = node?.offsetHeight ?? 220;
          const canvas = p.createCanvas(width, height);
          canvas.position(0, 0);
          canvas.style("pointer-events", "none");
          canvas.style("position", "absolute");
          p.frameRate(30);
          initAmbient();
        };

        p.draw = () => {
          p.clear();
          time += 0.004;
          if (stateRef.current.mode === "running") {
            if (p.frameCount % 2 === 0) spawnParticles(2);
            updateParticles();
            drawParticles();
          } else {
            drawAmbient();
          }
        };

        p.windowResized = () => {
          const node = hostRef.current;
          if (node) {
            p.resizeCanvas(node.offsetWidth, node.offsetHeight);
            initAmbient();
          }
        };
      };

      instance = new P5(sketch, hostRef.current);
    });

    return () => {
      cancelled = true;
      instance?.remove();
    };
  }, []);

  return <div ref={hostRef} className="terminal-art" aria-hidden="true" />;
}
