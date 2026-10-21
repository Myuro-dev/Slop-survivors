// Zone cow: The Secret Pasture. An endless, eerie field under a blood-violet sky, grazed by murderous bipedal cattle
// with bardiches. A nod to Diablo II's legendary secret level.
ZONES.push((() => {
  const TAU = Math.PI * 2;
  const W = (white, c) => white ? '#fff' : c;
  const cl = (v, a, b) => v < a ? a : v > b ? b : v;
  const md = (x, m) => ((x % m) + m) % m;
  const ease = k => k * k * (3 - 2 * k);
  // closed polygons from flat [x, y, ...] lists, scaled by k
  const polyK = (k, ...ls) => { const p = new Path2D(); for (const a of ls) { p.moveTo(a[0] * k, a[1] * k); for (let i = 2; i < a.length; i += 2) p.lineTo(a[i] * k, a[i + 1] * k); p.closePath(); } return p; };
  const poly = (...ls) => polyK(1, ...ls);
  const line = (k, ...ls) => { const p = new Path2D(); for (const a of ls) { p.moveTo(a[0] * k, a[1] * k); for (let i = 2; i < a.length; i += 2) p.lineTo(a[i] * k, a[i + 1] * k); } return p; };
  const ell = (p, x, y, rx, ry, rot = 0) => { rx = Math.max(.1, rx); ry = Math.max(.1, ry); p.moveTo(x + Math.cos(rot) * rx, y + Math.sin(rot) * rx); p.ellipse(x, y, rx, ry, rot, 0, TAU); };

  // ---------- Foe art: Path2D built once in design units (facing +x, feet near the bottom) ----------
  // Legs (digitigrade, two of them) plus a tapered dark tail, pre-baked for 8 walk frames.
  const legFrames = k => {
    const out = [];
    for (let f = 0; f < 8; f++) {
      const p = f / 8 * TAU, L = new Path2D(), D = new Path2D();
      for (const [hx, ph] of [[-1.5, p], [1.3, p + Math.PI]]) {
        const sw = Math.sin(ph), lift = Math.max(0, Math.cos(ph));
        const kx = hx + 1.4 + sw * 1.6, ky = 7 - lift * 1.1, ax = hx - .8 + sw * 2.4, ay = 9.3 - lift * 1.6, fx = hx + .4 + sw * 2.8, fy = 10.8 - lift * 1.6;
        L.moveTo(hx * k, 3.2 * k); L.lineTo(kx * k, ky * k); L.lineTo(ax * k, ay * k); L.lineTo(fx * k, fy * k);
        D.rect((fx - 1.5) * k, (fy - .3) * k, 3.2 * k, 1.7 * k);
      }
      const ts = Math.sin(p) * 1.1;
      D.moveTo(-4.8 * k, 0); D.quadraticCurveTo(-7.2 * k, 2 * k, (-7.4 + ts) * k, 6 * k); D.lineTo((-6.6 + ts) * k, 6.2 * k);
      D.quadraticCurveTo(-6.4 * k, 2.4 * k, -4.6 * k, 1.4 * k); D.closePath();
      ell(D, (-7 + ts) * k, 6.9 * k, 1 * k, 1.6 * k);
      out.push({ L, D });
    }
    return out;
  };
  const BLD = [9.8, -15.5, 12.5, -17.2, 15.6, -15.4, 17, -11.6, 16.4, -7.6, 14.2, -5.2, 11, -5.8, 10.4, -7.2, 13.2, -8.2, 14.2, -11.2, 13, -14];
  let ART = null;
  const art = () => ART || (ART = {
    legs: legFrames(1), bLegs: legFrames(1.45), kLegs: legFrames(.8),
    // Herd cow (11-unit space): hunched barrel torso, long head with a pale muzzle, swept ear, two up-curving horns
    cBody: poly([-4.6, 3.4, -5.6, -1.6, -5.2, -6.6, -3, -9.4, 1, -10.4, 4.4, -8.6, 5.8, -4, 5, 1, 2.6, 4, -2, 4.2],
      [.8, -10.2, 1.2, -14.4, 3.6, -16.2, 6.6, -15.6, 9, -13.2, 10.6, -11, 10.2, -8.6, 7.4, -7.8, 4.2, -8.4],
      [1.6, -14, -2.2, -14.8, -3, -13.4, -1.4, -12.4, 1.4, -12.6],
      [2.6, -15.6, 1.4, -18.2, -.4, -20.4, 2.4, -19.6, 4.2, -16.4], [5.6, -16.2, 6.8, -18.8, 8.8, -20.6, 8.4, -18.4, 7.2, -15.6]),
    cHorns: poly([2.6, -15.8, 1.4, -18.2, -.4, -20.4, 2.4, -19.6, 4.2, -16.4], [5.6, -16.4, 6.8, -18.8, 8.8, -20.6, 8.4, -18.4, 7.2, -15.8]),
    cMuzzle: poly([7.6, -12.6, 10.6, -11, 10.2, -8.6, 7.4, -7.8, 6.6, -10]),
    cChest: poly([-2.6, -6, 2.6, -7, 4.4, -3.4, 3.6, .4, 0, 1.4, -2.8, -1]),
    cSpots: (() => { const p = new Path2D(); ell(p, -3, -5, 2, 2.6, .3); ell(p, 1.8, -2, 2.2, 1.5, -.2); ell(p, -3.4, 1.4, 1.4, 1.1); ell(p, 3.4, -14, 1.5, 1.1, .4); ell(p, 3.6, -6.6, 1.1, .9); return p; })(),
    cLoin: poly([-4.4, 1.6, 4.6, 1.4, 4, 3.6, 1.6, 8.2, -.6, 4.6, -3.2, 6.8, -4.8, 3.6]),
    // bandolier strap + dark nostrils (same colour, one fill)
    cStrap: (() => { const p = poly([-5.2, -6.2, -4, -7.6, 5.2, .2, 4.4, 1.6]); p.rect(9.2, -10.6, 1, 1); p.rect(8.2, -9.2, .9, .8); return p; })(),
    cEye: poly([4.6, -13.6, 6.8, -13, 4.8, -12.3]),
    // Bardiche in arm space (pivot = shoulder): arm to the fist, long shaft, crescent axe blade up front
    wOut: (() => { const p = line(1, [0, 0, 8.4, 3.2], [10.2, 10, 9.6, -15.6]); p.moveTo(BLD[0], BLD[1]); for (let i = 2; i < BLD.length; i += 2) p.lineTo(BLD[i], BLD[i + 1]); p.closePath(); return p; })(),
    wShaft: line(1, [10.2, 10, 9.6, -15.6]),
    wArm: line(1, [0, 0, 8.4, 3.2]),
    wBlade: poly(BLD),
    wEdge: line(1, [12.5, -17.2, 15.6, -15.4, 17, -11.6, 16.4, -7.6, 14.2, -5.2]),
    // Bull brute (16-unit space): heavy hunched torso with a shaggy hump, iron pauldron; head pivots at the neck
    bTorso: poly([-8, 4, -9, -3, -7.6, -10, -3.6, -14, 2.6, -14.6, 7.6, -11.6, 9.2, -5, 8, 2, 4, 5.6, -3.4, 5.8]),
    bHump: poly([-7.6, -10, -3.6, -14, 2.6, -14.6, 5, -12, 1, -10.4, -4, -9, -8.6, -5.6]),
    bChest: poly([-1, -9, 5, -10, 7.4, -5, 6, 1, 1, 2.4, -2.4, -3]),
    bPaul: poly([-2, -14.6, 4, -15.4, 7, -11.6, 2.6, -9.4, -2.4, -10.8]),
    bSpikes: poly([-.6, -14.8, .2, -18.2, 1.6, -15], [3, -15.2, 4.6, -18.4, 5, -14.4]),
    bLoin: poly([-7, 3, 7.6, 2.4, 6.8, 5.4, 2.4, 11, -.4, 6.2, -4.6, 9.6, -7.6, 6]),
    bHead: poly([-2, -1, -1, -6, 3, -7.6, 7.4, -6.4, 10.6, -3.4, 11.6, 0, 10.4, 2.8, 6.6, 3.2, 2.4, 2],
      [0, -5.4, -3.4, -8, -6.6, -13.4, -2.4, -11.6, 1.6, -7.4], [4.6, -6.8, 7.4, -10.4, 13.6, -13.2, 10.6, -9.4, 6.6, -5.6]),
    bHorns: poly([0, -5.6, -3.4, -8, -6.6, -13.4, -2.4, -11.6, 1.6, -7.6], [4.6, -7, 7.4, -10.4, 13.6, -13.2, 10.6, -9.4, 6.6, -5.8]),
    bMuzzle: poly([7.8, -2.4, 11.6, 0, 10.4, 2.8, 6.6, 3.2, 6.4, .2]),
    bEye: poly([3.6, -4.6, 6.6, -3.8, 3.9, -2.8]),
    // Golden calf (quadruped, 9-unit space)
    kBody: poly([-6, -1, -5.4, -5, -1, -6, 4, -5.6, 5.4, -3, 5, 1, -4.8, 1.6], [3.8, -5.4, 4.6, -9.4, 7.6, -10, 10, -7.4, 10.2, -5, 7.4, -3.6, 5, -3]),
  });

  // Coat variants: base, outline, chest, spots, muzzle
  const VAR = [
    { b: '#8e5632', o: '#2c140a', c: '#b07a4e', s: null, m: '#dca28e' },       // brown
    { b: '#e8e0cf', o: '#2e2622', c: '#f6f0e2', s: '#2a2420', m: '#eab4a2' },   // white, black spots
    { b: '#3c322e', o: '#120a08', c: '#564840', s: '#ece4d4', m: '#caa092' },   // black, white spots
    { b: '#b07c48', o: '#2e180a', c: '#cc9a64', s: '#6a3c1e', m: '#e2ac94' },   // tan, brown spots
  ];
  const GOLD = '#ffcf40';
  let HID = 1;

  // ---------- Herd cow (and its champion and stampede variants) ----------
  const cowInit = (e, Z) => {
    e.mode = 'walk'; e.mt = 0; e.cd = Z.rnd(1, 3); e.wa = .1; e.cAng = 0; e.run = 0;
    e.vr = cl(Math.floor(e.seed / 6 * 4), 0, 3); e.packed = false; e.lead = Math.random() < .3; e.hid = HID++;
  };
  const cowUpdate = (e, Z) => {
    const dt = Z.dt;
    if (e.remove) { Z.move(e, 0, 0); return; }
    if (e.mode === 'stamp') { // stampede runner: paws the ground, then gallops straight across the field
      e.ang = e.sa;
      if (e.mt > 0) { e.mt -= dt; Z.move(e, 0, 0); if (e.mt <= 0) Z.burst(e.x, e.y + 8, '#6a5434', 4, 70); return; }
      Z.move(e, Math.cos(e.sa) * 390, Math.sin(e.sa) * 390);
      if (Math.random() < .25) Z.burst(e.x, e.y + 8, '#6a5434', 1, 50);
      if ((e.run += dt) > 3.1) e.remove = true;
      return;
    }
    if (e.lead && !e.packed) { // a herd leader brings its herd along
      e.packed = true;
      const n = e.champ ? 3 + (Math.random() < .5 ? 1 : 0) : 3 + Math.floor(Math.random() * 4);
      for (let i = 0; i < n; i++) {
        const a = e.seed + i * 2.4, d = 26 + (i % 3) * 18, k = Z.spawn(e.kind, e.x + Math.cos(a) * d, e.y + Math.sin(a) * d);
        if (k) { k.lead = false; k.packed = true; k.hid = e.hid; }
      }
    }
    const d = Z.dist(e);
    if (e.mode === 'walk') {
      // herd flocking: members of one herd share a slow sway and surge, so the pack snakes in together
      const sway = Math.sin(Z.now * .9 + e.hid * 1.7) * .55 * cl((d - 90) / 220, 0, 1) + (e.seed - 3) * .05;
      const a = Z.angTo(e) + sway, sp = e.sp * (.82 + .28 * Math.sin(Z.now * 2.1 + e.hid));
      Z.move(e, Math.cos(a) * sp, Math.sin(a) * sp); e.ang = Z.angTo(e);
      e.wa = .1 + Math.sin(e.ph * 7 + e.seed) * .12;
      if ((e.cd -= dt) <= 0 && d < 66) { // telegraphed bardiche chop just ahead
        e.mode = 'wind'; e.mt = e.champ ? .45 : .55; e.cAng = Z.angTo(e);
        Z.hazard(e.x + Math.cos(e.cAng) * 30, e.y + Math.sin(e.cAng) * 30, { r: e.champ ? 34 : 30, t: e.mt, dmg: e.champ ? 11 : 8, col: '255,70,40' });
      }
    } else if (e.mode === 'wind') {
      e.ang = e.cAng; Z.move(e, 0, 0); e.mt -= dt;
      e.wa = .1 - 1.7 * ease(cl(1 - e.mt / .5, 0, 1));
      if (e.mt <= 0) { e.mode = 'chop'; e.mt = .22; }
    } else if (e.mode === 'chop') {
      e.ang = e.cAng; e.mt -= dt;
      Z.move(e, Math.cos(e.cAng) * 140, Math.sin(e.cAng) * 140);
      e.wa = -1.6 + 3 * cl(1 - e.mt / .22, 0, 1);
      if (e.mt <= 0) { e.mode = 'walk'; e.cd = Z.rnd(2.4, 3.8); }
    } else e.mode = 'walk';
  };
  const drawCow = (e, Z, white) => {
    const c = Z.ctx, A = art(), s = e.r / 11, V = VAR[e.vr] || VAR[0], O = W(white, V.o);
    const fast = e.mode === 'stamp' && e.mt <= 0, ph = e.ph * (fast ? 20 : 9) + e.seed;
    if (!white && e.mode === 'stamp' && e.mt > 0) { // stampede lane
      c.save(); c.translate(e.x, e.y); c.rotate(e.sa); c.globalAlpha = .16 + .12 * Math.sin(Z.now * 20); c.fillStyle = '#ff3a20';
      c.fillRect(0, -e.r * 1.1, 1150, e.r * 2.2); c.restore();
    }
    if (e.champ && !white) { // champion aura
      c.globalAlpha = .5 + .25 * Math.sin(Z.now * 5 + e.seed); c.strokeStyle = '#ffe27a'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(e.x, e.y + 10 * s, e.r + 7, (e.r + 7) * .45, 0, 0, TAU); c.stroke(); c.globalAlpha = 1;
    }
    const fr = A.legs[Math.min(7, (md(ph / TAU, 1) * 8) | 0)];
    c.save(); c.translate(e.x, e.y - Math.abs(Math.sin(ph)) * .9 * s);
    const f = Math.cos(e.ang) < 0 ? -s : s; c.scale(f, s);
    if (fast) c.rotate(.18);
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = O; c.lineWidth = 4.6; c.stroke(fr.L); c.strokeStyle = W(white, V.b); c.lineWidth = 3; c.stroke(fr.L);
    c.fillStyle = W(white, '#1e1410'); c.fill(fr.D);
    c.strokeStyle = e.champ && !white ? GOLD : O; c.lineWidth = e.champ ? 1.3 : 1.6; c.stroke(A.cBody); c.fillStyle = W(white, V.b); c.fill(A.cBody);
    if (!white) {
      c.fillStyle = V.c; c.fill(A.cChest);
      if (V.s) { c.fillStyle = V.s; c.fill(A.cSpots); }
      c.fillStyle = V.m; c.fill(A.cMuzzle);
      c.fillStyle = '#eadcb2'; c.fill(A.cHorns);
      c.fillStyle = e.champ ? '#7a2a1c' : '#5c3a22'; c.fill(A.cLoin);
      c.fillStyle = '#2a180e'; c.fill(A.cStrap);
      c.fillStyle = e.champ ? '#ffe040' : '#ff3a1e'; c.fill(A.cEye);
    }
    c.save(); c.translate(1.6, -7.4); c.rotate(fast ? -1.1 : e.wa);
    c.strokeStyle = O; c.lineWidth = 3.2; c.stroke(A.wOut);
    c.strokeStyle = W(white, '#7a5430'); c.lineWidth = 1.5; c.stroke(A.wShaft);
    c.strokeStyle = W(white, V.b); c.lineWidth = 2.3; c.stroke(A.wArm);
    c.fillStyle = W(white, '#c6cad2'); c.fill(A.wBlade);
    if (!white) { c.strokeStyle = '#ffffff'; c.lineWidth = .8; c.stroke(A.wEdge); }
    c.restore();
    if (e.mode === 'chop' && !white) { // swoosh of the chop
      c.globalAlpha = .55; c.strokeStyle = '#fff4dc'; c.lineWidth = 1.6;
      c.beginPath(); c.arc(1.6, -7.4, 21, -2.4, -2.6 + Math.max(.1, e.wa + 1.7)); c.stroke(); c.globalAlpha = 1;
    }
    c.restore();
  };
  const cow = {
    hp: 13, sp: 66, dmg: 7, xp: 1, r: 11, eye: false,
    init: cowInit, update: cowUpdate, draw: drawCow,
    death(e, Z) { Z.burst(e.x, e.y, '#a0281c', 6, 90); },
  };
  const champ = {
    hp: 36, sp: 88, dmg: 10, xp: 4, r: 12, eye: false,
    init(e, Z) { cowInit(e, Z); e.champ = true; e.lead = Math.random() < .5; },
    update: cowUpdate, draw: drawCow,
    death(e, Z) { Z.burst(e.x, e.y, GOLD, 10, 110); },
  };

  // ---------- Bull brute: lowers its head, charges down a telegraphed lane, then swings ----------
  const bull = {
    hp: 95, sp: 40, dmg: 14, xp: 6, r: 16, heavy: true, eye: false,
    init(e, Z) { e.mode = 'walk'; e.mt = 0; e.t1 = Z.rnd(2, 4); e.cAng = 0; e.hl = 0; e.wa = .1; e.vr = e.seed < 3 ? 0 : 1; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e);
      switch (e.mode) {
        case 'walk':
          Z.chase(e, e.sp * (.8 + .3 * Math.max(0, Math.sin(e.ph * 2.4 + e.seed))));
          e.hl += (0 - e.hl) * Math.min(1, dt * 5); e.wa = .1 + Math.sin(e.ph * 4) * .1;
          if ((e.t1 -= dt) <= 0 && d < 380 && d > 80) { e.mode = 'aim'; e.mt = 1; e.cAng = Z.angTo(e); Z.sfx('warn'); }
          break;
        case 'aim': // paws the ground and tracks, then locks for the last .35 s
          if (e.mt > .35) e.cAng = Z.angTo(e);
          e.ang = e.cAng; Z.move(e, 0, 0); e.hl += (.5 - e.hl) * Math.min(1, dt * 6); e.wa = -.9;
          if ((e.mt -= dt) <= 0) { e.mode = 'charge'; e.mt = .75; Z.sfx('charge'); }
          break;
        case 'charge':
          Z.move(e, Math.cos(e.cAng) * 400, Math.sin(e.cAng) * 400); e.ang = e.cAng;
          if (Math.random() < .4) Z.burst(e.x, e.y + 10, '#6a5434', 2, 60);
          if ((e.mt -= dt) <= 0) {
            e.mode = 'swing'; e.mt = .5; Z.shake(4);
            for (let i = -2; i <= 2; i++) { const a = e.cAng + i * .42; Z.hazard(e.x + Math.cos(a) * 46, e.y + Math.sin(a) * 46, { r: 30, t: .45, dmg: 12, col: '255,70,40' }); }
          }
          break;
        case 'swing':
          Z.move(e, 0, 0); e.ang = e.cAng; e.hl += (0 - e.hl) * Math.min(1, dt * 4);
          e.wa = -1.6 + 3.1 * ease(cl(1 - e.mt / .5, 0, 1));
          if ((e.mt -= dt) <= 0) { e.mode = 'walk'; e.t1 = Z.rnd(4.5, 6.5); }
          break;
        default: e.mode = 'walk';
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, A = art(), s = e.r / 16, ch = e.mode === 'charge', ph = e.ph * (ch ? 16 : 6) + e.seed;
      const O = W(white, '#160806'), B = W(white, e.vr ? '#4a2c22' : '#5e3222');
      if (e.mode === 'aim' && !white) {
        const lock = e.mt <= .35;
        c.save(); c.translate(e.x, e.y); c.rotate(e.cAng);
        c.globalAlpha = lock ? .38 + .2 * Math.sin(Z.now * 30) : .18; c.fillStyle = lock ? '#ff3020' : '#a82a18';
        c.fillRect(0, -e.r * .9, 330, e.r * 1.8); c.globalAlpha = lock ? .9 : .5; c.strokeStyle = '#ff7a50'; c.lineWidth = 1.6;
        c.strokeRect(0, -e.r * .9, 330, e.r * 1.8); c.restore(); c.globalAlpha = 1;
      }
      const fr = A.bLegs[Math.min(7, (md(ph / TAU, 1) * 8) | 0)];
      c.save(); c.translate(e.x + (e.mode === 'aim' ? Math.sin(Z.now * 40) * 1.2 : 0), e.y - Math.abs(Math.sin(ph)) * 1.2 * s);
      c.scale(Math.cos(e.ang) < 0 ? -s : s, s);
      if (ch) c.rotate(.2);
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.strokeStyle = O; c.lineWidth = 6.6; c.stroke(fr.L); c.strokeStyle = B; c.lineWidth = 4.6; c.stroke(fr.L);
      c.fillStyle = W(white, '#120a08'); c.fill(fr.D);
      c.strokeStyle = O; c.lineWidth = 2; c.stroke(A.bTorso); c.fillStyle = B; c.fill(A.bTorso);
      if (!white) {
        c.fillStyle = '#2a1610'; c.fill(A.bHump);
        c.fillStyle = e.vr ? '#6a4232' : '#7e4a30'; c.fill(A.bChest);
        c.fillStyle = '#4a2a18'; c.fill(A.bLoin);
      }
      c.stroke(A.bPaul); c.fillStyle = W(white, '#7a7a84'); c.fill(A.bPaul);
      c.fillStyle = W(white, '#d8d4c8'); c.fill(A.bSpikes);
      // head, lowered for the charge
      c.save(); c.translate(5, -12); c.rotate(e.hl);
      c.strokeStyle = O; c.lineWidth = 2; c.stroke(A.bHead); c.fillStyle = B; c.fill(A.bHead);
      if (!white) {
        c.fillStyle = '#f0e2b6'; c.fill(A.bHorns);
        c.fillStyle = '#b8806e'; c.fill(A.bMuzzle);
        c.fillStyle = '#ff2a14'; c.fill(A.bEye);
        c.strokeStyle = '#ffc840'; c.lineWidth = 1; c.beginPath(); c.arc(10.4, 2.6, 1.6, 0, TAU); c.stroke();
      }
      c.restore();
      // big bardiche
      c.save(); c.translate(3, -10); c.rotate(ch ? -1.2 : e.wa); c.scale(1.45, 1.45);
      c.strokeStyle = O; c.lineWidth = 3; c.stroke(A.wOut);
      c.strokeStyle = W(white, '#5a3c22'); c.lineWidth = 1.5; c.stroke(A.wShaft);
      c.strokeStyle = B; c.lineWidth = 2.2; c.stroke(A.wArm);
      c.fillStyle = W(white, '#b4b8c2'); c.fill(A.wBlade);
      if (!white) { c.strokeStyle = '#ffffff'; c.lineWidth = .8; c.stroke(A.wEdge); }
      c.restore();
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#8a1c14', 12, 110); Z.shake(3); },
  };

  // ---------- Golden calf: a rare, skittish treasure that flees and vanishes if you don't catch it ----------
  const calf = {
    hp: 32, sp: 104, dmg: 4, xp: 45, r: 9, eye: false,
    init(e) { e.life = 16; e.side = Math.random() < .5 ? -1 : 1; },
    update(e, Z) {
      const d = Z.dist(e), away = Z.angTo(e) + Math.PI;
      const a = d > 460 ? away + e.side * 1.5 : away + Math.sin(e.ph * 2.2 + e.seed) * .7;
      const sp = e.sp * (d > 460 ? .55 : 1);
      Z.move(e, Math.cos(a) * sp, Math.sin(a) * sp); e.ang = a;
      if ((e.life -= Z.dt) <= 0) { Z.burst(e.x, e.y, '#ffe27a', 14, 120); e.remove = true; }
    },
    draw(e, Z, white) {
      const c = Z.ctx, A = art(), s = e.r / 9, ph = e.ph * 16 + e.seed, O = W(white, '#5a3a0a'), G = W(white, '#f0c850');
      if (!white) Z.glow('255,220,110', 26, e.x, e.y - 4, .45 + .2 * Math.sin(Z.now * 6));
      const fr = A.kLegs[Math.min(7, (md(ph / TAU, 1) * 8) | 0)], fr2 = A.kLegs[Math.min(7, (md(ph / TAU + .25, 1) * 8) | 0)];
      c.save(); c.translate(e.x, e.y - Math.abs(Math.sin(ph)) * 1.4 * s); c.scale(Math.cos(e.ang) < 0 ? -s : s, s);
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.save(); c.translate(-3.4, 0); c.strokeStyle = O; c.lineWidth = 3; c.stroke(fr.L); c.strokeStyle = G; c.lineWidth = 1.8; c.stroke(fr.L); c.restore();
      c.save(); c.translate(3, 0); c.strokeStyle = O; c.lineWidth = 3; c.stroke(fr2.L); c.strokeStyle = G; c.lineWidth = 1.8; c.stroke(fr2.L); c.restore();
      c.strokeStyle = O; c.lineWidth = 1.5; c.stroke(A.kBody); c.fillStyle = G; c.fill(A.kBody);
      if (!white) {
        c.fillStyle = '#fff2b0'; c.fillRect(-4, -5, 6, 1.4);
        c.fillStyle = '#3a2006'; c.fillRect(7.2, -8.4, 1.2, 1.2);
        c.fillStyle = '#c84a1a'; c.fillRect(4, -4.4, 2.6, 1.2); // collar
        c.fillStyle = '#ffe680'; c.beginPath(); c.arc(5.2, -2.4, 1.5, 0, TAU); c.fill(); // bell
      }
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#ffe27a', 24, 170); Z.banner('The calf is yours!', '#ffe27a', false); },
  };

  // ---------- Shared spawners ----------
  const herd = (Z, kind, n, d, a = Math.random() * TAU) => {
    const cx = Z.P.x + Math.cos(a) * d, cy = Z.P.y + Math.sin(a) * d, hid = HID++;
    for (let i = 0; i < n; i++) {
      const b = i * 2.4, rr = 18 + (i % 3) * 20, k = Z.spawn(kind, cx + Math.cos(b) * rr, cy + Math.sin(b) * rr);
      if (k) { k.lead = false; k.packed = true; k.hid = hid; }
    }
  };
  // A wall of cows that paws for a second, then gallops straight across past the hero (one gap to slip through).
  const stampede = (Z, slots = 8, a = Math.random() * TAU) => {
    const dx = Math.cos(a), dy = Math.sin(a), px = -dy, py = dx, gap = 1 + Math.floor(Math.random() * (slots - 2));
    const ox = Z.P.x - dx * 560, oy = Z.P.y - dy * 560;
    for (let i = 0; i < slots; i++) {
      if (i === gap) continue;
      const o = (i - (slots - 1) / 2) * 76, k = Z.spawn('cow', ox + px * o, oy + py * o);
      if (k) { k.mode = 'stamp'; k.sa = a; k.mt = 1 + i * .03; k.run = 0; k.lead = false; k.packed = true; k.dmg *= 1.5; }
    }
    Z.sfx('warn'); Z.shake(4);
  };

  // ---------- Miniboss: King Moorgrath, Lord of the Herd ----------
  const BPAT = ['sweep', 'summon', 'stomp', 'sweep', 'stampede', 'stomp', 'sweep', 'summon', 'stampede'];
  const BA = (() => ({ // 50-unit design space, facing +x
    cape: poly([-24, -36, -36, -12, -42, 30, -38, 46, -26, 41, -14, 47, 0, 42, 10, 47, 18, 40, 14, -30]),
    ermine: poly([-27, -40, 17, -38, 20, -28, -2, -24, -25, -27]),
    ermDots: (() => { const p = new Path2D(); for (let i = 0; i < 6; i++) p.rect(-22 + i * 7, -34 + (i % 2) * 3, 2, 3); return p; })(),
    torso: poly([-22, 10, -27, -8, -24, -28, -14, -38, 4, -40, 18, -34, 26, -18, 24, 4, 16, 14, -12, 14]),
    pecs: (() => { const p = new Path2D(); ell(p, 6, -22, 10, 7, .2); ell(p, -10, -20, 9, 7, -.1); ell(p, 0, -2, 12, 8); return p; })(),
    sash: poly([-24, -28, -17, -33, 25, 2, 19, 9]),
    sashEdge: line(1, [-21, -31, 22, 5]),
    belt: poly([-23, 7, 23, 5, 23, 11, -23, 13]),
    loin: poly([-20, 12, 22, 11, 18, 26, 7, 40, 1, 28, -9, 40, -18, 26]),
    loinTrim: line(1, [-19, 18, 20, 17], [7, 38, 1, 28, -9, 38]),
    head: poly([2, -40, 2, -56, 10, -64, 22, -62, 32, -54, 38, -46, 37, -38, 28, -34, 14, -36],
      [8, -56, -3, -59, -5, -54, 6, -51]),
    horns: poly([8, -60, 1, -69, -8, -81, -1, -79, 8, -71, 13, -62], [23, -62, 29, -72, 39, -83, 37, -74, 31, -62, 27, -59]),
    muzzle: poly([28, -52, 38, -46, 37, -38, 28, -34, 25, -42]),
    beard: poly([12, -38, 30, -36, 34, -30, 29, -14, 25, -3, 20, -13, 15, -5, 11, -17, 6, -25]),
    beardLn: line(1, [16, -34, 15, -20], [22, -34, 21, -14], [28, -33, 27, -18]),
    crown: poly([5, -60, 27, -62, 28, -67, 31, -78, 25, -71, 20, -80, 15, -71, 10, -79, 8, -70, 3, -75, 4, -64]),
    crownBand: poly([5, -60, 27, -62, 27.6, -65.6, 4.4, -63.6]),
    gems: (() => { const p = new Path2D(); p.rect(9, -64.6, 3, 2.6); p.rect(20, -65.4, 3, 2.6); ell(p, 15.5, -66, 2, 1.8); return p; })(),
    eye: poly([20, -55, 27, -53.4, 21, -51]),
    brow: line(1, [18, -57, 28, -54.6]),
    nost: (() => { const p = new Path2D(); p.rect(33, -44, 2, 2); p.rect(30, -41, 2, 2); return p; })(),
    // arm + ornate bardiche (pivot = shoulder)
    wOut: (() => { const p = line(1, [0, 0, 12, 16], [15, 52, 11, -70], [11, -70, 10, -86]); p.moveTo(11, -72); for (const [x, y] of [[24, -79], [37, -71], [43, -56], [41, -42], [33, -31], [20, -29], [16, -35], [28, -41], [31, -54], [26, -65]]) p.lineTo(x, y); p.closePath(); return p; })(),
    wShaft: line(1, [15, 52, 11, -70]),
    wSpike: line(1, [11, -70, 10, -86]),
    wArm: line(1, [0, 0, 12, 16]),
    wBlade: poly([11, -72, 24, -79, 37, -71, 43, -56, 41, -42, 33, -31, 20, -29, 16, -35, 28, -41, 31, -54, 26, -65]),
    wGold: line(1, [17, -34, 27, -40, 30, -54, 25, -66, 12, -71]),
    wEdge: line(1, [24, -79, 37, -71, 43, -56, 41, -42, 33, -31]),
    wBands: (() => { const p = new Path2D(); for (const y of [-28, -10, 30]) p.rect(11.2 + (y + 70) * -.033 + 1.6, y, 4.4, 3.2); return p; })(),
    tassel: poly([13, -30, 9, -18, 12, -20, 13, -14, 15, -20, 17, -18]),
  }));
  let BART = null;
  const bart = () => BART || (BART = BA());

  const bossEnter = (e, Z, m) => {
    const rage = e.rage;
    e.mode = m;
    if (m === 'walk') { e.mt = rage ? Z.rnd(1, 1.5) : Z.rnd(1.6, 2.4); return; }
    if (m === 'swind') { // wide bardiche sweep: the arc of hazards is the telegraph
      e.mt = e.dbl ? .75 : rage ? .85 : 1.05; e.cAng = Z.angTo(e); e.sweepT = e.mt; Z.sfx('warn');
      for (let i = 0; i < 7; i++) { const a = e.cAng - 1.3 + i * 2.6 / 6; Z.hazard(e.x + Math.cos(a) * 100, e.y + Math.sin(a) * 100, { r: 46, t: e.mt, dmg: 18, col: '255,60,40' }); }
      for (let i = 0; i < 6; i++) { const a = e.cAng - 1.15 + i * 2.3 / 5; Z.hazard(e.x + Math.cos(a) * 182, e.y + Math.sin(a) * 182, { r: 42, t: e.mt, dmg: 16, col: '255,60,40' }); }
      return;
    }
    if (m === 'summon') {
      e.mt = 1.3; Z.banner('The herd answers!', '#e8c878', false); Z.sfx('boss'); Z.shake(5);
      const hid = HID++, n = rage ? 8 : 7;
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU + e.ph, k = Z.spawn('cow', e.x + Math.cos(a) * (e.r + 44), e.y + Math.sin(a) * (e.r + 44));
        if (k) { k.lead = false; k.packed = true; k.hid = hid; Z.burst(k.x, k.y, '#8a6a40', 5, 60); }
      }
      return;
    }
    if (m === 'stomp') { // rears up, then crashes down: a ground ring under him, then a bullet shockwave
      e.mt = rage ? .7 : .85; e.lift = 0; Z.sfx('warn');
      Z.hazard(e.x, e.y, { r: 138, t: e.mt, dmg: 18, col: '255,90,40' });
      return;
    }
    if (m === 'stampede') {
      e.mt = rage ? 2.2 : 1.6; e.k2 = rage ? 1.1 : 0;
      Z.banner('The King calls a royal stampede!', '#ff6a40', false);
      e.stA = Math.random() * TAU; stampede(Z, 8, e.stA);
    }
  };
  const boss = {
    name: 'King Moorgrath, Lord of the Herd', hp: 4000, sp: 52, dmg: 24, xp: 0, r: 50, heavy: true, eye: false,
    init(e) { e.pi = 0; e.mode = 'walk'; e.mt = 2.2; e.wa = .1; e.rage = false; e.dbl = 0; e.cAng = 0; e.lift = 0; e.k2 = 0; e.sweepT = 1; e.stA = 0; },
    update(e, Z) {
      const dt = Z.dt;
      if (!e.rage && e.hp < e.max * .4) {
        e.rage = true; e.sp *= 1.3; Z.banner('Moooo! The King is enraged!', '#ff3a20', true); Z.sfx('boss'); Z.shake(12);
        Z.ring(e.x, e.y - 30, 16, 140, { r: 7, dmg: 9, col: '255,70,50' }, e.ph);
      }
      e.mt -= dt;
      switch (e.mode) {
        case 'walk':
          Z.chase(e, e.sp * (.85 + .25 * Math.max(0, Math.sin(e.ph * 2.2))));
          e.wa = .1 + Math.sin(e.ph * 2.5) * .08; e.lift *= .9;
          if (e.mt <= 0) { const m = BPAT[e.pi++ % BPAT.length]; bossEnter(e, Z, m === 'sweep' ? 'swind' : m); }
          break;
        case 'swind':
          Z.move(e, 0, 0); e.ang = e.cAng;
          e.wa = .1 - 2 * ease(cl(1 - e.mt / Math.max(.1, e.sweepT), 0, 1));
          if (e.mt <= 0) { e.mode = 'sweep'; e.mt = .3; Z.sfx('charge'); Z.shake(7); }
          break;
        case 'sweep':
          Z.move(e, Math.cos(e.cAng) * 60, Math.sin(e.cAng) * 60); e.ang = e.cAng;
          e.wa = -1.9 + 3.6 * cl(1 - e.mt / .3, 0, 1);
          if (e.mt <= 0) {
            if (e.rage && !e.dbl) { e.dbl = 1; bossEnter(e, Z, 'swind'); } // enraged: a second sweep
            else { e.dbl = 0; bossEnter(e, Z, 'walk'); }
          }
          break;
        case 'summon':
          Z.move(e, 0, 0); e.wa += (-.7 - e.wa) * Math.min(1, dt * 6);
          if (e.mt <= 0) bossEnter(e, Z, 'walk');
          break;
        case 'stomp':
          Z.move(e, 0, 0); e.ang = Z.angTo(e);
          e.lift = ease(cl(1 - e.mt / .8, 0, 1)); e.wa += (-1.2 - e.wa) * Math.min(1, dt * 6);
          if (e.mt <= 0) {
            Z.shake(12); Z.sfx('nova'); Z.burst(e.x, e.y + 30, '#7a6040', 24, 200);
            Z.ring(e.x, e.y + 10, e.rage ? 22 : 18, 150, { r: 7, dmg: 9, col: '255,70,50' }, e.ph);
            e.mode = 'land'; e.mt = .7; e.k2 = e.rage ? .35 : 0; e.lift = 0;
          }
          break;
        case 'land':
          Z.move(e, 0, 0); e.wa += (.4 - e.wa) * Math.min(1, dt * 8);
          if (e.k2 > 0 && (e.k2 -= dt) <= 0) Z.ring(e.x, e.y + 10, 18, 120, { r: 7, dmg: 9, col: '255,70,50' }, e.ph + .17);
          if (e.mt <= 0) bossEnter(e, Z, 'walk');
          break;
        case 'stampede':
          Z.chase(e, e.sp * .4); e.wa += (-.5 - e.wa) * Math.min(1, dt * 5);
          if (e.k2 > 0 && (e.k2 -= dt) <= 0) stampede(Z, 8, e.stA + Math.PI / 2);
          if (e.mt <= 0) bossEnter(e, Z, 'walk');
          break;
        default: bossEnter(e, Z, 'walk');
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, A = bart(), s = e.r / 50, mv = e.mode === 'walk' || e.mode === 'stampede', step = mv ? Math.sin(e.ph * 4.4) : 0;
      const O = W(white, '#1a0a06'), FUR = W(white, '#5a3424'), GLD = W(white, '#f0c040');
      if (!white && e.mode === 'swind') { // sweep wedge
        c.save(); c.globalAlpha = .14 + .1 * Math.sin(Z.now * 18); c.fillStyle = '#ff2a14';
        c.beginPath(); c.moveTo(e.x, e.y); c.arc(e.x, e.y, 210, e.cAng - 1.45, e.cAng + 1.45); c.closePath(); c.fill();
        c.globalAlpha = .5; c.strokeStyle = '#ff7a50'; c.lineWidth = 2; c.stroke(); c.restore();
      }
      if (!white && e.rage) Z.glow('255,40,20', 90, e.x, e.y - 10, .32 + .12 * Math.sin(Z.now * 7));
      c.save(); c.translate(e.x, e.y - e.lift * 16 * s - Math.abs(step) * 2 * s); c.scale(Math.cos(e.ang) < 0 ? -s : s, s);
      if (e.mode === 'summon' || (e.mode === 'stomp' && e.mt < .25)) c.translate(Math.sin(Z.now * 50) * 1.2, 0);
      c.lineCap = 'round'; c.lineJoin = 'round';
      // royal cape behind, swaying
      c.save(); c.translate(-4, 0); c.scale(1 + .03 * Math.sin(e.ph * 3), 1);
      c.strokeStyle = O; c.lineWidth = 2.4; c.stroke(A.cape); c.fillStyle = W(white, '#8a1622'); c.fill(A.cape); c.restore();
      // legs: thick digitigrade, gold-banded hooves
      const lg = new Path2D(), hv = new Path2D(), lu = e.lift * 10;
      for (const [hx, sg] of [[-9, 1], [8, -1]]) {
        const sw = step * sg * 5;
        lg.moveTo(hx, 12); lg.lineTo(hx + 6 + sw * .4, 28 - lu * (sg > 0 ? 1 : .3)); lg.lineTo(hx - 3 + sw, 38 - lu * (sg > 0 ? 1 : .3)); lg.lineTo(hx + 2 + sw * 1.2, 47 - lu * (sg > 0 ? 1 : .3));
        hv.rect(hx - 4 + sw * 1.2, 45 - lu * (sg > 0 ? 1 : .3), 11, 5);
      }
      c.strokeStyle = O; c.lineWidth = 15; c.stroke(lg); c.strokeStyle = FUR; c.lineWidth = 11; c.stroke(lg);
      c.fillStyle = W(white, '#1a100c'); c.fill(hv); c.strokeStyle = GLD; c.lineWidth = 1.6; c.stroke(hv);
      // back arm resting on the hip
      c.beginPath(); c.moveTo(-20, -28); c.lineTo(-30, -10); c.lineTo(-22, 4);
      c.strokeStyle = O; c.lineWidth = 12; c.stroke(); c.strokeStyle = W(white, '#4a2a1c'); c.lineWidth = 8.5; c.stroke();
      // torso, sash, belt, loincloth
      c.strokeStyle = O; c.lineWidth = 2.6; c.stroke(A.torso); c.fillStyle = FUR; c.fill(A.torso);
      if (!white) { c.fillStyle = '#734530'; c.fill(A.pecs); }
      c.stroke(A.loin); c.fillStyle = W(white, '#5a1a4a'); c.fill(A.loin);
      if (!white) { c.strokeStyle = '#e0b040'; c.lineWidth = 1.6; c.stroke(A.loinTrim); }
      c.strokeStyle = O; c.lineWidth = 1.8; c.stroke(A.sash); c.fillStyle = W(white, '#d0202a'); c.fill(A.sash);
      if (!white) { c.strokeStyle = '#f0c040'; c.lineWidth = 1.2; c.stroke(A.sashEdge); }
      c.strokeStyle = O; c.lineWidth = 1.8; c.stroke(A.belt); c.fillStyle = W(white, '#3a2214'); c.fill(A.belt);
      c.fillStyle = GLD; c.fillRect(-4, 4.4, 9, 8);
      // ermine collar
      c.strokeStyle = O; c.lineWidth = 1.8; c.stroke(A.ermine); c.fillStyle = W(white, '#ece6d6'); c.fill(A.ermine);
      if (!white) { c.fillStyle = '#1a1414'; c.fill(A.ermDots); }
      // head: grey beard, horns, crown
      c.save(); if (e.mode === 'summon') { c.translate(10, -40); c.rotate(-.18); c.translate(-10, 40); }
      c.strokeStyle = O; c.lineWidth = 2.4; c.stroke(A.horns); c.fillStyle = W(white, '#efe2bc'); c.fill(A.horns);
      c.stroke(A.head); c.fillStyle = FUR; c.fill(A.head);
      if (!white) { c.fillStyle = '#c08a76'; c.fill(A.muzzle); c.fillStyle = '#1a0a08'; c.fill(A.nost); }
      c.strokeStyle = O; c.lineWidth = 2; c.stroke(A.beard); c.fillStyle = W(white, '#b8b2a6'); c.fill(A.beard);
      if (!white) { c.strokeStyle = '#8a857a'; c.lineWidth = 1.2; c.stroke(A.beardLn); }
      c.fillStyle = W(white, e.rage ? '#ffe040' : '#ff2a14'); c.fill(A.eye);
      c.strokeStyle = O; c.lineWidth = 2.4; c.stroke(A.brow);
      c.lineWidth = 2; c.stroke(A.crown); c.fillStyle = GLD; c.fill(A.crown);
      if (!white) {
        c.fillStyle = '#a87418'; c.fill(A.crownBand);
        c.fillStyle = '#e8202a'; c.fill(A.gems);
        c.fillStyle = '#fff6c0'; c.fillRect(19.6, -80, 1.6, 1.6); c.fillRect(30.4, -78, 1.4, 1.4);
        if (e.mode === 'summon') Z.glow('255,210,90', 40, 16, -70, .7);
      }
      c.restore();
      // ornate bardiche in the front arm
      c.save(); c.translate(14, -30); c.rotate(e.wa);
      c.strokeStyle = O; c.lineWidth = 7; c.stroke(A.wOut);
      c.strokeStyle = W(white, '#3a2418'); c.lineWidth = 3.4; c.stroke(A.wShaft);
      c.strokeStyle = W(white, '#c8c8d0'); c.lineWidth = 2.4; c.stroke(A.wSpike);
      c.strokeStyle = FUR; c.lineWidth = 9; c.stroke(A.wArm);
      c.fillStyle = W(white, '#cdd0d8'); c.fill(A.wBlade);
      if (!white) {
        c.strokeStyle = '#d8a830'; c.lineWidth = 2; c.stroke(A.wGold);
        c.strokeStyle = '#ffffff'; c.lineWidth = 1.4; c.stroke(A.wEdge);
        c.fillStyle = '#e0b040'; c.fill(A.wBands);
        c.fillStyle = '#c0202a'; c.fill(A.tassel);
      }
      c.fillStyle = FUR; c.beginPath(); c.arc(12, 16, 5, 0, TAU); c.fill(); c.strokeStyle = O; c.lineWidth = 1.6; c.stroke();
      c.restore();
      if (e.mode === 'sweep' && !white) { // swoosh of the great sweep
        c.globalAlpha = .6; c.strokeStyle = '#fff0d8'; c.lineWidth = 5;
        c.beginPath(); c.arc(14, -30, 74, -3, -3 + Math.max(.1, e.wa + 1.9)); c.stroke(); c.globalAlpha = 1;
      }
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#f0c040', 40, 240); Z.burst(e.x, e.y, '#a0281c', 30, 200); Z.shake(14); Z.banner('The King falls. The herd scatters!', '#f0c040', true); },
  };

  // ---------- Floor: an endless pasture (cached) ----------
  const BG = '#4a4630';
  const GR = ['#474430', '#4d4933', '#45432e', '#504b35', '#4b4732'];
  const STONE = { t: '#7a7366', f: '#5c564b', o: '#2a2420' }, STONE2 = { t: '#6a6458', f: '#4e4940', o: '#241f1a' };
  const WOOD = { t: '#776550', f: '#5a4a39', o: '#2a2018' }, BARN = { t: '#7a4436', f: '#5c3026', o: '#2a1410' };
  const HAY = { t: '#a08a54', f: '#7e6a3e', o: '#3a2e18' };
  const shadow = (c, x, y, rx, ry, a = .3) => { c.fillStyle = `rgba(16,8,12,${a})`; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); };
  // oblique box: ground footprint top-left (x, y), w × d, raised h (top face shifted up, front face below it)
  const box = (c, x, y, w, d, h, P) => {
    c.fillStyle = P.f; c.fillRect(x, y + d - h, w, h);
    c.fillStyle = P.t; c.fillRect(x, y - h, w, d);
    c.strokeStyle = P.o; c.lineWidth = 1.2; c.strokeRect(x, y - h, w, d); c.strokeRect(x, y + d - h, w, h);
  };
  const warm = (c, x, y, r, a, col = '255,130,60') => {
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
    c.save(); c.translate(x, y); c.scale(1, .6); c.translate(-x, -y); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
  };

  // Set-pieces: one per 400 px cell (sparse), plus a landmark per 1600 px cell (farm ruin or stone circle).
  const M = 400, BM = 1600;
  const HAYB = 1, HAYP = 2, FENCE = 3, CART = 4, BONES = 5, RSTONE = 6, RUIN = 7;
  const FARM = 1, CIRCLE = 2;
  const landmark = (Z, bx, by) => {
    const h = Z.hash(bx * 7 + 3, by * 11 - 5);
    const k = h < .2 ? FARM : h < .34 ? CIRCLE : 0;
    return { k, bx, by, x: bx * BM + BM / 2 + (Z.hash(bx * 3, by * 9 + 1) - .5) * 120, y: by * BM + BM / 2 + (Z.hash(bx * 9 + 4, by * 3) - .5) * 120, v: Z.hash(bx * 13 - 2, by * 5 + 7), w: Z.hash(bx + 17, by * 19) };
  };
  const piece = (Z, mx, my) => {
    const L = landmark(Z, Math.floor(mx / 4), Math.floor(my / 4)), ix = md(mx, 4), iy = md(my, 4);
    if (L.k && ix >= 1 && ix <= 2 && iy >= 1 && iy <= 2) return { k: 0 };
    const h = Z.hash(mx * 3 + 11, my * 5 - 7);
    const k = h < .07 ? HAYB : h < .12 ? HAYP : h < .2 ? FENCE : h < .235 ? CART : h < .3 ? BONES : h < .335 ? RSTONE : h < .365 ? RUIN : 0;
    return { k, mx, my, x: mx * M + M / 2 + (Z.hash(mx * 13 - 1, my * 7 + 4) - .5) * 220, y: my * M + M / 2 + (Z.hash(mx * 17 + 5, my * 11 - 3) - .5) * 220, v: Z.hash(mx * 29 + 2, my * 23 + 9), w: Z.hash(mx * 5 + 1, my * 3 + 8) };
  };
  const circleStones = (Z, p) => {
    const out = [];
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * TAU + p.v * 2, h = Z.hash(p.bx * 31 + i, p.by * 17 - i);
      out.push({ x: p.x + Math.cos(a) * 172, y: p.y + Math.sin(a) * 118, fallen: h < .25, H: 50 + h * 18, h });
    }
    return out;
  };
  // light sources for under/ambient: kind 0 = torch flame (y = flame base), 1 = red rune
  const lights = (Z, p, big) => {
    const L = [];
    if (big) {
      if (p.k === FARM) L.push({ x: p.x - 52, y: p.y + 108 - 50, kind: 0 });
      else if (p.k === CIRCLE) { for (const s of circleStones(Z, p)) if (!s.fallen) L.push({ x: s.x, y: s.y - s.H * .55, kind: 1 }); }
    } else if (p.k === RUIN) L.push({ x: p.x + 40, y: p.y - 44, kind: 0 });
    else if (p.k === RSTONE) L.push({ x: p.x, y: p.y - 26, kind: 1 });
    return L;
  };
  const RUNE = (x, y, k = 1, p = new Path2D()) => { // carved horned glyph around (x, y)
    p.moveTo(x, y - 12 * k); p.lineTo(x, y + 12 * k);
    p.moveTo(x - 6 * k, y - 14 * k); p.quadraticCurveTo(x - 5 * k, y - 7 * k, x, y - 6 * k); p.quadraticCurveTo(x + 5 * k, y - 7 * k, x + 6 * k, y - 14 * k);
    p.moveTo(x - 5 * k, y + 2 * k); p.lineTo(x, y + 6 * k); p.lineTo(x + 5 * k, y + 2 * k);
    return p;
  };
  const monolith = (c, x, y, H, lean) => {
    shadow(c, x + 6, y + 2, 20, 7, .3);
    c.fillStyle = STONE2.f; c.strokeStyle = STONE2.o; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(x - 12, y); c.lineTo(x + 12, y); c.lineTo(x + 10 + lean, y - H + 3); c.lineTo(x - 9 + lean, y - H); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = STONE2.t; c.beginPath(); c.moveTo(x - 9 + lean, y - H); c.lineTo(x + 10 + lean, y - H + 3); c.lineTo(x + 7 + lean, y - H - 5); c.lineTo(x - 10 + lean, y - H - 6); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(30,24,20,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 6, y - 6); c.lineTo(x - 3 + lean * .5, y - H * .4); c.moveTo(x + 7, y - H * .7); c.lineTo(x + 4, y - H * .5); c.stroke();
    c.strokeStyle = '#5a1612'; c.lineWidth = 2; c.stroke(RUNE(x + lean * .5, y - H * .55, H / 56));
  };
  const cowSkull = (c, x, y, k = 1) => {
    const sk = new Path2D(), dk = new Path2D(), hn = new Path2D();
    sk.moveTo(x - 9 * k, y - 6 * k); sk.lineTo(x + 9 * k, y - 6 * k); sk.lineTo(x + 8 * k, y + 2 * k); sk.lineTo(x + 4.5 * k, y + 12 * k); sk.lineTo(x - 4.5 * k, y + 12 * k); sk.lineTo(x - 8 * k, y + 2 * k); sk.closePath();
    ell(dk, x - 4 * k, y - 1 * k, 2.6 * k, 2.2 * k); ell(dk, x + 4 * k, y - 1 * k, 2.6 * k, 2.2 * k); dk.rect(x - 2.2 * k, y + 8 * k, 1.4 * k, 2 * k); dk.rect(x + .8 * k, y + 8 * k, 1.4 * k, 2 * k);
    hn.moveTo(x - 8 * k, y - 5 * k); hn.quadraticCurveTo(x - 18 * k, y - 6 * k, x - 16 * k, y - 16 * k);
    hn.moveTo(x + 8 * k, y - 5 * k); hn.quadraticCurveTo(x + 18 * k, y - 6 * k, x + 16 * k, y - 16 * k);
    c.lineCap = 'round'; c.strokeStyle = '#2a221a'; c.lineWidth = 4.4 * k; c.stroke(hn); c.strokeStyle = '#b4aa90'; c.lineWidth = 2.4 * k; c.stroke(hn);
    c.strokeStyle = '#2a221a'; c.lineWidth = 1.8; c.stroke(sk); c.fillStyle = '#bfb59a'; c.fill(sk); c.fillStyle = '#231a14'; c.fill(dk); c.lineCap = 'butt';
  };
  const bonesAt = (c, Z, x, y, n, seed) => {
    const bp = new Path2D(), kn = new Path2D();
    for (let i = 0; i < n; i++) {
      const a = Z.hash(seed * 31 + i, seed * 7 - i) * TAU, d = 10 + Z.hash(seed + i * 5, i * 3 - seed) * 40, ang = Z.hash(i * 13 + seed, seed * 3 + i) * TAU, L = 5 + (i % 3) * 3;
      const bx = x + Math.cos(a) * d, by = y + Math.sin(a) * d * .5, dx = Math.cos(ang) * L, dy = Math.sin(ang) * L * .6;
      bp.moveTo(bx - dx, by - dy); bp.lineTo(bx + dx, by + dy); ell(kn, bx - dx, by - dy, 1.8, 1.5); ell(kn, bx + dx, by + dy, 1.8, 1.5);
    }
    c.lineCap = 'round'; c.strokeStyle = '#231c16'; c.lineWidth = 4.2; c.stroke(bp); c.strokeStyle = '#a49a80'; c.lineWidth = 2.2; c.stroke(bp); c.fillStyle = '#ada388'; c.fill(kn); c.lineCap = 'butt';
  };

  const drawHayB = (c, Z, p) => {
    const n = 2 + ((p.w * 2.99) | 0);
    for (let i = 0; i < n; i++) {
      const x = p.x + (i - (n - 1) / 2) * 50 + (Z.hash(p.mx + i, p.my) - .5) * 14, y = p.y + (i % 2) * 18 - 8;
      const str = new Path2D(), strD = new Path2D(), tw = new Path2D();
      c.lineJoin = 'round';
      if (p.v < .55) { // round bale lying on its side, the rolled spiral face toward the viewer's left
        shadow(c, x + 4, y + 2, 30, 9);
        c.fillStyle = HAY.f; c.strokeStyle = HAY.o; c.lineWidth = 1.3;
        c.beginPath(); c.moveTo(x - 22, y - 30); c.lineTo(x + 14, y - 30); c.ellipse(x + 14, y - 15, 8, 15, 0, -Math.PI / 2, Math.PI / 2); c.lineTo(x - 22, y); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = HAY.t; c.fillRect(x - 20, y - 29, 32, 8);
        for (let k = 0; k < 7; k++) { const yy = y - 26 + k * 4, x0 = x - 18 + Z.hash(k, p.mx + i) * 10; (k & 1 ? strD : str).moveTo(x0, yy); (k & 1 ? strD : str).lineTo(x0 + 12 + Z.hash(k * 3, p.my) * 14, yy + .5); }
        c.fillStyle = '#8e7a46'; c.beginPath(); c.ellipse(x - 22, y - 15, 9, 15, 0, 0, TAU); c.fill(); c.stroke();
        const sp = new Path2D(); ell(sp, x - 22, y - 15, 6, 10.4); ell(sp, x - 22.5, y - 15, 3, 5.4); sp.rect(x - 23.4, y - 16, 1.6, 2);
        c.strokeStyle = '#5e4e2a'; c.lineWidth = 1; c.stroke(sp);
        tw.moveTo(x - 6, y - 30); tw.lineTo(x - 6, y); tw.moveTo(x + 6, y - 30); tw.lineTo(x + 6, y);
      } else { // square bales, one stacked on top
        const yy = y - (i === 1 && n === 3 ? 20 : 0);
        shadow(c, x + 4, y + 2, 28, 8);
        c.strokeStyle = HAY.o; c.lineWidth = 1.3;
        c.fillStyle = HAY.f; c.beginPath(); c.roundRect(x - 22, yy - 33, 44, 33, 6); c.fill(); c.stroke();
        c.fillStyle = '#ad9660'; c.beginPath(); c.roundRect(x - 21, yy - 32, 42, 14, [5, 5, 2, 2]); c.fill();
        for (let k = 0; k < 6; k++) { const ry = yy - 15 + k * 2.6, x0 = x - 20 + Z.hash(k + i, p.mx) * 14; strD.moveTo(x0, ry); strD.lineTo(x0 + 8 + Z.hash(k, p.my + i) * 16, ry); }
        for (let k = 0; k < 9; k++) { const sx = x - 18 + Z.hash(k * 3 + i, p.my) * 34, sy = yy - 31 + Z.hash(k, p.mx * 3) * 11, o = (Z.hash(k * 7, i) - .5) * 8; str.moveTo(sx, sy); str.lineTo(sx + o, sy + 2.5); }
        for (const ox of [-9, 9]) { tw.moveTo(x + ox, yy - 33); tw.lineTo(x + ox, yy); }
      }
      c.lineCap = 'round'; c.lineWidth = 1; c.strokeStyle = '#b8a066'; c.stroke(str); c.strokeStyle = '#5e4c28'; c.stroke(strD);
      c.strokeStyle = '#3a2a16'; c.lineWidth = 1.3; c.stroke(tw); c.lineCap = 'butt'; c.lineJoin = 'miter';
    }
    const st = new Path2D(); // loose straw
    for (let k = 0; k < 14; k++) { const a = Z.hash(p.mx * 3 + k, p.my - k) * TAU, d = 30 + Z.hash(k, p.mx * 7) * 50, x = p.x + Math.cos(a) * d, y = p.y + 14 + Math.sin(a) * d * .4, o = (Z.hash(k * 5, p.my) - .5) * 10; st.moveTo(x, y); st.lineTo(x + 6, y + o * .3); }
    c.strokeStyle = '#8e7a48'; c.lineWidth = 1.2; c.stroke(st);
  };
  const drawHayP = (c, Z, p) => {
    const x = p.x, y = p.y;
    shadow(c, x + 6, y + 4, 44, 14);
    c.fillStyle = HAY.f; c.strokeStyle = HAY.o; c.lineWidth = 1.3; c.beginPath(); c.ellipse(x, y - 6, 38, 17, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#8e7a48'; c.beginPath(); c.ellipse(x - 4, y - 12, 28, 12, -.05, 0, TAU); c.fill();
    c.fillStyle = HAY.t; c.beginPath(); c.ellipse(x - 7, y - 16, 15, 7, 0, 0, TAU); c.fill();
    const lt = new Path2D(), dk = new Path2D();
    for (let k = 0; k < 22; k++) {
      const a = Z.hash(p.mx + k * 3, p.my * 5 - k) * TAU, d = Z.hash(k * 7, p.mx - p.my) * .9, sx = x + Math.cos(a) * 34 * d, sy = y - 8 + Math.sin(a) * 14 * d, o = (Z.hash(k, p.my * 3) - .5) * 12;
      (k & 1 ? dk : lt).moveTo(sx, sy); (k & 1 ? dk : lt).lineTo(sx + o, sy - 3 - Math.abs(o) * .3);
    }
    c.strokeStyle = '#b8a066'; c.lineWidth = 1; c.stroke(lt); c.strokeStyle = '#5e4e2a'; c.stroke(dk);
    if (p.w < .45) { // pitchfork left stuck in the pile
      c.lineCap = 'round'; c.strokeStyle = '#21180f'; c.lineWidth = 4.4; c.beginPath(); c.moveTo(x + 12, y - 16); c.lineTo(x + 34, y - 58); c.stroke();
      c.strokeStyle = '#7a5a36'; c.lineWidth = 2.4; c.stroke(); c.lineCap = 'butt';
    }
  };
  const drawFence = (c, Z, p) => {
    const n = 4 + ((p.w * 4) | 0), sl = (p.v - .5) * 18, x0 = p.x - (n - 1) * 23;
    const posts = new Path2D(), rails = new Path2D(), caps = new Path2D();
    const P = [];
    for (let i = 0; i < n; i++) {
      const h = Z.hash(p.mx * 41 + i * 7, p.my * 37 - i * 5), x = x0 + i * 46, y = p.y + i * sl;
      if (h < .14) { P.push(null); caps.rect(x - 3.5, y - 4, 7, 4); continue; }
      const lean = h < .32 ? (h - .23) * 90 : 0, top = { x: x + lean, y: y - 30 + Math.abs(lean) * .2 };
      posts.moveTo(x, y); posts.lineTo(top.x, top.y); P.push({ x, y, lean });
    }
    for (let i = 0; i < n - 1; i++) {
      const a = P[i], b = P[i + 1], h = Z.hash(p.mx * 13 + i, p.my * 29 - i);
      if (a && b && h > .25) { for (const hh of [11, 22]) { rails.moveTo(a.x + a.lean * hh / 30, a.y - hh); rails.lineTo(b.x + b.lean * hh / 30, b.y - hh); } }
      else if (a) { rails.moveTo(a.x + a.lean * .6, a.y - 18); rails.lineTo(a.x + 38, a.y + 3 + sl * .8); } // a rail fallen to the ground
    }
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(16,8,12,.25)'; c.lineWidth = 6; c.save(); c.translate(6, 4); c.stroke(rails); c.restore();
    c.strokeStyle = WOOD.o; c.lineWidth = 7.4; c.stroke(posts); c.lineWidth = 4.6; c.stroke(rails);
    c.strokeStyle = WOOD.f; c.lineWidth = 4.8; c.stroke(posts); c.strokeStyle = WOOD.t; c.lineWidth = 2.4; c.stroke(rails);
    c.fillStyle = WOOD.f; c.fill(caps); c.lineCap = 'butt';
  };
  const drawCart = (c, Z, p) => {
    const x = p.x, y = p.y;
    shadow(c, x + 4, y + 18, 58, 16);
    // shafts resting on the ground
    c.lineCap = 'round'; c.strokeStyle = WOOD.o; c.lineWidth = 5.4; c.beginPath(); c.moveTo(x - 32, y - 2); c.lineTo(x - 78, y + 10); c.moveTo(x - 32, y + 10); c.lineTo(x - 76, y + 22); c.stroke();
    c.strokeStyle = WOOD.f; c.lineWidth = 3; c.stroke();
    box(c, x - 34, y - 16, 68, 30, 16, WOOD);
    const pl = new Path2D(); for (let k = 1; k < 4; k++) { pl.moveTo(x - 34, y - 32 + k * 7.5); pl.lineTo(x + 34, y - 32 + k * 7.5); }
    c.strokeStyle = '#3e3226'; c.lineWidth = 1; c.stroke(pl);
    if (p.v < .5) { c.fillStyle = HAY.t; c.beginPath(); c.ellipse(x + 4, y - 22, 22, 7, 0, 0, TAU); c.fill(); c.fillStyle = HAY.f; c.beginPath(); c.ellipse(x - 12, y - 18, 12, 4, 0, 0, TAU); c.fill(); }
    // standing wheel at the front, a broken one lying in the grass
    const wx = x - 14, wy = y + 12, sp = new Path2D();
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + p.w; sp.moveTo(wx, wy); sp.lineTo(wx + Math.cos(a) * 13, wy + Math.sin(a) * 13); }
    c.strokeStyle = WOOD.o; c.lineWidth = 6; c.beginPath(); c.arc(wx, wy, 13, 0, TAU); c.stroke(); c.lineWidth = 3.4; c.stroke(sp);
    c.strokeStyle = WOOD.t; c.lineWidth = 3.6; c.beginPath(); c.arc(wx, wy, 13, 0, TAU); c.stroke(); c.lineWidth = 1.6; c.stroke(sp);
    c.fillStyle = '#2a2018'; c.fillRect(wx - 2.5, wy - 2.5, 5, 5);
    c.strokeStyle = WOOD.o; c.lineWidth = 5; c.beginPath(); c.ellipse(x + 50, y + 22, 14, 6, 0, .4, TAU - .6); c.stroke();
    c.strokeStyle = WOOD.f; c.lineWidth = 2.8; c.stroke(); c.lineCap = 'butt';
  };
  const drawBones = (c, Z, p) => {
    c.fillStyle = 'rgba(40,22,18,.45)'; c.beginPath(); c.ellipse(p.x, p.y + 2, 44, 18, 0, 0, TAU); c.fill();
    // a fallen cow's rib cage
    const rb = new Path2D();
    for (let k = 0; k < 5; k++) { const x = p.x - 22 + k * 7; rb.moveTo(x, p.y + 6); rb.quadraticCurveTo(x - 6, p.y - 6, x + 2, p.y - 12); }
    rb.moveTo(p.x - 26, p.y + 7); rb.lineTo(p.x + 12, p.y + 7);
    c.lineCap = 'round'; c.strokeStyle = '#231c16'; c.lineWidth = 4; c.stroke(rb); c.strokeStyle = '#a49a80'; c.lineWidth = 2; c.stroke(rb); c.lineCap = 'butt';
    bonesAt(c, Z, p.x + 8, p.y + 4, 6, p.mx * 7 + p.my);
    cowSkull(c, p.x + 30, p.y - 2, .9);
  };
  const drawRStone = (c, Z, p) => {
    c.fillStyle = 'rgba(30,14,12,.5)'; c.beginPath(); c.ellipse(p.x, p.y + 2, 38, 15, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(90,24,18,.55)'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(p.x, p.y + 2, 30, 11, 0, 0, TAU); c.stroke();
    monolith(c, p.x, p.y, 48 + p.w * 14, (p.v - .5) * 6);
    cowSkull(c, p.x + 22, p.y + 8, .55);
    bonesAt(c, Z, p.x - 18, p.y + 8, 3, p.mx + p.my * 3);
  };
  const drawRuin = (c, Z, p) => {
    warm(c, p.x + 40, p.y - 10, 120, .16);
    shadow(c, p.x - 10, p.y + 12, 80, 18, .25);
    const hs = [36 + p.v * 30, 22 + p.w * 22, 12 + p.v * 10];
    let x = p.x - 76;
    for (let i = 0; i < 3; i++) {
      const w = [42, 34, 26][i];
      box(c, x, p.y - 8, w, 16, hs[i], STONE);
      const cr = new Path2D(); for (let yy = 8; yy < hs[i]; yy += 10) { cr.moveTo(x, p.y + 8 - yy); cr.lineTo(x + w, p.y + 8 - yy); }
      for (let yy = 0; yy < hs[i] - 4; yy += 10) { const jx = x + 8 + ((yy / 10) % 2) * 12; cr.moveTo(jx, p.y + 8 - yy); cr.lineTo(jx, p.y - 2 - yy); }
      c.strokeStyle = 'rgba(36,30,24,.6)'; c.lineWidth = 1; c.stroke(cr);
      x += w + 2 + i * 6;
    }
    for (let k = 0; k < 5; k++) { const rx = p.x - 70 + Z.hash(p.mx + k, p.my * 3) * 120, ry = p.y + 14 + Z.hash(p.mx * 3, p.my + k) * 16, s = 5 + k % 3 * 3; box(c, rx, ry, s, s * .7, s * .6, STONE2); }
    // torch post
    const tx = p.x + 40, ty = p.y + 2;
    shadow(c, tx + 3, ty + 2, 8, 3);
    c.lineCap = 'round'; c.strokeStyle = '#1e160e'; c.lineWidth = 5.4; c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx, ty - 42); c.stroke();
    c.strokeStyle = '#6a4c30'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#2a2018'; c.fillRect(tx - 4, ty - 46, 8, 5); c.lineCap = 'butt';
  };
  const DRAW = { [HAYB]: drawHayB, [HAYP]: drawHayP, [FENCE]: drawFence, [CART]: drawCart, [BONES]: drawBones, [RSTONE]: drawRStone, [RUIN]: drawRuin };

  // Landmark: a collapsed barn (faded oxblood planks) or a stone farmhouse with a lone chimney.
  const drawFarm = (c, Z, p) => {
    const barn = p.v < .55, P = barn ? BARN : STONE, fx = p.x - 150, fy = p.y - 95, Wd = 300, D = 190;
    warm(c, p.x - 52, fy + D + 10, 130, .14);
    // dirt and straw floor inside the shell
    c.fillStyle = 'rgba(16,8,12,.28)'; c.fillRect(fx - 10, fy - 4, Wd + 26, D + 22);
    c.fillStyle = barn ? '#4e3e2a' : '#4a4234'; c.fillRect(fx, fy, Wd, D);
    const fl = new Path2D(); for (let k = 0; k < 40; k++) { const x = fx + 10 + Z.hash(p.bx * 3 + k, p.by - k) * (Wd - 20), y = fy + 10 + Z.hash(k * 7, p.bx + p.by) * (D - 20); fl.moveTo(x, y); fl.lineTo(x + 7, y + (Z.hash(k, 3) - .5) * 4); }
    c.strokeStyle = barn ? '#7a6840' : '#5e5444'; c.lineWidth = 1.2; c.stroke(fl);
    // back wall: broken run of segments, one fallen
    const gapI = 1 + ((p.w * 3) | 0);
    for (let i = 0; i < 5; i++) {
      const x = fx + i * 60, hgt = 34 + Z.hash(p.bx * 5 + i, p.by * 3) * 50;
      if (i === gapI) { for (let k = 0; k < 3; k++) box(c, x + 6 + k * 16, fy - 6 + k * 5, 14, 9, 7, P); continue; }
      box(c, x, fy - 10, 60, 10, hgt, P);
      const ln = new Path2D();
      if (barn) for (let k = 6; k < 60; k += 10) { ln.moveTo(x + k, fy - hgt + 10); ln.lineTo(x + k, fy); }
      else for (let yy = 10; yy < hgt; yy += 11) { ln.moveTo(x, fy - yy); ln.lineTo(x + 60, fy - yy); }
      c.strokeStyle = barn ? 'rgba(40,16,12,.6)' : 'rgba(36,30,24,.6)'; c.lineWidth = 1; c.stroke(ln);
    }
    if (!barn) { box(c, fx + 26, fy - 22, 30, 20, 118, STONE2); c.fillStyle = '#1a1410'; c.fillRect(fx + 31, fy - 140, 20, 10); }
    // side walls
    box(c, fx - 10, fy, 10, D, 44, P);
    box(c, fx + Wd, fy, 10, 84, 52, P);
    for (let k = 0; k < 4; k++) box(c, fx + Wd + 4 + k * 6, fy + 100 + k * 18, 12, 8, 6, P);
    // collapsed roof timbers, strewn planks, and a mound of old hay or a hearth
    const bm = new Path2D();
    bm.moveTo(fx + 20, fy + 30); bm.lineTo(fx + 210, fy + 150);
    bm.moveTo(fx + 90, fy + 10); bm.lineTo(fx + 270, fy + 70);
    bm.moveTo(fx + 160, fy + 170); bm.lineTo(fx + 280, fy + 110);
    c.lineCap = 'round'; c.strokeStyle = '#1c140e'; c.lineWidth = 11; c.stroke(bm); c.strokeStyle = '#5a4632'; c.lineWidth = 7; c.stroke(bm);
    const pk = new Path2D();
    for (let k = 0; k < 9; k++) { const x = fx + 30 + Z.hash(p.bx + k * 3, p.by * 7) * 240, y = fy + 30 + Z.hash(p.bx * 7, p.by + k * 5) * 140, a = Z.hash(k, p.bx) * 3; pk.moveTo(x, y); pk.lineTo(x + Math.cos(a) * 24, y + Math.sin(a) * 10); }
    c.strokeStyle = '#211810'; c.lineWidth = 6; c.stroke(pk); c.strokeStyle = barn ? '#6e3a2c' : '#6a5a46'; c.lineWidth = 3.6; c.stroke(pk); c.lineCap = 'butt';
    if (barn) { c.save(); drawHayP(c, Z, { x: fx + 70, y: fy + 120, mx: p.bx, my: p.by, w: .9 }); c.restore(); }
    else { c.fillStyle = '#231a14'; c.fillRect(fx + 30, fy + 4, 30, 14); c.fillStyle = '#3a2a1e'; c.fillRect(fx + 34, fy + 7, 22, 8); }
    cowSkull(c, fx + 200, fy + 130, .8);
    // front wall stubs either side of the doorway
    box(c, fx, fy + D - 6, 80, 10, 24, P);
    box(c, fx + 220, fy + D - 6, 80, 10, 16, P);
    // lone torch post by the doorway
    const tx = p.x - 52, ty = fy + D + 12;
    c.lineCap = 'round'; c.strokeStyle = '#1e160e'; c.lineWidth = 5.4; c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx, ty - 46); c.stroke();
    c.strokeStyle = '#6a4c30'; c.lineWidth = 3; c.stroke(); c.fillStyle = '#2a2018'; c.fillRect(tx - 4, ty - 50, 8, 5); c.lineCap = 'butt';
  };
  // Landmark: a trampled ring of standing stones around an altar with a cow skull.
  const drawCircle = (c, Z, p) => {
    const x = p.x, y = p.y;
    const g = c.createRadialGradient(x, y, 10, x, y, 230); g.addColorStop(0, 'rgba(40,12,12,.55)'); g.addColorStop(.6, 'rgba(36,16,14,.25)'); g.addColorStop(1, 'rgba(30,16,14,0)');
    c.save(); c.translate(x, y); c.scale(1, .7); c.translate(-x, -y); c.fillStyle = g; c.fillRect(x - 230, y - 230, 460, 460); c.restore();
    c.strokeStyle = 'rgba(58,44,30,.6)'; c.lineWidth = 28; c.beginPath(); c.ellipse(x, y, 172, 118, 0, 0, TAU); c.stroke();
    const hp = new Path2D(); // hoof prints worn into the ring
    for (let k = 0; k < 60; k++) { const a = k / 60 * TAU + Z.hash(k, p.bx) * .05, rr = 1 + (Z.hash(k * 3, p.by) - .5) * .12, hx = x + Math.cos(a) * 172 * rr, hy = y + Math.sin(a) * 118 * rr; ell(hp, hx - 1.6, hy, 1.4, 2); ell(hp, hx + 1.6, hy, 1.4, 2); }
    c.fillStyle = '#2a1f15'; c.fill(hp);
    const rg = new Path2D(); ell(rg, x, y, 92, 62); ell(rg, x, y, 80, 54);
    const st = circleStones(Z, p);
    for (const s of st) { rg.moveTo(x + (s.x - x) * .47, y + (s.y - y) * .47); rg.lineTo(x + (s.x - x) * .8, y + (s.y - y) * .8); }
    c.strokeStyle = '#4e1612'; c.lineWidth = 2.6; c.stroke(rg);
    const back = st.filter(s => s.y < y).sort((a, b) => a.y - b.y), front = st.filter(s => s.y >= y).sort((a, b) => a.y - b.y);
    const stone = s => { if (s.fallen) { shadow(c, s.x + 4, s.y + 6, 30, 9); box(c, s.x - 26, s.y - 6, 52, 14, 11, STONE2); } else monolith(c, s.x, s.y, s.H, (s.h - .5) * 8); };
    for (const s of back) stone(s);
    // altar slab, blood-stained, with the herd's trophy on top
    shadow(c, x + 6, y + 18, 40, 11);
    box(c, x - 30, y - 6, 60, 26, 16, STONE);
    c.fillStyle = 'rgba(80,14,12,.6)'; c.beginPath(); c.ellipse(x + 8, y - 14, 12, 5, .2, 0, TAU); c.fill();
    cowSkull(c, x - 6, y - 18, .85);
    for (const s of front) stone(s);
  };
  const LDRAW = { [FARM]: drawFarm, [CIRCLE]: drawCircle };

  // Muddy cattle tracks that wind through the pasture (continuous world curves).
  const PHs = 1500, PVs = 1900;
  const pathY = (k, x) => k * PHs + 260 * Math.sin(x / 700 + k * 1.7) + 70 * Math.sin(x / 260 + k * 2.9);
  const pathX = (j, y) => j * PVs + 300 * Math.sin(y / 820 + j * 2.3) + 80 * Math.sin(y / 300 + j * 1.1);
  const hasH = (Z, k) => Z.hash(k * 5 + 2, 91) < .5, hasV = (Z, j) => Z.hash(j * 3 - 7, 47) < .38;

  const ground = (Z, x0, y0, x1, y1) => {
    const c = Z.ctx;
    c.fillStyle = BG; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    // 1) organic grass mottling
    const sh = GR.map(() => new Path2D()), G = 44;
    for (let gy = Math.floor(y0 / G) - 1; gy <= Math.floor(y1 / G) + 1; gy++) for (let gx = Math.floor(x0 / G) - 1; gx <= Math.floor(x1 / G) + 1; gx++) {
      const h = Z.hash(gx * 7 + 1, gy * 13 - 3); if (h > .62) continue;
      const h2 = Z.hash(gx * 3 - 5, gy * 7 + 2);
      ell(sh[(h * 8 | 0) % 5], gx * G + h2 * G, gy * G + Z.hash(gx, gy * 3) * G, 12 + h2 * 22, 7 + h * 14, (h2 - .5) * 1.2);
    }
    for (let k = 0; k < 5; k++) { c.fillStyle = GR[k]; c.fill(sh[k]); }
    // 2) big soft patches: dark wet grass, dried reddish earth, trampled pale grass
    const G2 = 300;
    for (let gy = Math.floor((y0 - 200) / G2); gy <= Math.floor((y1 + 200) / G2); gy++) for (let gx = Math.floor((x0 - 200) / G2); gx <= Math.floor((x1 + 200) / G2); gx++) {
      const h = Z.hash(gx * 19 - 4, gy * 23 + 6); if (h > .55) continue;
      const x = gx * G2 + Z.hash(gx, gy * 5) * G2, y = gy * G2 + Z.hash(gx * 5, gy) * G2, r = 100 + Z.hash(gx * 3, gy * 7) * 150;
      const col = h < .25 ? '30,32,18' : h < .42 ? '96,54,38' : '118,104,70', a = h < .25 ? .32 : h < .42 ? .22 : .14;
      const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
      c.save(); c.translate(x, y); c.scale(1, .65); c.translate(-x, -y); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
    }
    // 3) hoof-churned mud tracks with ruts, prints and sky-tinted puddles
    const tr = new Path2D(), rut = new Path2D(), hoof = new Path2D(), pud = new Path2D(), pudL = new Path2D(), mD = new Path2D(), mL = new Path2D();
    const addTrack = (pts, seed, horiz) => {
      tr.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) tr.lineTo(pts[i][0], pts[i][1]);
      for (const o0 of [-9, 7]) for (let i = 0; i < pts.length; i++) {
        const o = o0 + 3 * Math.sin(i * .7 + seed + o0), x = pts[i][0] + (horiz ? 0 : o), y = pts[i][1] + (horiz ? o : 0);
        if (i === 0 || Z.hash(i * 5 + o0, seed) < .2) rut.moveTo(x, y); else rut.lineTo(x, y);
      }
      for (let i = 0; i < pts.length; i++) {
        const [x, y] = pts[i], h = Z.hash(seed * 7 + i, Math.round(horiz ? x : y)), h2 = Z.hash(i * 3 - seed, Math.round(horiz ? x : y) * 3);
        if (h < .55) { const ox = horiz ? (h2 - .5) * 10 : (h2 - .5) * 34, oy = horiz ? (h2 - .5) * 34 : (h2 - .5) * 10; ell(hoof, x + ox - 1.7, y + oy, 1.4, 2.1); ell(hoof, x + ox + 1.7, y + oy, 1.4, 2.1); }
        for (let q = 0; q < 2; q++) { // churned clumps and grass biting into the edges
          const hq = Z.hash(i * 11 + q * 5, seed * 3 + q), o = (hq - .5) * 52, rr = 4 + Z.hash(q * 7 - i, seed + i) * 9;
          ell(hq < .5 ? mD : mL, x + (horiz ? (h - .5) * 16 : o), y + (horiz ? o : (h - .5) * 16), rr, rr * .6, h * 3);
        }
        if (h > .965) { const rx = 14 + h2 * 16; ell(pud, x + (h2 - .5) * 10, y, rx, rx * .45); ell(pudL, x - rx * .2, y - 1.5, rx * .45, rx * .1); }
      }
    };
    for (let k = Math.floor((y0 - 400) / PHs); k <= Math.ceil((y1 + 400) / PHs); k++) {
      if (!hasH(Z, k)) continue;
      const pts = []; for (let x = Math.floor((x0 - 40) / 20) * 20; x <= x1 + 40; x += 20) pts.push([x, pathY(k, x)]);
      if (pts.some(q => q[1] > y0 - 60 && q[1] < y1 + 60)) addTrack(pts, k, true);
    }
    for (let j = Math.floor((x0 - 420) / PVs); j <= Math.ceil((x1 + 420) / PVs); j++) {
      if (!hasV(Z, j)) continue;
      const pts = []; for (let y = Math.floor((y0 - 40) / 20) * 20; y <= y1 + 40; y += 20) pts.push([pathX(j, y), y]);
      if (pts.some(q => q[0] > x0 - 60 && q[0] < x1 + 60)) addTrack(pts, j + 50, false);
    }
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = 'rgba(62,46,30,.32)'; c.lineWidth = 86; c.stroke(tr);
    c.strokeStyle = 'rgba(70,54,36,.6)'; c.lineWidth = 62; c.stroke(tr);
    c.strokeStyle = '#4a3a28'; c.lineWidth = 40; c.stroke(tr);
    c.fillStyle = '#3e2f21'; c.fill(mD); c.fillStyle = '#58462f'; c.fill(mL);
    c.strokeStyle = 'rgba(36,26,18,.45)'; c.lineWidth = 3; c.stroke(rut);
    c.fillStyle = '#2c2117'; c.fill(hoof);
    c.fillStyle = '#3a2c36'; c.fill(pud); c.fillStyle = 'rgba(140,80,110,.4)'; c.fill(pudL);
    // 4) grass tufts, dead thistles, pebbles
    const tD = new Path2D(), tL = new Path2D(), th = new Path2D(), pb = new Path2D(), G3 = 26;
    for (let gy = Math.floor(y0 / G3); gy <= Math.floor(y1 / G3); gy++) for (let gx = Math.floor(x0 / G3); gx <= Math.floor(x1 / G3); gx++) {
      const h = Z.hash(gx * 11 + 5, gy * 3 - 9), x = gx * G3 + Z.hash(gx * 5, gy * 11) * G3, y = gy * G3 + Z.hash(gx * 13, gy * 5 + 1) * G3;
      if (h < .42) { const T = h < .2 ? tD : tL; for (let b = -1; b <= 1; b++) { T.moveTo(x + b * 2, y); T.lineTo(x + b * 4 + (h - .2) * 8, y - 5 - (b === 0 ? 3 : 0)); } }
      else if (h < .435) { th.moveTo(x, y); th.lineTo(x + 1, y - 9); ell(th, x + 1, y - 10.5, 1.8, 1.8); }
      else if (h < .47) pb.rect(x, y, 2.4, 1.6);
    }
    c.lineWidth = 1.2; c.strokeStyle = '#363620'; c.stroke(tD); c.strokeStyle = '#5e5a3a'; c.stroke(tL);
    c.strokeStyle = '#3a2a2a'; c.lineWidth = 1; c.stroke(th); c.fillStyle = '#6a3448'; c.fill(th);
    c.fillStyle = '#5e584a'; c.fill(pb);
    c.lineCap = 'butt'; c.lineJoin = 'miter';
    // 5) props and landmarks near this rect, back to front
    const pad = 300, ps = [];
    for (let my = Math.floor((y0 - pad) / M); my <= Math.floor((y1 + pad) / M); my++)
      for (let mx = Math.floor((x0 - pad) / M); mx <= Math.floor((x1 + pad) / M); mx++) {
        const p = piece(Z, mx, my);
        if (p.k && p.x > x0 - pad && p.x < x1 + pad && p.y > y0 - pad && p.y < y1 + pad) ps.push({ p, f: DRAW[p.k] });
      }
    const lp = 420;
    for (let by = Math.floor((y0 - lp) / BM); by <= Math.floor((y1 + lp) / BM); by++)
      for (let bx = Math.floor((x0 - lp) / BM); bx <= Math.floor((x1 + lp) / BM); bx++) {
        const p = landmark(Z, bx, by);
        if (p.k && p.x > x0 - lp && p.x < x1 + lp && p.y > y0 - lp && p.y < y1 + lp) ps.push({ p, f: LDRAW[p.k] });
      }
    ps.sort((a, b) => a.p.y - b.p.y);
    for (const q of ps) { c.save(); q.f(c, Z, q.p); c.restore(); }
    // 6) the blood-violet sky's cast over everything
    c.fillStyle = 'rgba(96,30,56,.08)'; c.fillRect(x0, y0, x1 - x0, y1 - y0);
  };

  // nearby set-pieces with lights (shared by under and ambient)
  const nearLights = Z => {
    const P = Z.P, hw = Z.W / 2 + 160, hh = Z.H / 2 + 160, out = [];
    for (let my = Math.floor((P.y - hh) / M); my <= Math.floor((P.y + hh) / M); my++)
      for (let mx = Math.floor((P.x - hw) / M); mx <= Math.floor((P.x + hw) / M); mx++) {
        const p = piece(Z, mx, my); if (p.k === RUIN || p.k === RSTONE) for (const l of lights(Z, p, false)) out.push(l);
      }
    for (let by = Math.floor((P.y - hh - 300) / BM); by <= Math.floor((P.y + hh + 300) / BM); by++)
      for (let bx = Math.floor((P.x - hw - 300) / BM); bx <= Math.floor((P.x + hw + 300) / BM); bx++) {
        const p = landmark(Z, bx, by);
        if (p.k) { for (const l of lights(Z, p, true)) out.push(l); if (p.k === CIRCLE) out.push({ x: p.x, y: p.y - 20, kind: 2 }); }
      }
    return out.filter(l => Math.abs(l.x - P.x) < hw && Math.abs(l.y - P.y) < hh).slice(0, 24);
  };

  // ---------- Under (every frame): tall grass swaying in the wind near the hero, torch flames, flickering runes ----------
  const under = Z => {
    const c = Z.ctx, P = Z.P, t = Z.now, G = 96, hw = Z.W / 2 + 40, hh = Z.H / 2 + 40;
    const gD = new Path2D(), gL = new Path2D(), fl = new Path2D(), core = new Path2D();
    let n = 0;
    for (let gy = Math.floor((P.y - hh) / G); gy <= Math.floor((P.y + hh) / G) && n < 40; gy++)
      for (let gx = Math.floor((P.x - hw) / G); gx <= Math.floor((P.x + hw) / G) && n < 40; gx++) {
        const h = Z.hash(gx * 5 - 2, gy * 9 + 4); if (h > .3) continue;
        const x = gx * G + Z.hash(gx, gy * 7) * G, y = gy * G + Z.hash(gx * 7, gy) * G;
        const pc = piece(Z, Math.floor(x / M), Math.floor(y / M)); if (pc.k && Math.abs(x - pc.x) < 120 && Math.abs(y - pc.y) < 90) continue;
        const lm = landmark(Z, Math.floor(x / BM), Math.floor(y / BM)); if (lm.k && Math.abs(x - lm.x) < 240 && Math.abs(y - lm.y) < 190) continue;
        n++;
        const sw = Math.sin(t * 1.7 + x * .006 + y * .004) * 3 + Math.sin(t * 3.1 + h * 9) * .8;
        for (let b = -2; b <= 2; b++) { const T = b & 1 ? gD : gL; T.moveTo(x + b * 2.4, y); T.quadraticCurveTo(x + b * 3.4, y - 7, x + b * 4.4 + sw, y - 12 - (2 - Math.abs(b)) * 3); }
      }
    const L = nearLights(Z), runes = [];
    for (const l of L) {
      if (l.kind === 0) {
        const f = Math.sin(t * 11 + l.x * .03) * .5 + Math.sin(t * 23 + l.y * .05) * .3, hgt = 14 + f * 4;
        fl.moveTo(l.x - 5, l.y); fl.quadraticCurveTo(l.x - 4, l.y - hgt * .6, l.x + Math.sin(t * 8 + l.y) * 2, l.y - hgt); fl.quadraticCurveTo(l.x + 4, l.y - hgt * .6, l.x + 5, l.y); fl.closePath();
        core.moveTo(l.x - 2.4, l.y); core.quadraticCurveTo(l.x, l.y - hgt * .6, l.x + 2.4, l.y); core.closePath();
      } else if (l.kind === 1) runes.push(l);
    }
    c.save(); c.lineCap = 'round';
    c.lineWidth = 1.6; c.strokeStyle = '#3c3c24'; c.stroke(gD); c.strokeStyle = '#686440'; c.stroke(gL);
    c.fillStyle = '#ff7a26'; c.fill(fl); c.fillStyle = '#ffe2a0'; c.fill(core);
    if (runes.length) {
      const rp = new Path2D();
      for (const r of runes) RUNE(r.x, r.y, 1, rp);
      c.globalAlpha = .55 + .35 * Math.sin(t * 2.3); c.strokeStyle = '#ff3a22'; c.lineWidth = 2; c.stroke(rp);
    }
    c.restore();
  };

  // ---------- Ambient (after darkness): torch and rune glows, rising embers, drifting dust, distant red sparks ----------
  const ambient = Z => {
    const c = Z.ctx, P = Z.P, t = Z.now;
    c.save();
    for (const l of nearLights(Z)) {
      const f = Math.sin(t * 9 + l.x * .03) * .5 + Math.sin(t * 21 + l.y * .05) * .3;
      if (l.kind === 0) { Z.glow('255,130,50', 80 + f * 6, l.x, l.y - 4, .3 + f * .05); Z.glow('255,210,130', 20, l.x, l.y - 6, .7); }
      else if (l.kind === 1) Z.glow('255,40,30', 34, l.x, l.y, .3 + .2 * Math.sin(t * 2.3));
      else Z.glow('255,30,40', 100, l.x, l.y, .16 + .1 * Math.sin(t * 1.2));
    }
    const emb = new Path2D(), dust = new Path2D(), spk = new Path2D();
    for (let i = 0; i < 30; i++) { // embers rising out of the reddish haze
      const a = Z.hash(i, 3), b = Z.hash(i, 9), sp = 14 + b * 24, span = Z.H + 160;
      const yy = P.y + Z.H / 2 + 80 - md(t * sp + b * span, span), xx = P.x - Z.W / 2 - 60 + md(a * Z.W * 1.1 + Math.sin(t * .7 + i) * 18 + t * 6, Z.W + 120);
      const sz = 1.2 + (i % 3) * .6; emb.rect(xx, yy, sz, sz);
    }
    for (let i = 0; i < 22; i++) { // pale dust drifting with the wind
      const a = Z.hash(i * 3, 5), b = Z.hash(i * 7, 2), span = Z.W + 160;
      const xx = P.x - Z.W / 2 - 80 + md(t * (10 + b * 14) + a * span, span), yy = P.y - Z.H / 2 + md(b * Z.H * 1.2 + Math.sin(t * .5 + i) * 30, Z.H + 40);
      dust.rect(xx, yy, 1.6, 1.6);
    }
    // occasional distant red sparks: little bursts near the screen edge
    const win = Math.floor(t / 2.6), ph = md(t, 2.6) / 2.6;
    if (ph < .45) for (let i = 0; i < 2; i++) {
      const h = Z.hash(win * 7 + i, 13), h2 = Z.hash(win * 3 - i, 29), ang = h * TAU;
      const sx = P.x + Math.cos(ang) * Z.W * .42, sy = P.y + Math.sin(ang) * Z.H * .4, rr = 4 + ph * 30;
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + h2 * 3; spk.moveTo(sx + Math.cos(a) * rr * .5, sy + Math.sin(a) * rr * .5); spk.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); }
      Z.glow('255,50,30', 28, sx, sy, .5 * (1 - ph / .45));
    }
    c.globalAlpha = .7; c.fillStyle = '#ff6a2a'; c.fill(emb);
    c.globalAlpha = .28; c.fillStyle = '#d8c8a0'; c.fill(dust);
    c.globalAlpha = cl(.9 * (1 - ph / .45), 0, 1); c.strokeStyle = '#ff4a2a'; c.lineWidth = 1.4; c.stroke(spk);
    c.restore();
  };

  // ---------- Events ----------
  const calfAt = Z => {
    const a = Math.random() * TAU, k = Z.spawn('calf', Z.P.x + Math.cos(a) * 300, Z.P.y + Math.sin(a) * 300);
    if (k) Z.burst(k.x, k.y, '#ffe27a', 12, 90);
    Z.banner('A golden calf jingles nearby…', '#ffe27a', false); Z.sfx('star');
  };
  const events = [
    { t: 6, run(Z) { Z.banner('Moo.', '#e0cfa0', true); Z.sfx('warn'); const a = Math.random() * TAU; herd(Z, 'cow', 5, 430, a); herd(Z, 'cow', 5, 450, a + 2.2); } },
    { t: 22, run(Z) { Z.banner('Champions of the herd approach!', '#ffcf40', false); Z.sfx('warn'); herd(Z, 'champ', 5, 420); } },
    { t: 38, run: calfAt },
    { t: 58, run(Z) { Z.banner('A stampede thunders across the pasture!', '#ff6a40', true); stampede(Z, 9); } },
    { t: 78, run(Z) {
      Z.banner('The herd grows restless…', '#d8b8a0', false); Z.sfx('warn');
      const a = Math.random() * TAU; herd(Z, 'cow', 6, 440, a);
      for (let i = 0; i < 2; i++) Z.spawn('bull', Z.P.x + Math.cos(a + 1.6 + i * .5) * 420, Z.P.y + Math.sin(a + 1.6 + i * .5) * 420);
    } },
    { t: 92, run: calfAt },
    { t: 108, run(Z) { // surrounded on every side
      Z.banner('MOOOOOO!', '#ff3a20', true); Z.sfx('boss'); Z.shake(6);
      const a0 = Math.random() * TAU, hid = HID++;
      for (let i = 0; i < 10; i++) { const a = a0 + i / 10 * TAU, k = Z.spawn(i % 5 === 0 ? 'champ' : 'cow', Z.P.x + Math.cos(a) * 400, Z.P.y + Math.sin(a) * 400); if (k) { k.lead = false; k.packed = true; k.hid = hid; } }
    } },
    { t: 126, run(Z) { Z.banner('A stampede thunders across the pasture!', '#ff6a40', true); stampede(Z, 9); } },
    { t: 132, run(Z) { Z.banner('Champions of the herd approach!', '#ffcf40', false); herd(Z, 'champ', 4, 420); herd(Z, 'cow', 5, 440); } },
  ];

  // ---------- Music: original eerie pastoral in D minor, 90 bpm, fingerpicked nylon over a low drone ----------
  const CH = { Dm: [38, 50, 57, 62, 65], Ds: [38, 50, 57, 62, 64], Bb: [34, 46, 53, 58, 62], A: [33, 45, 52, 57, 61], F: [29, 41, 48, 53, 57], Gm: [31, 43, 50, 55, 58], Eb: [39, 46, 51, 55, 58] };
  const PROG = ['Dm', 'Ds', 'Bb', 'A', 'Dm', 'F', 'Gm', 'A', 'Bb', 'Gm', 'Dm', 'Eb', 'Dm', 'Bb', 'Gm', 'A'];
  const ARP = [0, 2, 3, 1, 0, 3, 2, 1];
  const SC = [0, 2, 3, 5, 7, 8, 10], _ = null;
  const MEL = [
    [4, _, 5, _, 6, _, 5, 4, 2, _, _, _, 4, _, _, _],
    [7, _, _, 6, 4, _, 5, _, 3, _, 2, _, 0, _, _, _],
    [7, _, 9, _, 8, _, 7, _, 5, _, 6, _, 4, _, _, _],
    [2, _, 3, _, 4, _, 1, _, 0, _, _, _, _, _, _, _],
  ];
  const MORD = [-1, 0, 1, -1, 2, 3, 0, 3];
  const deg = i => 62 + SC[md(i, 7)] + 12 * Math.floor(i / 7);
  const music = {
    bpm: 90, div: 4,
    step(s, t, A) {
      const spb = 60 / 90 / 4, st = s % 16, bar = Math.floor(s / 16) % 16, pass = Math.floor(s / 256), ch = PROG[bar], C = CH[ch], boss = A.boss, inten = A.inten || 0;
      // low ominous drone and a hollow fifth
      if (st === 0 && bar % 4 === 0) {
        A.tone(t, 38, spb * 64, boss ? .05 : .04, { type: 'sawtooth', cutoff: 210, attack: 1 });
        A.pad([50, 57], t, spb * 64, .011, { type: 'triangle', cutoff: 700, q: 2, detune: 8 });
      }
      if (st === 0 && bar % 8 === 0) A.noise(t, spb * 32, .012, { type: 'bandpass', f: 500, q: 1.5, f2: 1200 }); // wind over the field
      // bass
      if (st === 0) A.tone(t, C[0], spb * 15, .055, { type: 'triangle', cutoff: 420 });
      if (st === 8 && bar % 2 === 1 && !boss) A.tone(t, C[0] + 7, spb * 7, .035, { type: 'triangle', cutoff: 380 });
      // fingerpicked nylon arpeggio on the eighths
      if (st % 2 === 0) { const i = st / 2; A.pluck(C[1 + ARP[i]], t, (i === 0 ? .5 : .3) + (boss ? .08 : 0)); }
      if (st === 15 && bar % 4 === 3) A.pluck(C[4] + 2, t, .22);
      // sparse melody with a ghost echo
      const ph = MORD[Math.floor(bar / 2) % 8];
      if (ph >= 0 && st % 2 === 0) {
        const n = MEL[ph][(bar % 2) * 8 + st / 2];
        if (n !== null) {
          let m = deg(n); if (ch === 'Eb' && md(m - 62, 12) === 2) m -= 1;
          A.pluck(m, t, .55); A.pluck(m, t + spb * 6, .14);
          if (boss) A.tone(t, m, spb * 3, .03, { type: 'sawtooth', cutoff: 1800, vib: .3 });
        }
      }
      if (st === 0 && bar % 4 === 2) A.bell(74 + (bar % 8 === 6 ? 3 : 0), t, .03);
      // a lonely, distant "moo": a filtered saw sliding down, once per loop
      if (!boss && bar === 5 && st === 8) {
        A.tone(t, 47, 1.8, .03, { type: 'sawtooth', glide: 40, cutoff: 600, sweep: 260, vib: .4, attack: .15 });
        A.tone(t, 59, 1.6, .012, { type: 'triangle', glide: 52, cutoff: 900, sweep: 400, attack: .2 });
      }
      if (!boss) {
        // hand percussion: frame drum, woody knock, shaker
        if (st === 0) A.tom(t, 88, .22);
        if (st === 10) A.tom(t, 96, .16);
        if (st === 6 && bar % 2 === 1) A.tom(t, 180, .09);
        if (st % 4 === 2) A.noise(t, .06, .014, { type: 'highpass', f: 6000 });
        if (inten > .5 && st === 8) A.kick(t, .4);
        if (pass % 2 === 1 && bar === 13 && st === 4) A.tone(t, 45, 1.4, .022, { type: 'sawtooth', glide: 41, cutoff: 500, sweep: 240, vib: .3, attack: .2 });
        return;
      }
      // battle: galloping distorted bass, pounding drums, dramatic stabs
      if (st === 0 || st === 8) A.kick(t, .75);
      if (st === 14 && bar % 2 === 1) A.kick(t, .5);
      if (st === 4 || st === 12) A.snare(t, .3);
      if (st % 4 !== 1) A.tone(t, C[0] + 12, spb * .9, .045, { type: 'sawtooth', cutoff: 900, q: 5, decay: true });
      if (st % 2 === 1) A.hat(t, .035, false);
      if (st === 14) A.hat(t, .04, true);
      if ((st === 0 || st === 10) && bar % 2 === 0) A.pad([C[2] + 12, C[4] + 12], t, spb * 2, .026, { type: 'sawtooth', cutoff: 2000, q: 1.5, detune: 14 });
      if (bar % 4 === 3 && st >= 12) A.tom(t, 160 - (st - 12) * 25, .32);
    },
  };

  return {
    id: 'cow', name: 'There is no cow level', nod: 'Diablo II', portal: '220,40,40', bg: BG, dark: .5, dim: .16,
    ground, under, ambient,
    mix: { cow: 6, bull: 1.1, champ: .55 },
    target: 1,
    foes: { cow, champ, bull, calf },
    boss, events, music,
  };
})());
