import { ClayChip } from '@/components/ClayChip';
import type { JsonValue } from '@/lib/types';
import { isBlank } from './format';

/**
 * A `from`/`to` value that arrived as a JSON string.
 *
 * The change log stores its before/after as text, JSON-encoding anything
 * structured — so parsing first is the only way `{"points":10}` reads as a
 * field list rather than as a wall of escaped quotes.
 */
export function parseMaybeJson(value: string | null): JsonValue {
    if (value === null) return null;

    const trimmed = value.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return value;

    try {
        return JSON.parse(trimmed) as JsonValue;
    } catch {
        return value;
    }
}

type Props = { label: string; value: JsonValue };

/** Renders one old/new/metadata blob, or nothing at all when it is empty. */
export function JsonBlock({ label, value }: Props) {
    if (isBlank(value)) return null;

    return (
        <div>
            <p className="mb-1.5 font-display text-[13px] font-semibold tracking-wide text-clay-muted uppercase">
                {label}
            </p>
            {isFlatRecord(value) ? <FlatRecord value={value} /> : <RawJson value={value} />}
        </div>
    );
}

function FlatRecord({ value }: { value: Record<string, JsonValue> }) {
    return (
        <div className="flex flex-wrap gap-2">
            {Object.entries(value).map(([key, entry]) => (
                <ClayChip key={key}>
                    <span className="text-clay-muted">{key}</span>
                    <span aria-hidden>=</span>
                    <span>{entry === null ? 'null' : String(entry)}</span>
                </ClayChip>
            ))}
        </div>
    );
}

function RawJson({ value }: { value: JsonValue }) {
    const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);

    return (
        <pre className="clay-inset overflow-x-auto rounded-blob bg-cream/70 px-3 py-2.5 font-mono text-[12.5px] break-words whitespace-pre-wrap text-clay-ink">
            {text}
        </pre>
    );
}

/** Most old/new blobs are one or two scalars; a chip row beats pretty-printed JSON for those. */
function isFlatRecord(value: JsonValue): value is Record<string, JsonValue> {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;

    return Object.values(value).every(
        (entry) => entry === null || ['string', 'number', 'boolean'].includes(typeof entry),
    );
}
