import { useEffect, useState } from 'react';

export function toast(msg, type = 'success') {
    const event = new CustomEvent('app-toast', { detail: { msg, type } });
    window.dispatchEvent(event);
}

export function ToastContainer() {
    const [toastData, setToastData] = useState({ show: false, msg: '', type: 'success' });

    useEffect(() => {
        let timer;
        const handler = (e) => {
            const { msg, type } = e.detail;
            setToastData({ show: true, msg, type });
            clearTimeout(timer);
            timer = setTimeout(() => {
                setToastData(prev => ({ ...prev, show: false }));
            }, 4000);
        };
        window.addEventListener('app-toast', handler);
        return () => window.removeEventListener('app-toast', handler);
    }, []);

    const prefix = toastData.type === 'success' ? '✓ ' : toastData.type === 'error' ? '✗ ' : '⚠ ';

    return (
        <div className={`toast ${toastData.type} ${toastData.show ? 'show' : ''}`} role="alert">
            {prefix}{toastData.msg}
        </div>
    );
}
