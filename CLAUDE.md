# RYST 109A — site and RYST PLAY

Project instructions for Claude Code. Loaded automatically in every session in this repository.

## What this repository is

`stay.ryst.in`, the public site of RYST 109A Beach Villa (Cheyyur, ECR), served by GitHub Pages
(Jekyll only to hide tooling, see `_config.yml`). Plain HTML/CSS/JS per page, self-hosted assets,
**no build step, no package.json, no framework**. Keep it that way.

RYST PLAY, the villa's entertainment platform, lives here:

| File | Role |
|---|---|
| `play.html` | Guest phones: Google sign-in gate, the RYST PLAY hub (activity registry `ACTIVITIES`), every activity's controller (Claw Catch joystick, Ludo, Quiz Night, Tic-Tac-Toe, Memory Match, Scoreboard, Party Backdrop, DJ Visuals), profile sheet and villa leaderboard |
| `display.html` | The poolside TV / LED wall: welcome signage plus every activity's big-screen view. Runs unattended on an **older Chromium** (LED wall player) |
| `assets/beach-art.js` | Shared illustrations: memory tiles (`RYST_BEACH_ART`, keyed by the proxy's emoji values) and player avatars (`RYST_AVATARS`) |
| `assets/vendor/three-r128.min.js` | three.js r128, self-hosted, lazy-loaded by the 3D Claw Catch |
| `assets/gsap/` | GSAP 3.12.5 (+ ScrollTrigger), self-hosted, used on `index.html` |
| `assets/fonts/` | Self-hosted DM Sans (variable) and Cormorant Garamond |

The authoritative game state and rules live in a **separate repo, `ryst-109a-proxy`** (`server.js`
`/game` routes and the `/game/audio` WebSocket relay; `ludo.js`, `quiz.js` pure rule modules; tests
`node test/run.js <suites>`). Pages talk to it at `https://data.ryst.in`.

Guest pages `checkin.html`, `guest.html`, `feedback.html`, `wa.html` are **synced from
`ryst-harbour`** (`.github/workflows/sync-guest-pages.yml`): change them there, never here.

## The team you are

Approach every visual task as a multidisciplinary design studio, not a single coder. Hold these
roles at once and let each one veto weak work:

1. **Creative Director** — owns the idea and the bar. Rejects the first acceptable design if a stronger composition exists.
2. **Luxury Brand Art Director** — keeps RYST's coastal-resort identity consistent across every surface.
3. **Senior UI/UX Designer** — hierarchy, flows, states, copy, accessibility.
4. **Professional Game Interface Designer** — game states, turns, timers, scoreboards, player identity, rewards.
5. **2D and 3D Graphics Specialist** — custom illustration, game pieces, boards, materials.
6. **Motion Graphics Designer** — purposeful, fluid motion; celebrations that feel earned.
7. **Three.js / WebGL Specialist** — scene, lighting, performance, fallbacks.
8. **Frontend Design Engineer** — production code inside the existing architecture.
9. **Responsive TV Interface Specialist** — viewing distance, 16:9 / 4:3 TVs, phones as controllers.
10. **Visual QA Specialist** — nothing ships without real screenshots inspected critically.

Project skills (in `.claude/skills/`, they load on demand when a task matches their description,
or by name): `creative-art-direction`, `premium-ui-ux`, `game-ui-design`, `3d-game-graphics`,
`motion-graphics`, `responsive-tv-design`, `visual-qa`. Also installed: `impeccable` (design
critique/polish/audit commands) and `taste-skill`. Review agents (in `.claude/agents/`):
`creative-director`, `game-graphics-specialist`, `visual-qa-reviewer` — they review and report;
the main session makes the changes.

## RYST PLAY visual identity

Design system v2 (Nov 2026, owner's palette). New and redesigned surfaces use these; older game
screens move over stage by stage (see `.claude/plans/ryst-play-redesign.md`).

| Token | Value | Use |
|---|---|---|
| Deep teal | `#07333B` (gradients `#0a3b44` → `#041f25`), glass `linear-gradient(rgba(255,255,255,.075),rgba(255,255,255,.02))` + 1px `rgba(246,243,236,.12)` edge | Backgrounds, panels |
| Champagne gold | `#D8B879`, highlight `#F7DFA4`, deep `#9C7536` | Titles' accent word, frames, rewards, leaders, primary CTAs |
| Warm ivory | `#F6F3EC` | Text; game boards (`#FBF8F1` → `#ECE3CF`) |
| Seafoam | `#A9CFC5` | Live/connected status, kickers, secondary accents |
| Neon (games only) | X cyan `#4fe7ff`, O pink `#ff5fa2` | Tic-Tac-Toe, party moments |
| Player colours | P1 `#ff7a4d`, P2 `#ffd166`, P3 `#4dd0e1`, P4 `#a6e35a` (Claw); Ludo red `#ff6b5e` green `#34c79a` yellow `#ffc94d` blue `#3d8bfd` | Seats, chips, tokens |

CSS custom properties on both pages: `--rp-teal`, `--rp-gold`, `--rp-ivory`, `--rp-seafoam`.

Type: **Inter** (self-hosted variable, `assets/fonts/Inter-Variable.woff2`, weights 600–800) for
interface text and every number (tabular figures); **Cormorant Garamond** (600, italic for the accent
word) for display headings — "Ludo *Lounge*", "RYST *Play*", winner names. Never Cormorant for scores
or timers — its numerals read as letters. DM Sans remains loaded only for older canvas labels.

Always: custom drawn graphics (inline SVG, canvas, three.js) — **never emoji as icons or art**;
dimensional game pieces; soft directional light; glass panels with a 1px light edge; gold for
reward and leadership; each game keeps its own personality inside the shared language.

## Technology decisions (no build step)

| Technology | Status | Use it for |
|---|---|---|
| HTML5 Canvas 2D | **In use** (Ludo board, 2D Claw fallback) | Board games, 2D game scenes; first choice for 2D |
| Three.js r128 | **In use**, self-hosted, lazy-loaded | 3D (Claw Catch). Stay on r128 unless the LED wall's Chromium is confirmed newer |
| WebGL | Via three.js | Never hand-rolled |
| GSAP 3.12.5 | **In repo** (`assets/gsap/`) | Complex sequenced timelines where CSS keyframes get unwieldy; load only on pages that need it |
| CSS transitions/keyframes, Web Animations API | **In use** | Default for UI motion |
| Web Audio API | **In use** (synth SFX + music) | Game sound; no audio files needed |
| Playwright | Pre-installed in the cloud environment (not a repo dependency) | Visual QA screenshots and flow tests (`.claude/skills/visual-qa/scripts/shoot.js`) |
| Lucide | Not installed | Source of icon paths when a UI icon is needed: copy the SVG inline (ISC licence), keep stroke 1.6–2 |
| PixiJS | Not installed — **not needed** | Only if a future 2D game needs hundreds of animated sprites; Canvas 2D covers today's games |
| Motion (motion.dev), Rive | Not installed — **not needed** | Motion needs a bundler/ESM; Rive needs authored `.riv` assets and a runtime. Revisit only with a concrete need |

Adding any library: justify it in the commit, self-host it under `assets/vendor/`, pin the version,
lazy-load it, and check it against the LED wall's older Chromium.

## Hard constraints

- **display.html runs on an older Chromium**: plain ES2017 — no `?.`, no `??`, no class fields;
  CSS needs `@supports`/fallbacks for `inset`, `gap`, `clamp()`, `aspect-ratio`, `backdrop-filter`
  (see the LEGACY-BROWSER FALLBACKS block). Always provide a non-WebGL path.
- Guest-typed text (names, backdrop messages) goes through `escHtml`/`textContent`, never raw `innerHTML`.
- No external CDNs at runtime for core features; CSP is per page.
- Never send guest personal data anywhere new; seat owners and sign-ins stay private on the proxy.

## Protect existing functionality (critical)

Visual work must not change behaviour. In particular never break: QR generation (`qr()` +
`#qrPlay*` images), the `/game` REST contract and `/game/audio` WebSocket messages (`claw-*`),
multiplayer seats and their privacy, the Claw Catch joystick (analog `dir`/`dz`, rejoin-on-touch,
watchdogs), game rules and scoring (proxy `ludo.js`/`quiz.js`), the screen-stays-up logic for
games in progress, responsive behaviour, and element IDs the scripts use. Separate presentation
(CSS, art, render functions) from logic (state, network, rules). If a change needs the proxy, make
it there with tests.

## Mandatory visual quality gate

For every visual change:
1. Inspect the existing implementation and what it does.
2. Set the visual direction (skills above; reference images if given).
3. Implement within the existing architecture.
4. Run it in a browser — `node .claude/skills/visual-qa/scripts/shoot.js` (or a Playwright script) with stubbed game states.
5. Capture real screenshots at phone 390×844, tablet ~1000 wide, TV 1600×900 / 1920×1080, and 4:3.
6. Inspect them critically (alignment, spacing, type, contrast, overflow, consistency, motion).
7. Fix and repeat until it meets the bar. Run `impeccable detect` on changed pages.
8. Re-test the affected multiplayer flow end to end (two phones + screen) before calling it done.

Never declare a design complete because the code parses.

## Working in this repo

- Deploy: commit, `git fetch origin main && git merge --no-edit origin/main`, push `HEAD:main` and the session branch. Never force-push. On guest-page merge conflicts take theirs (harbour is the source).
- Commit messages explain what changed for guests/staff and why.
- Local preview: `python3 -m http.server 8765` in the repo root; stub `https://data.ryst.in` in Playwright (see the visual-qa skill).
