# Product

## Register

product

(The home app is the primary surface and design serves it. The `/landing` route is a `brand` surface and may take brand-register liberties.)

## Users

Young adults and students in Beer Sheva who go to the Ben-Gurion University pool. They open the app on their phone, in summer, often outdoors in bright sun, to answer one question fast: "is it pool weather right now, and is anyone there?" They're local, social, and in on the joke — the app is a group chat as much as a tool.

## Product Purpose

UV Pool reads the live UV index for Beer Sheva and turns it into a social pool game: a clear daily verdict ("go now" / "not yet"), a live map of who's currently at the pool, a personal streak, and Telegram alerts an hour before peak sun. Success = a friend sees "3 people are in the pool now" and shows up. It exists to get people off their phones and into the water together.

## Brand Personality

Irreverent, warm, local. Self-deprecating Israeli humor — the kind that calls you a loser for skipping the pool, affectionately. Three words: **cheeky, sunny, communal.** It should feel like a friend nudging you, not a wellness app lecturing you. The humor is deliberate and written, never random emoji confetti.

## Anti-references

- Generic SaaS landing pages: identical 3-up feature-card grids, hero-metric strips (big number / small label), tiny tracked uppercase eyebrows over every section. The app already fell into these and they're being removed.
- Wellness / meditation app calm (Calm, Headspace): too soft and earnest for this voice.
- Corporate weather dashboards: data without personality.
- Emoji-confetti "fun" where every line ends in 🏊☀️😎 — decoration standing in for actual wit.

## Design Principles

1. **One question, answered loud.** Every screen leads with the single thing the user came for. The pool verdict is the hero; everything else is evidence.
2. **The joke is written, not decorated.** Personality lives in sharp Hebrew copy, not in emoji or stickers. At most one intentional emoji per section, as payload.
3. **Earned variety over uniform cards.** Sections differ by role — bare, hero, full-bleed media, tinted band — so the page reads as composed, not stamped.
4. **Local and real.** Real pool photography, real Beer Sheva references, real live data. The satire is clearly a bit, never a lie dressed as a stat.
5. **Sun-readable.** High contrast, large tap targets, motion that respects reduced-motion — it's used outdoors on a phone in glare.

## Accessibility & Inclusion

WCAG AA target. Body text ≥ 4.5:1 (the `--color-ink` / `--color-ink-2` ramp is tuned for this; `--color-ink-3` is decorative-only, never body). RTL-first Hebrew. Keyboard `:focus-visible` ring on every interactive element. Every animation has a `prefers-reduced-motion` path. Icons that carry meaning get labels; decorative ones are `aria-hidden`.
