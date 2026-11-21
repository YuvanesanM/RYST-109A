// Staff phone + guest phone + the pool screen: Poolside Music and Movie Night against a stand-in /game running the real
// music.js / movie.js / host.js; then the Photo Booth on the guest phone (fake camera), checking nothing is uploaded.
const RYST_ROOT = require('path').resolve(__dirname, '../../../../..'), RYST_PROXY = process.env.RYST_PROXY || require('path').resolve(RYST_ROOT, '../ryst-109a-proxy'); // the site repo and the proxy beside it
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const Mu = require(RYST_PROXY + '/music.js'), Mv = require(RYST_PROXY + '/movie.js'), H = require(RYST_PROXY + '/host.js'), ROOT = RYST_ROOT, OUT = process.argv[2] || require('os').tmpdir();
const g = { mode: 'music', music: Mu.fresh(), movie: Mv.fresh(), screen: H.freshScreen(), leaders: [], board: Array(9).fill(null), turn: 'X', ttt: { X: null, O: null }, tttMatch: { bestOf: 3, need: 2, round: 1, wins: { X: 0, O: 0 }, results: [] }, players: [], playerCount: 2, scoreboard: { game: '', round: 1, history: [] },
  memory: { cards: [], matched: [], flipped: [], scores: [0, 0], moves: [0, 0], turn: 1 }, backdrop: { template: 'custom', name: '', text: '', preset: 'party' }, viz: {}, ludo: { phase: 'lobby', seats: [null, null, null, null], tokens: [[-1, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1]], turn: -1 }, quiz: { phase: 'lobby', teams: [] }, darts: { phase: 'lobby', players: [], visit: [], history: [] } };
const mp = Mu.freshPrivate(), vp = Mv.freshPrivate(), people = { staff: { id: 'ps', name: 'Senthil', avatar: 'palm' }, guest: { id: 'pg', name: 'Asha', avatar: 'octopus' } };
let posts = [];
function handle(url, who, b) {
  const p = new URL(url).pathname, now = Date.now(), staff = who === 'staff'; posts.push(who + ' ' + p);
  Mv.tick(g.movie, vp, now);
  if (p.startsWith('/game/admin/')) { if (!staff) return { status: 403, body: { error: 'Staff only' } }; if (p === '/game/admin/mode') g.mode = b.mode || null;
    return { status: 200, body: Object.assign({}, g, { openedAt: now, serverNow: now, host: { log: [], seats: {}, phonesAgo: 1000 } }) }; }
  const extra = {};
  if (p === '/game/music/request') { const r = Mu.request(g.music, mp, who, people[who], b.title, b.artist, now); if (r.error) extra.musicError = r.error; }
  if (p === '/game/music/vote') Mu.vote(g.music, mp, who, b.id);
  if (p === '/game/music/remove') Mu.remove(g.music, mp, who, b.id, staff);
  if (p === '/game/music/play' && staff) Mu.play(g.music, mp, b.id || null, now);
  if (p === '/game/music/stop' && staff) Mu.stop(g.music);
  if (p === '/game/movie/vote') Mv.vote(g.movie, vp, who, b.id, now);
  if (p === '/game/movie/add' && staff) Mv.add(g.movie, b.title, b.note);
  if (p === '/game/movie/open' && staff) Mv.open(g.movie, vp, b.minutes, now);
  if (p === '/game/movie/close' && staff) Mv.close(g.movie, vp, now);
  if (p === '/game/movie/showtime' && staff) Mv.showtime(g.movie, b.minutes, now);
  if (p === '/game/mode' && 'mode' in b) g.mode = b.mode;
  if (p.startsWith('/game/music/') || p.startsWith('/game/movie/')) { extra.musicMine = Mu.mine(g.music, mp, who); extra.movieMine = Mv.mine(vp, who); }
  if (p === '/game/profile') extra.profile = people[who] || null;
  return { status: 200, body: Object.assign({}, g, { openedAt: now, updatedAt: now, serverNow: now }, extra) };
}
const TY = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, q.url.split('?')[0].slice(1)); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TY[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0, async () => {
  const br = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] }), errs = [], port = srv.address().port, ok = (m, c) => console.log((c ? '✓ ' : '✗ ') + m);
  const txt = async (p, sel) => ((await p.textContent(sel)) || '').split(/\s+/).join(' ').trim();
  const outside = [];
  const open = async (who, page, vp) => { const ctx = await br.newContext({ viewport: vp, acceptDownloads: true, permissions: ['camera'] }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(who + ': ' + e.message)); p.on('dialog', d => d.accept());
    p.on('request', rq => { const u = rq.url(); if (!/^http:\/\/127\.0\.0\.1|^https:\/\/data\.ryst\.in|^data:|^blob:|open-meteo|googleapis|gstatic|accounts\.google|qrserver/.test(u)) outside.push(who + ' ' + u); });
    await p.route('https://data.ryst.in/**', async route => { let body = {}; try { body = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
      const r = handle(route.request().url(), who, body); await route.fulfill({ status: r.status, contentType: 'application/json', body: JSON.stringify(r.body), headers: { 'access-control-allow-origin': '*' } }); });
    await p.route(/open-meteo|googleapis|gstatic|accounts\.google/, r => r.abort());
    await p.addInitScript(t => { try { localStorage.setItem('ryst_play_token', t); } catch (e) {} }, 'tok-' + who);
    await p.goto(`http://127.0.0.1:${port}/${page}`); await p.waitForTimeout(1800); return p; };
  const tv = await open('tv', 'display.html', { width: 1600, height: 900 }), staff = await open('staff', 'play.html', { width: 390, height: 844 }), guest = await open('guest', 'play.html', { width: 390, height: 844 });
  await guest.waitForTimeout(500);
  ok('both phones on Poolside Music', await guest.isVisible('#screen-music') && await staff.isVisible('#screen-music'));
  ok('staff controls only on the staff phone', await staff.isVisible('#muStaff') && !(await guest.isVisible('#muStaff')));
  await guest.fill('#muTitle', 'Kesariya'); await guest.fill('#muArtist', 'Arijit Singh'); await guest.click('#muAsk'); await guest.waitForTimeout(400);
  await staff.waitForTimeout(1300); await staff.fill('#muTitle', 'Vaathi Coming'); await staff.click('#muAsk'); await staff.waitForTimeout(400);
  await guest.waitForTimeout(1300); await guest.click('#muList [data-vote]:not([disabled])'); await guest.waitForTimeout(400);
  ok('two requests, the guest voted for the other one', g.music.queue.length === 2 && g.music.queue.find(r => r.title === 'Vaathi Coming').votes === 2 && g.music.queue.find(r => r.title === 'Kesariya').votes === 1);
  await tv.waitForTimeout(4500); const q = await txt(tv, '#muQueue');
  ok('TV up-next list — ' + q.slice(0, 80), /Kesariya/.test(q) && /Vaathi Coming/.test(q));
  await staff.waitForTimeout(1300); await staff.click('#muPlayNext'); await staff.waitForTimeout(400);
  ok('staff play the top song', g.music.now && g.music.queue.length === 1);
  await tv.waitForTimeout(4500); ok('TV now playing — ' + (await txt(tv, '#muNow')).slice(0, 60), (await txt(tv, '#muNow')).indexOf(g.music.now.title) >= 0 && await tv.$eval('#muDisc', e => e.classList.contains('spin')));
  await tv.screenshot({ path: OUT + '/e2e-music-tv.png' });
  // movie night
  await staff.evaluate(() => { const b = document.querySelector('[data-back]'); if (b) b.click(); }); await staff.waitForTimeout(500);
  await staff.evaluate(async () => { state = await postJson('/game/mode', { mode: 'movie' }); render(); }); await staff.waitForTimeout(500); await guest.waitForTimeout(1500);
  ok('both phones on Movie Night', await staff.isVisible('#screen-movie') && await guest.isVisible('#screen-movie'));
  for (const [t, n] of [['Finding Nemo', '2003 · family'], ['Moana', '2016 · family'], ['Jailer', '2023 · Tamil']]) { await staff.fill('#mvAddTitle', t); await staff.fill('#mvAddNote', n); await staff.click('#mvAdd'); await staff.waitForTimeout(350); }
  ok('staff shortlist three films', g.movie.options.length === 3);
  await staff.click('#mvOpen [data-min="5"]'); await staff.waitForTimeout(400);
  ok('the vote is open for five minutes', g.movie.phase === 'voting');
  await guest.waitForTimeout(1500); await guest.click('#mvListP [data-film="f2"]'); await guest.waitForTimeout(400); await staff.click('#mvListP [data-film="f2"]'); await staff.waitForTimeout(400);
  await guest.click('#mvListP [data-film="f1"]'); await guest.waitForTimeout(400); await guest.click('#mvListP [data-film="f2"]'); await guest.waitForTimeout(400);
  ok('votes counted once each (the guest changed her mind and back)', g.movie.options.find(o => o.id === 'f2').votes === 2 && g.movie.total === 2);
  await tv.waitForTimeout(1500); ok('TV shows the live vote — ' + (await txt(tv, '#mvSub')), /Vote closes in/.test(await txt(tv, '#mvSub')) && (await tv.$$('#mvOpts .mv-o')).length === 3);
  await staff.click('#mvClose'); await staff.waitForTimeout(400); await staff.click('#mvShow [data-min="15"]'); await staff.waitForTimeout(400);
  ok('closed: Moana wins, showtime set', g.movie.phase === 'chosen' && g.movie.winner === 'f2' && g.movie.startsAt > Date.now());
  await tv.waitForTimeout(2500); const w = await txt(tv, '#mvWin');
  ok('TV: tonight’s film and the countdown — ' + w, /Moana/.test(w) && /Starts in 1[45]:/.test(w));
  await tv.screenshot({ path: OUT + '/e2e-movie-tv.png' });
  // photo booth on the guest phone
  await guest.evaluate(() => { const b = document.querySelector('[data-back]'); if (b) b.click(); }); await guest.waitForTimeout(500);
  g.mode = null; await guest.waitForTimeout(1500);
  const before = posts.length;
  await guest.click('[data-local="photo"]'); await guest.waitForTimeout(1800);
  ok('the photo booth opens with the camera running', await guest.isVisible('#screen-photo') && await guest.$eval('#phVideo', v => v.videoWidth > 0));
  await guest.click('#phTimer'); await guest.click('#phFrames [data-f="shell"]'); await guest.click('#phSnap'); await guest.waitForTimeout(600);
  ok('a framed photo is taken', await guest.isVisible('#phShot') && await guest.isVisible('#phDone'));
  const dl = guest.waitForEvent('download', { timeout: 5000 }).catch(() => null); await guest.click('#phSave'); const d = await dl;
  ok('saved to the phone as ' + (d && d.suggestedFilename()), !!d && /^RYST-109A-\d{4}-\d\d-\d\d\.jpg$/.test(d.suggestedFilename()));
  const sent = posts.slice(before).filter(x => x.startsWith('guest') && !/ \/game$| \/game\/open$| \/game\/profile$/.test(x));
  ok('nothing was sent to the proxy from the booth (only the usual polls) — ' + JSON.stringify(sent), sent.length === 0);
  await guest.click('#phBack'); await guest.waitForTimeout(400);
  ok('leaving the booth turns the camera off', await guest.evaluate(() => !ph.stream));
  ok('no requests outside the villa’s own services', outside.length === 0, outside);
  console.log(errs.length ? 'page errors: ' + errs.join(' | ') : 'No page errors.');
  await br.close(); srv.close();
});
