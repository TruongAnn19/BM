export async function deriveKey(password, keyLengthBits) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );

    // Using a fixed salt for simplicity but in production you'd want a random salt per encryption
    const salt = enc.encode("CyberAES_Salt_Static");

    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: keyLengthBits },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function encryptText(text, password, keyBits) {
    const t0 = performance.now();
    const key = await deriveKey(password, keyBits);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();

    const ciphertextBuf = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        enc.encode(text)
    );

    const t1 = performance.now();

    // Package IV + Ciphertext
    const combinedBuf = new Uint8Array(iv.length + ciphertextBuf.byteLength);
    combinedBuf.set(iv, 0);
    combinedBuf.set(new Uint8Array(ciphertextBuf), iv.length);

    return {
        hex: bufferToHex(combinedBuf),
        timeNs: (t1 - t0) * 1e6, // approx ns
        cipherLen: combinedBuf.length,
        plainLen: text.length
    };
}

export async function decryptText(hexStr, password, keyBits) {
    const t0 = performance.now();
    const key = await deriveKey(password, keyBits);

    const combinedBuf = hexToBuffer(hexStr);
    if (combinedBuf.length < 12) throw new Error("Invalid ciphertext: too short.");

    const iv = combinedBuf.slice(0, 12);
    const ciphertext = combinedBuf.slice(12);

    const plainBuf = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        ciphertext
    );

    const t1 = performance.now();
    const dec = new TextDecoder();
    return {
        text: dec.decode(plainBuf),
        timeNs: (t1 - t0) * 1e6
    };
}

// Helper: buffer to hex
export function bufferToHex(buf) {
    return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, "0").toUpperCase())
        .join(" ");
}

// Helper: hex to buffer
export function hexToBuffer(hexStr) {
    const clean = hexStr.replace(/\s+/g, "");
    if (clean.length % 2 !== 0) throw new Error("Invalid hex length.");
    const buf = new Uint8Array(clean.length / 2);
    for (let i = 0; i < clean.length; i += 2) {
        buf[i / 2] = parseInt(clean.substring(i, i + 2), 16);
    }
    return buf;
}

export function formatNs(ns) {
    if (ns < 1000) return `${ns.toFixed(2)} ns`;
    if (ns < 1000000) return `${(ns / 1000).toFixed(2)} μs`;
    return `${(ns / 1000000).toFixed(3)} ms`;
}
