// Headless validator for a portal zone module. Usage: node harness.js zones/<id>.js
const fs = require('fs');
const file = process.argv[2];
if (!file) { console.log('usage: node harness.js <zone.js>'); process.exit(2); }
const src = fs.readFileSync(file, 'utf8');

const errors = new Map(), warnings = new Map();
const err = (k, m) => { if (!errors.has(k)) errors.set(k, m); };
const warn = (k, m) => { if (!warnings.has(k)) warnings.set(k, m); };
const fin = v => typeof v === 'number' && Number.isFinite(v);

/* ---------- Mock canvas ---------- */
let calls = 0, grads = 0;
const badStr = s => typeof s === 'string' && /NaN|undefined|Infinity/.test(s);
const gradient = where => ({ addColorStop(o, c) {
  calls++;
  if (!fin(o) || o < 0 || o > 1) err('stop' + where, `addColorStop offset out of [0,1]: ${o} (${where})`);
  if (typeof c !== 'string' || badStr(c)) err('stopc' + where, `addColorStop bad colour: ${c} (${where})`);
} });
let phase = '';
const ctxState = { fillStyle: '#000', strokeStyle: '#000', globalAlpha: 1, lineWidth: 1, globalCompositeOperation: 'source-over', font: '10px sans-serif', textAlign: 'left', lineCap: 'butt', lineJoin: 'miter', filter: 'none', shadowBlur: 0, shadowColor: 'transparent', imageSmoothingEnabled: true };
let saveDepth = 0;
const checkNums = (name, args, n) => { for (let i = 0; i < Math.min(n, args.length); i++) if (!fin(args[i])) { err('nan' + phase + name, `${phase}: ctx.${name} got non-finite arg #${i}: ${args[i]}`); return false; } return true; };
const methods = {
  save() { saveDepth++; }, restore() { saveDepth--; },
  arc(x, y, r) { checkNums('arc', arguments, 5); if (r < 0) err('arcneg' + phase, `${phase}: ctx.arc negative radius ${r} (throws IndexSizeError in browsers)`); },
  ellipse(x, y, rx, ry) { checkNums('ellipse', arguments, 7); if (rx < 0 || ry < 0) err('ellneg' + phase, `${phase}: ctx.ellipse negative radius ${rx},${ry} (throws in browsers)`); },
  roundRect(x, y, w, h, r) { checkNums('roundRect', arguments, 4); if (typeof r === 'number' && r < 0) err('rrneg' + phase, `${phase}: roundRect negative radius`); },
  arcTo() { checkNums('arcTo', arguments, 5); if (arguments[4] < 0) err('arctoneg' + phase, `${phase}: arcTo negative radius`); },
  createRadialGradient(x0, y0, r0, x1, y1, r1) { grads++; checkNums('createRadialGradient', arguments, 6); if (r0 < 0 || r1 < 0) err('rgneg' + phase, `${phase}: createRadialGradient negative radius`); return gradient(phase + ':radial'); },
  createLinearGradient() { grads++; checkNums('createLinearGradient', arguments, 4); return gradient(phase + ':linear'); },
  createConicGradient() { return gradient(phase + ':conic'); },
  createPattern() { return {}; },
  measureText(t) { return { width: String(t).length * 7 }; },
  getImageData() { err('img', 'getImageData is not allowed (slow)'); return { data: [] }; },
  putImageData() { err('img2', 'putImageData is not allowed'); },
  drawImage() {},
};
for (const n of ['moveTo', 'lineTo', 'fillRect', 'strokeRect', 'clearRect', 'rect', 'translate', 'scale', 'rotate', 'quadraticCurveTo', 'bezierCurveTo', 'setTransform', 'transform'])
  methods[n] = function () { checkNums(n, arguments, n === 'quadraticCurveTo' ? 4 : n === 'bezierCurveTo' ? 6 : n === 'setTransform' || n === 'transform' ? 6 : n === 'rotate' ? 1 : 2); };
for (const n of ['beginPath', 'closePath', 'fill', 'stroke', 'clip', 'fillText', 'strokeText', 'setLineDash', 'resetTransform'])
  methods[n] = function () {};
const ctx = new Proxy(ctxState, {
  get(o, k) {
    if (k in methods) return (...a) => { calls++; return methods[k](...a); };
    if (k in o) return o[k];
    if (typeof k === 'string') { err('unk' + k, `ctx.${k} is not a supported canvas API`); return () => {}; }
  },
  set(o, k, v) {
    if ((k === 'fillStyle' || k === 'strokeStyle' || k === 'shadowColor') && (typeof v === 'string' ? badStr(v) : !(v && typeof v === 'object')))
      err('style' + phase + k, `${phase}: ${k} set to bad value: ${v}`);
    if ((k === 'globalAlpha' || k === 'lineWidth') && !fin(v)) err('num' + phase + k, `${phase}: ${k} set to non-finite ${v}`);
    if (k === 'globalAlpha' && fin(v) && (v < 0 || v > 1)) warn('alpha' + phase, `${phase}: globalAlpha ${v} outside 0..1 (browsers ignore it)`);
    o[k] = v; return true;
  },
});
class Path2D {
  constructor() { for (const n of ['moveTo', 'lineTo', 'quadraticCurveTo', 'bezierCurveTo', 'rect', 'closePath']) this[n] = (...a) => { checkNums('Path2D.' + n, a, 2); };
    this.arc = (x, y, r) => { checkNums('Path2D.arc', [x, y, r], 3); if (r < 0) err('parcneg', `Path2D.arc negative radius ${r}`); };
    this.ellipse = (x, y, rx, ry) => { checkNums('Path2D.ellipse', [x, y, rx, ry], 4); if (rx < 0 || ry < 0) err('pellneg', `Path2D.ellipse negative radius`); };
    this.roundRect = () => {}; this.addPath = () => {}; this.arcTo = () => {}; }
}

/* ---------- Load ---------- */
const ZONES = [];
try { new Function('ZONES', 'Path2D', src)(ZONES, Path2D); }
catch (e) { console.log('LOAD ERROR:', e.stack); process.exit(1); }
if (ZONES.length !== 1) { console.log(`expected exactly 1 ZONES.push, got ${ZONES.length}`); process.exit(1); }
const Zd = ZONES[0];

/* ---------- Schema ---------- */
for (const f of ['id', 'name', 'nod', 'portal', 'bg']) if (typeof Zd[f] !== 'string' || !Zd[f]) err('schema' + f, `missing string field ${f}`);
if (Zd.portal && !/^\d+,\s*\d+,\s*\d+$/.test(Zd.portal)) err('portal', `portal must be 'r,g,b', got ${Zd.portal}`);
if (!fin(Zd.dark) || Zd.dark < 0 || Zd.dark > .95) err('dark', 'dark must be a number 0..0.95');
if (typeof Zd.ground !== 'function') err('ground', 'ground(Z,x0,y0,x1,y1) required');
if (!Zd.foes || Object.keys(Zd.foes).length < 3) err('foes', 'need at least 3 regular foes');
if (!Zd.mix) err('mix', 'mix required');
for (const k in Zd.mix || {}) if (!Zd.foes[k]) err('mixk' + k, `mix references unknown foe ${k}`);
const checkDef = (k, d) => {
  for (const f of ['hp', 'sp', 'dmg', 'xp', 'r']) if (!fin(d[f])) err('def' + k + f, `foe ${k}: ${f} must be a number`);
  if (typeof d.draw !== 'function') err('draw' + k, `foe ${k}: draw required`);
  if (d.r > 60) warn('big' + k, `foe ${k}: r ${d.r} is very large`);
};
for (const k in Zd.foes || {}) checkDef(k, Zd.foes[k]);
if (!Zd.boss) err('boss', 'boss required'); else { checkDef('boss', Zd.boss); if (typeof Zd.boss.name !== 'string') err('bossname', 'boss.name required'); if (Zd.boss.hp < 1500 || Zd.boss.hp > 6000) warn('bosshp', `boss hp ${Zd.boss.hp} outside 1500..6000`); }
if (!Zd.music || !fin(Zd.music.bpm) || typeof Zd.music.step !== 'function') err('music', 'music {bpm, div, step} required');
if (errors.size) report();

/* ---------- Simulation ---------- */
const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const hash = (x, y) => { let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
const P = { x: 0, y: 0, r: 13, face: { x: 1, y: 0 } };
let foes = [], bullets = [], hazards = 0, maxBullets = 0, spawnedThisCall = 0, maxSpawnBurst = 0;
const call = (where, fn) => { phase = where; try { fn(); } catch (e) { err('throw' + where + e.message, `${where} threw: ${e.stack.split('\n').slice(0, 3).join(' | ')}`); } };
const Z = {
  ctx, now: 0, t: 0, dt: 1 / 60, W: 1280, H: 800, P, TAU, rnd, hash,
  dist: e => Math.hypot(P.x - e.x, P.y - e.y),
  angTo: e => Math.atan2(P.y - e.y, P.x - e.x),
  chase(e, sp = e.sp) { const a = Math.atan2(P.y - e.y, P.x - e.x); Z.move(e, Math.cos(a) * sp, Math.sin(a) * sp); e.ang = a; },
  move(e, vx, vy) { if (!fin(vx) || !fin(vy)) err('movenan' + e.kind, `Z.move got non-finite velocity for ${e.kind}`); e.x += (vx + e.kx) * Z.dt; e.y += (vy + e.ky) * Z.dt; },
  shoot(x, y, a, sp, o = {}) { if (![x, y, a, sp].every(fin)) err('shootnan', `Z.shoot non-finite args ${[x, y, a, sp]}`); bullets.push({ x, y, life: o.life || 5 }); },
  ring(x, y, n, sp, o = {}, off = 0) { if (n > 60) warn('ringn', `Z.ring n=${n} is a lot`); for (let i = 0; i < n; i++) Z.shoot(x, y, off + i / n * TAU, sp, o); },
  spawn(kind, x, y) { if (!Zd.foes[kind]) { err('spawnk' + kind, `Z.spawn unknown kind ${kind}`); return null; } spawnedThisCall++; return spawn(kind, x, y); },
  hazard(x, y, o = {}) { if (![x, y].every(fin)) err('haznan', 'Z.hazard non-finite'); hazards++; },
  burst() {}, shake(n) { if (!fin(n)) err('shake', 'shake non-finite'); }, banner(t) { if (typeof t !== 'string') err('banner', 'banner text must be a string'); },
  sfx(n) { if (!['shoot', 'charge', 'warn', 'star', 'hit', 'kill', 'boss', 'nova', 'chain'].includes(n)) err('sfx' + n, `unknown sfx ${n}`); },
  glow(rgb, r, x, y, a) { calls++; if (!/^\d+,\s*\d+,\s*\d+$/.test(rgb)) err('glowrgb', `Z.glow rgb must be 'r,g,b', got ${rgb}`); if (![r, x, y].every(fin) || r <= 0) err('glownum' + phase, `${phase}: Z.glow bad numbers r=${r}`); },
  foes: () => foes.filter(e => !e.dead),
};
function spawn(kind, x, y) {
  const d = kind === 'boss' ? Zd.boss : Zd.foes[kind];
  const e = { kind, def: d, x, y, r: d.r, hp: d.hp * 1.5, max: d.hp * 1.5, sp: d.sp, dmg: d.dmg, xp: d.xp, ang: 0, ph: 0, seed: Math.random() * 6,
    flash: 0, kx: 0, ky: 0, t1: 2, t2: 5, t3: 9, mode: 'walk', mt: 2.5, boss: kind === 'boss', cds: {}, dead: false };
  foes.push(e);
  if (d.init) call(`${kind}.init`, () => d.init(e, Z));
  return e;
}
const kill = e => { if (e.dead) return; e.dead = true; if (e.def.death) { spawnedThisCall = 0; call(`${e.kind}.death`, () => e.def.death(e, Z)); maxSpawnBurst = Math.max(maxSpawnBurst, spawnedThisCall); } };
const mixKeys = Object.entries(Zd.mix);
const pick = () => { let r = Math.random() * mixKeys.reduce((a, [, w]) => a + w, 0); for (const [k, w] of mixKeys) if ((r -= w) <= 0) return k; return mixKeys[0][0]; };

let groundCalls = [], underCalls = [], foeDraw = [], bossDraw = [], ambCalls = [], frame = 0, boss = null, bossDied = -1, evIdx = 0;
const events = (Zd.events || []).slice().sort((a, b) => a.t - b.t);
const t0 = Date.now();
for (let step = 0; step < 150 * 60; step++) {
  Z.t = step / 60; Z.now = 1000 + Z.t; frame++;
  const a = Z.t * .8; P.face = { x: -Math.sin(a), y: Math.cos(a) }; P.x = Math.cos(a) * 220; P.y = Math.sin(a) * 220;
  while (evIdx < events.length && events[evIdx].t <= Z.t) { spawnedThisCall = 0; const ev = events[evIdx++]; call(`events@${ev.t}`, () => ev.run(Z)); maxSpawnBurst = Math.max(maxSpawnBurst, spawnedThisCall); }
  const target = Math.round(60 * (Zd.target || 1));
  if (foes.length < target && step % 3 === 0) { const ang = Math.random() * TAU; spawn(pick(), P.x + Math.cos(ang) * 760, P.y + Math.sin(ang) * 760); }
  if (!boss && Z.t >= 45) { boss = spawn('boss', P.x + 500, P.y); }
  for (const e of foes) {
    if (e.dead) continue;
    e.ph += Z.dt; e.flash -= Z.dt;
    spawnedThisCall = 0;
    call(`${e.kind}.update`, () => e.def.update ? e.def.update(e, Z) : Z.chase(e));
    maxSpawnBurst = Math.max(maxSpawnBurst, spawnedThisCall);
    if (![e.x, e.y].every(fin)) { err('pos' + e.kind, `${e.kind} position became non-finite after update`); e.dead = true; }
    if (!fin(e.ang)) err('ang' + e.kind, `${e.kind} ang non-finite`);
    e.kx *= .9; e.ky *= .9;
    if (Math.hypot(e.x - P.x, e.y - P.y) > 4000) warn('far' + e.kind, `${e.kind} wandered > 4000 px away (should chase or stay near)`);
  }
  // Simulated weapons: chew through regular foes, knock some back, and wear the boss down over ~60 s.
  if (step % 20 === 0) {
    const live = foes.filter(e => !e.dead && !e.boss).sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y));
    for (const e of live.slice(0, 4)) kill(e);
    for (const e of live.slice(4, 10)) { e.flash = .1; e.kx = rnd(-200, 200); e.ky = rnd(-200, 200); }
  }
  if (boss && !boss.dead) { boss.hp -= boss.max / 60 / 60; if (step % 7 === 0) boss.flash = .1; if (boss.hp <= 0) { kill(boss); bossDied = Z.t; } }
  bullets = bullets.filter(b => (b.life -= Z.dt) > 0);
  maxBullets = Math.max(maxBullets, bullets.length);
  foes = foes.filter(e => !e.dead);
  if (frame % 120 === 0) {
    // v2: the floor is rendered once per 512px chunk (rect padded by 160px) and cached.
    calls = 0; const cx = Math.floor(P.x / 512) * 512, cy = Math.floor(P.y / 512) * 512;
    call('ground', () => Zd.ground(Z, cx - 160, cy - 160, cx + 672, cy + 672));
    groundCalls.push(calls);
  }
  if (frame % 4 === 0) {
    if (Zd.under) { calls = 0; call('under', () => Zd.under(Z)); underCalls.push(calls); }
    for (const e of foes) { calls = 0; grads = 0; call(`${e.kind}.draw`, () => e.def.draw(e, Z, e.flash > 0 && Math.random() < .5)); (e.boss ? bossDraw : foeDraw).push(calls); if (grads) warn('grad' + e.kind, `${e.kind}.draw creates gradients every frame (cache or avoid them)`); }
    if (Zd.ambient) { calls = 0; grads = 0; call('ambient', () => Zd.ambient(Z)); ambCalls.push(calls); if (grads > 4) warn('gradamb', 'ambient creates many gradients per frame'); }
    if (saveDepth !== 0) { err('save', `ctx.save/restore unbalanced (depth ${saveDepth}) after drawing`); saveDepth = 0; }
  }
}
const simMs = Date.now() - t0;

/* ---------- Music ---------- */
let voices = 0, maxVoices = 0;
const ck = (name, t, m, dur, vol) => {
  voices++;
  if (!fin(t) || t < 0) err('at' + name, `A.${name}: bad time ${t}`);
  if (m !== undefined && (!fin(m) || m < 12 || m > 120)) err('am' + name, `A.${name}: bad midi ${m}`);
  if (dur !== undefined && (!fin(dur) || dur <= 0 || dur > 30)) err('ad' + name, `A.${name}: bad duration ${dur}`);
  if (vol !== undefined && (!fin(vol) || vol < 0)) err('av' + name, `A.${name}: bad volume ${vol}`);
  if (vol > .9) warn('aloud' + name, `A.${name}: volume ${vol} is very loud`);
};
const A = {
  mtof: m => 440 * 2 ** ((m - 69) / 12), rnd, boss: false, inten: .5,
  tone(t, m, dur, vol, o = {}) { ck('tone', t, m, dur, vol); if (vol > .12) warn('tonevol', `A.tone vol ${vol} > .12 (lead guide .03-.07)`); if (o.type && !['square', 'sawtooth', 'triangle', 'sine'].includes(o.type)) err('ttype', `A.tone bad type ${o.type}`); if (o.glide !== undefined && !fin(o.glide)) err('glide', 'A.tone glide must be a midi number'); if (o.cutoff !== undefined && (!fin(o.cutoff) || o.cutoff <= 0)) err('cut', 'A.tone cutoff must be > 0 Hz'); },
  pluck(m, t, vel) { ck('pluck', t, m, undefined, vel); },
  pad(ms, t, dur, vol, o = {}) { if (!Array.isArray(ms)) err('padarr', 'A.pad midis must be an array'); else { ms.forEach(m => ck('pad', t, m, dur, vol)); voices += ms.length * 2; } if (vol > .05) warn('padvol', `A.pad vol ${vol} > .05 (guide .01-.025; 3 voices per note)`); },
  noise(t, dur, vol, o = {}) { ck('noise', t, undefined, dur, vol); if (o.f !== undefined && (!fin(o.f) || o.f <= 0)) err('nf', 'A.noise f must be > 0'); },
  kick(t, vol) { ck('kick', t, undefined, undefined, vol); }, snare(t, vol) { ck('snare', t, undefined, undefined, vol); },
  hat(t, vol) { ck('hat', t, undefined, undefined, vol); }, tom(t, f, vol) { ck('tom', t, undefined, undefined, vol); if (!fin(f) || f <= 0) err('tomf', 'A.tom freq must be Hz > 0'); },
  bell(m, t, vol) { ck('bell', t, m, undefined, vol); },
};
const stepLen = 60 / Zd.music.bpm / (Zd.music.div || 2);
let notesTotal = 0;
for (let s = 0; s < 600; s++) {
  A.boss = s >= 200 && s < 400; voices = 0;
  phase = 'music';
  try { Zd.music.step(s, 5 + s * stepLen, A); } catch (e) { err('mus' + e.message, `music.step threw at s=${s}: ${e.stack.split('\n').slice(0, 2).join(' | ')}`); }
  maxVoices = Math.max(maxVoices, voices); notesTotal += voices;
}
if (notesTotal < 600) warn('sparse', `music is very sparse (${notesTotal} voices over 600 steps)`);
if (maxVoices > 24) warn('dense', `music step peaked at ${maxVoices} voices (keep ~10)`);

/* ---------- Report ---------- */
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const avg = mean(groundCalls), uAvg = mean(underCalls), fAvg = mean(foeDraw), bAvg = mean(bossDraw), aAvg = mean(ambCalls);
if (avg > 5000) warn('groundperf', `ground averages ${Math.round(avg)} canvas calls per cached chunk (budget 5000)`);
if (avg > 12000) err('groundperf2', `ground averages ${Math.round(avg)} calls per chunk: far too slow`);
if (uAvg > 300) warn('underperf', `under averages ${Math.round(uAvg)} calls per frame (budget 300)`);
if (fAvg > 40) warn('foeperf', `regular foe draw averages ${Math.round(fAvg)} canvas calls (budget 40)`);
if (bAvg > 160) warn('bossperf', `boss draw averages ${Math.round(bAvg)} canvas calls (budget 160)`);
if (aAvg > 250) warn('ambperf', `ambient averages ${Math.round(aAvg)} calls per frame (budget 250)`);
if (maxBullets > 220) warn('bullets', `peak ${maxBullets} live bullets (keep < 150)`);
if (maxSpawnBurst > 14) warn('spawnburst', `one call spawned ${maxSpawnBurst} foes (keep ≤ 10)`);
if (bossDied < 0) warn('boss', 'miniboss never died in the sim (sim deals max/60 hp per second)');
console.log(`zone ${Zd.id} "${Zd.name}" (${Zd.nod}) foes: ${Object.keys(Zd.foes).join(', ')} | boss: ${Zd.boss.name}`);
console.log(`sim ${simMs} ms for 150 s | ground ${Math.round(avg)} calls/chunk | under ${Math.round(uAvg)} | foe draw ${fAvg.toFixed(1)} | boss draw ${Math.round(bAvg)} | ambient ${Math.round(aAvg)} | peak bullets ${maxBullets} | hazards ${hazards} | peak spawn burst ${maxSpawnBurst} | music ${notesTotal} voices, peak ${maxVoices}/step`);
report();
function report() {
  for (const m of warnings.values()) console.log('WARN  ' + m);
  for (const m of errors.values()) console.log('ERROR ' + m);
  if (errors.size) { console.log(`FAILED with ${errors.size} error(s)`); process.exit(1); }
  console.log(warnings.size ? `OK (with ${warnings.size} warning(s))` : 'OK');
  process.exit(0);
}
