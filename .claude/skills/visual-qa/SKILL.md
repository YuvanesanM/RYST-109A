---
name: visual-qa
description: Visual quality assurance for RYST PLAY and the RYST site — launch pages in a real browser with Playwright, capture screenshots at phone, tablet and TV sizes with realistic game states, inspect them critically, compare against references, and iterate until they meet a professional bar. Use after any visual change, before declaring a design done, when reviewing a redesign, or when the user reports something looks wrong on the pool screen or a phone.
---

# Visual QA — RYST PLAY

You are the Visual QA Specialist. A design is not done until real screenshots say so.

## Capture
- Every RYST PLAY screen, phone/tablet/TV, with fixture game states and the proxy stubbed:
  `node .claude/skills/visual-qa/scripts/shoot.js --out=<dir>` (add `--only=hub,ludo-tv,…`).
  Add `--sizes=matrix` to repeat each shot at every size for its page (TV 1280×720 … 3840×2160 and 4:3 1440×1080,
  1024×768; phone 360×640 … 844×390 landscape and tablet), and `--audit` to print what a viewer would notice: horizontal
  scroll, content past the screen edge, clipped text, and TV text under 1.5% of the screen height (`<out>/audit.json`).
  Shots ending in `-tap` are smoke tests that tap a control and print the POSTs it sent.
  Shot names: hub, hub-tablet, claw-phone, claw-controller-landscape, ludo-phone, quiz-phone, ttt-phone, memory-phone, scoreboard-phone, home-tv, claw-tv, claw-tv-4x3, ludo-tv, ludo-tv-fhd, quiz-tv, ttt-tv, memory-tv, scoreboard-tv, backdrop-tv. Write outputs to the session scratchpad, not the repo.
- For a specific state, write a short Playwright script: stub `https://data.ryst.in/**` with `page.route` (return the `/game` state JSON you want, plus `serverNow`), replace `WebSocket` with a fake via `addInitScript` and inject `claw-*` messages, set `localStorage.ryst_play_token`.
- For multiplayer flows, run the real rules: require the proxy's `ludo.js`/`quiz.js` in the test and implement the routes in the `page.route` handler with per-phone identities (two phone pages + the display page). This is how Ludo and Quiz Night were verified end to end.
- Combine shots into contact sheets with `ffmpeg -i a.png -i b.png -filter_complex hstack` to compare quickly; view them with the Read tool.
- Screenshots for your own inspection at deviceScaleFactor 1; ones a person will see at 2.

### Generic capture, checks and comparison
Two extra scripts work on any page, alongside `shoot.js`:
- `node .claude/skills/visual-qa/scripts/capture.mjs http://127.0.0.1:8765/display.html --sizes tv720,tv,tv4k,1440x1080 --tv-min-vw 1.1 --distance --block "**/data.ryst.in/**" --out <scratch>/display`
  Screenshots plus automatic checks (page errors, horizontal overflow, TV scrolling, text below the minimum, text outside a 5% safe area, tap targets under 44px on phones, broken images); prints PASS/FAIL, writes `report.json`, exits 1 on failure. `--mock "<glob>=<file.json>"` serves a fixture; `--storage '{"ryst_play_token":"t"}'`; `--reduced-motion`.
- `node .claude/skills/visual-qa/scripts/compare.mjs before.png after.png --out diff.png` prints the share of pixels that changed and the changed region, and writes a magenta diff image.

## Workflow
1. Baseline: shoot the affected screens before changing anything.
2. Change, then shoot `after` with the same fixtures and sizes.
3. Run `capture.mjs` on the changed pages for the mechanical checks.
4. Open every screenshot and go through the inspection list below.
5. Fix, re-shoot, and `compare.mjs` against the baseline until only intended changes remain.
6. Re-run the multiplayer flow for any game touched, then report what was and wasn't verified.

## Inspect (be critical, item by item)
1. Composition: one dominant element; reading order; balance; nothing colliding (titles vs 3D marquee, banners vs game aids).
2. Alignment and spacing: edges line up; consistent gaps; text not centred where it should be left-aligned (rows, lists).
3. Typography: hierarchy, weights, line length, numerals (Inter tabular — serif numerals read as letters), truncation of long names.
4. Colour and contrast: tokens respected; ≥4.5:1 text; player colours only for players.
5. Content: real-looking data (long names, 4 players, empty seats, ties) — test the extremes.
6. States: lobby, playing, reveal, win, empty, disconnected; `hidden` elements really hidden (watch `display:flex` overriding `[hidden]`).
7. Graphics: no emoji; consistent illustration style; 3D colours not washed out; nothing escaping containers.
8. Responsiveness: 390×844, landscape controller, ~1000 wide, 1600×900, 1920×1080, 1440×1080.
9. Errors: zero page errors in the run.
Also run `.claude/skills/impeccable/scripts/impeccable detect --json <page>` and triage (QR `<img>` without src is a known false positive — set by JS).

## Iterate
Fix the issues found, re-shoot only the affected shots, compare before/after, repeat until nothing on the list remains. Then re-run the end-to-end flow for any game touched, and confirm existing behaviour (hub cards switch the pool screen, Back returns to the hub, claw joystick messages, QR images present).

## Quality standards
- No visual change is reported done without real screenshots at the relevant sizes.
- `capture.mjs` passes for each changed page, or every remaining failure is explained and accepted.
- Zero page errors during the run; detector findings triaged.
- Every claim in the final report is backed by a screenshot or script output; unverified parts are named.

## Completion checklist
- [ ] Shots captured at all relevant sizes with realistic states
- [ ] Every inspection item checked; issues listed with the fix applied
- [ ] Before/after compared; no new regressions
- [ ] No page errors; detector findings triaged
- [ ] Multiplayer flow re-verified for touched games
