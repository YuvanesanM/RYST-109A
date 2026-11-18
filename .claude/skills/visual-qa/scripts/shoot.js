#!/usr/bin/env node
// RYST PLAY visual QA: serves the repo locally, stubs the game proxy (https://data.ryst.in) with
// fixture states, and captures every RYST PLAY screen on phone, tablet and TV sizes.
//   node .claude/skills/visual-qa/scripts/shoot.js                 all shots → <tmp>/ryst-qa-shots
//   node .claude/skills/visual-qa/scripts/shoot.js --out=/tmp/qa --only=hub,ludo-tv,quiz-tv
// Needs Playwright (pre-installed in Claude Code cloud sessions: require('playwright')).
// Headless Chromium renders WebGL in software: judge visuals, not frame rates.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '../../../..');
const arg = k => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : null; };
const OUT = path.resolve(arg('out') || path.join(require('os').tmpdir(), 'ryst-qa-shots'));
const ONLY = arg('only') ? arg('only').split(',') : null;
fs.mkdirSync(OUT, { recursive: true });

const now = Date.now();
const base = () => ({
  mode: null, openedAt: now, updatedAt: now, serverNow: now,
  board: ['X', 'O', null, null, 'X', null, 'O', null, 'X'], turn: 'O', winner: null, scoreX: 2, scoreO: 1,
  players: [{ name: 'Asha', score: 7 }, { name: 'Ravi', score: 4 }, { name: 'Meera', score: 9 }, { name: 'Kiran', score: 2 }], playerCount: 4,
  memory: { cards: ['🌊','🏖️','🐚','🦀','🌴','🍹','⛱️','🐠','🌊','🏖️','🐚','🦀','🌴','🍹','⛱️','🐠'], matched: [true,false,false,false,false,false,true,false,true,false,false,false,false,false,true,false], flipped: [3], mismatchAt: 0, scores: [2, 1], turn: 1, winner: null },
  backdrop: { text: 'Happy Birthday, Asha', preset: 'party' }, viz: { preset: 'spectrum', palette: 'neon', bpm: 120 },
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
  ['scoreboard-tv', 'display.html', TV, 'scoreboard', {}, null],
  ['backdrop-tv', 'display.html', TV, 'backdrop', {}, null],
];
const INIT = `
  window.__socks = []; window.__sent = [];
  class FakeWS { constructor(){ this.readyState = 0; this.l = {}; window.__socks.push(this); setTimeout(() => { this.readyState = 1; this.emit('open', {}); }, 50); }
    addEventListener(t, f){ (this.l[t] = this.l[t] || []).push(f); } emit(t, e){ (this.l[t] || []).forEach(f => f(e)); } send(d){ try { window.__sent.push(JSON.parse(d)); } catch (e) {} } close(){ this.readyState = 3; this.emit('close', {}); } }
  window.WebSocket = FakeWS;
  window.__in = m => window.__socks.forEach(s => s.readyState === 1 && s.emit('message', { data: JSON.stringify(m) }));
  try { localStorage.setItem('ryst_play_token', 'qa-token'); } catch (e) {}`;

const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' }[path.extname(f)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type }); fs.createReadStream(f).pipe(res);
}).listen(0, async () => {
  const port = server.address().port, errors = [];
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  for (const [name, page, vp, mode, extra, after, profile, noGL] of SHOTS) {
    if (ONLY && ONLY.indexOf(name) < 0) continue;
    const p = await browser.newPage({ viewport: vp });
    p.on('pageerror', e => errors.push(name + ': ' + e.message));
    const state = Object.assign(base(), { mode }, extra);
    await p.route('https://data.ryst.in/**', async route => {
      const url = route.request().url();
      const body = Object.assign({}, state, { serverNow: Date.now(), openedAt: Date.now() },
        /\/game\/profile/.test(url) ? { profile: profile ? { id: 'a', name: 'Asha', avatar: 'octopus' } : { id: 'a', name: 'Asha', avatar: 'octopus' }, avatars: [] } : {},
        /\/game\/ludo\//.test(url) ? { ludoMine: [2, 3] } : {}, /\/game\/quiz\//.test(url) ? { quizMe: { team: 0, answered: false, choice: -1 } } : {});
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
    await p.close();
  }
  await browser.close(); server.close();
  console.log(errors.length ? 'Page errors:\n  ' + errors.join('\n  ') : 'No page errors.');
  process.exitCode = errors.length ? 1 : 0;
});
