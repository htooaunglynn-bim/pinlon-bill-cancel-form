import type { ReactNode } from 'react';
import { QrImage } from './QrPreview';

export type Label = { qr: string; title: ReactNode; lines?: ReactNode[] };

/** A4 grid of labelled QRs. Visible on screen as a preview; prints as a 3-column sheet. */
export function QrLabelSheet({ labels, printable }: { labels: Label[]; printable: boolean }) {
    return (
        <div className={printable ? 'print-area' : ''}>
            <div className="print-grid grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {labels.map((l, i) => (
                    <div key={i} className="clay-inset flex flex-col items-center gap-2 rounded-blob bg-cream p-4 text-center">
                        <QrImage value={l.qr} size={150} />
                        <p className="font-display text-sm font-semibold">{l.title}</p>
                        {l.lines?.map((line, j) => (
                            <p key={j} className="text-xs text-clay-muted">{line}</p>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
