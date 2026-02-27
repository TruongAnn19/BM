import { useEffect, useRef } from 'react';

export default function ParticleCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const ctx = canvas.getContext('2d');
        let W, H, animFrame;

        // ── Matrix Rain ──────────────────────────────────
        const FONT_SIZE = 13;
        const CHARS = '01アイウエオカキクケコABCDEF0123456789∑∆ΩλΨ';
        let cols = [];
        let drops = [];

        let dropFrac = [];

        // ── Particle Network ─────────────────────────────
        const NUM_PARTICLES = 40;
        let particles = [];

        function resize() {
            W = canvas.width = window.innerWidth;
            H = canvas.height = window.innerHeight;

            // Reset matrix columns
            cols = Math.floor(W / FONT_SIZE);
            drops = Array.from({ length: cols }, () => Math.random() * -H / FONT_SIZE);
            dropFrac = drops.slice(); // Cập nhật mảng vẽ dựa trên width mới

            // Reset particles
            particles = Array.from({ length: NUM_PARTICLES }, () => mkParticle());
        }

        function animate() {
            // Fading trail — semi-transparent overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
            ctx.fillRect(0, 0, W, H);

            ctx.font = `${FONT_SIZE}px 'Share Tech Mono', monospace`;

            for (let i = 0; i < cols; i++) {
                const y = Math.floor(dropFrac[i]);

                // Head character — bright neon green
                if (y >= 0) {
                    ctx.fillStyle = 'rgba(180, 255, 200, 0.95)';
                    ctx.fillText(getRandChar(), i * FONT_SIZE, y * FONT_SIZE);
                }

                // Body characters — gradient fade
                for (let t = 1; t <= 14; t++) {
                    const ty = y - t;
                    if (ty < 0) continue;
                    const alpha = Math.max(0, 0.65 - t * 0.045);
                    if (alpha <= 0) continue;
                    ctx.fillStyle = `rgba(0, 255, 65, ${alpha})`;
                    ctx.fillText(
                        colChars[i % colChars.length][ty % 40] || '0',
                        i * FONT_SIZE,
                        ty * FONT_SIZE
                    );
                }

                // Advance drop
                dropFrac[i] += colSpeeds[i % colSpeeds.length];

                // Reset when the column has scrolled past the bottom
                if (dropFrac[i] * FONT_SIZE > H + FONT_SIZE * 20) {
                    dropFrac[i] = Math.random() * -30;
                }
            }

            // ── Particle Network overlay ─────────────────
            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < -10) p.x = W + 10;
                if (p.x > W + 10) p.x = -10;
                if (p.y < -10) p.y = H + 10;
                if (p.y > H + 10) p.y = -10;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0,255,65,${p.alpha})`;
                ctx.fill();

                for (let j = i + 1; j < particles.length; j++) {
                    const q = particles[j];
                    const dx = p.x - q.x, dy = p.y - q.y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < 110) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(q.x, q.y);
                        ctx.strokeStyle = `rgba(0,255,65,${0.07 * (1 - d / 110)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            });

            animFrame = requestAnimationFrame(animate);
        }

        animFrame = requestAnimationFrame(animate);

        function getRandChar() {
            return CHARS[Math.floor(Math.random() * CHARS.length)];
        }

        const colSpeeds = Array.from({ length: 1500 }, () => 0.3 + Math.random() * 0.55);
        const colChars = Array.from({ length: 1500 }, () =>
            Array.from({ length: 40 }, getRandChar)
        );

        function mkParticle() {
            return {
                x: Math.random() * W,
                y: Math.random() * H,
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25,
                r: Math.random() * 1.2 + 0.4,
                alpha: Math.random() * 0.35 + 0.08,
            };
        }

        resize();
        window.addEventListener('resize', resize);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animFrame);
        };
    }, []);

    return <canvas id="particleCanvas" ref={canvasRef} aria-hidden="true"></canvas>;
}
