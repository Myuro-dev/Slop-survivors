// Zone: Grunt's Crossing. A nod to Warcraft II: a top-down 1995 RTS battlefield, drawn as a crisp 32px tile map,
// where a red-and-black warband marches on you.
ZONES.push((() => {
  const TAU = Math.PI * 2, T = 32, B = 12; // tile size, feature block size (tiles)
  const mod = (a, n) => ((a % n) + n) % n;
  const OL = '#0b0907';
  const kw = white => col => (white ? '#fff' : col);

  /* ---------- path helpers (static shapes are built once) ---------- */
  const circ = (p, x, y, r) => { p.moveTo(x + r, y); p.arc(x, y, r, 0, TAU); };
  const ell = (p, x, y, rx, ry) => { p.moveTo(x + rx, y); p.ellipse(x, y, rx, ry, 0, 0, TAU); };
  const poly = (p, a) => { p.moveTo(a[0], a[1]); for (let i = 2; i < a.length; i += 2) p.lineTo(a[i], a[i + 1]); p.closePath(); };
  const mk = (...fs) => { const p = new Path2D(); for (const f of fs) f(p); return p; };

  /* ---------- terrain classification (deterministic per 32px tile) ---------- */
  const GRASS = 0, FOREST = 1, WATER = 2, ROCK = 3, ROAD = 4, BRIDGE = 5, SCORCH = 6;
  const FARM = 1, TOWER = 2, MINE = 3, RUIN = 4;
  const FW = [0, 7, 3, 4, 5], FH = [0, 5, 3, 3, 4];
  function vn(Z, x, y, s, salt) {
    const gx = x / s, gy = y / s, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = Z.hash(ix * 7 + salt, iy * 11 - salt * 3), b = Z.hash(ix * 7 + 7 + salt, iy * 11 - salt * 3);
    const c = Z.hash(ix * 7 + salt, iy * 11 + 11 - salt * 3), d = Z.hash(ix * 7 + 7 + salt, iy * 11 + 11 - salt * 3);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  const roadH = (Z, tx, ty) => { const m = mod(ty, 24); return (m === 0 || m === 1) && Z.hash(Math.floor(tx / 12) + 40, Math.floor(ty / 24)) < .8; };
  const roadV = (Z, tx, ty) => { const m = mod(tx, 36); return (m === 0 || m === 1) && Z.hash(Math.floor(ty / 12) - 40, Math.floor(tx / 36) + 7) < .8; };
  // One optional feature per 12x12-tile block, always clear of the roads (which sit on block rows/cols 0-1).
  function featAt(Z, bx, by) {
    const hs = Z.hash(bx * 13 + 5, by * 17 - 2);
    const type = hs < .16 ? FARM : hs < .27 ? TOWER : hs < .36 ? MINE : hs < .54 ? RUIN : 0;
    if (!type) return null;
    const w = FW[type], h = FH[type];
    return { type, w, h, lx: 2 + Math.floor(Z.hash(bx - 3, by + 8) * (10 - w)), ly: 2 + Math.floor(Z.hash(bx + 6, by - 9) * (10 - h)), bx, by };
  }
  const isWater = (Z, tx, ty) => vn(Z, tx, ty, 9, 3) > .7;
  function tileType(Z, tx, ty) {
    const bx = Math.floor(tx / B), by = Math.floor(ty / B), f = featAt(Z, bx, by);
    if (f) {
      const lx = tx - bx * B - f.lx, ly = ty - by * B - f.ly;
      if (lx >= -1 && lx <= f.w && ly >= -1 && ly <= f.h) return f.type === RUIN && lx >= 0 && ly >= 0 && lx < f.w && ly < f.h ? SCORCH : GRASS;
    }
    if (roadH(Z, tx, ty) || roadV(Z, tx, ty)) return isWater(Z, tx, ty) ? BRIDGE : ROAD;
    if (isWater(Z, tx, ty)) return WATER;
    if (vn(Z, tx, ty, 7, 19) > .74) return ROCK;
    if (vn(Z, tx, ty, 6, 41) + (Z.hash(tx * 3 + 1, ty * 5 + 2) - .5) * .1 > .6) return FOREST;
    return GRASS;
  }
  const ruinSpots = (Z, f, X0, Y0) => [
    [X0 + 30 + Z.hash(f.bx, f.by * 3) * 30, Y0 + 34 + Z.hash(f.bx * 3, f.by) * 20],
    [X0 + 104 + Z.hash(f.bx + 2, f.by) * 30, Y0 + 50 + Z.hash(f.bx, f.by + 2) * 26],
    [X0 + 52 + Z.hash(f.bx - 2, f.by) * 40, Y0 + 98 + Z.hash(f.bx, f.by - 2) * 14],
  ];

  // Water tiles (with shore flags) per 16x16-tile group, cached so `under` stays cheap.
  const wcache = new Map();
  function waterGroup(Z, gx, gy) {
    const key = gx + ',' + gy; let a = wcache.get(key);
    if (a) return a;
    if (wcache.size > 300) wcache.clear();
    a = [];
    const t0x = gx * 16 - 1, t0y = gy * 16 - 1, g = new Uint8Array(18 * 18);
    for (let j = 0; j < 18; j++) for (let i = 0; i < 18; i++) g[j * 18 + i] = tileType(Z, t0x + i, t0y + j);
    for (let j = 1; j < 17; j++) for (let i = 1; i < 17; i++) {
      if (g[j * 18 + i] !== WATER) continue;
      const land = t => t !== WATER && t !== BRIDGE;
      a.push(t0x + i, t0y + j, (land(g[(j - 1) * 18 + i]) ? 1 : 0) | (land(g[(j + 1) * 18 + i]) ? 2 : 0) | (land(g[j * 18 + i - 1]) ? 4 : 0) | (land(g[j * 18 + i + 1]) ? 8 : 0));
    }
    wcache.set(key, a); return a;
  }

  /* ---------- feature art (drawn straight into the cached floor) ---------- */
  function fillP(ctx, p, col) { ctx.fillStyle = col; ctx.fill(p); }
  function drawFarm(ctx, Z, f, X0, Y0) {
    const fw = 4 * T, fh = 5 * T, soil = new Path2D(), wheat = new Path2D(), crop = new Path2D(), cropL = new Path2D(), posts = new Path2D();
    soil.rect(X0, Y0, fw, fh);
    for (let y = Y0 + 6; y < Y0 + 2 * T + 10; y += 6) { wheat.rect(X0 + 6, y, fw - 12, 3); }
    for (let y = Y0 + 2 * T + 22; y < Y0 + fh - 6; y += 6) crop.rect(X0 + 6, y, fw - 12, 3);
    for (let i = 0; i < 26; i++) cropL.rect(X0 + 8 + Math.floor(Z.hash(f.bx * 9 + i, f.by) * 54) * 2, Y0 + 2 * T + 22 + Math.floor(Z.hash(f.bx, f.by * 9 + i) * 7) * 12, 2, 2);
    for (let x = X0; x <= X0 + fw; x += 16) { posts.rect(x - 2, Y0 - 2, 4, 4); if (x < X0 + 40 || x > X0 + 80) posts.rect(x - 2, Y0 + fh - 2, 4, 4); }
    for (let y = Y0 + 16; y < Y0 + fh; y += 16) { posts.rect(X0 - 2, y - 2, 4, 4); posts.rect(X0 + fw - 2, y - 2, 4, 4); }
    fillP(ctx, soil, '#5e4428'); fillP(ctx, wheat, '#ae9244'); fillP(ctx, crop, '#5f7e2e'); fillP(ctx, cropL, '#86a440');
    ctx.strokeStyle = '#6a4626'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(X0 + 40, Y0 + fh); ctx.lineTo(X0, Y0 + fh); ctx.lineTo(X0, Y0); ctx.lineTo(X0 + fw, Y0); ctx.lineTo(X0 + fw, Y0 + fh); ctx.lineTo(X0 + 80, Y0 + fh); ctx.stroke();
    fillP(ctx, posts, '#3a2614');
    // farmhouse: thatched roof over a timber-framed front wall
    const bx = X0 + 4 * T + 14, by = Y0 + T - 4, bw = 70, bh = 66, wh = 22;
    ctx.fillStyle = 'rgba(8,14,4,.45)'; ctx.fillRect(bx + 7, by + 9, bw, bh);
    ctx.fillStyle = OL; ctx.fillRect(bx - 3, by - 3, bw + 6, bh + 6);
    ctx.fillStyle = '#a88e64'; ctx.fillRect(bx, by + bh - wh, bw, wh);
    const beams = new Path2D(), thatch = new Path2D(), win = new Path2D();
    for (let x = bx; x < bx + bw; x += 14) beams.rect(x, by + bh - wh, 3, wh);
    beams.rect(bx, by + bh - wh, bw, 3); beams.rect(bx + bw / 2 - 7, by + bh - 15, 14, 15);
    win.rect(bx + 10, by + bh - 15, 7, 6); win.rect(bx + bw - 17, by + bh - 15, 7, 6);
    fillP(ctx, beams, '#4a2e18'); fillP(ctx, win, '#e8c860');
    const rh = bh - wh;
    ctx.fillStyle = '#b4743a'; ctx.fillRect(bx, by, bw, rh / 2);
    ctx.fillStyle = '#8a5226'; ctx.fillRect(bx, by + rh / 2, bw, rh / 2);
    for (let y = by + 4; y < by + rh; y += 5) for (let x = bx + ((y >> 2) & 1) * 4; x < bx + bw - 4; x += 9) thatch.rect(x, y, 5, 1.5);
    fillP(ctx, thatch, 'rgba(60,30,10,.45)');
    ctx.fillStyle = '#5a3014'; ctx.fillRect(bx - 2, by + rh / 2 - 2, bw + 4, 4);
    ctx.fillStyle = OL; ctx.fillRect(bx + bw - 22, by - 8, 12, 14);
    ctx.fillStyle = '#7c766c'; ctx.fillRect(bx + bw - 20, by - 6, 8, 10);
  }
  function drawTower(ctx, Z, f, X0, Y0) {
    const cx = X0 + 48, cy = Y0 + 50, R = 34;
    ctx.fillStyle = 'rgba(8,14,4,.45)'; ctx.beginPath(); ctx.ellipse(cx + 9, cy + 10, R + 2, R - 2, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = OL; ctx.beginPath(); ctx.arc(cx, cy, R + 3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8a8170'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    const mortar = new Path2D(), merl = new Path2D(), plank = new Path2D();
    circ(mortar, cx, cy, R - 9);
    for (let i = 0; i < 16; i++) {
      const a = i * TAU / 16 + (i & 1) * .1, r0 = i & 1 ? R - 9 : R - 4;
      mortar.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); mortar.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    }
    for (let i = 0; i < 10; i++) { const a = i * TAU / 10; merl.rect(cx + Math.cos(a) * (R - 5) - 4, cy + Math.sin(a) * (R - 5) - 4, 8, 8); }
    ctx.strokeStyle = '#4e473c'; ctx.lineWidth = 2; ctx.stroke(mortar);
    ctx.fillStyle = '#6a4a28'; ctx.beginPath(); ctx.arc(cx, cy, R - 11, 0, TAU); ctx.fill();
    for (let y = -R + 15; y < R - 11; y += 6) { const hc = Math.sqrt(Math.max(0, (R - 11) ** 2 - y * y)); plank.rect(cx - hc, cy + y, hc * 2, 1.5); }
    fillP(ctx, plank, '#3e2a16');
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.stroke(merl); fillP(ctx, merl, '#b0a690');
    ctx.fillStyle = '#2a1a0e'; ctx.fillRect(cx - 6, cy - 6, 12, 12);
    // a pennant in the defenders' blue
    ctx.fillStyle = OL; ctx.fillRect(cx + 8, cy - 40, 4, 40);
    ctx.fillStyle = '#2c56c8'; ctx.beginPath(); ctx.moveTo(cx + 12, cy - 39); ctx.lineTo(cx + 34, cy - 33); ctx.lineTo(cx + 12, cy - 26); ctx.fill();
  }
  function drawMine(ctx, Z, f, X0, Y0) {
    const cx = X0 + 64, cy = Y0 + 46, m = new Path2D(), lit = new Path2D(), dk = new Path2D(), gold = new Path2D(), goldD = new Path2D(), track = new Path2D();
    const pts = [];
    for (let i = 0; i < 12; i++) { const a = i * TAU / 12, rr = .82 + Z.hash(f.bx * 5 + i, f.by * 3) * .22; pts.push(cx + Math.cos(a) * 60 * rr, cy + Math.sin(a) * 42 * rr); }
    poly(m, pts);
    poly(lit, [pts[12], pts[13], pts[14], pts[15], pts[16], pts[17], pts[18], pts[19], cx - 6, cy - 6]);
    poly(dk, [pts[0], pts[1], pts[2], pts[3], pts[4], pts[5], cx, cy + 10]);
    ctx.fillStyle = 'rgba(8,14,4,.45)'; ctx.beginPath(); ctx.ellipse(cx + 10, cy + 12, 62, 42, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.stroke(m);
    fillP(ctx, m, '#7a6a52'); fillP(ctx, lit, '#988666'); fillP(ctx, dk, '#5a4c3a');
    for (let i = 0; i < 9; i++) {
      const gx = cx - 48 + Math.floor(Z.hash(f.bx + i * 3, f.by - i) * 48) * 2, gy = cy - 30 + Math.floor(Z.hash(f.bx - i, f.by + i * 5) * 22) * 2;
      gold.rect(gx, gy, 4, 3); goldD.rect(gx, gy + 3, 4, 1);
    }
    for (let i = 0; i < 6; i++) { gold.rect(cx + 28 + (i % 3) * 5, cy + 24 + Math.floor(i / 3) * -4, 5, 4); goldD.rect(cx + 28 + (i % 3) * 5, cy + 28, 5, 2); }
    for (let y = cy + 30; y < cy + 56; y += 6) track.rect(cx - 9, y, 18, 2);
    fillP(ctx, track, '#4a3018');
    ctx.fillStyle = '#6c6c70'; ctx.fillRect(cx - 7, cy + 28, 2, 28); ctx.fillRect(cx + 5, cy + 28, 2, 28);
    ctx.fillStyle = OL; ctx.fillRect(cx - 24, cy - 8, 48, 40);
    ctx.fillStyle = '#100a06'; ctx.beginPath(); ctx.moveTo(cx - 14, cy + 30); ctx.lineTo(cx - 14, cy + 8); ctx.quadraticCurveTo(cx, cy - 6, cx + 14, cy + 8); ctx.lineTo(cx + 14, cy + 30); ctx.fill();
    const tim = new Path2D(); tim.rect(cx - 21, cy - 2, 6, 32); tim.rect(cx + 15, cy - 2, 6, 32); tim.rect(cx - 22, cy - 6, 44, 6);
    fillP(ctx, tim, '#7a5028');
    fillP(ctx, gold, '#f4cc3c'); fillP(ctx, goldD, '#9a7212');
  }
  function drawRuin(ctx, Z, f, X0, Y0) {
    const wall = new Path2D(), top = new Path2D(), beam = new Path2D(), ember = new Path2D(), rub = new Path2D(), pit = new Path2D();
    poly(wall, [X0 + 12, Y0 + 16, X0 + 30, Y0 + 12, X0 + 38, Y0 + 18, X0 + 62, Y0 + 14, X0 + 70, Y0 + 20, X0 + 86, Y0 + 16, X0 + 88, Y0 + 28, X0 + 26, Y0 + 28, X0 + 26, Y0 + 70, X0 + 18, Y0 + 82, X0 + 12, Y0 + 66]);
    poly(wall, [X0 + 120, Y0 + 62, X0 + 136, Y0 + 58, X0 + 148, Y0 + 66, X0 + 148, Y0 + 112, X0 + 138, Y0 + 104, X0 + 134, Y0 + 74, X0 + 120, Y0 + 74]);
    top.rect(X0 + 14, Y0 + 18, 70, 3); top.rect(X0 + 14, Y0 + 18, 3, 50); top.rect(X0 + 122, Y0 + 63, 24, 3);
    const bms = [[60, 50, .5], [96, 30, -.7], [88, 100, .2], [40, 108, -.3]];
    for (const [bxp, byp, a] of bms) {
      const x = X0 + bxp, y = Y0 + byp, c = Math.cos(a), s = Math.sin(a), L = 22, W = 3.5;
      poly(beam, [x - c * L - s * W, y - s * L + c * W, x + c * L - s * W, y + s * L + c * W, x + c * L + s * W, y + s * L - c * W, x - c * L + s * W, y - s * L - c * W]);
      ember.rect(x + c * L - 2, y + s * L - 2, 4, 4);
    }
    for (let i = 0; i < 18; i++) circ(rub, X0 + 8 + Z.hash(f.bx * 7 + i, f.by) * 144, Y0 + 8 + Z.hash(f.bx, f.by * 7 + i) * 112, 2 + Z.hash(i, f.bx) * 3);
    for (const [x, y] of ruinSpots(Z, f, X0, Y0)) ell(pit, x, y + 2, 14, 8);
    fillP(ctx, pit, '#140e0a');
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke(wall);
    fillP(ctx, wall, '#68625a'); fillP(ctx, top, '#8e877a');
    fillP(ctx, rub, '#5c564e');
    ctx.stroke(beam); fillP(ctx, beam, '#2a1c12'); fillP(ctx, ember, '#c04a18');
  }

  /* ---------- helpers ---------- */
  function formation(Z, kind, n, ang, dist) {
    const P = Z.P, cx = P.x + Math.cos(ang) * dist, cy = P.y + Math.sin(ang) * dist, p = ang + Math.PI / 2;
    for (let i = 0; i < n; i++) {
      const o = (i - (n - 1) / 2) * 38;
      const e = Z.spawn(kind, cx + Math.cos(p) * o, cy + Math.sin(p) * o);
      if (e) { e.march = 3.6; e.mx = -Math.cos(ang); e.my = -Math.sin(ang); }
    }
  }
  // Two legs with black outlines: 4 calls.
  function legs(c, k, x1, x2, y, w, h, col) {
    c.fillStyle = k(OL); c.fillRect(x1 - 1.2, y - 1, w + 2.4, h + 2); c.fillRect(x2 - 1.2, y - 1, w + 2.4, h + 2);
    c.fillStyle = k(col); c.fillRect(x1, y, w, h * .62); c.fillRect(x2, y, w, h * .62);
  }

  /* ---------- foes ---------- */
  // Orc grunt (original: Grunt). Horde-green skin, red plate with black iron, a huge axe.
  const G = {
    red: mk(p => poly(p, [-9, -6, 9, -6, 8, 3, 5, 5, -5, 5, -8, 3])),
    skin: mk(p => { circ(p, 1, -9, 6); ell(p, 3, -5.5, 5, 3.2); ell(p, -10.5, 0, 3.2, 4.5); }),
    blk: mk(p => {
      poly(p, [-4, -5, 4, -5, 3.5, 3, 0, 4.5, -3.5, 3]); circ(p, -9, -6, 4.6); circ(p, 9, -6, 4.6);
      p.moveTo(-6, -10); p.arc(1, -10, 7, Math.PI, 0); p.closePath(); p.rect(0, -10, 2, 3.5);
    }),
    red2: mk(p => { p.rect(-6.5, -11, 15, 2); circ(p, -9, -6, 1.6); circ(p, 9, -6, 1.6); p.rect(-8, 2, 16, 2.5); }),
    bone: mk(p => {
      poly(p, [-5, -13, -11, -15, -12.5, -22, -8, -17, -3, -15.5]); poly(p, [7, -13, 13, -15, 14.5, -22, 10, -17, 5, -15.5]);
      poly(p, [2.5, -4, 3.5, -8, 4.6, -4]); poly(p, [6, -4, 7, -7.6, 8, -4]);
      poly(p, [-12, -8, -15, -12.5, -9.5, -10]); poly(p, [12, -8, 15, -12.5, 9.5, -10]);
    }),
  };
  G.sil = mk(p => {
    poly(p, [-9, -6, 9, -6, 8, 3, 5, 5, -5, 5, -8, 3]); circ(p, 1, -9, 6); ell(p, 3, -5.5, 5, 3.2); ell(p, -10.5, 0, 3.2, 4.5);
    circ(p, -9, -6, 4.6); circ(p, 9, -6, 4.6); p.moveTo(-6, -10); p.arc(1, -10, 7, Math.PI, 0); p.closePath();
    poly(p, [-5, -13, -11, -15, -12.5, -22, -8, -17, -3, -15.5]); poly(p, [7, -13, 13, -15, 14.5, -22, 10, -17, 5, -15.5]);
  });
  const AXE = {
    handle: mk(p => p.rect(-1.5, -21, 3, 25)),
    blade: mk(p => { poly(p, [1, -21, 11, -25.5, 15, -15.5, 11, -6.5, 1, -11]); poly(p, [-1, -19, -5.5, -16, -1, -13]); }),
    hand: mk(p => circ(p, 0, 0, 3.2)),
    edge: mk(p => { p.moveTo(11, -25.5); p.lineTo(15, -15.5); p.lineTo(11, -6.5); }),
  };
  AXE.ol = mk(p => { p.rect(-1.5, -21, 3, 25); poly(p, [1, -21, 11, -25.5, 15, -15.5, 11, -6.5, 1, -11]); poly(p, [-1, -19, -5.5, -16, -1, -13]); circ(p, 0, 0, 3.2); });
  const SKIN = '#6ccc3a', ARM = '#c0261a', IRON = '#1e1a20', BONE = '#efe4c0', STEEL = '#dfe5ee', WOOD = '#7a4a22';

  const grunt = {
    hp: 22, sp: 54, dmg: 9, xp: 2, r: 12, eye: '#ffe040',
    update(e, Z) {
      if (e.march > 0) { e.march -= Z.dt; Z.move(e, e.mx * e.sp * 1.15, e.my * e.sp * 1.15); e.ang = Math.atan2(e.my, e.mx); }
      else Z.chase(e);
    },
    draw(e, Z, white) {
      const c = Z.ctx, k = kw(white), s = e.r / 12, f = Math.cos(e.ang) < 0 ? -1 : 1;
      const st = Math.sin(e.ph * 9 + e.seed), bob = Math.abs(st) * 1.6;
      const near = Z.dist(e) < 60, sw = near ? Math.sin(e.ph * 11) * 1.3 - .2 : -.5 + Math.sin(e.ph * 4.5 + e.seed) * .25;
      c.save(); c.translate(e.x, e.y); c.scale(s * f, s);
      legs(c, k, -6 + st * 2, 1 - st * 2, 3, 5, 9, '#4a2c18');
      c.translate(0, -bob);
      c.strokeStyle = k(OL); c.lineWidth = 3.4; c.lineJoin = 'round'; c.stroke(G.sil);
      c.fillStyle = k(ARM); c.fill(G.red);
      c.fillStyle = k(SKIN); c.fill(G.skin);
      c.fillStyle = k(IRON); c.fill(G.blk);
      c.fillStyle = k('#e83a22'); c.fill(G.red2);
      c.fillStyle = k(BONE); c.fill(G.bone);
      c.translate(9, 0); c.rotate(sw);
      c.lineWidth = 3; c.stroke(AXE.ol);
      c.fillStyle = k(WOOD); c.fill(AXE.handle);
      c.fillStyle = k(STEEL); c.fill(AXE.blade);
      c.fillStyle = k(SKIN); c.fill(AXE.hand);
      c.strokeStyle = k('#ffffff'); c.lineWidth = 1.4; c.stroke(AXE.edge);
      c.restore();
    },
  };

  // Troll axe-thrower (original: Troll Axethrower). Lanky teal troll, red mohawk, keeps range and hurls axes.
  const TR = {
    skin: mk(p => {
      ell(p, 0, -1, 5, 7); circ(p, 1, -9, 4.6); ell(p, -6, 0, 2.2, 5);
      poly(p, [-2, -10, -11, -15, -2, -7]); poly(p, [5, -10, 10.5, -8, 5, -6.5]);
    }),
    blk: mk(p => { poly(p, [-6, 2, 6, 2, 5, 8, 0, 9.5, -5, 8]); poly(p, [-4.5, -6, -2.5, -7, 4.5, 2, 2.5, 3]); }),
    red: mk(p => {
      p.rect(-6, 2, 12, 2); p.rect(-8.2, -2, 4.4, 2);
      poly(p, [-3, -12, -2, -19.5, 0, -14.5, 1.5, -21, 3, -14.5, 5, -18.5, 5.5, -11.5]);
      p.rect(1.2, -10, 1.8, 1.8); p.rect(4, -10, 1.8, 1.8);
    }),
    bone: mk(p => { poly(p, [3.5, -6.5, 4.2, -9.6, 5.2, -6.5]); p.rect(-4, -5, 8, 1.4); }),
  };
  TR.sil = mk(p => {
    ell(p, 0, -1, 5, 7); circ(p, 1, -9, 4.6); ell(p, -6, 0, 2.2, 5);
    poly(p, [-2, -10, -11, -15, -2, -7]); poly(p, [5, -10, 10.5, -8, 5, -6.5]);
    poly(p, [-6, 2, 6, 2, 5, 8, 0, 9.5, -5, 8]);
    poly(p, [-3, -12, -2, -19.5, 0, -14.5, 1.5, -21, 3, -14.5, 5, -18.5, 5.5, -11.5]);
  });
  const TARM = mk(p => p.rect(-1.4, -9, 2.8, 9));
  const HAXE = {
    ol: mk(p => { p.rect(-1, -7, 2, 10); poly(p, [.5, -7, 7, -9.5, 8.5, -4, 7, 1, .5, -2]); }),
    h: mk(p => p.rect(-1, -7, 2, 10)),
    b: mk(p => poly(p, [.5, -7, 7, -9.5, 8.5, -4, 7, 1, .5, -2])),
  };
  const TSKIN = '#48c8bc';
  const troll = {
    hp: 32, sp: 70, dmg: 7, xp: 3, r: 11, eye: false,
    init(e, Z) { e.wind = 0; e.t1 = Z.rnd(1, 2.5); e.follow = 0; },
    update(e, Z) {
      const d = Z.dist(e), a = Z.angTo(e); e.ang = a;
      e.follow = Math.max(0, e.follow - Z.dt);
      if (e.wind > 0) {
        e.wind += Z.dt / .55; Z.move(e, 0, 0);
        if (e.wind >= 1) {
          e.wind = 0; e.follow = .3; e.t1 = 2.6 + Z.rnd(0, 1);
          const o = { r: 6, dmg: 7, col: '255,206,70', life: 4 };
          Z.shoot(e.x, e.y - 6, a, 205, o);
          if (Z.t > 70) { Z.shoot(e.x, e.y - 6, a - .25, 195, o); Z.shoot(e.x, e.y - 6, a + .25, 195, o); }
          Z.sfx('shoot');
        }
        return;
      }
      const v = d > 270 ? 1 : d < 190 ? -.8 : 0, sd = e.seed > 3 ? 1 : -1, sp = e.sp;
      Z.move(e, Math.cos(a) * v * sp + Math.cos(a + Math.PI / 2) * sd * sp * .45,
        Math.sin(a) * v * sp + Math.sin(a + Math.PI / 2) * sd * sp * .45);
      if ((e.t1 -= Z.dt) <= 0 && d < 430) e.wind = .001;
    },
    draw(e, Z, white) {
      const c = Z.ctx, k = kw(white), s = e.r / 11, f = Math.cos(e.ang) < 0 ? -1 : 1;
      const st = Math.sin(e.ph * 8 + e.seed), bob = Math.abs(st) * 1.3, w = e.wind || 0;
      c.save(); c.translate(e.x, e.y); c.scale(s * f, s);
      legs(c, k, -4 + st * 2, 1 - st * 2, 6, 3, 8, TSKIN);
      c.translate(0, -bob);
      c.strokeStyle = k(OL); c.lineWidth = 3.2; c.lineJoin = 'round'; c.stroke(TR.sil);
      c.fillStyle = k(TSKIN); c.fill(TR.skin);
      c.fillStyle = k(IRON); c.fill(TR.blk);
      c.fillStyle = k('#f03a24'); c.fill(TR.red);
      c.fillStyle = k(BONE); c.fill(TR.bone);
      // throwing arm with spinning hand-axe
      c.translate(2.5, -4); c.rotate(e.follow > 0 ? 1.2 : -.4 - w * 2.2);
      c.stroke(TARM); c.fillStyle = k(TSKIN); c.fill(TARM);
      if (e.follow <= 0) {
        c.translate(0, -9); c.rotate(w > 0 ? e.ph * 22 : 0);
        c.lineWidth = 2.6; c.stroke(HAXE.ol);
        c.fillStyle = k(WOOD); c.fill(HAXE.h);
        c.fillStyle = k(STEEL); c.fill(HAXE.b);
      }
      c.restore();
    },
  };

  // Two-headed ogre (original: Ogre). Heavy, slow, telegraphed club slam.
  const OG = {
    skin: mk(p => { ell(p, 0, 0, 15, 13); circ(p, -6, -15, 6.5); circ(p, 8, -16, 6); ell(p, -15, 2, 4.2, 7); }),
    belly: mk(p => ell(p, 2, 3, 9, 7.5)),
    blk: mk(p => {
      poly(p, [-14, 7, 14, 7, 12, 13, 4, 16, -4, 16, -12, 13]); circ(p, -12, -6, 7);
      circ(p, -6, -22, 2.6); circ(p, 8, -22.5, 2.4);
    }),
    red: mk(p => {
      p.rect(-14.5, 5.5, 29, 3.5); p.rect(-19, 0, 8.5, 2.6); circ(p, -12, -6, 3);
      p.rect(-9, -17, 2, 2); p.rect(-5, -17, 2, 2); p.rect(6, -18, 2, 2); p.rect(10, -18, 2, 2);
    }),
    bone: mk(p => {
      p.rect(-4.5, -12, 1.5, 3); p.rect(-1.8, -12, 1.5, 3); p.rect(10, -13, 1.5, 3); p.rect(12.4, -13, 1.5, 3);
      poly(p, [-17, -9, -21, -15, -13, -11]); poly(p, [-11, -12, -10, -19.5, -7, -11]);
    }),
  };
  OG.sil = mk(p => {
    ell(p, 0, 0, 15, 13); circ(p, -6, -15, 6.5); circ(p, 8, -16, 6); ell(p, -15, 2, 4.2, 7);
    poly(p, [-14, 7, 14, 7, 12, 13, 4, 16, -4, 16, -12, 13]); circ(p, -12, -6, 7); circ(p, -6, -22, 2.6); circ(p, 8, -22.5, 2.4);
  });
  const CLUB = {
    ol: mk(p => { p.rect(-2.5, -10, 5, 12); poly(p, [-2.5, -8, 2.5, -8, 6.5, -26, 3, -32, -3, -32, -6.5, -26]); circ(p, 0, 0, 4.5); }),
    wood: mk(p => { p.rect(-2.5, -10, 5, 12); poly(p, [-2.5, -8, 2.5, -8, 6.5, -26, 3, -32, -3, -32, -6.5, -26]); }),
    stud: mk(p => { poly(p, [5.5, -24, 10, -26, 6, -20]); poly(p, [-5.5, -24, -10, -26, -6, -20]); poly(p, [-1.5, -31, 0, -36, 1.5, -31]); poly(p, [4, -16, 7.5, -17, 4.5, -13]); }),
    hand: mk(p => circ(p, 0, 0, 4.5)),
  };
  const OSKIN = '#e0a070';
  const ogre = {
    hp: 110, sp: 32, dmg: 16, xp: 7, r: 19, heavy: true, eye: false,
    init(e, Z) { e.mode = 'walk'; e.t2 = Z.rnd(2, 4); e.wt = 0; e.post = 0; e.hx = e.x; e.hy = e.y; },
    update(e, Z) {
      e.post = Math.max(0, e.post - Z.dt);
      if (e.mode === 'slam') {
        e.wt -= Z.dt;
        if (e.wt <= 0) {
          e.mode = 'walk'; e.post = .35; e.t2 = Z.rnd(3.5, 5.5);
          Z.shake(4); Z.burst(e.hx, e.hy, '#8a6a3e', 10, 120);
        }
        return;
      }
      Z.chase(e);
      if ((e.t2 -= Z.dt) <= 0 && Z.dist(e) < 150) {
        const a = Z.angTo(e); e.ang = a; e.mode = 'slam'; e.wt = .9;
        e.hx = e.x + Math.cos(a) * 55; e.hy = e.y + Math.sin(a) * 55;
        Z.hazard(e.hx, e.hy, { r: 72, t: .9, dmg: 14, col: '255,150,60' }); Z.sfx('warn');
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, k = kw(white), s = e.r / 19, f = Math.cos(e.ang) < 0 ? -1 : 1;
      const walking = e.mode !== 'slam', st = walking ? Math.sin(e.ph * 5 + e.seed) : 0, bob = Math.abs(st) * 2;
      const ca = e.mode === 'slam' ? -.6 - (1 - Math.max(0, e.wt) / .9) * 1.8 : e.post > 0 ? 1.1 : -.6 + st * .2;
      c.save(); c.translate(e.x, e.y); c.scale(s * f, s);
      legs(c, k, -10 + st * 2, 3 - st * 2, 8, 7, 10, OSKIN);
      c.translate(0, -bob);
      c.strokeStyle = k(OL); c.lineWidth = 3.6; c.lineJoin = 'round'; c.stroke(OG.sil);
      c.fillStyle = k(OSKIN); c.fill(OG.skin);
      c.fillStyle = k('#f4c494'); c.fill(OG.belly);
      c.fillStyle = k(IRON); c.fill(OG.blk);
      c.fillStyle = k('#e8301e'); c.fill(OG.red);
      c.fillStyle = k(BONE); c.fill(OG.bone);
      c.translate(13, -2); c.rotate(ca);
      c.lineWidth = 3.2; c.stroke(CLUB.ol);
      c.fillStyle = k('#5c3a1a'); c.fill(CLUB.wood);
      c.fillStyle = k('#c8ccd4'); c.fill(CLUB.stud);
      c.fillStyle = k(OSKIN); c.fill(CLUB.hand);
      c.restore();
    },
  };

  // Goblin sapper (original: Goblin Sapper). Sprints in with a powder keg, lights it, blows up.
  const SP = {
    keg: mk(p => ell(p, -5, -3, 4.8, 5.8)),
    hoop: mk(p => { p.rect(-9.8, -5.6, 9.6, 1.4); p.rect(-9.8, -1.4, 9.6, 1.4); }),
    vest: mk(p => ell(p, 1, 0, 4.6, 5.6)),
    skin: mk(p => {
      circ(p, 3, -7, 4.2); poly(p, [0, -8, -6.5, -13, 1, -5.5]); poly(p, [5, -8.5, 11.5, -13, 6, -5.5]); poly(p, [6, -7, 10, -5, 6, -4.5]);
    }),
    gog: mk(p => { p.rect(.5, -9.6, 7, 2.6); }),
    fuse: mk(p => { p.moveTo(-5, -8.8); p.quadraticCurveTo(-6, -12, -3, -13); }),
  };
  SP.sil = mk(p => { ell(p, -5, -3, 4.8, 5.8); ell(p, 1, 0, 4.6, 5.6); circ(p, 3, -7, 4.2); poly(p, [0, -8, -6.5, -13, 1, -5.5]); poly(p, [5, -8.5, 11.5, -13, 6, -5.5]); });
  SP.silSpent = mk(p => { ell(p, 1, 0, 4.6, 5.6); circ(p, 3, -7, 4.2); poly(p, [0, -8, -6.5, -13, 1, -5.5]); poly(p, [5, -8.5, 11.5, -13, 6, -5.5]); });
  const sapper = {
    hp: 12, sp: 122, dmg: 10, xp: 2, r: 9, eye: '#ffffff',
    init(e) { e.mode = 'walk'; e.fz = 0; e.spent = false; },
    update(e, Z) {
      if (e.spent) { Z.chase(e, 28); return; }
      if (e.mode === 'fuse') {
        e.fz -= Z.dt; Z.chase(e, e.sp * .3);
        if (e.fz <= 0) {
          Z.hazard(e.x, e.y, { r: 60, t: .3, dmg: 12, col: '255,150,50' });
          Z.burst(e.x, e.y, '#ffb040', 14, 160);
          e.spent = true; e.mode = 'walk'; e.dmg = 0; e.hp = 0; e.remove = true;
        }
        return;
      }
      const a = Z.angTo(e) + Math.sin(e.ph * 6 + e.seed) * .5;
      Z.move(e, Math.cos(a) * e.sp, Math.sin(a) * e.sp); e.ang = a;
      if (Z.dist(e) < 44) { e.mode = 'fuse'; e.fz = .45; }
    },
    draw(e, Z, white) {
      const c = Z.ctx, k = kw(white), s = e.r / 9, f = Math.cos(e.ang) < 0 ? -1 : 1;
      const st = Math.sin(e.ph * 16 + e.seed), bob = Math.abs(st) * 1.8;
      const fuse = e.mode === 'fuse', pul = fuse ? 1 + Math.abs(Math.sin(e.ph * 30)) * .15 : 1;
      c.save(); c.translate(e.x, e.y); c.scale(s * pul * f, s * pul);
      legs(c, k, -2 + st * 2, 1.5 - st * 2, 4, 2.4, 5, '#3a2a1a');
      c.translate(0, -bob);
      c.strokeStyle = k(OL); c.lineWidth = 3; c.lineJoin = 'round'; c.stroke(e.spent ? SP.silSpent : SP.sil);
      if (!e.spent) {
        c.fillStyle = k('#9a5a28'); c.fill(SP.keg);
        c.fillStyle = k(OL); c.fill(SP.hoop);
        c.strokeStyle = k('#e8d8b0'); c.lineWidth = 1.2; c.stroke(SP.fuse);
        c.fillStyle = k('#fff070'); c.fillRect(-4.2, -14.6, 2.6, 2.6);
      }
      c.fillStyle = k(e.spent ? '#3a2420' : '#d42e1c'); c.fill(SP.vest);
      c.fillStyle = k(e.spent ? '#5a5e40' : '#a8dc40'); c.fill(SP.skin);
      c.fillStyle = k(IRON); c.fill(SP.gog);
      if (fuse && !white) { c.globalAlpha = .45; c.fillStyle = '#ff3010'; c.beginPath(); c.arc(0, -3, 11, 0, TAU); c.fill(); c.globalAlpha = 1; }
      c.restore();
    },
    death(e, Z) { if (!e.spent) Z.hazard(e.x, e.y, { r: 48, t: .55, dmg: 9, col: '255,150,50' }); },
  };

  /* ---------- floor ---------- */
  const COL = {
    g1: '#4c6e2e', g2: '#486a2b', gd: '#3a5822', gl: '#5d7f36', fl: '#d8c860',
    sand: '#8a7a50', wet: '#5a4e34', sc: '#2e2822', scA: '#463c32', scD: '#1c1814',
    grout: '#4a4134', st: '#857a64', st2: '#7a705c', stH: '#a0957c', stD: '#5e5444', curb: '#3a3228',
    wa: '#2a4c68', wd: '#23425c', wl: '#38627e', sh: '#3a6a80',
    pl: '#7a5430', plD: '#3e2a16', rail: '#5a3a1c',
    rb: '#3e3830', cliff: '#2c2722', crack: '#1c1814', rk: '#7a7262', rkL: '#9a917c', rkD: '#565044',
    fb: '#1d3416', cnS: 'rgba(6,14,4,.55)', cn: '#2e5a22', ch: '#3e7430', chl: '#5c9440', tr: '#5a3a1c',
  };
  function drawGround(Z, x0, y0, x1, y1) {
    const ctx = Z.ctx, h = Z.hash;
    const tx0 = Math.floor(x0 / T) - 1, ty0 = Math.floor(y0 / T) - 1, tx1 = Math.floor(x1 / T) + 1, ty1 = Math.floor(y1 / T) + 1;
    const GW = tx1 - tx0 + 3, GH = ty1 - ty0 + 3, g = new Uint8Array(GW * GH);
    for (let ty = ty0 - 1; ty <= ty1 + 1; ty++) for (let tx = tx0 - 1; tx <= tx1 + 1; tx++) g[(ty - ty0 + 1) * GW + tx - tx0 + 1] = tileType(Z, tx, ty);
    const at = (tx, ty) => g[(ty - ty0 + 1) * GW + tx - tx0 + 1];
    const Q = {};
    for (const n of Object.keys(COL)) Q[n] = new Path2D();
    const rows = [];
    const dots = (tx, ty, p, n, salt) => {
      for (let i = 0; i < n; i++) p.rect(tx * T + Math.floor(h(tx * 31 + i * 7 + salt, ty * 17 - i * 3) * 16) * 2, ty * T + Math.floor(h(tx * 5 - i + salt, ty * 29 + i * 11) * 16) * 2, 2, 2);
    };
    const landT = t => t !== WATER && t !== BRIDGE;
    const roadT = t => t === ROAD || t === BRIDGE;
    ctx.fillStyle = COL.g1; ctx.fillRect(tx0 * T, ty0 * T, (tx1 - tx0 + 1) * T, (ty1 - ty0 + 1) * T);
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const t = at(tx, ty), X = tx * T, Y = ty * T;
      if (t === GRASS || t === FOREST || t === ROCK) {
        if (t === GRASS) {
          if ((tx + ty) & 1) Q.g2.rect(X, Y, T, T);
          dots(tx, ty, Q.gd, 6, 0); dots(tx, ty, Q.gl, 3, 50);
          const th = h(tx * 3 + 7, ty * 7 + 3);
          if (th < .22) {
            const bx = X + 4 + Math.floor(th * 90) * 2, by = Y + 8 + Math.floor(h(ty, tx * 3) * 8) * 2;
            Q.gd.rect(bx, by, 2, 4); Q.gd.rect(bx + 3, by - 2, 2, 6); Q.gd.rect(bx + 6, by, 2, 4); Q.gl.rect(bx + 3, by - 2, 2, 2);
          } else if (th > .975) { Q.fl.rect(X + 10, Y + 12, 2, 2); Q.fl.rect(X + 20, Y + 18, 2, 2); }
        }
        // shore strips on land beside water
        if (at(tx, ty - 1) === WATER) { Q.sand.rect(X, Y, T, 6); Q.wet.rect(X, Y, T, 2); }
        if (at(tx, ty + 1) === WATER) { Q.sand.rect(X, Y + T - 6, T, 6); Q.wet.rect(X, Y + T - 2, T, 2); }
        if (at(tx - 1, ty) === WATER) { Q.sand.rect(X, Y, 6, T); Q.wet.rect(X, Y, 2, T); }
        if (at(tx + 1, ty) === WATER) { Q.sand.rect(X + T - 6, Y, 6, T); Q.wet.rect(X + T - 2, Y, 2, T); }
      }
      if (t === SCORCH) { Q.sc.rect(X, Y, T, T); dots(tx, ty, Q.scA, 7, 9); dots(tx, ty, Q.scD, 5, 21); }
      else if (t === ROAD) {
        Q.grout.rect(X, Y, T, T);
        for (let j = 0; j < 4; j++) {
          const off = ((ty * 4 + j) & 1) * 5;
          for (let i = 0; i < 4; i++) {
            const sx = X + i * 10 - off, a = Math.max(sx, X), b = Math.min(sx + 9, X + T);
            if (b - a < 3) continue;
            const y = Y + j * 8 + 1;
            (h(tx * 4 + i, ty * 4 + j) < .5 ? Q.st : Q.st2).rect(a, y, b - a, 6);
            Q.stH.rect(a, y, b - a, 1.5); Q.stD.rect(a, y + 5, b - a, 1.5);
          }
        }
        if (!roadT(at(tx, ty - 1))) Q.curb.rect(X, Y, T, 3);
        if (!roadT(at(tx, ty + 1))) Q.curb.rect(X, Y + T - 3, T, 3);
        if (!roadT(at(tx - 1, ty))) Q.curb.rect(X, Y, 3, T);
        if (!roadT(at(tx + 1, ty))) Q.curb.rect(X + T - 3, Y, 3, T);
      } else if (t === BRIDGE) {
        Q.plD.rect(X, Y, T, T);
        if (roadH(Z, tx, ty)) { for (let i = 0; i < T; i += 8) Q.pl.rect(X + i, Y + 2, 6, T - 4); if (!roadT(at(tx, ty - 1))) Q.rail.rect(X, Y, T, 4); if (!roadT(at(tx, ty + 1))) Q.rail.rect(X, Y + T - 4, T, 4); }
        else { for (let i = 0; i < T; i += 8) Q.pl.rect(X + 2, Y + i, T - 4, 6); if (!roadT(at(tx - 1, ty))) Q.rail.rect(X, Y, 4, T); if (!roadT(at(tx + 1, ty))) Q.rail.rect(X + T - 4, Y, 4, T); }
      } else if (t === WATER) {
        Q.wa.rect(X, Y, T, T);
        for (let i = 0; i < 3; i++) Q.wd.rect(X + Math.floor(h(tx * 9 + i, ty * 3) * 12) * 2, Y + 4 + i * 10, 8, 2);
        dots(tx, ty, Q.wl, 2, 77);
        if (landT(at(tx, ty - 1))) Q.sh.rect(X, Y, T, 5);
        if (landT(at(tx, ty + 1))) Q.sh.rect(X, Y + T - 5, T, 5);
        if (landT(at(tx - 1, ty))) Q.sh.rect(X, Y, 5, T);
        if (landT(at(tx + 1, ty))) Q.sh.rect(X + T - 5, Y, 5, T);
      } else if (t === ROCK) {
        Q.rb.rect(X, Y, T, T);
        if (at(tx, ty + 1) !== ROCK) {
          Q.cliff.rect(X, Y + T - 11, T, 11);
          Q.crack.rect(X + 5 + Math.floor(h(tx, ty * 7) * 6) * 2, Y + T - 10, 2, 9); Q.crack.rect(X + 20 + Math.floor(h(tx * 7, ty) * 4) * 2, Y + T - 8, 2, 7);
        }
        for (let b = 0; b < 2; b++) {
          const r = b ? 7 + h(tx - 5, ty + 9) * 3 : 12 + h(tx + 5, ty - 9) * 3;
          const cx = X + (b ? 6 + h(tx * 2, ty * 5) * 20 : 16 + (h(tx * 3, ty) - .5) * 6), cy = Y + (b ? 4 + h(tx * 5, ty * 2) * 8 : 13 + (h(tx, ty * 3) - .5) * 4);
          const pts = [];
          for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + .39, rr = r * (.82 + h(tx * 8 + i + b * 3, ty * 8 - i) * .22); pts.push(Math.round(cx + Math.cos(a) * rr), Math.round(cy + Math.sin(a) * rr * .85)); }
          poly(Q.rk, pts);
          poly(Q.rkL, [pts[8], pts[9], pts[10], pts[11], pts[12], pts[13], cx - 1, cy - 1]);
          poly(Q.rkD, [pts[0], pts[1], pts[2], pts[3], pts[4], pts[5], cx + 1, cy + 2]);
        }
      } else if (t === FOREST) {
        Q.fb.rect(X, Y, T, T);
        const ry = ty - ty0, R = rows[ry] || (rows[ry] = { o: new Path2D(), m: new Path2D(), h: new Path2D(), l: new Path2D(), tO: new Path2D(), t: new Path2D() });
        const cx = X + 16 + (h(tx * 3, ty * 5) - .5) * 6, cy = Y + 14 + (h(tx * 5, ty * 3) - .5) * 5, s = .95 + h(tx + 11, ty - 7) * .2;
        const cl = [[-6.5, 2, 9.5], [6.5, 2, 9.5], [0, -5, 10], [0, 5, 9], [-3, -2, 9], [4, -3, 8.5]];
        for (const [dx, dy, r] of cl) { circ(R.o, cx + dx * s, cy + dy * s, r * s); circ(R.m, cx + dx * s, cy + dy * s, r * s); ell(Q.cnS, cx + dx * s + 3, cy + dy * s + 5, r * s, r * s * .9); }
        circ(R.h, cx - 3 * s, cy - 6 * s, 5 * s); circ(R.h, cx + 5 * s, cy - 2 * s, 3.5 * s); circ(R.h, cx - 8 * s, cy + 1 * s, 3.2 * s);
        R.l.rect(Math.round(cx - 5 * s), Math.round(cy - 9 * s), 2, 2); R.l.rect(Math.round(cx + 4 * s), Math.round(cy - 4 * s), 2, 2);
        if (at(tx, ty + 1) !== FOREST) { R.tO.rect(cx - 3.5, cy + 9, 7, 11); R.t.rect(cx - 2, cy + 10, 4, 8); }
      }
    }
    const fill = (n) => { ctx.fillStyle = COL[n]; ctx.fill(Q[n]); };
    for (const n of ['g2', 'gd', 'gl', 'fl', 'sc', 'scA', 'scD', 'wa', 'wd', 'wl', 'sh', 'sand', 'wet',
      'grout', 'st', 'st2', 'stH', 'stD', 'curb', 'plD', 'pl', 'rail', 'rb', 'cliff', 'crack']) fill(n);
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke(Q.rk);
    fill('rk'); fill('rkL'); fill('rkD');
    fill('fb'); fill('cnS');
    for (const R of rows) {
      if (!R) continue;
      ctx.fillStyle = OL; ctx.fill(R.tO); ctx.fillStyle = COL.tr; ctx.fill(R.t);
      ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke(R.o);
      ctx.fillStyle = COL.cn; ctx.fill(R.m); ctx.fillStyle = COL.ch; ctx.fill(R.h); ctx.fillStyle = COL.chl; ctx.fill(R.l);
    }
    // buildings and ruins on top
    const bx0 = Math.floor(tx0 / B) - 1, bx1 = Math.floor(tx1 / B) + 1, by0 = Math.floor(ty0 / B) - 1, by1 = Math.floor(ty1 / B) + 1;
    for (let by = by0; by <= by1; by++) for (let bx = bx0; bx <= bx1; bx++) {
      const f = featAt(Z, bx, by);
      if (!f) continue;
      const X0 = (bx * B + f.lx) * T, Y0 = (by * B + f.ly) * T;
      if (X0 > x1 + 40 || Y0 > y1 + 40 || X0 + f.w * T < x0 - 40 || Y0 + f.h * T < y0 - 40) continue;
      ctx.save();
      if (f.type === FARM) drawFarm(ctx, Z, f, X0, Y0);
      else if (f.type === TOWER) drawTower(ctx, Z, f, X0, Y0);
      else if (f.type === MINE) drawMine(ctx, Z, f, X0, Y0);
      else drawRuin(ctx, Z, f, X0, Y0);
      ctx.restore();
    }
  }

  // Animated water: drifting wave dashes, pulsing shore foam and the odd glint.
  function drawUnder(Z) {
    const ctx = Z.ctx, P = Z.P, now = Z.now, hw = Z.W * .5 + 48, hh = Z.H * .5 + 48;
    const tx0 = Math.floor((P.x - hw) / T), tx1 = Math.floor((P.x + hw) / T), ty0 = Math.floor((P.y - hh) / T), ty1 = Math.floor((P.y + hh) / T);
    const wave = new Path2D(), foam = new Path2D(), glint = new Path2D();
    let any = false;
    for (let gy = Math.floor(ty0 / 16); gy <= Math.floor(ty1 / 16); gy++) for (let gx = Math.floor(tx0 / 16); gx <= Math.floor(tx1 / 16); gx++) {
      const a = waterGroup(Z, gx, gy);
      for (let i = 0; i < a.length; i += 3) {
        const tx = a[i], ty = a[i + 1], sh = a[i + 2];
        if (tx < tx0 || tx > tx1 || ty < ty0 || ty > ty1) continue;
        any = true;
        const X = tx * T, Y = ty * T, ph = tx * .9 + ty * 1.7, o = Math.round(Math.sin(now * 1.4 + ph) * 3) * 2;
        wave.rect(X + 6 + o, Y + 9, 10, 2); wave.rect(X + 16 - o, Y + 23, 10, 2);
        if ((Math.sin(now * 2.3 + ph * 3) > .96)) glint.rect(X + 14, Y + 14, 4, 2);
        if (sh) {
          const d = Math.round(1 + (Math.sin(now * 2 + ph) + 1) * 1.5);
          if (sh & 1) foam.rect(X, Y + 5 + d, T, 2);
          if (sh & 2) foam.rect(X, Y + T - 7 - d, T, 2);
          if (sh & 4) foam.rect(X + 5 + d, Y, 2, T);
          if (sh & 8) foam.rect(X + T - 7 - d, Y, 2, T);
        }
      }
    }
    if (!any) return;
    ctx.fillStyle = '#4a7c98'; ctx.fill(wave);
    ctx.globalAlpha = .55 + Math.sin(now * 2) * .15; ctx.fillStyle = '#b8d4e0'; ctx.fill(foam);
    ctx.globalAlpha = 1; ctx.fillStyle = '#e8f4ff'; ctx.fill(glint);
  }

  function drawAmbient(Z) {
    const ctx = Z.ctx, P = Z.P, hw = Z.W * .6 + 80, hh = Z.H * .6 + 80, now = Z.now;
    const bx0 = Math.floor((P.x - hw) / (B * T)), bx1 = Math.floor((P.x + hw) / (B * T)), by0 = Math.floor((P.y - hh) / (B * T)), by1 = Math.floor((P.y + hh) / (B * T));
    const outer = new Path2D(), mid = new Path2D(), core = new Path2D(), sparks = new Path2D(), star = new Path2D();
    let n = 0;
    for (let by = by0; by <= by1; by++) for (let bx = bx0; bx <= bx1; bx++) {
      const f = featAt(Z, bx, by);
      if (!f || (f.type !== RUIN && f.type !== MINE) || n > 60) continue;
      const X0 = (bx * B + f.lx) * T, Y0 = (by * B + f.ly) * T;
      if (f.type === MINE) {
        const g = Math.max(0, Math.sin(now * 2.2 + bx * 1.7 + by)) ** 8;
        if (g < .05) continue;
        const gx = X0 + 64 + 32, gy = Y0 + 46 + 22, L = 3 + g * 6;
        Z.glow('255,220,120', 12 + g * 10, gx, gy, .25 + g * .5); n++;
        star.moveTo(gx - L, gy); star.lineTo(gx + L, gy); star.moveTo(gx, gy - L); star.lineTo(gx, gy + L);
        continue;
      }
      let i = 0;
      for (const [ox, oy] of ruinSpots(Z, f, X0, Y0)) {
        const fl = Math.sin(now * 9 + ox * .31) * .5 + Math.sin(now * 13.7 + oy * .17) * .5, s = 1 + i * .15;
        Z.glow('255,120,30', 40 + fl * 6, ox, oy - 8, .55 + fl * .1); n++;
        outer.moveTo(ox - 9 * s, oy + 2); outer.quadraticCurveTo(ox - 9 * s, oy - 12 * s, ox + fl * 3, oy - (24 + fl * 5) * s); outer.quadraticCurveTo(ox + 9 * s, oy - 12 * s, ox + 9 * s, oy + 2); outer.closePath();
        mid.moveTo(ox - 6 * s, oy + 2); mid.quadraticCurveTo(ox - 5 * s, oy - 8 * s, ox + fl * 2 - 2, oy - (16 + fl * 4) * s); mid.quadraticCurveTo(ox + 6 * s, oy - 8 * s, ox + 6 * s, oy + 2); mid.closePath();
        core.moveTo(ox - 3, oy + 2); core.quadraticCurveTo(ox - 3, oy - 5, ox + fl, oy - 9 * s); core.quadraticCurveTo(ox + 3, oy - 5, ox + 3, oy + 2); core.closePath();
        for (let j = 0; j < 2; j++) {
          const u = (now * .7 + j * .5 + i * .23) % 1;
          sparks.rect(Math.round(ox + Math.sin(now * 3 + j * 2 + i) * 8), Math.round(oy - 18 - u * 40), 2, 2);
        }
        i++;
      }
    }
    ctx.fillStyle = '#d8301a'; ctx.fill(outer); ctx.fillStyle = '#ff8a22'; ctx.fill(mid); ctx.fillStyle = '#ffe680'; ctx.fill(core);
    ctx.fillStyle = '#ffb040'; ctx.fill(sparks);
    ctx.strokeStyle = '#fff4c0'; ctx.lineWidth = 1.5; ctx.stroke(star);
    let m = 0;
    for (const e of Z.foes()) {
      if (m > 30) break;
      if (e.kind === 'sapper' && !e.spent) {
        const f = Math.cos(e.ang) < 0 ? -1 : 1, s = e.r / 9 * 1.3;
        Z.glow(e.mode === 'fuse' ? '255,80,30' : '255,200,80', e.mode === 'fuse' ? 26 : 9 + Math.sin(now * 30 + e.seed) * 2, e.x - 2.9 * f * s, e.y - 13.3 * s, .7); m++;
      } else if (e.boss && e.rage) {
        Z.glow('255,40,20', 90, e.x, e.y, .3 + Math.sin(now * 6) * .08); m++;
      }
    }
  }

  const BSIL = mk(p => {
    ell(p, 0, 0, 28, 25); circ(p, -22, -14, 11); circ(p, 22, -14, 11); circ(p, 3, -30, 13); circ(p, 8, -23, 9);
    p.moveTo(-11.5, -33); p.arc(2, -33, 13.5, Math.PI, 0); p.closePath();
    p.moveTo(-9, -38); p.quadraticCurveTo(-24, -40, -24, -60); p.quadraticCurveTo(-14, -48, -4, -45); p.closePath();
    p.moveTo(13, -38); p.quadraticCurveTo(28, -40, 28, -60); p.quadraticCurveTo(18, -48, 8, -45); p.closePath();
  });
  /* ---------- miniboss: original orc warchief ---------- */
  const SEQ = ['cry', 'whirl', 'barrage', 'charge'];
  const boss = {
    name: 'Gorrak Ironmaw, Warchief of the Black Tusk',
    hp: 3600, sp: 52, dmg: 24, xp: 0, r: 42, heavy: true, eye: false,
    init(e) { e.mode = 'walk'; e.mt = 2.5; e.ai = 0; e.rage = false; e.wt = 0; e.spin = 0; e.bq = 0; e.bt = 0; e.ca = 0; e.cd = 0; },
    update(e, Z) {
      const dt = Z.dt, rg = e.rage ? 1.35 : 1, sp = e.sp * rg, cool = e.rage ? .65 : 1;
      if (!e.rage && e.hp < e.max * .5) {
        e.rage = true; Z.banner('Bloodlust! The Warchief rages!', '#ff4030', false); Z.sfx('boss'); Z.shake(10);
        Z.burst(e.x, e.y, '#ff3020', 24, 200);
      }
      if (e.mode === 'walk') {
        Z.chase(e, sp);
        if ((e.mt -= dt) <= 0) {
          e.mode = SEQ[e.ai++ % SEQ.length];
          if (e.mode === 'cry') { e.wt = 1; Z.sfx('warn'); }
          else if (e.mode === 'whirl') { e.wt = .9; e.spin = e.rage ? 3.2 : 2.6; e.t3 = 0; Z.hazard(e.x, e.y, { r: 110, t: .9, dmg: 16, col: '255,80,40' }); Z.sfx('charge'); }
          else if (e.mode === 'barrage') { e.wt = .6; e.bq = e.rage ? 8 : 6; e.bt = 0; Z.banner('Catapults, loose!', '#e0a050', false); }
          else { e.wt = .9; e.ca = Z.angTo(e); e.cd = .75; Z.sfx('charge'); }
        }
        return;
      }
      if (e.mode === 'cry') {
        e.wt -= dt;
        if (e.wt <= 0) {
          const n = e.rage ? 7 : 5, base = Z.angTo(e);
          for (let i = 0; i < n; i++) {
            const a = base + Math.PI + (i - (n - 1) / 2) * .5;
            Z.spawn('grunt', e.x + Math.cos(a) * 75, e.y + Math.sin(a) * 75);
          }
          Z.shake(6); Z.sfx('boss'); Z.burst(e.x, e.y - 30, '#e04a2a', 16, 140);
          e.mode = 'walk'; e.mt = 2.2 * cool;
        }
      } else if (e.mode === 'whirl') {
        if (e.wt > 0) { e.wt -= dt; return; }
        e.spin -= dt; Z.chase(e, sp * 1.5);
        if ((e.t3 -= dt) <= 0) {
          e.t3 = .45; Z.ring(e.x, e.y, e.rage ? 10 : 8, 170, { r: 6, dmg: 9, col: '255,96,48', life: 3 }, e.ph * 3); Z.sfx('shoot');
        }
        if (e.spin <= 0) { e.mode = 'walk'; e.mt = 2 * cool; }
      } else if (e.mode === 'barrage') {
        Z.chase(e, sp * .4);
        if (e.wt > 0) { e.wt -= dt; return; }
        if ((e.bt -= dt) <= 0 && e.bq > 0) {
          e.bt = .22; e.bq--;
          const P = Z.P, first = e.bq === (e.rage ? 7 : 5);
          const x = first ? P.x + P.face.x * 40 : P.x + Z.rnd(-170, 170), y = first ? P.y + P.face.y * 40 : P.y + Z.rnd(-170, 170);
          Z.hazard(x, y, { r: 58, t: 1.1, dmg: 14, col: '200,160,90' }); Z.sfx('shoot');
        }
        if (e.bq <= 0) { e.mode = 'walk'; e.mt = 2 * cool; }
      } else {
        if (e.wt > 0) {
          e.wt -= dt; if (e.wt > .25) e.ca = Z.angTo(e); e.ang = e.ca; return;
        }
        e.cd -= dt; e.ang = e.ca;
        Z.move(e, Math.cos(e.ca) * 430 * rg, Math.sin(e.ca) * 430 * rg);
        if (e.cd <= 0) {
          Z.shake(5); Z.burst(e.x, e.y, '#8a6a3e', 14, 140);
          Z.ring(e.x, e.y, 6, 140, { r: 6, dmg: 8, col: '255,96,48', life: 3 }, e.ca);
          e.mode = 'walk'; e.mt = 2.4 * cool;
        }
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, k = kw(white), s = e.r / 42, f = Math.cos(e.ang) < 0 ? -1 : 1;
      const walk = e.mode === 'walk' || e.mode === 'barrage' || (e.mode === 'whirl' && e.wt <= 0);
      const st = walk ? Math.sin(e.ph * (e.rage ? 7 : 5)) : 0, bob = Math.abs(st) * 3;
      const spinning = e.mode === 'whirl' && e.wt <= 0, dashing = e.mode === 'charge' && e.wt <= 0;
      const skin = e.rage ? '#ff5a34' : '#74dc40', skinD = e.rage ? '#9a2c1a' : '#3e9a26', IR = '#423c4c', IRH = '#6a6278', RD = '#f02a1a';
      let ax = -.3 + Math.sin(e.ph * 2) * .15;
      if (e.mode === 'cry') ax = -1.3 + Math.sin(e.ph * 40) * .08;
      else if (e.mode === 'charge') ax = dashing ? .9 : -1.7;
      else if (e.mode === 'barrage') ax = 1.25;
      else if (e.mode === 'whirl' && e.wt > 0) ax = -1.5;
      c.save(); c.translate(e.x, e.y); c.scale(s, s);
      if (!white && e.mode === 'cry') {
        c.strokeStyle = 'rgba(255,90,40,.7)'; c.lineWidth = 4;
        for (let i = 0; i < 2; i++) { c.beginPath(); c.arc(0, -20, 30 + ((e.ph * 90 + i * 25) % 50), 0, TAU); c.stroke(); }
      }
      if (!white && spinning) {
        c.strokeStyle = 'rgba(240,244,250,.6)'; c.lineWidth = 5;
        for (let i = 0; i < 3; i++) { const a0 = e.ph * 16 + i * TAU / 3; c.beginPath(); c.arc(0, 0, 58, a0, a0 + 1.2); c.stroke(); }
      }
      c.translate(0, -bob);
      if (spinning) c.rotate(e.ph * 16); else if (dashing) c.rotate(Math.cos(e.ang) * .12);
      c.scale(f, 1);
      c.strokeStyle = k(OL); c.lineJoin = 'round'; c.lineWidth = 4;
      // war banner on the back: black field, red tusk sigil
      const wv = Math.sin(e.ph * 6) * 3;
      c.fillStyle = k(OL); c.fillRect(-25, -76, 7, 68);
      c.fillStyle = k('#6a3e1c'); c.fillRect(-23, -74, 3, 64);
      c.fillStyle = k(RD); c.beginPath(); c.moveTo(-20, -72); c.quadraticCurveTo(-9, -76 + wv, 3, -71);
      c.lineTo(3 + wv * .4, -46); c.lineTo(-6, -52 + wv); c.lineTo(-14, -45); c.lineTo(-20, -48); c.closePath(); c.stroke(); c.fill();
      c.fillStyle = k('#141012'); c.beginPath(); c.arc(-8, -61, 5, 0, TAU); c.fill(); c.fillRect(-11.5, -58, 7, 5);
      // legs
      c.fillStyle = k(OL); c.fillRect(-19 + st * 3, 14, 17, 26); c.fillRect(2 - st * 3, 14, 17, 26);
      c.fillStyle = k(IR); c.fillRect(-17 + st * 3, 16, 13, 14); c.fillRect(4 - st * 3, 16, 13, 14);
      c.fillStyle = k(RD); c.fillRect(-17 + st * 3, 28, 13, 4); c.fillRect(4 - st * 3, 28, 13, 4);
      // whole-body outline, then the fills on top
      c.lineWidth = 5; c.stroke(BSIL);
      c.fillStyle = k(skin); c.beginPath(); c.ellipse(0, 0, 28, 25, 0, 0, TAU); c.fill();
      c.fillStyle = k(IR); c.beginPath(); c.ellipse(1, 3, 22, 20, 0, 0, TAU); c.fill();
      c.strokeStyle = k(RD); c.lineWidth = 4; c.stroke();
      c.fillStyle = k(IRH); c.fillRect(-12, -10, 26, 3); c.fillRect(-15, 0, 4, 10);
      c.fillStyle = k(RD); c.fillRect(-14, 14, 30, 6);
      c.fillStyle = k('#f8eccc'); c.beginPath(); c.arc(1, 4, 6, 0, TAU); c.strokeStyle = k(OL); c.lineWidth = 2; c.stroke(); c.fill();
      c.fillStyle = k(OL); c.fillRect(-2, 2, 2.5, 2.5); c.fillRect(2.5, 2, 2.5, 2.5);
      // pauldrons with red rims and bone spikes
      c.fillStyle = k(RD); c.beginPath(); c.moveTo(-11, -14); c.arc(-22, -14, 11, 0, TAU); c.moveTo(33, -14); c.arc(22, -14, 11, 0, TAU);
      c.strokeStyle = k(OL); c.lineWidth = 3; c.stroke(); c.fill();
      c.fillStyle = k(IR); c.beginPath(); c.moveTo(-14, -14); c.arc(-22, -14, 8, 0, TAU); c.moveTo(30, -14); c.arc(22, -14, 8, 0, TAU); c.fill();
      c.fillStyle = k(IRH); c.fillRect(-27, -19, 6, 2.5); c.fillRect(17, -19, 6, 2.5);
      c.fillStyle = k('#fff4d4'); c.beginPath();
      for (const sx of [-22, 22]) for (let i = -1; i <= 1; i++) {
        const a = -Math.PI / 2 + i * .55 + (sx < 0 ? -.25 : .25);
        c.moveTo(sx + Math.cos(a - .2) * 10, -14 + Math.sin(a - .2) * 10); c.lineTo(sx + Math.cos(a) * 20, -14 + Math.sin(a) * 20); c.lineTo(sx + Math.cos(a + .2) * 10, -14 + Math.sin(a + .2) * 10);
      }
      c.strokeStyle = k(OL); c.lineWidth = 2; c.stroke(); c.fill();
      // head, jaw, tusks
      c.fillStyle = k(skin); c.beginPath(); c.moveTo(16, -30); c.arc(3, -30, 13, 0, TAU); c.moveTo(17, -23); c.arc(8, -23, 9, 0, TAU);
      c.strokeStyle = k(OL); c.lineWidth = 3.5; c.stroke(); c.fill();
      c.fillStyle = k(skinD); c.fillRect(-3, -31, 16, 2.5);
      c.fillStyle = k(e.rage ? '#ffee50' : '#ff3010'); c.fillRect(-.5, -29.5, 5, 4); c.fillRect(7.5, -29.5, 5, 4);
      if (e.mode === 'cry') { c.fillStyle = k('#300806'); c.beginPath(); c.ellipse(10, -20, 5, 4, 0, 0, TAU); c.fill(); }
      c.fillStyle = k('#fff8e0'); c.beginPath();
      c.moveTo(5, -18); c.lineTo(6, -27); c.lineTo(8.5, -18); c.closePath(); c.moveTo(13, -18); c.lineTo(14.5, -26); c.lineTo(16.5, -18); c.closePath();
      c.lineWidth = 2; c.stroke(); c.fill();
      // black iron helm with a red crest and great bone horns
      c.fillStyle = k(IR); c.beginPath(); c.arc(2, -33, 13.5, Math.PI, 0); c.closePath(); c.lineWidth = 3; c.stroke(); c.fill();
      c.fillStyle = k(IRH); c.fillRect(-6, -43, 5, 3);
      c.fillStyle = k(OL); c.fillRect(-1.5, -49, 7, 15);
      c.fillStyle = k(RD); c.fillRect(-11.5, -35, 27, 3); c.fillRect(0, -47.5, 4, 12);
      c.fillStyle = k('#fff4d4'); c.beginPath();
      c.moveTo(-9, -38); c.quadraticCurveTo(-24, -40, -24, -60); c.quadraticCurveTo(-14, -48, -4, -45);
      c.moveTo(13, -38); c.quadraticCurveTo(28, -40, 28, -60); c.quadraticCurveTo(18, -48, 8, -45); c.closePath(); c.lineWidth = 2.5; c.stroke(); c.fill();
      // great double-bitted axe
      c.save(); c.translate(26, -4); c.rotate(ax);
      c.fillStyle = k(OL); c.fillRect(-4.5, -54, 9, 70);
      c.fillStyle = k(skin); c.beginPath(); c.arc(0, 0, 7, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = k('#8a5228'); c.fillRect(-2.5, -52, 5, 66);
      c.fillStyle = k('#e8eef6'); c.beginPath();
      c.moveTo(1, -50); c.quadraticCurveTo(18, -64, 22, -48); c.quadraticCurveTo(25, -36, 20, -27); c.quadraticCurveTo(10, -36, 1, -35); c.closePath();
      c.moveTo(-1, -50); c.quadraticCurveTo(-18, -64, -22, -48); c.quadraticCurveTo(-25, -36, -20, -27); c.quadraticCurveTo(-10, -36, -1, -35); c.closePath();
      c.lineWidth = 4; c.stroke(); c.fill();
      c.strokeStyle = k('#ffffff'); c.lineWidth = 2; c.beginPath();
      c.moveTo(22, -48); c.quadraticCurveTo(25, -36, 20, -27); c.moveTo(-22, -48); c.quadraticCurveTo(-25, -36, -20, -27); c.stroke();
      c.fillStyle = k(RD); c.fillRect(-3, -40, 6, 4);
      c.restore();
      c.restore();
    },
    death(e, Z) { Z.banner('The Warchief has fallen!', '#ffd060', true); Z.burst(e.x, e.y, '#e04a2a', 30, 220); Z.shake(12); },
  };

  /* ---------- music: original martial march in D minor ---------- */
  const SC = [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 20];
  const CH = { Dm: [0, 3, 7], Bb: [-4, 0, 3], C: [-2, 2, 5], Gm: [5, 8, 12], A: [7, 11, 14], F: [3, 7, 10] };
  const PROG = ['Dm', 'Bb', 'C', 'Dm', 'Gm', 'Bb', 'A', 'A', 'Dm', 'F', 'C', 'Bb', 'Gm', 'Dm', 'A', 'Dm'];
  const M1 = [[0, 0, 6], [6, 0, 2], [8, 1, 2], [10, 2, 2], [12, 4, 4], [16, 5, 3], [19, 4, 1], [20, 3, 4], [24, 0, 8]];
  const M1b = [[0, 7, 6], [6, 7, 2], [8, 8, 2], [10, 9, 2], [12, 11, 4], [16, 9, 4], [20, 8, 2], [22, 7, 2], [24, 6, 8]];
  const M2 = [[0, 7, 4], [4, 5, 2], [6, 6, 2], [8, 7, 6], [14, 8, 2], [16, 9, 6], [22, 8, 2], [24, 7, 4], [28, 5, 4]];
  const M3 = [[0, 3, 3], [3, 2, 1], [4, 1, 4], [8, 3, 2], [10, 4, 2], [12, 6, 4], [16, 7, 6], [22, 6, 2], [24, 4, 4], [28, 2, 4]];
  const M4 = [[0, 8, 6], [6, 7, 2], [8, 6, 4], [12, 4, 4], [16, 6, 3], [19, 7, 1], [20, 8, 4], [24, 4, 8]];
  const M4b = [[0, 8, 6], [6, 7, 2], [8, 6, 4], [12, 4, 4], [16, 7, 12]];
  const PHR = [M1, M3, M2, M4, M1b, M3, M2, M4b];
  const SN = [.3, 0, .12, .1, .26, 0, .12, 0, .3, 0, .12, .1, .24, .1, .14, .18];
  const FIFE = [0, 1, 2, 1, 2, 1, 0, 2];
  const BPM = 108, DIV = 4, SD = 60 / BPM / DIV;

  return {
    id: 'wc2', name: "Grunt's Crossing", nod: 'Warcraft II', portal: '214,72,40', bg: '#4c6e2e', dark: .36, dim: .2,
    ground: drawGround,
    under: drawUnder,
    ambient: drawAmbient,

    mix: { grunt: 5, troll: 2, ogre: 1, sapper: 2 },
    target: .9,
    foes: { grunt, troll, ogre, sapper },
    boss,

    events: [
      { t: 15, run(Z) { Z.banner('The Horde advances!', '#e04a2a', true); formation(Z, 'grunt', 9, Z.rnd(0, TAU), 560); Z.sfx('warn'); } },
      { t: 36, run(Z) {
        Z.banner('Sappers in the grass! Mind the powder kegs!', '#ffb040', false);
        const a = Z.rnd(0, TAU);
        for (let i = 0; i < 6; i++) { const b = a + (i - 2.5) * .18; Z.spawn('sapper', Z.P.x + Math.cos(b) * 600, Z.P.y + Math.sin(b) * 600); }
      } },
      { t: 70, run(Z) {
        Z.banner('Hill brutes and axe-trolls close in!', '#c08a50', false);
        const a = Z.rnd(0, TAU);
        for (let i = 0; i < 2; i++) Z.spawn('ogre', Z.P.x + Math.cos(a + i * .4) * 580, Z.P.y + Math.sin(a + i * .4) * 580);
        for (let i = 0; i < 4; i++) Z.spawn('troll', Z.P.x + Math.cos(a + Math.PI + i * .3) * 560, Z.P.y + Math.sin(a + Math.PI + i * .3) * 560);
      } },
      { t: 90, run(Z) {
        Z.banner('Catapults loosed upon the field!', '#e0a050', true); Z.sfx('warn'); Z.shake(3);
        Z.hazard(Z.P.x, Z.P.y, { r: 62, t: 1.2, dmg: 14, col: '200,160,90' });
        const o = Z.rnd(0, TAU);
        for (let i = 0; i < 8; i++) {
          const a = o + i * TAU / 8, d = i % 2 ? 120 : 210;
          Z.hazard(Z.P.x + Math.cos(a) * d, Z.P.y + Math.sin(a) * d, { r: 62, t: 1.25 + i * .09, dmg: 14, col: '200,160,90' });
        }
      } },
      { t: 118, run(Z) {
        Z.banner('A second warband marches!', '#e04a2a', false);
        const a = Z.rnd(0, TAU); formation(Z, 'grunt', 5, a, 540); formation(Z, 'grunt', 5, a + Math.PI, 540);
      } },
      { t: 138, run(Z) {
        Z.banner('Hold fast - the war-horns fade!', '#ffd060', false);
        const a = Z.rnd(0, TAU);
        for (let i = 0; i < 4; i++) Z.spawn('sapper', Z.P.x + Math.cos(a + i * .5) * 600, Z.P.y + Math.sin(a + i * .5) * 600);
      } },
    ],

    music: {
      bpm: BPM, div: DIV,
      step(s, t, A) {
        const bar = Math.floor(s / 16), b = s % 16, lb = bar % 16, sec = Math.floor(bar / 16) % 2;
        const cn = PROG[lb], ch = CH[cn], root = ch[0], boss = A.boss;
        // low strings and timpani
        if (b === 0) {
          A.pad(ch.map(x => 50 + x), t, SD * 16, .015, { type: 'sawtooth', cutoff: boss ? 1300 : 900, q: 3, detune: 8 });
          A.tom(t, A.mtof(38 + root), .38);
          if (lb % 4 === 0) A.hat(t, .05, true);
        }
        if (b === 8) A.tom(t, A.mtof(38 + ch[2]), .26);
        if (lb % 4 === 3 && (b === 10 || b === 12 || b === 14)) A.tom(t, A.mtof(50 + root - (b - 10)), .3);
        // marching bass
        if (b % 4 === 0 || b === 14) {
          const m = b === 8 ? 38 + ch[2] : 38 + root;
          A.tone(t, m, SD * (b === 14 ? 1.6 : 3.4), .065, { type: 'sawtooth', cutoff: 520, q: 2 });
        }
        // snare march + rolls
        if (SN[b] > 0) A.snare(t, SN[b] + (boss ? .04 : 0));
        if ((lb % 4 === 3 || boss) && b >= 12) { A.snare(t, .09); A.snare(t + SD / 2, .08); }
        if (b === 0 || b === 8 || (boss && b % 4 === 0)) A.kick(t, boss ? .75 : .55);
        // brass lead
        const ph = PHR[Math.floor(lb / 2)], ps = (lb % 2) * 16 + b;
        for (const [st, dg, len] of ph) {
          if (st !== ps) continue;
          let semi = dg < 0 ? [-1, -3, -5][-dg - 1] : SC[dg];
          if (cn === 'A' && mod(semi, 12) === 10) semi += 1; // harmonic-minor leading tone over the dominant
          const dur = SD * len * .95, m = 62 + semi;
          A.tone(t, m, dur, .048, { type: 'sawtooth', attack: .02, cutoff: 800, sweep: len >= 4 ? 2400 : 1600, vib: .3, detune: 6 });
          if (len >= 4 && (sec === 1 || boss)) A.tone(t, m - 5, dur, .022, { type: 'sawtooth', attack: .03, cutoff: 700, sweep: 1600 });
        }
        // fife counter-line in the second half
        if ((sec === 1 || A.inten > .6) && b % 2 === 0 && !boss)
          A.tone(t, 74 + ch[FIFE[b / 2]], SD * 1.6, .016, { type: 'triangle', decay: true, vib: .2 });
        // boss: brass chord stabs and heavier toms
        if (boss) {
          if (b === 0 || b === 6 || b === 12) for (const x of ch) A.tone(t, 62 + x, SD * 1.4, .026, { type: 'sawtooth', cutoff: 1800, sweep: 500 });
          if (b === 6 || b === 14) A.tom(t, A.mtof(45 + root), .32);
          if (b % 2 === 1) A.hat(t, .03);
        }
      },
    },
  };
})());
