import { state, API } from '../state.js';
import { toast, formatNs } from '../utils.js';

export function initEncrypt() {
    const dom = {
        plaintext: document.getElementById('plaintext'),
        secretKey: document.getElementById('secret-key'),
        btnEncrypt: document.getElementById('btn-encrypt'),
        btnPastePlain: document.getElementById('btn-paste-plain'),
        btnClearPlain: document.getElementById('btn-clear-plain'),
        btnSample: document.getElementById('btn-sample'),
        btnCopyCipher: document.getElementById('btn-copy-cipher'),
        btnGenKey: document.getElementById('btn-gen-key'),
        btnToggleKey: document.getElementById('btn-toggle-key'),
        charCountEncrypt: document.getElementById('char-count-encrypt'),
        cipherOutput: document.getElementById('cipher-output'),
        metricTime: document.getElementById('metric-time'),
        metricPlainSize: document.getElementById('metric-plain-size'),
        metricCipherSize: document.getElementById('metric-cipher-size'),
        metricBlocks: document.getElementById('metric-blocks'),
        metricAlgo: document.getElementById('metric-algo'),
        keyLenDisplay: document.getElementById('key-len-display'),
        roundsDisplay: document.getElementById('rounds-display'),
        keyStrengthBars: document.querySelectorAll('#key-strength .strength-bar'),
        keyHint: document.getElementById('key-hint')
    };

    const keyLenMap = {
        128: { len: '16 bytes (128 bit)', rounds: '10' },
        192: { len: '24 bytes (192 bit)', rounds: '12' },
        256: { len: '32 bytes (256 bit)', rounds: '14' },
    };

    document.querySelectorAll('#panel-encrypt .seg-btn[data-keylen]').forEach(btn => {
        btn.addEventListener('click', () => {
            const group = btn.closest('.seg-control');
            group.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const bits = parseInt(btn.dataset.keylen);
            state.encKeyBits = bits;
            dom.keyLenDisplay.textContent = keyLenMap[bits].len;
            dom.roundsDisplay.textContent = keyLenMap[bits].rounds;
            dom.metricAlgo.textContent = `AES-${bits} ECB`;
            updateKeyHint();
        });
    });

    function updateKeyHint() {
        const bits = state.encKeyBits;
        if (dom.keyHint) dom.keyHint.textContent = `AES-${bits} cần ${bits / 8} ký tự (hiện tại: ${dom.secretKey.value.length}/${bits / 8})`;
    }

    dom.plaintext.addEventListener('input', () => {
        dom.charCountEncrypt.textContent = `${dom.plaintext.value.length} ký tự`;
        updateKeyHint();
    });

    dom.secretKey.addEventListener('input', () => {
        updateKeyStrength(dom.secretKey.value, state.encKeyBits);
        updateKeyHint();
    });

    function updateKeyStrength(key, keyBits) {
        const reqLen = keyBits / 8;
        const len = key.length;
        let level = 0;
        if (len >= 1) level = 1;
        if (len >= Math.floor(reqLen * 0.5)) level = 2;
        if (len >= reqLen) level = 3;
        if (len >= reqLen && /[A-Z]/.test(key) && /[0-9!@#$%^&*]/.test(key)) level = 4;
        dom.keyStrengthBars.forEach((bar, i) => {
            bar.className = 'strength-bar';
            if (i < level) bar.classList.add(`level-${level}`);
        });
    }

    dom.btnToggleKey.addEventListener('click', () => {
        state.keyVisible = !state.keyVisible;
        dom.secretKey.type = state.keyVisible ? 'text' : 'password';
        dom.btnToggleKey.lastChild.textContent = state.keyVisible ? ' Ẩn key' : ' Hiện key';
    });

    dom.btnGenKey.addEventListener('click', () => {
        const reqLen = state.encKeyBits / 8;
        const bytes = crypto.getRandomValues(new Uint8Array(reqLen));
        const key = Array.from(bytes, b => String.fromCharCode((b % 94) + 33)).join('');
        dom.secretKey.value = key;
        dom.secretKey.type = 'text';
        state.keyVisible = true;
        dom.btnToggleKey.lastChild.textContent = ' Ẩn key';
        updateKeyStrength(key, state.encKeyBits);
        updateKeyHint();
        toast(`Key AES-${state.encKeyBits} đã được tạo ngẫu nhiên`);
    });

    dom.btnPastePlain.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            dom.plaintext.value = text;
            dom.plaintext.dispatchEvent(new Event('input'));
            toast('Đã dán từ clipboard');
        } catch { toast('Không thể truy cập clipboard', 'error'); }
    });

    dom.btnClearPlain.addEventListener('click', () => {
        dom.plaintext.value = '';
        dom.plaintext.dispatchEvent(new Event('input'));
        resetOutput();
    });

    dom.btnSample.addEventListener('click', () => {
        dom.plaintext.value = 'Hello, AES World! This is a secret message encrypted with Advanced Encryption Standard.';
        dom.plaintext.dispatchEvent(new Event('input'));
        toast('Đã điền văn bản mẫu');
    });

    dom.btnCopyCipher.addEventListener('click', async () => {
        if (!state.lastCipherHex) return;
        try {
            await navigator.clipboard.writeText(state.lastCipherHex);
            toast('Đã sao chép ciphertext HEX');
        } catch { toast('Không thể sao chép', 'error'); }
    });

    dom.btnEncrypt.addEventListener('click', async () => {
        const plaintext = dom.plaintext.value.trim();
        const key = dom.secretKey.value;

        if (!plaintext) { toast('Vui lòng nhập văn bản cần mã hóa', 'warn'); dom.plaintext.focus(); return; }
        if (!key) { toast('Vui lòng nhập secret key', 'warn'); dom.secretKey.focus(); return; }

        const reqLen = state.encKeyBits / 8;
        if (key.length < reqLen) {
            toast(`AES-${state.encKeyBits} cần ít nhất ${reqLen} ký tự key (hiện có ${key.length})`, 'warn');
            dom.secretKey.focus();
            return;
        }

        dom.btnEncrypt.classList.add('loading');
        dom.btnEncrypt.disabled = true;

        try {
            const resp = await fetch(`${API}/encrypt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: plaintext, key, keylen: state.encKeyBits }),
            });

            const data = await resp.json();
            if (!data.ok) throw new Error(data.error || 'Unknown server error');

            state.lastCipherHex = data.cipherHex;
            renderHexOutput(dom.cipherOutput, data.cipherHex);
            dom.btnCopyCipher.disabled = false;

            dom.metricTime.textContent = formatNs(data.timeNs);
            dom.metricPlainSize.textContent = `${data.plainLen} bytes`;
            dom.metricCipherSize.textContent = `${data.cipherLen} bytes`;
            dom.metricBlocks.textContent = `${data.blocks} khối`;
            dom.metricAlgo.textContent = `AES-${data.keylen} ECB [main.cpp]`;

            toast('Mã hóa thành công (C++ engine)!', 'success');
        } catch (err) {
            const msg = err.message.includes('fetch') || err.message.includes('Failed')
                ? 'Không kết nối được server.' : err.message;
            toast(`Lỗi: ${msg}`, 'error');
            resetOutput();
        } finally {
            dom.btnEncrypt.classList.remove('loading');
            dom.btnEncrypt.disabled = false;
        }
    });

    function resetOutput() {
        dom.cipherOutput.innerHTML = `
        <div class="output-placeholder">
          <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <rect x="6" y="6" width="36" height="36" rx="4" stroke="#00FF41" stroke-width="1.5" opacity="0.3"/>
            <path d="M15 18h18M15 24h12M15 30h15" stroke="#00FF41" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>
          </svg>
          <p>Kết quả mã hóa sẽ hiển thị tại đây</p>
        </div>`;
        dom.cipherOutput.classList.remove('has-data');
        dom.btnCopyCipher.disabled = true;
        state.lastCipherHex = null;
        dom.metricTime.textContent = '— ns';
        dom.metricPlainSize.textContent = '— bytes';
        dom.metricCipherSize.textContent = '— bytes';
        dom.metricBlocks.textContent = '—';
    }

    function renderHexOutput(container, hexStr) {
        container.innerHTML = '';
        container.classList.add('has-data');
        const bytes = hexStr.split(/\s+/).filter(Boolean);
        const COLS = 16;
        for (let i = 0; i < bytes.length; i += COLS) {
            const rowDiv = document.createElement('div');
            rowDiv.style.cssText = 'display:flex;flex-wrap:wrap;gap:1px;margin-bottom:3px;align-items:center;';
            const addr = document.createElement('span');
            addr.style.cssText = 'color:var(--text-muted);font-size:0.68rem;margin-right:8px;min-width:40px;font-family:"Share Tech Mono",monospace;';
            addr.textContent = (i).toString(16).padStart(4, '0').toUpperCase() + ':';
            rowDiv.appendChild(addr);
            for (let j = i; j < Math.min(i + COLS, bytes.length); j++) {
                const span = document.createElement('span');
                span.className = 'hex-byte';
                span.textContent = bytes[j];
                if (bytes[j] === '00') span.style.opacity = '0.3';
                rowDiv.appendChild(span);
            }
            container.appendChild(rowDiv);
        }
    }

    // Set initial mode text
    dom.metricAlgo.textContent = 'AES-128 ECB [main.cpp]';
}
