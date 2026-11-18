---
name: game-ui-design
description: Game interface design for RYST PLAY's multiplayer games — board games (Ludo), arcade (Claw Catch), trivia (Quiz Night), Tic-Tac-Toe, Memory Match and scoreboards. Use when designing or changing game states, turn and timer displays, player indicators and seats, scoreboards and leaderboards, join/lobby flows, reward and win moments, or the split between the phone controller and the pool-screen view.
---

# Game UI design — RYST PLAY

You are the Professional Game Interface Designer.

## The model
Every game is two views of one authoritative state held by the proxy (`ryst-109a-proxy`):
- **Pool screen (`display.html`)** — the shared stage, read from metres away: board/cabinet/question dominant, players and scores around it, a join QR when joining is possible.
- **Phone (`play.html`)** — the private controller: your seat, your turn, your choices, instant local feedback (press state, haptic, sound) without waiting for the network.
Never put private information (seat owners, the quiz answer before reveal) on the shared screen.

## Game-state design (design each one explicitly)
Lobby (join, ready, start) → countdown → playing (whose turn / time left / what to do now) → resolution (reveal, capture, catch) → round end → game over (winner, play again). Plus: reconnecting, seat lost, full, idle/skipped.

## Patterns that work here
- **Player identity**: colour + avatar (`RYST_AVATARS`) + name, the same in every game. Active player = glow/border in their colour; leader = gold + crown.
- **Turn clarity**: one sentence of status ("Your turn, Asha: roll the die"); the phone buzzes on your turn.
- **Timers**: server-clock based (`serverNow` skew) — ring on TV, bar on phone; coral for the last 5–10 s.
- **Scores**: DM Sans tabular, pop animation on change; team scores fair (Quiz uses averages).
- **Choices**: show only legal options as enabled (Ludo glows movable tokens); auto-play when only one real choice.
- **Rewards**: a burst at the moment of success (chute burst, captured token, right answer glow), confetti and a banner for the winner; leaderboard tally once per game.
- **Join**: QR + one line of instruction on the TV; one-tap join with the profile on the phone.

## Adding a new game
1. Rules as a pure module with unit tests in the proxy (`ludo.js`/`quiz.js` pattern) and routes under `/game/<name>/`, private data outside `gameState`.
2. Add the mode to the proxy's `validModes` and `GAME_POST_ROUTES`.
3. Phone: one `ACTIVITIES` entry + art in `ART`, a `<section id="screen-<mode>">`, add the mode to `showScreen`'s list, a `render<Game>()` called from `render()`.
4. Screen: a `<section class="screen rp-stage" id="screen-<mode>">`, a view module (`LudoView`/`QuizView` pattern) updated from `refreshGame`, `updateMainScreen` wiring, faster polling in `gameLoop` if turn-based.
5. End-to-end test with two phones and the screen (visual-qa skill).

## Checklist
- [ ] Every state above designed on both phone and TV
- [ ] Shared screen never shows private data
- [ ] Player identity consistent across games
- [ ] Legal actions obvious; illegal ones disabled, not erroring
- [ ] Win moment and leaderboard tally work once per game
- [ ] Multiplayer flow tested end to end
