// Zone bay: a sunny, roguish tropical cove haunted by a spectral galleon and its skeleton crew. Golden beaches,
// turquoise shallows, docks, palms, a stone battery and a skull-shaped rock. A nod to Heroes of the Storm.
ZONES.push((() => {
  const TAU = Math.PI * 2, PI = Math.PI, fl = Math.floor;
  const W = (w, c) => (w ? '#fff' : c);
  const circ = (p, x, y, r) => { if (!(r > 0)) return; p.moveTo(x + r, y); p.arc(x, y, r, 0, TAU); };
  const ell = (p, x, y, rx, ry) => { if (!(rx > 0) || !(ry > 0)) return; p.moveTo(x + rx, y); p.ellipse(x, y, rx, ry, 0, 0, TAU); };
  const poly = (p, a) => { p.moveTo(a[0], a[1]); for (let i = 2; i < a.length; i += 2) p.lineTo(a[i], a[i + 1]); p.closePath(); };
  const cl01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
  const face = (c, e) => { const f = Math.cos(e.ang) < 0 ? -1 : 1; c.scale(f, 1); return f; };

  /* ================= Map: one cove per 1600px macro cell =================
     Every cell holds a wobbly bay (deep blue centre, turquoise shallows, foam, wet sand) with the ghost galleon
     anchored in it, a dock running out from the shore, a beached wreck, a skull rock in the shallows, a stone
     battery with cannons and a flag, chests and doubloons, rocks, a tide pool and palm groves. A jungle-grass
     patch sits on each cell corner, so the beaches between bays form sandy isthmuses. */
  const M = 1600, NA = 120, SAND = '#c6aa74';
  const CO = new Float32Array(NA + 1), SI = new Float32Array(NA + 1);
  for (let i = 0; i <= NA; i++) { CO[i] = Math.cos(i / NA * TAU); SI[i] = Math.sin(i / NA * TAU); }
  const PALM = 1, ROCK = 2, SKULL = 3, WRECK = 4, FORT = 5, CHEST = 6, BARREL = 7, CRATE = 8, ROPE = 9, LAMP = 10, SHIP = 11;
  const cache = new Map();
  const rAt = (cl, th) => { const u = ((((th / TAU) % 1) + 1) % 1) * NA, i = Math.min(NA - 1, fl(u)), f = u - i; return cl.rr[i] * (1 - f) + cl.rr[i + 1] * f; };
  const shoreD = (cl, x, y) => Math.hypot(x - cl.bx, y - cl.by) - rAt(cl, Math.atan2(y - cl.by, x - cl.bx));
  const adiff = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  const palmP = (h, i) => ({ s: .85 + h(i) * .35, lean: (h(i + 40) - .5) * .5, bend: (h(i + 80) - .5) * 26, rot: h(i + 120) * TAU });
  const FORT_W = 230, FORT_D = 130, FORT_H = 30;

  const cellOf = (Z, cx, cy) => {
    const key = cx + ',' + cy;
    let cl = cache.get(key);
    if (cl) return cl;
    if (cache.size > 40) cache.clear();
    const h = i => Z.hash(cx * 37 + i * 11 + 5, cy * 23 - i * 7 + 9);
    const bx = cx * M + 800 + (h(1) - .5) * 180, by = cy * M + 800 + (h(2) - .5) * 180;
    const R0 = 465 + h(3) * 40, p1 = h(4) * TAU, p2 = h(5) * TAU, p3 = h(6) * TAU;
    const rr = new Float32Array(NA + 1);
    for (let i = 0; i <= NA; i++) { const t = i / NA * TAU; rr[i] = R0 * (1 + .075 * Math.sin(3 * t + p1) + .045 * Math.sin(5 * t + p2) + .05 * Math.sin(2 * t + p3)); }
    rr[NA] = rr[0];
    cl = { bx, by, R0, rr, f: [], coins: [], lamps: [], pool: null, grass: null, dock: null, ship: null, fort: null, skip: new Uint8Array(NA + 1) };
    const occ = [];
    const free = (x, y, r) => { for (const o of occ) if (Math.hypot(o[0] - x, o[1] - y) < o[2] + r) return false; return true; };
    const add = (k, x, y, r, extra) => { const o = Object.assign({ k, x, y, v: Z.hash(fl(x) * 3 + 1, fl(y) * 5 - 2) }, extra || {}); cl.f.push(o); if (r) occ.push([x, y, r]); return o; };
    const at = (a, d) => [bx + Math.cos(a) * d, by + Math.sin(a) * d];
    const skipAround = (a, half) => { for (let i = 0; i <= NA; i++) if (adiff(i / NA * TAU, a) < half) cl.skip[i] = 1; };

    // dock: runs from the beach out toward the bay centre, with a T-shaped head
    const ad = (h(7) * 1.3 - .15) * PI, sr = rAt(cl, ad), r0 = sr + 90, L = 280;
    const dx = -Math.cos(ad), dy = -Math.sin(ad), ox = bx - dx * r0, oy = by - dy * r0;
    const dp = (u, v) => [ox + dx * u - dy * v, oy + dy * u + dx * v];
    cl.dock = { a: ad, ox, oy, dx, dy, L };
    skipAround(ad, 70 / sr);
    for (let u = -80; u <= L + 20; u += 40) { const [x, y] = dp(u, 0); occ.push([x, y, u > L - 40 ? 84 : 50]); }
    for (const [u, v] of [[100, 23], [L - 4, 60], [L - 4, -60]]) { const [x, y] = dp(u, v); add(LAMP, x, y, 0); cl.lamps.push([x + 9, y - 38]); }
    for (const [k, u, v] of [[BARREL, L - 8, -32], [BARREL, L + 8, -42], [CRATE, L - 2, 34], [ROPE, L + 10, 14], [CRATE, -46, 52], [BARREL, -34, -52], [BARREL, -58, -40], [ROPE, -70, 28]]) {
      const [x, y] = dp(u, v); add(k, x, y, 0);
    }
    // the ghost galleon: anchored in deep water, placed so its hull and tall rigging stay clear of the dock
    const sm = h(8) < .5 ? -1 : 1, dockPts = [];
    for (let u = 0; u <= L + 20; u += 30) dockPts.push(dp(u, 0));
    let sx = bx, sy = by + 40, best = -1e9;
    for (const ox of [-110, -55, 0, 55, 110]) for (const oy of [-20, 30, 80, 130]) {
      const x = bx + ox, y = by + oy, l = x + (sm > 0 ? -190 : -270), r = x + (sm > 0 ? 270 : 190), top = y - 390, bot = y + 40;
      if (shoreD(cl, x - 180, y) > -50 || shoreD(cl, x + 180, y) > -50 || shoreD(cl, x, y + 30) > -40) continue;
      let clr = 1e9;
      for (const [px, py] of dockPts) clr = Math.min(clr, Math.hypot(Math.max(l - px, 0, px - r), Math.max(top - py, 0, py - bot)));
      const sc = Math.min(clr, 110) - Math.hypot(ox, oy - 50) * .15;
      if (sc > best) { best = sc; sx = x; sy = y; }
    }
    cl.ship = add(SHIP, sx, sy, 0, { m: sm });
    // beached wreck, skull rock, stone battery
    const aw = ad + PI + (h(9) - .5) * .6, [wx, wy] = at(aw, rAt(cl, aw) + 72);
    add(WRECK, wx, wy, 125, { m: h(10) < .5 ? -1 : 1, tilt: (h(11) - .5) * .26 });
    const as = ad - PI * .5 + (h(12) - .5) * .5, [kx, ky] = at(as, rAt(cl, as) - 14);
    add(SKULL, kx, ky, 85);
    skipAround(as, 70 / rAt(cl, as));
    const af = ad + PI * .5 + (h(13) - .5) * .4, fd = Math.min(rAt(cl, af) + 250, 760), [fx, fy] = at(af, fd);
    if (free(fx, fy, 150)) {
      const Lx = fx - FORT_W / 2, deckY = fy - FORT_D / 2 - FORT_H;
      cl.fort = add(FORT, fx, fy, 175, { ca: Math.atan2(by - fy, bx - fx), pole: [Lx + 18, deckY + 20 - 128] });
    }
    // rocks along the shore and in the shallows
    for (let k = 0; k < 8; k++) {
      const a = h(20 + k) * TAU;
      if (adiff(a, ad) < .32) continue;
      const wet = h(30 + k) < .5, d = rAt(cl, a) + (wet ? -20 - h(40 + k) * 26 : 34 + h(40 + k) * 220), [x, y] = at(a, d), s = 14 + h(50 + k) * 18;
      if (free(x, y, s + 14)) add(ROCK, x, y, s + 14, { s, wet });
    }
    // half-buried chests with doubloons spilling out
    for (let k = 0; k < 2; k++) {
      const a = h(60 + k) * TAU, d = rAt(cl, a) + 120 + h(62 + k) * 130, [x, y] = at(a, d);
      if (!free(x, y, 44)) continue;
      add(CHEST, x, y, 44);
      for (let j = 0; j < 9; j++) { const b = h(70 + j + k * 9) * TAU, q = 22 + h(90 + j + k * 9) * 40; cl.coins.push([x + Math.cos(b) * q, y + Math.sin(b) * q * .6 + 6]); }
    }
    for (let j = 0; j < 7; j++) { const b = h(110 + j) * TAU, q = 70 + h(120 + j) * 80; cl.coins.push([wx + Math.cos(b) * q, wy + Math.sin(b) * q * .5 + 20]); }
    cl.coins = cl.coins.filter(p => shoreD(cl, p[0], p[1]) > 14);
    // tide pool
    const ap = h(14) * TAU, pd = Math.min(rAt(cl, ap) + 290 + h(15) * 100, 740), [px, py] = at(ap, pd), pr = 34 + h(16) * 24;
    if (free(px, py, pr + 30)) { cl.pool = { x: px, y: py, r: pr, p: h(17) * TAU }; occ.push([px, py, pr + 30]); add(ROCK, px + pr * .95, py - pr * .35, 0, { s: 12, wet: false }); }
    // jungle-grass patch on this cell's top-left corner, ringed by palms
    const gx = cx * M + (h(18) - .5) * 160, gy = cy * M + (h(19) - .5) * 160, gr = 190 + h(21) * 80;
    cl.grass = { x: gx, y: gy, r: gr, p: h(22) * TAU, q: h(23) * TAU };
    for (let k = 0; k < 8; k++) { const a = h(130 + k) * TAU, d = gr * (.3 + h(140 + k) * .75), x = gx + Math.cos(a) * d, y = gy + Math.sin(a) * d; if (free(x, y, 46)) add(PALM, x, y, 46, palmP(h, 150 + k)); }
    // beach palms
    for (let k = 0; k < 30; k++) {
      const a = h(200 + k) * TAU, d = rAt(cl, a) + 78 + h(240 + k) * 400;
      if (d > 760) continue;
      const [x, y] = at(a, d);
      if (free(x, y, 46)) add(PALM, x, y, 46, palmP(h, 300 + k));
    }
    cl.f.sort((p, q) => p.y - q.y);
    cache.set(key, cl);
    return cl;
  };
  const cellAtPt = (Z, x, y) => cellOf(Z, fl(x / M), fl(y / M));
  const cellsNear = (Z, x0, y0, x1, y1) => {
    const out = [];
    for (let cy = fl((y0 - 900) / M); cy <= fl((y1 + 900) / M); cy++) for (let cx = fl((x0 - 900) / M); cx <= fl((x1 + 900) / M); cx++) out.push(cellOf(Z, cx, cy));
    return out;
  };

  /* ================= Floor art (cached) ================= */
  const ring = (cl, off) => {
    const p = new Path2D();
    for (let i = 0; i < NA; i++) { const r = Math.max(6, cl.rr[i] + off), x = cl.bx + CO[i] * r, y = cl.by + SI[i] * r; if (i) p.lineTo(x, y); else p.moveTo(x, y); }
    p.closePath(); return p;
  };
  const drawBay = (c, Z, cl) => {
    c.fillStyle = '#b89d69'; c.fill(ring(cl, 66));
    c.fillStyle = '#a88e5e'; c.fill(ring(cl, 32));
    c.fillStyle = '#9a8256'; c.fill(ring(cl, 12));
    c.fillStyle = '#5db1a3'; c.fill(ring(cl, 0));
    c.fillStyle = '#479f9f'; c.fill(ring(cl, -26));
    c.fillStyle = '#378a9b'; c.fill(ring(cl, -70));
    c.fillStyle = '#2c7491'; c.fill(ring(cl, -128));
    const g = c.createRadialGradient(cl.bx, cl.by, 10, cl.bx, cl.by, cl.R0 * .78);
    g.addColorStop(0, '#163a58'); g.addColorStop(.7, '#1c4f70'); g.addColorStop(1, '#255f80');
    c.fillStyle = g; c.fill(ring(cl, -196));
    // rippled sand bottom, seagrass, coral heads
    const rp = new Path2D(), sg = new Path2D(), co = new Path2D(), co2 = new Path2D(), bi = fl(cl.bx), bj = fl(cl.by);
    for (let i = 0; i < NA; i += 2) {
      const hh = Z.hash(bi + i * 7, bj - i * 3), j = i + 2;
      if (hh < .55) { const o = 12 + hh * 22; rp.moveTo(cl.bx + CO[i] * (cl.rr[i] - o), cl.by + SI[i] * (cl.rr[i] - o)); rp.lineTo(cl.bx + CO[j] * (cl.rr[j] - o), cl.by + SI[j] * (cl.rr[j] - o)); }
      if (hh > .8) { const r = cl.rr[i] - 46 - hh * 40, x = cl.bx + CO[i] * r, y = cl.by + SI[i] * r; circ(co, x, y, 4 + hh * 4); circ(co2, x - 1.5, y - 1.5, 2 + hh * 2); }
      else if (hh > .6) { const r = cl.rr[i] - 92 - hh * 70, x = cl.bx + CO[i] * r, y = cl.by + SI[i] * r; sg.moveTo(x, y); sg.lineTo(x - 3, y - 8); sg.moveTo(x + 2, y); sg.lineTo(x + 3, y - 9); sg.moveTo(x + 4, y); sg.lineTo(x + 8, y - 6); }
    }
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(205,240,226,.32)'; c.lineWidth = 2; c.stroke(rp);
    c.strokeStyle = '#2b7466'; c.lineWidth = 1.6; c.stroke(sg);
    c.fillStyle = '#ad7a70'; c.fill(co); c.fillStyle = '#cf9a8a'; c.fill(co2);
    c.strokeStyle = 'rgba(244,250,240,.8)'; c.lineWidth = 2.4; c.stroke(ring(cl, 2));
    c.strokeStyle = 'rgba(110,88,56,.45)'; c.lineWidth = 1.4; c.stroke(ring(cl, 42));
    c.lineCap = 'butt';
  };
  const blob = (x, y, r, n, a1, a2, p, q, off) => {
    const o = new Path2D();
    for (let i = 0; i < n; i++) { const t = i / n * TAU, rr = Math.max(4, r * (1 + a1 * Math.sin(3 * t + p) + a2 * Math.sin(7 * t + q)) + off), px = x + Math.cos(t) * rr, py = y + Math.sin(t) * rr; if (i) o.lineTo(px, py); else o.moveTo(px, py); }
    o.closePath(); return o;
  };
  const drawPool = (c, Z, p) => {
    c.fillStyle = '#a88e5e'; c.fill(blob(p.x, p.y, p.r, 24, .15, .07, p.p, 1, 14));
    c.fillStyle = '#4fa59f'; c.fill(blob(p.x, p.y, p.r, 24, .15, .07, p.p, 1, 0));
    c.fillStyle = '#2f7b8d'; c.fill(blob(p.x, p.y, p.r * .5, 24, .15, .07, p.p, 1, 0));
    c.strokeStyle = 'rgba(240,250,240,.7)'; c.lineWidth = 1.8; c.stroke(blob(p.x, p.y, p.r, 24, .15, .07, p.p, 1, 1.5));
    const st = new Path2D(), sf = new Path2D();
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + p.p, d = p.r + 10 + Z.hash(i, fl(p.x)) * 8; ell(st, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, 5 + i % 3, 3.5 + i % 2); }
    for (let i = 0; i < 3; i++) { const a = p.p + i * 2.1, d = p.r * .5; poly(sf, starPts(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, 6, 2.4)); }
    c.fillStyle = '#857f74'; c.fill(st); c.strokeStyle = '#4a463e'; c.lineWidth = 1; c.stroke(st);
    c.fillStyle = '#d8784e'; c.fill(sf);
  };
  const starPts = (x, y, R, r) => { const a = []; for (let i = 0; i < 10; i++) { const t = -PI / 2 + i * PI / 5, d = i & 1 ? r : R; a.push(x + Math.cos(t) * d, y + Math.sin(t) * d); } return a; };
  const drawGrass = (c, Z, g) => {
    c.fillStyle = '#a6a26c'; c.fill(blob(g.x, g.y, g.r, 48, .14, .07, g.p, g.q, 16));
    c.fillStyle = '#7d9256'; c.fill(blob(g.x, g.y, g.r, 48, .14, .07, g.p, g.q, 0));
    c.fillStyle = '#6f874c'; c.fill(blob(g.x + 20, g.y - 10, g.r * .55, 36, .2, .1, g.q, g.p, 0));
    const t1 = new Path2D(), t2 = new Path2D(), fl1 = new Path2D(), fl2 = new Path2D(), gi = fl(g.x), gj = fl(g.y);
    for (let i = 0; i < 90; i++) {
      const a = Z.hash(gi + i * 13, gj - i * 7) * TAU, d = Math.sqrt(Z.hash(gi - i * 5, gj + i * 11)) * g.r * 1.02, x = g.x + Math.cos(a) * d, y = g.y + Math.sin(a) * d, p = i % 3 ? t1 : t2;
      p.moveTo(x - 4, y); p.lineTo(x - 6, y - 7); p.moveTo(x, y); p.lineTo(x, y - 9); p.moveTo(x + 4, y); p.lineTo(x + 6, y - 7);
      if (i % 11 === 0) circ(fl1, x + 6, y - 3, 2.6); else if (i % 13 === 0) circ(fl2, x - 5, y - 2, 2.2);
    }
    c.lineCap = 'round';
    c.strokeStyle = '#566f3c'; c.lineWidth = 1.6; c.stroke(t1); c.strokeStyle = '#97ae66'; c.lineWidth = 1.4; c.stroke(t2);
    c.lineCap = 'butt';
    c.fillStyle = '#d64848'; c.fill(fl1); c.fillStyle = '#e6cf5a'; c.fill(fl2);
  };
  // shells, starfish, seaweed, gull tracks, driftwood and pebbles on the sand
  const decals = (c, Z, x0, y0, x1, y1) => {
    const G = 56, sw = new Path2D(), shl = new Path2D(), shr = new Path2D(), sf = new Path2D(), tr = new Path2D(), dw = new Path2D(), pb = new Path2D();
    for (let gy = fl(y0 / G); gy <= fl(y1 / G); gy++) for (let gx = fl(x0 / G); gx <= fl(x1 / G); gx++) {
      const h = Z.hash(gx * 19 + 3, gy * 29 - 1);
      if (h > .24) continue;
      const x = gx * G + Z.hash(gx, gy * 3 + 1) * G, y = gy * G + Z.hash(gx * 3 + 2, gy) * G;
      const d = shoreD(cellAtPt(Z, x, y), x, y);
      if (d < 8) continue;
      const g = cellOf(Z, Math.round(x / M), Math.round(y / M)).grass;
      if (g && Math.hypot(x - g.x, y - g.y) < g.r * 1.22) continue;
      if (d < 62) {
        if (h < .1) { sw.moveTo(x - 11, y); sw.quadraticCurveTo(x - 5, y - 5, x, y); sw.quadraticCurveTo(x + 5, y + 5, x + 11, y - 1); }
        else if (h < .15) { shl.moveTo(x, y + 3); shl.arc(x, y + 3, 5, PI * 1.1, PI * 1.9); shl.closePath(); shr.moveTo(x, y + 3); shr.lineTo(x - 3, y - 1); shr.moveTo(x, y + 3); shr.lineTo(x + 3, y - 1); }
        else { ell(pb, x, y, 3, 2); ell(pb, x + 6, y + 2, 2, 1.5); }
      } else if (d < 420) {
        if (h < .04) poly(sf, starPts(x, y, 7, 2.8));
        else if (h < .09) { shl.moveTo(x, y + 3); shl.arc(x, y + 3, 5.5, PI * 1.1, PI * 1.9); shl.closePath(); shr.moveTo(x, y + 3); shr.lineTo(x, y - 2); }
        else if (h < .14) for (let k = 0; k < 3; k++) { const px = x + k * 9, py = y + (k & 1) * 6; tr.moveTo(px, py); tr.lineTo(px + 4, py - 2.5); tr.moveTo(px, py); tr.lineTo(px + 4, py + 2.5); tr.moveTo(px, py); tr.lineTo(px - 3, py); }
        else if (h < .17) { dw.moveTo(x - 16, y + 2); dw.lineTo(x + 14, y - 3); dw.moveTo(x + 4, y - 1); dw.lineTo(x + 9, y - 7); }
        else ell(pb, x, y, 2.6, 1.8);
      }
    }
    c.lineCap = 'round';
    c.strokeStyle = '#4f6a3e'; c.lineWidth = 2.2; c.stroke(sw);
    c.fillStyle = '#ead2c0'; c.fill(shl); c.strokeStyle = '#b48c7c'; c.lineWidth = 1; c.stroke(shr);
    c.fillStyle = '#d27a4c'; c.fill(sf); c.strokeStyle = '#8a4428'; c.lineWidth = 1; c.stroke(sf);
    c.strokeStyle = '#9c8152'; c.lineWidth = 1.2; c.stroke(tr);
    c.strokeStyle = '#6e5638'; c.lineWidth = 3.4; c.stroke(dw); c.strokeStyle = '#9c8058'; c.lineWidth = 1.6; c.stroke(dw);
    c.fillStyle = '#9a8a70'; c.fill(pb);
    c.lineCap = 'butt';
  };
  const drawDock = (c, cl) => {
    const d = cl.dock, L = d.L, rot = d.a + PI;
    c.save(); c.translate(d.ox, d.oy); c.rotate(rot);
    const deck = new Path2D(); deck.rect(-80, -18, L + 60, 36); deck.rect(L - 22, -66, 44, 132);
    c.save(); c.translate(Math.sin(rot) * 10, Math.cos(rot) * 10); c.fillStyle = 'rgba(12,40,50,.34)'; c.fill(deck); c.restore();
    const po = new Path2D();
    for (let u = -40; u <= L - 30; u += 42) { po.rect(u - 4, -25, 8, 8); po.rect(u - 4, 17, 8, 8); }
    for (const v of [-66, -24, 16, 58]) { po.rect(L - 27, v, 8, 8); po.rect(L + 19, v, 8, 8); }
    c.fillStyle = '#463020'; c.fill(po);
    c.fillStyle = '#8c6a44'; c.fill(deck);
    const pl = new Path2D(), lt = new Path2D();
    for (let k = 0; k * 8 < L + 58; k++) { const u = -80 + k * 8; pl.rect(u, -18, 1.2, 36); if (k & 1) lt.rect(u + 1.2, -18, 6.8, 36); }
    for (let k = 0; k < 17; k++) { const v = -66 + k * 8; pl.rect(L - 22, v, 44, 1.2); if (k & 1) lt.rect(L - 22, v + 1.2, 44, 6.8); }
    c.fillStyle = '#9c7b50'; c.fill(lt); c.fillStyle = '#5e4428'; c.fill(pl);
    const bm = new Path2D(); bm.rect(-80, -19, L + 58, 3); bm.rect(-80, 16, L + 58, 3); bm.rect(L - 22, -67, 44, 3); bm.rect(L - 22, 64, 44, 3);
    c.fillStyle = '#6a4c2e'; c.fill(bm);
    c.strokeStyle = '#3a2614'; c.lineWidth = 1.2; c.stroke(deck);
    const bo = new Path2D(); circ(bo, L - 17, -61, 4); circ(bo, L + 16, -61, 4); circ(bo, L - 17, 61, 4); circ(bo, L + 16, 61, 4);
    c.fillStyle = '#3a2a1c'; c.fill(bo);
    const rp = new Path2D(); rp.moveTo(L + 16, -61); rp.quadraticCurveTo(L + 32, -40, L + 26, -16);
    c.strokeStyle = '#c8b078'; c.lineWidth = 1.6; c.stroke(rp);
    c.restore();
  };

  // ---- raised objects ----
  const drawPalm = (c, f) => {
    const s = f.s, x = f.x, y = f.y, H = 105 * s, tx = x + f.lean * H + f.bend * .2, ty = y - H;
    const sh = new Path2D(); ell(sh, x + 26 * s, y + 4, 36 * s, 11 * s); ell(sh, x + 2, y + 1, 10 * s, 4 * s);
    c.fillStyle = 'rgba(70,52,22,.22)'; c.fill(sh);
    const tr = new Path2D(), N = 7, P = [];
    for (let i = 0; i <= N; i++) { const t = i / N; P.push([x + f.lean * H * t + Math.sin(t * PI) * f.bend + f.bend * .2 * t * t, y - H * t, (7.5 - 3.4 * t) * s]); }
    tr.moveTo(P[0][0] - P[0][2], P[0][1]);
    for (let i = 1; i <= N; i++) tr.lineTo(P[i][0] - P[i][2], P[i][1]);
    for (let i = N; i >= 0; i--) tr.lineTo(P[i][0] + P[i][2], P[i][1]);
    tr.closePath();
    c.fillStyle = '#93704a'; c.fill(tr); c.strokeStyle = '#4a3420'; c.lineWidth = 1.2; c.stroke(tr);
    const rg = new Path2D();
    for (let i = 0; i < N; i++) for (const k of [.25, .75]) {
      const ax = P[i][0] + (P[i + 1][0] - P[i][0]) * k, ay = P[i][1] + (P[i + 1][1] - P[i][1]) * k, w = P[i][2];
      rg.moveTo(ax - w, ay); rg.quadraticCurveTo(ax, ay + 2.6 * s, ax + w, ay - .6);
    }
    c.strokeStyle = '#5e4428'; c.lineWidth = 1.1; c.stroke(rg);
    const back = new Path2D(), front = new Path2D(), ribB = new Path2D(), ribF = new Path2D();
    for (let k = 0; k < 7; k++) {
      const a = f.rot + k / 7 * TAU, ca = Math.cos(a), sa = Math.sin(a), len = (46 + ((k * 7) % 5) * 3) * s;
      const ex = tx + ca * len, ey = ty + sa * len * .42 + 24 * s, cxp = tx + ca * len * .55, cyp = ty + sa * len * .22 - 15 * s, w = 7.5 * s;
      const p = sa < -.15 ? back : front, rb = sa < -.15 ? ribB : ribF;
      p.moveTo(tx, ty - 1); p.quadraticCurveTo(cxp, cyp - w, ex, ey); p.quadraticCurveTo(cxp + ca * 2, cyp + w, tx, ty + 2); p.closePath();
      rb.moveTo(tx, ty); rb.quadraticCurveTo(cxp, cyp, ex, ey);
      for (let j = 1; j < 5; j++) {
        const t = j / 5, qx = (1 - t) * (1 - t) * tx + 2 * (1 - t) * t * cxp + t * t * ex, qy = (1 - t) * (1 - t) * ty + 2 * (1 - t) * t * cyp + t * t * ey;
        rb.moveTo(qx, qy); rb.lineTo(qx + ca * 3 * s, qy + 5 * s);
      }
    }
    c.fillStyle = '#3e6a33'; c.fill(back); c.strokeStyle = '#24401c'; c.lineWidth = 1.1; c.stroke(back);
    c.strokeStyle = '#2a4a22'; c.lineWidth = 1; c.stroke(ribB);
    const nut = new Path2D(); circ(nut, tx - 4 * s, ty + 4 * s, 3.6 * s); circ(nut, tx + 3 * s, ty + 5 * s, 3.6 * s); circ(nut, tx, ty + 1 * s, 3.4 * s);
    c.fillStyle = '#5a3c20'; c.fill(nut); c.strokeStyle = '#2e1c0e'; c.lineWidth = 1; c.stroke(nut);
    c.fillStyle = '#578a40'; c.fill(front); c.strokeStyle = '#2a4a20'; c.lineWidth = 1.1; c.stroke(front);
    c.strokeStyle = '#7aa752'; c.lineWidth = 1; c.stroke(ribF);
  };
  const drawRock = (c, f) => {
    const x = f.x, y = f.y, s = f.s, v = f.v;
    const body = new Path2D(), top = new Path2D(), cr = new Path2D();
    const L = [[0, 0, 1], [-.75, .15, .62 + v * .2], [.7, .2, .55 + (1 - v) * .2]];
    if (f.wet) {
      const w = new Path2D(); ell(w, x, y + 2, s * 1.65, s * .55);
      c.fillStyle = 'rgba(20,62,72,.35)'; c.fill(w);
      c.strokeStyle = 'rgba(236,248,240,.6)'; c.lineWidth = 1.6; c.stroke(w);
    } else { const w = new Path2D(); ell(w, x + s * .3, y + 3, s * 1.5, s * .45); c.fillStyle = 'rgba(70,52,22,.24)'; c.fill(w); }
    for (const [ox, oy, k] of L) {
      const rx = s * k, ry = s * k * .82, cx = x + ox * s, cy = y + oy * s - ry * .55;
      ell(body, cx, cy, rx, ry); ell(top, cx - rx * .22, cy - ry * .32, rx * .62, ry * .48);
    }
    cr.moveTo(x - s * .2, y - s * .9); cr.lineTo(x + s * .05, y - s * .5); cr.lineTo(x - s * .1, y - s * .2);
    c.fillStyle = f.wet ? '#6e6b64' : '#7c776c'; c.fill(body); c.strokeStyle = '#3d3a34'; c.lineWidth = 1.3; c.stroke(body);
    c.fillStyle = f.wet ? '#8a877e' : '#9a948a'; c.fill(top);
    c.strokeStyle = '#55514a'; c.lineWidth = 1.1; c.stroke(cr);
    if (f.wet) { const b = new Path2D(); for (let i = 0; i < 5; i++) circ(b, x - s + i * s * .5, y - 2 + (i & 1) * 2, 1.6); c.fillStyle = '#4f6e4a'; c.fill(b); }
  };
  const drawSkull = (c, f) => {
    const x = f.x, y = f.y;
    const w = new Path2D(); ell(w, x, y + 4, 72, 18);
    c.fillStyle = 'rgba(18,60,72,.4)'; c.fill(w);
    const sk = new Path2D(); sk.moveTo(x - 48, y + 2); sk.quadraticCurveTo(x - 64, y - 66, x - 30, y - 94); sk.quadraticCurveTo(x, y - 116, x + 30, y - 94); sk.quadraticCurveTo(x + 64, y - 66, x + 48, y + 2); sk.closePath();
    c.fillStyle = '#8d8576'; c.fill(sk);
    const sd = new Path2D(); sd.moveTo(x + 18, y + 2); sd.quadraticCurveTo(x + 40, y - 50, x + 26, y - 96); sd.quadraticCurveTo(x + 64, y - 66, x + 48, y + 2); sd.closePath();
    c.fillStyle = '#6f685c'; c.fill(sd);
    const hi = new Path2D(); ell(hi, x - 18, y - 88, 18, 9); ell(hi, x - 36, y - 64, 6, 12);
    c.fillStyle = '#a69e8e'; c.fill(hi);
    const ms = new Path2D(); ell(ms, x + 4, y - 102, 16, 5); ell(ms, x - 30, y - 92, 8, 4); ell(ms, x + 30, y - 88, 7, 3.5);
    c.fillStyle = '#6a8250'; c.fill(ms);
    c.strokeStyle = '#3a342c'; c.lineWidth = 1.6; c.stroke(sk);
    const ey = new Path2D(); ell(ey, x - 20, y - 58, 13, 15); ell(ey, x + 20, y - 58, 13, 15); poly(ey, [x, y - 46, x - 7, y - 32, x + 7, y - 32]);
    c.fillStyle = '#1e1a16'; c.fill(ey);
    const th = new Path2D(); th.moveTo(x - 30, y - 20); th.lineTo(x + 30, y - 20);
    for (let i = -3; i <= 3; i++) { th.moveTo(x + i * 8, y - 26); th.lineTo(x + i * 8, y - 8); }
    c.strokeStyle = '#3e382f'; c.lineWidth = 2; c.stroke(th);
    c.fillStyle = 'rgba(40,40,36,.35)'; c.fillRect(x - 50, y - 6, 100, 8);
    c.strokeStyle = 'rgba(238,250,242,.75)'; c.lineWidth = 2; c.stroke(w);
  };
  const drawWreck = (c, f) => {
    c.save(); c.translate(f.x, f.y);
    const sh = new Path2D(); ell(sh, 6, 6, 112, 18); c.fillStyle = 'rgba(70,52,22,.26)'; c.fill(sh);
    c.rotate(f.tilt); c.scale(f.m, 1);
    const hull = new Path2D(); hull.moveTo(-92, -6); hull.quadraticCurveTo(-98, -46, -72, -54); hull.lineTo(60, -50); hull.quadraticCurveTo(96, -48, 108, -30); hull.quadraticCurveTo(92, -6, 60, 2); hull.lineTo(-82, 2); hull.closePath();
    c.fillStyle = '#7c5c3c'; c.fill(hull);
    c.save(); c.clip(hull);
    const pl = new Path2D(); for (let k = 0; k < 7; k++) { pl.moveTo(-100, -48 + k * 8); pl.lineTo(110, -46 + k * 8); }
    c.strokeStyle = '#5a4028'; c.lineWidth = 1.3; c.stroke(pl);
    const hole = new Path2D(); poly(hole, [-40, -50, -22, -56, 4, -48, 12, -24, -6, -8, -30, -14, -46, -28]);
    c.fillStyle = '#22160c'; c.fill(hole);
    const rb = new Path2D(); for (const rx of [-34, -20, -6]) { rb.moveTo(rx, -54); rb.quadraticCurveTo(rx + 4, -30, rx, -8); }
    c.strokeStyle = '#6a4c30'; c.lineWidth = 3; c.stroke(rb);
    c.restore();
    c.strokeStyle = '#3a2614'; c.lineWidth = 1.4; c.stroke(hull);
    const br = new Path2D(); br.moveTo(-42, -50); br.lineTo(-48, -62); br.moveTo(-24, -55); br.lineTo(-20, -68); br.moveTo(6, -48); br.lineTo(14, -60);
    br.moveTo(30, -50); br.lineTo(52, -92); br.lineTo(48, -98); br.lineTo(56, -96);
    c.strokeStyle = '#3a2614'; c.lineWidth = 4.6; c.stroke(br); c.strokeStyle = '#8a6a46'; c.lineWidth = 2.6; c.stroke(br);
    const rag = new Path2D(); poly(rag, [52, -88, 70, -84, 74, -66, 68, -70, 64, -60, 60, -72, 54, -68]);
    c.fillStyle = '#cfc4a6'; c.fill(rag); c.strokeStyle = '#6e6450'; c.lineWidth = 1; c.stroke(rag);
    const dr = new Path2D(); ell(dr, 98, 0, 36, 14); ell(dr, -88, 3, 24, 9); ell(dr, 10, 4, 60, 6);
    c.fillStyle = '#c4a872'; c.fill(dr); c.strokeStyle = 'rgba(140,112,70,.6)'; c.lineWidth = 1; c.stroke(dr);
    c.restore();
  };
  const box = (c, x, y, w, d, h, top, front, ol) => {
    const p = new Path2D(); p.rect(x, y - h, w, d); p.rect(x, y + d - h, w, h);
    c.fillStyle = top; c.fillRect(x, y - h, w, d); c.fillStyle = front; c.fillRect(x, y + d - h, w, h);
    if (ol) { c.strokeStyle = ol; c.lineWidth = 1.2; c.stroke(p); }
  };
  const drawFort = (c, f) => {
    const w = FORT_W, d = FORT_D, h = FORT_H, L = f.x - w / 2, T = f.y - d / 2, DY = T - h;
    const sh = new Path2D(); sh.rect(L + 8, T + d - 4, w + 10, 14); c.fillStyle = 'rgba(70,52,22,.26)'; c.fill(sh);
    box(c, L, T, w, d, h, '#a59b8a', '#827769', '#3e382f');
    // masonry on the front face and flagstones on the deck
    const ms = new Path2D();
    for (let r = 0; r < 3; r++) { const yy = T + d - h + r * 10; ms.moveTo(L, yy); ms.lineTo(L + w, yy); for (let u = (r & 1) * 12 + 6; u < w; u += 24) { ms.moveTo(L + u, yy); ms.lineTo(L + u, yy + 10); } }
    for (let r = 1; r < 5; r++) { ms.moveTo(L, DY + r * 26); ms.lineTo(L + w, DY + r * 26); }
    for (let u = 30; u < w; u += 34) { ms.moveTo(L + u, DY); ms.lineTo(L + u, DY + d); }
    c.strokeStyle = '#6a6256'; c.lineWidth = 1; c.stroke(ms);
    const door = new Path2D(); door.moveTo(f.x - 13, T + d); door.lineTo(f.x - 13, T + d - 16); door.arc(f.x, T + d - 16, 13, PI, 0); door.lineTo(f.x + 13, T + d); door.closePath();
    c.fillStyle = '#2a2218'; c.fill(door); c.strokeStyle = '#5a5044'; c.lineWidth = 2; c.stroke(door);
    // back and side parapets
    box(c, L, DY, w, 12, 18, '#b2a897', '#8d8273', '#3e382f');
    box(c, L, DY + 12, 12, d - 12, 16, '#b2a897', '#8d8273', '#3e382f');
    box(c, L + w - 12, DY + 12, 12, d - 12, 16, '#b2a897', '#8d8273', '#3e382f');
    // flagpole base, powder kegs, shot pile
    c.fillStyle = '#3a2a1c'; c.fillRect(L + 15, DY + 20 - 128, 5, 128);
    const kg = new Path2D(); ell(kg, L + 40, DY + 30, 9, 6); ell(kg, L + 58, DY + 32, 9, 6); ell(kg, L + 49, DY + 22, 9, 6);
    c.fillStyle = '#6a4426'; c.fill(kg); c.strokeStyle = '#2e1c0e'; c.lineWidth = 1.2; c.stroke(kg);
    const sp = new Path2D(), bx0 = L + w - 46, by0 = DY + d - 34;
    for (const [a, b] of [[0, 0], [9, 0], [18, 0], [4.5, -7], [13.5, -7], [9, -14]]) circ(sp, bx0 + a, by0 + b, 5);
    c.fillStyle = '#26262c'; c.fill(sp); c.strokeStyle = '#0e0e12'; c.lineWidth = 1; c.stroke(sp);
    // cannons on carriages, aimed at the bay
    const ca = Math.cos(f.ca), sa = Math.sin(f.ca), car = new Path2D(), brl = new Path2D(), whl = new Path2D(), mz = new Path2D(), hl = new Path2D();
    for (let i = 0; i < 3; i++) {
      const cx = L + 62 + i * 54, cy = DY + d * .55, px = -sa, py = ca;
      poly(car, [cx - ca * 12 + px * 9, cy - sa * 12 + py * 9, cx + ca * 12 + px * 9, cy + sa * 12 + py * 9, cx + ca * 12 - px * 9, cy + sa * 12 - py * 9, cx - ca * 12 - px * 9, cy - sa * 12 - py * 9]);
      for (const [u, v] of [[-9, 10], [9, 10], [-9, -10], [9, -10]]) circ(whl, cx + ca * u + px * v, cy + sa * u + py * v, 3.4);
      poly(brl, [cx - ca * 14 + px * 6, cy - sa * 14 + py * 6, cx + ca * 26 + px * 4, cy + sa * 26 + py * 4, cx + ca * 26 - px * 4, cy + sa * 26 - py * 4, cx - ca * 14 - px * 6, cy - sa * 14 - py * 6]);
      circ(brl, cx - ca * 15, cy - sa * 15, 4);
      circ(mz, cx + ca * 27, cy + sa * 27, 4.6);
      hl.moveTo(cx - ca * 10 + px * 3, cy - sa * 10 + py * 3); hl.lineTo(cx + ca * 22 + px * 2, cy + sa * 22 + py * 2);
    }
    c.fillStyle = '#6a4628'; c.fill(car); c.strokeStyle = '#2e1c0e'; c.lineWidth = 1.2; c.stroke(car);
    c.fillStyle = '#2a1e14'; c.fill(whl);
    c.fillStyle = '#2b2b31'; c.fill(brl); c.fill(mz); c.strokeStyle = '#0c0c10'; c.lineWidth = 1.2; c.stroke(brl); c.stroke(mz);
    c.strokeStyle = '#6a6a78'; c.lineWidth = 1.4; c.stroke(hl);
    // front parapet with merlons
    box(c, L, DY + d - 12, w, 12, 10, '#b2a897', '#8d8273', '#3e382f');
    for (let u = 0; u < w; u += 34) box(c, L + u, DY + d - 22, 20, 10, 12, '#bab09f', '#958a7a', '#3e382f');
  };
  const drawChest = (c, f) => {
    const x = f.x, y = f.y;
    const md = new Path2D(); ell(md, x, y + 1, 28, 10); c.fillStyle = '#b39762'; c.fill(md);
    const lid = new Path2D(); poly(lid, [x - 15, y - 13, x + 15, y - 13, x + 12, y - 28, x - 12, y - 28]);
    c.fillStyle = '#8f5a2c'; c.fill(lid); c.strokeStyle = '#3a1e0c'; c.lineWidth = 1.2; c.stroke(lid);
    const gd = new Path2D(); ell(gd, x, y - 14, 13, 4.5); circ(gd, x - 4, y - 16, 4); circ(gd, x + 5, y - 15, 3.4);
    c.fillStyle = '#f0c448'; c.fill(gd);
    c.fillStyle = '#fff0a0'; c.fillRect(x - 6, y - 19, 2.4, 2.4); c.fillRect(x + 4, y - 17, 2, 2);
    const fr = new Path2D(); fr.rect(x - 15, y - 13, 30, 15);
    c.fillStyle = '#7a4824'; c.fill(fr); c.strokeStyle = '#3a1e0c'; c.stroke(fr);
    const bd = new Path2D(); bd.rect(x - 10, y - 13, 3, 15); bd.rect(x + 7, y - 13, 3, 15); bd.rect(x - 11, y - 25, 3, 12); bd.rect(x + 8, y - 25, 3, 12);
    c.fillStyle = '#3a3a40'; c.fill(bd);
    c.fillStyle = '#e8b840'; c.fillRect(x - 2.5, y - 12, 5, 6);
    const sd = new Path2D(); ell(sd, x - 2, y + 1, 24, 7); c.fillStyle = '#c4a872'; c.fill(sd); c.strokeStyle = 'rgba(140,112,70,.6)'; c.lineWidth = 1; c.stroke(sd);
  };
  const drawBarrel = (c, f) => {
    const x = f.x, y = f.y;
    const b = new Path2D(); b.moveTo(x - 10, y); b.quadraticCurveTo(x - 13, y - 12, x - 10, y - 24); b.lineTo(x + 10, y - 24); b.quadraticCurveTo(x + 13, y - 12, x + 10, y); b.ellipse(x, y, 10, 3.6, 0, 0, PI); b.closePath();
    c.fillStyle = 'rgba(40,30,15,.25)'; c.fillRect(x - 8, y - 1, 22, 5);
    c.fillStyle = '#8a5a32'; c.fill(b); c.strokeStyle = '#33200e'; c.lineWidth = 1.2; c.stroke(b);
    const tp = new Path2D(); ell(tp, x, y - 24, 10, 3.6); c.fillStyle = '#a8744a'; c.fill(tp); c.stroke(tp);
    const bn = new Path2D(); bn.moveTo(x - 11.5, y - 6); bn.lineTo(x + 11.5, y - 6); bn.moveTo(x - 11.5, y - 18); bn.lineTo(x + 11.5, y - 18);
    bn.moveTo(x - 4, y - 14); bn.lineTo(x - 1, y - 10); bn.moveTo(x - 1, y - 14); bn.lineTo(x - 4, y - 10); bn.moveTo(x + 1, y - 14); bn.lineTo(x + 4, y - 10); bn.moveTo(x + 4, y - 14); bn.lineTo(x + 1, y - 10);
    c.strokeStyle = '#3a2a1c'; c.lineWidth = 1.8; c.stroke(bn);
  };
  const drawCrate = (c, f) => {
    const x = f.x - 13, y = f.y - 18;
    c.fillStyle = 'rgba(40,30,15,.25)'; c.fillRect(x + 4, f.y - 2, 28, 6);
    box(c, x, y, 26, 18, 22, '#b8925c', '#977246', '#3e2a14');
    const p = new Path2D(); p.moveTo(x, f.y); p.lineTo(x + 26, f.y - 22); p.moveTo(x + 26, f.y); p.lineTo(x, f.y - 22); p.moveTo(x, y - 22 + 9); p.lineTo(x + 26, y - 22 + 9);
    c.strokeStyle = '#5e4224'; c.lineWidth = 1.6; c.stroke(p);
  };
  const drawRope = (c, f) => {
    const p = new Path2D(); for (let k = 0; k < 3; k++) ell(p, f.x, f.y - 2, 13 - k * 4, 6 - k * 1.8);
    c.strokeStyle = '#6e5634'; c.lineWidth = 3.6; c.stroke(p); c.strokeStyle = '#cdb27a'; c.lineWidth = 2; c.stroke(p);
  };
  const drawLamp = (c, f) => {
    const x = f.x, y = f.y;
    const p = new Path2D(); p.rect(x - 2, y - 46, 4, 46); p.rect(x - 2, y - 47, 13, 3);
    c.fillStyle = '#5a3e22'; c.fill(p); c.strokeStyle = '#2a1a0c'; c.lineWidth = 1; c.stroke(p);
    const ln = new Path2D(); ln.rect(x + 5, y - 42, 8, 10);
    c.fillStyle = '#ffd27a'; c.fill(ln); c.strokeStyle = '#2a2420'; c.lineWidth = 1.4; c.stroke(ln);
    c.fillStyle = '#2a2420'; c.fillRect(x + 4, y - 44, 10, 2.5);
  };

  // ---- the ghost galleon (static parts; sails, pennant and glow are animated in under) ----
  const MX = [-100, 4, 104], MT = [-300, -360, -290], YW = [[56, 74], [70, 92], [54, 72]];
  const yardY = i => [MT[i] + 26, MT[i] + (-80 - MT[i]) * .5];
  const HULL = new Path2D();
  HULL.moveTo(-176, -98); HULL.lineTo(-148, -100); HULL.lineTo(-145, -84); HULL.lineTo(-92, -82); HULL.lineTo(-90, -72); HULL.lineTo(96, -68);
  HULL.lineTo(100, -80); HULL.lineTo(150, -84); HULL.quadraticCurveTo(176, -86, 188, -94); HULL.quadraticCurveTo(170, -40, 128, -6);
  HULL.quadraticCurveTo(110, 4, 80, 6); HULL.lineTo(-140, 6); HULL.quadraticCurveTo(-162, 0, -168, -30); HULL.closePath();
  const drawShip = (c, f) => {
    c.save(); c.translate(f.x, f.y); c.scale(f.m, 1);
    const sub = new Path2D(); ell(sub, 0, 12, 196, 24); c.fillStyle = 'rgba(14,60,64,.5)'; c.fill(sub);
    const rf = new Path2D(); for (let i = 0; i < 6; i++) { const yy = 14 + i * 7, w = 176 - i * 24; rf.moveTo(-w, yy); rf.lineTo(w * .9, yy); }
    c.lineCap = 'round'; c.strokeStyle = 'rgba(140,255,215,.2)'; c.lineWidth = 3; c.stroke(rf);
    // masts, yards, bowsprit
    const mp = new Path2D();
    for (let i = 0; i < 3; i++) {
      mp.moveTo(MX[i], -72); mp.lineTo(MX[i], MT[i]);
      const [y1, y2] = yardY(i); mp.moveTo(MX[i] - YW[i][0], y1); mp.lineTo(MX[i] + YW[i][0], y1); mp.moveTo(MX[i] - YW[i][1], y2); mp.lineTo(MX[i] + YW[i][1], y2);
    }
    mp.moveTo(150, -86); mp.lineTo(264, -134);
    c.strokeStyle = '#123c38'; c.lineWidth = 6; c.stroke(mp); c.strokeStyle = '#6fcfb4'; c.lineWidth = 3; c.stroke(mp);
    const rg = new Path2D();
    for (let i = 0; i < 3; i++) { rg.moveTo(MX[i], MT[i]); rg.lineTo(MX[i] - 58, -76); rg.moveTo(MX[i], MT[i]); rg.lineTo(MX[i] + 58, -72); rg.moveTo(MX[i], MT[i] + 60); rg.lineTo(MX[i] - 40, -76); rg.moveTo(MX[i], MT[i] + 60); rg.lineTo(MX[i] + 40, -72); }
    rg.moveTo(-176, -100); rg.lineTo(MX[0], MT[0]); rg.lineTo(MX[1], MT[1]); rg.lineTo(MX[2], MT[2]); rg.lineTo(264, -134);
    c.strokeStyle = 'rgba(160,255,220,.33)'; c.lineWidth = 1; c.stroke(rg);
    const cn = new Path2D(); cn.rect(MX[1] - 11, MT[1] + 36, 22, 9);
    c.fillStyle = '#2a6a60'; c.fill(cn); c.strokeStyle = '#b6ffe6'; c.lineWidth = 1.2; c.stroke(cn);
    // translucent hull with planks, holes, ribs and glowing ports
    c.globalAlpha = .8; c.fillStyle = '#2b7266'; c.fill(HULL); c.globalAlpha = 1;
    c.save(); c.clip(HULL);
    const pl = new Path2D(); for (let k = 0; k < 10; k++) { pl.moveTo(-190, -88 + k * 10); pl.lineTo(200, -90 + k * 10); }
    c.strokeStyle = 'rgba(100,210,180,.5)'; c.lineWidth = 1.2; c.stroke(pl);
    c.fillStyle = '#1b4f49'; c.fillRect(-190, -62, 390, 6);
    const ho = new Path2D(); poly(ho, [-60, -30, -40, -46, -18, -38, -10, -16, -34, -6, -54, -12]); poly(ho, [58, -44, 82, -52, 94, -32, 74, -18, 56, -26]);
    c.fillStyle = 'rgba(8,34,34,.85)'; c.fill(ho);
    const rb = new Path2D(); for (const rx of [-48, -34, -22]) { rb.moveTo(rx, -46); rb.lineTo(rx + 2, -6); } for (const rx of [66, 80]) { rb.moveTo(rx, -52); rb.lineTo(rx + 1, -18); }
    c.strokeStyle = '#5ec2a8'; c.lineWidth = 2.4; c.stroke(rb);
    const gp = new Path2D(); for (let i = 0; i < 6; i++) { const px = -136 + i * 46; if (i !== 2) gp.rect(px, -54, 10, 8); }
    gp.rect(-170, -94, 6, 7); gp.rect(-160, -94, 6, 7);
    c.fillStyle = '#b4ffe0'; c.fill(gp); c.strokeStyle = '#0d3430'; c.lineWidth = 1.4; c.stroke(gp);
    c.restore();
    c.strokeStyle = '#b6ffe6'; c.lineWidth = 1.8; c.stroke(HULL);
    const rl = new Path2D(); rl.moveTo(-176, -110); rl.lineTo(-146, -112); rl.moveTo(-90, -84); rl.lineTo(96, -80); rl.moveTo(100, -92); rl.lineTo(160, -96);
    for (let k = -170; k <= -150; k += 8) { rl.moveTo(k, -99); rl.lineTo(k, -111); }
    for (let k = -84; k <= 92; k += 12) { rl.moveTo(k, -72); rl.lineTo(k, -83); }
    for (let k = 104; k <= 156; k += 10) { rl.moveTo(k, -83); rl.lineTo(k, -95); }
    c.strokeStyle = 'rgba(180,255,230,.6)'; c.lineWidth = 1.2; c.stroke(rl);
    // skull figurehead and the anchor chain dropping into the water
    const fh = new Path2D(); circ(fh, 184, -84, 7); fh.rect(180, -80, 8, 6);
    c.fillStyle = '#d8fff0'; c.fill(fh); c.fillStyle = '#0d3430'; c.fillRect(184, -87, 3, 3); c.fillRect(186.5, -82, 2, 2);
    const ch = new Path2D(); for (let i = 0; i < 9; i++) { const t = i / 8; ell(ch, 140 + 18 * t, -50 + 56 * t, 2.6, 1.7); }
    c.strokeStyle = '#8ae8cc'; c.lineWidth = 1.2; c.stroke(ch);
    c.lineCap = 'butt';
    c.restore();
  };

  const EXT = []; // [half width, extent above, extent below]
  EXT[PALM] = [110, 190, 30]; EXT[ROCK] = [70, 70, 30]; EXT[SKULL] = [80, 130, 30]; EXT[WRECK] = [150, 130, 40]; EXT[FORT] = [140, 270, 90];
  EXT[CHEST] = [40, 40, 20]; EXT[BARREL] = [20, 40, 10]; EXT[CRATE] = [20, 50, 10]; EXT[ROPE] = [20, 15, 10]; EXT[LAMP] = [20, 60, 10]; EXT[SHIP] = [290, 420, 60];
  const DRAW = [];
  DRAW[PALM] = drawPalm; DRAW[ROCK] = drawRock; DRAW[SKULL] = drawSkull; DRAW[WRECK] = drawWreck; DRAW[FORT] = drawFort; DRAW[CHEST] = drawChest;
  DRAW[BARREL] = drawBarrel; DRAW[CRATE] = drawCrate; DRAW[ROPE] = drawRope; DRAW[LAMP] = drawLamp; DRAW[SHIP] = drawShip;

  const ground = (Z, x0, y0, x1, y1) => {
    const c = Z.ctx;
    c.fillStyle = SAND; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    // sand grain and soft dune shading
    const G = 36, g1 = new Path2D(), g2 = new Path2D(), g3 = new Path2D(), du = new Path2D();
    for (let gy = fl(y0 / G); gy <= fl(y1 / G); gy++) for (let gx = fl(x0 / G); gx <= fl(x1 / G); gx++) {
      const a = Z.hash(gx * 7 + 1, gy * 13 + 2), b = Z.hash(gx * 3 - 4, gy * 5 + 7), X = gx * G, Y = gy * G;
      g1.rect(X + a * G, Y + b * G, 2, 2); g2.rect(X + b * G, Y + (1 - a) * G, 2, 1.5);
      if (a < .3) g3.rect(X + a * 3 * G * .9, Y + b * G * .7, 3, 1.4);
      if (a > .93) { du.moveTo(X - 20, Y + 10); du.quadraticCurveTo(X + 10, Y + 2, X + 44, Y + 12); }
    }
    c.fillStyle = '#b89a64'; c.fill(g1); c.fillStyle = '#d6bd8a'; c.fill(g2); c.fillStyle = '#ab8f5c'; c.fill(g3);
    c.strokeStyle = 'rgba(150,122,78,.4)'; c.lineWidth = 1.4; c.stroke(du);
    const cells = cellsNear(Z, x0, y0, x1, y1);
    const vis = (x, y, rx, up, dn) => x + rx > x0 && x - rx < x1 && y + dn > y0 && y - up < y1;
    for (const cl of cells) { const g = cl.grass; if (g && vis(g.x, g.y, g.r * 1.3, g.r * 1.3, g.r * 1.3)) drawGrass(c, Z, g); }
    for (const cl of cells) if (vis(cl.bx, cl.by, cl.R0 * 1.3, cl.R0 * 1.3, cl.R0 * 1.3)) drawBay(c, Z, cl);
    for (const cl of cells) if (cl.pool && vis(cl.pool.x, cl.pool.y, 120, 120, 120)) drawPool(c, Z, cl.pool);
    decals(c, Z, x0, y0, x1, y1);
    const cn = new Path2D(), cg = new Path2D();
    for (const cl of cells) for (const [x, y] of cl.coins) if (vis(x, y, 6, 6, 6)) { ell(cn, x, y, 3.4, 2.3); cg.rect(x - 1.6, y - 1.4, 1.6, 1.2); }
    c.fillStyle = '#e2b93e'; c.fill(cn); c.strokeStyle = '#8a6418'; c.lineWidth = .8; c.stroke(cn); c.fillStyle = '#fff2b0'; c.fill(cg);
    for (const cl of cells) { const d = cl.dock, mx = d.ox + d.dx * d.L * .5, my = d.oy + d.dy * d.L * .5; if (vis(mx, my, d.L * .5 + 110, d.L * .5 + 110, d.L * .5 + 110)) drawDock(c, cl); }
    const list = [];
    for (const cl of cells) for (const f of cl.f) { const e = EXT[f.k]; if (vis(f.x, f.y, e[0], e[1], e[2])) list.push(f); }
    list.sort((p, q) => p.y - q.y);
    c.lineJoin = 'round';
    for (const f of list) DRAW[f.k](c, f);
    c.lineJoin = 'miter';
  };

  /* ================= Under (animated, before foes): surf, shimmer, ghost sails, flags ================= */
  const under = Z => {
    const c = Z.ctx, P = Z.P, now = Z.now, hw = Z.W / 2 + 100, hh = Z.H / 2 + 100;
    const x0 = P.x - hw, x1 = P.x + hw, y0 = P.y - hh, y1 = P.y + hh;
    const cells = cellsNear(Z, x0, y0, x1, y1);
    const wash = new Path2D(), foam = new Path2D(), foam2 = new Path2D(), dash = new Path2D(), spk = new Path2D();
    let any = false;
    for (const cl of cells) {
      const R = cl.R0 * 1.3;
      if (cl.bx + R < x0 || cl.bx - R > x1 || cl.by + R < y0 || cl.by - R > y1) continue;
      any = true;
      const ph = cl.R0, rr = cl.rr, bx = cl.bx, by = cl.by;
      let po = rr[0] + 3 + 10 * (.5 + .5 * Math.sin(now * 1.2 + ph));
      for (let i = 0; i < NA; i++) {
        const sw = Math.sin(now * 1.2 + (i + 1) * .26 + ph), pn = rr[i + 1] + 3 + 10 * (.5 + .5 * sw), ri = Math.max(6, rr[i] - 18), rj = Math.max(6, rr[i + 1] - 18);
        if (!cl.skip[i] && !cl.skip[i + 1]) {
          wash.moveTo(bx + CO[i] * po, by + SI[i] * po); wash.lineTo(bx + CO[i + 1] * pn, by + SI[i + 1] * pn); wash.lineTo(bx + CO[i + 1] * rj, by + SI[i + 1] * rj); wash.lineTo(bx + CO[i] * ri, by + SI[i] * ri); wash.closePath();
          if (sw > -.25) { foam.moveTo(bx + CO[i] * po, by + SI[i] * po); foam.lineTo(bx + CO[i + 1] * pn, by + SI[i + 1] * pn); }
          const s2 = Math.sin(now * 1.7 - i * .4 + ph * 2);
          if (s2 > .3) { const a = rr[i] - 26 - 6 * s2, b = rr[i + 1] - 26 - 6 * s2; foam2.moveTo(bx + CO[i] * a, by + SI[i] * a); foam2.lineTo(bx + CO[i + 1] * b, by + SI[i + 1] * b); }
        }
        po = pn;
      }
    }
    if (any) {
      c.fillStyle = 'rgba(226,246,238,.22)'; c.fill(wash);
      c.lineCap = 'round';
      c.strokeStyle = 'rgba(250,255,250,.85)'; c.lineWidth = 2.4; c.stroke(foam);
      c.strokeStyle = 'rgba(232,250,244,.42)'; c.lineWidth = 1.6; c.stroke(foam2);
      // water shimmer on a world-anchored grid
      const G = 72;
      for (let gy = fl(y0 / G); gy <= fl(y1 / G); gy++) for (let gx = fl(x0 / G); gx <= fl(x1 / G); gx++) {
        const h = Z.hash(gx * 5 + 2, gy * 9 - 4), x = gx * G + h * 50, y = gy * G + Z.hash(gx, gy * 3) * 50, cl = cellAtPt(Z, x, y);
        if (shoreD(cl, x, y) > -36) continue;
        const sh = cl.ship; if (sh && Math.abs(x - sh.x) < 205 && y > sh.y - 112 && y < sh.y + 34) continue;
        const d = cl.dock, u = (x - d.ox) * d.dx + (y - d.oy) * d.dy, v = -(x - d.ox) * d.dy + (y - d.oy) * d.dx;
        if (u > -90 && u < d.L + 36 && Math.abs(v) < 76) continue;
        const v2 = Math.sin(now * 1.8 + h * 20);
        if (v2 < .15) continue;
        const ox = Math.sin(now * .9 + h * 9) * 8, l = 5 + v2 * 7;
        dash.moveTo(x + ox - l, y); dash.quadraticCurveTo(x + ox, y - 2.5, x + ox + l, y);
        if (v2 > .985) { spk.moveTo(x + ox - 5, y - 4); spk.lineTo(x + ox + 5, y - 4); spk.moveTo(x + ox, y - 9); spk.lineTo(x + ox, y + 1); }
      }
      c.strokeStyle = 'rgba(200,244,236,.42)'; c.lineWidth = 1.6; c.stroke(dash);
      c.strokeStyle = '#ffffff'; c.lineWidth = 1.4; c.stroke(spk);
      c.lineCap = 'butt';
    }
    for (const cl of cells) {
      const sh = cl.ship;
      if (sh && sh.x + 300 > x0 && sh.x - 300 < x1 && sh.y + 60 > y0 && sh.y - 420 < y1) drawSails(c, Z, sh, now);
      const fo = cl.fort;
      if (fo && Math.abs(fo.pole[0] - P.x) < hw + 80 && Math.abs(fo.pole[1] - P.y) < hh + 80) drawFlag(c, fo.pole[0], fo.pole[1], now);
    }
  };
  const drawSails = (c, Z, sh, now) => {
    c.save(); c.translate(sh.x, sh.y); c.scale(sh.m, 1);
    const sl = new Path2D(), rip = new Path2D(), pen = new Path2D(), em = new Path2D();
    for (let i = 0; i < 3; i++) {
      const [y1, y2] = yardY(i), b = 7 + 6 * Math.sin(now * 1.15 + i * 1.4), x = MX[i];
      const sail = (top, bot, wt, wb, k) => {
        sl.moveTo(x - wt, top); sl.lineTo(x + wt, top);
        sl.quadraticCurveTo(x + wb + b, (top + bot) / 2, x + wb, bot);
        const n = 7;
        for (let j = 1; j <= n; j++) {
          const t = j / n, tx = x + wb - 2 * wb * t, sag = Math.sin(t * PI) * b * .9, tear = ((j * 7 + i * 3 + k) % 4) * 4 + Math.sin(now * 3 + j + i) * 1.5;
          sl.lineTo(tx - wb / n * .5, bot + sag - tear); sl.lineTo(tx, bot + sag - (j === n ? 0 : 1));
        }
        sl.quadraticCurveTo(x - wb + b * .6, (top + bot) / 2, x - wt, top); sl.closePath();
        rip.moveTo(x - wb * .3, top + (bot - top) * .35); rip.lineTo(x - wb * .1 + b * .3, top + (bot - top) * .6);
      };
      sail(y1 + 2, y2 - 6, YW[i][0] * .92, YW[i][1] * .82, 0);
      sail(y2 + 2, -112, YW[i][1] * .92, YW[i][1] * .8, 1);
      if (i === 1) {
        const ex = x + b * .5, ey = (y2 - 112) / 2;
        circ(em, ex, ey - 4, 12); em.rect(ex - 7, ey + 4, 14, 7);
        em.moveTo(ex - 18, ey - 14); em.lineTo(ex + 18, ey + 18); em.lineTo(ex + 14, ey + 20); em.lineTo(ex - 20, ey - 10); em.closePath();
        em.moveTo(ex + 18, ey - 14); em.lineTo(ex - 18, ey + 18); em.lineTo(ex - 14, ey + 20); em.lineTo(ex + 20, ey - 10); em.closePath();
      }
    }
    // pennant streaming from the main truck
    const px = MX[1], py = MT[1];
    pen.moveTo(px, py - 4);
    for (let k = 1; k <= 8; k++) pen.lineTo(px + k * 9, py - 4 + Math.sin(now * 5 - k * .8) * k * .7 + k * .4);
    for (let k = 8; k >= 0; k--) pen.lineTo(px + k * 9, py + 4 - k * .45 + Math.sin(now * 5 - k * .8) * k * .7 + k * .4);
    pen.closePath();
    const pulse = .5 + .5 * Math.sin(now * 1.6);
    c.globalAlpha = .26 + pulse * .08; c.fillStyle = '#bdf8e4'; c.fill(sl);
    c.globalAlpha = .55; c.strokeStyle = '#e6fff6'; c.lineWidth = 1.2; c.stroke(sl);
    c.globalAlpha = .4; c.fillStyle = '#0e3a33'; c.fill(em, 'evenodd');
    c.strokeStyle = '#1d5e55'; c.lineWidth = 1.4; c.stroke(rip);
    c.globalAlpha = .7; c.fillStyle = '#9dffd8'; c.fill(pen);
    c.globalAlpha = 1;
    c.restore();
    Z.glow('110,255,200', 230, sh.x, sh.y - 160, .12 + pulse * .08);
    for (let i = 0; i < 6; i++) if (i !== 2) Z.glow('150,255,210', 15 + 4 * Math.sin(now * 3 + i), sh.x + sh.m * (-131 + i * 46), sh.y - 50, .5 + pulse * .2);
  };
  const drawFlag = (c, x, y, now) => {
    const fg = new Path2D(), wv = k => Math.sin(now * 6 - k * .18) * (k / 52) * 6;
    fg.moveTo(x + 2, y);
    for (let k = 4; k <= 52; k += 4) fg.lineTo(x + 2 + k, y + wv(k));
    const T = [0, 5, 2, 7, 3, 6, 1];
    for (let j = 0; j < T.length; j++) { const yy = y + j * 5; fg.lineTo(x + 54 - T[j] + wv(52), yy + wv(52)); }
    for (let k = 48; k >= 0; k -= 4) fg.lineTo(x + 2 + k, y + 32 + wv(k));
    fg.closePath();
    c.fillStyle = '#1c1a22'; c.fill(fg); c.strokeStyle = '#4a4452'; c.lineWidth = 1; c.stroke(fg);
    const ox = x + 24, oy = y + 15 + wv(22), em = new Path2D(), bn = new Path2D();
    circ(em, ox, oy - 2, 6.5); em.rect(ox - 4, oy + 3, 8, 4);
    bn.moveTo(ox - 13, oy - 9); bn.quadraticCurveTo(ox - 2, oy, ox + 12, oy + 11); bn.moveTo(ox + 13, oy - 9); bn.quadraticCurveTo(ox + 2, oy, ox - 12, oy + 11);
    c.lineCap = 'round'; c.strokeStyle = '#e8e2d2'; c.lineWidth = 2.2; c.stroke(bn);
    c.fillStyle = '#ece6d6'; c.fill(em);
    c.fillStyle = '#1c1a22'; c.fillRect(ox - 4, oy - 4, 3.4, 3); c.fillRect(ox - 1, oy + 3, 1.2, 4);
    c.strokeStyle = '#c8303e'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(ox - 7, oy - 6); c.lineTo(ox + 6, oy - 1); c.stroke();
    c.fillStyle = '#c8303e'; c.fillRect(ox + 1, oy - 4, 3.4, 3);
    c.lineCap = 'butt';
  };

  /* ================= Transient visuals (cannonballs, thrown anchors): a cosmetic cache keyed on Z.t ================= */
  const fx = [];
  const addFx = o => { if (fx.length > 90) fx.shift(); fx.push(o); };
  const ball = (Z, x, y, T) => addFx({ k: 'ball', x, y, t0: Z.t, T, dx: (Math.random() < .5 ? -1 : 1) * Z.rnd(120, 260) });
  const ANCHOR = new Path2D();
  ANCHOR.moveTo(0, -14); ANCHOR.lineTo(0, 14); ANCHOR.moveTo(-8, -9); ANCHOR.lineTo(8, -9);
  ANCHOR.moveTo(-13, 5); ANCHOR.quadraticCurveTo(-11, 15, 0, 15); ANCHOR.quadraticCurveTo(11, 15, 13, 5);
  ANCHOR.moveTo(-13, 5); ANCHOR.lineTo(-16, 9); ANCHOR.moveTo(13, 5); ANCHOR.lineTo(16, 9); ANCHOR.moveTo(3, -17); ANCHOR.arc(0, -17, 3, 0, TAU);
  const drawFx = (c, Z) => {
    const t = Z.t;
    for (let i = fx.length - 1; i >= 0; i--) { const o = fx[i]; if (t > o.t0 + o.T + .7 || t < o.t0 - 1) fx.splice(i, 1); }
    const bl = new Path2D(), sm = new Path2D(), gl = new Path2D();
    for (const o of fx) {
      const k = (t - o.t0) / o.T;
      if (o.k === 'ball') {
        if (k < 0 || k > 1) continue;
        const pos = uu => [o.x + o.dx * uu, o.y - 460 * uu - Math.sin((1 - uu) * PI) * 70];
        const [x, y] = pos(1 - k);
        circ(bl, x, y, 7.5); gl.rect(x - 3.6, y - 4.2, 2.6, 2.6);
        for (let j = 1; j <= 3; j++) { const [sx, sy] = pos(Math.min(1, 1 - k + j * .05)); circ(sm, sx, sy, 3 + j * 2.2); }
      } else if (o.k === 'anc') {
        const u = cl01(k), a = k <= 1 ? 1 : cl01(1 - (t - o.t0 - o.T) / .6);
        if (a <= 0) continue;
        const d = o.len * u, x = o.x0 + Math.cos(o.a) * d, y = o.y0 + Math.sin(o.a) * d, chn = new Path2D();
        for (let s = 0; s < d - 8; s += 14) { const p = o.x0 + Math.cos(o.a) * s, q = o.y0 + Math.sin(o.a) * s; chn.moveTo(p, q); chn.lineTo(p + Math.cos(o.a) * 7, q + Math.sin(o.a) * 7); }
        c.globalAlpha = a * .8; c.strokeStyle = '#9ff7dc'; c.lineWidth = 2.4; c.stroke(chn);
        c.save(); c.translate(x, y); c.rotate(o.a + PI / 2 + (k < 1 ? k * 9 : 0)); c.globalAlpha = a;
        c.strokeStyle = '#0e3a32'; c.lineWidth = 5.5; c.stroke(ANCHOR); c.strokeStyle = '#b4ffe6'; c.lineWidth = 2.8; c.stroke(ANCHOR);
        c.restore();
        Z.glow('120,255,210', 34, x, y, .5 * a);
        c.globalAlpha = 1;
      }
    }
    c.globalAlpha = .42; c.fillStyle = '#e8e4dc'; c.fill(sm); c.globalAlpha = 1;
    c.strokeStyle = '#ff9a50'; c.lineWidth = 2.4; c.stroke(bl);
    c.fillStyle = '#1e1c22'; c.fill(bl);
    c.fillStyle = '#ffffff'; c.fill(gl);
  };

  /* ================= Ambient (after darkness): ghost wisps, lanterns, glints, gulls ================= */
  const ambient = Z => {
    const c = Z.ctx, P = Z.P, now = Z.now, hw = Z.W / 2 + 140, hh = Z.H / 2 + 140;
    const inV = (x, y, m) => Math.abs(x - P.x) < hw + (m || 0) && Math.abs(y - P.y) < hh + (m || 0);
    let n = 0;
    c.save();
    const wisp = new Path2D(), gl = new Path2D();
    for (const cl of cellsNear(Z, P.x - hw, P.y - hh, P.x + hw, P.y + hh)) {
      const sh = cl.ship;
      if (sh && inV(sh.x, sh.y - 150, 300)) {
        for (let k = 0; k < 9; k++) {
          const x = sh.x + Math.sin(now * .37 + k * 2.1) * 210 + Math.sin(now * 1.3 + k) * 20, y = sh.y - 140 + Math.cos(now * .29 + k * 1.7) * 150;
          Z.glow('110,255,200', 22 + 6 * Math.sin(now * 3 + k), x, y, .4); circ(wisp, x, y, 2.4); n++;
        }
        Z.glow('150,255,210', 36 + Math.sin(now * 7) * 3, sh.x + sh.m * -165, sh.y - 92, .6); n++;
      }
      for (const [x, y] of cl.lamps) if (inV(x, y)) { Z.glow('255,190,90', 46 + Math.sin(now * 8 + x) * 3, x, y, .55); n++; }
      for (const f of cl.f) if (f.k === CHEST && inV(f.x, f.y)) { Z.glow('255,210,90', 30 + 4 * Math.sin(now * 2 + f.v * 9), f.x, f.y - 18, .35); n++; }
      for (const [x, y] of cl.coins) {
        if (n > 150 || !inV(x, y)) continue;
        const ph = (now * .7 + Z.hash(fl(x), fl(y)) * 9) % 3;
        if (ph > .4) continue;
        const u = Math.sin(ph / .4 * PI) * 5;
        gl.moveTo(x - u, y - 2); gl.lineTo(x + u, y - 2); gl.moveTo(x, y - 2 - u); gl.lineTo(x, y - 2 + u);
        Z.glow('255,230,140', 6 + u * 2, x, y - 2, .6); n++;
      }
    }
    c.globalAlpha = .8; c.fillStyle = '#d8fff0'; c.fill(wisp); c.globalAlpha = 1;
    c.strokeStyle = '#fffbe0'; c.lineWidth = 1.4; c.stroke(gl);
    // seagulls wheeling over the beaches
    const G = 560, gw = new Path2D();
    for (let gy = fl((P.y - hh) / G); gy <= fl((P.y + hh) / G); gy++) for (let gx = fl((P.x - hw) / G); gx <= fl((P.x + hw) / G); gx++) {
      const h = Z.hash(gx * 13 + 7, gy * 17 - 3);
      if (h > .5) continue;
      const a = now * (.3 + h * .5) * (h < .25 ? 1 : -1) + h * 20, x = gx * G + 280 + Math.cos(a) * (110 + h * 140), y = gy * G + 220 + Math.sin(a) * (60 + h * 70);
      const fp = Math.sin(now * 9 + h * 30) * 4;
      gw.moveTo(x - 11, y + fp * .5); gw.quadraticCurveTo(x - 5, y - 4 - fp, x, y); gw.quadraticCurveTo(x + 5, y - 4 - fp, x + 11, y + fp * .5);
    }
    c.lineCap = 'round';
    c.strokeStyle = '#4a5866'; c.lineWidth = 3.6; c.stroke(gw); c.strokeStyle = '#f6f6f0'; c.lineWidth = 2; c.stroke(gw);
    c.lineCap = 'butt';
    drawFx(c, Z);
    c.restore();
  };

  /* ================= Foes ================= */
  const COATS = ['#2c4a8c', '#7a2a6a', '#2a6a5a'];
  // Skeleton pirate: red bandana, tattered coat, cutlass. Swaggers in, then winds up and lunges.
  const skel = {
    hp: 20, sp: 66, dmg: 8, xp: 2, r: 11, eye: false,
    init(e, Z) { e.mode = 'walk'; e.mt = Z.rnd(1, 2.5); e.la = 0; e.coat = fl(Math.random() * 3) % 3; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e);
      switch (e.mode) {
        case 'rise': Z.move(e, 0, 0); e.ang = Z.angTo(e); if ((e.mt -= dt) <= 0) { e.mode = 'walk'; e.mt = Z.rnd(1, 2); } return;
        case 'wind': Z.move(e, 0, 0); e.ang = e.la; if ((e.mt -= dt) <= 0) { e.mode = 'lunge'; e.mt = .28; } return;
        case 'lunge': Z.move(e, Math.cos(e.la) * e.sp * 4.2, Math.sin(e.la) * e.sp * 4.2); e.ang = e.la; if ((e.mt -= dt) <= 0) { e.mode = 'rec'; e.mt = .45; } return;
        case 'rec': Z.move(e, 0, 0); if ((e.mt -= dt) <= 0) { e.mode = 'walk'; e.mt = Z.rnd(1.2, 2.2); } return;
        default: {
          const a = Z.angTo(e) + Math.sin(e.ph * 2.6 + e.seed) * .45, k = .75 + .35 * Math.sin(e.ph * 5.2 + e.seed);
          Z.move(e, Math.cos(a) * e.sp * k, Math.sin(a) * e.sp * k); e.ang = Z.angTo(e);
          e.mt -= dt;
          if (e.mt <= 0 && d < 120 && d > 28) { e.mode = 'wind'; e.mt = .42; e.la = Z.angTo(e); }
        }
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 11, m = e.mode, sw = Math.sin(e.ph * 5.2 + e.seed), OL = W(white, '#2a2030');
      const lean = m === 'wind' ? -.2 : m === 'lunge' ? .3 : sw * .08;
      c.save(); c.translate(e.x, e.y); c.scale(s, s);
      if (m === 'rise') { const k = cl01(1 - e.mt / .8); c.translate(0, (1 - k) * 14); c.scale(1, Math.max(.1, k)); }
      face(c, e); c.rotate(lean);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const lg = new Path2D(); lg.moveTo(-2, 3); lg.lineTo(-4 + sw * 2.5, 11); lg.moveTo(2, 3); lg.lineTo(4 - sw * 2.5, 11);
      c.strokeStyle = OL; c.lineWidth = 3.6; c.stroke(lg); c.strokeStyle = W(white, '#e9e2cc'); c.lineWidth = 1.9; c.stroke(lg);
      const bt = new Path2D(); bt.rect(-6.5 + sw * 2.5, 10.5, 5, 2.8); bt.rect(2 - sw * 2.5, 10.5, 5, 2.8);
      c.fillStyle = W(white, '#3a2418'); c.fill(bt);
      const co = new Path2D(); poly(co, [-6, -9, 6, -9, 7, 4, 5, 7.5, 3, 4.5, 1, 8, -1, 5, -3, 8.5, -5, 5, -7.5, 6.5]);
      c.strokeStyle = OL; c.lineWidth = 1.8; c.stroke(co); c.fillStyle = W(white, COATS[e.coat] || COATS[0]); c.fill(co);
      if (!white) {
        c.fillStyle = '#e9e2cc'; c.fillRect(-2.2, -8.5, 4.6, 9);
        const rl = new Path2D(); for (let i = 0; i < 3; i++) { rl.moveTo(-2.2, -6.5 + i * 2.6); rl.lineTo(2.4, -6.5 + i * 2.6); }
        c.strokeStyle = '#6a5a4a'; c.lineWidth = .9; c.stroke(rl);
        c.fillStyle = '#4a2c18'; c.fillRect(-6.5, 0, 13.5, 2.2); c.fillStyle = '#f2c845'; c.fillRect(-1.3, -.2, 2.6, 2.6);
      }
      const sk = new Path2D(); circ(sk, 1, -15, 6); ell(sk, 2.5, -10.5, 4, 2.6);
      c.strokeStyle = OL; c.lineWidth = 1.8; c.stroke(sk); c.fillStyle = W(white, '#efe8d2'); c.fill(sk);
      if (!white) {
        const so = new Path2D(); ell(so, 3.6, -15, 1.9, 2.2); ell(so, -.6, -15, 1.6, 2); poly(so, [2, -12.6, 1.2, -11.2, 2.8, -11.2]);
        c.fillStyle = '#1a1018'; c.fill(so);
        c.fillStyle = '#7dffcf'; c.fillRect(3.1, -15.6, 1.2, 1.2);
        c.strokeStyle = '#5a4a40'; c.lineWidth = .8; c.beginPath(); c.moveTo(-.5, -10.4); c.lineTo(5.5, -10.4); c.stroke();
      }
      const bd = new Path2D(); bd.moveTo(-5.6, -16); bd.quadraticCurveTo(-4.4, -22.4, 1.4, -21.8); bd.quadraticCurveTo(6.6, -21.2, 7.1, -16.6); bd.closePath();
      bd.moveTo(-5, -18); bd.lineTo(-10.5, -15.5 + sw * 1.4); bd.lineTo(-8.6, -14 + sw); bd.closePath();
      c.strokeStyle = OL; c.lineWidth = 1.4; c.stroke(bd); c.fillStyle = W(white, '#e2332e'); c.fill(bd);
      if (!white) { const dt = new Path2D(); circ(dt, -1.8, -19, .9); circ(dt, 2, -20, .9); circ(dt, 4.6, -18, .9); c.fillStyle = '#fff4e0'; c.fill(dt); }
      const aa = m === 'wind' ? -2.3 : m === 'lunge' ? .05 : m === 'rec' ? .9 : .55 + sw * .12;
      const sx = 2.5, sy = -7, hx = sx + Math.cos(aa) * 7, hy = sy + Math.sin(aa) * 7;
      const ar = new Path2D(); ar.moveTo(sx, sy); ar.lineTo(hx, hy); ar.moveTo(-3, -7); ar.lineTo(-5 - sw, -1);
      c.strokeStyle = OL; c.lineWidth = 3.4; c.stroke(ar); c.strokeStyle = W(white, '#e9e2cc'); c.lineWidth = 1.7; c.stroke(ar);
      const ba = aa - .5, ca = Math.cos(ba), sa = Math.sin(ba), bl = new Path2D();
      bl.moveTo(hx, hy); bl.quadraticCurveTo(hx + ca * 9 - sa * 3, hy + sa * 9 + ca * 3, hx + ca * 15 - sa * 1, hy + sa * 15 + ca * 1);
      c.strokeStyle = OL; c.lineWidth = 4; c.stroke(bl); c.strokeStyle = W(white, '#e6edf6'); c.lineWidth = 2.2; c.stroke(bl);
      if (!white) {
        c.strokeStyle = '#e8b840'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(hx - sa * 3, hy + ca * 3); c.lineTo(hx + sa * 3, hy - ca * 3); c.stroke();
        if (m === 'wind') Z.glow('255,240,200', 12, hx + ca * 14, hy + sa * 14, .9);
      }
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#e9e2cc', 9, 90); },
  };

  // Skeleton gunner: floppy leather hat, striped shirt and a long musket. Aims with a red sight line, then fires.
  const gunner = {
    hp: 34, sp: 54, dmg: 8, xp: 3, r: 11, eye: false,
    init(e, Z) { e.mode = 'walk'; e.t1 = Z.rnd(1.5, 3); e.aa = 0; e.kick = 0; e.side = Math.random() < .5 ? 1 : -1; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e), a = Z.angTo(e);
      if (e.kick > 0) e.kick -= dt;
      if (e.mode === 'aim') {
        Z.move(e, 0, 0);
        if (e.mt > .3) { let da = a - e.aa; da = Math.atan2(Math.sin(da), Math.cos(da)); e.aa += da * Math.min(1, dt * 4); }
        e.ang = e.aa;
        if ((e.mt -= dt) <= 0) {
          Z.shoot(e.x + Math.cos(e.aa) * 22, e.y - 4 + Math.sin(e.aa) * 22, e.aa, 250, { r: 5.5, dmg: 9, life: 3, col: '255,96,64' });
          Z.sfx('shoot'); e.kick = .25; e.mode = 'walk'; e.t1 = Z.rnd(2.6, 3.6);
        }
        return;
      }
      let mv = a, k = 1;
      if (d < 190) mv = a + PI; else if (d < 290) { mv = a + e.side * PI / 2; k = .5; }
      Z.move(e, Math.cos(mv) * e.sp * k, Math.sin(mv) * e.sp * k); e.ang = a;
      if ((e.t1 -= dt) <= 0 && d < 470) { e.mode = 'aim'; e.mt = .9; e.aa = a; Z.sfx('charge'); }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 11, st = Math.sin(e.ph * 7 + e.seed), OL = W(white, '#2a2030'), aim = e.mode === 'aim';
      c.save(); c.translate(e.x, e.y); c.scale(s, s);
      if (aim && !white) {
        const k = cl01(1 - e.mt / .9), ln = new Path2D(); ln.moveTo(20, 0); ln.lineTo(330, 0);
        c.save(); c.translate(0, -4); c.rotate(e.aa); c.globalAlpha = .25 + .6 * k; c.strokeStyle = k > .7 ? '#ffffff' : '#ff4a3a'; c.lineWidth = 1 + k * 1.6;
        c.setLineDash([7, 6]); c.stroke(ln); c.setLineDash([]); c.restore();
      }
      const f = face(c, e);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const mv = aim ? 0 : st;
      const lg = new Path2D(); lg.moveTo(-2, 3); lg.lineTo(-3.5 + mv * 2.5, 11); lg.moveTo(2, 3); lg.lineTo(3.5 - mv * 2.5, 11);
      c.strokeStyle = OL; c.lineWidth = 3.6; c.stroke(lg); c.strokeStyle = W(white, '#e9e2cc'); c.lineWidth = 1.9; c.stroke(lg);
      const bo = new Path2D(); poly(bo, [-5.5, -9, 5.5, -9, 6.2, 4, -6.2, 4]);
      c.strokeStyle = OL; c.lineWidth = 1.8; c.stroke(bo); c.fillStyle = W(white, '#f0ece0'); c.fill(bo);
      if (!white) {
        const sp = new Path2D(); for (let i = 0; i < 3; i++) sp.rect(-5.8, -7.4 + i * 4, 11.8, 2);
        c.fillStyle = '#2a4aa0'; c.fill(sp);
        c.fillStyle = '#6a3a1e'; c.fillRect(-6.3, 1.6, 12.6, 2.4);
        const hn = new Path2D(); hn.moveTo(-6, -2); hn.quadraticCurveTo(-10, 1, -8, 5);
        c.strokeStyle = '#e8d8a8'; c.lineWidth = 2.4; c.stroke(hn);
      }
      const sk = new Path2D(); circ(sk, 1, -14.5, 5.8); ell(sk, 2.4, -10.2, 3.8, 2.4);
      c.strokeStyle = OL; c.lineWidth = 1.8; c.stroke(sk); c.fillStyle = W(white, '#efe8d2'); c.fill(sk);
      if (!white) {
        const so = new Path2D(); ell(so, 3.5, -14.4, 1.8, 2.1); ell(so, -.5, -14.4, 1.5, 1.9);
        c.fillStyle = '#1a1018'; c.fill(so);
        c.fillStyle = aim ? '#ff5a40' : '#7dffcf'; c.fillRect(3, -15, 1.3, 1.3);
      }
      const ht = new Path2D(); ht.moveTo(-10, -17.5); ht.quadraticCurveTo(1, -21, 12, -18); ht.quadraticCurveTo(4, -16.2, 1, -16.4); ht.quadraticCurveTo(-4, -16, -10, -17.5); ht.closePath();
      ht.moveTo(-4.5, -18.5); ht.quadraticCurveTo(-4, -25, 1.5, -24.6); ht.quadraticCurveTo(6.5, -24, 6, -18.4); ht.closePath();
      c.strokeStyle = OL; c.lineWidth = 1.5; c.stroke(ht); c.fillStyle = W(white, '#7a5232'); c.fill(ht);
      if (!white) { c.fillStyle = '#c8302a'; c.fillRect(-4.4, -19.6, 10.4, 1.6); }
      const la = aim ? Math.atan2(Math.sin(e.aa), f * Math.cos(e.aa)) : -.75 + st * .06, ca = Math.cos(la), sa = Math.sin(la), kb = e.kick > 0 ? e.kick * 10 : 0;
      const gx = 1 - ca * kb, gy = -4 - sa * kb;
      const gun = new Path2D(); gun.moveTo(gx - ca * 7, gy - sa * 7); gun.lineTo(gx + ca * 20, gy + sa * 20);
      const stk = new Path2D(); poly(stk, [gx - ca * 9 - sa * 2.4, gy - sa * 9 + ca * 2.4, gx + ca * 3 - sa * 1.6, gy + sa * 3 + ca * 1.6, gx + ca * 3 + sa * 1.2, gy + sa * 3 - ca * 1.2, gx - ca * 9 + sa * 1.6, gy - sa * 9 - ca * 1.6]);
      c.strokeStyle = OL; c.lineWidth = 3.6; c.stroke(gun); c.strokeStyle = W(white, '#9aa0aa'); c.lineWidth = 1.8; c.stroke(gun);
      c.strokeStyle = OL; c.lineWidth = 1.2; c.stroke(stk); c.fillStyle = W(white, '#8a5a30'); c.fill(stk);
      const ar = new Path2D(); ar.moveTo(2.5, -7); ar.lineTo(gx + ca * 6, gy + sa * 6); ar.moveTo(-3, -7); ar.lineTo(gx - ca * 2, gy - sa * 2 + 1);
      c.strokeStyle = OL; c.lineWidth = 3.2; c.stroke(ar); c.strokeStyle = W(white, '#e9e2cc'); c.lineWidth = 1.6; c.stroke(ar);
      if (!white && e.kick > .1) { Z.glow('255,170,80', 16, gx + ca * 23, gy + sa * 23, .9); c.fillStyle = '#fff4c0'; c.beginPath(); c.arc(gx + ca * 23, gy + sa * 23, 3.2, 0, TAU); c.fill(); }
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#efe8d2', 9, 90); },
  };

  // Giant beach crab: scuttles sideways while facing you, then opens its claws and snaps.
  const crab = {
    hp: 90, sp: 38, dmg: 14, xp: 6, r: 17, heavy: true, eye: false,
    init(e, Z) { e.mode = 'walk'; e.t1 = Z.rnd(1.5, 3); e.side = Math.random() < .5 ? 1 : -1; e.sw = Z.rnd(1.2, 2.4); },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e), a = Z.angTo(e);
      if (e.mode === 'snap') { Z.move(e, 0, 0); e.ang = e.sa; if ((e.mt -= dt) <= 0) { e.mode = 'walk'; e.t1 = Z.rnd(1.8, 2.8); } return; }
      if ((e.sw -= dt) <= 0) { e.side = -e.side; e.sw = Z.rnd(1.2, 2.4); }
      const burst = .55 + .75 * Math.abs(Math.sin(e.ph * 3.4 + e.seed)), mv = a + e.side * (d > 90 ? 1.05 : .6), sp = e.sp * 1.6 * burst;
      Z.move(e, Math.cos(mv) * sp, Math.sin(mv) * sp); e.ang = a;
      if ((e.t1 -= dt) <= 0 && d < 74) {
        e.mode = 'snap'; e.mt = .55; e.sa = a;
        Z.hazard(e.x + Math.cos(a) * 30, e.y + Math.sin(a) * 30, { r: 38, t: .45, dmg: 12, col: '255,120,80' });
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 17, OL = W(white, '#3a120a'), snap = e.mode === 'snap', wk = e.ph * (snap ? 4 : 15) + e.seed;
      const op = snap ? (e.mt > .2 ? cl01((.55 - e.mt) / .3) : 0) : .2 + .12 * Math.sin(e.ph * 3 + e.seed);
      c.save(); c.translate(e.x, e.y); c.rotate(e.ang); c.scale(s, s);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const L = new Path2D();
      for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) {
        const ph = Math.sin(wk + i * 1.6 + (sd > 0 ? PI : 0)), bx = 4 - i * 4.5;
        L.moveTo(bx, sd * 11); L.lineTo(bx - 2 + ph * 2.5, sd * 20); L.lineTo(bx - 5 + ph * 3.5, sd * 27);
      }
      c.strokeStyle = OL; c.lineWidth = 4.2; c.stroke(L); c.strokeStyle = W(white, '#c4462a'); c.lineWidth = 2.4; c.stroke(L);
      const ar = new Path2D(); ar.moveTo(7, -10); ar.lineTo(14, -15); ar.lineTo(19, -13); ar.moveTo(7, 10); ar.lineTo(14, 17); ar.lineTo(20, 16);
      c.strokeStyle = OL; c.lineWidth = 5.6; c.stroke(ar); c.strokeStyle = W(white, '#d24e2c'); c.lineWidth = 3.4; c.stroke(ar);
      const pc = new Path2D(), tp = new Path2D();
      const claw = (x, y, sz) => {
        const o = .12 + op * .75, px = x + sz * .45;
        ell(pc, x, y, sz * .75, sz * .55);
        poly(pc, [px - 1, y - sz * .45, px + Math.cos(-o) * sz * 1.35, y + Math.sin(-o) * sz * 1.35, px + 1, y]);
        poly(pc, [px - 1, y + sz * .45, px + Math.cos(o) * sz * 1.15, y + Math.sin(o) * sz * 1.15, px + 1, y]);
        circ(tp, px + Math.cos(-o) * sz * 1.25, y + Math.sin(-o) * sz * 1.25, 1.4); circ(tp, px + Math.cos(o) * sz * 1.05, y + Math.sin(o) * sz * 1.05, 1.3);
      };
      claw(21, -13, 6.5); claw(23, 16, 9);
      c.strokeStyle = OL; c.lineWidth = 1.6; c.stroke(pc); c.fillStyle = W(white, '#ea5c30'); c.fill(pc);
      if (!white) { c.fillStyle = '#f8d8b8'; c.fill(tp); }
      const sh = new Path2D(); sh.moveTo(10, 0); sh.quadraticCurveTo(9, -15, -2, -17); sh.lineTo(-4, -19.5); sh.lineTo(-6, -16.5); sh.quadraticCurveTo(-14, -12, -13, 0); sh.quadraticCurveTo(-14, 12, -6, 16.5); sh.lineTo(-4, 19.5); sh.lineTo(-2, 17); sh.quadraticCurveTo(9, 15, 10, 0); sh.closePath();
      c.strokeStyle = OL; c.lineWidth = 2; c.stroke(sh); c.fillStyle = W(white, '#d8502c'); c.fill(sh);
      if (!white) {
        const hi = new Path2D(); ell(hi, -2, -5, 6, 8); c.fillStyle = '#f07a4a'; c.fill(hi);
        const sp = new Path2D(); circ(sp, -6, 6, 2); circ(sp, -1, 9, 1.6); circ(sp, -8, -3, 1.5); circ(sp, 3, 5, 1.3);
        c.fillStyle = '#9a2e18'; c.fill(sp);
        const es = new Path2D(); es.moveTo(8, -4); es.lineTo(13.5, -6.5); es.moveTo(8, 4); es.lineTo(13.5, 6.5);
        c.strokeStyle = '#7a2412'; c.lineWidth = 2; c.stroke(es);
        const ey = new Path2D(); circ(ey, 14, -6.8, 2.3); circ(ey, 14, 6.8, 2.3); c.fillStyle = '#140808'; c.fill(ey);
        c.fillStyle = '#ffffff'; c.fillRect(14, -8, 1, 1); c.fillRect(14, 5.6, 1, 1);
        if (snap && op > .6) Z.glow('255,210,170', 14, 31, 16, .6);
      }
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#d8502c', 14, 100); },
  };

  // Powder monkey: a little vested monkey hauling a lit powder keg overhead. Rushes in, stops, and the keg blows.
  const keg = {
    hp: 12, sp: 98, dmg: 6, xp: 2, r: 10, eye: false,
    init(e, Z) { e.mode = 'run'; e.fuse = Z.rnd(7, 10); },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e);
      if (e.mode === 'lit') {
        Z.move(e, 0, 0);
        if ((e.mt -= dt) <= 0) { Z.burst(e.x, e.y, '#ff9a3a', 18, 170); Z.burst(e.x, e.y, '#4a3a2a', 10, 110); Z.shake(4); e.remove = true; }
        return;
      }
      e.fuse -= dt;
      const a = Z.angTo(e) + Math.sin(e.ph * 4 + e.seed) * .35, k = .8 + .4 * Math.abs(Math.sin(e.ph * 9 + e.seed));
      Z.move(e, Math.cos(a) * e.sp * k, Math.sin(a) * e.sp * k); e.ang = a;
      if (d < 64 || e.fuse <= 0) { e.mode = 'lit'; e.mt = .75; Z.hazard(e.x, e.y, { r: 66, t: .75, dmg: 14, col: '255,120,40' }); Z.sfx('warn'); }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 10, lit = e.mode === 'lit', run = Math.sin(e.ph * 16 + e.seed), OL = W(white, '#2a1608');
      const jit = lit ? Math.sin(Z.now * 50) * 1.2 : 0, hop = lit ? 0 : Math.abs(run) * 2;
      c.save(); c.translate(e.x + jit, e.y - hop); c.scale(s, s); face(c, e);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const tl = new Path2D(); tl.moveTo(-5, 4); tl.quadraticCurveTo(-14, 6 + run * 2, -12, -3); tl.quadraticCurveTo(-11, -7, -8, -5);
      const lg = new Path2D(); lg.moveTo(-2, 5); lg.lineTo(-3 + run * 3, 11); lg.moveTo(2, 5); lg.lineTo(3 - run * 3, 11);
      lg.moveTo(-3, -2); lg.lineTo(-5.5, -14); lg.moveTo(4, -2); lg.lineTo(6.5, -14);
      c.strokeStyle = OL; c.lineWidth = 3.6; c.stroke(tl); c.stroke(lg); c.strokeStyle = W(white, '#8a5a34'); c.lineWidth = 1.9; c.stroke(tl); c.stroke(lg);
      const b = new Path2D(); ell(b, 0, 1, 6, 6.5); circ(b, 2, -7.5, 5.2); circ(b, -2.6, -10.5, 2.2);
      c.strokeStyle = OL; c.lineWidth = 1.8; c.stroke(b); c.fillStyle = W(white, '#8a5a34'); c.fill(b);
      if (!white) {
        const vs = new Path2D(); poly(vs, [-5.5, -2, 5.5, -2, 5, 6, 1.5, 3.5, -1.5, 3.5, -5, 6]); c.fillStyle = '#c8302a'; c.fill(vs);
        const fm = new Path2D(); ell(fm, 4, -7, 3.4, 3); c.fillStyle = '#e2b384'; c.fill(fm);
        c.fillStyle = '#1a0e06'; c.fillRect(4.4, -8.6, 1.5, 1.5);
        c.strokeStyle = '#5a2a10'; c.lineWidth = .9; c.beginPath(); c.arc(4.6, -6, 1.6, .2, PI - .2); c.stroke();
      }
      const kx = .5, ky = -19.5, flash = lit && Math.sin(Z.now * 30) > 0;
      const kg = new Path2D(); kg.moveTo(kx - 8, ky - 6); kg.quadraticCurveTo(kx, ky - 8.5, kx + 8, ky - 6); kg.quadraticCurveTo(kx + 10, ky, kx + 8, ky + 6); kg.quadraticCurveTo(kx, ky + 8.5, kx - 8, ky + 6); kg.quadraticCurveTo(kx - 10, ky, kx - 8, ky - 6); kg.closePath();
      c.strokeStyle = OL; c.lineWidth = 1.7; c.stroke(kg); c.fillStyle = W(white, flash ? '#ff6a3a' : '#5e3e24'); c.fill(kg);
      if (!white) {
        const bn = new Path2D(); bn.moveTo(kx - 4.5, ky - 7.4); bn.lineTo(kx - 4.5, ky + 7.4); bn.moveTo(kx + 4.5, ky - 7.4); bn.lineTo(kx + 4.5, ky + 7.4);
        c.strokeStyle = '#2a1a10'; c.lineWidth = 1.6; c.stroke(bn);
        c.strokeStyle = '#efe6cc'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(kx - 2, ky - 2); c.lineTo(kx + 2, ky + 2); c.moveTo(kx + 2, ky - 2); c.lineTo(kx - 2, ky + 2); c.stroke();
        const fz = Math.sin(Z.now * 13 + e.seed) * 1.2, sx = kx + 7 + fz, sy = ky - 12;
        c.strokeStyle = '#d8c08a'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(kx + 4, ky - 7); c.quadraticCurveTo(kx + 7, ky - 9, sx, sy); c.stroke();
        Z.glow('255,190,80', lit ? 18 : 10, sx, sy, .9);
        c.fillStyle = '#fff2a0'; c.fillRect(sx - 1.2, sy - 1.2, 2.4, 2.4); c.fillRect(sx + 2 + fz, sy - 3, 1.4, 1.4);
      }
      c.restore();
    },
    death(e, Z) { if (e.mode !== 'lit') Z.hazard(e.x, e.y, { r: 54, t: .55, dmg: 12, col: '255,120,40' }); Z.burst(e.x, e.y, '#8a5a34', 8, 90); },
  };

  /* ================= Miniboss: Captain Saltgrave, Terror of the Tides ================= */
  const BPAT = ['sweep', 'barrage', 'anchor', 'summon', 'sweep', 'coins', 'barrage', 'anchor', 'sweep', 'coins'];
  const bossStart = (e, Z, m) => {
    e.mode = m;
    if (m === 'walk') { e.mt = (e.rage ? 1.0 : 1.6) + Math.random() * .6; return; }
    if (m === 'sweep') {
      e.mt = 1.5; e.sa = Z.angTo(e); e.swung = false; e.swT = 0; Z.sfx('charge');
      for (let i = -3; i <= 3; i++) { const a = e.sa + i * .34; Z.hazard(e.x + Math.cos(a) * 92, e.y + Math.sin(a) * 92, { r: 44, t: .95, dmg: 16, col: '120,255,200' }); }
      for (let i = -2; i <= 2; i++) { const a = e.sa + i * .4; Z.hazard(e.x + Math.cos(a) * 165, e.y + Math.sin(a) * 165, { r: 42, t: 1, dmg: 14, col: '120,255,200' }); }
      return;
    }
    if (m === 'barrage') {
      e.mt = 2.8; Z.sfx('warn'); Z.banner('Fire the cannons!', '#7dffd0', false);
      const n = e.rage ? 15 : 10;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU, d = i === 0 ? 0 : 60 + Math.random() * 280, x = Z.P.x + Math.cos(a) * d, y = Z.P.y + Math.sin(a) * d, t = 1 + i * .11;
        Z.hazard(x, y, { r: 50, t, dmg: 14, col: '255,140,60' }); ball(Z, x, y, t);
      }
      return;
    }
    if (m === 'anchor') { e.mt = 1.9; e.aa = Z.angTo(e); e.thrown = false; Z.sfx('charge'); return; }
    if (m === 'summon') {
      e.mt = 1.5; Z.sfx('boss'); Z.shake(5);
      const n = e.rage ? 6 : 4;
      for (let i = 0; i < n; i++) {
        const a = e.ph + i * TAU / n, x = e.x + Math.cos(a) * (e.r + 40), y = e.y + Math.sin(a) * (e.r + 40), sk = Z.spawn('skel', x, y);
        if (sk) { sk.mode = 'rise'; sk.mt = .8; Z.burst(x, y, '#d8c49a', 10, 90); }
      }
      return;
    }
    if (m === 'coins') { e.mt = 2.3; e.vol = e.rage ? 4 : 3; e.t3 = .45; Z.sfx('warn'); }
  };
  const boss = {
    name: 'Captain Saltgrave, Terror of the Tides', hp: 3800, sp: 50, dmg: 24, xp: 0, r: 46, heavy: true, eye: false,
    init(e) { e.mode = 'walk'; e.mt = 2.2; e.pi = 0; e.rage = false; e.sa = 0; e.swung = false; e.swT = 0; e.aa = 0; e.thrown = false; e.vol = 0; e.t3 = 0; },
    update(e, Z) {
      const dt = Z.dt;
      if (!e.rage && e.hp < e.max * .4) {
        e.rage = true; Z.banner('Saltgrave roars: "No quarter!"', '#7dffd0', false); Z.sfx('boss'); Z.shake(10);
        Z.ring(e.x, e.y - 20, 16, 150, { r: 7, dmg: 9, col: '255,214,64' }, e.ph);
      }
      e.mt -= dt;
      switch (e.mode) {
        case 'walk': {
          const d = Z.dist(e), sp = e.sp * (e.rage ? 1.3 : 1);
          if (d > 210) Z.chase(e, sp);
          else { const a = Z.angTo(e) + PI / 2; Z.move(e, Math.cos(a) * sp * .55, Math.sin(a) * sp * .55); e.ang = Z.angTo(e); }
          if (e.mt <= 0) bossStart(e, Z, BPAT[e.pi++ % BPAT.length]);
          break;
        }
        case 'sweep':
          Z.move(e, 0, 0); e.ang = e.sa;
          if (!e.swung && e.mt <= .55) {
            e.swung = true; e.swT = .35; Z.shake(5); Z.sfx('nova');
            if (e.rage) for (let i = -3; i <= 3; i++) Z.shoot(e.x, e.y - 10, e.sa + i * .2, 190, { r: 6, dmg: 8, life: 3, col: '140,255,200' });
          }
          if (e.swT > 0) e.swT -= dt;
          if (e.mt <= 0) bossStart(e, Z, 'walk');
          break;
        case 'anchor':
          Z.move(e, 0, 0);
          if (!e.thrown) {
            if (e.mt > 1.15) { let da = Z.angTo(e) - e.aa; da = Math.atan2(Math.sin(da), Math.cos(da)); e.aa += da * Math.min(1, dt * 3); }
            else {
              e.thrown = true; Z.sfx('nova'); Z.shake(4);
              for (const o of e.rage ? [-.38, 0, .38] : [0]) {
                const a = e.aa + o;
                for (let i = 0; i < 13; i++) { const d = e.r + 22 + i * 44; Z.hazard(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d, { r: 30, t: .5 + i * .035, dmg: 16, col: '120,255,210' }); }
                addFx({ k: 'anc', x0: e.x, y0: e.y - 10, a, len: e.r + 22 + 12 * 44, t0: Z.t, T: .55 });
              }
            }
          }
          e.ang = e.aa;
          if (e.mt <= 0) bossStart(e, Z, 'walk');
          break;
        case 'coins':
          Z.move(e, 0, 0); e.ang = Z.angTo(e);
          if (e.vol > 0 && (e.t3 -= dt) <= 0) {
            const n = e.rage ? 18 : 14;
            Z.ring(e.x, e.y - 24, n, 135, { r: 7, dmg: 9, life: 5, col: '255,214,64' }, e.vol * PI / n + e.seed);
            e.vol--; e.t3 = .45; Z.sfx('shoot');
          }
          if (e.mt <= 0) bossStart(e, Z, 'walk');
          break;
        case 'barrage': case 'summon':
          Z.move(e, 0, 0); e.ang = Z.angTo(e);
          if (e.mt <= 0) bossStart(e, Z, 'walk');
          break;
        default: bossStart(e, Z, 'walk');
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 46, m = e.mode, now = Z.now, bob = Math.sin(e.ph * 2.2) * 3, OL = W(white, '#0b2a2a'), sway = Math.sin(e.ph * 3) * 6;
      c.save(); c.translate(e.x, e.y); c.scale(s, s);
      c.lineCap = 'round'; c.lineJoin = 'round';
      if (!white) {
        if (m === 'sweep' && !e.swung) {
          const k = cl01(1 - (e.mt - .55) / .95), wd = new Path2D(); wd.moveTo(0, 0); wd.arc(0, 0, 150, e.sa - 1.2, e.sa + 1.2); wd.closePath();
          c.globalAlpha = .12 + .22 * k; c.fillStyle = '#7dffd0'; c.fill(wd); c.globalAlpha = .55 + .3 * k; c.strokeStyle = '#d8fff0'; c.lineWidth = 2; c.stroke(wd); c.globalAlpha = 1;
        }
        if (m === 'anchor' && !e.thrown) {
          const k = cl01(1 - (e.mt - 1.15) / .75);
          c.save(); c.rotate(e.aa); c.globalAlpha = .1 + .22 * k + .06 * Math.sin(now * 20); c.fillStyle = '#7dffd0'; c.fillRect(30, -18, 470, 36);
          c.globalAlpha = .4 + .4 * k; c.strokeStyle = '#d8fff0'; c.lineWidth = 1.5; c.strokeRect(30, -18, 470, 36); c.restore(); c.globalAlpha = 1;
        }
        if (e.rage) { c.globalAlpha = .35 + .2 * Math.sin(now * 6); c.strokeStyle = '#ff5a48'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 54 + Math.sin(now * 5) * 3, 0, TAU); c.stroke(); c.globalAlpha = 1; }
        Z.glow('110,255,200', 74 + Math.sin(now * 3) * 6, 0, -10, .35);
      }
      c.translate(0, bob);
      const f = face(c, e);
      // spectral tail where legs should be
      const tl = new Path2D(); tl.moveTo(-24, 14); tl.quadraticCurveTo(-20, 40, -4 + sway, 54); tl.quadraticCurveTo(6 + sway * 1.4, 62, 2 + sway * 2, 72); tl.quadraticCurveTo(22, 46, 24, 14); tl.closePath();
      c.globalAlpha = white ? 1 : .55; c.fillStyle = W(white, '#6ff2c6'); c.fill(tl); c.globalAlpha = 1;
      c.strokeStyle = W(white, '#2aa88a'); c.lineWidth = 1.4; c.stroke(tl);
      // hook arm (behind)
      const bA = m === 'summon' ? -2.5 : m === 'coins' ? -2 : 1.95 + Math.sin(e.ph * 2.2) * .15, hx0 = -14 + Math.cos(bA) * 24, hy0 = -26 + Math.sin(bA) * 24;
      const ba = new Path2D(); ba.moveTo(-14, -26); ba.lineTo(hx0, hy0);
      c.strokeStyle = OL; c.lineWidth = 10; c.stroke(ba); c.strokeStyle = W(white, '#33245a'); c.lineWidth = 7; c.stroke(ba);
      const hk = new Path2D(), ha = bA + .3; hk.moveTo(hx0, hy0); hk.lineTo(hx0 + Math.cos(ha) * 7, hy0 + Math.sin(ha) * 7); hk.arc(hx0 + Math.cos(ha) * 7 - Math.sin(ha) * 4, hy0 + Math.sin(ha) * 7 + Math.cos(ha) * 4, 4, ha - PI / 2, ha + PI * .9);
      c.strokeStyle = OL; c.lineWidth = 4; c.stroke(hk); c.strokeStyle = W(white, '#dfe6ee'); c.lineWidth = 2.2; c.stroke(hk);
      // long coat
      const coat = new Path2D(); poly(coat, [-18, -36, 18, -36, 24, -6, 31, 22, 22, 17, 16, 26, 8, 19, 0, 27, -8, 19, -16, 26, -22, 17, -31, 22, -24, -6]);
      c.strokeStyle = OL; c.lineWidth = 2.4; c.stroke(coat); c.fillStyle = W(white, '#35265e'); c.fill(coat);
      if (!white) {
        const vs = new Path2D(); poly(vs, [-6, -36, 6, -36, 8, 12, -8, 12]); c.fillStyle = '#a8283a'; c.fill(vs);
        const tr = new Path2D(); tr.moveTo(-6, -36); tr.lineTo(-8.5, 12); tr.moveTo(6, -36); tr.lineTo(8.5, 12);
        tr.moveTo(-31, 22); tr.lineTo(-22, 17); tr.lineTo(-16, 26); tr.lineTo(-8, 19); tr.moveTo(8, 19); tr.lineTo(16, 26); tr.lineTo(22, 17); tr.lineTo(31, 22);
        c.strokeStyle = '#f0c050'; c.lineWidth = 1.8; c.stroke(tr);
        const bt = new Path2D(); for (let i = 0; i < 4; i++) { circ(bt, -9.5, -28 + i * 8, 1.4); circ(bt, 9.5, -28 + i * 8, 1.4); }
        c.fillStyle = '#ffd860'; c.fill(bt);
        c.fillStyle = '#241812'; c.fillRect(-22, -5, 44, 5); c.fillStyle = '#f0c050'; c.fillRect(-4, -6.5, 8, 8);
        const sh = new Path2D(); poly(sh, [13, -2, 19, -1, 22, 15, 16, 16]); c.fillStyle = '#d0344a'; c.fill(sh);
        const ep = new Path2D(); ell(ep, -15, -34, 7, 3.4); ell(ep, 15, -34, 7, 3.4); c.fillStyle = '#f0c050'; c.fill(ep);
      }
      // skull face with spectral beard
      const hd = new Path2D(); circ(hd, 2, -47, 12.5); ell(hd, 4.5, -37.5, 8.5, 5.6);
      c.strokeStyle = OL; c.lineWidth = 2; c.stroke(hd); c.fillStyle = W(white, '#c4f8e6'); c.fill(hd);
      if (!white) {
        const bd = new Path2D(); for (let i = 0; i < 5; i++) { const bx = -2 + i * 3; bd.moveTo(bx, -34); bd.quadraticCurveTo(bx + sway * .4, -24, bx - 3 + sway * .8, -16 + (i & 1) * 4); }
        c.globalAlpha = .75; c.strokeStyle = '#8af5d0'; c.lineWidth = 2.2; c.stroke(bd); c.globalAlpha = 1;
        const so = new Path2D(); ell(so, 7, -48, 3.8, 4.4); ell(so, -1.5, -48, 3.4, 4); poly(so, [4.5, -43, 3, -40, 6, -40]);
        c.fillStyle = '#0e2a2a'; c.fill(so);
        const ec = e.rage ? '#ff5a48' : '#e4ff6a', eg = e.rage ? '255,90,72' : '220,255,110';
        c.fillStyle = ec; c.fillRect(6, -49, 2.4, 2.4); c.fillRect(-2.4, -49, 2.2, 2.2);
        Z.glow(eg, 9, 7, -48, .9);
        c.strokeStyle = '#3a6a60'; c.lineWidth = 1; c.beginPath(); c.moveTo(-1, -36); c.lineTo(10, -36); c.moveTo(2, -38.5); c.lineTo(2, -34); c.moveTo(6, -38.5); c.lineTo(6, -34); c.stroke();
      }
      // tricorn with plume and skull badge
      const pl = new Path2D(); pl.moveTo(-6, -70); pl.quadraticCurveTo(-24, -92, -36, -76 + sway * .5); pl.quadraticCurveTo(-22, -80, -6, -66); pl.closePath();
      c.strokeStyle = OL; c.lineWidth = 1.4; c.stroke(pl); c.fillStyle = W(white, '#e0405a'); c.fill(pl);
      const hat = new Path2D(); hat.moveTo(-25, -62); hat.quadraticCurveTo(-16, -55, -6, -56); hat.lineTo(12, -56); hat.quadraticCurveTo(23, -56, 31, -65);
      hat.quadraticCurveTo(23, -65, 16, -67); hat.quadraticCurveTo(4, -86, -10, -69); hat.quadraticCurveTo(-17, -66, -25, -62); hat.closePath();
      c.strokeStyle = OL; c.lineWidth = 2.2; c.stroke(hat); c.fillStyle = W(white, '#1c1626'); c.fill(hat);
      if (!white) {
        const ht = new Path2D(); ht.moveTo(-25, -62); ht.quadraticCurveTo(-16, -55, -6, -56); ht.lineTo(12, -56); ht.quadraticCurveTo(23, -56, 31, -65);
        c.strokeStyle = '#f0c050'; c.lineWidth = 1.8; c.stroke(ht);
        const bg = new Path2D(); circ(bg, 3, -66, 3.6); bg.moveTo(-3, -71); bg.lineTo(9, -61); bg.moveTo(9, -71); bg.lineTo(-3, -61);
        c.strokeStyle = '#ece6d6'; c.lineWidth = 1.4; c.stroke(bg); c.fillStyle = '#ece6d6'; c.fill(bg);
      }
      // sword arm and glowing cutlass (or the anchor, held high)
      let fa = .9 + Math.sin(e.ph * 2.2) * .1;
      if (m === 'sweep') fa = e.swung ? -2.5 + cl01(1 - e.swT / .35) * 3.6 : -2.5;
      else if (m === 'anchor') fa = e.thrown ? .6 : -1.9;
      else if (m === 'barrage') fa = -1.25 + Math.sin(now * 8) * .08;
      else if (m === 'coins') fa = -.6;
      else if (m === 'summon') fa = -2.1;
      const hx = 14 + Math.cos(fa) * 22, hy = -26 + Math.sin(fa) * 22;
      const fr = new Path2D(); fr.moveTo(14, -26); fr.lineTo(hx, hy);
      c.strokeStyle = OL; c.lineWidth = 10; c.stroke(fr); c.strokeStyle = W(white, '#3b2b68'); c.lineWidth = 7; c.stroke(fr);
      const hn = new Path2D(); circ(hn, hx, hy, 4.2);
      c.fillStyle = W(white, '#c4f8e6'); c.fill(hn); c.strokeStyle = W(white, '#f0c050'); c.lineWidth = 2; c.stroke(hn);
      if (m === 'anchor' && !e.thrown) {
        c.save(); c.translate(hx, hy - 16); c.scale(1.2, 1.2);
        c.strokeStyle = OL; c.lineWidth = 5; c.stroke(ANCHOR); c.strokeStyle = W(white, '#a8ffe0'); c.lineWidth = 2.6; c.stroke(ANCHOR);
        c.restore();
        if (!white) Z.glow('120,255,210', 30, hx, hy - 16, .6);
      } else {
        const bA2 = fa - .35, ca = Math.cos(bA2), sa = Math.sin(bA2), bl = new Path2D();
        bl.moveTo(hx, hy); bl.quadraticCurveTo(hx + ca * 22 - sa * 6, hy + sa * 22 + ca * 6, hx + ca * 40 - sa * 2, hy + sa * 40 + ca * 2);
        c.strokeStyle = OL; c.lineWidth = 6; c.stroke(bl); c.strokeStyle = W(white, '#c8fff0'); c.lineWidth = 3.4; c.stroke(bl);
        const gd = new Path2D(); gd.moveTo(hx - sa * 6, hy + ca * 6); gd.lineTo(hx + sa * 6, hy - ca * 6);
        c.strokeStyle = W(white, '#f0c050'); c.lineWidth = 2.6; c.stroke(gd);
        if (!white) Z.glow('140,255,210', m === 'sweep' ? 34 : 22, hx + ca * 24, hy + sa * 24, m === 'sweep' ? .85 : .55);
        if (!white && m === 'sweep' && e.swung && e.swT > 0) {
          const tr = new Path2D(); tr.arc(14, -26, 50, -2.5, fa); c.globalAlpha = cl01(e.swT / .35) * .7; c.strokeStyle = '#bfffe8'; c.lineWidth = 7; c.stroke(tr); c.globalAlpha = 1;
        }
      }
      if (!white && m === 'coins') { Z.glow('255,214,64', 22, -14 + Math.cos(bA) * 24, -26 + Math.sin(bA) * 24, .9); }
      if (!white) {
        const mo = new Path2D(); for (let i = 0; i < 5; i++) { const a = now * 1.4 + i * 1.26, r = 30 + Math.sin(now * 2 + i) * 6; circ(mo, Math.cos(a) * r * f, -20 + Math.sin(a) * r * .8, 1.8); }
        c.globalAlpha = .7; c.fillStyle = '#c8fff0'; c.fill(mo); c.globalAlpha = 1;
      }
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#6ff2c6', 40, 220); Z.burst(e.x, e.y - 30, '#ffd860', 26, 180); Z.shake(14); },
  };

  /* ================= Events ================= */
  const spot = (Z, d) => { const a = Math.random() * TAU; return { x: Z.P.x + Math.cos(a) * d, y: Z.P.y + Math.sin(a) * d, a }; };
  const broadside = (Z, rows) => {
    const a = Math.random() * TAU, px = -Math.sin(a), py = Math.cos(a);
    for (let r = 0; r < rows; r++) {
      const off = (r - (rows - 1) / 2) * 120 + Z.rnd(-25, 25);
      for (let i = -6; i <= 6; i++) {
        const x = Z.P.x + Math.cos(a) * off + px * i * 56, y = Z.P.y + Math.sin(a) * off + py * i * 56, t = .9 + (i + 6) * .07 + r * .35;
        Z.hazard(x, y, { r: 42, t, dmg: 14, col: '255,140,60' }); ball(Z, x, y, t);
      }
    }
  };
  const crew = (Z, kind, n, d) => {
    const p = spot(Z, d), px = -Math.sin(p.a), py = Math.cos(p.a);
    for (let i = 0; i < n; i++) { const s = Z.spawn(kind, p.x + px * (i - (n - 1) / 2) * 34, p.y + py * (i - (n - 1) / 2) * 34); if (s && kind === 'skel') { s.mode = 'rise'; s.mt = .8; } }
  };
  const events = [
    { t: 7, run(Z) { Z.banner('The skeleton crew comes ashore!', '#efe8d2', false); Z.sfx('warn'); crew(Z, 'skel', 8, 420); } },
    { t: 22, run(Z) {
      Z.banner('Powder monkeys! Mind the kegs!', '#ffb050', false); Z.sfx('warn');
      for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + Math.random() * .5; Z.spawn('keg', Z.P.x + Math.cos(a) * 420, Z.P.y + Math.sin(a) * 420); }
    } },
    { t: 34, run(Z) { Z.banner('The ghost ship fires a broadside!', '#7dffd0', true); Z.sfx('boss'); Z.shake(4); broadside(Z, 1); } },
    { t: 62, run(Z) {
      Z.banner('Doubloons wash up on the beach… and the crabs want them!', '#ffd34a', false); Z.sfx('warn');
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.random() * .4; Z.spawn('crab', Z.P.x + Math.cos(a) * 400, Z.P.y + Math.sin(a) * 400); }
    } },
    { t: 86, run(Z) {
      Z.banner('Pay up, or face the cannons!', '#ff8a4a', true); Z.sfx('boss');
      const gap = fl(Math.random() * 12);
      for (let i = 0; i < 12; i++) {
        if (i === gap || i === (gap + 1) % 12) continue;
        const a = i / 12 * TAU, x = Z.P.x + Math.cos(a) * 140, y = Z.P.y + Math.sin(a) * 140;
        Z.hazard(x, y, { r: 46, t: 1.2, dmg: 14, col: '255,140,60' }); ball(Z, x, y, 1.2);
      }
      Z.hazard(Z.P.x, Z.P.y, { r: 70, t: 1.8, dmg: 16, col: '255,140,60' }); ball(Z, Z.P.x, Z.P.y, 1.8);
      crew(Z, 'gunner', 4, 430);
    } },
    { t: 110, run(Z) { Z.banner('The ghost ship fires a broadside!', '#7dffd0', true); Z.sfx('boss'); Z.shake(4); broadside(Z, 2); crew(Z, 'skel', 6, 400); } },
    { t: 132, run(Z) {
      Z.banner('Dawn glints on the bay. Hold fast, matey!', '#ffe9a0', false); Z.sfx('warn');
      crew(Z, 'skel', 5, 400);
      for (let i = 0; i < 3; i++) { const p = spot(Z, 440); Z.spawn('keg', p.x, p.y); }
    } },
  ];

  /* ================= Music: an original sea-shanty jig in E dorian, 6/8 (two dotted-quarter beats per bar) ================= */
  const DOR = [0, 2, 3, 5, 7, 9, 10], AEO = [0, 2, 3, 5, 7, 8, 10];
  const dg = (S, base, i) => base + S[((i % 7) + 7) % 7] + 12 * Math.floor(i / 7);
  const CH = [0, -1, 0, 3, 0, -1, 2, 4, 2, -1, 3, 0, 2, -1, 3, 0]; // Em D Em A | Em D G Bm | G D A Em | G D A Em
  const _ = null;
  const MEL = [
    [4, _, 2, 4, 5, 6], [7, _, 6, 5, _, 3], [4, _, _, 2, 3, 4], [5, _, 4, 3, _, _],
    [4, _, 2, 4, 5, 6], [7, _, 8, 6, _, 5], [4, _, 2, 6, _, 4], [4, 3, 2, 1, _, _],
    [2, _, 4, 7, _, 6], [6, _, 5, 6, _, 8], [7, _, 5, 3, _, 5], [4, _, _, 4, 5, 4],
    [2, 3, 4, 6, _, 4], [5, 6, 7, 8, _, 6], [7, _, 5, 6, 5, 3], [4, _, _, 0, _, _],
  ];
  const music = {
    bpm: 112, div: 3,
    step(s, t, A) {
      const sp = 60 / 112 / 3, bar = fl(s / 6), b = s % 6, sec = bar % 16, pass = fl(bar / 16) % 2, boss = A.boss, S = boss ? AEO : DOR;
      const ch = CH[sec], row = MEL[sec], n = row[b], root = dg(S, 40, ch);
      let len = 1; while (b + len < 6 && row[b + len] === null) len++;
      if (!boss) {
        // plucked bass: root on beat one, fifth on beat two
        if (b === 0) { A.pluck(root + 12, t, .7); A.tone(t, root, sp * 2.6, .06, { type: 'triangle', decay: true }); }
        if (b === 3) { const f5 = dg(S, 40, ch + 4); A.pluck(f5 + 12, t, .55); A.tone(t, f5, sp * 2.4, .05, { type: 'triangle', decay: true }); }
        // squeezebox chords on the off-beats
        if (b === 2 || b === 5 || (b === 1 && pass)) for (const k of [0, 2, 4]) A.tone(t, dg(S, 52, ch + k), sp * .8, .013, { type: 'square', cutoff: 1300, decay: true });
        // bodhran
        if (b === 0) A.tom(t, 88, .34); else if (b === 3) A.tom(t, 98, .24); else A.tom(t, 165, b === 2 || b === 5 ? .09 : .05);
        if (sec % 4 === 3 && b >= 3) A.tom(t + sp / 2, 140 - (b - 3) * 14, .1);
        A.noise(t, .03, .008 + (A.inten || 0) * .006, { type: 'highpass', f: 7000 });
        // lead: accordion (two detuned reeds) first time round, fiddle the second
        if (n !== null) {
          const mm = dg(S, 64, n), dur = sp * len * .92;
          if (!pass) { A.tone(t, mm, dur, .034, { type: 'square', cutoff: 2300, attack: .012 }); A.tone(t, mm, dur, .018, { type: 'square', cutoff: 2300, detune: 14, attack: .012 }); }
          else A.tone(t, mm, dur, .042, { type: 'sawtooth', cutoff: 2900, vib: .45, attack: .03 });
        }
        // tin whistle counter-line in the second strain
        if (sec >= 8 && (b === 0 || b === 3)) A.tone(t, dg(S, 76, ch + (b === 0 ? 4 : 2)), sp * 2.7, .02, { type: 'sine', vib: .3, attack: .04 });
        if (sec === 15 && b === 3) A.bell(dg(S, 76, 0), t, .04);
      } else {
        // swashbuckler battle: driving bass, timpani, snare rolls, low brass stabs, tremolo strings
        A.tone(t, root + [0, 0, 12, 0, 0, 7][b], sp * .85, .06, { type: 'sawtooth', cutoff: 480 });
        if (b === 0) { A.tom(t, 62, .48); A.kick(t, .6); } else if (b === 3) { A.tom(t, 78, .38); A.kick(t, .45); }
        if (b === 3) A.snare(t, .26);
        if (sec % 2 === 1 && b >= 4) { A.snare(t, .12); A.snare(t + sp / 2, .1); }
        A.hat(t, b % 3 === 0 ? .045 : .028, false);
        if (b === 0 || (b === 4 && sec % 2 === 1)) {
          A.tone(t, dg(S, 52, ch), sp * 1.5, .034, { type: 'sawtooth', cutoff: 1100, sweep: 500, attack: .01 });
          A.tone(t, dg(S, 52, ch + 2), sp * 1.5, .028, { type: 'sawtooth', cutoff: 1100, sweep: 500, attack: .01 });
        }
        const st = dg(S, 64, ch + [0, 2, 4, 2, 4, 2][b]);
        A.tone(t, st, sp * .45, .014, { type: 'sawtooth', cutoff: 2400 }); A.tone(t + sp / 2, st, sp * .45, .012, { type: 'sawtooth', cutoff: 2400 });
        if (n !== null) {
          const mm = dg(S, 64, n);
          A.tone(t, mm, sp * len * .9, .042, { type: 'sawtooth', cutoff: 2600, vib: .3, attack: .015 });
          A.tone(t, mm - 12, sp * len * .9, .022, { type: 'square', cutoff: 1200, attack: .015 });
        }
      }
    },
  };

  return {
    id: 'bay', name: 'Pirate Bay', nod: 'Heroes of the Storm', portal: '40,200,190', bg: SAND, dark: .35, dim: .14,
    ground, under, ambient,
    mix: { skel: 5, gunner: 1.6, crab: 1.2, keg: 1.4 },
    target: 1,
    foes: { skel, gunner, crab, keg },
    boss, events, music,
  };
})());
