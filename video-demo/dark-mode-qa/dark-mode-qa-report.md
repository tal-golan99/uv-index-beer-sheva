# Dark Mode QA Report — UV Pool
**Date:** 2026-06-05  
**Scope:** All 9 routes audited with `body.night-mode` forced via JavaScript injection  
**Screenshots:** 16 (mobile 390×844 + desktop 1440×900 per route)  
**Method:** Playwright headless, dev server localhost:3000

---

## Design Health Score (Dark Mode lens)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Theme switches silently; no user indicator of night-mode state |
| 2 | Match System / Real World | 3 | Day/night metaphor is coherent; local audience well-served |
| 3 | User Control and Freedom | 1 | No manual override for night-mode; time-locked only |
| 4 | Consistency and Standards | 1 | Home is dark at night; every other route stays light — jarring jump |
| 5 | Error Prevention | 1 | CSS variable cascade causes system-wide contrast failure: white cards inherit near-white text |
| 6 | Recognition Rather Than Recall | 3 | Navigation is consistent; labels are clear |
| 7 | Flexibility and Efficiency | 1 | No dark-mode preference; no override; locked to Israel time |
| 8 | Aesthetic and Minimalist Design | 2 | bg-white components glow against dark body; Reveal sections appear blank below fold |
| 9 | Error Recovery | 2 | Error/success state chips (red-50, green-50) have no dark variant |
| 10 | Help and Documentation | 1 | No user-facing explanation of why theme changes at night |
| **Total** | | **17/40** | **Poor — major dark-mode overhaul needed** |

---

## Anti-Patterns Verdict

**The single root cause:** The dark-mode system was designed correctly in CSS (`globals.css:86–104`), but only half-implemented. The CSS rules flip the `--color-ink` token family to near-white on `body.night-mode`, and override backgrounds on `.surface-band`, `.radius-card`, and `.radius-nested`. The implementation breaks because virtually every component adds a hardcoded `bg-white` Tailwind class directly on the same element that carries `.radius-card` — and Tailwind's utility wins the specificity war. Result: the dark-background CSS rule on `.radius-card` is silently overridden everywhere it matters, AND the near-white ink tokens cascade into those still-white cards, making their text nearly invisible.

**Detector findings:** `detect.mjs` flagged 4 issues — 2x spring easing (`globals.css:41,170`), 1x `transition: width` (`ImageSlider.tsx:116`), 1x `transition: height` (`WeeklyChart.tsx:65`). These are separate from the dark-mode failures.

---

## Overall Impression

The dark-mode architecture is sound in principle but unfinished in execution. The body gradient and the ink tokens correctly switch. The component backgrounds do not — they're locked in light mode by `bg-white` classes scattered across every card, nav, form, and dropdown in the codebase. The compounding problem is that the switched ink tokens make text inside those white cards literally unreadable at night. This is not cosmetic; it breaks the core reading experience.

---

## What's Working

1. **Body gradient and background** — the dark teal-blue `body.night-mode` gradient (`globals.css:86–95`) looks excellent. Deep pool-blue-black atmosphere, on-brand, avoids the generic pure-black dark mode trap.
2. **CTA buttons on landing page** — the pool-gradient CTA buttons (`landing/page.tsx:103,127`) render correctly in both modes because they use explicit `background` inline style and `text-white`, so they're unaffected by the variable cascade.
3. **Full-bleed media sections** — the hero image on `/more` and the landing features banner (`landing/page.tsx:158–182`) render well in dark mode because they're photographs with overlay gradients, not white cards.

---

## Priority Issues

### [P0] CSS variable cascade makes white-card text invisible in night-mode

**What:** `body.night-mode` sets `--color-ink: #e8f4fb` (near-white). This custom property cascades to every child including elements with hardcoded `bg-white`. Every component using `text-[color:var(--color-ink)]` or `text-[color:var(--color-ink-2)]` inside a white card renders as near-white text on white background — invisible.

**Why it matters:** This affects the literal readability of the app: register card heading, pricing tier names and prices, account form labels, stats numbers, group names, testimonial copy, and comment text all fail contrast in night-mode. WCAG AA requires 4.5:1 minimum; white-on-white is approximately 1:1.

**Fix:** Remove `bg-white` from all elements that already carry `.radius-card` or `.radius-nested`. The existing CSS system (`globals.css:101–104`) provides the correct dark background automatically — the classes just need to stop fighting it. For elements that can't use those helpers (nav bars, standalone inputs), add explicit `.night-mode` overrides.

**Files (bg-white overriding radius-card/nested):**
- `src/components/PoolVerdict.tsx:43`
- `src/components/PoolPresence.tsx:430,474`
- `src/components/PoolStreak.tsx:130,148`
- `src/components/CommentsSection.tsx:58`
- `src/components/HeaderAuth.tsx:76`
- `src/app/register/page.tsx:61`
- `src/app/more/page.tsx:126`
- `src/app/account/page.tsx:63,263,288,304,392`
- `src/app/stats/page.tsx:78,82,86,92,101,128,149`
- `src/app/groups/page.tsx:184,211,234,377`

**Suggested command:** `/impeccable polish`

---

### [P0] Night-mode only fires on the home page — all other routes ignore it

**What:** `BodyTheme` is imported only in `src/app/page.tsx:97`. The layout file does not include it. All 8 other routes never apply `night-mode` — they always render in full light mode regardless of time of day.

**Why it matters:** A user at 10pm: home page is dark, they tap "My Stats" and the page snaps to a bright light blue. The theme break at every route transition destroys the day/night signal entirely.

**Fix:** Move `<BodyTheme ... />` into `src/app/layout.tsx`. Make `BodyTheme` self-contained — compute sunrise/sunset on the client using `Date.now()` rather than requiring server-side props, so it works from the global layout.

**Files:** `src/app/layout.tsx` (add component), `src/components/BodyTheme.tsx` (make self-contained)

**Suggested command:** `/impeccable harden`

---

### [P1] `bg-white/80 backdrop-blur` navigation bars stay white on both public routes

**What:** Both `/landing` (`landing/page.tsx:98`) and `/more` (`more/page.tsx:75`) have sticky navs with `bg-white/80 backdrop-blur-md border-b border-[color:var(--color-pool-100)]`. In night-mode this renders as a milky white band pinned to the top of a dark page. The `pool-100` border is near-invisible on the dark gradient underneath.

**Fix:** Add to `globals.css`:
```css
body.night-mode nav {
  background: rgba(10, 28, 48, 0.88);
  border-color: rgba(14, 147, 212, 0.15);
}
```

**Files:** `src/app/landing/page.tsx:98`, `src/app/more/page.tsx:75`

**Suggested command:** `/impeccable polish`

---

### [P1] `HeaderAuth` button and dropdown are `bg-white` — home page only

**What:** The user auth button (`HeaderAuth.tsx:60`) uses `bg-white` and the dropdown panel (`HeaderAuth.tsx:76`) uses `bg-white`. Against the dark home page body these render as a glowing white pill and a bright popup. The dropdown's `ring-pool-100` ring becomes invisible.

**Fix:** `.night-mode` CSS overrides: button → `bg-[rgba(255,255,255,0.08)]`, dropdown → `bg-[rgba(10,28,48,0.95)]` with a stronger pool-tinted ring.

**File:** `src/components/HeaderAuth.tsx:60,76`

**Suggested command:** `/impeccable polish`

---

### [P1] Coming features grid — `bg-white` tiles break `surface-band` treatment on `/more`

**What:** The 6 feature tiles in "מה יגיע בקרוב" use `rounded-2xl bg-white px-4 py-4 ring-1 ring-[color:var(--color-pool-100)]` (`more/page.tsx:183`). The `surface-band` parent adapts to dark, but white child tiles sit on top like mismatched stickers.

**Fix:** Remove `bg-white`; replace with `bg-[color:var(--color-pool-50)]/40` or remove entirely — the band provides visual separation.

**File:** `src/app/more/page.tsx:183`

**Suggested command:** `/impeccable polish`

---

### [P2] Semantic status chips (`bg-red-50`, `bg-green-50`) have no dark variant

**What:** Account error/success messages (`account/page.tsx:320,371,374`) and the groups delete warning (`groups/page.tsx:381`) use raw Tailwind semantic colors. `bg-red-50` is `#fef2f2` — near-white in dark mode, losing all semantic signal.

**Fix:** Add to `globals.css`:
```css
body.night-mode .bg-red-50  { background: rgba(239, 68, 68, 0.12); }
body.night-mode .bg-green-50 { background: rgba(34, 197, 94, 0.12); }
```

**Files:** `src/app/account/page.tsx:320,371,374`, `src/app/groups/page.tsx:381`

**Suggested command:** `/impeccable harden`

---

### [P2] `Reveal` component gates content visibility — sections appear blank below fold

**What:** `globals.css:289` sets `.reveal { opacity: 0; transform: translateY(26px); }`. Sections only reveal on IntersectionObserver scroll. In Playwright screenshots without scroll, in headless renderers, and in OG image generators, entire sections of the landing page appear blank — the landing page desktop screenshot shows ~70% empty dark space below the hero fold.

**Why it matters:** DESIGN.md already flags this: "Reveal animations must enhance an already-visible default. Don't gate content visibility on a class-triggered transition."

**Fix:** Default `.reveal` to `opacity: 1; transform: none`. Apply the hidden starting state only when JS has loaded via a `.js-ready .reveal` wrapper, so content is visible before JS executes.

**Files:** `src/app/globals.css:289`, `src/components/Reveal.tsx`

**Suggested command:** `/impeccable harden`

---

### [P2] `PoolPresence.tsx:420` — `bg-white/85` caption overlay on pool photo

**What:** A caption panel over the pool image uses `bg-white/85 backdrop-blur-sm`. In night-mode: 85%-opaque white patch over the pool photo.

**Fix:** CSS override: `body.night-mode .pool-caption { background: rgba(10, 28, 48, 0.85); }` — or replace with a semantic surface class.

**File:** `src/components/PoolPresence.tsx:420`

**Suggested command:** `/impeccable polish`

---

### [P2] `UVGauge` tab strip — `bg-pool-50` and `bg-white` active tab stay light in dark

**What:** The day/week toggle uses `bg-[color:var(--color-pool-50)]` as the track and `bg-white` for the active thumb (`UVGauge.tsx:228,240`). `pool-50 = #eef8ff` — near-white. Both track and thumb appear as near-white elements against the dark gauge card.

**Fix:** `.night-mode` overrides: track → `rgba(14,147,212,0.12)`, active thumb → `rgba(14,147,212,0.25)`.

**File:** `src/components/UVGauge.tsx:228,240`

**Suggested command:** `/impeccable polish`

---

### [P3] Spring easing applied beyond the gauge needle

**What:** `--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)` (overshoot) is used in `.anim-pop-spring` (`globals.css:170`). DESIGN.md scopes the deliberate overshoot to "the gauge needle and swimmer pins only."

**Fix:** Audit all usages of `.anim-pop-spring`; replace with `.anim-pop` (uses `--ease-out-expo`) everywhere except the gauge needle and pins.

**File:** `src/app/globals.css:170`

---

### [P3] Layout property transitions in ImageSlider and WeeklyChart

**What:** `ImageSlider.tsx:116` uses `transition: width`; `WeeklyChart.tsx:65` uses `transition: height`. Both trigger browser layout recalculation on every animation frame.

**Fix:** Replace `width` animation with `transform: scaleX()` + `transform-origin`. Replace `height` animation with `grid-template-rows: 0fr / 1fr`.

**Files:** `src/components/ImageSlider.tsx:116`, `src/components/WeeklyChart.tsx:65`

---

## Per-Page Findings

### `/landing` (= `/` for unauthenticated users)

| Element | Issue | Severity | File:Line |
|---|---|---|---|
| Sticky nav | `bg-white/80` stays white on dark body | P1 | `landing/page.tsx:98` |
| Footer border | `border-pool-100` invisible on dark | P2 | `landing/page.tsx:304` |
| Testimonial cards (4x) | `bg-white` + near-white ink = unreadable | P0 | `landing/page.tsx:255` |
| Feature row icon badges | `bg-pool-50` reads as off-white on dark | P2 | `landing/page.tsx:56` |
| Scroll-reveal sections | All below-fold content invisible | P2 | `globals.css:289` |
| Wordmark inside nav | `--color-ink` → near-white on white nav | P2 | `Wordmark.tsx:27` |
| Aurora blobs | Render correctly on dark | OK | — |
| Hero CTA buttons | Correctly styled, unaffected | OK | — |
| Full-bleed media sections | Render correctly in dark | OK | — |

### `/register` (+ all auth-redirect routes: `/onboarding`, `/account`, `/stats`, `/groups`)

| Element | Issue | Severity | File:Line |
|---|---|---|---|
| Auth card | `bg-white` card glowing on dark body | P0 | `register/page.tsx:61` |
| Card heading | `--color-ink` → #e8f4fb on white = invisible | P0 | `register/page.tsx:66` |
| Card body text | `--color-ink-2` → #94b8cc on white = fails contrast | P0 | `register/page.tsx:67` |
| Google sign-in button | `bg-white` inside white card | P2 | `register/page.tsx:75` |
| Page body background | Night-mode applies correctly | OK | — |
| "חזרה" back link | Renders correctly | OK | — |

### `/more`

| Element | Issue | Severity | File:Line |
|---|---|---|---|
| Sticky nav | `bg-white/80` stays white | P1 | `more/page.tsx:75` |
| 4 pricing tier cards | `bg-white` overrides `.radius-card` dark CSS | P0 | `more/page.tsx:126` |
| Pricing card text | Near-white ink on white cards | P0 | `more/page.tsx:138,141,147` |
| Coming features grid (6x) | `bg-white` tiles inside adapted `surface-band` | P1 | `more/page.tsx:183` |
| Feature tile text | Near-white ink on white tiles | P0 | `more/page.tsx:185` |
| Hero image section | Renders correctly | OK | — |
| Gradient CTA ribbon | `text-white` + inline gradient — unaffected | OK | — |

### `/` (authenticated home — code review only)

| Element | Issue | Severity | File:Line |
|---|---|---|---|
| PoolVerdict card | `bg-white` overrides `.radius-card` dark | P0 | `PoolVerdict.tsx:43` |
| HeaderAuth button | `bg-white` pill on dark header | P1 | `HeaderAuth.tsx:60` |
| HeaderAuth dropdown | `bg-white` popup, invisible ring | P1 | `HeaderAuth.tsx:76` |
| PoolPresence cards (3x) | `bg-white` + cascaded near-white text | P0 | `PoolPresence.tsx:420,430,474` |
| UVGauge tab strip | `bg-pool-50` track + `bg-white` active tab | P2 | `UVGauge.tsx:228,240` |
| PoolStreak card | `bg-white` on `.radius-card` | P0 | `PoolStreak.tsx:148` |
| CommentsSection items | `bg-white` on `.radius-nested` | P1 | `CommentsSection.tsx:58` |
| Body gradient | Applies correctly | OK | — |
| `surface-band` sections | Background adapts correctly | OK | — |

### `/onboarding` (code review only)

| Element | Issue | Severity | File:Line |
|---|---|---|---|
| Telegram step card | `bg-white` modal card over dark backdrop | P0 | `onboarding/page.tsx:183` |
| Photo step card | `bg-white` modal card | P0 | `onboarding/page.tsx:259` |
| Saving overlay | `bg-white` spinner card | P0 | `onboarding/page.tsx:170` |
| Card text (all steps) | Near-white ink on white cards | P0 | `onboarding/page.tsx:192,203,270` |
| Error chips (2x) | `bg-red-50` no dark variant | P2 | `onboarding/page.tsx:236,316` |
| Icon badges | `bg-pool-50` (#eef8ff) near-white | P2 | `onboarding/page.tsx:200,266` |
| "Skip" button | `bg-pool-50` near-white | P2 | `onboarding/page.tsx:248` |

### `/groups/[code]` (code review only)

No dark-mode issues. Error state ("group not found") renders directly on the dark body gradient using CSS variables only — no `bg-white` cards.

### `/not-found` (404 page — code review only)

| Element | Issue | Severity | File:Line |
|---|---|---|---|
| "404" number | `text-[color:var(--color-pool-700)]` = #0a5784 (dark pool blue) on dark body #0c1b29 — near-invisible | P1 | `not-found.tsx:9` |
| Heading, body text | Use `--color-ink` / `--color-ink-2` — adapt correctly in night-mode | OK | — |
| CTA button | Inline gradient + `text-white` — unaffected | OK | — |

### `/account`, `/stats`, `/groups` (code review only)

| Element | Issue | Severity | File:Line |
|---|---|---|---|
| Section cards (many) | `bg-white` on all main content cards | P0 | `account/page.tsx:63,263,288,304`, `stats/page.tsx:78–149`, `groups/page.tsx:184,234,377` |
| Error/success chips | `bg-red-50`, `bg-green-50` — no dark variant | P2 | `account/page.tsx:320,371`, `groups/page.tsx:381` |
| Input fields | `bg-white` inputs | P1 | `account/page.tsx:21`, `groups/page.tsx:193` |
| Toggle thumb | `bg-white` toggle knob | P2 | `account/page.tsx:33` |
| Delete modal | `bg-white` with P0 cascade issue | P0 | `groups/page.tsx:377` |

---

## Persona Red Flags

**Casey (Distracted Mobile User — the primary persona for this app):**
Uses the app on her phone at 10pm before deciding whether to go to the pool tomorrow. Opens the app — home is dark (correct). Taps the stats icon to review last week. Stats page snaps to bright light mode. Any text she taps inside a white card (on any page) is invisible.

Red flags:
- Route transitions at night flip between dark and light with no animation or rationale
- Register card, pricing cards, stats cards — all have invisible text in dark mode
- `Reveal` content hidden below fold means she may see a half-blank landing page

**Sam (Accessibility-Dependent User):**
Red flags:
- `#e8f4fb` on `#ffffff` = ~1.01:1 contrast — catastrophic failure on every white card in dark mode
- `bg-red-50 text-red-600` error chip in dark: red-600 on near-white red-50 passes barely, but the chip no longer visually reads as an alert
- Input field `bg-white` in dark: text cursor and placeholder (`--color-ink-3: #5a7d94`) have very low contrast on white

---

## Minor Observations

- **Wordmark inside white/80 nav:** "UV Pool" text uses `--color-ink`, which becomes near-white in night-mode. Inside the `bg-white/80` nav, the wordmark is near-invisible. (`Wordmark.tsx:27`)
- **`pool-100` rings everywhere:** `ring-[color:var(--color-pool-100)]` is `#d9eefc` — effectively invisible on dark backgrounds. All card ring borders disappear in night-mode.
- **`pool-50` elements:** Used for hover states, chips, section backgrounds — `#eef8ff` appears as off-white patches in dark mode. Needs a dark-mode token alternative (`rgba(14,147,212,0.10)` is a solid starting point).
- **`more/page.tsx` sun blob:** The animated sun-yellow blob on `/more` renders as a muted warm glow against dark — one of the few unintended but pleasant dark-mode effects.
- **`MoreUVWaitlist` component:** Not audited — client component, likely contains `bg-white` inputs and submit button.

---

## Questions to Consider

- Is night-mode intended to be automatic-only, or will a user preference toggle be added? The answer changes the architectural approach significantly.
- Should white cards in night-mode become glass/translucent rather than opaque dark? The current `rgba(14,30,44,0.85)` already does this — the question is whether to fight Tailwind class specificity at the CSS level (one rule overriding `bg-white` globally in `.night-mode`) rather than fixing each component.
- Is the Reveal opacity gate intentional? Fixing it benefits SSR, OG images, and accessibility without changing the visual for real users.

---

## Summary: Fix Priority Order

| Priority | Count | Core description |
|---|---|---|
| P0 | 3 | CSS cascade → invisible text in white cards; bg-white overrides radius-card/nested system; night-mode missing from 8/9 routes |
| P1 | 4 | Nav bars white on dark; HeaderAuth; coming-features grid; auth card inputs |
| P2 | 6 | Semantic color chips; Reveal opacity gate; pool-presence caption; UVGauge strip; pool-50/pool-100 tokens |
| P3 | 2 | Spring easing scope; layout property transitions |

**Recommended fix sequence:**
1. `/impeccable harden` — move BodyTheme to layout.tsx; fix Reveal opacity gate
2. `/impeccable polish` — strip bg-white from all radius-card/nested elements; nav dark overrides
3. `/impeccable polish` — HeaderAuth, UVGauge, pool-50/pool-100 token overrides
4. `/impeccable harden` — semantic status token dark variants

Screenshots saved to `video-demo/dark-mode-qa/`.
