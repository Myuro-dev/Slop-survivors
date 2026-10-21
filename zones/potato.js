// Zone potato: a plain, open alien arena overrun by waves of blobby aliens. Flat dusty olive soil with faint mottles,
// tiny pebbles and alien grass tufts, and only a few scattered props: small alien fruit trees, rocks, slime puddles and
// glowing green material crystals. Mostly empty ground, like the arena it honours. A nod to Brotato.
ZONES.push((() => {
  const TAU = Math.PI * 2, PI = Math.PI, fl = Math.floor, K = 1 / 1.3; // K: undo the engine's 1.3x foe scale for world-true telegraphs
  const W = (w, c) => (w ? '#fff' : c);
  const circ = (p, x, y, r) => { if (!(r > 0)) return; p.moveTo(x + r, y); p.arc(x, y, r, 0, TAU); };
  const ell = (p, x, y, rx, ry) => { if (!(rx > 0) || !(ry > 0)) return; p.moveTo(x + rx, y); p.ellipse(x, y, rx, ry, 0, 0, TAU); };
  const ellR = (p, x, y, rx, ry, a) => { if (!(rx > 0) || !(ry > 0)) return; p.moveTo(x + Math.cos(a) * rx, y + Math.sin(a) * rx); p.ellipse(x, y, rx, ry, a, 0, TAU); };
  const poly = (p, a) => { p.moveTo(a[0], a[1]); for (let i = 2; i < a.length; i += 2) p.lineTo(a[i], a[i + 1]); p.closePath(); };
  const cl01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
  const face = (c, e) => { const f = Math.cos(e.ang) < 0 ? -1 : 1; c.scale(f, 1); return f; };

  /* ================= Map: a plain arena floor =================
     The ground is flat dusty olive soil. Each 360px prop cell holds at most one small prop (most hold none): an
     alien fruit tree, a rock, a slime puddle or a material crystal cluster. Everything is deterministic from Z.hash. */
  const PC = 360, SOIL = '#898a63';
  const TREE = 1, ROCK = 2, SLIME = 3, CRYS = 4;
  const propAt = (Z, gx, gy) => {
    const h = Z.hash(gx * 37 + 11, gy * 53 - 7);
    if (h > .17) return null;
    const k = h < .05 ? TREE : h < .09 ? ROCK : h < .12 ? SLIME : CRYS;
    const hx = Z.hash(gx * 5 - 3, gy * 7 + 9), hy = Z.hash(gx * 11 + 2, gy * 3 - 4), v = Z.hash(gx * 19 + 6, gy * 23 + 1);
    const f = { k, x: gx * PC + 60 + hx * (PC - 120), y: gy * PC + 60 + hy * (PC - 120), v };
    if (k === TREE) f.s = .8 + v * .2;
    else if (k === ROCK) f.s = 8 + v * 10;
    else if (k === SLIME) { f.rx = 20 + v * 16; f.ry = 10 + v * 6; f.p = v * TAU; }
    else f.n = 3 + fl(v * 2);
    return f;
  };
  const propsIn = (Z, x0, y0, x1, y1) => {
    const out = [];
    for (let gy = fl(y0 / PC); gy <= fl(y1 / PC); gy++) for (let gx = fl(x0 / PC); gx <= fl(x1 / PC); gx++) { const f = propAt(Z, gx, gy); if (f) out.push(f); }
    return out;
  };

  /* ================= Floor art (cached) ================= */
  const drawSoil = (c, Z, x0, y0, x1, y1) => {
    c.fillStyle = SOIL; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    // very soft, large, low-contrast mottles
    const G1 = 220, mD = new Path2D(), mL = new Path2D();
    for (let gy = fl((y0 - 200) / G1); gy <= fl((y1 + 200) / G1); gy++) for (let gx = fl((x0 - 200) / G1); gx <= fl((x1 + 200) / G1); gx++) {
      const hh = Z.hash(gx * 17 + 3, gy * 23 - 7), x = gx * G1 + Z.hash(gx, gy * 3 + 1) * G1, y = gy * G1 + Z.hash(gx * 3 + 2, gy) * G1;
      if (hh < .25) ell(mD, x, y, 90 + hh * 300, 55 + hh * 170);
      else if (hh > .8) ell(mL, x, y, 70 + (hh - .8) * 400, 45 + (hh - .8) * 220);
    }
    c.fillStyle = 'rgba(120,122,86,.22)'; c.fill(mD);
    c.fillStyle = 'rgba(158,158,118,.18)'; c.fill(mL);
    // sparse grit, a few tiny pebbles and small alien grass tufts
    const G = 64, g1 = new Path2D(), pb = new Path2D(), ph = new Path2D(), tT = new Path2D(), tL = new Path2D();
    for (let gy = fl(y0 / G); gy <= fl(y1 / G); gy++) for (let gx = fl(x0 / G); gx <= fl(x1 / G); gx++) {
      const hh = Z.hash(gx * 7 + 1, gy * 13 + 2), h2 = Z.hash(gx * 3 - 4, gy * 5 + 7), x = gx * G + h2 * G, y = gy * G + hh * G;
      if (hh < .45) g1.rect(gx * G + (1 - h2) * G, gy * G + (1 - hh) * G, 2, 1.5);
      if (hh < .05) { ell(pb, x, y, 2 + hh * 30, 1.4 + hh * 20); ell(ph, x - .8, y - .8, 1 + hh * 12, .6 + hh * 8); }
      else if (hh < .085) { const p = hh < .07 ? tT : tL; p.moveTo(x - 3, y); p.quadraticCurveTo(x - 5, y - 4, x - 6, y - 7); p.moveTo(x, y); p.lineTo(x + h2 * 2, y - 8); p.moveTo(x + 3, y); p.quadraticCurveTo(x + 5, y - 4, x + 7, y - 6); }
    }
    c.fillStyle = '#7f805c'; c.fill(g1);
    c.fillStyle = '#76745a'; c.fill(pb); c.fillStyle = '#9c9a80'; c.fill(ph);
    c.lineCap = 'round';
    c.strokeStyle = '#6c8a6c'; c.lineWidth = 1.6; c.stroke(tT);
    c.strokeStyle = '#8e8498'; c.lineWidth = 1.6; c.stroke(tL);
    c.lineCap = 'butt';
  };

  // ---- the few raised props ----
  const shadow = (c, x, y, rx, ry) => { const s = new Path2D(); ell(s, x, y, rx, ry); c.fillStyle = 'rgba(52,48,26,.28)'; c.fill(s); };
  const TC = [[0, -112, 40], [-34, -94, 30], [34, -96, 30], [-18, -132, 27], [20, -130, 27], [0, -84, 28]];
  const drawTree = (c, f) => {
    const x = f.x, y = f.y, s = f.s;
    shadow(c, x + 26 * s, y + 4, 64 * s, 17 * s);
    const tr = new Path2D(); tr.moveTo(x - 8 * s, y); tr.quadraticCurveTo(x - 2 * s, y - 40 * s, x - 10 * s, y - 80 * s); tr.lineTo(x + 6 * s, y - 84 * s); tr.quadraticCurveTo(x + 8 * s, y - 40 * s, x + 9 * s, y); tr.closePath();
    poly(tr, [x - 8 * s, y, x - 18 * s, y + 3, x - 6 * s, y - 6 * s]); poly(tr, [x + 8 * s, y, x + 18 * s, y + 2, x + 6 * s, y - 6 * s]);
    c.fillStyle = '#7a5a3c'; c.fill(tr); c.strokeStyle = '#3e2c1a'; c.lineWidth = 1.3; c.stroke(tr);
    const dk = new Path2D(), cn = new Path2D(), hi = new Path2D(), fr = new Path2D(), fh = new Path2D();
    for (const [dx, dy, r] of TC) { circ(dk, x + dx * s + 3, y + dy * s + 5, r * s); circ(cn, x + dx * s, y + dy * s, r * s); circ(hi, x + (dx - r * .3) * s, y + (dy - r * .35) * s, r * .5 * s); }
    for (let i = 0; i < 7; i++) { const a = i * 2.3 + f.v * 6, d = (16 + (i % 3) * 14) * s, fx = x + Math.cos(a) * d * 1.3, fy = y - 104 * s + Math.sin(a) * d; circ(fr, fx, fy, 5.2 * s); circ(fh, fx - 1.6 * s, fy - 1.6 * s, 1.6 * s); }
    c.fillStyle = '#3e6450'; c.fill(dk);
    c.strokeStyle = '#2a4636'; c.lineWidth = 1.4; c.stroke(cn); c.fillStyle = '#58876a'; c.fill(cn);
    c.fillStyle = '#74a47e'; c.fill(hi);
    c.fillStyle = '#e2744c'; c.fill(fr); c.strokeStyle = '#7a3020'; c.lineWidth = 1; c.stroke(fr); c.fillStyle = '#ffc09a'; c.fill(fh);
    const dr = new Path2D(); circ(dr, x + 30 * s, y + 6, 5); circ(dr, x - 22 * s, y + 9, 4.6); c.fillStyle = '#c86444'; c.fill(dr);
  };
  const drawSlime = (c, f) => {
    const x = f.x, y = f.y, n = 22, mk = (o) => { const p = new Path2D(); for (let i = 0; i < n; i++) { const t = i / n * TAU, k = 1 + .14 * Math.sin(3 * t + f.p) + .08 * Math.sin(5 * t + f.p * 2), px = x + Math.cos(t) * (f.rx * k + o), py = y + Math.sin(t) * (f.ry * k + o * .5); if (i) p.lineTo(px, py); else p.moveTo(px, py); } p.closePath(); return p; };
    c.fillStyle = '#5e7a3a'; c.fill(mk(5));
    const top = mk(0);
    c.fillStyle = '#7cb846'; c.fill(top);
    c.strokeStyle = '#3e6a24'; c.lineWidth = 1.2; c.stroke(top);
    const hi = new Path2D(); ell(hi, x - f.rx * .35, y - f.ry * .3, f.rx * .3, f.ry * .22); ell(hi, x + f.rx * .3, y + f.ry * .2, f.rx * .12, f.ry * .1);
    c.fillStyle = '#b4e878'; c.fill(hi);
  };
  const drawCrys = (c, f) => {
    const x = f.x, y = f.y;
    shadow(c, x + 3, y + 1, 14, 4);
    const sh = new Path2D(), lt = new Path2D();
    for (let i = 0; i < f.n; i++) {
      const a = (i - (f.n - 1) / 2) * .38 + (f.v - .5) * .3, hh = 18 - Math.abs(i - (f.n - 1) / 2) * 5 + f.v * 4, w = 4.5, bx = x + (i - (f.n - 1) / 2) * 6;
      const tx = bx + Math.sin(a) * hh, ty = y - Math.cos(a) * hh, mx = bx + Math.sin(a) * hh * .55, my = y - Math.cos(a) * hh * .55, px = Math.cos(a) * w, py = Math.sin(a) * w;
      poly(sh, [bx, y, mx + px, my + py, tx, ty, mx - px, my - py]);
      poly(lt, [bx, y, tx, ty, mx - px, my - py]);
    }
    c.fillStyle = '#4cc874'; c.fill(sh); c.fillStyle = '#a4f2bc'; c.fill(lt);
    c.strokeStyle = '#1f6a3c'; c.lineWidth = 1.2; c.stroke(sh);
  };
  const drawRock = (c, f) => {
    const x = f.x, y = f.y, s = f.s;
    shadow(c, x + s * .3, y + 2, s * 1.4, s * .42);
    const b = new Path2D(), t = new Path2D();
    for (const [ox, oy, k] of [[0, 0, 1], [-.7, .2, .6], [.65, .22, .55]]) { const rx = s * k, ry = s * k * .78, cx = x + ox * s, cy = y + oy * s - ry * .55; ell(b, cx, cy, rx, ry); ell(t, cx - rx * .2, cy - ry * .3, rx * .6, ry * .45); }
    c.fillStyle = '#7e7c66'; c.fill(b); c.strokeStyle = '#46453a'; c.lineWidth = 1.2; c.stroke(b); c.fillStyle = '#9e9c84'; c.fill(t);
  };
  const DRAW = []; DRAW[TREE] = drawTree; DRAW[ROCK] = drawRock; DRAW[SLIME] = drawSlime; DRAW[CRYS] = drawCrys;

  const ground = (Z, x0, y0, x1, y1) => {
    const c = Z.ctx;
    drawSoil(c, Z, x0, y0, x1, y1);
    // props whose art can reach into this rect (trees rise ~150px above their base)
    const list = propsIn(Z, x0 - 120, y0 - 60, x1 + 120, y1 + 180);
    list.sort((p, q) => (q.k === SLIME) - (p.k === SLIME) || p.y - q.y); // flat puddles first, then by depth
    c.lineJoin = 'round';
    for (const f of list) DRAW[f.k](c, f);
    c.lineJoin = 'miter';
  };

  /* ================= Under (animated, before foes): just a few slime bubbles near the hero ================= */
  const under = Z => {
    const c = Z.ctx, P = Z.P, now = Z.now, hw = Z.W / 2 + 60, hh = Z.H / 2 + 60;
    const sb = new Path2D(), sp = new Path2D();
    let any = false;
    for (const f of propsIn(Z, P.x - hw, P.y - hh, P.x + hw, P.y + hh)) {
      if (f.k !== SLIME) continue;
      any = true;
      for (let j = 0; j < 3; j++) {
        const p = (now * .7 + j * .33 + f.v * 3) % 1, a = j * 2.1 + f.v * 6, bx = f.x + Math.cos(a) * f.rx * .5, by = f.y + Math.sin(a) * f.ry * .45, r = 1.2 + p * 4;
        if (p < .86) circ(sb, bx, by, r); else circ(sp, bx, by, r + (p - .86) * 30);
      }
    }
    if (!any) return;
    c.fillStyle = 'rgba(206,250,150,.75)'; c.fill(sb); c.strokeStyle = '#4e8a2c'; c.lineWidth = 1; c.stroke(sb);
    c.strokeStyle = 'rgba(220,255,170,.8)'; c.lineWidth = 1.2; c.stroke(sp);
  };

  /* ================= Transient visuals: goo lobs, falling crates and fruit (a cosmetic cache keyed on Z.t) ================= */
  const fx = [];
  const addFx = o => { if (fx.length > 80) fx.shift(); fx.push(o); };
  const lob = (Z, sx, sy, tx, ty, T) => addFx({ k: 'goo', sx, sy, tx, ty, t0: Z.t, T, H: 80 + Math.hypot(tx - sx, ty - sy) * .3 });
  const drop = (Z, x, y, T, k) => addFx({ k, sx: x, sy: y - 560, tx: x, ty: y, t0: Z.t, T, H: 0, spin: Math.random() * TAU });
  const drawFx = (c, Z) => {
    const t = Z.t;
    for (let i = fx.length - 1; i >= 0; i--) { const o = fx[i]; if (t > o.t0 + o.T + .6 || t < o.t0 - 1) fx.splice(i, 1); }
    const gb = new Path2D(), gt = new Path2D(), gs = new Path2D(), fr = new Path2D(), lf = new Path2D();
    for (const o of fx) {
      const k = (t - o.t0) / o.T;
      if (k > 1) { if (!o.done) { o.done = true; Z.burst(o.tx, o.ty, o.k === 'goo' ? '#a8f040' : o.k === 'crate' ? '#c7a066' : '#e2744c', 10, 110); } continue; }
      if (k < 0) continue;
      ell(gs, o.tx, o.ty, 4 + k * 8, 2 + k * 3);
      if (o.k === 'goo') {
        const pos = u => [o.sx + (o.tx - o.sx) * u, o.sy + (o.ty - o.sy) * u - Math.sin(u * PI) * o.H];
        const [x, y] = pos(k);
        circ(gb, x, y, 7);
        for (let j = 1; j <= 3; j++) { const [qx, qy] = pos(Math.max(0, k - j * .05)); circ(gt, qx, qy, 5 - j * 1.2); }
      } else if (o.k === 'crate') {
        const y = o.sy + (o.ty - o.sy) * k * k;
        c.save(); c.translate(o.tx, y - 12); c.rotate(o.spin + k * 3);
        c.fillStyle = '#b08850'; c.fillRect(-13, -13, 26, 26); c.strokeStyle = '#4a3018'; c.lineWidth = 2; c.strokeRect(-13, -13, 26, 26);
        c.fillStyle = '#5ee08a'; c.fillRect(-4, -4, 8, 8);
        c.restore();
        Z.glow('120,255,150', 26, o.tx, y - 12, .5);
      } else {
        const y = o.sy + (o.ty - o.sy) * k * k;
        circ(fr, o.tx, y, 6.5); ellR(lf, o.tx + 4, y - 7, 4, 2, -.6);
      }
    }
    c.fillStyle = 'rgba(30,40,14,.3)'; c.fill(gs);
    c.globalAlpha = .7; c.fillStyle = '#a8f040'; c.fill(gt); c.globalAlpha = 1;
    c.strokeStyle = '#3e6a14'; c.lineWidth = 1.6; c.stroke(gb); c.fillStyle = '#b6f450'; c.fill(gb);
    c.strokeStyle = '#7a3020'; c.lineWidth = 1.4; c.stroke(fr); c.fillStyle = '#e8784e'; c.fill(fr); c.fillStyle = '#6aa84a'; c.fill(lf);
  };

  /* ================= Ambient (after darkness): a few material motes, crystal glows, butterflies and gnats ================= */
  const ambient = Z => {
    const c = Z.ctx, P = Z.P, now = Z.now, hw = Z.W / 2 + 100, hh = Z.H / 2 + 100, X0 = P.x - hw, X1 = P.x + hw, Y0 = P.y - hh, Y1 = P.y + hh;
    let n = 0;
    c.save();
    // a few floating green material motes
    const G = 360, mo = new Path2D();
    for (let gy = fl(Y0 / G); gy <= fl(Y1 / G); gy++) for (let gx = fl(X0 / G); gx <= fl(X1 / G); gx++) {
      const h = Z.hash(gx * 11 + 5, gy * 7 - 3);
      if (h > .3) continue;
      const per = 5 + h * 12, ph = ((now + h * 40) % per) / per, a = Math.sin(ph * PI);
      if (a < .06) continue;
      const x = gx * G + h * G * 3 + Math.sin(now * 1.3 + h * 20) * 10, y = gy * G + Z.hash(gx, gy * 5 + 2) * G - ph * 80, s = 2 + a * 1.8;
      poly(mo, [x, y - s * 1.4, x + s, y, x, y + s * 1.4, x - s, y]);
      if (n < 20) { Z.glow('110,255,140', 8 + 7 * a, x, y, .4 * a); n++; }
    }
    c.fillStyle = '#c4ffd0'; c.fill(mo);
    // soft pulse on the few material crystals
    for (const f of propsIn(Z, X0, Y0, X1, Y1)) {
      if (f.k !== CRYS || n >= 30) continue;
      const p = .5 + .5 * Math.sin(now * 2 + f.v * 20);
      Z.glow('90,240,130', 16 + p * 8, f.x, f.y - 10, .25 + p * .2); n++;
    }
    // a few butterflies and gnat clouds
    const G2 = 640, bw = [new Path2D(), new Path2D(), new Path2D()], bb = new Path2D(), gn = new Path2D();
    for (let gy = fl(Y0 / G2); gy <= fl(Y1 / G2); gy++) for (let gx = fl(X0 / G2); gx <= fl(X1 / G2); gx++) {
      const h = Z.hash(gx * 13 + 7, gy * 17 - 3), cx = gx * G2 + 320, cy = gy * G2 + 320;
      if (h < .3) {
        const t = now * (.35 + h * .4) + h * 30, x = cx + Math.sin(t) * 150 + Math.sin(t * 2.7) * 30, y = cy + Math.sin(t * 1.3 + 1) * 90 + Math.sin(now * 3 + h * 9) * 6;
        const fp = Math.abs(Math.sin(now * 13 + h * 40)), p = bw[fl(h * 10) % 3], wx = 1 + fp * 4.5;
        ell(p, x - wx, y - 2, wx, 4); ell(p, x + wx, y - 2, wx, 4); ell(p, x - wx * .8, y + 2.5, wx * .7, 2.6); ell(p, x + wx * .8, y + 2.5, wx * .7, 2.6);
        bb.rect(x - .8, y - 4, 1.6, 8);
      }
      const h2 = Z.hash(gx * 5 - 2, gy * 3 + 11);
      if (h2 < .3) {
        const gx0 = cx + (h2 - .15) * 600, gy0 = cy + (Z.hash(gx, gy) - .5) * 300;
        for (let j = 0; j < 5; j++) { const a = now * (3 + j * .7) + j * 2.2, r = 6 + (j % 3) * 6; gn.rect(gx0 + Math.cos(a) * r + Math.sin(now * 7 + j) * 3, gy0 + Math.sin(a * 1.3) * r * .7, 1.8, 1.8); }
      }
    }
    c.fillStyle = '#f2a8d4'; c.fill(bw[0]); c.fillStyle = '#9ad6ff'; c.fill(bw[1]); c.fillStyle = '#ffe07a'; c.fill(bw[2]);
    c.strokeStyle = 'rgba(60,40,60,.5)'; c.lineWidth = .8; c.stroke(bw[0]); c.stroke(bw[1]); c.stroke(bw[2]);
    c.fillStyle = '#3a3426'; c.fill(bb);
    c.fillStyle = '#2e3a22'; c.fill(gn);
    drawFx(c, Z);
    c.restore();
  };

  /* ================= Foes ================= */
  const popOut = (Z, x, y, n, sp) => {
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + Math.random() * .5, b = Z.spawn('baby', x + Math.cos(a) * 10, y + Math.sin(a) * 10);
      if (b) { b.mode = 'pop'; b.mt = .45; b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp; }
    }
  };
  // Baby alien: a one-eyed blob with bobbly antennae that waddles straight at you in swarms.
  const BABYC = [['#9a5cf0', '#cfa8ff', '#331a5c'], ['#62cc34', '#b6f282', '#1f4a14'], ['#f0609e', '#ffb4d6', '#561634']];
  const baby = {
    hp: 9, sp: 72, dmg: 6, xp: 1, r: 10, eye: false,
    init(e) { e.col = Math.random() < .5 ? 0 : Math.random() < .6 ? 1 : 2; e.vx = 0; e.vy = 0; },
    update(e, Z) {
      const dt = Z.dt;
      if (e.mode === 'pop') {
        Z.move(e, e.vx, e.vy); e.vx *= Math.max(0, 1 - 5 * dt); e.vy *= Math.max(0, 1 - 5 * dt); e.ang = Z.angTo(e);
        if ((e.mt -= dt) <= 0) e.mode = 'walk';
        return;
      }
      const a = Z.angTo(e) + Math.sin(e.ph * 5 + e.seed) * .25, k = .7 + .5 * Math.abs(Math.sin(e.ph * 9 + e.seed));
      Z.move(e, Math.cos(a) * e.sp * k, Math.sin(a) * e.sp * k); e.ang = Z.angTo(e);
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 10, C = BABYC[e.col] || BABYC[0], OL = W(white, C[2]), st = Math.sin(e.ph * 9 + e.seed), pop = e.mode === 'pop';
      const sq = pop ? .14 * Math.sin(e.ph * 30) : st * .07, wob = Math.sin(e.ph * 7 + e.seed) * 1.5;
      c.save(); c.translate(e.x, e.y - Math.abs(st) * 1.5); c.scale(s * (1 + sq), s * (1 - sq)); face(c, e); c.rotate(st * .08);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const ft = new Path2D(); ell(ft, -4.5 + st * 1.5, 7.5, 3.4, 2.4); ell(ft, 4.5 - st * 1.5, 7.5, 3.4, 2.4);
      c.strokeStyle = OL; c.lineWidth = 1.8; c.stroke(ft); c.fillStyle = W(white, C[0]); c.fill(ft);
      const an = new Path2D(); an.moveTo(-3, -7); an.quadraticCurveTo(-5, -12, -6 + wob, -15); an.moveTo(3, -7); an.quadraticCurveTo(5, -12, 6 + wob, -15.5);
      c.lineWidth = 3.2; c.stroke(an); c.strokeStyle = W(white, C[0]); c.lineWidth = 1.6; c.stroke(an);
      const tp = new Path2D(); circ(tp, -6 + wob, -15, 2.4); circ(tp, 6 + wob, -15.5, 2.4);
      c.strokeStyle = OL; c.lineWidth = 1.4; c.stroke(tp); c.fillStyle = W(white, C[1]); c.fill(tp);
      const bd = new Path2D(); bd.moveTo(-9.5, 3); bd.bezierCurveTo(-10.5, -6, -6, -10, 0, -10); bd.bezierCurveTo(6, -10, 10.5, -6, 9.5, 3); bd.quadraticCurveTo(9, 8, 0, 8); bd.quadraticCurveTo(-9, 8, -9.5, 3); bd.closePath();
      c.lineWidth = 2; c.stroke(bd); c.fillStyle = W(white, C[0]); c.fill(bd);
      if (!white) {
        const bl = new Path2D(); ell(bl, -1, 4, 6, 2.6); ell(bl, -5, -5, 2, 1.4); c.globalAlpha = .55; c.fillStyle = C[1]; c.fill(bl); c.globalAlpha = 1;
        const blink = ((e.ph * .7 + e.seed) % 3.5) < .12;
        const ey = new Path2D(); ell(ey, 2, -2.5, 5.2, blink ? 1 : 5.6);
        c.fillStyle = '#ffffff'; c.fill(ey); c.strokeStyle = OL; c.lineWidth = 1.2; c.stroke(ey);
        if (!blink) { const ir = new Path2D(); circ(ir, 3.4, -2.2, 2.9); c.fillStyle = '#1a1028'; c.fill(ir); c.fillStyle = '#ffffff'; c.fillRect(3.5, -4.2, 1.6, 1.6); }
        const mo = new Path2D(); if (pop) ell(mo, 3, 4.6, 2, 1.6); else { mo.moveTo(-.5, 4); mo.quadraticCurveTo(2.5, 6.5, 5.5, 4); }
        c.strokeStyle = OL; c.lineWidth = 1.2; c.stroke(mo);
      }
      c.restore();
    },
    death(e, Z) { const C = BABYC[e.col] || BABYC[0]; Z.burst(e.x, e.y, C[0], 7, 80); },
  };

  // Charger: a low, red rhino-like alien with one big nose horn. Stops, paws the dirt with its lane flashing, then rams in a straight line.
  const DASH_SP = 330, DASH_T = .62;
  const charger = {
    hp: 42, sp: 56, dmg: 12, xp: 4, r: 14, eye: false,
    init(e, Z) { e.t1 = Z.rnd(1.5, 3); e.la = 0; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e);
      switch (e.mode) {
        case 'shake': Z.move(e, 0, 0); e.ang = e.la; if ((e.mt -= dt) <= 0) { e.mode = 'dash'; e.mt = DASH_T; } return;
        case 'dash': Z.move(e, Math.cos(e.la) * DASH_SP, Math.sin(e.la) * DASH_SP); e.ang = e.la; if ((e.mt -= dt) <= 0) { e.mode = 'rec'; e.mt = .7; } return;
        case 'rec': Z.move(e, 0, 0); if ((e.mt -= dt) <= 0) { e.mode = 'walk'; e.t1 = Z.rnd(2.2, 3.6); } return;
        default: {
          const a = Z.angTo(e) + Math.sin(e.ph * 2 + e.seed) * .2;
          Z.move(e, Math.cos(a) * e.sp, Math.sin(a) * e.sp); e.ang = Z.angTo(e);
          if ((e.t1 -= dt) <= 0 && d < 300 && d > 60) { e.mode = 'shake'; e.mt = .7; e.la = Z.angTo(e); Z.sfx('charge'); }
        }
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 14, m = e.mode, OL = W(white, '#4a0c14'), dash = m === 'dash', shk = m === 'shake', rec = m === 'rec';
      const st = Math.sin(e.ph * (dash ? 26 : 10) + e.seed), now = Z.now;
      c.save(); c.translate(e.x, e.y); c.scale(s, s);
      if (shk && !white) {
        const k = cl01(1 - e.mt / .7), L = DASH_SP * DASH_T * K / s;
        c.save(); c.rotate(e.la); c.globalAlpha = .12 + .3 * k; c.fillStyle = '#ff6a2a'; c.fillRect(0, -11, L, 22);
        c.globalAlpha = .5 + .4 * k; c.strokeStyle = '#ffd8a8'; c.lineWidth = 1.4; c.strokeRect(0, -11, L, 22); c.restore(); c.globalAlpha = 1;
      }
      if (shk) c.translate(Math.sin(now * 70) * 1.4, 0);
      face(c, e);
      if (dash) { c.rotate(.17); c.scale(1.08, .93); } else if (shk) c.rotate(.08 + Math.sin(now * 30) * .02);
      c.lineCap = 'round'; c.lineJoin = 'round';
      // four stubby legs; the front one paws the dirt while winding up
      const paw = shk ? Math.sin(now * 28) * 3.2 : 0, lg = new Path2D();
      for (let i = 0; i < 4; i++) {
        const bx = -10 + i * 6.5, sw = (i & 1 ? st : -st) * (dash ? 3.6 : 1.8);
        const fx = i === 3 && shk ? bx + paw : bx + sw, fy = i === 3 && shk ? 11 - Math.max(0, -paw) * .6 : 11;
        lg.moveTo(bx, 5); lg.lineTo(fx, fy);
      }
      c.strokeStyle = OL; c.lineWidth = 7; c.stroke(lg); c.strokeStyle = W(white, '#a8242a'); c.lineWidth = 4.6; c.stroke(lg);
      // stocky low body, battering-ram head with a little ear, and one big nose horn
      const bd = new Path2D(); bd.moveTo(-15, 6); bd.bezierCurveTo(-18, -5, -9, -11, 0, -10); bd.quadraticCurveTo(8, -10, 10, -4); bd.lineTo(10, 7); bd.quadraticCurveTo(-2, 10, -15, 6); bd.closePath();
      const hd = new Path2D(); ell(hd, 11, 1.5, 8.5, 7.5); ellR(hd, 4.5, -6.5, 3.6, 2, -.5);
      const hn = new Path2D(); hn.moveTo(15, -3); hn.quadraticCurveTo(19, -9, 24, -14); hn.quadraticCurveTo(23, -6, 20, -1); hn.closePath();
      c.strokeStyle = OL; c.lineWidth = 2; c.stroke(bd); c.stroke(hd); c.stroke(hn);
      c.fillStyle = W(white, '#e2463a'); c.fill(bd); c.fill(hd);
      c.fillStyle = W(white, '#f6e6c4'); c.fill(hn);
      if (!white) {
        // back stripes, belly and muzzle
        const sp = new Path2D(); poly(sp, [-12, -5, -8, -9, -7, -2]); poly(sp, [-5, -9.5, -1, -10, -1, -3]); poly(sp, [2, -9.8, 6, -8.6, 4, -3]);
        c.fillStyle = '#a8242a'; c.fill(sp);
        const be = new Path2D(); ell(be, -3, 5.5, 9, 2.6); c.fillStyle = '#ff8a6c'; c.fill(be);
        const mz = new Path2D(); ell(mz, 16.5, 4.5, 4.6, 3.8); c.fillStyle = '#ffb08e'; c.fill(mz); c.strokeStyle = OL; c.lineWidth = 1.2; c.stroke(mz);
        const ns = new Path2D(); ell(ns, 17, 3.4, .9, 1.2); ell(ns, 19.6, 3.6, .8, 1.1); c.fillStyle = '#5a1418'; c.fill(ns);
        const hs = new Path2D(); hs.moveTo(17, -3.5); hs.quadraticCurveTo(19.5, -7.5, 22, -10.5); c.strokeStyle = '#fffaf0'; c.lineWidth = 1.2; c.stroke(hs);
        // one big expressive eye: round, glaring, squinting or spiralling
        const ey = new Path2D(); ell(ey, 10, -2.5, 3.6, dash ? 2 : 4); c.fillStyle = '#ffffff'; c.fill(ey); c.strokeStyle = OL; c.lineWidth = 1.2; c.stroke(ey);
        if (rec) {
          const sv = new Path2D(); for (let i = 0; i <= 14; i++) { const a = now * 9 + i * .7, r = .3 + i * .19, x = 10 + Math.cos(a) * r, y = -2.5 + Math.sin(a) * r * 1.1; if (i) sv.lineTo(x, y); else sv.moveTo(x, y); }
          c.strokeStyle = '#2a0a0c'; c.lineWidth = .9; c.stroke(sv);
          const sr = new Path2D(); for (let i = 0; i < 3; i++) { const a = now * 6 + i * 2.1, x = 6 + Math.cos(a) * 10, y = -17 + Math.sin(a) * 3; poly(sr, [x, y - 3, x + 1, y - 1, x + 3, y, x + 1, y + 1, x, y + 3, x - 1, y + 1, x - 3, y, x - 1, y - 1]); }
          c.fillStyle = '#ffe060'; c.fill(sr);
          const tg = new Path2D(); ell(tg, 15.5, 9.5, 1.8, 2.6); c.fillStyle = '#ff7aa0'; c.fill(tg);
        } else {
          const pu = new Path2D(); circ(pu, shk ? 11.4 : 11, dash ? -2.5 : -2.2, shk ? 1.5 : dash ? 1.4 : 2.1);
          c.fillStyle = shk ? '#e01818' : '#1e0a0a'; c.fill(pu); c.fillStyle = '#ffffff'; c.fillRect(11.2, -4.4, 1.2, 1.2);
        }
        const bw = new Path2D(); if (shk || dash) { bw.moveTo(6.2, -8.2); bw.lineTo(13.5, -5.4); } else { bw.moveTo(7, -7.6); bw.quadraticCurveTo(10, -9, 13, -7.4); }
        bw.moveTo(12, 8.5); if (rec) bw.quadraticCurveTo(15, 10.5, 18, 8.4); else bw.quadraticCurveTo(15, 7.4, 18.5, 8.4);
        c.strokeStyle = OL; c.lineWidth = 1.6; c.stroke(bw);
        if (shk) { const k = (now * 3) % 1, du = new Path2D(); circ(du, 14 - k * 10, 11 - k * 3, 1.5 + k * 2.2); circ(du, 10 - k * 6, 12 - k * 1.5, 1 + k * 1.6); c.globalAlpha = .75 * (1 - k); c.fillStyle = '#c8b88a'; c.fill(du); c.globalAlpha = 1; }
        if (dash) { const sl = new Path2D(); for (let i = 0; i < 3; i++) { sl.moveTo(-18 - i * 3, -6 + i * 6); sl.lineTo(-30 - i * 4, -6 + i * 6); } c.strokeStyle = 'rgba(255,240,210,.8)'; c.lineWidth = 1.6; c.stroke(sl); }
      }
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#e2463a', 11, 100); Z.burst(e.x, e.y, '#f6e6c4', 4, 80); },
  };

  // Spitter slug: a teal slug with a magenta goo sac. Keeps its distance, inflates, then lobs a goo blob at a marked spot.
  const spitter = {
    hp: 34, sp: 50, dmg: 7, xp: 3, r: 13, eye: false,
    init(e, Z) { e.t1 = Z.rnd(1.5, 3); e.side = Math.random() < .5 ? 1 : -1; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e), a = Z.angTo(e);
      if (e.mode === 'aim') {
        Z.move(e, 0, 0); e.ang = a;
        if ((e.mt -= dt) <= 0) {
          const tx = Z.P.x + Z.rnd(-18, 18), ty = Z.P.y + Z.rnd(-18, 18), T = .95, f = Math.cos(a) < 0 ? -1 : 1;
          Z.hazard(tx, ty, { r: 44, t: T, dmg: 10, col: '170,240,60' });
          lob(Z, e.x + f * 18, e.y - 2, tx, ty, T); Z.sfx('shoot');
          e.mode = 'walk'; e.t1 = Z.rnd(2.8, 3.8);
        }
        return;
      }
      let mv = a, k = 1;
      if (d < 220) mv = a + PI; else if (d < 330) { mv = a + e.side * PI / 2; k = .5; }
      const wig = .75 + .35 * Math.sin(e.ph * 4 + e.seed);
      Z.move(e, Math.cos(mv) * e.sp * k * wig, Math.sin(mv) * e.sp * k * wig); e.ang = a;
      if ((e.t1 -= dt) <= 0 && d < 460) { e.mode = 'aim'; e.mt = .8; }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 13, aim = e.mode === 'aim', OL = W(white, '#0c3a38'), st = Math.sin(e.ph * 4 + e.seed);
      const inf = aim ? cl01(1 - e.mt / .8) : .1 + .1 * st, wob = Math.sin(e.ph * 3 + e.seed) * 1.5;
      c.save(); c.translate(e.x, e.y); c.scale(s, s); face(c, e);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const es = new Path2D(); es.moveTo(10, -5); es.quadraticCurveTo(12, -11, 13 + wob, -16); es.moveTo(5, -5); es.quadraticCurveTo(5, -11, 5 - wob, -17);
      c.strokeStyle = OL; c.lineWidth = 3.2; c.stroke(es); c.strokeStyle = W(white, '#2ac0b0'); c.lineWidth = 1.7; c.stroke(es);
      const bd = new Path2D(); bd.moveTo(-17, 7); bd.quadraticCurveTo(-19 + st, 0, -10, -4); bd.lineTo(6, -6); bd.quadraticCurveTo(17, -8, 17, 2); bd.quadraticCurveTo(15, 8, 8, 8); bd.lineTo(-14, 9); bd.closePath();
      c.strokeStyle = OL; c.lineWidth = 2; c.stroke(bd); c.fillStyle = W(white, '#26b6a6'); c.fill(bd);
      const sr = 7 * (1 + inf * .5), sac = new Path2D(); circ(sac, -4, -7 - inf * 3, sr);
      c.stroke(sac); c.fillStyle = W(white, '#e2509c'); c.fill(sac);
      const ey = new Path2D(); circ(ey, 13 + wob, -16.5, 3); circ(ey, 5 - wob, -17.5, 3);
      c.stroke(ey); c.fillStyle = '#ffffff'; c.fill(ey);
      if (!white) {
        const ft = new Path2D(); ft.moveTo(-16, 8); ft.lineTo(9, 7.5); c.strokeStyle = '#147a70'; c.lineWidth = 2.2; c.stroke(ft);
        const hi = new Path2D(); ell(hi, 2, -3, 6, 1.6); c.fillStyle = '#7aeee0'; c.fill(hi);
        const sp = new Path2D(); circ(sp, -6, -9 - inf * 3, 1.8 + inf); circ(sp, -1, -4 - inf * 2, 1.3); circ(sp, -8, -4 - inf * 2, 1.1); c.fillStyle = '#ffa0d0'; c.fill(sp);
        const pu = new Path2D(); circ(pu, 14 + wob, -16.5, 1.4); circ(pu, 6 - wob, -17.5, 1.4); c.fillStyle = '#10201e'; c.fill(pu);
        const mo = new Path2D(); ell(mo, 16, 1.5, 1.5 + inf * 2.5, 1.2 + inf * 2.4); c.fillStyle = '#3a0e2a'; c.fill(mo);
        if (aim) { Z.glow('170,240,60', 10 + inf * 14, 17, 1.5, .5 + inf * .4); const dr = new Path2D(); circ(dr, 18, 4 + inf * 5, 1.6 + inf); c.fillStyle = '#b6f450'; c.fill(dr); }
      }
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#2ac0b0', 9, 90); Z.burst(e.x, e.y, '#e2509c', 5, 70); },
  };

  // Brute: a hulking purple pear-shaped alien with big fists and a tiny horned head. Raises its fists and stomps when close, splits into babies on death.
  const bruiser = {
    hp: 130, sp: 32, dmg: 16, xp: 9, r: 20, heavy: true, eye: false,
    init(e, Z) { e.t1 = Z.rnd(2, 3.5); e.slam = false; e.elite = false; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e);
      if (e.mode === 'stomp') {
        Z.move(e, 0, 0);
        if (!e.slam && e.mt <= .12) { e.slam = true; Z.shake(3); Z.burst(e.x, e.y + 10, '#a8a070', 10, 120); }
        if ((e.mt -= dt) <= 0) { e.mode = 'walk'; e.t1 = Z.rnd(2.6, 3.6); }
        return;
      }
      Z.chase(e, e.sp * (.8 + .35 * Math.abs(Math.sin(e.ph * 3 + e.seed))));
      if ((e.t1 -= dt) <= 0 && d < 110) {
        e.mode = 'stomp'; e.mt = .85; e.slam = false;
        Z.hazard(e.x, e.y, { r: e.elite ? 100 : 78, t: .75, dmg: e.elite ? 18 : 14, col: '255,170,60' });
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 20, OL = W(white, '#2c0c48'), st = Math.sin(e.ph * 6 + e.seed), m = e.mode, el = e.elite;
      let lift = 0, sq = st * .03, up = 0, slam = 0;
      if (m === 'stomp') {
        if (!e.slam) { up = Math.sin(cl01((.85 - e.mt) / .5) * PI / 2); lift = Math.sin(cl01((.85 - e.mt) / .73) * PI / 2) * 5; }
        else { slam = cl01(e.mt / .12); sq = -.12 * slam; }
      }
      c.save(); c.translate(e.x, e.y - lift); c.scale(s * (1 - sq), s * (1 + sq)); face(c, e);
      c.lineCap = 'round'; c.lineJoin = 'round';
      // stubby legs
      const lg = new Path2D(); ell(lg, -7 + st * 1.5, 15, 5.5, 4); ell(lg, 7 - st * 1.5, 15, 5.5, 4);
      c.strokeStyle = OL; c.lineWidth = 2; c.stroke(lg); c.fillStyle = W(white, '#5a2690'); c.fill(lg);
      // little head sunk between the shoulders, with a stubby horn (gold on elites)
      const hn = new Path2D(); hn.moveTo(-2.5, -24); hn.quadraticCurveTo(-1, -31, 3, -34); hn.quadraticCurveTo(2.5, -28, 3, -24); hn.closePath();
      const hd = new Path2D(); circ(hd, 0, -19, 8);
      c.stroke(hn); c.fillStyle = W(white, el ? '#f2c43a' : '#efe0c4'); c.fill(hn);
      c.stroke(hd); c.fillStyle = W(white, '#8a48c8'); c.fill(hd);
      // hulking pear body with wide shoulders
      const bd = new Path2D(); bd.moveTo(-12, 12); bd.bezierCurveTo(-17, 4, -23, -6, -18.5, -13); bd.quadraticCurveTo(-12, -18.5, 0, -16.5); bd.quadraticCurveTo(12, -18.5, 18.5, -13);
      bd.bezierCurveTo(23, -6, 17, 4, 12, 12); bd.quadraticCurveTo(0, 16, -12, 12); bd.closePath();
      c.stroke(bd); c.fillStyle = W(white, '#7e3cbc'); c.fill(bd);
      if (!white) {
        const be = new Path2D(); ell(be, 0, 5, 9, 6.5); c.fillStyle = '#a874e0'; c.fill(be);
        const sp = new Path2D(); ell(sp, -12, -7, 2.6, 2); ell(sp, 13, -3, 2, 1.6); ell(sp, -9, 3, 1.5, 1.2); ell(sp, 10, -10, 1.4, 1.1); c.fillStyle = '#5a2690'; c.fill(sp);
        const hl = new Path2D(); hl.moveTo(-15, -12); hl.quadraticCurveTo(-11, -15.5, -5, -15.5); c.strokeStyle = '#b892ec'; c.lineWidth = 2; c.stroke(hl);
        // two angry eyes under one heavy brow
        const ey = new Path2D(); ell(ey, -3.2, -20, 2.4, 2.8); ell(ey, 3.2, -20, 2.4, 2.8); c.fillStyle = '#fff6d0'; c.fill(ey);
        const pu = new Path2D(); circ(pu, -2.6, -19.4, 1.3); circ(pu, 3.8, -19.4, 1.3); c.fillStyle = m === 'stomp' ? '#e8201c' : '#1c0a2c'; c.fill(pu);
        const br = new Path2D(); br.moveTo(-6.5, -24.5); br.lineTo(-.8, -21.8); br.lineTo(.8, -21.8); br.lineTo(6.5, -24.5); c.strokeStyle = OL; c.lineWidth = 2.2; c.stroke(br);
        // grumpy chest mouth with an underbite
        const mo = new Path2D(), op = m === 'stomp' ? 2.5 : 0; mo.moveTo(-6, -6); mo.quadraticCurveTo(0, -10 - op, 6, -6); mo.quadraticCurveTo(0, -4 + op, -6, -6); mo.closePath();
        c.fillStyle = '#2c0c34'; c.fill(mo); c.lineWidth = 1.4; c.stroke(mo);
        const th = new Path2D(); poly(th, [-4.4, -5.6, -2.4, -5.2, -3.2, -9]); poly(th, [4.4, -5.6, 2.4, -5.2, 3.2, -9]); c.fillStyle = '#fbf2dc'; c.fill(th);
      }
      // thick arms with big fists: hanging and swinging, raised overhead before a stomp, slammed down after
      const sw = st * 2.2, fx = 21 - up * 8 - slam * 2, fyL = 7 + sw - up * 33 + slam * 7, fyR = 7 - sw - up * 33 + slam * 7;
      const ar = new Path2D(); ar.moveTo(-15, -10); ar.quadraticCurveTo(-22 + up * 4, -6 - up * 12, -fx, fyL); ar.moveTo(15, -10); ar.quadraticCurveTo(22 - up * 4, -6 - up * 12, fx, fyR);
      c.strokeStyle = OL; c.lineWidth = 9; c.stroke(ar); c.strokeStyle = W(white, '#7e3cbc'); c.lineWidth = 6; c.stroke(ar);
      const fs = new Path2D(); circ(fs, -fx, fyL, 6.2); circ(fs, fx, fyR, 6.2);
      c.strokeStyle = OL; c.lineWidth = 2; c.stroke(fs); c.fillStyle = W(white, '#8a48c8'); c.fill(fs);
      if (!white) { const kn = new Path2D(); kn.moveTo(-fx - 2.5, fyL + 1.5); kn.lineTo(-fx + 2.5, fyL + 1.5); kn.moveTo(fx - 2.5, fyR + 1.5); kn.lineTo(fx + 2.5, fyR + 1.5); c.strokeStyle = '#4a1c78'; c.lineWidth = 1.2; c.stroke(kn); }
      // elites wear gold shoulder plates
      if (el) {
        const pl = new Path2D(); pl.moveTo(-21, -10); pl.quadraticCurveTo(-19, -18, -9, -17); pl.lineTo(-11, -12); pl.closePath(); pl.moveTo(21, -10); pl.quadraticCurveTo(19, -18, 9, -17); pl.lineTo(11, -12); pl.closePath();
        c.strokeStyle = W(white, '#6a4a0c'); c.lineWidth = 1.6; c.stroke(pl); c.fillStyle = W(white, '#f2c43a'); c.fill(pl);
        if (!white) { const rv = new Path2D(); circ(rv, -15, -14.5, 1.1); circ(rv, 15, -14.5, 1.1); c.fillStyle = '#fff0a0'; c.fill(rv); }
      }
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#7e3cbc', 14, 110); Z.burst(e.x, e.y, e.elite ? '#f2c43a' : '#a874e0', 6, 80); popOut(Z, e.x, e.y, e.elite ? 5 : 3, 150); },
  };

  /* ================= Miniboss: Mashlord, the Spud Tyrant ================= */
  const LUMP = (() => {
    const n = 22, pts = [];
    for (let i = 0; i < n; i++) { const t = i / n * TAU, r = 1 + .06 * Math.sin(3 * t + .7) + .045 * Math.sin(5 * t + 2) + .03 * Math.sin(8 * t); pts.push([Math.cos(t) * 52 * r, Math.sin(t) * 45 * r - 4]); }
    const p = new Path2D(), mid = i => { const a = pts[i % n], b = pts[(i + 1) % n]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
    const m0 = mid(0); p.moveTo(m0[0], m0[1]);
    for (let i = 1; i <= n; i++) { const q = pts[i % n], m = mid(i); p.quadraticCurveTo(q[0], q[1], m[0], m[1]); }
    p.closePath(); return p;
  })();
  const BUMPS = [[-48, -24, 10], [46, 16, 9], [-22, 38, 8], [30, -38, 8], [50, -8, 7], [-50, 12, 7]];
  const STALK = [[-26, -38, -44, -76], [-4, -46, -8, -96], [28, -36, 48, -72]];
  const BOSS_DASH = 430, BOSS_DT = .65;
  const BPAT = ['ring', 'charge', 'barrage', 'brood', 'spiral', 'charge', 'ring', 'barrage', 'spiral', 'brood'];
  const bossStart = (e, Z, m) => {
    e.mode = m; e.fired = 0;
    if (m === 'walk') { e.mt = (e.rage ? 1 : 1.6) + Math.random() * .6; return; }
    if (m === 'ring') { e.mt = 1.5; Z.sfx('warn'); return; }
    if (m === 'charge') { e.cs = 'aim'; e.mt = 1.1; e.aa = Z.angTo(e); Z.sfx('charge'); return; }
    if (m === 'barrage') { e.mt = 2.5; e.vol = e.rage ? 12 : 8; e.t3 = .5; Z.sfx('warn'); return; }
    if (m === 'brood') { e.mt = 1.3; Z.sfx('warn'); return; }
    if (m === 'spiral') { e.mt = 3.2; e.t3 = .3; e.sa = Math.random() * TAU; e.dir = Math.random() < .5 ? -1 : 1; Z.sfx('charge'); }
  };
  const boss = {
    name: 'Mashlord, the Spud Tyrant', hp: 4000, sp: 46, dmg: 24, xp: 0, r: 50, heavy: true, eye: false,
    init(e) { e.mode = 'walk'; e.mt = 2.2; e.pi = 0; e.rage = false; e.aa = 0; e.cs = ''; e.fired = 0; e.sa = 0; e.dir = 1; e.t3 = 0; e.vol = 0; },
    update(e, Z) {
      const dt = Z.dt;
      if (!e.rage && e.hp < e.max * .4) {
        e.rage = true; Z.banner("It's getting angry… and lumpy!", '#ff9a3a', true); Z.sfx('boss'); Z.shake(10);
        Z.ring(e.x, e.y - 10, 18, 150, { r: 7, dmg: 9, col: '255,200,60' }, e.ph);
      }
      e.mt -= dt;
      switch (e.mode) {
        case 'walk': {
          const d = Z.dist(e), sp = e.sp * (e.rage ? 1.3 : 1);
          if (d > 200) Z.chase(e, sp);
          else { const a = Z.angTo(e) + PI / 2; Z.move(e, Math.cos(a) * sp * .6, Math.sin(a) * sp * .6); e.ang = Z.angTo(e); }
          if (e.mt <= 0) bossStart(e, Z, BPAT[e.pi++ % BPAT.length]);
          break;
        }
        case 'ring': {
          Z.move(e, 0, 0); e.ang = Z.angTo(e);
          const n = e.rage ? 24 : 18;
          if (e.fired === 0 && e.mt <= .8) { e.fired = 1; Z.ring(e.x, e.y - 10, n, 145, { r: 7, dmg: 9, life: 5, col: '255,200,60' }, e.ph); Z.sfx('nova'); Z.shake(4); }
          if (e.fired === 1 && e.mt <= .45) { e.fired = 2; Z.ring(e.x, e.y - 10, n, 125, { r: 7, dmg: 9, life: 5, col: '255,200,60' }, e.ph + PI / n); Z.sfx('shoot'); }
          if (e.fired === 2 && e.rage && e.mt <= .1) { e.fired = 3; Z.ring(e.x, e.y - 10, n, 165, { r: 7, dmg: 9, life: 5, col: '255,200,60' }, e.ph + PI / n * .5); Z.sfx('shoot'); }
          if (e.mt <= 0) bossStart(e, Z, 'walk');
          break;
        }
        case 'charge':
          if (e.cs === 'aim') {
            Z.move(e, 0, 0);
            if (e.mt > .35) { let da = Z.angTo(e) - e.aa; da = Math.atan2(Math.sin(da), Math.cos(da)); e.aa += da * Math.min(1, dt * 3.5); }
            e.ang = e.aa;
            if (e.mt <= 0) { e.cs = 'dash'; e.mt = BOSS_DT; Z.sfx('nova'); Z.shake(3); }
          } else if (e.cs === 'dash') {
            Z.move(e, Math.cos(e.aa) * BOSS_DASH, Math.sin(e.aa) * BOSS_DASH); e.ang = e.aa;
            if (e.mt <= 0) {
              e.cs = 'rec'; e.mt = .7; Z.shake(6); Z.burst(e.x, e.y + 20, '#b0a478', 16, 140);
              if (e.rage) Z.ring(e.x, e.y, 12, 140, { r: 6, dmg: 8, col: '255,200,60' }, e.aa);
            }
          } else { Z.move(e, 0, 0); if (e.mt <= 0) bossStart(e, Z, 'walk'); }
          break;
        case 'barrage':
          Z.move(e, 0, 0); e.ang = Z.angTo(e);
          if (e.vol > 0 && (e.t3 -= dt) <= 0) {
            const first = e.vol === (e.rage ? 12 : 8), a = Math.random() * TAU, d = first ? 0 : 50 + Math.random() * 210;
            const tx = Z.P.x + Math.cos(a) * d, ty = Z.P.y + Math.sin(a) * d, T = 1.05;
            Z.hazard(tx, ty, { r: 52, t: T, dmg: 13, col: '170,240,60' }); lob(Z, e.x, e.y - 14, tx, ty, T);
            e.vol--; e.t3 = .16; if (e.vol % 3 === 0) Z.sfx('shoot');
          }
          if (e.mt <= 0) bossStart(e, Z, 'walk');
          break;
        case 'brood':
          Z.move(e, 0, 0);
          if (!e.fired && e.mt <= .6) { e.fired = 1; popOut(Z, e.x, e.y + 10, e.rage ? 8 : 6, 210); Z.sfx('boss'); Z.shake(6); }
          if (e.mt <= 0) bossStart(e, Z, 'walk');
          break;
        case 'spiral':
          Z.move(e, 0, 0);
          if ((e.t3 -= dt) <= 0 && e.mt > .3 && e.mt < 2.9) {
            const arms = e.rage ? 3 : 2;
            for (let k = 0; k < arms; k++) Z.shoot(e.x, e.y - 10, e.sa + k * TAU / arms, 150, { r: 6, dmg: 8, life: 4, col: '255,110,200' });
            e.sa += .29 * e.dir; e.t3 = .1;
          }
          if (e.mt <= 0) bossStart(e, Z, 'walk');
          break;
        default: bossStart(e, Z, 'walk');
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 50, m = e.mode, now = Z.now, rage = e.rage, OL = W(white, '#4a2610'), st = Math.sin(e.ph * 5);
      const dash = m === 'charge' && e.cs === 'dash', aim = m === 'charge' && e.cs === 'aim';
      c.save(); c.translate(e.x, e.y); c.scale(s, s);
      c.lineCap = 'round'; c.lineJoin = 'round';
      if (!white) {
        if (aim) {
          const k = cl01(1 - e.mt / 1.1), L = BOSS_DASH * BOSS_DT * K / s + 30;
          c.save(); c.rotate(e.aa); c.globalAlpha = .12 + .25 * k + .05 * Math.sin(now * 24); c.fillStyle = '#ff5a2a'; c.fillRect(0, -40, L, 80);
          c.globalAlpha = .5 + .4 * k; c.strokeStyle = '#ffe0a0'; c.lineWidth = 2; c.strokeRect(0, -40, L, 80); c.restore(); c.globalAlpha = 1;
        }
        if (m === 'ring' && e.fired === 0) { const k = cl01((1.5 - e.mt) / .7); c.globalAlpha = .3 + .5 * k; c.strokeStyle = '#ffe060'; c.lineWidth = 3; c.beginPath(); c.arc(0, -6, 40 + k * 44, 0, TAU); c.stroke(); c.globalAlpha = 1; }
        if (m === 'spiral') { c.globalAlpha = .35; c.strokeStyle = '#ff6ec8'; c.lineWidth = 2.5; c.beginPath(); c.arc(0, -6, 66, now * 6, now * 6 + 4); c.stroke(); c.globalAlpha = 1; }
        if (rage) { c.globalAlpha = .35 + .2 * Math.sin(now * 6); c.strokeStyle = '#ff5a30'; c.lineWidth = 3; c.beginPath(); c.arc(0, -4, 62 + Math.sin(now * 5) * 3, 0, TAU); c.stroke(); c.globalAlpha = 1; }
        Z.glow(rage ? '255,120,60' : '255,200,110', 82, 0, -8, .22);
      }
      if ((m === 'brood' && e.mt > .6) || (m === 'ring' && e.fired === 0)) c.translate(Math.sin(now * 50) * 2, 0);
      if (m === 'spiral') c.rotate(Math.sin(now * 26) * .06);
      if (dash) c.rotate(Math.cos(e.aa) >= 0 ? .14 : -.14);
      const wk = m === 'walk' || dash ? st : 0;
      // feet and the stubby left arm
      const ft = new Path2D(); ell(ft, -22 + wk * 5, 42, 13, 7); ell(ft, 22 - wk * 5, 42, 13, 7); ell(ft, -54, 4 + wk * 3, 9, 7.5);
      c.strokeStyle = OL; c.lineWidth = 2.2; c.stroke(ft); c.fillStyle = W(white, '#9a6a3a'); c.fill(ft);
      // eye stalks behind the body
      const sk = new Path2D(), eyes = [];
      for (let i = 0; i < 3; i++) {
        const [bx, by, tx0, ty0] = STALK[i], sw = Math.sin(now * 2.2 + i * 2) * 4, tx = tx0 + sw, ty = ty0 + Math.cos(now * 1.7 + i) * 2;
        sk.moveTo(bx, by); sk.quadraticCurveTo((bx + tx) / 2 - sw, (by + ty) / 2, tx, ty); eyes.push([tx, ty, i === 1 ? 10 : 8.5]);
      }
      c.strokeStyle = OL; c.lineWidth = 6.5; c.stroke(sk); c.strokeStyle = W(white, '#7cc444'); c.lineWidth = 3.8; c.stroke(sk);
      // the potato body
      c.strokeStyle = OL; c.lineWidth = 2.6; c.stroke(LUMP); c.fillStyle = W(white, rage ? '#d48c5a' : '#c99a5c'); c.fill(LUMP);
      if (!white) {
        c.save(); c.clip(LUMP);
        const sd = new Path2D(); ell(sd, 8, 34, 64, 26); c.fillStyle = rage ? '#b06a40' : '#a87a44'; c.fill(sd);
        const hl = new Path2D(); ell(hl, -20, -26, 22, 11); ell(hl, 22, -30, 9, 5); c.fillStyle = rage ? '#eaa878' : '#e0b67c'; c.fill(hl);
        c.restore();
        const sp = new Path2D(); for (const [x, y] of [[-34, -6], [30, 12], [-14, 26], [36, -22], [-38, 18], [6, -34]]) { sp.moveTo(x - 3.5, y); sp.quadraticCurveTo(x, y + 3, x + 3.5, y); }
        c.strokeStyle = '#7a4c24'; c.lineWidth = 2; c.stroke(sp);
        if (rage) {
          const bp = new Path2D(), bh = new Path2D(); for (const [x, y, r] of BUMPS) { const rr = r * (1 + .08 * Math.sin(now * 5 + x)); circ(bp, x, y, rr); circ(bh, x - rr * .3, y - rr * .35, rr * .3); }
          c.strokeStyle = OL; c.lineWidth = 2; c.stroke(bp); c.fillStyle = '#d8704a'; c.fill(bp); c.fillStyle = '#ffb08a'; c.fill(bh);
        }
        // grumpy face
        const ew = new Path2D(); ell(ew, -16, -4, 7, 6); ell(ew, 16, -4, 7, 6); c.fillStyle = '#fff4e0'; c.fill(ew); c.strokeStyle = OL; c.lineWidth = 1.4; c.stroke(ew);
        const a0 = Z.angTo(e), ep = new Path2D(); circ(ep, -16 + Math.cos(a0) * 2.4, -3 + Math.sin(a0) * 2, 3); circ(ep, 16 + Math.cos(a0) * 2.4, -3 + Math.sin(a0) * 2, 3); c.fillStyle = '#2a1206'; c.fill(ep);
        const br = new Path2D(); br.moveTo(-28, -16); br.lineTo(-7, -9); br.moveTo(28, -16); br.lineTo(7, -9);
        c.strokeStyle = '#5a3418'; c.lineWidth = 5; c.stroke(br);
        const mo = m === 'ring' || m === 'barrage' ? 1 : m === 'brood' ? .7 : dash ? .5 : .25, mt = new Path2D();
        mt.moveTo(-22, 12); mt.quadraticCurveTo(0, 6, 22, 12); mt.quadraticCurveTo(0, 12 + 26 * mo, -22, 12); mt.closePath();
        c.fillStyle = '#3a1206'; c.fill(mt); c.strokeStyle = OL; c.lineWidth = 1.6; c.stroke(mt);
        const th = new Path2D(); for (let i = 0; i < 5; i++) { const tx = -16 + i * 8, ty = 10 - Math.abs(i - 2) * .6; poly(th, [tx - 3.4, ty, tx + 3.4, ty, tx, ty + 5 + mo * 2]); }
        c.fillStyle = '#f4ecd8'; c.fill(th);
        if (m === 'barrage') { Z.glow('170,240,60', 26, 0, 18, .7); const gd = new Path2D(); circ(gd, -4, 22 + Math.sin(now * 8) * 2, 3.4); circ(gd, 6, 24, 2.4); c.fillStyle = '#b6f450'; c.fill(gd); }
      }
      // crown, askew
      const cr = new Path2D(); poly(cr, [12, -42, 13, -56, 19, -50, 25, -60, 30, -48, 37, -54, 35, -40]);
      c.strokeStyle = W(white, '#6a4a0c'); c.lineWidth = 1.6; c.stroke(cr); c.fillStyle = W(white, '#f2c43a'); c.fill(cr);
      if (!white) { const gm = new Path2D(); circ(gm, 24, -46, 2.4); circ(gm, 16, -47, 1.6); circ(gm, 32, -45, 1.6); c.fillStyle = '#e0306a'; c.fill(gm); }
      // eyeballs on the stalks
      const eb = new Path2D(); for (const [x, y, r] of eyes) circ(eb, x, y, r);
      c.strokeStyle = OL; c.lineWidth = 2; c.stroke(eb); c.fillStyle = W(white, '#fbf6ea'); c.fill(eb);
      if (!white) {
        const ir = new Path2D(), pu = new Path2D(), a = Z.angTo(e);
        for (let i = 0; i < 3; i++) { const [x, y, r] = eyes[i], aa = m === 'spiral' ? now * 10 + i * 2 : a, ix = x + Math.cos(aa) * r * .35, iy = y + Math.sin(aa) * r * .35; circ(ir, ix, iy, r * .52); circ(pu, ix, iy, r * .24); }
        c.fillStyle = rage ? '#ff3a20' : '#d0306a'; c.fill(ir); c.fillStyle = '#16080c'; c.fill(pu);
        c.fillStyle = '#ffffff'; for (const [x, y, r] of eyes) c.fillRect(x - r * .5, y - r * .55, r * .3, r * .3);
        if (m === 'ring' && e.fired === 0) for (const [x, y] of eyes) Z.glow('255,220,90', 16, x, y, .7);
      }
      // right arm with a giant fork
      let fa = .25 + st * .08;
      if (m === 'barrage') fa = -.9 + Math.sin(now * 9) * .12;
      else if (m === 'brood') fa = e.fired ? .9 : -1.2;
      else if (m === 'ring') fa = -.4;
      else if (m === 'spiral') fa = now * 12;
      else if (aim) fa = 1.35;
      else if (dash) fa = 1.55;
      const hx = 56, hy = 0, fd = -PI / 2 + fa, ca = Math.cos(fd), sa = Math.sin(fd), ex = hx + ca * 62, ey = hy + sa * 62;
      const hd = new Path2D(); hd.moveTo(hx - ca * 10, hy - sa * 10); hd.lineTo(ex, ey);
      const tn = new Path2D(); tn.moveTo(ex - sa * 10, ey + ca * 10); tn.lineTo(ex + sa * 10, ey - ca * 10);
      for (const o of [-9, 0, 9]) { tn.moveTo(ex - sa * o, ey + ca * o); tn.lineTo(ex - sa * o + ca * 16, ey + ca * o + sa * 16); }
      c.strokeStyle = OL; c.lineWidth = 6.5; c.stroke(hd); c.stroke(tn);
      c.strokeStyle = W(white, '#c8d0d8'); c.lineWidth = 3.6; c.stroke(hd); c.stroke(tn);
      const hn = new Path2D(); ell(hn, hx, hy, 9, 7.5); c.strokeStyle = OL; c.lineWidth = 2.2; c.stroke(hn); c.fillStyle = W(white, '#9a6a3a'); c.fill(hn);
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#c99a5c', 40, 220); Z.burst(e.x, e.y - 30, '#7cc444', 22, 180); Z.burst(e.x, e.y, '#f2c43a', 14, 160); Z.shake(14); },
  };

  /* ================= Events ================= */
  const spot = (Z, d) => { const a = Math.random() * TAU; return { x: Z.P.x + Math.cos(a) * d, y: Z.P.y + Math.sin(a) * d, a }; };
  const swarm = (Z, n, d) => { const p = spot(Z, d); for (let i = 0; i < n; i++) { const a = i / n * TAU; Z.spawn('baby', p.x + Math.cos(a) * 44, p.y + Math.sin(a) * 44); } };
  const elite = Z => {
    const p = spot(Z, 430), b = Z.spawn('bruiser', p.x, p.y);
    if (b) { b.elite = true; b.hp *= 3; b.max *= 3; b.r = 26; b.dmg = 20; Z.burst(p.x, p.y, '#f0c040', 16, 140); }
  };
  let crateAt = null;
  const events = [
    { t: 6, run(Z) { Z.banner('Wave 1… no wait, ALL the waves!', '#cfa8ff', false); Z.sfx('warn'); swarm(Z, 10, 430); } },
    { t: 18, run(Z) {
      Z.banner('A loot crate fell from the sky!', '#7dff9a', false); Z.sfx('warn');
      const p = spot(Z, 170); crateAt = p;
      Z.hazard(p.x, p.y, { r: 64, t: 1.1, dmg: 12, col: '120,255,140' }); drop(Z, p.x, p.y, 1.1, 'crate');
    } },
    { t: 19.4, run(Z) { if (!crateAt) return; Z.banner('…it was full of aliens!', '#cfa8ff', false); popOut(Z, crateAt.x, crateAt.y, 8, 170); crateAt = null; } },
    { t: 31, run(Z) {
      Z.banner('Elite incoming!', '#ffcf40', true); Z.sfx('boss'); elite(Z);
      for (let i = 0; i < 2; i++) { const p = spot(Z, 420); Z.spawn('charger', p.x, p.y); }
    } },
    { t: 58, run(Z) {
      Z.banner('The trees are dropping fruit…', '#ff9a6a', false); Z.sfx('warn');
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * TAU, d = i === 0 ? 0 : 60 + Math.random() * 300, x = Z.P.x + Math.cos(a) * d, y = Z.P.y + Math.sin(a) * d, t = 1 + i * .12;
        Z.hazard(x, y, { r: 38, t, dmg: 10, col: '255,130,80' }); drop(Z, x, y, t, 'fruit');
      }
    } },
    { t: 78, run(Z) {
      Z.banner('WAVE CLEARED? Nope. More aliens!', '#cfa8ff', true); Z.sfx('boss'); swarm(Z, 8, 420);
      for (let i = 0; i < 2; i++) { const p = spot(Z, 440); Z.spawn('spitter', p.x, p.y); }
    } },
    { t: 100, run(Z) {
      Z.banner('Harvest time!', '#b6f450', true); Z.sfx('warn');
      const a = Math.random() * TAU, ca = Math.cos(a), sa = Math.sin(a);
      for (let r = -1; r <= 1; r++) {
        const gap = fl(Math.random() * 9) + 1;
        for (let i = -5; i <= 5; i++) {
          if (i === gap - 5 || i === gap - 4) continue;
          const u = r * 120, v = i * 52, x = Z.P.x + ca * u - sa * v, y = Z.P.y + sa * u + ca * v;
          Z.hazard(x, y, { r: 34, t: 1 + (r + 1) * .3 + (i + 5) * .04, dmg: 12, col: '182,244,80' });
        }
      }
      for (let i = 0; i < 4; i++) { const b = a + PI / 2 + i * PI / 2; Z.spawn('charger', Z.P.x + Math.cos(b) * 420, Z.P.y + Math.sin(b) * 420); }
    } },
    { t: 120, run(Z) { Z.banner('Elite incoming!', '#ffcf40', true); Z.sfx('boss'); elite(Z); swarm(Z, 6, 400); } },
    { t: 136, run(Z) {
      Z.banner('Dawn is close. One last wave!', '#ffe9a0', false); Z.sfx('warn'); swarm(Z, 8, 420);
      const p = spot(Z, 430); Z.spawn('charger', p.x, p.y);
    } },
  ];

  /* ================= Music: original electro-rock arena loop in D minor, 140 bpm, sixteenth steps ================= */
  const MIN = [0, 2, 3, 5, 7, 8, 10], HM = [0, 2, 3, 5, 7, 8, 11];
  const dg = (S, base, i) => base + S[((i % 7) + 7) % 7] + 12 * Math.floor(i / 7);
  const PROG = [0, 5, 2, 6, 0, 5, 6, 4, 0, 5, 2, 6, 3, 5, 6, 4]; // Dm Bb F C | Dm Bb C A | Dm Bb F C | Gm Bb C A
  const _ = null;
  const HOOK = [
    [4, _, 4, _, 7, _, 6, 4, _, _, 5, _, 4, _, 2, _], [3, _, 3, _, 5, _, 4, 3, _, _, 2, _, 0, _, _, _],
    [2, _, 2, _, 4, _, 5, 7, _, _, 9, _, 8, _, 7, _], [6, _, _, _, 5, _, 4, _, 6, _, _, _, 7, _, _, _],
    [4, _, 4, _, 7, _, 6, 4, _, _, 5, _, 4, _, 2, _], [3, _, 3, _, 5, _, 4, 3, _, _, 2, _, 0, _, _, _],
    [4, _, 4, _, 6, _, 7, 9, _, _, 8, _, 7, _, 6, _], [8, _, _, _, 7, _, 6, _, 4, _, _, _, _, _, _, _],
    [7, _, 9, 7, _, 7, _, 4, 7, _, 9, 7, _, 11, _, _], [5, _, 7, 5, _, 5, _, 2, 5, _, 7, 5, _, 9, _, _],
    [9, _, 11, 9, _, 9, _, 7, 9, _, 11, 9, _, 12, _, _], [8, _, _, 7, _, _, 6, _, 5, _, 4, _, 6, _, _, _],
    [6, _, 8, 6, _, 6, _, 3, 6, _, 8, 6, _, 10, _, _], [5, _, 7, 5, _, 5, _, 2, 5, _, 7, 9, _, 7, _, _],
    [6, _, _, _, 7, _, _, _, 8, _, _, _, 9, _, _, _], [11, _, _, _, _, _, _, _, 10, _, 9, _, 8, _, _, _],
  ];
  const BPROG = [0, 0, 5, 4, 0, 0, 3, 4];
  const SIREN = [
    [7, _, _, _, 6, _, _, _, 5, _, 6, _, 7, _, _, _], [9, _, _, _, 8, _, 7, _, 6, _, _, _, 4, _, _, _],
    [7, _, _, _, 6, _, _, _, 5, _, 6, _, 7, _, 9, _], [11, _, _, _, 10, _, 9, _, 8, _, _, _, _, _, _, _],
  ];
  const ARP = [0, 2, 4, 7, 9, 7, 4, 2];
  const lenOf = (row, b) => { let n = 1; while (b + n < 16 && row[b + n] === null) n++; return n; };
  const music = {
    bpm: 140, div: 4,
    step(s, t, A) {
      const sp = 60 / 140 / 4, bar = fl(s / 16), b = s % 16, inten = A.inten || 0;
      if (!A.boss) {
        const sec = bar % 16, ch = PROG[sec], S = ch === 4 ? HM : MIN;
        let root = dg(S, 38, ch); if (root > 44) root -= 12;
        // drums: four on the floor, claps on 2 and 4, offbeat open hats, a tom fill every 8 bars
        if (b % 4 === 0) A.kick(t, .72);
        if (b === 14 && sec % 2 === 1) A.kick(t, .45);
        if (b === 4 || b === 12) { A.snare(t, .22); A.noise(t, .05, .05, { type: 'bandpass', f: 1400, q: 1.2 }); A.noise(t + .013, .05, .04, { type: 'bandpass', f: 1750, q: 1.2 }); }
        if (b % 4 === 2) A.hat(t, .05, sec % 4 === 3);
        else if (b % 2 === 0 || sec >= 8) A.hat(t, .022 + inten * .012, false);
        if (sec % 8 === 7 && b >= 12) A.tom(t, [190, 155, 125, 98][b - 12], .3);
        if (sec % 8 === 0 && b === 0) A.noise(t, 1.1, .045, { type: 'highpass', f: 5000 });
        // gritty octave-pumping bass
        if (b % 2 === 0) {
          const n = root + (b % 4 === 2 ? 12 : 0);
          A.tone(t, n, sp * 1.7, .065, { type: 'square', cutoff: 900, decay: true });
          A.tone(t, n, sp * 1.7, .034, { type: 'sawtooth', cutoff: 620, detune: 12, decay: true });
        }
        // offbeat saw stabs in the second half
        if (sec >= 8 && (b === 6 || b === 14)) for (const k of [0, 2, 4]) A.tone(t, dg(S, 62, ch + k), sp * 1.2, .013, { type: 'sawtooth', cutoff: 2000, decay: true });
        // chiptune lead hook
        const row = HOOK[sec], n = row[b];
        if (n !== null) {
          const mm = dg(S, 62, n), dur = sp * Math.min(lenOf(row, b), 4) * .9;
          A.tone(t, mm, dur, .045, { type: 'square', cutoff: 3200 });
          if (sec >= 8) A.tone(t, mm + 12, dur, .015, { type: 'sawtooth', cutoff: 4200, detune: 8 });
          else A.tone(t, mm, dur, .017, { type: 'square', cutoff: 2600, detune: 14 });
        }
        if (sec % 4 === 3 && b % 2 === 1 && b < 12) A.tone(t, dg(S, 74, ch + [0, 2, 4, 7, 4, 2][(b >> 1) % 6]), sp * .8, .014, { type: 'triangle', decay: true });
      } else {
        const sec = bar % 8, ch = BPROG[sec], S = ch === 4 ? HM : MIN;
        let root = dg(S, 38, ch); if (root > 44) root -= 12;
        // double-time drums with snare rolls
        if (b % 2 === 0) A.kick(t, b % 4 === 0 ? .75 : .55);
        if (b === 4 || b === 12) { A.snare(t, .3); A.noise(t, .05, .05, { type: 'bandpass', f: 1500, q: 1 }); }
        if (sec % 2 === 1 && b >= 12) A.snare(t, .12 + (b - 12) * .04);
        A.hat(t, b % 2 ? .025 : .045, b % 8 === 6);
        if (b === 0 && sec % 4 === 0) A.noise(t, 1.2, .05, { type: 'highpass', f: 4500 });
        // distorted sixteenth bass
        const bn = root + [0, 0, 12, 0, 0, 12, 0, 7][b % 8];
        A.tone(t, bn, sp * .9, .05, { type: 'sawtooth', cutoff: 700, q: 6, detune: -14 });
        A.tone(t, bn, sp * .9, .04, { type: 'square', cutoff: 500, detune: 14 });
        // brass-ish power stabs
        if (b === 0 || b === 10) { A.tone(t, dg(S, 50, ch), sp * 2.5, .03, { type: 'sawtooth', cutoff: 1400, sweep: 600 }); A.tone(t, dg(S, 50, ch + 4), sp * 2.5, .026, { type: 'sawtooth', cutoff: 1400, sweep: 600 }); }
        // urgent lead: racing arpeggio, then a wailing siren line
        if (sec < 4) A.tone(t, dg(S, 74, ch + ARP[b % 8] + (b >= 8 ? 2 : 0)), sp * .8, .026, { type: 'square', cutoff: 3000, decay: true });
        else {
          const row = SIREN[sec - 4], n = row[b];
          if (n !== null) { const mm = dg(S, 62, n), dur = sp * lenOf(row, b) * .92; A.tone(t, mm, dur, .045, { type: 'sawtooth', cutoff: 3000, vib: .5, attack: .01 }); A.tone(t, mm - 12, dur, .02, { type: 'square', cutoff: 1500 }); }
        }
      }
    },
  };

  return {
    id: 'potato', name: 'Potato Fields', nod: 'Brotato', portal: '220,170,80', bg: SOIL, dark: .3, dim: .14,
    ground, under, ambient,
    mix: { baby: 6, charger: 1.4, spitter: 1.2, bruiser: .8 },
    target: 1.1,
    foes: { baby, charger, spitter, bruiser },
    boss, events, music,
  };
})());
