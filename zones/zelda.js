// Zone: Koholaid Shallows, a dreamy handheld island drawn in four shades of green.
ZONES.push((() => {
  // The classic 4-shade handheld palette. EVERYTHING in this zone uses only these (plus pure white for hit flashes).
  const PAL = ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'];
  const ROCKC = '48,98,48';
  const H = Math.PI / 2;

  /* ---------- Pixel sprites: rows of '0'..'3' (palette index) and '.' (clear), baked once into Path2D per shade ---------- */
  // Each sprite also bakes a 1-pixel 8-neighbour OUTLINE ring so it pops off the light ground.
  const mk = rows => {
    const h = rows.length, w = Math.max(...rows.map(r => r.length));
    const p = [new Path2D(), new Path2D(), new Path2D(), new Path2D()], all = new Path2D(), out = new Path2D(), n = [0, 0, 0, 0];
    const at = (x, y) => y >= 0 && y < h && x >= 0 && x < rows[y].length && rows[y][x] >= '0' && rows[y][x] <= '3';
    for (let y = 0; y < h; y++) {
      const r = rows[y]; let x = 0;
      while (x < r.length) {
        const ch = r[x]; let e = x + 1;
        while (e < r.length && r[e] === ch) e++;
        if (ch >= '0' && ch <= '3') { const k = +ch; p[k].rect(x, y, e - x, 1.04); all.rect(x, y, e - x, 1.04); n[k]++; }
        x = e;
      }
    }
    for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) {
      if (at(x, y)) continue;
      let nb = false;
      for (let j = -1; j <= 1 && !nb; j++) for (let i = -1; i <= 1; i++) if (at(x + i, y + j)) { nb = true; break; }
      if (nb) out.rect(x - .02, y - .02, 1.04, 1.04);
    }
    return { w, h, p, all, out, n };
  };
  // Procedural sprite: fn(dx, dy, d) -> char, relative to the sprite centre.
  const gen = (w, h, fn) => {
    const rows = [];
    for (let y = 0; y < h; y++) {
      let r = '';
      for (let x = 0; x < w; x++) { const dx = x - (w - 1) / 2, dy = y - (h - 1) / 2; r += fn(dx, dy, Math.hypot(dx, dy), x, y); }
      rows.push(r);
    }
    return mk(rows);
  };
  // Colour maps for the sprite indices. Regular foes: darkest outline, bright backlit-lime body, dark-green
  // detail, pale glints, so they read strongly against the light ground. The boss is the inverse: dark body, light highlights.
  const FOE = ['#0f380f', '#c4e04a', '#306230', '#f0fcc8'];
  const BOSS = ['#0f380f', '#306230', '#8bac0f', '#d8f080'];
  const spr = (c, S, x, y, px, white, rot, flip, sy, cm = FOE) => {
    c.save();
    c.translate(Math.round(x), Math.round(y));
    if (rot) c.rotate(rot);
    c.scale(flip ? -px : px, px * (sy || 1));
    c.translate(-S.w / 2, -S.h / 2);
    if (white) { c.fillStyle = '#ffffff'; c.fill(S.out); c.fill(S.all); }
    else {
      c.fillStyle = PAL[0]; c.fill(S.out);
      for (let i = 0; i < 4; i++) if (S.n[i]) { c.fillStyle = cm[i]; c.fill(S.p[i]); }
    }
    c.restore();
  };
  const snap = v => Math.round(v / 2) * 2;

  // Round squid critter (orig. "octorok" archetype), drawn facing DOWN; snout at the bottom.
  const OCT_TOP = [
    '...000000...',
    '..01111110..',
    '.0133111110.',
    '.0131111110.',
    '011111111110',
    '013011110310',
    '013011110310',
    '.0111001110.',
    '..01100110..',
  ];
  const OCT = [mk(OCT_TOP.concat(['.01.0330.10.', '.0..0000..0.', '............'])),
               mk(OCT_TOP.concat(['0.1.0330.1.0', '0...0000...0', '............']))];

  // Pig-snouted spear guard (orig. "moblin" archetype): front, back, side x2.
  const MOB_BODY = ['..0211111120..', '.021100001120.', '.001111111100.', '...01111110...', '...0110.010...', '...000...00...'];
  const MOB_DOWN = mk([
    '.00..0000..00.',
    '.010011110010.',
    '..0011111100..',
    '.001311113100.',
    '.013011110310.',
    '.011102201110.',
    '..0102332010..',
    '...00022000...',
  ].concat(MOB_BODY));
  const MOB_UP = mk([
    '.00..0000..00.',
    '.010011110010.',
    '..0011111100..',
    '.001111111100.',
    '.011111111110.',
    '.011131111110.',
    '..0111111110..',
    '...00000000...',
  ].concat(MOB_BODY));
  const MOB_SIDE_TOP = [
    '....00........',
    '...0100000....',
    '...00111110...',
    '...0111131000.',
    '...0111103100.',
    '..0111111220..',
    '..00111112330.',
    '...0000000220.',
    '....0211110...',
    '....01000010..',
    '....0111110...',
    '....011110....',
  ];
  const MOB_SIDE = [mk(MOB_SIDE_TOP.concat(['...010..010...', '...00....00...'])),
                    mk(MOB_SIDE_TOP.concat(['.....0110.....', '.....0000.....']))];

  // Jelly blob (orig. "zol") and its small split (orig. "gel").
  const BLOB = mk([
    '....0000....',
    '..00111100..',
    '.0113311110.',
    '.0131111110.',
    '011111111110',
    '011311113110',
    '011011110110',
    '011111111110',
    '012111111210',
    '.0000000000.',
  ]);
  const GEL = mk([
    '..0000..',
    '.013110.',
    '01311110',
    '01311310',
    '01111110',
    '.000000.',
  ]);

  // Spiky sea urchin: procedural, spikes alternate between two angle sets for a 2-frame bristle.
  const urchin = off => gen(17, 17, (dx, dy, d) => {
    if (d < 4.1) return (dx < -1 && dy < -1 && d > 1.5) ? '3' : (Math.abs(dx) < 1 && Math.abs(dy - 1) < .6 ? '0' : '1');
    if (d < 5.3) return '0';
    const a = Math.atan2(dy, dx) + Math.PI + off, k = Math.PI / 4;
    const m = Math.abs(((a % k) + k) % k - k / 2);
    if (d < 8.6 && m < .5 / (d * .32)) return d < 6.6 ? '1' : '0';
    return '.';
  });
  const URCH = [urchin(0), urchin(Math.PI / 8)];

  // Giant segmented worm: head (facing down, two mandible frames), body segment, tail.
  const head = open => gen(19, 19, (dx, dy, d) => {
    const ex = Math.abs(dx) - 3.6, ey = dy - .6;
    if (d <= 8.7) {
      if (d > 7.6) return '0';
      if (Math.hypot(ex, ey - .7) < .9) return '0';
      if (Math.hypot(ex, ey) < 2.1) return '3';
      if (dy > 4.2 && Math.abs(dx) < (open ? 3.6 : 2.2)) return (open && dy > 4.8 && (Math.round(dx) & 1)) ? '3' : '0';
      if (Math.abs(dy + 4.2) < .55 && Math.abs(dx) < 5) return '0';
      if (dx < -2 && dy < -4.6 && d < 7) return '3';
      if (Math.abs(dy + 2.4) < .6 && Math.abs(dx) < 5.6) return '2';
      return '1';
    }
    if (dy > 5 && dy < 9.6) { const mx = Math.abs(dx) - (open ? 6.2 : 4.6); if (mx > -1.2 && mx < 1.1) return '0'; }
    return '.';
  });
  const HEAD = [head(false), head(true)];
  const SEG = gen(15, 15, (dx, dy, d) => {
    if (d > 7.1) return (d < 8.2 && Math.abs(dx) < 1.2 && dy < 0) ? '0' : '.';
    if (d > 6.1) return '0';
    if (dx < -1 && dy < -2.2 && d < 5) return '3';
    if (Math.abs(dy) < 1.1) return '2';
    if (Math.abs(dy - 3) < .6) return '0';
    return '1';
  });
  const TAIL = gen(11, 11, (dx, dy, d) => d > 5 ? '.' : d > 4 ? '0' : (dx < -.5 && dy < -1 ? '3' : (Math.abs(dy) < .8 ? '2' : '1')));
  const MOUND = mk([
    '....0000....',
    '..00211200..',
    '.0213321120.',
    '021111111120',
    '.0000000000.',
  ]);

  /* ---------- Floor: handheld-style "screens" of 10x8 tiles (16 px tiles at 3 world px per pixel = 480x384) ---------- */
  const U = 3, TW = 48, SW = 10, SH = 8;
  const G = 0, TUFT = 1, BUSH = 2, FLOW = 3, PATH = 4, SIGN = 5, WELL = 6, ROCK = 7, TREE = 8, COV = 9,
        HOUSE = 10, POND = 11, SAND = 12, SEA = 13, CLIFF = 14, TALL = 15;
  const mod = (a, n) => ((a % n) + n) % n;
  const isBeach = sy => mod(sy, 4) === 3;
  const SC = new Map();   // cache of generated screen layouts
  const screen = (Z, sx, sy) => {
    const key = (sx + 20000) * 40000 + (sy + 20000);
    let m = SC.get(key);
    if (m) return m;
    if (SC.size > 800) SC.clear();
    m = new Uint8Array(SW * SH);
    const set = (x, y, v) => { if (x >= 0 && x < SW && y >= 0 && y < SH) m[y * SW + x] = v; };
    const hs = (a, b) => Z.hash(sx * a + b, sy * b - a);
    if (isBeach(sy)) {
      for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) set(x, y, y >= 3 && y <= 5 ? SEA : SAND);
      if (hs(3, 7) < .7) set(1 + Math.floor(hs(5, 2) * 8), 1, ROCK);
      if (hs(9, 4) < .5) set(1 + Math.floor(hs(4, 9) * 8), 7, ROCK);
      if (hs(6, 11) < .4) set(2 + Math.floor(hs(11, 6) * 6), 0, SIGN);
      SC.set(key, m); return m;
    }
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++)
      if (Z.hash(sx * SW + x, sy * SH + y) < .2) set(x, y, TUFT);
    for (let y = 0; y < SH; y++) { set(4, y, PATH); set(5, y, PATH); }
    for (let x = 0; x < SW; x++) { set(x, 3, PATH); set(x, 4, PATH); }
    const tree = (x, y) => { set(x, y, TREE); set(x + 1, y, COV); set(x, y + 1, COV); set(x + 1, y + 1, COV); };
    // Border on the top and left edges (shared with the neighbours) with an opening where the paths cross.
    const style = hs(7, 3), top = !isBeach(sy - 1);
    let bt = 1;
    if (style < .45) {
      bt = 2;
      if (top) for (const x of [0, 2, 6, 8]) tree(x, 0);
      tree(0, top ? 0 : 1); tree(0, 6);
    } else {
      const v = style < .8 ? BUSH : CLIFF;
      if (top) for (let x = 0; x < SW; x++) if (x !== 4 && x !== 5) set(x, 0, v);
      for (let y = 0; y < SH; y++) if (y !== 3 && y !== 4) set(0, y, v);
    }
    // Four quadrants between the paths, each with a little set piece (or left open).
    const Q = [[bt, bt, 4 - bt, 3 - bt], [6, bt, 4, 3 - bt], [bt, 5, 4 - bt, 3], [6, 5, 4, 3]];
    let house = hs(13, 5) < .28;
    for (let qi = 0; qi < 4; qi++) {
      const [qx, qy, qw, qh] = Q[qi], q = Z.hash(sx * 17 + qi * 5, sy * 23 - qi * 3);
      if (house && qi >= 2 && qw >= 3) {
        house = false;
        for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) set(qx + x, qy + y, COV);
        set(qx, qy, HOUSE);
        if (qw > 3) set(qx + 3, qy + 2, SIGN);
        continue;
      }
      if (q < .3) continue;
      if (q < .5) { for (let y = 0; y < Math.min(2, qh); y++) for (let x = 0; x < Math.min(3, qw); x++) set(qx + x, qy + y, FLOW); }
      else if (q < .62 && qw >= 3 && qh >= 2) { for (let y = 0; y < 2; y++) for (let x = 0; x < 3; x++) set(qx + x, qy + y, COV); set(qx, qy, POND); }
      else if (q < .74) { set(qx + 1, qy, WELL); set(qx, qy + Math.min(1, qh - 1), SIGN); }
      else if (q < .86 && qw >= 2 && qh >= 2) { tree(qx, qy); if (qw > 2) set(qx + 2, qy + 1, ROCK); }
      else { set(qx, qy, TALL); set(qx + 1, qy, TALL); if (qh > 1) set(qx + 1, qy + 1, TALL); }
    }
    SC.set(key, m); return m;
  };
  const tileAt = (Z, tx, ty) => {
    const sx = Math.floor(tx / SW), sy = Math.floor(ty / SH);
    return screen(Z, sx, sy)[(ty - sy * SH) * SW + (tx - sx * SW)];
  };

  /* ---------- Helpers for 4-directional movement ---------- */
  const dirTo = (e, P) => {
    const dx = P.x - e.x, dy = P.y - e.y;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3);   // 0 right, 1 down, 2 left, 3 up
  };
  const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];

  /* ---------- Music ---------- */
  const MAJ = [0, 2, 4, 5, 7, 9, 11], HMIN = [0, 2, 3, 5, 7, 8, 11];
  const deg = (sc, i) => sc[mod(i, 7)] + 12 * Math.floor(i / 7);
  const OW_CH = [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7], [9, 12, 16], [2, 5, 9], [7, 11, 14], [7, 11, 14],
                 [5, 9, 12], [7, 11, 14], [4, 7, 11], [9, 12, 16], [2, 5, 9], [7, 11, 14], [0, 4, 7], [0, 4, 7]];
  // [16th position, scale degree, length in 16ths]
  const OW_MEL = [
    [[0, 4, 2], [2, 4, 1], [3, 5, 1], [4, 7, 4], [8, 6, 2], [10, 4, 2], [12, 2, 4]],
    [[0, 5, 3], [3, 3, 1], [4, 5, 2], [6, 7, 2], [8, 8, 6], [14, 7, 2]],
    [[0, 6, 2], [2, 4, 2], [4, 1, 2], [6, 4, 2], [8, 6, 4], [12, 8, 2], [14, 6, 2]],
    [[0, 7, 6], [6, 4, 2], [8, 2, 2], [10, 4, 2], [12, 7, 4]],
    [[0, 5, 2], [2, 7, 2], [4, 9, 4], [8, 7, 2], [10, 5, 2], [12, 4, 4]],
    [[0, 3, 2], [2, 5, 2], [4, 8, 4], [8, 7, 2], [10, 5, 2], [12, 3, 2], [14, 5, 2]],
    [[0, 4, 3], [3, 6, 1], [4, 8, 4], [8, 6, 2], [10, 8, 2], [12, 9, 2], [14, 8, 2]],
    [[0, 6, 8], [8, 4, 2], [10, 5, 2], [12, 6, 2], [14, 4, 2]],
    [[0, 7, 2], [2, 8, 2], [4, 9, 2], [6, 8, 2], [8, 7, 4], [12, 5, 4]],
    [[0, 6, 2], [2, 7, 2], [4, 8, 2], [6, 7, 2], [8, 6, 4], [12, 4, 4]],
    [[0, 4, 2], [2, 6, 2], [4, 9, 6], [10, 8, 2], [12, 6, 4]],
    [[0, 5, 2], [2, 7, 2], [4, 9, 4], [8, 11, 4], [12, 9, 4]],
    [[0, 8, 3], [3, 7, 1], [4, 5, 4], [8, 3, 2], [10, 5, 2], [12, 8, 4]],
    [[0, 8, 2], [2, 6, 2], [4, 4, 2], [6, 6, 2], [8, 8, 2], [10, 9, 2], [12, 11, 4]],
    [[0, 7, 8], [8, 9, 2], [10, 7, 2], [12, 4, 4]],
    [[0, 7, 4], [4, 4, 2], [6, 2, 2], [8, 0, 4], [12, 4, 2], [14, 4, 1], [15, 5, 1]],
  ];
  const BS_CH = [[0, 3, 7], [8, 12, 15], [10, 14, 17], [0, 3, 7], [5, 8, 12], [0, 3, 7], [7, 11, 14], [7, 11, 14]];
  const BS_MEL = [
    [[0, 7, 2], [2, 6, 2], [4, 7, 2], [6, 9, 2], [8, 7, 4], [12, 4, 4]],
    [[0, 5, 4], [4, 7, 2], [6, 5, 2], [8, 4, 6], [14, 2, 2]],
    [[0, 6, 2], [2, 8, 2], [4, 10, 4], [8, 9, 2], [10, 8, 2], [12, 6, 4]],
    [[0, 7, 8], [8, 4, 2], [10, 5, 2], [12, 6, 2], [14, 7, 2]],
    [[0, 10, 2], [2, 9, 2], [4, 8, 4], [8, 10, 2], [10, 12, 2], [12, 10, 4]],
    [[0, 9, 2], [2, 7, 2], [4, 4, 4], [8, 7, 4], [12, 9, 4]],
    [[0, 6, 2], [2, 7, 2], [4, 8, 2], [6, 6, 2], [8, 4, 4], [12, 6, 4]],
    [[0, 4, 4], [4, 6, 4], [8, 8, 4], [12, 6, 2], [14, 4, 2]],
  ];
  const ARP = [0, 1, 2, 3, 2, 1];
  const BPM = 132, SL = 60 / BPM / 4;
  const hatN = (A, t, v) => A.noise(t, .025, v, { type: 'highpass', f: 7500 });
  const snareN = (A, t, v) => A.noise(t, .09, v, { type: 'bandpass', f: 1900, q: .7 });
  const kickT = (A, t, v) => A.tone(t, 40, .1, v, { type: 'triangle', glide: 24 });

  return {
    id: 'zelda',
    name: 'Koholaid Shallows',
    nod: "The Legend of Zelda: Link's Awakening",
    portal: '155,188,15',
    bg: '#9bbc0f',
    dim: .12,
    dark: .25,
    target: 1,

    // Cached: open light ground, sparse mid-shade marks, set pieces outlined in dark green, almost no darkest shade.
    ground(Z, x0, y0, x1, y1) {
      const c = Z.ctx;
      const Mb = new Path2D(), D = new Path2D(), M = new Path2D(), L = new Path2D(), D2 = new Path2D(), L2 = new Path2D(), K = new Path2D();
      let X = 0, Y = 0;
      const r = (p, x, y, w, h) => p.rect(X + x * U, Y + y * U, w * U, h * U);
      const tx0 = Math.floor(x0 / TW) - 3, tx1 = Math.floor(x1 / TW), ty0 = Math.floor(y0 / TW) - 3, ty1 = Math.floor(y1 / TW);
      for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
        const k = tileAt(Z, tx, ty);
        if (k === COV) continue;
        X = tx * TW; Y = ty * TW;
        const h = Z.hash(tx * 7 + 3, ty * 13 - 5), h2 = Z.hash(tx * 3 - 11, ty * 5 + 17);
        const a = 1 + Math.floor(h * 11), b = 2 + Math.floor(h2 * 11);
        switch (k) {
          case G: if (h < .18) { r(M, a, b, 1, 1); r(M, a + 2, b + 1, 1, 1); } break;
          case TUFT:
            r(M, a, b, 1, 2); r(M, a + 2, b - 1, 1, 3); r(M, a + 4, b, 1, 2);
            if (h2 > .55) { const a2 = 1 + Math.floor(h2 * 9), b2 = 2 + Math.floor(h * 9); r(M, a2, b2, 1, 2); r(M, a2 + 2, b2 - 1, 1, 2); }
            break;
          case PATH:
            r(M, 2 + (ty & 1) * 7, 2, 2, 1); r(M, 11 - (ty & 1) * 6, 6, 1, 1); r(M, 3 + (tx & 1) * 6, 10, 2, 1); r(M, 13, 13, 1, 1); r(M, 7, 14, 1, 1);
            break;
          case SAND:
            for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) if (((i + j) & 1) === 0) r(M, i * 4 + 1 + (j & 1), j * 4 + 1, 1, 1);
            if (h < .07) { r(D, 6, 7, 5, 3); r(L2, 7, 8, 3, 1); }   // shell
            break;
          case SEA:
            r(Mb, 0, 0, 16, 16);
            r(D2, a % 10 + 1, 4, 3, 1); r(D2, a % 10 + 4, 5, 2, 1); r(D2, a % 10, 5, 1, 1);
            r(D2, b % 9 + 3, 11, 3, 1); r(D2, b % 9 + 6, 12, 2, 1); r(D2, b % 9 + 2, 12, 1, 1);
            break;
          case CLIFF:
            r(Mb, 0, 0, 16, 16); r(L, 0, 1, 16, 2); r(L, 1, 7, 3, 1); r(L, 7, 4, 4, 1); r(L, 10, 12, 4, 1);
            r(D2, 0, 0, 16, 1); r(D2, 0, 3, 16, 1); r(D2, 0, 15, 16, 1); r(D2, 0, 6, 16, 1); r(D2, 0, 11, 16, 1);
            r(D2, 5 + (tx & 1) * 4, 7, 1, 4); r(D2, 12 - (tx & 1) * 5, 4, 1, 2); r(D2, 9 - (tx & 1) * 6, 12, 1, 3);
            break;
          case BUSH:
            r(D, 2, 1, 12, 14); r(D, 1, 2, 14, 12); r(M, 3, 2, 10, 12); r(M, 2, 3, 12, 10);
            r(L, 4, 3, 3, 1); r(L, 3, 4, 1, 2);
            for (const [lx, ly] of [[8, 4], [4, 8], [10, 9]]) { r(D2, lx, ly + 1, 3, 1); r(D2, lx + 3, ly, 1, 1); r(L, lx + 1, ly, 2, 1); }
            break;
          case TREE:
            r(D, 4, 1, 24, 26); r(D, 1, 4, 30, 20); r(D, 2, 2, 28, 24);
            r(M, 4, 2, 24, 24); r(M, 2, 4, 28, 20); r(M, 3, 3, 26, 22);
            r(L, 7, 4, 8, 2); r(L, 5, 6, 2, 5);
            for (const [lx, ly] of [[13, 6], [20, 9], [7, 12], [15, 13], [23, 15], [10, 19], [18, 20]]) { r(D2, lx, ly + 1, 3, 1); r(D2, lx + 3, ly, 1, 1); r(L, lx + 1, ly, 2, 1); }
            r(D2, 4, 24, 24, 1);
            r(D, 11, 26, 10, 5); r(M, 12, 26, 8, 4); r(D2, 15, 26, 2, 4); r(K, 13, 31, 6, 1);
            break;
          case SIGN:
            r(D, 7, 9, 2, 6); r(D, 1, 2, 14, 8); r(D, 5, 15, 6, 1); r(L, 2, 3, 12, 6); r(D2, 4, 5, 8, 1); r(D2, 4, 7, 5, 1);
            break;
          case WELL:
            r(D, 2, 3, 12, 11); r(D, 3, 2, 10, 13); r(M, 3, 3, 10, 11);
            r(L, 4, 4, 2, 1); r(L, 9, 4, 2, 1); r(L, 3, 8, 1, 2); r(L, 12, 9, 1, 2); r(L, 6, 13, 3, 1);
            r(D2, 2, 7, 1, 1); r(D2, 13, 6, 1, 1); r(D2, 5, 5, 6, 6); r(K, 6, 7, 4, 3); r(L2, 6, 6, 4, 1);
            break;
          case ROCK:
            r(D, 3, 5, 10, 9); r(D, 4, 4, 8, 11); r(M, 4, 5, 8, 8); r(L, 5, 6, 3, 1); r(L, 5, 7, 1, 2); r(D2, 5, 12, 6, 1); r(D2, 9, 6, 1, 2); r(D2, 10, 8, 1, 2);
            break;
          case TALL:
            for (let i = 0; i < 3; i++) {
              const gx = 1 + i * 5, gy = (i & 1) ? 3 : 8;
              r(M, gx, gy + 1, 1, 4); r(M, gx + 1, gy - 1, 1, 6); r(M, gx + 2, gy + 1, 1, 4); r(M, gx + 3, gy + 2, 1, 2); r(D2, gx, gy + 5, 4, 1);
            }
            break;
          case HOUSE: // 3x3 tiles: striped roof, chimney, light walls, dark doorway, two windows
            r(D, 34, 0, 6, 6); r(M, 35, 1, 4, 5);
            r(D, 4, 3, 40, 4); r(D, 1, 6, 46, 21); r(M, 5, 4, 38, 3); r(M, 2, 7, 44, 19); r(L, 5, 4, 38, 1);
            for (let i = 0; i < 11; i++) r(D2, 4 + i * 4, 6, 1, 20);
            r(K, 1, 26, 46, 2);
            r(D, 3, 28, 42, 19); r(L, 4, 28, 40, 18); r(D, 2, 47, 44, 1);
            r(D2, 19, 33, 10, 14); r(K, 20, 34, 8, 13);
            r(D2, 7, 32, 9, 8); r(D2, 32, 32, 9, 8);
            for (const wx of [8, 33]) { r(L2, wx, 33, 3, 3); r(L2, wx + 4, 33, 3, 3); r(L2, wx, 37, 3, 2); r(L2, wx + 4, 37, 3, 2); }
            break;
          case POND: // 3x2 tiles
            r(D, 6, 1, 36, 30); r(D, 3, 2, 42, 28); r(D, 2, 4, 44, 24); r(D, 1, 7, 46, 18);
            r(M, 6, 2, 36, 28); r(M, 3, 3, 42, 26); r(M, 2, 7, 44, 18); r(L, 2, 3, 1, 4); r(L, 45, 22, 1, 4);
            r(D2, 4, 3, 40, 1); r(D2, 32, 8, 6, 4); r(L2, 33, 9, 3, 2); r(D2, 9, 21, 6, 4); r(L2, 10, 22, 3, 1);
            r(D2, 6, 26, 1, 3); r(D2, 8, 25, 1, 4); r(D2, 41, 4, 1, 3);
            break;
          case FLOW: r(M, 2, 14, 2, 1); r(M, 11, 7, 2, 1); r(M, 6, 1, 1, 1); break;
        }
      }
      c.fillStyle = PAL[2]; c.fill(Mb);
      c.fillStyle = PAL[1]; c.fill(D);
      c.fillStyle = PAL[2]; c.fill(M);
      c.fillStyle = PAL[3]; c.fill(L);
      c.fillStyle = PAL[1]; c.fill(D2);
      c.fillStyle = PAL[3]; c.fill(L2);
      c.fillStyle = PAL[0]; c.fill(K);
    },

    // Animated floor bits (every frame): swaying 2-frame flowers, surf rolling on the shore, wave crests, pond ripples.
    under(Z) {
      const c = Z.ctx, P = Z.P, now = Z.now;
      const Lp = new Path2D(), Dp = new Path2D(), Kp = new Path2D();
      const tx0 = Math.floor((P.x - Z.W / 2) / TW) - 1, tx1 = Math.floor((P.x + Z.W / 2) / TW) + 1;
      const ty0 = Math.floor((P.y - Z.H / 2) / TW) - 2, ty1 = Math.floor((P.y + Z.H / 2) / TW) + 1;
      const ff = Math.floor(now * 2.5) & 1, fy = y => y - 2 * U;
      const R = (p, x, y, w, h) => p.rect(x, y, w * U, h * U);
      for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
        const k = tileAt(Z, tx, ty), X = tx * TW, Y = ty * TW;
        if (k === FLOW) {
          const f = ff ^ ((tx + ty) & 1);
          for (let i = 0; i < 4; i++) {
            const x = X + (i & 1 ? 11 : 4) * U, y = Y + (i & 2 ? 11 : 4) * U;
            const fx = x + (f ? U : 0);   // 2-frame sway: the head leans while the stem stays put
            R(Dp, x, y + 2 * U, 1, 3); R(Dp, x - 2 * U, y + 3 * U, 2, 1); R(Dp, x + U, y + 3 * U, 2, 1);
            R(Dp, fx - 3 * U, fy(y), 7, 3); R(Dp, fx - 2 * U, fy(y) - U, 5, 5); R(Dp, fx - U, fy(y) - 2 * U, 3, 7);
            R(Lp, fx - 2 * U, fy(y) + U, 5, 1); R(Lp, fx - U, fy(y), 3, 3); R(Lp, fx, fy(y) - U, 1, 5);
            R(Kp, fx, fy(y) + U, 1, 1);
          }
        } else if (k === SEA) {
          const h = Z.hash(tx * 7 + 3, ty * 13 - 5), h2 = Z.hash(tx * 3 - 11, ty * 5 + 17);
          const d = Math.round(2 + 1.7 * Math.sin(now * 1.5 + tx * .55));
          if (tileAt(Z, tx, ty - 1) === SAND) {
            R(Lp, X, Y, 16, d + 1); R(Dp, X, Y + (d + 1) * U, 16, 1);
            for (let j = 0; j < 4; j++) R(Lp, X + (j * 4 + 1) * U, Y + (d + 1) * U, 2, 1);
          } else if (tileAt(Z, tx, ty + 1) === SAND) {
            R(Lp, X, Y + TW - (d + 1) * U, 16, d + 1); R(Dp, X, Y + TW - (d + 2) * U, 16, 1);
            for (let j = 0; j < 4; j++) R(Lp, X + (j * 4 + 2) * U, Y + TW - (d + 2) * U, 2, 1);
          } else {
            const off = Math.floor(mod(now * 10 + h * 48, 42) / 3) * 3, wy = Y + (Math.floor(h2 * 10) + 3) * U;
            R(Lp, X + off - 3, wy + U, 1, 1); R(Lp, X + off, wy, 3, 1); R(Lp, X + off + 9, wy + U, 1, 1);
          }
          if ((Math.floor(now * 3 + h * 9) & 3) === 0) R(Lp, X + (1 + Math.floor(h2 * 13)) * U, Y + (6 + Math.floor(h * 4)) * U, 1, 1);
        } else if (k === POND) {
          const h = Z.hash(tx * 7 + 3, ty * 13 - 5);
          for (let i = 0; i < 2; i++) {
            const t = mod(now * .45 + h + i * .5, 1), rx = Math.round(2 + t * 14) * U, ry = Math.round(1 + t * 7) * U;
            const cx = X + 24 * U, cy = Y + 16 * U;
            R(Lp, cx - rx, cy - U, 2, 1); R(Lp, cx + rx - 2 * U, cy - U, 2, 1);
            R(Lp, cx - rx / 2, cy - ry, Math.max(1, Math.round(rx / U)), 1); R(Lp, cx - rx / 2, cy + ry - U, Math.max(1, Math.round(rx / U)), 1);
          }
        }
      }
      c.fillStyle = PAL[1]; c.fill(Dp);
      c.fillStyle = PAL[3]; c.fill(Lp);
      c.fillStyle = PAL[0]; c.fill(Kp);
    },

    ambient(Z) {
      const c = Z.ctx, P = Z.P, now = Z.now;
      // butterflies drifting over the meadow (anchored to a coarse world grid)
      const G2 = 360, gx0 = Math.round(P.x / G2), gy0 = Math.round(P.y / G2);
      for (let gy = gy0 - 1; gy <= gy0 + 1; gy++) for (let gx = gx0 - 2; gx <= gx0 + 2; gx++) {
        const h = Z.hash(gx * 5 + 1, gy * 3 - 2);
        if (h > .45) continue;
        const ph = h * 40;
        const x = snap(gx * G2 + Math.sin(now * .6 + ph) * 90 + Math.sin(now * 1.7 + ph) * 20);
        const y = snap(gy * G2 + Math.cos(now * .45 + ph) * 70 + Math.sin(now * 3.1 + ph) * 8);
        const open = (Math.floor(now * 8 + ph) & 1) === 0;
        c.fillStyle = PAL[1];
        if (open) { c.fillRect(x - 8, y - 5, 16, 7); c.fillRect(x - 6, y + 1, 12, 4); }
        else c.fillRect(x - 4, y - 6, 8, 9);
        c.fillStyle = '#e8f8b0';
        if (open) { c.fillRect(x - 7, y - 4, 5, 5); c.fillRect(x + 2, y - 4, 5, 5); c.fillRect(x - 5, y + 1, 3, 3); c.fillRect(x + 2, y + 1, 3, 3); }
        else { c.fillRect(x - 3, y - 5, 2, 7); c.fillRect(x + 1, y - 5, 2, 7); }
        c.fillStyle = PAL[0]; c.fillRect(x - 1, y - 4, 2, 8);
      }
      // twinkling glints over flower beds
      const tx0 = Math.floor((P.x - Z.W / 2) / TW), tx1 = Math.floor((P.x + Z.W / 2) / TW);
      const ty0 = Math.floor((P.y - Z.H / 2) / TW), ty1 = Math.floor((P.y + Z.H / 2) / TW);
      let n = 0;
      c.fillStyle = '#f0fcc8';
      for (let ty = ty0; ty <= ty1 && n < 10; ty++) for (let tx = tx0; tx <= tx1 && n < 10; tx++) {
        if (tileAt(Z, tx, ty) !== FLOW) continue;
        const h = Z.hash(tx, ty), f = mod(now * .7 + h * 37, 1);
        if (f > .15) continue;
        n++;
        const x = tx * TW + 24, y = ty * TW + 22, s = f < .07 ? 3 : 6;
        c.fillRect(x - 1, y - s, 2, s * 2); c.fillRect(x - s, y - 1, s * 2, 2);
      }
    },

    mix: { squid: 4, boar: 3, jelly: 3, urchin: 1 },

    foes: {
      // Squid critter: short straight 4-way hops, spits a rock along its facing.
      squid: {
        hp: 32, sp: 70, dmg: 8, xp: 3, r: 11, eye: false,
        init(e, Z) { e.st = 'wait'; e.tm = Z.rnd(.2, .9); e.dir = 1; e.fire = Z.rnd(1.2, 3); e.recoil = 0; e.ang = H; },
        update(e, Z) {
          const dt = Z.dt, P = Z.P;
          e.tm -= dt; e.fire -= dt; e.recoil -= dt;
          if (e.st === 'wait') {
            Z.move(e, 0, 0);
            const dx = P.x - e.x, dy = P.y - e.y;
            const aligned = (e.dir === 0 && dx > 0 && Math.abs(dy) < 40) || (e.dir === 2 && dx < 0 && Math.abs(dy) < 40) ||
                            (e.dir === 1 && dy > 0 && Math.abs(dx) < 40) || (e.dir === 3 && dy < 0 && Math.abs(dx) < 40);
            if (e.fire <= 0 && (aligned || e.fire < -2) && Z.dist(e) < 520) {
              Z.shoot(e.x + DX[e.dir] * 10, e.y + DY[e.dir] * 10, e.dir * H, 190, { r: 6, dmg: 7, life: 3.5, col: ROCKC });
              e.fire = Z.rnd(2.6, 3.8); e.recoil = .25;
            }
            if (e.tm <= 0) {
              e.dir = (Z.dist(e) > 420 || Math.random() < .72) ? dirTo(e, P) : Math.floor(Math.random() * 4);
              e.st = 'hop'; e.tm = Z.rnd(.35, .65);
            }
          } else {
            Z.move(e, DX[e.dir] * e.sp, DY[e.dir] * e.sp);
            if (e.tm <= 0) { e.st = 'wait'; e.tm = Z.rnd(.3, .8); }
          }
          e.ang = e.dir * H;
        },
        draw(e, Z, white) {
          const c = Z.ctx, hop = e.st === 'hop';
          const fr = hop ? (Math.floor(e.ph * 9) & 1) : (Math.floor(Z.now * 2 + e.seed) & 1);
          const z = hop ? snap(Math.abs(Math.sin(e.ph * 14)) * 4) : 0;
          const sy = e.recoil > 0 ? 1.12 : 1;
          spr(c, OCT[fr], e.x, e.y - z, 2, white, e.dir * H - H, false, sy);
        },
      },

      // Pig-snouted spear guard: patrols in straight lines, lines up with the hero, braces, then charges.
      boar: {
        hp: 55, sp: 48, dmg: 12, xp: 5, r: 13, eye: false,
        init(e, Z) { e.st = 'patrol'; e.tm = Z.rnd(.6, 2); e.dir = Math.floor(Math.random() * 4); e.cd = Z.rnd(1, 3); e.ang = 0; },
        update(e, Z) {
          const dt = Z.dt, P = Z.P, dx = P.x - e.x, dy = P.y - e.y, d = Z.dist(e);
          e.tm -= dt; e.cd -= dt;
          if (e.st === 'patrol') {
            Z.move(e, DX[e.dir] * e.sp, DY[e.dir] * e.sp);
            if (e.cd <= 0 && d < 340 && (Math.abs(dx) < 28 || Math.abs(dy) < 28)) {
              e.dir = Math.abs(dx) < 28 ? (dy > 0 ? 1 : 3) : (dx > 0 ? 0 : 2);
              e.st = 'aim'; e.tm = .55;
            } else if (e.tm <= 0) {
              e.dir = (d > 380 || Math.random() < .65) ? dirTo(e, P) : (e.dir + (Math.random() < .5 ? 1 : 3)) % 4;
              e.tm = Z.rnd(.8, 1.8);
            }
          } else if (e.st === 'aim') {
            Z.move(e, 0, 0);
            if (e.tm <= 0) { e.st = 'charge'; e.tm = .85; }
          } else if (e.st === 'charge') {
            Z.move(e, DX[e.dir] * 270, DY[e.dir] * 270);
            if (e.tm <= 0) { e.st = 'rest'; e.tm = .7; }
          } else {
            Z.move(e, 0, 0);
            if (e.tm <= 0) { e.st = 'patrol'; e.tm = Z.rnd(.6, 1.4); e.cd = Z.rnd(2.2, 3.4); }
          }
          e.ang = e.dir * H;
        },
        draw(e, Z, white) {
          const c = Z.ctx, st = e.st;
          const rate = st === 'charge' ? 14 : st === 'patrol' ? 6 : 0;
          const fr = rate ? (Math.floor(e.ph * rate) & 1) : 0;
          const jx = st === 'aim' ? (Math.floor(e.ph * 30) & 1) * 2 - 1 : 0;
          const x = e.x + jx, y = e.y;
          // spear (drawn under the body when facing up)
          const spear = () => {
            c.save(); c.translate(Math.round(x), Math.round(y)); c.rotate(e.dir * H);
            const reach = st === 'charge' ? 10 : st === 'aim' ? -4 : 2;
            c.fillStyle = white ? '#ffffff' : PAL[0];
            c.fillRect(-6 + reach, 7, 26, 3);
            c.fillRect(20 + reach, 5, 4, 7); c.fillRect(24 + reach, 6, 3, 5); c.fillRect(27 + reach, 7, 2, 3);
            if (!white) { c.fillStyle = '#f0fcc8'; c.fillRect(21 + reach, 7, 4, 2); }
            c.restore();
          };
          if (e.dir === 3) spear();
          if (e.dir === 1) spr(c, MOB_DOWN, x, y, 2, white, 0, fr === 1);
          else if (e.dir === 3) spr(c, MOB_UP, x, y, 2, white, 0, fr === 1);
          else spr(c, MOB_SIDE[fr], x, y, 2, white, 0, e.dir === 2);
          if (e.dir !== 3) spear();
          if (st === 'aim') { // "!" alert bubble
            c.fillStyle = white ? '#ffffff' : PAL[0];
            c.fillRect(Math.round(x) - 2, Math.round(y) - 30, 4, 9); c.fillRect(Math.round(x) - 2, Math.round(y) - 19, 4, 3);
          }
        },
      },

      // Jelly blob: wobbles, then hops at the hero. Splits into two small blobs on death.
      jelly: {
        hp: 24, sp: 190, dmg: 7, xp: 2, r: 11, eye: false,
        init(e, Z) { e.st = 'wait'; e.tm = Z.rnd(.3, 1.1); e.ha = 0; e.z = 0; e.ang = 0; },
        update(e, Z) {
          e.tm -= Z.dt;
          if (e.st === 'wait') {
            Z.move(e, 0, 0); e.z = 0;
            if (e.tm <= 0) { e.st = 'hop'; e.tm = .42; e.ha = Z.angTo(e) + Z.rnd(-.35, .35); }
          } else {
            Z.move(e, Math.cos(e.ha) * e.sp, Math.sin(e.ha) * e.sp);
            e.z = Math.sin(Math.max(0, e.tm) / .42 * Math.PI) * 14;
            if (e.tm <= 0) { e.st = 'wait'; e.tm = Z.rnd(.5, 1.1); e.z = 0; }
          }
          e.ang = e.ha;
        },
        draw(e, Z, white) {
          const c = Z.ctx, wob = e.st === 'wait' && (Math.floor(Z.now * 5 + e.seed) & 1);
          spr(c, BLOB, e.x, e.y - snap(e.z) - (wob ? 1 : 0), 2, white, 0, false, wob ? .86 : (e.st === 'hop' ? 1.12 : 1));
        },
        death(e, Z) {
          for (let i = 0; i < 2; i++) {
            const g = Z.spawn('jellet', e.x + (i ? 9 : -9), e.y);
            if (g) { g.tm = .15 + i * .2; }
          }
        },
      },
      // Small split blob (spawned only from blob deaths and the boss).
      jellet: {
        hp: 7, sp: 230, dmg: 4, xp: 1, r: 6, eye: false,
        init(e, Z) { e.st = 'wait'; e.tm = Z.rnd(.2, .6); e.ha = 0; e.z = 0; e.ang = 0; },
        update(e, Z) {
          e.tm -= Z.dt;
          if (e.st === 'wait') {
            Z.move(e, 0, 0); e.z = 0;
            if (e.tm <= 0) { e.st = 'hop'; e.tm = .3; e.ha = Z.angTo(e) + Z.rnd(-.4, .4); }
          } else {
            Z.move(e, Math.cos(e.ha) * e.sp, Math.sin(e.ha) * e.sp);
            e.z = Math.sin(Math.max(0, e.tm) / .3 * Math.PI) * 8;
            if (e.tm <= 0) { e.st = 'wait'; e.tm = Z.rnd(.3, .7); e.z = 0; }
          }
          e.ang = e.ha;
        },
        draw(e, Z, white) {
          const c = Z.ctx, wob = e.st === 'wait' && (Math.floor(Z.now * 7 + e.seed) & 1);
          spr(c, GEL, e.x, e.y - snap(e.z), 2, white, 0, false, wob ? .84 : 1);
        },
      },

      // Spiky sea urchin: slow wobbling drift, bristles, hurts on touch. Heavy.
      urchin: {
        hp: 90, sp: 24, dmg: 14, xp: 6, r: 15, heavy: true, eye: false,
        update(e, Z) {
          const a = Z.angTo(e) + Math.sin(e.ph * .8 + e.seed) * .7;
          const sp = e.sp * (Z.dist(e) > 600 ? 3 : 1);
          Z.move(e, Math.cos(a) * sp, Math.sin(a) * sp);
          e.ang = a;
        },
        draw(e, Z, white) {
          const c = Z.ctx, fr = Math.floor(Z.now * 2.5 + e.seed) & 1;
          spr(c, URCH[fr], e.x, e.y, 2, white);
        },
      },
    },

    // Giant segmented sand worm: loops, charges, burrows and spits rock fans.
    boss: {
      name: 'Grumbletide the Coilmaw',
      hp: 3600, sp: 70, dmg: 22, xp: 0, r: 34, heavy: true, eye: false,
      init(e, Z) {
        e.trail = []; for (let i = 0; i < 80; i++) e.trail.push(e.x, e.y);
        e.hd = Z.angTo(e); e.mode = 'roam'; e.mt = 2.5; e.cyc = 0; e.under = false; e.dn = 0; e.sn = 0;
        e.baseDmg = e.dmg; e.ex = e.x; e.ey = e.y; e.marked = false; e.ang = e.hd;
        Z.banner('Grumbletide the Coilmaw', '#9bbc0f', true); Z.sfx('boss'); Z.shake(6);
      },
      update(e, Z) {
        const dt = Z.dt, P = Z.P, toH = Z.angTo(e);
        const turn = (target, rate) => {
          let d = target - e.hd; d = Math.atan2(Math.sin(d), Math.cos(d));
          e.hd += Math.max(-rate * dt, Math.min(rate * dt, d));
        };
        const go = sp => Z.move(e, Math.cos(e.hd) * sp, Math.sin(e.hd) * sp);
        e.mt -= dt;
        const next = () => {
          const seq = ['charge', 'spit', 'dive', 'summon'];
          const m = seq[e.cyc++ % 4];
          if (m === 'charge') { e.mode = 'tele'; e.mt = .8; e.dn = 3; Z.sfx('charge'); }
          else if (m === 'spit') { e.mode = 'spit'; e.mt = .6; e.sn = 3; }
          else if (m === 'dive') { e.mode = 'dive'; e.mt = .7; Z.sfx('warn'); }
          else { e.mode = 'summon'; e.mt = 1.1; e.sn = 1; }
        };
        switch (e.mode) {
          case 'roam': {
            const far = Z.dist(e) > 520;
            turn(toH + (far ? 0 : Math.sin(e.ph * 1.2) * 1.3), far ? 3 : 1.9);
            go(e.sp * (far ? 2.2 : 1));
            if (e.mt <= 0) next();
            break;
          }
          case 'tele': turn(toH, 6); go(8); if (e.mt <= 0) { e.mode = 'dash'; e.mt = .8; Z.shake(3); } break;
          case 'dash':
            turn(toH, 1.25); go(320);
            if (e.mt <= 0) { if (--e.dn > 0) { e.mode = 'tele'; e.mt = .5; Z.sfx('charge'); } else { e.mode = 'roam'; e.mt = Z.rnd(2, 3); } }
            break;
          case 'spit':
            turn(toH, 3); go(20);
            if (e.mt <= 0) {
              const n = 7, spread = .95;
              for (let i = 0; i < n; i++) Z.shoot(e.x + Math.cos(e.hd) * 30, e.y + Math.sin(e.hd) * 30, toH - spread / 2 + spread * i / (n - 1) + (e.sn & 1) * .07, 175, { r: 7, dmg: 9, life: 4, col: ROCKC });
              Z.sfx('shoot');
              if (--e.sn > 0) e.mt = .55; else { e.mode = 'roam'; e.mt = Z.rnd(2, 3); }
            }
            break;
          case 'dive':
            go(30);
            if (e.mt <= 0) { e.mode = 'under'; e.mt = 2.3; e.under = true; e.dmg = 0; e.marked = false; Z.burst(e.x, e.y, '#8bac0f', 18, 140); }
            break;
          case 'under':
            turn(toH, 4); go(Z.dist(e) > 60 ? 175 : 0);
            if (!e.marked && e.mt < 1.05) {
              e.marked = true; e.ex = P.x; e.ey = P.y;
              Z.hazard(e.ex, e.ey, { r: 95, t: 1.0, dmg: 20, col: '15,56,15' }); Z.sfx('warn');
            }
            if (e.mt <= 0) {
              e.x = e.ex; e.y = e.ey; e.under = false; e.dmg = e.baseDmg;
              for (let i = 0; i < e.trail.length; i += 2) { e.trail[i] = e.x; e.trail[i + 1] = e.y; }
              Z.ring(e.x, e.y, 14, 160, { r: 7, dmg: 9, life: 3.5, col: ROCKC }, e.ph);
              Z.burst(e.x, e.y, '#306230', 30, 220); Z.shake(9); Z.sfx('nova');
              e.mode = 'roam'; e.mt = Z.rnd(2, 3);
            }
            break;
          case 'summon':
            turn(toH, 2); go(15);
            if (e.sn > 0 && e.mt < .6) {
              e.sn = 0;
              for (let i = 0; i < 4; i++) { const a = e.hd + i * H + H / 2; Z.spawn(i & 1 ? 'jelly' : 'jellet', e.x + Math.cos(a) * 70, e.y + Math.sin(a) * 70); }
              Z.sfx('star'); Z.burst(e.x, e.y, '#9bbc0f', 14, 120);
            }
            if (e.mt <= 0) { e.mode = 'roam'; e.mt = Z.rnd(2, 3); }
            break;
          default: e.mode = 'roam'; e.mt = 2;
        }
        if (!Number.isFinite(e.hd)) e.hd = 0;
        e.ang = e.hd;
        // body trail: record head positions every ~4px
        const T = e.trail, lx = T[T.length - 2], ly = T[T.length - 1];
        if (Math.hypot(e.x - lx, e.y - ly) >= 4) { T.push(e.x, e.y); if (T.length > 160) T.splice(0, 2); }
      },
      draw(e, Z, white) {
        const c = Z.ctx, T = e.trail || [], N = 8, gap = 7;
        if (e.under) {
          // burrowing: a churning dirt mound and a faint ghost of the head
          const fr = Math.floor(Z.now * 10) & 1;
          spr(c, MOUND, e.x + (fr ? 2 : -2), e.y + 10, 4, white, 0, false, 1, BOSS);
          c.save(); c.globalAlpha = .3;
          spr(c, HEAD[0], e.x, e.y, 4, white, Math.round((e.hd - H) / (H / 2)) * (H / 2), false, 1, BOSS);
          c.restore();
          return;
        }
        const len = T.length / 2;
        for (let i = N; i >= 1; i--) {
          const k = Math.max(0, len - 1 - i * gap) * 2;
          const x = T[k] !== undefined ? T[k] : e.x, y = T[k + 1] !== undefined ? T[k + 1] : e.y;
          const bob = (Math.floor(Z.now * 6 + i) & 1) ? 2 : 0;
          if (i === N) spr(c, TAIL, x, y - bob, 4, white, 0, false, 1, BOSS);
          else spr(c, SEG, x, y - bob, i > N - 3 ? 3 : 4, white, 0, false, 1, BOSS);
        }
        const open = e.mode === 'spit' || e.mode === 'summon' || e.mode === 'dash' || (Math.floor(Z.now * 4) & 1);
        const jit = e.mode === 'tele' ? ((Math.floor(e.ph * 30) & 1) ? 2 : -2) : 0;
        if (e.mode === 'tele' && !white) { // charge telegraph: dotted line along the aim
          const dk = new Path2D(), lt = new Path2D();
          for (let i = 2; i < 12; i++) { const d = i * 24, px = snap(e.x + Math.cos(e.hd) * d), py = snap(e.y + Math.sin(e.hd) * d); dk.rect(px - 5, py - 5, 10, 10); lt.rect(px - 2, py - 2, 4, 4); }
          c.fillStyle = PAL[0]; c.fill(dk); c.fillStyle = '#f0fcc8'; c.fill(lt);
        }
        spr(c, HEAD[open ? 1 : 0], e.x + jit, e.y, 4, white, Math.round((e.hd - H) / (H / 2)) * (H / 2), false, 1, BOSS);
      },
    },

    events: [
      { t: 25, run(Z) {
        Z.banner('The tide washes in urchins!', '#9bbc0f', false); Z.sfx('warn');
        for (let i = 0; i < 8; i++) { const a = i / 8 * Z.TAU; Z.spawn('urchin', Z.P.x + Math.cos(a) * 330, Z.P.y + Math.sin(a) * 330); }
      } },
      { t: 62, run(Z) {
        Z.banner('A spear patrol marches in', '#9bbc0f', false);
        const side = Math.random() < .5 ? -1 : 1;
        for (let i = 0; i < 6; i++) { const m = Z.spawn('boar', Z.P.x + side * 420, Z.P.y + (i - 2.5) * 46); if (m) { m.dir = side > 0 ? 2 : 0; m.tm = 2; } }
      } },
      { t: 90, run(Z) {
        Z.banner('A wobbling horde of jellies!', '#9bbc0f', true); Z.sfx('warn');
        const a0 = Z.rnd(0, Z.TAU);
        for (let i = 0; i < 10; i++) {
          const a = a0 + (i % 5 - 2) * .22, d = 380 + Math.floor(i / 5) * 50;
          Z.spawn('jelly', Z.P.x + Math.cos(a) * d, Z.P.y + Math.sin(a) * d);
        }
      } },
      { t: 120, run(Z) {
        Z.banner('Squid critters surround you', '#9bbc0f', false);
        for (let i = 0; i < 8; i++) { const a = i / 8 * Z.TAU + .2; Z.spawn('squid', Z.P.x + Math.cos(a) * 360, Z.P.y + Math.sin(a) * 360); }
      } },
    ],

    music: {
      bpm: BPM, div: 4,
      step(s, t, A) {
        const b = s % 16, bar = Math.floor(s / 16);
        if (!A.boss) {
          // Cheerful island overworld in C major.
          const i = bar % 16, ch = OW_CH[i], R = 60;
          for (const n of OW_MEL[i]) if (n[0] === b) {
            const len = n[2];
            A.tone(t, R + 12 + deg(MAJ, n[1]), len * SL * .85, .045, { type: 'square', vib: len >= 4 ? .35 : 0, cutoff: 3400, pan: -.12 });
          }
          if (b % 2 === 0 || A.inten > .6) {
            const k = (b >> 1) % 3;
            A.tone(t, R + ch[k] + (b >= 8 ? 12 : 0), SL * .8, .017, { type: 'square', decay: true, cutoff: 2400, pan: .35 });
          }
          const BP = { 0: 0, 4: 12, 6: 7, 8: 0, 12: 12, 14: 7 };
          if (BP[b] !== undefined) A.tone(t, 36 + ch[0] + BP[b], SL * 1.6, .07, { type: 'triangle' });
          if (b % 2 === 0) hatN(A, t, b % 4 === 2 ? .035 : .022);
          if (b === 4 || b === 12) snareN(A, t, .07);
          if (b === 0 || b === 8 || b === 10) kickT(A, t, .09);
          if (i === 15 && b >= 12) snareN(A, t, .04 + (b - 12) * .01);
        } else {
          // Driving minor boss chiptune in A harmonic minor.
          const i = bar % 8, ch = BS_CH[i], R = 57, tones = [ch[0], ch[1], ch[2], ch[0] + 12];
          for (const n of BS_MEL[i]) if (n[0] === b) {
            const len = n[2];
            A.tone(t, R + 12 + deg(HMIN, n[1]), len * SL * .85, .05, { type: 'square', vib: len >= 4 ? .4 : 0, cutoff: 3800, pan: -.1 });
          }
          A.tone(t, R + 12 + tones[ARP[b % 6]] + (bar & 1 ? 12 : 0), SL * .7, .02, { type: 'square', decay: true, cutoff: 2800, pan: .35 });
          if (b % 2 === 0) A.tone(t, 33 + ch[0] + (b % 4 === 2 ? 12 : 0), SL * 1.7, .075, { type: 'triangle' });
          hatN(A, t, b % 2 ? .02 : .036);
          if (b === 4 || b === 12) snareN(A, t, .085);
          if (b === 0 || b === 6 || b === 8 || b === 11) kickT(A, t, .1);
          if (i === 7 && b >= 12) snareN(A, t, .05);
        }
      },
    },
  };
})());
