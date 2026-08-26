// Decorative pastel lumps bleeding off the edges, like the reference art.
// Fixed + pointer-events-none so they never interfere with the form.
// Heavy blur plus lopsided radii keeps them reading as soft clay rather than flat circles.
const BLOBS = [
    { color: 'var(--color-lav)',  size: 380, top: '-10%', left: '-16%', radius: '72% 28% 38% 62% / 63% 34% 66% 37%', rotate: -14, delay: '0s',   opacity: 0.55 },
    { color: 'var(--color-pink)', size: 300, top: '14%',  left: '80%',  radius: '34% 66% 71% 29% / 30% 68% 32% 70%', rotate: 22,  delay: '1.4s', opacity: 0.5 },
    { color: 'var(--color-mint)', size: 340, top: '48%',  left: '-18%', radius: '66% 34% 27% 73% / 71% 29% 71% 29%', rotate: 8,   delay: '2.8s', opacity: 0.45 },
    { color: 'var(--color-sun)',  size: 260, top: '70%',  left: '82%',  radius: '28% 72% 64% 36% / 60% 33% 67% 40%', rotate: -20, delay: '0.7s', opacity: 0.5 },
    { color: 'var(--color-lav)',  size: 220, top: '90%',  left: '6%',   radius: '63% 37% 45% 55% / 36% 64% 36% 64%', rotate: 30,  delay: '2.1s', opacity: 0.4 },
    { color: 'var(--color-pink)', size: 200, top: '116%', left: '72%',  radius: '45% 55% 33% 67% / 58% 41% 59% 42%', rotate: -8,  delay: '3.4s', opacity: 0.4 },
];

export function ClayBlobs() {
    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            {BLOBS.map((blob, index) => (
                <span
                    key={index}
                    className="clay-blob absolute block blur-[38px] [animation:clay-drift_11s_ease-in-out_infinite]"
                    style={{
                        background: blob.color,
                        width: blob.size,
                        height: blob.size,
                        top: blob.top,
                        left: blob.left,
                        borderRadius: blob.radius,
                        opacity: blob.opacity,
                        rotate: `${blob.rotate}deg`,
                        animationDelay: blob.delay,
                    }}
                />
            ))}
        </div>
    );
}
