// Zone tibia: a sunny starter isle drawn as a classic 32px oblique tile map, where every wall, tree and rock
// leans up and to the left. Rats, rotworms, spiders and amazons roam it; a horned magus waits. A nod to Tibia.
ZONES.push((() => {
  const TAU = Math.PI * 2, T = 48, BS = 32, U = 3; // tile px, macro block (tiles), art pixel (48px tile = 16 art px)
  const fl = Math.floor;
  const W = (white, c) => (white ? '#fff' : c);
  const poly = (p, a) => { p.moveTo(a[0], a[1]); for (let i = 2; i < a.length; i += 2) p.lineTo(a[i], a[i + 1]); p.closePath(); };
  const circ = (p, x, y, r) => { if (!(r > 0)) return; p.moveTo(x + r, y); p.arc(x, y, r, 0, TAU); };
  const ell = (p, x, y, rx, ry) => { p.moveTo(x + rx, y); p.ellipse(x, y, rx, ry, 0, 0, TAU); };

  /* ================= Map: a designed island town on a repeating 32x32-tile macro grid =================
     Each block has a dirt crossroads (rows/cols 15-16) with a well, signpost, lamps and a sewer grate, and four
     quadrants that each hold one set-piece: a village (two houses), a fenced field, a forest, a rocky hill with a
     cave and a ladder down to the rotworm caves, or a lake with a pier. Quadrants are mirrored so they face the road. */
  const GRASS = 0, DIRT = 1, SAND = 2, WATER = 3, WOOD = 4, SOIL = 5, ROCKF = 6;
  const TREE = 1, BUSH = 2, WALL = 3, TORCH = 4, HEARTH = 5, TABLE = 6, BARREL = 7, CHEST = 8, COUNTER = 9, CRATE = 10,
    FENCE = 11, WHEAT = 12, PUMPKIN = 13, SCARE = 14, WELL = 15, SIGN = 16, LAMP = 17, GRATE = 18, LADDER = 19,
    BURROW = 20, ROCK = 21, CAVE = 22, PIER = 23, REED = 24, LILY = 25, STONE = 26, FLOWER = 27, SHROOM = 28, STUMP = 29, BOAT = 30;
  const VILLAGE = 1, FIELD = 2, FOREST = 3, MOUNT = 4, LAKE = 5;
  const KINDS = [VILLAGE, FIELD, FOREST, MOUNT, LAKE, FOREST, FIELD, MOUNT];
  const pk = (g, o = 0, m = 0) => g | (o << 3) | (m << 9);
  const gOf = v => v & 7, oOf = v => (v >> 3) & 63, mOf = v => (v >> 9) & 1;
  const isWall = v => { const o = oOf(v); return o === WALL || o === TORCH || o === HEARTH; };

  const featKind = (Z, bx, by, q) => {
    if (q === fl(Z.hash(bx * 5 + 1, by * 7 + 2) * 4)) return VILLAGE; // every block has a hamlet
    return KINDS[fl(Z.hash(bx * 13 + q * 7 + 3, by * 11 - q * 5 + 1) * 8)];
  };
  const village = (Z, lx, ly, bx, by, q) => {
    const m = Z.hash(bx * 3 + q, by * 5 - q) < .5 ? 0 : 1, n = 1 - m;
    if (lx >= 1 && lx <= 7 && ly >= 2 && ly <= 7) { // cottage
      if (lx > 1 && lx < 7 && ly > 2 && ly < 7) {
        if (lx === 2 && ly === 3) return pk(WOOD, CHEST, m);
        if (lx === 4 && ly === 4) return pk(WOOD, TABLE, m);
        if (lx === 6 && (ly === 3 || ly === 4)) return pk(WOOD, BARREL, m);
        if (lx === 2 && ly === 6) return pk(WOOD, CRATE, m);
        return pk(WOOD, 0, m);
      }
      if (lx === 4 && ly === 7) return pk(WOOD, 0, m);
      if (lx === 5 && ly === 2) return pk(WOOD, HEARTH, m);
      if (ly === 7 && (lx === 2 || lx === 6)) return pk(WOOD, TORCH, m);
      return pk(WOOD, WALL, m);
    }
    if (lx >= 9 && lx <= 13 && ly >= 6 && ly <= 12) { // the trader's shop
      if (lx > 9 && lx < 13 && ly > 6 && ly < 12) {
        if (ly === 9 && lx < 12) return pk(WOOD, COUNTER, n);
        if (ly === 7) return pk(WOOD, lx === 10 ? BARREL : lx === 11 ? CRATE : CHEST, n);
        return pk(WOOD, 0, n);
      }
      if (lx === 11 && ly === 12) return pk(WOOD, 0, n);
      if (ly === 12 && (lx === 10 || lx === 12)) return pk(WOOD, TORCH, n);
      return pk(WOOD, WALL, n);
    }
    if ((lx === 4 && ly >= 8) || (lx === 11 && ly >= 13) || (ly === 13 && lx >= 4 && lx <= 11)) return pk(DIRT);
    if (lx === 8 && ly === 8) return pk(GRASS, BARREL);
    if (lx === 7 && ly === 10) return pk(GRASS, CRATE);
    return -1;
  };
  const field = (lx, ly, h) => {
    if (lx >= 1 && lx <= 13 && ly >= 1 && ly <= 12) {
      if (lx === 1 || lx === 13 || ly === 1 || ly === 12) return lx === 7 && ly === 12 ? pk(DIRT) : pk(GRASS, FENCE);
      if (ly <= 6) return pk(SOIL, WHEAT);
      if (lx === 7 && ly === 9) return pk(SOIL, SCARE);
      if (ly >= 8 && ly <= 10 && h > .3) return pk(SOIL, PUMPKIN);
      return pk(SOIL);
    }
    if (lx === 7 && ly >= 13) return pk(DIRT);
    return -1;
  };
  const forest = (lx, ly, h) => {
    if (lx === 7 && ly >= 9) return pk(DIRT);
    if (lx > 13 || ly > 13 || (lx >= 12 && ly >= 12)) return -1;
    const dx = lx - 7, dy = ly - 7, d = dx * dx + dy * dy;
    if (d < 5) return pk(GRASS, d === 0 ? STUMP : h < .45 ? SHROOM : h < .6 ? FLOWER : 0);
    if (h > .2) return pk(GRASS, TREE);
    if (h > .1) return pk(GRASS, BUSH);
    return pk(GRASS, h < .05 ? SHROOM : 0);
  };
  const mount = (Z, lx, ly, h, bx, by, q) => {
    const bot = lx === 7 ? 10 : 8 + fl(Z.hash(bx * 31 + lx, by * 17 + q) * 3);
    if (lx >= 1 && lx <= 13 && ly >= 1 && ly <= bot) {
      if ((lx === 1 || lx === 13) && (ly === 1 || ly === bot)) return -1;
      return pk(ROCKF, lx === 7 && ly === 10 ? CAVE : ROCK);
    }
    if (lx === 7 && ly >= 11) return pk(DIRT);
    if (lx === 11 && ly === 12) return pk(DIRT, LADDER);
    if (lx === 3 && ly === 12) return pk(GRASS, BURROW);
    if (ly === bot + 1 && lx >= 1 && lx <= 13 && h < .3) return pk(GRASS, STONE);
    return -1;
  };
  const lake = (Z, lx, ly, h, tx, ty) => {
    const dx = (lx - 7) / 5.6, dy = (ly - 6.5) / 5.2, d = dx * dx + dy * dy + (Z.hash(tx * 3 - 1, ty * 5 + 2) - .5) * .28;
    if (lx === 7 && ly >= 8 && ly <= 13) return pk(d < 1 ? WATER : SAND, PIER);
    if (d < 1) return pk(WATER, lx === 9 && ly === 9 ? BOAT : h < .08 ? LILY : 0);
    if (d < 1.55) return pk(SAND, h < .28 ? REED : h < .33 ? STONE : 0);
    return -1;
  };
  const cellAt = (Z, tx, ty) => {
    const bx = fl(tx / BS), by = fl(ty / BS), ix = tx - bx * BS, iy = ty - by * BS;
    const h = Z.hash(tx * 7 + 3, ty * 11 - 5);
    if (iy === 13 && ix === 13) return pk(GRASS, WELL);
    if (iy === 13 && ix === 14) return pk(GRASS, SIGN);
    if ((ix === 18 && iy === 13) || (ix === 13 && iy === 18)) return pk(GRASS, LAMP);
    if (ix === 21 && iy === 16) return pk(DIRT, GRATE);
    if (ix === 15 || ix === 16 || iy === 15 || iy === 16) return pk(DIRT);
    const qx = ix > 16 ? 1 : 0, qy = iy > 16 ? 1 : 0, q = qx + qy * 2;
    const lx = qx ? 31 - ix : ix, ly = qy ? 31 - iy : iy;
    const k = featKind(Z, bx, by, q);
    let r = -1;
    if (k === VILLAGE) r = village(Z, lx, ly, bx, by, q);
    else if (k === FIELD) r = field(lx, ly, h);
    else if (k === FOREST) r = forest(lx, ly, h);
    else if (k === MOUNT) r = mount(Z, lx, qy ? iy - 17 : iy, h, bx, by, q); // cliffs always face south
    else r = lake(Z, lx, ly, h, tx, ty);
    if (r >= 0) return r;
    if (h < .018) return pk(GRASS, STONE);
    if (h < .07) return pk(GRASS, FLOWER);
    if (h < .085) return pk(GRASS, BUSH);
    if (h < .095 && lx < 13 && ly < 13) return pk(GRASS, TREE);
    return pk(GRASS);
  };
  // World tile of a quadrant-local village coordinate (inverse of the mirroring in cellAt).
  const vtile = (bx, by, q, lx, ly) => [bx * BS + (q & 1 ? 31 - lx : lx), by * BS + (q & 2 ? 31 - ly : ly)];
  const TORCHES = [[2, 7], [6, 7], [10, 12], [12, 12]];

  /* ================= Floor art (cached) ================= */
  const C = {
    g1: '#5b893a', g2: '#578437', gd: '#47712d', gl: '#6c9944', gb: '#3f6727', gj: '#5a8839', gjd: '#456e2c',
    d1: '#7f603f', d2: '#7a5b3b', dd: '#5f4630', dl: '#987955',
    s1: '#c2ac79', s2: '#bca674', sd: '#a08b5d', sl: '#d6c595',
    w1: '#3a6a8e', w2: '#37668a', wd: '#2d5677', shal: '#4f87a8',
    f1: '#93693f', fs: '#664526', fh: '#a67b4c',
    o1: '#6a4b2d', od: '#543a22', ol: '#806040', rf: '#4e483e',
  };
  const QK = ['g2', 'gd', 'gl', 'gb', 'd1', 'd2', 'dd', 'dl', 's1', 's2', 'sd', 'sl', 'o1', 'od', 'ol', 'f1', 'fh', 'fs', 'w1', 'w2', 'wd', 'shal', 'rf', 'gj', 'gjd'];
  const WH = 28, RH = 30, K = .5; // wall and cliff heights; height h is drawn shifted by (-K*h, -h): the Tibia lean

  // Oblique block: footprint top-left (x, y), w x d, height h. faces: 1 = east, 2 = south.
  const blk = (c, x, y, w, d, h, top, south, east, ol, faces = 3) => {
    const o = new Path2D();
    const k = K * h;
    if (faces & 1) { const p = new Path2D(), a = [x + w, y, x + w, y + d, x + w - k, y + d - h, x + w - k, y - h]; poly(p, a); poly(o, a); c.fillStyle = east; c.fill(p); }
    if (faces & 2) { const p = new Path2D(), a = [x, y + d, x + w, y + d, x + w - k, y + d - h, x - k, y + d - h]; poly(p, a); poly(o, a); c.fillStyle = south; c.fill(p); }
    const t = new Path2D(); t.rect(x - k, y - h, w, d); o.rect(x - k, y - h, w, d);
    c.fillStyle = top; c.fill(t);
    if (ol) { c.strokeStyle = ol; c.lineWidth = 1.3; c.stroke(o); }
  };
  // Shear transforms that map (u along the face, v = height) onto the south / east face of a tile.
  const southFace = (c, X, Y) => { c.save(); c.translate(X, Y + T); c.transform(1, 0, -K, -1, 0, 0); };
  const eastFace = (c, X, Y) => { c.save(); c.translate(X + T, Y + T); c.transform(0, -1, -K, -1, 0, 0); };
  const cyl = (c, x, y, r, h, side, top, ol) => {
    const p = new Path2D(), q = new Path2D(), a = Math.atan2(-K, 1);
    p.arc(x, y, r, a, a + Math.PI); p.arc(x - K * h, y - h, r, a + Math.PI, a + TAU); p.closePath();
    circ(q, x - K * h, y - h, r);
    c.fillStyle = side; c.fill(p); c.fillStyle = top; c.fill(q);
    c.strokeStyle = ol; c.lineWidth = 1.3; c.stroke(p); c.stroke(q);
  };

  const drawWall = (c, X, Y, m, faces, kind) => {
    const S = m ? { t: '#6a4628', s: '#b48c5a', e: '#8e6a42', o: '#3a2412', j: '#6e4c2c' } : { t: '#918d82', s: '#7b776d', e: '#625e56', o: '#33312b', j: '#55524a' };
    blk(c, X, Y, T, T, WH, S.t, S.s, S.e, S.o, faces);
    const tp = new Path2D(), x = X - K * WH, y = Y - WH; // top cap joints
    if (m) { tp.rect(x, y + 15, T, 1.5); tp.rect(x, y + 31, T, 1.5); } else { tp.rect(x + 4, y + 4, T - 8, 1.5); tp.rect(x + 4, y + T - 6, T - 8, 1.5); tp.rect(x + 23, y + 4, 1.5, T - 8); }
    c.fillStyle = S.j; c.fill(tp);
    if (faces & 2) {
      southFace(c, X, Y);
      const p = new Path2D();
      if (m) { for (let v = 7; v < WH; v += 7) p.rect(0, v, T, 1.3); p.rect(0, 0, 3.5, WH); p.rect(T - 3.5, 0, 3.5, WH); p.rect(22, 0, 3, WH); }
      else for (let r = 0; r < 4; r++) { p.rect(0, r * 7, T, 1.1); for (let u = (r & 1) * 8 + 4; u < T; u += 16) p.rect(u, r * 7, 1.1, 7); }
      c.fillStyle = S.j; c.fill(p);
      if (kind === HEARTH) {
        const a = new Path2D(); a.moveTo(12, 0); a.lineTo(12, 10); a.arc(24, 10, 12, Math.PI, 0, true); a.lineTo(36, 0); a.closePath();
        c.fillStyle = '#5a5248'; c.save(); c.translate(-2, 0); c.scale(1.08, 1.12); c.fill(a); c.restore();
        c.fillStyle = '#1a0e08'; c.fill(a);
        const em = new Path2D(); em.rect(15, 1, 4, 2); em.rect(22, 1.5, 5, 2); em.rect(30, 1, 3, 2);
        c.fillStyle = '#e0561a'; c.fill(em);
      } else if (kind === TORCH) {
        const b = new Path2D(); b.rect(22.5, 8, 3, 9); b.rect(20, 16, 8, 3);
        c.fillStyle = '#2a2420'; c.fill(b);
      }
      c.restore();
    }
    if (faces & 1) {
      eastFace(c, X, Y);
      const p = new Path2D();
      if (m) { for (let v = 7; v < WH; v += 7) p.rect(0, v, T, 1.3); }
      else for (let r = 0; r < 4; r++) { p.rect(0, r * 7, T, 1.1); for (let u = (r & 1) * 8 + 4; u < T; u += 16) p.rect(u, r * 7, 1.1, 7); }
      c.fillStyle = m ? '#5e4024' : '#47443d'; c.fill(p);
      c.restore();
    }
    if (kind === HEARTH) blk(c, X + 12 - K * WH, Y + 12 - WH, 22, 22, 14, '#6e6a62', '#5d5952', '#4a4741', '#2a2824');
  };

  const drawRock = (c, Z, X, Y, tx, ty, at, cave) => {
    const rk = v => gOf(v) === ROCKF;
    const e = !rk(at(tx + 1, ty)), s = !rk(at(tx, ty + 1)), n = !rk(at(tx, ty - 1)), w = !rk(at(tx - 1, ty));
    const h = Z.hash(tx * 17 + 5, ty * 13 - 7), x = X - K * RH, y = Y - RH;
    blk(c, X, Y, T, T, RH, h < .5 ? '#7a7366' : '#757063', '#635c51', '#504a43', null, (e ? 1 : 0) | (s ? 2 : 0));
    const lt = new Path2D(), dk = new Path2D(), cr = new Path2D();
    for (let i = 0; i < 4; i++) {
      const a = x + 8 + Z.hash(tx * 3 + i, ty * 7) * 32, b = y + 8 + Z.hash(tx * 5, ty * 3 + i) * 32, r = 5 + Z.hash(tx + i, ty - i) * 8;
      ell(dk, a + 2, b + 2.5, r, r * .78); ell(lt, a - .5, b - .5, r * .85, r * .62);
    }
    if (h > .55) { cr.moveTo(x + 10, y + 30); cr.lineTo(x + 18, y + 26); cr.lineTo(x + 22, y + 33); cr.lineTo(x + 32, y + 30); }
    c.fillStyle = '#5a554b'; c.fill(dk); c.fillStyle = '#8a8476'; c.fill(lt);
    const o = new Path2D();
    if (n) { o.moveTo(x, y); o.lineTo(x + T, y); }
    if (w) { o.moveTo(x, y); o.lineTo(x, y + T); }
    if (e) { o.moveTo(X + T, Y); o.lineTo(X + T, Y + T); o.lineTo(x + T, y + T); o.moveTo(x + T, y); o.lineTo(X + T, Y); }
    if (s) { o.moveTo(X, Y + T); o.lineTo(X + T, Y + T); o.moveTo(x, y + T); o.lineTo(X, Y + T); }
    c.strokeStyle = '#3e3a32'; c.lineWidth = 1.2; c.stroke(cr);
    c.strokeStyle = '#2f2b25'; c.lineWidth = 1.6; c.stroke(o);
    if (s) {
      southFace(c, X, Y);
      const p = new Path2D();
      p.rect(0, 9 + h * 4, T * (.4 + h * .5), 1.4); p.rect(T * .3, 19 + h * 3, T * .7, 1.4); p.rect(8 + h * 30, 2, 1.4, 9);
      c.fillStyle = '#4e483f'; c.fill(p);
      if (cave) {
        const a = new Path2D(); a.moveTo(9, 0); a.lineTo(9, 13); a.arc(24, 13, 15, Math.PI, 0, true); a.lineTo(39, 0); a.closePath();
        c.fillStyle = '#3a2a1a'; c.save(); c.translate(-2.5, 0); c.scale(1.1, 1.1); c.fill(a); c.restore();
        c.fillStyle = '#0e0905'; c.fill(a);
        const tb = new Path2D(); tb.rect(7, 0, 3.5, 22); tb.rect(37.5, 0, 3.5, 22); tb.rect(6, 22, 36, 3.5);
        c.fillStyle = '#6a4626'; c.fill(tb);
      }
      c.restore();
    }
    if (e) {
      eastFace(c, X, Y);
      const p = new Path2D(); p.rect(0, 12 + h * 5, T * .8, 1.4); p.rect(T * .2, 22, T * .6, 1.4);
      c.fillStyle = '#423d35'; c.fill(p);
      c.restore();
    }
    if (cave) { // dark mouth spilling onto the ground in front
      c.fillStyle = 'rgba(14,9,5,.45)'; c.beginPath(); c.ellipse(X + 24, Y + T + 4, 16, 6, 0, 0, TAU); c.fill();
    }
  };

  const drawTree = (c, Z, X, Y, tx, ty) => {
    const h = Z.hash(tx * 23 - 7, ty * 19 + 3), s = .9 + h * .25;
    if (h < .22) { // fir
      const fx = X + 30, fy = Y + 42, tr = new Path2D(); poly(tr, [fx - 3.5, fy, fx + 3.5, fy, fx - 1.5, fy - 10, fx - 8.5, fy - 10]);
      c.fillStyle = '#5a3a20'; c.fill(tr);
      const sil = new Path2D(), lit = new Path2D();
      for (let i = 0; i < 3; i++) {
        const k = i * 14 * s, bw = (21 - i * 5) * s, cx = fx - 5 - k * K, cy = fy - 8 - k;
        poly(sil, [cx - bw, cy, cx + bw, cy, cx - 9 * s, cy - 27 * s]);
        poly(lit, [cx - bw + 3, cy - 2, cx - 3, cy - 2, cx - 9 * s, cy - 25 * s]);
      }
      c.strokeStyle = '#163222'; c.lineWidth = 1.6; c.lineJoin = 'round'; c.stroke(sil);
      c.fillStyle = '#2a5638'; c.fill(sil); c.fillStyle = '#3b7248'; c.fill(lit);
      return;
    }
    const bx = X + 31, by = Y + 42, tk = new Path2D();
    poly(tk, [bx - 5, by, bx + 5, by, bx - 4.5, by - 19, bx - 14.5, by - 19]);
    c.fillStyle = '#6a4426'; c.fill(tk); c.strokeStyle = '#2e1c0e'; c.lineWidth = 1.3; c.stroke(tk);
    const cx = X + 19, cy = Y + 7, sil = new Path2D(), mid = new Path2D(), hi = new Path2D(), dk = new Path2D(), ap = new Path2D();
    const CL = [[-10, 5, 14], [10, 5, 14], [0, -7, 15], [2, 10, 13], [-3, 0, 14]];
    for (const [dx, dy, r] of CL) { circ(sil, cx + dx * s, cy + dy * s, r * s); circ(mid, cx + dx * s - 2.5, cy + dy * s - 3, r * s * .72); }
    circ(hi, cx - 7 * s, cy - 8 * s, 5 * s); circ(hi, cx + 3 * s, cy - 13 * s, 3.6 * s); circ(hi, cx - 13 * s, cy + 1 * s, 3.4 * s);
    for (let i = 0; i < 7; i++) dk.rect(fl(cx - 18 + Z.hash(tx * 5 + i, ty) * 34), fl(cy - 14 + Z.hash(tx, ty * 5 + i) * 30), U, U);
    c.strokeStyle = '#1c3812'; c.lineWidth = 1.6; c.stroke(sil);
    c.fillStyle = '#2f5b21'; c.fill(sil); c.fillStyle = '#3e722b'; c.fill(mid); c.fillStyle = '#5a923a'; c.fill(hi);
    c.fillStyle = '#25491a'; c.fill(dk);
    if (h > .8) { for (let i = 0; i < 4; i++) ap.rect(fl(cx - 14 + Z.hash(tx + i * 3, ty) * 26), fl(cy - 8 + Z.hash(tx, ty + i * 3) * 22), U + 1, U + 1); c.fillStyle = '#d0302a'; c.fill(ap); }
  };
  const drawBush = (c, Z, X, Y, tx, ty) => {
    const h = Z.hash(tx * 9 + 2, ty * 21 - 4), cx = X + 24, cy = Y + 30, sil = new Path2D(), hi = new Path2D();
    circ(sil, cx - 7, cy, 9); circ(sil, cx + 6, cy + 1, 9); circ(sil, cx - 1, cy - 7, 10);
    circ(hi, cx - 4, cy - 9, 4); circ(hi, cx - 10, cy - 2, 3);
    c.strokeStyle = '#1c3812'; c.lineWidth = 1.4; c.stroke(sil); c.fillStyle = '#356628'; c.fill(sil); c.fillStyle = '#4f8a34'; c.fill(hi);
    if (h > .55) { const b = new Path2D(); for (let i = 0; i < 4; i++) b.rect(cx - 10 + fl(Z.hash(tx + i, ty * 3) * 18), cy - 8 + fl(Z.hash(tx * 3, ty + i) * 12), U, U); c.fillStyle = h > .8 ? '#3a54d8' : '#d83030'; c.fill(b); }
  };
  const drawBarrel = (c, X, Y) => {
    const x = X + 28, y = Y + 32, h = 20, r = 12;
    cyl(c, x, y, r, h, '#8a5a2e', '#a8743e', '#33200e');
    const hp = new Path2D(), a = Math.atan2(-K, 1);
    for (const f of [.22, .72]) { const hx = x - K * h * f, hy = y - h * f; hp.moveTo(hx + Math.cos(a) * r, hy + Math.sin(a) * r); hp.arc(hx, hy, r, a, a + Math.PI); }
    c.strokeStyle = '#3a2814'; c.lineWidth = 2; c.stroke(hp);
    c.strokeStyle = '#6a4422'; c.lineWidth = 1.2; c.beginPath(); c.arc(x - K * h, y - h, r * .62, 0, TAU); c.stroke();
  };
  const drawTable = (c, X, Y) => {
    const x = X + 9, y = Y + 14, w = 32, d = 24, lg = new Path2D(), L = 13;
    for (const [a, b] of [[2, 2], [w - 2, 2], [2, d - 2], [w - 2, d - 2]]) { lg.moveTo(x + a, y + b); lg.lineTo(x + a - K * L, y + b - L); }
    c.strokeStyle = '#3a2412'; c.lineWidth = 3.4; c.stroke(lg); c.strokeStyle = '#7a5030'; c.lineWidth = 1.6; c.stroke(lg);
    blk(c, x - K * L, y - L, w, d, 4, '#b08250', '#86603a', '#6e4c2c', '#3a2412');
    const it = new Path2D(), tx = x - K * (L + 4), ty = y - L - 4; it.rect(tx + 4, ty + 4, 7, 6); it.rect(tx + 17, ty + 8, 10, 5);
    c.fillStyle = '#d8c8a0'; c.fill(it);
  };
  const drawChest = (c, X, Y) => {
    const x = X + 10, y = Y + 18, w = 30, d = 20, h = 16;
    blk(c, x, y, w, d, h, '#a8682e', '#8a5426', '#6c4020', '#33200e');
    const g = new Path2D(); g.moveTo(x - K * 9, y + d - 9); g.lineTo(x + w - K * 9, y + d - 9); g.moveTo(x - K * h + 3, y - h + d / 2); g.lineTo(x + w - K * h - 3, y - h + d / 2);
    c.strokeStyle = '#e0b040'; c.lineWidth = 2.2; c.stroke(g);
    c.fillStyle = '#f0c850'; c.fillRect(x + w / 2 - K * 11 - 2.5, y + d - 13, 5, 6);
  };
  const drawCrate = (c, X, Y) => {
    const x = X + 11, y = Y + 14, w = 28, d = 26, h = 22;
    blk(c, x, y, w, d, h, '#b08a58', '#977246', '#7a5a36', '#3e2a14');
    const p = new Path2D(); p.moveTo(x, y + d); p.lineTo(x + w - K * h, y + d - h); p.moveTo(x + w, y + d); p.lineTo(x - K * h, y + d - h);
    c.strokeStyle = '#5e4224'; c.lineWidth = 2; c.stroke(p);
  };
  const drawCounter = (c, X, Y) => {
    blk(c, X, Y + 14, T, 20, 16, '#b88c5a', '#8e6438', '#74502c', '#3a2412');
    const g = new Path2D(), x = X - K * 16, y = Y - 2; g.rect(x + 4, y + 6, 8, 4); g.rect(x + 20, y + 4, 6, 6); g.rect(x + 32, y + 7, 10, 3);
    c.fillStyle = '#e8d090'; c.fill(g);
  };
  const drawFence = (c, X, Y, right, down) => {
    const cx = X + T / 2, cy = Y + T / 2, p = new Path2D();
    for (const h of [7, 15]) {
      if (right) { p.moveTo(cx - K * h, cy - h); p.lineTo(cx + T - K * h, cy - h); }
      if (down) { p.moveTo(cx - K * h, cy - h); p.lineTo(cx - K * h, cy + T - h); }
    }
    c.lineCap = 'butt'; c.strokeStyle = '#3a2412'; c.lineWidth = 4.4; c.stroke(p); c.strokeStyle = '#a87644'; c.lineWidth = 2.2; c.stroke(p);
    blk(c, cx - 3, cy - 3, 7, 7, 21, '#c08a54', '#9a6a3a', '#76502c', '#3a2412');
  };
  const drawPumpkin = (c, Z, X, Y, tx, ty) => {
    const x = X + 22 + Z.hash(tx, ty * 3) * 6, y = Y + 26, lf = new Path2D(), b = new Path2D(), rb = new Path2D(), hi = new Path2D();
    ell(lf, x - 12, y + 6, 8, 4); ell(lf, x + 12, y + 7, 7, 3.5);
    ell(b, x - 5, y, 7, 8); ell(b, x + 5, y, 7, 8); ell(b, x, y, 7, 8.5);
    rb.moveTo(x - 3, y - 7); rb.quadraticCurveTo(x - 5, y, x - 3, y + 7); rb.moveTo(x + 3, y - 7); rb.quadraticCurveTo(x + 5, y, x + 3, y + 7);
    ell(hi, x - 6, y - 3, 2.2, 3.2);
    c.fillStyle = '#4c7a2a'; c.fill(lf);
    c.strokeStyle = '#5a2a08'; c.lineWidth = 1.3; c.stroke(b); c.fillStyle = '#e07a1c'; c.fill(b);
    c.strokeStyle = '#a8500e'; c.stroke(rb); c.fillStyle = '#f6a848'; c.fill(hi);
    c.fillStyle = '#4e5a1a'; c.fillRect(x - 1.5, y - 12, 3, 5);
  };
  const drawScarecrow = (c, X, Y) => {
    const fx = X + 26, fy = Y + 40, p = new Path2D(), bx = fx - K * 26, by = fy - 26;
    p.moveTo(fx, fy); p.lineTo(fx - K * 38, fy - 38); p.moveTo(bx - 14, by); p.lineTo(bx + 14, by);
    c.strokeStyle = '#3a2412'; c.lineWidth = 4.4; c.stroke(p); c.strokeStyle = '#8a6036'; c.lineWidth = 2.4; c.stroke(p);
    const sh = new Path2D(); poly(sh, [bx - 10, by - 3, bx + 10, by - 3, bx + 8, by + 13, bx - 8, by + 13]);
    c.strokeStyle = '#3a1a10'; c.lineWidth = 1.3; c.stroke(sh); c.fillStyle = '#b8402e'; c.fill(sh);
    const hx = fx - K * 40, hy = fy - 40;
    c.fillStyle = '#e0c060'; c.beginPath(); c.arc(hx, hy, 6, 0, TAU); c.fill(); c.stroke();
    const hat = new Path2D(); poly(hat, [hx - 10, hy - 3, hx + 10, hy - 3, hx + 5, hy - 9, hx - 5, hy - 10]);
    c.fillStyle = '#6a4a26'; c.fill(hat); c.stroke(hat);
    c.fillStyle = '#e8d070'; c.fillRect(bx - 16, by - 1, 3, 6); c.fillRect(bx + 13, by - 1, 3, 6);
  };
  const drawWell = (c, X, Y) => {
    const x = X + 28, y = Y + 32, h = 14, r = 17, H = 44, tx = x - K * h, ty = y - h;
    cyl(c, x, y, r, h, '#7c786e', '#8f8b80', '#2e2c27');
    c.fillStyle = '#244862'; c.beginPath(); c.arc(tx, ty, r - 5, 0, TAU); c.fill();
    c.fillStyle = '#4a7a9a'; c.fillRect(tx - 6, ty - 4, 6, 2);
    const p = new Path2D(); p.moveTo(x - r + 1, y - 2); p.lineTo(x - r + 1 - K * H, y - 2 - H); p.moveTo(x + r - 1, y - 2); p.lineTo(x + r - 1 - K * H, y - 2 - H);
    p.moveTo(x - r - 2 - K * H, y - 2 - H); p.lineTo(x + r + 2 - K * H, y - 2 - H);
    c.strokeStyle = '#2e1c0e'; c.lineWidth = 4.4; c.stroke(p); c.strokeStyle = '#7a5230'; c.lineWidth = 2.4; c.stroke(p);
    c.strokeStyle = '#c8b890'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - K * H, y - 2 - H); c.lineTo(x - K * H, ty - 8); c.stroke();
    c.fillStyle = '#6a4422'; c.fillRect(x - K * H - 3, ty - 9, 6, 5);
    blk(c, x - r - 6 - K * (H + 1), y - 9 - H - 1, 2 * r + 12, 14, 5, '#a84a32', '#7e3424', '#6a2a1c', '#3a140c');
  };
  const drawSign = (c, X, Y) => {
    const x = X + 22, y = Y + 26, px = x + 6 - K * 30, py = y + 6 - 30, qx = x + 6 - K * 18, qy = y + 6 - 18;
    blk(c, x, y, 14, 14, 8, '#8f8b80', '#7b776d', '#625e56', '#2e2c27');
    const p = new Path2D(); p.moveTo(x + 6 - K * 8, y - 2); p.lineTo(x + 6 - K * 36, y + 6 - 36);
    c.strokeStyle = '#2e1c0e'; c.lineWidth = 5; c.stroke(p); c.strokeStyle = '#7a5230'; c.lineWidth = 3; c.stroke(p);
    const b = new Path2D();
    poly(b, [px - 6, py - 5, px + 16, py - 5, px + 21, py, px + 16, py + 5, px - 6, py + 5]);
    poly(b, [qx + 6, qy - 5, qx - 16, qy - 5, qx - 21, qy, qx - 16, qy + 5, qx + 6, qy + 5]);
    c.strokeStyle = '#3a2412'; c.lineWidth = 1.3; c.stroke(b); c.fillStyle = '#b48a56'; c.fill(b);
    const tl = new Path2D(); tl.rect(px - 2, py - 1, 14, 1.6); tl.rect(qx - 14, qy - 1, 14, 1.6);
    c.fillStyle = '#4a3018'; c.fill(tl);
  };
  // lamp: stone foot, iron post, lantern; the flame (under) sits at (X + 12, Y - 2)
  const drawLamp = (c, X, Y) => {
    const x = X + 26, y = Y + 30, px = x + 6, py = y + 6;
    blk(c, x, y, 12, 12, 6, '#8f8b80', '#7b776d', '#625e56', '#2e2c27');
    c.strokeStyle = '#1e1a18'; c.lineWidth = 3.4; c.beginPath(); c.moveTo(px - K * 6, py - 6); c.lineTo(px - K * 34, py - 34); c.stroke();
    blk(c, px - 6 - K * 33, py - 6 - 33, 12, 12, 12, '#2a2622', '#e8c060', '#c09040', '#1e1a18');
  };
  // Flat decals: grate, ladder hole, burrow, pier, boat
  const drawGrate = (c, X, Y) => {
    c.fillStyle = '#4c4840'; c.fillRect(X + 8, Y + 8, 32, 32);
    c.fillStyle = '#0e0c0a'; c.fillRect(X + 11, Y + 11, 26, 26);
    const b = new Path2D(); for (let i = 0; i < 5; i++) b.rect(X + 13 + i * 5, Y + 11, 2, 26); b.rect(X + 11, Y + 23, 26, 2);
    c.fillStyle = '#6e6a62'; c.fill(b);
  };
  const drawLadder = (c, X, Y) => {
    blk(c, X + 6, Y + 6, 36, 36, 3, '#7a5230', '#5e3e22', '#4a301a', '#2e1c0e');
    c.fillStyle = '#0c0805'; c.fillRect(X + 6, Y + 6, 30, 30);
    const p = new Path2D(); p.rect(X + 13, Y + 6, 3, 28); p.rect(X + 27, Y + 6, 3, 28);
    for (let i = 0; i < 4; i++) p.rect(X + 13, Y + 10 + i * 7, 17, 2.4);
    c.fillStyle = '#8a6036'; c.fill(p);
    c.fillStyle = 'rgba(12,8,5,.55)'; c.fillRect(X + 6, Y + 24, 30, 12);
  };
  const drawBurrow = (c, X, Y) => {
    const x = X + 24, y = Y + 26, r = new Path2D(); ell(r, x, y, 17, 12);
    c.fillStyle = '#6e5034'; c.fill(r); c.strokeStyle = '#3a2614'; c.lineWidth = 1.2; c.stroke(r);
    c.fillStyle = '#120a06'; c.beginPath(); c.ellipse(x, y + 1, 11, 7, 0, 0, TAU); c.fill();
    c.fillStyle = '#8e6c48'; c.fillRect(x - 15, y - 6, 4, 3); c.fillRect(x + 9, y - 9, 5, 3); c.fillRect(x + 12, y + 5, 4, 3);
  };
  const drawPier = (c, X, Y, endS) => {
    c.fillStyle = 'rgba(10,30,45,.35)'; c.fillRect(X + 14, Y + 4, 28, T);
    const p = new Path2D(), g = new Path2D();
    for (let j = 0; j < 4; j++) { p.rect(X + 10, Y + j * 12, 28, 10.5); g.rect(X + 10, Y + j * 12 + 10.5, 28, 1.5); }
    c.fillStyle = '#9a7044'; c.fill(p); c.fillStyle = '#5a3a1e'; c.fill(g);
    const po = new Path2D(); po.rect(X + 7, Y + 2, 5, 5); po.rect(X + 36, Y + 2, 5, 5);
    if (endS) { po.rect(X + 7, Y + 40, 5, 5); po.rect(X + 36, Y + 40, 5, 5); }
    c.fillStyle = '#4a2e16'; c.fill(po);
  };
  const drawBoat = (c, X, Y) => {
    const x = X + 24, y = Y + 26, hull = new Path2D(), inn = new Path2D();
    hull.moveTo(x - 22, y); hull.quadraticCurveTo(x - 10, y - 12, x + 16, y - 9); hull.lineTo(x + 22, y); hull.lineTo(x + 16, y + 9); hull.quadraticCurveTo(x - 10, y + 12, x - 22, y); hull.closePath();
    inn.moveTo(x - 16, y); inn.quadraticCurveTo(x - 8, y - 7, x + 14, y - 5); inn.lineTo(x + 16, y); inn.lineTo(x + 14, y + 5); inn.quadraticCurveTo(x - 8, y + 7, x - 16, y); inn.closePath();
    c.fillStyle = 'rgba(10,30,45,.35)'; c.fillRect(x - 18, y + 8, 38, 6);
    c.strokeStyle = '#2e1c0e'; c.lineWidth = 1.4; c.stroke(hull); c.fillStyle = '#8a5a30'; c.fill(hull); c.fillStyle = '#5e3c1e'; c.fill(inn);
    c.fillStyle = '#a87a48'; c.fillRect(x - 2, y - 6, 5, 12);
    c.strokeStyle = '#c09a64'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 10, y - 14); c.lineTo(x + 6, y + 14); c.stroke();
  };
  const drawStump = (c, X, Y) => {
    cyl(c, X + 28, Y + 32, 11, 8, '#6a4426', '#c49a62', '#2e1c0e');
    c.strokeStyle = '#8a6a40'; c.lineWidth = 1; c.beginPath(); c.arc(X + 20, Y + 24, 6, 0, TAU); c.moveTo(X + 22.5, Y + 24); c.arc(X + 20, Y + 24, 2.5, 0, TAU); c.stroke();
  };
  const drawReed = (c, Z, X, Y, tx, ty) => {
    const p = new Path2D(), hd = new Path2D();
    for (let i = 0; i < 4; i++) {
      const x = X + 12 + i * 7 + Z.hash(tx + i, ty) * 4, y = Y + 38, l = 16 + Z.hash(tx, ty + i) * 10;
      p.moveTo(x, y); p.lineTo(x - l * .45, y - l);
      if (i & 1) hd.rect(x - l * .45 - 1.5, y - l - 1, 3.5, 7);
    }
    c.strokeStyle = '#4a6a2a'; c.lineWidth = 2; c.stroke(p); c.fillStyle = '#6a4024'; c.fill(hd);
  };

  const ground = (Z, x0, y0, x1, y1) => {
    const c = Z.ctx, hs = Z.hash;
    const tx0 = fl(x0 / T) - 1, ty0 = fl(y0 / T) - 1, tx1 = fl(x1 / T) + 2, ty1 = fl(y1 / T) + 2;
    const GW = tx1 - tx0 + 3, GH = ty1 - ty0 + 3, g = new Int32Array(GW * GH);
    for (let ty = ty0 - 1; ty <= ty1 + 1; ty++) for (let tx = tx0 - 1; tx <= tx1 + 1; tx++) g[(ty - ty0 + 1) * GW + tx - tx0 + 1] = cellAt(Z, tx, ty);
    const at = (tx, ty) => g[(ty - ty0 + 1) * GW + tx - tx0 + 1];
    const Q = {}; for (const k of QK) Q[k] = new Path2D();
    const px = (p, X, Y, n, salt, tx, ty) => {
      for (let i = 0; i < n; i++) p.rect(X + fl(hs(tx * 31 + i * 7 + salt, ty * 17 - i * 3) * 16) * U, Y + fl(hs(tx * 5 - i + salt, ty * 29 + i * 11) * 16) * U, U, U);
    };
    // grass jag spilling over the edge of a dirt/sand/soil tile (classic Tibia border tiles)
    const jag = (X, Y, side, tx, ty) => {
      for (let i = 0; i < 16; i++) {
        const k = 1 + fl(hs(tx * 11 + i * 3 + side * 5, ty * 7 - i) * 2.4), dark = hs(tx * 3 - i, ty * 13 + i + side) > .45;
        if (side === 0) { Q.gj.rect(X + i * U, Y, U, k * U); if (dark) Q.gjd.rect(X + i * U, Y + k * U, U, U); }
        else if (side === 1) { Q.gj.rect(X + i * U, Y + T - k * U, U, k * U); if (dark) Q.gjd.rect(X + i * U, Y + T - k * U - U, U, U); }
        else if (side === 2) { Q.gj.rect(X, Y + i * U, k * U, U); if (dark) Q.gjd.rect(X + k * U, Y + i * U, U, U); }
        else { Q.gj.rect(X + T - k * U, Y + i * U, k * U, U); if (dark) Q.gjd.rect(X + T - k * U - U, Y + i * U, U, U); }
      }
    };
    c.fillStyle = C.g1; c.fillRect(tx0 * T, ty0 * T, (tx1 - tx0 + 1) * T, (ty1 - ty0 + 1) * T);
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const v = at(tx, ty), gg = gOf(v), X = tx * T, Y = ty * T, h2 = hs(tx * 13 - 2, ty * 3 + 9), odd = (tx + ty) & 1;
      if (gg === GRASS) {
        if (odd) Q.g2.rect(X, Y, T, T);
        px(Q.gd, X, Y, 5, 0, tx, ty); px(Q.gl, X, Y, 3, 40, tx, ty);
        if (h2 < .4) {
          const bx = X + 6 + fl(h2 * 30) * U, by = Y + 12 + fl(hs(ty, tx * 3) * 7) * U;
          Q.gb.rect(bx, by, U, 2 * U); Q.gb.rect(bx + U, by - U, U, 3 * U); Q.gb.rect(bx + 2 * U, by, U, 2 * U); Q.gl.rect(bx + U, by - U, U, U);
        }
      } else if (gg === DIRT || gg === SAND || gg === SOIL) {
        if (gg === DIRT) { Q.d1.rect(X, Y, T, T); if (odd) Q.d2.rect(X, Y, T, T); px(Q.dd, X, Y, 4, 7, tx, ty); px(Q.dl, X, Y, 3, 19, tx, ty); if (h2 < .25) { Q.dl.rect(X + 18, Y + 24, 2 * U, U); Q.dd.rect(X + 18, Y + 27, 2 * U, U); } }
        else if (gg === SAND) { Q.s1.rect(X, Y, T, T); if (odd) Q.s2.rect(X, Y, T, T); px(Q.sd, X, Y, 4, 3, tx, ty); px(Q.sl, X, Y, 3, 23, tx, ty); }
        else { Q.o1.rect(X, Y, T, T); for (let j = 0; j < 4; j++) { Q.od.rect(X, Y + j * 12 + 7, T, U); Q.ol.rect(X, Y + j * 12 + 3, T, 2); } }
        if (gOf(at(tx, ty - 1)) === GRASS) jag(X, Y, 0, tx, ty);
        if (gOf(at(tx, ty + 1)) === GRASS) jag(X, Y, 1, tx, ty);
        if (gOf(at(tx - 1, ty)) === GRASS) jag(X, Y, 2, tx, ty);
        if (gOf(at(tx + 1, ty)) === GRASS) jag(X, Y, 3, tx, ty);
      } else if (gg === WATER) {
        Q.w1.rect(X, Y, T, T); if (odd) Q.w2.rect(X, Y, T, T);
        Q.wd.rect(X + 3 + fl(h2 * 6) * U, Y + 9, 4 * U, U); Q.wd.rect(X + 21 - fl(h2 * 4) * U, Y + 30, 4 * U, U);
        if (gOf(at(tx, ty - 1)) !== WATER) Q.shal.rect(X, Y, T, 2 * U);
        if (gOf(at(tx, ty + 1)) !== WATER) Q.shal.rect(X, Y + T - 2 * U, T, 2 * U);
        if (gOf(at(tx - 1, ty)) !== WATER) Q.shal.rect(X, Y, 2 * U, T);
        if (gOf(at(tx + 1, ty)) !== WATER) Q.shal.rect(X + T - 2 * U, Y, 2 * U, T);
      } else if (gg === WOOD) {
        Q.f1.rect(X, Y, T, T);
        for (let j = 0; j < 4; j++) { Q.fh.rect(X, Y + j * 12, T, 1.5); Q.fs.rect(X, Y + j * 12 + 10.5, T, 1.5); Q.fs.rect(X + ((j * 5 + tx * 3 + ty) % 4) * 12 + 6, Y + j * 12, 1.5, 12); }
      } else Q.rf.rect(X, Y, T, T);
    }
    for (const k of QK) { c.fillStyle = C[k]; c.fill(Q[k]); }

    // flat decals: flowers, pebbles, lily pads, mushrooms (batched), then the odd hole / pier / boat
    const fw = new Path2D(), fy = new Path2D(), fr = new Path2D(), fv = new Path2D(), fc = new Path2D();
    const st = new Path2D(), stl = new Path2D(), lily = new Path2D(), lf = new Path2D(), shs = new Path2D(), shc = new Path2D(), shd = new Path2D(), shadow = new Path2D();
    const PET = [fw, fy, fr, fv];
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const v = at(tx, ty), o = oOf(v), X = tx * T, Y = ty * T;
      if (!o) continue;
      const h = hs(tx * 29 + 1, ty * 23 - 6);
      if (o === FLOWER) {
        for (let i = 0; i < 3; i++) {
          const x = X + 6 + fl(hs(tx * 3 + i, ty * 9) * 11) * U, y = Y + 6 + fl(hs(tx * 9, ty * 3 + i) * 11) * U, p = PET[fl(hs(tx + i * 5, ty - i) * 4)];
          p.rect(x - U, y, U, U); p.rect(x + U, y, U, U); p.rect(x, y - U, U, U); p.rect(x, y + U, U, U); fc.rect(x, y, U, U);
        }
      } else if (o === STONE) {
        const x = X + 18 + h * 12, y = Y + 26;
        ell(shadow, x + 3, y + 4, 11, 5); ell(st, x, y, 10, 7); ell(stl, x - 3, y - 2.5, 4.5, 2.5); ell(st, x + 11, y + 6, 5, 3.5);
      } else if (o === LILY) {
        const x = X + 14 + h * 18, y = Y + 18 + hs(tx, ty * 7) * 14;
        lily.moveTo(x, y); lily.arc(x, y, 7, .4, TAU - .2); lily.closePath(); ell(lily, x + 13, y + 9, 5, 3.6);
        if (h > .5) lf.rect(x - 2, y - 2, 4, 4);
      } else if (o === SHROOM) {
        for (let i = 0; i < 2; i++) {
          const x = X + 10 + fl(hs(tx * 7 + i, ty) * 9) * U, y = Y + 14 + fl(hs(tx, ty * 7 + i) * 8) * U;
          shs.rect(x - 1.5, y, 3, 5); shc.moveTo(x - 5, y + .5); shc.arc(x, y + .5, 5, Math.PI, 0); shc.closePath(); shd.rect(x - 2.5, y - 2.5, 1.6, 1.6); shd.rect(x + 1, y - 1.5, 1.6, 1.6);
        }
      } else if (o === TREE) ell(shadow, X + 26, Y + 40, 22, 8);
      else if (o === BUSH) ell(shadow, X + 26, Y + 38, 17, 6);
      else if (o === BARREL || o === CRATE || o === CHEST || o === WELL || o === PUMPKIN) ell(shadow, X + 28, Y + 38, 16, 6);
    }
    c.fillStyle = 'rgba(20,34,10,.28)'; c.fill(shadow);
    c.fillStyle = '#ece6d6'; c.fill(fw); c.fillStyle = '#ecd040'; c.fill(fy); c.fillStyle = '#d84a3a'; c.fill(fr); c.fillStyle = '#9a6ad8'; c.fill(fv);
    c.fillStyle = '#f0a020'; c.fill(fc);
    c.strokeStyle = '#3e3a32'; c.lineWidth = 1.2; c.stroke(st); c.fillStyle = '#8c887a'; c.fill(st); c.fillStyle = '#aaa596'; c.fill(stl);
    c.fillStyle = '#4c8a3c'; c.fill(lily); c.fillStyle = '#f0a0c8'; c.fill(lf);
    c.fillStyle = '#e8dcc0'; c.fill(shs); c.fillStyle = '#c8382a'; c.fill(shc); c.fillStyle = '#fff4e0'; c.fill(shd);
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const o = oOf(at(tx, ty)), X = tx * T, Y = ty * T;
      if (o === GRATE) drawGrate(c, X, Y);
      else if (o === LADDER) { c.save(); drawLadder(c, X, Y); c.restore(); }
      else if (o === BURROW) drawBurrow(c, X, Y);
      else if (o === PIER) drawPier(c, X, Y, oOf(at(tx, ty + 1)) !== PIER);
      else if (o === BOAT) drawBoat(c, X, Y);
    }

    // raised objects, back to front (row-major), each leaning up-left
    c.lineJoin = 'round'; c.lineCap = 'round';
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const v = at(tx, ty), o = oOf(v), X = tx * T, Y = ty * T;
      switch (o) {
        case TREE: drawTree(c, Z, X, Y, tx, ty); break;
        case BUSH: drawBush(c, Z, X, Y, tx, ty); break;
        case WALL: case TORCH: case HEARTH:
          drawWall(c, X, Y, mOf(v), (isWall(at(tx + 1, ty)) ? 0 : 1) | (isWall(at(tx, ty + 1)) ? 0 : 2), o); break;
        case TABLE: drawTable(c, X, Y); break;
        case BARREL: drawBarrel(c, X, Y); break;
        case CHEST: drawChest(c, X, Y); break;
        case CRATE: drawCrate(c, X, Y); break;
        case COUNTER: drawCounter(c, X, Y); break;
        case FENCE: drawFence(c, X, Y, oOf(at(tx + 1, ty)) === FENCE, oOf(at(tx, ty + 1)) === FENCE); break;
        case PUMPKIN: drawPumpkin(c, Z, X, Y, tx, ty); break;
        case SCARE: drawScarecrow(c, X, Y); break;
        case WELL: drawWell(c, X, Y); break;
        case SIGN: drawSign(c, X, Y); break;
        case LAMP: drawLamp(c, X, Y); break;
        case ROCK: case CAVE: drawRock(c, Z, X, Y, tx, ty, at, o === CAVE); break;
        case STUMP: drawStump(c, X, Y); break;
        case REED: drawReed(c, Z, X, Y, tx, ty); break;
        default: break;
      }
    }
    c.lineJoin = 'miter'; c.lineCap = 'butt';
  };

  /* ================= Under (animated, before foes): water, wheat, torch and hearth fire ================= */
  const flame = (fo, fm, fc, x, y, s, now, k) => {
    const f = Math.sin(now * 11 + k) * .5 + Math.sin(now * 17.3 + k * 2) * .3, hg = (13 + f * 3) * s, w = 5 * s;
    fo.moveTo(x - w, y); fo.quadraticCurveTo(x - w, y - hg * .55, x + f * 2.5 * s, y - hg); fo.quadraticCurveTo(x + w, y - hg * .55, x + w, y); fo.closePath();
    fm.moveTo(x - w * .65, y); fm.quadraticCurveTo(x - w * .6, y - hg * .45, x + f * 1.5 * s, y - hg * .72); fm.quadraticCurveTo(x + w * .6, y - hg * .45, x + w * .65, y); fm.closePath();
    fc.moveTo(x - w * .3, y); fc.quadraticCurveTo(x, y - hg * .5, x + w * .3, y); fc.closePath();
  };
  const under = Z => {
    const c = Z.ctx, P = Z.P, now = Z.now, hw = Z.W / 2 + 70, hh = Z.H / 2 + 90;
    const tx0 = fl((P.x - hw) / T), tx1 = fl((P.x + hw) / T), ty0 = fl((P.y - hh) / T), ty1 = fl((P.y + hh) / T);
    const wave = new Path2D(), foam = new Path2D(), glint = new Path2D(), stalk = new Path2D(), head = new Path2D(), headL = new Path2D();
    const fo = new Path2D(), fm = new Path2D(), fc = new Path2D();
    let nw = 0, nh = 0, nf = 0;
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const v = cellAt(Z, tx, ty), o = oOf(v), X = tx * T, Y = ty * T;
      if (gOf(v) === WATER && o !== PIER && o !== BOAT) {
        nw++;
        const ph = tx * .9 + ty * 1.7, d = Math.round(Math.sin(now * 1.3 + ph) * 2) * U;
        wave.rect(X + 6 + d, Y + 15, 4 * U, U); wave.rect(X + 24 - d, Y + 36, 3 * U, U);
        if (Math.sin(now * 2.1 + ph * 3) > .93) glint.rect(X + 20, Y + 22, 2 * U, U);
        const fd = Math.round(1 + (Math.sin(now * 2 + ph) + 1) * 1.2) * 2;
        if (gOf(cellAt(Z, tx, ty - 1)) !== WATER) foam.rect(X, Y + 2 * U + fd, T, 2);
        if (gOf(cellAt(Z, tx, ty + 1)) !== WATER) foam.rect(X, Y + T - 2 * U - fd - 2, T, 2);
        if (gOf(cellAt(Z, tx - 1, ty)) !== WATER) foam.rect(X + 2 * U + fd, Y, 2, T);
        if (gOf(cellAt(Z, tx + 1, ty)) !== WATER) foam.rect(X + T - 2 * U - fd - 2, Y, 2, T);
      } else if (o === WHEAT) {
        nh++;
        const gust = Math.sin(now * .9 + tx * .35 - ty * .2);
        for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
          const sx = X + 7 + i * 11 + j * 5, sy = Y + 20 + j * 22, sw = Math.sin(now * 2.2 + tx * .7 + ty * .5 + i * .6 + j) * 2.2 + gust * 3, l = 20 + ((i + j) & 1) * 4;
          const hx = sx - l * .4 + sw, hy = sy - l;
          stalk.moveTo(sx, sy); stalk.lineTo(hx, hy);
          head.rect(hx - 2.5, hy - 5, 5, 9); headL.rect(hx - 1.5, hy - 4, 2, 4);
        }
      } else if (o === TORCH) { nf++; flame(fo, fm, fc, X + 14.5, Y + 29, .9, now, tx * 1.3 + ty); }
      else if (o === HEARTH) { nf++; flame(fo, fm, fc, X + 17.5, Y + T - 1, .6, now, tx + ty * 2); flame(fo, fm, fc, X + 25.5, Y + T - 1, .75, now, tx * 3 + ty); }
      else if (o === LAMP) { nf++; flame(fo, fm, fc, X + 12.5, Y + 7, .5, now, tx + ty); }
    }
    if (nw) {
      c.fillStyle = '#5a92b6'; c.fill(wave);
      c.globalAlpha = .55 + Math.sin(now * 2) * .15; c.fillStyle = '#cfe4ee'; c.fill(foam);
      c.globalAlpha = 1; c.fillStyle = '#f2faff'; c.fill(glint);
    }
    if (nh) {
      c.lineCap = 'round'; c.strokeStyle = '#8a7a30'; c.lineWidth = 1.6; c.stroke(stalk); c.lineCap = 'butt';
      c.fillStyle = '#d4a83a'; c.fill(head); c.fillStyle = '#f0d070'; c.fill(headL);
    }
    if (nf) { c.fillStyle = '#e8501a'; c.fill(fo); c.fillStyle = '#ffa030'; c.fill(fm); c.fillStyle = '#fff2a0'; c.fill(fc); }
  };

  /* ================= Ambient (after darkness): firelight, chimney smoke, butterflies, water sparkle, pollen ================= */
  const BFLY = ['#f4f0e0', '#f2d040', '#6aa8f0', '#f08a30'];
  const ambient = Z => {
    const c = Z.ctx, P = Z.P, now = Z.now, hw = Z.W / 2 + 160, hh = Z.H / 2 + 160, BW = BS * T;
    const s1 = new Path2D(), s2 = new Path2D();
    let n = 0;
    for (let by = fl((P.y - hh) / BW); by <= fl((P.y + hh) / BW); by++) for (let bx = fl((P.x - hw) / BW); bx <= fl((P.x + hw) / BW); bx++) {
      for (const [ix, iy] of [[18, 13], [13, 18]]) {
        const x = (bx * BS + ix) * T + 12, y = (by * BS + iy) * T + 2;
        if (Math.abs(x - P.x) < hw && Math.abs(y - P.y) < hh) { Z.glow('255,200,110', 46 + Math.sin(now * 7 + ix) * 3, x, y, .45); n++; }
      }
      for (let q = 0; q < 4; q++) {
        if (featKind(Z, bx, by, q) !== VILLAGE || n > 40) continue;
        for (const [lx, ly] of TORCHES) {
          const [tx, ty] = vtile(bx, by, q, lx, ly), x = tx * T + 14, y = ty * T + 22;
          if (Math.abs(x - P.x) > hw || Math.abs(y - P.y) > hh) continue;
          Z.glow('255,150,60', 58 + Math.sin(now * 9 + tx) * 4, x, y, .5); n++;
        }
        const [tx, ty] = vtile(bx, by, q, 5, 2), X = tx * T, Y = ty * T;
        if (Math.abs(X - P.x) > hw || Math.abs(Y - P.y) > hh) continue;
        Z.glow('255,130,50', 34, X + 22, Y + T - 8, .45); n++;
        const sx = X + 2, sy = Y - 22; // chimney top
        for (let k = 0; k < 7; k++) {
          const u = (now * .28 + k / 7 + tx * .13) % 1, r = 4 + u * 13;
          circ(u < .45 ? s1 : s2, sx + u * 30 + Math.sin(now * 1.3 + k * 2) * 4, sy - u * 110, r);
        }
      }
    }
    c.save();
    c.fillStyle = '#d8d4cc'; c.globalAlpha = .42; c.fill(s1); c.globalAlpha = .2; c.fill(s2); c.globalAlpha = 1;
    // water sparkle: sample visible tiles, twinkle on the water ones
    const star = new Path2D(), slot = fl(now * 1.6), cols = fl(2 * hw / T), rows = fl(2 * hh / T), u = (now * 1.6) % 1, sz = Math.sin(u * Math.PI) * 5;
    for (let i = 0; i < 26 && n < 70; i++) {
      const tx = fl((P.x - hw) / T) + fl(Z.hash(i * 7 + slot, 3) * cols), ty = fl((P.y - hh) / T) + fl(Z.hash(i * 3, slot * 5 + 1) * rows), v = cellAt(Z, tx, ty);
      if (gOf(v) !== WATER || oOf(v) === PIER || oOf(v) === BOAT) continue;
      const x = tx * T + 10 + Z.hash(tx, ty) * 28, y = ty * T + 10 + Z.hash(ty, tx) * 28;
      star.moveTo(x - sz, y); star.lineTo(x + sz, y); star.moveTo(x, y - sz); star.lineTo(x, y + sz);
      Z.glow('200,235,255', 8 + sz * 2, x, y, .35); n++;
    }
    c.strokeStyle = '#ffffff'; c.lineWidth = 1.4; c.stroke(star);
    // butterflies anchored to 320px cells so they stay put as you walk
    const G = 320, wings = BFLY.map(() => new Path2D()), bod = new Path2D();
    for (let gy = fl((P.y - hh) / G); gy <= fl((P.y + hh) / G); gy++) for (let gx = fl((P.x - hw) / G); gx <= fl((P.x + hw) / G); gx++) {
      const h = Z.hash(gx * 17 + 4, gy * 13 - 9);
      if (h > .38) continue;
      const sd = h * 40, x = gx * G + 160 + Math.sin(now * .55 + sd) * 90 + Math.sin(now * 1.9 + sd * 2) * 18, y = gy * G + 160 + Math.cos(now * .43 + sd) * 60 + Math.sin(now * 2.6 + sd) * 10;
      const fp = Math.abs(Math.sin(now * 15 + sd * 3)), wpath = wings[fl(h * 10.5) % 4], ww = 1 + fp * 4.5;
      ell(wpath, x - ww, y - 2, ww, 3.6); ell(wpath, x + ww, y - 2, ww, 3.6); ell(wpath, x - ww * .7, y + 2.5, ww * .7, 2.4); ell(wpath, x + ww * .7, y + 2.5, ww * .7, 2.4);
      bod.rect(x - .8, y - 3.5, 1.6, 7);
    }
    BFLY.forEach((col, i) => { c.fillStyle = col; c.fill(wings[i]); });
    c.fillStyle = '#2a1e14'; c.fill(bod);
    // pollen and dandelion fluff drifting on the sea breeze
    const pol = new Path2D(), wv = Z.W + 200, hv = Z.H + 200;
    for (let i = 0; i < 34; i++) {
      const a = Z.hash(i, 5), b = Z.hash(i, 11);
      const x = P.x - wv / 2 + ((((a * wv + now * (10 + b * 14)) % wv) + wv) % wv), y = P.y - hv / 2 + ((((b * hv + Math.sin(now * .7 + i) * 20 - now * 5) % hv) + hv) % hv);
      pol.rect(x, y, 2 + (i % 2), 2 + (i % 2));
    }
    c.globalAlpha = .7; c.fillStyle = '#fbf6d8'; c.fill(pol);
    c.restore();
  };

  /* ================= Foes ================= */
  const face = (c, e) => { const f = Math.cos(e.ang) < 0 ? -1 : 1; c.scale(f, 1); return f; };

  // Rat: scurrying brown rodent with a pink tail; the odd one brings friends.
  const rat = {
    hp: 9, sp: 74, dmg: 6, xp: 1, r: 10, eye: false,
    init(e) { e.lead = Math.random() < .3; e.done = false; },
    update(e, Z) {
      if (e.lead && !e.done) {
        e.done = true;
        for (let i = 0; i < 2; i++) { const a = e.seed + i * 2.4, n = Z.spawn('rat', e.x + Math.cos(a) * 22, e.y + Math.sin(a) * 22); if (n) { n.lead = false; n.done = true; } }
      }
      const k = .6 + .75 * Math.max(0, Math.sin(e.ph * 5 + e.seed * 3)), a = Z.angTo(e) + Math.sin(e.ph * 3.3 + e.seed) * .5;
      Z.move(e, Math.cos(a) * e.sp * k, Math.sin(a) * e.sp * k); e.ang = a;
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 10, run = Math.sin(e.ph * 18 + e.seed), OL = W(white, '#3c2418');
      c.save(); c.translate(e.x, e.y - Math.abs(run) * 1.2); c.scale(s, s); face(c, e);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const tail = new Path2D(); tail.moveTo(-8, 1); tail.quadraticCurveTo(-15, 7 + run * 3, -20, -1 + run * 4);
      c.strokeStyle = OL; c.lineWidth = 3.6; c.stroke(tail); c.strokeStyle = W(white, '#f29aaa'); c.lineWidth = 1.8; c.stroke(tail);
      const ft = new Path2D(); ft.rect(-6 + run * 2.5, 4.5, 3.4, 2.6); ft.rect(3 - run * 2.5, 4.5, 3.4, 2.6);
      c.fillStyle = W(white, '#e898a2'); c.fill(ft);
      const b = new Path2D(); ell(b, -1.5, 0, 8.5, 5.8 + run * .4); b.moveTo(3.5, -4.8); b.quadraticCurveTo(10, -4.6, 14, .4); b.quadraticCurveTo(9, 3.4, 3.5, 3.2); b.closePath();
      c.strokeStyle = OL; c.lineWidth = 2; c.stroke(b); c.fillStyle = W(white, '#8e6a56'); c.fill(b);
      const ear = new Path2D(); circ(ear, 4.5, -5, 2.9);
      if (!white) {
        const bl = new Path2D(); ell(bl, -1, 3, 6, 2.2); c.fillStyle = '#bc9c80'; c.fill(bl);
        const bk = new Path2D(); ell(bk, -3.5, -3.2, 5, 1.5); c.fillStyle = '#a4806a'; c.fill(bk);
      }
      c.strokeStyle = OL; c.lineWidth = 1.3; c.stroke(ear); c.fillStyle = W(white, '#f2a6b2'); c.fill(ear);
      c.fillStyle = W(white, '#160a06'); c.fillRect(7.6, -2.9, 2.1, 2.1);
      c.fillStyle = W(white, '#ff7a90'); c.fillRect(12.8, -.7, 2.2, 2);
      if (!white) { c.fillStyle = '#fff'; c.fillRect(8.4, -2.7, .9, .9); }
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#8e6a56', 6, 70); },
  };

  // Rotworm: fat segmented worm. Dives underground (a mound races toward you), then bursts up beside you.
  const rotworm = {
    hp: 75, sp: 34, dmg: 12, xp: 5, r: 15, heavy: true, eye: false,
    init(e, Z) { e.r0 = e.r; e.mode = 'walk'; e.t2 = Z.rnd(2.5, 5); e.mt = 0; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e);
      switch (e.mode) {
        case 'walk':
          Z.chase(e, e.sp * (.6 + .6 * Math.max(0, Math.sin(e.ph * 3 + e.seed))));
          if ((e.t2 -= dt) <= 0) { if (d > 160) { e.mode = 'dig'; e.mt = .6; Z.burst(e.x, e.y, '#7a5636', 8, 60); } else e.t2 = 1.5; }
          break;
        case 'dig': Z.move(e, 0, 0); if ((e.mt -= dt) <= 0) { e.mode = 'under'; e.r = 7; e.mt = 4; } break;
        case 'under': {
          const a = Z.angTo(e) + Math.sin(e.ph * 4 + e.seed) * .25; Z.move(e, Math.cos(a) * 150, Math.sin(a) * 150); e.ang = a; e.mt -= dt;
          if (d < 70 || e.mt <= 0) { e.mode = 'rise'; e.mt = .7; Z.hazard(e.x, e.y, { r: 44, t: .65, dmg: 10, col: '210,140,80' }); }
          break;
        }
        case 'rise':
          Z.move(e, 0, 0);
          if ((e.mt -= dt) <= 0) { e.mode = 'walk'; e.r = e.r0; e.t2 = Z.rnd(4, 7); Z.burst(e.x, e.y, '#8a6440', 12, 100); Z.shake(2); }
          break;
        default: e.mode = 'walk'; e.r = e.r0;
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = (e.r0 || 15) / 15;
      c.save(); c.translate(e.x, e.y); c.scale(s, s);
      if (e.mode === 'under') {
        const m = new Path2D(), tr = new Path2D(), cl = new Path2D(), ca = Math.cos(e.ang), sa = Math.sin(e.ang);
        for (let i = 1; i <= 3; i++) ell(tr, -ca * i * 9, 3 - sa * i * 9, 7 - i * 1.4, 4.4 - i * .9);
        ell(m, 0, 2, 12, 7.5);
        for (let i = 0; i < 5; i++) { const a = e.ph * 7 + i * 1.3; cl.rect(Math.cos(a) * 9 - 1.5, Math.sin(a) * 4 - 2, 3, 3); }
        c.fillStyle = W(white, '#5a3e24'); c.fill(tr);
        c.strokeStyle = W(white, '#3a2414'); c.lineWidth = 1.5; c.stroke(m); c.fillStyle = W(white, '#8a6440'); c.fill(m);
        c.fillStyle = W(white, '#b08a5e'); c.fill(cl);
        c.restore(); return;
      }
      let k = 1;
      if (e.mode === 'rise') k = Math.min(1, Math.max(0, 1 - e.mt / .7));
      else if (e.mode === 'dig') k = Math.min(1, Math.max(0, e.mt / .6));
      if (k < 1) {
        const dr = new Path2D(); ell(dr, 0, 9, 17, 6);
        c.fillStyle = W(white, '#5e4128'); c.fill(dr);
        c.translate(0, (1 - k) * 12); c.scale(1, Math.max(.12, k));
      }
      face(c, e);
      const body = new Path2D(), hi = new Path2D();
      let hx = 0, hy = 0;
      for (let i = 0; i < 6; i++) {
        const x = -14 + i * 5, y = Math.sin(e.ph * 6 - i * .9 + e.seed) * 2.2 - i * .7, r = 4.8 + i * .45;
        circ(body, x, y, r); ell(hi, x - r * .25, y - r * .5, r * .42, r * .22);
        hx = x; hy = y;
      }
      c.fillStyle = W(white, '#c47c6c'); c.fill(body);
      c.strokeStyle = W(white, '#5a2420'); c.lineWidth = 1.7; c.stroke(body);
      if (!white) {
        c.fillStyle = '#eaa898'; c.fill(hi);
        const mo = new Path2D(), th = new Path2D(); circ(mo, hx + 3.2, hy + .5, 3.1);
        for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + e.ph * 2; th.rect(hx + 3.2 + Math.cos(a) * 3.1 - .7, hy + .5 + Math.sin(a) * 3.1 - .7, 1.4, 1.4); }
        c.fillStyle = '#3a0c10'; c.fill(mo); c.fillStyle = '#f4e2c4'; c.fill(th);
      }
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#c47c6c', 12, 90); },
  };

  // Spider: skittering brown spider (dash, freeze, dash). A rarer green poison spider keeps away and spits webbing venom.
  const makeVenom = e => { e.venom = true; e.max *= 1.8; e.hp = e.max; e.sp *= .75; e.xp = 3; };
  const spider = {
    hp: 15, sp: 112, dmg: 8, xp: 2, r: 10, eye: false,
    init(e, Z) { e.venom = false; e.sk = 0; e.dash = false; e.jit = 0; e.cast = 0; e.t1 = Z.rnd(1.5, 3); if (Math.random() < .2) makeVenom(e); },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e), a = Z.angTo(e);
      if ((e.sk -= dt) <= 0) { e.dash = !e.dash; e.sk = e.dash ? Z.rnd(.35, .6) : Z.rnd(.1, .25); e.jit = Z.rnd(-.7, .7); }
      if (e.venom) {
        if (e.cast > 0) e.cast -= dt;
        const mv = d > 250 ? a + e.jit * .4 : d < 160 ? a + Math.PI + e.jit * .4 : a + (e.seed < 3 ? 1 : -1) * Math.PI / 2, sp = e.sp * (e.dash ? .95 : .2);
        Z.move(e, Math.cos(mv) * sp, Math.sin(mv) * sp); e.ang = a;
        if ((e.t1 -= dt) <= 0 && d < 480) { e.t1 = Z.rnd(2.8, 3.8); e.cast = .3; Z.shoot(e.x, e.y, a, 185, { r: 5, dmg: 6, life: 3.5, col: '150,255,60', slow: true }); Z.sfx('shoot'); }
        return;
      }
      const sp = e.dash ? e.sp * 1.45 : e.sp * .12, ma = a + e.jit * (d > 80 ? 1 : .3);
      Z.move(e, Math.cos(ma) * sp, Math.sin(ma) * sp); e.ang = ma;
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 10, v = e.venom, wk = e.ph * (e.dash ? 26 : 6) + e.seed;
      c.save(); c.translate(e.x, e.y); c.rotate(e.ang); c.scale(s, s);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const L = new Path2D();
      for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) {
        const base = sd * (Math.PI / 2 + (i - 1.5) * .5) + Math.sin(wk + i * 1.7 + (sd > 0 ? 1.5 : 0)) * .2;
        const kx = 2 + Math.cos(base) * 8, ky = Math.sin(base) * 8, fa = base + (i < 2 ? -sd * .5 : sd * .5);
        L.moveTo(2, 0); L.lineTo(kx, ky - 1.5); L.lineTo(kx + Math.cos(fa) * 8, ky + Math.sin(fa) * 8);
      }
      c.strokeStyle = W(white, '#24140a'); c.lineWidth = 3.4; c.stroke(L);
      c.strokeStyle = W(white, v ? '#3e7a1e' : '#5e3418'); c.lineWidth = 1.7; c.stroke(L);
      const b = new Path2D(); ell(b, -6, 0, 7.6, 6.4); ell(b, 3.5, 0, 4.8, 4.2); circ(b, 7.8, 0, 2.6);
      c.strokeStyle = W(white, '#24140a'); c.lineWidth = 2; c.stroke(b); c.fillStyle = W(white, v ? '#5aa82c' : '#7c4a24'); c.fill(b);
      if (!white) {
        const m = new Path2D();
        if (v) { circ(m, -8, -2.4, 1.6); circ(m, -8, 2.4, 1.6); circ(m, -4, 0, 1.8); }
        else { poly(m, [-10, -1, -4, -3, -3, 0, -4, 3, -10, 1]); m.rect(-12, -.6, 2, 1.2); }
        c.fillStyle = v ? '#f0e830' : '#4a2a12'; c.fill(m);
        c.fillStyle = '#ff3a2a'; c.fillRect(8.4, -1.8, 1.6, 1.4); c.fillRect(8.4, .4, 1.6, 1.4);
        if (v && e.cast > 0) Z.glow('150,255,60', 14, 10, 0, .8);
      }
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, e.venom ? '#7ad040' : '#7c4a24', 8, 80); },
  };

  // Amazon: warrior with a red headband. Keeps range and hurls knives, then rushes in with her sword.
  const amazon = {
    hp: 42, sp: 68, dmg: 10, xp: 4, r: 12, eye: false,
    init(e, Z) { e.mode = 'range'; e.mt = Z.rnd(3.5, 5.5); e.t1 = Z.rnd(1, 2); e.cast = 0; e.swing = 0; e.side = Math.random() < .5 ? 1 : -1; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e), a = Z.angTo(e);
      e.mt -= dt; if (e.cast > 0) e.cast -= dt;
      if (e.mode === 'rush') {
        Z.chase(e, e.sp * 1.75); e.swing += dt * 11;
        if (e.mt <= 0 || d < 24) { e.mode = 'range'; e.mt = Z.rnd(4, 6); }
        return;
      }
      let mv = a, k = 1;
      if (d < 170) mv = a + Math.PI; else if (d < 270) { mv = a + e.side * Math.PI / 2; k = .55; }
      Z.move(e, Math.cos(mv) * e.sp * k, Math.sin(mv) * e.sp * k); e.ang = a;
      if ((e.t1 -= dt) <= 0 && d < 520) {
        e.t1 = Z.rnd(1.5, 2.1); e.cast = .35;
        const o = { r: 5, dmg: 8, life: 3, col: '236,244,255' };
        Z.shoot(e.x, e.y - 6, a, 235, o);
        if (Math.random() < .35) { Z.shoot(e.x, e.y - 6, a - .2, 235, o); Z.shoot(e.x, e.y - 6, a + .2, 235, o); }
        Z.sfx('shoot');
      }
      if (e.mt <= 0) { e.mode = 'rush'; e.mt = 2.2; e.swing = 0; }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 12, rush = e.mode === 'rush', st = Math.sin(e.ph * (rush ? 15 : 9) + e.seed), OL = W(white, '#3a1c10');
      c.save(); c.translate(e.x, e.y - Math.abs(st) * 1.2); c.scale(s, s); face(c, e);
      c.lineCap = 'round'; c.lineJoin = 'round';
      // boots and legs
      const lg = new Path2D(); lg.rect(-4.5 + st * 2, 5, 3.6, 8); lg.rect(1 - st * 2, 5, 3.6, 8);
      c.strokeStyle = OL; c.lineWidth = 1.6; c.stroke(lg); c.fillStyle = W(white, '#e2aa80'); c.fill(lg);
      c.fillStyle = W(white, '#5a3418'); c.fillRect(-4.5 + st * 2, 9.5, 3.6, 3.5); c.fillRect(1 - st * 2, 9.5, 3.6, 3.5);
      // ponytail (behind)
      const pt = new Path2D(); pt.moveTo(-3, -15); pt.quadraticCurveTo(-10, -14 + st, -11 + st * 1.5, -6);
      c.strokeStyle = OL; c.lineWidth = 4.4; c.stroke(pt); c.strokeStyle = W(white, '#6a3416'); c.lineWidth = 2.4; c.stroke(pt);
      // body silhouette: skirt + torso + head
      const sil = new Path2D(); poly(sil, [-6, 1, 6, 1, 7.6, 7.5, -7.6, 7.5]); sil.rect(-5, -9, 10, 11); circ(sil, 1, -14, 4.8);
      c.strokeStyle = OL; c.lineWidth = 2; c.stroke(sil);
      const sk = new Path2D(); poly(sk, [-6, 1, 6, 1, 7.6, 7.5, -7.6, 7.5]);
      c.fillStyle = W(white, '#8a5226'); c.fill(sk);
      c.fillStyle = W(white, '#b0703c'); c.fillRect(-5, -9, 10, 11);
      const hd = new Path2D(); circ(hd, 1, -14, 4.8); c.fillStyle = W(white, '#e8b48a'); c.fill(hd);
      if (!white) {
        const dt = new Path2D(); dt.rect(-2.2, 1, 1.2, 6.5); dt.rect(1.8, 1, 1.2, 6.5); dt.moveTo(-5, -9); dt.lineTo(5, 0); dt.lineTo(5, -1.6); dt.lineTo(-3.4, -9); dt.closePath();
        c.fillStyle = '#5a3418'; c.fill(dt);
        const hr = new Path2D(); hr.moveTo(-3.8, -13); hr.quadraticCurveTo(-3.6, -19.6, 2, -19); hr.quadraticCurveTo(6, -18.6, 5.8, -15.5); hr.lineTo(-1, -16); hr.lineTo(-2, -12); hr.closePath();
        c.fillStyle = '#6a3416'; c.fill(hr);
        c.fillStyle = '#20100a'; c.fillRect(3.2, -14.4, 1.6, 1.6);
      }
      // red headband with fluttering tails
      const hb = new Path2D(); hb.moveTo(-3.8, -16.4); hb.lineTo(5.8, -16.2); hb.moveTo(-3.6, -16.4); hb.lineTo(-8, -17 + st * 1.5); hb.moveTo(-3.6, -16); hb.lineTo(-7.4, -14 + st);
      c.strokeStyle = W(white, '#e42a28'); c.lineWidth = 2; c.stroke(hb);
      // throwing arm raised while casting
      const ta = e.cast > 0 ? -2.3 : -.3 + st * .3, arm = new Path2D(); arm.moveTo(-3, -7); arm.lineTo(-3 + Math.cos(ta) * 7, -7 + Math.sin(ta) * 7);
      // sword arm
      const sa = rush ? -1.3 + Math.sin(e.swing) * 1.4 : -1.15 + st * .12, hx = 5, hy = -2, dx = Math.cos(sa), dy = Math.sin(sa);
      arm.moveTo(3, -7); arm.lineTo(hx, hy);
      c.strokeStyle = OL; c.lineWidth = 3.8; c.stroke(arm); c.strokeStyle = W(white, '#e2aa80'); c.lineWidth = 2; c.stroke(arm);
      const bl = new Path2D(); bl.moveTo(hx - dx * 2, hy - dy * 2); bl.lineTo(hx + dx * 15, hy + dy * 15);
      c.strokeStyle = OL; c.lineWidth = 3.6; c.stroke(bl); c.strokeStyle = W(white, '#eef3fa'); c.lineWidth = 1.8; c.stroke(bl);
      c.strokeStyle = W(white, '#e8c040'); c.lineWidth = 2; c.beginPath(); c.moveTo(hx + dx * 1.5 - dy * 3.2, hy + dy * 1.5 + dx * 3.2); c.lineTo(hx + dx * 1.5 + dy * 3.2, hy + dy * 1.5 - dx * 3.2); c.stroke();
      if (e.cast > 0 && !white) { c.fillStyle = '#ffffff'; c.fillRect(-3 + Math.cos(ta) * 8 - 1.5, -7 + Math.sin(ta) * 8 - 1.5, 3, 3); }
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#e42a28', 10, 100); },
  };

  // Minotaur guard (only summoned by the magus): horned bull-man with a great axe. Paws the ground, then gores.
  const minoguard = {
    hp: 70, sp: 56, dmg: 14, xp: 5, r: 14, eye: false,
    init(e, Z) { e.mode = 'walk'; e.t1 = Z.rnd(2, 4); e.mt = 0; e.ca = 0; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e);
      if (e.mode === 'paw') { Z.move(e, 0, 0); e.ang = e.ca; if ((e.mt -= dt) <= 0) { e.mode = 'gore'; e.mt = .5; } return; }
      if (e.mode === 'gore') { Z.move(e, Math.cos(e.ca) * e.sp * 3.6, Math.sin(e.ca) * e.sp * 3.6); e.ang = e.ca; if ((e.mt -= dt) <= 0) { e.mode = 'walk'; e.t1 = Z.rnd(2.5, 4); } return; }
      Z.chase(e);
      if ((e.t1 -= dt) <= 0) { if (d < 230 && d > 60) { e.mode = 'paw'; e.mt = .55; e.ca = Z.angTo(e); } else e.t1 = 1; }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 14, st = Math.sin(e.ph * (e.mode === 'gore' ? 18 : 7) + e.seed), OL = W(white, '#2c1608');
      c.save(); c.translate(e.x, e.y); c.scale(s, s); face(c, e);
      if (e.mode === 'paw') c.translate(Math.sin(Z.now * 40) * 1.2, 0);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const lg = new Path2D(); lg.rect(-6 + st * 2.5, 6, 4.6, 9); lg.rect(1.5 - st * 2.5, 6, 4.6, 9);
      c.strokeStyle = OL; c.lineWidth = 1.6; c.stroke(lg); c.fillStyle = W(white, '#6a3c1e'); c.fill(lg);
      c.fillStyle = W(white, '#1e140c'); c.fillRect(-6 + st * 2.5, 12.5, 4.6, 2.5); c.fillRect(1.5 - st * 2.5, 12.5, 4.6, 2.5);
      const sil = new Path2D(); ell(sil, 0, -1, 9.5, 9); circ(sil, 6, -12, 6.4); ell(sil, 11, -10, 4.6, 3.6);
      c.strokeStyle = OL; c.lineWidth = 2; c.stroke(sil); c.fillStyle = W(white, '#7e4a26'); c.fill(sil);
      if (!white) {
        const ch = new Path2D(); ell(ch, 1.5, -2, 5.5, 5); c.fillStyle = '#986038'; c.fill(ch);
        const mz = new Path2D(); ell(mz, 11, -10, 4.6, 3.6); c.fillStyle = '#c08a5a'; c.fill(mz);
        c.fillStyle = '#b02a20'; c.fillRect(-9, 4, 18, 3.4);
        c.fillStyle = '#e8c040'; c.fillRect(-1.5, 4, 3, 3.4);
        c.fillStyle = '#ff4030'; c.fillRect(7.4, -14.6, 2, 2);
        c.fillStyle = '#2a1408'; c.fillRect(13.4, -11, 1.4, 1.4);
        c.strokeStyle = '#f0c040'; c.lineWidth = 1.2; c.beginPath(); c.arc(14, -8, 1.8, 0, Math.PI); c.stroke();
      }
      const hn = new Path2D(); hn.moveTo(2, -17); hn.quadraticCurveTo(-2, -24, 2, -27); hn.quadraticCurveTo(1.5, -22, 5, -18); hn.closePath();
      hn.moveTo(8, -17.5); hn.quadraticCurveTo(13, -23, 10, -27); hn.quadraticCurveTo(14, -24, 11, -17); hn.closePath();
      c.strokeStyle = OL; c.lineWidth = 1.4; c.stroke(hn); c.fillStyle = W(white, '#f0e4c4'); c.fill(hn);
      // great axe
      const aa = e.mode === 'gore' ? .4 : -1 + st * .15, ax = new Path2D(), bl = new Path2D(), dx = Math.cos(aa), dy = Math.sin(aa);
      ax.moveTo(9, 0); ax.lineTo(9 + dx * 18, dy * 18);
      const tx = 9 + dx * 15, ty = dy * 15;
      poly(bl, [tx - dy * 1, ty + dx * 1, tx - dy * 8 - dx * 4, ty + dx * 8 - dy * 4, tx - dy * 9 + dx * 5, ty + dx * 9 + dy * 5, tx + dx * 3, ty + dy * 3]);
      c.strokeStyle = OL; c.lineWidth = 3.6; c.stroke(ax); c.strokeStyle = W(white, '#8a5a30'); c.lineWidth = 1.8; c.stroke(ax);
      c.strokeStyle = OL; c.lineWidth = 1.5; c.stroke(bl); c.fillStyle = W(white, '#d8dee8'); c.fill(bl);
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#7e4a26', 12, 100); },
  };

  /* ================= Miniboss: Torvagh, the Horned Magus ================= */
  const BPAT = ['volley', 'fire', 'beam', 'summon', 'volley', 'beam', 'fire'];
  const ORB = { volley: ['#b070ff', '176,112,255'], fire: ['#ff8a2a', '255,138,42'], beam: ['#9ad4ff', '154,212,255'], summon: ['#ffd060', '255,208,96'] };
  const bossStart = (e, Z, m) => {
    e.mode = m;
    if (m === 'walk') { e.mt = (e.rage ? 1.1 : 1.7) + Math.random() * .7; return; }
    if (m === 'volley') { e.mt = e.rage ? 2.7 : 2.3; e.vol = e.rage ? 4 : 3; e.t3 = .6; Z.sfx('warn'); return; }
    if (m === 'fire') {
      e.mt = e.rage ? 3.4 : 2.4; Z.sfx('warn');
      e.fx = (fl(Z.P.x / T) + .5) * T; e.fy = (fl(Z.P.y / T) + .5) * T; e.wave = 1; e.t3 = 1;
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) Z.hazard(e.fx + i * T, e.fy + j * T, { r: 30, t: 1.05, dmg: 12, col: '255,110,30' });
      return;
    }
    if (m === 'beam') { e.mt = 2.3; e.bA = Z.angTo(e); e.fired = false; e.beamT = 0; Z.sfx('charge'); return; }
    if (m === 'summon') {
      e.mt = 1.4; Z.sfx('boss'); Z.shake(5);
      const n = e.rage ? 4 : 3;
      for (let i = 0; i < n; i++) {
        const a = e.ph + i * TAU / n, x = e.x + Math.cos(a) * (e.r + 32), y = e.y + Math.sin(a) * (e.r + 32);
        if (Z.spawn('minoguard', x, y)) Z.burst(x, y, '#c08a5a', 10, 90);
      }
    }
  };
  const boss = {
    name: 'Torvagh, the Horned Magus', hp: 3800, sp: 50, dmg: 24, xp: 0, r: 46, heavy: true, eye: false,
    init(e) { e.mode = 'walk'; e.mt = 2.2; e.pi = 0; e.rage = false; e.vol = 0; e.t3 = 0; e.bA = 0; e.fired = false; e.beamT = 0; e.fx = 0; e.fy = 0; e.wave = 0; },
    update(e, Z) {
      const dt = Z.dt;
      if (!e.rage && e.hp < e.max * .4) {
        e.rage = true; Z.banner('Torvagh bellows in fury!', '#ff5a3a', false); Z.sfx('boss'); Z.shake(10);
        Z.ring(e.x, e.y - 20, 16, 150, { r: 7, dmg: 9, col: '176,112,255' }, e.ph);
      }
      e.mt -= dt;
      switch (e.mode) {
        case 'walk': {
          const d = Z.dist(e), sp = e.sp * (e.rage ? 1.3 : 1);
          if (d > 230) Z.chase(e, sp);
          else { const a = Z.angTo(e) + Math.PI / 2; Z.move(e, Math.cos(a) * sp * .6, Math.sin(a) * sp * .6); e.ang = Z.angTo(e); }
          if (e.mt <= 0) bossStart(e, Z, BPAT[e.pi++ % BPAT.length]);
          break;
        }
        case 'volley':
          Z.move(e, 0, 0); e.ang = Z.angTo(e);
          if (e.vol > 0 && (e.t3 -= dt) <= 0) {
            const n = e.rage ? 7 : 5, spr = e.rage ? 1.1 : .85, off = (e.vol & 1) ? spr / (n - 1) / 2 : 0, ox = e.x + (Math.cos(e.ang) < 0 ? -34 : 34), oy = e.y - 58;
            for (let i = 0; i < n; i++) Z.shoot(ox, oy, Math.atan2(Z.P.y - oy, Z.P.x - ox) - spr / 2 + spr * i / (n - 1) + off, 175, { r: 8, dmg: 9, life: 5, col: '176,112,255' });
            Z.sfx('shoot'); e.vol--; e.t3 = .5;
          }
          if (e.mt <= 0) bossStart(e, Z, 'walk');
          break;
        case 'fire':
          Z.move(e, 0, 0); e.ang = Z.angTo(e);
          if (e.wave && (e.t3 -= dt) <= 0) {
            if (e.wave === 1) { // ring of fire fields around the first square
              for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) if (Math.max(Math.abs(i), Math.abs(j)) === 2) Z.hazard(e.fx + i * T, e.fy + j * T, { r: 30, t: 1.05, dmg: 12, col: '255,110,30' });
              e.wave = e.rage ? 2 : 0; e.t3 = 1;
            } else { // enraged: another fire bomb on the hero
              const cx = (fl(Z.P.x / T) + .5) * T, cy = (fl(Z.P.y / T) + .5) * T;
              for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) Z.hazard(cx + i * T, cy + j * T, { r: 30, t: .95, dmg: 12, col: '255,110,30' });
              e.wave = 0;
            }
            Z.sfx('warn');
          }
          if (e.mt <= 0) bossStart(e, Z, 'walk');
          break;
        case 'beam':
          Z.move(e, 0, 0);
          if (!e.fired) {
            if (e.mt > 1.15) { let da = Z.angTo(e) - e.bA; da = Math.atan2(Math.sin(da), Math.cos(da)); e.bA += da * Math.min(1, dt * 3); }
            else {
              e.fired = true; e.beamT = 1.1; Z.sfx('nova');
              for (let i = 0; i < 13; i++) { const d = e.r + 18 + i * 40; Z.hazard(e.x + Math.cos(e.bA) * d, e.y + Math.sin(e.bA) * d, { r: 30, t: .55 + i * .035, dmg: 14, col: '120,180,255' }); }
              if (e.rage) for (const o of [-.42, .42]) for (let i = 0; i < 7; i++) { const d = e.r + 30 + i * 46; Z.hazard(e.x + Math.cos(e.bA + o) * d, e.y + Math.sin(e.bA + o) * d, { r: 28, t: .75 + i * .04, dmg: 12, col: '120,180,255' }); }
            }
          } else e.beamT -= dt;
          e.ang = e.bA;
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
      const c = Z.ctx, s = e.r / 46, m = e.mode, cast = m !== 'walk', st = Math.sin(e.ph * 4 + e.seed), OL = W(white, '#1a0f22');
      // great energy beam: aim lane, then the crackling beam itself
      if (m === 'beam' && !white) {
        c.save(); c.translate(e.x, e.y); c.rotate(e.bA);
        if (!e.fired) {
          const k = Math.max(0, 1 - (e.mt - 1.15) / 1.15);
          c.globalAlpha = .12 + .2 * k + .08 * Math.sin(Z.now * 24); c.fillStyle = '#7ab8ff'; c.fillRect(e.r * .6, -13, 560, 26);
          c.globalAlpha = .5 + .4 * k; c.strokeStyle = '#bfe0ff'; c.lineWidth = 1.5; c.strokeRect(e.r * .6, -13, 560, 26);
        } else if (e.beamT > 0 && e.beamT < .6) {
          const k = e.beamT / .6, z = new Path2D();
          z.moveTo(e.r * .6, 0);
          for (let i = 1; i <= 14; i++) z.lineTo(e.r * .6 + i * 40, Math.sin(Z.now * 60 + i * 2.3) * 7);
          c.globalAlpha = .5 * k; c.fillStyle = '#6aa8ff'; c.fillRect(e.r * .6, -16, 560, 32);
          c.globalAlpha = Math.min(1, k * 1.4); c.strokeStyle = '#e8f6ff'; c.lineWidth = 5; c.stroke(z); c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.stroke(z);
        }
        c.restore();
      }
      if (e.rage && !white) { c.save(); c.globalAlpha = .4 + .2 * Math.sin(Z.now * 6); c.strokeStyle = '#ff4a30'; c.lineWidth = 3; c.beginPath(); c.arc(e.x, e.y, e.r + 8 + Math.sin(Z.now * 5) * 2, 0, TAU); c.stroke(); c.restore(); }
      c.save(); c.translate(e.x, e.y + Math.abs(st) * -1.5 * s); c.scale(s, s); face(c, e);
      c.lineCap = 'round'; c.lineJoin = 'round';
      // hooves under the robe
      const hv = new Path2D(); hv.rect(-16 + st * 3, 33, 11, 10); hv.rect(5 - st * 3, 33, 11, 10);
      c.strokeStyle = OL; c.lineWidth = 2; c.stroke(hv); c.fillStyle = W(white, '#4a2c18'); c.fill(hv);
      c.fillStyle = W(white, '#1e140c'); c.fillRect(-16 + st * 3, 39, 11, 4); c.fillRect(5 - st * 3, 39, 11, 4);
      // back arm sleeve
      const ba = new Path2D(); poly(ba, [-18, -14, -30, 4 + st * 2, -26, 12 + st * 2, -12, -4]);
      c.strokeStyle = OL; c.lineWidth = 2.4; c.stroke(ba); c.fillStyle = W(white, '#2a2050'); c.fill(ba);
      // robe
      const rb = new Path2D(); rb.moveTo(-20, -18); rb.lineTo(22, -18); rb.quadraticCurveTo(28, 10, 31, 38);
      for (let i = 0; i < 6; i++) rb.lineTo(31 - (i + .5) * 10.3, 38 + (i % 2 ? 5 : 0) + Math.sin(e.ph * 4 + i) * 1.5);
      rb.lineTo(-31, 38); rb.quadraticCurveTo(-27, 10, -20, -18); rb.closePath();
      c.strokeStyle = OL; c.lineWidth = 2.6; c.stroke(rb); c.fillStyle = W(white, '#3a2c70'); c.fill(rb);
      if (!white) {
        const fd = new Path2D(); poly(fd, [-20, -16, -10, -16, -16, 38, -30, 38]); c.fillStyle = '#2a1f54'; c.fill(fd);
        const tr = new Path2D(); tr.moveTo(3, -16); tr.lineTo(5, 37); tr.moveTo(-30, 36); tr.lineTo(30, 36);
        c.strokeStyle = '#e0b040'; c.lineWidth = 2.4; c.stroke(tr);
        const rn = new Path2D(); for (let i = 0; i < 4; i++) rn.rect(1.5 + i * .5, -6 + i * 10, 5, 3);
        c.fillStyle = '#f4d070'; c.fill(rn);
        c.fillStyle = '#7a2a1e'; c.fillRect(-23, 4, 47, 5); c.fillStyle = '#f0c040'; c.fillRect(1, 3, 6, 7);
      }
      // fur mantle on the shoulders
      const mn = new Path2D(); ell(mn, 1, -17, 26, 8);
      c.strokeStyle = OL; c.lineWidth = 2; c.stroke(mn); c.fillStyle = W(white, '#6e4222'); c.fill(mn);
      if (!white) { const tf = new Path2D(); for (let i = 0; i < 7; i++) poly(tf, [-22 + i * 7, -12, -19 + i * 7, -7, -16 + i * 7, -12]); c.fillStyle = '#6e4222'; c.fill(tf); }
      // head: bull skull, snout, ears, horns
      const ears = new Path2D(); poly(ears, [-8, -36, -20, -38, -10, -31]); poly(ears, [16, -38, 24, -44, 20, -34]);
      c.strokeStyle = OL; c.lineWidth = 1.8; c.stroke(ears); c.fillStyle = W(white, '#5e361c'); c.fill(ears);
      const hd = new Path2D(); circ(hd, 5, -32, 14); ell(hd, 16, -25, 9.5, 8);
      c.strokeStyle = OL; c.lineWidth = 2.4; c.stroke(hd); c.fillStyle = W(white, '#744426'); c.fill(hd);
      if (!white) {
        const mz = new Path2D(); ell(mz, 17, -24, 8.4, 7); c.fillStyle = '#b8845a'; c.fill(mz);
        const ns = new Path2D(); ell(ns, 20, -25, 1.6, 2.2); ell(ns, 15, -25, 1.6, 2.2); c.fillStyle = '#2a140a'; c.fill(ns);
        c.strokeStyle = '#f0c040'; c.lineWidth = 2.2; c.beginPath(); c.arc(18, -19, 3.4, 0, Math.PI); c.stroke();
        const br = new Path2D(); poly(br, [0, -38, 14, -37, 12, -34, 2, -35]); c.fillStyle = '#4a2812'; c.fill(br);
      }
      c.fillStyle = W(white, e.rage ? '#ff7a40' : '#ff3424'); c.fillRect(5, -35, 3.4, 2.8); c.fillRect(11, -35, 3.4, 2.8);
      const hn = new Path2D();
      hn.moveTo(-4, -40); hn.quadraticCurveTo(-20, -40, -22, -60); hn.quadraticCurveTo(-14, -50, -1, -46); hn.closePath();
      hn.moveTo(12, -42); hn.quadraticCurveTo(26, -44, 30, -63); hn.quadraticCurveTo(30, -48, 15, -46); hn.closePath();
      c.strokeStyle = OL; c.lineWidth = 2; c.stroke(hn); c.fillStyle = W(white, '#efe2c0'); c.fill(hn);
      if (!white) { const tp = new Path2D(); poly(tp, [-22, -60, -19, -52, -16, -55]); poly(tp, [30, -63, 26, -54, 29, -54]); c.fillStyle = '#9a8c6c'; c.fill(tp); }
      // staff and front arm
      const sx = 34, sy = -58, sf = new Path2D(); sf.moveTo(27, 40); sf.lineTo(sx, sy);
      c.strokeStyle = OL; c.lineWidth = 6; c.stroke(sf); c.strokeStyle = W(white, '#8a5a30'); c.lineWidth = 3; c.stroke(sf);
      const fa = new Path2D(); poly(fa, [16, -14, 31, -10 + (cast ? -8 : 0), 34, -2 + (cast ? -8 : 0), 14, -4]);
      c.strokeStyle = OL; c.lineWidth = 2.2; c.stroke(fa); c.fillStyle = W(white, '#3a2c70'); c.fill(fa);
      c.fillStyle = W(white, '#6a3c20'); c.beginPath(); c.arc(32, -6 + (cast ? -8 : 0), 4.4, 0, TAU); c.fill();
      const prong = new Path2D(); prong.moveTo(sx - 6, sy + 6); prong.quadraticCurveTo(sx - 8, sy - 4, sx - 3, sy - 9); prong.moveTo(sx + 6, sy + 4); prong.quadraticCurveTo(sx + 8, sy - 6, sx + 3, sy - 10);
      c.strokeStyle = W(white, '#c09a5a'); c.lineWidth = 2; c.stroke(prong);
      const oc = ORB[m] || ['#8a78d8', '138,120,216'], pul = cast ? 1 + .2 * Math.sin(Z.now * 14) : 1;
      if (!white) Z.glow(oc[1], (cast ? 34 : 16) * pul, sx, sy - 2, cast ? .9 : .5); // local coords, already mirrored
      c.beginPath(); c.arc(sx, sy - 2, 6.5 * pul, 0, TAU); c.strokeStyle = OL; c.lineWidth = 1.8; c.stroke(); c.fillStyle = W(white, oc[0]); c.fill();
      c.fillStyle = '#ffffff'; c.fillRect(sx - 3, sy - 6, 2.4, 2.4);
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#744426', 40, 220); Z.burst(e.x, e.y - 40, '#b070ff', 24, 180); Z.shake(14); },
  };

  /* ================= Events ================= */
  const spot = (Z, d) => { const a = Math.random() * TAU; return { x: Z.P.x + Math.cos(a) * d, y: Z.P.y + Math.sin(a) * d, a }; };
  const events = [
    { t: 6, run(Z) { Z.banner('Isle Herald: Welcome ashore, adventurer! Mind the rats.', '#f6e27a', false); } },
    { t: 14, run(Z) {
      Z.banner('A rat horde pours out of the sewers!', '#e8b888', false); Z.sfx('warn');
      const p = spot(Z, 360);
      for (let i = 0; i < 10; i++) { const n = Z.spawn('rat', p.x + Math.cos(i * 2.4) * (10 + i * 4), p.y + Math.sin(i * 2.4) * (10 + i * 4)); if (n) { n.lead = false; n.done = true; } }
    } },
    { t: 32, run(Z) {
      Z.banner('Rotworms are stirring beneath the soil…', '#e0a088', false); Z.sfx('warn');
      for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + Math.random(), n = Z.spawn('rotworm', Z.P.x + Math.cos(a) * 330, Z.P.y + Math.sin(a) * 330); if (n) { n.mode = 'under'; n.r = 7; n.mt = 4; } }
    } },
    { t: 76, run(Z) {
      Z.banner('An amazon war-band approaches!', '#ff6a4a', true); Z.sfx('boss');
      const p = spot(Z, 430), px = -Math.sin(p.a), py = Math.cos(p.a);
      for (let i = -3; i <= 2; i++) Z.spawn('amazon', p.x + px * (i + .5) * 40, p.y + py * (i + .5) * 40);
      for (let i = 0; i < 2; i++) Z.spawn('spider', p.x - Math.cos(p.a) * 40 + px * (i - .5) * 60, p.y - Math.sin(p.a) * 40 + py * (i - .5) * 60);
    } },
    { t: 100, run(Z) {
      Z.banner('Spiders spill out of the old forest!', '#c8e070', false); Z.sfx('warn');
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, n = Z.spawn('spider', Z.P.x + Math.cos(a) * 380, Z.P.y + Math.sin(a) * 380); if (n && i % 4 === 0 && !n.venom) makeVenom(n); }
    } },
    { t: 124, run(Z) {
      Z.banner('Isle Herald: Dawn draws near. Hold the meadow!', '#f6e27a', false); Z.sfx('warn');
      for (const k of [0, 1]) {
        const p = spot(Z, 400);
        for (let i = 0; i < 5; i++) { const n = Z.spawn(i === 4 && k ? 'rotworm' : 'rat', p.x + Math.cos(i * 2.1) * (12 + i * 5), p.y + Math.sin(i * 2.1) * (12 + i * 5)); if (n && n.kind === 'rat') { n.lead = false; n.done = true; } }
      }
    } },
  ];

  /* ================= Music: original medieval folk in D dorian, 96 bpm ================= */
  const DOR = [0, 2, 3, 5, 7, 9, 10];
  const sc = (base, i) => base + DOR[((i % 7) + 7) % 7] + 12 * Math.floor(i / 7);
  const CH = [0, 6, 0, 4, 2, 6, 3, 0, 2, 3, 0, 4, 2, 6, 3, 4]; // chord roots as scale degrees: Dm C Dm Am | F C G Dm | ...
  const _ = null;
  const MEL = [
    [4, _, _, 3, 2, _, 0, _, 1, _, 2, _, 0, _, _, _],
    [2, _, 3, 4, 5, _, 4, _, 3, _, 2, _, 3, _, _, _],
    [7, _, _, 6, 5, _, 4, _, 5, _, 6, _, 4, _, _, _],
    [4, _, 2, _, 3, _, 1, _, 2, _, _, 1, 0, _, _, _],
  ];
  const ORD = [0, 1, 0, 3, 2, 1, 2, 3];
  const ARP = [0, 4, 7, 9, 7, 4, 2, 4];
  const music = {
    bpm: 96, div: 2,
    step(s, t, A) {
      const spb = 60 / 96 / 2, bar = fl(s / 8) % 16, b = s % 8, ch = CH[bar], boss = A.boss, inten = A.inten || 0;
      const ph = MEL[ORD[fl(bar / 2) % 8]], idx = (bar % 2) * 8 + b, n = ph[idx];
      let len = 1; while (idx + len < 16 && ph[idx + len] === null && len < 4) len++;
      if (!boss) {
        if (b === 0) A.tone(t, sc(38, ch), spb * 3.8, .07, { type: 'triangle', attack: .02 });
        if (b === 4) A.tone(t, sc(38, ch + 4), spb * 3.6, .05, { type: 'triangle', attack: .02 });
        if (b === 0 && bar % 4 === 0) A.pad([50, 57], t, spb * 31, .011, { type: 'triangle', cutoff: 700, q: 2, detune: 6 });
        if (b !== 7 || bar % 2 === 0) A.pluck(sc(50, ch + ARP[b]), t, b === 0 ? .5 : .3);
        if (b === 0) A.tom(t, 92, .26);
        if (b === 3 || b === 6) A.tom(t, 138, .13);
        if (b === 4 && bar % 2 === 1) A.tom(t, 104, .16);
        if (b % 2 === 1) A.noise(t, .045, .01 + inten * .008, { type: 'highpass', f: 6500 });
        if (n !== null) {
          A.tone(t, sc(62, n), spb * len * .95, .045, { type: 'triangle', attack: .045, vib: .35, cutoff: 3200 });
          if (bar >= 8) A.tone(t + .003, sc(62, n - 2), spb * len * .9, .016, { type: 'sine', attack: .06, vib: .2 });
        }
        if (bar % 4 === 3 && b === 6) A.bell(sc(74, ch + 4), t, .03);
      } else {
        // battle variation: driving drums, low strings, brass-like stabs and a reedy shawm on the tune
        if (b % 2 === 0) A.tone(t, sc(38, ch), spb * .9, .07, { type: 'sawtooth', cutoff: 420 });
        else A.tone(t, sc(38, ch) + 12, spb * .8, .045, { type: 'sawtooth', cutoff: 520 });
        if (b === 0) A.pad([sc(50, ch), sc(50, ch + 4)], t, spb * 8, .016, { type: 'sawtooth', cutoff: 900, q: 3, detune: 10 });
        if (b === 0 || b === 3 || (b === 6 && bar % 2 === 1)) {
          A.tone(t, sc(62, ch + 2), spb * 1.1, .033, { type: 'sawtooth', cutoff: 1500, sweep: 700, attack: .012 });
          A.tone(t, sc(62, ch + 4), spb * 1.1, .028, { type: 'sawtooth', cutoff: 1500, sweep: 700, attack: .012 });
        }
        if (b === 0 || b === 4) A.kick(t, .65); else if (b === 3) A.kick(t, .4);
        if (b === 4) A.snare(t, .28); else if (b === 7) A.snare(t, .1);
        if (bar % 4 === 3 && b >= 5) A.tom(t, 165 - (b - 5) * 28, .32);
        A.hat(t, b % 2 ? .03 : .045, false);
        A.pluck(sc(62, ch + ARP[b]), t, .4);
        if (n !== null) {
          A.tone(t, sc(62, n), spb * len * .9, .04, { type: 'sawtooth', cutoff: 1700, vib: .2, attack: .02 });
          A.tone(t, sc(50, n), spb * len * .9, .02, { type: 'square', cutoff: 1100, attack: .02 });
        }
      }
    },
  };

  return {
    id: 'tibia', name: 'Rookmeadow Isle', nod: 'Tibia', portal: '150,205,70', bg: '#5b893a', dark: .35, dim: .18,
    ground, under, ambient,
    mix: { rat: 6, spider: 2.4, rotworm: 1.2, amazon: .8 },
    target: 1,
    foes: { rat, rotworm, spider, amazon, minoguard },
    boss, events, music,
  };
})());
