// Two phones + the pool screen: Darts in both modes against a stand-in /game running the real darts.js.
const RYST_ROOT = require('path').resolve(__dirname, '../../../../..'), RYST_PROXY = process.env.RYST_PROXY || require('path').resolve(RYST_ROOT, '../ryst-109a-proxy'); // the site repo and the proxy beside it
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const DA = require(RYST_PROXY + '/darts.js'), ROOT = RYST_ROOT, OUT = process.argv[2] || require('os').tmpdir();
let D = DA.fresh(), owners = [];
const people = { asha: { id: 'pa', name: 'Asha', avatar: 'octopus' }, bala: { id: 'pb', name: 'Bala', avatar: 'sun' } };
const st = () => ({ mode: 'darts', darts: D, openedAt: Date.now(), updatedAt: Date.now(), serverNow: Date.now(), board: Array(9).fill(null), turn: 'X', ttt: { X: null, O: null }, tttMatch: { bestOf: 3, need: 2, round: 1, wins: { X: 0, O: 0 }, results: [] }, players: [], playerCount: 2, scoreboard: { game: '', round: 1, history: [] },
  memory: { cards: [], matched: [], flipped: [], scores: [0, 0], moves: [0, 0], turn: 1 }, backdrop: { template: 'custom', name: '', text: '', preset: 'party' }, viz: {}, leaders: [], ludo: { phase: 'lobby', seats: [null, null, null, null], tokens: [[-1, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1]], turn: -1 }, quiz: { phase: 'lobby', teams: [] } });
const log = [];
function handle(url, who, b) {
  const p = new URL(url).pathname, now = Date.now(), mine = () => owners.map((o, i) => (o === who ? i : -1)).filter(i => i >= 0);
  DA.tick(D, now);
  if (p === '/game/darts/join') { const i = DA.join(D, b.name ? { id: 'g' + D.players.length, name: b.name, avatar: 'crab' } : people[who]); if (i >= 0) owners[i] = who; }
  if (p === '/game/darts/setup' && mine().length) DA.setup(D, b);
  if (p === '/game/darts/start' && mine().length) DA.start(D, now);
  if (p === '/game/darts/throw' && D.phase === 'play') {
    if (D.visit.length === 3 || D.bust) DA.advance(D);
    if (owners[D.turn] === who) {
      if (D.mode === 'virtual') { const at = DA.land(b.aim, b.steady, Math.random); DA.throwDart(D, DA.score(at.x, at.y), at, now); log.push(who + ' aim ' + JSON.stringify(b.aim) + ' steady ' + b.steady + ' → ' + D.last.label); }
      else { const d = DA.dart(b.seg, b.mult); if (d) DA.throwDart(D, d, null, now); }
    }
  }
  if (p === '/game/darts/undo' && D.mode === 'board' && owners[D.turn] === who) DA.undo(D);
  if (p === '/game/darts/end' && mine().length) DA.end(D);
  if (p === '/game/darts/new' && D.phase === 'over') { const keep = D.players; Object.assign(D, DA.fresh({ mode: D.mode, start: D.start, doubleOut: D.doubleOut }), { players: keep }); D.players.forEach(x => { x.score = D.start; }); }
  const extra = {};
  if (p.startsWith('/game/darts/')) extra.dartsMine = mine();
  if (p === '/game/profile') extra.profile = people[who] || null;
  return Object.assign(st(), extra);
}
const TY = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, q.url.split('?')[0].slice(1)); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TY[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0, async () => {
  const br = await chromium.launch(), errs = [], port = srv.address().port, ok = (m, c) => console.log((c ? '✓ ' : '✗ ') + m);
  const txt = async (p, sel) => ((await p.textContent(sel)) || '').split(/\s+/).join(' ').trim();
  const open = async (who, page, vp) => { const p = await br.newPage({ viewport: vp, hasTouch: false }); p.on('pageerror', e => errs.push(who + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.route('https://data.ryst.in/**', async route => { let body = {}; try { body = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(handle(route.request().url(), who, body)), headers: { 'access-control-allow-origin': '*' } }); });
    await p.route(/open-meteo|googleapis|gstatic|accounts\.google/, r => r.abort());
    await p.addInitScript(t => { try { localStorage.setItem('ryst_play_token', t); } catch (e) {} }, 'tok-' + who);
    await p.goto(`http://127.0.0.1:${port}/${page}`); await p.waitForTimeout(1800); return p; };
  const tv = await open('tv', 'display.html', { width: 1600, height: 900 }), asha = await open('asha', 'play.html', { width: 390, height: 844 }), bala = await open('bala', 'play.html', { width: 390, height: 844 });
  for (const p of [asha, bala]) { await p.evaluate(() => { const b = document.querySelector('[data-activity="darts"],[data-mode="darts"]'); if (b) b.click(); }); await p.waitForTimeout(800); }
  ok('both phones on Darts', await asha.isVisible('#screen-darts') && await bala.isVisible('#screen-darts'));
  await asha.click('#dtJoinMe'); await asha.waitForTimeout(400); await bala.waitForTimeout(1200); await bala.click('#dtJoinMe'); await bala.waitForTimeout(400);
  ok('two players, each phone owns its own', D.players.length === 2 && owners.join() === 'asha,bala');
  await asha.waitForTimeout(1200); await asha.click('#dtStartSeg [data-start="301"]'); await asha.waitForTimeout(400);
  ok('301 set from Asha\'s phone', D.start === 301 && D.players.every(p => p.score === 301));
  await asha.click('#dtStartBtn'); await asha.waitForTimeout(500);
  ok('the game starts, Asha to throw, the aim board shows only on her phone', D.phase === 'play' && D.turn === 0 && await asha.isVisible('#dtAim') && !(await bala.isVisible('#dtAim').catch(() => false)));
  // three virtual throws: hold on the treble 20, wait to steady, let go
  const cv = await asha.$('#dtAimCv'), box = await cv.boundingBox();
  for (let k = 0; k < 3; k++) { await asha.mouse.move(box.x + box.width / 2, box.y + box.height * 0.32); await asha.mouse.down(); await asha.waitForTimeout(1300); await asha.mouse.up(); await asha.waitForTimeout(500); }
  ok('three darts thrown; landings decided by the rules — ' + log.slice(-3).join(' | '), D.visit.length === 3 && D.players[0].darts === 3);
  ok('steady aims were near the treble 20 (aim y ≈ 0.6)', log.slice(-3).every(l => /"y":0\.[4-7]/.test(l)));
  await tv.waitForTimeout(1500); const turn = await txt(tv, '#dtTurn');
  ok('TV shows the visit and what is left — ' + turn, turn.indexOf(String(D.players[0].score)) >= 0 && D.visit.every(d => turn.indexOf(d.label) >= 0));
  await tv.screenshot({ path: OUT + '/e2e-darts-tv-visit.png' });
  await bala.waitForTimeout(1300); ok('Bala\'s phone: aim board up for the next turn', await bala.isVisible('#dtAim'));
  // switch to the real board: end, set board mode, play to a finish with taps (and an undo)
  await asha.click('#dtEndBtn'); await asha.waitForTimeout(500);
  ok('ending returns to the lobby', D.phase === 'lobby');
  await asha.click('#dtMode [data-mode="board"]'); await asha.waitForTimeout(300); await asha.click('#dtStartBtn'); await asha.waitForTimeout(500);
  const tap = async (p, seg, mult) => { if (mult > 1) await p.click(`#dtMult [data-mult="${mult}"]`); if (seg === 25) await p.click(`#dtPad .dt-extra [data-seg="25"][data-m="${mult}"]`); else await p.click(`#dtNums [data-seg="${seg}"]`); await p.waitForTimeout(350); };
  ok('board mode: the keypad shows on Asha\'s phone', await asha.isVisible('#dtPad'));
  await tap(asha, 20, 3); await tap(asha, 20, 3); await tap(asha, 20, 3);
  ok('T20 ×3 = 180, 121 left', D.players[0].score === 121);
  await bala.waitForTimeout(1300); await tap(bala, 1, 1); await bala.click('#dtUndo'); await bala.waitForTimeout(350);
  ok('Bala takes back a mis-tap', D.visit.length === 0 && D.players[1].score === 301);
  await tap(bala, 5, 1); await tap(bala, 5, 1); await tap(bala, 5, 1);
  await asha.waitForTimeout(1300); await tv.waitForTimeout(1200);
  await tap(asha, 20, 3); await tv.waitForTimeout(1200); const hint = await txt(tv, '#dtTurn');
  ok('TV checkout hint for 61 with two darts — ' + hint, /Checkout/.test(hint));
  await tap(asha, 11, 1); await tap(asha, 25, 2);
  ok('T20 11 Bull: game shot for Asha', D.phase === 'over' && D.winner === 0);
  await tv.waitForTimeout(2200);
  ok('TV winner card — ' + (await txt(tv, '#dtWinBig')) + ' / ' + (await txt(tv, '#dtWinKicker')), await tv.isVisible('#dtWin') && /Asha/.test(await txt(tv, '#dtWinBig')));
  await tv.screenshot({ path: OUT + '/e2e-darts-tv-over.png' }); await asha.screenshot({ path: OUT + '/e2e-darts-asha-over.png', fullPage: true });
  await asha.waitForTimeout(1300); await asha.click('#dtNewBtn'); await asha.waitForTimeout(400);
  ok('a new game keeps the players and board mode', D.phase === 'lobby' && D.players.length === 2 && D.mode === 'board' && D.players.every(p => p.score === 301));
  ok('sign-ins never in the public state', !JSON.stringify(st()).includes('tok-'));
  console.log(errs.length ? 'page errors: ' + errs.join(' | ') : 'No page errors.');
  await br.close(); srv.close();
});
