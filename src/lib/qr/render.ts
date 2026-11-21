import QRCode from 'qrcode';

// QR rendering. Error-correction level M survives print smudges at receipt sizes while
// keeping the module count low enough for an 80mm thermal printer.

const OPTIONS = {
    errorCorrectionLevel: 'M' as const,
    margin: 2,
    color: { dark: '#2B2018', light: '#FFFFFF' },
};

export async function qrSvg(text: string): Promise<string> {
    return QRCode.toString(text, { ...OPTIONS, type: 'svg' });
}

export async function qrPng(text: string, width = 768): Promise<string> {
    return QRCode.toDataURL(text, { ...OPTIONS, width });
}

export function downloadDataUrl(dataUrl: string, filename: string) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
}

export function downloadText(text: string, filename: string, type: string) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    downloadDataUrl(url, filename);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function safeFilename(text: string): string {
    return text.replace(/[^A-Za-z0-9-_]+/g, '_').slice(0, 60) || 'qr';
}
