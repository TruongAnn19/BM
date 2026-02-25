import { state, API } from '../state.js';
import { toast, formatNs } from '../utils.js';

export function initDecrypt() {
    const dom = {
        ciphertext: document.getElementById('ciphertext'),
        decKey: document.getElementById('dec-key'),
        btnDecrypt: document.getElementById('btn-decrypt'),
        btnPasteCipher: document.getElementById('btn-paste-cipher'),
        btnClearCipher: document.getElementById('btn-clear-cipher'),
        btnCopyDecrypted: document.getElementById('btn-copy-decrypted'),
        btnToggleDecKey: document.getElementById('btn-toggle-dec-key'),
        charCountDecrypt: document.getElementById('char-count-decrypt'),
        decryptedOutput: document.getElementById('decrypted-output'),
        decMetricTime: document.getElementById('dec-metric-time'),
        decMetricBlocks: document.getElementById('dec-metric-blocks'),
        decMetricStatus: document.getElementById('dec-metric-status')
    };

    document.querySelectorAll('#panel-decrypt .seg-btn[data-keylen]').forEach(btn => {
        btn.addEventListener('click', () => {
            const group = btn.closest('.seg-control');
            group.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.decKeyBits = parseInt(btn.dataset.keylen);
        });
    });

    dom.ciphertext.addEventListener('input', () => {
        dom.charCountDecrypt.textContent = `${dom.ciphertext.value.length} ký tự`;
    });

    dom.btnToggleDecKey.addEventListener('click', () => {
        state.decKeyVisible = !state.decKeyVisible;
        dom.decKey.type = state.decKeyVisible ? 'text' : 'password';
        dom.btnToggleDecKey.lastChild.textContent = state.decKeyVisible ? ' Ẩn key' : ' Hiện key';
    });

    dom.btnPasteCipher.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            dom.ciphertext.value = text;
            dom.ciphertext.dispatchEvent(new Event('input'));
            toast('Đã dán từ clipboard');
        } catch { toast('Không thể truy cập clipboard', 'error'); }
    });

    dom.btnClearCipher.addEventListener('click', () => {
        dom.ciphertext.value = '';
        dom.ciphertext.dispatchEvent(new Event('input'));
        resetOutput();
    });

    dom.btnCopyDecrypted.addEventListener('click', async () => {
        const text = dom.decryptedOutput.dataset.plain || '';
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            toast('Đã sao chép văn bản giải mã');
        } catch { toast('Không thể sao chép', 'error'); }
    });

    dom.btnDecrypt.addEventListener('click', async () => {
        const hexCipher = dom.ciphertext.value.trim();
        const key = dom.decKey.value;

        if (!hexCipher) { toast('Vui lòng nhập ciphertext dạng HEX', 'warn'); dom.ciphertext.focus(); return; }
        if (!key) { toast('Vui lòng nhập secret key', 'warn'); dom.decKey.focus(); return; }

        dom.btnDecrypt.classList.add('loading');
        dom.btnDecrypt.disabled = true;

        try {
            const resp = await fetch(`${API}/decrypt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hexCipher, key, keylen: state.decKeyBits }),
            });

            const data = await resp.json();
            if (!data.ok) throw new Error(data.error || 'Unknown server error');

            const outEl = dom.decryptedOutput;
            outEl.innerHTML = '';
            outEl.classList.add('has-data');
            outEl.style.color = 'var(--text-primary)';
            outEl.style.fontFamily = "'Fira Code', monospace";
            outEl.textContent = data.plaintext || '(Kết quả rỗng)';
            outEl.dataset.plain = data.plaintext;

            dom.btnCopyDecrypted.disabled = false;

            dom.decMetricTime.textContent = formatNs(data.timeNs);
            dom.decMetricBlocks.textContent = `${data.blocks} khối`;
            dom.decMetricStatus.textContent = '✓ Giải mã thành công';
            dom.decMetricStatus.style.color = 'var(--green)';

            toast('Giải mã thành công (C++ engine)!', 'success');
        } catch (err) {
            const msg = err.message.includes('fetch') || err.message.includes('Failed')
                ? 'Không kết nối được server.' : err.message;
            toast(`Lỗi: ${msg}`, 'error');
            dom.decMetricStatus.textContent = '✗ Thất bại';
            dom.decMetricStatus.style.color = 'var(--red)';
            resetOutput();
        } finally {
            dom.btnDecrypt.classList.remove('loading');
            dom.btnDecrypt.disabled = false;
        }
    });

    function resetOutput() {
        dom.decryptedOutput.innerHTML = `
        <div class="output-placeholder">
          <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <path d="M10 14h28M10 20h20M10 26h24M10 32h16" stroke="#00FF41" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>
          </svg>
          <p>Văn bản giải mã sẽ hiển thị tại đây</p>
        </div>`;
        dom.decryptedOutput.classList.remove('has-data');
        dom.decryptedOutput.style.color = '';
        dom.decryptedOutput.style.fontFamily = '';
        delete dom.decryptedOutput.dataset.plain;
        dom.btnCopyDecrypted.disabled = true;
    }
}
