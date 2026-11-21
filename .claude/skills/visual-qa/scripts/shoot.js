#!/usr/bin/env node
// RYST PLAY visual QA: serves the repo locally, stubs the game proxy (https://data.ryst.in) with
// fixture states, and captures every RYST PLAY screen on phone, tablet and TV sizes.
//   node .claude/skills/visual-qa/scripts/shoot.js                 all shots → <tmp>/ryst-qa-shots
//   node .claude/skills/visual-qa/scripts/shoot.js --out=/tmp/qa --only=hub,ludo-tv,quiz-tv
//   … --sizes=matrix   re-shoots each selected shot at every size for its page (name@WxH.png):
//                      TV 1280×720, 1600×900, 1920×1080, 3840×2160 (4K), 1440×1080 and 1024×768 (4:3);
//                      phone 360×640, 390×844, 430×932, 844×390 (landscape) and tablet 1000×1100
//   … --audit          prints layout findings per shot (also <out>/audit.json): horizontal scroll, content
//                      past the screen edge, clipped text, and on the TV text under 1.5% of the screen height
// Needs Playwright (pre-installed in Claude Code cloud sessions: require('playwright')).
// Headless Chromium renders WebGL in software: judge visuals, not frame rates.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '../../../..');
const arg = k => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : null; };
const OUT = path.resolve(arg('out') || path.join(require('os').tmpdir(), 'ryst-qa-shots'));
const ONLY = arg('only') ? arg('only').split(',') : null;
const MATRIX = arg('sizes') === 'matrix', AUDIT = process.argv.indexOf('--audit') >= 0;
const TV_SIZES = [[1280, 720], [1600, 900], [1920, 1080], [3840, 2160], [1440, 1080], [1024, 768]];
const PHONE_SIZES = [[360, 640], [390, 844], [430, 932], [844, 390], [1000, 1100]];
// Runs in the page: what a person would notice from the sofa or in the hand
const AUDIT_FN = tv => {
  const W = innerWidth, H = innerHeight, out = { hscroll: document.documentElement.scrollWidth > W + 1, offscreen: [], clipped: [], tiny: [] }, seen = {};
  const tag = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.classList.length ? '.' + Array.prototype.slice.call(el.classList, 0, 2).join('.') : '');
  const add = (k, el, extra) => { const key = k + tag(el); if (seen[key] || out[k].length > 12) return; seen[key] = 1; out[k].push(tag(el) + (extra ? ' ' + extra : '')); };
  document.querySelectorAll('body *').forEach(el => {
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) return;
    let op = el, gone = false; while (op && op !== document.body) { if (+getComputedStyle(op).opacity === 0) { gone = true; break; } op = op.parentElement; } if (gone) return;
    const text = Array.prototype.some.call(el.childNodes, n => n.nodeType === 3 && n.textContent.trim());
    const media = /^(IMG|SVG|CANVAS|BUTTON|INPUT)$/i.test(el.tagName);
    if ((text || media) && (r.left < -2 || r.right > W + 2 || (tv && (r.top < -2 || r.bottom > H + 2)))) add('offscreen', el, Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.width) + '×' + Math.round(r.height));
    if (text && (el.scrollWidth > el.clientWidth + 2) && /hidden|clip/.test(cs.overflow + cs.overflowX)) add('clipped', el, JSON.stringify(el.textContent.trim().slice(0, 30)));
    if (text && tv && parseFloat(cs.fontSize) < H * (window.__tinyAt || 0.015)) add('tiny', el, cs.fontSize + ' ' + JSON.stringify(el.textContent.trim().slice(0, 24)));
  });
  return out;
};
fs.mkdirSync(OUT, { recursive: true });

const now = Date.now();
const base = () => ({
  mode: null, openedAt: now, updatedAt: now, serverNow: now,
  board: ['X', 'O', null, null, 'X', null, 'O', null, 'X'], turn: 'O', winner: null, scoreX: 2, scoreO: 1, ttt: { X: { name: 'Asha', avatar: 'octopus', seen: now }, O: { name: 'Ravi', avatar: 'crab', seen: now } },
  winLine: null, tttMatch: { bestOf: 3, need: 2, round: 2, wins: { X: 1, O: 0 }, draws: 0, starter: 'O', results: ['X'], over: false, champion: null, id: 'm1' },
  players: [{ name: 'Asha', score: 7, avatar: 'octopus', wins: 1 }, { name: 'Ravi', score: 4, avatar: 'crab', wins: 0 }, { name: 'Meera', score: 9, avatar: 'sun', wins: 2 }, { name: 'Kiran', score: 2, avatar: 'turtle', wins: 0 }], playerCount: 4,
  scoreboard: { game: 'Carrom', round: 4, history: [{ game: 'Carrom', round: 3, at: now - 600000, scores: [12, 8, 15, 6], names: ['Asha', 'Ravi', 'Meera', 'Kiran'], winners: [2] }, { game: 'Cards', round: 2, at: now - 1800000, scores: [5, 5, 3, 1], names: ['Asha', 'Ravi', 'Meera', 'Kiran'], winners: [0, 1] }, { game: 'Carrom', round: 1, at: now - 3000000, scores: [10, 4, 11, 9], names: ['Asha', 'Ravi', 'Meera', 'Kiran'], winners: [2] }] },
  memory: { cards: ['🌊','🏖️','🐚','🦀','🌴','🍹','⛱️','🐠','🌊','🏖️','🐚','🦀','🌴','🍹','⛱️','🐠'], matched: [true,false,false,false,false,false,true,false,true,false,false,false,false,false,true,false], flipped: [3], mismatchAt: 0, scores: [2, 1], turn: 1, winner: null, difficulty: 'normal', cols: 4, rows: 4, moves: [5, 4], startedAt: now - 83000, endedAt: 0 },
  backdrop: { template: 'birthday', name: 'Asha', text: 'Thirty and fabulous', preset: 'party' }, viz: { preset: 'spectrum', palette: 'neon', bpm: 120, energy: 'lively', title: '' },
  leaders: [{ id: 'm', name: 'Meera', avatar: 'sun', wins: 3, claw: 2, ludo: 1 }, { id: 'a', name: 'Asha', avatar: 'octopus', wins: 1, claw: 1, ludo: 0 }],
  ludo: { phase: 'play', seats: [{ name: 'Asha', avatar: 'octopus', seen: now }, null, { name: 'Ravi', avatar: 'crab', seen: now }, { name: 'Kiran', avatar: 'sun', seen: now - 90000 }],
    tokens: [[5, 30, -1, -1], [-1, -1, -1, -1], [12, 52, -1, 56], [-1, 40, -1, -1]], turn: 2, dice: 6, rolled: true, rollId: 4, sixes: 1, winner: -1, last: null, actAt: now, gameId: 1,
    startedAt: now - 1122000, endedAt: 0, ranks: null, stats: [{ caps: 1, sixes: 3 }, { caps: 0, sixes: 0 }, { caps: 2, sixes: 4 }, { caps: 0, sixes: 1 }] },
  quiz: { phase: 'question', teams: [{ name: 'Sea Turtles', colour: '#34c79a', score: 320, members: [{ id: 'a', name: 'Asha', avatar: 'octopus' }] }, { name: 'Coconuts', colour: '#ffc94d', score: 0, members: [] },
    { name: 'Sandcastles', colour: '#ff9a6b', score: 0, members: [] }, { name: 'Starfish', colour: '#7b8cff', score: 410, members: [{ id: 'b', name: 'Bala', avatar: 'sun' }] }],
    qIndex: 2, total: 10, question: { text: 'Which ocean lies off the coast of Tamil Nadu?', options: ['The Arabian Sea', 'The Bay of Bengal (Indian Ocean)', 'The Pacific Ocean', 'The Atlantic Ocean'] }, endsAt: now + 14000, answered: [1, 0, 0, 0], reveal: null, winners: [], gameId: 1 },
});
// [name, page, viewport, game mode, extra state, after-load hook]
const PHONE = { width: 390, height: 844 }, TAB = { width: 1000, height: 1100 }, TV = { width: 1600, height: 900 }, FHD = { width: 1920, height: 1080 }, FOUR3 = { width: 1440, height: 1080 };
const QZ_BOARD = [{ id: 'b', name: 'Bala', avatar: 'sun', team: 3, score: 846, right: 6, last: 120 }, { id: 'a', name: 'Asha', avatar: 'octopus', team: 0, score: 712, right: 5, last: 162 }, { id: 'm', name: 'Meera', avatar: 'turtle', team: 0, score: 530, right: 4, last: 0 }, { id: 'k', name: 'Kiran', avatar: 'crab', team: 3, score: 318, right: 2, last: 0 }, { id: 'r', name: 'Ravi', avatar: 'fish', team: 1, score: 140, right: 1, last: 0 }];
const LUDO_WAIT = p => p.waitForTimeout(2500); // three.js loads and the pawns settle
const SHOTS = [
  ['hub', 'play.html', PHONE, null, {}, null, true],
  ['hub-tablet', 'play.html', TAB, null, {}, null, true],
  ['claw-phone', 'play.html', PHONE, 'claw', {}, p => p.evaluate(() => { window.__in({ type: 'claw-you', slot: 1 }); window.__in({ type: 'claw-state', phase: 'play', timeLeft: 42, scores: [2, 5, 0, 0], winners: [] }); })],
  ['claw-controller-landscape', 'play.html', { width: 844, height: 390 }, 'claw', {}, p => p.evaluate(() => window.__in({ type: 'claw-you', slot: 1 }))],
  ['ludo-phone', 'play.html', PHONE, 'ludo', {}, null],
  ['quiz-phone', 'play.html', PHONE, 'quiz', {}, null],
  ['ttt-phone', 'play.html', PHONE, 'tictactoe', {}, null],
  ['memory-phone', 'play.html', PHONE, 'memory', {}, null],
  ['scoreboard-phone', 'play.html', PHONE, 'scoreboard', {}, null],
  ['home-tv', 'display.html', TV, null, {}, null],
  ['claw-tv', 'display.html', TV, 'claw', {}, async p => { await p.waitForTimeout(3500); await p.evaluate(() => window.__in({ type: 'claw-roster', slots: [true, true, true, false], who: [{ name: 'Asha', avatar: 'octopus' }, { name: 'Ravi', avatar: 'crab' }, null, null] })); await p.waitForTimeout(800); }],
  ['claw-tv-results', 'display.html?qa=1', TV, 'claw', {}, async p => { await p.waitForTimeout(3500); await p.evaluate(() => window.__in({ type: 'claw-roster', slots: [true, true, true, false], who: [{ name: 'Asha', avatar: 'octopus' }, { name: 'Ravi', avatar: 'crab' }, null, null] })); await p.waitForTimeout(500); await p.evaluate(() => window.__clawQA.results([7, 9, 2, 0], [['plush', 'beach', 'plush', 'beach', 'beach'], ['pearl', 'plush', 'beach', 'beach'], ['plush']])); await p.waitForTimeout(1600); }],
  ['claw-tv-reveal', 'display.html?qa=1', TV, 'claw', {}, async p => { await p.waitForTimeout(3500); await p.evaluate(() => window.__in({ type: 'claw-roster', slots: [true, true, true, false], who: [{ name: 'Asha', avatar: 'octopus' }, { name: 'Ravi', avatar: 'crab' }, null, null] })); await p.evaluate(() => { window.__clawQA.rush(); window.__clawQA.reveal('pearl', 1); }); await p.waitForTimeout(1300); }],
  ['claw-tv-4x3', 'display.html', FOUR3, 'claw', {}, async p => { await p.waitForTimeout(3500); await p.evaluate(() => window.__in({ type: 'claw-roster', slots: [true, true, false, false], who: [] })); await p.waitForTimeout(800); }],
  ['ludo-tv', 'display.html', TV, 'ludo', {}, LUDO_WAIT],
  ['ludo-tv-fhd', 'display.html', FHD, 'ludo', {}, LUDO_WAIT],
  ['ludo-tv-4x3', 'display.html', FOUR3, 'ludo', {}, LUDO_WAIT],
  ['ludo-tv-lobby', 'display.html', TV, 'ludo', { ludo: Object.assign(base().ludo, { phase: 'lobby', turn: -1, dice: 0, rolled: false, tokens: [[-1, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1]], seats: [{ name: 'Asha', avatar: 'octopus', seen: now }, null, { name: 'Ravi', avatar: 'crab', seen: now }, null] }) }, LUDO_WAIT],
  ['ludo-tv-over', 'display.html', TV, 'ludo', { ludo: Object.assign(base().ludo, { phase: 'over', turn: -1, rolled: false, winner: 2, endedAt: now, ranks: [2, 0, 3], tokens: [[50, 56, 33, -1], [-1, -1, -1, -1], [56, 56, 56, 56], [-1, 40, 12, -1]] }) }, async p => { await LUDO_WAIT(p); await p.waitForTimeout(1500); }],
  ['ludo-tv-2d', 'display.html', TV, 'ludo', {}, LUDO_WAIT, false, true],
  ['quiz-tv', 'display.html', TV, 'quiz', {}, null],
  ['ttt-tv', 'display.html', TV, 'tictactoe', {}, null],
  ['memory-tv', 'display.html', TV, 'memory', {}, null],
  // Stage 4
  ['ttt-tv-win', 'display.html', TV, 'tictactoe', { board: ['X', 'O', null, 'X', 'O', null, 'X', null, null], winner: 'X', winLine: [0, 3, 6], tttMatch: { bestOf: 3, need: 2, round: 2, wins: { X: 1, O: 1 }, draws: 0, results: ['O', 'X'], over: false, id: 'm1' } }, p => p.waitForTimeout(900)],
  ['ttt-tv-draw', 'display.html', TV, 'tictactoe', { board: ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'], winner: 'draw', tttMatch: { bestOf: 3, need: 2, round: 3, wins: { X: 1, O: 1 }, draws: 1, results: ['O', 'X', 'draw'], over: false, id: 'm1' } }, null],
  ['ttt-tv-match', 'display.html', TV, 'tictactoe', { board: ['O', 'X', 'X', null, 'O', 'X', null, null, 'O'], winner: 'O', winLine: [0, 4, 8], tttMatch: { bestOf: 3, need: 2, round: 3, wins: { X: 1, O: 2 }, draws: 0, results: ['O', 'X', 'O'], over: true, champion: 'O', id: 'm1' } }, p => p.waitForTimeout(1900)],
  ['ttt-tv-4x3', 'display.html', FOUR3, 'tictactoe', { board: ['X', 'O', null, 'X', 'O', null, 'X', null, null], winner: 'X', winLine: [0, 3, 6] }, p => p.waitForTimeout(900)],
  ['ttt-phone-match', 'play.html', PHONE, 'tictactoe', { board: ['O', 'X', 'X', null, 'O', 'X', null, null, 'O'], winner: 'O', winLine: [0, 4, 8], tttMatch: { bestOf: 3, need: 2, round: 3, wins: { X: 1, O: 2 }, draws: 0, over: true, champion: 'O', id: 'm1' } }, null],
  ['memory-tv-hard', 'display.html', TV, 'memory', { memory: { difficulty: 'hard', cols: 6, rows: 4, cards: ['🌊','⛵','🐚','🦀','🐢','🍹','⛱️','🐠','🥥','⭐','🏖️','🌴','⭐','🏖️','🐚','⛵','🌴','🍹','🐢','🐠','🥥','🦀','🌊','⛱️'], matched: [false,true,false,false,true,false,false,false,true,false,false,false,false,false,false,true,false,false,true,false,true,false,false,false], flipped: [3], mismatchAt: 0, scores: [1, 2], turn: 2, moves: [6, 7], startedAt: now - 142000, endedAt: 0, winner: null } }, p => p.waitForTimeout(700)],
  ['memory-tv-win', 'display.html', TV, 'memory', { memory: { difficulty: 'easy', cols: 4, rows: 3, cards: ['🌊','🏖️','🐚','🦀','🌴','🍹','🌊','🏖️','🐚','🦀','🌴','🍹'], matched: Array(12).fill(true), flipped: [], mismatchAt: 0, scores: [4, 2], turn: 1, moves: [7, 5], startedAt: now - 96000, endedAt: now - 1000, winner: 1 } }, p => p.waitForTimeout(1600)],
  ['memory-phone-hard', 'play.html', PHONE, 'memory', { memory: { difficulty: 'hard', cols: 6, rows: 4, cards: ['🌊','⛵','🐚','🦀','🐢','🍹','⛱️','🐠','🥥','⭐','🏖️','🌴','⭐','🏖️','🐚','⛵','🌴','🍹','🐢','🐠','🥥','🦀','🌊','⛱️'], matched: [false,true,false,false,true,false,false,false,true,false,false,false,false,false,false,true,false,false,true,false,true,false,false,false], flipped: [3], mismatchAt: 0, scores: [1, 2], turn: 2, moves: [6, 7], startedAt: now - 142000, endedAt: 0, winner: null } }, p => p.waitForTimeout(700)],
  ['scoreboard-tv', 'display.html', TV, 'scoreboard', {}, p => p.waitForTimeout(600)],
  ['scoreboard-tv-fhd', 'display.html', FHD, 'scoreboard', {}, p => p.waitForTimeout(600)],
  ['scoreboard-tv-4x3', 'display.html', FOUR3, 'scoreboard', {}, p => p.waitForTimeout(600)],
  ['scoreboard-tv-two', 'display.html', TV, 'scoreboard', { playerCount: 2, players: [{ name: 'Team Shell', score: 3, avatar: 'shell', wins: 0 }, { name: 'Team Palm', score: 3, avatar: 'palm', wins: 0 }, { name: 'Player 3', score: 0 }, { name: 'Player 4', score: 0 }], scoreboard: { game: '', round: 1, history: [] } }, p => p.waitForTimeout(600)],
  ['scoreboard-phone-picker', 'play.html', PHONE, 'scoreboard', {}, async p => { await p.click('.player-row[data-i="1"] .sb-avbtn'); await p.waitForTimeout(300); }],
  ['backdrop-tv', 'display.html', TV, 'backdrop', {}, p => p.waitForTimeout(800)],
  ['backdrop-tv-4x3', 'display.html', FOUR3, 'backdrop', {}, p => p.waitForTimeout(800)],
  ['backdrop-tv-balloons', 'display.html', TV, 'backdrop', { backdrop: { template: 'anniversary', name: 'Meera & Arjun', text: '25 years together', preset: 'balloons' } }, p => p.waitForTimeout(1500)],
  ['backdrop-tv-stars', 'display.html', TV, 'backdrop', { backdrop: { template: 'welcome', name: 'The Kumar family', text: 'Enjoy your stay by the sea', preset: 'stars' } }, p => p.waitForTimeout(1500)],
  ['backdrop-tv-ocean', 'display.html', TV, 'backdrop', { backdrop: { template: 'congrats', name: 'Ananya', text: 'On your graduation', preset: 'ocean' } }, p => p.waitForTimeout(1500)],
  ['backdrop-tv-glow-custom', 'display.html', TV, 'backdrop', { backdrop: { template: 'custom', name: '', text: "Let's dance till sunrise", preset: 'glow' } }, p => p.waitForTimeout(800)],
  ['backdrop-tv-confetti-long', 'display.html', FOUR3, 'backdrop', { backdrop: { template: 'birthday', name: 'Venkataraghavan Srinivasan', text: 'Forty years young, all of them by the sea', preset: 'confetti' } }, p => p.waitForTimeout(800)],
  ['viz-tv-spectrum', 'display.html', TV, 'visualizer', { viz: Object.assign({ preset: 'spectrum', palette: 'neon', bpm: 120, energy: 'lively', title: '' }, { title: 'DJ Arjun' }) }, p => p.waitForTimeout(2600)],
  ['viz-tv-waveform', 'display.html', TV, 'visualizer', { viz: Object.assign({ preset: 'spectrum', palette: 'neon', bpm: 120, energy: 'lively', title: '' }, { preset: 'waveform', palette: 'aurora' }) }, p => p.waitForTimeout(2600)],
  ['viz-tv-bass', 'display.html', TV, 'visualizer', { viz: Object.assign({ preset: 'spectrum', palette: 'neon', bpm: 120, energy: 'lively', title: '' }, { preset: 'bass', palette: 'sunset', energy: 'wild' }) }, p => p.waitForTimeout(2600)],
  ['viz-tv-horizon', 'display.html', TV, 'visualizer', { viz: Object.assign({ preset: 'spectrum', palette: 'neon', bpm: 120, energy: 'lively', title: '' }, { preset: 'horizon', palette: 'ryst', title: 'Sundowner Sessions' }) }, p => p.waitForTimeout(2600)],
  ['viz-tv-horizon-sunset', 'display.html', FOUR3, 'visualizer', { viz: Object.assign({ preset: 'spectrum', palette: 'neon', bpm: 120, energy: 'lively', title: '' }, { preset: 'horizon', palette: 'sunset' }) }, p => p.waitForTimeout(2600)],
  ['viz-tv-orbit', 'display.html', TV, 'visualizer', { viz: Object.assign({ preset: 'spectrum', palette: 'neon', bpm: 120, energy: 'lively', title: '' }, { preset: 'orbit', palette: 'lagoon' }) }, p => p.waitForTimeout(2600)],
  ['viz-tv-ambient', 'display.html', FHD, 'visualizer', { viz: Object.assign({ preset: 'spectrum', palette: 'neon', bpm: 120, energy: 'lively', title: '' }, { preset: 'ambient', palette: 'ryst', energy: 'calm' }) }, p => p.waitForTimeout(2600)],
  ['viz-tv-live', 'display.html', TV, 'visualizer', { viz: Object.assign({ preset: 'spectrum', palette: 'neon', bpm: 120, energy: 'lively', title: '' }, { preset: 'spectrum', palette: 'rainbow' }) }, async p => { await p.waitForTimeout(800); for (let k = 0; k < 40; k++) { await p.evaluate(k => window.__in({ type: 'audio', bins: Array.from({ length: 32 }, (_, i) => Math.round(Math.max(0, 230 - i * 6 + 30 * Math.sin(i * 0.9 + k)))), level: 0.55, bass: 0.8, mid: 0.5, treble: 0.3, beat: k % 8 === 0 }), k); await p.waitForTimeout(50); } }],
  ['ludo-phone-tap', 'play.html', { width: 844, height: 390 }, 'ludo', {}, async p => { await p.click('#ludoTokens [data-token]:not([disabled])'); await p.waitForTimeout(400); const sent = await p.evaluate(() => window.__posts || []); console.log('      posts: ' + JSON.stringify(sent)); }],
  ['quiz-phone-tap', 'play.html', { width: 844, height: 390 }, 'quiz', {}, async p => { await p.click('#quizOpts [data-choice="1"]'); await p.waitForTimeout(400); const sent = await p.evaluate(() => window.__posts || []); console.log('      posts: ' + JSON.stringify(sent)); }],
  ['quiz-tv-lobby', 'display.html', TV, 'quiz', { quiz: Object.assign(base().quiz, { phase: 'lobby', question: null, endsAt: 0, category: 'local', length: 10, board: [] }) }, null],
  ['quiz-tv-reveal', 'display.html', TV, 'quiz', { quiz: Object.assign(base().quiz, { phase: 'reveal', category: 'nature', question: { text: 'Which sea turtle comes ashore to nest on Tamil Nadu\'s beaches?', options: ['The leatherback', 'The olive ridley', 'The loggerhead', 'The snapping turtle'], category: 'nature' }, endsAt: now + 5000, reveal: { correct: 1, points: [162, 0, 0, 120], right: [1, 0, 0, 1], counts: [2, 0, 0, 2] }, board: QZ_BOARD }) }, p => p.waitForTimeout(900)],
  ['quiz-tv-reveal-4x3', 'display.html', FOUR3, 'quiz', { quiz: Object.assign(base().quiz, { phase: 'reveal', question: { text: 'Which sea turtle comes ashore to nest on Tamil Nadu\'s beaches?', options: ['The leatherback', 'The olive ridley', 'The loggerhead', 'The snapping turtle'], category: 'nature' }, endsAt: now + 5000, reveal: { correct: 1, points: [162, 0, 0, 120], right: [1, 0, 0, 1], counts: [2, 0, 0, 2] }, board: QZ_BOARD }) }, p => p.waitForTimeout(900)],
  ['quiz-tv-over', 'display.html', TV, 'quiz', { quiz: Object.assign(base().quiz, { phase: 'over', question: null, endsAt: 0, category: 'local', winners: [3], board: QZ_BOARD, mvp: Object.assign({}, QZ_BOARD[0]) }) }, p => p.waitForTimeout(1200)],
  ['quiz-phone-lobby', 'play.html', PHONE, 'quiz', { quiz: Object.assign(base().quiz, { phase: 'lobby', question: null, endsAt: 0, category: 'local', length: 10, board: [] }) }, null],
  ['quiz-phone-reveal', 'play.html', PHONE, 'quiz', { quiz: Object.assign(base().quiz, { phase: 'reveal', question: { text: 'Which sea turtle comes ashore to nest on Tamil Nadu\'s beaches?', options: ['The leatherback', 'The olive ridley', 'The loggerhead', 'The snapping turtle'], category: 'nature' }, endsAt: now + 5000, reveal: { correct: 1, points: [162, 0, 0, 120], right: [1, 0, 0, 1], counts: [2, 0, 0, 2] }, board: QZ_BOARD }) }, null],
  ['quiz-phone-over', 'play.html', PHONE, 'quiz', { quiz: Object.assign(base().quiz, { phase: 'over', question: null, endsAt: 0, winners: [3], board: QZ_BOARD, mvp: Object.assign({}, QZ_BOARD[0]) }) }, null],
  ['viz-phone', 'play.html', PHONE, 'visualizer', { viz: Object.assign({ preset: 'spectrum', palette: 'neon', bpm: 120, energy: 'lively', title: '' }, { preset: 'horizon', palette: 'ryst', title: 'DJ Arjun' }) }, null],
  ['backdrop-phone', 'play.html', PHONE, 'backdrop', {}, null],
  ['backdrop-phone-ocean', 'play.html', PHONE, 'backdrop', { backdrop: { template: 'congrats', name: 'Ananya', text: 'On your graduation', preset: 'ocean' } }, null],
];
const INIT = `
  window.__socks = []; window.__sent = [];
  class FakeWS { constructor(){ this.readyState = 0; this.l = {}; window.__socks.push(this); setTimeout(() => { this.readyState = 1; this.emit('open', {}); }, 50); }
    addEventListener(t, f){ (this.l[t] = this.l[t] || []).push(f); } emit(t, e){ (this.l[t] || []).forEach(f => f(e)); } send(d){ try { window.__sent.push(JSON.parse(d)); } catch (e) {} } close(){ this.readyState = 3; this.emit('close', {}); } }
  window.WebSocket = FakeWS;
  window.__in = m => window.__socks.forEach(s => s.readyState === 1 && s.emit('message', { data: JSON.stringify(m) }));
  try { localStorage.setItem('ryst_play_token', 'qa-token'); } catch (e) {}
  window.__posts = []; const _f = window.fetch; window.fetch = function (u, o) { if (o && o.method === 'POST') window.__posts.push(String(u).replace(/^https?:\\/\\/[^/]+/, '')); return _f.apply(this, arguments); };`;

const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' }[path.extname(f)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type }); fs.createReadStream(f).pipe(res);
}).listen(0, async () => {
  const port = server.address().port, errors = [];
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const audit = {}, runs = [];
  for (const shot of SHOTS) {
    if (ONLY && ONLY.indexOf(shot[0]) < 0) continue;
    if (!MATRIX) { runs.push(shot); continue; }
    (shot[1] === 'display.html' ? TV_SIZES : PHONE_SIZES).forEach(([w, h]) => { const c = shot.slice(); c[0] = shot[0] + '@' + w + 'x' + h; c[2] = { width: w, height: h }; runs.push(c); });
  }
  for (const [name, page, vp, mode, extra, after, profile, noGL] of runs) {
    const p = await browser.newPage({ viewport: vp });
    p.on('pageerror', e => errors.push(name + ': ' + e.message));
    const state = Object.assign(base(), { mode }, extra);
    await p.route('https://data.ryst.in/**', async route => {
      const url = route.request().url();
      const body = Object.assign({}, state, { serverNow: Date.now(), openedAt: Date.now() },
        /\/game\/profile/.test(url) ? { profile: profile ? { id: 'a', name: 'Asha', avatar: 'octopus' } : { id: 'a', name: 'Asha', avatar: 'octopus' }, avatars: [] } : {},
        /\/game\/ludo\//.test(url) ? { ludoMine: [2, 3] } : {}, /\/game\/ttt\//.test(url) ? { tttMine: 'O' } : {}, /\/game\/quiz\//.test(url) ? { quizMe: { team: 0, answered: false, choice: -1 } } : {});
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body), headers: { 'access-control-allow-origin': '*' } });
    });
    await p.route(/open-meteo\.com/, r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ current: { temperature_2m: 29, weather_code: 2, is_day: 1 } }) }));
    await p.addInitScript(INIT);
    if (noGL) await p.addInitScript('window.WebGLRenderingContext = undefined;'); // the LED wall without WebGL: the 2D board
    await p.goto(`http://127.0.0.1:${port}/${page}`); await p.waitForTimeout(2500);
    if (after) await after(p);
    const file = path.join(OUT, name + '.png');
    await p.screenshot({ path: file, fullPage: page === 'play.html' });
    console.log('  ' + name.padEnd(26) + vp.width + '×' + vp.height + '  ' + file);
    if (AUDIT) {
      const a = await p.evaluate(AUDIT_FN, page === 'display.html'); audit[name] = a;
      const lines = [a.hscroll ? 'horizontal scroll' : ''].concat(a.offscreen.map(x => 'off-screen ' + x), a.clipped.map(x => 'clipped ' + x), a.tiny.map(x => 'tiny ' + x)).filter(Boolean);
      lines.forEach(l => console.log('      ! ' + l));
    }
    await p.close();
  }
  if (AUDIT) fs.writeFileSync(path.join(OUT, 'audit.json'), JSON.stringify(audit, null, 1));
  await browser.close(); server.close();
  console.log(errors.length ? 'Page errors:\n  ' + errors.join('\n  ') : 'No page errors.');
  process.exitCode = errors.length ? 1 : 0;
});
