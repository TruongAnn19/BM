import { useState, useRef } from 'react';
import { toast } from './Toast.jsx';
import { encryptFile, decryptFile } from '../utils/fileCrypto.js';

export default function FileOperation({ mode = 'encrypt' }) {
    const isEncrypt = mode === 'encrypt';
    const [file, setFile] = useState(null);
    const [key, setKey] = useState('');
    const [keyBits, setKeyBits] = useState(128);
    const [keyVisible, setKeyVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const inputRef = useRef(null);

    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (f) {
            setFile(f);
            setResult(null);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f) {
            setFile(f);
            setResult(null);
        }
    };

    const handleAction = async () => {
        if (!file) { toast('Vui lòng chọn file', 'warn'); return; }
        if (!key) { toast('Vui lòng nhập secret key', 'warn'); return; }

        setLoading(true);
        try {
            let data;
            if (isEncrypt) {
                data = await encryptFile(file, key, keyBits);
                toast('Mã hóa thành công!', 'success');
            } else {
                data = await decryptFile(file, key, keyBits);
                toast('Giải mã thành công!', 'success');
            }
            setResult(data);
        } catch (err) {
            toast(`Lỗi: ${err.message}`, 'error');
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
                        <h2 className="card-title">{isEncrypt ? 'ENCRYPT FILE' : 'DECRYPT FILE'}</h2>
                    </div>
                    <div className="card-body">
                        {!file ? (
                            <div
                                className="file-drop-zone"
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
                                onDragLeave={(e) => e.currentTarget.classList.remove('dragover')}
                                onDrop={handleDrop}
                                onClick={() => inputRef.current.click()}
                            >
                                <svg className="file-drop-icon" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5">
                                    <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"></path>
                                    <polyline points="13 2 13 9 20 9"></polyline>
                                </svg>
                                <div>
                                    <div className="file-drop-main">Kéo thả file vào đây</div>
                                    <div className="file-drop-sub">hoặc <span className="file-drop-link">Bấm để chọn file</span></div>
                                </div>
                            </div>
                        ) : (
                            <div className="file-selected" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '10px' }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div className="file-name">{file.name}</div>
                                        <div className="file-size">{(file.size / 1024).toFixed(2)} KB</div>
                                    </div>
                                    <button className="icon-btn" onClick={() => { setFile(null); setResult(null); }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            </div>
                        )}
                        <input type="file" className="file-input-hidden" style={{ display: 'none' }} ref={inputRef} onChange={handleFileChange} />
                    </div>
                </div>

                <div className="glass-card">
                    <div className="card-header"><h2 className="card-title">SECRET KEY</h2></div>
                    <div className="card-body key-body">
                        <div className="form-group flex-1">
                            <label className="form-label">THUẬT TOÁN (BITS)</label>
                            <div className="seg-control">
                                {[128, 192, 256].map(b => (
                                    <button key={b} className={`seg-btn ${keyBits === b ? 'active' : ''}`} onClick={() => setKeyBits(b)}>{b}</button>
                                ))}
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
                    <button className={`cyber-btn ${!isEncrypt ? 'decrypt-btn' : ''} ${loading ? 'loading' : ''}`} onClick={handleAction} disabled={loading}>
                        <div className={`btn-glow ${!isEncrypt ? 'decrypt-glow' : ''}`}></div>
                        <div className="btn-inner">
                            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4a2 2 0 0 1 2-2h5l5 5v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z"></path></svg>
                            <span className="btn-text">{isEncrypt ? 'MÃ HÓA FILE' : 'GIẢI MÃ FILE'}</span>
                            <div className="btn-loader"><span className="loader-dot"></span><span className="loader-dot"></span><span className="loader-dot"></span></div>
                        </div>
                    </button>
                </div>

                <div className="glass-card output-card">
                    <div className="card-body">
                        {!result ? (
                            <div className="file-result-area">
                                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="var(--green)" strokeWidth="1.5">
                                    <path d="M24 12V36M12 24H36" />
                                </svg>
                                <p>Kết quả sẽ hiển thị ở đây</p>
                            </div>
                        ) : (
                            <div className="file-result-area file-result-done">
                                <div className="file-result-check">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                </div>
                                <h3 className="file-result-label">{isEncrypt ? 'Mã hóa thành công' : 'Giải mã thành công'}</h3>
                                <a href={result.url} download={result.downloadName} className="cyber-download-btn">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                    Tải về: {result.downloadName}
                                </a>

                                <div className="metrics-body" style={{ width: '100%', marginTop: '1.5rem', textAlign: 'left' }}>
                                    <div className="metric-item">
                                        <span className="metric-label">Input Size</span>
                                        <span className="metric-val">{result.inSize.toLocaleString()} bytes</span>
                                    </div>
                                    <div className="metric-item">
                                        <span className="metric-label">Output Size</span>
                                        <span className="metric-val">{result.outSize.toLocaleString()} bytes</span>
                                    </div>
                                    <div className="metric-item">
                                        <span className="metric-label">Time</span>
                                        <span className="metric-val">{(result.timeNs / 1000000).toFixed(2)} ms</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
