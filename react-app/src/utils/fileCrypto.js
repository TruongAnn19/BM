import { deriveKey, formatNs } from "./crypto.js";

// File encryption using WebCrypto API
export async function encryptFile(file, password, keyBits) {
    const t0 = performance.now();
    const key = await deriveKey(password, keyBits);

    // Read the entire file logic (ArrayBuffer)
    const arrayBuffer = await file.arrayBuffer();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const ciphertextBuf = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        arrayBuffer
    );

    const t1 = performance.now();

    // Combine IV (12 bytes) + Ciphertext + authTag (16 bytes, handled by WebCrypto automatically)
    const combinedBuf = new Uint8Array(12 + ciphertextBuf.byteLength);
    combinedBuf.set(iv, 0);
    combinedBuf.set(new Uint8Array(ciphertextBuf), 12);

    const blob = new Blob([combinedBuf], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);

    return {
        url,
        downloadName: `${file.name}.aes`,
        inSize: arrayBuffer.byteLength,
        outSize: combinedBuf.byteLength,
        timeNs: (t1 - t0) * 1e6
    };
}

export async function decryptFile(file, password, keyBits) {
    const t0 = performance.now();
    const key = await deriveKey(password, keyBits);

    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength < 12) throw new Error("File too short to be an AES ciphertext.");

    const iv = new Uint8Array(arrayBuffer.slice(0, 12));
    const ciphertext = arrayBuffer.slice(12);

    const plainBuf = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        ciphertext
    );

    const t1 = performance.now();

    const blob = new Blob([plainBuf], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);

    let originalName = file.name;
    if (originalName.endsWith(".aes")) {
        originalName = originalName.slice(0, -4);
    } else {
        originalName = "decrypted_" + originalName;
    }

    return {
        url,
        downloadName: originalName,
        inSize: arrayBuffer.byteLength,
        outSize: plainBuf.byteLength,
        timeNs: (t1 - t0) * 1e6
    };
}
