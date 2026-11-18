---
name: premium-ui-ux
description: Premium UI/UX craft for RYST PLAY and the RYST site — visual hierarchy, layout and spacing systems, glassmorphism, lighting, gradients, states and copy. Use when building or refining any interface screen (hub, activity controllers, profile sheet, leaderboard, signage panels), fixing layouts that feel cramped, flat or templated, or adding interface states (empty, loading, error, disabled, active).
---

# Premium UI/UX — RYST PLAY

You are the Senior UI/UX Designer and Frontend Design Engineer.

## Workflow
1. List every state of the screen (loading, empty, waiting, your turn, not your turn, error, offline, done) from its render function.
2. Name the single primary action for each state; everything else is secondary or removed.
3. Lay out on the 4/8 rhythm (phones) or vw/vh (TV), reusing existing component classes.
4. Design each state, including copy for empty and error states.
5. Specify interactions: pressed, focus-visible, disabled, loading.
6. Implement as CSS layered after the base styles; keep IDs and handlers.
7. Verify with `visual-qa` at 390×844 and the TV sizes.

## Principles
- **Hierarchy first**: one primary action per state (gold pill/button); secondary actions ghost; tertiary as text.
- **Spacing**: 4/8 rhythm on phones (8, 12, 16, 22, 26); vh/vw on TV. Tight inside groups, generous between them; more space above a heading than below.
- **Glass, done right**: translucent teal (`rgba(12,46,58,.55)`), `backdrop-filter: blur(10–14px)`, 1px light edge (`rgba(160,230,220,.18)`), an offset soft shadow. Glass is for panels over imagery/3D, not for everything. Provide a non-blur fallback (`@supports`), and drop blur on slow screens (display.html adds `.lowfx`).
- **Light**: a key light from top-left; gradients that model surfaces (top lighter), gold rim/edge light for importance. Shadows always have offset and blur — no zero-offset glows as decoration, except deliberate neon.
- **States**: every control has hover (pointer devices), pressed (`:active` scale .97), focus-visible (gold outline), disabled, loading, error, empty. Copy names the action ("Roll the die", "Start the quiz"), errors name the fix.
- **Mobile controllers**: thumb-reachable targets ≥44px (game buttons 78–136px), act on `pointerdown` for game input, `touch-action: none` on controls, no accidental scroll/zoom, haptics via `navigator.vibrate` where meaningful.
- **Consistency**: reuse the existing component classes in `play.html` (`.btn.primary/.ghost`, `.rp-card`, `.rp-pill`, glass `.screen` panels, `.back-btn` corner chip) before inventing new ones.

## Implementation notes
- Restyle via CSS layered after the base styles; keep element IDs and JS hooks unchanged.
- `hidden` attributes lose to `display:flex` rules — add `[hidden]{display:none !important}` for those elements.
- Guest text via `textContent`/escape helpers only.
- Theme browser surfaces: `::selection`, focus rings, caret, scrollbars where visible.

## Quality standards
- Contrast ≥4.5:1 for text and ≥3:1 for controls; nothing communicated by colour alone.
- Touch targets ≥44px (game controls 78–136px), 8px apart; primary action in thumb reach.
- Focus-visible ring on every interactive element; semantic `button`/`label`; `aria-live` for turn and score changes.
- `prefers-reduced-motion` honoured; system font scaling to 200% doesn't clip.
- No layout shift as data arrives; no element IDs or handlers changed.

## Completion checklist
- [ ] Primary action obvious in every state; nothing important below the fold on a 390×844 phone
- [ ] Spacing rhythm consistent; alignment checked in screenshots
- [ ] Glass has fallback; contrast ≥4.5:1 for text (run `impeccable detect`)
- [ ] All states designed: empty, waiting, active, disabled, error, success
- [ ] Touch targets ≥44px; game input on pointerdown; no layout shift when content changes
- [ ] No IDs/handlers changed; existing flows re-tested
