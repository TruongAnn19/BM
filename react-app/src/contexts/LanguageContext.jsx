import { createContext, useState, useEffect, useContext } from 'react';

const translations = {
    vi: {
        // Nav & Header
        nav_encrypt: "Mã hóa Text",
        nav_decrypt: "Giải mã Text",
        nav_file_enc: "Mã hóa File",
        nav_file_dec: "Giải mã File",
        status_online: "CLIENT-SIDE",
        status_offline: "NO NETWORK",
        status_zero: "ZERO SERVER",
        footer_1: "AES-GCM Client-side Encryption — Educational & Privacy-First Tool",
        footer_2: "Powered by WebCrypto API • 100% Offline • Zero Server",

        // Common
        input_data: "INPUT DATA",
        chars: "ký tự",
        bytes: "bytes",
        paste: "Paste",
        clear: "Clear",
        secret_key: "SECRET KEY",
        algo_bits: "THUẬT TOÁN (BITS)",
        random: "Random",
        show: "Hiện",
        hide: "Ẩn",
        key_hint: "AES-{{bits}} cần {{req}} ký tự (hiện: {{cur}}/{{req}})",
        exec_time: "Execution Time",
        size_plain_cipher: "Size (Plain / Cipher)",
        algorithm: "Algorithm",
        copy_hex: "Copy HEX",

        // Text Encrypt
        text_enc_placeholder: "Nhập văn bản cần mã hóa...",
        btn_enc: "MÃ HÓA AES",
        ciphertext_hex: "CIPHERTEXT (HEX)",
        enc_result_placeholder: "Kết quả mã hóa sẽ hiển thị tại đây",

        // Text Decrypt
        ciphertext_input: "CIPHERTEXT (HEX / BASE64)",
        text_dec_placeholder: "Nhập Ciphertext cần giải mã...",
        btn_dec: "GIẢI MÃ AES",
        decrypted_text: "DECRYPTED TEXT",
        dec_result_placeholder: "Kết quả giải mã sẽ hiển thị tại đây",

        // File Operation
        input_file: "INPUT FILE",
        drop_file: "Kéo thả file vào đây, hoặc click để chọn",
        file_selected: "File đã chọn",
        change_file: "Đổi file",
        select_data_size: "SELECT DATA SIZE",
        file_size_label: "File size",
        chunk_algo: "Thuật toán Chunking",
        exec_enc_btn: "THỰC THI MÃ HÓA",
        exec_dec_btn: "THỰC THI GIẢI MÃ",
        output_file: "OUTPUT FILE",
        processing: "Đang xử lý...",
        download: "Tải xuống",

        // Toasts
        t_key_gen: "Key AES-{{bits}} đã được tạo ngẫu nhiên",
        t_err_empty_text_enc: "Vui lòng nhập văn bản cần mã hóa",
        t_err_empty_text_dec: "Vui lòng nhập mã hash Ciphertext để giải mã",
        t_err_empty_key: "Vui lòng nhập secret key",
        t_err_key_len: "AES-{{bits}} cần ít nhất {{req}} ký tự key",
        t_enc_success: "Mã hóa thành công!",
        t_dec_success: "Giải mã thành công!",
        t_err_prefix: "Lỗi:",
        t_pasted: "Đã dán",
        t_err_paste: "Không thể truy cập clipboard",
        t_copied_hex: "Đã copy HEX",
        t_copied_text: "Đã copy văn bản",
        t_err_file_req: "Vui lòng chọn file",
        t_file_enc_success: "Đã mã hóa thành công file {{name}}",
        t_file_dec_success: "Đã giải mã thành công file {{name}}",
        t_err_dec_fail: "Check lại Key hoặc mode/bits",
        t_confirm_random: "Key hiện tại sẽ bị ghi đè. Bạn có chắc muốn tạo Key mới ngẫu nhiên?"
    },
    en: {
        // Nav & Header
        nav_encrypt: "Encrypt Text",
        nav_decrypt: "Decrypt Text",
        nav_file_enc: "Encrypt File",
        nav_file_dec: "Decrypt File",
        status_online: "CLIENT-SIDE",
        status_offline: "NO NETWORK",
        status_zero: "ZERO SERVER",
        footer_1: "AES-GCM Client-side Encryption — Educational & Privacy-First Tool",
        footer_2: "Powered by WebCrypto API • 100% Offline • Zero Server",

        // Common
        input_data: "INPUT DATA",
        chars: "chars",
        bytes: "bytes",
        paste: "Paste",
        clear: "Clear",
        secret_key: "SECRET KEY",
        algo_bits: "ALGORITHM (BITS)",
        random: "Random",
        show: "Show",
        hide: "Hide",
        key_hint: "AES-{{bits}} requires {{req}} chars (current: {{cur}}/{{req}})",
        exec_time: "Execution Time",
        size_plain_cipher: "Size (Plain / Cipher)",
        algorithm: "Algorithm",
        copy_hex: "Copy HEX",

        // Text Encrypt
        text_enc_placeholder: "Enter plaintext here...",
        btn_enc: "ENCRYPT AES",
        ciphertext_hex: "CIPHERTEXT (HEX)",
        enc_result_placeholder: "Encryption result will appear here",

        // Text Decrypt
        ciphertext_input: "CIPHERTEXT (HEX / BASE64)",
        text_dec_placeholder: "Enter Ciphertext to decrypt...",
        btn_dec: "DECRYPT AES",
        decrypted_text: "DECRYPTED TEXT",
        dec_result_placeholder: "Decryption result will appear here",

        // File Operation
        input_file: "INPUT FILE",
        drop_file: "Drag and drop file here, or click to select",
        file_selected: "Selected file",
        change_file: "Change file",
        select_data_size: "SELECT DATA SIZE",
        file_size_label: "File size",
        chunk_algo: "Chunking Algorithm",
        exec_enc_btn: "EXECUTE ENCRYPT",
        exec_dec_btn: "EXECUTE DECRYPT",
        output_file: "OUTPUT FILE",
        processing: "Processing...",
        download: "Download",

        // Toasts
        t_key_gen: "AES-{{bits}} key generated randomly",
        t_err_empty_text_enc: "Please enter text to encrypt",
        t_err_empty_text_dec: "Please enter Ciphertext to decrypt",
        t_err_empty_key: "Please enter secret key",
        t_err_key_len: "AES-{{bits}} requires at least {{req}} key characters",
        t_enc_success: "Encrypted successfully!",
        t_dec_success: "Decrypted successfully!",
        t_err_prefix: "Error:",
        t_pasted: "Pasted",
        t_err_paste: "Clipboard access denied",
        t_copied_hex: "Copied HEX",
        t_copied_text: "Copied text",
        t_err_file_req: "Please select a file",
        t_file_enc_success: "File {{name}} encrypted successfully",
        t_file_dec_success: "File {{name}} decrypted successfully",
        t_err_dec_fail: "Verify Key or mode/bits",
        t_confirm_random: "Current key will be overwritten. Are you sure you want to generate a new random Key?"
    }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState('vi');

    useEffect(() => {
        const saved = localStorage.getItem('aes-lang');
        if (saved && translations[saved]) {
            setLang(saved);
        }
    }, []);

    const toggleLang = () => {
        const newLang = lang === 'vi' ? 'en' : 'vi';
        setLang(newLang);
        localStorage.setItem('aes-lang', newLang);
    };

    const t = (key, params = {}) => {
        let text = translations[lang][key] || key;
        Object.keys(params).forEach(p => {
            text = text.replaceAll(`{{${p}}}`, params[p]);
        });
        return text;
    };

    return (
        <LanguageContext.Provider value={{ lang, toggleLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
