// Copies the rift zone sources in zones/*.js into index.html, between the /* @@ZONES@@ */ and
// /* @@ZONES-END@@ */ markers. The game itself stays a single self-contained file; run this after editing a zone:
//   node tools/inline-zones.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const game = path.join(root, 'index.html'), dir = path.join(root, 'zones');
const ORDER = ['d2', 'wc2', 'moo2', 'z', 'isaac', 'zelda', 'gw2', 'lol', 'ds'];
let s = fs.readFileSync(game, 'utf8');
const START = '/* @@ZONES@@ */', END = '/* @@ZONES-END@@ */';
if (!s.includes(END)) s = s.replace(START, START + '\n  ' + END);
const a = s.indexOf(START), b = s.indexOf(END);
const parts = [], used = [];
// Zones listed in ORDER come first; any other zones/*.js file is appended after them.
const extra = fs.readdirSync(dir).filter(f => f.endsWith('.js')).map(f => f.slice(0, -3)).filter(id => !ORDER.includes(id)).sort();
for (const id of ORDER.concat(extra)) {
  const f = path.join(dir, id + '.js');
  if (!fs.existsSync(f)) continue;
  const src = fs.readFileSync(f, 'utf8').trim();
  try { new Function('ZONES', 'Path2D', src); } catch (e) { console.error('skip ' + id + ': ' + e.message); continue; }
  parts.push(`  // ===== Zone: ${id} =====\n` + src.split('\n').map(l => l ? '  ' + l : l).join('\n'));
  used.push(id);
}
s = s.slice(0, a + START.length) + '\n' + parts.join('\n\n') + '\n  ' + s.slice(b);
new Function(s.match(/<script>([\s\S]*)<\/script>/)[1]);
fs.writeFileSync(game, s);
console.log('inlined zones:', used.join(', ') || '(none)');
