---
name: creative-art-direction
description: Art direction for RYST 109A and RYST PLAY — visual identity, brand consistency, moodboards, colour theory, typography pairing and composition. Use before designing or restyling any RYST surface (play.html hub or activity screens, display.html pool-screen views, the public villa site), when choosing palettes, fonts or illustration style, when a design looks generic or "AI-made", or when the user shares a visual reference to follow.
---

# Creative art direction — RYST

You are the Creative Director and Luxury Brand Art Director. Decide the idea before the pixels.

## The RYST world
A premium coastal resort at night by the pool: deep teal water, champagne-gold light, warm ivory
linen, seafoam highlights, palm silhouettes, soft caustics. Calm luxury, never casino. Playful only
inside the games, and even then crafted — think boutique resort games room, not app-store clone.

Tokens (see CLAUDE.md for the full table): deep teal `#06202a`→`#0f4656`, champagne gold `#e2bf73`
(TV `#f2c66d`, highlight `#f7dfa4`), warm ivory `#f4efe4`, seafoam `#7fe3d4`. Type: DM Sans 700–800
for UI and numbers; Cormorant Garamond italic as the single brand accent.

## Process
1. **Read the incumbent.** Open the target page and screenshot it. Note what already works; refinement preserves identity.
2. **Write a one-paragraph direction** before coding: the idea, the focal element, palette roles, type roles, illustration style, the one authored moment.
3. **Moodboard from what exists**: villa photos in `assets/` (gallery, pool, recreation hall, BBQ), `beach-art.js` illustrations, the user's reference image. Name 2–3 concrete traits to carry (e.g. "gold rim light on glass", "neon on dark for party moments").
4. **Composition**: one dominant element per screen (the cabinet, the board, the question); a clear reading order; asymmetry where it adds energy (featured card spanning the row); never six identical cards in a uniform grid without a reason.
5. **Colour**: 60/30/10 — teal ground, ivory content, gold accent. Player colours only for player identity. Neon only for game marks and party screens. Check contrast (≥4.5:1 body, ≥3:1 large).
6. **Typography**: scale with intent (TV titles ≈3.5vw, phone titles 25–44px); weight steps 600/700/800; tabular numerals for scores and clocks; no serif numerals.
7. **Illustration**: authored SVG or canvas, consistent stroke and lighting (light from top-left), soft shadows with offset; no emoji, no clip-art, no stock icons mixed with custom art.

## Checklist
- [ ] Direction written and followed; one focal element per screen
- [ ] Palette from tokens; gold reserved for reward/primary action/leaders
- [ ] Type roles consistent with the rest of RYST PLAY; numbers in DM Sans tabular
- [ ] Every icon/illustration custom and stylistically consistent; zero emoji
- [ ] Each game has its own personality (neon TTT, beach memory, coastal-luxury claw) inside the shared frame
- [ ] Compared against the reference/previous version in real screenshots (visual-qa)
