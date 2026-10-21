// Zone spire: the act map of a deck-building climb, spread across a desk of aged, scorched parchment sheets. Dotted ink
// paths branch and merge upward between hand-inked node icons (monster, elite, ? event, merchant, campfire, treasure)
// to a boss sigil, with the climbed route circled in red ink. Inked trees, hills, cliffs, a distant spire, compass roses,
// ink blots, coffee rings, candles and an inkwell fill the margins. Every foe telegraphs with an INTENT icon over its
// head (sword + damage, shield, buff arrow, debuff swirl). A nod to Slay the Spire.
ZONES.push((() => {
  const TAU = Math.PI * 2, PI = Math.PI, fl = Math.floor, ZS = 1.3; // ZS: the engine draws foes at 1.3x
  const W = (w, c) => (w ? '#fff' : c);
  const circ = (p, x, y, r) => { if (!(r > 0)) return; p.moveTo(x + r, y); p.arc(x, y, r, 0, TAU); };
  const ell = (p, x, y, rx, ry) => { if (!(rx > 0) || !(ry > 0)) return; p.moveTo(x + rx, y); p.ellipse(x, y, rx, ry, 0, 0, TAU); };
  const poly = (p, a) => { p.moveTo(a[0], a[1]); for (let i = 2; i < a.length; i += 2) p.lineTo(a[i], a[i + 1]); p.closePath(); };
  const line = (p, a) => { p.moveTo(a[0], a[1]); for (let i = 2; i < a.length; i += 2) p.lineTo(a[i], a[i + 1]); };
  const cl01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
  const md = (x, m) => ((x % m) + m) % m;
  const segD = (px, py, ax, ay, bx, by) => {
    const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
    let u = l > 0 ? ((px - ax) * dx + (py - ay) * dy) / l : 0; u = u < 0 ? 0 : u > 1 ? 1 : u;
    return Math.hypot(px - ax - dx * u, py - ay - dy * u);
  };
  const GOLD = '#ffcf3a';
  const INK = '#3a2818', PAPERHI = '#cdb48c', RED = '#a62a20';

  /* ================= Map: one act map per 1600px parchment sheet =================
     Four walkers climb 7 rows of 6 lanes (never crossing an existing diagonal), so paths branch and merge like the real
     thing. Row 0 is all monsters, row 3 all treasure, row 6 all campfires, then every top node runs to the boss sigil.
     Walker 0 is "your" route: its first rows are circled in red, and the nodes it can reach next pulse (in `under`). */
  const M = 1600, NL = 6, NR = 7;
  const MON = 0, ELI = 1, EVT = 2, SHOP = 3, REST = 4, CHEST = 5;
  const TREE = 0, PINE = 1, HILL = 2, MTN = 3, CLIFF = 4, GRASS = 5, ROCK = 6, BLOT = 7;
  const cache = new Map();
  const sheetOf = (Z, cx, cy) => {
    const key = cx + ',' + cy;
    let sh = cache.get(key);
    if (sh) return sh;
    if (cache.size > 40) cache.clear();
    const h = i => Z.hash(cx * 53 + i * 17 + 11, cy * 37 - i * 7 + 5);
    const ox = cx * M, oy = cy * M;
    sh = { ox, oy, tone: fl(h(1) * 3) % 3, act: fl(h(2) * 3) % 3, nodes: [], edges: [], vis: [], cur: [], walk: [], deco: [], stains: [], cand: [], well: null, tower: null, comp: null, boss: null };
    const id = new Map(), ek = new Set();
    const node = (lane, row) => {
      const k = lane * 10 + row;
      let n = id.get(k);
      if (n) return n;
      const hx = Z.hash(cx * 91 + lane * 7 + row * 3, cy * 67 + row * 11 - lane), hy = Z.hash(cx * 13 - lane * 5 + row, cy * 29 + row * 7 + lane * 3);
      n = { x: ox + 250 + lane * 220 + (hx - .5) * 80, y: oy + M - 190 - row * 165 + (hy - .5) * 44, row, lane, t: MON, v: hx };
      id.set(k, n); sh.nodes.push(n);
      return n;
    };
    const W0 = [];
    for (let w = 0; w < 6; w++) {
      let lane = w === 0 ? 1 + fl(h(3) * 4) % 4 : w === 1 ? fl(h(5) * 2) % 2 : w === 2 ? NL - 1 - fl(h(6) * 2) % 2 : fl(h(4 + w) * NL) % NL, prev = null;
      for (let r = 0; r < NR; r++) {
        const n = node(lane, r);
        if (w === 0) W0.push(n);
        if (prev) { const k = prev.lane + ',' + r + ',' + lane; if (!ek.has(k)) { ek.add(k); sh.edges.push([prev, n]); } }
        prev = n;
        if (r < NR - 1) {
          let nl = Math.min(NL - 1, Math.max(0, lane + fl(Z.hash(cx * 7 + w * 31 + r * 5, cy * 11 - w * 3 + r * 13) * 3) - 1));
          if (nl !== lane && ek.has(nl + ',' + (r + 1) + ',' + lane)) nl = lane; // would cross an existing diagonal
          lane = nl;
        }
      }
    }
    sh.boss = { x: ox + 800 + (h(6) - .5) * 90, y: oy + 220 };
    for (const n of sh.nodes) {
      if (n.row === NR - 1) sh.edges.push([n, sh.boss]);
      const q = Z.hash(fl(n.x) * 3 + 1, fl(n.y) * 5 - 2);
      if (n.row === 0) n.t = MON;
      else if (n.row === 3) n.t = CHEST;
      else if (n.row === NR - 1) n.t = REST;
      else n.t = q < .44 ? MON : q < .64 ? EVT : q < .77 ? (n.row >= 2 ? ELI : MON) : q < .86 ? (n.row >= 2 ? REST : EVT) : q < .94 ? SHOP : EVT;
    }
    const v = 1 + fl(h(7) * 4) % 4;
    sh.vis = W0.slice(0, v + 1);
    for (let i = 0; i < v; i++) sh.walk.push([W0[i], W0[i + 1]]);
    for (const [a, b] of sh.edges) if (a === W0[v] && b !== sh.boss) sh.cur.push(b);

    // set pieces: a distant spire top-left/right, a compass rose in the opposite bottom corner, candles, an inkwell
    const side = h(22) < .5 ? -1 : 1;
    if (h(21) < .72) sh.tower = { x: ox + 800 + side * 655, y: oy + 330 };
    if (h(23) < .6) sh.comp = { x: ox + 800 - side * 660, y: oy + M - 150, r: 50 };
    const blk = [];
    if (sh.tower) blk.push([sh.tower.x, sh.tower.y - 130, 120]);
    if (sh.comp) blk.push([sh.comp.x, sh.comp.y, 70]);
    blk.push([sh.boss.x, sh.boss.y - 40, 110]);
    const blocked = (x, y, r) => {
      if (x < ox + 60 + r || x > ox + M - 60 - r || y < oy + 60 + r || y > oy + M - 60 - r) return true;
      for (const n of sh.nodes) if (Math.abs(n.x - x) < 46 + r && Math.abs(n.y - y) < 46 + r && Math.hypot(n.x - x, n.y - y) < 40 + r) return true;
      for (const b of blk) if (Math.hypot(b[0] - x, b[1] - y) < b[2] + r) return true;
      for (const [a, b] of sh.edges) if (segD(x, y, a.x, a.y, b.x, b.y) < 16 + r) return true;
      return false;
    };
    for (let k = 0; k < 10 && sh.cand.length < 2; k++) {
      const x = ox + 150 + h(30 + k) * (M - 300), y = oy + 150 + h(45 + k) * (M - 300);
      if (!blocked(x, y, 40)) { const cv = h(60 + k); sh.cand.push({ x, y, v: cv, fx: x + .5, fy: y - 35 - cv * 8 }); blk.push([x, y - 14, 46]); }
    }
    if (h(24) < .42) for (let k = 0; k < 8; k++) {
      const x = ox + 180 + h(70 + k) * (M - 360), y = oy + 180 + h(80 + k) * (M - 360);
      if (!blocked(x, y, 70)) { sh.well = { x, y, v: h(90 + k) }; blk.push([x, y - 20, 90]); break; }
    }
    // inked scenery between the paths
    const G = 72;
    for (let gy = 0; gy < M / G; gy++) for (let gx = 0; gx < M / G; gx++) {
      const q = Z.hash(cx * 211 + gx * 7 + 3, cy * 157 + gy * 11 - 5);
      if (q > .62) continue;
      const x = ox + gx * G + Z.hash(cx * 17 + gx, cy * 19 + gy * 3) * G, y = oy + gy * G + Z.hash(cx * 23 + gx * 3, cy * 31 + gy) * G;
      const k = q < .13 ? TREE : q < .22 ? PINE : q < .31 ? HILL : q < .37 ? MTN : q < .43 ? CLIFF : q < .53 ? GRASS : q < .6 ? ROCK : BLOT;
      const r = [30, 26, 32, 38, 36, 10, 12, 18][k];
      if (!blocked(x, y, r)) { sh.deco.push({ k, x, y, v: Z.hash(fl(x) * 3 - 1, fl(y) * 7 + 2) }); blk.push([x, y, r * .8]); }
    }
    for (let k = 0; k < 3; k++) sh.stains.push({ x: ox + 120 + h(100 + k) * (M - 240), y: oy + 120 + h(110 + k) * (M - 240), r: 50 + h(120 + k) * 70, v: h(130 + k) * 9 });
    cache.set(key, sh);
    return sh;
  };
  const sheetsIn = (Z, x0, y0, x1, y1) => {
    const out = [];
    for (let cy = fl(y0 / M); cy <= fl(y1 / M); cy++) for (let cx = fl(x0 / M); cx <= fl(x1 / M); cx++) out.push(sheetOf(Z, cx, cy));
    return out;
  };

  /* ================= Floor art (cached) ================= */
  const TONES = ['#bda378', '#b79e72', '#c2a97e'];
  const parchment = (c, Z, S, x0, y0, x1, y1) => {
    for (const sh of S) {
      const ax = Math.max(x0, sh.ox), ay = Math.max(y0, sh.oy), bx = Math.min(x1, sh.ox + M), by = Math.min(y1, sh.oy + M);
      if (bx <= ax || by <= ay) continue;
      c.fillStyle = TONES[sh.tone]; c.fillRect(ax, ay, bx - ax, by - ay);
    }
    // mottling, paper fibres and foxing
    const G = 52, dk = new Path2D(), lt = new Path2D(), fib = new Path2D(), fox = new Path2D();
    for (let gy = fl(y0 / G); gy <= fl(y1 / G); gy++) for (let gx = fl(x0 / G); gx <= fl(x1 / G); gx++) {
      const h = Z.hash(gx * 3 + 1, gy * 7 - 2), h2 = Z.hash(gx * 11 - 4, gy * 5 + 3), h3 = Z.hash(gx * 7 + 9, gy * 13 + 1);
      const x = gx * G + h2 * G, y = gy * G + h3 * G;
      if (h < .3) ell(dk, x, y, 26 + h * 70, 16 + h2 * 30);
      else if (h < .52) ell(lt, x, y, 16 + h2 * 30, 10 + h3 * 20);
      if (h2 < .55) { const a = h3 * PI, L = 5 + h * 12; fib.moveTo(x - Math.cos(a) * L, y - Math.sin(a) * L); fib.quadraticCurveTo(x + h * 4, y - h2 * 4, x + Math.cos(a) * L, y + Math.sin(a) * L); }
      if (h3 < .05) { circ(fox, x, y, 1.6 + h * 2.4); circ(fox, x + 4, y + 3, 1 + h2 * 1.4); circ(fox, x - 3, y + 5, .8 + h3 * 8); }
    }
    c.fillStyle = 'rgba(112,78,40,.05)'; c.fill(dk);
    c.fillStyle = 'rgba(244,226,186,.05)'; c.fill(lt);
    c.strokeStyle = 'rgba(105,74,42,.14)'; c.lineWidth = 1; c.stroke(fib);
    c.fillStyle = 'rgba(128,78,36,.22)'; c.fill(fox);
    // each sheet darkens toward its edges, and carries two old fold creases
    const fold = new Path2D(), foldD = new Path2D();
    for (const sh of S) {
      const ax = Math.max(x0, sh.ox), ay = Math.max(y0, sh.oy), bx = Math.min(x1, sh.ox + M), by = Math.min(y1, sh.oy + M);
      if (bx <= ax || by <= ay) continue;
      const cx = sh.ox + M / 2, cy = sh.oy + M / 2, g = c.createRadialGradient(cx, cy, 420, cx, cy, 1140);
      g.addColorStop(0, 'rgba(78,44,16,0)'); g.addColorStop(1, 'rgba(78,44,16,.34)');
      c.fillStyle = g; c.fillRect(ax, ay, bx - ax, by - ay);
      const fx = cx + (sh.tone - 1) * 14, fy = cy - 30 + sh.act * 22;
      if (fx > x0 - 6 && fx < x1 + 6) { fold.moveTo(fx, Math.max(ay, sh.oy)); fold.lineTo(fx + 3, by); foldD.moveTo(fx + 2.5, ay); foldD.lineTo(fx + 5.5, by); }
      if (fy > y0 - 6 && fy < y1 + 6) { fold.moveTo(ax, fy); fold.lineTo(bx, fy - 4); foldD.moveTo(ax, fy + 2.5); foldD.lineTo(bx, fy - 1.5); }
    }
    c.strokeStyle = 'rgba(246,230,196,.28)'; c.lineWidth = 3; c.stroke(fold);
    c.strokeStyle = 'rgba(92,60,30,.2)'; c.lineWidth = 1.2; c.stroke(foldD);
  };

  // ---- inked scenery ----
  const tree = (L, x, y, r) => {
    const p = [];
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, rr = r * (i % 2 ? .8 : 1); p.push(x + Math.cos(a) * rr, y - r + Math.sin(a) * rr * .9); }
    ell(L.shade, x + r * .3, y - r * .85, r * .62, r * .66);
    poly(L.line, p);
    L.line.moveTo(x, y - r * .12); L.line.lineTo(x, y + r * .6);
    for (let q = 0; q < 3; q++) { L.fine.moveTo(x + r * .15 + q * 2.6, y - r * 1.45 + q * 3); L.fine.lineTo(x + r * .5 + q * 1.8, y - r * .55 + q * 1.6); }
  };
  const pine = (L, x, y, hh) => {
    const pt = [x, y - hh, x + hh * .3, y - hh * .48, x + hh * .14, y - hh * .48, x + hh * .4, y, x - hh * .4, y, x - hh * .14, y - hh * .48, x - hh * .3, y - hh * .48];
    poly(L.shade, [x, y - hh, x + hh * .3, y - hh * .48, x + hh * .14, y - hh * .48, x + hh * .4, y, x, y]);
    poly(L.line, pt); L.line.moveTo(x, y); L.line.lineTo(x, y + hh * .2);
  };
  const decoDraw = (L, d) => {
    const x = d.x, y = d.y, v = d.v;
    switch (d.k) {
      case TREE: tree(L, x - 12, y + 4, 9 + v * 3); tree(L, x + 11, y + 2, 8 + v * 2); tree(L, x, y - 9, 10); break;
      case PINE: pine(L, x - 10, y + 6, 24 + v * 6); pine(L, x + 9, y + 2, 20 + v * 8); if (v > .5) pine(L, x + 1, y + 12, 18); break;
      case HILL:
        for (let q = 0; q < 3; q++) {
          const hx = x - 20 + q * 19, hy = y + (q % 2) * 7, w = 15 + (q % 2) * 5 + v * 4;
          L.line.moveTo(hx - w, hy); L.line.quadraticCurveTo(hx, hy - w * 1.35, hx + w, hy);
          for (let j = 0; j < 3; j++) { L.fine.moveTo(hx + w * .2 + j * 4, hy - w * .5 + j * 3.6); L.fine.lineTo(hx + w * .2 + j * 4 + 2, hy - w * .5 + j * 3.6 + 5); }
        }
        break;
      case MTN: {
        const s = .85 + v * .4, P = [x - 34 * s, y + 8, x - 20 * s, y - 16 * s, x - 12 * s, y - 5 * s, x, y - 30 * s, x + 12 * s, y - 8 * s, x + 22 * s, y - 20 * s, x + 36 * s, y + 8];
        for (const i of [2, 6, 10]) { const px = P[i], py = P[i + 1], vx = P[i + 2], vy = P[i + 3]; poly(L.shade, [px, py, vx, vy, vx, y + 8, px + (vx - px) * .25, y + 8]); }
        line(L.line, P);
        for (const i of [2, 6, 10]) for (let j = 1; j < 4; j++) { const px = P[i] + j * 3.4 * s, py = P[i + 1] + j * 5 * s; L.fine.moveTo(px, py); L.fine.lineTo(px - 1.5, py + 7 * s); }
        L.fine.moveTo(x - 4 * s, y - 22 * s); L.fine.lineTo(x - 7 * s, y - 14 * s);
        break;
      }
      case CLIFF: {
        const P = [];
        for (let i = 0; i <= 6; i++) P.push(x - 36 + i * 12, y + (Math.sin(i * 2.1 + v * 9) * 4));
        line(L.line, P);
        for (let i = 0; i < 13; i++) { const u = i / 12, px = x - 36 + u * 72, py = y + Math.sin(u * 6 * 2.1 / 1 + v * 9) * 0 + Math.sin((u * 6) * 2.1 + v * 9) * 4; L.fine.moveTo(px, py + 1.5); L.fine.lineTo(px - 1, py + 6 + ((i * 7 + fl(v * 10)) % 5) * 2.2); }
        break;
      }
      case GRASS:
        for (let i = 0; i < 4; i++) { const gx = x + (i - 1.5) * 7, gy = y + (i % 2) * 4; L.fine.moveTo(gx - 3, gy); L.fine.lineTo(gx - 1, gy - 5); L.fine.moveTo(gx + .5, gy); L.fine.lineTo(gx + 2.5, gy - 6); }
        break;
      case ROCK: ell(L.line, x, y, 5.5, 3.6); ell(L.line, x + 9, y + 2, 3.8, 2.6); ell(L.shade, x + 1.5, y + 1, 3.5, 2); break;
      default: {
        const P = [], r = 9 + v * 10;
        for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, rr = r * (.72 + .55 * Math.abs(Math.sin(i * 2.7 + v * 13))); P.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr * .85); }
        poly(L.blot, P);
        for (let i = 0; i < 6; i++) { const a = v * 20 + i * 1.3, d = r * (1.35 + (i % 3) * .35); circ(L.blot, x + Math.cos(a) * d, y + Math.sin(a) * d * .85, 1.2 + ((i * 5) % 3)); }
        if (v > .5) { L.blot.moveTo(x - 2, y + r * .6); L.blot.lineTo(x + 2, y + r * .6); L.blot.lineTo(x + 1, y + r * 1.9); L.blot.lineTo(x - 1, y + r * 1.9); L.blot.closePath(); circ(L.blot, x, y + r * 1.95, 2); }
      }
    }
  };
  const drawTower = (L, x, b) => {
    const H = 250, half = y => 30 - (b - y) / H * 22;
    poly(L.shade, [x + 2, b - H, x + 8, b - H, x + 30, b, x + 6, b]);
    poly(L.line, [x - 30, b, x - 8, b - H, x, b - H - 42, x + 8, b - H, x + 30, b]);
    L.line.moveTo(x, b - H - 42); L.line.lineTo(x, b - H - 56);
    for (let k = 0; k < 8; k++) { const y1 = b - 16 - k * 30; L.line.moveTo(x - half(y1), y1); L.line.lineTo(x + half(y1 - 16), y1 - 16); }
    for (let y = b - 8; y > b - H; y -= 7) { L.fine.moveTo(x + half(y) * .35, y); L.fine.lineTo(x + half(y) * .9, y + 3); }
    for (let k = 0; k < 6; k++) { const y = b - 34 - k * 36, w = half(y) * .5 * (k % 2 ? 1 : -1); L.blot.rect(x + w - 1.6, y, 3.2, 6); }
    // scribbled clouds drifting past the tower, and a hatched rise at its foot
    for (const [cx, cy, n] of [[x - 52, b - 150, 4], [x + 40, b - 214, 3], [x - 30, b - 268, 3]]) {
      for (let q = 0; q < n; q++) { const r = q % 2 ? 6 : 8; L.line.moveTo(cx + q * 11 + r, cy); L.line.arc(cx + q * 11, cy, r, 0, PI, true); }
      L.line.moveTo(cx - 9, cy); L.line.lineTo(cx + (n - 1) * 11 + 8, cy);
    }
    L.line.moveTo(x - 64, b + 4); L.line.quadraticCurveTo(x, b - 12, x + 64, b + 4);
    for (let j = 0; j < 7; j++) { const px = x + 10 + j * 7; L.fine.moveTo(px, b - 4 + j * .9); L.fine.lineTo(px - 2, b + 3 + j * .5); }
  };
  const drawCompass = (L, x, y, r, T) => {
    circ(L.line, x, y, r); circ(L.line, x, y, r - 6);
    for (let i = 0; i < 32; i++) { const a = i / 32 * TAU, ca = Math.cos(a), sa = Math.sin(a), q = i % 4 ? 2.5 : 5; L.fine.moveTo(x + ca * (r - 6), y + sa * (r - 6)); L.fine.lineTo(x + ca * (r - 6 - q), y + sa * (r - 6 - q)); }
    for (let i = 0; i < 8; i++) {
      const a = i * PI / 4 - PI / 2, len = i % 2 ? r * .55 : r * .98, w = i % 2 ? 4.5 : 7.5;
      const tx = x + Math.cos(a) * len, ty = y + Math.sin(a) * len, lx = x + Math.cos(a - PI / 2) * w, ly = y + Math.sin(a - PI / 2) * w, rx = x + Math.cos(a + PI / 2) * w, ry = y + Math.sin(a + PI / 2) * w;
      poly(L.ink, [x, y, tx, ty, lx, ly]); poly(L.line, [x, y, tx, ty, rx, ry]);
    }
    circ(L.ink, x, y, 3.2);
    T.push(['N', x, y - r - 11, 'bold 17px Georgia, serif', INK]);
  };
  const drawStain = (L, s) => {
    const p = [];
    for (let i = 0; i <= 28; i++) { const a = i / 28 * TAU, rr = s.r * (1 + .05 * Math.sin(3 * a + s.v) + .03 * Math.sin(7 * a - s.v)); p.push(s.x + Math.cos(a) * rr, s.y + Math.sin(a) * rr * .92); }
    line(L.stain, p);
    L.stain2.moveTo(s.x + Math.cos(s.v) * s.r * .86, s.y + Math.sin(s.v) * s.r * .8); L.stain2.ellipse(s.x, s.y, s.r * .86, s.r * .8, 0, s.v, s.v + 2.2);
  };

  // ---- node icons: ink silhouettes with parchment cut-outs ----
  const icon = (L, t, x, y, s, T) => {
    const R = a => a.map((v, i) => (i % 2 ? y + v * s : x + v * s));
    switch (t) {
      case MON:
        ell(L.a, x, y + s, 12.5 * s, 11 * s); ell(L.a, x, y + 8 * s, 9 * s, 5 * s);
        poly(L.a, R([-9, -6, -14, -17, -4, -10])); poly(L.a, R([9, -6, 14, -17, 4, -10]));
        poly(L.b, R([-9, -5, -2.5, -1.5, -8, .5])); poly(L.b, R([9, -5, 2.5, -1.5, 8, .5])); poly(L.b, R([-7, 4, 7, 4, 5, 10, -5, 10]));
        poly(L.c, R([-5, 4, -3.5, 8, -2, 4])); poly(L.c, R([2, 4, 3.5, 8, 5, 4])); poly(L.c, R([-1.2, 10, 0, 6.5, 1.2, 10]));
        break;
      case ELI:
        poly(L.a, R([-5, -8, -11, -14, -20, -22, -16, -10, -10, -3])); poly(L.a, R([5, -8, 11, -14, 20, -22, 16, -10, 10, -3]));
        ell(L.a, x, y - s, 11 * s, 10 * s); L.a.rect(x - 6.5 * s, y + 4 * s, 13 * s, 7 * s);
        circ(L.b, x - 4.5 * s, y - 1.5 * s, 3.3 * s); circ(L.b, x + 4.5 * s, y - 1.5 * s, 3.3 * s); poly(L.b, R([0, 2.5, -1.7, 5.5, 1.7, 5.5]));
        for (const u of [-4.2, -.7, 2.8]) L.b.rect(x + u * s, y + 7.5 * s, 1.4 * s, 3.5 * s);
        break;
      case EVT: T.push(['?', x, y + 1.5 * s, 'bold ' + fl(31 * s) + 'px Georgia, serif', INK]); break;
      case SHOP:
        ell(L.a, x, y + 4 * s, 12 * s, 10.5 * s); poly(L.a, R([-5, -5, 5, -5, 8, -12, 2.5, -8.5, 0, -11, -2.5, -8.5, -8, -12]));
        L.b.rect(x - 5.5 * s, y - 6.4 * s, 11 * s, 2.4 * s);
        T.push(['$', x, y + 5 * s, 'bold ' + fl(14 * s) + 'px Georgia, serif', PAPERHI]);
        break;
      case REST:
        poly(L.a, R([-14, 7, -12, 11.5, 13, 5, 11, .8])); poly(L.a, R([14, 7, 12, 11.5, -13, 5, -11, .8]));
        poly(L.a, R([0, -20, 3.5, -11, 8, -15, 9.5, -5, 7.5, 2.5, -7.5, 2.5, -9.5, -6, -6, -13, -3, -8.5]));
        poly(L.b, R([.5, -9, 4, -2, 2.8, 1.8, -2.8, 1.8, -3.6, -3]));
        ell(L.a, x - 16 * s, y + 9 * s, 2.6 * s, 1.8 * s); ell(L.a, x + 16 * s, y + 9 * s, 2.6 * s, 1.8 * s);
        break;
      case CHEST:
        L.a.rect(x - 13 * s, y - 3 * s, 26 * s, 13 * s);
        L.a.moveTo(x - 13 * s, y - 3 * s); L.a.lineTo(x - 13 * s, y - 8 * s); L.a.quadraticCurveTo(x, y - 16 * s, x + 13 * s, y - 8 * s); L.a.lineTo(x + 13 * s, y - 3 * s); L.a.closePath();
        L.b.rect(x - 12 * s, y - 4.4 * s, 24 * s, 1.6 * s); L.b.rect(x - 9.5 * s, y - 10.5 * s, 2 * s, 19.5 * s); L.b.rect(x + 7.5 * s, y - 10.5 * s, 2 * s, 19.5 * s); L.b.rect(x - 2.8 * s, y - 5.4 * s, 5.6 * s, 6 * s);
        L.c.rect(x - .7 * s, y - 3.6 * s, 1.4 * s, 3 * s);
        break;
    }
  };
  const drawBossSigil = (L, L2, b) => {
    const x = b.x, y = b.y;
    circ(L.a, x, y, 34);
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r2 = i % 2 ? 44 : 50; poly(L.a, [x + Math.cos(a - .13) * 32, y + Math.sin(a - .13) * 32, x + Math.cos(a) * r2, y + Math.sin(a) * r2, x + Math.cos(a + .13) * 32, y + Math.sin(a + .13) * 32]); }
    circ(L.b, x, y, 29);
    icon(L2, ELI, x, y + 3, 1.55, null);
  };
  // red-ink loop drawn round a visited node, as if circled by hand
  const redLoop = (p, n) => {
    const a0 = n.v * 9, N = 30;
    for (let k = 0; k <= N; k++) {
      const a = a0 + k / 26 * TAU, r = 23 + 2.4 * Math.sin(k * .9 + n.v * 7) + k * .1, px = n.x + Math.cos(a) * r, py = n.y + 1 + Math.sin(a) * r * .9;
      if (k) p.lineTo(px, py); else p.moveTo(px, py);
    }
  };

  // ---- the act map itself ----
  const ACT = ['Act I', 'Act II', 'Act III'];
  const drawMap = (c, Z, S, x0, y0, x1, y1) => {
    const vis = (x, y, m) => x > x0 - m && x < x1 + m && y > y0 - m && y < y1 + m;
    const L = { shade: new Path2D(), line: new Path2D(), fine: new Path2D(), blot: new Path2D(), ink: new Path2D(), stain: new Path2D(), stain2: new Path2D() };
    const I1 = { a: new Path2D(), b: new Path2D(), c: new Path2D() }, I2 = { a: new Path2D(), b: new Path2D(), c: new Path2D() };
    const dots = new Path2D(), red = new Path2D(), flour = new Path2D(), T = [];
    for (const sh of S) {
      for (const s of sh.stains) if (vis(s.x, s.y, s.r + 6)) drawStain(L, s);
      for (const d of sh.deco) if (vis(d.x, d.y, 60)) decoDraw(L, d);
      if (sh.tower && vis(sh.tower.x, sh.tower.y - 140, 180)) drawTower(L, sh.tower.x, sh.tower.y);
      if (sh.comp && vis(sh.comp.x, sh.comp.y, 80)) drawCompass(L, sh.comp.x, sh.comp.y, sh.comp.r, T);
      for (const [a, b] of sh.edges) {
        const dx = b.x - a.x, dy = b.y - a.y, Ln = Math.hypot(dx, dy);
        if (!(Ln > 1)) continue;
        if (!vis(Math.min(a.x, b.x), Math.min(a.y, b.y), 10 + Math.abs(dx) + Math.abs(dy)) || !vis(Math.max(a.x, b.x), Math.max(a.y, b.y), 10 + Math.abs(dx) + Math.abs(dy))) continue;
        const g0 = 24, g1 = b === sh.boss ? 56 : 24, n = fl((Ln - g0 - g1) / 11);
        for (let i = 0; i <= n; i++) { const u = (g0 + i * 11) / Ln; circ(dots, a.x + dx * u, a.y + dy * u, 2.1); }
      }
      for (const n of sh.nodes) if (vis(n.x, n.y, 40)) icon(I1, n.t, n.x, n.y, 1, T);
      for (const n of sh.vis) if (vis(n.x, n.y, 40)) redLoop(red, n);
      const b = sh.boss;
      if (vis(b.x, b.y, 60)) drawBossSigil(I1, I2, b);
      if (vis(b.x, b.y - 108, 120)) {
        T.push([ACT[sh.act], b.x, b.y - 100, 'italic bold 34px Georgia, serif', INK]);
        flour.moveTo(b.x - 70, b.y - 76); flour.quadraticCurveTo(b.x - 30, b.y - 84, b.x, b.y - 76); flour.quadraticCurveTo(b.x + 30, b.y - 68, b.x + 70, b.y - 78);
        circ(flour, b.x - 76, b.y - 76, 2.5); circ(flour, b.x + 76, b.y - 78, 2.5);
      }
    }
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = 'rgba(122,74,32,.17)'; c.lineWidth = 4.5; c.stroke(L.stain);
    c.strokeStyle = 'rgba(122,74,32,.12)'; c.lineWidth = 2; c.stroke(L.stain2);
    c.fillStyle = 'rgba(100,68,38,.26)'; c.fill(L.shade);
    c.strokeStyle = 'rgba(58,40,24,.62)'; c.lineWidth = 1.5; c.stroke(L.line);
    c.strokeStyle = 'rgba(58,40,24,.45)'; c.lineWidth = 1; c.stroke(L.fine);
    c.fillStyle = 'rgba(52,34,20,.72)'; c.fill(L.ink);
    c.fillStyle = 'rgba(40,26,16,.8)'; c.fill(L.blot);
    c.fillStyle = 'rgba(58,40,24,.82)'; c.fill(dots);
    c.fillStyle = INK; c.fill(I1.a); c.fillStyle = PAPERHI; c.fill(I1.b); c.fillStyle = INK; c.fill(I1.c);
    c.fill(I2.a); c.fillStyle = PAPERHI; c.fill(I2.b);
    c.strokeStyle = 'rgba(58,40,24,.7)'; c.lineWidth = 1.6; c.stroke(flour);
    c.globalAlpha = .85; c.strokeStyle = RED; c.lineWidth = 2.6; c.stroke(red); c.globalAlpha = 1;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const t of T) { c.font = t[3]; c.fillStyle = t[4]; c.fillText(t[0], t[1], t[2]); }
    c.lineCap = 'butt'; c.lineJoin = 'miter';
  };

  // ---- objects resting on the map: candles and an inkwell with its quill ----
  const drawCandle = (c, d) => {
    const x = d.x, y = d.y, H = 30 + d.v * 8;
    const dish = new Path2D(); ell(dish, x, y + 1, 17, 7);
    c.fillStyle = 'rgba(50,30,12,.3)'; c.fillRect(x - 4, y + 2, 26, 6);
    c.fillStyle = '#9c7432'; c.fill(dish); c.strokeStyle = '#5a3e18'; c.lineWidth = 1.2; c.stroke(dish);
    const pd = new Path2D(); ell(pd, x - 1, y - 1, 12, 4.5); ell(pd, x + 8, y + 1, 4, 2); c.fillStyle = '#ece0bf'; c.fill(pd);
    const bd = new Path2D(); bd.rect(x - 6, y - H, 12, H);
    c.fillStyle = '#efe4c4'; c.fill(bd); c.fillStyle = '#cdbb92'; c.fillRect(x + 2, y - H, 4, H);
    const dr = new Path2D(); dr.rect(x - 6, y - H, 3, 9 + d.v * 6); dr.rect(x + 1, y - H, 2.5, 5); circ(dr, x - 4.5, y - H + 9 + d.v * 6, 1.6);
    c.fillStyle = '#f8f0dc'; c.fill(dr);
    c.strokeStyle = '#7a6440'; c.lineWidth = 1; c.stroke(bd);
    const tp = new Path2D(); ell(tp, x, y - H, 6, 2.2); c.fillStyle = '#f6eed6'; c.fill(tp);
    c.strokeStyle = '#2a1a10'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, y - H); c.lineTo(x + .5, y - H - 5); c.stroke();
  };
  const drawWell = (c, w) => {
    const x = w.x, y = w.y, sp = new Path2D(), P = [];
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, rr = 26 * (.7 + .5 * Math.abs(Math.sin(i * 2.3 + w.v * 11))); P.push(x + 26 + Math.cos(a) * rr * 1.3, y + 8 + Math.sin(a) * rr * .5); }
    poly(sp, P); circ(sp, x + 70, y + 12, 3); circ(sp, x + 62, y + 20, 2);
    c.fillStyle = 'rgba(28,20,30,.85)'; c.fill(sp);
    const sh = new Path2D(); ell(sh, x + 8, y + 4, 26, 9); c.fillStyle = 'rgba(40,24,10,.3)'; c.fill(sh);
    const bd = new Path2D(); bd.moveTo(x - 20, y); bd.lineTo(x - 20, y - 22); bd.quadraticCurveTo(x - 20, y - 30, x - 10, y - 30); bd.lineTo(x + 10, y - 30); bd.quadraticCurveTo(x + 20, y - 30, x + 20, y - 22); bd.lineTo(x + 20, y); bd.quadraticCurveTo(x, y + 7, x - 20, y); bd.closePath();
    c.fillStyle = '#1f1d2c'; c.fill(bd); c.strokeStyle = '#0c0a12'; c.lineWidth = 1.4; c.stroke(bd);
    c.fillStyle = '#2c2a40'; c.fillRect(x - 9, y - 38, 18, 9);
    const nk = new Path2D(); ell(nk, x, y - 38, 9, 3); c.fillStyle = '#0a0810'; c.fill(nk);
    c.strokeStyle = 'rgba(200,210,255,.45)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 14, y - 4); c.lineTo(x - 14, y - 22); c.stroke();
    // a quill standing in the well, leaning right
    const ax = Math.cos(-1.1), ay = Math.sin(-1.1), qx = x + 2, qy = y - 38, Lq = 96, px = -ay, py = ax, vn = new Path2D(), br = new Path2D();
    vn.moveTo(qx + ax * 22, qy + ay * 22);
    vn.quadraticCurveTo(qx + ax * 60 + px * 14, qy + ay * 60 + py * 14, qx + ax * Lq, qy + ay * Lq);
    vn.quadraticCurveTo(qx + ax * 62 - px * 9, qy + ay * 62 - py * 9, qx + ax * 22, qy + ay * 22);
    for (let k = 0; k < 9; k++) { const u = 28 + k * 7.5, bx = qx + ax * u, by = qy + ay * u, wd = Math.sin((u - 22) / (Lq - 22) * PI) * 12; br.moveTo(bx, by); br.lineTo(bx + px * wd + ax * 5, by + py * wd + ay * 5); br.moveTo(bx, by); br.lineTo(bx - px * wd * .7 + ax * 5, by - py * wd * .7 + ay * 5); }
    c.fillStyle = '#efe6d2'; c.fill(vn); c.strokeStyle = '#a8977a'; c.lineWidth = 1; c.stroke(br);
    c.strokeStyle = '#6a5a44'; c.lineWidth = 1.2; c.stroke(vn);
    c.strokeStyle = '#d8ccb0'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(qx + ax * 6, qy + ay * 6); c.lineTo(qx + ax * (Lq + 4), qy + ay * (Lq + 4)); c.stroke();
  };

  // ---- torn, scorched edges between the sheets, the dark desk showing through ----
  const borders = (c, Z, x0, y0, x1, y1) => {
    const J = 14, jag = (k, i, sd) => { const h1 = Z.hash(i * 31 + sd * 7 + 5, k), h2 = Z.hash(k * 3 - sd, i * 17 + 9); return 4 + h1 * 5 + (h2 < .07 ? 12 * (1 - h2 / .07) : 0) + 3 * Math.sin(k * .7 + i + sd); };
    const ln = new Path2D(), gap = new Path2D(), emb = new Path2D();
    let any = false;
    const run = (A, B) => {
      line(ln, A); line(ln, B);
      gap.moveTo(A[0], A[1]); for (let i = 2; i < A.length; i += 2) gap.lineTo(A[i], A[i + 1]);
      for (let i = B.length - 2; i >= 0; i -= 2) gap.lineTo(B[i], B[i + 1]); gap.closePath();
      for (let i = 0; i < A.length; i += 6) if (Z.hash(fl(A[i]) + 3, fl(A[i + 1]) - 7) < .3) emb.rect(A[i] - 1, A[i + 1] - 1, 2, 2);
      for (let i = 2; i < B.length; i += 6) if (Z.hash(fl(B[i]) - 5, fl(B[i + 1]) + 2) < .3) emb.rect(B[i] - 1, B[i + 1] - 1, 2, 2);
      any = true;
    };
    for (let i = Math.ceil((x0 - 60) / M); i <= fl((x1 + 60) / M); i++) {
      const X = i * M, A = [], B = [];
      for (let k = fl((y0 - 40) / J); k <= Math.ceil((y1 + 40) / J); k++) { A.push(X - jag(k, i, 0), k * J); B.push(X + jag(k, i, 1), k * J); }
      run(A, B);
    }
    for (let j = Math.ceil((y0 - 60) / M); j <= fl((y1 + 60) / M); j++) {
      const Y = j * M, A = [], B = [];
      for (let k = fl((x0 - 40) / J); k <= Math.ceil((x1 + 40) / J); k++) { A.push(k * J, Y - jag(k, j + 500, 2)); B.push(k * J, Y + jag(k, j + 500, 3)); }
      run(A, B);
    }
    if (!any) return;
    c.lineJoin = 'round';
    c.strokeStyle = 'rgba(82,44,14,.13)'; c.lineWidth = 54; c.stroke(ln);
    c.strokeStyle = 'rgba(72,36,12,.26)'; c.lineWidth = 24; c.stroke(ln);
    c.strokeStyle = 'rgba(44,22,8,.6)'; c.lineWidth = 8; c.stroke(ln);
    c.fillStyle = '#231912'; c.fill(gap);
    c.strokeStyle = 'rgba(18,9,4,.85)'; c.lineWidth = 2.2; c.stroke(ln);
    c.fillStyle = 'rgba(214,104,40,.5)'; c.fill(emb);
    c.lineJoin = 'miter';
  };

  const ground = (Z, x0, y0, x1, y1) => {
    const c = Z.ctx, S = sheetsIn(Z, x0, y0, x1, y1);
    c.fillStyle = '#231912'; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    parchment(c, Z, S, x0, y0, x1, y1);
    drawMap(c, Z, S, x0, y0, x1, y1);
    for (const sh of S) {
      for (const d of sh.cand) if (d.x > x0 - 30 && d.x < x1 + 30 && d.y > y0 - 10 && d.y < y1 + 50) drawCandle(c, d);
      const w = sh.well;
      if (w && w.x > x0 - 90 && w.x < x1 + 110 && w.y > y0 - 30 && w.y < y1 + 130) drawWell(c, w);
    }
    borders(c, Z, x0, y0, x1, y1);
  };

  /* ================= Under (animated, before foes): pulsing next nodes, marching red ink, paper dust ================= */
  const under = Z => {
    const c = Z.ctx, P = Z.P, now = Z.now, hw = Z.W / 2 + 60, hh = Z.H / 2 + 60;
    const x0 = P.x - hw, x1 = P.x + hw, y0 = P.y - hh, y1 = P.y + hh;
    const inV = (x, y, m) => x > x0 - m && x < x1 + m && y > y0 - m && y < y1 + m;
    const r1 = new Path2D(), r2 = new Path2D(), gl = new Path2D(), tr = new Path2D(), dust = new Path2D();
    const pu = .5 + .5 * Math.sin(now * 3.4), ex = md(now * .55, 1);
    let nc = 0;
    for (const sh of sheetsIn(Z, x0, y0, x1, y1)) {
      for (const n of sh.cur) if (inV(n.x, n.y, 50)) { ell(r1, n.x, n.y + 1, 21 + pu * 3.5, (21 + pu * 3.5) * .92); ell(r2, n.x, n.y + 1, 22 + ex * 22, (22 + ex * 22) * .92); nc++; }
      for (const n of sh.vis) if (inV(n.x, n.y, 30)) { const a = now * 1.2 + n.v * 20; gl.rect(n.x + Math.cos(a) * 24 - 1.3, n.y + 1 + Math.sin(a) * 22 - 1.3, 2.6, 2.6); }
      for (const [a, b] of sh.walk) {
        if (!inV((a.x + b.x) / 2, (a.y + b.y) / 2, 200)) continue;
        for (let j = 0; j < 3; j++) { const u = md(now * .3 + j / 3 + a.v, 1), w = Math.sin(u * PI); circ(tr, a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, .4 + 2.4 * w); }
      }
    }
    const G = 220;
    for (let gy = fl(y0 / G); gy <= fl(y1 / G); gy++) for (let gx = fl(x0 / G); gx <= fl(x1 / G); gx++) {
      const h = Z.hash(gx * 5 + 1, gy * 9 - 3);
      if (h > .55) continue;
      const x = gx * G + 110 + Math.sin(now * .21 + h * 30) * 90, y = gy * G + 110 + Math.cos(now * .16 + h * 17) * 70 - md(now * 6 + h * 99, 40);
      dust.rect(x, y, 1.8, 1.8);
    }
    if (nc) {
      c.strokeStyle = RED; c.lineWidth = 2.2; c.globalAlpha = .4 + .45 * pu; c.stroke(r1);
      c.globalAlpha = (1 - ex) * .55; c.lineWidth = 1.6; c.stroke(r2);
    }
    c.globalAlpha = .75; c.fillStyle = '#ffe2c8'; c.fill(gl);
    c.globalAlpha = .9; c.fillStyle = '#b8301f'; c.fill(tr);
    c.globalAlpha = .35; c.fillStyle = '#fff2d8'; c.fill(dust);
    c.globalAlpha = 1;
  };

  /* ================= Transient visuals: the campfire event ================= */
  const fx = [];
  const addFx = o => { if (fx.length > 8) fx.shift(); fx.push(o); };
  const flame = (fo, fm, fc, x, y, s, now, k) => {
    const f = Math.sin(now * 11 + k) * .5 + Math.sin(now * 17.3 + k * 2) * .3, hg = (20 + f * 4) * s, w = 8 * s;
    fo.moveTo(x - w, y); fo.quadraticCurveTo(x - w, y - hg * .5, x + f * 3 * s, y - hg); fo.quadraticCurveTo(x + w, y - hg * .5, x + w, y); fo.closePath();
    fm.moveTo(x - w * .62, y); fm.quadraticCurveTo(x - w * .6, y - hg * .42, x + f * 1.8 * s, y - hg * .7); fm.quadraticCurveTo(x + w * .6, y - hg * .42, x + w * .62, y); fm.closePath();
    fc.moveTo(x - w * .3, y); fc.quadraticCurveTo(x, y - hg * .45, x + w * .3, y); fc.closePath();
  };

  /* ================= Ambient (after darkness): candle flames, paper embers, the campfire ================= */
  const ambient = Z => {
    const c = Z.ctx, P = Z.P, now = Z.now, hw = Z.W / 2 + 120, hh = Z.H / 2 + 120;
    const inV = (x, y) => Math.abs(x - P.x) < hw && Math.abs(y - P.y) < hh;
    c.save();
    const fo = new Path2D(), fm = new Path2D(), fc = new Path2D(), emb = new Path2D(), spk = new Path2D(), logs = new Path2D();
    let n = 0;
    for (const sh of sheetsIn(Z, P.x - hw, P.y - hh, P.x + hw, P.y + hh)) for (const d of sh.cand) {
      if (!inV(d.fx, d.fy) || n > 14) continue;
      n++;
      const fk = Math.sin(now * 9 + d.v * 30) * .5 + Math.sin(now * 13.7 + d.v * 11) * .5;
      flame(fo, fm, fc, d.fx, d.fy + 2, .55, now, d.v * 40);
      Z.glow('255,176,90', 62 + fk * 5, d.fx, d.fy - 4, .36);
      Z.glow('255,226,150', 15, d.fx, d.fy - 6, .75);
      for (let k = 0; k < 2; k++) { const u = md(now * .45 + k / 2 + d.v * 3, 1); if (u < .85) emb.rect(d.fx + Math.sin(now * 2.2 + k * 3 + d.v * 9) * 8 * u - .9, d.fy - 14 - u * 70, 1.8, 1.8); }
    }
    // smouldering paper embers drifting up from the scorched sheet edges
    const G = 300;
    for (let gy = fl((P.y - hh) / G); gy <= fl((P.y + hh) / G); gy++) for (let gx = fl((P.x - hw) / G); gx <= fl((P.x + hw) / G); gx++) {
      const h = Z.hash(gx * 13 + 7, gy * 17 - 3);
      if (h > .34) continue;
      const u = md(now * .05 + h * 7, 1), x = gx * G + 150 + Math.sin(now * .5 + h * 40) * 60 + Math.sin(now * 1.9 + h * 9) * 10, y = gy * G + 280 - u * 320;
      const b = Math.sin(u * PI) * (.6 + .4 * Math.sin(now * 6 + h * 50));
      if (b <= .05) continue;
      Z.glow('255,130,50', 7, x, y, .6 * b); spk.rect(x - 1, y - 1, 2, 2);
    }
    // the campfire event
    for (let i = fx.length - 1; i >= 0; i--) { const o = fx[i]; if (Z.t > o.t0 + o.T || Z.t < o.t0 - 1) fx.splice(i, 1); }
    for (const o of fx) {
      const fade = cl01((o.t0 + o.T - Z.t) * .8) * cl01((Z.t - o.t0) * 2);
      if (fade <= 0) continue;
      poly(logs, [o.x - 18, o.y + 2, o.x - 15, o.y + 7, o.x + 17, o.y - 1, o.x + 14, o.y - 6]); poly(logs, [o.x + 18, o.y + 2, o.x + 15, o.y + 7, o.x - 17, o.y - 1, o.x - 14, o.y - 6]);
      flame(fo, fm, fc, o.x, o.y, 1.3 * fade, now, o.x);
      Z.glow('255,150,60', 70, o.x, o.y - 12, .55 * fade);
      for (let k = 0; k < 5; k++) { const u = md(now * .7 + k / 5, 1); emb.rect(o.x + Math.sin(now * 3 + k * 2) * 10 * u - 1, o.y - 20 - u * 80, 2, 2); }
    }
    c.fillStyle = '#4a2e18'; c.fill(logs); c.strokeStyle = '#1c1008'; c.lineWidth = 1.2; c.stroke(logs);
    c.fillStyle = '#e0501a'; c.fill(fo); c.fillStyle = '#ffa23a'; c.fill(fm); c.fillStyle = '#fff3b0'; c.fill(fc);
    c.fillStyle = '#ffd890'; c.fill(emb); c.fillStyle = '#ffb060'; c.fill(spk);
    c.restore();
  };

  /* ================= Intent icons (sword + damage, shield, buff arrow, debuff swirl) ================= */
  let IC = null;
  const icons = () => {
    if (IC) return IC;
    const mk = (a, b) => { const o = new Path2D(), pa = new Path2D(), pb = new Path2D(); for (const q of a) { poly(o, q); poly(pa, q); } for (const q of b) { poly(o, q); poly(pb, q); } return { o, a: pa, b: pb }; };
    const disc = [], rib = [], inn = [];
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; disc.push(Math.cos(a) * 8, Math.sin(a) * 8); }
    for (let i = 0; i <= 16; i++) { const u = i / 16, a = u * TAU * 1.35, r = 1 + u * 5.2, w = .35 + u * 1.1; rib.push(Math.cos(a) * (r + w), Math.sin(a) * (r + w)); inn.push(Math.cos(a) * (r - w), Math.sin(a) * (r - w)); }
    for (let i = inn.length - 2; i >= 0; i -= 2) rib.push(inn[i], inn[i + 1]);
    IC = [
      mk([[-1.9, 4.1, 7.1, -4.9, 8.6, -8.6, 4.9, -7.1, -4.1, 1.9]], [[-6.8, -.2, -5.4, -1.6, 1.6, 5.4, .2, 6.8], [-3.6, 2.2, -2.2, 3.6, -6.6, 8, -8, 6.6]]),
      mk([[0, -8.5, 7, -6.5, 6.6, 1.5, 0, 8.5, -6.6, 1.5, -7, -6.5]], [[0, -5.6, 4.2, -4.4, 3.8, 1, 0, 5.4]]),
      mk([[0, -9.5, 7.5, -2, 3, -2, 3, 7.5, -3, 7.5, -3, -2, -7.5, -2]], [[0, -6.4, 3.4, -2.8, 1, -2.8, 1, 5.4, -1, 5.4, -1, -2.8, -3.4, -2.8]]),
      mk([disc], [rib]),
    ];
    return IC;
  };
  const ICOL = [['#eef0f6', '#f2b030'], ['#3a8cff', '#c4e4ff'], ['#ff7428', '#ffe070'], ['#8e3ce0', '#f2d0ff']];
  const ATK = 0, DEF = 1, BUF = 2, DEB = 3;
  const intent = (c, Z, k, num, x, y, sc) => {
    const I = icons()[k], C = ICOL[k];
    c.save(); c.translate(x, y + Math.sin(Z.now * 5) * 1.2); if (sc !== 1) c.scale(sc, sc);
    c.lineJoin = 'round'; c.strokeStyle = '#1c1222'; c.lineWidth = 2.6; c.stroke(I.o);
    c.fillStyle = C[0]; c.fill(I.a); c.fillStyle = C[1]; c.fill(I.b);
    if (num) { c.font = 'bold 9px sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.strokeText(num, 7.5, 6); c.fillStyle = '#ffffff'; c.fillText(num, 7.5, 6); }
    c.restore();
  };
  const bubble = (c, txt, x, y) => {
    const w = txt.length * 5.6 + 10, x0 = x - w / 2, p = new Path2D();
    poly(p, [x0 + 2, y, x0 + w - 2, y, x0 + w, y + 2, x0 + w, y + 11, x0 + w - 2, y + 13, x + 4, y + 13, x - 1, y + 18, x - 1, y + 13, x0 + 2, y + 13, x0, y + 11, x0, y + 2]);
    c.fillStyle = '#fffaf0'; c.fill(p); c.strokeStyle = '#3a2a1a'; c.lineWidth = 1.2; c.stroke(p);
    c.fillStyle = '#2a1a10'; c.font = 'bold 9px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, x, y + 7);
  };
  const mkElite = q => {
    if (!q) return;
    q.elite = true; q.max *= 5; q.hp = q.max; q.r *= 1.3; q.xp = (q.xp || 1) * 6; q.dmg = Math.round(q.dmg * 1.3); q.lh = q.hp;
    if (q.str !== undefined) q.str = 2;
  };

  /* ================= Foes ================= */
  // Cultist: a blue-robed zealot in a bird-skull mask and crow feathers, staff raised. Caws through a ritual that makes
  // it permanently stronger (a buff badge counts the stacks), then hurls telegraphed dark bolts.
  const CAW = ['Caw!', 'Caw caw!', 'CAAAW!'];
  const cultist = {
    hp: 34, sp: 50, dmg: 7, xp: 3, r: 12, eye: false,
    init(e, Z) { e.mode = 'walk'; e.t1 = Z.rnd(1, 2.2); e.str = 0; e.act = 0; e.aa = 0; e.say = ''; e.sayT = 0; e.side = Math.random() < .5 ? 1 : -1; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e), a = Z.angTo(e);
      if (e.sayT > 0) e.sayT -= dt;
      if (e.mode === 'ritual') {
        Z.move(e, 0, 0); e.ang = a;
        if ((e.mt -= dt) <= 0) { e.str = Math.min(5, e.str + 1); e.dmg += 1; e.act++; Z.burst(e.x, e.y - 18, '#ff8a3a', 6, 60); e.mode = 'walk'; e.t1 = Z.rnd(1.4, 2.2); }
        return;
      }
      if (e.mode === 'tell') {
        Z.move(e, 0, 0);
        if (e.mt > .4) { let da = a - e.aa; da = Math.atan2(Math.sin(da), Math.cos(da)); e.aa += da * Math.min(1, dt * 4); }
        e.ang = e.aa;
        if ((e.mt -= dt) <= 0) {
          const n = e.str >= 3 ? 3 : 1, sp = 175 + e.str * 12, dm = 7 + Math.round(e.str * 1.5);
          for (let i = 0; i < n; i++) Z.shoot(e.x + Math.cos(e.aa) * 16, e.y - 18 + Math.sin(e.aa) * 16, e.aa + (i - (n - 1) / 2) * .2, sp, { r: 7, dmg: dm, life: 3.6, col: '176,84,255' });
          Z.sfx('shoot'); e.act++; e.mode = 'walk'; e.t1 = Z.rnd(2.2, 3.2);
        }
        return;
      }
      let mv = a, k = 1;
      if (d < 200) mv = a + PI; else if (d < 320) { mv = a + e.side * PI / 2; k = .5; }
      Z.move(e, Math.cos(mv) * e.sp * k, Math.sin(mv) * e.sp * k); e.ang = a;
      if ((e.t1 -= dt) <= 0 && d < 520) {
        if (e.act % 3 === 0 && e.str < 5) { e.mode = 'ritual'; e.mt = 1; if (Math.random() < .6) { e.say = CAW[fl(Math.random() * 3) % 3]; e.sayT = 1.5; } }
        else { e.mode = 'tell'; e.mt = .85; e.aa = a; Z.sfx('charge'); }
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 12, m = e.mode, OL = W(white, e.elite ? GOLD : '#161a3c'), ROBE = W(white, '#3448a8');
      const k = m === 'tell' ? cl01(1 - e.mt / .85) : m === 'ritual' ? cl01(1 - e.mt) : 0, bob = Math.sin(e.ph * 5 + e.seed) * .8;
      c.save(); c.translate(e.x, e.y); c.scale(s, s);
      c.lineCap = 'round'; c.lineJoin = 'round';
      if (!white) {
        if (m === 'tell') {
          const L = 30 + 80 * k, tg = new Path2D(); tg.moveTo(Math.cos(e.aa) * 16, -18 + Math.sin(e.aa) * 16); tg.lineTo(Math.cos(e.aa) * L, -18 + Math.sin(e.aa) * L);
          c.globalAlpha = .35 + .5 * k; c.strokeStyle = k > .8 ? '#ffffff' : '#b46cff'; c.lineWidth = 2; c.stroke(tg); c.globalAlpha = 1;
          intent(c, Z, ATK, String(7 + Math.round(e.str * 1.5)) + (e.str >= 3 ? '×3' : ''), -3, -38, 1);
        } else if (m === 'ritual') intent(c, Z, BUF, '', 0, -38, 1);
        if (e.str > 0) {
          const bd = new Path2D(); poly(bd, [-14, 4, -10.5, 0, -7, 4, -9, 4, -9, 8, -12, 8, -12, 4]);
          c.fillStyle = '#ff7428'; c.fill(bd); c.strokeStyle = '#2a0c04'; c.lineWidth = 1; c.stroke(bd);
          c.fillStyle = '#ffe9b0'; c.font = 'bold 8px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(e.str), -10.5, 12);
        }
        if (e.sayT > 0 && e.say) bubble(c, e.say, 6, -48);
      }
      const f = Math.cos(e.ang) < 0 ? -1 : 1; c.scale(f, 1); c.translate(0, bob);
      // crow feathers fanned behind the head
      const fe = new Path2D();
      for (let i = 0; i < 5; i++) {
        const a = -2.75 + i * .3 + Math.sin(e.ph * 3 + i) * .04, L = 11 + (i % 2) * 4, bx = 0, by = -16, px = -Math.sin(a) * 2.1, py = Math.cos(a) * 2.1;
        poly(fe, [bx + px, by + py, bx + Math.cos(a) * L * .6 + px * 1.3, by + Math.sin(a) * L * .6 + py * 1.3, bx + Math.cos(a) * L, by + Math.sin(a) * L, bx + Math.cos(a) * L * .6 - px * 1.3, by + Math.sin(a) * L * .6 - py * 1.3, bx - px, by - py]);
      }
      c.strokeStyle = OL; c.lineWidth = 1.4; c.stroke(fe); c.fillStyle = W(white, '#2e2250'); c.fill(fe);
      const rb = new Path2D(); poly(rb, [-5, -12, 5, -12, 8, 3, 10, 11, 5.5, 9.6, 1.5, 11.6, -2.5, 9.6, -6.5, 11.4, -9, 10, -7.5, 3]);
      c.strokeStyle = OL; c.lineWidth = 1.8; c.stroke(rb); c.fillStyle = ROBE; c.fill(rb);
      if (!white) {
        const tr = new Path2D(); tr.moveTo(1, -11); tr.lineTo(2.2, 10); line(tr, [-8.4, 9, -6.5, 10, -2.5, 8.6, 1.5, 10.6, 5.5, 8.6, 9.4, 9.8]);
        c.strokeStyle = '#e8b84a'; c.lineWidth = 1.3; c.stroke(tr);
        c.fillStyle = '#c4302a'; c.fillRect(-6.6, -2.4, 13.4, 2.6);
      }
      // arms and staff by pose
      const ar = new Path2D(), sf = new Path2D();
      let tx, ty;
      if (m === 'ritual') { const w = Math.sin(e.ph * 14) * 1.5; ar.moveTo(-3, -9); ar.lineTo(-9, -20 + w); ar.moveTo(4, -9); ar.lineTo(9, -21 - w); sf.moveTo(10, 4); sf.lineTo(8.5, -31); tx = 8.5; ty = -32; }
      else if (m === 'tell') { ar.moveTo(3, -9); ar.lineTo(9 + 3 * k, -13 - 2 * k); sf.moveTo(5, 3); tx = 13 + 6 * k; ty = -27 + 4 * k; sf.lineTo(tx, ty); }
      else { const w = Math.sin(e.ph * 4 + e.seed) * .06; ar.moveTo(3, -9); ar.lineTo(8, -5); sf.moveTo(9, 10); tx = 9 + Math.sin(w) * 34; ty = -24; sf.lineTo(tx, ty); }
      c.strokeStyle = OL; c.lineWidth = 3.4; c.stroke(sf); c.strokeStyle = W(white, '#7a5430'); c.lineWidth = 1.8; c.stroke(sf);
      c.strokeStyle = OL; c.lineWidth = 4; c.stroke(ar); c.strokeStyle = ROBE; c.lineWidth = 2.4; c.stroke(ar);
      const ob = new Path2D(); circ(ob, tx, ty, 3 + k * 2);
      c.fillStyle = W(white, '#a854ff'); c.fill(ob);
      if (!white && (m === 'tell' || m === 'ritual')) Z.glow(m === 'tell' ? '176,84,255' : '255,140,60', 10 + 14 * k, tx, ty, .85);
      // hood and bird-skull mask
      const hd = new Path2D(); ell(hd, 0, -16, 6.4, 6.8);
      c.strokeStyle = OL; c.lineWidth = 1.5; c.stroke(hd); c.fillStyle = W(white, '#24317a'); c.fill(hd);
      const mk = new Path2D(); ell(mk, 3, -16, 5, 5.4); poly(mk, [6, -18.5, 13, -17, 17, -13.5, 16.5, -11, 13.5, -12.6, 6, -13]);
      c.stroke(mk); c.fillStyle = W(white, '#f2ead6'); c.fill(mk);
      if (!white) {
        const so = new Path2D(); ell(so, 4.6, -17, 2, 2.3); c.fillStyle = '#1a1020'; c.fill(so);
        c.fillStyle = m === 'ritual' ? '#ffd040' : '#ff4a3a'; c.fillRect(4.3, -17.8, 1.4, 1.4);
      }
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#3448a8', 9, 90); Z.burst(e.x, e.y - 16, '#2e2250', 6, 70); },
  };

  // Louse: a fat little curled bug, red or green, that scuttles in packs. It rolls up into an armoured ball when hit
  // (shield intent, takes much less damage), winds up a bite, and the green kind spits slowing web globs.
  const louse = {
    hp: 15, sp: 82, dmg: 6, xp: 1, r: 9, eye: false,
    init(e, Z) { e.green = Math.random() < .35; e.mode = 'walk'; e.mt = Z.rnd(.6, 1.4); e.t1 = Z.rnd(2, 4); e.cc = 0; e.lh = e.hp; e.la = 0; e.pack = Math.random() < .5; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e), a = Z.angTo(e);
      if (e.pack) {
        e.pack = false;
        for (const o of [-1, 1]) { const q = Z.spawn('louse', e.x + o * 16, e.y - o * 10); if (q) { q.pack = false; q.green = e.green; } }
      }
      if (e.cc > 0) e.cc -= dt;
      if (e.hp < e.lh) {
        const dm = e.lh - e.hp;
        if (e.mode === 'curl') e.hp += dm * .6;
        else if (e.cc <= 0) { e.mode = 'curl'; e.mt = 1.1; e.cc = 3.4; e.hp += dm * .5; }
      }
      e.lh = e.hp;
      switch (e.mode) {
        case 'curl': Z.move(e, 0, 0); if ((e.mt -= dt) <= 0) { e.mode = 'walk'; e.mt = Z.rnd(.3, .8); } return;
        case 'tell': Z.move(e, 0, 0); e.ang = e.la; if ((e.mt -= dt) <= 0) { e.mode = 'bite'; e.mt = .2; } return;
        case 'bite': Z.move(e, Math.cos(e.la) * e.sp * 4.2, Math.sin(e.la) * e.sp * 4.2); e.ang = e.la; if ((e.mt -= dt) <= 0) { e.mode = 'rec'; e.mt = .35; } return;
        case 'rec': Z.move(e, 0, 0); if ((e.mt -= dt) <= 0) { e.mode = 'walk'; e.mt = Z.rnd(1, 1.8); } return;
        case 'spit':
          Z.move(e, 0, 0); e.ang = a;
          if ((e.mt -= dt) <= 0) { Z.shoot(e.x + Math.cos(a) * 12, e.y + Math.sin(a) * 12, a, 210, { r: 7, dmg: 4, life: 3, col: '150,255,80', slow: true }); Z.sfx('shoot'); e.mode = 'walk'; e.mt = Z.rnd(.8, 1.4); e.t1 = Z.rnd(3.5, 5); }
          return;
        default: {
          const w = a + Math.sin(e.ph * 7 + e.seed) * .4, k = .85 + .25 * Math.sin(e.ph * 11 + e.seed);
          Z.move(e, Math.cos(w) * e.sp * k, Math.sin(w) * e.sp * k); e.ang = a;
          e.mt -= dt; e.t1 -= dt;
          if (e.mt <= 0 && d < 80 && d > 20) { e.mode = 'tell'; e.mt = .45; e.la = a; }
          else if (e.green && e.t1 <= 0 && d < 300 && d > 90) { e.mode = 'spit'; e.mt = .6; }
        }
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 9, m = e.mode, red = !e.green;
      const BODY = W(white, red ? '#e0462e' : '#58c636'), PL = W(white, red ? '#9e2418' : '#2a8420'), OL = W(white, e.elite ? GOLD : red ? '#3c0e08' : '#0e3208');
      c.save(); c.translate(e.x, e.y); c.scale(s, s);
      c.lineCap = 'round'; c.lineJoin = 'round';
      if (!white) {
        if (m === 'tell') intent(c, Z, ATK, String(Math.round(e.dmg)), -2, -20, 1);
        else if (m === 'spit') intent(c, Z, DEB, '', 0, -20, 1);
        else if (m === 'curl') intent(c, Z, DEF, '', 0, -20, 1);
      }
      if (m === 'curl') {
        const wob = Math.sin(e.ph * 30) * (e.mt > .9 ? 1 : 0), b = new Path2D(); circ(b, wob, -1, 9);
        c.strokeStyle = OL; c.lineWidth = 2; c.stroke(b); c.fillStyle = BODY; c.fill(b);
        if (!white) {
          const pl = new Path2D();
          for (const u of [-4.6, 0, 4.6]) { const hw = Math.sqrt(81 - u * u) * .94; pl.moveTo(u + wob, -1 - hw); pl.quadraticCurveTo(u + 3.4 + wob, -1, u + wob, -1 + hw); }
          c.strokeStyle = PL; c.lineWidth = 1.8; c.stroke(pl);
          const hi = new Path2D(); ell(hi, -3 + wob, -5.5, 3.2, 1.7); c.fillStyle = red ? '#ffa080' : '#c4ff90'; c.fill(hi);
        }
        c.restore();
        return;
      }
      const f = Math.cos(e.ang) < 0 ? -1 : 1; c.scale(f, 1);
      const lean = m === 'bite' ? .25 : m === 'tell' ? -.2 : 0; c.rotate(lean);
      const lg = new Path2D();
      for (let i = 0; i < 3; i++) { const lx = -5 + i * 4.5, sw = Math.sin(e.ph * 16 + i * 2.1) * 1.6; lg.moveTo(lx, 3.5); lg.lineTo(lx + sw - 1, 8); }
      c.strokeStyle = OL; c.lineWidth = 1.5; c.stroke(lg);
      const bd = new Path2D(); ell(bd, -1, 0, 9.5, 6.6); ell(bd, 8, 1, 3.8, 3.5);
      c.lineWidth = 1.8; c.stroke(bd); c.fillStyle = BODY; c.fill(bd);
      if (!white) {
        const pl = new Path2D(); for (let k = 0; k < 3; k++) { const x = -6.5 + k * 4; pl.moveTo(x, -6); pl.quadraticCurveTo(x + 2.2, 0, x, 6); }
        c.strokeStyle = PL; c.lineWidth = 1.6; c.stroke(pl);
        const hi = new Path2D(); ell(hi, -2.5, -3.6, 5, 1.5); c.fillStyle = red ? '#ff9e7e' : '#bfff8e'; c.fill(hi);
        const hd = new Path2D(); ell(hd, 8.2, 1, 3, 2.8); c.fillStyle = PL; c.fill(hd);
        const op = m === 'tell' ? 2.5 : m === 'spit' ? 1.6 : .6, mn = new Path2D();
        poly(mn, [10.5, 1.8, 14.5, 1 - op, 12, 2.6]); poly(mn, [10.5, 2.8, 14.5, 4.6 + op, 12, 3.6]);
        mn.moveTo(9, -1.6); mn.quadraticCurveTo(11.5, -7, 15, -6.5); mn.moveTo(7.4, -2.2); mn.quadraticCurveTo(8.6, -8, 11.4, -8.8);
        c.strokeStyle = OL; c.lineWidth = 1.1; c.stroke(mn); c.fillStyle = '#f4e6c8'; c.fill(mn);
        c.fillStyle = m === 'tell' ? '#ffffff' : '#fff27a'; c.fillRect(8.6, -.6, 1.7, 1.7);
        if (m === 'spit') Z.glow('150,255,80', 8 + 10 * cl01(1 - e.mt / .6), 13, 2, .8);
      }
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, e.green ? '#58c636' : '#e0462e', 7, 90); },
  };

  // Acid slime: a big wobbling acid-green blob with a dopey face and a dripping lip. Lobs acid puddles (telegraphed
  // circles) and splits into two medium slimes on death, which split again into small ones.
  const SLIME_R = [8.5, 13, 19].map(v => v * 1.15);
  const slime = {
    hp: 80, sp: 46, dmg: 12, xp: 5, r: 19, eye: false,
    init(e, Z) { e.sz = 2; e.mode = 'walk'; e.mt = Z.rnd(2.5, 4); },
    update(e, Z) {
      const dt = Z.dt, a = Z.angTo(e), d = Z.dist(e);
      if (e.mode === 'tell') {
        Z.move(e, 0, 0); e.ang = a;
        if ((e.mt -= dt) <= 0) {
          Z.hazard(Z.P.x, Z.P.y, { r: e.sz === 2 ? 50 : 38, t: .95, dmg: e.sz === 2 ? 9 : 7, col: '150,230,40' });
          Z.burst(e.x + Math.cos(a) * e.r, e.y + Math.sin(a) * e.r, '#9cff3a', 6, 120); Z.sfx('shoot');
          e.mode = 'walk'; e.mt = Z.rnd(3.6, 5.2);
        }
        return;
      }
      const rate = e.sz === 2 ? 3.2 : e.sz === 1 ? 4.2 : 5.4, hop = Math.sin(e.ph * rate + e.seed), k = hop > 0 ? hop * 1.9 : .12;
      Z.move(e, Math.cos(a) * e.sp * k, Math.sin(a) * e.sp * k); e.ang = a;
      if ((e.mt -= dt) <= 0 && e.sz > 0 && d < 380) { e.mode = 'tell'; e.mt = .7; }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 19, rate = e.sz === 2 ? 3.2 : e.sz === 1 ? 4.2 : 5.4, hop = Math.sin(e.ph * rate + e.seed), tl = e.mode === 'tell';
      const lift = hop > 0 && !tl ? hop * 5 : 0, sq = tl ? 1 : hop > 0 ? 1 - hop * .12 : 1 + Math.min(.16, -hop * .2), puff = tl ? .1 * cl01(1 - e.mt / .7) : 0;
      const OL = W(white, e.elite ? GOLD : '#164010');
      c.save(); c.translate(e.x, e.y); c.scale(s, s);
      if (!white) {
        const pd = new Path2D(); ell(pd, 0, 15, 17 * (1.1 - lift * .04), 4); c.globalAlpha = .45; c.fillStyle = '#4aa424'; c.fill(pd); c.globalAlpha = 1;
        if (tl) intent(c, Z, DEB, String(e.sz === 2 ? 9 : 7), -3, -36, 1);
      }
      c.translate(0, -lift + 5); c.scale(sq * (1 + puff), (2 - sq) * (1 + puff)); c.translate(0, -5);
      const b = new Path2D(), w = e.ph * 4 + e.seed;
      for (let i = 0; i < 18; i++) {
        const t = i / 18 * TAU, rr = 19 * (1 + .05 * Math.sin(3 * t + w) + .03 * Math.sin(5 * t - w * .7));
        const px = Math.cos(t) * rr * 1.06, py = Math.sin(t) > 0 ? Math.min(Math.sin(t) * rr * .75, 12) : Math.sin(t) * rr;
        if (i) b.lineTo(px, py); else b.moveTo(px, py);
      }
      b.closePath();
      c.lineJoin = 'round'; c.strokeStyle = OL; c.lineWidth = 2.4; c.stroke(b); c.fillStyle = W(white, '#66d43a'); c.fill(b);
      if (!white) {
        const bl = new Path2D(); ell(bl, 0, 7, 16, 5); c.fillStyle = 'rgba(30,120,24,.5)'; c.fill(bl);
        const bu = new Path2D(), u = md(e.ph * .7 + e.seed, 1); circ(bu, 9 - u * 3, 6 - u * 14, 1.8); circ(bu, -10, 3 - md(e.ph * .5 + e.seed * 2, 1) * 10, 1.3);
        c.strokeStyle = 'rgba(226,255,170,.75)'; c.lineWidth = 1; c.stroke(bu);
        const hi = new Path2D(); ell(hi, -8, -10, 5.5, 2.6); circ(hi, -1.5, -13, 1.3); c.fillStyle = '#e8ffb6'; c.fill(hi);
        const ey = new Path2D(); ell(ey, -5.5, -2, 2.4, 3.2); ell(ey, 5.5, -2, 2.4, 3.2); c.fillStyle = '#10300a'; c.fill(ey);
        c.fillStyle = '#ffffff'; c.fillRect(-6.2, -4, 1.3, 1.3); c.fillRect(4.8, -4, 1.3, 1.3);
        const mo = new Path2D();
        if (tl) ell(mo, 0, 5, 4.2, 2.6 + puff * 18); else { mo.moveTo(-4, 4); mo.quadraticCurveTo(0, 7.5, 4, 4); mo.quadraticCurveTo(0, 5.6, -4, 4); }
        c.fillStyle = '#1c4a10'; c.fill(mo);
        // acid dripping from the lip
        const dk = md(e.ph * .8 + e.seed, 1), dp = new Path2D(); poly(dp, [9, 9, 12.5, 9, 10.8, 13]); ell(dp, 10.8, 13 + dk * 10, 1.5, 2.2 * (1 - dk * .4));
        c.fillStyle = '#c4ff3a'; c.fill(dp);
      }
      c.restore();
    },
    death(e, Z) {
      Z.burst(e.x, e.y, '#66d43a', e.sz === 2 ? 16 : 9, 130);
      if (!(e.sz > 0)) return;
      let n = 0; for (const o of Z.foes()) if (o.kind === 'slime') n++;
      if (n > 34) return;
      const nz = e.sz - 1;
      for (const o of [-1, 1]) {
        const q = Z.spawn('slime', e.x + o * 14, e.y + o * 5);
        if (q) { q.sz = nz; q.r = SLIME_R[nz]; q.max = q.hp = Math.max(4, e.max * (nz === 1 ? .38 : .34)); q.xp = nz === 1 ? 2 : 1; q.sp = e.sp * 1.2; q.dmg = Math.max(4, Math.round(e.dmg * .7)); q.kx = o * 170; q.ky = (Math.random() - .5) * 120; q.mt = Z.rnd(1.5, 3); }
      }
    },
  };

  // Sentry: a floating slate obelisk with one great lens. Hangs back, then locks a line and fires a telegraphed beam;
  // they come in groups of three that fire together.
  const BEAM_L = 400;
  const sentry = {
    hp: 60, sp: 34, dmg: 9, xp: 4, r: 15, heavy: true, eye: false,
    init(e, Z) { e.mode = 'walk'; e.t1 = Z.rnd(2.5, 4.5); e.aa = 0; e.side = Math.random() < .5 ? 1 : -1; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e), a = Z.angTo(e);
      if (e.mode === 'aim') {
        Z.move(e, 0, 0); e.ang = e.aa;
        if ((e.mt -= dt) <= 0) { e.mode = 'fire'; e.mt = .3; Z.sfx('chain'); }
        return;
      }
      if (e.mode === 'fire') { Z.move(e, 0, 0); if ((e.mt -= dt) <= 0) { e.mode = 'walk'; e.t1 = Z.rnd(4.2, 5.4); } return; }
      let mv = a, k = 1;
      if (d < 240) mv = a + PI; else if (d < 380) { mv = a + e.side * PI / 2; k = .45; }
      Z.move(e, Math.cos(mv) * e.sp * k, Math.sin(mv) * e.sp * k); e.ang = a;
      if ((e.t1 -= dt) <= 0 && d < 560) {
        e.mode = 'aim'; e.mt = 1.15; e.aa = a; Z.sfx('charge');
        for (let i = 0; i < 10; i++) { const dd = 34 + i * 40; Z.hazard(e.x + Math.cos(a) * dd, e.y + Math.sin(a) * dd, { r: 22, t: 1.15, dmg: 11, col: '90,230,255' }); }
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 15, m = e.mode, now = Z.now, bob = Math.sin(e.ph * 2.2 + e.seed) * 2.5 - 3, k = m === 'aim' ? cl01(1 - e.mt / 1.15) : m === 'fire' ? 1 : 0;
      const OL = W(white, e.elite ? GOLD : '#1c2036');
      c.save(); c.translate(e.x, e.y); c.scale(s, s);
      if (!white && (m === 'aim' || m === 'fire')) {
        const L = (BEAM_L + 20) / (ZS * s);
        c.save(); c.translate(0, bob - 6); c.rotate(e.aa);
        if (m === 'aim') { c.globalAlpha = .25 + .5 * k; c.fillStyle = '#4ae8ff'; c.fillRect(8, -1 - k * 1.5, L * (.3 + .7 * cl01(k * 1.6)), 2 + k * 3); }
        else { const fa = cl01(e.mt / .3); c.globalAlpha = .8 * fa; c.fillStyle = '#4af0ff'; c.fillRect(6, -8, L, 16); c.globalAlpha = fa; c.fillStyle = '#ffffff'; c.fillRect(6, -3, L, 6); }
        c.restore(); c.globalAlpha = 1;
      }
      if (!white && m === 'aim') intent(c, Z, ATK, '11', -3, -44 + bob, 1);
      c.translate(0, bob);
      const sa = now * 1.6 + e.seed, sd = new Path2D();
      for (const o of [0, PI]) { const x = Math.cos(sa + o) * 17, y = -4 + Math.sin(sa + o) * 5; poly(sd, [x, y - 4, x + 3.2, y, x, y + 4, x - 3.2, y]); }
      c.lineJoin = 'round';
      c.strokeStyle = OL; c.lineWidth = 1.3; c.stroke(sd); c.fillStyle = W(white, '#7882a8'); c.fill(sd);
      const bd = new Path2D(); poly(bd, [0, -31, 11, -17, 11, 9, 0, 21, -11, 9, -11, -17]);
      c.lineWidth = 2; c.stroke(bd); c.fillStyle = W(white, '#97a0c2'); c.fill(bd);
      if (!white) {
        const sh = new Path2D(); poly(sh, [0, -31, 11, -17, 11, 9, 0, 21]); c.fillStyle = '#69729a'; c.fill(sh);
        const hl = new Path2D(); poly(hl, [0, -31, -11, -17, -6, -16, 0, -25]); c.fillStyle = '#c6cde6'; c.fill(hl);
        const gr = new Path2D(); line(gr, [-11, -17, 0, -12, 11, -17]); line(gr, [-11, 3, 0, 8, 11, 3]);
        c.strokeStyle = '#3e4462'; c.lineWidth = 1.2; c.stroke(gr);
        const rn = new Path2D(); line(rn, [-3.5, 11, 0, 15, 3.5, 11]); rn.moveTo(0, 15); rn.lineTo(0, 18.5); line(rn, [-3, -22, 0, -26, 3, -22]);
        c.globalAlpha = .55 + .45 * k; c.strokeStyle = '#5aeaff'; c.lineWidth = 1.4; c.stroke(rn); c.globalAlpha = 1;
        const ln = new Path2D(); ell(ln, 0, -6, 6.6, 4.8); c.fillStyle = '#f0ffff'; c.fill(ln); c.strokeStyle = OL; c.lineWidth = 1.2; c.stroke(ln);
        const ix = Math.cos(e.ang) * 1.8, iy = -6 + Math.sin(e.ang) * 1.2, ir = new Path2D(); circ(ir, ix, iy, 3);
        c.fillStyle = k > 0 ? '#9af6ff' : '#22c4f0'; c.fill(ir);
        c.fillStyle = '#0c1a2a'; c.fillRect(ix - .9, iy - 1.6, 1.8, 3.2);
        Z.glow('80,220,255', 10 + 18 * k, 0, -6, .55 + .4 * k);
      }
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#97a0c2', 10, 100); Z.burst(e.x, e.y - 6, '#5aeaff', 6, 80); },
  };

  /* ================= Miniboss: Ossivar, the Hexbound Sentinel =================
     A towering stone automaton with a hex core. Offensive mode cycles a 4-hit flurry, a lane charge ending in a
     shockwave, a gavel slam (rings of blasts plus a bullet ring) and a summon. Enough damage locks it into Defensive
     Mode (shield dome, bone spikes that hurt on touch, half damage taken, spike volleys), which ends in a Twin Slam.
     Below 40% the core overloads: faster, longer flurries, a trail of blasts on charges, and an extra slam ring. */
  const BP = ['flurry', 'charge', 'slam', 'flurry', 'summon', 'charge', 'slam'];
  const BOSS_COL = '255,130,50';
  const bStart = (e, Z, m) => {
    e.mode = m;
    switch (m) {
      case 'walk': e.mt = (e.rage ? 1.0 : 1.6) + Math.random() * .5; break;
      case 'flurry': e.mt = .65; e.fk = e.rage ? 6 : 4; e.t3 = 0; e.aa = Z.angTo(e); Z.sfx('charge'); break;
      case 'charge': e.mt = 1.9; e.aa = Z.angTo(e); e.dv = false; e.t3 = 0; Z.sfx('warn'); break;
      case 'slam': {
        e.mt = 1.7; e.done = false; Z.sfx('charge');
        Z.hazard(e.x, e.y, { r: 84, t: 1.2, dmg: 16, col: BOSS_COL });
        const rings = [[115, 8, 1.3], [195, 13, 1.55], [275, 18, 1.8]];
        if (e.rage) rings.push([355, 22, 2.05]);
        let g = Math.random() * TAU;
        for (const [R, n, t] of rings) {
          g += 1.9;
          const half = 62 / R;
          for (let i = 0; i < n; i++) {
            const a = i / n * TAU, da = Math.abs(Math.atan2(Math.sin(a - g), Math.cos(a - g)));
            if (da < half) continue;
            Z.hazard(e.x + Math.cos(a) * R, e.y + Math.sin(a) * R, { r: 40, t, dmg: 13, col: BOSS_COL });
          }
        }
        break;
      }
      case 'summon': {
        e.mt = 1.4; Z.sfx('boss'); Z.shake(5); Z.banner('Ossivar summons the Spire\'s denizens!', '#ffb46a', false);
        const ks = ['cultist', 'cultist', 'louse', 'louse', 'louse'];
        if (e.rage) ks.push('slime', 'louse');
        for (let i = 0; i < ks.length; i++) {
          const a = e.ph + i * TAU / ks.length, x = e.x + Math.cos(a) * (e.r + 70), y = e.y + Math.sin(a) * (e.r + 70), q = Z.spawn(ks[i], x, y);
          if (q) { if (ks[i] === 'louse') q.pack = false; Z.burst(x, y, '#ffb46a', 8, 90); }
        }
        break;
      }
      case 'shiftD': e.mt = .8; Z.banner('Ossivar locks into Defensive Mode!', '#7ac8ff', false); Z.sfx('warn'); break;
      case 'def':
        e.mt = e.rage ? 4.5 : 5.5; e.t3 = 1; e.dmg = e.base * 1.6;
        Z.ring(e.x, e.y - 26, 12, 150, { r: 6, dmg: 8, col: '240,232,205' }, Math.random()); Z.sfx('shoot');
        break;
      case 'twin':
        e.mt = 1.6; e.dmg = e.base; e.fk = 1; Z.sfx('charge');
        Z.hazard(Z.P.x, Z.P.y, { r: 88, t: 1, dmg: 16, col: BOSS_COL });
        break;
      default: e.mode = 'walk'; e.mt = 1;
    }
  };
  const boss = {
    name: 'Ossivar, the Hexbound Sentinel', hp: 4000, sp: 50, dmg: 24, xp: 0, r: 50, heavy: true, eye: false,
    init(e) { e.mode = 'walk'; e.mt = 2; e.pi = 0; e.next = BP[0]; e.rage = false; e.lh = e.hp; e.acc = 0; e.fk = 0; e.aa = 0; e.dv = false; e.done = false; e.pk = 0; e.arm = 0; e.base = e.dmg; e.sd = 1; },
    update(e, Z) {
      const dt = Z.dt, m = e.mode;
      if (e.hp < e.lh) { const d = e.lh - e.hp; if (m === 'def' || m === 'shiftD') e.hp += d * .5; else e.acc += d; }
      e.lh = e.hp;
      if (e.pk > 0) e.pk = Math.max(0, e.pk - dt * 3.2);
      if (!e.rage && e.hp < e.max * .4) {
        e.rage = true; Z.banner('The Sentinel\'s core overloads!', '#ff7a3a', true); Z.sfx('boss'); Z.shake(10);
        Z.ring(e.x, e.y - 30, 20, 150, { r: 7, dmg: 9, col: '255,150,60' }, e.ph);
      }
      if (e.rage && Math.random() < dt * 4) Z.burst(e.x + (Math.random() - .5) * 70, e.y - 60, '#ffb060', 2, 60);
      e.mt -= dt;
      switch (m) {
        case 'walk': {
          const d = Z.dist(e), sp = e.sp * (e.rage ? 1.3 : 1);
          if (d > 210) Z.chase(e, sp);
          else { const a = Z.angTo(e) + PI / 2 * e.sd; Z.move(e, Math.cos(a) * sp * .6, Math.sin(a) * sp * .6); e.ang = Z.angTo(e); }
          if (e.acc >= e.max * (e.rage ? .11 : .15)) { e.acc = 0; e.sd = -e.sd; bStart(e, Z, 'shiftD'); break; }
          if (e.mt <= 0) { const n = BP[e.pi++ % BP.length]; e.next = BP[e.pi % BP.length]; e.sd = -e.sd; bStart(e, Z, n); }
          break;
        }
        case 'flurry':
          if (e.mt > 0) { Z.move(e, 0, 0); e.aa = Z.angTo(e); e.ang = e.aa; break; }
          Z.chase(e, e.sp * .45); e.aa = e.ang;
          if ((e.t3 -= dt) <= 0) {
            if (e.fk > 0) { e.fk--; e.t3 = .36; e.arm++; e.pk = 1; Z.hazard(Z.P.x, Z.P.y, { r: 54, t: .7, dmg: 9, col: BOSS_COL }); Z.sfx('hit'); if (!e.fk) e.t3 = .55; }
            else bStart(e, Z, 'walk');
          }
          break;
        case 'charge':
          if (e.mt > .75) {
            Z.move(e, 0, 0);
            if (e.mt > 1.3) { let da = Z.angTo(e) - e.aa; da = Math.atan2(Math.sin(da), Math.cos(da)); e.aa += da * Math.min(1, dt * 2.5); }
          } else {
            if (!e.dv) { e.dv = true; Z.sfx('nova'); Z.shake(6); }
            Z.move(e, Math.cos(e.aa) * 600, Math.sin(e.aa) * 600);
            if (e.rage && (e.t3 -= dt) <= 0) { e.t3 = .12; Z.hazard(e.x, e.y, { r: 36, t: .7, dmg: 10, col: BOSS_COL }); }
          }
          e.ang = e.aa;
          if (e.mt <= 0) {
            for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + e.ph; Z.hazard(e.x + Math.cos(a) * 92, e.y + Math.sin(a) * 92, { r: 40, t: .55, dmg: 12, col: BOSS_COL }); }
            Z.shake(7); Z.sfx('nova');
            if (e.rage) Z.ring(e.x, e.y - 20, 12, 140, { r: 7, dmg: 9, col: '255,150,60' }, e.ph);
            bStart(e, Z, 'walk');
          }
          break;
        case 'slam':
          Z.move(e, 0, 0); e.ang = Z.angTo(e);
          if (!e.done && e.mt <= .5) { e.done = true; Z.shake(9); Z.sfx('nova'); Z.ring(e.x, e.y - 10, e.rage ? 20 : 16, 140, { r: 7, dmg: 9, life: 5, col: '255,196,80' }, Math.random()); }
          if (e.mt <= 0) bStart(e, Z, 'walk');
          break;
        case 'summon': Z.move(e, 0, 0); e.ang = Z.angTo(e); if (e.mt <= 0) bStart(e, Z, 'walk'); break;
        case 'shiftD': Z.move(e, 0, 0); if (e.mt <= 0) bStart(e, Z, 'def'); break;
        case 'def':
          Z.chase(e, e.sp * .3);
          if ((e.t3 -= dt) <= 0) { e.t3 = 1.5; Z.ring(e.x, e.y - 26, 10, 155, { r: 6, dmg: 8, life: 4, col: '240,232,205' }, e.ph * .7); Z.sfx('shoot'); }
          if (e.mt <= 0) bStart(e, Z, 'twin');
          break;
        case 'twin':
          Z.move(e, 0, 0); e.ang = Z.angTo(e);
          if (e.fk > 0 && e.mt <= 1) { e.fk = 0; Z.hazard(Z.P.x, Z.P.y, { r: 88, t: .9, dmg: 16, col: BOSS_COL }); Z.shake(5); }
          if (e.mt <= 0) bStart(e, Z, 'walk');
          break;
        default: bStart(e, Z, 'walk');
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 50, k2 = 1 / (ZS * s), m = e.mode, now = Z.now, D = m === 'def' || m === 'shiftD';
      const OL = W(white, '#191c2a'), ST = W(white, '#8a93a8'), STD = W(white, '#5d6579'), BR = W(white, '#d29a3a'), BRD = W(white, '#7a4e1a');
      const core = D ? '70,180,255' : e.rage ? '255,236,180' : '255,100,40', coreHex = W(white, D ? '#5ac8ff' : e.rage ? '#fff0c0' : '#ff6a2a');
      c.save(); c.translate(e.x, e.y); c.scale(s, s);
      c.lineCap = 'round'; c.lineJoin = 'round';
      if (!white) {
        if (m === 'charge' && e.mt > .75) {
          const k = cl01(1 - (e.mt - .75) / 1.15), L = 600 * .75 * k2, Wd = (e.r + 8) * k2, ch = new Path2D();
          for (let j = 0; j < 5; j++) { const u = md(now * 1.4 + j / 5, 1), x = 30 + u * (L - 40); line(ch, [x - 14, -Wd * .55, x, 0, x - 14, Wd * .55]); }
          c.save(); c.rotate(e.aa);
          c.globalAlpha = .1 + .22 * k + .05 * Math.sin(now * 20); c.fillStyle = '#ff7a2a'; c.fillRect(20, -Wd, L, Wd * 2);
          c.globalAlpha = .45 + .4 * k; c.strokeStyle = '#ffe0c0'; c.lineWidth = 1.6; c.strokeRect(20, -Wd, L, Wd * 2); c.lineWidth = 3; c.stroke(ch);
          c.restore(); c.globalAlpha = 1;
        }
        if (D) {
          const pu = .5 + .5 * Math.sin(now * 5), dm = new Path2D();
          for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + PI / 6, x = Math.cos(a) * 86, y = -34 + Math.sin(a) * 82; if (i) dm.lineTo(x, y); else dm.moveTo(x, y); }
          dm.closePath();
          c.globalAlpha = .08 + .06 * pu; c.fillStyle = '#5ac8ff'; c.fill(dm);
          c.globalAlpha = .45 + .3 * pu; c.strokeStyle = '#9ae0ff'; c.lineWidth = 2.4; c.stroke(dm); c.globalAlpha = 1;
        }
        if (e.rage) { c.globalAlpha = .3 + .2 * Math.sin(now * 6); c.strokeStyle = '#ff8a3a'; c.lineWidth = 3; c.beginPath(); c.arc(0, -30, 70 + Math.sin(now * 5) * 4, 0, TAU); c.stroke(); c.globalAlpha = 1; }
        Z.glow(core, 90, 0, -30, e.rage ? .36 : .24);
      }
      const walking = m === 'walk' || (m === 'flurry' && e.mt <= 0) || m === 'def';
      const lg = walking ? Math.sin(e.ph * 4) * 3 : 0;
      const crouch = D ? 10 * (m === 'shiftD' ? cl01(1 - e.mt / .8) : 1) : 0;
      c.translate(0, crouch);
      // bone spikes jutting from the hull in Defensive Mode
      if (D) {
        const sp = new Path2D(), ext = m === 'shiftD' ? cl01(1 - e.mt / .8) : 1;
        for (let i = 0; i < 14; i++) {
          const a = i / 14 * TAU - PI / 2, ca = Math.cos(a), sa = Math.sin(a), rx = 46, ry = 44, L = 14 + 8 * ext;
          poly(sp, [ca * rx - sa * 6, -28 + sa * ry + ca * 6, ca * (rx + L), -28 + sa * (ry + L), ca * rx + sa * 6, -28 + sa * ry - ca * 6]);
        }
        c.strokeStyle = OL; c.lineWidth = 1.6; c.stroke(sp); c.fillStyle = W(white, '#efe8d4'); c.fill(sp);
      }
      // legs and feet
      const lgp = new Path2D(); lgp.rect(-28, 4 + lg, 18, 24); lgp.rect(10, 4 - lg, 18, 24); lgp.rect(-33, 24 + lg, 26, 10); lgp.rect(7, 24 - lg, 26, 10);
      c.strokeStyle = OL; c.lineWidth = 2.4; c.stroke(lgp); c.fillStyle = STD; c.fill(lgp);
      const pv = new Path2D(); poly(pv, [-27, -4, 27, -4, 21, 10, -21, 10]); c.stroke(pv); c.fill(pv);
      // torso
      const tor = new Path2D(); poly(tor, [-42, -64, 42, -64, 33, 4, -33, 4]);
      c.lineWidth = 2.8; c.stroke(tor); c.fillStyle = ST; c.fill(tor);
      if (!white) {
        const sh = new Path2D(); poly(sh, [26, -64, 42, -64, 33, 4, 21, 4]); c.fillStyle = '#6c7489'; c.fill(sh);
        const pl = new Path2D(); line(pl, [-38, -44, -20, -44]); line(pl, [20, -44, 38, -44]); line(pl, [-35, -14, -20, -14]); line(pl, [20, -14, 35, -14]); line(pl, [-14, -6, -6, 2]); line(pl, [14, -6, 6, 2]);
        c.strokeStyle = '#4b5266'; c.lineWidth = 1.4; c.stroke(pl);
        const br = new Path2D(); line(br, [-42, -63, 42, -63]); line(br, [-33, 3, 33, 3]);
        c.strokeStyle = BR; c.lineWidth = 3.2; c.stroke(br);
        const rv = new Path2D(); for (const [x, y] of [[-34, -56], [34, -56], [-28, -4], [28, -4], [-36, -30], [36, -30]]) circ(rv, x, y, 2.2);
        c.fillStyle = BR; c.fill(rv);
        if (e.rage) {
          const cr = new Path2D(); line(cr, [-30, -58, -22, -46, -26, -36, -16, -30]); line(cr, [32, -50, 24, -40, 28, -26, 18, -18]); line(cr, [-8, -6, -2, 0, -6, 4]);
          c.strokeStyle = '#ffb040'; c.lineWidth = 1.8 + Math.sin(now * 9) * .4; c.stroke(cr);
        }
      }
      // the hex core
      const hx = (p, r, y) => { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + PI / 6, x = Math.cos(a) * r, yy = y + Math.sin(a) * r; if (i) p.lineTo(x, yy); else p.moveTo(x, yy); } p.closePath(); };
      const sk = new Path2D(); hx(sk, 18, -30); c.strokeStyle = OL; c.lineWidth = 2; c.stroke(sk); c.fillStyle = BRD; c.fill(sk);
      const gm = new Path2D(); hx(gm, 11.5 + (e.rage ? Math.sin(now * 12) : 0), -30); c.fillStyle = coreHex; c.fill(gm);
      if (!white) {
        const fc = new Path2D(); poly(fc, [-5, -36, 3, -38, 0, -31]); c.fillStyle = '#ffffff'; c.globalAlpha = .7; c.fill(fc); c.globalAlpha = 1;
        Z.glow(core, 30 + Math.sin(now * 4) * 4, 0, -30, .9);
      }
      // arms: shoulder to fist, posed by the current move
      const dx = Math.cos(e.aa), dy = Math.sin(e.aa);
      let F;
      if (D) F = [[22, -36], [-22, -26]];
      else if (m === 'flurry' && e.mt <= 0) {
        const hit = e.arm % 2, ext = 34 + 44 * e.pk;
        F = hit ? [[-30, -18], [Math.max(-70, Math.min(70, 30 + dx * ext)), -34 + dy * ext]] : [[Math.max(-70, Math.min(70, -30 + dx * ext)), -34 + dy * ext], [30, -18]];
      } else if (m === 'flurry' || (m === 'charge' && e.mt > .75)) F = [[-40 - dx * 8, -28], [40 - dx * 8, -28]];
      else if (m === 'charge') F = [[-24 + dx * 40, -30 + dy * 40], [24 + dx * 40, -30 + dy * 40]];
      else if ((m === 'slam' && !e.done) || (m === 'twin' && e.mt > (e.fk ? 1.05 : .1)) || m === 'summon') { const w = Math.sin(now * 10) * 2; F = [[-36, -118 + w], [36, -118 - w]]; }
      else if (m === 'slam' || m === 'twin') F = [[-42, 18], [42, 18]];
      else { const sw = Math.sin(e.ph * 4) * 4; F = [[-54, 2 + sw], [54, 2 - sw]]; }
      const SH = [[-46, -54], [46, -54]], am = new Path2D(), fs = new Path2D(), kn = new Path2D();
      for (let i = 0; i < 2; i++) {
        const [sx, sy] = SH[i], [fx, fy] = F[i], o = i ? 1 : -1;
        am.moveTo(sx, sy); am.quadraticCurveTo((sx + fx) / 2 + o * 14, (sy + fy) / 2 + 4, fx, fy);
        fs.rect(fx - 13, fy - 11, 26, 22); kn.rect(fx - 13, fy - 11, 26, 5);
      }
      c.strokeStyle = OL; c.lineWidth = 18; c.stroke(am); c.strokeStyle = ST; c.lineWidth = 13.5; c.stroke(am);
      c.strokeStyle = OL; c.lineWidth = 2.2; c.stroke(fs); c.fillStyle = STD; c.fill(fs); c.fillStyle = BR; c.fill(kn);
      // pauldrons
      const pd = new Path2D(); ell(pd, -46, -58, 20, 15); ell(pd, 46, -58, 20, 15);
      c.stroke(pd); c.fillStyle = ST; c.fill(pd);
      if (!white) { const pr = new Path2D(); pr.moveTo(-64, -56); pr.quadraticCurveTo(-46, -78, -28, -56); pr.moveTo(28, -56); pr.quadraticCurveTo(46, -78, 64, -56); c.strokeStyle = BR; c.lineWidth = 2.6; c.stroke(pr); }
      // head with a visor slit and a bronze crest
      const hd = new Path2D(); poly(hd, [-15, -64, 15, -64, 17, -82, 9, -90, -9, -90, -17, -82]);
      c.strokeStyle = OL; c.lineWidth = 2.2; c.stroke(hd); c.fillStyle = ST; c.fill(hd);
      const cs = new Path2D(); poly(cs, [-5, -90, 0, -108, 5, -90]); if (e.rage) { poly(cs, [-14, -84, -24, -100, -10, -88]); poly(cs, [14, -84, 24, -100, 10, -88]); }
      c.stroke(cs); c.fillStyle = BR; c.fill(cs);
      if (!white) {
        c.fillStyle = '#16121c'; c.fillRect(-12, -80, 24, 6);
        const lx = Math.max(-3, Math.min(3, Math.cos(e.ang) * 3));
        c.fillStyle = coreHex; c.fillRect(-9 + lx, -79, 18, 3.5);
        Z.glow(core, 16, lx, -77, .9);
        // the intent of the current (or next) move
        const im = m === 'walk' ? e.next : m;
        const IT = im === 'flurry' ? [ATK, e.rage ? '9×6' : '9×4'] : im === 'charge' ? [ATK, '24'] : im === 'slam' ? [ATK, '16'] : im === 'summon' ? [BUF, ''] : im === 'twin' ? [ATK, '16×2'] : [DEF, ''];
        const ay = (F[0][1] < -100 ? -146 : -124) - crouch;
        c.globalAlpha = m === 'walk' ? .85 : 1;
        intent(c, Z, IT[0], IT[1], -6, ay, 1.5);
        c.globalAlpha = 1;
      }
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y - 30, '#8a93a8', 36, 220); Z.burst(e.x, e.y - 30, '#ff8a3a', 26, 180); Z.burst(e.x, e.y - 30, '#d29a3a', 16, 150); Z.shake(14); },
  };

  /* ================= Events ================= */
  const spot = (Z, d) => { const a = Math.random() * TAU; return { x: Z.P.x + Math.cos(a) * d, y: Z.P.y + Math.sin(a) * d, a }; };
  const sp1 = (Z, kind, x, y) => { const q = Z.spawn(kind, x, y); if (q && kind === 'louse') q.pack = false; return q; };
  const band = (Z, kind, n, d) => {
    const p = spot(Z, d), px = -Math.sin(p.a), py = Math.cos(p.a);
    for (let i = 0; i < n; i++) sp1(Z, kind, p.x + px * (i - (n - 1) / 2) * 34, p.y + py * (i - (n - 1) / 2) * 34);
  };
  const around = (Z, kind, n, d) => { const a0 = Math.random() * TAU; for (let i = 0; i < n; i++) { const a = a0 + i / n * TAU; sp1(Z, kind, Z.P.x + Math.cos(a) * d, Z.P.y + Math.sin(a) * d); } };
  const triad = (Z, d) => {
    const p = spot(Z, d), px = -Math.sin(p.a), py = Math.cos(p.a), t1 = Z.rnd(1.6, 2.4);
    for (let i = -1; i <= 1; i++) { const q = Z.spawn('sentry', p.x + px * i * 70, p.y + py * i * 70); if (q) q.t1 = t1; }
  };
  const elite = (Z, kind, d) => { const p = spot(Z, d), q = Z.spawn(kind, p.x, p.y); if (q) { if (kind === 'louse') q.pack = false; mkElite(q); Z.burst(p.x, p.y, GOLD, 16, 120); } return q; };
  const strange = Z => {
    const r = Math.random();
    Z.sfx('warn');
    if (r < .34) {
      Z.banner('? A strange event… the monsters grow bolder.', '#c89aff', true);
      for (const o of Z.foes()) if (!o.boss && Math.abs(o.x - Z.P.x) < 800 && Math.abs(o.y - Z.P.y) < 800) { o.max *= 1.25; o.hp *= 1.25; o.lh = o.hp; if (o.str !== undefined) o.str = Math.min(5, o.str + 1); }
      around(Z, 'cultist', 3, 400);
    } else if (r < .67) {
      Z.banner('? A strange event… the parchment smoulders!', '#ffb46a', true);
      for (let i = 0; i < 12; i++) { const a = Math.random() * TAU, d = 50 + Math.random() * 270; Z.hazard(Z.P.x + Math.cos(a) * d, Z.P.y + Math.sin(a) * d, { r: 46, t: 1.1 + i * .09, dmg: 11, col: '255,140,50' }); }
      band(Z, 'louse', 4, 420);
    } else {
      Z.banner('? A strange event… something skitters in the walls.', '#c89aff', true);
      around(Z, 'louse', 8, 380);
    }
  };
  const ELK = ['cultist', 'slime', 'louse', 'sentry'];
  const events = [
    { t: 6, run(Z) { Z.banner('The Spire looms. Climb!', '#ffd9a0', false); Z.sfx('warn'); band(Z, 'louse', 6, 420); band(Z, 'cultist', 2, 460); } },
    { t: 18, run: strange },
    { t: 30, run(Z) { Z.banner('Sentries hum to life…', '#7ae8ff', false); Z.sfx('warn'); triad(Z, 340); } },
    { t: 40, run(Z) { Z.banner('Elite encounter!', GOLD, true); Z.sfx('boss'); elite(Z, ELK[fl(Math.random() * 3) % 3], 400); around(Z, 'louse', 3, 430); } },
    { t: 64, run(Z) { Z.banner('The merchant flees… monsters pour in!', '#ffd25a', true); Z.sfx('warn'); around(Z, 'louse', 7, 420); band(Z, 'slime', 2, 470); } },
    { t: 86, run(Z) {
      Z.banner('A campfire flickers — rest is not an option.', '#ff9a5a', true); Z.sfx('warn');
      const a = Math.random() * TAU;
      addFx({ x: Z.P.x + Math.cos(a) * 70, y: Z.P.y + Math.sin(a) * 70, t0: Z.t, T: 14 });
      const a0 = Math.random() * TAU;
      for (let i = 0; i < 4; i++) { const b = a0 + i / 4 * TAU, q = Z.spawn('cultist', Z.P.x + Math.cos(b) * 360, Z.P.y + Math.sin(b) * 360); if (q) q.t1 = .3; }
      band(Z, 'slime', 1, 460);
    } },
    { t: 104, run: strange },
    { t: 118, run(Z) { Z.banner('Elite encounter!', GOLD, true); Z.sfx('boss'); elite(Z, ELK[fl(Math.random() * 4) % 4], 400); triad(Z, 360); } },
    { t: 132, run(Z) { Z.banner('Ascension rises…', '#ff6a6a', true); Z.sfx('boss'); Z.shake(4); around(Z, 'louse', 8, 420); band(Z, 'slime', 2, 480); } },
  ];

  /* ================= Music: an original dark folk-rock climb in D minor, 120 bpm in sixteenths =================
     A galloping (3-3-2) picked bass, strummed and arpeggiated harp-guitar, a marching kick/snare with ghost notes and
     tom fills, a soft string pad, and a melancholic lead that alternates accordion-like square and violin-like saw on
     each pass. The guardian fight drops into a Dm-Bb-Gm-A loop with a distorted sixteenth gallop bass, double kicks,
     crashes, choir pads, brass stabs and a brass-like lead. */
  const NAT = [0, 2, 3, 5, 7, 8, 10], HAR = [0, 2, 3, 5, 7, 8, 11];
  const dg = (S, base, i) => base + S[((i % 7) + 7) % 7] + 12 * Math.floor(i / 7);
  // [bass root, major?]
  const PROG = [[38, 0], [46, 1], [41, 1], [36, 1], [38, 0], [43, 0], [45, 1], [38, 0], [46, 1], [36, 1], [38, 0], [45, 0], [43, 0], [46, 1], [45, 1], [45, 1]];
  const HARB = [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1];
  const MEL = [
    [[0, 4, 4], [4, 3, 2], [6, 2, 2], [8, 0, 6], [14, 2, 2]], [[0, 3, 6], [6, 2, 2], [8, 1, 4], [12, -2, 4]],
    [[0, 2, 4], [4, 4, 4], [8, 5, 6], [14, 4, 2]], [[0, 4, 8], [8, 3, 4], [12, 1, 4]],
    [[0, 0, 3], [3, 2, 3], [6, 4, 2], [8, 7, 6], [14, 6, 2]], [[0, 5, 4], [4, 3, 4], [8, 1, 4], [12, 3, 4]],
    [[0, 1, 4], [4, -1, 4], [8, 1, 4], [12, 4, 4]], [[0, 0, 10]],
    [[0, 7, 4], [4, 8, 2], [6, 7, 2], [8, 5, 4], [12, 3, 4]], [[0, 6, 4], [4, 7, 2], [6, 6, 2], [8, 4, 8]],
    [[0, 5, 3], [3, 4, 3], [6, 3, 2], [8, 2, 4], [12, 4, 4]], [[0, 4, 12], [12, 6, 2], [14, 7, 2]],
    [[0, 8, 6], [6, 7, 2], [8, 5, 4], [12, 3, 4]], [[0, 7, 4], [4, 5, 4], [8, 3, 4], [12, 2, 4]],
    [[0, 1, 6], [6, 2, 2], [8, 1, 4], [12, -1, 4]], [[0, 4, 8], [8, -1, 4], [12, 1, 4]],
  ];
  const BPROG = [[38, 0], [46, 1], [43, 0], [45, 1]];
  const BMEL = [
    [[0, 7, 4], [4, 6, 2], [6, 7, 2], [8, 9, 6], [14, 8, 2]], [[0, 7, 6], [6, 5, 2], [8, 3, 4], [12, 5, 4]],
    [[0, 3, 3], [3, 4, 3], [6, 5, 2], [8, 7, 4], [12, 8, 4]], [[0, 8, 6], [6, 7, 2], [8, 6, 8]],
    [[0, 9, 4], [4, 8, 2], [6, 9, 2], [8, 11, 6], [14, 10, 2]], [[0, 9, 6], [6, 7, 2], [8, 5, 4], [12, 7, 4]],
    [[0, 10, 4], [4, 9, 4], [8, 8, 4], [12, 7, 4]], [[0, 6, 4], [4, 4, 4], [8, 8, 8]],
  ];
  const GALLOP = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0];
  const music = {
    bpm: 120, div: 4,
    step(s, t, A) {
      const sp = 60 / 120 / 4, bar = fl(s / 16), b = s % 16, inten = A.inten || 0;
      if (!A.boss) {
        const sec = bar % 16, pass = fl(bar / 16) % 2, [r, mj] = PROG[sec], S = HARB[sec] ? HAR : NAT, th = r + (mj ? 4 : 3);
        // galloping bass
        if (GALLOP[b]) A.tone(t, r + (b === 14 && sec % 2 ? 12 : 0), sp * 2.2, .066, { type: 'sawtooth', cutoff: 420, sweep: 220, decay: true });
        // strum on 1 and 3, arpeggio between
        if (b === 0 || b === 8) for (let i = 0; i < 4; i++) A.pluck([r + 12, th + 12, r + 19, r + 24][i], t + i * .016, b ? .38 : .5);
        else if (b % 2 === 0) A.pluck([r + 19, th + 12, r + 24, th + 24][(b / 2) % 4], t, .3 + inten * .1);
        // marching drums
        if (b === 0 || b === 8 || (b === 10 && inten > .35)) A.kick(t, .58);
        if (b === 4 || b === 12) A.snare(t, .24);
        if ((b === 14 || b === 15) && sec % 2) A.snare(t, .07);
        A.hat(t, b % 2 ? .02 + inten * .01 : .04);
        if (sec % 4 === 3 && b >= 12) A.tom(t, 170 - (b - 12) * 24, .24);
        if (b === 0 && sec % 2 === 0) A.pad([r + 24, th + 24, r + 31], t, sp * 31, .012, { type: 'sawtooth', cutoff: 760, q: 3, detune: 10 });
        // melancholic lead: accordion on the first pass, violin on the second
        for (const nn of MEL[sec]) if (nn[0] === b) {
          const mm = dg(S, 62, nn[1]), dur = sp * nn[2] * .95;
          if (!pass) { A.tone(t, mm, dur, .042, { type: 'square', cutoff: 1700, vib: .3, attack: .02 }); A.tone(t, mm - 12, dur, .012, { type: 'sawtooth', cutoff: 900, attack: .02, detune: 8 }); }
          else { A.tone(t, mm, dur, .04, { type: 'sawtooth', cutoff: 2600, vib: .55, attack: .07 }); A.tone(t, mm + 12, dur, .006, { type: 'sine', attack: .08 }); }
        }
        if (sec === 0 && b === 0) A.bell(74, t, .035);
        if (sec === 8 && b === 0) A.bell(69, t, .03);
      } else {
        const sec = bar % 4, [r, mj] = BPROG[sec], S = sec === 3 ? HAR : NAT, th = r + (mj ? 4 : 3), mel = BMEL[bar % 8];
        // distorted sixteenth gallop bass
        if (b % 4 !== 1) { A.tone(t, r, sp * .9, .06, { type: 'sawtooth', cutoff: 1100, q: 3, decay: true }); A.tone(t, r + 12, sp * .9, .02, { type: 'square', cutoff: 700, detune: 18, decay: true }); }
        if (b % 4 === 0 || b === 2 || b === 10 || (b === 14 && bar % 2)) A.kick(t, .66);
        if (b === 4 || b === 12) A.snare(t, .32);
        if (bar % 2 === 1 && b >= 12) A.tom(t, 150 - (b - 12) * 20, .32);
        A.hat(t, b % 2 ? .025 : .05);
        if (b === 0 && sec === 0) A.noise(t, 1.1, .045, { type: 'highpass', f: 4200 });
        if (b === 0) A.pad([r + 24, th + 24, r + 31], t, sp * 16, .018, { type: 'sawtooth', cutoff: 1150, q: 6, detune: 7 });
        if (b === 0 || b === 6 || (b === 10 && bar % 2)) for (const iv of [24, th - r + 24, 31]) A.tone(t, r + iv, sp * 1.5, .022, { type: 'sawtooth', cutoff: 1500, sweep: 600, attack: .008 });
        for (const nn of mel) if (nn[0] === b) {
          const mm = dg(S, 62, nn[1]), dur = sp * nn[2] * .92;
          A.tone(t, mm, dur, .046, { type: 'sawtooth', cutoff: 1900, sweep: 2600, vib: .25, attack: .03 });
          A.tone(t, mm - 12, dur, .018, { type: 'square', cutoff: 1000, attack: .03 });
        }
      }
    },
  };

  return {
    id: 'spire', name: 'The Ascent', nod: 'Slay the Spire', portal: '220,60,70', bg: '#231912', dark: .35, dim: .12,
    ground, under, ambient,
    mix: { louse: 4.5, cultist: 1.6, slime: 1.4, sentry: .8 },
    target: 1,
    foes: { cultist, louse, slime, sentry },
    boss, events, music,
  };
})());
