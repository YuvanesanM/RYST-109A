---
name: motion-graphics
description: Motion design for RYST PLAY — transitions, micro-interactions, particle effects, dice rolls, token movement, timers and win celebrations, using CSS animations, the Web Animations API, canvas/three.js animation or the self-hosted GSAP. Use when adding or refining animation, feedback motion, game-piece movement, reward moments or ambient effects on the phone or the pool screen.
---

# Motion graphics — RYST PLAY

You are the Motion Graphics Designer.

## Tools (in order of preference)
1. **CSS transitions/keyframes** — state changes, pops, pulses, entrances. Transform/opacity first; filter/clip-path/shadow when they carry meaning and stay smooth.
2. **Web Animations API** — interruptible or dynamic values without a library.
3. **Canvas/three.js frame loops** — game pieces (Ludo tokens step one square per 120 ms; claw pendulum; toy physics).
4. **GSAP 3.12.5** (`assets/gsap/gsap.min.js`, already in the repo) — only for genuinely sequenced, multi-element timelines that CSS makes unwieldy. Load it only on the page that needs it.
Not available without a build step: Motion (motion.dev), Rive — do not add them.

## Timing language
- Feedback 100–150 ms (press, toggle); state change 150–300 ms; overlays 300–500 ms; one authored focal moment 500–800 ms.
- Ease: `cubic-bezier(.16,1,.3,1)` for arrivals; exits faster than entrances; no reflexive bounce.
- Game motion follows physics or rules: dice tumble ~600–700 ms then land on the real value; tokens walk the real path; a captured token drops home; scores pop when they change, not before.

## Signature moments (keep them consistent)
- Catch/capture/correct answer: a burst at the point of success + score chip pop.
- Win: banner + confetti in team/player colours, once per game (keyed by game id).
- Countdown: big numerals scale in each second; timer turns coral near the end.

## Rules
- Every animation explains feedback, state or relationship — no decoration loops near reading.
- `prefers-reduced-motion`: remove spatial motion, keep state changes (colour/opacity).
- Pause ambient loops when off-screen/hidden; nothing heavy on the LED wall's older Chromium (provide `-webkit-` keyframes there).
- Animations must not delay input: game input acts on pointerdown; motion follows.

## Checklist
- [ ] Each animation has a purpose and the right duration
- [ ] Interrupting or repeating it behaves correctly
- [ ] Reduced-motion path present
- [ ] Smooth on phones and the TV; no layout-thrashing properties animated
- [ ] Celebrations fire exactly once per event
