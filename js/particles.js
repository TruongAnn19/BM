export function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, particles;
    const N = 55;

    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    function mkP() { return { x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, r: Math.random() * 1.5 + .3, alpha: Math.random() * .5 + .1, char: Math.random() > .5 ? String.fromCharCode(0x30 + Math.random() * 10 | 0) : String.fromCharCode(0x41 + Math.random() * 6 | 0), isChar: Math.random() > .7 }; }

    resize();
    particles = Array.from({ length: N }, mkP);
    window.addEventListener('resize', resize);

    function animate() {
        ctx.clearRect(0, 0, W, H);
        particles.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
            if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10;
            if (p.isChar) {
                ctx.font = `${Math.ceil(p.r * 6)}px 'Share Tech Mono',monospace`;
                ctx.fillStyle = `rgba(0,255,65,${p.alpha * .6})`;
                ctx.fillText(p.char, p.x, p.y);
            } else {
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0,255,65,${p.alpha})`; ctx.fill();
            }
            for (let j = i + 1; j < particles.length; j++) {
                const q = particles[j]; const dx = p.x - q.x, dy = p.y - q.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < 120) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.strokeStyle = `rgba(0,255,65,${.06 * (1 - d / 120)})`; ctx.lineWidth = .5; ctx.stroke(); }
            }
        });
        requestAnimationFrame(animate);
    }

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) animate();
}
