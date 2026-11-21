// Two phones + the pool screen against a stand-in /game that runs the real scoreboard.js / backdrop.js rules.
const RYST_ROOT = require('path').resolve(__dirname, '../../../../..'), RYST_PROXY = process.env.RYST_PROXY || require('path').resolve(RYST_ROOT, '../ryst-109a-proxy'); // the site repo and the proxy beside it
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const S = require(RYST_PROXY + '/scoreboard.js'), B = require(RYST_PROXY + '/backdrop.js'), ROOT = RYST_ROOT, OUT = process.argv[2] || require('os').tmpdir();
const st = { mode: 'scoreboard', board: Array(9).fill(null), turn: 'X', winner: null, scoreX: 0, scoreO: 0, ttt: { X: null, O: null }, tttMatch: { bestOf: 3, need: 2, round: 1, wins: { X: 0, O: 0 }, draws: 0, results: [] },
  players: S.freshPlayers(), playerCount: 2, scoreboard: S.fresh(), memory: { cards: [], matched: [], flipped: [], scores: [0, 0], moves: [0, 0], turn: 1 }, backdrop: B.fresh(), viz: {}, leaders: [],
  ludo: { phase: 'lobby', seats: [null, null, null, null], tokens: [[-1,-1,-1,-1],[-1,-1,-1,-1],[-1,-1,-1,-1],[-1,-1,-1,-1]], turn: -1 }, quiz: { phase: 'lobby', teams: [] } };
function handle(url, who, b){
  const p = new URL(url).pathname, put = o => o && Object.assign(st, o);
  if (p === '/game/scoreboard/score') put({ players: S.score(st.players, b.i, b.delta) });
  if (p === '/game/scoreboard/name') put({ players: S.rename(st.players, b.i, b.name) });
  if (p === '/game/scoreboard/avatar') { const x = S.avatar(st.players, b.i, b.avatar); if (x) st.players = x; }
  if (p === '/game/scoreboard/game') st.scoreboard = S.gameName(st.scoreboard, b.game);
  if (p === '/game/scoreboard/count') st.playerCount = Math.min(4, Math.max(1, b.count));
  if (p === '/game/scoreboard/finish') { const r = S.finish(st.players, st.playerCount, st.scoreboard, Date.now()); if (r.recorded) Object.assign(st, { players: r.players, scoreboard: r.scoreboard }); }
  if (p === '/game/scoreboard/reset') st.players = S.zero(st.players);
  if (p === '/game/backdrop/set') st.backdrop = B.set(st.backdrop, b);
  if (p === '/game/mode' && 'mode' in b) st.mode = b.mode;
  const extra = p === '/game/profile' ? { profile: { id: who, name: who, avatar: 'crab' } } : {};
  return Object.assign({}, st, { serverNow: Date.now(), openedAt: Date.now(), updatedAt: Date.now() }, extra);
}
const TY = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, q.url.split('?')[0].replace(/^\/+/, '')); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TY[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0, async () => {
  const br = await chromium.launch(), errs = [], port = srv.address().port, ok = (m, c) => console.log((c ? '✓ ' : '✗ ') + m);
  const open = async (who, page, vp) => { const p = await br.newPage({ viewport: vp }); p.on('pageerror', e => errs.push(who + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.route('https://data.ryst.in/**', async route => { let body = {}; try { body = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(handle(route.request().url(), who, body)), headers: { 'access-control-allow-origin': '*' } }); });
    await p.route(/open-meteo|googleapis|gstatic|accounts\.google/, r => r.abort());
    await p.addInitScript(t => { try { localStorage.setItem('ryst_play_token', t); } catch (e) {} }, 'tok-' + who);
    await p.goto(`http://127.0.0.1:${port}/${page}`); await p.waitForTimeout(1800); return p; };
  const tv = await open('tv', 'display.html', { width: 1600, height: 900 }), asha = await open('asha', 'play.html', { width: 390, height: 844 }), ravi = await open('ravi', 'play.html', { width: 390, height: 844 });
  for (const p of [asha, ravi]) { await p.evaluate(() => { const b = document.querySelector('[data-activity="scoreboard"],[data-mode="scoreboard"]'); if (b) b.click(); }); await p.waitForTimeout(700); }
  ok('both phones on the scoreboard', await asha.isVisible('#screen-scoreboard') && await ravi.isVisible('#screen-scoreboard'));
  await asha.click('.count-btn[data-count="3"]'); await asha.fill('#sbGameName', 'Carrom'); await asha.press('#sbGameName', 'Enter'); await asha.locator('#sbGameName').blur();
  await asha.fill('.player-row[data-i="0"] .player-name', 'Asha'); await asha.locator('.player-row[data-i="0"] .player-name').blur();
  await ravi.waitForTimeout(1200);
  await ravi.fill('.player-row[data-i="1"] .player-name', 'Ravi'); await ravi.locator('.player-row[data-i="1"] .player-name').blur();
  await ravi.click('.player-row[data-i="1"] .sb-avbtn'); await ravi.click('#sbAvPick [data-a="sun"]'); await ravi.waitForTimeout(300);
  ok('Ravi picks the sun avatar', st.players[1].avatar === 'sun');
  await asha.click('.player-row[data-i="0"] [data-delta="1"]'); await asha.click('.player-row[data-i="0"] [data-delta="1"]');
  await tv.waitForTimeout(4500);
  let order = await tv.$$eval('#scoreboardCols .scoreboard-col', els => els.filter(e => e.style.display !== 'none').map(e => e.querySelector('.p-name').textContent));
  ok('TV: Asha leads at 2 — ' + order.join(', '), order[0] === 'Asha' && order.length === 3);
  await ravi.click('.player-row[data-i="1"] [data-delta="5"]'); await tv.waitForTimeout(4500);
  order = await tv.$$eval('#scoreboardCols .scoreboard-col', els => els.filter(e => e.style.display !== 'none').map(e => e.querySelector('.p-name').textContent + ':' + e.querySelector('.sb-rank').textContent));
  ok('TV: Ravi overtakes with +5 — ' + order.join(', '), order[0].startsWith('Ravi:1st') && order[1].startsWith('Asha:2nd'));
  await tv.screenshot({ path: OUT + '/e2e-sb-tv.png' });
  await asha.waitForTimeout(1500); await asha.click('#sbFinishBtn'); await tv.waitForTimeout(4500);
  ok('finish records Carrom with Ravi the winner', st.scoreboard.history[0].game === 'Carrom' && st.scoreboard.history[0].winners.join() === '1' && st.players[1].wins === 1);
  ok('TV shows the winner card — ' + (await tv.textContent('#sbWinBig')), await tv.isVisible('#sbWin') && /Ravi/.test(await tv.textContent('#sbWinBig')));
  await tv.screenshot({ path: OUT + '/e2e-sb-tv-win.png' });
  await ravi.waitForTimeout(1500);
  ok('Ravi\'s phone shows the history — ' + (await ravi.textContent('#sbHistP')).replace(/\s+/g, ' '), /Carrom/.test(await ravi.textContent('#sbHistP')));
  ok('scores back to 0, game 2', (await ravi.textContent('#sbRoundP')) === 'Game 2' && st.players.every(p => p.score === 0));
  await ravi.screenshot({ path: OUT + '/e2e-sb-ravi.png', fullPage: true });
  // backdrop
  st.mode = 'backdrop'; for (const p of [asha, ravi]) { await p.evaluate(() => { const b = document.querySelector('[data-back]'); if (b) b.click(); }); await p.waitForTimeout(400); await p.evaluate(() => { const b = document.querySelector('[data-activity="backdrop"],[data-mode="backdrop"]'); if (b) b.click(); }); await p.waitForTimeout(700); }
  await ravi.click('#bdTpls [data-template="anniversary"]'); await ravi.fill('#backdropName', 'Meera & Arjun'); await ravi.locator('#backdropName').blur();
  await ravi.fill('#backdropText', '<b>25</b> years together'); await ravi.locator('#backdropText').blur();
  await asha.waitForTimeout(1200); await asha.click('.bd-preset[data-preset="stars"]'); await tv.waitForTimeout(4500);
  ok('backdrop state merged from both phones', st.backdrop.template === 'anniversary' && st.backdrop.name === 'Meera & Arjun' && st.backdrop.preset === 'stars');
  ok('TV headline from the template — ' + (await tv.textContent('#backdropText')), (await tv.textContent('#backdropText')) === 'Happy Anniversary');
  ok('guest text shown as text, not markup', (await tv.textContent('#backdropSub')) === '<b>25</b> years together' && !(await tv.$('#backdropSub b')));
  ok('TV theme is stars', (await tv.getAttribute('#backdropBg', 'class')).includes('stars'));
  ok('Asha\'s phone shows Ravi\'s words', (await asha.inputValue('#backdropName')) === 'Meera & Arjun');
  await tv.screenshot({ path: OUT + '/e2e-bd-tv.png' }); await asha.screenshot({ path: OUT + '/e2e-bd-asha.png', fullPage: true });
  console.log(errs.length ? 'page errors: ' + errs.join(' | ') : 'No page errors.');
  await br.close(); srv.close();
});
