import { useState, useEffect } from 'react';
import ParticleCanvas from './components/ParticleCanvas';
import { ToastContainer } from './components/Toast';
import TextEncrypt from './components/TextEncrypt';
import TextDecrypt from './components/TextDecrypt';
import FileOperation from './components/FileOperation';

export default function App() {
  const [activeTab, setActiveTab] = useState('encrypt');

  useEffect(() => {
    const savedTab = localStorage.getItem('aes-active-tab');
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, []);

  const switchTab = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('aes-active-tab', tab);
  };

  return (
    <>
      <div className="scanlines" aria-hidden="true"></div>
      <ParticleCanvas />

      <header className="site-header" role="banner">
        <div className="header-inner">
          <div className="logo" aria-label="AES Cipher Tool">
            <svg className="logo-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect x="2" y="8" width="28" height="18" rx="2" stroke="#00FF41" strokeWidth="1.5" />
              <path d="M10 14h12M10 18h8" stroke="#00FF41" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M16 2v6M13 2h6" stroke="#00FF41" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="24" cy="17" r="3" stroke="#00FF41" strokeWidth="1.5" />
              <path d="M24 15.5v1.5l.8.8" stroke="#00FF41" strokeWidth="1" strokeLinecap="round" />
            </svg>
            <span className="logo-text">AES<span className="logo-accent">_CIPHER</span></span>
          </div>
          <nav className="header-nav" aria-label="Điều hướng chính">
            <button className={`nav-btn ${activeTab === 'encrypt' ? 'active' : ''}`} onClick={() => switchTab('encrypt')}>
              <span className="sr-only">Mã hóa Text</span>Mã hóa
            </button>
            <button className={`nav-btn ${activeTab === 'decrypt' ? 'active' : ''}`} onClick={() => switchTab('decrypt')}>
              <span className="sr-only">Giải mã Text</span>Giải mã
            </button>
            <button className={`nav-btn ${activeTab === 'file-enc' ? 'active' : ''}`} onClick={() => switchTab('file-enc')}>
              Mã hóa File
            </button>
            <button className={`nav-btn ${activeTab === 'file-dec' ? 'active' : ''}`} onClick={() => switchTab('file-dec')}>
              Giải mã File
            </button>
          </nav>
          <div className="header-status" aria-live="polite">
            <span className="status-dot" aria-hidden="true"></span>
            <span className="status-text">100% OFFLINE</span>
          </div>
        </div>
      </header>

      <main className="main-content">
        {activeTab === 'encrypt' && <TextEncrypt />}
        {activeTab === 'decrypt' && <TextDecrypt />}
        {activeTab === 'file-enc' && <FileOperation mode="encrypt" />}
        {activeTab === 'file-dec' && <FileOperation mode="decrypt" />}
      </main>

      <ToastContainer />

      <footer className="site-footer" role="contentinfo">
        <div className="footer-inner">
          <p className="footer-text">
            AES-GCM Client-side Encryption &mdash; Educational & Privacy-First Tool
          </p>
          <p className="footer-text">
            Powered by WebCrypto API &bull; 100% Offline &bull; Zero Server
          </p>
        </div>
      </footer>
    </>
  );
}
