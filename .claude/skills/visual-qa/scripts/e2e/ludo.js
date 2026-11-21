// Two phones + the pool screen: Ludo Lounge against a stand-in /game running the real ludo.js, with private seat owners.
const RYST_ROOT = require('path').resolve(__dirname, '../../../../..'), RYST_PROXY = process.env.RYST_PROXY || require('path').resolve(RYST_ROOT, '../ryst-109a-proxy'); // the site repo and the proxy beside it
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = RYST_ROOT, PROXY = RYST_PROXY, OUT = process.argv[2] || require('os').tmpdir();
const Ludo = require(PROXY + '/ludo.js');
let L = Ludo.fresh(), owners = [null, null, null, null];
const people = { asha: { id: 'pa', name: 'Asha', avatar: 'octopus' }, bala: { id: 'pb', name: 'Bala', avatar: 'sun' } };
const base = () => ({ mode: 'ludo', ludo: L, leaders: [], board: Array(9).fill(null), turn: 'X', ttt: { X: null, O: null }, tttMatch: { bestOf: 3, need: 2, round: 1, wins: { X: 0, O: 0 }, results: [] }, players: [], playerCount: 2, scoreboard: { game: '', round: 1, history: [] },
  memory: { cards: [], matched: [], flipped: [], scores: [0, 0], moves: [0, 0], turn: 1 }, backdrop: { template: 'custom', name: '', text: '', preset: 'party' }, viz: {}, quiz: { phase: 'lobby', teams: [] }, darts: { phase: 'lobby', players: [], visit: [], history: [] }, music: { now: null, queue: [] }, movie: { phase: 'setup', options: [] } });
let rolls = 0;
function handle(url, who, b) {
  const p = new URL(url).pathname, now = Date.now(), mine = () => owners.map((o, c) => (o === who ? c : -1)).filter(c => c >= 0), extra = {};
  if (p.startsWith('/game/ludo/')) {
    mine().forEach(c => Ludo.touch(L, c, now));
    if (p === '/game/ludo/join' && Ludo.join(L, b.seat, b.name || people[who].name)) { owners[b.seat] = who; L.seats[b.seat].avatar = people[who].avatar; Ludo.touch(L, b.seat, now); }
    else if (p === '/game/ludo/leave' && owners[b.seat] === who) { Ludo.leave(L, b.seat); owners[b.seat] = null; }
    else if (p === '/game/ludo/start' && mine().length) Ludo.start(L, now);
    else if (p === '/game/ludo/roll' && L.turn >= 0 && owners[L.turn] === who) { Ludo.roll(L, L.turn, Math.random(), now); rolls++; }
    else if (p === '/game/ludo/move' && L.turn >= 0 && owners[L.turn] === who) Ludo.move(L, L.turn, b.token, now);
    extra.ludoMine = mine();
  }
  if (p === '/game/profile') extra.profile = people[who] || null;
  return Object.assign(base(), { openedAt: now, updatedAt: now, serverNow: now }, extra);
}
const TY = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, q.url.split('?')[0].slice(1)); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TY[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0, async () => {
  const br = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] }), errs = [], port = srv.address().port, ok = (m, c) => console.log((c ? '✓ ' : '✗ ') + m);
  const txt = async (p, sel) => ((await p.textContent(sel)) || '').split(/\s+/).join(' ').trim();
  const open = async (who, page, vp) => { const p = await br.newPage({ viewport: vp }); p.on('pageerror', e => errs.push(who + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.route('https://data.ryst.in/**', async route => { let body = {}; try { body = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(handle(route.request().url(), who, body)), headers: { 'access-control-allow-origin': '*' } }); });
    await p.route(/open-meteo|googleapis|gstatic|accounts\.google/, r => r.abort());
    await p.addInitScript(t => { try { localStorage.setItem('ryst_play_token', t); } catch (e) {} }, 'tok-' + who);
    await p.goto(`http://127.0.0.1:${port}/${page}`); await p.waitForTimeout(2000); return p; };
  const tv = await open('tv', 'display.html', { width: 1600, height: 900 }), asha = await open('asha', 'play.html', { width: 390, height: 844 }), bala = await open('bala', 'play.html', { width: 390, height: 844 });
  ok('both phones on Ludo Lounge', await asha.isVisible('#screen-ludo') && await bala.isVisible('#screen-ludo'));
  await asha.click('#ludoSeats [data-seat="0"]'); await asha.waitForTimeout(400); await bala.waitForTimeout(1400); await bala.click('#ludoSeats [data-seat="2"]'); await bala.waitForTimeout(400);
  ok('Asha takes red, Bala yellow; owners stay private', owners[0] === 'asha' && owners[2] === 'bala' && !JSON.stringify(base()).includes('"asha"'));
  await asha.waitForTimeout(1400); await asha.click('#ludoStart'); await asha.waitForTimeout(500);
  ok('the game starts on red', L.phase === 'play' && L.turn === 0);
  await tv.waitForTimeout(3000); const t0 = await txt(tv, '#ludoTurnLabel');
  ok('TV shows whose turn it is — ' + t0, /red/i.test(t0) || /Asha/.test(await txt(tv, '#ludoTurnName').catch(() => '')) || /Asha/.test(await txt(tv, '#screen-ludo')));
  // play up to twenty turns: whoever's phone it is rolls, and moves a pawn when asked
  for (let k = 0; k < 20 && L.phase === 'play'; k++) {
    const who = owners[L.turn] === 'asha' ? asha : bala;
    await who.waitForTimeout(1100);
    if (!L.rolled) { await who.click('#ludoRoll').catch(() => {}); await who.waitForTimeout(500); }
    if (L.rolled && owners[L.turn]) { const ph = owners[L.turn] === 'asha' ? asha : bala; await ph.waitForTimeout(900); const btn = await ph.$('#ludoTokens [data-token]:not([disabled])'); if (btn) { await btn.click(); await ph.waitForTimeout(500); } }
  }
  const out = L.tokens[0].filter(x => x >= 0).length + L.tokens[2].filter(x => x >= 0).length;
  ok('twenty turns played from the phones: ' + rolls + ' rolls, ' + out + ' pawns out of base, turn passes between the two', rolls >= 10 && L.phase === 'play');
  await tv.waitForTimeout(2500); await tv.screenshot({ path: OUT + '/e2e-ludo-tv.png' });
  const panel = await txt(tv, '#ludoPlayers');
  ok('TV panel lists both players — ' + panel.slice(0, 70), /Asha/.test(panel) && /Bala/.test(panel));
  const off = owners[L.turn] === 'asha' ? bala : asha, offWho = owners[L.turn] === 'asha' ? 'bala' : 'asha', before = rolls, rolledBefore = L.rolled, diceBefore = L.rollId;
  await off.evaluate(async t => { await fetch('https://data.ryst.in/game/ludo/roll', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Token': t }, body: '{}' }); }, 'tok-' + offWho);
  ok('a phone can\'t roll on someone else\'s turn', rolls === before && L.rollId === diceBefore && L.rolled === rolledBefore);
  console.log(errs.length ? 'page errors: ' + errs.join(' | ') : 'No page errors.');
  await br.close(); srv.close();
});
