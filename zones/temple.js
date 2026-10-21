// Zone temple: a drowned jungle-troll temple of a blood serpent god. Mossy terraced stone islands between murky canals
// and flooded corner courts, a round sunken atrium ringed by stairs and statues, blood-red ritual circles, troll idol
// heads, serpent and dragon statues, braziers and creeping jungle. A nod to World of Warcraft (the swamp's sunken temple).
ZONES.push((() => {
  const TAU = Math.PI * 2, PI = Math.PI, fl = Math.floor, ZS = 1.3; // ZS: the engine draws foes at 1.3x
  const W = (w, c) => (w ? '#fff' : c);
  const circ = (p, x, y, r) => { if (!(r > 0)) return; p.moveTo(x + r, y); p.arc(x, y, r, 0, TAU); };
  const ell = (p, x, y, rx, ry) => { if (!(rx > 0) || !(ry > 0)) return; p.moveTo(x + rx, y); p.ellipse(x, y, rx, ry, 0, 0, TAU); };
  const poly = (p, a) => { p.moveTo(a[0], a[1]); for (let i = 2; i < a.length; i += 2) p.lineTo(a[i], a[i + 1]); p.closePath(); };
  const cl01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
  const md = (x, m) => ((x % m) + m) % m;
  const face = (c, e) => { const f = Math.cos(e.ang) < 0 ? -1 : 1; c.scale(f, 1); return f; };
  // a block seen from above-south: top face, then the front face below it
  const box = (c, x, y, w, d, h, top, front, ol) => {
    const p = new Path2D(); p.rect(x, y - h, w, d); p.rect(x, y + d - h, w, h);
    c.fillStyle = top; c.fillRect(x, y - h, w, d); c.fillStyle = front; c.fillRect(x, y + d - h, w, h);
    if (ol) { c.strokeStyle = ol; c.lineWidth = 1.2; c.stroke(p); }
  };
  const SHADOW = 'rgba(12,18,12,.36)', OLS = '#2c3229', MOSS = 'rgba(88,120,58,.55)', GROUT = '#3a4037';

  // Carved troll glyphs (stroked polylines), used on floor tiles, ritual circles and the siphon circle.
  const glyph = (p, x, y, s, k, a) => {
    const ca = Math.cos(a) * s, sa = Math.sin(a) * s;
    const L = pts => { for (let i = 0; i < pts.length; i += 2) { const px = x + pts[i] * ca - pts[i + 1] * sa, py = y + pts[i] * sa + pts[i + 1] * ca; if (i) p.lineTo(px, py); else p.moveTo(px, py); } };
    switch (md(k, 5)) {
      case 0: { const q = []; for (let i = 0; i <= 14; i++) { const t = i / 14 * 3.4 * PI, r = 1 - i / 14 * .85; q.push(Math.cos(t) * r, Math.sin(t) * r); } L(q); break; }
      case 1: L([-1, 0, -.5, -.42, 0, -.55, .5, -.42, 1, 0, .5, .42, 0, .55, -.5, .42, -1, 0]); L([0, -.22, .2, 0, 0, .22, -.2, 0, 0, -.22]); break;
      case 2: L([0, -1, 0, 1]); L([-1, -.55, -.5, .2, 0, -.55, .5, .2, 1, -.55]); break;
      case 3: { const q = []; for (let i = 0; i <= 10; i++) { const v = -1 + i * .2; q.push(Math.sin(v * PI) * .55, v); } L(q); L([-.25, -1, 0, -1.3, .25, -1, 0, -.8, -.25, -1]); break; }
      default: L([-.8, -1, .8, -1, .8, 1, -.8, 1, -.8, -1]); L([-.5, -.4, -.15, -.4]); L([.15, -.4, .5, -.4]); L([-.45, .35, -.6, .75]); L([.45, .35, .6, .75]); L([-.3, .45, .3, .45]);
    }
  };
  // tapered ribbon along a polyline (serpent bodies); returns per-point normals [nx, ny, width]
  const ribbon = (p, pts, w0, w1) => {
    const n = pts.length, Lt = [], Rt = [], N = [];
    if (n < 2) return N;
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy);
      if (!(l > 1e-4)) { dx = 1; dy = 0; } else { dx /= l; dy /= l; }
      const w = w0 + (w1 - w0) * (i / (n - 1));
      N.push([-dy, dx, w]);
      Lt.push(pts[i][0] - dy * w, pts[i][1] + dx * w); Rt.push(pts[i][0] + dy * w, pts[i][1] - dx * w);
    }
    p.moveTo(Lt[0], Lt[1]); for (let i = 2; i < Lt.length; i += 2) p.lineTo(Lt[i], Lt[i + 1]);
    for (let i = Rt.length - 2; i >= 0; i -= 2) p.lineTo(Rt[i], Rt[i + 1]);
    p.closePath();
    return N;
  };

  /* ================= Map: stone islands on a 1600px macro grid =================
     Canals run along every cell border (stone causeway bridges cross them at the middle of each edge) and widen
     into round flooded courts at the corners. Each island steps down to the water in two terraces. Its centre holds
     one set piece: the round sunken atrium (stairs ringing down to a flooded pit with the serpent idol, statues all
     round), a ritual plaza (octagon, blood circle, altar, braziers, idol heads, pillars), or a ruined court (a square
     flooded pool under a great dragon statue, between colonnades). Serpent statues and idol heads guard the corner courts, ferns and mangrove roots crowd the
     water edges; broken pillars, rubble and lone idols are strewn about. */
  const M = 1600, HALF = 800, ATR = 0, RIT = 1, RUIN = 2;
  const PILLAR = 1, SERP = 2, IDOL = 3, DRAGON = 4, ALTAR = 5, BRAZ = 6, TREE = 7, FERN = 8, RUBBLE = 9, DAIS = 10;
  const NSTEP = 6, SW = 21, DY = 7;
  // each canal segment (between two corner courts) has its own width; the joins hide inside the courts
  const lh = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - fl(s); };
  const vw = (i, y) => (72 + 12 * Math.sin(y * .0083 + i * 1.7) + 6 * Math.sin(y * .027 + i * 4.1)) * (.72 + .56 * lh(i, fl(y / M)));
  const hwd = (j, x) => (72 + 12 * Math.sin(x * .0079 + j * 2.3) + 6 * Math.sin(x * .025 + j * 3.3)) * (.72 + .56 * lh(fl(x / M) + 91, j));
  const poolR = (Z, i, j, th) => { const h = Z.hash(i * 17 + 3, j * 31 - 7); return (215 + h * 55) * (1 + .09 * Math.sin(3 * th + h * 9) + .05 * Math.sin(5 * th + h * 17)); };
  // > 0 inside water (by that many px), < 0 on stone
  const waterD = (Z, x, y) => {
    const i = Math.round(x / M), j = Math.round(y / M), dx = x - i * M, dy = y - j * M;
    let d = Math.max(vw(i, y) - Math.abs(dx), hwd(j, x) - Math.abs(dy));
    const q = Math.hypot(dx, dy);
    if (q < 520) d = Math.max(d, poolR(Z, i, j, Math.atan2(dy, dx)) - q);
    if (Math.abs(dx) < 118 && Math.abs(md(y, M) - HALF) < 58) d = Math.min(d, -30);
    if (Math.abs(dy) < 118 && Math.abs(md(x, M) - HALF) < 58) d = Math.min(d, -30);
    return d;
  };

  const mkRC = (x, y, r, sd) => {
    const ring = new Path2D(); circ(ring, x, y, r); circ(ring, x, y, r - 28);
    const gp = new Path2D(), pts = [], n = r > 120 ? 12 : 8;
    for (let i = 0; i < n; i++) {
      const a = sd + i / n * TAU, gx = x + Math.cos(a) * (r - 14), gy = y + Math.sin(a) * (r - 14);
      glyph(gp, gx, gy, 8, i + fl(sd * 3), a + PI / 2);
      if (i % 2 === 0) pts.push([gx, gy]);
    }
    const R2 = (r - 28) * .84;
    for (let k = 0; k <= 3; k++) { const a = sd - PI / 2 + k * TAU / 3, px = x + Math.cos(a) * R2, py = y + Math.sin(a) * R2; if (k) gp.lineTo(px, py); else gp.moveTo(px, py); }
    glyph(gp, x, y, R2 * .5, 3, sd * .2);
    circ(gp, x, y, R2 * .18);
    const spl = new Path2D();
    for (let k = 0; k < 9; k++) { const a = sd * 3 + k * 2.4, d = (k % 3) * R2 * .3 + 6; ell(spl, x + Math.cos(a) * d, y + Math.sin(a) * d * .8, 5 + (k % 4) * 3, 3 + (k % 3) * 2); }
    return { x, y, r, s: sd, ring, gp, spl, pts };
  };

  const cache = new Map();
  const cellOf = (Z, cx, cy) => {
    const key = cx + ',' + cy;
    let cl = cache.get(key);
    if (cl) return cl;
    if (cache.size > 48) cache.clear();
    const h = i => Z.hash(cx * 41 + i * 13 + 7, cy * 29 - i * 5 + 3);
    const hk = h(1), kind = hk < .42 ? ATR : hk < .72 ? RIT : RUIN;
    const ax = cx * M + HALF + (h(2) - .5) * 90, ay = cy * M + HALF + (h(3) - .5) * 90;
    cl = { kind, ax, ay, f: [], br: [], eyes: [], rc: [], drips: [], pit: null, court: null, plaza: null };
    const occ = [];
    const free = (x, y, r) => { for (const o of occ) if (Math.hypot(o[0] - x, o[1] - y) < o[2] + r) return false; return true; };
    const dry = (x, y, m) => waterD(Z, x, y) < -m;
    const add = (k, x, y, r, ex) => { const o = Object.assign({ k, x, y, v: Z.hash(fl(x) * 3 + 1, fl(y) * 5 - 2), m: 1 }, ex || {}); cl.f.push(o); if (r) occ.push([x, y, r]); return o; };
    const eye = (x, y, rgb, hex) => cl.eyes.push([x, y, rgb, hex, Z.hash(fl(x), fl(y) * 3) * 9]);
    const brz = (x, y) => { add(BRAZ, x, y, 26); cl.br.push([x, y - 32]); };
    const serp = (x, y, m) => { add(SERP, x, y, 34, { m }); eye(x + m * 13.5, y - 77, '90,255,170', '#8affc8'); };
    const idol = (x, y) => { add(IDOL, x, y, 46); eye(x - 12.5, y - 41.5, '255,60,50', '#ff6a50'); eye(x + 12.5, y - 41.5, '255,60,50', '#ff6a50'); };
    const altar = (x, y, sc) => { add(ALTAR, x, y, 60 * sc, { sc }); cl.drips.push([x - 20.5 * sc, y - 16 * sc, h(60) * 3], [x + 15.3 * sc, y - 11 * sc, h(61) * 3 + 1]); };
    // keep the causeway approaches clear
    for (const [bx, by] of [[cx * M, cy * M + HALF], [(cx + 1) * M, cy * M + HALF], [cx * M + HALF, cy * M], [cx * M + HALF, (cy + 1) * M]]) occ.push([bx, by, 150]);

    if (kind === ATR) {
      const R = 250 + h(4) * 26;
      cl.pit = { x: ax, y: ay, R, bot: ay + NSTEP * DY, rb: R - NSTEP * SW };
      occ.push([ax, ay, R + 56]);
      add(DAIS, ax, ay + NSTEP * DY + 6, 0);
      eye(ax - 6, ay + NSTEP * DY - 60, '90,255,170', '#8affc8'); eye(ax + 6, ay + NSTEP * DY - 60, '90,255,170', '#8affc8');
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * TAU + PI / 8, x = ax + Math.cos(a) * (R + 100), y = ay + Math.sin(a) * (R + 96);
        if (!dry(x, y, 30)) continue;
        if (k % 2) idol(x, y); else serp(x, y, Math.cos(a) < 0 ? 1 : -1);
      }
      for (let k = 0; k < 4; k++) { const a = k * PI / 2, x = ax + Math.cos(a) * (R + 30), y = ay + Math.sin(a) * (R + 28); if (dry(x, y, 20)) brz(x, y); }
      const a2 = h(5) * TAU, sx = ax + Math.cos(a2) * 560, sy = ay + Math.sin(a2) * 520;
      if (dry(sx, sy, 130) && free(sx, sy, 110)) { cl.rc.push(mkRC(sx, sy, 92, h(6) * TAU)); occ.push([sx, sy, 100]); altar(sx, sy + 8, .62); }
    } else if (kind === RIT) {
      cl.plaza = { x: ax, y: ay, r: 255 };
      occ.push([ax, ay, 256]);
      cl.rc.push(mkRC(ax, ay, 168, h(4) * TAU));
      altar(ax, ay + 18, 1);
      for (let k = 0; k < 4; k++) { const a = PI / 4 + k * PI / 2; brz(ax + Math.cos(a) * 212, ay + Math.sin(a) * 200); }
      for (const o of [-.42, .42]) idol(ax + Math.cos(-PI / 2 + o) * 300, ay + Math.sin(-PI / 2 + o) * 292);
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + PI / 6, x = ax + Math.cos(a) * 330, y = ay + Math.sin(a) * 320; if (dry(x, y, 30) && Math.abs(a - PI * 1.5) > .5) add(PILLAR, x, y, 30, { broken: h(20 + k) < .45 }); }
    } else {
      cl.court = { x: ax, y: ay + 30, s: 150 };
      occ.push([ax, ay + 30, 220]);
      const m = h(4) < .5 ? -1 : 1;
      add(DRAGON, ax, ay - 168, 110, { m }); eye(ax + m * 34, ay - 168 - 144, '90,255,170', '#8affc8');
      brz(ax - 132, ay - 150); brz(ax + 132, ay - 150);
      for (const sx of [-1, 1]) for (let k = 0; k < 5; k++) add(PILLAR, ax + sx * 240, ay - 120 + k * 86, 30, { broken: h(30 + k + (sx > 0 ? 5 : 0)) < .45 });
    }
    // serpent statues flank the west causeway, braziers the north one
    for (const o of [-1, 1]) { const x = cx * M + 132, y = cy * M + HALF + o * 82; if (dry(x, y, 20) && free(x, y, 20)) serp(x, y, -1); }
    for (const o of [-1, 1]) { const x = cx * M + HALF + o * 84, y = cy * M + 136; if (dry(x, y, 20) && free(x, y, 20)) brz(x, y); }
    // a drowned pillar standing in this cell's north-west corner court
    add(PILLAR, cx * M + (h(7) - .5) * 70, cy * M + (h(8) - .5) * 70, 0, { broken: true, wet: true });
    // serpent statues and idol heads guard each corner court, on this cell's side
    for (let q = 0; q < 4; q++) {
      const ox = q === 1 || q === 2 ? 1 : 0, oy = q >= 2 ? 1 : 0, X = (cx + ox) * M, Y = (cy + oy) * M;
      for (let k = 0; k < 2; k++) {
        const th = q * PI / 2 + (.15 + .7 * h(40 + q * 3 + k)) * PI / 2, d = poolR(Z, cx + ox, cy + oy, th) + 70 + h(50 + q * 3 + k) * 90;
        const x = X + Math.cos(th) * d, y = Y + Math.sin(th) * d;
        if (dry(x, y, 40) && free(x, y, 56)) { if (k) idol(x, y); else serp(x, y, Math.cos(th) < 0 ? 1 : -1); }
      }
    }
    for (let k = 0; k < 6; k++) {
      const x = cx * M + 120 + h(70 + k) * (M - 240), y = cy * M + 120 + h(80 + k) * (M - 240), d = waterD(Z, x, y);
      if (d < -60 && d > -200 && free(x, y, 56)) { if (k % 2) idol(x, y); else add(PILLAR, x, y, 46, { broken: h(90 + k) < .3 }); }
    }
    for (let k = 0; k < 26; k++) {
      const x = cx * M + h(100 + k) * M, y = cy * M + h(130 + k) * M, d = waterD(Z, x, y);
      if (d < -24 && d > -120 && free(x, y, 22)) add(FERN, x, y, 22);
    }
    for (let k = 0; k < 5; k++) { const x = cx * M + 150 + h(160 + k) * (M - 300), y = cy * M + 150 + h(170 + k) * (M - 300); if (dry(x, y, 50) && free(x, y, 46)) add(PILLAR, x, y, 46, { broken: true }); }
    for (let k = 0; k < 6; k++) { const x = cx * M + 150 + h(180 + k) * (M - 300), y = cy * M + 150 + h(190 + k) * (M - 300); if (dry(x, y, 40) && free(x, y, 34)) add(RUBBLE, x, y, 34); }
    for (let k = 0; k < 2; k++) { const x = cx * M + 200 + h(200 + k) * (M - 400), y = cy * M + 200 + h(210 + k) * (M - 400); if (dry(x, y, 60) && free(x, y, 50)) idol(x, y); }
    cl.f.sort((p, q) => p.y - q.y);
    cache.set(key, cl);
    return cl;
  };
  const cellsNear = (Z, x0, y0, x1, y1) => {
    const out = [];
    for (let cy = fl((y0 - 700) / M); cy <= fl((y1 + 700) / M); cy++) for (let cx = fl((x0 - 700) / M); cx <= fl((x1 + 700) / M); cx++) out.push(cellOf(Z, cx, cy));
    return out;
  };

  /* ================= Water geometry (canals + corner courts) ================= */
  const shapesIn = (x0, y0, x1, y1) => {
    const S = [];
    for (let i = Math.ceil((x0 - 300) / M); i <= fl((x1 + 300) / M); i++) S.push({ k: 0, i });
    for (let j = Math.ceil((y0 - 300) / M); j <= fl((y1 + 300) / M); j++) S.push({ k: 1, j });
    for (let i = Math.ceil((x0 - 520) / M); i <= fl((x1 + 520) / M); i++) for (let j = Math.ceil((y0 - 520) / M); j <= fl((y1 + 520) / M); j++) S.push({ k: 2, i, j });
    return S;
  };
  const STEP = 14;
  const sides = (Z, s, off, x0, y0, x1, y1) => {
    if (s.k === 0) {
      const X = s.i * M, R = [], L = [];
      for (let y = fl((y0 - 40) / STEP) * STEP; y <= y1 + 40 + STEP; y += STEP) { const w = Math.max(3, vw(s.i, y) + off); R.push(X + w, y); L.push(X - w, y); }
      return [R, L];
    }
    if (s.k === 1) {
      const Y = s.j * M, T = [], B = [];
      for (let x = fl((x0 - 40) / STEP) * STEP; x <= x1 + 40 + STEP; x += STEP) { const w = Math.max(3, hwd(s.j, x) + off); T.push(x, Y - w); B.push(x, Y + w); }
      return [T, B];
    }
    const X = s.i * M, Y = s.j * M, ring = [];
    for (let q = 0; q <= 64; q++) { const th = q / 64 * TAU, r = Math.max(4, poolR(Z, s.i, s.j, th) + off); ring.push(X + Math.cos(th) * r, Y + Math.sin(th) * r); }
    return [ring];
  };
  // union of every water shape grown by `off` (all traced clockwise, so nonzero fill unions them)
  const fillPath = (Z, S, off, x0, y0, x1, y1) => {
    const p = new Path2D();
    for (const s of S) {
      const sd = sides(Z, s, off, x0, y0, x1, y1);
      if (s.k === 2) { const r = sd[0]; p.moveTo(r[0], r[1]); for (let i = 2; i < r.length; i += 2) p.lineTo(r[i], r[i + 1]); p.closePath(); continue; }
      const a = sd[0], b = sd[1];
      p.moveTo(a[0], a[1]); for (let i = 2; i < a.length; i += 2) p.lineTo(a[i], a[i + 1]);
      for (let i = b.length - 2; i >= 0; i -= 2) p.lineTo(b[i], b[i + 1]);
      p.closePath();
    }
    return p;
  };
  // only the outer contour of that union (segments that no other shape swallows)
  const edgePath = (Z, S, off, x0, y0, x1, y1) => {
    const p = new Path2D(), ok = v => Math.abs(v + off) < 2.5;
    for (const s of S) for (const ln of sides(Z, s, off, x0, y0, x1, y1)) {
      let prev = false;
      for (let i = 0; i < ln.length; i += 2) {
        const x = ln[i], y = ln[i + 1], inR = x > x0 - 60 && x < x1 + 60 && y > y0 - 60 && y < y1 + 60, g = inR && ok(waterD(Z, x, y));
        if (g) { if (prev) p.lineTo(x, y); else p.moveTo(x, y); }
        prev = g;
      }
    }
    return p;
  };

  /* ================= Floor art (cached) ================= */
  const TONES = ['#686d5d', '#62685a', '#6f7263'];
  const flags = (c, Z, x0, y0, x1, y1) => {
    const G = 64, T = TONES.map(() => new Path2D()), bev = new Path2D(), crack = new Path2D(), gl = new Path2D(), glh = new Path2D(),
      sc = new Path2D(), moss = new Path2D(), chip = new Path2D();
    for (let gy = fl(y0 / G); gy <= fl(y1 / G); gy++) {
      const off = (gy & 1) * G / 2;
      for (let gx = fl((x0 - off) / G); gx <= fl((x1 - off) / G); gx++) {
        const X = gx * G + off, Y = gy * G, cx = X + G / 2, cy = Y + G / 2, d = waterD(Z, cx, cy);
        if (d > 40) continue;
        const lv = d > -70 ? 2 : d > -170 ? 1 : 0, h = Z.hash(gx * 7 + 3, gy * 11 - 5), h2 = Z.hash(gx * 13 - 1, gy * 3 + 8), h3 = Z.hash(gx * 5 + 9, gy * 7 + 1);
        T[fl(h * 3) % 3].rect(X + 1.5, Y + 1.5, G - 3, G - 3);
        bev.moveTo(X + 2.5, Y + G - 3); bev.lineTo(X + 2.5, Y + 2.5); bev.lineTo(X + G - 3, Y + 2.5);
        if (h2 < .1) { crack.moveTo(X + 6 + h * 20, Y + 4); crack.lineTo(cx - 4 + h2 * 40, cy - 6); crack.lineTo(cx + 6, cy + 10); crack.lineTo(X + G - 8, Y + G - 4 - h * 20); if (h > .5) { crack.moveTo(cx - 4 + h2 * 40, cy - 6); crack.lineTo(X + 4, cy + 8); } }
        else if (h2 < .145) { const k = fl(h * 50); glyph(gl, cx, cy, 15, k, 0); glyph(glh, cx + 1.3, cy + 1.3, 15, k, 0); }
        else if (h2 < .19) for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) { const sx = X + 9 + q * 14 + (r & 1) * 7, sy = Y + 12 + r * 13; if (sx < X + G - 6) { sc.moveTo(sx + 7, sy); sc.arc(sx, sy, 7, 0, PI); } }
        if (h3 < (lv === 2 ? .5 : lv === 1 ? .28 : .12)) ell(moss, cx + (h - .5) * 30, cy + (h2 - .5) * 30, 10 + h * 16, 6 + h3 * 10);
        if (h > .82) poly(chip, h2 > .5 ? [X + G - 1.5, Y + 1.5, X + G - 14, Y + 1.5, X + G - 1.5, Y + 12] : [X + 1.5, Y + G - 1.5, X + 1.5, Y + G - 13, X + 13, Y + G - 1.5]);
      }
    }
    for (let k = 0; k < 3; k++) { c.fillStyle = TONES[k]; c.fill(T[k]); }
    c.strokeStyle = 'rgba(214,220,190,.09)'; c.lineWidth = 1.6; c.stroke(bev);
    c.fillStyle = GROUT; c.fill(chip);
    c.fillStyle = MOSS; c.fill(moss);
    c.strokeStyle = '#353a30'; c.lineWidth = 1.3; c.stroke(crack);
    c.lineCap = 'round';
    c.strokeStyle = '#80846f'; c.lineWidth = 1.2; c.stroke(glh); c.strokeStyle = '#33382e'; c.lineWidth = 2.4; c.stroke(gl);
    c.strokeStyle = '#4a5043'; c.lineWidth = 1.5; c.stroke(sc);
    c.lineCap = 'butt';
  };

  const water = (c, Z, S, x0, y0, x1, y1) => {
    const A = [x0, y0, x1, y1];
    c.lineCap = 'round'; c.lineJoin = 'round';
    // two terrace steps down toward the water
    for (const off of [170, 70]) {
      c.fillStyle = 'rgba(22,32,22,.17)'; c.fill(fillPath(Z, S, off, ...A));
      const t = edgePath(Z, S, off, ...A);
      c.strokeStyle = 'rgba(24,30,22,.8)'; c.lineWidth = 7; c.stroke(t);
      c.save(); c.translate(-1.5, -3); c.strokeStyle = '#80856f'; c.lineWidth = 2.6; c.stroke(t); c.restore();
    }
    c.fillStyle = 'rgba(26,34,26,.32)'; c.fill(fillPath(Z, S, 18, ...A));
    // stone coping lip with block joints
    const cp = edgePath(Z, S, 5, ...A);
    c.strokeStyle = '#7b806d'; c.lineWidth = 9; c.stroke(cp);
    c.setLineDash([2.5, 22]); c.strokeStyle = '#3b4035'; c.stroke(cp); c.setLineDash([]);
    c.fillStyle = '#2b4a44'; c.fill(fillPath(Z, S, 0, ...A));
    c.fillStyle = '#22403b'; c.fill(fillPath(Z, S, -14, ...A));
    c.fillStyle = '#1b3532'; c.fill(fillPath(Z, S, -36, ...A));
    c.strokeStyle = 'rgba(8,20,18,.5)'; c.lineWidth = 7; c.stroke(edgePath(Z, S, -4, ...A));
    c.strokeStyle = 'rgba(150,190,170,.18)'; c.lineWidth = 1.4; c.stroke(edgePath(Z, S, -24, ...A));
    c.lineCap = 'butt'; c.lineJoin = 'miter';
  };

  // lily pads, algae and driftwood on the water; mangrove roots on the edges; vines, moss, leaves and bones on stone
  const decals = (c, Z, x0, y0, x1, y1) => {
    const G = 44, lily = new Path2D(), lotus = new Path2D(), lotC = new Path2D(), alg = new Path2D(), drift = new Path2D(), root = new Path2D(), knot = new Path2D(), kcap = new Path2D(),
      vine = new Path2D(), leaf = new Path2D(), moss = new Path2D(), tuft = new Path2D(), dead = new Path2D(), bone = new Path2D(), skull = new Path2D();
    for (let gy = fl(y0 / G); gy <= fl(y1 / G); gy++) for (let gx = fl(x0 / G); gx <= fl(x1 / G); gx++) {
      const h = Z.hash(gx * 19 + 3, gy * 29 - 1);
      if (h > .42) continue;
      const x = gx * G + Z.hash(gx, gy * 3 + 1) * G, y = gy * G + Z.hash(gx * 3 + 2, gy) * G, d = waterD(Z, x, y), h2 = Z.hash(gx * 7 - 2, gy * 5 + 4);
      if (d > 14) {
        if (h < .13) {
          const r = 7 + h2 * 9, a = h2 * 40;
          lily.moveTo(x, y); lily.ellipse(x, y, r, r * .66, 0, a + .4, a + TAU - .05); lily.closePath();
          if (h < .025) { for (let k = 0; k < 5; k++) { const b = k / 5 * TAU + a; ell(lotus, x + 3 + Math.cos(b) * 3.5, y - 3 + Math.sin(b) * 2.4, 3.2, 2.2); } circ(lotC, x + 3, y - 3, 1.8); }
        } else if (h < .22) { ell(alg, x, y, 5 + h2 * 6, 2.5); ell(alg, x + 9, y + 4, 3, 1.6); ell(alg, x - 7, y + 5, 2.4, 1.3); }
        else if (h < .25 && d > 30) { drift.moveTo(x - 14, y + 2); drift.lineTo(x + 13, y - 3); drift.moveTo(x + 2, y - 1); drift.lineTo(x + 8, y - 8); }
      } else if (d > -26) {
        if (h < .11) {
          // a mangrove knot on the lip, its stilt roots fanning out and arching down into the water
          let nx = waterD(Z, x + 5, y) - waterD(Z, x - 5, y), ny = waterD(Z, x, y + 5) - waterD(Z, x, y - 5);
          const l = Math.hypot(nx, ny);
          if (l > 1e-3) {
            nx /= l; ny /= l;
            const kx = x - nx * 18, ky = y - ny * 18, a0 = Math.atan2(ny, nx), n = 3 + fl(h2 * 3);
            ell(knot, kx, ky - 4, 10, 7); ell(kcap, kx - 2, ky - 7, 6, 3.4);
            for (let k = 0; k < n; k++) {
              const a = a0 + (k - (n - 1) / 2) * .3, L = 24 + Z.hash(gx + k * 7, gy - k) * 16, ex = kx + Math.cos(a) * L, ey = ky + Math.sin(a) * L * .8 + 4;
              root.moveTo(kx + Math.cos(a) * 5, ky - 5); root.quadraticCurveTo(kx + Math.cos(a) * L * .5, ky + Math.sin(a) * L * .4 - 14, ex, ey);
            }
          }
        }
      } else if (d > -130) {
        if (h < .12) { tuft.moveTo(x - 4, y); tuft.lineTo(x - 7, y - 8); tuft.moveTo(x, y); tuft.lineTo(x + 1, y - 10); tuft.moveTo(x + 4, y); tuft.lineTo(x + 8, y - 7); }
        else if (h < .22) {
          let px = x, py = y, a = h2 * TAU;
          vine.moveTo(px, py);
          for (let k = 0; k < 4; k++) { a += (Z.hash(gx + k, gy - k) - .5) * 1.8; const qx = px + Math.cos(a) * 18, qy = py + Math.sin(a) * 18; vine.quadraticCurveTo(px + Math.cos(a + .6) * 12, py + Math.sin(a + .6) * 12, qx, qy); ell(leaf, qx + (k & 1 ? 3 : -3), qy - 2, 3.6, 2.2); px = qx; py = qy; }
        } else if (h < .3) ell(moss, x, y, 12 + h2 * 14, 6 + h2 * 6);
      } else {
        if (h < .05) {
          let px = x, py = y, a = h2 * TAU;
          vine.moveTo(px, py);
          for (let k = 0; k < 5; k++) { a += (Z.hash(gx - k, gy + k) - .5) * 1.6; const qx = px + Math.cos(a) * 20, qy = py + Math.sin(a) * 20; vine.quadraticCurveTo(px + Math.cos(a - .5) * 12, py + Math.sin(a - .5) * 12, qx, qy); ell(leaf, qx, qy - 2, 3.4, 2); px = qx; py = qy; }
        } else if (h < .1) ell(moss, x, y, 9 + h2 * 12, 5 + h2 * 5);
        else if (h < .14) { ell(dead, x, y, 3.4, 1.8); ell(dead, x + 6, y + 3, 2.8, 1.5); ell(dead, x - 4, y + 5, 3, 1.6); }
        else if (h < .155) { circ(skull, x, y - 2, 4.2); skull.rect(x - 2.6, y + 1, 5.2, 3); bone.moveTo(x - 9, y + 6); bone.lineTo(x + 9, y - 1); bone.moveTo(x - 8, y - 2); bone.lineTo(x + 8, y + 7); }
      }
    }
    c.fillStyle = 'rgba(70,104,60,.5)'; c.fill(alg);
    c.lineCap = 'round';
    c.strokeStyle = '#3c3022'; c.lineWidth = 2.6; c.stroke(drift);
    c.fillStyle = '#3f6b3c'; c.fill(lily); c.strokeStyle = '#21402a'; c.lineWidth = 1; c.stroke(lily);
    c.fillStyle = '#c8708c'; c.fill(lotus); c.fillStyle = '#e8c860'; c.fill(lotC);
    c.strokeStyle = '#2b2218'; c.lineWidth = 6; c.stroke(root); c.strokeStyle = '#5e4b33'; c.lineWidth = 3.2; c.stroke(root);
    c.fillStyle = '#4e3d2a'; c.fill(knot); c.strokeStyle = '#2b2218'; c.lineWidth = 1.4; c.stroke(knot); c.fillStyle = MOSS; c.fill(kcap);
    c.fillStyle = MOSS; c.fill(moss);
    c.strokeStyle = '#4a6a36'; c.lineWidth = 1.5; c.stroke(tuft);
    c.fillStyle = '#6a5c34'; c.fill(dead);
    c.strokeStyle = '#2f4a28'; c.lineWidth = 2; c.stroke(vine); c.fillStyle = '#4b7a3a'; c.fill(leaf);
    c.strokeStyle = '#a9a28a'; c.lineWidth = 2; c.stroke(bone); c.fillStyle = '#b4ad94'; c.fill(skull);
    c.lineCap = 'butt';
  };

  const drawBridges = (c, x0, y0, x1, y1) => {
    const sh = new Path2D(), fc = new Path2D(), ar = new Path2D(), dk = new Path2D(), jn = new Path2D(), pt = new Path2D(), pf = new Path2D(), po = new Path2D(), pof = new Path2D();
    let any = false;
    // over the north-south canals (the bridge runs east-west)
    for (let i = Math.ceil((x0 - 140) / M); i <= fl((x1 + 140) / M); i++) for (let j = fl(y0 / M) - 1; j <= fl(y1 / M) + 1; j++) {
      const X = i * M, Y = j * M + HALF;
      if (Y + 80 < y0 || Y - 80 > y1) continue;
      any = true;
      const L = X - 118, Wd = 236;
      sh.rect(L + 8, Y + 58, Wd - 16, 14);
      fc.rect(L, Y + 44, Wd, 14);
      for (const ax of [X - 54, X, X + 54]) { ar.moveTo(ax - 17, Y + 58); ar.lineTo(ax - 17, Y + 53); ar.quadraticCurveTo(ax, Y + 40, ax + 17, Y + 53); ar.lineTo(ax + 17, Y + 58); ar.closePath(); }
      dk.rect(L, Y - 50, Wd, 94);
      for (let u = L + 18; u < L + Wd - 4; u += 18) { jn.moveTo(u, Y - 44); jn.lineTo(u, Y + 30); }
      jn.moveTo(L, Y - 7); jn.lineTo(L + Wd, Y - 7);
      pt.rect(L, Y - 58, Wd, 8); pf.rect(L, Y - 50, Wd, 6); pt.rect(L, Y + 30, Wd, 8); pf.rect(L, Y + 38, Wd, 6);
      for (const px of [L - 4, L + Wd - 10]) for (const py of [Y - 64, Y + 24]) { po.rect(px, py, 14, 10); pof.rect(px, py + 10, 14, 8); }
    }
    // over the east-west canals (the bridge runs north-south)
    for (let j = Math.ceil((y0 - 140) / M); j <= fl((y1 + 140) / M); j++) for (let i = fl(x0 / M) - 1; i <= fl(x1 / M) + 1; i++) {
      const X = i * M + HALF, Y = j * M;
      if (X + 80 < x0 || X - 80 > x1) continue;
      any = true;
      const T = Y - 118, Hh = 236;
      sh.rect(X + 58, Y - 84, 14, 168);
      dk.rect(X - 50, T, 100, Hh);
      for (let u = T + 18; u < T + Hh - 4; u += 18) { jn.moveTo(X - 44, u); jn.lineTo(X + 44, u); }
      jn.moveTo(X, T); jn.lineTo(X, T + Hh);
      pt.rect(X - 58, T, 8, Hh); pt.rect(X + 50, T, 8, Hh); pf.rect(X - 58, T + Hh, 8, 6); pf.rect(X + 50, T + Hh, 8, 6);
      for (const px of [X - 61, X + 47]) for (const py of [T - 6, T + Hh - 8]) { po.rect(px, py, 14, 10); pof.rect(px, py + 10, 14, 8); }
    }
    if (!any) return;
    c.fillStyle = 'rgba(6,14,12,.45)'; c.fill(sh);
    c.fillStyle = '#4a4f42'; c.fill(fc); c.fillStyle = '#10201e'; c.fill(ar);
    c.fillStyle = '#737764'; c.fill(dk);
    c.strokeStyle = '#50554a'; c.lineWidth = 1.4; c.stroke(jn);
    c.fillStyle = '#878b77'; c.fill(pt); c.fillStyle = '#585d4f'; c.fill(pf);
    c.fillStyle = '#90947f'; c.fill(po); c.fillStyle = '#5c6052'; c.fill(pof);
    c.strokeStyle = OLS; c.lineWidth = 1.2; c.stroke(dk); c.stroke(fc); c.stroke(pt); c.stroke(po); c.stroke(pof);
  };

  // ---- set pieces (flat) ----
  const TREAD = ['#6a6f5e', '#616757', '#585f50', '#4f5749', '#454e41', '#3c463a'];
  const RISER = ['#3f453a', '#383e34', '#31372e', '#2a3028', '#232a23', '#1d241e'];
  const drawPit = (c, Z, p) => {
    const x = p.x, y = p.y, R = p.R;
    const band = new Path2D(); circ(band, x, y, R + 50);
    c.fillStyle = '#717563'; c.fill(band);
    const jn = new Path2D(), sv = new Path2D(), sh = new Path2D();
    for (let k = 0; k < 44; k++) { const a = k / 44 * TAU, ca = Math.cos(a), sa = Math.sin(a); jn.moveTo(x + ca * (R + 4), y + sa * (R + 4)); jn.lineTo(x + ca * (R + 22), y + sa * (R + 22)); }
    jn.moveTo(x + R + 24, y); jn.arc(x, y, R + 24, 0, TAU);
    // a carved serpent winding round the rim band
    for (let k = 0; k <= 160; k++) { const a = k / 160 * TAU, r = R + 37 + 5 * Math.sin(a * 14), px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (k) { sv.lineTo(px, py); sh.lineTo(px + 1.2, py + 1.2); } else { sv.moveTo(px, py); sh.moveTo(px + 1.2, py + 1.2); } }
    c.strokeStyle = '#4d5245'; c.lineWidth = 1.3; c.stroke(jn);
    c.lineCap = 'round'; c.strokeStyle = '#8a8e79'; c.lineWidth = 1.3; c.stroke(sh); c.strokeStyle = '#3c4136'; c.lineWidth = 2.6; c.stroke(sv); c.lineCap = 'butt';
    c.strokeStyle = OLS; c.lineWidth = 2; c.stroke(band);
    // the stair rings, each shifted down so the far risers show
    const lip = new Path2D(), sj = new Path2D();
    for (let k = 0; k < NSTEP; k++) {
      const r = R - k * SW, yk = y + k * DY, rs = new Path2D(), tr = new Path2D();
      circ(rs, x, yk, r); circ(tr, x, yk + DY, r);
      c.fillStyle = RISER[k]; c.fill(rs); c.fillStyle = TREAD[k]; c.fill(tr);
      lip.moveTo(x + Math.cos(PI * 1.06) * r, yk + DY + Math.sin(PI * 1.06) * r); lip.arc(x, yk + DY, r, PI * 1.06, PI * 1.94);
      for (let q = 0; q < 30; q++) { const a = (q + (k & 1) * .5) / 30 * TAU, ca = Math.cos(a), sa = Math.sin(a); sj.moveTo(x + ca * (r - SW + 2), yk + DY + sa * (r - SW + 2)); sj.lineTo(x + ca * (r - 2), yk + DY + sa * (r - 2)); }
    }
    c.strokeStyle = 'rgba(30,36,28,.55)'; c.lineWidth = 1.1; c.stroke(sj);
    c.strokeStyle = 'rgba(180,188,160,.35)'; c.lineWidth = 1.6; c.stroke(lip);
    // flooded bottom
    const by = p.bot + DY, wt = new Path2D(), dp = new Path2D(); circ(wt, x, by, p.rb); circ(dp, x, by + 6, p.rb - 18);
    c.fillStyle = '#21403b'; c.fill(wt); c.fillStyle = '#18302d'; c.fill(dp);
    c.strokeStyle = 'rgba(8,18,16,.6)'; c.lineWidth = 6; c.stroke(wt);
    const lp = new Path2D();
    for (let k = 0; k < 6; k++) { const a = k * 1.13 + R, d = p.rb * (.55 + (k % 3) * .12), px = x + Math.cos(a) * d, py = by + Math.sin(a) * d * .9, rr = 7 + (k % 3) * 2; lp.moveTo(px, py); lp.ellipse(px, py, rr, rr * .66, 0, a + .4, a + TAU - .05); lp.closePath(); }
    c.fillStyle = '#3f6b3c'; c.fill(lp); c.strokeStyle = '#21402a'; c.lineWidth = 1; c.stroke(lp);
    // dried blood running down the far stairs, and vines spilling over the rim
    const bl = new Path2D(), vn = new Path2D(), lf = new Path2D();
    for (const o of [-.32, .2]) {
      const a = -PI / 2 + o;
      for (let k = 0; k <= NSTEP; k++) { const r = R - k * SW + 4, px = x + Math.cos(a + Math.sin(k * 1.7) * .02) * r, py = y + k * DY + DY + Math.sin(a) * r; if (k) bl.lineTo(px, py); else bl.moveTo(px, py); }
    }
    for (const a of [PI * .85, PI * .1, PI * 1.25]) {
      let px = x + Math.cos(a) * (R + 30), py = y + Math.sin(a) * (R + 30);
      vn.moveTo(px, py);
      for (let k = 1; k <= 5; k++) { const r = R + 30 - k * 24, qx = x + Math.cos(a + Math.sin(k) * .06) * r, qy = y + k * 4 + Math.sin(a) * r; vn.quadraticCurveTo((px + qx) / 2 + 6, (py + qy) / 2, qx, qy); ell(lf, qx + (k & 1 ? 4 : -4), qy, 3.6, 2.2); px = qx; py = qy; }
    }
    c.lineCap = 'round';
    c.globalAlpha = .75; c.strokeStyle = '#4c1216'; c.lineWidth = 5; c.stroke(bl); c.globalAlpha = 1;
    c.strokeStyle = '#2f4a28'; c.lineWidth = 2.2; c.stroke(vn); c.fillStyle = '#4b7a3a'; c.fill(lf);
    c.lineCap = 'butt';
  };
  const oct = (p, x, y, r, dy) => { for (let i = 0; i < 8; i++) { const a = (i + .5) / 8 * TAU, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * .94 + dy; if (i) p.lineTo(px, py); else p.moveTo(px, py); } p.closePath(); };
  const drawPlaza = (c, q) => {
    const x = q.x, y = q.y, r = q.r, rs = new Path2D(), tp = new Path2D(), ln = new Path2D(), hl = new Path2D();
    oct(rs, x, y, r, 10); oct(tp, x, y, r, 0);
    c.fillStyle = '#41463b'; c.fill(rs); c.fillStyle = '#6c7060'; c.fill(tp);
    oct(ln, x, y, r - 24, 0); oct(ln, x, y, r - 80, 0);
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, ca = Math.cos(a), sa = Math.sin(a) * .94; ln.moveTo(x + ca * (r - 76), y + sa * (r - 76)); ln.lineTo(x + ca * (r - 26), y + sa * (r - 26)); }
    for (let i = 0; i < 48; i++) { const a = i / 48 * TAU, ca = Math.cos(a), sa = Math.sin(a) * .94; ln.moveTo(x + ca * (r - 20), y + sa * (r - 20)); ln.lineTo(x + ca * (r - 3), y + sa * (r - 3)); }
    oct(hl, x - 1, y - 1.5, r - 2, 0);
    c.strokeStyle = '#4d5246'; c.lineWidth = 1.3; c.stroke(ln);
    c.strokeStyle = '#878b77'; c.lineWidth = 1.6; c.stroke(hl);
    c.strokeStyle = OLS; c.lineWidth = 1.6; c.stroke(tp); c.stroke(rs);
  };
  const drawRitual = (c, rc) => {
    c.globalAlpha = .8; c.fillStyle = '#44141a'; c.fill(rc.spl); c.globalAlpha = 1;
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = '#4c181b'; c.lineWidth = 7; c.stroke(rc.ring);
    c.strokeStyle = '#5c1d20'; c.lineWidth = 2.6; c.stroke(rc.gp);
    c.lineCap = 'butt'; c.lineJoin = 'miter';
  };
  const drawCourt = (c, Z, q) => {
    const x = q.x, y = q.y, s = q.s, S2 = s * 2;
    const rim = new Path2D(); rim.rect(x - s - 24, y - s - 24, S2 + 48, S2 + 48);
    c.fillStyle = '#41463b'; c.fillRect(x - s - 24, y + s + 24, S2 + 48, 9);
    c.fillStyle = '#767a67'; c.fill(rim);
    const jn = new Path2D();
    for (let u = -s - 24; u < s + 24; u += 24) { jn.moveTo(x + u, y - s - 24); jn.lineTo(x + u, y - s); jn.moveTo(x + u, y + s); jn.lineTo(x + u, y + s + 24); jn.moveTo(x - s - 24, y + u); jn.lineTo(x - s, y + u); jn.moveTo(x + s, y + u); jn.lineTo(x + s + 24, y + u); }
    c.strokeStyle = '#4e5347'; c.lineWidth = 1.2; c.stroke(jn);
    c.fillStyle = '#383e34'; c.fillRect(x - s, y - s, S2, S2);
    c.fillStyle = '#565d4e'; c.fillRect(x - s, y - s + 9, S2, S2 - 9);
    c.fillStyle = '#2a302a'; c.fillRect(x - s + 16, y - s + 22, S2 - 32, 9);
    c.fillStyle = '#22413c'; c.fillRect(x - s + 16, y - s + 31, S2 - 32, S2 - 47);
    c.fillStyle = '#1a3431'; c.fillRect(x - s + 36, y - s + 50, S2 - 72, S2 - 88);
    c.strokeStyle = OLS; c.lineWidth = 1.6; c.stroke(rim); c.strokeRect(x - s, y - s, S2, S2);
    // a fallen pillar drum, lily pads
    const dr = new Path2D(); dr.rect(x - 60, y + 26, 54, 22); const de = new Path2D(); ell(de, x - 6, y + 37, 6, 11);
    c.fillStyle = '#6a6e5d'; c.fill(dr); c.fillStyle = '#82866f'; c.fill(de); c.strokeStyle = OLS; c.lineWidth = 1.2; c.stroke(dr); c.stroke(de);
    const fu = new Path2D(); for (let k = 1; k < 4; k++) { fu.moveTo(x - 60, y + 26 + k * 5.5); fu.lineTo(x - 6, y + 26 + k * 5.5); }
    c.strokeStyle = '#555a4b'; c.lineWidth = 1; c.stroke(fu);
    const lp = new Path2D(), lt = new Path2D();
    for (let k = 0; k < 9; k++) {
      const px = x - s + 30 + Z.hash(fl(x) + k, 7) * (S2 - 60), py = y - s + 44 + Z.hash(k, fl(y) + 3) * (S2 - 76), r = 7 + (k % 3) * 2.5, a = k * 2.3;
      if (Math.abs(px - x + 33) < 40 && Math.abs(py - y - 37) < 22) continue;
      lp.moveTo(px, py); lp.ellipse(px, py, r, r * .66, 0, a + .4, a + TAU - .05); lp.closePath();
      if (k === 4) circ(lt, px + 2, py - 2, 3.2);
    }
    c.fillStyle = '#3f6b3c'; c.fill(lp); c.strokeStyle = '#21402a'; c.lineWidth = 1; c.stroke(lp); c.fillStyle = '#c8708c'; c.fill(lt);
  };

  // ---- raised objects ----
  const drawPillar = (c, f) => {
    const x = f.x, y = f.y, br = f.broken, H = br ? 30 + f.v * 34 : 108, top = y - 14 - H;
    const sh = new Path2D(); ell(sh, x + 18 + H * .18, y + 1, 26 + H * .25, 8);
    c.fillStyle = f.wet ? 'rgba(6,16,14,.4)' : SHADOW; c.fill(sh);
    if (f.wet) { const rp = new Path2D(); ell(rp, x, y - 2, 30, 9); ell(rp, x, y - 1, 40, 13); c.strokeStyle = 'rgba(170,215,200,.32)'; c.lineWidth = 1.5; c.stroke(rp); }
    else box(c, x - 21, y - 14, 42, 14, 10, '#7c8070', '#5a5f50', OLS);
    const sf = new Path2D(); sf.rect(x - 15, top, 30, H + (f.wet ? 10 : 0));
    c.fillStyle = '#7d8270'; c.fill(sf);
    c.fillStyle = '#626756'; c.fillRect(x + 5, top, 10, H + (f.wet ? 10 : 0));
    c.fillStyle = '#90947e'; c.fillRect(x - 15, top, 4, H + (f.wet ? 10 : 0));
    const fu = new Path2D(); for (const u of [-8, -2, 4, 10]) { fu.moveTo(x + u, top + 6); fu.lineTo(x + u, y - 16); }
    c.strokeStyle = '#5a5f50'; c.lineWidth = 1.1; c.stroke(fu);
    if (H > 50) { const yb = top + H * .42, zz = new Path2D(); zz.moveTo(x - 15, yb); for (let i = 1; i <= 6; i++) zz.lineTo(x - 15 + i * 5, yb + (i & 1 ? -4 : 4)); c.fillStyle = '#686d5c'; c.fillRect(x - 15, yb - 6, 30, 12); c.strokeStyle = '#3c4136'; c.lineWidth = 1.4; c.stroke(zz); }
    c.strokeStyle = OLS; c.lineWidth = 1.3; c.stroke(sf);
    if (!br) box(c, x - 21, top + 2, 42, 10, 12, '#8d917c', '#686c5b', OLS);
    else {
      const jt = new Path2D(); poly(jt, [x - 15, top + 7, x - 10, top - 3, x - 4, top + 4, x + 3, top - 6, x + 9, top + 2, x + 15, top - 2, x + 15, top + 8, x - 15, top + 8]);
      c.fillStyle = '#8e927d'; c.fill(jt); c.strokeStyle = OLS; c.lineWidth = 1.2; c.stroke(jt);
      if (!f.wet) {
        const dr = new Path2D(); dr.rect(x + 22, y - 10, 30, 13); const de = new Path2D(); ell(de, x + 52, y - 3.5, 4.5, 6.5);
        c.fillStyle = '#737764'; c.fill(dr); c.fillStyle = '#8a8e79'; c.fill(de); c.strokeStyle = OLS; c.stroke(dr); c.stroke(de);
        c.fillStyle = '#6a6e5d'; c.fillRect(x - 30, y - 4, 8, 6); c.fillRect(x + 18, y + 4, 6, 4);
      }
    }
    // a creeper climbing the shaft
    const vn = new Path2D(), lf = new Path2D(), n = fl(H / 9);
    for (let i = 0; i <= n; i++) { const t = i / n, px = x + Math.sin(t * 8 + f.v * 6) * 14, py = y - 12 - t * H * .92; if (i) vn.lineTo(px, py); else vn.moveTo(px, py); if (i % 2) ell(lf, px + 3, py, 3.4, 2.1); }
    c.lineCap = 'round'; c.strokeStyle = '#2f4a28'; c.lineWidth = 2; c.stroke(vn); c.lineCap = 'butt';
    c.fillStyle = '#4e7c3c'; c.fill(lf);
    const ms = new Path2D(); ell(ms, x - 4, top + 6, 10, 3); c.fillStyle = MOSS; c.fill(ms);
  };
  const drawSerp = (c, f) => {
    const x = f.x, y = f.y, ST = '#6f8b7d', SD = '#536e61', SL = '#26342d';
    const sh = new Path2D(); ell(sh, x + 18, y + 1, 32, 9); c.fillStyle = SHADOW; c.fill(sh);
    c.save(); c.translate(x, y); c.scale(f.m, 1);
    box(c, -22, -12, 44, 12, 16, '#7a7e6c', '#5a5f50', OLS);
    const gb = new Path2D(); gb.moveTo(-19, -9); for (let i = 1; i <= 7; i++) gb.lineTo(-19 + i * 5.4, i & 1 ? -4 : -11);
    c.strokeStyle = '#3e4338'; c.lineWidth = 1.3; c.stroke(gb);
    for (const [cx, cy, rx, ry] of [[0, -26, 19, 7], [-1, -32, 15, 6], [1, -37.5, 11, 5]]) { const co = new Path2D(); ell(co, cx, cy, rx, ry); c.fillStyle = ST; c.fill(co); c.strokeStyle = SL; c.lineWidth = 1.3; c.stroke(co); }
    const nk = new Path2D(); nk.moveTo(2, -38); nk.quadraticCurveTo(-11, -52, 1, -62); nk.quadraticCurveTo(7, -67, 8, -72);
    c.lineCap = 'round'; c.strokeStyle = SL; c.lineWidth = 10; c.stroke(nk); c.strokeStyle = ST; c.lineWidth = 7.4; c.stroke(nk);
    const cr = new Path2D();
    for (let k = 0; k < 6; k++) { const a = -PI * .98 + k * .21, bx = 7, by = -75, px = -Math.sin(a) * 2.6, py = Math.cos(a) * 2.6; poly(cr, [bx + px, by + py, bx + Math.cos(a) * 16, by + Math.sin(a) * 16, bx - px, by - py]); }
    c.fillStyle = SD; c.fill(cr); c.strokeStyle = SL; c.lineWidth = 1; c.stroke(cr);
    const hd = new Path2D(); poly(hd, [2, -79, 12, -81.5, 20, -76.5, 19.5, -71.5, 10, -70, 3, -71.5]);
    c.fillStyle = ST; c.fill(hd); c.strokeStyle = SL; c.lineWidth = 1.4; c.stroke(hd);
    c.fillStyle = '#18201c'; c.fillRect(12, -78, 3, 2.2);
    const fg = new Path2D(); poly(fg, [16, -71.5, 17, -67.5, 18, -71.5]); c.fillStyle = '#c9c3a8'; c.fill(fg);
    const ms = new Path2D(); ell(ms, -6, -30, 7, 2.5); ell(ms, 4, -40, 5, 2); ell(ms, -14, -24, 4, 2); c.fillStyle = MOSS; c.fill(ms);
    c.lineCap = 'butt';
    c.restore();
  };
  const drawIdol = (c, f) => {
    const x = f.x, y = f.y;
    const sh = new Path2D(); ell(sh, x + 22, y + 2, 42, 10); c.fillStyle = SHADOW; c.fill(sh);
    const ear = new Path2D(); poly(ear, [x - 26, y - 40, x - 50, y - 74, x - 30, y - 57]); poly(ear, [x + 26, y - 40, x + 50, y - 74, x + 30, y - 57]);
    c.fillStyle = '#6c6f5d'; c.fill(ear); c.strokeStyle = OLS; c.lineWidth = 1.3; c.stroke(ear);
    const fe = new Path2D(); poly(fe, [x - 16, y - 76, x - 21, y - 95, x - 9, y - 77]); poly(fe, [x - 5, y - 76, x, y - 100, x + 5, y - 76]); poly(fe, [x + 9, y - 77, x + 21, y - 95, x + 16, y - 76]);
    c.fillStyle = '#727563'; c.fill(fe); c.stroke(fe);
    const hd = new Path2D(); poly(hd, [x - 28, y, x - 31, y - 54, x - 24, y - 76, x + 24, y - 76, x + 31, y - 54, x + 28, y]);
    c.fillStyle = '#7e8170'; c.fill(hd);
    const sd = new Path2D(); poly(sd, [x + 15, y, x + 19, y - 54, x + 15, y - 76, x + 24, y - 76, x + 31, y - 54, x + 28, y]); c.fillStyle = '#646858'; c.fill(sd);
    c.strokeStyle = OLS; c.lineWidth = 1.5; c.stroke(hd);
    c.fillStyle = '#6a6d5c'; c.fillRect(x - 24, y - 76, 48, 11);
    const zz = new Path2D(); zz.moveTo(x - 23, y - 70); for (let i = 1; i <= 8; i++) zz.lineTo(x - 23 + i * 5.75, y - (i & 1 ? 74 : 67));
    c.strokeStyle = '#43473b'; c.lineWidth = 1.4; c.stroke(zz);
    const br = new Path2D(); poly(br, [x - 25, y - 57, x + 25, y - 57, x + 21, y - 47, x - 21, y - 47]); c.fillStyle = '#6a6d5c'; c.fill(br); c.strokeStyle = OLS; c.lineWidth = 1.2; c.stroke(br);
    const dk = new Path2D(); dk.rect(x - 19, y - 46, 13, 9); dk.rect(x + 6, y - 46, 13, 9); dk.rect(x - 21, y - 26, 42, 13); dk.rect(x - 7, y - 33, 4, 2.4); dk.rect(x + 3, y - 33, 4, 2.4);
    const ns = new Path2D(); poly(ns, [x - 5, y - 46, x + 5, y - 46, x + 10, y - 31, x - 10, y - 31]);
    c.fillStyle = '#8a8d7a'; c.fill(ns); c.stroke(ns);
    c.fillStyle = '#1b1e18'; c.fill(dk);
    const th = new Path2D(); for (let i = 0; i < 5; i++) { th.rect(x - 19 + i * 8, y - 26, 5, 4); th.rect(x - 17 + i * 8, y - 17, 5, 4); } c.fillStyle = '#a8a690'; c.fill(th);
    const tk = new Path2D(); poly(tk, [x - 21, y - 15, x - 31, y - 35, x - 25, y - 36, x - 16, y - 19]); poly(tk, [x + 21, y - 15, x + 31, y - 35, x + 25, y - 36, x + 16, y - 19]);
    c.fillStyle = '#cbc4a6'; c.fill(tk); c.strokeStyle = OLS; c.lineWidth = 1.2; c.stroke(tk);
    const ms = new Path2D(); ell(ms, x - 8, y - 77, 14, 4); ell(ms, x + 21, y - 61, 6, 3); ell(ms, x - 25, y - 6, 8, 4); c.fillStyle = MOSS; c.fill(ms);
    const ck = new Path2D(); ck.moveTo(x + 8, y - 76); ck.lineTo(x + 4, y - 64); ck.lineTo(x + 9, y - 58); ck.moveTo(x - 27, y - 30); ck.lineTo(x - 22, y - 22);
    c.strokeStyle = '#3e4237'; c.lineWidth = 1.1; c.stroke(ck);
  };
  const drawDragon = (c, f) => {
    const x = f.x, y = f.y, D = '#5f7a6b', DD = '#46594e', DH = '#80998a', OL = '#22302a';
    const sh = new Path2D(); ell(sh, x + 46, y + 2, 92, 15); c.fillStyle = SHADOW; c.fill(sh);
    c.save(); c.translate(x, y); c.scale(f.m, 1);
    box(c, -66, -30, 132, 30, 24, '#7a7e6c', '#585d4f', OLS);
    const gb = new Path2D(); glyph(gb, -44, -12, 7, 1, 0); glyph(gb, 0, -12, 7, 4, 0); glyph(gb, 44, -12, 7, 2, 0);
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = '#3c4136'; c.lineWidth = 1.6; c.stroke(gb);
    const tl = new Path2D(); tl.moveTo(-18, -44); tl.quadraticCurveTo(-60, -50, -66, -28); tl.quadraticCurveTo(-70, -10, -54, -6);
    c.strokeStyle = OL; c.lineWidth = 11; c.stroke(tl); c.strokeStyle = D; c.lineWidth = 7.6; c.stroke(tl);
    const tp = new Path2D(); poly(tp, [-56, -6, -44, -12, -46, 0]); c.fillStyle = DD; c.fill(tp); c.strokeStyle = OL; c.lineWidth = 1.2; c.stroke(tp);
    const wg = new Path2D(); poly(wg, [-6, -80, -66, -164, -42, -122, -56, -114, -32, -98, -42, -88, -16, -74]); poly(wg, [12, -84, 48, -172, 40, -128, 54, -120, 34, -102, 42, -92, 20, -78]);
    c.fillStyle = DD; c.fill(wg); c.strokeStyle = OL; c.lineWidth = 1.5; c.stroke(wg);
    const rb = new Path2D(); for (const [a, b] of [[-42, -122], [-32, -98], [40, -128], [34, -102]]) { rb.moveTo(a < 0 ? -10 : 14, -80); rb.lineTo(a, b); }
    c.strokeStyle = '#384a40'; c.lineWidth = 1.4; c.stroke(rb);
    const bd = new Path2D(); ell(bd, 0, -80, 28, 32); ell(bd, -15, -60, 17, 13);
    c.fillStyle = D; c.fill(bd); c.strokeStyle = OL; c.lineWidth = 1.6; c.stroke(bd);
    const pl = new Path2D(); for (let k = 0; k < 5; k++) { pl.moveTo(6, -100 + k * 9); pl.quadraticCurveTo(18, -98 + k * 9, 24, -102 + k * 9); }
    c.strokeStyle = DH; c.lineWidth = 1.6; c.stroke(pl);
    const lg = new Path2D(); poly(lg, [4, -70, 15, -70, 17, -55, 25, -55, 25, -50, 4, -50]); c.fillStyle = D; c.fill(lg); c.strokeStyle = OL; c.lineWidth = 1.3; c.stroke(lg);
    const nk = new Path2D(); nk.moveTo(6, -104); nk.quadraticCurveTo(8, -128, 22, -138);
    c.strokeStyle = OL; c.lineWidth = 19; c.stroke(nk); c.strokeStyle = D; c.lineWidth = 15.5; c.stroke(nk);
    const hd = new Path2D(); poly(hd, [14, -146, 30, -151, 46, -143, 51, -136, 30, -130, 16, -134]);
    c.fillStyle = D; c.fill(hd); c.strokeStyle = OL; c.lineWidth = 1.5; c.stroke(hd);
    const hn = new Path2D(); hn.moveTo(19, -148); hn.lineTo(3, -166); hn.moveTo(25, -150); hn.lineTo(14, -173);
    c.strokeStyle = OL; c.lineWidth = 5.4; c.stroke(hn); c.strokeStyle = '#a2ad94'; c.lineWidth = 3; c.stroke(hn);
    const jl = new Path2D(); jl.moveTo(30, -136); jl.lineTo(49, -137); c.strokeStyle = OL; c.lineWidth = 1.2; c.stroke(jl);
    c.fillStyle = '#121a16'; c.fillRect(32, -146, 4, 2.8);
    const ms = new Path2D(); ell(ms, 26, -148, 8, 2.5); ell(ms, -40, -126, 6, 3); ell(ms, -6, -58, 9, 3); ell(ms, 30, -164, 4, 2); c.fillStyle = MOSS; c.fill(ms);
    const vn = new Path2D(), lf = new Path2D();
    vn.moveTo(-62, 0); for (let k = 1; k <= 6; k++) { const px = -62 + k * 11, py = -14 - k * 6 + Math.sin(k * 1.9) * 5; vn.lineTo(px, py); ell(lf, px + 3, py, 3.6, 2.2); }
    c.strokeStyle = '#2f4a28'; c.lineWidth = 2.2; c.stroke(vn); c.fillStyle = '#4e7c3c'; c.fill(lf);
    c.lineCap = 'butt'; c.lineJoin = 'miter';
    c.restore();
  };
  const drawAltar = (c, f) => {
    const x = f.x, y = f.y, sc = f.sc || 1;
    const sh = new Path2D(); ell(sh, x + 30 * sc, y + 2, 66 * sc, 12 * sc); c.fillStyle = SHADOW; c.fill(sh);
    c.save(); c.translate(x, y); c.scale(sc, sc);
    box(c, -50, -34, 100, 34, 26, '#7c7f6c', '#5a5e50', OLS);
    const cv = new Path2D(); for (let k = 0; k <= 24; k++) { const px = -46 + k * 3.83, py = -13 + Math.sin(k * .9) * 5; if (k) cv.lineTo(px, py); else cv.moveTo(px, py); }
    glyph(cv, -38, -13, 5, 1, 0); glyph(cv, 38, -13, 5, 1, 0);
    c.strokeStyle = '#8c907b'; c.lineWidth = 1.2; c.save(); c.translate(1, 1); c.stroke(cv); c.restore();
    c.strokeStyle = '#3a3e34'; c.lineWidth = 2; c.stroke(cv);
    const st = new Path2D(); for (let k = 0; k < 14; k++) { const a = k / 14 * TAU, r = 1 + .25 * Math.sin(a * 3 + 1) + .15 * Math.sin(a * 7), px = 4 + Math.cos(a) * 30 * r, py = -44 + Math.sin(a) * 11 * r; if (k) st.lineTo(px, py); else st.moveTo(px, py); } st.closePath();
    st.rect(-21, -26, 3, 10); st.rect(14, -26, 2.6, 15); st.rect(26, -26, 2.4, 7);
    c.fillStyle = '#58161a'; c.fill(st);
    const cr = new Path2D(); ell(cr, 2, -42, 16, 5); c.fillStyle = '#3c0e10'; c.fill(cr);
    const bw = new Path2D(); ell(bw, -3, -47, 11, 5); c.fillStyle = '#4a4c40'; c.fill(bw); c.strokeStyle = OLS; c.lineWidth = 1.2; c.stroke(bw);
    const bb = new Path2D(); ell(bb, -3, -47.5, 8, 3); c.fillStyle = '#7a1220'; c.fill(bb);
    const sk = new Path2D(); circ(sk, -35, -52, 5); sk.rect(-37.5, -49, 5.5, 4); c.fillStyle = '#c9c1a4'; c.fill(sk); c.stroke(sk);
    c.fillStyle = '#26221a'; c.fillRect(-37.5, -53.5, 2, 2); c.fillRect(-34, -53.5, 2, 2);
    c.fillStyle = '#d8cfae'; c.fillRect(30, -58, 3, 8); c.fillRect(36, -55, 3, 6);
    c.restore();
  };
  const drawBraz = (c, f) => {
    const x = f.x, y = f.y;
    const sh = new Path2D(); ell(sh, x + 12, y + 2, 22, 6); c.fillStyle = SHADOW; c.fill(sh);
    box(c, x - 13, y - 8, 26, 8, 6, '#7a7e6c', '#585d4f', OLS);
    const cl = new Path2D(); cl.rect(x - 7, y - 26, 14, 20);
    c.fillStyle = '#6c705f'; c.fill(cl); c.fillStyle = '#565a4c'; c.fillRect(x + 2.5, y - 26, 4.5, 20); c.strokeStyle = OLS; c.lineWidth = 1.2; c.stroke(cl);
    const bw = new Path2D(); bw.moveTo(x - 20, y - 31); bw.quadraticCurveTo(x - 17, y - 18, x, y - 18); bw.quadraticCurveTo(x + 17, y - 18, x + 20, y - 31); bw.closePath();
    poly(bw, [x - 20, y - 30, x - 26, y - 34, x - 22, y - 24]); poly(bw, [x + 20, y - 30, x + 26, y - 34, x + 22, y - 24]);
    c.fillStyle = '#6b5a3c'; c.fill(bw); c.strokeStyle = '#2a2216'; c.stroke(bw);
    const rm = new Path2D(); ell(rm, x, y - 31, 20, 5.5); c.fillStyle = '#2a160e'; c.fill(rm); c.strokeStyle = '#8a7650'; c.lineWidth = 1.3; c.stroke(rm);
    const co = new Path2D(); circ(co, x - 8, y - 31, 2.4); circ(co, x + 6, y - 30, 2.6); circ(co, x - 1, y - 32.5, 2.2); circ(co, x + 12, y - 32, 1.8);
    c.fillStyle = '#c4481c'; c.fill(co);
  };
  const drawTree = (c, f) => {
    const s = f.s, x = f.x, y = f.y, v = f.v;
    const sh = new Path2D(); ell(sh, x + 36 * s, y + 4, 90 * s, 26 * s); c.fillStyle = 'rgba(10,18,10,.4)'; c.fill(sh);
    const rt = new Path2D();
    for (let k = 0; k < 6; k++) { const a = PI * (-.12 + k * .25) + v, sx = x + Math.cos(a) * 8 * s, ex = x + Math.cos(a) * (40 + (k % 3) * 9) * s, ey = y + 4 + Math.sin(a) * 15 * s; rt.moveTo(sx, y - 10 * s); rt.quadraticCurveTo((sx + ex) / 2, y - 6 * s, ex, ey); }
    c.lineCap = 'round'; c.strokeStyle = '#2a2016'; c.lineWidth = 6.5 * s; c.stroke(rt); c.strokeStyle = '#5a4630'; c.lineWidth = 3.2 * s; c.stroke(rt);
    const tr = new Path2D(); poly(tr, [x - 13 * s, y, x - 7 * s, y - 74 * s, x + 7 * s, y - 74 * s, x + 14 * s, y]);
    c.fillStyle = '#5c4632'; c.fill(tr);
    const ts = new Path2D(); poly(ts, [x + 4 * s, y, x + 2 * s, y - 74 * s, x + 7 * s, y - 74 * s, x + 14 * s, y]); c.fillStyle = '#43331f'; c.fill(ts);
    const bk = new Path2D(); for (let k = 0; k < 4; k++) { bk.moveTo(x - 6 * s + k * 4 * s, y - 6 * s); bk.lineTo(x - 4 * s + k * 3 * s, y - 60 * s); }
    c.strokeStyle = '#3a2a1a'; c.lineWidth = 1.1; c.stroke(bk); c.strokeStyle = '#22180e'; c.lineWidth = 1.3; c.stroke(tr);
    const B = [[0, -112, 46], [-40, -98, 36], [40, -100, 38], [-22, -134, 34], [26, -136, 32], [2, -156, 26], [-54, -124, 24], [54, -126, 25]];
    const base = new Path2D(), mid = new Path2D(), hi = new Path2D(), sp = new Path2D(), fw = new Path2D(), hv = new Path2D();
    for (let k = 0; k < B.length; k++) {
      const j = Z0(v, k), bx = x + (B[k][0] + j * 6) * s, by = y + (B[k][1] + j * 4) * s, r = B[k][2] * s;
      circ(base, bx + 4 * s, by + 7 * s, r + 3 * s); circ(mid, bx, by, r); circ(hi, bx - r * .28, by - r * .32, r * .58);
      ell(sp, bx - r * .45, by - r * .5, r * .2, r * .12);
      if (k % 3 === 1) circ(fw, bx + r * .4, by + r * .3, 2.6 * s);
      if (k < 3 || k > 5) { hv.moveTo(bx + r * .3, by + r * .7); hv.lineTo(bx + r * .35 + 2, by + r * .7 + (18 + (k % 3) * 9) * s); }
    }
    c.fillStyle = '#1d3522'; c.fill(base);
    c.fillStyle = '#2e5132'; c.fill(mid); c.strokeStyle = '#142616'; c.lineWidth = 1.2; c.stroke(mid);
    c.fillStyle = '#3b663a'; c.fill(hi);
    c.fillStyle = '#56844a'; c.fill(sp);
    c.strokeStyle = '#2a4a26'; c.lineWidth = 1.6; c.stroke(hv);
    c.fillStyle = '#a83a44'; c.fill(fw);
    c.lineCap = 'butt';
  };
  const Z0 = (v, k) => Math.sin(v * 40 + k * 2.7);
  const drawFern = (c, f) => {
    const x = f.x, y = f.y, s = .8 + f.v * .5, fr = new Path2D(), lf = new Path2D();
    for (let k = 0; k < 7; k++) {
      const a = -PI + .28 + k * (PI - .56) / 6, L = (22 + ((k * 5) % 3) * 5) * s, ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L * .7 + 2, qx = x + Math.cos(a) * L * .5, qy = y + Math.sin(a) * L * .5 - 9 * s;
      fr.moveTo(x, y); fr.quadraticCurveTo(qx, qy, ex, ey);
      for (let j = 1; j < 5; j++) { const t = j / 5, px = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * qx + t * t * ex, py = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * qy + t * t * ey; lf.moveTo(px, py); lf.lineTo(px + Math.cos(a - 1.1) * 5 * s, py + Math.sin(a - 1.1) * 4 * s); lf.moveTo(px, py); lf.lineTo(px + Math.cos(a + 1.1) * 5 * s, py + Math.sin(a + 1.1) * 4 * s); }
    }
    c.lineCap = 'round';
    c.strokeStyle = '#263f20'; c.lineWidth = 3.4; c.stroke(fr); c.strokeStyle = '#4f7a3c'; c.lineWidth = 1.8; c.stroke(fr);
    c.strokeStyle = '#5f8c46'; c.lineWidth = 1.6; c.stroke(lf);
    c.lineCap = 'butt';
  };
  const RB = [[-16, -2], [5, -10], [14, 5], [-3, 8]];
  const drawRubble = (c, f) => {
    for (let k = 0; k < 4; k++) { const w = 11 + ((k * 7 + fl(f.v * 10)) % 4) * 3, bx = f.x + RB[k][0] - w / 2, by = f.y + RB[k][1]; box(c, bx, by - 6, w, 6, 6 + (k % 2) * 4, '#7a7e6c', '#585d4f', OLS); }
    const ms = new Path2D(); ell(ms, f.x + 4, f.y - 15, 5, 2); ell(ms, f.x - 14, f.y - 9, 4, 1.6); c.fillStyle = MOSS; c.fill(ms);
  };
  const drawDais = (c, f) => {
    const x = f.x, y = f.y, ST = '#5f9a7e', SD = '#477862', SL = '#1f3329';
    const wr = new Path2D(); ell(wr, x, y + 12, 56, 20); c.strokeStyle = 'rgba(170,215,200,.3)'; c.lineWidth = 1.6; c.stroke(wr);
    const sd = new Path2D(); ell(sd, x, y + 7, 46, 17); c.fillStyle = '#3d4a42'; c.fill(sd);
    const tp = new Path2D(); ell(tp, x, y, 46, 17); c.fillStyle = '#6e8476'; c.fill(tp); c.strokeStyle = OLS; c.lineWidth = 1.3; c.stroke(tp); c.stroke(sd);
    const rg = new Path2D(); ell(rg, x, y, 36, 13); c.strokeStyle = '#4d5f54'; c.lineWidth = 1.4; c.stroke(rg);
    for (const [cy, rx, ry] of [[-5, 27, 9], [-12, 21, 7.5], [-18, 15, 5.5]]) { const co = new Path2D(); ell(co, x, y + cy, rx, ry); c.fillStyle = ST; c.fill(co); c.strokeStyle = SL; c.lineWidth = 1.3; c.stroke(co); }
    const nk = new Path2D(); nk.moveTo(x, y - 20); nk.quadraticCurveTo(x - 9, y - 34, x, y - 44); nk.quadraticCurveTo(x + 6, y - 50, x, y - 56);
    c.lineCap = 'round'; c.strokeStyle = SL; c.lineWidth = 11; c.stroke(nk); c.strokeStyle = ST; c.lineWidth = 8; c.stroke(nk); c.lineCap = 'butt';
    const cr = new Path2D();
    for (let k = 0; k < 9; k++) { const a = -PI * 1.08 + k * .27, bx = x, by = y - 62, px = -Math.sin(a) * 3, py = Math.cos(a) * 3; poly(cr, [bx + px, by + py, bx + Math.cos(a) * 22, by + Math.sin(a) * 20, bx - px, by - py]); }
    c.fillStyle = SD; c.fill(cr); c.strokeStyle = SL; c.lineWidth = 1; c.stroke(cr);
    const hd = new Path2D(); poly(hd, [x - 13, y - 64, x, y - 74, x + 13, y - 64, x + 8, y - 51, x - 8, y - 51]);
    c.fillStyle = ST; c.fill(hd); c.strokeStyle = SL; c.lineWidth = 1.4; c.stroke(hd);
    c.fillStyle = '#122019'; c.fillRect(x - 8, y - 62, 4, 3); c.fillRect(x + 4, y - 62, 4, 3);
    const fg = new Path2D(); poly(fg, [x - 5, y - 52, x - 4, y - 47, x - 3, y - 52]); poly(fg, [x + 3, y - 52, x + 4, y - 47, x + 5, y - 52]); c.fillStyle = '#d8d2b4'; c.fill(fg);
  };
  const EXT = []; // [half width, extent above, extent below]
  EXT[PILLAR] = [70, 150, 30]; EXT[SERP] = [60, 110, 20]; EXT[IDOL] = [60, 110, 20]; EXT[DRAGON] = [120, 190, 30]; EXT[ALTAR] = [80, 80, 30];
  EXT[BRAZ] = [40, 50, 20]; EXT[TREE] = [150, 210, 50]; EXT[FERN] = [40, 40, 10]; EXT[RUBBLE] = [40, 40, 20]; EXT[DAIS] = [70, 110, 40];
  const DRAW = [];
  DRAW[PILLAR] = drawPillar; DRAW[SERP] = drawSerp; DRAW[IDOL] = drawIdol; DRAW[DRAGON] = drawDragon; DRAW[ALTAR] = drawAltar;
  DRAW[BRAZ] = drawBraz; DRAW[TREE] = drawTree; DRAW[FERN] = drawFern; DRAW[RUBBLE] = drawRubble; DRAW[DAIS] = drawDais;

  const ground = (Z, x0, y0, x1, y1) => {
    const c = Z.ctx;
    c.fillStyle = GROUT; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    flags(c, Z, x0, y0, x1, y1);
    const S = shapesIn(x0, y0, x1, y1);
    water(c, Z, S, x0, y0, x1, y1);
    decals(c, Z, x0, y0, x1, y1);
    drawBridges(c, x0, y0, x1, y1);
    const cells = cellsNear(Z, x0, y0, x1, y1);
    const vis = (x, y, rx, up, dn) => x + rx > x0 && x - rx < x1 && y + dn > y0 && y - up < y1;
    for (const cl of cells) {
      const p = cl.pit, q = cl.plaza, ct = cl.court;
      if (p && vis(p.x, p.y, p.R + 60, p.R + 60, p.R + 60)) drawPit(c, Z, p);
      if (q && vis(q.x, q.y, q.r + 10, q.r + 10, q.r + 20)) drawPlaza(c, q);
      if (ct && vis(ct.x, ct.y, ct.s + 30, ct.s + 30, ct.s + 40)) drawCourt(c, Z, ct);
      for (const rc of cl.rc) if (vis(rc.x, rc.y, rc.r + 4, rc.r + 4, rc.r + 4)) drawRitual(c, rc);
    }
    const list = [];
    for (const cl of cells) for (const f of cl.f) { const e = EXT[f.k]; if (vis(f.x, f.y, e[0], e[1], e[2])) list.push(f); }
    list.sort((p, q) => p.y - q.y);
    c.lineJoin = 'round';
    for (const f of list) DRAW[f.k](c, f);
    c.lineJoin = 'miter';
  };

  /* ================= Under (animated, before foes): ripples, mist, brazier fire, ritual glyphs, statue eyes ================= */
  const flame = (fo, fm, fc, x, y, s, now, k) => {
    const f = Math.sin(now * 11 + k) * .5 + Math.sin(now * 17.3 + k * 2) * .3, hg = (20 + f * 4) * s, w = 9 * s;
    fo.moveTo(x - w, y); fo.quadraticCurveTo(x - w, y - hg * .5, x + f * 3 * s, y - hg); fo.quadraticCurveTo(x + w, y - hg * .5, x + w, y); fo.closePath();
    fm.moveTo(x - w * .62, y); fm.quadraticCurveTo(x - w * .6, y - hg * .42, x + f * 1.8 * s, y - hg * .7); fm.quadraticCurveTo(x + w * .6, y - hg * .42, x + w * .62, y); fm.closePath();
    fc.moveTo(x - w * .3, y); fc.quadraticCurveTo(x, y - hg * .45, x + w * .3, y); fc.closePath();
  };
  const under = Z => {
    const c = Z.ctx, P = Z.P, now = Z.now, hw = Z.W / 2 + 80, hh = Z.H / 2 + 120;
    const x0 = P.x - hw, x1 = P.x + hw, y0 = P.y - hh, y1 = P.y + hh;
    const inV = (x, y, m) => x > x0 - m && x < x1 + m && y > y0 - m && y < y1 + m;
    const rp1 = new Path2D(), rp2 = new Path2D(), mist = new Path2D(), fo = new Path2D(), fm = new Path2D(), fc = new Path2D(), eyes = new Path2D();
    const G = 120;
    for (let gy = fl(y0 / G); gy <= fl(y1 / G); gy++) for (let gx = fl(x0 / G); gx <= fl(x1 / G); gx++) {
      const h = Z.hash(gx * 5 + 2, gy * 9 - 4);
      if (h > .45) continue;
      const x = gx * G + h * 90 + 10, y = gy * G + Z.hash(gx, gy * 3) * 90 + 10;
      if (waterD(Z, x, y) < 18) continue;
      const u = md(now * .42 + h * 13, 1), r = 3 + u * 18;
      ell(u < .5 ? rp1 : rp2, x, y, r, r * .42);
    }
    const G2 = 340;
    for (let gy = fl(y0 / G2); gy <= fl(y1 / G2); gy++) for (let gx = fl(x0 / G2); gx <= fl(x1 / G2); gx++) {
      const h = Z.hash(gx * 11 + 5, gy * 7 - 3);
      if (h > .6) continue;
      const x = gx * G2 + 170 + Math.sin(now * .11 + h * 20) * 120, y = gy * G2 + 170 + Math.cos(now * .08 + h * 9) * 50;
      if (waterD(Z, x, y) < -40) continue;
      ell(mist, x, y, 50 + h * 40, 11 + h * 6); ell(mist, x + 26, y - 6, 34 + h * 20, 8);
    }
    let lit = 0;
    for (const cl of cellsNear(Z, x0, y0, x1, y1)) {
      for (const b of cl.br) if (inV(b[0], b[1], 40)) flame(fo, fm, fc, b[0], b[1], 1, now, b[0] * .013 + b[1] * .007);
      for (const rc of cl.rc) {
        if (!inV(rc.x, rc.y, rc.r)) continue;
        const a = .2 + .2 * Math.sin(now * 1.25 + rc.s * 3);
        c.globalAlpha = a; c.strokeStyle = '#ff2a44'; c.lineWidth = 2.4; c.lineCap = 'round'; c.stroke(rc.gp); c.lineWidth = 3; c.stroke(rc.ring); c.globalAlpha = 1; c.lineCap = 'butt';
        for (const g of rc.pts) Z.glow('255,40,64', 20, g[0], g[1], a * 1.4);
      }
      for (const e of cl.eyes) {
        if (!inV(e[0], e[1], 20)) continue;
        const ph = md(now * .2 + e[4], 1.6);
        if (ph > .3) continue;
        const k = Math.sin(ph / .3 * PI);
        eyes.rect(e[0] - 1.6, e[1] - 1.3, 3.2, 2.6);
        Z.glow(e[2], 9 + 9 * k, e[0], e[1], .85 * k); lit = Math.max(lit, k);
      }
      const p = cl.pit;
      if (p && inV(p.x, p.bot, p.rb)) for (let k = 0; k < 3; k++) { const u = md(now * .35 + k / 3, 1), r = 4 + u * 16, a = k * 2.2 + 1; ell(u < .5 ? rp1 : rp2, p.x + Math.cos(a) * p.rb * .62, p.bot + DY + Math.sin(a) * p.rb * .5, r, r * .42); }
      const q = cl.court;
      if (q && inV(q.x, q.y, q.s)) for (let k = 0; k < 3; k++) { const u = md(now * .3 + k / 3 + .2, 1), r = 4 + u * 15; ell(u < .5 ? rp1 : rp2, q.x + 40 - k * 50, q.y - 50 + k * 45, r, r * .42); }
    }
    c.strokeStyle = 'rgba(165,215,200,.4)'; c.lineWidth = 1.3; c.stroke(rp1);
    c.strokeStyle = 'rgba(165,215,200,.18)'; c.stroke(rp2);
    c.fillStyle = 'rgba(190,226,212,.055)'; c.fill(mist);
    c.fillStyle = '#d8401a'; c.fill(fo); c.fillStyle = '#ff9a30'; c.fill(fm); c.fillStyle = '#fff0a0'; c.fill(fc);
    if (lit > 0) { c.globalAlpha = cl01(lit); c.fillStyle = '#ffe8c0'; c.fill(eyes); c.globalAlpha = 1; }
  };

  /* ================= Transient visuals (Blood Siphon circle): a cosmetic cache keyed on Z.t ================= */
  const fx = [];
  const addFx = o => { if (fx.length > 30) fx.shift(); fx.push(o); };
  const drawFx = (c, Z) => {
    const t = Z.t, now = Z.now;
    for (let i = fx.length - 1; i >= 0; i--) { const o = fx[i]; if (t > o.t0 + o.T + .3 || t < o.t0 - 1) fx.splice(i, 1); }
    for (const o of fx) {
      const k = (t - o.t0) / o.T;
      if (k < 0 || k > 1) continue;
      const arm = cl01((t - o.t0) / 1.1), fade = cl01((1 - k) * 8), pul = .5 + .5 * Math.sin(now * 9);
      const disc = new Path2D(); circ(disc, o.x, o.y, o.r);
      c.globalAlpha = (.07 + .07 * pul * arm) * fade; c.fillStyle = '#d01834'; c.fill(disc);
      const rg = new Path2D(); circ(rg, o.x, o.y, o.r); circ(rg, o.x, o.y, o.r * .74);
      const gl = new Path2D(), rot = now * .7;
      for (let i = 0; i < 8; i++) { const a = rot + i / 8 * TAU; glyph(gl, o.x + Math.cos(a) * o.r * .87, o.y + Math.sin(a) * o.r * .87, 9, i, a + PI / 2); }
      c.lineCap = 'round';
      c.globalAlpha = (.35 + .45 * arm) * fade; c.strokeStyle = '#ff3a50'; c.lineWidth = 3; c.stroke(rg); c.lineWidth = 2; c.stroke(gl);
      // blood streaming from the circle to the serpent
      if (arm >= 1) {
        const st = new Path2D();
        for (let j = 0; j < 18; j++) {
          const u = md(now * .8 + j / 18, 1), a = j * 2.4, sx = o.x + Math.cos(a) * o.r * .55, sy = o.y + Math.sin(a) * o.r * .45;
          const px = sx + (o.bx - sx) * u, py = sy + (o.by - sy) * u - Math.sin(u * PI) * 50, r = 5.2 * (1 - u * .45);
          circ(st, px, py, r);
          if (j % 4 === 0) Z.glow('255,40,70', 16, px, py, .6 * fade);
        }
        c.globalAlpha = .9 * fade; c.strokeStyle = '#4a0610'; c.lineWidth = 1.6; c.stroke(st); c.fillStyle = '#ff3048'; c.fill(st);
        Z.glow('255,40,70', 46, o.x, o.y, .5 * fade);
      }
      c.globalAlpha = 1; c.lineCap = 'butt';
    }
  };

  /* ================= Ambient (after darkness): brazier light and embers, fireflies, jade spirits, blood drips ================= */
  const ambient = Z => {
    const c = Z.ctx, P = Z.P, now = Z.now, hw = Z.W / 2 + 140, hh = Z.H / 2 + 140;
    const inV = (x, y, m) => Math.abs(x - P.x) < hw + (m || 0) && Math.abs(y - P.y) < hh + (m || 0);
    let n = 0;
    c.save();
    const emb = new Path2D(), drop = new Path2D(), spl = new Path2D(), fly = new Path2D(), mote = new Path2D();
    for (const cl of cellsNear(Z, P.x - hw, P.y - hh, P.x + hw, P.y + hh)) {
      for (const b of cl.br) {
        if (!inV(b[0], b[1]) || n > 60) continue;
        Z.glow('255,130,50', 54 + Math.sin(now * 9 + b[0]) * 4, b[0], b[1] - 8, .5); n++;
        for (let k = 0; k < 3; k++) {
          const u = md(now * .5 + k / 3 + b[0] * .013, 1);
          if (u > .9) continue;
          emb.rect(b[0] + Math.sin(now * 2 + k * 3 + b[1]) * 9 * u - 1, b[1] - 12 - u * 80, 2.2, 2.2);
        }
      }
      const p = cl.pit;
      if (p && inV(p.x, p.y, p.R)) {
        for (let k = 0; k < 7; k++) {
          const u = md(now * .11 + k / 7, 1), a = k * 1.9 + now * .25, r = 18 + u * (p.rb + 30), s = Math.sin(u * PI);
          const mx = p.x + Math.cos(a) * r * .8, my = p.bot - u * 130 + Math.sin(a) * r * .3;
          Z.glow('70,255,170', 8 + 8 * s, mx, my, .6 * s); circ(mote, mx, my, 1.7); n++;
        }
      }
      for (const d of cl.drips) {
        if (!inV(d[0], d[1])) continue;
        const u = md(now * .55 + d[2], 2);
        if (u < 1) drop.rect(d[0] - 1, d[1] + u * u * 14, 2, 3.2);
        else if (u < 1.25) { const k = (u - 1) / .25; ell(spl, d[0], d[1] + 17, 2 + k * 5, 1 + k * 1.5); }
      }
    }
    // fireflies drifting over the stones, anchored to 280px cells
    const G = 280;
    for (let gy = fl((P.y - hh) / G); gy <= fl((P.y + hh) / G); gy++) for (let gx = fl((P.x - hw) / G); gx <= fl((P.x + hw) / G); gx++) {
      const h = Z.hash(gx * 13 + 7, gy * 17 - 3);
      if (h > .55) continue;
      const sd = h * 40, x = gx * G + 140 + Math.sin(now * .43 + sd) * 100 + Math.sin(now * 1.7 + sd) * 14, y = gy * G + 140 + Math.cos(now * .37 + sd) * 70;
      const b = Math.sin(now * 2.2 + sd * 3);
      if (b <= 0) continue;
      Z.glow(h < .2 ? '120,255,190' : '210,255,120', 6 + b * 6, x, y, .55 * b); circ(fly, x, y, 1.5); n++;
    }
    c.fillStyle = '#ffd890'; c.fill(emb);
    c.globalAlpha = .9; c.fillStyle = '#d8ffe8'; c.fill(mote); c.fill(fly); c.globalAlpha = 1;
    c.fillStyle = '#9a1624'; c.fill(drop); c.strokeStyle = 'rgba(160,24,36,.6)'; c.lineWidth = 1; c.stroke(spl);
    drawFx(c, Z);
    c.restore();
  };

  /* ================= Foes ================= */
  const TSK = '#3f9ccc', HAIR = ['#ff3a2a', '#ff7a1a', '#e8e040'];
  // Temple guard: a tall, hunched jungle troll with tusks, long ears, a mohawk, war paint and a spear. Lopes in, winds up, lunges.
  const troll = {
    hp: 22, sp: 64, dmg: 9, xp: 2, r: 12, eye: false,
    init(e, Z) { e.mode = 'walk'; e.mt = Z.rnd(1, 2.4); e.la = 0; e.hair = fl(Math.random() * 3) % 3; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e);
      switch (e.mode) {
        case 'wind': Z.move(e, 0, 0); e.ang = e.la; if ((e.mt -= dt) <= 0) { e.mode = 'lunge'; e.mt = .3; } return;
        case 'lunge': Z.move(e, Math.cos(e.la) * e.sp * 4.4, Math.sin(e.la) * e.sp * 4.4); e.ang = e.la; if ((e.mt -= dt) <= 0) { e.mode = 'rec'; e.mt = .5; } return;
        case 'rec': Z.move(e, 0, 0); if ((e.mt -= dt) <= 0) { e.mode = 'walk'; e.mt = Z.rnd(1.3, 2.4); } return;
        default: {
          const a = Z.angTo(e) + Math.sin(e.ph * 2.2 + e.seed) * .35, k = .8 + .3 * Math.sin(e.ph * 6 + e.seed);
          Z.move(e, Math.cos(a) * e.sp * k, Math.sin(a) * e.sp * k); e.ang = Z.angTo(e);
          e.mt -= dt;
          if (e.mt <= 0 && d < 130 && d > 30) { e.mode = 'wind'; e.mt = .5; e.la = Z.angTo(e); }
        }
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 12, m = e.mode, sw = Math.sin(e.ph * 6 + e.seed), OL = W(white, '#0e2030'), SK = W(white, TSK);
      const lean = m === 'wind' ? -.22 : m === 'lunge' ? .28 : .08 + sw * .04;
      c.save(); c.translate(e.x, e.y); c.scale(s, s); face(c, e); c.rotate(lean);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const st = m === 'walk' ? sw : m === 'lunge' ? .8 : 0;
      const lg = new Path2D(); lg.moveTo(-3, 2); lg.lineTo(1 + st * 3, 7); lg.lineTo(-3 + st * 4, 12.5); lg.moveTo(2, 2); lg.lineTo(6 - st * 3, 7); lg.lineTo(2 - st * 4, 12.5);
      c.strokeStyle = OL; c.lineWidth = 4.6; c.stroke(lg); c.strokeStyle = SK; c.lineWidth = 2.8; c.stroke(lg);
      // weapon pose
      const wa = m === 'wind' ? -.08 : m === 'lunge' ? .02 : m === 'rec' ? .35 : -.28 + sw * .05;
      const gx = m === 'wind' ? -3 : m === 'lunge' ? 14 : 7, gy = m === 'rec' ? -3 : -5.5, dx = Math.cos(wa), dy = Math.sin(wa);
      const ba = new Path2D(); ba.moveTo(1, -10); ba.lineTo(gx - dx * 7, gy - dy * 7);
      c.strokeStyle = OL; c.lineWidth = 3.8; c.stroke(ba); c.strokeStyle = W(white, '#2f7aa2'); c.lineWidth = 2.2; c.stroke(ba);
      const lc = new Path2D(); poly(lc, [-5, 0, 6, 0, 7, 6, 3, 4.5, 1, 7.5, -2, 4.5, -5, 6]);
      c.fillStyle = W(white, '#8a4a22'); c.fill(lc);
      const tb = new Path2D(); poly(tb, [-6, -9, -2, -14, 6, -14, 10, -8, 6, 2, -4, 3]);
      c.strokeStyle = OL; c.lineWidth = 1.8; c.stroke(tb); c.fillStyle = SK; c.fill(tb);
      if (!white) {
        c.fillStyle = '#d8b040'; c.fillRect(-5, -1.2, 11.5, 2.4);
        const pt = new Path2D(); pt.moveTo(1, -11); pt.lineTo(4, -8); pt.lineTo(1, -5); pt.moveTo(5, -12); pt.lineTo(8, -9); pt.moveTo(13.5, -16.5); pt.lineTo(14.5, -12);
        c.strokeStyle = e.hair === 1 ? '#f4f0e6' : '#ff5a4a'; c.lineWidth = 1.3; c.stroke(pt);
      }
      const hd = new Path2D(); ell(hd, 11, -14, 5, 4.4); poly(hd, [11, -12, 17.5, -11.5, 17, -8.5, 11, -8]); poly(hd, [8, -16.5, -4, -22, 8.5, -12.5]);
      c.strokeStyle = OL; c.lineWidth = 1.8; c.stroke(hd); c.fillStyle = SK; c.fill(hd);
      const mh = new Path2D(); poly(mh, [6.5, -16.5, 4.5, -23, 8.5, -19.5, 9.5, -25.5, 12, -19.5, 14.5, -23, 14.8, -17.5]);
      c.strokeStyle = OL; c.lineWidth = 1.3; c.stroke(mh); c.fillStyle = W(white, HAIR[e.hair] || HAIR[0]); c.fill(mh);
      const tk = new Path2D(); poly(tk, [15, -9.5, 18.2, -14.5, 16.6, -9]); poly(tk, [12.6, -9, 13.6, -12.6, 13.9, -8.6]);
      c.strokeStyle = OL; c.lineWidth = 1.1; c.stroke(tk); c.fillStyle = W(white, '#fff6dc'); c.fill(tk);
      if (!white) { c.fillStyle = m === 'wind' ? '#ffffff' : '#ffe23a'; c.fillRect(12.6, -16, 2.4, 1.7); }
      // spear: shaft, bone tip and a red feather tuft
      const sx0 = gx - dx * 16, sy0 = gy - dy * 16, tx = gx + dx * 19, ty = gy + dy * 19;
      const sp = new Path2D(); sp.moveTo(sx0, sy0); sp.lineTo(tx, ty);
      c.strokeStyle = OL; c.lineWidth = 3.4; c.stroke(sp); c.strokeStyle = W(white, '#a8743a'); c.lineWidth = 1.8; c.stroke(sp);
      const px = -dy, py = dx, hdp = new Path2D(); poly(hdp, [tx + px * 3, ty + py * 3, tx + dx * 9, ty + dy * 9, tx - px * 3, ty - py * 3]);
      c.strokeStyle = OL; c.lineWidth = 1.2; c.stroke(hdp); c.fillStyle = W(white, '#eef2f4'); c.fill(hdp);
      if (!white) {
        const fe = new Path2D(); poly(fe, [tx - dx * 2, ty - dy * 2, tx - dx * 4 + px * 5, ty - dy * 4 + py * 5 + 3, tx - dx * 6, ty - dy * 6]);
        c.fillStyle = '#e8302a'; c.fill(fe);
        if (m === 'wind') Z.glow('255,240,200', 12, tx + dx * 6, ty + dy * 6, .9);
      }
      const fa = new Path2D(); fa.moveTo(6, -10); fa.lineTo(gx, gy);
      c.strokeStyle = OL; c.lineWidth = 3.8; c.stroke(fa); c.strokeStyle = SK; c.lineWidth = 2.2; c.stroke(fa);
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, TSK, 9, 90); },
  };

  // Blood priest: a witch doctor in a crimson feather robe, bone mask and feather crown, with a skull staff. Keeps its
  // distance, hexes you with a fan of blood bolts, and mends wounded allies with a jade beam.
  const priest = {
    hp: 34, sp: 52, dmg: 7, xp: 3, r: 12, eye: false,
    init(e, Z) { e.mode = 'walk'; e.t1 = Z.rnd(1.5, 3); e.t2 = Z.rnd(2, 4); e.side = Math.random() < .5 ? 1 : -1; e.aa = 0; e.tg = null; e.cast = 0; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e), a = Z.angTo(e);
      if (e.cast > 0) e.cast -= dt;
      if (e.mode === 'hex') {
        Z.move(e, 0, 0);
        if (e.mt > .3) { let da = a - e.aa; da = Math.atan2(Math.sin(da), Math.cos(da)); e.aa += da * Math.min(1, dt * 4); }
        e.ang = e.aa;
        if ((e.mt -= dt) <= 0) {
          for (const o of [-.22, 0, .22]) Z.shoot(e.x + Math.cos(e.aa) * 14, e.y - 16 + Math.sin(e.aa) * 14, e.aa + o, 195, { r: 6, dmg: 8, life: 3.5, col: '255,40,80' });
          Z.sfx('shoot'); e.cast = .3; e.mode = 'walk'; e.t1 = Z.rnd(3, 4.2);
        }
        return;
      }
      if (e.mode === 'mend') {
        Z.move(e, 0, 0);
        const g = e.tg;
        if (!g || g.dead || !(g.hp > 0)) { e.mode = 'walk'; e.tg = null; e.t2 = Z.rnd(3, 5); return; }
        g.hp = Math.min(g.max, g.hp + g.max * .5 * dt);
        e.ang = Math.atan2(g.y - e.y, g.x - e.x);
        if ((e.mt -= dt) <= 0) { e.mode = 'walk'; e.tg = null; e.t2 = Z.rnd(5, 7); }
        return;
      }
      let mv = a, k = 1;
      if (d < 210) mv = a + PI; else if (d < 330) { mv = a + e.side * PI / 2; k = .55; }
      Z.move(e, Math.cos(mv) * e.sp * k, Math.sin(mv) * e.sp * k); e.ang = a;
      if ((e.t2 -= dt) <= 0) {
        e.t2 = 1.2;
        let best = null, bh = .75;
        for (const o of Z.foes()) {
          if (o === e || o.boss || !(o.max > 0)) continue;
          const q = o.hp / o.max;
          if (q < bh && Math.abs(o.x - e.x) < 260 && Math.abs(o.y - e.y) < 260 && Math.hypot(o.x - e.x, o.y - e.y) < 260) { best = o; bh = q; }
        }
        if (best) { e.mode = 'mend'; e.mt = 1.3; e.tg = best; return; }
      }
      if ((e.t1 -= dt) <= 0 && d < 470) { e.mode = 'hex'; e.mt = .85; e.aa = a; Z.sfx('charge'); }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 12, now = Z.now, m = e.mode, OL = W(white, '#1e0a14'), SK = W(white, TSK);
      const f = Math.cos(e.ang) < 0 ? -1 : 1, bob = Math.sin(e.ph * 3 + e.seed) * 1.2, hex = m === 'hex', k = hex ? cl01(1 - e.mt / .85) : 0;
      c.save(); c.translate(e.x, e.y); c.scale(s, s);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const stx = f * 10, sty = -31 + bob;
      if (!white && m === 'mend' && e.tg) {
        const g = e.tg, tx = (g.x - e.x) / (ZS * s), ty = (g.y - e.y) / (ZS * s) - 6, dx = tx - stx, dy = ty - sty, L = Math.hypot(dx, dy) || 1, px = -dy / L, py = dx / L;
        const bm = new Path2D(); bm.moveTo(stx, sty);
        for (let i = 1; i <= 8; i++) { const u = i / 8, w = Math.sin(u * PI) * Math.sin(now * 14 + i * 1.7) * 5; bm.lineTo(stx + dx * u + px * w, sty + dy * u + py * w); }
        c.globalAlpha = .55; c.strokeStyle = '#2affa0'; c.lineWidth = 4; c.stroke(bm); c.globalAlpha = 1; c.strokeStyle = '#e8fff4'; c.lineWidth = 1.4; c.stroke(bm);
        Z.glow('60,255,170', 26, tx, ty, .7);
      }
      if (!white && hex) {
        const rg = new Path2D(); circ(rg, stx, sty, 5 + k * 10);
        rg.moveTo(stx + Math.cos(e.aa) * 14, sty + Math.sin(e.aa) * 14); rg.lineTo(stx + Math.cos(e.aa) * (30 + 70 * k), sty + Math.sin(e.aa) * (30 + 70 * k));
        c.globalAlpha = .35 + .55 * k; c.strokeStyle = k > .75 ? '#ffffff' : '#ff3a5a'; c.lineWidth = 1.8; c.stroke(rg); c.globalAlpha = 1;
      }
      c.scale(f, 1); c.translate(0, bob);
      const ft = new Path2D(); ft.rect(-5, 8.5, 3.5, 3); ft.rect(2, 8.5, 3.5, 3); c.fillStyle = OL; c.fill(ft);
      const ear = new Path2D(); poly(ear, [-1, -19, -15, -23, -2, -15]);
      c.strokeStyle = OL; c.lineWidth = 1.5; c.stroke(ear); c.fillStyle = SK; c.fill(ear);
      // feather crown behind the mask
      const fr = new Path2D(), fj = new Path2D(), fg = new Path2D(), fo = new Path2D();
      for (let i = 0; i < 5; i++) {
        const a = -2.55 + i * .38 + Math.sin(now * 3 + i + e.seed) * .04, L = 13 + (i % 2) * 4, bx = 3, by = -23, px = -Math.sin(a) * 2.3, py = Math.cos(a) * 2.3;
        const pts = [bx + px, by + py, bx + Math.cos(a) * L * .6 + px * 1.3, by + Math.sin(a) * L * .6 + py * 1.3, bx + Math.cos(a) * L, by + Math.sin(a) * L, bx + Math.cos(a) * L * .6 - px * 1.3, by + Math.sin(a) * L * .6 - py * 1.3, bx - px, by - py];
        poly(i % 3 === 0 ? fr : i % 3 === 1 ? fj : fg, pts); poly(fo, pts);
      }
      c.strokeStyle = OL; c.lineWidth = 1.6; c.stroke(fo);
      c.fillStyle = W(white, '#ff4038'); c.fill(fr); c.fillStyle = W(white, '#2fd890'); c.fill(fj); c.fillStyle = W(white, '#ffc83a'); c.fill(fg);
      const rb = new Path2D(); poly(rb, [-6, -12, 6, -12, 9, 4, 6, 2.5, 4, 7, 1, 3.5, -2, 7, -5, 3.5, -8, 6, -9, 2]);
      c.strokeStyle = OL; c.lineWidth = 1.8; c.stroke(rb); c.fillStyle = W(white, '#b8213e'); c.fill(rb);
      if (!white) {
        const tr = new Path2D(); tr.moveTo(-6, -10); tr.lineTo(7.5, 0); tr.moveTo(-8.6, 2.5); tr.lineTo(-5, 3.5); tr.lineTo(-2, 7); tr.lineTo(1, 3.5); tr.lineTo(4, 7); tr.lineTo(6, 2.5); tr.lineTo(9, 4);
        c.strokeStyle = '#f0c040'; c.lineWidth = 1.4; c.stroke(tr);
      }
      const ba = new Path2D(); ba.moveTo(-3, -9); ba.lineTo(9, -3);
      c.strokeStyle = OL; c.lineWidth = 3.6; c.stroke(ba); c.strokeStyle = SK; c.lineWidth = 2; c.stroke(ba);
      const sf = new Path2D(); sf.moveTo(10, -29); sf.lineTo(8.5, 10.5);
      c.strokeStyle = OL; c.lineWidth = 4; c.stroke(sf); c.strokeStyle = W(white, '#7a4a22'); c.lineWidth = 2.2; c.stroke(sf);
      const sk = new Path2D(); circ(sk, 10, -25, 3.3); c.fillStyle = W(white, '#efe6cc'); c.fill(sk);
      const ob = new Path2D(); circ(ob, 10, -31, 2.6 + k * 2.6);
      c.fillStyle = W(white, m === 'mend' ? '#5affc0' : hex ? '#ff6a80' : '#e8304a'); c.fill(ob);
      if (!white) { c.fillStyle = '#2a0e14'; c.fillRect(8.4, -26, 1.4, 1.4); c.fillRect(10.8, -26, 1.4, 1.4); Z.glow(m === 'mend' ? '60,255,170' : '255,40,70', 10 + k * 14 + (e.cast > 0 ? 8 : 0), 10, -31, .85); }
      const mk = new Path2D(); ell(mk, 5, -17, 5.6, 8.2);
      c.strokeStyle = OL; c.lineWidth = 1.7; c.stroke(mk); c.fillStyle = W(white, '#efe0bc'); c.fill(mk);
      if (!white) {
        const pn = new Path2D(); pn.moveTo(5, -24.5); pn.lineTo(5, -10); pn.moveTo(1.2, -13.5); pn.lineTo(2.4, -11); pn.moveTo(8.8, -13.5); pn.lineTo(7.6, -11); pn.moveTo(2, -10.5); pn.lineTo(8, -10.5);
        c.strokeStyle = '#d42a3a'; c.lineWidth = 1.5; c.stroke(pn);
        const es = new Path2D(); es.rect(1.6, -19.5, 2.6, 1.6); es.rect(5.9, -19.5, 2.6, 1.6); c.fillStyle = hex ? '#ff5a6a' : '#1a0a10'; c.fill(es);
      }
      const fa = new Path2D(); fa.moveTo(4, -9); fa.lineTo(9.4, -13);
      c.strokeStyle = OL; c.lineWidth = 3.6; c.stroke(fa); c.strokeStyle = SK; c.lineWidth = 2; c.stroke(fa);
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#b8213e', 10, 90); Z.burst(e.x, e.y - 20, '#ffc83a', 5, 70); },
  };

  // Blood ooze: a translucent crimson slime with a drowned victim's bones floating inside. Hops at you; splits in two.
  const ooze = {
    hp: 52, sp: 44, dmg: 11, xp: 4, r: 15, eye: false,
    init(e) { e.small = false; },
    update(e, Z) {
      const hop = Math.sin(e.ph * (e.small ? 5.5 : 3.6) + e.seed), k = hop > 0 ? hop * 1.9 : .12, a = Z.angTo(e);
      Z.move(e, Math.cos(a) * e.sp * k, Math.sin(a) * e.sp * k); e.ang = a;
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 15, ph = e.ph * (e.small ? 5.5 : 3.6) + e.seed, hop = Math.sin(ph), lift = hop > 0 ? hop * 5 : 0;
      const sq = hop > 0 ? 1 - hop * .12 : 1 + Math.min(.16, -hop * .2), OL = W(white, '#3a0610');
      c.save(); c.translate(e.x, e.y); c.scale(s, s);
      if (!white) { const pd = new Path2D(); ell(pd, 0, 13, 14 * (1.1 - lift * .04), 3.4); c.globalAlpha = .45; c.fillStyle = '#6a0a18'; c.fill(pd); c.globalAlpha = 1; }
      c.translate(0, -lift + 4); c.scale(sq, 2 - sq); c.translate(0, -4);
      const b = new Path2D(), w = e.ph * 4 + e.seed;
      for (let i = 0; i < 16; i++) {
        const t = i / 16 * TAU, rr = 15 * (1 + .06 * Math.sin(3 * t + w) + .04 * Math.sin(5 * t - w * .7));
        const px = Math.cos(t) * rr, py = Math.sin(t) > 0 ? Math.min(Math.sin(t) * rr * .8, 11) : Math.sin(t) * rr;
        if (i) b.lineTo(px, py); else b.moveTo(px, py);
      }
      b.closePath();
      c.strokeStyle = OL; c.lineWidth = 2.6; c.stroke(b);
      c.globalAlpha = white ? 1 : .82; c.fillStyle = W(white, '#d81c3a'); c.fill(b); c.globalAlpha = 1;
      if (!white) {
        const cr = new Path2D(); ell(cr, 1, 3, 10, 6.5); c.globalAlpha = .5; c.fillStyle = '#8a0c24'; c.fill(cr); c.globalAlpha = 1;
        const bn = new Path2D(), sk = new Path2D(), so = new Path2D();
        circ(sk, -3, -2, e.small ? 3.4 : 4.4); sk.rect(-5.2, 1.2, 4.6, 2.6);
        so.rect(-5.2, -3.4, 1.6, 1.8); so.rect(-2.2, -3.4, 1.6, 1.8);
        if (!e.small) {
          for (let k = 0; k < 3; k++) { bn.moveTo(3, 2 + k * 2.6); bn.quadraticCurveTo(8, 1 + k * 2.6, 9.5, 5 + k * 2.2); }
          bn.moveTo(3, 1); bn.lineTo(3, 9); bn.moveTo(-9, 8); bn.lineTo(-3, 5); circ(bn, -9.6, 8.4, .9);
        }
        c.globalAlpha = .9; c.strokeStyle = '#f6e8d2'; c.lineWidth = 1.5; c.stroke(bn); c.fillStyle = '#f6e8d2'; c.fill(sk); c.globalAlpha = 1;
        c.fillStyle = '#5a0a14'; c.fill(so);
        const bu = new Path2D(), u = md(e.ph * .8 + e.seed, 1); circ(bu, 6 - u * 3, 8 - u * 14, 1.4); circ(bu, -7, 4 - md(e.ph * .6 + e.seed * 2, 1) * 10, 1);
        c.strokeStyle = 'rgba(255,190,200,.7)'; c.lineWidth = 1; c.stroke(bu);
        const hi = new Path2D(); ell(hi, -6, -8, 4.2, 2.4); circ(hi, -1.5, -10.5, 1.1); c.fillStyle = 'rgba(255,225,230,.75)'; c.fill(hi);
      }
      c.restore();
    },
    death(e, Z) {
      Z.burst(e.x, e.y, '#d81c3a', e.small ? 8 : 14, 120);
      if (e.small) return;
      Z.burst(e.x, e.y, '#f6e8d2', 5, 80);
      for (const o of [-1, 1]) {
        const q = Z.spawn('ooze', e.x + o * 12, e.y + o * 4);
        if (q) { q.small = true; q.r = 9; q.max = q.hp = Math.max(4, e.max * .32); q.xp = 1; q.sp = e.sp * 1.3; q.dmg = Math.max(4, Math.round(e.dmg * .6)); q.kx = o * 160; q.ky = (Math.random() - .5) * 120; }
      }
    },
  };

  // Wind serpent: an emerald feathered serpent with red-gold wings. Circles you, rears back behind a dashed lane, then dives.
  const serp = {
    hp: 26, sp: 96, dmg: 10, xp: 3, r: 12, eye: false,
    init(e, Z) { e.mode = 'fly'; e.t1 = Z.rnd(2, 3.5); e.side = Math.random() < .5 ? 1 : -1; e.tr = []; e.da = 0; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e), a = Z.angTo(e), tr = e.tr, l = tr[0];
      if (!l || Math.hypot(e.x - l[0], e.y - l[1]) > 5) { tr.unshift([e.x, e.y]); if (tr.length > 9) tr.pop(); }
      switch (e.mode) {
        case 'aim':
          Z.move(e, -Math.cos(e.da) * 26, -Math.sin(e.da) * 26);
          if (e.mt > .3) { let da = a - e.da; da = Math.atan2(Math.sin(da), Math.cos(da)); e.da += da * Math.min(1, dt * 5); }
          e.ang = e.da;
          if ((e.mt -= dt) <= 0) { e.mode = 'dive'; e.mt = .5; }
          return;
        case 'dive': Z.move(e, Math.cos(e.da) * 560, Math.sin(e.da) * 560); e.ang = e.da; if ((e.mt -= dt) <= 0) { e.mode = 'rec'; e.mt = .7; } return;
        case 'rec': {
          const k = cl01(e.mt / .7), sp = 120 + 300 * k, b = e.da + e.side * (1 - k) * 1.4;
          Z.move(e, Math.cos(b) * sp, Math.sin(b) * sp); e.ang = b;
          if ((e.mt -= dt) <= 0) { e.mode = 'fly'; e.t1 = Z.rnd(2.4, 4); e.side = -e.side; }
          return;
        }
        default: {
          const off = d > 300 ? .35 : d < 170 ? 2.1 : 1.35, wob = Math.sin(e.ph * 3 + e.seed) * .3, mv = a + e.side * off + wob;
          Z.move(e, Math.cos(mv) * e.sp, Math.sin(mv) * e.sp); e.ang = mv;
          if ((e.t1 -= dt) <= 0 && d < 400 && d > 110) { e.mode = 'aim'; e.mt = .8; e.da = a; Z.sfx('charge'); }
        }
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 12, k2 = 1 / (ZS * s), now = Z.now, OL = W(white, '#0b2a18'), m = e.mode, ca = Math.cos(e.ang), sa = Math.sin(e.ang);
      c.save(); c.translate(e.x, e.y - 12); c.scale(s, s);
      c.lineCap = 'round'; c.lineJoin = 'round';
      if (!white && m === 'aim') {
        const k = cl01(1 - e.mt / .8), L = 280 * k2, ln = new Path2D();
        ln.moveTo(16, 0); ln.lineTo(L, 0); ln.moveTo(L - 12, -8); ln.lineTo(L, 0); ln.lineTo(L - 12, 8);
        c.save(); c.rotate(e.da); c.translate(0, 12 * k2); c.globalAlpha = .25 + .55 * k; c.strokeStyle = k > .7 ? '#ffffff' : '#5affa8'; c.lineWidth = 2 + k * 2;
        c.setLineDash([9, 7]); c.stroke(ln); c.setLineDash([]); c.restore(); c.globalAlpha = 1;
      }
      // body from the recorded flight path, with a living wiggle
      const tr = e.tr || [], pts = [[0, 0]], n = 8;
      for (let i = 1; i <= n; i++) {
        let px, py;
        if (tr[i]) { px = (tr[i][0] - e.x) * k2; py = (tr[i][1] - e.y) * k2; } else { px = -ca * 5 * i; py = -sa * 5 * i; }
        const wg = Math.sin(now * 9 - i * .9 + e.seed) * 1.8 * (i / n);
        pts.push([px - sa * wg, py + ca * wg]);
      }
      if (!white && m === 'dive') {
        const gh = new Path2D(); for (const o of [-6, 6]) { gh.moveTo(-ca * 8 - sa * o, -sa * 8 + ca * o); gh.lineTo(-ca * 46 - sa * o, -sa * 46 + ca * o); }
        c.globalAlpha = .45; c.strokeStyle = '#c8ffe4'; c.lineWidth = 2.4; c.stroke(gh); c.globalAlpha = 1;
      }
      const bd = new Path2D(); ribbon(bd, pts, 5.4, 1.4);
      c.strokeStyle = OL; c.lineWidth = 3; c.stroke(bd); c.fillStyle = W(white, '#2bd06c'); c.fill(bd);
      if (!white) {
        const bl = new Path2D(); bl.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length - 1; i++) bl.lineTo(pts[i][0], pts[i][1]);
        c.strokeStyle = '#ffd84a'; c.lineWidth = 1.5; c.stroke(bl);
        const lp = pts[pts.length - 1], pp = pts[pts.length - 2], ta = Math.atan2(lp[1] - pp[1], lp[0] - pp[0]), tf = new Path2D();
        for (const o of [-.5, 0, .5]) poly(tf, [lp[0], lp[1], lp[0] + Math.cos(ta + o - .12) * 8, lp[1] + Math.sin(ta + o - .12) * 8, lp[0] + Math.cos(ta + o + .12) * 8, lp[1] + Math.sin(ta + o + .12) * 8]);
        c.fillStyle = '#ff4a3a'; c.fill(tf);
      }
      c.save(); c.rotate(e.ang);
      const dv = m === 'dive', fp = dv ? -.6 : Math.sin(now * 14 + e.seed * 3), span = dv ? .5 : m === 'aim' ? 1.15 : 1;
      const wb = new Path2D(), wt = new Path2D();
      for (const sd of [-1, 1]) {
        const sw = dv ? -10 : 0, o = sd * span, out = 1 + fp * .22;
        poly(wb, [-2, sd * 3, 1 + sw * .3, o * 15 * out, -6 + sw, o * 26 * out, -9 + sw * .9, o * 19 * out, -13 + sw * .8, o * 21 * out, -13 + sw * .6, o * 14 * out,
          -18 + sw * .5, o * 14 * out, -14 + sw * .3, o * 8, -18, o * 6.5, -10, sd * 3]);
        poly(wt, [-1, sd * 4, 1 + sw * .3, o * 15 * out, -6 + sw, o * 26 * out, -4 + sw * .8, o * 18 * out, -2, o * 8]);
      }
      c.strokeStyle = OL; c.lineWidth = 1.6; c.stroke(wb); c.fillStyle = W(white, '#e8402e'); c.fill(wb); c.fillStyle = W(white, '#ffc23a'); c.fill(wt);
      const hd = new Path2D(); poly(hd, [11, 0, 4, -4.8, -3, -4, -4.5, 0, -3, 4, 4, 4.8]);
      c.strokeStyle = OL; c.lineWidth = 1.6; c.stroke(hd); c.fillStyle = W(white, '#1fae5c'); c.fill(hd);
      const cr = new Path2D(); poly(cr, [-1, -2.5, -11, -7.5, -4, 0, -11, 7.5, -1, 2.5]);
      c.strokeStyle = OL; c.lineWidth = 1.2; c.stroke(cr); c.fillStyle = W(white, '#ff3a3a'); c.fill(cr);
      if (!white) {
        c.fillStyle = m === 'aim' ? '#ffffff' : '#fff04a'; c.fillRect(3, -3.4, 2.2, 1.6); c.fillRect(3, 1.8, 2.2, 1.6);
        if (m === 'aim' || dv) Z.glow('120,255,170', 18, 4, 0, .8);
      }
      c.restore();
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y - 12, '#2bd06c', 10, 100); Z.burst(e.x, e.y - 12, '#ffc23a', 6, 80); },
  };

  /* ================= Miniboss: Zhal'kesh, Avatar of the Blood Serpent ================= */
  const BPAT = ['wave', 'ring', 'dive', 'siphon', 'summon', 'wave', 'dive', 'ring', 'siphon', 'dive'];
  const bossStart = (e, Z, m) => {
    e.mode = m;
    if (m === 'walk') { e.mt = (e.rage ? 1.0 : 1.7) + Math.random() * .6; e.sd = -e.sd || 1; return; }
    if (m === 'wave') {
      e.mt = 1.7; e.wa = Z.angTo(e); Z.sfx('charge');
      const rows = e.rage ? 6 : 5, half = e.rage ? .72 : .55;
      for (let k = 0; k < rows; k++) {
        const dd = e.r + 40 + k * 62, n = 3 + k;
        for (let i = 0; i < n; i++) { const a = e.wa + (i / (n - 1) - .5) * 2 * half; Z.hazard(e.x + Math.cos(a) * dd, e.y + Math.sin(a) * dd, { r: 38, t: 1 + k * .12, dmg: 15, col: '230,30,60' }); }
      }
      return;
    }
    if (m === 'dive') { e.mt = 2.05; e.da = Z.angTo(e); e.dv = false; e.t3 = 0; Z.sfx('warn'); return; }
    if (m === 'ring') { e.mt = 2.5; e.vol = e.rage ? 4 : 3; e.t3 = .6; Z.sfx('charge'); return; }
    if (m === 'siphon') {
      const r = e.rage ? 175 : 150;
      e.mt = 3.7; e.sx = Z.P.x; e.sy = Z.P.y; e.sr = r; e.t3 = 1.1; e.tick = 0;
      Z.banner('Blood Siphon!', '#ff4a5a', false); Z.sfx('warn');
      addFx({ k: 'siph', x: e.sx, y: e.sy, r, bx: e.x, by: e.y - 50, t0: Z.t, T: 3.7 });
      return;
    }
    if (m === 'summon') {
      e.mt = 1.6; Z.sfx('boss'); Z.shake(5); Z.banner('Zhal\'kesh calls upon the faithful!', '#ff6a7a', false);
      const np = e.rage ? 3 : 2, ns = e.rage ? 3 : 2, n = np + ns;
      for (let i = 0; i < n; i++) {
        const a = e.ph + i * TAU / n, x = e.x + Math.cos(a) * (e.r + 70), y = e.y + Math.sin(a) * (e.r + 70), q = Z.spawn(i < np ? 'priest' : 'serp', x, y);
        if (q) Z.burst(x, y, '#ff3048', 10, 90);
      }
    }
  };
  const RUFF = ['#e8283c', '#2fd394', '#ffc23a'];
  const boss = {
    name: 'Zhal\'kesh, Avatar of the Blood Serpent', hp: 4000, sp: 54, dmg: 24, xp: 0, r: 50, heavy: true, eye: false,
    init(e) {
      e.mode = 'walk'; e.mt = 2.2; e.pi = 0; e.rage = false; e.sd = 1; e.wa = 0; e.da = 0; e.dv = false; e.vol = 0; e.t3 = 0;
      e.sx = e.x; e.sy = e.y; e.sr = 150; e.tick = 0; e.tr = [];
      for (let i = 0; i < 16; i++) e.tr.push([e.x + Math.cos(PI * .8 + i * .12) * 11 * i, e.y + Math.sin(PI * .8 + i * .12) * 6 * i]);
    },
    update(e, Z) {
      const dt = Z.dt, tr = e.tr, l = tr[0];
      if (!l || Math.hypot(e.x - l[0], e.y - l[1]) > 11) { tr.unshift([e.x, e.y]); if (tr.length > 16) tr.pop(); }
      if (!e.rage && e.hp < e.max * .4) {
        e.rage = true; Z.banner('The Blood God stirs!', '#ff3a4a', true); Z.sfx('boss'); Z.shake(10);
        Z.ring(e.x, e.y - 40, 24, 150, { r: 7, dmg: 9, col: '255,40,70' }, e.ph);
      }
      e.mt -= dt;
      switch (e.mode) {
        case 'walk': {
          const d = Z.dist(e), sp = e.sp * (e.rage ? 1.3 : 1);
          if (d > 220) Z.chase(e, sp);
          else { const a = Z.angTo(e) + PI / 2 * e.sd; Z.move(e, Math.cos(a) * sp * .6, Math.sin(a) * sp * .6); e.ang = Z.angTo(e); }
          if (e.mt <= 0) bossStart(e, Z, BPAT[e.pi++ % BPAT.length]);
          break;
        }
        case 'wave':
          Z.move(e, 0, 0); e.ang = e.wa;
          if (e.mt <= 0) bossStart(e, Z, 'walk');
          break;
        case 'dive':
          if (e.mt > .9) {
            Z.move(e, 0, 0);
            if (e.mt > 1.5) { let da = Z.angTo(e) - e.da; da = Math.atan2(Math.sin(da), Math.cos(da)); e.da += da * Math.min(1, dt * 2.5); }
          } else {
            if (!e.dv) { e.dv = true; Z.sfx('nova'); Z.shake(6); }
            Z.move(e, Math.cos(e.da) * 620, Math.sin(e.da) * 620);
            if (e.rage && (e.t3 -= dt) <= 0) { e.t3 = .12; Z.hazard(e.x, e.y, { r: 36, t: .7, dmg: 10, col: '200,20,50' }); }
          }
          e.ang = e.da;
          if (e.mt <= 0) bossStart(e, Z, 'walk');
          break;
        case 'ring':
          Z.move(e, 0, 0); e.ang = Z.angTo(e);
          if (e.vol > 0 && (e.t3 -= dt) <= 0) {
            const n = e.rage ? 18 : 16;
            Z.ring(e.x, e.y - 40, n, 140, { r: 7, dmg: 9, life: 5, col: '255,40,70' }, e.vol * PI / n + e.seed);
            if (e.rage) Z.ring(e.x, e.y - 40, 8, 95, { r: 8, dmg: 9, life: 5, col: '60,240,160' }, e.vol * .4);
            e.vol--; e.t3 = .5; Z.sfx('shoot');
          }
          if (e.mt <= 0) bossStart(e, Z, 'walk');
          break;
        case 'siphon':
          Z.move(e, 0, 0); e.ang = Math.atan2(e.sy - e.y, e.sx - e.x);
          if (e.tick < 5 && (e.t3 -= dt) <= 0) {
            if (e.tick > 0 && Math.hypot(Z.P.x - e.sx, Z.P.y - e.sy) < e.sr) { e.hp = Math.min(e.max, e.hp + e.max * .01); Z.burst(Z.P.x, Z.P.y, '#ff3048', 6, 80); }
            Z.hazard(e.sx, e.sy, { r: e.sr, t: .5, dmg: 6, col: '200,20,50' });
            e.tick++; e.t3 = .5;
          }
          if (e.mt <= 0) bossStart(e, Z, 'walk');
          break;
        case 'summon':
          Z.move(e, 0, 0); e.ang = Z.angTo(e);
          if (e.mt <= 0) bossStart(e, Z, 'walk');
          break;
        default: bossStart(e, Z, 'walk');
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 50, k2 = 1 / (ZS * s), m = e.mode, now = Z.now, OL = W(white, '#24050c'), BODY = W(white, '#b81f3a'), BELLY = W(white, '#e8b23c'), JADE = W(white, '#2fd394');
      c.save(); c.translate(e.x, e.y); c.scale(s, s);
      c.lineCap = 'round'; c.lineJoin = 'round';
      if (!white) {
        if (m === 'wave' && e.mt > .75) {
          const k = cl01(1 - (e.mt - .75) / .95), R = (e.r + 40 + (e.rage ? 6 : 5) * 62) * k2, half = e.rage ? .78 : .62, wd = new Path2D();
          wd.moveTo(0, 0); wd.arc(0, 0, R, e.wa - half, e.wa + half); wd.closePath();
          c.globalAlpha = .1 + .2 * k; c.fillStyle = '#ff2a48'; c.fill(wd); c.globalAlpha = .45 + .4 * k; c.strokeStyle = '#ffb4be'; c.lineWidth = 2; c.stroke(wd); c.globalAlpha = 1;
        }
        if (m === 'dive' && e.mt > .9) {
          const k = cl01(1 - (e.mt - .9) / 1.15), L = 620 * .9 * k2, Wd = (e.r + 8) * k2, ch = new Path2D();
          for (let j = 0; j < 5; j++) { const u = md(now * 1.4 + j / 5, 1), x = 30 + u * (L - 40); ch.moveTo(x - 14, -Wd * .55); ch.lineTo(x, 0); ch.lineTo(x - 14, Wd * .55); }
          c.save(); c.rotate(e.da);
          c.globalAlpha = .1 + .22 * k + .05 * Math.sin(now * 20); c.fillStyle = '#ff2a48'; c.fillRect(20, -Wd, L, Wd * 2);
          c.globalAlpha = .45 + .4 * k; c.strokeStyle = '#ffd0d6'; c.lineWidth = 1.6; c.strokeRect(20, -Wd, L, Wd * 2); c.lineWidth = 3; c.stroke(ch);
          c.restore(); c.globalAlpha = 1;
        }
        if (e.rage) { c.globalAlpha = .3 + .2 * Math.sin(now * 6); c.strokeStyle = '#ff3a4a'; c.lineWidth = 3; c.beginPath(); c.arc(0, -10, 62 + Math.sin(now * 5) * 4, 0, TAU); c.stroke(); c.globalAlpha = 1; }
        Z.glow('255,40,80', 90, 0, -50, e.rage ? .38 : .26);
      }
      // trailing tail on the ground, following the serpent's path
      const tr = e.tr || [], pts = [[0, 8]];
      for (let i = 1; i < tr.length; i++) pts.push([(tr[i][0] - e.x) * k2, (tr[i][1] - e.y) * k2 + 8]);
      if (pts.length < 3) for (let i = 1; i < 6; i++) pts.push([-i * 12, 8 + i * 5]);
      const tl = new Path2D(), N = ribbon(tl, pts, 21, 3.5);
      c.strokeStyle = OL; c.lineWidth = 3; c.stroke(tl); c.fillStyle = BODY; c.fill(tl);
      if (!white) {
        const bn = new Path2D(), df = new Path2D();
        for (let i = 1; i < pts.length - 1; i++) {
          const [nx, ny, w] = N[i], x = pts[i][0], y = pts[i][1];
          bn.moveTo(x + nx * w * .7, y + ny * w * .7); bn.lineTo(x - nx * w * .7, y - ny * w * .7);
          if (i % 2 === 0) { const ox = x - nx * w, oy = y - ny * w, tx = -ny, ty = nx; poly(df, [ox + tx * 4, oy + ty * 4, ox - nx * 9, oy - ny * 9, ox - tx * 4, oy - ty * 4]); }
        }
        c.strokeStyle = BELLY; c.lineWidth = 2.2; c.stroke(bn); c.fillStyle = JADE; c.fill(df);
        const lp = pts[pts.length - 1], pp = pts[pts.length - 2], ta = Math.atan2(lp[1] - pp[1], lp[0] - pp[0]), tf = new Path2D();
        for (const o of [-.55, 0, .55]) { const a = ta + o; poly(tf, [lp[0], lp[1], lp[0] + Math.cos(a - .14) * 22, lp[1] + Math.sin(a - .14) * 22, lp[0] + Math.cos(a) * 28, lp[1] + Math.sin(a) * 28, lp[0] + Math.cos(a + .14) * 22, lp[1] + Math.sin(a + .14) * 22]); }
        c.fillStyle = JADE; c.fill(tf); c.strokeStyle = OL; c.lineWidth = 1.4; c.stroke(tf);
      }
      // coiled base
      const cb = new Path2D(); ell(cb, 0, 6, 42, 16);
      c.strokeStyle = OL; c.lineWidth = 3; c.stroke(cb); c.fillStyle = BODY; c.fill(cb);
      if (!white) { const ca = new Path2D(); for (let k = -3; k <= 3; k++) { ca.moveTo(k * 11, -6); ca.quadraticCurveTo(k * 11 + 3, 6, k * 11, 18); } c.strokeStyle = BELLY; c.lineWidth = 2; c.stroke(ca); }
      const rise = m === 'dive' && e.mt > .9 ? cl01(1 - (e.mt - .9) / 1.15) * 10 : 0;
      c.save(); c.translate(0, Math.sin(e.ph * 2) * 3 - rise);
      // feathered wings
      const flare = m === 'ring' || m === 'siphon' || m === 'summon' || (m === 'dive' && e.mt > .9) ? 1 : e.rage ? .55 : .25;
      const fy = Math.sin(now * (e.rage ? 3.4 : 2.4)) * 8, arm = new Path2D(), fr = new Path2D(), fj = new Path2D(), fa = new Path2D(), cv = new Path2D(), ca = new Path2D();
      const feather = (p, o, bx, by, a, L, w) => {
        const dx = Math.cos(a), dy = Math.sin(a), px = -dy * w, py = dx * w;
        const pp = [bx + px, by + py, bx + dx * L * .62 + px * 1.15, by + dy * L * .62 + py * 1.15, bx + dx * L, by + dy * L, bx + dx * L * .62 - px * 1.15, by + dy * L * .62 - py * 1.15, bx - px, by - py];
        poly(p, pp); poly(o, pp);
      };
      for (const sd of [1, -1]) {
        // the wing arm is a curve from shoulder to tip; primaries hang from it, coverts overlap its edge
        const r0x = -10 * sd, r0y = -50, w0x = -70 * sd, w0y = -112 - flare * 16 + fy, t0x = -118 * sd, t0y = -84 - flare * 22 + fy * 1.6;
        const Q = u => [(1 - u) * (1 - u) * r0x + 2 * (1 - u) * u * w0x + u * u * t0x, (1 - u) * (1 - u) * r0y + 2 * (1 - u) * u * w0y + u * u * t0y];
        arm.moveTo(r0x, r0y); arm.quadraticCurveTo(w0x, w0y, t0x, t0y);
        for (let j = 0; j < 9; j++) {
          const u = .1 + j / 8 * .9, [bx, by] = Q(u);
          feather(u > .55 ? fj : fr, fa, bx, by, PI / 2 + sd * (.15 + u * .8 + flare * .12), 28 + u * 44 + flare * 8, 5);
        }
        for (let j = 0; j < 6; j++) { const u = .12 + j / 5 * .8, [bx, by] = Q(u); feather(cv, ca, bx, by + 2, PI / 2 + sd * (.3 + u * .7), 15 + u * 5, 4.2); }
      }
      c.strokeStyle = OL; c.lineWidth = 2.6; c.stroke(fa);
      c.fillStyle = W(white, '#c42a40'); c.fill(fr); c.fillStyle = JADE; c.fill(fj);
      c.strokeStyle = OL; c.lineWidth = 13; c.stroke(arm); c.strokeStyle = BODY; c.lineWidth = 9.5; c.stroke(arm);
      c.strokeStyle = OL; c.lineWidth = 1.6; c.stroke(ca); c.fillStyle = W(white, '#ffc23a'); c.fill(cv);
      const f = face(c, e);
      const lean = m === 'wave' ? (e.mt > .75 ? -.18 : .22) : m === 'dive' && e.mt <= .9 ? .3 : 0;
      c.rotate(lean);
      // rearing neck
      const sp = [[0, 2], [-9, -20], [-4, -44], [8, -64], [19, -80]], nk = new Path2D(), NN = ribbon(nk, sp, 18, 11);
      c.strokeStyle = OL; c.lineWidth = 3; c.stroke(nk); c.fillStyle = BODY; c.fill(nk);
      if (!white) {
        const pl = new Path2D(), dr = new Path2D();
        for (let i = 0; i < sp.length; i++) {
          const [nx, ny, w] = NN[i], x = sp[i][0], y = sp[i][1];
          pl.moveTo(x + nx * w * .1, y + ny * w * .1); pl.lineTo(x + nx * w * .85, y + ny * w * .85);
          const ox = x - nx * w, oy = y - ny * w; poly(dr, [ox - ny * 5, oy + nx * 5, ox - nx * 12, oy - ny * 12, ox + ny * 5, oy - nx * 5]);
        }
        c.strokeStyle = BELLY; c.lineWidth = 3.2; c.stroke(pl); c.fillStyle = JADE; c.fill(dr); c.strokeStyle = OL; c.lineWidth = 1.2; c.stroke(dr);
      }
      // the plumed ruff behind the head
      const rx = 22, ry = -92, rl = 28 + (e.rage ? 7 : 0) + flare * 4, ruff = [new Path2D(), new Path2D(), new Path2D()], ro = new Path2D();
      for (let i = 0; i < 14; i++) {
        const a = i / 14 * TAU + Math.sin(now * 2 + i) * .05, L = rl * (i % 2 ? .82 : 1), dx = Math.cos(a), dy = Math.sin(a), px = -dy * 5.5, py = dx * 5.5;
        const pp = [rx + px, ry + py, rx + dx * L * .62 + px, ry + dy * L * .62 + py, rx + dx * L, ry + dy * L, rx + dx * L * .62 - px, ry + dy * L * .62 - py, rx - px, ry - py];
        poly(ruff[i % 3], pp); poly(ro, pp);
      }
      c.strokeStyle = OL; c.lineWidth = 2.4; c.stroke(ro);
      for (let i = 0; i < 3; i++) { c.fillStyle = W(white, RUFF[i]); c.fill(ruff[i]); }
      // head (profile), jaw open while casting
      const ja = m === 'wave' ? (e.mt < .75 ? .55 : .15) : m === 'ring' || m === 'siphon' || m === 'summon' ? .45 : m === 'dive' && e.mt <= .9 ? .5 : .08 + .05 * Math.sin(now * 3);
      const hx = 18, hy = -86, cj = Math.cos(ja), sj = Math.sin(ja), J = (u, v) => [hx + u * cj - v * sj, hy + u * sj + v * cj];
      const jw = new Path2D(), jp = [[0, 0], [31, 1], [33, 5], [27, 8], [3, 7]].map(q => J(q[0], q[1]));
      jw.moveTo(jp[0][0], jp[0][1]); for (let i = 1; i < jp.length; i++) jw.lineTo(jp[i][0], jp[i][1]); jw.closePath();
      if (!white && ja > .2) { const mo = new Path2D(); poly(mo, [hx, hy, 50, -86, jp[2][0], jp[2][1], jp[1][0], jp[1][1]]); c.fillStyle = '#4a0612'; c.fill(mo); Z.glow('255,60,80', 22, 40, -82, .7); }
      c.strokeStyle = OL; c.lineWidth = 2; c.stroke(jw); c.fillStyle = W(white, '#a81a32'); c.fill(jw);
      const hd = new Path2D(); poly(hd, [10, -97, 22, -105, 40, -102, 52, -94, 55, -88, 50, -85, 18, -85, 9, -90]);
      c.strokeStyle = OL; c.lineWidth = 2.4; c.stroke(hd); c.fillStyle = W(white, '#c62a42'); c.fill(hd);
      const cr = new Path2D(); for (const o of [0, 1, 2]) { const bx = 14 + o * 6, by = -101 - o; poly(cr, [bx, by, bx - 18 - o * 3, by - 8 - o * 4, bx - 6, by + 3]); }
      c.strokeStyle = OL; c.lineWidth = 1.3; c.stroke(cr); c.fillStyle = JADE; c.fill(cr);
      if (!white) {
        const fg = new Path2D(); poly(fg, [46, -85.5, 47.6, -79, 49.4, -85.5]); poly(fg, [39, -85.5, 40.4, -80.5, 41.8, -85.5]);
        const lj = J(28, 1), lj2 = J(21, 1); poly(fg, [lj[0], lj[1], lj[0] + .8, lj[1] - 5, lj[0] + 1.8, lj[1]]); poly(fg, [lj2[0], lj2[1], lj2[0] + .8, lj2[1] - 4, lj2[0] + 1.8, lj2[1]]);
        c.fillStyle = '#fff6e0'; c.fill(fg);
        const br = new Path2D(); br.moveTo(26, -101); br.quadraticCurveTo(34, -104, 44, -98); c.strokeStyle = '#5a0816'; c.lineWidth = 3; c.stroke(br);
        const ey = new Path2D(); ell(ey, 36, -96, 4.4, 3.2); c.fillStyle = e.rage ? '#ffffff' : '#ffe23a'; c.fill(ey);
        c.fillStyle = '#2a0408'; c.fillRect(35.4, -98.8, 1.4, 5.6); c.fillRect(50, -92, 2.2, 1.6);
        Z.glow(e.rage ? '255,255,220' : '255,220,80', 13 + (ja > .3 ? 6 : 0), 36, -96, .9);
        const sc = new Path2D(); for (let k = 0; k < 4; k++) { circ(sc, 18 + k * 7, -95 + (k & 1) * 3, 1.3); circ(sc, -4 + k * 4, -40 - k * 8, 1.5); }
        c.fillStyle = '#ffd25a'; c.fill(sc);
        if (ja > .3) { const tg = new Path2D(), ex = 58 + Math.sin(now * 20) * 3; tg.moveTo(32, -83); tg.lineTo(ex, -82); tg.lineTo(ex + 6, -86); tg.moveTo(ex, -82); tg.lineTo(ex + 6, -78); c.strokeStyle = '#ff6a96'; c.lineWidth = 1.8; c.stroke(tg); }
      }
      void f;
      c.restore();
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y - 40, '#ff3048', 40, 220); Z.burst(e.x, e.y - 40, '#2fd394', 26, 180); Z.burst(e.x, e.y - 40, '#ffc23a', 18, 160); Z.shake(14); },
  };

  /* ================= Events ================= */
  const spot = (Z, d) => { const a = Math.random() * TAU; return { x: Z.P.x + Math.cos(a) * d, y: Z.P.y + Math.sin(a) * d, a }; };
  const band = (Z, kind, n, d) => {
    const p = spot(Z, d), px = -Math.sin(p.a), py = Math.cos(p.a);
    for (let i = 0; i < n; i++) Z.spawn(kind, p.x + px * (i - (n - 1) / 2) * 34, p.y + py * (i - (n - 1) / 2) * 34);
  };
  const around = (Z, kind, n, d) => { const a0 = Math.random() * TAU; for (let i = 0; i < n; i++) { const a = a0 + i / n * TAU; Z.spawn(kind, Z.P.x + Math.cos(a) * d, Z.P.y + Math.sin(a) * d); } };
  const events = [
    { t: 7, run(Z) { Z.banner('The Zanjari chant echoes through the halls…', '#7affc0', false); Z.sfx('warn'); band(Z, 'troll', 8, 420); } },
    { t: 22, run(Z) { Z.banner('The priests begin the ritual!', '#ff6a7a', false); Z.sfx('warn'); around(Z, 'priest', 4, 370); band(Z, 'troll', 3, 420); } },
    { t: 34, run(Z) {
      Z.banner('Blood seeps from the altars…', '#ff4a5a', true); Z.sfx('boss');
      const gap = fl(Math.random() * 12);
      for (let i = 0; i < 12; i++) {
        if (i === gap || i === (gap + 1) % 12) continue;
        const a = i / 12 * TAU; Z.hazard(Z.P.x + Math.cos(a) * 150, Z.P.y + Math.sin(a) * 150, { r: 46, t: 1.2, dmg: 13, col: '210,20,50' });
      }
      Z.hazard(Z.P.x, Z.P.y, { r: 72, t: 1.9, dmg: 15, col: '210,20,50' });
      around(Z, 'ooze', 3, 420);
    } },
    { t: 62, run(Z) { Z.banner('Serpents descend from the canopy!', '#5aff9a', false); Z.sfx('warn'); around(Z, 'serp', 6, 440); } },
    { t: 86, run(Z) {
      Z.banner('The sunken idol awakens…', '#ffcf5a', true); Z.sfx('boss'); Z.shake(5);
      const g = Math.random() * TAU, cx = Z.P.x, cy = Z.P.y;
      [[100, 8, .9], [190, 14, 1.35], [280, 20, 1.8]].forEach(([r, n, t]) => {
        for (let i = 0; i < n; i++) {
          const a = i / n * TAU, da = Math.abs(Math.atan2(Math.sin(a - g), Math.cos(a - g)));
          if (da < .42) continue;
          Z.hazard(cx + Math.cos(a) * r, cy + Math.sin(a) * r, { r: 34, t, dmg: 13, col: '255,190,60' });
        }
      });
      around(Z, 'ooze', 3, 430);
    } },
    { t: 110, run(Z) { Z.banner('The chant rises to a frenzy!', '#ff6a7a', false); Z.sfx('warn'); band(Z, 'troll', 6, 420); around(Z, 'priest', 2, 380); } },
    { t: 132, run(Z) { Z.banner('Dawn\'s light pierces the canopy. Endure!', '#ffe9a0', false); Z.sfx('warn'); around(Z, 'ooze', 3, 420); around(Z, 'serp', 3, 440); } },
  ];

  /* ================= Music: an original jungle-temple ritual in D phrygian, 94 bpm in sixteenths =================
     A didgeridoo-like drone, deep toms and hand drums with a shaker, low chant pads, and an ocarina melody that
     answers itself with low vowel chants. The guardian fight turns phrygian-dominant: war drums, dissonant brass
     stabs (root, minor second, fifth) and a frantic chant. */
  const PHR = [0, 1, 3, 5, 7, 8, 10], PDM = [0, 1, 4, 5, 7, 8, 10];
  const dg = (S, base, i) => base + S[((i % 7) + 7) % 7] + 12 * Math.floor(i / 7);
  const CH = [0, 1, 0, 6, 0, 1, 5, 4, 0, 1, 0, 6, 3, 1, 0, 0];
  const MEL = [
    [[0, 4, 6], [6, 3, 2], [8, 4, 4], [12, 5, 4]], [[0, 4, 8], [8, 1, 4], [12, 0, 4]], [], [[8, 7, 2], [10, 6, 2], [12, 5, 4]],
    [[0, 4, 4], [4, 5, 2], [6, 4, 2], [8, 3, 4], [12, 1, 4]], [[0, 2, 6], [6, 1, 2], [8, 0, 8]], [], [[12, -1, 2], [14, 0, 2]],
    [[0, 7, 6], [6, 8, 2], [8, 7, 4], [12, 6, 4]], [[0, 5, 4], [4, 6, 4], [8, 4, 8]], [[0, 3, 2], [2, 4, 2], [4, 5, 4], [8, 4, 4], [12, 1, 4]], [[0, 0, 12]],
    [[0, 4, 6], [6, 1, 2], [8, 2, 4], [12, 1, 4]], [[0, 0, 4], [4, -1, 4], [8, 0, 8]], [], [[8, 4, 2], [10, 5, 2], [12, 4, 4]],
  ];
  const CHANT = [[0, 0, 3], [4, 0, 3], [8, 1, 2], [10, 0, 6]];
  const LOW = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0], MID = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1], HAND = [0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0];
  const WAR = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0], FRANTIC = [0, 0, 1, 0, 2, 1, 0, -1];
  const music = {
    bpm: 94, div: 4,
    step(s, t, A) {
      const sp = 60 / 94 / 4, bar = fl(s / 16), b = s % 16, sec = bar % 16, pass = fl(bar / 16) % 2, boss = A.boss, S = boss ? PDM : PHR;
      const root = dg(S, 38, CH[sec]), row = MEL[sec], inten = A.inten || 0;
      if (!boss) {
        // didgeridoo: a low drone whose filter breathes open, with overtone toots
        if (b === 0) A.tone(t, 38, sp * 15.5, .045, { type: 'sawtooth', cutoff: 260, sweep: 480, vib: .12 });
        if (b === 8) A.tone(t, 38, sp * 7.5, .026, { type: 'sawtooth', cutoff: 520, sweep: 220 });
        if (b === 6 || b === 14) A.tone(t, 50, sp * 1.2, .013, { type: 'square', cutoff: 700, sweep: 300 });
        if (b === 0 || b === 10) A.tone(t, root, sp * (b ? 5 : 8), .055, { type: 'triangle', decay: true });
        if (LOW[b]) A.tom(t, 62, .42);
        if (MID[b]) A.tom(t, 104, .26);
        if (HAND[b]) A.tom(t, 205 + (b & 1) * 35, .08 + inten * .03);
        A.noise(t, .035, (b & 1 ? .005 : .011) + inten * .004, { type: 'highpass', f: 6500 });
        if (sec % 4 === 3 && b >= 12) A.tom(t, 150 - (b - 12) * 18, .16);
        if (b === 0 && bar % 2 === 0) A.pad([root + 12, root + 19], t, sp * 31, .013, { type: 'sawtooth', cutoff: 620, q: 6, detune: 12 });
        if (row.length) {
          for (const nn of row) if (nn[0] === b) {
            const mm = dg(S, 62, nn[1]), dur = sp * nn[2] * .95;
            A.tone(t, mm, dur, pass ? .042 : .05, { type: pass ? 'triangle' : 'sine', vib: .35, attack: .04 });
            A.tone(t, mm + 12, dur, .007, { type: 'sine', attack: .06 });
            if (pass) A.tone(t + sp * 3, mm, dur * .8, .013, { type: 'sine', attack: .05 });
          }
        } else for (const nn of CHANT) if (nn[0] === b) A.tone(t, dg(S, 50, nn[1]), sp * nn[2] * .95, .03, { type: 'square', cutoff: 480, sweep: 950, q: 4, attack: .06 });
        if (sec === 0 && b === 0) A.bell(74, t, .035);
        if (sec === 8 && b === 0) A.bell(69, t, .03);
      } else {
        if (b === 0) A.tone(t, 38, sp * 15.5, .05, { type: 'sawtooth', cutoff: 340, sweep: 700, vib: .2 });
        if (b % 4 === 0) A.kick(t, .62);
        if (WAR[b]) A.tom(t, 58, .46);
        if (b === 4 || b === 12) A.snare(t, .26);
        if (b & 1) A.tom(t, 190 + (b % 4 === 1 ? 0 : 40), .1);
        if (bar % 2 === 1 && b >= 12) A.tom(t, 130 - (b - 12) * 14, .22);
        A.noise(t, .03, b & 1 ? .006 : .013, { type: 'highpass', f: 7000 });
        if (b % 2 === 0) A.tone(t, root + (b % 8 === 6 ? 12 : 0), sp * 1.7, .06, { type: 'sawtooth', cutoff: 460 });
        if (b === 0 || b === 6 || (b === 10 && bar % 2)) for (const iv of [12, 13, 19]) A.tone(t, root + iv, sp * 1.6, .026, { type: 'sawtooth', cutoff: 1400, sweep: 500, attack: .01 });
        if (b % 2 === 0) A.tone(t, dg(S, 50, FRANTIC[b / 2]), sp * 1.7, .018, { type: 'square', cutoff: 600, sweep: 1300, q: 5 });
        if (row.length) {
          for (const nn of row) if (nn[0] === b) {
            const mm = dg(S, 62, nn[1]), dur = sp * nn[2] * .9;
            A.tone(t, mm, dur, .04, { type: 'sawtooth', cutoff: 2300, vib: .25, attack: .015 });
            A.tone(t, mm - 12, dur, .02, { type: 'square', cutoff: 1100, attack: .015 });
          }
        } else if (b === 0) A.tone(t, dg(S, 74, 0), sp * 7, .03, { type: 'triangle', vib: .6, attack: .08, glide: dg(S, 74, 1) });
      }
    },
  };

  return {
    id: 'temple', name: 'Temple of the Blood Serpent', nod: 'World of Warcraft', portal: '200,40,60', bg: GROUT, dark: .55, dim: .16,
    ground, under, ambient,
    mix: { troll: 5, priest: 1.4, ooze: 1.6, serp: 1.3 },
    target: 1,
    foes: { troll, priest, ooze, serp },
    boss, events, music,
  };
})());
