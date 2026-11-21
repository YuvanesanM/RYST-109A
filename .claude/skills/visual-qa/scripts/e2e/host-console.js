// Staff phone + guest phone + the pool screen: the host console against a stand-in /game using the real host.js.
const RYST_ROOT = require('path').resolve(__dirname, '../../../../..'), RYST_PROXY = process.env.RYST_PROXY || require('path').resolve(RYST_ROOT, '../ryst-109a-proxy'); // the site repo and the proxy beside it
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const H = require(RYST_PROXY + '/host.js'), ROOT = RYST_ROOT, OUT = process.argv[2] || require('os').tmpdir();
const g = { mode: 'quiz', screen: H.freshScreen(), leaders: [{ id: 'm', name: 'Meera', avatar: 'sun', wins: 3, claw: 2, ludo: 1 }], board: Array(9).fill(null), turn: 'X', ttt: { X: null, O: null }, tttMatch: { bestOf: 3, need: 2, round: 1, wins: { X: 0, O: 0 }, results: [] }, players: [], playerCount: 2, scoreboard: { game: '', round: 1, history: [] },
  memory: { cards: [], matched: [], flipped: [], scores: [0, 0], moves: [0, 0], turn: 1 }, backdrop: { template: 'custom', name: '', text: '', preset: 'party' }, viz: {}, ludo: { phase: 'lobby', seats: [null, null, null, null], tokens: [[-1, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1]], turn: -1 },
  quiz: { phase: 'lobby', teams: [{ name: 'Sea Turtles', colour: '#34c79a', score: 0, members: [] }, { name: 'Coconuts', colour: '#ffc94d', score: 0, members: [] }, { name: 'Sandcastles', colour: '#ff9a6b', score: 0, members: [] }, { name: 'Starfish', colour: '#7b8cff', score: 0, members: [] }], qIndex: -1, total: 10, answered: [0, 0, 0, 0], winners: [], board: [], category: 'mixed', length: 10 },
  darts: { phase: 'lobby', mode: 'virtual', start: 501, doubleOut: true, players: [], turn: 0, visit: [], history: [] } };
let log = [], resets = [];
function handle(url, who, b) {
  const p = new URL(url).pathname, now = Date.now();
  if (p.startsWith('/game/admin/')) {
    if (who !== 'staff') return { status: 403, body: { error: 'Staff only' } };
    const did = (a, d) => { log = H.log(log, 'caretaker@example.com', a, d, now); };
    if (p === '/game/admin/mode') { g.mode = b.mode || null; did('show', g.mode || 'welcome screen'); }
    if (p === '/game/admin/pause') { g.screen = H.pause(g.screen, b.paused, b.message, now); did(b.paused ? 'pause' : 'resume', g.screen.message); }
    if (p === '/game/admin/sound') { g.screen = H.sound(g.screen, b); did('sound', g.screen.muted ? 'muted' : 'volume ' + g.screen.volume); }
    if (p === '/game/admin/reset') { resets.push(b.game); did('reset', b.game); }
    if (p === '/game/admin/leaders-clear') { g.leaders = []; did('leaderboard', 'cleared'); }
    return { status: 200, body: Object.assign({}, g, { openedAt: now, serverNow: now, host: { log: log.slice(0, 12), seats: { tictactoe: 0, ludo: 0, quiz: 0, darts: 0, claw: 0 }, phonesAgo: 5000 } }) };
  }
  const extra = p === '/game/profile' ? { profile: { id: who, name: who === 'staff' ? 'Senthil' : 'Asha', avatar: 'crab' } } : {};
  return { status: 200, body: Object.assign({}, g, { openedAt: now, updatedAt: now, serverNow: now }, extra) };
}
const TY = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, q.url.split('?')[0].slice(1)); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TY[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0, async () => {
  const br = await chromium.launch(), errs = [], port = srv.address().port, ok = (m, c) => console.log((c ? '✓ ' : '✗ ') + m);
  const open = async (who, page, vp) => { const p = await br.newPage({ viewport: vp }); p.on('pageerror', e => errs.push(who + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.route('https://data.ryst.in/**', async route => { let body = {}; try { body = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
      const r = handle(route.request().url(), who, body); await route.fulfill({ status: r.status, contentType: 'application/json', body: JSON.stringify(r.body), headers: { 'access-control-allow-origin': '*' } }); });
    await p.route(/open-meteo|googleapis|gstatic|accounts\.google/, r => r.abort());
    await p.addInitScript(t => { try { localStorage.setItem('ryst_play_token', t); } catch (e) {} }, 'tok-' + who);
    await p.goto(`http://127.0.0.1:${port}/${page}`); await p.waitForTimeout(1800); return p; };
  g.mode = null;
  const tv = await open('tv', 'display.html', { width: 1600, height: 900 }), staff = await open('staff', 'play.html', { width: 390, height: 844 }), guest = await open('guest', 'play.html', { width: 390, height: 844 });
  ok('the guest phone has no host console entry', !(await guest.isVisible('#rpHostEntry')));
  ok('the staff phone shows the host console entry', await staff.isVisible('#rpHostEntry'));
  await staff.click('#rpHostEntry'); await staff.waitForTimeout(600);
  ok('the console opens without changing the screen', await staff.isVisible('#screen-host') && g.mode === null);
  await staff.click('#hcModes [data-m="darts"]'); await staff.waitForTimeout(500);
  ok('staff put Darts on the screen', g.mode === 'darts'); await tv.waitForTimeout(1500);
  ok('the TV shows Darts', await tv.isVisible('#screen-darts'));
  await staff.click('#hcPresets button:nth-child(1)'); await staff.click('#hcPause'); await staff.waitForTimeout(500);
  ok('pause with "Dinner is served"', g.screen.paused && g.screen.message === 'Dinner is served');
  await tv.waitForTimeout(1500); ok('the TV shows the pause card with the message', await tv.isVisible('#rpPause') && (await tv.textContent('#rpPauseMsg')) === 'Dinner is served');
  await tv.screenshot({ path: OUT + '/e2e-host-tv-paused.png' });
  await staff.$eval('#hcVol', el => { el.value = 30; el.dispatchEvent(new Event('change')); }); await staff.waitForTimeout(500);
  await tv.waitForTimeout(1500); ok('volume 30 reaches the TV', g.screen.volume === 30 && Math.abs(await tv.evaluate(() => rpVol) - 0.3) < 0.001);
  await staff.click('#hcMute'); await staff.waitForTimeout(400); await tv.waitForTimeout(1500);
  ok('mute silences the TV', g.screen.muted && await tv.evaluate(() => rpVol) === 0);
  await staff.click('#hcGames [data-reset="quiz"]'); await staff.waitForTimeout(400);
  ok('reset Quiz Night (after a confirm)', resets.join() === 'quiz');
  await staff.click('#hcLeadersClear'); await staff.waitForTimeout(400);
  ok('clear the leaderboard', g.leaders.length === 0);
  await staff.click('#hcPause'); await staff.waitForTimeout(500); await tv.waitForTimeout(1500);
  ok('resume: the pause card goes', !g.screen.paused && !(await tv.isVisible('#rpPause')));
  const lg = ((await staff.textContent('#hcLog')) || '').split(/\s+/).join(' ');
  ok('the log lists the actions — ' + lg.slice(0, 120), /Resumed/.test(lg) && /Reset: Quiz Night/.test(lg) && /Showed: Darts/.test(lg));
  await staff.screenshot({ path: OUT + '/e2e-host-staff.png', fullPage: true });
  const r = await guest.evaluate(async () => { const res = await fetch('https://data.ryst.in/game/admin/mode', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Token': 'tok-guest' }, body: '{"mode":"claw"}' }); return res.status; });
  ok('a guest calling the console route directly is refused (' + r + ')', r === 403 && g.mode === 'darts');
  await staff.click('#hostBack'); await staff.waitForTimeout(400);
  ok('back to the hub; the screen keeps Darts', await staff.isVisible('#screen-dashboard') || await staff.isVisible('#screen-darts'));
  console.log(errs.length ? 'page errors: ' + errs.join(' | ') : 'No page errors.');
  await br.close(); srv.close();
});
