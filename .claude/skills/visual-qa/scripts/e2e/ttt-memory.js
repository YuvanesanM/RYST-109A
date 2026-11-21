// Two phones + the pool screen against a stand-in /game that runs the real ttt.js / memory.js rules.
const RYST_ROOT = require('path').resolve(__dirname, '../../../../..'), RYST_PROXY = process.env.RYST_PROXY || require('path').resolve(RYST_ROOT, '../ryst-109a-proxy'); // the site repo and the proxy beside it
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const T = require(RYST_PROXY + '/ttt.js'), M = require(RYST_PROXY + '/memory.js'), ROOT = RYST_ROOT, OUT = process.argv[2] || require('os').tmpdir();
const st = { mode: 'tictactoe', board: Array(9).fill(null), turn: 'X', winner: null, winLine: null, scoreX: 0, scoreO: 0, tttMatch: T.freshMatch(3, 'X'), ttt: { X: null, O: null }, players: [], playerCount: 2,
  memory: M.fresh('easy'), backdrop: { text: '', preset: 'party' }, viz: {}, leaders: [], ludo: { phase: 'lobby', seats: [null, null, null, null], tokens: [[-1,-1,-1,-1],[-1,-1,-1,-1],[-1,-1,-1,-1],[-1,-1,-1,-1]], turn: -1 }, quiz: { phase: 'lobby', teams: [] } };
const owners = { X: null, O: null }, names = { asha: ['Asha', 'octopus'], ravi: ['Ravi', 'crab'] }, log = [];
function handle(url, who, body){
  const p = new URL(url).pathname, extra = {};
  if (p === '/game/ttt/join' && !owners[body.mark] && !Object.values(owners).includes(who)) { owners[body.mark] = who; st.ttt[body.mark] = { name: names[who][0], avatar: names[who][1], seen: Date.now() }; }
  if (p === '/game/move' && st.ttt.X && st.ttt.O && owners[st.turn] === who) { const t = { board: st.board, turn: st.turn, winner: st.winner, winLine: st.winLine, scoreX: st.scoreX, scoreO: st.scoreO, match: st.tttMatch }; if (T.move(t, body.i)) { Object.assign(st, { board: t.board, turn: t.turn, winner: t.winner, winLine: t.winLine, scoreX: t.scoreX, scoreO: t.scoreO, tttMatch: t.match }); log.push(who + ' ' + body.i); } }
  if (p === '/game/new-round') { const t = { board: st.board, turn: st.turn, match: st.tttMatch }; T.nextRound(t); Object.assign(st, { board: t.board, turn: t.turn, winner: null, winLine: null, tttMatch: t.match }); }
  if (p === '/game/memory/flip') M.flip(st.memory, body.i, Date.now());
  if (p === '/game/memory/new-round') st.memory = M.fresh(body.difficulty || st.memory.difficulty);
  if (p === '/game/mode' && 'mode' in body) st.mode = body.mode;
  if (/\/game\/ttt\//.test(p)) extra.tttMine = Object.keys(owners).find(k => owners[k] === who) || null;
  if (p === '/game/profile') extra.profile = { id: who, name: names[who] ? names[who][0] : 'Screen', avatar: names[who] ? names[who][1] : 'crab' };
  return Object.assign({}, st, { serverNow: Date.now(), openedAt: Date.now(), updatedAt: Date.now() }, extra);
}
const TY = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, q.url.split('?')[0].replace(/^\/+/, '')); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TY[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0, async () => {
  const b = await chromium.launch(), errs = [], port = srv.address().port;
  const open = async (who, page, vp) => { const p = await b.newPage({ viewport: vp }); p.on('pageerror', e => errs.push(who + ': ' + e.message));
    await p.route('https://data.ryst.in/**', async route => { let body = {}; try { body = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(handle(route.request().url(), who, body)), headers: { 'access-control-allow-origin': '*' } }); });
    await p.route(/open-meteo|googleapis|gstatic|accounts\.google/, r => r.abort());
    await p.addInitScript(t => { try { localStorage.setItem('ryst_play_token', t); } catch (e) {} }, 'tok-' + who);
    await p.goto(`http://127.0.0.1:${port}/${page}`); await p.waitForTimeout(1800); return p; };
  const tv = await open('tv', 'display.html', { width: 1600, height: 900 }), asha = await open('asha', 'play.html', { width: 390, height: 844 }), ravi = await open('ravi', 'play.html', { width: 390, height: 844 });
  for (const p of [asha, ravi]) { await p.evaluate(() => { const b = document.querySelector('[data-activity="tictactoe"],[data-mode="tictactoe"]'); if (b) b.click(); }); await p.waitForTimeout(600); }
  await asha.click('#tttSeats [data-mark="X"]'); await ravi.waitForTimeout(1500); await ravi.click('#tttSeats [data-mark="O"]'); await asha.waitForTimeout(1500);
  const tap = async (p, i) => { await p.waitForSelector(`#board .cell[data-i="${i}"]:not([disabled])`, { timeout: 5000 }); await p.click(`#board .cell[data-i="${i}"]`); await p.waitForTimeout(400); };
  // round 1: X wins the top row
  await tap(asha, 0); await tap(ravi, 3); await tap(asha, 1); await tap(ravi, 4); await tap(asha, 2);
  await tv.waitForTimeout(1600); await tv.screenshot({ path: OUT + '/e2e-tv-round1.png' });
  const ok = (m, c) => console.log((c ? '✓ ' : '✗ ') + m);
  ok('round 1: X wins the top row and the line is sent', st.winner === 'X' && String(st.winLine) === '0,1,2' && st.tttMatch.wins.X === 1);
  ok('the other phone sees the result and the Next round button shows', /Asha/.test(await ravi.textContent('#turnLabel')) && /Next round/.test(await asha.textContent('#newRoundBtn')));
  await ravi.click('#newRoundBtn'); await asha.waitForTimeout(1500);
  ok('round 2 is opened by O', st.turn === 'O');
  await tap(ravi, 8); await tap(asha, 0); await tap(ravi, 7); await tap(asha, 1); await tap(ravi, 4); await tap(asha, 2);
  await tv.waitForTimeout(2600); await tv.screenshot({ path: OUT + '/e2e-tv-match.png' }); await asha.screenshot({ path: OUT + '/e2e-asha-match.png', fullPage: true });
  ok('X takes the match 2–0; Rematch shows; the TV shows the match card', st.tttMatch.over && st.tttMatch.champion === 'X' && /Rematch/.test(await asha.textContent('#newRoundBtn')) && await tv.isVisible('#tttWin'));
  await asha.click('#newRoundBtn'); await tv.waitForTimeout(1800);
  console.log('rematch: over', st.tttMatch.over, 'wins', JSON.stringify(st.tttMatch.wins), 'tv card hidden:', !(await tv.isVisible('#tttWin')));
  // memory on the same phones
  st.mode = 'memory'; for (const p of [asha, ravi]) { await p.evaluate(() => { const b = document.querySelector('[data-activity="memory"],[data-mode="memory"]'); if (b) b.click(); }); await p.waitForTimeout(800); }
  await asha.click('.s4-levels [data-lvl="hard"]'); await asha.waitForTimeout(1200);
  const cards = st.memory.cards, pairOf = i => cards.findIndex((c, j) => j !== i && c === cards[i]);
  await asha.click(`#memBoard .mc[data-i="0"]`); await asha.waitForTimeout(500); await asha.click(`#memBoard .mc[data-i="${pairOf(0)}"]`); await asha.waitForTimeout(500);
  const wrong = [...cards.keys()].find(i => i !== 0 && i !== pairOf(0) && cards[i] !== cards[1] && i !== 1);
  await ravi.waitForTimeout(1300); await asha.click(`#memBoard .mc[data-i="1"]`); await asha.waitForTimeout(400); await asha.click(`#memBoard .mc[data-i="${wrong}"]`); await tv.waitForTimeout(1300);
  await tv.screenshot({ path: OUT + '/e2e-tv-memory.png' }); await ravi.screenshot({ path: OUT + '/e2e-ravi-memory.png', fullPage: true });
  ok('Memory hard: 24 cards on the TV, a pair matched, moves counted', st.memory.cards.length === 24 && (await tv.$$eval('#memBoard .mc', x => x.length)) === 24 && st.memory.scores[0] === 1 && st.memory.moves[0] >= 1);
  console.log(errs.length ? 'page errors: ' + errs.join(' | ') : 'No page errors.'); await b.close(); srv.close(); });
