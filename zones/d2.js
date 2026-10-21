// Zone d2: a descent through torchlit catacombs into the burning undercroft. A nod to Diablo II.
ZONES.push((() => {
  const TAU = Math.PI * 2;
  const W = (white, c) => white ? '#fff' : c;

  // Recent imp deaths, so an ashen count (vampire) can raise them. Entries expire by age (cache only).
  const corpses = [];

  // ---------- Isometric helpers (2:1 diamonds) ----------
  const TW = 96, TH = 48, HX = TW / 2, HY = TH / 2, AX = .894, AY = .447;
  // (a, b) are iso floor axes: a runs down-right, b runs down-left; h lifts straight up.
  const iso = (x, y, a, b, h = 0) => [x + (a - b) * AX, y + (a + b) * AY - h];
  const R = (w, d) => [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]];
  const CIRC = (r, n = 10) => { const o = []; for (let i = 0; i < n; i++) o.push([Math.cos(i / n * TAU) * r, Math.sin(i / n * TAU) * r]); return o; };
  const dia = (p, cx, cy, hx, hy) => { p.moveTo(cx, cy - hy); p.lineTo(cx + hx, cy); p.lineTo(cx, cy + hy); p.lineTo(cx - hx, cy); p.closePath(); };
  const STONE = { t: '#5b534a', l: '#4a433b', m: '#413b34', r: '#302b26', o: '#14100d' };
  const LID = { t: '#665d52', l: '#544c43', m: '#4a433b', r: '#37312b', o: '#14100d' };
  const DARKST = { t: '#433d36', l: '#3a342e', m: '#332e29', r: '#27231f', o: '#110e0b' };
  const WALL = { t: '#5e574d', l: '#4b443c', m: '#433d36', r: '#2f2a25', o: '#120f0c' };
  const IRON = { t: '#3a3430', l: '#2c2724', m: '#25211e', r: '#1b1816', o: '#0a0807' };

  // Extruded convex polygon in iso space (pts are [a, b]); shades each visible side by facing.
  const prism = (c, x, y, pts, z0, h, P) => {
    const n = pts.length, B = [], T = [];
    let mx = 0, my = 0;
    for (let i = 0; i < n; i++) { const b = iso(x, y, pts[i][0], pts[i][1], z0); B.push(b); T.push([b[0], b[1] - h]); mx += b[0] / n; my += b[1] / n; }
    c.strokeStyle = P.o; c.lineWidth = 1.3; c.lineJoin = 'round';
    for (let i = 0; i < n; i++) {
      const p = B[i], q = B[(i + 1) % n];
      let nx = q[1] - p[1], ny = p[0] - q[0];
      if (nx * ((p[0] + q[0]) / 2 - mx) + ny * ((p[1] + q[1]) / 2 - my) < 0) { nx = -nx; ny = -ny; }
      if (ny <= 0) continue;
      const k = nx / (Math.hypot(nx, ny) || 1);
      c.fillStyle = k < -.35 ? P.l : k > .35 ? P.r : P.m;
      c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.lineTo(q[0], q[1] - h); c.lineTo(p[0], p[1] - h); c.closePath(); c.fill(); c.stroke();
    }
    c.fillStyle = P.t; c.beginPath();
    for (let i = 0; i < n; i++) i ? c.lineTo(T[i][0], T[i][1]) : c.moveTo(T[i][0], T[i][1]);
    c.closePath(); c.fill(); c.stroke();
  };
  const shadow = (c, x, y, rx, ry, a = .32) => { c.fillStyle = `rgba(6,4,3,${a})`; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); };
  const pool = (c, x, y, r, a) => { // warm light baked under fires
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,140,60,${a})`); g.addColorStop(1, 'rgba(255,120,40,0)');
    c.save(); c.translate(x, y); c.scale(1, .5); c.translate(-x, -y); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
  };

  // ---------- Set-pieces: one per 400 px macro cell, deterministic so ground() and ambient() agree ----------
  const M = 400;
  const SARC = 1, COFFIN = 2, BRAZIER = 3, TORCH = 4, BONES = 5, BLOOD = 6, SEAL = 7, PILLAR = 8, WALLS = 9;
  const piece = (Z, mx, my) => {
    const h = Z.hash(mx * 3 + 11, my * 5 - 7);
    const x = mx * M + M / 2 + (Z.hash(mx * 13 - 1, my * 7 + 4) - .5) * 130;
    const y = my * M + M / 2 + (Z.hash(mx * 17 + 5, my * 11 - 3) - .5) * 130;
    const v = Z.hash(mx * 29 + 2, my * 23 + 9), w = Z.hash(mx * 5 + 1, my * 3 + 8);
    let k = 0;
    if (h < .09) k = SARC; else if (h < .15) k = COFFIN; else if (h < .25) k = BRAZIER; else if (h < .32) k = TORCH;
    else if (h < .41) k = BONES; else if (h < .49) k = BLOOD; else if (h < .53) k = SEAL; else if (h < .60) k = PILLAR; else if (h < .73) k = WALLS;
    return { k, x, y, v, w, mx, my };
  };
  // Catacomb corridor: two broken parallel walls of stone blocks along one iso axis.
  const wallBlocks = (Z, p) => {
    const out = [], alongA = p.v < .5, n = 4 + ((p.w * 9) | 0) % 3, D = 116, BW = 36;
    for (const side of [-1, 1]) for (let i = 0; i < n; i++) {
      const hh = Z.hash(p.mx * 41 + i * 7 + side * 3, p.my * 37 - i * 5 + side);
      const t = (i - (n - 1) / 2) * BW + (side > 0 ? BW * .5 : 0), end = i === 0 || i === n - 1;
      const a = alongA ? t : side * D, b = alongA ? side * D : t;
      if (hh < .16) { out.push({ a, b, gap: true, hh }); continue; }
      const H = (20 + hh * 34) * (end ? .55 : 1);
      out.push({ a, b, H, hh, w: alongA ? BW - 2 : 26, d: alongA ? 26 : BW - 2, torch: side < 0 && !end && hh > .78 });
    }
    out.sort((q, r) => (q.a + q.b) - (r.a + r.b));
    return { blocks: out, alongA };
  };
  // Light sources of a piece: { x, y, kind } (fire / torch / candle).
  const lights = (Z, p) => {
    const L = [];
    if (p.k === BRAZIER) L.push({ x: p.x, y: p.y - 27, kind: 0 });
    else if (p.k === TORCH) {
      if (p.v < .45) for (const s of [-1, 1]) { const q = iso(p.x, p.y, p.w < .5 ? s * 62 : 0, p.w < .5 ? 0 : s * 62); L.push({ x: q[0], y: q[1] - 66, kind: 1 }); }
      else L.push({ x: p.x, y: p.y - 66, kind: 1 });
    } else if (p.k === SARC) {
      const along = p.v < .5;
      for (const s of [-1, 1]) { const q = along ? iso(p.x, p.y, -56, s * 16) : iso(p.x, p.y, s * 16, -56); L.push({ x: q[0], y: q[1] - 9, kind: 2 }); }
    } else if (p.k === SEAL) {
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5; L.push({ x: p.x + Math.cos(a) * 92, y: p.y + Math.sin(a) * 46 - 9, kind: 2 }); }
    } else if (p.k === WALLS) {
      const { blocks, alongA } = wallBlocks(Z, p);
      for (const B of blocks) if (B.torch) {
        const q = alongA ? iso(p.x, p.y, B.a, B.b + 15, B.H * .6) : iso(p.x, p.y, B.a + 15, B.b, B.H * .6);
        L.push({ x: q[0], y: q[1] - 8, kind: 1 });
      }
    }
    return L;
  };

  // ---------- Set-piece drawing (ground only, static) ----------
  const candle = (c, x, y) => { // y = flame base
    c.fillStyle = '#d8ccaa'; c.strokeStyle = '#14100d'; c.lineWidth = 1;
    c.beginPath(); c.ellipse(x, y + 9, 4.5, 2.2, 0, 0, TAU); c.fill(); c.fillRect(x - 1.8, y + 1, 3.6, 8); c.strokeRect(x - 1.8, y + 1, 3.6, 8);
  };
  const drawSarc = (c, Z, p) => {
    const along = p.v < .5, Lg = 82, Wd = 36, ajar = p.w < .4, dims = (l, w) => along ? R(l, w) : R(w, l);
    shadow(c, p.x, p.y + 6, 70, 34);
    prism(c, p.x, p.y, dims(Lg + 12, Wd + 12), 0, 4, DARKST);
    prism(c, p.x, p.y, dims(Lg, Wd), 4, 20, ajar ? { ...STONE, t: '#0c0907' } : STONE);
    const off = ajar ? 20 : 0, [lx, ly] = iso(p.x, p.y, along ? off : off * .5, along ? off * .5 : off);
    prism(c, lx, ly, dims(Lg + 4, Wd + 4), 24, 6, LID);
    // carved cross on the lid
    const cr = new Path2D(), z = 30, P = (a, b) => { const q = along ? iso(lx, ly, a, b, z) : iso(lx, ly, b, a, z); return q; };
    let q = P(-Lg * .36, 0); cr.moveTo(q[0], q[1]); q = P(Lg * .36, 0); cr.lineTo(q[0], q[1]);
    q = P(-Lg * .18, -Wd * .3); cr.moveTo(q[0], q[1]); q = P(-Lg * .18, Wd * .3); cr.lineTo(q[0], q[1]);
    c.strokeStyle = '#2a2520'; c.lineWidth = 3; c.stroke(cr); c.strokeStyle = '#776d60'; c.lineWidth = 1; c.save(); c.translate(.8, .8); c.stroke(cr); c.restore();
    for (const l of lights(Z, p)) candle(c, l.x, l.y);
  };
  const COF = [[-34, -6], [-22, -13], [32, -8], [32, 8], [-22, 13], [-34, 6]];
  const drawCoffin = (c, Z, p) => {
    const along = p.v < .5, n = p.w < .5 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const o = (i - (n - 1) / 2) * 34, [x, y] = along ? iso(p.x, p.y, 0, o) : iso(p.x, p.y, o, 0);
      const pts = COF.map(([a, b]) => along ? [a, b] : [b, a]);
      shadow(c, x, y + 4, 42, 20, .28);
      prism(c, x, y, pts, 0, 10, i ? DARKST : STONE);
      const cr = new Path2D(), P = (a, b) => along ? iso(x, y, a, b, 10) : iso(x, y, b, a, 10);
      let q = P(-24, 0); cr.moveTo(q[0], q[1]); q = P(22, 0); cr.lineTo(q[0], q[1]);
      q = P(-12, -7); cr.moveTo(q[0], q[1]); q = P(-12, 7); cr.lineTo(q[0], q[1]);
      c.strokeStyle = '#221d19'; c.lineWidth = 2.4; c.stroke(cr);
    }
  };
  const drawBrazier = (c, Z, p) => {
    const x = p.x, y = p.y;
    pool(c, x, y, 150, .2); shadow(c, x, y + 2, 24, 11);
    const legs = new Path2D();
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + .5, f = iso(x, y, Math.cos(a) * 15, Math.sin(a) * 15); legs.moveTo(x, y - 20); legs.lineTo(f[0], f[1]); }
    c.lineCap = 'round'; c.strokeStyle = '#0a0807'; c.lineWidth = 5; c.stroke(legs); c.strokeStyle = '#4a423b'; c.lineWidth = 2; c.stroke(legs);
    c.strokeStyle = '#0a0807'; c.lineWidth = 2;
    c.fillStyle = '#2c2622'; c.beginPath(); c.ellipse(x, y - 25, 18, 13, 0, 0, Math.PI); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#5a4a3a'; c.beginPath(); c.ellipse(x, y - 25, 18, 7, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#4a1508'; c.beginPath(); c.ellipse(x, y - 25, 14, 5, 0, 0, TAU); c.fill();
    c.fillStyle = '#c2501a'; for (let i = 0; i < 5; i++) c.fillRect(x - 9 + i * 4, y - 27 + (i % 2) * 2.5, 2.5, 2);
    c.lineCap = 'butt';
  };
  const drawTorch = (c, Z, p) => {
    for (const l of lights(Z, p)) {
      const x = l.x, y = l.y + 66;
      pool(c, x, y, 120, .17); shadow(c, x, y + 2, 14, 7);
      prism(c, x, y, R(14, 14), 0, 6, IRON);
      c.lineCap = 'round'; c.strokeStyle = '#0a0807'; c.lineWidth = 5.5; c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x, y - 60); c.stroke();
      c.strokeStyle = '#4c443c'; c.lineWidth = 2; c.stroke(); c.lineCap = 'butt';
      c.fillStyle = '#2c2622'; c.strokeStyle = '#0a0807'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(x - 7, y - 66); c.lineTo(x + 7, y - 66); c.lineTo(x + 3, y - 58); c.lineTo(x - 3, y - 58); c.closePath(); c.fill(); c.stroke();
    }
  };
  const drawBones = (c, Z, p) => {
    c.fillStyle = '#29241f'; c.beginPath(); c.ellipse(p.x, p.y, 46, 22, 0, 0, TAU); c.fill();
    const bp = new Path2D(), kn = new Path2D(), sk = new Path2D(), so = new Path2D();
    for (let i = 0; i < 22; i++) {
      const a = (Z.hash(p.mx * 31 + i, p.my * 17 - i) - .5) * 64, b = (Z.hash(p.mx * 7 - i * 3, p.my * 29 + i * 5) - .5) * 64, r3 = Z.hash(i * 13 + p.mx, p.my * 3 + i);
      const d = Math.hypot(a, b); if (d > 32) continue;
      const [bx, by] = iso(p.x, p.y, a, b, (1 - d / 32) * 10), ang = r3 * TAU, L = 5 + r3 * 6, dx = Math.cos(ang) * L, dy = Math.sin(ang) * L * .6;
      bp.moveTo(bx - dx, by - dy); bp.lineTo(bx + dx, by + dy);
      kn.moveTo(bx - dx + 2, by - dy); kn.arc(bx - dx, by - dy, 2, 0, TAU); kn.moveTo(bx + dx + 2, by + dy); kn.arc(bx + dx, by + dy, 2, 0, TAU);
    }
    for (let i = 0; i < 3; i++) {
      const a = (Z.hash(p.mx + i * 9, p.my - i * 4) - .5) * 30, b = (Z.hash(p.mx * 3 - i, p.my * 9 + i) - .5) * 30, [sx, sy] = iso(p.x, p.y, a, b, 8);
      sk.moveTo(sx + 5.5, sy); sk.arc(sx, sy, 5.5, 0, TAU); sk.rect(sx - 3.5, sy + 3, 7, 4);
      so.rect(sx - 3.5, sy - 1.5, 2.6, 2.6); so.rect(sx + 1, sy - 1.5, 2.6, 2.6); so.rect(sx - .6, sy + 2, 1.2, 1.6);
    }
    c.lineCap = 'round'; c.strokeStyle = '#100d0a'; c.lineWidth = 5; c.stroke(bp); c.strokeStyle = '#8a8170'; c.lineWidth = 2.6; c.stroke(bp);
    c.fillStyle = '#958c78'; c.fill(kn);
    c.strokeStyle = '#100d0a'; c.lineWidth = 2.5; c.stroke(sk); c.fillStyle = '#a0977f'; c.fill(sk); c.fillStyle = '#17110d'; c.fill(so);
    c.lineCap = 'butt';
  };
  const drawBlood = (c, Z, p) => {
    const pl = new Path2D(), dk = new Path2D(), dr = new Path2D(), sm = new Path2D();
    for (let i = 0; i < 6; i++) {
      const ox = (Z.hash(p.mx * 3 + i, p.my) - .5) * 70, oy = (Z.hash(p.mx, p.my * 3 + i) - .5) * 28, rx = 14 + Z.hash(i, p.mx + p.my) * 22;
      pl.moveTo(p.x + ox + rx, p.y + oy); pl.ellipse(p.x + ox, p.y + oy, rx, rx * .5, 0, 0, TAU);
      if (i < 3) { dk.moveTo(p.x + ox + rx * .55, p.y + oy); dk.ellipse(p.x + ox, p.y + oy, rx * .55, rx * .27, 0, 0, TAU); }
    }
    for (let i = 0; i < 10; i++) {
      const a = Z.hash(p.mx * 9 + i, p.my * 2 - i) * TAU, d = 50 + Z.hash(i, p.my * 7) * 40, r = 1.5 + Z.hash(p.mx, i * 3) * 3;
      const x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d * .5;
      dr.moveTo(x + r, y); dr.ellipse(x, y, r, r * .55, 0, 0, TAU);
    }
    const sa = p.v * TAU; sm.moveTo(p.x, p.y); sm.quadraticCurveTo(p.x + Math.cos(sa) * 60, p.y + Math.sin(sa) * 18 + 10, p.x + Math.cos(sa) * 110, p.y + Math.sin(sa) * 45);
    c.lineCap = 'round'; c.strokeStyle = '#330908'; c.lineWidth = 7; c.stroke(sm); c.lineCap = 'butt';
    c.fillStyle = '#3e0b09'; c.fill(pl); c.fill(dr); c.fillStyle = '#270505'; c.fill(dk);
    c.fillStyle = 'rgba(160,50,40,.3)'; c.beginPath(); c.ellipse(p.x - 8, p.y - 4, 12, 3, -.15, 0, TAU); c.fill();
  };
  const drawSeal = (c, Z, p) => {
    const Rr = 84;
    c.save(); c.translate(p.x, p.y); c.scale(1, .5);
    const g = c.createRadialGradient(0, 0, 10, 0, 0, Rr + 20);
    g.addColorStop(0, 'rgba(70,14,10,.35)'); g.addColorStop(1, 'rgba(40,8,6,0)');
    c.fillStyle = g; c.fillRect(-Rr - 20, -Rr - 20, Rr * 2 + 40, Rr * 2 + 40);
    const gr = new Path2D(), tick = new Path2D();
    gr.arc(0, 0, Rr, 0, TAU); gr.moveTo(Rr - 14, 0); gr.arc(0, 0, Rr - 14, 0, TAU);
    for (let i = 0; i < 5; i++) {
      const a1 = -Math.PI / 2 + i * TAU / 5, a2 = a1 + TAU * 2 / 5;
      gr.moveTo(Math.cos(a1) * (Rr - 14), Math.sin(a1) * (Rr - 14)); gr.lineTo(Math.cos(a2) * (Rr - 14), Math.sin(a2) * (Rr - 14));
    }
    for (let i = 0; i < 20; i++) {
      const a = i / 20 * TAU + .1, r1 = Rr - 10, r2 = Rr - 4, k = i % 3;
      tick.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); tick.lineTo(Math.cos(a + (k - 1) * .05) * r2, Math.sin(a + (k - 1) * .05) * r2);
    }
    c.strokeStyle = '#120d0a'; c.lineWidth = 7; c.stroke(gr);
    c.strokeStyle = '#561510'; c.lineWidth = 2.6; c.stroke(gr);
    c.strokeStyle = '#2a1a14'; c.lineWidth = 2; c.stroke(tick);
    c.restore();
    for (const l of lights(Z, p)) candle(c, l.x, l.y);
  };
  const drawPillar = (c, Z, p) => {
    const H = 30 + p.v * 56;
    shadow(c, p.x + 10, p.y + 8, 52, 24);
    prism(c, p.x, p.y, R(52, 52), 0, 10, DARKST);
    prism(c, p.x, p.y, CIRC(18, 10), 10, H, STONE);
    // broken jagged cap
    const cap = CIRC(16, 6).map(([a, b], i) => [a * (.6 + Z.hash(p.mx + i, p.my) * .4), b * (.6 + Z.hash(p.mx, p.my + i) * .4)]);
    prism(c, p.x + 2, p.y, cap, 10 + H, 5 + p.w * 7, LID);
    // tumbled drum and rubble
    const [dx, dy] = iso(p.x, p.y, 46 * (p.w < .5 ? 1 : -.2), 40 * (p.w < .5 ? -.1 : 1));
    shadow(c, dx, dy + 3, 24, 11, .25);
    prism(c, dx, dy, CIRC(15, 10), 0, 13, STONE);
    for (let i = 0; i < 4; i++) {
      const a = (Z.hash(p.mx * 3 + i, p.my * 5) - .5) * 100, b = (Z.hash(p.mx * 5, p.my * 3 + i) - .5) * 100;
      if (Math.abs(a) < 30 && Math.abs(b) < 30) continue;
      const s = 6 + Z.hash(i, p.mx) * 7, [rx, ry] = iso(p.x, p.y, a, b);
      prism(c, rx, ry, R(s, s * .8), 0, s * .6, DARKST);
    }
  };
  const drawWalls = (c, Z, p) => {
    const { blocks, alongA } = wallBlocks(Z, p);
    // dark floor strip along the base of each wall
    for (const side of [-1, 1]) {
      const a0 = alongA ? -150 : side * 116, b0 = alongA ? side * 116 : -150, a1 = alongA ? 150 : a0, b1 = alongA ? b0 : 150;
      const [x0, y0] = iso(p.x, p.y, a0, b0), [x1, y1] = iso(p.x, p.y, a1, b1);
      c.lineCap = 'round'; c.strokeStyle = 'rgba(8,6,4,.35)'; c.lineWidth = 40; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.lineCap = 'butt';
    }
    for (const B of blocks) {
      const [x, y] = iso(p.x, p.y, B.a, B.b);
      if (B.gap) { // tumbled blocks where the wall gave way
        for (let i = 0; i < 3; i++) {
          const o = (Z.hash(p.mx + i * 5, p.my + B.hh * 99) - .5) * 30, s = 7 + i * 3, [rx, ry] = iso(x, y, alongA ? o : (i - 1) * 9, alongA ? (i - 1) * 9 : o);
          prism(c, rx, ry, R(s, s * .9), 0, s * .7, i % 2 ? DARKST : WALL);
        }
        continue;
      }
      prism(c, x, y, R(B.w, B.d), 0, B.H, WALL);
      // mortar course line on the visible faces
      const m1 = iso(x, y, -B.w / 2, B.d / 2, B.H * .5), m2 = iso(x, y, B.w / 2, B.d / 2, B.H * .5), m3 = iso(x, y, B.w / 2, -B.d / 2, B.H * .5);
      c.strokeStyle = 'rgba(10,8,6,.55)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(m1[0], m1[1]); c.lineTo(m2[0], m2[1]); c.lineTo(m3[0], m3[1]); c.stroke();
      if (B.torch) { // iron sconce
        const q = alongA ? iso(p.x, p.y, B.a, B.b + 15, B.H * .6) : iso(p.x, p.y, B.a + 15, B.b, B.H * .6);
        pool(c, q[0], q[1] + B.H * .6 + 20, 100, .14);
        c.fillStyle = '#1a1614'; c.strokeStyle = '#0a0807'; c.lineWidth = 1;
        c.fillRect(q[0] - 2, q[1] - 6, 4, 12); c.beginPath(); c.moveTo(q[0] - 5, q[1] - 9); c.lineTo(q[0] + 5, q[1] - 9); c.lineTo(q[0] + 2, q[1] - 3); c.lineTo(q[0] - 2, q[1] - 3); c.closePath(); c.fill(); c.stroke();
      }
    }
  };
  const DRAW = { [SARC]: drawSarc, [COFFIN]: drawCoffin, [BRAZIER]: drawBrazier, [TORCH]: drawTorch, [BONES]: drawBones, [BLOOD]: drawBlood, [SEAL]: drawSeal, [PILLAR]: drawPillar, [WALLS]: drawWalls };

  // ---------- Small drawing helpers ----------
  const face = (c, e) => { const f = Math.cos(e.ang) < 0 ? -1 : 1; c.scale(f, 1); return f; };
  // Mirror toward the hero and apply the design-unit scale in one call.
  const faceS = (c, e, s) => c.scale(Math.cos(e.ang) < 0 ? -s : s, s);
  // Static foe shapes, built once as Path2D in design units (closed polygons from flat [x, y, ...] lists).
  const poly = (...ls) => { const p = new Path2D(); for (const a of ls) { p.moveTo(a[0], a[1]); for (let i = 2; i < a.length; i += 2) p.lineTo(a[i], a[i + 1]); p.closePath(); } return p; };
  let ART = null;
  const art = () => ART || (ART = {
    // Gutling: lean V-torso, pointed snout, swept ears + horns, a clawed arm across the chest
    impBody: poly(
      [-1.4, 3.6, -1, .8, -3.2, -2.4, -1.4, -4.2, -2.1, -5.7, -5.8, -8.4, -2.4, -7.4, -1.2, -8.8, -3.6, -12.6, .4, -9.6, 1.8, -9.4, 2.8, -12.9,
        3.4, -8.8, 4.6, -7.6, 6.8, -5.4, 3.8, -4, 1.4, -4.2, 3, -2.4, 1.2, .8, 1.6, 3.6, .1, 4.6],
      [-1.8, -2.6, -.2, -3, .6, .4, 3.8, .2, 6.2, -.2, 4.6, 1.2, 6.2, 2.2, 4.2, 2.2, 4.8, 3.6, 3.2, 2, .4, 2.4, -1.4, -.6]),
    impShade: poly([-1.4, 3.6, -1, .8, -3.2, -2.4, -1.4, -4.2, -.6, -2, -.2, 3.6],
      [-1.8, -2.6, -.2, -3, .6, .4, 3.8, .2, 6.2, -.2, 4.6, 1.2, 6.2, 2.2, 4.2, 2.2, 4.8, 3.6, 3.2, 2, .4, 2.4, -1.4, -.6]),
    impHorn: poly([-1.2, -8.8, -3.6, -12.6, .4, -9.6], [1.8, -9.4, 2.8, -12.9, 3.4, -8.8]),
    impEye: poly([3.1, -7.7, 5.5, -6.6, 3.3, -6.3]),
    impMouth: poly([3.4, -5, 6.1, -5.3, 4, -4.3]),
    // bat wing + spade tail, around a pivot at the upper back
    impWing: poly([.6, -1, -2.6, -6.6, -8.6, -8.2, -7.4, -5.2, -9.4, -3.8, -6.2, -2.8, -6.8, -.8, -2.2, .6],
      [.4, 5.2, -4, 7.8, -8, 6.8, -9.4, 4.6, -11.4, 4.6, -10.6, .6, -8.2, 3.4, -8.4, 5, -4.4, 6, -.4, 4.2]),
    // Grave-shambler: gaunt hunched torso, rag scraps, lopsided slack-jawed head
    zomBody: poly([-1, -11, -4, -8.5, -5, -3, -3.5, 3, 2.5, 3.5, 3.8, -1, 5.8, -6, 5.4, -9.6, 2.6, -11]),
    zomRag: poly([-4.8, -8.2, -1, -11.6, 4, -11, 5.2, -8.6, 2.8, -7.6, 1.8, -5.4, .6, -7.2, -1.4, -3.4, -2.6, -5.8, -4.8, -1.8],
      [-4.2, 1.6, 3.2, 2, 3.9, 5.4, 2.4, 4.4, 1.6, 8.2, 0, 5.2, -1.4, 7.6, -2.4, 4.8, -4.4, 6.2]),
    zomWound: poly([1.8, -1.6, 3.7, -2.2, 3.3, .6, 1.9, .2]),
    zomRibs: (() => { const p = new Path2D(); p.moveTo(2.2, -4.8); p.lineTo(4.6, -5.2); p.moveTo(2.4, -3.2); p.lineTo(4.2, -3.4); p.moveTo(-3.6, -6.4); p.lineTo(-2.2, -7.6); return p; })(),
    zomHead: poly([3.4, -11.8, 3.8, -15.6, 6.4, -17.4, 9.4, -16.2, 10.4, -13.6, 9.4, -12.8, 9.8, -9.8, 7.6, -9.2, 5.4, -10.4]),
    zomHole: poly([7.2, -15.4, 9.8, -15, 9.4, -13.6, 7.4, -13.8], [7.9, -12.4, 9.4, -12.4, 9.2, -10.2, 8, -10.6]),
    zomEye: poly([8.4, -14.9, 9.4, -14.7, 9.2, -13.9, 8.4, -14.1]),
    // Ashen Count (vampire): high-collared cape (black outside, crimson lining), narrow coat, pale gaunt head
    vCape: poly([-3, -9, -6.6, -17.4, -8, -9, -9, 0, -10.6, 10.6, -7.6, 8.8, -5, 11.2, -2.5, 9.2, 0, 11.4, 2.5, 9.2, 5, 11.2, 7.6, 8.8,
      10.6, 10.6, 9, 0, 8, -9, 6.6, -17.4, 3, -9]),
    vLining: poly([-2.4, -9.8, -5.6, -15.6, -6.6, -9.2, -7.6, 0, -8.6, 8.6, -5, 9.6, 0, 9.8, 5, 9.6, 8.6, 8.6, 7.6, 0, 6.6, -9.2, 5.6, -15.6, 2.4, -9.8]),
    vCoat: poly([-3.2, -9.6, 3.2, -9.6, 3.8, -4, 2.6, 2, 3.4, 8.6, 0, 7.4, -3.4, 8.6, -2.6, 2, -3.8, -4]),
    vJabot: poly([-1.2, -9.4, 1.2, -9.4, 1.7, -6, 0, -3.4, -1.7, -6]),
    vHead: poly([-2.4, -10.4, -3, -13.4, -4.8, -15.8, -2.8, -14.6, -2.6, -16.2, .6, -17.6, 3.4, -16.4, 4.2, -13.6, 3.5, -11.6, 1.4, -9.2, -.8, -9.8]),
    vHair: poly([-3.1, -12.8, -3.3, -16.4, .4, -18.4, 3.7, -17.1, 4.4, -15, 3, -15.8, 1.8, -14.3, .8, -15.8, -1.2, -15.4, -2, -12.6]),
    vEye: poly([.8, -14.3, 2.3, -13.9, .9, -13.4], [2.9, -13.9, 4, -14.3, 3.9, -13.4]),
    vMouth: poly([.9, -12, 3.6, -12.2, 3.3, -11, 1.1, -11]),
    vFang: poly([1.4, -11.2, 2, -11.2, 1.7, -10.1], [2.7, -11.2, 3.3, -11.2, 3, -10.1]),
    // open clawed hand, palm at the origin, talons up
    vHand: poly([-1, 1, -1.8, -1.2, -1.6, -3.8, -.6, -1.4, .2, -4.2, .7, -1.4, 2, -3.6, 1.5, -.5, 2.8, .2, 1.2, 1.3]),
  });

  // ---------- Foes ----------
  // Gutling: cowardly little red fiend with a curved knife. Weaves in packs, bolts when stung or when its vampire master falls.
  const imp = {
    hp: 10, sp: 96, dmg: 6, xp: 1, r: 10, eye: false,
    init(e) { e.flee = 0; e.rise = 0; e.champ = false; },
    update(e, Z) {
      const dt = Z.dt;
      if (e.rise > 0) { e.rise -= dt; Z.move(e, 0, 0); return; }
      if (e.flash > 0 && !e.stung) { e.stung = true; if (Math.random() < .25 && !e.champ) e.flee = Math.max(e.flee, .7); }
      if (e.flash <= 0) e.stung = false;
      if (e.flee > 0) {
        e.flee -= dt; const a = Z.angTo(e) + Math.PI + Math.sin(e.ph * 5 + e.seed) * .4;
        Z.move(e, Math.cos(a) * e.sp * 1.25, Math.sin(a) * e.sp * 1.25); e.ang = a; return;
      }
      const d = Z.dist(e), a = Z.angTo(e) + (d > 70 ? Math.sin(e.ph * 3 + e.seed * 2) * .55 : 0);
      Z.move(e, Math.cos(a) * e.sp, Math.sin(a) * e.sp); e.ang = a;
    },
    draw(e, Z, white) {
      // Drawn in 9-unit design space (scaled by s). Lean V-torso, wedge head, bat wings, spade tail, knife.
      const c = Z.ctx, A = art(), s = e.r / 9, run = Math.sin(e.ph * 16 + e.seed), O = W(white, '#4a0a06');
      if (e.champ && !white) { // champion aura
        const ga = c.globalAlpha; c.globalAlpha = .55 + .25 * Math.sin(Z.now * 6 + e.seed); c.strokeStyle = '#6ab4ff'; c.lineWidth = 2.5;
        c.beginPath(); c.arc(e.x, e.y, e.r + 5 + Math.sin(Z.now * 4) * 1.5, 0, TAU); c.stroke(); c.globalAlpha = ga;
      }
      c.save(); c.translate(e.x, e.y - Math.abs(run) * 1.5 * s);
      if (e.rise > 0) { const k = Math.max(0, 1 - e.rise / .7); c.globalAlpha = .3 + .7 * k; c.scale(1, .35 + .65 * k); }
      faceS(c, e, s);
      c.lineCap = 'round'; c.lineJoin = 'round';
      // bat wings + spade tail behind the body: wings beat by squashing about the upper back
      c.save(); c.translate(-1, -2); c.scale(1, .78 + .26 * Math.sin(e.ph * 22 + e.seed));
      c.strokeStyle = O; c.lineWidth = 2; c.stroke(A.impWing); c.fillStyle = W(white, '#8a160c'); c.fill(A.impWing); c.restore();
      // thin digitigrade legs (knee forward, hock back, clawed toe) + the knife arm, behind the torso
      const ka = -.6 + Math.sin(e.ph * 9 + e.seed) * .7, hx = 5 + Math.cos(ka) * 1.4, hy = .4 + Math.sin(ka) * 1.4;
      c.beginPath();
      c.moveTo(-.4, 3.2); c.lineTo(1 + run * 1.8, 6); c.lineTo(-.6 + run * 2.6, 8.2); c.lineTo(1.4 + run * 2.6, 9.4);
      c.moveTo(.4, 3.2); c.lineTo(1.6 - run * 1.8, 6); c.lineTo(0 - run * 2.6, 8.2); c.lineTo(2 - run * 2.6, 9.4);
      c.moveTo(1.6, -2.4); c.lineTo(3, .6); c.lineTo(hx, hy);
      c.strokeStyle = O; c.lineWidth = 2.9; c.stroke(); c.strokeStyle = W(white, '#c4240f'); c.lineWidth = 1.5; c.stroke();
      // torso + head + clawed arm: one silhouette, thin outline stroked first then filled over
      c.strokeStyle = O; c.lineWidth = 2.2; c.stroke(A.impBody); c.fillStyle = W(white, e.champ ? '#ff6a2a' : '#e4321a'); c.fill(A.impBody);
      c.fillStyle = W(white, e.champ ? '#d24a1a' : '#a81c10'); c.fill(A.impShade);
      c.fillStyle = W(white, '#f2deb0'); c.fill(A.impHorn);
      c.fillStyle = W(white, '#ffe23a'); c.fill(A.impEye);
      c.fillStyle = W(white, '#3a0404'); c.fill(A.impMouth);
      // curved knife: outlined bright steel with a white glint at the tip
      const da = ka - .5, dx = Math.cos(da), dy = Math.sin(da), tx = hx + dx * 7, ty = hy + dy * 7;
      c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo(hx + dx * 3.5 + dy * 1.8, hy + dy * 3.5 - dx * 1.8, tx, ty);
      c.strokeStyle = O; c.lineWidth = 3.2; c.stroke(); c.strokeStyle = W(white, '#eef2ff'); c.lineWidth = 1.6; c.stroke();
      c.fillStyle = '#fff'; c.fillRect(tx - .9, ty - .9, 1.8, 1.8);
      c.restore();
    },
    death(e, Z) {
      Z.burst(e.x, e.y, '#e8301c', 6, 80);
      if (corpses.length > 40) corpses.splice(0, corpses.length - 30);
      corpses.push({ x: e.x, y: e.y, t: Z.t });
    },
  };

  // Ashen Count: gaunt caped vampire (kind id stays "shaman"). Keeps its distance, lobs fireballs, raises fallen gutlings.
  const shaman = {
    hp: 42, sp: 58, dmg: 8, xp: 4, r: 11, eye: false,
    init(e, Z) { e.t1 = Z.rnd(1.5, 3); e.t2 = Z.rnd(4, 6); e.cast = 0; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e), a = Z.angTo(e);
      const k = d > 300 ? 1 : d < 210 ? -.8 : .25 * Math.sin(e.ph + e.seed);
      const sa = a + (d < 300 && d > 210 ? Math.PI / 2 : 0);
      Z.move(e, Math.cos(sa) * e.sp * k, Math.sin(sa) * e.sp * k); e.ang = a;
      if (e.cast > 0) e.cast -= dt;
      if ((e.t1 -= dt) <= 0 && d < 520) {
        e.t1 = Z.rnd(2.8, 3.6); e.cast = .45;
        Z.shoot(e.x, e.y - 8, a, 175, { r: 7, dmg: 9, life: 4, col: '255,120,30' }); Z.sfx('shoot');
      }
      if ((e.t2 -= dt) <= 0) {
        e.t2 = Z.rnd(6.5, 8.5); e.cast = .9; let raised = 0;
        for (let i = corpses.length - 1; i >= 0 && raised < 4; i--) {
          const p = corpses[i], age = Z.t - p.t;
          if (age < 0 || age > 12) { corpses.splice(i, 1); continue; }
          if (Math.hypot(p.x - e.x, p.y - e.y) < 260) {
            corpses.splice(i, 1); const n = Z.spawn('imp', p.x, p.y);
            if (n) { n.rise = .7; raised++; Z.burst(p.x, p.y, '#ff6a20', 8, 60); }
          }
        }
        if (!raised) for (let i = 0; i < 2; i++) {
          const ang = e.seed + i * Math.PI, n = Z.spawn('imp', e.x + Math.cos(ang) * 26, e.y + Math.sin(ang) * 26);
          if (n) { n.rise = .7; Z.burst(n.x, n.y, '#ff6a20', 6, 50); }
        }
      }
    },
    draw(e, Z, white) {
      // Ashen Count: drawn in 11-unit design space. Casting (e.cast > 0) flares the cape wide and raises a
      // clawed hand with a blood-fire glow in the palm; the glow eases back down as the cast ends.
      const c = Z.ctx, A = art(), s = e.r / 11, bob = Math.sin(e.ph * 3 + e.seed) * 1.2, u = Math.min(1, Math.max(0, e.cast) * 6);
      const O = W(white, '#2a0a14'), st = Math.sin(e.ph * 6 + e.seed);
      c.save(); c.translate(e.x, e.y + bob * s); faceS(c, e, s);
      c.lineCap = 'round'; c.lineJoin = 'round';
      // cape: black outside, crimson lining; billows slightly as it glides, flares wide on a cast
      c.save(); c.scale(1 + .04 * st + u * .32, 1 - u * .03);
      c.strokeStyle = O; c.lineWidth = 2; c.stroke(A.vCape); c.fillStyle = W(white, '#140d18'); c.fill(A.vCape);
      c.fillStyle = W(white, '#a8121e'); c.fill(A.vLining); c.restore();
      // boots peeking under the coat
      c.fillStyle = W(white, '#0c080e'); c.fillRect(-2.8 + st * .8, 8.2, 2.4, 2.6); c.fillRect(.6 - st * .8, 8.2, 2.4, 2.6);
      // narrow black coat, white jabot, blood-red brooch
      c.strokeStyle = O; c.lineWidth = 1.8; c.stroke(A.vCoat); c.fillStyle = W(white, '#2c2234'); c.fill(A.vCoat);
      c.fillStyle = W(white, '#ece4ee'); c.fill(A.vJabot);
      c.fillStyle = W(white, '#ff2a3a'); c.fillRect(-.7, -7.6, 1.4, 1.4);
      // pale gaunt head, pointed ear, slicked hair with a widow's peak, red eyes, fangs
      c.strokeStyle = O; c.lineWidth = 1.8; c.stroke(A.vHead); c.fillStyle = W(white, '#dcd6e8'); c.fill(A.vHead);
      c.fillStyle = W(white, '#120c18'); c.fill(A.vHair);
      c.fillStyle = W(white, '#ff1e2e'); c.fill(A.vEye);
      c.fillStyle = W(white, '#3a0610'); c.fill(A.vMouth);
      c.fillStyle = W(white, '#ffffff'); c.fill(A.vFang);
      // casting arm: talon held at the chest, thrust overhead while casting
      const ex = 5 + u * 2.8, ey = -4.8 - u * 6.6, hx = 8 + u * 1.2, hy = -6.4 - u * 10.2;
      c.beginPath(); c.moveTo(2.6, -8.6); c.lineTo(ex, ey); c.lineTo(hx, hy);
      c.strokeStyle = O; c.lineWidth = 3.6; c.stroke(); c.strokeStyle = W(white, '#1c1424'); c.lineWidth = 2; c.stroke();
      c.translate(hx, hy);
      c.strokeStyle = O; c.lineWidth = 1.4; c.stroke(A.vHand); c.fillStyle = W(white, '#dcd6e8'); c.fill(A.vHand);
      // palm fire: a faint ember at rest, a bright orange-red flare while casting
      if (!white) Z.glow('255,80,40', 6 + u * 12, 0, -1.2, .4 + .5 * u);
      c.beginPath(); c.arc(0, -1.2, 1 + u * 1.6, 0, TAU); c.fillStyle = W(white, u > 0 ? '#ff6a1e' : '#c8202a'); c.fill();
      c.fillStyle = W(white, '#fff0b0'); c.fillRect(-.5, -1.7, 1, 1);
      c.restore();
    },
    death(e, Z) { // gutlings near a fallen count panic
      Z.burst(e.x, e.y, '#ff8a2a', 12, 120);
      const fs = Z.foes();
      for (let i = 0; i < fs.length; i++) {
        const f = fs[i];
        if (f !== e && f.kind === 'imp' && Math.hypot(f.x - e.x, f.y - e.y) < 260) f.flee = 2.4;
      }
    },
  };

  // Ossuary Warden: sword-and-shield skeleton. Some knit themselves back together once (their eyes burn red).
  const skeleton = {
    hp: 52, sp: 50, dmg: 12, xp: 4, r: 12, eye: false,
    init(e) { e.rise = 0; e.re = false; },
    update(e, Z) {
      if (e.rise > 0) { e.rise -= Z.dt; Z.move(e, 0, 0); return; }
      Z.chase(e, e.sp * (.85 + .25 * Math.max(0, Math.sin(e.ph * 4 + e.seed))));
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 12, O = W(white, '#0c0a08'), BONE = W(white, '#f2ead2');
      c.save(); c.translate(e.x, e.y); c.lineCap = 'round'; c.lineJoin = 'round';
      if (e.rise > 0) { // bones snapping back up from a heap
        const k = Math.max(0, 1 - e.rise / 1.4);
        c.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = i * 1.3 + e.seed, rr = (9 - 6 * k) * s, by = 8 * s * (1 - k) - k * i * 3 * s;
          c.moveTo(Math.cos(a) * rr - 3 * s, by + Math.sin(a) * rr * .4); c.lineTo(Math.cos(a) * rr + 3 * s, by + Math.sin(a) * rr * .4 - 2 * s);
        }
        c.strokeStyle = O; c.lineWidth = 4 * s; c.stroke(); c.strokeStyle = BONE; c.lineWidth = 2 * s; c.stroke();
        c.beginPath(); c.arc(0, 8 * s - k * 17 * s, 4 * s, 0, TAU); c.strokeStyle = O; c.lineWidth = 3; c.stroke(); c.fillStyle = BONE; c.fill();
        c.restore(); return;
      }
      face(c, e);
      const st = Math.sin(e.ph * 8 + e.seed);
      // legs
      c.beginPath(); c.moveTo(-2 * s, 5 * s); c.lineTo(-2 * s + st * 3 * s, 12 * s); c.moveTo(2 * s, 5 * s); c.lineTo(2 * s - st * 3 * s, 12 * s);
      c.strokeStyle = O; c.lineWidth = 4.4 * s; c.stroke(); c.strokeStyle = BONE; c.lineWidth = 2.1 * s; c.stroke();
      // raised sword in the back hand (blade + crossguard), bright steel
      const sa = -2 + Math.sin(e.ph * 4 + e.seed) * .3, dx = Math.cos(sa), dy = Math.sin(sa), hx = -5 * s, hy = 0, gx = hx + dx * 2 * s, gy = hy + dy * 2 * s;
      c.beginPath(); c.moveTo(hx - dx * 2 * s, hy - dy * 2 * s); c.lineTo(hx + dx * 16 * s, hy + dy * 16 * s);
      c.moveTo(gx - dy * 3.5 * s, gy + dx * 3.5 * s); c.lineTo(gx + dy * 3.5 * s, gy - dx * 3.5 * s);
      c.strokeStyle = O; c.lineWidth = 4.2 * s; c.stroke(); c.strokeStyle = W(white, '#e2eaf8'); c.lineWidth = 2 * s; c.stroke();
      // ribcage + skull silhouette
      c.beginPath(); c.moveTo(-4.8 * s, -4 * s); c.lineTo(4.8 * s, -4 * s); c.lineTo(3 * s, 5 * s); c.lineTo(-3 * s, 5 * s); c.closePath();
      c.moveTo(5.6 * s, -8 * s); c.arc(1.2 * s, -8 * s, 4.4 * s, 0, TAU);
      c.strokeStyle = O; c.lineWidth = 3.2; c.stroke(); c.fillStyle = BONE; c.fill();
      c.fillStyle = W(white, '#3e372c'); c.fillRect(-3.4 * s, -2 * s, 6.8 * s, 1.1 * s); c.fillRect(-3 * s, .8 * s, 6 * s, 1.1 * s);
      c.fillStyle = W(white, '#120c0a'); c.fillRect(1.4 * s, -8.8 * s, 4 * s, 2.2 * s);
      c.fillStyle = W(white, e.re ? '#ff4030' : '#7fe4ff'); c.fillRect(1.8 * s, -8.4 * s, 1.3 * s, 1.3 * s); c.fillRect(3.8 * s, -8.4 * s, 1.3 * s, 1.3 * s);
      // round shield in front
      c.beginPath(); c.arc(6.2 * s, 1.5 * s, 5.8 * s, 0, TAU);
      c.strokeStyle = O; c.lineWidth = 3.2; c.stroke(); c.fillStyle = W(white, '#9a2c1c'); c.fill();
      c.fillStyle = W(white, '#f0c850'); c.fillRect(5.2 * s, .5 * s, 2 * s, 2 * s);
      c.restore();
    },
    death(e, Z) {
      Z.burst(e.x, e.y, '#f2ead2', 8, 90);
      if (!e.re && e.seed < 3) {
        const n = Z.spawn('skeleton', e.x, e.y);
        if (n) { n.re = true; n.rise = 1.4; n.hp = n.max * .6; }
      }
    },
  };

  // Grave-Shambler: slow, tanky, hunched corpse that limps forward with bony arms outstretched.
  const zombie = {
    hp: 115, sp: 27, dmg: 16, xp: 7, r: 16, heavy: true, eye: false,
    update(e, Z) { const lurch = .55 + .9 * Math.max(0, Math.sin(e.ph * 2.6 + e.seed)); Z.chase(e, e.sp * lurch); },
    draw(e, Z, white) {
      // Drawn in 16-unit design space: a gaunt, hunched corpse in rags, bony arms reaching, dragging a stiff back leg.
      const c = Z.ctx, A = art(), s = e.r / 16, sway = Math.sin(e.ph * 2.6 + e.seed), O = W(white, '#1e2814'), SKIN = W(white, '#93a67a');
      c.save(); c.translate(e.x, e.y - Math.max(0, sway) * 1.4 * s); faceS(c, e, s); c.rotate(.05 + sway * .06);
      c.lineCap = 'round'; c.lineJoin = 'round';
      // legs: the front one steps, the back one stays stiff and drags with a turned foot (the limp)
      c.beginPath();
      c.moveTo(-1.6, 2.6); c.lineTo(-2.6, 8.6); c.lineTo(-4 - sway * .8, 13.4); c.lineTo(-2.2 - sway * .8, 14.2);
      c.moveTo(1.4, 2.6); c.lineTo(3.4 + sway * 2.2, 8.2); c.lineTo(2.4 + sway * 3.2, 13.6); c.lineTo(5 + sway * 3.2, 14);
      c.strokeStyle = O; c.lineWidth = 4.2; c.stroke(); c.strokeStyle = W(white, '#7d9066'); c.lineWidth = 2.6; c.stroke();
      // hunched rib-thin torso, rotted rags (shoulder scrap + loincloth), exposed ribs and a wound
      c.strokeStyle = O; c.lineWidth = 2.2; c.stroke(A.zomBody); c.fillStyle = SKIN; c.fill(A.zomBody);
      c.lineWidth = 1.6; c.stroke(A.zomRag); c.fillStyle = W(white, '#6a5644'); c.fill(A.zomRag);
      if (!white) { c.strokeStyle = '#4e6038'; c.lineWidth = .9; c.stroke(A.zomRibs); c.fillStyle = '#6e1a14'; c.fill(A.zomWound); }
      // lopsided slack-jawed head hanging forward: sunken sockets, one sickly glowing eye
      c.strokeStyle = O; c.lineWidth = 2; c.stroke(A.zomHead); c.fillStyle = W(white, '#a2b488'); c.fill(A.zomHead);
      c.fillStyle = W(white, '#1a1c10'); c.fill(A.zomHole);
      c.fillStyle = W(white, '#e6ff5a'); c.fill(A.zomEye);
      // bony arms reaching forward, fingers hooked
      c.beginPath();
      c.moveTo(1.8, -9); c.lineTo(8, -7.4 + sway * 1.2); c.lineTo(14.4, -8 + sway * 2); c.lineTo(16.8, -6.2 + sway * 2);
      c.moveTo(4.4, -8); c.lineTo(10, -4.4 - sway * 1.2); c.lineTo(16, -4.8 - sway * 2); c.lineTo(18, -2.8 - sway * 2);
      c.strokeStyle = O; c.lineWidth = 3.8; c.stroke(); c.strokeStyle = SKIN; c.lineWidth = 2.2; c.stroke();
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#9cc24a', 14, 90); },
  };

  // ---------- Miniboss: Gristlemaw, the Unshriven Abbot ----------
  const PATTERN = ['charge', 'fan', 'charge', 'pillars', 'summon', 'fan', 'pillars'];
  const enter = (e, Z, mode) => {
    e.mode = mode;
    if (mode === 'walk') { e.mt = 1.6 + Math.random() * .8; return; }
    if (mode === 'wind') { e.mt = 1.05; e.cAng = Z.angTo(e); Z.sfx('warn'); return; }
    if (mode === 'fan') { e.mt = 2.4; e.vol = 3; e.t3 = .6; Z.sfx('warn'); return; }
    if (mode === 'pillars') {
      e.mt = 2.2; e.t3 = .9; Z.sfx('warn');
      const px = Z.P.x, py = Z.P.y, off = Math.random() * TAU;
      for (let i = 0; i < 7; i++) Z.hazard(px + Math.cos(off + i / 7 * TAU) * 120, py + Math.sin(off + i / 7 * TAU) * 120, { r: 52, t: 1.1, dmg: 14, col: '255,90,30' });
      return;
    }
    if (mode === 'summon') {
      e.mt = 1.4; Z.sfx('boss'); Z.shake(5);
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * TAU + e.ph, n = Z.spawn('imp', e.x + Math.cos(a) * (e.r + 18), e.y + Math.sin(a) * (e.r + 18));
        if (n) { n.rise = .6; Z.burst(n.x, n.y, '#ff5020', 6, 70); }
      }
    }
  };
  const boss = {
    name: 'Gristlemaw, the Unshriven Abbot', hp: 3600, sp: 56, dmg: 24, xp: 0, r: 44, heavy: true, eye: false,
    init(e) { e.pi = 0; e.cAng = 0; e.vol = 0; e.mt = 2.5; e.mode = 'walk'; },
    update(e, Z) {
      const dt = Z.dt; e.mt -= dt;
      switch (e.mode) {
        case 'walk':
          Z.chase(e, e.sp);
          if (e.mt <= 0) { const p = PATTERN[e.pi++ % PATTERN.length]; enter(e, Z, p === 'charge' ? 'wind' : p); }
          break;
        case 'wind': // tracks the hero, then locks its aim for the final .4s
          if (e.mt > .4) e.cAng = Z.angTo(e);
          e.ang = e.cAng; Z.move(e, 0, 0);
          if (e.mt <= 0) { e.mode = 'charge'; e.mt = .72; Z.sfx('charge'); }
          break;
        case 'charge':
          Z.move(e, Math.cos(e.cAng) * 440, Math.sin(e.cAng) * 440); e.ang = e.cAng;
          if (Math.random() < .5) Z.burst(e.x, e.y, '#5a3a2a', 2, 60);
          if (e.mt <= 0) { Z.shake(9); Z.ring(e.x, e.y, 12, 135, { r: 6, dmg: 9, col: '255,90,40' }, e.ph); enter(e, Z, 'walk'); }
          break;
        case 'fan':
          e.ang = Z.angTo(e); Z.move(e, 0, 0);
          if ((e.t3 -= dt) <= 0 && e.vol > 0) {
            const n = e.vol === 2 ? 8 : 7, spread = .95;
            for (let i = 0; i < n; i++) Z.shoot(e.x, e.y - 10, e.ang - spread / 2 + spread * i / (n - 1), 170, { r: 7, dmg: 9, life: 5, col: '150,255,70' });
            Z.sfx('shoot'); e.vol--; e.t3 = .55;
          }
          if (e.mt <= 0) enter(e, Z, 'walk');
          break;
        case 'pillars':
          Z.move(e, 0, 0); e.ang = Z.angTo(e);
          if (e.t3 > 0 && (e.t3 -= dt) <= 0) { // second wave: a pillar on the hero plus a tighter ring
            Z.hazard(Z.P.x, Z.P.y, { r: 60, t: 1.1, dmg: 16, col: '255,60,20' });
            for (let i = 0; i < 4; i++) Z.hazard(Z.P.x + Math.cos(i * TAU / 4 + .78) * 150, Z.P.y + Math.sin(i * TAU / 4 + .78) * 150, { r: 48, t: 1.3, dmg: 14, col: '255,90,30' });
          }
          if (e.mt <= 0) enter(e, Z, 'walk');
          break;
        case 'summon':
          Z.move(e, 0, 0);
          if (e.mt <= 0) enter(e, Z, 'walk');
          break;
        default: enter(e, Z, 'walk');
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 44, step = Math.sin(e.ph * (e.mode === 'charge' ? 14 : 4)), O = W(white, '#0a0405');
      // telegraph lane for the charge
      if (e.mode === 'wind' && !white) {
        c.save(); c.translate(e.x, e.y); c.rotate(e.cAng);
        const lock = e.mt <= .4;
        c.globalAlpha = lock ? .4 + .2 * Math.sin(Z.now * 30) : .2; c.fillStyle = lock ? '#ff3020' : '#a02010';
        c.fillRect(0, -e.r * .8, 340, e.r * 1.6);
        c.globalAlpha = lock ? .9 : .5; c.strokeStyle = '#ff6a40'; c.lineWidth = 2; c.strokeRect(0, -e.r * .8, 340, e.r * 1.6);
        c.restore();
      }
      c.save(); c.translate(e.x, e.y + Math.abs(step) * -2 * s);
      face(c, e);
      if (e.mode === 'wind') c.translate(-3 * s * Math.sin(Z.now * 40), 0);
      c.lineJoin = 'round'; c.lineCap = 'round';
      // legs
      c.beginPath(); c.rect(-16 * s + step * 4 * s, 22 * s, 12 * s, 16 * s); c.rect(4 * s - step * 4 * s, 22 * s, 12 * s, 16 * s);
      c.strokeStyle = O; c.lineWidth = 4; c.stroke(); c.fillStyle = W(white, '#3a2020'); c.fill();
      // hook chain arm (behind)
      c.beginPath(); c.moveTo(-24 * s, -6 * s); c.quadraticCurveTo(-36 * s, 14 * s + step * 4 * s, -28 * s, 24 * s);
      c.moveTo(-21 * s, 28 * s); c.arc(-25 * s, 26 * s, 4.5 * s, Math.PI * .2, Math.PI * 1.3);
      c.strokeStyle = O; c.lineWidth = 5 * s; c.stroke(); c.strokeStyle = W(white, '#c8ccd6'); c.lineWidth = 2.2 * s; c.stroke();
      // tattered cassock: big chunky silhouette with a thick outline
      c.beginPath();
      c.moveTo(-34 * s, 28 * s); c.quadraticCurveTo(-42 * s, -12 * s, -10 * s, -32 * s); c.lineTo(14 * s, -32 * s);
      c.quadraticCurveTo(42 * s, -10 * s, 34 * s, 28 * s);
      for (let i = 0; i < 6; i++) c.lineTo(34 * s - (i + .5) * 11.3 * s, (28 + (i % 2 ? 9 : 0) + Math.sin(e.ph * 5 + i) * 2) * s);
      c.closePath();
      c.strokeStyle = O; c.lineWidth = 6; c.stroke(); c.fillStyle = W(white, '#4e2a62'); c.fill();
      // crimson stole down the front
      if (!white) {
        c.fillStyle = '#c02028'; c.beginPath(); c.moveTo(-14 * s, -28 * s); c.lineTo(-6 * s, -28 * s); c.lineTo(-10 * s, 30 * s); c.lineTo(-18 * s, 32 * s); c.closePath(); c.fill();
        c.fillStyle = '#f0c040'; c.fillRect(-15 * s, 22 * s, 7 * s, 3 * s); c.fillRect(-13 * s, -6 * s, 5 * s, 3 * s);
      }
      // swollen flayed belly with stitches
      c.beginPath(); c.arc(6 * s, 6 * s, 20 * s, 0, TAU);
      c.strokeStyle = O; c.lineWidth = 4; c.stroke(); c.fillStyle = W(white, '#d8553e'); c.fill();
      if (!white) {
        c.fillStyle = '#f08a6a'; c.beginPath(); c.arc(0, -2 * s, 7 * s, 0, TAU); c.fill();
        c.strokeStyle = '#3a0e0a'; c.lineWidth = 1.8 * s; c.beginPath(); c.moveTo(6 * s, -10 * s); c.lineTo(8 * s, 22 * s);
        for (let i = 0; i < 6; i++) { c.moveTo(3 * s, (-7 + i * 5) * s); c.lineTo(11 * s, (-5 + i * 5) * s); } c.stroke();
        c.fillStyle = '#6a0a08'; c.beginPath(); c.arc(-6 * s, 15 * s, 4 * s, 0, TAU); c.fill();
      }
      // cleaver arm (raised during wind-up, sweeping in the charge)
      const arm = e.mode === 'wind' ? -1.9 : e.mode === 'charge' ? .6 : -.5 + step * .3;
      c.save(); c.translate(22 * s, -10 * s); c.rotate(arm);
      c.beginPath(); c.rect(0, -4.5 * s, 22 * s, 9 * s); c.strokeStyle = O; c.lineWidth = 4; c.stroke(); c.fillStyle = W(white, '#c4503c'); c.fill();
      c.fillStyle = W(white, '#3a2a1e'); c.fillRect(20 * s, -2.5 * s, 8 * s, 5 * s);
      c.beginPath(); c.moveTo(26 * s, -7 * s); c.lineTo(50 * s, -11 * s); c.lineTo(52 * s, 11 * s); c.lineTo(26 * s, 9 * s); c.closePath();
      c.strokeStyle = O; c.lineWidth = 4; c.stroke(); c.fillStyle = W(white, '#c8ccd8'); c.fill();
      if (!white) {
        c.strokeStyle = '#ffffff'; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(51 * s, -9 * s); c.lineTo(52.5 * s, 9 * s); c.stroke();
        c.fillStyle = '#8a1008'; c.fillRect(38 * s, 2 * s, 10 * s, 6 * s);
      }
      c.restore();
      // cowled horned head
      c.beginPath(); c.arc(4 * s, -32 * s, 14 * s, 0, TAU); c.strokeStyle = O; c.lineWidth = 4; c.stroke(); c.fillStyle = W(white, '#2a1430'); c.fill();
      c.beginPath();
      c.moveTo(-3 * s, -40 * s); c.lineTo(-10 * s, -54 * s); c.lineTo(1 * s, -44 * s);
      c.moveTo(10 * s, -42 * s); c.lineTo(18 * s, -55 * s); c.lineTo(14 * s, -40 * s);
      c.strokeStyle = O; c.lineWidth = 3.5; c.stroke(); c.fillStyle = W(white, '#f0e2b8'); c.fill();
      c.fillStyle = W(white, '#a83224'); c.beginPath(); c.arc(8 * s, -29 * s, 8 * s, 0, TAU); c.fill();
      // burning eyes
      c.fillStyle = W(white, '#ffe040'); c.fillRect(5 * s, -34 * s, 3.4 * s, 2.6 * s); c.fillRect(11 * s, -34 * s, 3.4 * s, 2.6 * s);
      // maw: glows green while spitting the bolt fan, orange when calling the flame pillars
      const tell = e.mode === 'fan' ? 1 : e.mode === 'pillars' || e.mode === 'summon' ? 2 : 0;
      if (tell && !white) Z.glow(tell === 1 ? '150,255,70' : '255,150,40', 30 * s, 10 * s, -24 * s, .9);
      c.fillStyle = W(white, tell === 1 ? '#b0ff50' : tell === 2 ? '#ffa030' : '#200606');
      c.fillRect(5 * s, -26 * s, 10 * s, (tell ? 6 : 2.5) * s);
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#d8553e', 40, 220); Z.shake(14); },
  };

  // ---------- Ground (cached per chunk): isometric flagstone diamonds + gothic set-pieces ----------
  const SHADES = ['#3d3730', '#38322c', '#413a32', '#342f2a', '#3a3530'];
  const ground = (Z, x0, y0, x1, y1) => {
    const c = Z.ctx;
    c.fillStyle = '#1a1713'; c.fillRect(x0, y0, x1 - x0, y1 - y0); // mortar
    const sh = SHADES.map(() => new Path2D()), worn = new Path2D(), hi = new Path2D(), lo = new Path2D(), seam = new Path2D();
    const crack = new Path2D(), chip = new Path2D(), spL = new Path2D(), spD = new Path2D();
    const bone = new Path2D(), skull = new Path2D(), sock = new Path2D(), drop = new Path2D(), grate = new Path2D(), bars = new Path2D();
    const us = [x0 / TW + y0 / TH, x1 / TW + y0 / TH, x0 / TW + y1 / TH, x1 / TW + y1 / TH];
    const vs = [y0 / TH - x0 / TW, y0 / TH - x1 / TW, y1 / TH - x0 / TW, y1 / TH - x1 / TW];
    const i0 = Math.floor(Math.min(...us)) - 1, i1 = Math.ceil(Math.max(...us)) + 1, j0 = Math.floor(Math.min(...vs)) - 1, j1 = Math.ceil(Math.max(...vs)) + 1;
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const cx = (i - j) * HX, cy = (i + j) * HY;
      if (cx < x0 - TW || cx > x1 + TW || cy < y0 - TH || cy > y1 + TH) continue;
      const h = Z.hash(i * 7 + 1, j * 9 - 4), h2 = Z.hash(i * 3 - 8, j * 5 + 2), h3 = Z.hash(i * 11 + 5, j * 2 - 13);
      if (h2 < .14) { // patch of small worn cobbles
        for (let q = 0; q < 4; q++) {
          const ox = q === 1 ? HX / 2 : q === 3 ? -HX / 2 : 0, oy = q === 0 ? -HY / 2 : q === 2 ? HY / 2 : 0;
          dia(sh[(q + ((h * 5) | 0)) % 5], cx + ox, cy + oy, HX / 2 - 3, HY / 2 - 1.5);
          hi.moveTo(cx + ox - HX / 2 + 4, cy + oy); hi.lineTo(cx + ox, cy + oy - HY / 2 + 2);
        }
      } else {
        dia(sh[(h * 5) | 0], cx, cy, HX - 3, HY - 1.5);
        hi.moveTo(cx - HX + 5, cy); hi.lineTo(cx, cy - HY + 2.5); hi.lineTo(cx + HX - 5, cy);
        lo.moveTo(cx + HX - 5, cy); lo.lineTo(cx, cy - 2.5 + HY); lo.lineTo(cx - HX + 5, cy);
        if (h2 < .32) { // slab split in two
          if (h3 < .5) { seam.moveTo(cx - HX / 2 + 1, cy - HY / 2 + .5); seam.lineTo(cx + HX / 2 - 1, cy + HY / 2 - .5); }
          else { seam.moveTo(cx + HX / 2 - 1, cy - HY / 2 + .5); seam.lineTo(cx - HX / 2 + 1, cy + HY / 2 - .5); }
        } else if (h2 > .62 && h2 < .76) dia(worn, cx + (h3 - .5) * 12, cy + (h - .5) * 6, HX * .5, HY * .5);
      }
      if (h > .8) { // cracks
        const sx = cx - 20 + h3 * 30, sy = cy - 10 + h * 6;
        crack.moveTo(sx, sy); crack.lineTo(sx + 8, sy + 4 + (h3 - .5) * 6); crack.lineTo(sx + 15, sy + 2); crack.lineTo(sx + 26, sy + 8 + (h - .9) * 30);
      }
      if (h3 > .92) { chip.moveTo(cx + HX - 3, cy); chip.lineTo(cx + HX - 16, cy - 5); chip.lineTo(cx + HX - 13, cy + 5); chip.closePath(); }
      for (let k = 0; k < 3; k++) {
        const a = Z.hash(i * 5 + k, j * 7 - k) - .5, b = Z.hash(j * 3 - k, i * 13 + k) - .5;
        if (Math.abs(a) + Math.abs(b) > .42) continue;
        (k & 1 ? spD : spL).rect(cx + a * TW, cy + b * TH, 2.2, 1.4);
      }
      // sparse small clutter
      const fx = cx + (h - .5) * 30, fy = cy + (h2 - .5) * 14;
      if (h3 < .022) { bone.moveTo(fx - 7, fy - 2); bone.lineTo(fx + 7, fy + 2); bone.moveTo(fx - 2, fy + 5); bone.lineTo(fx + 4, fy - 4); }
      else if (h3 < .032) { skull.moveTo(fx + 5, fy); skull.arc(fx, fy, 5, 0, TAU); skull.rect(fx - 3, fy + 2.5, 6, 3.5); sock.rect(fx - 3, fy - 1.5, 2.2, 2.2); sock.rect(fx + .8, fy - 1.5, 2.2, 2.2); }
      else if (h3 < .055) for (let k = 0; k < 4; k++) { const ox = fx + (Z.hash(i + k, j) - .5) * 30, oy = fy + (Z.hash(i, j + k) - .5) * 14, r = 1.5 + k; drop.moveTo(ox + r, oy); drop.ellipse(ox, oy, r, r * .5, 0, 0, TAU); }
      else if (h3 < .063) { dia(grate, cx, cy, HX * .5, HY * .5); for (let k = 1; k < 4; k++) { const t = k / 4 - .5; bars.moveTo(cx + t * HX - HX * .25, cy + t * HY + HY * .25); bars.lineTo(cx + t * HX + HX * .25, cy + t * HY - HY * .25); } }
    }
    for (let k = 0; k < 5; k++) { c.fillStyle = SHADES[k]; c.fill(sh[k]); }
    c.fillStyle = 'rgba(78,70,60,.45)'; c.fill(worn);
    c.lineWidth = 1.2; c.strokeStyle = '#4c453b'; c.stroke(hi);
    c.lineWidth = 1.6; c.strokeStyle = '#211d19'; c.stroke(lo);
    c.lineWidth = 2; c.strokeStyle = '#1a1713'; c.stroke(seam);
    c.lineWidth = 1.2; c.strokeStyle = '#191511'; c.stroke(crack);
    c.fillStyle = '#1a1713'; c.fill(chip);
    c.fillStyle = '#48423a'; c.fill(spL); c.fillStyle = '#2a2621'; c.fill(spD);
    // damp stains and soot: soft iso blotches (gradients are fine here, the floor is cached)
    const G = 224, gx0 = Math.floor(x0 / G), gx1 = Math.floor(x1 / G), gy0 = Math.floor(y0 / G), gy1 = Math.floor(y1 / G);
    for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
      const h = Z.hash(gx * 19 - 4, gy * 23 + 6); if (h > .35) continue;
      const x = gx * G + Z.hash(gx, gy * 5) * G, y = gy * G + Z.hash(gx * 5, gy) * G, r = 60 + h * 220;
      const g = c.createRadialGradient(x, y, 0, x, y, r), col = h < .08 ? '34,40,26' : '10,8,6';
      g.addColorStop(0, `rgba(${col},${h < .08 ? .3 : .38})`); g.addColorStop(1, `rgba(${col},0)`);
      c.save(); c.translate(x, y); c.scale(1, .5); c.translate(-x, -y); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
    }
    c.fillStyle = '#3a0b09'; c.fill(drop);
    c.fillStyle = '#0c0a08'; c.fill(grate); c.strokeStyle = '#46423c'; c.lineWidth = 2; c.stroke(grate); c.stroke(bars);
    c.lineCap = 'round'; c.strokeStyle = '#120f0c'; c.lineWidth = 4.5; c.stroke(bone); c.strokeStyle = '#857c69'; c.lineWidth = 2.2; c.stroke(bone); c.lineCap = 'butt';
    c.strokeStyle = '#120f0c'; c.lineWidth = 2; c.stroke(skull); c.fillStyle = '#958c78'; c.fill(skull); c.fillStyle = '#16120f'; c.fill(sock);
    // set-pieces whose anchor is near enough to touch this rect, back to front
    const pad = 260, ps = [];
    for (let my = Math.floor((y0 - pad) / M); my <= Math.floor((y1 + pad) / M); my++)
      for (let mx = Math.floor((x0 - pad) / M); mx <= Math.floor((x1 + pad) / M); mx++) {
        const p = piece(Z, mx, my);
        if (p.k && p.x > x0 - pad && p.x < x1 + pad && p.y > y0 - pad && p.y < y1 + pad) ps.push(p);
      }
    ps.sort((a, b) => a.y - b.y);
    for (const p of ps) { c.save(); DRAW[p.k](c, Z, p); c.restore(); }
  };

  // ---------- Under (every frame, before foes): rippling blood pools fed by slow drips ----------
  const under = Z => {
    const c = Z.ctx, P = Z.P, t = Z.now, hw = Z.W / 2 + 120, hh = Z.H / 2 + 120;
    const rip = new Path2D(), gl = new Path2D(), dr = new Path2D();
    let n = 0;
    for (let my = Math.floor((P.y - hh) / M); my <= Math.floor((P.y + hh) / M); my++)
      for (let mx = Math.floor((P.x - hw) / M); mx <= Math.floor((P.x + hw) / M); mx++) {
        const p = piece(Z, mx, my);
        if (p.k !== BLOOD || n > 12) continue;
        n++;
        for (let k = 0; k < 2; k++) { // a drip lands, a ring spreads and fades
          const per = 2.6 + k * .9, ph = ((t + p.v * 7 + k * 1.3) % per) / per;
          const x = p.x + (k ? 18 : -10) + (p.w - .5) * 20, y = p.y + (k ? 4 : -3), r = 3 + ph * 22;
          if (ph < .7) { rip.moveTo(x + r, y); rip.ellipse(x, y, r, r * .45, 0, 0, TAU); }
          if (ph > .86) { const fy = y - (1 - ph) * 260; dr.rect(x - 1, fy - 3, 2, 4); }
        }
        const g = .5 + .5 * Math.sin(t * 1.3 + p.v * 5);
        gl.moveTo(p.x - 8 + g * 6 + 10, p.y - 4); gl.ellipse(p.x - 8 + g * 6, p.y - 4, 10, 2.4, -.15, 0, TAU);
      }
    if (!n) return;
    c.save();
    c.lineWidth = 1.2; c.strokeStyle = 'rgba(150,40,32,.55)'; c.stroke(rip);
    c.fillStyle = 'rgba(190,70,55,.28)'; c.fill(gl);
    c.fillStyle = '#7a1612'; c.fill(dr);
    c.restore();
  };

  // ---------- Ambient (after darkness): fire, candle flames, pulsing seals, drifting embers ----------
  const ambient = Z => {
    const c = Z.ctx, P = Z.P, t = Z.now, hw = Z.W / 2 + 200, hh = Z.H / 2 + 200;
    const fl = new Path2D(), core = new Path2D(), emb = new Path2D();
    let n = 0;
    c.save();
    for (let my = Math.floor((P.y - hh) / M); my <= Math.floor((P.y + hh) / M); my++)
      for (let mx = Math.floor((P.x - hw) / M); mx <= Math.floor((P.x + hw) / M); mx++) {
        const p = piece(Z, mx, my);
        if (p.k === SEAL && n < 60) { // the carved seal breathes red
          const k = .5 + .5 * Math.sin(t * 1.4 + p.v * 9);
          Z.glow('255,30,20', 120, p.x, p.y, .12 + k * .14);
          c.save(); c.translate(p.x, p.y); c.scale(1, .5); c.globalAlpha = .3 + k * .45; c.strokeStyle = '#ff2a1a'; c.lineWidth = 2;
          c.beginPath(); c.arc(0, 0, 84, 0, TAU);
          for (let i = 0; i < 5; i++) { const a1 = -Math.PI / 2 + i * TAU / 5, a2 = a1 + TAU * 2 / 5; c.moveTo(Math.cos(a1) * 70, Math.sin(a1) * 70); c.lineTo(Math.cos(a2) * 70, Math.sin(a2) * 70); }
          c.stroke(); c.restore(); n += 3;
        }
        if (p.k !== BRAZIER && p.k !== TORCH && p.k !== SARC && p.k !== SEAL && p.k !== WALLS) continue;
        for (const L of lights(Z, p)) {
          if (n > 90) break;
          const x = L.x, y = L.y, f = Math.sin(t * 9 + x * .03) * .5 + Math.sin(t * 23 + y * .05) * .3;
          if (L.kind === 0) {
            Z.glow('255,120,40', 130 + f * 8, x, y + 14, .26 + f * .04); Z.glow('255,190,110', 34, x, y - 4, .7); n += 2;
            for (let k = -1; k <= 1; k++) {
              const hgt = (k ? 15 : 24) + f * 5 + Math.sin(t * 14 + k * 2) * 3, bx = x + k * 7;
              fl.moveTo(bx - 6, y); fl.quadraticCurveTo(bx - 4, y - hgt * .6, bx + Math.sin(t * 7 + k) * 3, y - hgt); fl.quadraticCurveTo(bx + 4, y - hgt * .6, bx + 6, y); fl.closePath();
              core.moveTo(bx - 3, y); core.quadraticCurveTo(bx, y - hgt * .7, bx + 3, y); core.closePath();
            }
          } else if (L.kind === 1) {
            Z.glow('255,130,50', 90 + f * 6, x, y + 10, .24 + f * .04); Z.glow('255,200,120', 22, x, y - 4, .65); n += 2;
            const hgt = 14 + f * 4 + Math.sin(t * 13 + x) * 2;
            fl.moveTo(x - 5, y); fl.quadraticCurveTo(x - 3, y - hgt * .6, x + Math.sin(t * 8 + y) * 2, y - hgt); fl.quadraticCurveTo(x + 3, y - hgt * .6, x + 5, y); fl.closePath();
            core.moveTo(x - 2.4, y); core.quadraticCurveTo(x, y - hgt * .65, x + 2.4, y); core.closePath();
          } else {
            Z.glow('255,170,80', 30, x, y - 3, .4 + f * .08); n++;
            const hgt = 6 + f * 1.5;
            fl.moveTo(x - 2, y); fl.quadraticCurveTo(x - 1, y - hgt * .7, x, y - hgt); fl.quadraticCurveTo(x + 1, y - hgt * .7, x + 2, y); fl.closePath();
          }
        }
      }
    // embers drifting up from the deeper halls
    for (let i = 0; i < 36; i++) {
      const a = Z.hash(i, 3), b = Z.hash(i, 9), sp = 16 + b * 26, span = Z.H + 160;
      const yy = P.y + Z.H / 2 + 80 - ((t * sp + b * span) % span), xx = P.x - Z.W / 2 - 60 + ((a * Z.W * 1.1 + Math.sin(t * .7 + i) * 18 + t * 5) % (Z.W + 120));
      const sz = 1.2 + (i % 3) * .6; emb.rect(xx, yy, sz, sz);
    }
    c.globalAlpha = .95; c.fillStyle = '#ff7a1c'; c.fill(fl);
    c.fillStyle = '#ffe6a0'; c.fill(core);
    c.globalAlpha = .65; c.fillStyle = '#ff9a40'; c.fill(emb);
    c.restore();
  };

  // ---------- Events ----------
  const ringAround = (Z, d, fn) => { const a0 = Math.random() * TAU; return k => fn(Z.P.x + Math.cos(a0 + k) * d, Z.P.y + Math.sin(a0 + k) * d); };
  const events = [
    { t: 20, run(Z) { // a champion pack of gutlings wreathed in cold fire
      Z.banner('A champion pack stirs', '#6ab4ff', false); Z.sfx('warn');
      const a = Math.random() * TAU, cx = Z.P.x + Math.cos(a) * 380, cy = Z.P.y + Math.sin(a) * 380;
      for (let i = 0; i < 8; i++) {
        const n = Z.spawn('imp', cx + Math.cos(i) * 30, cy + Math.sin(i) * 30);
        if (n) { n.champ = true; n.max *= 2.6; n.hp = n.max; n.sp *= 1.2; n.dmg *= 1.4; n.r = 12; n.xp = 3; }
      }
      const pr = Z.spawn('shaman', cx, cy); if (pr) { pr.max *= 1.8; pr.hp = pr.max; }
    } },
    { t: 72, run(Z) { // shield wall of the dead
      Z.banner('The dead stand in rank', '#d6cdb2', false); Z.sfx('warn');
      const a = Z.rnd(0, TAU), px = -Math.sin(a), py = Math.cos(a), bx = Z.P.x + Math.cos(a) * 420, by = Z.P.y + Math.sin(a) * 420;
      for (let i = -4; i <= 4; i++) Z.spawn('skeleton', bx + px * i * 30, by + py * i * 30);
    } },
    { t: 100, run(Z) { // ambush from every side
      Z.banner('Ambush!', '#ff4a30', true); Z.sfx('boss'); Z.shake(6);
      const at = ringAround(Z, 430, (x, y) => ({ x, y }));
      for (let i = 0; i < 8; i++) { const p = at(i / 8 * TAU), n = Z.spawn(i % 4 === 0 ? 'zombie' : 'imp', p.x, p.y); if (n && n.kind === 'imp') n.sp *= 1.1; }
      for (let i = 0; i < 2; i++) { const p = at(i * Math.PI + .4); Z.spawn('shaman', p.x, p.y); }
    } },
  ];

  // ---------- Music: original dark phrygian dirge, 74 bpm ----------
  const BASE = 38, PHR = [0, 1, 3, 5, 7, 8, 10];
  const ROOT = [0, 0, 1, 0, 0, 0, 6, 5, 0, 0, 1, 3, 8, 6, 1, 0]; // semitone offsets per bar (6 = tritone)
  const _ = null;
  const PH = [
    [0, _, _, 1, _, _, 4, _, 3, _, _, _, 1, _, _, _],
    [7, _, _, 6, _, 4, _, _, 5, _, _, _, _, _, _, _],
    [4, _, 3, _, 1, _, _, _, 2, _, 1, _, 0, _, _, _],
    [0, _, _, _, 4, _, _, _, 8, _, _, 7, _, _, _, _],
  ];
  const ORDER = [0, 1, 0, 2, 3, 1, 2, 3];
  const deg = i => 50 + PHR[((i % 7) + 7) % 7] + 12 * Math.floor(i / 7);
  const music = {
    bpm: 74, div: 2,
    step(s, t, A) {
      const spb = 60 / 74 / 2, bar = Math.floor(s / 8) % 16, b = s % 8, r = ROOT[bar], boss = A.boss, inten = A.inten || 0;
      // low drones: sub root + a grinding minor-second / tritone cluster
      if (b === 0 && bar % 2 === 0) {
        A.tone(t, BASE + r, spb * 16, .06, { type: 'sawtooth', cutoff: 240, attack: .5 });
        A.pad(bar % 4 === 0 ? [BASE + 12 + r, BASE + 13 + r] : [BASE + 12 + r, BASE + 18 + r], t, spb * 16, .014, { type: 'sawtooth', cutoff: 520, q: 3, detune: 14 });
      }
      // distant choir
      if (b === 2 && bar % 4 === 0) A.pad([BASE + 24 + r, BASE + 31 + r], t, spb * 30, boss ? .022 : .012, { type: 'triangle', cutoff: boss ? 1400 : 1000, q: 2, detune: 12 });
      // tolling bells
      if (b === 0 && bar % 4 === 0) A.bell(BASE + 24 + r, t, .05);
      if (b === 4 && bar % 4 === 2) A.bell(BASE + 30, t, .032);
      // heartbeat + industrial toms
      if (b === 0) A.kick(t, boss ? .75 : .45);
      if (b === 1 && bar % 2 === 1) A.kick(t, .3);
      if (b === 6 && bar % 2 === 1) A.tom(t, 72, .3);
      if (b === 7 && bar % 4 === 3) A.tom(t, 54, .28);
      // metallic clangs from somewhere below
      if ((s * 7 + bar * 3) % 13 === 0) { A.noise(t, .3, .028, { type: 'bandpass', f: A.rnd(1700, 3200), q: 14 }); A.tone(t, 81 + (s % 3), .6, .01, { type: 'square', decay: true, cutoff: 2600 }); }
      if (b === 0 && bar % 8 === 0) A.noise(t, spb * 16, .02, { type: 'lowpass', f: 260, f2: 900 });
      if (inten > .4 && b % 2 === 1) A.hat(t, .03, false);
      // sparse reverb-drenched guitar with a ghost echo
      const ph = PH[ORDER[Math.floor(bar / 2) % ORDER.length]], n = ph[(bar % 2) * 8 + b];
      if (n !== null) { const m = deg(n) + (r === 6 ? 1 : 0); A.pluck(m, t, .55); A.pluck(m + 12, t + spb * 3, .16); }
      // war drums, heavy brass-like groan when the abbot walks
      if (boss) {
        if (b % 2 === 0) A.kick(t + .001, .65);
        if (b === 3 || b === 5 || b === 7) A.tom(t, 92 - b * 4, .38);
        if (b === 4) A.snare(t, .26);
        if (b === 0) A.tone(t, BASE + r, spb * 7, .04, { type: 'sawtooth', cutoff: 500, sweep: 900, attack: .08 });
        if (b === 2 && bar % 2 === 1) A.pad([BASE + 12 + r, BASE + 15 + r], t, spb * 6, .018, { type: 'sawtooth', cutoff: 800, q: 4 });
      }
    },
  };

  return {
    id: 'd2', name: 'The Bloodmoor Crypts', nod: 'Diablo II', portal: '200,40,30', bg: '#1a1713', dark: .84, dim: .24,
    ground, under, ambient,
    mix: { imp: 6, skeleton: 2.2, zombie: 1.2, shaman: .8 },
    target: 1,
    foes: { imp, shaman, skeleton, zombie },
    boss, events, music,
  };
})());
