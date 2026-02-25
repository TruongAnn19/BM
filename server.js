/**
 * AES Cipher Tool — Backend Server
 * 
 * Bridges the Web UI ↔ aes.exe (compiled from main.cpp)
 * 
 * Routes:
 *   POST /api/encrypt  { text: string, key: string, keylen: 128|192|256 }
 *   POST /api/decrypt  { hexCipher: string, key: string, keylen: 128|192|256 }
 *   GET  /api/status   — health check
 * 
 * Run: node server.js
 * Then open: http://localhost:8080
 */

'use strict';

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

const TEMP_DIR = os.tmpdir();  // safe temp folder for file uploads

const PORT = 8080;
const EXE = path.join(__dirname, 'aes.exe');
const STATIC = __dirname;   // serve index.html, style.css, app.js from same folder

// ──────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────

/** Convert a UTF-8 string to uppercase hex pairs separated by spaces */
function strToHex(str) {
    return Buffer.from(str, 'utf8')
        .toString('hex')
        .replace(/../g, m => m.toUpperCase() + ' ')
        .trim();
}

/** Convert a hex string (spaces ok) to a UTF-8 string */
function hexToStr(hex) {
    const clean = hex.replace(/\s+/g, '');
    return Buffer.from(clean, 'hex').toString('utf8');
}

/** Convert an already-uppercase-spaced hex string from the UI (e.g. "3A FF 2B ...") to
 *  the same format aes.exe expects — just ensures no extra whitespace issues. */
function normalizeHex(hex) {
    // strip all whitespace, then rejoin as pairs
    return hex.replace(/\s+/g, '')
        .replace(/../g, m => m.toUpperCase() + ' ')
        .trim();
}

/**
 * Spawn aes.exe and collect stdout / stderr.
 * Returns a Promise<{ stdout, stderr, code }>.
 */
function runAES(args) {
    return new Promise((resolve) => {
        if (!fs.existsSync(EXE)) {
            return resolve({
                stdout: '',
                stderr: `aes.exe not found at: ${EXE}\nPlease compile first: g++ -O2 -o aes main.cpp`,
                code: 127,
            });
        }

        const proc = spawn(EXE, args, { windowsHide: true });
        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', d => { stdout += d.toString(); });
        proc.stderr.on('data', d => { stderr += d.toString(); });
        proc.on('close', code => resolve({ stdout, stderr, code }));
    });
}

/**
 * Parse the 3-line output from aes.exe:
 *   Line 1: result hex
 *   Line 2: time in ns
 *   Line 3: block count
 */
function parseOutput(raw) {
    const lines = raw.trim().split(/\r?\n/);
    return {
        hexResult: (lines[0] || '').trim(),
        timeNs: parseFloat(lines[1]) || 0,
        blocks: parseInt(lines[2]) || 0,
    };
}

/** Parse 4-line output from aes.exe file mode */
function parseFileOutput(raw) {
    const lines = raw.trim().split(/\r?\n/);
    return {
        inputSize: parseInt(lines[0]) || 0,
        outputSize: parseInt(lines[1]) || 0,
        timeNs: parseFloat(lines[2]) || 0,
        blocks: parseInt(lines[3]) || 0,
    };
}

/**
 * Build a safe Content-Disposition header value for any filename,
 * including Unicode (Vietnamese, Chinese, etc.).
 * Uses RFC 5987 encoding: filename*=UTF-8''<percent-encoded>
 */
function safeContentDisposition(filename) {
    // ASCII fallback: strip non-ASCII chars
    const ascii = filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
    // RFC 5987 encoded version for modern browsers
    const encoded = encodeURIComponent(filename).replace(/'/g, '%27');
    return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

/**
 * Parse a multipart/form-data request body (Node built-in, no npm).
 * Returns: { fields: {name: value}, files: {name: {filename, data: Buffer}} }
 */
function readMultipart(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', c => chunks.push(c));
        req.on('error', reject);
        req.on('end', () => {
            const buf = Buffer.concat(chunks);
            const ct = req.headers['content-type'] || '';
            const boundaryMatch = ct.match(/boundary=([^;]+)/);
            if (!boundaryMatch) return reject(new Error('No boundary in Content-Type'));

            const boundary = Buffer.from('--' + boundaryMatch[1].trim());
            const fields = {};
            const files = {};

            // Split on boundary
            let start = buf.indexOf(boundary);
            while (start !== -1) {
                const partStart = start + boundary.length;
                // Check for final boundary
                if (buf[partStart] === 45 && buf[partStart + 1] === 45) break; // '--'
                // Skip CRLF after boundary
                const headerStart = partStart + 2; // skip \r\n
                // Find double CRLF separating headers from body
                const sep = buf.indexOf(Buffer.from('\r\n\r\n'), headerStart);
                if (sep === -1) break;
                const headerStr = buf.slice(headerStart, sep).toString('utf8');
                const bodyStart = sep + 4;
                // Find next boundary
                const nextBound = buf.indexOf(boundary, bodyStart);
                const bodyEnd = nextBound === -1 ? buf.length : nextBound - 2; // -2 for preceding \r\n
                const partBody = buf.slice(bodyStart, bodyEnd);

                // Parse Content-Disposition — use semicolon prefix to avoid matching filename= instead of name=
                const dispMatch = headerStr.match(/;\s*name="([^"]+)"/);
                const nameAttr = dispMatch ? dispMatch[1] : null;
                const fnMatch = headerStr.match(/;\s*filename="([^"]+)"/);


                if (nameAttr) {
                    if (fnMatch) {
                        files[nameAttr] = { filename: fnMatch[1], data: partBody };
                    } else {
                        fields[nameAttr] = partBody.toString('utf8');
                    }
                }
                start = nextBound;
            }
            resolve({ fields, files });
        });
    });
}

// ──────────────────────────────────────────────────────────────
// READ BODY
// ──────────────────────────────────────────────────────────────
function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try { resolve(JSON.parse(body || '{}')); }
            catch (e) { reject(new Error('Invalid JSON body')); }
        });
        req.on('error', reject);
    });
}

// ──────────────────────────────────────────────────────────────
// STATIC FILE SERVER (serves index.html, style.css, app.js)
// ──────────────────────────────────────────────────────────────
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.ico': 'image/x-icon',
};

function serveStatic(req, res) {
    let urlPath = req.url.split('?')[0];
    if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

    const filePath = path.join(STATIC, urlPath);

    // Security: prevent path traversal
    if (!filePath.startsWith(STATIC)) {
        res.writeHead(403); res.end('Forbidden'); return;
    }

    const ext = path.extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found: ' + urlPath);
            return;
        }
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
    });
}

// ──────────────────────────────────────────────────────────────
// API HANDLERS
// ──────────────────────────────────────────────────────────────

async function handleEncrypt(req, res) {
    let body;
    try { body = await readBody(req); }
    catch (e) { sendError(res, 400, e.message); return; }

    const { text, key, keylen = 128 } = body;

    if (!text || text.length === 0) { sendError(res, 400, 'Thiếu trường text'); return; }
    if (!key || key.length === 0) { sendError(res, 400, 'Thiếu trường key'); return; }
    if (![128, 192, 256].includes(Number(keylen))) { sendError(res, 400, 'keylen phải là 128, 192 hoặc 256'); return; }

    const textHex = strToHex(text);
    const keyHex = strToHex(key);

    console.log(`[ENCRYPT] AES-${keylen} | text=${text.length}B | key="${key.slice(0, 6)}..."`);

    const { stdout, stderr, code } = await runAES(['encrypt', textHex, keyHex, String(keylen)]);

    if (code !== 0) {
        console.error('[ENCRYPT ERROR]', stderr);
        sendError(res, 500, `C++ error: ${stderr.trim()}`);
        return;
    }

    const { hexResult, timeNs, blocks } = parseOutput(stdout);

    sendJSON(res, {
        ok: true,
        cipherHex: hexResult,        // HEX string output from aes.exe
        timeNs: timeNs,
        blocks: blocks,
        keylen: keylen,
        plainLen: Buffer.byteLength(text, 'utf8'),
        cipherLen: blocks * 16,
    });
}

async function handleDecrypt(req, res) {
    let body;
    try { body = await readBody(req); }
    catch (e) { sendError(res, 400, e.message); return; }

    const { hexCipher, key, keylen = 128 } = body;

    if (!hexCipher || hexCipher.trim().length === 0) { sendError(res, 400, 'Thiếu trường hexCipher'); return; }
    if (!key || key.length === 0) { sendError(res, 400, 'Thiếu trường key'); return; }
    if (![128, 192, 256].includes(Number(keylen))) { sendError(res, 400, 'keylen phải là 128, 192 hoặc 256'); return; }

    const cipherHex = normalizeHex(hexCipher);
    const keyHex = strToHex(key);

    // Validate: hex length must map to multiple of 16 bytes
    const byteCount = cipherHex.replace(/\s+/g, '').length / 2;
    if (byteCount % 16 !== 0) {
        sendError(res, 400, `Ciphertext phải là bội số 16 byte (hiện tại ${byteCount} bytes)`);
        return;
    }

    console.log(`[DECRYPT] AES-${keylen} | cipher=${byteCount}B | key="${key.slice(0, 6)}..."`);

    const { stdout, stderr, code } = await runAES(['decrypt', cipherHex, keyHex, String(keylen)]);

    if (code !== 0) {
        console.error('[DECRYPT ERROR]', stderr);
        sendError(res, 500, `C++ error: ${stderr.trim()}`);
        return;
    }

    const { hexResult, timeNs, blocks } = parseOutput(stdout);

    // Convert hex result → plaintext string
    let plaintext = '';
    try {
        plaintext = hexToStr(hexResult);
    } catch {
        plaintext = hexResult; // fallback: show raw hex
    }

    sendJSON(res, {
        ok: true,
        plaintext: plaintext,
        plainHex: hexResult,
        timeNs: timeNs,
        blocks: blocks,
        keylen: keylen,
    });
}

// ──────────────────────────────────────────────────────────────
// FILE ENCRYPT / DECRYPT HANDLERS
// ──────────────────────────────────────────────────────────────

async function handleEncryptFile(req, res) {
    let parsed;
    try { parsed = await readMultipart(req); }
    catch (e) { sendError(res, 400, 'Lỗi đọc form: ' + e.message); return; }

    const { fields, files } = parsed;
    const fileEntry = files['file'];
    const key = (fields['key'] || '').trim();
    const keylen = parseInt(fields['keylen'] || '128');

    if (!fileEntry) { sendError(res, 400, 'Thiếu file upload (field name: file)'); return; }
    if (!key) { sendError(res, 400, 'Thiếu key'); return; }
    if (![128, 192, 256].includes(keylen)) { sendError(res, 400, 'keylen phải là 128/192/256'); return; }

    const keyHex = strToHex(key);
    const uid = crypto.randomBytes(8).toString('hex');
    const inPath = path.join(TEMP_DIR, `aes_in_${uid}`);
    const outPath = path.join(TEMP_DIR, `aes_out_${uid}.enc`);

    fs.writeFileSync(inPath, fileEntry.data);
    console.log(`[ENCRYPT_FILE] AES-${keylen} | file=${fileEntry.filename} | ${fileEntry.data.length}B`);

    const { stdout, stderr, code } = await runAES(['encrypt_file', inPath, outPath, keyHex, String(keylen)]);

    // Clean up input temp
    fs.unlink(inPath, () => { });

    if (code !== 0) {
        fs.unlink(outPath, () => { });
        sendError(res, 500, 'C++ error: ' + stderr.trim());
        return;
    }

    const info = parseFileOutput(stdout);
    const outData = fs.readFileSync(outPath);
    fs.unlink(outPath, () => { });

    // Return encrypted file as download + metadata header
    const origName = fileEntry.filename || 'file';
    const downloadName = origName + '.aes';
    res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': safeContentDisposition(downloadName),
        'Content-Length': outData.length,
        'X-AES-InputSize': info.inputSize,
        'X-AES-OutputSize': info.outputSize,
        'X-AES-TimeNs': info.timeNs,
        'X-AES-Blocks': info.blocks,
        'X-AES-OrigName': encodeURIComponent(origName),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'X-AES-InputSize,X-AES-OutputSize,X-AES-TimeNs,X-AES-Blocks,X-AES-OrigName',
    });
    res.end(outData);
}

async function handleDecryptFile(req, res) {
    let parsed;
    try { parsed = await readMultipart(req); }
    catch (e) { sendError(res, 400, 'Lỗi đọc form: ' + e.message); return; }

    const { fields, files } = parsed;
    const fileEntry = files['file'];
    const key = (fields['key'] || '').trim();
    const keylen = parseInt(fields['keylen'] || '128');

    if (!fileEntry) { sendError(res, 400, 'Thiếu file upload (field name: file)'); return; }
    if (!key) { sendError(res, 400, 'Thiếu key'); return; }
    if (![128, 192, 256].includes(keylen)) { sendError(res, 400, 'keylen phải là 128/192/256'); return; }
    if (fileEntry.data.length % 16 !== 0) {
        sendError(res, 400, `File ciphertext phải là bội số 16 byte (hiện tại: ${fileEntry.data.length} bytes)`);
        return;
    }

    const keyHex = strToHex(key);
    const uid = crypto.randomBytes(8).toString('hex');
    const inPath = path.join(TEMP_DIR, `aes_in_${uid}.enc`);
    const outPath = path.join(TEMP_DIR, `aes_out_${uid}`);

    fs.writeFileSync(inPath, fileEntry.data);
    console.log(`[DECRYPT_FILE] AES-${keylen} | file=${fileEntry.filename} | ${fileEntry.data.length}B`);

    const { stdout, stderr, code } = await runAES(['decrypt_file', inPath, outPath, keyHex, String(keylen)]);

    fs.unlink(inPath, () => { });

    if (code !== 0) {
        fs.unlink(outPath, () => { });
        sendError(res, 500, 'C++ error: ' + stderr.trim());
        return;
    }

    const info = parseFileOutput(stdout);
    const outData = fs.readFileSync(outPath);
    fs.unlink(outPath, () => { });

    // Recover original filename by stripping .aes extension
    const encName = fileEntry.filename || 'file.aes';
    const downloadName = encName.endsWith('.aes') ? encName.slice(0, -4) : 'decrypted_' + encName;

    res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': safeContentDisposition(downloadName),
        'Content-Length': outData.length,
        'X-AES-InputSize': info.inputSize,
        'X-AES-OutputSize': info.outputSize,
        'X-AES-TimeNs': info.timeNs,
        'X-AES-Blocks': info.blocks,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'X-AES-InputSize,X-AES-OutputSize,X-AES-TimeNs,X-AES-Blocks',
    });
    res.end(outData);
}

async function handleStatus(req, res) {
    const exeExists = fs.existsSync(EXE);
    const exeVersion = exeExists ? 'compiled' : 'not found';

    // Quick smoke test: encrypt 1 block with AES-128
    let selfTest = 'skipped';
    if (exeExists) {
        const textHex = '48 65 6C 6C 6F 20 41 45 53 21 00 00 00 00 00 00'; // "Hello AES!" padded
        const keyHex = '61 62 63 64 65 66 67 68 69 6A 6B 6C 6D 6E 6F 70'; // "abcdefghijklmnop"
        const { code } = await runAES(['encrypt', textHex, keyHex, '128']);
        selfTest = code === 0 ? 'pass' : 'fail';
    }

    sendJSON(res, {
        status: 'ok',
        server: 'AES Cipher Tool API v1.0',
        aesExe: exeVersion,
        exePath: EXE,
        selfTest,
        timestamp: new Date().toISOString(),
    });
}

// ──────────────────────────────────────────────────────────────
// RESPONSE HELPERS
// ──────────────────────────────────────────────────────────────
function sendJSON(res, data, status = 200) {
    const body = JSON.stringify(data, null, 2);
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end(body);
}

function sendError(res, status, message) {
    sendJSON(res, { ok: false, error: message }, status);
}

function sendOPTIONS(res) {
    res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
}

// ──────────────────────────────────────────────────────────────
// HTTP SERVER
// ──────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
    const url = req.url.split('?')[0];

    // CORS preflight
    if (req.method === 'OPTIONS') { sendOPTIONS(res); return; }

    // API routes
    if (req.method === 'POST' && url === '/api/encrypt') {
        await handleEncrypt(req, res); return;
    }
    if (req.method === 'POST' && url === '/api/decrypt') {
        await handleDecrypt(req, res); return;
    }
    if (req.method === 'POST' && url === '/api/encrypt-file') {
        await handleEncryptFile(req, res); return;
    }
    if (req.method === 'POST' && url === '/api/decrypt-file') {
        await handleDecryptFile(req, res); return;
    }
    if (req.method === 'GET' && url === '/api/status') {
        await handleStatus(req, res); return;
    }

    // Static files
    if (req.method === 'GET') {
        serveStatic(req, res); return;
    }

    res.writeHead(405); res.end('Method Not Allowed');
});

server.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║   AES Cipher Tool — Backend Server         ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log(`║   http://localhost:${PORT}                    ║`);
    console.log(`║   API: /api/encrypt  /api/decrypt          ║`);
    console.log(`║        /api/encrypt-file /api/decrypt-file ║`);
    console.log('╠════════════════════════════════════════════╣');
    if (!fs.existsSync(EXE)) {
        console.log('║   ⚠  aes.exe NOT FOUND — compile first:    ║');
        console.log('║      g++ -O2 -o aes main.cpp               ║');
    } else {
        console.log('║   ✓  aes.exe found and ready               ║');
    }
    console.log('╚════════════════════════════════════════════╝');
    console.log('');
});

server.on('error', err => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} already in use. Kill other process or change PORT.`);
    } else {
        console.error('Server error:', err);
    }
    process.exit(1);
});
