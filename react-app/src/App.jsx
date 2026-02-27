import { useState, useEffect } from 'react';
import ParticleCanvas from './components/ParticleCanvas';
import { ToastContainer } from './components/Toast';
import TextEncrypt from './components/TextEncrypt';
import TextDecrypt from './components/TextDecrypt';
import FileOperation from './components/FileOperation';
import { useLanguage } from './contexts/LanguageContext';

export default function App() {
  const [activeTab, setActiveTab] = useState('encrypt');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { lang, toggleLang, t } = useLanguage();

  useEffect(() => {
    const savedTab = localStorage.getItem('aes-active-tab');
    if (savedTab) setActiveTab(savedTab);
  }, []);

  useEffect(() => {
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
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
          {/* Desktop Nav */}
          <nav className="header-nav header-nav-desktop" aria-label="Điều hướng chính Desktop">
            <button className={`nav-btn ${activeTab === 'encrypt' ? 'active' : ''}`} onClick={() => switchTab('encrypt')}>
              <span className="sr-only">Mã hóa Text</span>{t('nav_encrypt')}
            </button>
            <button className={`nav-btn ${activeTab === 'decrypt' ? 'active' : ''}`} onClick={() => switchTab('decrypt')}>
              <span className="sr-only">Giải mã Text</span>{t('nav_decrypt')}
            </button>
            <button className={`nav-btn ${activeTab === 'file-enc' ? 'active' : ''}`} onClick={() => switchTab('file-enc')}>
              {t('nav_file_enc')}
            </button>
            <button className={`nav-btn ${activeTab === 'file-dec' ? 'active' : ''}`} onClick={() => switchTab('file-dec')}>
              {t('nav_file_dec')}
            </button>
            <button className="nav-btn" onClick={toggleLang} style={{ marginLeft: 'auto', gap: '6px' }}>
              <span className={`fi ${lang === 'vi' ? 'fi-vn' : 'fi-gb'}`} style={{ borderRadius: '2px' }}></span>
              {lang.toUpperCase()}
            </button>
          </nav>

          {/* Mobile Nav (Hamburger & Lang) */}
          <div className="header-nav-mobile">
            <button className="hamburger-btn" onClick={toggleLang} style={{ width: '60px', flexDirection: 'row', gap: '6px' }}>
              <span className={`fi ${lang === 'vi' ? 'fi-vn' : 'fi-gb'}`} style={{ borderRadius: '2px' }}></span>
              <span style={{ color: 'var(--green)', fontSize: '0.9rem', fontWeight: 600 }}>{lang.toUpperCase()}</span>
            </button>
            <button
              className={`hamburger-btn ${isMenuOpen ? 'open' : ''}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              <div className="hamburger-line"></div>
              <div className="hamburger-line"></div>
              <div className="hamburger-line"></div>
            </button>

            <div className={`mobile-menu-dropdown ${isMenuOpen ? 'show' : ''}`}>
              <button className={`nav-btn ${activeTab === 'encrypt' ? 'active' : ''}`} onClick={() => switchTab('encrypt')}>
                {t('nav_encrypt')}
              </button>
              <button className={`nav-btn ${activeTab === 'decrypt' ? 'active' : ''}`} onClick={() => switchTab('decrypt')}>
                {t('nav_decrypt')}
              </button>
              <button className={`nav-btn ${activeTab === 'file-enc' ? 'active' : ''}`} onClick={() => switchTab('file-enc')}>
                {t('nav_file_enc')}
              </button>
              <button className={`nav-btn ${activeTab === 'file-dec' ? 'active' : ''}`} onClick={() => switchTab('file-dec')}>
                {t('nav_file_dec')}
              </button>
            </div>
          </div>
          <div className="header-status" aria-live="polite">
            <span
              className="status-dot"
              aria-hidden="true"
              style={{
                background: isOnline ? 'var(--green)' : 'var(--orange)',
                boxShadow: isOnline ? '0 0 6px var(--green)' : '0 0 6px var(--orange)'
              }}
            />
            <span className="status-text">
              {isOnline ? t('status_online') : t('status_offline')} · {t('status_zero')}
            </span>
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
            {t('footer_1')}
          </p>
          <p className="footer-text">
            {t('footer_2')}
          </p>
        </div>
      </footer>
    </>
  );
}
