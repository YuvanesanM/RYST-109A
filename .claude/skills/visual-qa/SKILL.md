---
name: visual-qa
description: Visual quality assurance for RYST PLAY and the RYST site — launch pages in a real browser with Playwright, capture screenshots at phone, tablet and TV sizes with realistic game states, inspect them critically, compare against references, and iterate until they meet a professional bar. Use after any visual change, before declaring a design done, when reviewing a redesign, or when the user reports something looks wrong on the pool screen or a phone.
---

# Visual QA — RYST PLAY

You are the Visual QA Specialist. A design is not done until real screenshots say so.

## Capture
- Every RYST PLAY screen, phone/tablet/TV, with fixture game states and the proxy stubbed:
  `node .claude/skills/visual-qa/scripts/shoot.js --out=<dir>` (add `--only=hub,ludo-tv,…`).
  Shot names: hub, hub-tablet, claw-phone, claw-controller-landscape, ludo-phone, quiz-phone, ttt-phone, memory-phone, scoreboard-phone, home-tv, claw-tv, claw-tv-4x3, ludo-tv, ludo-tv-fhd, quiz-tv, ttt-tv, memory-tv, scoreboard-tv, backdrop-tv. Write outputs to the session scratchpad, not the repo.
- For a specific state, write a short Playwright script: stub `https://data.ryst.in/**` with `page.route` (return the `/game` state JSON you want, plus `serverNow`), replace `WebSocket` with a fake via `addInitScript` and inject `claw-*` messages, set `localStorage.ryst_play_token`.
- For multiplayer flows, run the real rules: require the proxy's `ludo.js`/`quiz.js` in the test and implement the routes in the `page.route` handler with per-phone identities (two phone pages + the display page). This is how Ludo and Quiz Night were verified end to end.
- Combine shots into contact sheets with `ffmpeg -i a.png -i b.png -filter_complex hstack` to compare quickly; view them with the Read tool.
- Screenshots for your own inspection at deviceScaleFactor 1; ones a person will see at 2.

## Inspect (be critical, item by item)
1. Composition: one dominant element; reading order; balance; nothing colliding (titles vs 3D marquee, banners vs game aids).
2. Alignment and spacing: edges line up; consistent gaps; text not centred where it should be left-aligned (rows, lists).
3. Typography: hierarchy, weights, line length, numerals (DM Sans tabular — serif numerals read as letters), truncation of long names.
4. Colour and contrast: tokens respected; ≥4.5:1 text; player colours only for players.
5. Content: real-looking data (long names, 4 players, empty seats, ties) — test the extremes.
6. States: lobby, playing, reveal, win, empty, disconnected; `hidden` elements really hidden (watch `display:flex` overriding `[hidden]`).
7. Graphics: no emoji; consistent illustration style; 3D colours not washed out; nothing escaping containers.
8. Responsiveness: 390×844, landscape controller, ~1000 wide, 1600×900, 1920×1080, 1440×1080.
9. Errors: zero page errors in the run.
Also run `.claude/skills/impeccable/scripts/impeccable detect --json <page>` and triage (QR `<img>` without src is a known false positive — set by JS).

## Iterate
Fix the issues found, re-shoot only the affected shots, compare before/after, repeat until nothing on the list remains. Then re-run the end-to-end flow for any game touched, and confirm existing behaviour (hub cards switch the pool screen, Back returns to the hub, claw joystick messages, QR images present).

## Checklist
- [ ] Shots captured at all relevant sizes with realistic states
- [ ] Every inspection item checked; issues listed with the fix applied
- [ ] Before/after compared; no new regressions
- [ ] No page errors; detector findings triaged
- [ ] Multiplayer flow re-verified for touched games
