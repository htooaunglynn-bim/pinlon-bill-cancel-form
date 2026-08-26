type Props = { name: string; size?: number; className?: string; float?: boolean };

/**
 * Fluent Emoji 3D art (MIT), vendored under public/clay so the page stays CDN-free.
 * Purely decorative — every meaning it carries is also in the adjacent text.
 */
export function ClayIcon({ name, size = 44, className = '', float = false }: Props) {
    return (
        <img
            src={`/clay/${name}.png`}
            alt=""
            aria-hidden="true"
            width={size}
            height={size}
            loading="lazy"
            draggable={false}
            className={`select-none drop-shadow-[0_6px_10px_rgba(91,70,54,0.28)] ${float ? 'clay-blob [animation:clay-drift_7s_ease-in-out_infinite]' : ''} ${className}`}
            style={{ width: size, height: size }}
        />
    );
}
