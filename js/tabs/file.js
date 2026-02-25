import { API } from '../state.js';
import { toast, formatNs } from '../utils.js';

export function initFileTabs() {
    function makeFileTab(suffix, mode, apiEndpoint) {
        const $ = id => document.getElementById(id);
        const zone = $(`file-drop-zone-${suffix}`);
        const input = $(`file-input-${suffix}`);
        const selected = $(`file-selected-${suffix}`);
        const nameEl = $(`file-name-${suffix}`);
        const sizeEl = $(`file-size-${suffix}`);
        const btnClear = $(`btn-clear-file-${suffix}`);
        const btnChange = $(`btn-change-file-${suffix}`);
        const keyInput = $(`file-key-${suffix}`);
        const btnToggleKey = $(`btn-toggle-file-key-${suffix}`);
        const btnAction = suffix === 'enc' ? $('btn-encrypt-file') : $('btn-decrypt-file');
        const placeholder = $(`file-result-placeholder-${suffix}`);
        const resultDone = $(`file-result-done-${suffix}`);
        const resultLabel = $(`file-result-label-${suffix}`);
        const dlLink = $(`file-download-link-${suffix}`);
        const dlName = $(`file-download-name-${suffix}`);
        const mIn = $(`file-metric-in-${suffix}`);
        const mOut = $(`file-metric-out-${suffix}`);
        const mTime = $(`file-metric-time-${suffix}`);
        const mBlocks = $(`file-metric-blocks-${suffix}`);
        const segBtns = document.querySelectorAll(`[id^="${suffix}-file-seg"]`);

        const strengthBars = suffix === 'enc' ? document.querySelectorAll('#key-strength-enc .strength-bar') : null;
        const keyHint = suffix === 'enc' ? $('key-hint-enc') : null;
        const btnGenKey = suffix === 'enc' ? $('btn-gen-key-enc') : null;

        if (!zone) return; // guard if tab not loaded

        let selectedFile = null;
        let keyBits = 128;
        let keyVisible = false;

        const STRENGTH_COLORS = ['#ff3a3a', '#ff8c00', '#ffe600', '#00FF41'];
        function updateKeyStrength() {
            if (!strengthBars) return;
            const len = keyInput.value.length;
            const required = keyBits / 8;
            let level = 0;
            if (len > 0) level = 1;
            if (len >= required * 0.5) level = 2;
            if (len >= required * 0.8) level = 3;
            if (len >= required) level = 4;

            strengthBars.forEach((bar, i) => {
                const active = i < level;
                bar.style.background = active ? STRENGTH_COLORS[level - 1] : '';
                bar.style.opacity = active ? '1' : '0.15';
                bar.style.boxShadow = active ? `0 0 6px ${STRENGTH_COLORS[level - 1]}` : 'none';
            });

            if (keyHint) {
                const need = required - len;
                if (len === 0)
                    keyHint.textContent = `AES-${keyBits}: cần ${required} ký tự`;
                else if (need > 0)
                    keyHint.textContent = `Cần thêm ${need} ký tự nữa (AES-${keyBits}: ${required} ký tự)`;
                else
                    keyHint.textContent = `✓ Key đủ độ dài cho AES-${keyBits}`;
                keyHint.style.color = level === 4 ? 'var(--green)' : level >= 2 ? '#ffe600' : '';
            }
        }

        function resetResult() {
            placeholder.style.display = '';
            resultDone.style.display = 'none';
            mIn.textContent = '— bytes'; mOut.textContent = '— bytes';
            mTime.textContent = '— ns'; mBlocks.textContent = '—';
            const old = dlLink.href;
            if (old && old.startsWith('blob:')) URL.revokeObjectURL(old);
            dlLink.href = '#';
        }

        function setFile(file) {
            selectedFile = file;
            if (!file) {
                zone.style.display = '';
                selected.style.display = 'none';
                input.value = '';
                return;
            }
            zone.style.display = 'none';
            selected.style.display = 'flex';
            nameEl.textContent = file.name;
            const kb = (file.size / 1024).toFixed(1);
            sizeEl.textContent = file.size < 1024 ? `${file.size} bytes` : `${kb} KB (${file.size.toLocaleString()} bytes)`;
            resetResult();
        }

        zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('dragover'); const f = e.dataTransfer.files[0]; if (f) setFile(f); });
        zone.addEventListener('click', () => input.click());
        zone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
        input.addEventListener('change', () => { if (input.files[0]) setFile(input.files[0]); });
        btnClear.addEventListener('click', () => setFile(null));
        btnChange.addEventListener('click', () => { setFile(null); setTimeout(() => input.click(), 50); });

        btnToggleKey.addEventListener('click', () => {
            keyVisible = !keyVisible;
            keyInput.type = keyVisible ? 'text' : 'password';
            btnToggleKey.lastChild.textContent = keyVisible ? ' Ẩn key' : ' Hiện key';
        });

        keyInput.addEventListener('input', updateKeyStrength);

        if (btnGenKey) {
            btnGenKey.addEventListener('click', () => {
                const len = keyBits / 8;
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
                const arr = new Uint8Array(len);
                crypto.getRandomValues(arr);
                keyInput.value = Array.from(arr).map(b => chars[b % chars.length]).join('');
                if (!keyVisible) { keyInput.type = 'text'; keyVisible = true; btnToggleKey.lastChild.textContent = ' Ẩn key'; }
                updateKeyStrength();
                toast('✓ Đã tạo random key!');
            });
        }

        segBtns.forEach(btn => btn.addEventListener('click', () => {
            segBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            keyBits = parseInt(btn.dataset.keylen);
            updateKeyStrength();
        }));

        updateKeyStrength();

        btnAction.addEventListener('click', async () => {
            const file = selectedFile;
            const key = keyInput.value;
            if (!file) { toast('Vui lòng chọn file', 'warn'); return; }
            if (!key) { toast('Vui lòng nhập secret key', 'warn'); keyInput.focus(); return; }
            const reqLen = keyBits / 8;
            if (key.length < reqLen) {
                toast(`AES-${keyBits} cần ít nhất ${reqLen} ký tự (hiện có ${key.length})`, 'warn');
                keyInput.focus(); return;
            }

            btnAction.classList.add('loading'); btnAction.disabled = true;
            try {
                const fd = new FormData();
                fd.append('file', file, file.name);
                fd.append('key', key);
                fd.append('keylen', String(keyBits));

                const resp = await fetch(`${API}${apiEndpoint.replace('/api', '')}`, { method: 'POST', body: fd });
                if (!resp.ok) {
                    const e = await resp.json().catch(() => ({ error: resp.statusText }));
                    throw new Error(e.error || `HTTP ${resp.status}`);
                }

                const inSize = resp.headers.get('X-AES-InputSize') || '?';
                const outSize = resp.headers.get('X-AES-OutputSize') || '?';
                const timeNs = parseFloat(resp.headers.get('X-AES-TimeNs') || '0');
                const blocks = resp.headers.get('X-AES-Blocks') || '?';
                const cd = resp.headers.get('Content-Disposition') || '';
                const fnMatch = cd.match(/filename\*=UTF-8''([^;\s]+)/) || cd.match(/filename="([^"]+)"/);
                const downloadName = fnMatch ? decodeURIComponent(fnMatch[1]) : (mode === 'encrypt' ? file.name + '.aes' : 'decrypted_' + file.name);

                const blob = await resp.blob();
                const blobUrl = URL.createObjectURL(blob);
                dlLink.href = blobUrl;
                dlLink.download = downloadName;
                dlName.textContent = `Tải xuống: ${downloadName}`;

                placeholder.style.display = 'none';
                resultDone.style.display = 'flex';
                resultLabel.textContent = mode === 'encrypt' ? `✓ Mã hóa thành công — ${downloadName}` : `✓ Giải mã thành công — ${downloadName}`;

                mIn.textContent = `${Number(inSize).toLocaleString()} bytes`;
                mOut.textContent = `${Number(outSize).toLocaleString()} bytes`;
                mTime.textContent = formatNs(timeNs);
                mBlocks.textContent = `${blocks} khối`;

                toast(mode === 'encrypt' ? '✓ File đã được mã hóa!' : '✓ File đã được giải mã!');
            } catch (err) {
                const msg = err.message.includes('fetch') || err.message.includes('Failed') ? 'Không kết nối được server.' : err.message;
                toast(`Lỗi: ${msg}`, 'error');
            } finally {
                btnAction.classList.remove('loading'); btnAction.disabled = false;
            }
        });
    }

    makeFileTab('enc', 'encrypt', '/api/encrypt-file');
    makeFileTab('dec', 'decrypt', '/api/decrypt-file');
}
