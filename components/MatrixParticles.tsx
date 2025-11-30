import React, { useRef, useEffect } from 'react';

interface MatrixParticlesProps {
  rank: number; // 0 to 100
}

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  baseX: number;
  baseY: number;

  constructor(width: number, height: number) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2;
    this.size = Math.random() * 2 + 1;
    this.baseX = this.x;
    this.baseY = this.y;
    this.color = 'rgba(100, 255, 218, 0.5)';
  }

  update(rank: number, width: number, height: number, ctx: CanvasRenderingContext2D) {
    // Rank 0-30: Collapse (Attract to center)
    // Rank 30-70: Stable (Flow/Orbit)
    // Rank 70-100: Explosion (Repel/Random jitter)

    const centerX = width / 2;
    const centerY = height / 2;
    
    if (rank < 30) {
        // COLLAPSE PHYSICS
        // Strong gravity towards center, velocity dampens
        const dx = centerX - this.x;
        const dy = centerY - this.y;
        this.vx += dx * 0.005;
        this.vy += dy * 0.005;
        this.vx *= 0.9; // Friction
        this.vy *= 0.9;
        this.color = `rgba(100, 116, 139, ${0.5 + (30 - rank)/60})`; // Slate/Blue
    } else if (rank > 70) {
        // EXPLOSION PHYSICS
        // Chaotic velocity, move away from center
        const instability = (rank - 70) / 10;
        this.vx += (Math.random() - 0.5) * instability;
        this.vy += (Math.random() - 0.5) * instability;
        
        // Push outward if too close
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 100) {
            this.vx += dx * 0.01;
            this.vy += dy * 0.01;
        }

        this.color = `rgba(244, 63, 94, ${0.5 + (rank - 70)/60})`; // Rose/Red
    } else {
        // STABLE PHYSICS
        // Gentle orbital flow or returning to base manifold
        // Lissajous-like movement
        const time = Date.now() * 0.001;
        const targetX = this.baseX + Math.sin(time + this.baseY) * 20;
        const targetY = this.baseY + Math.cos(time + this.baseX) * 20;
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        
        this.vx += dx * 0.01;
        this.vy += dy * 0.01;
        this.vx *= 0.95;
        this.vy *= 0.95;
        
        this.color = `rgba(34, 211, 238, 0.6)`; // Cyan
    }

    this.x += this.vx;
    this.y += this.vy;

    // Boundary checks
    if (rank > 70) {
        // Wrap around for chaos
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
    } 

    // Draw
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * (rank/50), 0, Math.PI * 2);
    ctx.fill();
    
    // Connections (Heavy computation, limit to close neighbors)
    // Only draw connections if rank is somewhat stable to visualize "structure"
    // At high rank, connections break (too distant). At low rank, everything merges.
  }
}

const MatrixParticles: React.FC<MatrixParticlesProps> = ({ rank }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
        canvas.width = canvas.parentElement?.clientWidth || 600;
        canvas.height = canvas.parentElement?.clientHeight || 400;
        // Re-init particles on resize
        particles.current = Array.from({ length: 150 }, () => new Particle(canvas.width, canvas.height));
    };

    window.addEventListener('resize', resize);
    resize();

    const animate = () => {
        ctx.fillStyle = 'rgba(2, 6, 23, 0.2)'; // Trails effect
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.current.forEach(p => {
            p.update(rank, canvas.width, canvas.height, ctx);
        });

        // Draw connections for stable/collapsed state to show manifold
        if (rank < 80) {
            const p = particles.current;
            ctx.strokeStyle = rank < 30 ? 'rgba(148, 163, 184, 0.05)' : 'rgba(34, 211, 238, 0.05)';
            ctx.beginPath();
            for (let i = 0; i < p.length; i++) {
                for (let j = i + 1; j < p.length; j++) {
                    const dx = p[i].x - p[j].x;
                    const dy = p[i].y - p[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 60) {
                        ctx.moveTo(p[i].x, p[i].y);
                        ctx.lineTo(p[j].x, p[j].y);
                    }
                }
            }
            ctx.stroke();
        }

        animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationRef.current);
    };
  }, [rank]);

  return (
    <canvas 
        ref={canvasRef} 
        className="w-full h-full rounded-lg border border-slate-800 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
    />
  );
};

export default MatrixParticles;