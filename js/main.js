import { state, API } from './state.js';
import { toast } from './utils.js';
import { initParticles } from './particles.js';
import { initEncrypt } from './tabs/encrypt.js';
import { initDecrypt } from './tabs/decrypt.js';
import { initFileTabs } from './tabs/file.js';

// ── BOOTSTRAP ──────────────────────────────────────────────
async function loadComponent(id, file) {
    const el = document.getElementById(id);
    if (!el || el.innerHTML.trim().length > 0) return; // avoid reloading
    try {
        const res = await fetch(`components/${file}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        el.innerHTML = await res.text();
    } catch (e) {
        console.error(`Error loading component ${file}:`, e);
    }
}

async function boot() {
    // Suppress tab animations during load
    document.body.classList.add('no-tab-anim');

    // 1. Load all component HTML simultaneously
    await Promise.all([
        loadComponent('panel-encrypt', 'tab-encrypt.html'),
        loadComponent('panel-decrypt', 'tab-decrypt.html'),
        loadComponent('panel-file', 'tab-file-enc.html'),
        loadComponent('panel-decrypt-file', 'tab-decrypt-file.html'),
        loadComponent('panel-about', 'tab-about.html')
    ]);

    // 2. Initialize modules (bind DOM events, etc.)
    initEncrypt();
    initDecrypt();
    initFileTabs();
    initParticles();

    // 3. Setup Navigation Hook
    setupNavigation();

    // 4. Check Server Status
    checkServerStatus();
    setInterval(checkServerStatus, 30_000);

    // 5. Restore active tab
    const savedTab = localStorage.getItem('aes-active-tab') || 'encrypt';
    switchTab(savedTab);

    // Re-enable tab transitions
    requestAnimationFrame(() => requestAnimationFrame(() =>
        document.body.classList.remove('no-tab-anim')
    ));
}

// ── SERVER STATUS ──────────────────────────────────────────
async function checkServerStatus() {
    const statusText = document.querySelector('.status-text');
    const statusDot = document.querySelector('.status-dot');
    try {
        const r = await fetch(`${API}/status`, { signal: AbortSignal.timeout(3000) });
        if (r.ok) {
            const data = await r.json();
            state.serverOk = true;
            statusText.textContent = `SERVER READY | aes.exe ${data.aesExe === 'compiled' ? '✓' : '⚠'}`;
            statusDot.style.background = data.aesExe === 'compiled' ? 'var(--green)' : 'var(--orange)';
            if (data.aesExe !== 'compiled') toast('⚠ aes.exe chưa được biên dịch!', 'warn');
        }
    } catch {
        state.serverOk = false;
        statusText.textContent = 'SERVER OFFLINE';
        statusDot.style.background = 'var(--red)';
        statusDot.style.animation = 'none';
        toast('⚠ Server chưa chạy!', 'error');
    }
}

// ── NAVIGATION LOGIC ───────────────────────────────────────
function switchTab(tab) {
    state.activeTab = tab;
    localStorage.setItem('aes-active-tab', tab);

    // Deactivate all nav buttons and panels
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
    });
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

    const tabMap = {
        'encrypt': ['nav-encrypt', 'panel-encrypt'],
        'decrypt': ['nav-decrypt', 'panel-decrypt'],
        'about': ['nav-about', 'panel-about'],
        'file': ['nav-file', 'panel-file'],
        'decrypt-file': ['nav-decrypt-file', 'panel-decrypt-file']
    };

    const target = tabMap[tab] || tabMap['encrypt'];
    const btn = document.getElementById(target[0]);
    const pnl = document.getElementById(target[1]);

    if (btn) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
    }
    if (pnl) pnl.classList.add('active');
}

function setupNavigation() {
    const attach = (id, tab) => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', () => switchTab(tab));
    };

    attach('nav-encrypt', 'encrypt');
    attach('nav-decrypt', 'decrypt');
    attach('nav-about', 'about');
    attach('nav-file', 'file');
    attach('nav-decrypt-file', 'decrypt-file');

    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (state.activeTab === 'encrypt') document.getElementById('btn-encrypt').click();
            else if (state.activeTab === 'decrypt') document.getElementById('btn-decrypt').click();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === '1') { e.preventDefault(); switchTab('encrypt'); }
        if ((e.ctrlKey || e.metaKey) && e.key === '2') { e.preventDefault(); switchTab('decrypt'); }
        if ((e.ctrlKey || e.metaKey) && e.key === '3') { e.preventDefault(); switchTab('about'); }
        if ((e.ctrlKey || e.metaKey) && e.key === '4') { e.preventDefault(); switchTab('file'); }
    });
}

// Execute boot
boot();
