import { useEffect, useState } from 'react';
import { downloadDataUrl, downloadText, qrPng, qrSvg, safeFilename } from '@/lib/qr/render';
import { ClayButton } from './ClayButton';

type Props = {
    value: string | null;
    /** Base name for downloaded files. */
    filename?: string;
    size?: number;
    /** Hide the action buttons (used inside print sheets). */
    bare?: boolean;
    onPrint?: () => void;
    emptyText?: string;
    /** Called on copy / download / print, e.g. to record the QR in history. */
    onAction?: (action: 'copy' | 'png' | 'svg' | 'print') => void;
};

export function useQrSvg(value: string | null): string {
    const [svg, setSvg] = useState('');
    useEffect(() => {
        let alive = true;
        if (!value) {
            setSvg('');
            return;
        }
        qrSvg(value).then((s) => { if (alive) setSvg(s); }).catch(() => { if (alive) setSvg(''); });
        return () => { alive = false; };
    }, [value]);
    return svg;
}

export function QrImage({ value, size = 220 }: { value: string; size?: number }) {
    const svg = useQrSvg(value);
    return (
        <div
            role="img"
            aria-label={`QR code for ${value}`}
            className="mx-auto overflow-hidden rounded-[14px] bg-white [&>svg]:h-full [&>svg]:w-full"
            style={{ width: size, height: size }}
            // qrcode returns a self-contained <svg> built from our own string; no user HTML is injected.
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}

export function QrPreview({ value, filename = 'qr', size = 240, bare = false, onPrint, emptyText = 'Fill in the form to see the QR.', onAction }: Props) {
    const svg = useQrSvg(value);
    const [copied, setCopied] = useState(false);

    async function copy() {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(value);
            onAction?.('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            setCopied(false);
        }
    }

    async function png() {
        if (!value) return;
        downloadDataUrl(await qrPng(value), `${safeFilename(filename)}.png`);
        onAction?.('png');
    }

    function svgFile() {
        if (!svg) return;
        downloadText(svg, `${safeFilename(filename)}.svg`, 'image/svg+xml');
        onAction?.('svg');
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="clay-inset flex items-center justify-center rounded-clay bg-cream p-4" style={{ width: size + 32, height: size + 32 }}>
                {value && svg ? (
                    <div
                        role="img"
                        aria-label="QR code"
                        className="overflow-hidden rounded-[14px] bg-white [&>svg]:h-full [&>svg]:w-full"
                        style={{ width: size, height: size }}
                        dangerouslySetInnerHTML={{ __html: svg }}
                    />
                ) : (
                    <p className="px-6 text-center text-sm text-clay-muted">{emptyText}</p>
                )}
            </div>

            {value ? (
                <code className="clay-inset block w-full rounded-blob bg-cream px-4 py-2.5 text-center font-mono text-xs break-all">{value}</code>
            ) : null}

            {!bare ? (
                <div className="grid w-full grid-cols-2 gap-2.5 sm:grid-cols-4 print-hide">
                    <ClayButton tone="ghost" compact type="button" onClick={copy} disabled={!value}>{copied ? 'Copied!' : 'Copy'}</ClayButton>
                    <ClayButton tone="ghost" compact type="button" onClick={png} disabled={!value}>PNG</ClayButton>
                    <ClayButton tone="ghost" compact type="button" onClick={svgFile} disabled={!value}>SVG</ClayButton>
                    <ClayButton tone="secondary" compact type="button" onClick={() => { onAction?.('print'); (onPrint ?? (() => window.print()))(); }} disabled={!value}>Print</ClayButton>
                </div>
            ) : null}
        </div>
    );
}
