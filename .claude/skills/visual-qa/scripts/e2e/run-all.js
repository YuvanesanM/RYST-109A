#!/usr/bin/env node
// RYST PLAY full regression, phones + pool screen: runs every game's end-to-end script one after another (each
// starts its own local server, browsers and a stand-in /game that uses the proxy's real rule modules), then
// prints a summary. Needs the proxy checked out beside this repo (or RYST_PROXY=/path/to/ryst-109a-proxy).
//   node .claude/skills/visual-qa/scripts/e2e/run-all.js [--out=/tmp/ryst-e2e] [--only=quiz,darts]
const { spawnSync } = require('child_process'), fs = require('fs'), path = require('path');
const arg = k => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : null; };
const OUT = path.resolve(arg('out') || path.join(require('os').tmpdir(), 'ryst-e2e')), ONLY = arg('only') ? arg('only').split(',') : null;
const RUNS = ['ttt-memory', 'scoreboard-backdrop', 'dj-visuals', 'quiz', 'darts', 'ludo', 'claw', 'host-console', 'music-movie-photo'];
fs.mkdirSync(OUT, { recursive: true });
let failed = 0; const rows = [];
for (const name of RUNS) {
  if (ONLY && ONLY.indexOf(name) < 0) continue;
  const dir = path.join(OUT, name); fs.mkdirSync(dir, { recursive: true });
  const t0 = Date.now(), r = spawnSync(process.execPath, [path.join(__dirname, name + '.js'), dir], { encoding: 'utf8', timeout: 300000 });
  const out = (r.stdout || '') + (r.stderr || ''), pass = (out.match(/^✓ /gm) || []).length, fail = (out.match(/^✗ /gm) || []).length;
  const pageErr = /page errors:/.test(out), ok = r.status === 0 && fail === 0 && pass > 0 && !pageErr;
  if (!ok) { failed++; console.log('\n── ' + name + ' ──\n' + out.trim()); }
  rows.push((ok ? '✓ ' : '✗ ') + name.padEnd(22) + String(pass).padStart(3) + ' passed' + (fail ? ', ' + fail + ' failed' : '') + (pageErr ? ', page errors' : '') + '  ' + Math.round((Date.now() - t0) / 1000) + ' s');
}
console.log('\n' + rows.join('\n') + '\n' + (failed ? '✗ ' + failed + ' run(s) failing' : '✓ every run passed') + ' — screenshots in ' + OUT);
process.exitCode = failed ? 1 : 0;
