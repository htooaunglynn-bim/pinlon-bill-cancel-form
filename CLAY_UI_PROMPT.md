# Claymorphism UI — reusable design-system prompt

Paste everything below the line into a new project. It is self-contained: exact tokens, the three
shadow utilities the whole look rests on, and the component contracts.

---

## Build me a "claymorphism" UI design system

Soft, rounded, pastel, tactile — surfaces look like pressed lumps of modelling clay. Warm cream
background, thick rounded corners, and layered shadows that fake real depth. Playful but calm;
never neon, never flat, never glassmorphism.

### Stack

- React 19 + TypeScript, Vite
- **Tailwind CSS v4** via `@tailwindcss/vite` (CSS-first config — there is NO `tailwind.config.js`;
  tokens are declared with `@theme` inside the stylesheet)
- `motion` (Framer Motion's successor) imported from `motion/react`
- `react-router-dom` v7 with `HashRouter` if the app is served statically without SPA rewrites
- Path alias `@` → `./src`

### Non-negotiable foundation: three shadow utilities

The entire aesthetic is these three recipes. Do not substitute a plain `box-shadow` or a Tailwind
`shadow-*` class — the layered offset slab is what makes it read as clay rather than a flat card.

- **`clay-surface`** — raised. A hard offset "slab" beneath the element, a soft ambient shadow, and
  inset highlight/shade so it looks like a lump sitting on the page. Use for cards, drawers.
- **`clay-pressable`** — the same lighting at a smaller offset, and on `:active` the slab collapses
  while the element translates down 5px, so it physically squashes. Use for buttons, nav items.
- **`clay-inset`** — inverted lighting, so the element looks pressed *into* the clay. Use for
  inputs, chips, wells, and the **active/current** nav item.

Create `src/index.css` exactly as follows:

```css
@import "tailwindcss";

/* ---- Clay design tokens ---- */
@theme {
    --color-cream: #FDF4E3;
    --color-card: #FBF1DF;

    --color-lav: #C3B1F0;
    --color-lav-deep: #9B84E3;
    --color-pink: #F7A8C8;
    --color-pink-deep: #E4638F;
    --color-mint: #A9DEBA;
    --color-mint-deep: #4E9E6C;
    --color-sun: #F8D97A;

    --color-clay-ink: #5B4636;    /* body text — warm dark brown, never pure black */
    --color-clay-muted: #8A7358;  /* secondary text */
    --color-clay-edge: #E7D9C0;   /* dashed dividers */
    --color-clay-slab: #E0CBA4;   /* the hard offset slab under raised surfaces */

    --radius-clay: 28px;  /* cards */
    --radius-blob: 18px;  /* buttons, inputs, nav items */

    --font-display: "Fredoka", ui-rounded, system-ui, sans-serif;  /* headings, labels, buttons */
    --font-sans: "Nunito", ui-rounded, system-ui, sans-serif;      /* body */
}

/* Raised clay: hard offset slab + soft ambient shadow + inset highlight/shade. */
@utility clay-surface {
    box-shadow:
        0 14px 0 -4px var(--color-clay-slab),
        0 26px 40px -14px rgb(91 70 54 / 26%),
        inset 6px 6px 14px rgb(255 255 255 / 75%),
        inset -8px -8px 16px rgb(91 70 54 / 8%);
}

/* Same lighting, smaller offset; the slab collapses on :active so the button squashes. */
@utility clay-pressable {
    box-shadow:
        0 8px 0 -1px rgb(91 70 54 / 18%),
        0 12px 18px -8px rgb(91 70 54 / 35%),
        inset 4px 4px 8px rgb(255 255 255 / 40%),
        inset -5px -5px 10px rgb(91 70 54 / 14%);
    transition: transform 140ms ease, box-shadow 140ms ease, filter 140ms ease;

    &:hover:not(:disabled) { filter: brightness(1.04); }

    &:active:not(:disabled) {
        transform: translateY(5px);
        box-shadow:
            0 3px 0 -1px rgb(91 70 54 / 18%),
            0 5px 10px -6px rgb(91 70 54 / 35%),
            inset 4px 4px 10px rgb(91 70 54 / 18%);
    }

    &:disabled { cursor: wait; opacity: .55; }
}

/* Inverted lighting: looks pressed *into* the clay. */
@utility clay-inset {
    box-shadow:
        inset 5px 5px 10px rgb(91 70 54 / 14%),
        inset -4px -4px 9px rgb(255 255 255 / 85%);
}

@layer base {
    body {
        background: var(--color-cream);
        color: var(--color-clay-ink);
        font-family: var(--font-sans);
        min-height: 100vh;
        overflow-x: hidden;
    }

    /* Numeric spinners fight the soft look. */
    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button { appearance: none; margin: 0; }
    input[type="number"] { appearance: textfield; }

    code { font-family: ui-monospace, monospace; }
}

@keyframes clay-drift {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    50% { transform: translate(14px, -22px) rotate(6deg); }
}

@media (prefers-reduced-motion: reduce) {
    .clay-blob { animation: none !important; }
    *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
```

Load the fonts in `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
```

### Components to build (`src/components/`)

**`ClayCard`** — `{ title, icon, tone: 'lav'|'mint'|'pink', intro?: ReactNode, children, delay? }`
A `motion.section` with `clay-surface overflow-hidden rounded-clay bg-card`. Entrance:
`initial={{opacity:0, y:26}}` → `animate={{opacity:1, y:0}}`, `duration: 0.5`, `ease: [0.22,1,0.36,1]`,
staggered by the `delay` prop. A coloured header strip (`bg-lav` / `bg-mint` / `bg-pink`) holds a
46px icon and an `h2` in `font-display text-[22px] font-semibold`. Body is
`px-6 py-6 sm:px-8 sm:py-7`; `intro` renders above children in `text-[15px] text-clay-muted`.

**`ClayButton`** — extends `ButtonHTMLAttributes`, plus `{ tone?: 'primary'|'secondary'|'ghost'|'danger', compact?: boolean }`
Base: `clay-pressable cursor-pointer rounded-blob font-display font-semibold` +
`focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-lav-deep`.
Tones: primary `bg-lav-deep text-white`, secondary `bg-sun text-clay-ink`, ghost `bg-card text-clay-ink`,
danger `bg-pink text-clay-ink`. Default is **full width** (`w-full px-4 py-3.5 text-base`);
`compact` gives `px-4 py-2 text-sm` for row actions.

**`ClayInput`** — extends `InputHTMLAttributes`, plus `{ mono?: boolean }`
`clay-inset w-full rounded-blob border-0 bg-cream px-4 py-3 text-clay-ink`,
`placeholder:text-clay-muted/55`, `focus:outline-3 focus:outline-offset-2 focus:outline-lav-deep`.
`mono` adds `font-mono text-[15px]` for code-like values.

**`ClayField`** — `{ label, hint?, htmlFor?, children, className? }`
Label in `font-display text-[15px] font-semibold`, with the optional `hint` inline after it in
`font-sans text-sm font-normal text-clay-muted`. Wraps any control.

**`ClayChip`** — read-only pill: `clay-inset inline-flex rounded-full bg-cream px-3.5 py-1.5 font-mono text-xs`.

**`StatusMessage`** — `{ status: {state, text, logs}, id? }`
A `clay-inset rounded-blob` well in an `aria-live="polite"` container, animated in/out with
`AnimatePresence` (`initial={{opacity:0,y:-6}}`, `duration: 0.2`), keyed on `text + state` so
consecutive messages re-animate. Tones: error `bg-pink/25 text-pink-deep`,
success `bg-mint/30 text-mint-deep`, idle/busy `bg-cream text-clay-muted`. Secondary `logs`
lines render beneath in `text-sm text-clay-muted`.

Pair it with a `useStatus()` hook returning `{ status, say(text, state, logs), detail(line) }`.

**`ClayBlobs`** — decorative background. `aria-hidden`, `pointer-events-none fixed inset-0 -z-10
overflow-hidden`. Six pastel lumps bleeding off the edges, each with `blur-[38px]`, a lopsided
`border-radius` (e.g. `72% 28% 38% 62% / 63% 34% 66% 37%`), a rotation, opacity 0.4–0.55, and
`[animation:clay-drift_11s_ease-in-out_infinite]` with staggered `animationDelay`. The asymmetric
radii are what stop them reading as flat circles.

### Icons

The original vendors **Fluent Emoji 3D PNGs** (MIT, `microsoft/fluentui-emoji`) into
`public/clay/<name>.png` so the page stays CDN-free, wrapped in a `ClayIcon` component
(`{ name, size = 44, className?, float? }`) that renders an `<img>` with `alt=""`,
`aria-hidden="true"`, `loading="lazy"`, `draggable={false}`, and
`drop-shadow-[0_6px_10px_rgba(91,70,54,0.28)]`. `float` adds the drift animation.

**These PNGs will not come across with the CSS — you must supply your own.** Download the 3D
variants you need from the Fluent Emoji repo, or substitute any rounded 3D-style icon set. Keep the
drop-shadow: it is what seats the icon on the clay. Icons are **purely decorative** — every meaning
they carry must also be in adjacent text.

### Layout shell

Fixed 264px sidebar at `lg+`; below `lg` it becomes a drawer with a `bg-clay-ink/35` backdrop,
opened by a floating `clay-pressable` hamburger at `fixed top-4 left-4 z-30 lg:hidden`. Drawer
slides in with `initial={{x:'-100%'}}` → `animate={{x:0}}` and
`transition={{type:'spring', stiffness:420, damping:40}}`.

Drawer accessibility, all required: `role="dialog"`, `aria-modal="true"`, `aria-label`,
`tabIndex={-1}`; move focus into it on open; listen for Escape on **`document`** (not `window`);
restore focus to the hamburger on close; and close the drawer on route change.

Content area: `lg:pl-[264px]`, inner wrapper `mx-auto w-full max-w-[1180px] px-4 pt-20 pb-8 sm:px-6 lg:pt-8`
(the extra top padding below `lg` clears the floating button).

Sidebar nav items are `rounded-blob px-3.5 py-3 font-display text-[15px] font-semibold`. **Active
state is `clay-inset bg-lav text-clay-ink`** — pressed into the clay, which the system already
reads as "current" — while inactive is `clay-pressable bg-card text-clay-muted hover:text-clay-ink`.

### Rules

1. **Every interactive element gets one of the three utilities.** A flat element looks broken here.
2. **Active/selected = `clay-inset`.** Never a border or a colour-only change.
3. `font-display` (Fredoka) for headings, labels and buttons; `font-sans` (Nunito) for body.
4. Text is `clay-ink` / `clay-muted` — **never pure black or grey**.
5. Dividers are `border-t-2 border-dashed border-clay-edge`, not solid hairlines.
6. Radii come from the tokens: `rounded-clay` (28px) for cards, `rounded-blob` (18px) for controls,
   `rounded-full` for chips.
7. Focus rings are always `outline-3 outline-offset-2 outline-lav-deep` — thick and visible, since
   the soft shadows swallow thin ones.
8. Stagger card entrances with the `delay` prop (0, 0.05, 0.1 …) so the page assembles rather than
   popping in.
9. Honour `prefers-reduced-motion` via the media query above.
10. Pastels carry meaning: **mint = success, pink = error/danger, sun = secondary action,
    lavender = primary/brand**. Keep that mapping consistent.
