export function formatNs(ns) {
    if (ns < 1000) return `${ns.toFixed(2)} ns`;
    if (ns < 1_000_000) return `${(ns / 1000).toFixed(2)} μs`;
    return `${(ns / 1_000_000).toFixed(3)} ms`;
}

let toastTimer = null;
export function toast(msg, type = 'success') {
    const toastEl = document.getElementById('toast');
    if (!toastEl) return;
    clearTimeout(toastTimer);
    toastEl.textContent = (type === 'success' ? '✓ ' : type === 'error' ? '✗ ' : '⚠ ') + msg;
    toastEl.className = `toast ${type} show`;
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 4000);
}
