// Two phones + the pool screen: Claw Catch over a stand-in /game/audio relay that mirrors the proxy's claw protocol
// (seats on claw-join with a token, moves stamped with the sender's seat, the screen's numbers-only state to phones).
const RYST_ROOT = require('path').resolve(__dirname, '../../../../..'), RYST_PROXY = process.env.RYST_PROXY || require('path').resolve(RYST_ROOT, '../ryst-109a-proxy'); // the site repo and the proxy beside it
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = RYST_ROOT, OUT = process.argv[2] || require('os').tmpdir();
const people = { asha: { name: 'Asha', avatar: 'octopus' }, bala: { name: 'Bala', avatar: 'sun' } };
const clients = new Set(), slots = [null, null, null, null], seen = [];
const roster = () => ({ type: 'claw-roster', slots: slots.map(Boolean), who: slots.map(s => (s ? people[s.who] : null)) });
const send = (ws, m) => { try { ws.send(JSON.stringify(m)); } catch (e) {} };
const bcast = (m, except) => clients.forEach(c => { if (c !== except) send(c, m); });
function onMsg(ws, raw) {
  let m; try { m = JSON.parse(raw); } catch (e) { return; } seen.push((ws.who || 'tv') + ':' + m.type);
  const slot = Number.isInteger(ws.slot) ? ws.slot : null;
  if (m.type === 'claw-join') { if (slot != null) return send(ws, { type: 'claw-you', slot }); if (!m.token) return send(ws, { type: 'claw-denied' });
    const free = slots.findIndex(x => !x); if (free < 0) return send(ws, { type: 'claw-full' }); slots[free] = { ws, who: ws.who }; ws.slot = free; send(ws, { type: 'claw-you', slot: free }); bcast(roster()); return; }
  if (m.type === 'claw-hello') return send(ws, roster());
  if (m.type === 'claw-ping') return send(ws, { type: 'claw-pong', t: m.t });
  if (m.type === 'claw-leave') { if (slot != null) { slots[slot] = null; ws.slot = null; bcast(roster()); } return; }
  if (m.type === 'claw-move' || m.type === 'claw-drop' || m.type === 'claw-start') { if (slot == null) return; const out = { type: m.type, slot }; if (m.type === 'claw-move') { out.dir = m.dir; out.dz = m.dz; } bcast(out, ws); return; }
  if (m.type === 'claw-state') bcast({ type: 'claw-state', phase: m.phase, timeLeft: m.timeLeft, scores: m.scores, winners: m.winners || [] }, ws);
}
let curMode = 'claw';
const state = () => ({ mode: curMode, openedAt: Date.now(), updatedAt: Date.now(), serverNow: Date.now(), leaders: [], board: Array(9).fill(null), turn: 'X', ttt: { X: null, O: null }, tttMatch: { bestOf: 3, need: 2, round: 1, wins: { X: 0, O: 0 }, results: [] }, players: [], playerCount: 2, scoreboard: { game: '', round: 1, history: [] },
  memory: { cards: [], matched: [], flipped: [], scores: [0, 0], moves: [0, 0], turn: 1 }, backdrop: { template: 'custom', name: '', text: '', preset: 'party' }, viz: {}, ludo: { phase: 'lobby', seats: [null, null, null, null], tokens: [[-1, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1]], turn: -1 }, quiz: { phase: 'lobby', teams: [] }, darts: { phase: 'lobby', players: [], visit: [], history: [] }, music: { now: null, queue: [] }, movie: { phase: 'setup', options: [] } });
const TY = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, q.url.split('?')[0].slice(1)); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TY[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0, async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] }), errs = [], port = srv.address().port, ok = (m, c) => console.log((c ? '✓ ' : '✗ ') + m);
  const open = async (who, page, vp) => { const p = await br.newPage({ viewport: vp, hasTouch: true }); p.on('pageerror', e => errs.push(who + ': ' + e.message));
    await p.route('https://data.ryst.in/**', async route => { const u = route.request().url(); if (/\/game\/mode$/.test(u)) { try { const bd = JSON.parse(route.request().postData() || '{}'); if ('mode' in bd) curMode = bd.mode; } catch (e) {} } await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(Object.assign(state(), /\/game\/profile/.test(u) && people[who] ? { profile: Object.assign({ id: who }, people[who]) } : {})), headers: { 'access-control-allow-origin': '*' } }); });
    await p.routeWebSocket(/\/game\/audio/, ws => { ws.who = who === 'tv' ? null : who; clients.add(ws); ws.onMessage(raw => onMsg(ws, raw)); ws.onClose(() => { clients.delete(ws); if (Number.isInteger(ws.slot)) { slots[ws.slot] = null; bcast(roster()); } }); });
    await p.route(/open-meteo|googleapis|gstatic|accounts\.google/, r => r.abort());
    await p.addInitScript(t => { try { localStorage.setItem('ryst_play_token', t); } catch (e) {} }, 'tok-' + who);
    await p.goto(`http://127.0.0.1:${port}/${page}`); await p.waitForTimeout(2500); return p; };
  const tv = await open('tv', 'display.html', { width: 1600, height: 900 }); await tv.waitForTimeout(2500);
  const asha = await open('asha', 'play.html', { width: 390, height: 844 }), bala = await open('bala', 'play.html', { width: 390, height: 844 });
  await asha.waitForTimeout(1500); await bala.waitForTimeout(1500);
  ok('both phones hold a claw (seats ' + slots.map(s => (s ? s.who : '-')).join(',') + ')', slots.filter(Boolean).length === 2);
  ok('the screen asked who is in', seen.some(x => x === 'tv:claw-hello'));
  await asha.click('#clawStartBtn'); await asha.waitForTimeout(2500);
  ok('Asha starts a round: the screen receives claw-start from her seat', seen.some(x => x === 'asha:claw-start'));
  const st = await asha.evaluate(() => clawGame && clawGame.phase);
  ok('the screen’s round state reaches the phones (phase ' + st + ')', st && st !== 'lobby');
  // steer with the joystick, then drop
  const stick = await asha.$('#clawStick'), b = await stick.boundingBox();
  await asha.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await asha.mouse.down(); await asha.mouse.move(b.x + b.width * 0.9, b.y + b.height / 2, { steps: 6 }); await asha.waitForTimeout(400); await asha.mouse.up(); await asha.waitForTimeout(300);
  const moves = seen.filter(x => x === 'asha:claw-move').length;
  ok('the joystick sends analog moves (' + moves + ')', moves >= 2);
  await asha.click('#clawDropBtn'); await asha.waitForTimeout(500);
  ok('drop reaches the relay from Asha', seen.some(x => x === 'asha:claw-drop'));
  await bala.click('#clawDropBtn'); await bala.waitForTimeout(500);
  ok('Bala drops his own claw', seen.some(x => x === 'bala:claw-drop'));
  await tv.waitForTimeout(1500); await tv.screenshot({ path: OUT + '/e2e-claw-tv.png' });
  const tvSaw = await tv.evaluate(() => document.querySelector('#clawPlayers') ? document.querySelector('#clawPlayers').textContent.split(/\s+/).join(' ') : '');
  ok('the TV lists both players — ' + tvSaw.slice(0, 60), /Asha/.test(tvSaw) && /Bala/.test(tvSaw));
  await bala.evaluate(() => { const b = document.querySelector('[data-back]'); if (b) b.click(); }); await bala.waitForTimeout(800);
  ok('leaving frees the claw', slots.filter(Boolean).length === 1);
  console.log(errs.length ? 'page errors: ' + errs.join(' | ') : 'No page errors.');
  await br.close(); srv.close();
});
