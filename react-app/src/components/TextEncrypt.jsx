import { useState, useRef, useEffect } from 'react';
import { toast } from './Toast.jsx';
import { encryptText } from '../utils/crypto.js';
import { useLanguage } from '../contexts/LanguageContext';

export default function TextEncrypt() {
    const [plaintext, setPlaintext] = useState('');
    const [key, setKey] = useState('');
    const [keyBits, setKeyBits] = useState(128);
    const [keyVisible, setKeyVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const { t } = useLanguage();

    // Dynamic hints
    const reqLen = keyBits / 8;
    const keyStrength = () => {
        const len = key.length;
        if (len === 0) return 0;
        if (len >= reqLen && /[A-Z]/.test(key) && /[0-9!@#$%^&*]/.test(key)) return 4;
        if (len >= reqLen) return 3;
        if (len >= reqLen * 0.5) return 2;
        return 1;
    };

    const strength = keyStrength();

    const handleGenKey = () => {
        if (key && !window.confirm(t('t_confirm_random'))) return;
        const bytes = window.crypto.getRandomValues(new Uint8Array(reqLen));
        const newKey = Array.from(bytes, b => String.fromCharCode((b % 94) + 33)).join('');
        setKey(newKey);
        setKeyVisible(true);
        toast(t('t_key_gen', { bits: keyBits }));
    };

    const handleEncrypt = async () => {
        if (!plaintext.trim()) { toast(t('t_err_empty_text_enc'), 'warn'); return; }
        if (!key) { toast(t('t_err_empty_key'), 'warn'); return; }
        if (key.length < reqLen) { toast(t('t_err_key_len', { bits: keyBits, req: reqLen }), 'warn'); return; }

        setLoading(true);
        try {
            const data = await encryptText(plaintext, key, keyBits);
            setResult({
                hex: data.hex,
                timeNs: data.timeNs,
                plainLen: data.plainLen,
                cipherLen: data.cipherLen,
                blocks: Math.ceil(data.cipherLen / 16),
                algo: `AES-${keyBits} GCM [WebCrypto API]`
            });
            toast(t('t_enc_success'), 'success');
        } catch (err) {
            toast(`${t('t_err_prefix')} ${err.message}`, 'error');
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
                            <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            <h2 className="card-title">{t('input_data')}</h2>
                        </div>
                        <span className="char-count">{plaintext.length} {t('chars')}</span>
                    </div>
                    <div className="card-body">
                        <textarea
                            className="cyber-textarea"
                            placeholder={t('text_enc_placeholder')}
                            value={plaintext}
                            onChange={(e) => setPlaintext(e.target.value)}
                        />
                        <div className="textarea-actions">
                            <button className="text-btn" onClick={async () => {
                                try { const t_text = await navigator.clipboard.readText(); setPlaintext(t_text); toast(t('t_pasted')); } catch { toast(t('t_err_paste'), 'error'); }
                            }}>{t('paste')}</button>
                            <button className="text-btn" onClick={() => { setPlaintext(''); setResult(null); }}>{t('clear')}</button>
                        </div>
                    </div>
                </div>

                <div className="glass-card">
                    <div className="card-header">
                        <div className="card-title-row">
                            <h2 className="card-title">{t('secret_key')}</h2>
                        </div>
                    </div>
                    <div className="card-body key-body">
                        <div className="key-row">
                            <div className="form-group flex-1">
                                <div className="label-row">
                                    <label className="form-label">{t('algo_bits')}</label>
                                </div>
                                <div className="seg-control">
                                    {[128, 192, 256].map(b => (
                                        <button key={b} className={`seg-btn ${keyBits === b ? 'active' : ''}`} onClick={() => setKeyBits(b)}>{b}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="key-len-info">
                                <div className="info-badge">
                                    <span className="info-label">LEN</span>
                                    <span className="info-val">{reqLen} {t('bytes')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <div className="label-row">
                                <label className="form-label">{t('secret_key')}</label>
                                <div className="key-actions">
                                    <button className="text-btn" onClick={handleGenKey}>{t('random')}</button>
                                    <button className="text-btn" onClick={() => setKeyVisible(!keyVisible)}>
                                        {keyVisible ? t('hide') : t('show')}
                                    </button>
                                </div>
                            </div>
                            <input
                                type={keyVisible ? 'text' : 'password'}
                                className="cyber-input"
                                placeholder="..."
                                value={key}
                                onChange={e => setKey(e.target.value)}
                            />
                            <div className="key-strength">
                                {[1, 2, 3, 4].map(l => (
                                    <div key={l} className={`strength-bar ${l <= strength ? `level-${strength}` : ''}`} />
                                ))}
                            </div>
                            <div className="form-hint">
                                {t('key_hint', { bits: keyBits, req: reqLen, cur: key.length })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="panel-col">
                <div className="action-center">
                    <button className={`cyber-btn ${loading ? 'loading' : ''}`} onClick={handleEncrypt} disabled={loading}>
                        <div className="btn-glow"></div>
                        <div className="btn-inner">
                            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0110 0v4"></path>
                            </svg>
                            <span className="btn-text">{t('btn_enc')}</span>
                            <div className="btn-loader">
                                <span className="loader-dot"></span>
                                <span className="loader-dot"></span>
                                <span className="loader-dot"></span>
                            </div>
                        </div>
                    </button>
                </div>

                <div className="glass-card output-card">
                    <div className="card-header">
                        <div className="card-title-row">
                            <h2 className="card-title">{t('ciphertext_hex')}</h2>
                        </div>
                        <button
                            className="icon-btn"
                            disabled={!result}
                            title={t('copy_hex')}
                            onClick={() => { navigator.clipboard.writeText(result.hex); toast(t('t_copied_hex')); }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path></svg>
                        </button>
                    </div>
                    <div className="card-body">
                        {result ? (
                            <div className="output-display has-data" style={{ whiteSpace: 'pre-wrap' }}>{result.hex}</div>
                        ) : (
                            <div className="output-display output-placeholder">
                                <p>{t('enc_result_placeholder')}</p>
                            </div>
                        )}

                        <div className="metrics-body" style={{ marginTop: '1rem' }}>
                            <div className="metric-item">
                                <span className="metric-label">{t('exec_time')}</span>
                                <span className="metric-val">{result ? `${(result.timeNs / 1000000).toFixed(2)} ms` : '— ms'}</span>
                            </div>
                            <div className="metric-item">
                                <span className="metric-label">{t('size_plain_cipher')}</span>
                                <span className="metric-val">{result ? `${result.plainLen} / ${result.cipherLen} bytes` : `— ${t('bytes')}`}</span>
                            </div>
                            <div className="metric-item">
                                <span className="metric-label">{t('algorithm')}</span>
                                <span className="metric-val">{result ? result.algo : '—'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
