---
name: art-direction
description: Art direction for RYST 109A and RYST PLAY — premium coastal-resort branding, visual identity, creative direction, brand consistency, moodboards, colour theory, typography pairing and composition. Use before designing or restyling any RYST surface (play.html hub or activity screens, display.html pool-screen views, the public villa site), when choosing palettes, fonts or illustration style, when a design looks generic or "AI-made", or when the user shares a visual reference to follow.
---

# Creative art direction — RYST

You are the Creative Director and Luxury Brand Art Director. Decide the idea before the pixels.

## The RYST world
A premium coastal resort at night by the pool: deep teal water, champagne-gold light, warm ivory
linen, seafoam highlights, palm silhouettes, soft caustics. Calm luxury, never casino. Playful only
inside the games, and even then crafted — think boutique resort games room, not app-store clone.

Tokens (design system v2, see CLAUDE.md for the full table): deep teal `#07333B`, champagne gold
`#D8B879` (highlight `#F7DFA4`), warm ivory `#F6F3EC`, seafoam `#A9CFC5`. Type: Inter 600–800 for
interface text and numbers; Cormorant Garamond for display headings, italic for the accent word.

## Target brand palette (redesign)

New and redesigned screens move to these values, through CSS custom properties rather than one hex at a time. The tokens above are what the code uses today.

| Token | Target | Today |
|---|---|---|
| Deep Teal | `#07333B` | `#06202a` to `#0f4656` |
| Champagne Gold | `#D8B879` | `#e2bf73` (TV `#f2c66d`) |
| Warm Ivory | `#F6F3EC` | `#f4efe4` / `#fbfaf8` |
| Seafoam | `#A9CFC5` | `#7fe3d4` |

Gold on ivory fails contrast; gold text belongs on teal, at large sizes.

## Workflow
1. **Read the incumbent.** Open the target page and screenshot it. Note what already works; refinement preserves identity.
2. **Write a one-paragraph direction** before coding: the idea, the focal element, palette roles, type roles, illustration style, the one authored moment.
3. **Moodboard from what exists**: villa photos in `assets/` (gallery, pool, recreation hall, BBQ), `beach-art.js` illustrations, the user's reference image. Name 2–3 concrete traits to carry (e.g. "gold rim light on glass", "neon on dark for party moments").
4. **Composition**: one dominant element per screen (the cabinet, the board, the question); a clear reading order; asymmetry where it adds energy (featured card spanning the row); never six identical cards in a uniform grid without a reason.
5. **Colour**: 60/30/10 — teal ground, ivory content, gold accent. Player colours only for player identity. Neon only for game marks and party screens. Check contrast (≥4.5:1 body, ≥3:1 large).
6. **Typography**: scale with intent (TV titles ≈3.5vw, phone titles 25–44px); weight steps 600/700/800; tabular numerals for scores and clocks; no serif numerals.
7. **Illustration**: authored SVG or canvas, consistent stroke and lighting (light from top-left), soft shadows with offset; no emoji, no clip-art, no stock icons mixed with custom art.

## Quality standards
- Every colour in new CSS is a custom property or a documented player/game colour; no stray hex values.
- Text contrast meets WCAG AA (4.5:1 body, 3:1 large), measured, not judged by eye; TV body text aims for 7:1 because of glare.
- At most two type families and five type sizes per screen; every number in Inter tabular.
- Gold appears in one or two places per view (reward, primary action, leader).
- The direction is written down where the next session will find it (commit message or `DESIGN.md`).

## Completion checklist
- [ ] Direction written and followed; one focal element per screen
- [ ] Palette from tokens; gold reserved for reward/primary action/leaders
- [ ] Type roles consistent with the rest of RYST PLAY; numbers in Inter tabular
- [ ] Every icon/illustration custom and stylistically consistent; zero emoji
- [ ] Each game has its own personality (neon TTT, beach memory, coastal-luxury claw) inside the shared frame
- [ ] Compared against the reference/previous version in real screenshots (visual-qa)
