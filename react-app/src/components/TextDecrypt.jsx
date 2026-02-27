import { useState } from 'react';
import { toast } from './Toast.jsx';
import { decryptText } from '../utils/crypto.js';
import { useLanguage } from '../contexts/LanguageContext';

export default function TextDecrypt() {
    const [hexCipher, setHexCipher] = useState('');
    const [key, setKey] = useState('');
    const [keyBits, setKeyBits] = useState(128);
    const [keyVisible, setKeyVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const { t } = useLanguage();

    const handleDecrypt = async () => {
        if (!hexCipher.trim()) { toast(t('t_err_empty_text_dec'), 'warn'); return; }
        if (!key) { toast(t('t_err_empty_key'), 'warn'); return; }

        setLoading(true);
        try {
            const data = await decryptText(hexCipher, key, keyBits);
            setResult({
                text: data.text,
                timeNs: data.timeNs,
                algo: `AES-${keyBits} GCM`
            });
            toast(t('t_dec_success'), 'success');
        } catch (err) {
            toast(`${t('t_err_prefix')} ${t('t_err_dec_fail')}`, 'error');
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
                            <h2 className="card-title">{t('ciphertext_input')}</h2>
                        </div>
                    </div>
                    <div className="card-body">
                        <textarea
                            className="cyber-textarea hex-input"
                            placeholder={t('text_dec_placeholder')}
                            value={hexCipher}
                            onChange={(e) => setHexCipher(e.target.value)}
                        />
                        <div className="textarea-actions">
                            <button className="text-btn" onClick={async () => {
                                try { const t_text = await navigator.clipboard.readText(); setHexCipher(t_text); toast(t('t_pasted')); } catch { toast(t('t_err_paste'), 'error'); }
                            }}>{t('paste')}</button>
                            <button className="text-btn" onClick={() => { setHexCipher(''); setResult(null); }}>{t('clear')}</button>
                        </div>
                    </div>
                </div>

                <div className="glass-card">
                    <div className="card-header">
                        <h2 className="card-title">{t('secret_key')}</h2>
                    </div>
                    <div className="card-body key-body">
                        <div className="key-row">
                            <div className="form-group flex-1">
                                <label className="form-label">{t('algo_bits')}</label>
                                <div className="seg-control">
                                    {[128, 192, 256].map(b => (
                                        <button key={b} className={`seg-btn ${keyBits === b ? 'active' : ''}`} onClick={() => setKeyBits(b)}>{b}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <div className="label-row">
                                <label className="form-label">{t('secret_key')}</label>
                                <button className="text-btn" onClick={() => setKeyVisible(!keyVisible)}>
                                    {keyVisible ? t('hide') : t('show')}
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
                            <span className="btn-text">{t('btn_dec')}</span>
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
                            <h2 className="card-title">{t('decrypted_text')}</h2>
                        </div>
                        <button
                            className="icon-btn"
                            disabled={!result}
                            title="Copy"
                            onClick={() => { navigator.clipboard.writeText(result.text); toast(t('t_copied_text')); }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path></svg>
                        </button>
                    </div>
                    <div className="card-body">
                        {result ? (
                            <div className="output-display has-data" style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>{result.text}</div>
                        ) : (
                            <div className="output-display output-placeholder">
                                <p>{t('dec_result_placeholder')}</p>
                            </div>
                        )}
                        <div className="metrics-body" style={{ marginTop: '1rem' }}>
                            <div className="metric-item">
                                <span className="metric-label">{t('exec_time')}</span>
                                <span className="metric-val">{result ? `${(result.timeNs / 1000000).toFixed(2)} ms` : '— ms'}</span>
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
