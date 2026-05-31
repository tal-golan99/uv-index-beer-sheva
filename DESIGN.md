# Design

Visual system for UV Pool. Source of truth for tokens lives in [src/app/globals.css](src/app/globals.css); this document explains intent so variants stay on-brand.

## Theme

Bright, aquatic, sun-over-water. Light theme only (the app is used outdoors in daylight). Mood: a public pool at midday — honey sun, committed pool blue, water caustics. Playful but composed, not candy-chaotic.

## Color

Strategy: **Committed** — pool blue carries the brand, honey sun is the single warm pop, everything else is a pool-tinted neutral. Never gray-on-tint.

- **Pool blue** ramp `--color-pool-50 … 700` (`#eef8ff` → `#0a5784`). `pool-500/600` for primary actions and accents, `pool-700` for the deepest brand text, `pool-50/100` for tinted bands and chips.
- **Sun** ramp `--color-sun-300/400/500` (`#ffd95e` → `#db9a08`). The single warm accent — verdict highlights, the "go now" energy. `sun-500` for sun-colored text/icons (the lighter sun shades fail contrast as text).
- **Ink** `--color-ink #0c1b29` (headings/body), `--color-ink-2 #3c5161` (~7:1, labels/secondary body), `--color-ink-3 #6a8295` (~3.9:1, decorative micro-labels ≥18px ONLY — never body).
- **UV severity** scale (green→purple) lives in [src/lib/uv.ts](src/lib/uv.ts) as `UVLevel.color` (vivid, for arcs/dots) and `UVLevel.colorText` (AA-safe, for text). This is *state*, not brand decoration — use only to encode UV danger.
- Page background: layered radial + linear blue gradient on `<body>`; a warmer honey-over-water variant under `body.pool-time` (UV ≥ 9).

## Typography

Two families on a real contrast axis:
- **Display — Suez One** (`--font-display`): single-weight 400 Hebrew slab. Used for the few big moments only (the verdict hero, one landing headline). Do **not** apply `font-bold`/`font-black` — it's inherently heavy and synthesizing weight looks broken. Hierarchy comes from size, not weight.
- **Body — Assistant** (`--font-assistant`): humanist Hebrew sans, weights 400/600/700/800. Carries all body, labels, buttons, and bold sub-headings (use 700/800 where a heading must read as strong body rather than display).

Scale: fluid `clamp()` for the hero, ≥1.25 ratio between steps. `text-wrap: balance` on display headings, `pretty` on prose. Cap measure ~65–75ch. No all-caps body; reserve uppercase for nothing here (Hebrew has no case — avoid `uppercase tracking-widest` Latin eyebrows, they're a slop tell).

## Surfaces & Layout

Four deliberate section treatments — vary by role, never stamp one card everywhere:
1. **Bare** — content directly on the page gradient. The default for secondary sections.
2. **Hero card** — the single elevated white `radius-card` (`--radius-lg` 24px) + `shadow-pool-lg`. One per screen, reserved for the day's verdict.
3. **Full-bleed media** — pool photography / live presence, edge-to-edge or near it, with an overlaid gradient for legibility.
4. **Tinted band** — a `pool-50`/sun wash grouping a section instead of another ring-card.

Radius scale: `--radius-lg 24px` (cards), `--radius-md 16px` (nested), `--radius-sm 12px` (chips). Elevation: `shadow-pool-sm/md/lg` (pool-tinted, never pure black). Rhythm: vary vertical spacing with `clamp()` — tight within a topic, generous between topics. No nested cards.

## Motion

Custom easing tokens (`--ease-out-expo/quart/spring/in-out-quint`). Entrances start from `scale(0.96)` + opacity, never `scale(0)`. Signature motion: water caustics over the pool image, the springy UV gauge needle, scroll `Reveal` (IntersectionObserver, content visible by default). Every animation has a `prefers-reduced-motion: reduce` fallback in globals.css. Ease-out only — no bounce/elastic except the one deliberate gauge overshoot.

## Iconography

Phosphor (`@phosphor-icons/react`), `duotone`/`fill`/`bold` weights, colored via pool/sun tokens. Icons replace decorative emoji. Intentional joke emoji (🏊 verdict) are kept sparingly as content payload.

## Imagery

Real pool photography from `/public/pool` (the BGU pool + lifestyle shots), declared in [src/lib/photos.ts](src/lib/photos.ts) with Hebrew alt text. The live pool image is the visual centerpiece. Never replace photography with colored placeholder blocks.

## Brand wordmark

"UV Pool" is the canonical name across every surface (Hebrew body copy stays Hebrew). Lockup: a filled Sun mark + "UV Pool" + a "באר שבע" pool-blue chip. One shared component, reused in nav/footer/auth — no ad-hoc inline logos. "Pool Buddies" and "בריכה עכשיו" as names are retired.
