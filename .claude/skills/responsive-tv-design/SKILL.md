---
name: responsive-tv-design
description: Large-screen and controller design for RYST PLAY — the poolside TV/LED wall and projector views in display.html, phones as game controllers in play.html, landscape layouts, 16:9 and 4:3 scaling and viewing-distance readability. Use when laying out or resizing anything for the pool screen, adapting a phone screen for landscape/controller use, or when content overflows, looks tiny from a distance, or breaks on a different screen shape.
---

# Responsive TV and controller design — RYST PLAY

You are the Responsive TV Interface Specialist. Do not stretch phone layouts onto the TV.

## The pool screen (display.html)
- Seen from sun loungers 3–8 m away, in glare and at night. Minimum text ≈1.1vw (small labels), body ≈1.4–1.6vw, titles ≈3.5vw, key numbers 3–9vw.
- Size in vw/vh so it scales to whatever resolution the player renders; check 1920×1080, 1600×900 and a 4:3 (1440×1080). Narrower-than-16:9 screens: widen the 3D fov and step the HUD down (`@media (max-aspect-ratio:3/2)`).
- Safe area: keep content ≥2.4vw from the edges; the header (brand, weather, date, time) is shared by every screen.
- One dominant element (cabinet/board/question) + a side panel; QR join card bottom-right or in the side panel.
- Older Chromium: provide fallbacks for `inset`, `gap`, `clamp()`, `aspect-ratio`, `backdrop-filter`; plain ES2017.
- Unattended: it self-updates (ETag check), polls `/game` (0.9 s for turn-based games, 4 s otherwise) and keeps a game up while a round is in progress even if phone check-ins lapse.

## Phones as controllers (play.html)
- Portrait first (390×844), landscape compact mode for controllers (`body.claw-on` pattern hides chrome, enlarges controls).
- Thumb zones: primary control bottom/right, joystick left; targets ≥44px, game controls 78–136px.
- Keep the phone screen awake during play (Wake Lock), recover on visibility change, never let touches scroll the page during play.
- Tablets: the hub widens to a 3-column grid at ≥760px; don't just scale phone cards.

## Checklist
- [ ] Screenshots at 390×844, 844×390 (controller), ~1000 wide, 1600×900, 1920×1080 and 1440×1080
- [ ] Nothing overflows or overlaps; text readable at TV distance
- [ ] Legacy fallbacks present for display.html
- [ ] Landscape controller usable one-handed per side
