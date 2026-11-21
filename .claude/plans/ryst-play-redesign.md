# RYST PLAY — ecosystem redesign: audit and staged plan

Owner brief: "RYST PLAY – Complete game ecosystem redesign & enhancement" (Nov 2026).
This file is the working plan. Update the status column at the end of each stage.

## 1. Audit (Stage 1)

### Architecture as it stands
| Piece | Where | Notes |
|---|---|---|
| Phone hub + controllers | `play.html` (~1650 lines) | `ACTIVITIES` registry, `showScreen`, `render()`, 1.2 s poll of `GET /game`, Google sign-in gate (`ryst_play_token`) |
| Pool screen | `display.html` (~3150 lines) | `refreshGame` loop (0.9 s for Ludo/Quiz, 4 s otherwise), `updateMainScreen` picks the screen; view modules `Claw3D`, `Claw2D`, `LudoView`, `QuizView`; TTT/Memory/Scoreboard/Backdrop/DJ are render functions |
| Shared art | `assets/beach-art.js` | memory tiles, 8 avatars (SVG) |
| 3D | `assets/vendor/three-r128.min.js` | lazy-loaded by Claw Catch and (now) Ludo Lounge |
| Rules + state | `ryst-109a-proxy` | `server.js` `/game` routes + `/game/audio` WS (claw-*); `ludo.js`, `quiz.js` pure modules; private maps (`ludoOwners`, `quizPriv`, `playProfiles`); leaderboard `gameState.leaders` |
| Admin | `guest.html` (synced from ryst-harbour) | admin picker "Screen games" hands a token to play.html; no dedicated games console yet |

### Inventory and findings
| Activity | State before this programme | Main gaps against the brief |
|---|---|---|
| Claw Catch | 3D cabinet, 4 phones, analog joystick, music, premium HUD | Stage 3: lighting pass, prize reveal, per-player results card, design-system v2 colours |
| Ludo Lounge | Flat canvas board, round tokens, flat die, basic panel | **Redone in Stage 2** (below) |
| Quiz Night | 4 teams, 40 questions, countdown ring, averages | Categories (movies, music, children), live leaderboard between questions, results card |
| Tic-Tac-Toe | Neon marks, P1/P2 chips | Winning-line animation, best-of-three, draw state, replay |
| Memory Match | Beach art tiles, 2 players | 3D flips, difficulty (4×3 / 4×4 / 6×4), timer, moves, celebration |
| Scoreboard | Player colours, crown | Avatars, per-game scores, rank animation, reset / new session |
| Party Backdrop | Neon script, bulbs, palms | Templates (birthday, anniversary, welcome), animated backgrounds |
| DJ Visuals | Spectrum presets | Cinematic, audio-reactive, ambient mode |
| Shared | Profiles, leaderboard, QR | Shared components (identity, connection dot, QR panel, countdown, winner card, sound/volume, pause/resume) |
| Admin | None for games | Unified games console inside the existing admin flow |

Technology check: no build step, no package.json. three.js r128 and GSAP 3.12.5 are already self-hosted;
Canvas 2D, CSS 3D, Web Audio are enough for every planned game. No new libraries needed for Stages 2–7
(PixiJS, Rive, Motion: not needed). The LED wall's older Chromium means ES2017 and CSS fallbacks on
`display.html`; every 3D view keeps a 2D path.

## 2. Design system v2 (Stage 1)
- Palette: deep teal `#07333B`, champagne gold `#D8B879`, warm ivory `#F6F3EC`, seafoam `#A9CFC5`
  (CSS vars `--rp-teal`, `--rp-gold`, `--rp-ivory`, `--rp-seafoam` on both pages).
- Type: Cormorant Garamond for display headings (accent word in gold italic); Inter (self-hosted
  variable) for interface text and every number (tabular). Never emoji as icons or art.
- Surfaces: glass cards (`.ll-card` pattern: soft white gradient, 1px ivory edge, inset top highlight,
  long soft shadow); gold for reward, leadership and the active turn frame; seafoam for live/connected.
- Each game keeps its own personality (Ludo: lacquer, enamel and gold; Claw: arcade neon; TTT: neon).

## 3. Stages
| Stage | Scope | Status |
|---|---|---|
| 1 | Audit, plan, design system v2 (palette, Inter, tokens in CLAUDE.md and skills) | Done |
| 2 | Ludo Lounge flagship | Done (see below) |
| 3 | Claw Catch v2 | Done (see below) |
| 4 | Tic-Tac-Toe (best of three, winning line, draw, replay) + Memory Match (3D flips, difficulty, timer, moves) | Done (see below) |
| 5 | Scoreboard (avatars, per-game, ranks, reset) + Party Backdrop (templates, themes) | Done (see below) |
| 6 | DJ Visuals (cinematic, audio-reactive, ambient) | Done (see below) |
| 7 | Mobile controller + TV pass across all games (1080p/4K, 4:3) | Done (see below) |
| 8 | New games, one at a time (next): Quiz categories + live leaderboard, Darts 301/501, then Poolside Music (licensed source only), Movie Night (authorised content only), Villa Photo Booth | Planned |
| 9 | Shared components + unified admin console (respecting guest.html/harbour architecture) | Planned |
| 10 | Full regression (proxy suites, two-phone + screen e2e for every game, screenshots) | Planned |

### Stage 2 — Ludo Lounge (delivered)
- Pool screen: lit 2.5D table in three.js (ivory lacquer board texture with raised tiles, enamel yards
  and recessed wells, gold stars, turn-in chevrons, gold medallion; gold frame with glowing inner lip,
  corner bosses, halo); lathe-turned glossy pawns with collars and real shadows; hop per square, big
  hop out of the yard, captured pawns fly home after the capturer lands; movable pawns bob with a pulsing ring.
  Canvas 2D fallback paints the same board.
- Panel per reference: "Ludo *Lounge*" + "A classic for family & friends.", turn card (avatar, colour,
  hint, CSS 3D die that tumbles, decelerates, lands; six glow + "Roll again"), seat rows (avatar,
  connected dot, on board / home counts, four pips base/board/home), last move, scan-to-join card.
- Feedback: banners, particles and synth sound for roll, land, six, out of the yard, safe star,
  capture, home stretch, token home, bonus roll, pass, three sixes, start and win.
- Results: winner hero with crown, game time, captures and sixes, ranked list with completion bars;
  stays up 3 minutes after the last move; hidden when a new game starts.
- Phones: matching title, pawn icons, per-pawn move hints (home, home stretch, captures X, safe star,
  out of the yard), standings + Play again + Choose another game; 10 s check-in for the connected dot.
- Proxy: `ludo.js` adds `startedAt`/`endedAt`, `ranks` (winner, tokens home, progress), per-seat
  `stats` (captures, sixes), `touch()` for `seat.seen`; server stamps it on every owner request.
  Tests: 2/3/4-player turn order, release on six, legal moves, home column, exact finish, captures,
  stats, standings, connection, last-player-standing.

### Stage 3 — Claw Catch v2 (delivered)
- HUD in design system v2: Cormorant "Claw *Catch*" with the gold italic accent, champagne gold, a draining
  timer bar under the clock (coral in the last 10 s), avatar rings on the player pills, v2 glass QR panel
  with a seafoam live dot, Cormorant lobby banner.
- Results card at the end of every round (replaces the winner banner): crown and avatar, "X wins" / tie /
  no prizes, total prizes landed, each player's ranked row with the prizes they landed as tokens and their
  points, the best catch of the round. Disappears when the round returns to the lobby or a new round starts.
- Rare-prize reveal: a gold coin (3) or pearl (5) landing pops a "Pearl! Ravi +5" card with a spinning orb
  and a fanfare.
- Final-10-seconds rush: cabinet light strips pulse, coral vignette round the screen (alongside the
  existing faster music and ticks).
- Phones: after each round, "You came 2nd with 7 points" / "You win this round with 9 points!".
- Unchanged: physics, grab odds, joystick and every `claw-*` message, scoring, restock, watchdogs.
  QA hook `display.html?qa=1` (window.__clawQA) stages results/reveal/rush for screenshots only.

### Stage 4 — Tic-Tac-Toe and Memory Match (delivered)
- Proxy: rules moved into pure modules with unit tests. `ttt.js` covers the winning line (`winLine`), draws, best of three
  (`tttMatch`: round, wins, draws, results, champion), the other player opening each round, rematch and reset. `memory.js`
  covers easy 4 × 3, classic 4 × 4 and hard 6 × 4 boards, the lazy mismatch rule, the bonus turn, moves per player, and the
  clock from first flip to last pair. The match champion gets one leaderboard win (`ttt`) per match. The existing seat
  privacy and move gating are unchanged.
- Art: four more drawn tiles (sailboat, turtle, coconut, starfish) in `assets/beach-art.js` for the 12-pair board.
- Pool screen: Cormorant titles with the gold italic accent, a round and best-of line, avatars and match pips, the side
  on turn lit, the winning line drawn across the cells (measured from the real cells), non-winning cells dimmed, a draw
  state, and a match-winner card (crown, avatar, score). Memory: a board sized to the difficulty, 3D card flips (the DOM is
  kept between polls so they animate), moves, a live timer, a gold glow on a found pair, a shake on a miss, and a win card
  with time and moves. Tic-Tac-Toe and Memory now poll every 0.9 s like Ludo and Quiz.
- Phones: match line and pips, "Next round" / "Rematch" only once a round ends, winning cells highlighted, a buzz on
  your turn, "You win the match 2–1!". Memory: Easy/Classic/Hard picker, 3D flips, moves, timer and pairs.
- QA: new shoot.js fixtures (ttt-tv-win/-draw/-match/-4x3, ttt-phone-match, memory-tv-hard/-win, memory-phone-hard), plus a
  two-phones-and-screen run against the real rules.

### Stage 5 — Scoreboard and Party Backdrop (delivered)
- Proxy: pure modules with unit tests. `scoreboard.js`: players carry an avatar and game wins; ranks with ties (1, 1, 3);
  a game name; "Finish game" files the game into a history of the last six (name, names, scores, winners), gives each
  winner a game win and starts the next game at zero (nothing is filed while nobody has scored); "Reset scores" zeroes
  only the current game; "Start over" clears names, avatars, wins and history. New routes `/game/scoreboard/avatar`,
  `/game`, `/finish`, `/clear`; the existing ones keep their contract. `backdrop.js`: templates (birthday, anniversary,
  welcome, congrats, own words), a name, a second line and six themes (party, confetti, glow, balloons, stars, ocean),
  each checked against an allowlist and merged field by field. Route suite `test/suites/play-party.js`.
- Pool screen: "Score*board*" title with the game and its number, columns with rank, avatar, name, score and games won,
  re-ordered by score with a slide (FLIP), a pop on a score change, the leader raised in gold with the crown, a strip of
  finished games, and a winner card when a game is finished. Backdrop: the template's headline (fixed copy), the guest's
  name large in Cormorant, a second line, a "RYST 109A · Beach Villa" kicker, and three new built-in scenes: rising
  balloons, a twinkling sky with shooting stars, and an ocean dusk with a low sun and rolling waves. Guest text only via
  textContent/escHtml.
- Phones: game name, avatar picker under the row, −1/+1/+5, rank and wins per row, Finish game / Reset scores, a "Played
  today" list, Start over. Backdrop: occasion chips with copy and placeholders to match, name and line fields, a live
  preview that follows typing (the screen updates on change), and a 2 × 3 theme grid.
- QA: shoot.js fixtures (scoreboard-tv/-fhd/-4x3/-two, scoreboard-phone-picker, backdrop-tv/-4x3/-balloons/-stars/-ocean/
  -glow-custom/-confetti-long, backdrop-phone/-ocean) and a two-phones-and-screen run against the real rules.

### Stage 6 — DJ Visuals (delivered)
- Proxy: settings rules in the pure module `viz.js` (unit tests, plus route checks in `play-party`): six styles
  (spectrum, waveform, bass, horizon, orbit, ambient), six palettes (adds RYST Gold and Lagoon), energy (calm, lively,
  wild), tempo clamped 60–180, and an optional "on the decks" line (28 characters, plain text). The `/game/audio` relay is
  unchanged.
- Pool screen: one renderer for every style, fed by a smoothed spectrum (fast attack, slow release) from the live phone
  or, without one, a synthesised spectrum that breathes on the tempo, so a style keeps its shape either way. Spectrum: LED
  columns with falling peak caps and a reflection. Waveform: three ribbons shaped by the spectrum. Bass Pulse: a core that
  swells with the low end, a ring of spectrum ticks, a ripple and sparks per beat. Horizon: a banded sun setting on the
  sea, the skyline drawn by the music, the reflection shimmering with it. Orbit: spectrum rays round a turning ring with
  satellites. Ambient: slow aurora and drifting bokeh for dinner. Pools of light that swell with the bass, a CSS vignette,
  a soft beat flash on Wild. Corner captions: the DJ line (Cormorant italic), "RYST Play · style", a join QR and a
  status pill (tempo and energy, or "Live · following the music"). The old per-bar blur filter (about 1.5 s per frame
  in software rendering) is gone; every style holds 60 fps in headless software rendering at 1080p, and a frame-time watchdog
  drops the glow passes and particle counts on a slow player (and restores them when it catches up). The backing store is
  capped at 1.5× pixel ratio. Plain ES2017.
- Phones: style cards with drawn thumbnails, named palette swatches, Calm/Lively/Wild, Slow/Medium/Fast plus tap tempo
  (average of the last taps, after four), the DJ line, and a live microphone level meter on the Live Audio card (no
  emoji in the status).
- QA: shoot.js fixtures for every style (16:9, 4:3, 1080p), live audio frames injected, the phone controller; a frame-time
  check per style, normal and with the CPU throttled; and a two-phones-and-screen run with a fake microphone through a
  stand-in relay (settings merge, tap tempo, live, displacement, fallback).

### Stage 7 — Phone controller and TV pass (delivered)
- Tooling: `shoot.js --sizes=matrix --audit` re-shoots every state at six TV sizes (720p, 900p, 1080p, 4K, 4:3 at
  1440×1080 and 1024×768) and five phone sizes (360×640, 390×844, 430×932, 844×390 landscape, tablet), and reports
  horizontal scroll, off-screen content, clipped text and TV text under 1.5% of the screen height. `-tap` smoke shots.
- Pool screen, 4K: every `clamp(min, vw, max px)` cap is now the same size in vh (identical at 1080p, doubles at 2160p),
  so the top bar, home screen and round lines scale on a 3840-wide player instead of staying at 1080p pixel sizes.
- Pool screen, 4:3 and small walls: small labels (kickers, turn labels, hints, seat status, QR captions, moves, pairs,
  ranks, history, captions) get a floor tied to the screen height via `max()` inside `@supports`; players without
  `max()` keep the vw size. Audit clean across all sizes (the Claw palm crossing the left edge is intended).
- Fixed a Stage 5 regression: the backdrop's star class `.st` collided with Ludo's seat status line `.st` and drew a
  white twinkling blur over it on the pool screen. Stars are now `#starField .bd-star`; the shooting stars and ocean waves
  are scoped to their scenes too.
- Phones: every game title is now Cormorant with the gold italic accent (Claw *Catch*, Quiz *Night*, Tic-Tac-*Toe*,
  Score*board*, Memory *Match*, Party *Backdrop*, DJ *Visuals*), starting below the Back pill on narrow phones. Held
  sideways, Ludo, Quiz, Tic-Tac-Toe and Memory split into two columns (seats and scores beside the die, question or
  board, which stays in view); portrait is unchanged. Phone matrix: no overflow or clipping at any size.
- Regression: the Stage 4–6 two-phones-and-screen runs pass again, plus Ludo and Quiz landscape tap smoke tests.

### Stage 8a — Quiz categories and the live leaderboard (delivered)
- Proxy (`quiz.js`, unit and route tests): every question carries a category — Tamil Nadu & the Coast (16), Sea & Nature
  (19), World & Science (19), or a mix of all 54. Thirteen new questions, well-established facts only; no new facts
  about the villa. Any player on a team picks the category and 5, 10 or 15 questions in the lobby (`/game/quiz/setup`);
  a rematch keeps them. Each player's own points (the same points their team averages, so team scoring is unchanged)
  build a public board (profile name, avatar, team, points, right answers, last question) and a Player of the night at
  the end. Sign-ins stay private.
- Pool screen: Cormorant "Quiz *Night*", the category with a drawn mark beside the question number, "Tonight · category ·
  N questions" in the lobby, the top four players on one line at each reveal (three on 4:3) with what the question earned
  them, and an end screen in the main area: the winning team, a Player of the night card, and the full standings. The
  board is only re-written when it changes, so its entrance plays once.
- Phones: category tiles and 5/10/15 in the lobby (locked until you join a team), your rank card at each reveal ("2nd ·
  712 pts · +162"), and the final standings with the Player of the night.
- QA: fixtures (lobby, reveal 16:9 and 4:3, over; phone lobby, reveal, over) and a two-phones-and-screen run against the
  real rules (setup, start, answers, board, ranks, end screen, rematch, privacy).

Next in Stage 8: Darts 301/501.

### Remaining after Stage 2
Everything in Stages 3–10. Ludo extras for Stage 8/9: tournaments and lifetime stats (needs a
persistent store on the proxy), spectator replay of the last move.
