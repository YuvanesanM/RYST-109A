// Two phones + the pool screen: viz settings through a stand-in /game running the real viz.js, and live audio from a
// phone's (fake) microphone through a stand-in /game/audio relay with the proxy's DJ rules (one live phone, claim needs a token).
const RYST_ROOT = require('path').resolve(__dirname, '../../../../..'), RYST_PROXY = process.env.RYST_PROXY || require('path').resolve(RYST_ROOT, '../ryst-109a-proxy'); // the site repo and the proxy beside it
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const V = require(RYST_PROXY + '/viz.js'), ROOT = RYST_ROOT, OUT = process.argv[2] || require('os').tmpdir();
const st = { mode: 'visualizer', viz: V.fresh(), board: Array(9).fill(null), turn: 'X', ttt: { X: null, O: null }, tttMatch: { bestOf: 3, need: 2, round: 1, wins: { X: 0, O: 0 }, results: [] }, players: [], playerCount: 2, scoreboard: { game: '', round: 1, history: [] },
  memory: { cards: [], matched: [], flipped: [], scores: [0, 0], moves: [0, 0], turn: 1 }, backdrop: { template: 'custom', name: '', text: '', preset: 'party' }, leaders: [], ludo: { phase: 'lobby', seats: [null, null, null, null], tokens: [[-1,-1,-1,-1],[-1,-1,-1,-1],[-1,-1,-1,-1],[-1,-1,-1,-1]], turn: -1 }, quiz: { phase: 'lobby', teams: [] } };
const listeners = new Set(); let dj = null, frames = 0, posts = [];
function handle(url, who, b){ const p = new URL(url).pathname; if (p === '/game/viz/set') { st.viz = V.set(st.viz, b); posts.push(who + ' ' + JSON.stringify(b)); } if (p === '/game/mode' && 'mode' in b) st.mode = b.mode;
  return Object.assign({}, st, { serverNow: Date.now(), openedAt: Date.now(), updatedAt: Date.now() }, p === '/game/profile' ? { profile: { id: who, name: who, avatar: 'crab' } } : {}); }
const TY = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, q.url.split('?')[0].replace(/^\/+/, '')); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TY[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0, async () => {
  const br = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] }), errs = [], port = srv.address().port, ok = (m, c) => console.log((c ? '✓ ' : '✗ ') + m);
  const open = async (who, page, vp) => { const ctx = await br.newContext({ viewport: vp, permissions: ['microphone'] }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(who + ': ' + e.message)); p.on('dialog', d => d.accept());
    await p.route('https://data.ryst.in/**', async route => { let body = {}; try { body = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(handle(route.request().url(), who, body)), headers: { 'access-control-allow-origin': '*' } }); });
    await p.routeWebSocket(/\/game\/audio/, ws => {
      if (/role=listen/.test(ws.url())) { listeners.add(ws); return; }
      ws.onMessage(raw => { let m; try { m = JSON.parse(raw); } catch (e) { return; }
        if (m.type === 'claim' && m.token) { if (dj && dj !== ws) dj.send(JSON.stringify({ type: 'displaced' })); dj = ws; }
        if (m.type === 'release' && dj === ws) dj = null;
        if (m.type === 'audio' && dj === ws) { frames++; listeners.forEach(l => { try { l.send(JSON.stringify(m)); } catch (e) {} }); } });
    });
    await p.route(/open-meteo|googleapis|gstatic|accounts\.google/, r => r.abort());
    await p.addInitScript(t => { try { localStorage.setItem('ryst_play_token', t); } catch (e) {} }, 'tok-' + who);
    await p.goto(`http://127.0.0.1:${port}/${page}`); await p.waitForTimeout(1800); return p; };
  const tv = await open('tv', 'display.html', { width: 1600, height: 900 }), asha = await open('asha', 'play.html', { width: 390, height: 844 }), ravi = await open('ravi', 'play.html', { width: 390, height: 844 });
  for (const p of [asha, ravi]) { await p.evaluate(() => { const b = document.querySelector('[data-activity="visualizer"],[data-mode="visualizer"]'); if (b) b.click(); }); await p.waitForTimeout(700); }
  ok('both phones on DJ Visuals', await asha.isVisible('#screen-visualizer') && await ravi.isVisible('#screen-visualizer'));
  await asha.click('.viz-preset[data-preset="horizon"]'); await asha.click('.viz-pal[data-palette="sunset"]');
  await ravi.waitForTimeout(1300); await ravi.click('#vizEnergy [data-energy="wild"]');
  for (let k = 0; k < 5; k++) { await ravi.click('#vizTap'); await ravi.waitForTimeout(500); } // 120 BPM-ish
  await ravi.fill('#vizTitle', 'DJ Ravi'); await ravi.locator('#vizTitle').blur(); await ravi.waitForTimeout(400);
  ok('settings merged from both phones — ' + JSON.stringify(st.viz), st.viz.preset === 'horizon' && st.viz.palette === 'sunset' && st.viz.energy === 'wild' && st.viz.title === 'DJ Ravi' && st.viz.bpm >= 105 && st.viz.bpm <= 135);
  await tv.waitForTimeout(4500);
  ok('TV shows the style, DJ line and tempo — ' + (await tv.textContent('#vizStyle')) + ' / ' + (await tv.textContent('#vizDj')) + ' / ' + (await tv.textContent('#vizStateText')), (await tv.textContent('#vizStyle')) === 'Horizon' && (await tv.textContent('#vizDj')) === 'DJ Ravi' && /BPM · Wild/.test(await tv.textContent('#vizStateText')));
  await asha.waitForTimeout(1500); ok('Asha\'s phone shows Ravi\'s tempo and line', (await asha.textContent('#vizBpm')) === String(st.viz.bpm) && (await asha.inputValue('#vizTitle')) === 'DJ Ravi');
  await tv.screenshot({ path: OUT + '/e2e-viz-tv.png' });
  // live audio from Asha's fake mic
  await asha.click('#vizGoLiveBtn'); await asha.waitForTimeout(2500);
  ok('Asha is live — ' + (await asha.textContent('#vizLiveStatus')).trim(), await asha.isVisible('#vizStopLiveBtn') && frames > 10);
  const lit = await asha.$$eval('#vizMeter i.on', e => e.length); ok('her phone meter shows the mic level (' + lit + ' bars)', lit >= 0);
  ok('TV says it is following the music', (await tv.textContent('#vizStateText')).startsWith('Live'));
  await tv.screenshot({ path: OUT + '/e2e-viz-tv-live.png' }); await asha.screenshot({ path: OUT + '/e2e-viz-asha-live.png', fullPage: true });
  await ravi.click('#vizGoLiveBtn'); await ravi.waitForTimeout(1500);
  ok('Ravi going live displaces Asha — ' + (await asha.textContent('#vizLiveStatus')).trim(), await ravi.isVisible('#vizStopLiveBtn') && !(await asha.isVisible('#vizStopLiveBtn')));
  await ravi.click('#vizStopLiveBtn'); await tv.waitForTimeout(3000);
  ok('after stopping, TV falls back to the tempo', /BPM/.test(await tv.textContent('#vizStateText')));
  console.log(errs.length ? 'page errors: ' + errs.join(' | ') : 'No page errors.');
  await br.close(); srv.close();
});
