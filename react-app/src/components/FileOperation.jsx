import { useState, useRef } from 'react';
import { toast } from './Toast.jsx';
import { encryptFile, decryptFile } from '../utils/fileCrypto.js';
import { useLanguage } from '../contexts/LanguageContext';

// Helper: lấy extension và icon màu
function getFileInfo(file) {
    const ext = file.name.split('.').pop().toUpperCase() || 'FILE';
    const sizeKB = file.size / 1024;
    const size = sizeKB >= 1024
        ? `${(sizeKB / 1024).toFixed(2)} MB`
        : `${sizeKB.toFixed(2)} KB`;
    return { ext, size };
}

export default function FileOperation({ mode = 'encrypt' }) {
    const isEncrypt = mode === 'encrypt';
    const { t } = useLanguage();
    const [file, setFile] = useState(null);
    const [key, setKey] = useState('');
    const [keyBits, setKeyBits] = useState(128);
    const [keyVisible, setKeyVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef(null);

    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (f) { setFile(f); setResult(null); }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) { setFile(f); setResult(null); }
    };

    const handleAction = async () => {
        if (!file) { toast(t('t_err_file_req'), 'warn'); return; }
        if (!key) { toast(t('t_err_empty_key'), 'warn'); return; }

        setLoading(true);
        setProgress(0);
        setResult(null);

        // Fake progress animation
        const tick = setInterval(() => {
            setProgress(p => {
                if (p >= 85) { clearInterval(tick); return p; }
                return p + Math.random() * 12;
            });
        }, 180);

        try {
            let data;
            if (isEncrypt) {
                data = await encryptFile(file, key, keyBits);
                toast(t('t_file_enc_success', { name: file.name }), 'success');
            } else {
                data = await decryptFile(file, key, keyBits);
                toast(t('t_file_dec_success', { name: file.name }), 'success');
            }
            clearInterval(tick);
            setProgress(100);
            setTimeout(() => { setResult(data); setLoading(false); }, 400);
        } catch (err) {
            clearInterval(tick);
            toast(`${t('t_err_prefix')} ${err.message}`, 'error');
            setResult(null);
            setLoading(false);
            setProgress(0);
        }
    };

    const fileInfo = file ? getFileInfo(file) : null;
    const accent = isEncrypt ? 'var(--green)' : 'var(--cyan)';
    const accentDim = isEncrypt ? 'rgba(0,255,65,0.10)' : 'rgba(0,255,255,0.10)';
    const accentGlow = isEncrypt ? 'rgba(0,255,65,0.35)' : 'rgba(0,255,255,0.35)';

    return (
        <div className="fo-wrapper">
            {/* ── LEFT COLUMN ── */}
            <div className="fo-col">

                {/* FILE DROP CARD */}
                <div className="glass-card fo-card">
                    <div className="card-header">
                        <div className="fo-card-title-row">
                            <svg className="fo-card-icon" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5">
                                <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
                                <polyline points="13 2 13 9 20 9" />
                            </svg>
                            <h2 className="card-title">{t('input_file')}</h2>
                        </div>
                        {file && (
                            <span className="fo-ext-badge" style={{ borderColor: accent, color: accent }}>
                                .{fileInfo.ext}
                            </span>
                        )}
                    </div>

                    <div className="card-body">
                        {!file ? (
                            <div
                                className={`file-drop-zone fo-drop${isDragOver ? ' dragover' : ''}`}
                                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => inputRef.current.click()}
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && inputRef.current.click()}
                                aria-label={t('drop_file')}
                            >
                                {/* Animated corner brackets */}
                                <span className="fo-corner fo-corner-tl" style={{ borderColor: accent }} />
                                <span className="fo-corner fo-corner-tr" style={{ borderColor: accent }} />
                                <span className="fo-corner fo-corner-bl" style={{ borderColor: accent }} />
                                <span className="fo-corner fo-corner-br" style={{ borderColor: accent }} />

                                <svg className="fo-upload-icon" viewBox="0 0 64 64" fill="none">
                                    <rect x="8" y="8" width="32" height="40" rx="4" stroke={accent} strokeWidth="1.5" opacity="0.5" />
                                    <path d="M24 8v8h16" stroke={accent} strokeWidth="1.5" opacity="0.5" />
                                    <circle cx="46" cy="46" r="12" fill="rgba(0,0,0,0.6)" stroke={accent} strokeWidth="1.5" />
                                    <path d="M46 41v10M41 46l5-5 5 5" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>

                                <div className="fo-drop-text" style={{ padding: '0 20px' }}>
                                    <div className="fo-drop-main" style={{ color: 'var(--text-primary)', wordBreak: 'break-word', whiteSpace: 'normal', textAlign: 'center' }}>
                                        {t('drop_file')}
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    style={{ display: 'none' }}
                                    ref={inputRef}
                                    onChange={handleFileChange}
                                />
                            </div>
                        ) : (
                            <div className="fo-file-selected" style={{ borderColor: `${accent}44`, background: accentDim }}>
                                <div className="fo-file-icon-wrap" style={{ background: `${accent}18`, borderColor: `${accent}55` }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5" width="28" height="28">
                                        <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
                                        <polyline points="13 2 13 9 20 9" />
                                    </svg>
                                </div>
                                <div className="fo-file-meta">
                                    <div className="fo-file-name">{file.name}</div>
                                    <div className="fo-file-size">
                                        <span className="fo-size-badge">{fileInfo.ext}</span>
                                        {fileInfo.size}
                                    </div>
                                </div>
                                <button
                                    className="fo-remove-btn"
                                    onClick={() => { setFile(null); setResult(null); setProgress(0); }}
                                    aria-label={t('clear')}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* SECRET KEY CARD */}
                <div className="glass-card fo-card">
                    <div className="card-header">
                        <div className="fo-card-title-row">
                            <svg className="fo-card-icon" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5">
                                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                            </svg>
                            <h2 className="card-title">{t('secret_key')}</h2>
                        </div>
                        <div className="fo-bits-indicator" style={{ color: accent }}>
                            AES-{keyBits}
                        </div>
                    </div>
                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Key Bits Selector */}
                        <div>
                            <label className="form-label">{t('algo_bits')}</label>
                            <div className="seg-control">
                                {[128, 192, 256].map(b => (
                                    <button
                                        key={b}
                                        className={`seg-btn ${keyBits === b ? 'active' : ''}`}
                                        onClick={() => setKeyBits(b)}
                                        style={keyBits === b ? { color: accent, boxShadow: `0 0 10px ${accentGlow}` } : {}}
                                    >
                                        {b}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Key Input */}
                        <div>
                            <div className="label-row">
                                <label className="form-label">{t('secret_key')}</label>
                                <button className="text-btn" onClick={() => setKeyVisible(!keyVisible)}>
                                    {keyVisible ? (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20..." />
                                            <path d="M1 1l22 22" />
                                        </svg>
                                    ) : null}
                                    {keyVisible ? t('hide') : t('show')}
                                </button>
                            </div>
                            <div className="fo-key-wrap">
                                <svg className="fo-key-prefix-icon" viewBox="0 0 24 24" fill="none" stroke={key ? accent : 'var(--text-muted)'} strokeWidth="1.5" width="16" height="16">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <input
                                    type={keyVisible ? 'text' : 'password'}
                                    className="cyber-input fo-key-input"
                                    placeholder="Nhập passphrase bí mật..."
                                    value={key}
                                    onChange={e => setKey(e.target.value)}
                                    autoComplete="off"
                                />
                            </div>
                            {/* Strength bar */}
                            <div className="fo-strength">
                                {[0, 1, 2, 3, 4].map(i => {
                                    const strength = Math.min(5, Math.floor(key.length / 4));
                                    const active = i < strength;
                                    const colors = ['var(--red)', 'var(--orange)', '#ccff00', '#ccff00', 'var(--green)'];
                                    return (
                                        <div
                                            key={i}
                                            className="fo-strength-bar"
                                            style={active ? { background: colors[Math.min(i, 4)], boxShadow: `0 0 4px ${colors[Math.min(i, 4)]}` } : {}}
                                        />
                                    );
                                })}
                                <span className="fo-strength-label">
                                    {key.length === 0 ? '' :
                                        key.length < 4 ? 'YẾU' :
                                            key.length < 8 ? 'TRUNG BÌNH' :
                                                key.length < 16 ? 'KHÁ' :
                                                    key.length < 20 ? 'MẠNH' : 'RẤT MẠNH'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── CENTER ACTION ── */}
            <div className="fo-center">
                {/* Vertical flow line top */}
                <div className="fo-vline" style={{ background: `linear-gradient(to bottom, transparent, ${accent})` }} />

                {/* Main button */}
                <div className="fo-action-wrap">
                    <button
                        className={`cyber-btn ${!isEncrypt ? 'decrypt-btn' : ''} ${loading ? 'loading' : ''}`}
                        onClick={handleAction}
                        disabled={loading}
                        aria-label={isEncrypt ? t('exec_enc_btn') : t('exec_dec_btn')}
                    >
                        <div className={`btn-glow ${!isEncrypt ? 'decrypt-glow' : ''}`} />
                        <div className="btn-inner">
                            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {isEncrypt
                                    ? <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>
                                    : <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></>
                                }
                            </svg>
                            <span className="btn-text">{isEncrypt ? t('exec_enc_btn') : t('exec_dec_btn')}</span>
                            <div className="btn-loader">
                                <span className="loader-dot" /><span className="loader-dot" /><span className="loader-dot" />
                            </div>
                        </div>
                    </button>

                    {/* Progress bar */}
                    {loading && (
                        <div className="fo-progress-wrap">
                            <div className="fo-progress-track">
                                <div
                                    className="fo-progress-bar"
                                    style={{ width: `${Math.min(progress, 100)}%`, background: `linear-gradient(90deg, ${accent}, ${isEncrypt ? '#00cc33' : '#0099cc'})` }}
                                />
                            </div>
                            <span className="fo-progress-pct" style={{ color: accent }}>{Math.round(Math.min(progress, 100))}%</span>
                        </div>
                    )}
                </div>

                {/* Vertical flow line bottom */}
                <div className="fo-vline" style={{ background: `linear-gradient(to bottom, ${accent}, transparent)` }} />
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="fo-col">
                <div className="glass-card fo-card fo-result-card">
                    <div className="card-header">
                        <div className="fo-card-title-row">
                            <svg className="fo-card-icon" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                            </svg>
                            <h2 className="card-title">{t('output_file')}</h2>
                        </div>
                        {result && (
                            <span className="fo-status-chip" style={{ borderColor: accent, color: accent, background: accentDim }}>
                                ✓ DONE
                            </span>
                        )}
                    </div>

                    <div className="card-body fo-result-body">
                        {loading ? (
                            /* Processing state */
                            <div className="fo-processing">
                                <div className="fo-scan-lines" />
                                <div className="fo-processing-icon" style={{ borderColor: accent, boxShadow: `0 0 30px ${accentGlow}` }}>
                                    <svg viewBox="0 0 48 48" fill="none" stroke={accent} strokeWidth="1.5" width="48" height="48">
                                        <circle cx="24" cy="24" r="18" opacity="0.2" />
                                        <path d="M24 6a18 18 0 0 1 18 18" strokeLinecap="round">
                                            <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="1s" repeatCount="indefinite" />
                                        </path>
                                        <path d="M12 24l4 4 8-8" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                                    </svg>
                                </div>
                                <p className="fo-processing-text" style={{ color: accent }}>
                                    {t('processing')}
                                </p>
                                <p className="fo-processing-sub">Đang xử lý dữ liệu với AES-{keyBits}</p>
                            </div>
                        ) : !result ? (
                            /* Empty state */
                            <div className="fo-empty-state">
                                <div className="fo-empty-icon">
                                    <svg viewBox="0 0 64 64" fill="none" width="64" height="64">
                                        <rect x="10" y="10" width="28" height="36" rx="3" stroke="var(--border-normal)" strokeWidth="1.5" strokeDasharray="4 3" />
                                        <path d="M28 10v10h10" stroke="var(--border-normal)" strokeWidth="1.5" />
                                        <path d="M46 38l-8 8" stroke="var(--border-normal)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                                        <circle cx="50" cy="34" r="8" stroke="var(--border-normal)" strokeWidth="1.5" strokeDasharray="3 2" />
                                    </svg>
                                </div>
                                <p className="fo-empty-title">{!isEncrypt ? t('dec_result_placeholder') : t('enc_result_placeholder')}</p>
                            </div>
                        ) : (
                            /* Success state */
                            <div className="fo-success file-result-done">
                                {/* Check icon */}
                                <div className="fo-success-icon" style={{ borderColor: accent, background: accentDim, boxShadow: `0 0 24px ${accentGlow}` }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" width="40" height="40">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </div>

                                <h3 className="fo-success-label" style={{ color: accent, textShadow: `0 0 12px ${accentGlow}` }}>
                                    {isEncrypt ? t('t_enc_success') : t('t_dec_success')}
                                </h3>

                                {/* Download button */}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const a = document.createElement('a');
                                        a.style.display = 'none';
                                        a.href = result.url;
                                        a.download = result.downloadName || 'output.aes';
                                        document.body.appendChild(a);
                                        a.click();
                                        setTimeout(() => document.body.removeChild(a), 500);
                                    }}
                                    className="fo-download-btn"
                                    style={{ borderColor: accent, color: accent, background: accentDim, cursor: 'pointer', border: '1px solid', padding: '10px 15px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', fontFamily: 'inherit', fontSize: '0.9rem' }}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    <span>{t('download')}</span>
                                    <span className="fo-dl-name">{result.downloadName}</span>
                                </button>

                                {/* Metrics */}
                                <div className="fo-metrics">
                                    <div className="fo-metric-row">
                                        <span className="fo-metric-key">Input Size</span>
                                        <span className="fo-metric-val" style={{ color: accent }}>{result.inSize.toLocaleString()} bytes</span>
                                    </div>
                                    <div className="fo-metric-row">
                                        <span className="fo-metric-key">Output Size</span>
                                        <span className="fo-metric-val" style={{ color: accent }}>{result.outSize.toLocaleString()} bytes</span>
                                    </div>
                                    <div className="fo-metric-row">
                                        <span className="fo-metric-key">Time</span>
                                        <span className="fo-metric-val" style={{ color: accent }}>{(result.timeNs / 1_000_000).toFixed(2)} ms</span>
                                    </div>
                                    <div className="fo-metric-row">
                                        <span className="fo-metric-key">Algorithm</span>
                                        <span className="fo-metric-val" style={{ color: accent }}>AES-{keyBits}-CBC</span>
                                    </div>
                                </div>

                                {/* Reset button */}
                                <button
                                    className="fo-reset-btn"
                                    onClick={() => { setFile(null); setResult(null); setKey(''); setProgress(0); }}
                                >
                                    Xử lý file khác
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
