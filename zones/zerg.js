// Zone zerg: a living hive world. Purple creep carpets the ash, spawning pools of amber and acid ooze bubble beside a
// ribbed hatchery, spine and spore crawlers stand guard, and mineral crystals and gas vents ring the creep edge.
// A nod to StarCraft II (the Swarm).
ZONES.push((() => {
  const TAU = Math.PI * 2, PI = Math.PI, fl = Math.floor;
  const W = (w, c) => (w ? '#fff' : c);
  const circ = (p, x, y, r) => { if (!(r > 0)) return; p.moveTo(x + r, y); p.arc(x, y, r, 0, TAU); };
  const ell = (p, x, y, rx, ry) => { if (!(rx > 0) || !(ry > 0)) return; p.moveTo(x + rx, y); p.ellipse(x, y, rx, ry, 0, 0, TAU); };
  const rell = (p, x, y, rx, ry, a) => { if (!(rx > 0) || !(ry > 0)) return; p.moveTo(x + Math.cos(a) * rx, y + Math.sin(a) * rx); p.ellipse(x, y, rx, ry, a, 0, TAU); };
  const poly = (p, a) => { p.moveTo(a[0], a[1]); for (let i = 2; i < a.length; i += 2) p.lineTo(a[i], a[i + 1]); p.closePath(); };
  const cl01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
  const face = (c, e) => { const f = Math.cos(e.ang) < 0 ? -1 : 1; c.scale(f, 1); return f; };
  // a curved scythe blade from (sx,sy) along angle a, length L, belly width w, bulging to side bs (+1/-1)
  const blade = (p, sx, sy, a, L, w, bs) => {
    const ca = Math.cos(a), sa = Math.sin(a), nx = -sa * bs, ny = ca * bs, tx = sx + ca * L, ty = sy + sa * L;
    p.moveTo(sx + nx * w * .5, sy + ny * w * .5);
    p.quadraticCurveTo(sx + ca * L * .5 + nx * w * 1.7, sy + sa * L * .5 + ny * w * 1.7, tx, ty);
    p.quadraticCurveTo(sx + ca * L * .45 + nx * w * .3, sy + sa * L * .45 + ny * w * .3, sx - nx * w * .5, sy - ny * w * .5);
    p.closePath();
  };
  const ACID = '140,255,60', SPK = '220,80,230', CLV = '255,90,200';
  const K = 1 / 1.3; // enemies are drawn at 1.3x: telegraphs drawn inside draw() are divided back to world size

  /* ================= Map: one hive cluster per 1600px macro cell =================
     Each cell grows a creep blob around a hatchery, plus three creep tumours that spread their own lobes and are wired
     to the hive by fat veins. On the creep: two spawning pools, spine and spore crawlers, egg clutches, biomass sacs and
     larvae. At the creep edge a mineral field and a gas geyser; out on the bare ash, the bones of some vast beast. */
  const M = 1600, NA = 96, ASH = '#4b3f37', CREEP = '#3e2234';
  const CO = new Float32Array(NA + 1), SI = new Float32Array(NA + 1);
  for (let i = 0; i <= NA; i++) { CO[i] = Math.cos(i / NA * TAU); SI[i] = Math.sin(i / NA * TAU); }
  const HATCH = 1, SPINE = 2, SPORE = 3, TUMOR = 4, MINERAL = 5, GEYSER = 6, BONES = 7, ROCK = 8, SAC = 9;
  const EXT = { 1: 200, 2: 110, 3: 90, 4: 40, 5: 150, 6: 80, 7: 230, 8: 40, 9: 40 };
  const mkBlob = (x, y, R, h, amp) => {
    const rr = new Float32Array(NA + 1), p1 = h(1) * TAU, p2 = h(2) * TAU, p3 = h(3) * TAU;
    for (let i = 0; i < NA; i++) { const t = i / NA * TAU; rr[i] = R * (1 + amp * (.1 * Math.sin(3 * t + p1) + .06 * Math.sin(5 * t + p2) + .035 * Math.sin(11 * t + p3))); }
    rr[NA] = rr[0];
    return { x, y, R, rr };
  };
  const rAt = (b, th) => { const u = ((((th / TAU) % 1) + 1) % 1) * NA, i = Math.min(NA - 1, fl(u)), f = u - i; return b.rr[i] * (1 - f) + b.rr[i + 1] * f; };
  const bD = (b, x, y) => Math.hypot(x - b.x, y - b.y) - rAt(b, Math.atan2(y - b.y, x - b.x));
  const creepD = (cl, x, y) => { let d = 1e9; for (const b of cl.blobs) d = Math.min(d, bD(b, x, y)); return d; };
  const blobTo = (p, b, off) => {
    for (let i = 0; i < NA; i++) { const r = Math.max(4, b.rr[i] + off), x = b.x + CO[i] * r, y = b.y + SI[i] * r; if (i) p.lineTo(x, y); else p.moveTo(x, y); }
    p.closePath();
  };
  const wiggle = (x0, y0, x1, y1, n, amp, ph) => {
    const pts = new Float32Array((n + 1) * 2), dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    for (let i = 0; i <= n; i++) { const t = i / n, w = Math.sin(t * PI) * (Math.sin(t * 7 + ph) * amp + Math.sin(t * 13 + ph * 2) * amp * .35); pts[i * 2] = x0 + dx * t + nx * w; pts[i * 2 + 1] = y0 + dy * t + ny * w; }
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (let i = 0; i <= n; i++) { bx0 = Math.min(bx0, pts[i * 2]); bx1 = Math.max(bx1, pts[i * 2]); by0 = Math.min(by0, pts[i * 2 + 1]); by1 = Math.max(by1, pts[i * 2 + 1]); }
    return { pts, n, ph, bb: [bx0 - 20, by0 - 20, bx1 + 20, by1 + 20] };
  };
  const cache = new Map();
  const cellOf = (Z, cx, cy) => {
    const key = cx + ',' + cy;
    let cl = cache.get(key);
    if (cl) return cl;
    if (cache.size > 40) cache.clear();
    const h = i => Z.hash(cx * 41 + i * 13 + 7, cy * 29 - i * 5 + 3);
    const hx = cx * M + 800 + (h(1) - .5) * 260, hy = cy * M + 800 + (h(2) - .5) * 260;
    const main = mkBlob(hx, hy, 540 + h(3) * 90, j => h(200 + j), 1);
    cl = { blobs: [main], main, hive: { x: hx, y: hy }, f: [], veins: [], pools: [], eggs: [], larva: [], geys: [], puddles: [], tumours: [], spores: [], cracks: [] };
    const occ = [];
    const free = (x, y, r) => { for (const o of occ) if (Math.hypot(o[0] - x, o[1] - y) < o[2] + r) return false; return true; };
    const add = (k, x, y, r, extra) => { const o = Object.assign({ k, x, y, v: Z.hash(fl(x) * 3 + 1, fl(y) * 5 - 2) }, extra || {}); cl.f.push(o); if (r) occ.push([x, y, r]); return o; };
    add(HATCH, hx, hy, 175);
    // creep tumours, each spreading a lobe of creep and wired to the hive by a vein
    for (let k = 0; k < 3; k++) {
      const a = h(4) * TAU + k * TAU / 3 + (h(5 + k) - .5) * .8, d = main.R * (.8 + h(8 + k) * .26), tx = hx + Math.cos(a) * d, ty = hy + Math.sin(a) * d;
      cl.blobs.push(mkBlob(tx, ty, 170 + h(11 + k) * 80, j => h(220 + j + k * 5), 1.4));
      cl.tumours.push({ x: tx, y: ty, p: h(14 + k) * TAU });
      add(TUMOR, tx, ty, 46);
      cl.veins.push(wiggle(hx + Math.cos(a) * 105, hy + Math.sin(a) * 40, tx, ty, 14, 26 + h(17 + k) * 22, h(20 + k) * 9));
      for (let j = 0; j < 2; j++) {
        const b = a + (h(23 + k * 2 + j) - .5) * 2.4, L = 110 + h(30 + k * 2 + j) * 110;
        cl.veins.push(wiggle(tx, ty, tx + Math.cos(b) * L, ty + Math.sin(b) * L, 8, 12, h(36 + j + k) * 9));
      }
    }
    for (let j = 0; j < 3; j++) {
      const a = h(40 + j) * TAU, L = 260 + h(43 + j) * 140;
      cl.veins.push(wiggle(hx + Math.cos(a) * 110, hy + Math.sin(a) * 42, hx + Math.cos(a) * L, hy + Math.sin(a) * L, 10, 18, h(46 + j) * 9));
    }
    // spawning pools
    for (let k = 0; k < 2; k++) {
      const a = h(50 + k) * TAU, d = 270 + h(52 + k) * 170, x = hx + Math.cos(a) * d, y = hy + Math.sin(a) * d, r = 54 + h(54 + k) * 28;
      if (!free(x, y, r + 44)) continue;
      const rr = new Float32Array(49), p1 = h(56 + k) * TAU;
      for (let i = 0; i < 48; i++) rr[i] = r * (1 + .1 * Math.sin(3 * i / 48 * TAU + p1) + .05 * Math.sin(5 * i / 48 * TAU + p1 * 2));
      rr[48] = rr[0];
      cl.pools.push({ x, y, r, rr, p: p1, acid: h(58 + k) < .4 });
      occ.push([x, y, r + 44]);
    }
    // crawlers
    for (let k = 0; k < 4; k++) {
      const a = h(60 + k) * TAU, d = 190 + h(64 + k) * 300, x = hx + Math.cos(a) * d, y = hy + Math.sin(a) * d;
      if (creepD(cl, x, y) < -30 && free(x, y, 40)) add(SPINE, x, y, 40, { s: .85 + h(68 + k) * .35, ph: h(72 + k) * TAU, m: h(76 + k) < .5 ? -1 : 1 });
    }
    for (let k = 0; k < 2; k++) {
      const a = h(80 + k) * TAU, d = 220 + h(82 + k) * 280, x = hx + Math.cos(a) * d, y = hy + Math.sin(a) * d;
      if (creepD(cl, x, y) < -30 && free(x, y, 42)) { add(SPORE, x, y, 42, { s: .9 + h(84 + k) * .3 }); cl.spores.push([x, y]); }
    }
    // egg clutches and biomass sacs
    for (let k = 0; k < 3; k++) {
      const a = h(90 + k) * TAU, d = 170 + h(93 + k) * 250, x = hx + Math.cos(a) * d, y = hy + Math.sin(a) * d;
      if (!free(x, y, 44)) continue;
      occ.push([x, y, 44]);
      const n = 5 + fl(h(96 + k) * 3);
      for (let j = 0; j < n; j++) {
        const b = j / n * TAU + h(100 + j + k * 9) * .6, q = j ? 14 + h(120 + j + k * 9) * 12 : 0;
        cl.eggs.push({ x: x + Math.cos(b) * q, y: y + Math.sin(b) * q * .7, s: 1 + h(140 + j + k * 9) * .4, p: h(160 + j + k * 9) * TAU });
      }
    }
    cl.eggs.sort((p, q) => p.y - q.y);
    for (let k = 0; k < 5; k++) {
      const a = h(170 + k) * TAU, d = 130 + h(175 + k) * 400, x = hx + Math.cos(a) * d, y = hy + Math.sin(a) * d, r = 12 + h(180 + k) * 12;
      if (creepD(cl, x, y) < -20 && free(x, y, r + 10)) add(SAC, x, y, r + 10, { r, p: h(185 + k) * TAU });
    }
    for (let k = 0; k < 6; k++) { const a = h(190 + k) * TAU, d = 140 + h(196 + k) * 60; cl.larva.push({ x: hx + Math.cos(a) * d, y: hy + Math.sin(a) * d * .7 + 20, p: h(240 + k) * TAU, dir: h(250 + k) < .5 ? -1 : 1 }); }
    // mineral field and gas geyser just past the creep edge
    const am = h(260) * TAU, md = rAt(main, am) + 50, mx = hx + Math.cos(am) * md, my = hy + Math.sin(am) * md;
    const cr = [];
    for (let j = 0; j < 9; j++) {
      const ang = am + (j - 4) * 24 / md, dd = md + h(270 + j) * 36 + (j % 3) * 18;
      cr.push({ x: hx + Math.cos(ang) * dd, y: hy + Math.sin(ang) * dd, hgt: 26 + h(280 + j) * 34, w: 8 + h(290 + j) * 6, lean: (h(300 + j) - .5) * .5, n: 2 + fl(h(310 + j) * 2) });
    }
    cr.sort((p, q) => p.y - q.y);
    add(MINERAL, mx, my, 120, { cr });
    const ag = am + (h(261) < .5 ? -1 : 1) * (.45 + h(262) * .2), gd = rAt(main, ag) + 80, gx = hx + Math.cos(ag) * gd, gy = hy + Math.sin(ag) * gd;
    if (free(gx, gy, 60)) { add(GEYSER, gx, gy, 66); cl.geys.push({ x: gx, y: gy, p: h(263) * TAU }); }
    // the bones of a giant beast, out on the open ash
    const cand = [[cx * M + 60, cy * M + 60], [cx * M + 800, cy * M + 40], [cx * M + 40, cy * M + 800], [cx * M + 1500, cy * M + 1500]];
    for (let j = 0; j < 4; j++) {
      const [x, y] = cand[(j + fl(h(320) * 4)) % 4], bx = x + (h(321 + j) - .5) * 160, by = y + (h(325 + j) - .5) * 160;
      if (creepD(cl, bx, by) > 120 && free(bx, by, 170)) { add(BONES, bx, by, 170, { m: h(330) < .5 ? -1 : 1 }); break; }
    }
    // rocks on the ash, acid puddles everywhere
    for (let k = 0; k < 12; k++) {
      const x = cx * M + h(340 + k) * M, y = cy * M + h(360 + k) * M;
      if (creepD(cl, x, y) > 24 && free(x, y, 36)) add(ROCK, x, y, 36, { s: 9 + h(380 + k) * 14 });
    }
    for (let k = 0; k < 7; k++) {
      const x = cx * M + h(400 + k) * M, y = cy * M + h(420 + k) * M;
      if (free(x, y, 30)) cl.puddles.push({ x, y, r: 12 + h(440 + k) * 20, p: h(460 + k) * TAU });
    }
    cl.f.sort((p, q) => p.y - q.y);
    cache.set(key, cl);
    return cl;
  };
  const cellsNear = (Z, x0, y0, x1, y1) => {
    const out = [];
    for (let cy = fl((y0 - 1000) / M); cy <= fl((y1 + 1000) / M); cy++) for (let cx = fl((x0 - 1000) / M); cx <= fl((x1 + 1000) / M); cx++) out.push(cellOf(Z, cx, cy));
    return out;
  };

  /* ================= Floor art (cached) ================= */
  const poolPath = (pl, off) => {
    const p = new Path2D();
    for (let i = 0; i < 48; i++) { const r = Math.max(4, pl.rr[i] + off), a = i / 48 * TAU, x = pl.x + Math.cos(a) * r, y = pl.y + Math.sin(a) * r * .72; if (i) p.lineTo(x, y); else p.moveTo(x, y); }
    p.closePath(); return p;
  };
  const drawPool = (c, Z, pl) => {
    const o = pl.acid;
    c.fillStyle = 'rgba(24,6,18,.45)'; c.fill(poolPath(pl, 30));
    c.fillStyle = '#6e3446'; c.fill(poolPath(pl, 22));
    // lumpy fleshy rim
    const lm = new Path2D(), lh = new Path2D(), th = new Path2D();
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * TAU + pl.p, r = pl.r + 12 + (i % 3) * 2, x = pl.x + Math.cos(a) * r, y = pl.y + Math.sin(a) * r * .72, s = 8 + Z.hash(i, fl(pl.x)) * 5;
      ell(lm, x, y, s, s * .7); ell(lh, x - s * .25, y - s * .3, s * .45, s * .28);
      if (i % 4 === 1) poly(th, [x - 3, y, x + 3, y, x + Math.cos(a) * 3, y - 10]);
    }
    c.fillStyle = '#8a4458'; c.fill(lm); c.strokeStyle = '#3a1222'; c.lineWidth = 1.2; c.stroke(lm);
    c.fillStyle = '#b06a78'; c.fill(lh);
    c.fillStyle = '#e2d0b4'; c.fill(th); c.strokeStyle = '#4a2028'; c.lineWidth = 1; c.stroke(th);
    c.fillStyle = '#2a0a16'; c.fill(poolPath(pl, 5));
    const g = c.createRadialGradient(pl.x - pl.r * .2, pl.y - pl.r * .2, 4, pl.x, pl.y, pl.r * 1.05);
    if (o) { g.addColorStop(0, '#b8e45a'); g.addColorStop(.6, '#7ab832'); g.addColorStop(1, '#3e6a1e'); }
    else { g.addColorStop(0, '#f2b24a'); g.addColorStop(.6, '#d0782a'); g.addColorStop(1, '#7a3a18'); }
    c.fillStyle = g; c.fill(poolPath(pl, 0));
    const sk = new Path2D();
    for (let i = 0; i < 4; i++) { const a = pl.p + i * 1.7, r = pl.r * (.3 + i * .14); sk.moveTo(pl.x + Math.cos(a) * r, pl.y + Math.sin(a) * r * .72); sk.quadraticCurveTo(pl.x + Math.cos(a + .5) * r * 1.1, pl.y + Math.sin(a + .5) * r * .8, pl.x + Math.cos(a + 1) * r, pl.y + Math.sin(a + 1) * r * .72); }
    c.lineCap = 'round';
    c.strokeStyle = o ? 'rgba(230,255,170,.45)' : 'rgba(255,230,160,.45)'; c.lineWidth = 2.2; c.stroke(sk);
    c.strokeStyle = o ? 'rgba(40,70,20,.7)' : 'rgba(90,30,10,.7)'; c.lineWidth = 2; c.stroke(poolPath(pl, 1));
    c.lineCap = 'butt';
  };
  const drawVeins = (c, veins, vis) => {
    const p = new Path2D();
    for (const v of veins) {
      if (!vis(v.bb)) continue;
      p.moveTo(v.pts[0], v.pts[1]);
      for (let i = 1; i <= v.n; i++) p.lineTo(v.pts[i * 2], v.pts[i * 2 + 1]);
    }
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = '#2a0c22'; c.lineWidth = 9; c.stroke(p);
    c.strokeStyle = '#542446'; c.lineWidth = 5; c.stroke(p);
    c.strokeStyle = 'rgba(200,110,180,.45)'; c.lineWidth = 1.4; c.stroke(p);
    c.lineCap = 'butt'; c.lineJoin = 'miter';
  };
  const drawHatch = (c, f) => {
    const x = f.x, y = f.y;
    const sh = new Path2D(); ell(sh, x + 14, y + 10, 165, 46); c.fillStyle = 'rgba(16,4,12,.4)'; c.fill(sh);
    // root tendrils
    const rt = new Path2D();
    for (let i = 0; i < 11; i++) { const a = i / 11 * TAU + f.v, ca = Math.cos(a), sa = Math.sin(a); rt.moveTo(x + ca * 100, y + sa * 30); rt.quadraticCurveTo(x + ca * 150 + sa * 20, y + sa * 52, x + ca * (180 + (i % 3) * 20), y + sa * 64); }
    c.lineCap = 'round'; c.strokeStyle = '#2e0e24'; c.lineWidth = 8; c.stroke(rt); c.strokeStyle = '#6a2c56'; c.lineWidth = 3.5; c.stroke(rt); c.lineCap = 'butt';
    // fleshy skirt lobes
    const lb = new Path2D(), lbh = new Path2D();
    for (let i = 0; i < 9; i++) { const a = PI * .05 + i / 8 * PI * .9, lx = x - Math.cos(a) * 118, ly = y + Math.sin(a) * 18 - 4; ell(lb, lx, ly, 34, 24); ell(lbh, lx - 6, ly - 8, 14, 7); }
    c.fillStyle = '#5c2848'; c.fill(lb); c.strokeStyle = '#2a0c20'; c.lineWidth = 1.5; c.stroke(lb); c.fillStyle = '#7e3e66'; c.fill(lbh);
    // dome
    const dm = new Path2D(); dm.moveTo(x - 124, y); dm.quadraticCurveTo(x - 132, y - 92, x - 46, y - 124); dm.quadraticCurveTo(x, y - 142, x + 46, y - 124);
    dm.quadraticCurveTo(x + 132, y - 92, x + 124, y); dm.quadraticCurveTo(x, y + 26, x - 124, y); dm.closePath();
    const g = c.createLinearGradient(x - 60, y - 140, x + 40, y + 10); g.addColorStop(0, '#8e4c6c'); g.addColorStop(.55, '#663052'); g.addColorStop(1, '#3e1832');
    c.fillStyle = g; c.fill(dm);
    // ribbed carapace plates
    const pl = new Path2D(), rb = new Path2D(), rh = new Path2D();
    for (let k = 0; k < 4; k++) {
      const yy = y - 104 + k * 26, w = 70 + k * 16;
      pl.moveTo(x - w, yy + 14); pl.quadraticCurveTo(x, yy - 18, x + w, yy + 14); pl.quadraticCurveTo(x, yy + 2, x - w, yy + 14); pl.closePath();
    }
    for (let i = -5; i <= 5; i++) { rb.moveTo(x + i * 7, y - 130 + Math.abs(i) * 2.5); rb.quadraticCurveTo(x + i * 22, y - 80, x + i * 23, y - 4); rh.moveTo(x + i * 7 - 2, y - 128 + Math.abs(i) * 2.5); rh.quadraticCurveTo(x + i * 22 - 3, y - 80, x + i * 23 - 3, y - 8); }
    c.fillStyle = '#a0705a'; c.fill(pl); c.strokeStyle = '#3a1428'; c.lineWidth = 1.4; c.stroke(pl);
    c.strokeStyle = '#2e0e22'; c.lineWidth = 3; c.stroke(rb); c.strokeStyle = 'rgba(214,160,170,.5)'; c.lineWidth = 1.2; c.stroke(rh);
    c.strokeStyle = '#2a0a1e'; c.lineWidth = 2; c.stroke(dm);
    // glowing maws
    const mo = new Path2D(), mi = new Path2D(), ml = new Path2D(), tt = new Path2D();
    for (const [ox, oy, rx, ry] of [[-66, -30, 20, 14], [66, -30, 20, 14], [0, -62, 26, 17]]) {
      ell(ml, x + ox, y + oy, rx + 6, ry + 5); ell(mo, x + ox, y + oy, rx, ry); ell(mi, x + ox, y + oy + 3, rx * .55, ry * .5);
      for (let j = 0; j < 6; j++) { const a = PI + j / 5 * PI, tx = x + ox + Math.cos(a) * rx, ty = y + oy + Math.sin(a) * ry; poly(tt, [tx - 2.5, ty, tx + 2.5, ty, tx - Math.cos(a) * 2, ty - Math.sin(a) * 6]); }
    }
    c.fillStyle = '#8a4a62'; c.fill(ml); c.strokeStyle = '#2a0a1e'; c.lineWidth = 1.4; c.stroke(ml);
    c.fillStyle = '#1a0610'; c.fill(mo); c.fillStyle = '#d8642a'; c.fill(mi);
    c.fillStyle = '#ead8bc'; c.fill(tt);
    // horn spikes on the crown
    const hs = new Path2D();
    for (let i = 0; i < 5; i++) { const a = -PI * .8 + i * PI * .15, bx = x + Math.cos(a) * 64, by = y - 96 + Math.sin(a) * 34; poly(hs, [bx - 7, by + 4, bx + 7, by + 4, bx + Math.cos(a) * 10, by - 26 + Math.abs(i - 2) * 5]); }
    c.fillStyle = '#d8c4a2'; c.fill(hs); c.strokeStyle = '#3a1a24'; c.lineWidth = 1.3; c.stroke(hs);
  };
  const drawSpine = (c, f) => {
    const s = f.s, x = f.x, y = f.y, H = 74 * s, N = 8, P = [];
    const sh = new Path2D(); ell(sh, x + 16 * s, y + 3, 30 * s, 9 * s); c.fillStyle = 'rgba(16,4,12,.38)'; c.fill(sh);
    const rt = new Path2D();
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + f.ph, ca = Math.cos(a), sa = Math.sin(a); rt.moveTo(x, y); rt.quadraticCurveTo(x + ca * 20 * s, y + sa * 6 - 4, x + ca * 34 * s, y + sa * 13 * s); }
    c.lineCap = 'round'; c.strokeStyle = '#2e0e24'; c.lineWidth = 6 * s; c.stroke(rt); c.strokeStyle = '#6e3058'; c.lineWidth = 2.6 * s; c.stroke(rt);
    for (let i = 0; i <= N; i++) { const t = i / N; P.push([x + Math.sin(t * PI * 1.3 + f.ph) * 9 * t * f.m, y - H * t, (12 - 8.5 * t) * s]); }
    const bd = new Path2D(); bd.moveTo(P[0][0] - P[0][2], P[0][1]);
    for (let i = 1; i <= N; i++) bd.lineTo(P[i][0] - P[i][2], P[i][1]);
    for (let i = N; i >= 0; i--) bd.lineTo(P[i][0] + P[i][2], P[i][1]);
    bd.closePath();
    c.fillStyle = '#6a2c52'; c.fill(bd);
    const rb = new Path2D(), sp = new Path2D();
    for (let i = 1; i < N; i++) { const [px, py, w] = P[i]; rb.moveTo(px - w, py); rb.quadraticCurveTo(px, py + 3 * s, px + w, py - 1); if (i % 2 === 0) poly(sp, [px + w - 1, py - 2, px + w - 1, py + 3, px + w + 6 * s, py - 4]); }
    c.strokeStyle = '#9a5a7e'; c.lineWidth = 1.4; c.stroke(rb);
    c.strokeStyle = '#2a0a1e'; c.lineWidth = 1.5; c.stroke(bd);
    // the big bony spike, curling forward
    const [tx, ty] = P[N], m = f.m;
    poly(sp, [tx - 4 * s, ty + 4, tx + 4 * s, ty + 4, tx + m * 14 * s, ty - 18 * s, tx + m * 24 * s, ty - 24 * s, tx + m * 8 * s, ty - 12 * s]);
    c.fillStyle = '#e6d4b4'; c.fill(sp); c.strokeStyle = '#3a1a24'; c.lineWidth = 1.2; c.stroke(sp);
    c.lineCap = 'butt';
  };
  const drawSpore = (c, f) => {
    const s = f.s, x = f.x, y = f.y;
    const sh = new Path2D(); ell(sh, x + 14 * s, y + 3, 30 * s, 9 * s); c.fillStyle = 'rgba(16,4,12,.38)'; c.fill(sh);
    const rt = new Path2D();
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + f.v * 6, ca = Math.cos(a), sa = Math.sin(a); rt.moveTo(x, y - 2); rt.quadraticCurveTo(x + ca * 18 * s, y + sa * 4, x + ca * 30 * s, y + sa * 11 * s); }
    c.lineCap = 'round'; c.strokeStyle = '#2e0e24'; c.lineWidth = 6 * s; c.stroke(rt); c.strokeStyle = '#6e3058'; c.lineWidth = 2.6 * s; c.stroke(rt); c.lineCap = 'butt';
    const st = new Path2D(); poly(st, [x - 9 * s, y, x + 9 * s, y, x + 6 * s, y - 30 * s, x - 6 * s, y - 30 * s]);
    c.fillStyle = '#5e2648'; c.fill(st); c.strokeStyle = '#2a0a1e'; c.lineWidth = 1.4; c.stroke(st);
    const bx = x, by = y - 50 * s, R = 24 * s;
    const bl = new Path2D(); ell(bl, bx, by, R, R * .9);
    const g = c.createRadialGradient(bx - R * .35, by - R * .4, 2, bx, by, R);
    g.addColorStop(0, '#b0688e'); g.addColorStop(.7, '#7a3a62'); g.addColorStop(1, '#4e1e40');
    c.fillStyle = g; c.fill(bl);
    const sg = new Path2D(), pr = new Path2D(), pg = new Path2D();
    for (let i = 0; i < 5; i++) { const a = -PI * .9 + i * PI * .2; sg.moveTo(bx, by - R * .9); sg.quadraticCurveTo(bx + Math.cos(a) * R * 1.15, by, bx + Math.cos(a) * R * .5, by + R * .85); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .3, px = bx + Math.cos(a) * R * .62, py = by + Math.sin(a) * R * .5; ell(pr, px, py, 3.6 * s, 3 * s); ell(pg, px, py, 1.8 * s, 1.5 * s); }
    c.strokeStyle = '#3a1230'; c.lineWidth = 1.2; c.stroke(sg);
    c.fillStyle = '#2a0a1c'; c.fill(pr); c.fillStyle = '#d8ec6a'; c.fill(pg);
    c.strokeStyle = '#2a0a1e'; c.lineWidth = 1.6; c.stroke(bl);
    const cp = new Path2D(); for (let i = 0; i < 4; i++) { const a = -PI / 2 + (i - 1.5) * .45, px = bx + Math.cos(a) * R * .8, py = by + Math.sin(a) * R * .75; poly(cp, [px - 3, py + 2, px + 3, py + 2, px + Math.cos(a) * 9, py + Math.sin(a) * 11]); }
    c.fillStyle = '#e2d0b0'; c.fill(cp); c.strokeStyle = '#3a1a24'; c.lineWidth = 1; c.stroke(cp);
  };
  const drawTumor = (c, f) => {
    const x = f.x, y = f.y;
    const lb = new Path2D(); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + f.v * 5; ell(lb, x + Math.cos(a) * 16, y + Math.sin(a) * 9, 11, 8); }
    c.fillStyle = '#5a2648'; c.fill(lb); c.strokeStyle = '#2a0a1e'; c.lineWidth = 1.2; c.stroke(lb);
    const md = new Path2D(); ell(md, x, y - 4, 18, 13); c.fillStyle = '#743a60'; c.fill(md); c.stroke(md);
    const ho = new Path2D(); ell(ho, x, y - 6, 8, 5.5); c.fillStyle = '#1c0614'; c.fill(ho);
    const co = new Path2D(); ell(co, x, y - 5, 4, 2.6); c.fillStyle = '#e05aa8'; c.fill(co);
  };
  const drawSac = (c, f) => {
    const x = f.x, y = f.y, r = f.r;
    const sh = new Path2D(); ell(sh, x + 3, y + r * .5, r * 1.1, r * .4); c.fillStyle = 'rgba(16,4,12,.35)'; c.fill(sh);
    const b = new Path2D(); ell(b, x, y, r, r * .72); ell(b, x + r * .7, y + r * .2, r * .55, r * .42);
    c.fillStyle = '#6a3460'; c.fill(b);
    const vn = new Path2D(); vn.moveTo(x - r * .8, y); vn.quadraticCurveTo(x - r * .2, y - r * .5, x + r * .5, y - r * .1); vn.moveTo(x - r * .3, y + r * .5); vn.quadraticCurveTo(x, y, x + r * .9, y + r * .3);
    c.strokeStyle = '#3a1232'; c.lineWidth = 1.3; c.stroke(vn);
    const hi = new Path2D(); ell(hi, x - r * .35, y - r * .3, r * .32, r * .18); c.fillStyle = 'rgba(232,170,220,.55)'; c.fill(hi);
    c.strokeStyle = '#2a0a1e'; c.lineWidth = 1.2; c.stroke(b);
  };
  const drawMinerals = (c, f) => {
    const st = new Path2D(); for (const k of f.cr) ell(st, k.x, k.y + 3, k.w * 2.4, k.w * .9); c.fillStyle = 'rgba(20,40,60,.4)'; c.fill(st);
    const L = new Path2D(), R = new Path2D(), hl = new Path2D(), ol = new Path2D();
    for (const k of f.cr) {
      for (let j = 0; j < k.n; j++) {
        const x = k.x + (j - (k.n - 1) / 2) * k.w * .9, y = k.y + (j & 1) * 4, h = k.hgt * (j === 0 ? 1 : .62), w = k.w * (j === 0 ? 1 : .7), ln = k.lean + (j - (k.n - 1) / 2) * .25;
        const tx = x + Math.sin(ln) * h, ty = y - Math.cos(ln) * h, mx = x + Math.sin(ln) * h * .78, my = y - Math.cos(ln) * h * .78;
        poly(L, [x - w, y, mx - w * .75, my, tx, ty, x + w * .1, y + 2]);
        poly(R, [x + w * .1, y + 2, tx, ty, mx + w * .75, my, x + w, y]);
        poly(ol, [x - w, y, mx - w * .75, my, tx, ty, mx + w * .75, my, x + w, y, x + w * .1, y + 2]);
        hl.moveTo(x - w * .4, y - 2); hl.lineTo(mx - w * .3, my + 2);
      }
    }
    c.fillStyle = '#58c4ec'; c.fill(L); c.fillStyle = '#2a7cbc'; c.fill(R);
    c.strokeStyle = 'rgba(220,250,255,.8)'; c.lineWidth = 1.3; c.stroke(hl);
    c.strokeStyle = '#163a5e'; c.lineWidth = 1.3; c.stroke(ol);
  };
  const drawGeyser = (c, f) => {
    const x = f.x, y = f.y;
    const sh = new Path2D(); ell(sh, x + 6, y + 8, 70, 24); c.fillStyle = 'rgba(16,10,6,.35)'; c.fill(sh);
    const rk = new Path2D(), rh = new Path2D();
    for (let i = 0; i < 11; i++) { const a = i / 11 * TAU + f.v, rx = x + Math.cos(a) * 46, ry = y + Math.sin(a) * 20, s = 13 + (i % 3) * 3; ell(rk, rx, ry - s * .4, s, s * .75); ell(rh, rx - s * .3, ry - s * .75, s * .5, s * .3); }
    c.fillStyle = '#5e5048'; c.fill(rk); c.strokeStyle = '#241a16'; c.lineWidth = 1.3; c.stroke(rk); c.fillStyle = '#7a6a5c'; c.fill(rh);
    const cr = new Path2D(); ell(cr, x, y - 6, 34, 15); c.fillStyle = '#4a6a2a'; c.fill(cr);
    const vt = new Path2D(); ell(vt, x, y - 7, 20, 8.5); c.fillStyle = '#0e1a08'; c.fill(vt);
    c.strokeStyle = '#8ad04a'; c.lineWidth = 2; c.stroke(vt);
    const sp = new Path2D(); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, d = 26 + (i % 2) * 4; ell(sp, x + Math.cos(a) * d, y - 6 + Math.sin(a) * d * .42, 2.4, 1.6); }
    c.fillStyle = '#a6e05a'; c.fill(sp);
  };
  const drawBones = (c, f) => {
    const x = f.x, y = f.y, m = f.m;
    const sh = new Path2D(); ell(sh, x, y + 14, 200, 40); c.fillStyle = 'rgba(16,10,6,.25)'; c.fill(sh);
    const sp = [], ribsF = new Path2D(), ribsB = new Path2D(), vt = new Path2D();
    for (let i = 0; i < 11; i++) { const t = i / 10, px = x + m * (-150 + t * 260), py = y - 6 + Math.sin(t * PI) * -14; sp.push([px, py]); ell(vt, px, py, 9, 6.5); }
    for (let i = 2; i < 10; i++) {
      const [px, py] = sp[i], L = 36 + Math.sin(i / 10 * PI) * 46;
      ribsB.moveTo(px, py); ribsB.quadraticCurveTo(px + m * 10, py - L * 1.1, px + m * 22, py - L * .5);
      ribsF.moveTo(px, py); ribsF.quadraticCurveTo(px + m * 14, py + L * .55, px + m * 30, py + L * .7);
    }
    c.lineCap = 'round';
    c.strokeStyle = '#3a2e26'; c.lineWidth = 9; c.stroke(ribsB); c.strokeStyle = '#a89a80'; c.lineWidth = 6; c.stroke(ribsB);
    c.fillStyle = '#c8bb9c'; c.fill(vt); c.strokeStyle = '#3a2e26'; c.lineWidth = 1.4; c.stroke(vt);
    c.strokeStyle = '#3a2e26'; c.lineWidth = 9; c.stroke(ribsF); c.strokeStyle = '#d2c4a4'; c.lineWidth = 6; c.stroke(ribsF);
    c.strokeStyle = 'rgba(255,248,226,.6)'; c.lineWidth = 1.6; c.stroke(ribsF);
    // skull with a curled horn
    const [hx, hy] = sp[10], sk = new Path2D();
    sk.moveTo(hx - m * 4, hy - 16); sk.quadraticCurveTo(hx + m * 40, hy - 30, hx + m * 74, hy - 6); sk.quadraticCurveTo(hx + m * 80, hy + 8, hx + m * 62, hy + 12);
    sk.lineTo(hx + m * 30, hy + 16); sk.quadraticCurveTo(hx + m * 4, hy + 18, hx - m * 4, hy + 4); sk.closePath();
    c.fillStyle = '#cdbf9f'; c.fill(sk); c.strokeStyle = '#3a2e26'; c.lineWidth = 1.6; c.stroke(sk);
    const so = new Path2D(); ell(so, hx + m * 30, hy - 6, 9, 6); ell(so, hx + m * 58, hy + 2, 4, 3);
    c.fillStyle = '#2a201a'; c.fill(so);
    const hn = new Path2D(); hn.moveTo(hx + m * 14, hy - 18); hn.quadraticCurveTo(hx + m * 4, hy - 60, hx + m * 40, hy - 64); hn.quadraticCurveTo(hx + m * 58, hy - 60, hx + m * 52, hy - 46);
    c.strokeStyle = '#3a2e26'; c.lineWidth = 9; c.stroke(hn); c.strokeStyle = '#bfb08e'; c.lineWidth = 6; c.stroke(hn);
    const th = new Path2D(); for (let i = 0; i < 5; i++) { const tx = hx + m * (36 + i * 7); poly(th, [tx, hy + 13, tx + m * 4, hy + 13, tx + m * 2, hy + 22]); }
    c.fillStyle = '#e4d8bc'; c.fill(th);
    c.lineCap = 'butt';
  };
  const drawRock = (c, f) => {
    const x = f.x, y = f.y, s = f.s;
    const sh = new Path2D(); ell(sh, x + s * .4, y + 3, s * 1.5, s * .45); c.fillStyle = 'rgba(16,10,6,.3)'; c.fill(sh);
    const b = new Path2D(); poly(b, [x - s * 1.2, y + 2, x - s, y - s * .7, x - s * .2, y - s * 1.1, x + s * .8, y - s * .8, x + s * 1.2, y, x + s * .4, y + s * .3]);
    c.fillStyle = '#5c4e44'; c.fill(b);
    const t = new Path2D(); poly(t, [x - s, y - s * .7, x - s * .2, y - s * 1.1, x + s * .8, y - s * .8, x + s * .1, y - s * .35]);
    c.fillStyle = '#76665a'; c.fill(t);
    c.strokeStyle = '#241c18'; c.lineWidth = 1.2; c.stroke(b);
  };
  const DRAW = { 1: drawHatch, 2: drawSpine, 3: drawSpore, 4: drawTumor, 5: drawMinerals, 6: drawGeyser, 7: drawBones, 8: drawRock, 9: drawSac };

  const ground = (Z, x0, y0, x1, y1) => {
    const c = Z.ctx;
    c.fillStyle = ASH; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    // ash: grit, pebbles and cracks
    const G = 32, g1 = new Path2D(), g2 = new Path2D(), pb = new Path2D(), pbh = new Path2D();
    for (let gy = fl(y0 / G); gy <= fl(y1 / G); gy++) for (let gx = fl(x0 / G); gx <= fl(x1 / G); gx++) {
      const a = Z.hash(gx * 7 + 1, gy * 13 + 2), b = Z.hash(gx * 3 - 4, gy * 5 + 7), X = gx * G, Y = gy * G;
      g1.rect(X + a * G, Y + b * G, 2.4, 2); g2.rect(X + b * G, Y + (1 - a) * G, 2, 1.6);
      if (a < .22) { const px = X + b * G, py = Y + a * 4 * G * .9, s = 2 + b * 3; ell(pb, px, py, s, s * .7); ell(pbh, px - s * .3, py - s * .3, s * .45, s * .3); }
    }
    c.fillStyle = '#3e332c'; c.fill(g1); c.fillStyle = '#5a4c42'; c.fill(g2);
    c.fillStyle = '#635449'; c.fill(pb); c.strokeStyle = '#2a211c'; c.lineWidth = .8; c.stroke(pb); c.fillStyle = '#7a6a5c'; c.fill(pbh);
    const CG = 128, ck = new Path2D(), ckh = new Path2D();
    for (let gy = fl(y0 / CG); gy <= fl(y1 / CG); gy++) for (let gx = fl(x0 / CG); gx <= fl(x1 / CG); gx++) {
      const h = Z.hash(gx * 17 + 5, gy * 23 - 9);
      if (h > .32) continue;
      let x = gx * CG + Z.hash(gx, gy * 7) * CG, y = gy * CG + Z.hash(gx * 5, gy) * CG, a = h * 20;
      ck.moveTo(x, y); ckh.moveTo(x + 1, y + 1.5);
      for (let k = 0; k < 5; k++) {
        a += (Z.hash(gx * 3 + k, gy * 11 - k) - .5) * 1.6; x += Math.cos(a) * 16; y += Math.sin(a) * 16; ck.lineTo(x, y); ckh.lineTo(x + 1, y + 1.5);
        if (k === 2) { ck.moveTo(x, y); ck.lineTo(x + Math.cos(a + 1.2) * 12, y + Math.sin(a + 1.2) * 12); ck.moveTo(x, y); }
      }
    }
    c.strokeStyle = 'rgba(110,96,84,.5)'; c.lineWidth = 1; c.stroke(ckh);
    c.strokeStyle = '#2a201b'; c.lineWidth = 1.6; c.stroke(ck);
    const cells = cellsNear(Z, x0, y0, x1, y1);
    const vis = (x, y, r) => x + r > x0 && x - r < x1 && y + r > y0 && y - r < y1;
    const visBB = bb => bb[2] > x0 && bb[0] < x1 && bb[3] > y0 && bb[1] < y1;
    const blobs = [];
    for (const cl of cells) for (const b of cl.blobs) if (vis(b.x, b.y, b.R * 1.3 + 80)) blobs.push(b);
    if (blobs.length) {
      // stain where the creep is eating into the ash
      const stain = new Path2D(), stain2 = new Path2D(), base = new Path2D(), tn = new Path2D();
      for (const b of blobs) { blobTo(stain, b, 40); blobTo(stain2, b, 18); blobTo(base, b, 0); }
      c.fillStyle = 'rgba(62,44,50,.5)'; c.fill(stain);
      c.fillStyle = 'rgba(64,38,52,.65)'; c.fill(stain2);
      // tendrils reaching out of the creep edge
      for (const b of blobs) for (let i = 0; i < NA; i += 2) {
        const hh = Z.hash(fl(b.x) + i * 7, fl(b.y) - i * 3);
        if (hh > .6) continue;
        const r0 = b.rr[i] - 6, r1 = b.rr[i] + 16 + hh * 46, a = i / NA * TAU, wv = (hh - .3) * .5;
        tn.moveTo(b.x + CO[i] * r0, b.y + SI[i] * r0);
        tn.quadraticCurveTo(b.x + Math.cos(a + wv * .3) * (r0 + r1) / 2, b.y + Math.sin(a + wv * .3) * (r0 + r1) / 2, b.x + Math.cos(a + wv * 60 / r1) * r1, b.y + Math.sin(a + wv * 60 / r1) * r1);
      }
      c.lineCap = 'round';
      c.strokeStyle = '#2e1028'; c.lineWidth = 4.5; c.stroke(tn); c.strokeStyle = '#55234a'; c.lineWidth = 2; c.stroke(tn);
      c.lineCap = 'butt';
      c.fillStyle = CREEP; c.fill(base);
      for (const b of blobs) {
        if (b.R < 400) continue;
        const g = c.createRadialGradient(b.x, b.y, 40, b.x, b.y, b.R);
        g.addColorStop(0, 'rgba(84,46,72,.45)'); g.addColorStop(.7, 'rgba(76,40,64,.2)'); g.addColorStop(1, 'rgba(76,40,64,0)');
        c.fillStyle = g; c.fill(base);
      }
      // living texture, clipped to the creep
      c.save(); c.clip(base);
      const LG = 30, dk = new Path2D(), lt = new Path2D(), po = new Path2D(), gl = new Path2D();
      for (let gy = fl(y0 / LG); gy <= fl(y1 / LG); gy++) for (let gx = fl(x0 / LG); gx <= fl(x1 / LG); gx++) {
        const a = Z.hash(gx * 11 + 3, gy * 7 - 1), b = Z.hash(gx * 5 - 2, gy * 9 + 4), x = gx * LG + a * LG, y = gy * LG + b * LG, s = 6 + a * 9;
        ell(dk, x + 2, y + 2, s, s * .7);
        ell(lt, x - s * .2, y - s * .25, s * .7, s * .45);
        if (b > .55) circ(po, x + s * .8, y + s * .5, 1.2 + b);
        if (a > .62) { gl.moveTo(x - s * .5, y - s * .3); gl.quadraticCurveTo(x - s * .1, y - s * .6, x + s * .35, y - s * .45); }
      }
      c.fillStyle = '#331a2c'; c.fill(dk); c.fillStyle = '#4a2a40'; c.fill(lt);
      c.fillStyle = '#240a1e'; c.fill(po);
      c.lineCap = 'round'; c.strokeStyle = 'rgba(236,180,220,.26)'; c.lineWidth = 1.5; c.stroke(gl);
      // capillaries
      const VG = 90, cp = new Path2D();
      for (let gy = fl(y0 / VG); gy <= fl(y1 / VG); gy++) for (let gx = fl(x0 / VG); gx <= fl(x1 / VG); gx++) {
        let x = gx * VG + Z.hash(gx * 3, gy * 7 + 1) * VG, y = gy * VG + Z.hash(gx * 9 + 2, gy) * VG, a = Z.hash(gx, gy * 5) * TAU;
        cp.moveTo(x, y);
        for (let k = 0; k < 4; k++) {
          const nx = x + Math.cos(a) * 22, ny = y + Math.sin(a) * 22;
          cp.quadraticCurveTo(x + Math.cos(a + .6) * 14, y + Math.sin(a + .6) * 14, nx, ny); x = nx; y = ny;
          a += (Z.hash(gx * 13 + k, gy * 3 - k) - .5) * 1.8;
          if (k === 1) { cp.moveTo(x, y); cp.lineTo(x + Math.cos(a - 1.3) * 16, y + Math.sin(a - 1.3) * 16); cp.moveTo(x, y); }
        }
      }
      c.strokeStyle = '#2c0e26'; c.lineWidth = 2.4; c.stroke(cp);
      c.strokeStyle = 'rgba(118,60,100,.55)'; c.lineWidth = .9; c.stroke(cp);
      c.lineCap = 'butt';
      c.restore();
      // the wet rim of the creep
      c.strokeStyle = '#2a0c24'; c.lineWidth = 2.4; c.stroke(base);
      const rim = new Path2D(); for (const b of blobs) blobTo(rim, b, -5);
      c.strokeStyle = 'rgba(150,80,130,.35)'; c.lineWidth = 1.5; c.stroke(rim);
    }
    for (const cl of cells) drawVeins(c, cl.veins, visBB);
    for (const cl of cells) for (const pl of cl.pools) if (vis(pl.x, pl.y, pl.r + 60)) drawPool(c, Z, pl);
    // acid puddles
    const pd = new Path2D(), pdh = new Path2D();
    for (const cl of cells) for (const p of cl.puddles) if (vis(p.x, p.y, p.r + 10)) {
      for (let k = 0; k < 3; k++) { const a = p.p + k * 2.1; ell(pd, p.x + Math.cos(a) * p.r * .45, p.y + Math.sin(a) * p.r * .25, p.r * (.75 - k * .12), p.r * (.45 - k * .07)); }
      ell(pdh, p.x - p.r * .2, p.y - p.r * .12, p.r * .3, p.r * .12);
    }
    c.fillStyle = 'rgba(128,176,44,.55)'; c.fill(pd); c.strokeStyle = 'rgba(190,230,90,.7)'; c.lineWidth = 1.2; c.stroke(pd);
    c.fillStyle = 'rgba(240,255,190,.5)'; c.fill(pdh);
    // egg shadows (the eggs themselves wobble in under())
    const es = new Path2D();
    for (const cl of cells) for (const eg of cl.eggs) if (vis(eg.x, eg.y, 20)) ell(es, eg.x + 2, eg.y + 2, 10 * eg.s, 4 * eg.s);
    c.fillStyle = 'rgba(16,4,12,.45)'; c.fill(es);
    const list = [];
    for (const cl of cells) for (const f of cl.f) if (vis(f.x, f.y - 30, EXT[f.k])) list.push(f);
    list.sort((p, q) => p.y - q.y);
    c.lineJoin = 'round';
    for (const f of list) DRAW[f.k](c, f);
    c.lineJoin = 'miter';
  };

  /* ================= Transient visuals: creep spikes and a nydus maw, keyed on Z.t ================= */
  const fx = [];
  const addFx = o => { if (fx.length > 160) fx.shift(); fx.push(o); };
  const spike = (Z, x, y, t) => addFx({ k: 's', x, y, t0: Z.t + t, T: .7, a: Math.random() * TAU });
  const drawFx = (c, Z) => {
    const t = Z.t;
    for (let i = fx.length - 1; i >= 0; i--) { const o = fx[i]; if (t > o.t0 + o.T || t < o.t0 - 8) fx.splice(i, 1); }
    const sp = new Path2D(), hole = new Path2D();
    for (const o of fx) {
      if (t < o.t0) continue;
      const k = (t - o.t0) / o.T;
      if (o.k === 's') {
        const up = Math.min(1, k * 5) * (k > .6 ? Math.max(0, 1 - (k - .6) / .4) : 1);
        if (!(up > 0)) continue;
        ell(hole, o.x, o.y + 2, 16, 7);
        for (let j = 0; j < 3; j++) {
          const a = o.a + j * 2.1, bx = o.x + Math.cos(a) * 7, by = o.y + Math.sin(a) * 3, H = (20 + j * 6) * up, lean = Math.cos(a) * 6 * up;
          poly(sp, [bx - 4, by + 2, bx + 4, by + 2, bx + lean, by - H]);
        }
      } else if (o.k === 'n') {
        const up = Math.min(1, k * 6) * (k > .85 ? Math.max(0, 1 - (k - .85) / .15) : 1);
        if (!(up > 0)) continue;
        const r = 64 * up, x = o.x, y = o.y, mw = new Path2D(), lip = new Path2D(), th = new Path2D();
        ell(lip, x, y, r + 14, (r + 14) * .55); ell(mw, x, y, r, r * .5);
        for (let j = 0; j < 14; j++) { const a = j / 14 * TAU + t * .4, tx = x + Math.cos(a) * r, ty = y + Math.sin(a) * r * .5; poly(th, [tx - Math.sin(a) * 5, ty + Math.cos(a) * 2.5, tx + Math.sin(a) * 5, ty - Math.cos(a) * 2.5, x + Math.cos(a) * r * .62, y + Math.sin(a) * r * .31]); }
        c.fillStyle = '#7a3a5e'; c.fill(lip); c.strokeStyle = '#2a0a1e'; c.lineWidth = 1.6; c.stroke(lip);
        c.fillStyle = '#1a0410'; c.fill(mw);
        c.fillStyle = '#e6d4b2'; c.fill(th); c.strokeStyle = '#3a1424'; c.lineWidth = 1; c.stroke(th);
      }
    }
    c.fillStyle = 'rgba(24,4,18,.55)'; c.fill(hole);
    c.fillStyle = '#e8d6b4'; c.fill(sp); c.strokeStyle = '#3a1028'; c.lineWidth = 1.2; c.stroke(sp);
  };

  /* ================= Under (every frame): vein pulses, bubbling pools, gas, eggs, larvae, sacs ================= */
  const under = Z => {
    const c = Z.ctx, P = Z.P, now = Z.now, hw = Z.W / 2 + 120, hh = Z.H / 2 + 120;
    const x0 = P.x - hw, x1 = P.x + hw, y0 = P.y - hh, y1 = P.y + hh;
    const vis = (x, y, r) => x + r > x0 && x - r < x1 && y + r > y0 && y - r < y1;
    const cells = cellsNear(Z, x0, y0, x1, y1);
    c.save();
    c.lineCap = 'round';
    // pulses of light travelling down the veins toward the tumours
    const vb = new Path2D(), vd = new Path2D();
    for (const cl of cells) for (const v of cl.veins) {
      if (!(v.bb[2] > x0 && v.bb[0] < x1 && v.bb[3] > y0 && v.bb[1] < y1)) continue;
      const u = ((now * .45 + v.ph * .1) % 1.6) - .2;
      for (let i = 0; i < v.n; i++) {
        const q = 1 - Math.abs(i / v.n - u) * 5;
        if (q < .15) continue;
        const p = q > .6 ? vb : vd;
        p.moveTo(v.pts[i * 2], v.pts[i * 2 + 1]); p.lineTo(v.pts[i * 2 + 2], v.pts[i * 2 + 3]);
      }
    }
    c.strokeStyle = 'rgba(255,120,220,.28)'; c.lineWidth = 6; c.stroke(vd);
    c.strokeStyle = 'rgba(255,150,230,.6)'; c.lineWidth = 3.5; c.stroke(vb);
    // biomass sacs breathing
    const sb = new Path2D(), sh = new Path2D();
    for (const cl of cells) for (const f of cl.f) {
      if (f.k !== SAC || !vis(f.x, f.y, 40)) continue;
      const q = .5 + .5 * Math.sin(now * 2.4 + f.p), r = f.r * (.9 + q * .14);
      ell(q > .5 ? sb : sh, f.x, f.y, r, r * .72);
    }
    c.fillStyle = 'rgba(240,130,220,.2)'; c.fill(sb); c.fillStyle = 'rgba(240,130,220,.08)'; c.fill(sh);
    // spawning pools: drifting sheen and bubbles that swell and pop
    for (const acid of [false, true]) {
      const bu = new Path2D(), bh = new Path2D(), pop = new Path2D(), sw = new Path2D();
      let any = false;
      for (const cl of cells) for (const pl of cl.pools) {
        if (pl.acid !== acid || !vis(pl.x, pl.y, pl.r + 20)) continue;
        any = true;
        for (let k = 0; k < 2; k++) { const a = now * (.3 + k * .17) + pl.p + k * 2, r = pl.r * (.35 + k * .25); sw.moveTo(pl.x + Math.cos(a) * r, pl.y + Math.sin(a) * r * .72); sw.quadraticCurveTo(pl.x + Math.cos(a + .45) * r * 1.15, pl.y + Math.sin(a + .45) * r * .82, pl.x + Math.cos(a + .9) * r, pl.y + Math.sin(a + .9) * r * .72); }
        for (let k = 0; k < 7; k++) {
          const hx = Z.hash(k * 7 + fl(pl.x), k * 3 + fl(pl.y)), hy = Z.hash(k * 5 - fl(pl.y), k + fl(pl.x));
          const a = hx * TAU, d = Math.sqrt(hy) * pl.r * .8, x = pl.x + Math.cos(a) * d, y = pl.y + Math.sin(a) * d * .72;
          const u = (now * (.45 + hx * .3) + hy * 7) % 1, bm = 3 + hx * 5;
          if (u < .85) { const r = bm * u / .85; circ(bu, x, y, r); circ(bh, x - r * .35, y - r * .35, r * .3); }
          else circ(pop, x, y, bm * (1 + (u - .85) * 7));
        }
      }
      if (!any) continue;
      c.strokeStyle = acid ? 'rgba(236,255,180,.35)' : 'rgba(255,236,170,.35)'; c.lineWidth = 2; c.stroke(sw);
      c.fillStyle = acid ? '#a6d84e' : '#eaa040'; c.fill(bu);
      c.strokeStyle = acid ? '#3e6a1e' : '#7a3a18'; c.lineWidth = 1; c.stroke(bu);
      c.fillStyle = 'rgba(255,255,230,.8)'; c.fill(bh);
      c.strokeStyle = acid ? 'rgba(220,255,160,.6)' : 'rgba(255,220,150,.6)'; c.lineWidth = 1.2; c.stroke(pop);
    }
    // geysers puffing green gas
    const g1 = new Path2D(), g2 = new Path2D();
    for (const cl of cells) for (const g of cl.geys) {
      if (!vis(g.x, g.y - 40, 90)) continue;
      for (let k = 0; k < 6; k++) {
        const u = (now * .42 + k / 6 + g.p) % 1, x = g.x + Math.sin(now * .8 + k * 1.7) * 10 * u, y = g.y - 8 - u * 70, r = 7 + u * 20;
        circ(u < .5 ? g1 : g2, x, y, r);
      }
    }
    c.fillStyle = 'rgba(130,220,90,.22)'; c.fill(g1); c.fillStyle = 'rgba(130,220,90,.1)'; c.fill(g2);
    // larvae wriggling near the hatchery
    const lv = new Path2D(), ls = new Path2D();
    for (const cl of cells) for (const l of cl.larva) {
      if (!vis(l.x, l.y, 40)) continue;
      const a = now * .35 * l.dir + l.p, x = l.x + Math.cos(a) * 18, y = l.y + Math.sin(a) * 9, hd = a + l.dir * PI / 2, ca = Math.cos(hd), sa = Math.sin(hd);
      for (let j = 0; j < 4; j++) { const w = Math.sin(now * 7 + l.p - j * 1.1) * 2, px = x - ca * j * 4.5 - sa * w, py = y - sa * j * 4.5 * .7 + ca * w; circ(lv, px, py, 4.2 - j * .7); if (j) { ls.moveTo(px - sa * 2.5, py + ca * 2.5); ls.lineTo(px + sa * 2.5, py - ca * 2.5); } }
    }
    c.fillStyle = '#b4826e'; c.fill(lv); c.strokeStyle = '#3a1820'; c.lineWidth = 1; c.stroke(lv);
    c.strokeStyle = '#6a3a34'; c.lineWidth = 1; c.stroke(ls);
    // leathery eggs, wobbling, now and then twitching
    const eb = new Path2D(), eh = new Path2D(), sm = new Path2D(), sl = new Path2D();
    for (const cl of cells) for (const eg of cl.eggs) {
      if (!vis(eg.x, eg.y, 24)) continue;
      const tw = Math.sin(now * .7 + eg.p * 3) > .93 ? Math.sin(now * 19 + eg.p) * .14 : 0, tl = Math.sin(now * 1.6 + eg.p) * .07 + tw, s = eg.s;
      const rx = 8 * s, ry = 10.5 * s * (1 + Math.sin(now * 2.2 + eg.p) * .03), cx = eg.x + Math.sin(tl) * ry, cy = eg.y - ry * Math.cos(tl);
      rell(eb, cx, cy, rx, ry, tl);
      rell(eh, cx - rx * .35, cy - ry * .35, rx * .28, ry * .2, tl);
      const tx = eg.x + Math.sin(tl) * ry * 2, ty = eg.y - ry * 2 * Math.cos(tl);
      for (const o of [-.5, 0, .5]) { sm.moveTo(tx, ty); sm.quadraticCurveTo(cx + Math.cos(tl) * rx * o * 1.4, cy + Math.sin(tl) * rx * o * 1.4, eg.x + Math.cos(tl) * rx * o, eg.y + Math.sin(tl) * rx * o); }
      sl.moveTo(tx - Math.cos(tl) * 2.5, ty - Math.sin(tl) * 2.5 + 2); sl.lineTo(tx + Math.cos(tl) * 2.5, ty + Math.sin(tl) * 2.5 + 2);
    }
    c.fillStyle = '#7e4a56'; c.fill(eb);
    c.strokeStyle = '#4a1e2e'; c.lineWidth = 1.1; c.stroke(sm);
    c.fillStyle = 'rgba(214,160,150,.6)'; c.fill(eh);
    c.strokeStyle = '#2a0c1a'; c.lineWidth = 1.3; c.stroke(eb);
    c.strokeStyle = '#ffa448'; c.lineWidth = 1.6; c.stroke(sl);
    c.lineCap = 'butt';
    drawFx(c, Z);
    c.restore();
  };

  /* ================= Ambient (after darkness): glows, spores, gas, scuttling critters, haze ================= */
  const ambient = Z => {
    const c = Z.ctx, P = Z.P, now = Z.now, hw = Z.W / 2 + 120, hh = Z.H / 2 + 120;
    const inV = (x, y, m) => Math.abs(x - P.x) < hw + (m || 0) && Math.abs(y - P.y) < hh + (m || 0);
    c.save();
    let n = 3;
    for (const cl of cellsNear(Z, P.x - hw, P.y - hh, P.x + hw, P.y + hh)) {
      const hv = cl.hive;
      if (inV(hv.x, hv.y - 50, 200)) for (const [ox, oy, r] of [[-66, -30, 30], [66, -30, 30], [0, -62, 40]]) { Z.glow('255,130,50', r + Math.sin(now * 2.3 + ox) * 5, hv.x + ox, hv.y + oy, .45 + .15 * Math.sin(now * 1.7 + oy)); n++; }
      for (const t of cl.tumours) if (inV(t.x, t.y)) { Z.glow('235,80,200', 16 + 6 * Math.sin(now * 2 + t.p), t.x, t.y - 5, .55); n++; }
      for (const [x, y] of cl.spores) if (inV(x, y - 50)) { Z.glow('200,240,100', 26 + 4 * Math.sin(now * 3 + x), x, y - 52, .32); n++; }
      for (const pl of cl.pools) if (inV(pl.x, pl.y, 80)) { Z.glow(pl.acid ? '160,255,70' : '255,160,50', pl.r * 1.5, pl.x, pl.y, .16 + .05 * Math.sin(now * 1.3 + pl.p)); n++; }
      for (const g of cl.geys) if (inV(g.x, g.y, 100)) {
        Z.glow('120,255,90', 36, g.x, g.y - 8, .3); n++;
        for (let k = 0; k < 3; k++) { const u = (now * .3 + k / 3 + g.p) % 1; Z.glow('140,255,110', 18 + u * 30, g.x + Math.sin(now * .6 + k * 2) * 26 * u, g.y - 20 - u * 120, .3 * (1 - u)); n++; }
      }
      for (const f of cl.f) if (f.k === MINERAL && inV(f.x, f.y, 60)) for (const k of f.cr) {
        const ph = (now * .6 + k.x * .013) % 2.6;
        if (ph < .35) { Z.glow('140,230,255', 10 + Math.sin(ph / .35 * PI) * 10, k.x + Math.sin(k.lean) * k.hgt * .7, k.y - k.hgt * .7, .7); n++; }
      }
    }
    // floating spores
    const SG = 190, sd = new Path2D();
    for (let gy = fl((P.y - hh) / SG); gy <= fl((P.y + hh) / SG); gy++) for (let gx = fl((P.x - hw) / SG); gx <= fl((P.x + hw) / SG); gx++) {
      const h = Z.hash(gx * 13 + 7, gy * 17 - 3);
      if (h > .55) continue;
      const x = gx * SG + Z.hash(gx, gy * 3) * SG + Math.sin(now * .4 + h * 9) * 24, y = gy * SG + SG - ((now * (8 + h * 10) + h * 400) % SG);
      circ(sd, x, y, 1.6 + h * 1.4);
      if (n < 200 && h < .25) { Z.glow('220,140,255', 8 + h * 10, x, y, .45); n++; }
    }
    c.fillStyle = 'rgba(240,200,255,.75)'; c.fill(sd);
    // scuttling critters: dart, stop, dart
    const CG = 260, cb = new Path2D(), cg = new Path2D(), ce = new Path2D();
    for (let gy = fl((P.y - hh) / CG); gy <= fl((P.y + hh) / CG); gy++) for (let gx = fl((P.x - hw) / CG); gx <= fl((P.x + hw) / CG); gx++) {
      const h = Z.hash(gx * 19 + 1, gy * 11 + 5);
      if (h > .55) continue;
      const tt = now * (.5 + h * .6) + h * 30, sgm = fl(tt), fr = Math.min(1, (tt - sgm) * 3.5);
      const pt = k => [gx * CG + 40 + Z.hash(gx * 7 + k, gy * 3 - k) * (CG - 80), gy * CG + 40 + Z.hash(gx * 5 - k, gy * 9 + k) * (CG - 80)];
      const [ax, ay] = pt(sgm), [bx, by] = pt(sgm + 1), x = ax + (bx - ax) * fr, y = ay + (by - ay) * fr, a = Math.atan2(by - ay, bx - ax), ca = Math.cos(a), sa = Math.sin(a);
      const lgw = fr < 1 ? Math.sin(now * 40 + h * 9) * 1.5 : 0;
      ell(cb, x, y, 3.2, 3.2); ell(cb, x + ca * 3.5, y + sa * 3.5, 2, 2);
      for (const s of [-1, 1]) for (const o of [-2, 0, 2]) { cg.moveTo(x + ca * o, y + sa * o); cg.lineTo(x + ca * (o + lgw * s) - sa * s * 5.5, y + sa * (o + lgw * s) + ca * s * 5.5); }
      circ(ce, x + ca * 4.6, y + sa * 4.6, .9);
    }
    c.strokeStyle = '#1a0812'; c.lineWidth = 1; c.stroke(cg);
    c.fillStyle = '#3a1a2a'; c.fill(cb); c.strokeStyle = '#0e0408'; c.lineWidth = .8; c.stroke(cb);
    c.fillStyle = '#ffb040'; c.fill(ce);
    c.restore();
  };

  /* ================= Foes ================= */
  // Zergling: low, fast, scythe-winged. Comes in packs; crouches, then pounces.
  const ling = {
    hp: 10, sp: 112, dmg: 6, xp: 1, r: 9, eye: false,
    init(e, Z) { e.mode = 'walk'; e.mt = Z.rnd(.5, 1.5); e.la = 0; e.pk = Math.random() < .28; e.packed = false; e.side = Math.random() < .5 ? -1 : 1; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e);
      if (e.pk && !e.packed) {
        e.packed = true;
        for (let i = 0; i < 3; i++) { const a = e.seed + i * 2.1, k = Z.spawn('ling', e.x + Math.cos(a) * 26, e.y + Math.sin(a) * 26); if (k) { k.pk = false; k.packed = true; } }
      }
      switch (e.mode) {
        case 'hatch': Z.move(e, 0, 0); e.ang = Z.angTo(e); if ((e.mt -= dt) <= 0) { e.mode = 'walk'; e.mt = Z.rnd(.4, 1); Z.burst(e.x, e.y, '#b4826e', 6, 70); } return;
        case 'crouch': Z.move(e, 0, 0); e.ang = e.la; if ((e.mt -= dt) <= 0) { e.mode = 'pounce'; e.mt = .24; } return;
        case 'pounce': Z.move(e, Math.cos(e.la) * e.sp * 3.4, Math.sin(e.la) * e.sp * 3.4); e.ang = e.la; if ((e.mt -= dt) <= 0) { e.mode = 'rec'; e.mt = .38; } return;
        case 'rec': Z.move(e, 0, 0); if ((e.mt -= dt) <= 0) { e.mode = 'walk'; e.mt = Z.rnd(.9, 1.8); } return;
        default: {
          const a = Z.angTo(e) + Math.sin(e.ph * 3.1 + e.seed) * (d > 160 ? .55 : .2) + (d < 220 ? e.side * .25 : 0), k = .85 + .3 * Math.abs(Math.sin(e.ph * 7 + e.seed));
          Z.move(e, Math.cos(a) * e.sp * k, Math.sin(a) * e.sp * k); e.ang = Z.angTo(e);
          e.mt -= dt;
          if (e.mt <= 0 && d < 150 && d > 34) { e.mode = 'crouch'; e.mt = .32; e.la = Z.angTo(e); }
        }
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, m = e.mode, OL = W(white, '#2a0a1c');
      c.save(); c.translate(e.x, e.y);
      if (m === 'hatch') {
        const k = cl01(1 - e.mt / .7), wb = Math.sin(Z.now * 30 + e.seed) * k * .12;
        c.rotate(wb);
        const eg = new Path2D(); ell(eg, 0, -3, 8.5, 10.5);
        c.fillStyle = W(white, '#7e4a56'); c.fill(eg); c.strokeStyle = OL; c.lineWidth = 1.4; c.stroke(eg);
        if (!white) {
          const cr = new Path2D(); cr.moveTo(-7, -6); cr.lineTo(-3, -3); cr.lineTo(0, -8); cr.lineTo(3, -4); cr.lineTo(7, -7);
          c.strokeStyle = '#ffb050'; c.lineWidth = 1 + k * 1.6; c.stroke(cr);
          Z.glow('255,150,60', 8 + k * 14, 0, -5, .3 + k * .5);
        }
        c.restore(); return;
      }
      face(c, e);
      if (m === 'crouch') { c.translate(0, 2); c.rotate(.2); } else if (m === 'pounce') c.rotate(-.2);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const mv = m === 'walk' ? 1 : 0, lg = new Path2D();
      for (const [bx, o] of [[-5, 0], [5, PI]]) for (const sd of [0, 1]) {
        const q = Math.sin(e.ph * 24 + e.seed + o + sd * PI) * mv, kx = bx + (sd ? 2 : -1), st = m === 'pounce' ? (bx < 0 ? -4 : 4) : 0;
        lg.moveTo(bx, 1); lg.lineTo(kx + q * 3 + st * .5, 5); lg.lineTo(kx - 1 + q * 4.5 + st, 10);
      }
      lg.moveTo(-7, 0); lg.quadraticCurveTo(-12, 1, -15, -3 + Math.sin(e.ph * 12) * 1.5);
      c.strokeStyle = OL; c.lineWidth = 3.2; c.stroke(lg); c.strokeStyle = W(white, '#6a2a46'); c.lineWidth = 1.6; c.stroke(lg);
      const fw = m === 'pounce' ? -.35 : m === 'crouch' ? .2 : Math.sin(e.ph * 9 + e.seed) * .1;
      const wg = new Path2D(); blade(wg, -2, -4, -2.35 + fw, 16, 3, 1); blade(wg, 2, -4, -1.95 + fw, 14, 2.6, 1);
      c.fillStyle = W(white, '#ecdcc0'); c.fill(wg); c.strokeStyle = OL; c.lineWidth = 1.2; c.stroke(wg);
      const bd = new Path2D(); ell(bd, 0, -1, 8, 4.8); ell(bd, 8.5, -2, 4.2, 3.6);
      c.strokeStyle = OL; c.lineWidth = 1.8; c.stroke(bd); c.fillStyle = W(white, '#b84c72'); c.fill(bd);
      if (!white) {
        const pl = new Path2D(); ell(pl, -4, -4.2, 3.2, 1.8); ell(pl, 1, -4.8, 3.2, 1.9); ell(pl, 8.5, -4.6, 2.8, 1.6);
        c.fillStyle = '#dcae7c'; c.fill(pl);
        const mb = new Path2D(); mb.moveTo(11.5, -.5); mb.lineTo(14.5, 1.8); mb.moveTo(11.5, -2.8); mb.lineTo(15, -4.4);
        c.strokeStyle = '#f2e4c8'; c.lineWidth = 1.3; c.stroke(mb);
        c.fillStyle = '#ffd040'; c.fillRect(9.4, -3.8, 2, 1.7);
        if (m === 'crouch' || m === 'pounce') Z.glow('255,190,60', 9, 10.4, -3, .8);
      }
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#a2426c', 7, 80); },
  };

  // Baneling: a glowing acid sac on stubby legs. Rolls in, swells and flashes, then bursts in an acid splash.
  const banePop = (e, Z, big) => {
    Z.burst(e.x, e.y, '#9cff4a', big ? 22 : 12, big ? 200 : 140); Z.burst(e.x, e.y, '#e8ffb0', 6, 90);
    if (big) Z.shake(3);
  };
  const bane = {
    hp: 16, sp: 74, dmg: 8, xp: 2, r: 11, eye: false,
    init(e) { e.mode = 'roll'; e.roll = 0; e.mt = 0; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e);
      if (e.mode === 'swell') {
        Z.move(e, 0, 0);
        if ((e.mt -= dt) <= 0) { banePop(e, Z, true); e.remove = true; }
        return;
      }
      const a = Z.angTo(e) + Math.sin(e.ph * 2 + e.seed) * .25, sp = e.sp * (.9 + .2 * Math.sin(e.ph * 4 + e.seed));
      Z.move(e, Math.cos(a) * sp, Math.sin(a) * sp); e.ang = Z.angTo(e);
      e.roll += sp * dt / 11 * (Math.cos(e.ang) < 0 ? -1 : 1);
      if (d < 72) { e.mode = 'swell'; e.mt = .75; Z.hazard(e.x, e.y, { r: 74, t: .75, dmg: 16, col: ACID, foes: true }); Z.sfx('warn'); }
    },
    draw(e, Z, white) {
      const c = Z.ctx, sw = e.mode === 'swell', k = sw ? cl01(1 - e.mt / .75) : 0, OL = W(white, '#16300a');
      const flash = sw && Math.sin(Z.now * (18 + k * 34)) > 0, s = 1 + k * .45;
      c.save(); c.translate(e.x, e.y + (sw ? 0 : Math.abs(Math.sin(e.ph * 9)) * -1)); face(c, e); c.scale(s, s);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const lg = new Path2D(), q = sw ? 0 : Math.sin(e.ph * 16 + e.seed);
      for (const [bx, o] of [[4, 0], [8, PI], [-2, PI / 2]]) { const w = Math.sin(e.ph * 16 + o) * (sw ? 0 : 1); lg.moveTo(bx, 6); lg.lineTo(bx + 3 + w * 2, 10); lg.lineTo(bx + 5 + w * 2.5, 13); }
      c.strokeStyle = OL; c.lineWidth = 2.8; c.stroke(lg); c.strokeStyle = W(white, '#6a2a46'); c.lineWidth = 1.4; c.stroke(lg);
      if (!white) Z.glow(ACID, 20 + k * 22, 0, 0, .45 + .45 * k);
      const bd = new Path2D(); circ(bd, 0, 0, 11);
      c.strokeStyle = OL; c.lineWidth = 1.8; c.stroke(bd);
      c.fillStyle = W(white, flash ? '#f4ffb4' : '#78dc36'); c.fill(bd);
      if (!white) {
        const rs = new Path2D(), sp = new Path2D();
        for (let i = 0; i < 3; i++) {
          const a = e.roll + i * TAU / 3;
          rs.moveTo(Math.cos(a) * 10, Math.sin(a) * 10); rs.quadraticCurveTo(Math.cos(a + 1.6) * 3, Math.sin(a + 1.6) * 3, Math.cos(a + 2.5) * 10, Math.sin(a + 2.5) * 10);
          circ(sp, Math.cos(a + .9) * 5.5, Math.sin(a + .9) * 5.5, 1.8);
        }
        c.strokeStyle = '#3a9a1e'; c.lineWidth = 1.6; c.stroke(rs);
        c.fillStyle = '#efffa0'; c.fill(sp);
        const hl = new Path2D(); ell(hl, -3.5, -5, 3.6, 2.2); c.fillStyle = 'rgba(255,255,235,.75)'; c.fill(hl);
      }
      // carapace cap and little head
      const cp = new Path2D(); cp.arc(0, 0, 12, PI * 1.02, PI * 1.62); cp.arc(0, 0, 7, PI * 1.62, PI * 1.02, true); cp.closePath();
      poly(cp, [-6, -9.5, -3.5, -10.8, -6.5, -15]); poly(cp, [-1.5, -11.2, 1.5, -11.2, .5, -16]);
      c.fillStyle = W(white, '#a2426c'); c.fill(cp); c.strokeStyle = OL; c.lineWidth = 1.2; c.stroke(cp);
      const hd = new Path2D(); ell(hd, 10, 5, 3.6, 3);
      c.fillStyle = W(white, '#8a3a5e'); c.fill(hd); c.stroke(hd);
      if (!white) { c.fillStyle = '#ffd040'; c.fillRect(11, 3.6, 1.6, 1.4); }
      c.restore();
    },
    death(e, Z) {
      if (e.mode !== 'swell') Z.hazard(e.x, e.y, { r: 44, t: .35, dmg: 9, col: ACID, foes: true });
      banePop(e, Z, false);
    },
  };

  // Hydralisk: tall serpentine spitter with a flaring hood. Keeps its distance; the hood flares, then a spine volley.
  const hydra = {
    hp: 38, sp: 54, dmg: 9, xp: 4, r: 13, eye: false,
    init(e, Z) { e.mode = 'walk'; e.t1 = Z.rnd(1.6, 3); e.side = Math.random() < .5 ? -1 : 1; e.aa = 0; e.kick = 0; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e), a = Z.angTo(e);
      if (e.kick > 0) e.kick -= dt;
      if (e.mode === 'aim') {
        Z.move(e, 0, 0); e.ang = a; e.aa = a;
        if ((e.mt -= dt) <= 0) {
          for (const o of [-.14, 0, .14]) Z.shoot(e.x + Math.cos(a) * 14, e.y - 18 + Math.sin(a) * 14, a + o, 235, { r: 5, dmg: 8, life: 3, col: '255,206,70' });
          Z.sfx('shoot'); e.kick = .3; e.mode = 'walk'; e.t1 = Z.rnd(2.6, 3.6);
        }
        return;
      }
      let mv = a, k = 1;
      if (d < 220) mv = a + PI; else if (d < 330) { mv = a + e.side * PI / 2; k = .55; }
      Z.move(e, Math.cos(mv) * e.sp * k, Math.sin(mv) * e.sp * k); e.ang = a;
      if ((e.t1 -= dt) <= 0 && d < 480) { e.mode = 'aim'; e.mt = .6; Z.sfx('charge'); }
    },
    draw(e, Z, white) {
      const c = Z.ctx, aim = e.mode === 'aim', k = aim ? cl01(1 - e.mt / .6) : 0, kk = e.kick > 0 ? 1 : 0, OL = W(white, '#2a0a1c');
      const sw = Math.sin(e.ph * 4 + e.seed), sl = e.ph * 6 + e.seed, w1 = Math.sin(sl), w2 = Math.sin(sl - 1.6);
      c.save(); c.translate(e.x, e.y); face(c, e);
      c.rotate(aim ? -.08 * k : kk ? -.1 : sw * .035);
      c.lineCap = 'round'; c.lineJoin = 'round';
      // hood: a cobra cowl ribbed with spines. Far lobe first (darker), the near lobe after the body.
      const fl = 1 + k * .4, hx = 0, hy = -21, R = 13.5 * fl, a0 = -3.5 - k * .3, a1 = -.95 + k * .2, n = 7;
      const fan = (p, ox, oy, s, sp) => {
        p.moveTo(hx + ox + 3, hy + oy + 7);
        for (let j = 0; j <= n; j++) {
          const a = a0 + (a1 - a0) * j / n, r = R * s * (j === 0 || j === n ? .8 : 1);
          if (j) { const am = a - (a1 - a0) / n * .5; p.lineTo(hx + ox + Math.cos(am) * r * .78, hy + oy + Math.sin(am) * r * .78); }
          p.lineTo(hx + ox + Math.cos(a) * (r + sp), hy + oy + Math.sin(a) * (r + sp));
        }
        p.lineTo(hx + ox + 6, hy + oy + 2); p.closePath();
      };
      const hf = new Path2D(); fan(hf, -3, 1.5, .88, 2);
      c.fillStyle = W(white, '#6a2246'); c.fill(hf); c.strokeStyle = OL; c.lineWidth = 1.2; c.stroke(hf);
      // tail: thick and low, trailing back along the ground in a slithering S
      const tl = new Path2D(); tl.moveTo(0, 5); tl.bezierCurveTo(-7, 10 + w1 * 1.5, -13, 3 + w2 * 2, -20, 7 + w1 * 2);
      const tt = new Path2D(); tt.moveTo(-20, 7 + w1 * 2); tt.quadraticCurveTo(-26, 10 + w2 * 2.5, -32, 7 + w1 * 2.5);
      c.strokeStyle = OL; c.lineWidth = 9; c.stroke(tl); c.lineWidth = 5.5; c.stroke(tt);
      c.strokeStyle = W(white, '#8a3058'); c.lineWidth = 6.6; c.stroke(tl); c.lineWidth = 3.2; c.stroke(tt);
      if (!white) {
        const tp = new Path2D(); for (let i = 0; i < 4; i++) { const t = i / 4, x = -4 - t * 22, y = 3.6 + (i & 1 ? w2 : w1) * 1.6 - t * .5; tp.moveTo(x + 1.6, y); tp.lineTo(x - 1.4, y - 1.6 + t); }
        c.strokeStyle = '#e6d2ae'; c.lineWidth = 1.6; c.stroke(tp);
      }
      // arm pose: two scythes held forward and bent; raised in the windup, slashed down on the volley
      const aA = aim ? -1.05 - k * .25 : kk ? .35 : -.7 + sw * .12;
      const far = new Path2D(); far.moveTo(3, -13); far.lineTo(9, -7.5);
      c.strokeStyle = OL; c.lineWidth = 3.4; c.stroke(far); c.strokeStyle = W(white, '#5e1e40'); c.lineWidth = 1.8; c.stroke(far);
      const fb = new Path2D(); blade(fb, 9, -7.5, aA - .25, 15, 2.6, -1);
      c.fillStyle = W(white, '#b8a284'); c.fill(fb); c.strokeStyle = OL; c.lineWidth = 1.1; c.stroke(fb);
      // upright serpentine torso
      const ts = new Path2D(); ts.moveTo(-7, 7); ts.quadraticCurveTo(-10, -6, -4, -15); ts.quadraticCurveTo(-1, -22, 5, -22);
      ts.quadraticCurveTo(10, -14, 7, -6); ts.quadraticCurveTo(4, 2, 8, 8); ts.closePath();
      c.strokeStyle = OL; c.lineWidth = 1.8; c.stroke(ts); c.fillStyle = W(white, '#8e3460'); c.fill(ts);
      if (!white) {
        // lighter pink belly scutes down the front
        const bl = new Path2D(); bl.moveTo(4.5, -19); bl.quadraticCurveTo(9.2, -13, 6.6, -6); bl.quadraticCurveTo(3.6, 2, 7.6, 7.6); bl.lineTo(3, 7.6); bl.quadraticCurveTo(.5, 0, 3.4, -7); bl.quadraticCurveTo(5.6, -13, 3, -18); bl.closePath();
        c.fillStyle = '#e48cae'; c.fill(bl);
        const sc = new Path2D(); for (let i = 0; i < 5; i++) { const y = -15 + i * 4.4, x = 4.6 - (i === 3 ? 1.6 : i === 4 ? .6 : 0) + (i < 2 ? .8 : 0); sc.moveTo(x - 1.6, y); sc.lineTo(x + 2.2, y + .5); }
        c.strokeStyle = '#b24e7a'; c.lineWidth = 1; c.stroke(sc);
      }
      // ridged chitin down the back: bony ivory plates
      const bp = new Path2D();
      for (const [x, y, a] of [[-6.5, 2, 3.5], [-8, -4, 3.3], [-7.2, -10, 3.05], [-4.4, -15.5, 2.75]]) poly(bp, [x + Math.cos(a - 1.5) * 2.6, y + Math.sin(a - 1.5) * 2.6, x + Math.cos(a) * 5, y + Math.sin(a) * 5 - 1.2, x + Math.cos(a + 1.5) * 2.6, y + Math.sin(a + 1.5) * 2.6]);
      c.fillStyle = W(white, '#ecdcbc'); c.fill(bp); c.strokeStyle = OL; c.lineWidth = 1; c.stroke(bp);
      // near hood lobe
      const hn = new Path2D(); fan(hn, 0, 0, 1, 3);
      c.fillStyle = W(white, '#a83c6e'); c.fill(hn); c.strokeStyle = OL; c.lineWidth = 1.3; c.stroke(hn);
      if (!white) {
        const rb = new Path2D(), tp = new Path2D();
        for (let j = 0; j <= n; j++) {
          const a = a0 + (a1 - a0) * j / n, r = R * (j === 0 || j === n ? .8 : 1);
          rb.moveTo(hx + 3, hy + 5); rb.lineTo(hx + Math.cos(a) * r * .95, hy + Math.sin(a) * r * .95);
          tp.moveTo(hx + Math.cos(a) * r * .8, hy + Math.sin(a) * r * .8); tp.lineTo(hx + Math.cos(a) * (r + 3), hy + Math.sin(a) * (r + 3));
        }
        c.strokeStyle = '#4e1232'; c.lineWidth = 1.2; c.stroke(rb);
        c.strokeStyle = '#efe0c4'; c.lineWidth = 1.5; c.stroke(tp);
      }
      // narrow, forward-thrusting fanged head
      const lun = aim ? k * 2 : kk ? 3 : 0, hh = new Path2D();
      hh.moveTo(2, -25.5); hh.quadraticCurveTo(10 + lun, -28.5, 18 + lun, -23.6); hh.lineTo(17.4 + lun, -21.4); hh.quadraticCurveTo(10 + lun, -19.6, 3, -19); hh.closePath();
      c.fillStyle = W(white, '#9a3a68'); c.fill(hh); c.strokeStyle = OL; c.lineWidth = 1.4; c.stroke(hh);
      const gape = aim ? 1 + k * 2.2 : kk ? 2.6 : .6, fg = new Path2D();
      fg.moveTo(16.4 + lun, -21.6); fg.quadraticCurveTo(18.4 + lun, -21, 18 + lun, -19.2 + gape); fg.moveTo(13 + lun, -20.2); fg.quadraticCurveTo(14.8 + lun, -19.6, 14.4 + lun, -18 + gape);
      c.strokeStyle = W(white, '#f2e4c8'); c.lineWidth = 1.5; c.stroke(fg);
      if (!white) {
        const cr = new Path2D(); cr.moveTo(3.5, -25.4); cr.quadraticCurveTo(10 + lun, -28, 16 + lun, -24.6); cr.quadraticCurveTo(10 + lun, -25.8, 4, -23.4); cr.closePath();
        c.fillStyle = '#dcbc90'; c.fill(cr);
        c.fillStyle = '#ffd848'; c.fillRect(10.4 + lun, -24.2, 2.2, 1.4); c.fillRect(13.6 + lun, -24, 1.6, 1.2);
        Z.glow('255,215,70', 5 + k * 3, 12 + lun, -23.6, .55 + k * .3);
        if (aim || kk) { Z.glow('255,210,80', 10 + k * 14, 17 + lun, -20.5, .5 + k * .45); c.fillStyle = '#fff2a8'; c.fillRect(15 + lun, -21.4, 3, 1.4 + gape * .6); }
      }
      // near scythe arm
      const nr = new Path2D(); nr.moveTo(5, -12); nr.lineTo(12, -6.5);
      c.strokeStyle = OL; c.lineWidth = 3.8; c.stroke(nr); c.strokeStyle = W(white, '#7e2c56'); c.lineWidth = 2.2; c.stroke(nr);
      const nb = new Path2D(); blade(nb, 12, -6.5, aA, 17, 3, -1);
      c.fillStyle = W(white, '#efdcc0'); c.fill(nb); c.strokeStyle = OL; c.lineWidth = 1.2; c.stroke(nb);
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y - 10, '#8a3a5e', 10, 90); },
  };

  // Roach: armoured acid bug. Burrows into a creep mound, tunnels close, pops up and spits an acid glob.
  const roach = {
    hp: 80, sp: 38, dmg: 13, xp: 6, r: 16, heavy: true, eye: false,
    init(e, Z) { e.mode = 'walk'; e.t1 = Z.rnd(2.5, 4.5); e.t2 = Z.rnd(1.5, 3); e.tx = 0; e.ty = 0; e.fired = false; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e), a = Z.angTo(e);
      switch (e.mode) {
        case 'dig': Z.move(e, 0, 0); if ((e.mt -= dt) <= 0) { e.mode = 'tunnel'; e.mt = 2.4; } return;
        case 'tunnel': {
          const oa = a + PI + e.seed, tx = Z.P.x + Math.cos(oa) * 95, ty = Z.P.y + Math.sin(oa) * 95, dx = tx - e.x, dy = ty - e.y, dd = Math.hypot(dx, dy) || 1;
          Z.move(e, dx / dd * 165, dy / dd * 165); e.ang = Math.atan2(dy, dx);
          if ((e.mt -= dt) <= 0 || dd < 14) { e.mode = 'pop'; e.mt = .55; Z.hazard(e.x, e.y, { r: 42, t: .55, dmg: 10, col: SPK }); Z.sfx('warn'); }
          return;
        }
        case 'pop': Z.move(e, 0, 0); e.ang = a; if ((e.mt -= dt) <= 0) { e.mode = 'spit'; e.mt = .5; e.fired = false; Z.burst(e.x, e.y, '#5c2a4a', 10, 110); Z.shake(2); } return;
        case 'spit':
          Z.move(e, 0, 0); e.ang = a;
          if (!e.fired && (e.mt -= dt) <= .15) {
            e.fired = true; Z.sfx('shoot');
            Z.shoot(e.x + Math.cos(a) * 18, e.y + Math.sin(a) * 18, a, 185, { r: 8, dmg: 10, life: 3.5, col: '150,255,60' });
          }
          if (e.fired && (e.mt -= dt) <= 0) { e.mode = 'walk'; e.t1 = Z.rnd(3, 5); e.t2 = Z.rnd(2, 3.5); }
          return;
        default:
          Z.chase(e);
          e.t1 -= dt; e.t2 -= dt;
          if (e.t1 <= 0 && d > 170 && d < 650) { e.mode = 'dig'; e.mt = .6; Z.burst(e.x, e.y, '#5c2a4a', 8, 80); }
          else if (e.t2 <= 0 && d < 260) { e.mode = 'spit'; e.mt = .65; e.fired = false; }
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, m = e.mode, OL = W(white, '#260a0c');
      const under = m === 'tunnel', v = m === 'dig' ? Math.max(.05, e.mt / .6) : m === 'pop' ? Math.max(.05, 1 - e.mt / .55) : 1;
      c.save(); c.translate(e.x, e.y);
      if (m === 'dig' || m === 'tunnel' || m === 'pop') {
        const mk = under ? 1 + Math.sin(Z.now * 14 + e.seed) * .08 : .7 + (1 - v) * .3, md = new Path2D(), ck = new Path2D();
        ell(md, 0, 2, 17 * mk, 11 * mk);
        for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + e.seed; ck.moveTo(Math.cos(a) * 4, 2 + Math.sin(a) * 3); ck.lineTo(Math.cos(a) * 13 * mk, 2 + Math.sin(a) * 8 * mk); }
        c.fillStyle = W(white, '#6a3058'); c.fill(md); c.strokeStyle = W(white, '#200818'); c.lineWidth = 1.6; c.stroke(md);
        if (!white) {
          c.strokeStyle = '#2a0a20'; c.lineWidth = 1.4; c.stroke(ck);
          const dt = new Path2D(); for (let i = 0; i < 4; i++) { const a = Z.now * 6 + i * 1.6 + e.seed, r = 16 + Math.sin(Z.now * 9 + i) * 3; circ(dt, Math.cos(a) * r, 2 + Math.sin(a) * r * .6, 1.8); }
          c.fillStyle = '#9a6a58'; c.fill(dt);
          if (m === 'pop') Z.glow('150,255,60', 14 + (1 - v) * 10, 0, 0, .5);
        }
        if (under) { c.restore(); return; }
      }
      c.rotate(e.ang); c.scale(v, v);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const wk = m === 'walk' ? e.ph * 12 + e.seed : 0, lg = new Path2D();
      for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) {
        const q = Math.sin(wk + i * 2.1 + (sd > 0 ? PI : 0)), bx = 6 - i * 7;
        lg.moveTo(bx, sd * 8); lg.lineTo(bx + 2 + q * 3, sd * 15); lg.lineTo(bx - 2 + q * 4, sd * 20);
      }
      c.strokeStyle = OL; c.lineWidth = 3.6; c.stroke(lg); c.strokeStyle = W(white, '#6a3028'); c.lineWidth = 1.9; c.stroke(lg);
      const sh = new Path2D(); ell(sh, -3, 0, 15, 11.5);
      c.strokeStyle = OL; c.lineWidth = 2; c.stroke(sh); c.fillStyle = W(white, '#a85a3a'); c.fill(sh);
      if (!white) {
        const hi = new Path2D(); ell(hi, -2, -4, 10, 4.5); ell(hi, -9, -3, 4, 3); c.fillStyle = '#c87c50'; c.fill(hi);
        const sg = new Path2D(); for (const x of [-11, -4, 3]) { sg.moveTo(x - 1, -11); sg.quadraticCurveTo(x + 3, 0, x - 1, 11); }
        c.strokeStyle = '#4a1e14'; c.lineWidth = 1.4; c.stroke(sg);
        const rg = new Path2D(); rg.moveTo(-16, 0); rg.lineTo(9, 0); c.strokeStyle = '#e8c08e'; c.lineWidth = 1.6; c.stroke(rg);
        const ac = new Path2D(); ell(ac, -11, -8.5, 3.6, 2.2); ell(ac, -11, 8.5, 3.6, 2.2); ell(ac, -16.5, 0, 2.4, 3.2);
        c.fillStyle = '#9cff40'; c.fill(ac);
        Z.glow('150,255,60', 12, -12, 0, .5);
      }
      const hd = new Path2D(); ell(hd, 13, 0, 6.5, 6.8);
      c.fillStyle = W(white, '#7a3a32'); c.fill(hd); c.strokeStyle = OL; c.lineWidth = 1.6; c.stroke(hd);
      const spit = m === 'spit' && !e.fired, mb = new Path2D(), op = spit ? .5 : .15;
      mb.moveTo(17, -3); mb.quadraticCurveTo(22, -3 - op * 6, 23, 1 - op * 4); mb.moveTo(17, 3); mb.quadraticCurveTo(22, 3 + op * 6, 23, -1 + op * 4);
      c.strokeStyle = OL; c.lineWidth = 3.2; c.stroke(mb); c.strokeStyle = W(white, '#efdcc0'); c.lineWidth = 1.7; c.stroke(mb);
      if (!white) {
        c.fillStyle = '#ffd040'; c.fillRect(14, -4.4, 2, 1.8); c.fillRect(14, 2.6, 2, 1.8);
        if (spit) Z.glow('150,255,60', 10 + (1 - e.mt / .65) * 14, 21, 0, .85);
      }
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#a85a3a', 12, 100); Z.burst(e.x, e.y, '#9cff40', 6, 80); },
  };

  /* ================= Miniboss: Rendtusk the Unstoppable (an ultralisk) ================= */
  const BPAT = ['cleave', 'charge', 'slam', 'brood', 'cleave', 'charge', 'banes', 'slam'];
  const cleaveSet = (e, Z, T) => {
    e.mode = 'cleave'; e.mt = T; e.mtc = T; e.sa = Z.angTo(e); e.swung = false; e.swT = 0; Z.sfx('charge');
    for (let i = -3; i <= 3; i++) { const a = e.sa + i * .33; Z.hazard(e.x + Math.cos(a) * 88, e.y + Math.sin(a) * 88, { r: 46, t: T - .4, dmg: 18, col: CLV }); }
    for (let i = -2; i <= 2; i++) { const a = e.sa + i * .4; Z.hazard(e.x + Math.cos(a) * 165, e.y + Math.sin(a) * 165, { r: 44, t: T - .35, dmg: 16, col: CLV }); }
  };
  const bStart = (e, Z, m) => {
    e.mode = m; e.slammed = false;
    switch (m) {
      case 'walk': e.mt = (e.rage ? .8 : 1.4) + Math.random() * .6; return;
      case 'cleave': e.second = false; cleaveSet(e, Z, 1.3); return;
      case 'charge': e.mt = 1.25; e.ca = Z.angTo(e); e.nch = e.rage ? 2 : 1; Z.sfx('warn'); return;
      case 'slam': e.mt = 1.6; Z.sfx('charge'); Z.hazard(e.x, e.y, { r: 118, t: .8, dmg: 18, col: SPK }); return;
      case 'brood': {
        e.mt = 1.3; Z.sfx('boss'); Z.banner('An egg clutch splits open!', '#ffb070', false);
        const n = e.rage ? 8 : 6;
        for (let i = 0; i < n; i++) {
          const a = i / n * TAU + e.ph, x = e.x + Math.cos(a) * (e.r + 46), y = e.y + Math.sin(a) * (e.r + 46), k = Z.spawn('ling', x, y);
          if (k) { k.mode = 'hatch'; k.mt = .7 + i * .05; k.pk = false; k.packed = true; }
        }
        return;
      }
      case 'banes': {
        e.mt = 1.2; Z.sfx('warn'); Z.banner('Banelings roll in!', '#a8ff5a', false);
        const n = e.rage ? 6 : 4, b0 = Z.angTo(e) + PI;
        for (let i = 0; i < n; i++) { const a = b0 + (i - (n - 1) / 2) * .45; Z.spawn('bane', e.x + Math.cos(a) * (e.r + 30), e.y + Math.sin(a) * (e.r + 30)); }
        return;
      }
      default: e.mode = 'walk'; e.mt = 1;
    }
  };
  const boss = {
    name: 'Rendtusk the Unstoppable', hp: 4000, sp: 48, dmg: 26, xp: 0, r: 52, heavy: true, eye: false,
    init(e) { e.mode = 'walk'; e.mt = 2; e.pi = 0; e.rage = false; e.sa = 0; e.mtc = 1; e.swung = false; e.swT = 0; e.ca = 0; e.nch = 0; e.drop = 0; e.slammed = false; e.second = false; e.slT = 0; },
    update(e, Z) {
      const dt = Z.dt;
      if (!e.rage && e.hp < e.max * .4) {
        e.rage = true; e.sp *= 1.35; Z.banner('Rendtusk goes berserk!', '#ff5ad8', true); Z.sfx('boss'); Z.shake(12);
        Z.ring(e.x, e.y - 10, 18, 150, { r: 6, dmg: 9, col: '255,206,70' }, e.ph);
      }
      if (e.slT > 0) e.slT -= dt;
      e.mt -= dt;
      switch (e.mode) {
        case 'walk': {
          const d = Z.dist(e);
          if (d > 150) Z.chase(e);
          else { const a = Z.angTo(e) + PI / 2; Z.move(e, Math.cos(a) * e.sp * .5, Math.sin(a) * e.sp * .5); e.ang = Z.angTo(e); }
          if (e.mt <= 0) bStart(e, Z, BPAT[e.pi++ % BPAT.length]);
          break;
        }
        case 'cleave':
          Z.move(e, 0, 0); e.ang = e.sa;
          if (!e.swung && e.mt <= .4) { e.swung = true; e.swT = .3; Z.shake(7); Z.sfx('nova'); }
          if (e.swT > 0) e.swT -= dt;
          if (e.mt <= 0) { if (e.rage && !e.second) { e.second = true; cleaveSet(e, Z, .95); } else bStart(e, Z, 'walk'); }
          break;
        case 'charge':
          Z.move(e, 0, 0);
          if (e.mt > .45) { let da = Z.angTo(e) - e.ca; da = Math.atan2(Math.sin(da), Math.cos(da)); e.ca += da * Math.min(1, dt * 3.5); }
          e.ang = e.ca;
          if (e.mt <= 0) { e.mode = 'dash'; e.mt = .85; e.drop = 0; Z.sfx('nova'); Z.shake(4); }
          break;
        case 'dash':
          Z.move(e, Math.cos(e.ca) * 560, Math.sin(e.ca) * 560); e.ang = e.ca;
          if ((e.drop -= dt) <= 0) {
            e.drop = .065;
            const x = e.x - Math.cos(e.ca) * 34, y = e.y - Math.sin(e.ca) * 34;
            Z.hazard(x, y, { r: 34, t: .5, dmg: 12, col: SPK }); spike(Z, x, y, .5);
          }
          if (e.mt <= 0) {
            if (--e.nch > 0) { e.mode = 'charge'; e.mt = .85; e.ca = Z.angTo(e); Z.sfx('warn'); }
            else { e.mode = 'rec'; e.mt = .7; }
          }
          break;
        case 'slam':
          Z.move(e, 0, 0); e.ang = Z.angTo(e);
          if (!e.slammed && e.mt <= .8) {
            e.slammed = true; e.slT = .4; Z.shake(11); Z.sfx('nova');
            const n = e.rage ? 8 : 6, off = Math.random() * TAU;
            for (let j = 0; j < n; j++) {
              const a = off + j * TAU / n;
              for (let i = 0; i < 7; i++) { const d = e.r + 34 + i * 46, x = e.x + Math.cos(a) * d, y = e.y + Math.sin(a) * d, t = .32 + i * .07; Z.hazard(x, y, { r: 30, t, dmg: 14, col: SPK }); spike(Z, x, y, t); }
            }
          }
          if (e.mt <= 0) bStart(e, Z, 'walk');
          break;
        default:
          Z.move(e, 0, 0); e.ang = Z.angTo(e);
          if (e.mt <= 0) bStart(e, Z, 'walk');
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 52, m = e.mode, now = Z.now, OL = W(white, '#24081a');
      c.save(); c.translate(e.x, e.y); c.scale(s, s);
      c.lineCap = 'round'; c.lineJoin = 'round';
      if (!white) {
        if (m === 'cleave' && !e.swung) {
          const k = cl01(1 - (e.mt - .4) / Math.max(.1, e.mtc - .4)), wd = new Path2D();
          wd.moveTo(0, 0); wd.arc(0, 0, 190 * K, e.sa - 1.12, e.sa + 1.12); wd.closePath();
          c.globalAlpha = .1 + .22 * k; c.fillStyle = '#ff5ad8'; c.fill(wd); c.globalAlpha = .5 + .4 * k; c.strokeStyle = '#ffd2f4'; c.lineWidth = 2; c.stroke(wd); c.globalAlpha = 1;
        }
        if (m === 'charge') {
          const k = cl01(1 - (e.mt - .45) / .8);
          c.save(); c.rotate(e.ca); c.globalAlpha = .1 + .22 * k + .06 * Math.sin(now * 22); c.fillStyle = '#ff5ad8'; c.fillRect(20 * K, -48 * K, 500 * K, 96 * K);
          c.globalAlpha = .45 + .4 * k; c.strokeStyle = '#ffd2f4'; c.lineWidth = 1.6; c.strokeRect(20 * K, -48 * K, 500 * K, 96 * K); c.restore(); c.globalAlpha = 1;
        }
        if (m === 'slam' && !e.slammed) {
          const k = cl01(1 - (e.mt - .8) / .8);
          c.globalAlpha = .3 + .5 * k; c.strokeStyle = '#ff80e8'; c.lineWidth = 2 + k * 2; c.beginPath(); c.arc(0, 0, (118 + (1 - k) * 30) * K, 0, TAU); c.stroke(); c.globalAlpha = 1;
        }
        if (e.rage) { c.globalAlpha = .35 + .2 * Math.sin(now * 7); c.strokeStyle = '#ff4a6a'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 62 + Math.sin(now * 5) * 3, 0, TAU); c.stroke(); c.globalAlpha = 1; }
        Z.glow('200,60,170', 86, 0, -12, .25);
      }
      const rear = m === 'slam' && !e.slammed ? cl01(1 - (e.mt - .8) / .8) : e.slT > 0 ? -e.slT * .25 : 0;
      const dash = m === 'dash', walk = m === 'walk' || dash, wk = e.ph * (dash ? 16 : 5.5);
      face(c, e);
      if (dash) c.rotate(.07);
      if (rear) { c.translate(-34, 36); c.rotate(-rear * .3); c.translate(34, -36); }
      // blade pose
      let bA = -.3 + Math.sin(e.ph * 2.2) * .06;
      if (m === 'cleave') bA = e.swung ? -1.7 + cl01(1 - e.swT / .3) * 2.4 : -1.7 - Math.sin(now * 18) * .04;
      else if (m === 'charge' || dash) bA = .12;
      else if (m === 'slam') bA = e.slammed ? .3 : -1.25;
      else if (m === 'brood' || m === 'banes') bA = -.9;
      // far legs and far blades
      const st = q => (walk ? Math.sin(wk + q) : 0);
      const lf = new Path2D();
      for (const [bx, q] of [[-28, PI], [30, 0]]) { lf.moveTo(bx, 4); lf.lineTo(bx - 6 + st(q) * 7, 22); lf.lineTo(bx - 2 + st(q) * 10, 38); }
      c.strokeStyle = OL; c.lineWidth = 13; c.stroke(lf); c.strokeStyle = W(white, '#5a2440'); c.lineWidth = 9.5; c.stroke(lf);
      const bf = new Path2D(); blade(bf, 20, -40, bA - .12, 94, 11, -1); blade(bf, 26, -28, bA + .3, 78, 9, -1);
      c.fillStyle = W(white, '#bba98a'); c.fill(bf); c.strokeStyle = OL; c.lineWidth = 1.6; c.stroke(bf);
      // body
      const bd = new Path2D(); bd.moveTo(-58, 8); bd.quadraticCurveTo(-68, -30, -38, -50); bd.quadraticCurveTo(-6, -72, 24, -52);
      bd.quadraticCurveTo(46, -40, 48, -14); bd.quadraticCurveTo(52, 8, 36, 18); bd.lineTo(-44, 20); bd.quadraticCurveTo(-60, 18, -58, 8); bd.closePath();
      c.strokeStyle = OL; c.lineWidth = 2.4; c.stroke(bd); c.fillStyle = W(white, '#8e3e62'); c.fill(bd);
      if (!white) {
        const bl = new Path2D(); bl.moveTo(-50, 10); bl.quadraticCurveTo(-4, 2, 40, 6); bl.quadraticCurveTo(44, 14, 34, 18); bl.lineTo(-44, 20); bl.closePath();
        c.fillStyle = '#cf9e76'; c.fill(bl);
        const rb = new Path2D(); for (let i = 0; i < 8; i++) { const x = -40 + i * 10; rb.moveTo(x, 8 - i * .2); rb.lineTo(x - 2, 19); }
        c.strokeStyle = '#7a4a36'; c.lineWidth = 1.4; c.stroke(rb);
        // glowing pores along the flank
        const gp = new Path2D(); for (let i = 0; i < 4; i++) circ(gp, -34 + i * 16, -6 + (i & 1) * 4, 2.6);
        c.fillStyle = '#ffa040'; c.fill(gp);
        Z.glow('255,150,60', 14 + Math.sin(now * 4) * 3, -18, -4, .6);
      }
      // ridged carapace plates and spikes
      const pl = new Path2D(), ph = new Path2D(), sk = new Path2D();
      for (const [px, py, R, a1, a2] of [[-44, -26, 26, PI * .95, PI * 1.75], [-20, -42, 28, PI * 1.05, PI * 1.85], [6, -44, 27, PI * 1.12, PI * 1.92], [28, -30, 24, PI * 1.25, PI * 2.05]]) {
        pl.moveTo(px + Math.cos(a1) * R, py + Math.sin(a1) * R); pl.arc(px, py, R, a1, a2); pl.arc(px, py + 4, R - 11, a2, a1, true); pl.closePath();
        ph.moveTo(px + Math.cos(a1 + .1) * (R - 2), py + Math.sin(a1 + .1) * (R - 2)); ph.arc(px, py, R - 2, a1 + .1, a2 - .1);
        const am = (a1 + a2) / 2, sx = px + Math.cos(am) * R, sy = py + Math.sin(am) * R;
        poly(sk, [sx - Math.sin(am) * 5, sy + Math.cos(am) * 5, sx + Math.sin(am) * 5, sy - Math.cos(am) * 5, sx + Math.cos(am - .5) * 14, sy + Math.sin(am - .5) * 16]);
      }
      c.fillStyle = W(white, '#c27c48'); c.fill(pl); c.strokeStyle = OL; c.lineWidth = 1.5; c.stroke(pl);
      if (!white) { c.strokeStyle = '#f2c48c'; c.lineWidth = 1.8; c.stroke(ph); }
      c.fillStyle = W(white, '#eadcc0'); c.fill(sk); c.strokeStyle = OL; c.lineWidth = 1.2; c.stroke(sk);
      // near legs
      const ln = new Path2D(), cw = new Path2D();
      for (const [bx, q] of [[-36, 0], [22, PI]]) {
        const kx = bx - 5 + st(q) * 7, fx = bx + st(q) * 10;
        ln.moveTo(bx, 6); ln.lineTo(kx, 24); ln.lineTo(fx, 40);
        for (const o of [-6, 0, 6]) poly(cw, [fx + o - 2.5, 39, fx + o + 2.5, 39, fx + o * 1.4 + 3, 46]);
      }
      c.strokeStyle = OL; c.lineWidth = 14.5; c.stroke(ln); c.strokeStyle = W(white, '#7e3658'); c.lineWidth = 11; c.stroke(ln);
      if (!white) { c.strokeStyle = '#b8743e'; c.lineWidth = 3; c.stroke(ln); }
      c.fillStyle = W(white, '#eadcc0'); c.fill(cw); c.strokeStyle = OL; c.lineWidth = 1; c.stroke(cw);
      // small armoured head with a glowing maw
      const jaw = m === 'cleave' || m === 'slam' || dash ? 6 : 2 + Math.sin(now * 3) * 1.5;
      const hd = new Path2D(); hd.moveTo(40, -18); hd.quadraticCurveTo(62, -20, 68, -4); hd.quadraticCurveTo(70, 8, 58, 14); hd.quadraticCurveTo(46, 16, 40, 6); hd.closePath();
      c.fillStyle = W(white, '#9a4a6a'); c.fill(hd); c.strokeStyle = OL; c.lineWidth = 1.8; c.stroke(hd);
      if (!white) {
        const hp = new Path2D(); hp.moveTo(42, -16); hp.quadraticCurveTo(60, -20, 66, -8); hp.quadraticCurveTo(54, -10, 42, -8); hp.closePath();
        c.fillStyle = '#c88a56'; c.fill(hp);
        const mw = new Path2D(); poly(mw, [56, 4, 72, 2 + jaw, 58, 12 + jaw * .4]);
        c.fillStyle = '#2a0812'; c.fill(mw);
        const mi = new Path2D(); ell(mi, 62, 6 + jaw * .4, 4, 2 + jaw * .3); c.fillStyle = '#ff7a2a'; c.fill(mi);
        Z.glow('255,120,40', 16 + jaw * 2, 62, 6, .8);
        c.fillStyle = e.rage ? '#ff4060' : '#ffd040'; c.fillRect(56, -8, 3, 2.4); c.fillRect(61, -7, 2.4, 2);
      }
      // near kaiser blades
      const bn = new Path2D(), be = new Path2D();
      blade(bn, 24, -38, bA + .08, 100, 12, -1); blade(bn, 32, -24, bA + .5, 82, 10, -1);
      for (const [sx, sy, a, L] of [[24, -38, bA + .08, 100], [32, -24, bA + .5, 82]]) { be.moveTo(sx + Math.cos(a) * 12, sy + Math.sin(a) * 12); be.quadraticCurveTo(sx + Math.cos(a) * L * .5 + Math.sin(a) * 15, sy + Math.sin(a) * L * .5 - Math.cos(a) * 15, sx + Math.cos(a) * L * .94, sy + Math.sin(a) * L * .94); }
      c.fillStyle = W(white, '#f0e2c6'); c.fill(bn); c.strokeStyle = OL; c.lineWidth = 1.8; c.stroke(bn);
      if (!white) {
        c.strokeStyle = 'rgba(255,250,236,.85)'; c.lineWidth = 1.4; c.stroke(be);
        if (m === 'cleave' && !e.swung) Z.glow('255,140,230', 26, 24 + Math.cos(bA) * 70, -38 + Math.sin(bA) * 70, .7);
        if (m === 'cleave' && e.swung && e.swT > 0) {
          const tr = new Path2D(); tr.arc(24, -38, 88, -1.7, bA); c.globalAlpha = cl01(e.swT / .3) * .75; c.strokeStyle = '#ffc8f2'; c.lineWidth = 9; c.stroke(tr); c.globalAlpha = 1;
        }
      }
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#8e3e62', 40, 230); Z.burst(e.x, e.y - 20, '#ffa040', 24, 180); Z.burst(e.x, e.y, '#eadcc0', 16, 160); Z.shake(15); },
  };

  /* ================= Events ================= */
  const spot = (Z, d) => { const a = Math.random() * TAU; return { x: Z.P.x + Math.cos(a) * d, y: Z.P.y + Math.sin(a) * d, a }; };
  const pack = (Z, n, d) => {
    const p = spot(Z, d);
    for (let i = 0; i < n; i++) { const k = Z.spawn('ling', p.x + Z.rnd(-45, 45), p.y + Z.rnd(-45, 45)); if (k) { k.pk = false; k.packed = true; } }
  };
  const fan = (Z, kind, n, d, spread) => {
    const a0 = Math.random() * TAU;
    for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * spread; Z.spawn(kind, Z.P.x + Math.cos(a) * d, Z.P.y + Math.sin(a) * d); }
  };
  const events = [
    { t: 6, run(Z) { Z.banner('The swarm hungers!', '#ff9ad8', true); Z.sfx('warn'); pack(Z, 5, 440); pack(Z, 5, 440); } },
    { t: 19, run(Z) { Z.banner('Banelings roll in!', '#a8ff5a', false); Z.sfx('warn'); fan(Z, 'bane', 6, 430, .22); } },
    { t: 32, run(Z) {
      Z.banner('Hydralisk den awakens!', '#ffc070', false); Z.sfx('warn');
      for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.random() * .6; Z.spawn('hydra', Z.P.x + Math.cos(a) * 430, Z.P.y + Math.sin(a) * 430); }
      pack(Z, 4, 420);
    } },
    { t: 58, run(Z) {
      Z.banner('Nydus worm! Something burrows…', '#d890ff', true); Z.sfx('boss'); Z.shake(6);
      const p = spot(Z, 240);
      addFx({ k: 'n', x: p.x, y: p.y, t0: Z.t, T: 5 });
      Z.hazard(p.x, p.y, { r: 84, t: 1.3, dmg: 16, col: SPK });
      for (let i = 0; i < 4; i++) {
        const a = i / 4 * TAU + .4, r = Z.spawn('roach', p.x + Math.cos(a) * 110, p.y + Math.sin(a) * 70);
        if (r) { r.mode = 'pop'; r.mt = 1.2 + i * .15; Z.hazard(r.x, r.y, { r: 42, t: r.mt, dmg: 10, col: SPK }); }
      }
      for (let i = 0; i < 4; i++) { const a = i / 4 * TAU, k = Z.spawn('ling', p.x + Math.cos(a) * 40, p.y + Math.sin(a) * 22); if (k) { k.mode = 'hatch'; k.mt = 1.4; k.pk = false; k.packed = true; } }
    } },
    { t: 76, run(Z) {
      Z.banner('The creep spreads…', '#c070ff', false); Z.sfx('warn');
      const a0 = Math.random() * TAU;
      for (let j = 0; j < 3; j++) {
        const a = a0 + j * TAU / 3, ph = Math.random() * 6;
        for (let i = 0; i < 8; i++) {
          const d = 330 - i * 38, w = Math.sin(i * .9 + ph) * 30, x = Z.P.x + Math.cos(a) * d - Math.sin(a) * w, y = Z.P.y + Math.sin(a) * d + Math.cos(a) * w, t = .7 + i * .12;
          Z.hazard(x, y, { r: 32, t, dmg: 12, col: SPK }); spike(Z, x, y, t);
        }
      }
      pack(Z, 6, 430);
    } },
    { t: 98, run(Z) { Z.banner('The swarm hungers!', '#ff9ad8', true); Z.sfx('warn'); pack(Z, 5, 430); pack(Z, 5, 450); } },
    { t: 118, run(Z) {
      Z.banner('Banelings roll in!', '#a8ff5a', false); Z.sfx('warn');
      const gap = fl(Math.random() * 10);
      for (let i = 0; i < 10; i++) { if (i === gap || i === (gap + 1) % 10) continue; const a = i / 10 * TAU; Z.spawn('bane', Z.P.x + Math.cos(a) * 460, Z.P.y + Math.sin(a) * 460); }
    } },
    { t: 136, run(Z) {
      Z.banner('Dawn breaks over the hive. Hold on!', '#ffd890', false); Z.sfx('warn');
      pack(Z, 5, 420); fan(Z, 'hydra', 2, 440, .5); fan(Z, 'roach', 2, 420, .6);
    } },
  ];

  /* ================= Music: original, alien and organic. D phrygian, 108 bpm, sixteenth-note grid ================= */
  const ROOT = 38;
  const PROG = [0, 0, 1, 0, 8, 8, 6, 7, 0, 0, 1, 3, 8, 6, 1, 0];
  const TRI = o => (o === 1 || o === 8 ? [0, 4, 7] : o === 6 ? [0, 3, 6] : [0, 3, 7]);
  const GR = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0];
  const CLK = ['x..x.x..x..xx.x.', '.x..x.xx..x..x.x'];
  // eerie lead phrases: [bar in phrase, step, semitones above D5, length in steps, glide target or null]
  const LEAD_A = [[0, 0, 7, 6, null], [0, 8, 8, 5, 7], [1, 4, 3, 10, null], [2, 0, 1, 4, null], [2, 6, 0, 8, -1], [3, 8, 6, 8, 5]];
  const LEAD_B = [[0, 0, 12, 8, 10], [1, 0, 8, 6, null], [1, 8, 7, 6, null], [2, 2, 1, 12, 0], [3, 12, 6, 4, null]];
  const music = {
    bpm: 108, div: 4,
    step(s, t, A) {
      const sp = 60 / 108 / 4, bar = fl(s / 16), b = s % 16, sec = bar % 16, o = PROG[sec], r = ROOT + o, boss = A.boss;
      const tri = TRI(o);
      if (!boss) {
        // drone: a low tonic pedal with a dark fifth, swelling every two bars
        if (b === 0 && sec % 2 === 0) {
          A.tone(t, 26, sp * 32, .04, { type: 'sawtooth', cutoff: 200, sweep: 480, detune: -8, attack: .5 });
          A.tone(t, 33, sp * 32, .022, { type: 'sawtooth', cutoff: 240, sweep: 380, detune: 9, attack: .7 });
        }
        // growling detuned saw bass
        if (GR[b]) {
          const gl = sec % 4 === 3 && b === 13 ? { glide: r - 5 } : {};
          A.tone(t, r, sp * 1.7, .06, Object.assign({ type: 'sawtooth', cutoff: 720, sweep: 170, detune: 14, q: 6 }, gl));
          A.tone(t, r, sp * 1.7, .03, { type: 'sawtooth', cutoff: 520, sweep: 150, detune: -16 });
        }
        // tribal toms and a soft kick
        if (b === 0 || b === 6 || b === 10) A.tom(t, b === 0 ? 68 : 78, b === 0 ? .4 : .3);
        if (b === 12) A.tom(t, 112, .22); else if (b === 14) A.tom(t, 96, .2);
        if (b === 0 || b === 8) A.kick(t, b === 0 ? .55 : .38);
        // wet clicks and chitin rattles
        if (CLK[bar % 2][b] === 'x') A.noise(t, .016, .024, { type: 'bandpass', f: 1900 + ((b * 397 + bar * 131) % 2200), q: 9 });
        if (b === 4 || b === 12) A.noise(t, .11, .018, { type: 'highpass', f: 4200, f2: 8500 });
        if (bar % 2 === 1 && b >= 13) { A.hat(t, .032, false); A.hat(t + sp / 2, .022, false); }
        // choir-like pad every four bars
        if (b === 0 && sec % 4 === 0) A.pad(tri.map(k => r + 24 + k), t, sp * 60, .013, { type: 'triangle', cutoff: 1200, q: 2, detune: 14 });
        // sparse eerie lead, gliding between notes
        const ph = sec >= 4 && sec < 8 ? LEAD_A : sec >= 12 ? LEAD_B : null;
        if (ph) {
          const pb = sec % 4;
          for (const [lb, ls, n, len, g] of ph) {
            if (lb !== pb || ls !== b) continue;
            const opt = { type: 'sine', vib: .5, attack: .08 };
            if (g !== null) opt.glide = 74 + g;
            A.tone(t, 74 + n, sp * len, .034, opt);
            A.tone(t, 62 + n, sp * len, .012, { type: 'triangle', attack: .12, cutoff: 1400 });
          }
        }
        if (sec === 15 && b === 8) A.bell(86, t, .03);
      } else {
        // boss: thunderous downbeats, four-on-the-floor kick, racing tribal toms
        if (b === 0) { A.tom(t, 46, .45); A.noise(t, .6, .06, { type: 'lowpass', f: 170 }); }
        if (b % 4 === 0) A.kick(t, b === 0 ? .75 : .6);
        if (b % 2 === 0 && b % 4 !== 0) A.tom(t, b % 8 === 2 ? 92 : 124, .3);
        if (b % 2 === 1 && (b === 7 || b === 15 || bar % 2 === 1)) A.tom(t, 150, .16);
        if (b === 4 || b === 12) A.snare(t, .28);
        A.hat(t, b % 4 === 2 ? .05 : .03, false);
        // relentless sixteenth-note growl bass
        A.tone(t, r + (b % 8 === 6 ? 12 : 0), sp * .9, .058, { type: 'sawtooth', cutoff: 520, sweep: 160, detune: 12, q: 5 });
        // dissonant brass-like stabs
        const stab = bar % 2 === 0 ? (b === 0 || b === 3 || b === 6) : (b === 0 || b === 10);
        if (stab) for (const k of [12, 13, 18]) A.tone(t, r + k, sp * 1.5, .024, { type: 'sawtooth', cutoff: 1500, sweep: 450, attack: .01 });
        // shrieking glides
        if (sec % 2 === 1 && b === 8) {
          const up = sec % 4 === 1;
          A.tone(t, up ? 84 : 97, sp * 8, .02, { type: 'square', glide: up ? 97 : 80, vib: .6, cutoff: 3400 });
        }
        if (b === 0 && sec % 4 === 0) A.pad(tri.map(k => r + 12 + k), t, sp * 60, .016, { type: 'sawtooth', cutoff: 700, q: 3, detune: 12 });
      }
    },
  };

  return {
    id: 'zerg', name: 'The Spawning Pools', nod: 'StarCraft II', portal: '170,60,200', bg: ASH, dark: .6, dim: .15,
    ground, under, ambient,
    mix: { ling: 4.5, bane: 1.4, hydra: 1.6, roach: 1.1 },
    target: .95,
    foes: { ling, bane, hydra, roach },
    boss, events, music,
  };
})());
