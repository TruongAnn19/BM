import { useState } from 'react';
import { toast } from './Toast.jsx';
import { decryptText } from '../utils/crypto.js';

export default function TextDecrypt() {
    const [hexCipher, setHexCipher] = useState('');
    const [key, setKey] = useState('');
    const [keyBits, setKeyBits] = useState(128);
    const [keyVisible, setKeyVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleDecrypt = async () => {
        if (!hexCipher.trim()) { toast('Vui lòng nhập ciphertext dạng HEX', 'warn'); return; }
        if (!key) { toast('Vui lòng nhập secret key', 'warn'); return; }

        setLoading(true);
        try {
            const data = await decryptText(hexCipher, key, keyBits);
            setResult({
                text: data.text,
                timeNs: data.timeNs,
                algo: `AES-${keyBits} GCM`
            });
            toast('Giải mã thành công!', 'success');
        } catch (err) {
            toast(`Lỗi giải mã: Check lại Key hoặc mode/bits`, 'error');
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="panel-grid">
            <div className="panel-col">
                <div className="glass-card">
                    <div className="card-header">
                        <div className="card-title-row">
                            <h2 className="card-title">CIPHERTEXT INPUT (HEX)</h2>
                        </div>
                    </div>
                    <div className="card-body">
                        <textarea
                            className="cyber-textarea hex-input"
                            placeholder="Nhập chuỗi HEX..."
                            value={hexCipher}
                            onChange={(e) => setHexCipher(e.target.value)}
                        />
                        <div className="textarea-actions">
                            <button className="text-btn" onClick={async () => {
                                try { const t = await navigator.clipboard.readText(); setHexCipher(t); toast('Đã dán'); } catch { toast('Lỗi clipboard', 'error'); }
                            }}>Paste</button>
                            <button className="text-btn" onClick={() => { setHexCipher(''); setResult(null); }}>Clear</button>
                        </div>
                    </div>
                </div>

                <div className="glass-card">
                    <div className="card-header">
                        <h2 className="card-title">DECRYPTION KEY</h2>
                    </div>
                    <div className="card-body key-body">
                        <div className="key-row">
                            <div className="form-group flex-1">
                                <label className="form-label">THUẬT TOÁN (BITS)</label>
                                <div className="seg-control">
                                    {[128, 192, 256].map(b => (
                                        <button key={b} className={`seg-btn ${keyBits === b ? 'active' : ''}`} onClick={() => setKeyBits(b)}>{b}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <div className="label-row">
                                <label className="form-label">SECRET KEY</label>
                                <button className="text-btn" onClick={() => setKeyVisible(!keyVisible)}>
                                    {keyVisible ? 'Ẩn' : 'Hiện'}
                                </button>
                            </div>
                            <input
                                type={keyVisible ? 'text' : 'password'}
                                className="cyber-input"
                                placeholder="..."
                                value={key}
                                onChange={e => setKey(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="panel-col">
                <div className="action-center">
                    <button className={`cyber-btn decrypt-btn ${loading ? 'loading' : ''}`} onClick={handleDecrypt} disabled={loading}>
                        <div className="btn-glow decrypt-glow"></div>
                        <div className="btn-inner">
                            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"></path></svg>
                            <span className="btn-text">GIẢI MÃ AES</span>
                        </div>
                    </button>
                </div>

                <div className="glass-card output-card">
                    <div className="card-header">
                        <div className="card-title-row">
                            <h2 className="card-title">DECRYPTED TEXT</h2>
                        </div>
                        <button
                            className="icon-btn"
                            disabled={!result}
                            title="Copy Text"
                            onClick={() => { navigator.clipboard.writeText(result.text); toast('Đã copy văn bản'); }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path></svg>
                        </button>
                    </div>
                    <div className="card-body">
                        {result ? (
                            <div className="output-display has-data" style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>{result.text}</div>
                        ) : (
                            <div className="output-display output-placeholder">
                                <p>Văn bản giải mã sẽ hiển thị tại đây</p>
                            </div>
                        )}
                        <div className="metrics-body" style={{ marginTop: '1rem' }}>
                            <div className="metric-item">
                                <span className="metric-label">Execution Time</span>
                                <span className="metric-val">{result ? `${(result.timeNs / 1000000).toFixed(2)} ms` : '— ms'}</span>
                            </div>
                            <div className="metric-item">
                                <span className="metric-label">Algorithm</span>
                                <span className="metric-val">{result ? result.algo : '—'}</span>
                            </div>
                            <div className="metric-item">
                                <span className="metric-label">Lưu ý</span>
                                <span className="metric-val">Dùng WebCrypto AES-GCM</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
