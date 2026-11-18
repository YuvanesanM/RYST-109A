---
name: 3d-game-graphics
description: 3D game graphics with three.js/WebGL for RYST PLAY — models built from primitives, materials, lighting, shadows, reflections, camera and performance, plus 2D canvas game rendering. Use when working on the 3D Claw Catch cabinet, claws or plush toys, adding 3D or canvas-drawn game pieces and boards (Ludo), tuning lighting/colour/camera, or fixing rendering performance and fallbacks on the pool-screen TV.
---

# 3D game graphics — RYST PLAY

You are the 2D/3D Graphics Specialist and Three.js/WebGL Specialist.

## Current stack (reuse it)
- three.js **r128**, self-hosted `assets/vendor/three-r128.min.js`, lazy-loaded by `Claw3D` in `display.html`; WebGL detection with a 2D canvas fallback (`Claw2D`). Stay on r128 unless the LED wall player is confirmed newer (newer builds use syntax its Chromium may not parse).
- Colour pipeline: `LinearEncoding` + `NoToneMapping` so authored hex colours render as designed (an sRGB pipeline washed the palette to pastels). If switching to sRGB, convert every colour and texture.
- Canvas 2D for boards (Ludo `LudoView`): static layers pre-rendered once per size into an offscreen canvas; only moving pieces redrawn each frame.

## Workflow
1. Inspect the view's renderer and lifecycle (create, resize, destroy) and the 2D fallback.
2. Choose the engine: Canvas 2D for boards and 2D scenes, three.js r128 for real 3D; no second engine.
3. Block out with primitives and the final camera, framed for the pool screen.
4. Light with the rig below, then materials and `CanvasTexture`s.
5. Add game feel (physics, squash, aids) without touching rules or network messages.
6. Check performance steps and the no-WebGL path.
7. Verify with `visual-qa` at 1920×1080, 1600×900 and 1440×1080.

## Modelling and materials
- Build from primitives with shared geometries/materials; clone prototypes (plushes) instead of rebuilding.
- Materials: `MeshPhongMaterial` (cheap, good speculars) — glossy balls high shininess; felt plushes shininess ~4 with a noise `bumpMap`; steel with a bright specular; gold `#d9bb7f` with warm specular; glass transparent `opacity .07–.22`, `depthWrite:false`.
- Textures from `CanvasTexture` (stripes, hex shells, signs) — no image downloads.
- Fake bloom with additive-blended halo planes/sprites rather than post-processing.

## Light and camera
- Hemisphere fill + one directional key (soft shadows, PCFSoft, 1024 map, bias ≈ -0.0015) + a warm point/spot accent. Shadows on toys/floor; decide deliberately what casts (game aids like the claw's aiming ring must stay readable).
- Long lens (fov ≈27°) and distance for a product-shot look; adapt fov for aspect < 16:9.

## Physics and animation (game feel)
- Fixed timestep (120 Hz) with an accumulator; verlet + sweep-and-prune; speed caps and containment so nothing escapes.
- Pendulum claws driven by trolley acceleration; grab outcome from centredness and swing; squash on impact.
- `requestAnimationFrame` schedules itself first and wraps the body in try/catch — one bad frame must not freeze the screen.

## Performance
- Target 60 fps on the TV; adaptive quality steps: shadows off → pixel ratio 1 → HUD blur off (`perf.level`).
- Avoid per-frame allocations in hot loops; pre-render static canvases; reuse vectors.
- Headless Chromium uses SwiftShader (software) — frame times there are not representative; judge visuals, not fps.

## Quality standards
- On-screen colours match the tokens in a screenshot, not just in code (Linear pipeline intact).
- One readable light direction (key from top-left); soft, offset shadows; no shadow acne or z-fighting.
- 60 fps target on the TV with adaptive quality steps; no per-frame allocations in hot loops.
- Resources disposed and listeners removed when the view closes; no memory growth after reopening it 10 times.
- The 2D fallback shows the same game information.

## Completion checklist
- [ ] Colours match tokens on screen (screenshot, not code)
- [ ] Lighting reads as one light source; shadows soft and offset
- [ ] Game aids readable; nothing escapes the play area
- [ ] Fallback path works without WebGL
- [ ] No regressions in game rules, inputs or network messages
