// Two phones + the pool screen: Quiz categories and the live board against a stand-in /game running the real quiz.js.
const RYST_ROOT = require('path').resolve(__dirname, '../../../../..'), RYST_PROXY = process.env.RYST_PROXY || require('path').resolve(RYST_ROOT, '../ryst-109a-proxy'); // the site repo and the proxy beside it
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const Q = require(RYST_PROXY + '/quiz.js'), ROOT = RYST_ROOT, OUT = process.argv[2] || require('os').tmpdir();
let qz = Q.fresh(), priv = Q.freshPrivate(), clock = Date.now();
const people = { asha: { id: 'pa', name: 'Asha', avatar: 'octopus' }, bala: { id: 'pb', name: 'Bala', avatar: 'sun' } };
const st = () => ({ mode: 'quiz', quiz: qz, board: Array(9).fill(null), turn: 'X', ttt: { X: null, O: null }, tttMatch: { bestOf: 3, need: 2, round: 1, wins: { X: 0, O: 0 }, results: [] }, players: [], playerCount: 2, scoreboard: { game: '', round: 1, history: [] },
  memory: { cards: [], matched: [], flipped: [], scores: [0, 0], moves: [0, 0], turn: 1 }, backdrop: { template: 'custom', name: '', text: '', preset: 'party' }, viz: {}, leaders: [], ludo: { phase: 'lobby', seats: [null, null, null, null], tokens: [[-1, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1]], turn: -1 } });
function handle(url, who, b) {
  const p = new URL(url).pathname; Q.tick(qz, priv, clock);
  if (p === '/game/quiz/join') Q.join(qz, priv, who, Number(b.team), people[who]);
  if (p === '/game/quiz/setup') Q.setup(qz, priv, who, b);
  if (p === '/game/quiz/start' && priv.members.has(who)) Q.start(qz, priv, clock);
  if (p === '/game/quiz/answer') { Q.answer(qz, priv, who, Number(b.choice), clock); Q.tick(qz, priv, clock); }
  if (p === '/game/quiz/new' && qz.phase === 'over') { const keep = priv.members; qz = Q.fresh({ category: qz.category, length: qz.length }); priv = Q.freshPrivate(); keep.forEach((m, w) => Q.join(qz, priv, w, m.team, m)); }
  const extra = { serverNow: clock, openedAt: Date.now(), updatedAt: Date.now() };
  if (p.startsWith('/game/quiz/')) extra.quizMe = Q.mine(qz, priv, who);
  if (p === '/game/profile') extra.profile = people[who] || null;
  return Object.assign(st(), extra);
}
const TY = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, q.url.split('?')[0].slice(1)); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TY[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0, async () => {
  const br = await chromium.launch(), errs = [], port = srv.address().port, ok = (m, c) => console.log((c ? '✓ ' : '✗ ') + m);
  const txt = async (p, sel) => ((await p.textContent(sel)) || '').split(/\s+/).join(' ').trim();
  const open = async (who, page, vp) => { const p = await br.newPage({ viewport: vp }); p.on('pageerror', e => errs.push(who + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.route('https://data.ryst.in/**', async route => { let body = {}; try { body = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(handle(route.request().url(), who, body)), headers: { 'access-control-allow-origin': '*' } }); });
    await p.route(/open-meteo|googleapis|gstatic|accounts\.google/, r => r.abort());
    await p.addInitScript(t => { try { localStorage.setItem('ryst_play_token', t); } catch (e) {} }, 'tok-' + who);
    await p.goto(`http://127.0.0.1:${port}/${page}`); await p.waitForTimeout(1800); return p; };
  const tv = await open('tv', 'display.html', { width: 1600, height: 900 }), asha = await open('asha', 'play.html', { width: 390, height: 844 }), bala = await open('bala', 'play.html', { width: 390, height: 844 });
  for (const p of [asha, bala]) { await p.evaluate(() => { const b = document.querySelector('[data-activity="quiz"],[data-mode="quiz"]'); if (b) b.click(); }); await p.waitForTimeout(800); }
  ok('the category picker shows but is locked until you join', await asha.isVisible('#quizSetup') && await asha.isDisabled('#quizCats [data-cat="local"]'));
  await asha.click('#quizTeams [data-team="0"]'); await asha.waitForTimeout(500); await bala.click('#quizTeams [data-team="3"]'); await bala.waitForTimeout(500);
  await asha.click('#quizCats [data-cat="local"]'); await asha.waitForTimeout(400); await bala.waitForTimeout(1300); await bala.click('#quizLen [data-len="5"]'); await bala.waitForTimeout(400);
  ok('setup from both phones: Tamil Nadu & the Coast, 5 questions', qz.category === 'local' && qz.length === 5);
  await tv.waitForTimeout(1500); const lob = await txt(tv, '#qzSetup');
  ok('TV lobby shows it — ' + lob, /Tamil Nadu & the Coast/.test(lob) && /5 questions/.test(lob));
  await asha.click('#quizStart'); await asha.waitForTimeout(500);
  ok('5 questions, all from the coast', qz.total === 5 && qz.question.category === 'local');
  await bala.waitForTimeout(1300); await asha.waitForTimeout(400);
  const key = priv.key;
  await bala.click(`#quizOpts [data-choice="${key}"]`); await bala.waitForTimeout(300); clock += 6000;
  await asha.click(`#quizOpts [data-choice="${(key + 1) % 4}"]`); await asha.waitForTimeout(500);
  ok('reveal: Bala tops the board', qz.phase === 'reveal' && qz.board[0].name === 'Bala' && qz.board[0].last > 100);
  await tv.waitForTimeout(1600); const tb = await txt(tv, '#qzBoard');
  ok('TV shows the category and the top players — ' + tb, /Tamil Nadu/i.test(await txt(tv, '#qzNum')) && /Top players.*Bala/.test(tb));
  await bala.waitForTimeout(1200); const bm = await txt(bala, '#quizMeCard'); ok('Bala\'s phone: ' + bm, /^1st/.test(bm));
  await asha.waitForTimeout(300); const am = await txt(asha, '#quizMeCard'); ok('Asha\'s phone: ' + am, /^2nd/.test(am));
  await tv.screenshot({ path: OUT + '/e2e-quiz-tv-reveal.png' });
  for (let k = 0; k < 4; k++) { clock += 8000; Q.tick(qz, priv, clock); const kk = priv.key; Q.answer(qz, priv, 'bala', kk, clock); Q.answer(qz, priv, 'asha', kk, clock + 3000); clock += 25000; Q.tick(qz, priv, clock); }
  clock += 8000; Q.tick(qz, priv, clock);
  ok('game over, Player of the night: ' + (qz.mvp && qz.mvp.name), qz.phase === 'over' && qz.mvp && qz.mvp.name === 'Bala');
  await tv.waitForTimeout(2200); const mv = await txt(tv, '#qzMvp');
  ok('TV final: player of the night and standings — ' + mv, /Player of the night ?Bala/.test(mv) && (await tv.$$('#qzBoard .qz-p')).length === 2);
  const h1 = await tv.$eval('#qzBoard', e => e.innerHTML); await tv.waitForTimeout(2000); const h2 = await tv.$eval('#qzBoard', e => e.innerHTML);
  ok('the final board is not re-drawn on every poll', h1 === h2 && await tv.$eval('#qzBoard .qz-p', e => getComputedStyle(e).opacity) === '1');
  await tv.screenshot({ path: OUT + '/e2e-quiz-tv-over.png' });
  await asha.waitForTimeout(1500); await asha.click('#quizNew'); await asha.waitForTimeout(500);
  ok('rematch keeps the category and length', qz.phase === 'lobby' && qz.category === 'local' && qz.length === 5 && priv.members.size === 2);
  ok('sign-ins never in the public state', !JSON.stringify(st()).includes('tok-') && !JSON.stringify(qz.board).includes('"asha"'));
  console.log(errs.length ? 'page errors: ' + errs.join(' | ') : 'No page errors.');
  await br.close(); srv.close();
});
