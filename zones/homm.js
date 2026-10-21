// Zone homm: a lush, painterly 1999-style adventure map. Winding cobble and dirt roads, rivers with stone bridges,
// snow-capped mountains, windmills, mines, shrines and resource piles. Wandering monster stacks carry their own
// stack counts, and a storm djinn sorcerer rules the frontier. A nod to Heroes of Might and Magic III.
ZONES.push((() => {
  const TAU = Math.PI * 2, fl = Math.floor;
  const W = (white, c) => (white ? '#fff' : c);
  const poly = (p, a) => { p.moveTo(a[0], a[1]); for (let i = 2; i < a.length; i += 2) p.lineTo(a[i], a[i + 1]); p.closePath(); };
  const circ = (p, x, y, r) => { if (!(r > 0)) return; p.moveTo(x + r, y); p.arc(x, y, r, 0, TAU); };
  const ell = (p, x, y, rx, ry) => { if (!(rx > 0) || !(ry > 0)) return; p.moveTo(x + rx, y); p.ellipse(x, y, rx, ry, 0, 0, TAU); };
  const face = (c, e) => { if (Math.cos(e.ang) < 0) c.scale(-1, 1); };

  /* ================= Map layout: a designed 1600px macro grid =================
     Each macro cell has a cobble or dirt road crossing in its centre (with a signpost), a river running down its
     west edge (bridged where the road crosses, sometimes with a water mill), four quadrant "sites" (mountains with a
     gold mine, forests, a windmill, a guard tower, a shrine, an obelisk on a puzzle plaza, learning stones, an
     artifact pedestal), and a scatter of tree clumps and resource piles. */
  const MC = 1600;
  const roadY = (x, my) => my * MC + 800 + 62 * Math.sin(x / 300 + my * 1.9) + 20 * Math.sin(x / 113 + my * .7);
  const roadX = (y, mx) => mx * MC + 800 + 62 * Math.sin(y / 280 + mx * 2.3) + 20 * Math.sin(y / 127 + mx * 1.3);
  const hasRiver = (Z, mx) => Z.hash(mx * 7 + 3, 91) < .62;
  const riverX = (y, mx) => mx * MC + 76 * Math.sin(y / 390 + mx * 1.1) + 28 * Math.sin(y / 170 + mx * 3.1);
  const cobH = (Z, my) => Z.hash(41, my * 3 + 1) < .55;
  const cobV = (Z, mx) => Z.hash(mx * 3 + 2, 43) < .45;
  const riverGap = (Z, x, y) => { const vx = Math.round(x / MC); return hasRiver(Z, vx) ? Math.abs(x - riverX(y, vx)) : 1e9; };
  const clearOf = (Z, x, y) => {
    const ry = Math.round((y - 800) / MC), rx = Math.round((x - 800) / MC);
    return Math.min(Math.abs(y - roadY(x, ry)), Math.abs(x - roadX(y, rx)), riverGap(Z, x, y) - 22);
  };

  const QC = [[400, 400], [1200, 400], [400, 1200], [1200, 1200]];
  const SITEK = ['mount', 'forest', 'windmill', 'tower', 'shrine', 'obelisk', 'stones', 'artifact', 'mount', 'forest', 'mount', 'windmill'];
  const PROPK = ['gold', 'wood', 'ore', 'gem', 'crystal', 'mercury', 'sulfur', 'chest', 'camp', 'gold', 'wood', 'ore', 'chest'];
  const ANIM = { windmill: 1, wmill: 1, camp: 1, mine: 1, tower: 1, gold: 2, gem: 2, crystal: 2, mercury: 2, artifact: 2, shrine: 2, obelisk: 2, stones: 2, chest: 2 };
  const cache = new Map();
  const cellItems = (Z, mx, my) => {
    const key = mx + ',' + my;
    const hit = cache.get(key); if (hit) return hit;
    if (cache.size > 160) cache.clear();
    const ox = mx * MC, oy = my * MC, L = [], sites = [];
    let ctr = 0;
    const R = () => { ctr++; return Z.hash(mx * 131 + ctr * 17 + 7, my * 97 - ctr * 5 + 1); };
    const add = (k, x, y, o) => { const it = Object.assign({ k, x, y, v: Z.hash(fl(x) * 3 + 1, fl(y) * 5 - 2), u: Z.hash(fl(x) + 7, fl(y) * 3 + 11) }, o); L.push(it); return it; };
    const tree = (x, y, sc) => { if (clearOf(Z, x, y) > 50) add(R() < .32 ? 'pine' : 'tree', x, y, { s: sc || .85 + R() * .4 }); };
    const prop = (x, y, k) => { if (clearOf(Z, x, y) > 60) add(k || PROPK[fl(R() * PROPK.length)], x, y); };
    const ring = (cx, cy, n, r0, r1, fn) => { const a0 = R() * TAU; for (let i = 0; i < n; i++) { const a = a0 + i / n * TAU + (R() - .5) * .6, d = r0 + R() * (r1 - r0); fn(cx + Math.cos(a) * d, cy + Math.sin(a) * d * .8); } };

    // quadrant sites: pick 4 distinct kinds
    const order = SITEK.map((k, i) => [k, Z.hash(mx * 53 + i * 19 + 2, my * 41 - i * 23 + 9)]).sort((a, b) => a[1] - b[1]), kinds = [];
    for (const [k] of order) if (kinds.length < 4 && !kinds.includes(k)) kinds.push(k);
    for (let q = 0; q < 4; q++) {
      const cx = ox + QC[q][0] + (R() - .5) * 60, cy = oy + QC[q][1] + (R() - .5) * 60, k = kinds[q], S = { k, x: cx, y: cy, spur: null };
      sites.push(S);
      if (k === 'mount') {
        add('peak', cx + (R() - .5) * 30, cy + 10, { w: 240 + R() * 50, h: 185 + R() * 35 });
        const n = 3 + fl(R() * 2);
        for (let i = 1; i <= n; i++) {
          const sd = i % 2 ? -1 : 1, d = 70 + i * 22 + R() * 18, w = 130 + R() * 80, h = 100 + R() * 70, px = cx + sd * d, py = cy - 40 + R() * 80;
          if (clearOf(Z, px + sd * w * .5, py) > 30) add('peak', px, py, { w, h });
        }
        for (let i = 0; i < 3; i++) add('rocks', cx + (R() - .5) * 270, cy + 46 + R() * 34, { s: .6 + R() * .5 });
        if (R() < .65) { const m = add('mine', cx + (R() - .5) * 80, cy + 96); S.spur = [m.x, m.y + 14]; prop(m.x + 66, m.y + 20, 'ore'); }
        ring(cx, cy + 60, 2, 150, 200, (x, y) => prop(x, y, R() < .5 ? 'ore' : 'gold'));
      } else if (k === 'forest') {
        const n = 20 + fl(R() * 8);
        for (let i = 0; i < n; i++) { const a = R() * TAU, d = 52 + Math.sqrt(R()) * 160; tree(cx + Math.cos(a) * d, cy + Math.sin(a) * d * .8, 1 + R() * .35); }
        add(R() < .5 ? 'camp' : 'chest', cx, cy + 8);
        for (let i = 0; i < 3; i++) add('bush', cx + (R() - .5) * 300, cy + (R() - .5) * 220);
      } else {
        if (k === 'windmill') { add('wheat', cx - 90, cy - 6); add('windmill', cx + 34, cy); }
        else if (k === 'obelisk') { add('plaza', cx, cy - 4); add('obelisk', cx, cy); }
        else add(k, cx, cy);
        S.spur = [cx + (k === 'windmill' ? 34 : 0), cy + 26];
        ring(cx, cy, 3 + fl(R() * 2), 165, 240, (x, y) => tree(x, y));
        ring(cx, cy, 2 + fl(R() * 2), 105, 150, (x, y) => prop(x, y));
      }
    }
    // scatter: tree clumps, lone resources, boulders, bushes
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
      const sx = ox + i * 320 + 160 + (R() - .5) * 180, sy = oy + j * 320 + 160 + (R() - .5) * 180, r = R();
      if (sites.some(S => Math.hypot(S.x - sx, S.y - sy) < 250)) continue;
      if (r < .46) { const n = 4 + fl(R() * 6); for (let t = 0; t < n; t++) tree(sx + (R() - .5) * 140, sy + (R() - .5) * 100); if (R() < .4) prop(sx + (R() - .5) * 180, sy + 70); }
      else if (r < .72) { prop(sx, sy); if (R() < .4) prop(sx + 46, sy + 18); }
      else if (r < .8) { if (clearOf(Z, sx, sy) > 50) add('rocks', sx, sy, { s: .7 + R() * .5 }); }
      else if (r < .92) for (let t = 0; t < 3; t++) { const bx = sx + (R() - .5) * 80, by = sy + (R() - .5) * 50; if (clearOf(Z, bx, by) > 40) add('bush', bx, by); }
    }
    // roadside caches and lone trees
    for (let i = 0; i < 6; i++) {
      const t = (i + .3 + R() * .4) / 6, sd = R() < .5 ? -1 : 1, off = 74 + R() * 40;
      if (i % 2) { const x = ox + t * MC; if (R() < .6) prop(x, roadY(x, my) + sd * off); else tree(x, roadY(x, my) + sd * off); }
      else { const y = oy + t * MC; if (R() < .6) prop(roadX(y, mx) + sd * off, y); else tree(roadX(y, mx) + sd * off, y); }
    }
    // crossroads signpost and a roadside cache
    const crx = roadX(oy + 800, mx), cry = roadY(crx, my);
    add('sign', crx + 60, cry - 40);
    prop(crx - 96, cry + 96,R() < .5 ? 'chest' : 'camp');
    // bridge where the road crosses this cell's river, and sometimes a water mill downstream
    if (hasRiver(Z, mx)) {
      let by = roadY(riverX(oy + 800, mx), my); const bx = riverX(by, mx); by = roadY(bx, my);
      add('bridge', bx, by + 26, { by });
      if (R() < .7) { const wy = oy + 1020; add('wmill', riverX(wy, mx), wy); }
    }
    for (const it of L) it.an = ANIM[it.k] || 0;
    const res = { L, sites, anim: L.filter(it => it.an) };
    cache.set(key, res);
    return res;
  };

  /* ================= Floor art (cached) ================= */
  const BG = '#5c7d3d';
  const BRUSH = ['#53743a', '#68884a', '#4b6b35', '#738f4f'];
  const BLOT = ['132,150,78', '62,94,50', '148,142,80', '86,120,66'];
  const OLW = '#3a2a18'; // warm thin outline for buildings

  const DRAW = {
    tree(c, Z, p) {
      const s = p.s || 1, x = p.x, y = p.y, cy = y - 28 * s, alt = p.v < .25;
      c.fillStyle = 'rgba(26,38,16,.32)'; c.beginPath(); c.ellipse(x + 9 * s, y + 1, 22 * s, 7 * s, 0, 0, TAU); c.fill();
      const tk = new Path2D(); poly(tk, [x - 4 * s, y + 1, x + 4 * s, y + 1, x + 2.6 * s, y - 16 * s, x - 2.6 * s, y - 16 * s]);
      c.fillStyle = '#5e3e22'; c.fill(tk); c.strokeStyle = '#2e1e10'; c.lineWidth = 1; c.stroke(tk);
      const sil = new Path2D(), mid = new Path2D(), hi = new Path2D(), dk = new Path2D();
      for (const [dx, dy, r] of [[-11, 4, 12], [11, 4, 12], [0, -9, 14], [0, 6, 13], [-6, -3, 12], [7, -4, 12]]) {
        circ(sil, x + dx * s, cy + dy * s, r * s); circ(mid, x + dx * s - 2 * s, cy + dy * s - 2.5 * s, r * s * .7);
      }
      circ(hi, x - 7 * s, cy - 10 * s, 4.6 * s); circ(hi, x + 2 * s, cy - 15 * s, 3.8 * s); circ(hi, x - 13 * s, cy - 1 * s, 3.4 * s); circ(hi, x + 6 * s, cy - 6 * s, 3 * s);
      ell(dk, x + 4 * s, cy + 12 * s, 13 * s, 4.5 * s);
      c.strokeStyle = '#1f3a17'; c.lineWidth = 1.3; c.stroke(sil);
      c.fillStyle = alt ? '#33561f' : '#2d5222'; c.fill(sil);
      c.fillStyle = alt ? '#4b7a2a' : '#3f6d2e'; c.fill(mid);
      c.fillStyle = alt ? '#7aa448' : '#64944a'; c.fill(hi);
      c.fillStyle = 'rgba(20,40,16,.45)'; c.fill(dk);
    },
    pine(c, Z, p) {
      const s = p.s || 1, x = p.x, y = p.y;
      c.fillStyle = 'rgba(26,38,16,.32)'; c.beginPath(); c.ellipse(x + 8 * s, y + 1, 16 * s, 6 * s, 0, 0, TAU); c.fill();
      c.fillStyle = '#5a3a20'; c.fillRect(x - 2.5 * s, y - 10 * s, 5 * s, 11 * s);
      const sil = new Path2D(), lit = new Path2D();
      for (let i = 0; i < 3; i++) {
        const by = y - 8 * s - i * 13 * s, bw = (17 - i * 4) * s, ty = by - 22 * s;
        poly(sil, [x - bw, by, x + bw, by, x, ty]); poly(lit, [x - bw + 2, by - 1.5, x - 1, by - 3, x, ty + 2]);
      }
      c.strokeStyle = '#142a1c'; c.lineWidth = 1.3; c.lineJoin = 'round'; c.stroke(sil);
      c.fillStyle = '#244a36'; c.fill(sil); c.fillStyle = '#356448'; c.fill(lit);
    },
    bush(c, Z, p) {
      const x = p.x, y = p.y, sil = new Path2D(), hi = new Path2D();
      circ(sil, x - 7, y - 5, 8); circ(sil, x + 6, y - 4, 8); circ(sil, x, y - 11, 9); circ(hi, x - 3, y - 13, 3.6); circ(hi, x - 9, y - 7, 2.6);
      c.strokeStyle = '#1f3a17'; c.lineWidth = 1.2; c.stroke(sil); c.fillStyle = '#3a6428'; c.fill(sil); c.fillStyle = '#5e8e3e'; c.fill(hi);
      if (p.v < .4) { const b = new Path2D(); for (let i = 0; i < 4; i++) b.rect(x - 9 + Z.hash(fl(x) + i, 3) * 16, y - 14 + Z.hash(5, fl(y) + i) * 10, 2.4, 2.4); c.fillStyle = p.u < .5 ? '#d8404a' : '#e8e0f0'; c.fill(b); }
    },
    rocks(c, Z, p) {
      const s = p.s || 1, x = p.x, y = p.y, sil = new Path2D(), lt = new Path2D();
      for (let i = 0; i < 3; i++) { const bx = x + (i - 1) * 13 * s, r = (9 - Math.abs(i - 1) * 2 + p.v * 3) * s; ell(sil, bx, y - r * .6, r, r * .75); ell(lt, bx - r * .25, y - r * .85, r * .55, r * .38); }
      c.strokeStyle = '#38342c'; c.lineWidth = 1.2; c.stroke(sil); c.fillStyle = '#7c7668'; c.fill(sil); c.fillStyle = '#a49c8a'; c.fill(lt);
    },
    peak(c, Z, p) {
      const { x, y, w, h } = p, j = p.u, L = x - w / 2, R = x + w / 2, ax = x + (p.v - .5) * w * .22, ay = y - h;
      c.fillStyle = 'rgba(30,44,20,.4)'; c.beginPath(); c.ellipse(x + w * .08, y - 1, w * .58, 15, 0, 0, TAU); c.fill();
      const lp = [L, y, L + w * .13, y - h * (.27 + j * .08), L + w * .25, y - h * .35, ax - w * .1, y - h * (.76 + j * .06), ax, ay];
      const sil = new Path2D(); poly(sil, lp.concat([ax + w * .09, y - h * .84, ax + w * .19, y - h * (.58 + j * .08), R - w * .15, y - h * .33, R, y]));
      const lit = new Path2D(); poly(lit, lp.concat([ax - w * .02, y - h * .64, ax + w * .07, y - h * .36, ax + w * .02, y]));
      c.fillStyle = '#6c6250'; c.fill(sil); c.fillStyle = '#a2927a'; c.fill(lit);
      c.save(); c.clip(sil);
      const bd = new Path2D(), bl = new Path2D();
      for (let i = 1; i <= 3; i++) {
        const f = i * .21 + (j - .5) * .05, yy = y - h * f, half = w * .5 * (1 - f);
        bd.moveTo(ax - half, yy + 3); bd.lineTo(ax - half * .45, yy - 2); bd.lineTo(ax, yy + 2); bd.lineTo(ax + half * .55, yy - 3); bd.lineTo(ax + half, yy + 2);
        bl.moveTo(ax - half, yy + 5); bl.lineTo(ax - half * .45, yy);
      }
      for (let i = 0; i < 5; i++) { const t = (i + .5) / 5 - .5; bd.moveTo(ax + w * t * .8, y); bd.lineTo(ax + w * t * .4, y - h * .32); }
      c.strokeStyle = '#4e4636'; c.lineWidth = 1.3; c.stroke(bd); c.strokeStyle = '#c4b49a'; c.lineWidth = 1; c.stroke(bl);
      if (h > 110) {
        const sn = new Path2D(), f0 = .6 + j * .06; sn.moveTo(L - 4, ay - 6); sn.lineTo(R + 4, ay - 6);
        for (let i = 0; i <= 8; i++) sn.lineTo(R + 4 - i * (w + 8) / 8, y - h * (f0 + (i % 2 ? -.08 : .04) + Z.hash(i, fl(x)) * .04));
        sn.closePath();
        c.fillStyle = '#b6c2d2'; c.fill(sn); c.clip(lit); c.fillStyle = '#f0f3f6'; c.fill(sn);
      }
      c.restore();
      c.strokeStyle = '#3a3226'; c.lineWidth = 1.4; c.lineJoin = 'round'; c.stroke(sil);
      const gr = new Path2D(); for (let i = 0; i < 6; i++) ell(gr, L + w * (i + .5) / 6 + (Z.hash(i, fl(y)) - .5) * 10, y - 1, 11 + Z.hash(fl(x), i) * 6, 4.5);
      c.fillStyle = '#4c6c32'; c.fill(gr);
    },
    mine(c, Z, p) {
      const x = p.x, y = p.y, md = new Path2D(), lt = new Path2D();
      poly(md, [x - 58, y, x - 50, y - 30, x - 26, y - 52, x + 8, y - 58, x + 40, y - 42, x + 56, y - 14, x + 60, y]);
      poly(lt, [x - 58, y, x - 50, y - 30, x - 26, y - 52, x + 8, y - 58, x - 4, y - 30, x - 18, y]);
      c.fillStyle = '#6a5e4a'; c.fill(md); c.fillStyle = '#9a8a6e'; c.fill(lt); c.strokeStyle = '#3a3022'; c.lineWidth = 1.3; c.stroke(md);
      const ar = new Path2D(); ar.moveTo(x - 20, y); ar.lineTo(x - 20, y - 26); ar.quadraticCurveTo(x, y - 46, x + 20, y - 26); ar.lineTo(x + 20, y); ar.closePath();
      c.fillStyle = '#120c06'; c.fill(ar);
      const tb = new Path2D(); tb.rect(x - 24, y - 30, 6, 30); tb.rect(x + 18, y - 30, 6, 30); tb.rect(x - 27, y - 36, 54, 7);
      c.fillStyle = '#7a5230'; c.fill(tb); c.strokeStyle = OLW; c.lineWidth = 1.1; c.stroke(tb);
      const rl = new Path2D(); rl.moveTo(x - 9, y - 4); rl.lineTo(x - 14, y + 22); rl.moveTo(x + 9, y - 4); rl.lineTo(x + 14, y + 22);
      for (let i = 0; i < 4; i++) { const yy = y + i * 7; rl.moveTo(x - 12 - i, yy); rl.lineTo(x + 12 + i, yy); }
      c.strokeStyle = '#4a3a2a'; c.lineWidth = 2; c.stroke(rl);
      // ore cart full of gold
      const ct = new Path2D(); poly(ct, [x + 24, y + 10, x + 46, y + 10, x + 44, y + 22, x + 26, y + 22]);
      c.fillStyle = '#6e5038'; c.fill(ct); c.strokeStyle = OLW; c.stroke(ct);
      const nug = new Path2D(); circ(nug, x + 30, y + 9, 4); circ(nug, x + 36, y + 7, 4.5); circ(nug, x + 41, y + 9, 3.5);
      c.fillStyle = '#e8b830'; c.fill(nug);
      c.fillStyle = '#26201a'; c.beginPath(); c.arc(x + 29, y + 23, 2.6, 0, TAU); c.arc(x + 42, y + 23, 2.6, 0, TAU); c.fill();
      // flag pole (the cloth flutters in under)
      c.strokeStyle = '#3a2a1a'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x + 40, y - 40); c.lineTo(x + 40, y - 92); c.stroke();
      c.fillStyle = '#f0c848'; c.beginPath(); c.arc(x + 40, y - 93, 2.6, 0, TAU); c.fill();
    },
    windmill(c, Z, p) {
      const x = p.x, y = p.y;
      c.fillStyle = 'rgba(26,38,16,.35)'; c.beginPath(); c.ellipse(x + 16, y, 40, 10, 0, 0, TAU); c.fill();
      const bd = new Path2D(), lt = new Path2D(); poly(bd, [x - 27, y, x + 27, y, x + 17, y - 76, x - 17, y - 76]); poly(lt, [x - 27, y, x - 2, y, x - 2, y - 76, x - 17, y - 76]);
      c.fillStyle = '#b4a07c'; c.fill(bd); c.fillStyle = '#dccaa4'; c.fill(lt);
      const tm = new Path2D(); tm.moveTo(x - 24, y - 24); tm.lineTo(x + 24, y - 24); tm.moveTo(x - 20, y - 52); tm.lineTo(x + 20, y - 52);
      tm.moveTo(x - 24, y - 24); tm.lineTo(x - 10, y - 52); tm.moveTo(x + 24, y - 24); tm.lineTo(x + 10, y - 52);
      c.strokeStyle = '#7a5a36'; c.lineWidth = 2.2; c.stroke(tm);
      c.strokeStyle = OLW; c.lineWidth = 1.3; c.stroke(bd);
      const dr = new Path2D(); dr.moveTo(x - 7, y); dr.lineTo(x - 7, y - 12); dr.arc(x, y - 12, 7, Math.PI, 0); dr.lineTo(x + 7, y); dr.closePath();
      c.fillStyle = '#4a2e18'; c.fill(dr); c.fillStyle = '#2a1a10'; c.fillRect(x + 6, y - 44, 6, 7);
      const rf = new Path2D(), rl = new Path2D(); poly(rf, [x - 25, y - 72, x + 25, y - 72, x + 3, y - 110]); poly(rl, [x - 25, y - 72, x - 4, y - 72, x + 3, y - 110]);
      c.fillStyle = '#7e3424'; c.fill(rf); c.fillStyle = '#a84a30'; c.fill(rl); c.strokeStyle = OLW; c.stroke(rf);
      const sk = new Path2D(); for (let i = 0; i < 3; i++) { sk.rect(x - 40 + i * 9, y - 7, 8, 8); } c.fillStyle = '#d8c69a'; c.fill(sk); c.strokeStyle = '#6a5434'; c.lineWidth = 1; c.stroke(sk);
    },
    wheat(c, Z, p) {
      const x = p.x, y = p.y, f = new Path2D(); poly(f, [x - 60, y - 34, x + 34, y - 34, x + 44, y + 30, x - 50, y + 30]);
      c.fillStyle = '#b89a48'; c.fill(f);
      const st = new Path2D(); for (let i = 0; i < 9; i++) { const t = i / 8; st.moveTo(x - 58 + t * 92, y - 32); st.lineTo(x - 48 + t * 92, y + 28); }
      c.strokeStyle = '#9a7c34'; c.lineWidth = 2.4; c.stroke(st); c.strokeStyle = '#d8bc64'; c.lineWidth = 1; c.stroke(st);
      const fc = new Path2D(); fc.moveTo(x - 64, y - 37); fc.lineTo(x + 38, y - 37); fc.lineTo(x + 49, y + 34); fc.lineTo(x - 54, y + 34); fc.closePath();
      for (let i = 0; i <= 5; i++) { const px = x - 54 + i * 20.6; fc.moveTo(px, y + 34); fc.lineTo(px, y + 26); }
      c.strokeStyle = '#6e4e2a'; c.lineWidth = 1.6; c.stroke(fc);
    },
    wmill(c, Z, p) {
      const x = p.x, y = p.y, hx = x + 52;
      const wl = new Path2D(); wl.rect(hx, y - 46, 80, 46);
      c.fillStyle = '#c8b48c'; c.fill(wl);
      const tm = new Path2D(); tm.rect(hx, y - 46, 4, 46); tm.rect(hx + 38, y - 46, 4, 46); tm.rect(hx + 76, y - 46, 4, 46); tm.rect(hx, y - 24, 80, 3);
      c.fillStyle = '#6a4a2a'; c.fill(tm); c.strokeStyle = OLW; c.lineWidth = 1.3; c.stroke(wl);
      c.fillStyle = '#3a2414'; c.fillRect(hx + 52, y - 20, 14, 20); c.fillRect(hx + 14, y - 40, 12, 10);
      const rf = new Path2D(), rl = new Path2D(); poly(rf, [hx - 8, y - 44, hx + 88, y - 44, hx + 70, y - 80, hx + 10, y - 80]); poly(rl, [hx - 8, y - 44, hx + 40, y - 44, hx + 40, y - 80, hx + 10, y - 80]);
      c.fillStyle = '#9a7a3e'; c.fill(rf); c.fillStyle = '#c0a050'; c.fill(rl); c.strokeStyle = OLW; c.stroke(rf);
      const th = new Path2D(); for (let i = 1; i < 4; i++) { th.moveTo(hx - 8 + i * 4.5, y - 44 - i * 9); th.lineTo(hx + 88 - i * 4.5, y - 44 - i * 9); }
      c.strokeStyle = '#7a5e2a'; c.lineWidth = 1; c.stroke(th);
      // axle housing and the dark wheel pit (the wheel itself turns in under)
      c.fillStyle = '#5e5446'; c.fillRect(x + 26, y - 26, 28, 10);
      c.fillStyle = 'rgba(16,40,56,.55)'; c.beginPath(); c.ellipse(x + 28, y + 4, 30, 7, 0, 0, TAU); c.fill();
    },
    tower(c, Z, p) {
      const x = p.x, y = p.y;
      c.fillStyle = 'rgba(26,38,16,.35)'; c.beginPath(); c.ellipse(x + 14, y, 34, 9, 0, 0, TAU); c.fill();
      const bd = new Path2D(); bd.moveTo(x - 22, y - 86); bd.lineTo(x - 22, y); bd.ellipse(x, y, 22, 7, 0, Math.PI, 0, true); bd.lineTo(x + 22, y - 86); bd.closePath();
      c.fillStyle = '#857c6c'; c.fill(bd); c.fillStyle = '#b6ad98'; c.fillRect(x - 22, y - 86, 20, 86);
      const cr = new Path2D(); for (let i = 0; i < 6; i++) { const yy = y - 12 - i * 13; cr.moveTo(x - 22, yy); cr.lineTo(x + 22, yy); for (let k = 0; k < 3; k++) { const xx = x - 18 + k * 14 + (i % 2) * 7; cr.moveTo(xx, yy); cr.lineTo(xx, yy + 13); } }
      c.strokeStyle = '#6a6252'; c.lineWidth = 1; c.stroke(cr);
      const mr = new Path2D(); for (let k = 0; k < 4; k++) mr.rect(x - 26 + k * 14, y - 98, 9, 12); mr.rect(x - 26, y - 88, 52, 6);
      c.fillStyle = '#a49a86'; c.fill(mr); c.strokeStyle = '#3c3628'; c.lineWidth = 1.2; c.stroke(mr); c.stroke(bd);
      const dr = new Path2D(); dr.moveTo(x - 7, y + 5); dr.lineTo(x - 7, y - 12); dr.arc(x, y - 12, 7, Math.PI, 0); dr.lineTo(x + 7, y + 5); dr.closePath();
      c.fillStyle = '#3a2414'; c.fill(dr); c.fillStyle = '#1c140c'; c.fillRect(x - 3, y - 58, 4, 12); c.fillRect(x + 9, y - 40, 3, 10);
      // banner under the battlements
      const bn = new Path2D(); poly(bn, [x - 13, y - 82, x - 3, y - 82, x - 3, y - 62, x - 8, y - 66, x - 13, y - 62]);
      c.fillStyle = '#2c4cb8'; c.fill(bn); c.fillStyle = '#f0c848'; c.fillRect(x - 9.5, y - 78, 3, 6);
      c.strokeStyle = '#3a2a1a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 14, y - 96); c.lineTo(x + 14, y - 132); c.stroke();
    },
    shrine(c, Z, p) {
      const x = p.x, y = p.y;
      const st = new Path2D(); ell(st, x, y, 46, 15); const s2 = new Path2D(); ell(s2, x, y - 5, 38, 12);
      c.fillStyle = '#8e8676'; c.fill(st); c.fillStyle = '#c4bca6'; c.fill(s2); c.strokeStyle = '#4a4436'; c.lineWidth = 1.2; c.stroke(st); c.stroke(s2);
      const col = new Path2D(), cs = new Path2D();
      for (const dx of [-28, -10, 10, 28]) { col.rect(x + dx - 4, y - 50, 8, 44); cs.rect(x + dx + 1, y - 50, 3, 44); }
      c.fillStyle = '#ece6d6'; c.fill(col); c.fillStyle = '#b8b0a0'; c.fill(cs); c.strokeStyle = '#5a5444'; c.lineWidth = 1; c.stroke(col);
      const en = new Path2D(); ell(en, x, y - 52, 38, 9); c.fillStyle = '#d8d0bc'; c.fill(en); c.strokeStyle = '#5a5444'; c.stroke(en);
      const dm = new Path2D(); dm.moveTo(x - 34, y - 54); dm.bezierCurveTo(x - 32, y - 96, x + 32, y - 96, x + 34, y - 54); dm.closePath();
      c.fillStyle = '#2f58b4'; c.fill(dm); c.strokeStyle = '#1a2a5a'; c.lineWidth = 1.3; c.stroke(dm);
      const dh = new Path2D(); dh.moveTo(x - 24, y - 58); dh.bezierCurveTo(x - 22, y - 84, x - 6, y - 88, x + 2, y - 86); dh.lineTo(x - 6, y - 60); dh.closePath();
      c.fillStyle = '#5f8ae2'; c.fill(dh);
      c.fillStyle = '#f0c848'; c.beginPath(); c.arc(x, y - 88, 4, 0, TAU); c.fill(); c.fillRect(x - 1, y - 100, 2, 10);
      c.fillStyle = '#8ad0ff'; c.fillRect(x - 3, y - 30, 6, 10);
    },
    plaza(c, Z, p) {
      const x = p.x, y = p.y;
      c.save(); c.translate(x, y); c.scale(1, .55); c.rotate(Math.PI / 4);
      c.fillStyle = '#8a826e'; c.fillRect(-74, -74, 148, 148);
      const PC = ['#5a74a8', '#b08a48', '#9a5040', '#6a8a50'], P = PC.map(() => new Path2D()), tabs = new Path2D();
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        const tx = -68 + i * 34, ty = -68 + j * 34, k = (i * 3 + j * 5 + fl(p.v * 4)) % 4;
        P[k].rect(tx + 2, ty + 2, 30, 30);
        if ((i + j) % 2) circ(P[k], tx + 33, ty + 17, 6); else circ(P[k], tx + 17, ty + 33, 6);
        if (i === 1 && j === 1) circ(tabs, tx + 17, ty + 17, 4);
      }
      PC.forEach((col, i) => { c.fillStyle = col; c.fill(P[i]); });
      c.strokeStyle = '#3e3a2e'; c.lineWidth = 1.5; P.forEach(pp => c.stroke(pp)); c.strokeRect(-74, -74, 148, 148);
      c.restore();
    },
    obelisk(c, Z, p) {
      const x = p.x, y = p.y;
      const pl = new Path2D(); pl.rect(x - 20, y - 12, 40, 12); pl.rect(x - 15, y - 20, 30, 8);
      c.fillStyle = '#7a748a'; c.fill(pl); c.strokeStyle = '#2a2638'; c.lineWidth = 1.2; c.stroke(pl);
      const sh = new Path2D(), lt = new Path2D(); poly(sh, [x - 11, y - 20, x + 11, y - 20, x + 6, y - 104, x - 6, y - 104]); poly(lt, [x - 11, y - 20, x, y - 20, x, y - 104, x - 6, y - 104]);
      c.fillStyle = '#4e4866'; c.fill(sh); c.fillStyle = '#7c74a0'; c.fill(lt); c.stroke(sh);
      const cp = new Path2D(); poly(cp, [x - 6, y - 104, x + 6, y - 104, x, y - 118]); c.fillStyle = '#f0c040'; c.fill(cp); c.stroke(cp);
      const gl = new Path2D(); for (let i = 0; i < 6; i++) { const yy = y - 32 - i * 12; gl.rect(x - 6, yy, 4, 2); gl.rect(x - 4, yy - 4, 2, 6); }
      c.fillStyle = '#e8c860'; c.fill(gl);
    },
    stones(c, Z, p) {
      const x = p.x, y = p.y;
      const fs = new Path2D(); ell(fs, x, y, 26, 9); c.fillStyle = '#8c8a7e'; c.fill(fs); c.strokeStyle = '#3e3c34'; c.lineWidth = 1.1; c.stroke(fs);
      const sil = new Path2D(), lt = new Path2D(), rn = new Path2D();
      for (const [dx, dy, hh] of [[-34, -12, 46], [0, -22, 56], [34, -12, 44]]) {
        const bx = x + dx, by = y + dy;
        sil.moveTo(bx - 9, by); sil.lineTo(bx - 10, by - hh + 8); sil.quadraticCurveTo(bx, by - hh - 4, bx + 10, by - hh + 8); sil.lineTo(bx + 9, by); sil.closePath();
        poly(lt, [bx - 9, by, bx - 10, by - hh + 8, bx - 2, by - hh + 1, bx - 2, by]);
        rn.moveTo(bx - 5, by - hh + 16); rn.lineTo(bx + 4, by - hh + 22); rn.moveTo(bx, by - hh + 14); rn.lineTo(bx, by - hh + 30); rn.moveTo(bx - 4, by - 14); rn.lineTo(bx + 4, by - 18);
      }
      c.fillStyle = '#727266'; c.fill(sil); c.fillStyle = '#a2a094'; c.fill(lt); c.strokeStyle = '#34342c'; c.lineWidth = 1.2; c.stroke(sil);
      c.strokeStyle = '#4a8ad0'; c.lineWidth = 1.6; c.stroke(rn);
      c.strokeStyle = '#5a7ab0'; c.lineWidth = 1; c.beginPath(); c.ellipse(x, y, 14, 4.5, 0, 0, TAU); c.stroke();
    },
    artifact(c, Z, p) {
      const x = p.x, y = p.y;
      const ps = new Path2D(); ps.rect(x - 18, y - 8, 36, 8); ps.rect(x - 9, y - 34, 18, 26); ps.rect(x - 14, y - 40, 28, 6);
      c.fillStyle = '#b4ac98'; c.fill(ps); c.fillStyle = '#8a826e'; c.fillRect(x + 2, y - 34, 7, 26); c.strokeStyle = '#3e382c'; c.lineWidth = 1.2; c.stroke(ps);
      const cr = new Path2D(); poly(cr, [x - 10, y - 40, x + 10, y - 40, x + 11, y - 54, x + 6, y - 47, x, y - 57, x - 6, y - 47, x - 11, y - 54]);
      c.fillStyle = '#f0c040'; c.fill(cr); c.strokeStyle = '#6a4a10'; c.lineWidth = 1.1; c.stroke(cr);
      c.fillStyle = '#e0283a'; c.fillRect(x - 2, y - 47, 4, 4); c.fillStyle = '#3a8ae0'; c.fillRect(x - 8, y - 45, 3, 3); c.fillRect(x + 5, y - 45, 3, 3);
    },
    gold(c, Z, p) {
      const x = p.x, y = p.y, m = new Path2D(); m.moveTo(x - 17, y); m.quadraticCurveTo(x - 12, y - 16, x, y - 17); m.quadraticCurveTo(x + 13, y - 15, x + 17, y); m.closePath();
      c.fillStyle = '#c08a20'; c.fill(m); c.strokeStyle = '#5a3c0c'; c.lineWidth = 1.1; c.stroke(m);
      const hi = new Path2D(); for (let i = 0; i < 6; i++) ell(hi, x - 10 + i * 4 + (i % 2) * 1.5, y - 4 - (i % 3) * 4, 3.6, 2); ell(hi, x - 1, y - 14, 3.4, 1.8);
      c.fillStyle = '#f2cc4a'; c.fill(hi);
      const cn = new Path2D(); ell(cn, x + 20, y, 3.6, 2); ell(cn, x - 20, y + 1, 3.2, 1.8); c.fillStyle = '#e8b830'; c.fill(cn); c.stroke(cn);
    },
    wood(c, Z, p) {
      const x = p.x, y = p.y, lg = new Path2D(), en = new Path2D(), rg = new Path2D();
      for (const [dx, dy] of [[-8, -5], [8, -5], [0, -15]]) { lg.rect(x + dx - 16, y + dy - 5, 26, 10); ell(en, x + dx + 10, y + dy, 4, 5); ell(rg, x + dx + 10, y + dy, 1.6, 2); }
      c.fillStyle = '#7a4e2a'; c.fill(lg); c.strokeStyle = '#33200e'; c.lineWidth = 1.1; c.stroke(lg);
      c.fillStyle = '#d0a46a'; c.fill(en); c.stroke(en); c.fillStyle = '#8a5a30'; c.fill(rg);
    },
    ore(c, Z, p) {
      const x = p.x, y = p.y, sil = new Path2D(), lt = new Path2D(), sp = new Path2D();
      for (const [dx, dy, r] of [[-8, -5, 7], [6, -5, 8], [-1, -12, 7], [12, -2, 5], [-14, -1, 5]]) { ell(sil, x + dx, y + dy, r, r * .8); ell(lt, x + dx - r * .3, y + dy - r * .3, r * .45, r * .3); sp.rect(x + dx + r * .2, y + dy, 1.8, 1.8); }
      c.fillStyle = '#5e6068'; c.fill(sil); c.strokeStyle = '#26262c'; c.lineWidth = 1.1; c.stroke(sil); c.fillStyle = '#9498a4'; c.fill(lt); c.fillStyle = '#2a2a30'; c.fill(sp);
    },
    gem(c, Z, p) {
      const x = p.x, y = p.y, g = new Path2D(), f = new Path2D();
      for (const [dx, dy, s] of [[-8, -4, 6], [7, -5, 7], [0, -13, 6]]) { poly(g, [x + dx - s, y + dy, x + dx, y + dy - s * 1.2, x + dx + s, y + dy, x + dx, y + dy + s * .6]); poly(f, [x + dx - s * .6, y + dy - s * .1, x + dx, y + dy - s * 1.1, x + dx, y + dy]); }
      c.fillStyle = '#b81c30'; c.fill(g); c.strokeStyle = '#4a0810'; c.lineWidth = 1.1; c.stroke(g); c.fillStyle = '#ff6a7a'; c.fill(f);
    },
    crystal(c, Z, p) {
      const x = p.x, y = p.y, g = new Path2D(), f = new Path2D();
      for (const [dx, h, lean] of [[-8, 18, -.3], [0, 26, 0], [8, 16, .35], [-2, 12, -.6]]) { const tx = x + dx + lean * h; poly(g, [x + dx - 4, y, tx, y - h, x + dx + 4, y]); poly(f, [x + dx - 4, y, tx, y - h, x + dx, y]); }
      c.fillStyle = '#2a7ac8'; c.fill(g); c.fillStyle = '#8ad0ff'; c.fill(f); c.strokeStyle = '#123a6a'; c.lineWidth = 1.1; c.stroke(g);
    },
    mercury(c, Z, p) {
      const x = p.x, y = p.y;
      const cr = new Path2D(); cr.rect(x - 14, y - 8, 28, 9); c.fillStyle = '#8a6036'; c.fill(cr); c.strokeStyle = '#3a2410'; c.lineWidth = 1.1; c.stroke(cr);
      const fk = new Path2D(); circ(fk, x, y - 16, 9); fk.rect(x - 3, y - 32, 6, 9);
      c.fillStyle = '#cfd8e2'; c.fill(fk); c.strokeStyle = '#3a4250'; c.stroke(fk);
      c.fillStyle = '#9aa6b6'; c.beginPath(); c.arc(x, y - 16, 6.5, .1, Math.PI - .1); c.fill();
      c.fillStyle = '#7a5030'; c.fillRect(x - 3.5, y - 35, 7, 4); c.fillStyle = '#ffffff'; c.fillRect(x - 5, y - 20, 2.4, 3);
    },
    sulfur(c, Z, p) {
      const x = p.x, y = p.y, m = new Path2D(); m.moveTo(x - 16, y); m.lineTo(x - 10, y - 10); m.lineTo(x - 3, y - 15); m.lineTo(x + 6, y - 12); m.lineTo(x + 13, y - 6); m.lineTo(x + 17, y); m.closePath();
      c.fillStyle = '#c8b028'; c.fill(m); c.strokeStyle = '#5a4a08'; c.lineWidth = 1.1; c.stroke(m);
      const hi = new Path2D(); poly(hi, [x - 12, y - 3, x - 8, y - 10, x - 2, y - 13, x - 3, y - 4]); circ(hi, x + 6, y - 6, 2.2); circ(hi, x + 1, y - 9, 1.6);
      c.fillStyle = '#f0e050'; c.fill(hi);
    },
    chest(c, Z, p) {
      const x = p.x, y = p.y, b = new Path2D(); b.rect(x - 13, y - 12, 26, 12);
      const ld = new Path2D(); ld.moveTo(x - 13, y - 12); ld.quadraticCurveTo(x, y - 24, x + 13, y - 12); ld.closePath();
      c.fillStyle = '#8a5226'; c.fill(b); c.fillStyle = '#a8682e'; c.fill(ld); c.strokeStyle = '#3a1e0a'; c.lineWidth = 1.1; c.stroke(b); c.stroke(ld);
      const bn = new Path2D(); bn.rect(x - 9, y - 18, 3, 18); bn.rect(x + 6, y - 18, 3, 18);
      c.fillStyle = '#e8b830'; c.fill(bn); c.fillRect(x - 2.5, y - 13, 5, 6);
    },
    camp(c, Z, p) {
      const x = p.x, y = p.y, ring = new Path2D();
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ell(ring, x + Math.cos(a) * 13, y + Math.sin(a) * 5, 3.6, 2.6); }
      c.fillStyle = '#2a2018'; c.beginPath(); c.ellipse(x, y, 11, 4, 0, 0, TAU); c.fill();
      c.fillStyle = '#8a8478'; c.fill(ring); c.strokeStyle = '#3a362c'; c.lineWidth = 1; c.stroke(ring);
      const lg = new Path2D(); lg.moveTo(x - 9, y + 2); lg.lineTo(x + 7, y - 3); lg.moveTo(x - 7, y - 3); lg.lineTo(x + 9, y + 2);
      c.strokeStyle = '#4a2e18'; c.lineWidth = 3; c.stroke(lg);
      // the loot: a sack and a little gold
      const sk = new Path2D(); ell(sk, x - 24, y - 4, 6, 7); c.fillStyle = '#a88a5a'; c.fill(sk); c.strokeStyle = '#4a3a20'; c.stroke(sk);
      const gd = new Path2D(); ell(gd, x + 24, y - 2, 7, 4); ell(gd, x + 22, y - 5, 4, 2.4); c.fillStyle = '#e8b830'; c.fill(gd); c.strokeStyle = '#6a4a10'; c.stroke(gd);
    },
    sign(c, Z, p) {
      const x = p.x, y = p.y;
      c.fillStyle = 'rgba(26,38,16,.35)'; c.beginPath(); c.ellipse(x + 6, y, 10, 3.5, 0, 0, TAU); c.fill();
      const po = new Path2D(); po.rect(x - 2.5, y - 72, 5, 72);
      const bd = new Path2D(); poly(bd, [x - 4, y - 66, x + 22, y - 66, x + 28, y - 60, x + 22, y - 54, x - 4, y - 54]); poly(bd, [x + 4, y - 50, x - 22, y - 50, x - 28, y - 44, x - 22, y - 38, x + 4, y - 38]); poly(bd, [x - 4, y - 34, x + 18, y - 34, x + 24, y - 28, x + 18, y - 22, x - 4, y - 22]);
      c.fillStyle = '#7a5230'; c.fill(po); c.fillStyle = '#b4875a'; c.fill(bd); c.strokeStyle = OLW; c.lineWidth = 1.2; c.stroke(po); c.stroke(bd);
      const tx = new Path2D(); tx.rect(x + 1, y - 61, 16, 1.6); tx.rect(x - 19, y - 45, 18, 1.6); tx.rect(x + 1, y - 29, 13, 1.6);
      c.fillStyle = '#4a2e14'; c.fill(tx); c.fillStyle = '#e8b830'; c.beginPath(); c.arc(x, y - 74, 3.4, 0, TAU); c.fill();
    },
    bridge(c, Z, p) {
      const x = p.x, y = p.by;
      c.fillStyle = 'rgba(10,30,40,.4)'; c.fillRect(x - 56, y + 26, 112, 8);
      const fr = new Path2D(); fr.rect(x - 82, y + 14, 164, 16);
      c.fillStyle = '#7a7262'; c.fill(fr);
      const ar = new Path2D(); ar.moveTo(x - 34, y + 30); ar.quadraticCurveTo(x, y + 6, x + 34, y + 30); ar.closePath();
      c.fillStyle = '#1e4a62'; c.fill(ar); c.strokeStyle = '#3e382c'; c.lineWidth = 1.2; c.stroke(fr);
      const dk = new Path2D(); dk.rect(x - 82, y - 22, 164, 36); c.fillStyle = '#a49a84'; c.fill(dk);
      const cb = new Path2D(); for (let i = 0; i < 12; i++) for (let k = 0; k < 3; k++) cb.rect(x - 78 + i * 13.2 + (k % 2) * 6, y - 16 + k * 10, 11, 8);
      c.fillStyle = '#b8ae96'; c.fill(cb); c.strokeStyle = '#7e7664'; c.lineWidth = .8; c.stroke(cb);
      const pt = new Path2D(); pt.rect(x - 84, y - 30, 168, 8); pt.rect(x - 84, y + 10, 168, 7);
      c.fillStyle = '#c8bea6'; c.fill(pt); c.strokeStyle = '#3e382c'; c.lineWidth = 1.2; c.stroke(pt);
    },
  };
  const FLAT = { wheat: 1, plaza: 1 };

  const grassLayer = (c, Z, x0, y0, x1, y1) => {
    c.fillStyle = BG; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    const G = 150;
    for (let gy = fl(y0 / G) - 1; gy <= fl(y1 / G) + 1; gy++) for (let gx = fl(x0 / G) - 1; gx <= fl(x1 / G) + 1; gx++) {
      const h = Z.hash(gx * 19 - 4, gy * 23 + 6); if (h > .62) continue;
      const x = gx * G + Z.hash(gx, gy * 5) * G, y = gy * G + Z.hash(gx * 5, gy) * G, r = 70 + Z.hash(gx * 3, gy * 7) * 140, col = BLOT[fl(h * 6.4) % 4];
      const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},.42)`); g.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // painterly dabs
    const S = 20, br = BRUSH.map(() => new Path2D()), tuft = new Path2D(), fl1 = new Path2D(), fl2 = new Path2D(), fl3 = new Path2D();
    for (let gy = fl(y0 / S); gy <= fl(y1 / S); gy++) for (let gx = fl(x0 / S); gx <= fl(x1 / S); gx++) {
      const h = Z.hash(gx * 7 + 3, gy * 11 - 5), h2 = Z.hash(gx * 5 - 2, gy * 3 + 9), x = gx * S + h * S, y = gy * S + h2 * S, p = br[fl(h2 * 3.99)];
      p.moveTo(x, y); p.quadraticCurveTo(x + 3, y - 3 - h * 2, x + 7 + h * 5, y - 1);
      if (h > .9) { tuft.moveTo(x - 3, y + 2); tuft.lineTo(x - 4, y - 5); tuft.moveTo(x, y + 2); tuft.lineTo(x + 1, y - 7); tuft.moveTo(x + 3, y + 2); tuft.lineTo(x + 5, y - 4); }
      else if (h < .025) { const f = h2 < .4 ? fl1 : h2 < .75 ? fl2 : fl3; for (let k = 0; k < 4; k++) f.rect(x + Z.hash(gx + k, gy) * 12, y + Z.hash(gx, gy + k) * 8, 2.4, 2.4); }
    }
    c.lineCap = 'round'; c.lineWidth = 2.2;
    BRUSH.forEach((col, i) => { c.strokeStyle = col; c.stroke(br[i]); });
    c.lineWidth = 1.3; c.strokeStyle = '#46672f'; c.stroke(tuft);
    c.fillStyle = '#ece6c8'; c.fill(fl1); c.fillStyle = '#e4cc4e'; c.fill(fl2); c.fillStyle = '#d88aa4'; c.fill(fl3);
  };

  const riverLayer = (c, Z, x0, y0, x1, y1) => {
    for (let mx = fl((x0 - 200) / MC); mx <= fl((x1 + 200) / MC) + 1; mx++) {
      if (!hasRiver(Z, mx) || mx * MC + 160 < x0 || mx * MC - 160 > x1) continue;
      const p = new Path2D(), rd = new Path2D(), st = new Path2D();
      let first = true;
      for (let y = fl((y0 - 60) / 16) * 16; y <= y1 + 60; y += 16) {
        const x = riverX(y, mx);
        if (first) { p.moveTo(x, y); first = false; } else p.lineTo(x, y);
        const h = Z.hash(mx * 5 + 1, fl(y / 16));
        if (h < .35) { const sd = h < .17 ? -1 : 1, bx = x + sd * (38 + h * 12); rd.moveTo(bx, y); rd.lineTo(bx - 2, y - 9); rd.moveTo(bx + 3, y); rd.lineTo(bx + 4, y - 11); rd.moveTo(bx + 6, y); rd.lineTo(bx + 9, y - 7); }
        else if (h > .88) ell(st, x + (h > .94 ? -1 : 1) * 36, y, 5, 3.4);
      }
      c.lineJoin = 'round'; c.lineCap = 'round';
      c.strokeStyle = '#4a6834'; c.lineWidth = 104; c.stroke(p);
      c.strokeStyle = '#a2936a'; c.lineWidth = 90; c.stroke(p);
      c.strokeStyle = '#6e6146'; c.lineWidth = 72; c.stroke(p);
      c.strokeStyle = '#2b6383'; c.lineWidth = 62; c.stroke(p);
      c.strokeStyle = '#3a7b9c'; c.lineWidth = 44; c.stroke(p);
      c.globalAlpha = .5; c.strokeStyle = '#5c9cba'; c.lineWidth = 16; c.stroke(p); c.globalAlpha = 1;
      c.fillStyle = '#8a8270'; c.fill(st); c.strokeStyle = '#3e3a30'; c.lineWidth = 1; c.stroke(st);
      c.strokeStyle = '#4e6a2c'; c.lineWidth = 1.6; c.stroke(rd);
    }
  };

  const roadLayer = (c, Z, x0, y0, x1, y1) => {
    const brd = new Path2D(), dirt = new Path2D(), cob = new Path2D(), rut = new Path2D(), sL = new Path2D(), sD = new Path2D(), peb = new Path2D();
    const spB = new Path2D(), spD = new Path2D();
    const stones = (x, y, ix, iy, along) => {
      for (let k = -1; k <= 1; k++) {
        const h = Z.hash(ix * 7 + k, iy * 3 - k), ox = along ? (h - .5) * 4 : k * 12 + (h - .5) * 3, oy = along ? k * 12 + (h - .5) * 3 : (h - .5) * 4;
        ell(h < .5 ? sL : sD, x + ox, y + oy, along ? 5.2 : 4, along ? 3.8 : 5);
      }
    };
    const dirtBits = (x, y, ix, iy, along, nx, ny) => {
      const h = Z.hash(ix * 5 + 1, iy * 9 - 2);
      if (along) { rut.moveTo(x, y - 9); rut.lineTo(nx, ny - 9); rut.moveTo(x, y + 9); rut.lineTo(nx, ny + 9); }
      else { rut.moveTo(x - 9, y); rut.lineTo(nx - 9, ny); rut.moveTo(x + 9, y); rut.lineTo(nx + 9, ny); }
      if (h < .3) peb.rect(x + (h - .15) * 90, y + (Z.hash(ix, iy) - .5) * 26, 2.4, 2);
    };
    for (let my = fl(y0 / MC) - 1; my <= fl(y1 / MC) + 1; my++) {
      if (my * MC + 900 < y0 || my * MC + 700 > y1) continue;
      const isC = cobH(Z, my), main = isC ? cob : dirt;
      let pen = false;
      for (let x = fl((x0 - 48) / 12) * 12; x <= x1 + 48; x += 12) {
        const y = roadY(x, my);
        if (riverGap(Z, x, y) < 66) { pen = false; continue; }
        if (!pen) { brd.moveTo(x, y); main.moveTo(x, y); pen = true; } else { brd.lineTo(x, y); main.lineTo(x, y); }
        if (isC) stones(x, y, x / 12, my, true); else dirtBits(x, y, x / 12, my, true, x + 12, roadY(x + 12, my));
      }
    }
    for (let mx = fl(x0 / MC) - 1; mx <= fl(x1 / MC) + 1; mx++) {
      if (mx * MC + 900 < x0 || mx * MC + 700 > x1) continue;
      const isC = cobV(Z, mx), main = isC ? cob : dirt;
      let pen = false;
      for (let y = fl((y0 - 48) / 12) * 12; y <= y1 + 48; y += 12) {
        const x = roadX(y, mx);
        if (!pen) { brd.moveTo(x, y); main.moveTo(x, y); pen = true; } else { brd.lineTo(x, y); main.lineTo(x, y); }
        if (isC) stones(x, y, mx, y / 12, false); else dirtBits(x, y, mx + 50, y / 12, false, roadX(y + 12, mx), y + 12);
      }
    }
    // spurs from the main road to each building site
    for (let my = fl((y0 - 300) / MC); my <= fl((y1 + 300) / MC); my++) for (let mx = fl((x0 - 300) / MC); mx <= fl((x1 + 300) / MC); mx++) {
      for (const S of cellItems(Z, mx, my).sites) {
        if (!S.spur) continue;
        const [sx, sy] = S.spur, rx = roadX(sy, mx);
        if (Math.max(sx, rx) < x0 - 40 || Math.min(sx, rx) > x1 + 40 || sy < y0 - 120 || sy > y1 + 120) continue;
        const cy = sy + 46 * (Z.hash(fl(sx), fl(sy)) - .3);
        spB.moveTo(sx, sy); spB.quadraticCurveTo((sx + rx) / 2, cy, rx, sy);
        spD.moveTo(sx, sy); spD.quadraticCurveTo((sx + rx) / 2, cy, rx, sy);
      }
    }
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = '#5e4e34'; c.lineWidth = 34; c.stroke(spB); c.strokeStyle = '#9c8054'; c.lineWidth = 25; c.stroke(spD);
    c.strokeStyle = '#5e4e34'; c.lineWidth = 52; c.stroke(brd);
    c.strokeStyle = '#a08458'; c.lineWidth = 42; c.stroke(dirt);
    c.strokeStyle = '#857d6c'; c.lineWidth = 42; c.stroke(cob);
    c.lineWidth = 2; c.strokeStyle = '#866a40'; c.stroke(rut);
    c.fillStyle = '#c2a878'; c.fill(peb);
    c.fillStyle = '#a49c88'; c.fill(sL); c.fillStyle = '#7c7464'; c.fill(sD); c.strokeStyle = '#575143'; c.lineWidth = .8; c.stroke(sL); c.stroke(sD);
  };

  const ground = (Z, x0, y0, x1, y1) => {
    const c = Z.ctx;
    grassLayer(c, Z, x0, y0, x1, y1);
    riverLayer(c, Z, x0, y0, x1, y1);
    roadLayer(c, Z, x0, y0, x1, y1);
    const ps = [];
    for (let my = fl((y0 - 300) / MC); my <= fl((y1 + 300) / MC); my++) for (let mx = fl((x0 - 300) / MC); mx <= fl((x1 + 300) / MC); mx++)
      for (const it of cellItems(Z, mx, my).L) if (it.x > x0 - 260 && it.x < x1 + 260 && it.y > y0 - 70 && it.y < y1 + 270) ps.push(it);
    ps.sort((a, b) => ((FLAT[a.k] ? -1e7 : 0) + a.y) - ((FLAT[b.k] ? -1e7 : 0) + b.y));
    for (const it of ps) { c.save(); DRAW[it.k](c, Z, it); c.restore(); }
    // soft "fog of war" band far from each macro cell's heart
    for (let my = fl(y0 / MC); my <= fl(y1 / MC); my++) for (let mx = fl(x0 / MC); mx <= fl(x1 / MC); mx++) {
      const cx = mx * MC + 800, cy = my * MC + 800;
      const ax = Math.max(x0, mx * MC), ay = Math.max(y0, my * MC), bx = Math.min(x1, mx * MC + MC), by = Math.min(y1, my * MC + MC);
      if (bx <= ax || by <= ay) continue;
      const g = c.createRadialGradient(cx, cy, 640, cx, cy, 1140);
      g.addColorStop(0, 'rgba(18,26,40,0)'); g.addColorStop(1, 'rgba(18,26,40,.3)');
      c.fillStyle = g; c.fillRect(ax, ay, bx - ax, by - ay);
    }
  };

  /* ================= Under (every frame): sails, wheels, fires, flags, river shimmer ================= */
  const visCells = (Z, pad, fn) => {
    const P = Z.P, hw = Z.W / 2 + pad, hh = Z.H / 2 + pad;
    for (let my = fl((P.y - hh - 200) / MC); my <= fl((P.y + hh + 200) / MC); my++) for (let mx = fl((P.x - hw - 200) / MC); mx <= fl((P.x + hw + 200) / MC); mx++) {
      for (const it of cellItems(Z, mx, my).anim) if (Math.abs(it.x - P.x) < hw && Math.abs(it.y - P.y) < hh + 60) fn(it);
    }
  };
  const under = Z => {
    const c = Z.ctx, P = Z.P, now = Z.now, hw = Z.W / 2 + 120, hh = Z.H / 2 + 120;
    const shim = new Path2D(), spar = new Path2D(), sail = new Path2D(), hub = new Path2D(), wheel = new Path2D(), pad = new Path2D(), splash = new Path2D();
    const fo = new Path2D(), fm = new Path2D(), fc = new Path2D(), flag = new Path2D(), emb = new Path2D();
    for (let mx = fl((P.x - hw) / MC); mx <= fl((P.x + hw) / MC) + 1; mx++) {
      if (!hasRiver(Z, mx) || Math.abs(mx * MC - P.x) > hw + 120) continue;
      const off = (now * 26) % 30;
      for (let y = fl((P.y - hh) / 30) * 30; y <= P.y + hh; y += 30) {
        const k = fl(y / 30), h = Z.hash(k, mx * 3 + 7), yy = y + off, x = riverX(yy, mx) + (h - .5) * 34, l = 4 + h * 6;
        if (Math.abs(yy - roadY(x, Math.round((yy - 800) / MC))) < 40) continue;
        shim.moveTo(x - l * .3, yy - l); shim.lineTo(x + l * .3, yy + l * .2);
      }
    }
    let n = 0;
    visCells(Z, 140, it => {
      if (it.an !== 1 || n > 24) return;
      n++;
      const x = it.x, y = it.y;
      if (it.k === 'windmill') {
        const hx = x + 3, hy = y - 84, a0 = now * 1.2 + it.v * 6;
        for (let i = 0; i < 4; i++) {
          const a = a0 + i * TAU / 4, ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
          spar.moveTo(hx, hy); spar.lineTo(hx + ca * 50, hy + sa * 50);
          poly(sail, [hx + ca * 12, hy + sa * 12, hx + ca * 48, hy + sa * 48, hx + ca * 48 + px * 11, hy + sa * 48 + py * 11, hx + ca * 12 + px * 11, hy + sa * 12 + py * 11]);
        }
        circ(hub, hx, hy, 4.5);
      } else if (it.k === 'wmill') {
        const wx = x + 28, wy = y - 20, a0 = now * 1.4 + it.v * 6;
        circ(wheel, wx, wy, 26); circ(wheel, wx, wy, 6);
        for (let i = 0; i < 8; i++) {
          const a = a0 + i * TAU / 8, ca = Math.cos(a), sa = Math.sin(a);
          wheel.moveTo(wx + ca * 6, wy + sa * 6); wheel.lineTo(wx + ca * 26, wy + sa * 26);
          poly(pad, [wx + ca * 22 - sa * 4, wy + sa * 22 + ca * 4, wx + ca * 31 - sa * 4, wy + sa * 31 + ca * 4, wx + ca * 31 + sa * 4, wy + sa * 31 - ca * 4, wx + ca * 22 + sa * 4, wy + sa * 22 - ca * 4]);
        }
        for (let i = 0; i < 4; i++) { const u = (now * 1.8 + i / 4) % 1; splash.rect(wx - 14 + i * 9 + u * 6, wy + 30 - Math.sin(u * Math.PI) * 10, 2.4, 2.4); }
      } else if (it.k === 'camp') {
        const fx = x, fy = y - 1;
        for (let k = -1; k <= 1; k++) {
          const f = Math.sin(now * 9 + k * 2 + x * .01) * .5 + Math.sin(now * 23 + k) * .3, hgt = (k ? 12 : 19) + f * 5, bx = fx + k * 5;
          fo.moveTo(bx - 5, fy); fo.quadraticCurveTo(bx - 3, fy - hgt * .6, bx + Math.sin(now * 7 + k) * 2.5, fy - hgt); fo.quadraticCurveTo(bx + 3, fy - hgt * .6, bx + 5, fy); fo.closePath();
          fm.moveTo(bx - 3, fy); fm.quadraticCurveTo(bx, fy - hgt * .75, bx + 3, fy); fm.closePath();
        }
        fc.moveTo(fx - 2, fy); fc.quadraticCurveTo(fx, fy - 8, fx + 2, fy); fc.closePath();
        for (let k = 0; k < 3; k++) { const u = (now * .9 + k / 3 + it.v) % 1; emb.rect(fx + Math.sin(now * 3 + k * 2) * 6 * u, fy - 14 - u * 34, 1.8, 1.8); }
      } else if (it.k === 'mine' || it.k === 'tower') {
        const px = it.k === 'mine' ? x + 41 : x + 15, py = it.k === 'mine' ? y - 91 : y - 131, L = it.k === 'mine' ? 30 : 22, hgt = it.k === 'mine' ? 17 : 12;
        flag.moveTo(px, py);
        for (let i = 1; i <= 4; i++) { const t = i / 4; flag.lineTo(px + t * L, py + Math.sin(now * 6 - t * 3 + it.v * 5) * 3 * t); }
        for (let i = 4; i >= 0; i--) { const t = i / 4; flag.lineTo(px + t * L * .96, py + hgt + Math.sin(now * 6 - t * 3 + it.v * 5 + .4) * 3 * t); }
        flag.closePath();
      }
    });
    c.save();
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.globalAlpha = .55; c.strokeStyle = '#d6eef8'; c.lineWidth = 1.6; c.stroke(shim); c.globalAlpha = 1;
    c.strokeStyle = '#4a2e18'; c.lineWidth = 3; c.stroke(spar);
    c.fillStyle = '#ece0c4'; c.fill(sail); c.strokeStyle = '#6a4a2a'; c.lineWidth = 1.2; c.stroke(sail);
    c.fillStyle = '#3a2414'; c.fill(hub);
    c.strokeStyle = '#3e2a16'; c.lineWidth = 2.6; c.stroke(wheel); c.fillStyle = '#8a6036'; c.fill(pad); c.strokeStyle = '#3e2a16'; c.lineWidth = 1; c.stroke(pad);
    c.fillStyle = '#e8f6ff'; c.fill(splash);
    c.fillStyle = '#e8501a'; c.fill(fo); c.fillStyle = '#ffa030'; c.fill(fm); c.fillStyle = '#fff2a0'; c.fill(fc); c.fillStyle = '#ffb040'; c.fill(emb);
    c.fillStyle = '#2a4cc8'; c.fill(flag); c.strokeStyle = '#141e4a'; c.lineWidth = 1; c.stroke(flag);
    c.restore();
  };

  /* ================= Ambient (after darkness): glints, glows, butterflies, birds ================= */
  const BFLY = ['#f4f0e0', '#f2d040', '#6aa8f0', '#f08a30'];
  const GL = { gold: [0, -12, '255,214,90'], gem: [0, -12, '255,90,110'], crystal: [0, -18, '140,210,255'], mercury: [0, -18, '230,240,255'], chest: [0, -16, '255,214,90'], artifact: [0, -50, '255,214,90'] };
  const ambient = Z => {
    const c = Z.ctx, P = Z.P, now = Z.now, hw = Z.W / 2 + 160, hh = Z.H / 2 + 160;
    const star = new Path2D(), smoke = new Path2D(), rune = new Path2D();
    let n = 0;
    visCells(Z, 160, it => {
      if (n > 70) return;
      const x = it.x, y = it.y;
      if (it.k === 'shrine') { const k = .5 + .5 * Math.sin(now * 1.3 + it.v * 9); Z.glow('90,150,255', 90, x, y - 60, .14 + k * .16); Z.glow('170,220,255', 26, x, y - 25, .4 + k * .3); n += 2; }
      else if (it.k === 'obelisk') { const k = .5 + .5 * Math.sin(now * 1.1 + it.v * 7); Z.glow('190,130,255', 80, x, y - 70, .12 + k * .14); Z.glow('255,220,120', 20, x, y - 112, .5 + k * .3); n += 2; for (let i = 0; i < 6; i++) if (Math.sin(now * 2 + i * 1.1) > .2) rune.rect(x - 6, y - 32 - i * 12, 4, 2); }
      else if (it.k === 'stones') { const k = .5 + .5 * Math.sin(now * 1.6 + it.v * 5); Z.glow('90,160,255', 60, x, y - 30, .08 + k * .12); n++; }
      else if (it.k === 'camp') {
        Z.glow('255,150,60', 70 + Math.sin(now * 9 + x) * 4, x, y - 6, .35); n++;
        for (let k = 0; k < 5; k++) { const u = (now * .3 + k / 5 + it.v) % 1, r = 3 + u * 9; circ(smoke, x + u * 22 + Math.sin(now * 1.4 + k * 2) * 4, y - 22 - u * 80, r); }
      }
      const g = GL[it.k];
      if (g) {
        const ph = (now * .7 + it.v * 9) % 3;
        if (it.k === 'artifact') { Z.glow(g[2], 44, x, y - 48, .3 + .12 * Math.sin(now * 2)); n++; }
        if (ph < .7) {
          const sz = Math.sin(ph / .7 * Math.PI) * 6, sx = x + g[0] + (it.u - .5) * 14, sy = y + g[1] + (it.v - .5) * 6;
          if (sz > .5) { star.moveTo(sx - sz, sy); star.lineTo(sx + sz, sy); star.moveTo(sx, sy - sz); star.lineTo(sx, sy + sz); Z.glow(g[2], 6 + sz * 2.4, sx, sy, .5); n++; }
        }
      }
    });
    c.save();
    c.globalAlpha = .3; c.fillStyle = '#d8d4cc'; c.fill(smoke); c.globalAlpha = 1;
    c.fillStyle = '#ffe890'; c.fill(rune);
    c.strokeStyle = '#ffffff'; c.lineWidth = 1.4; c.stroke(star);
    // butterflies anchored to 360px cells
    const G = 360, wings = BFLY.map(() => new Path2D()), bod = new Path2D();
    for (let gy = fl((P.y - hh) / G); gy <= fl((P.y + hh) / G); gy++) for (let gx = fl((P.x - hw) / G); gx <= fl((P.x + hw) / G); gx++) {
      const h = Z.hash(gx * 17 + 4, gy * 13 - 9); if (h > .34) continue;
      const sd = h * 40, x = gx * G + 180 + Math.sin(now * .55 + sd) * 90 + Math.sin(now * 1.9 + sd * 2) * 18, y = gy * G + 180 + Math.cos(now * .43 + sd) * 60 + Math.sin(now * 2.6 + sd) * 10;
      const fp = Math.abs(Math.sin(now * 15 + sd * 3)), w = wings[fl(h * 11.7) % 4], ww = 1 + fp * 4.5;
      ell(w, x - ww, y - 2, ww, 3.6); ell(w, x + ww, y - 2, ww, 3.6); ell(w, x - ww * .7, y + 2.5, ww * .7, 2.4); ell(w, x + ww * .7, y + 2.5, ww * .7, 2.4);
      bod.rect(x - .8, y - 3.5, 1.6, 7);
    }
    BFLY.forEach((col, i) => { c.fillStyle = col; c.fill(wings[i]); });
    c.fillStyle = '#2a1e14'; c.fill(bod);
    // a lazy flock of birds crossing the map
    const birds = new Path2D(), span = Z.W + 600;
    for (let f = 0; f < 2; f++) {
      const bx = P.x - span / 2 + (((now * (34 + f * 9) + f * 700) % span) + span) % span, by = P.y - Z.H * .3 + f * Z.H * .45 + Math.sin(now * .3 + f) * 40;
      for (let i = 0; i < 5; i++) {
        const x = bx - (i % 2 ? 1 : 0) * 14 - fl(i / 2) * 20, y = by + (i === 0 ? 0 : (i % 2 ? -1 : 1) * fl((i + 1) / 2) * 12), fw = Math.sin(now * 8 + i * 1.7 + f) * 3;
        birds.moveTo(x - 6, y - 2 - fw); birds.quadraticCurveTo(x - 3, y - 3, x, y); birds.quadraticCurveTo(x + 3, y - 3, x + 6, y - 2 - fw);
      }
    }
    c.strokeStyle = '#2a2a34'; c.lineWidth = 1.6; c.lineCap = 'round'; c.stroke(birds);
    c.restore();
  };

  /* ================= Foes: wandering monster stacks ================= */
  const BOX = { pike: ['#4a2272', '#c8a0f0'], wolf: ['#5e3a1c', '#d8b080'], garg: ['#4a2272', '#c8a0f0'], archer: ['#8a6410', '#f6dc80'], airelem: ['#8a6410', '#f6dc80'] };
  const stackInit = (e, Z) => { e.base = 4 + fl(Math.random() * 37); };
  const stackBox = (c, e, kind) => {
    const k = e.max > 0 ? Math.max(0, e.hp) / e.max : 1, n = Math.max(1, Math.ceil((e.base || 1) * k)), t = String(n), w = 5 + t.length * 5, x = e.x, y = e.y + e.r + 3, col = BOX[kind];
    c.fillStyle = col[1]; c.fillRect(x - w / 2 - 1, y - 1, w + 2, 10);
    c.fillStyle = col[0]; c.fillRect(x - w / 2, y, w, 8);
    c.fillStyle = '#ffffff'; c.font = 'bold 7px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, x, y + 4.4);
  };

  // Pikemen: steel-clad soldiers with long pikes. March in step, brace (pike lowers, tip glints) and thrust.
  const pike = {
    hp: 24, sp: 50, dmg: 9, xp: 2, r: 12, eye: false,
    init(e, Z) { stackInit(e, Z); e.mode = 'walk'; e.t1 = Z.rnd(1.5, 3); e.mt = 0; e.ca = 0; e.dir = 0; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e);
      if (e.mode === 'march') {
        Z.move(e, Math.cos(e.dir) * e.sp * 1.15, Math.sin(e.dir) * e.sp * 1.15); e.ang = e.dir;
        if ((e.mt -= dt) <= 0 || d < 150) { e.mode = 'walk'; e.t1 = Z.rnd(.2, 1); }
        return;
      }
      if (e.mode === 'brace') { Z.move(e, 0, 0); e.ang = e.ca; if ((e.mt -= dt) <= 0) { e.mode = 'lunge'; e.mt = .3; } return; }
      if (e.mode === 'lunge') { Z.move(e, Math.cos(e.ca) * 290, Math.sin(e.ca) * 290); e.ang = e.ca; if ((e.mt -= dt) <= 0) { e.mode = 'walk'; e.t1 = Z.rnd(2, 3.5); } return; }
      Z.chase(e, e.sp * (.7 + .45 * Math.max(0, Math.sin(e.ph * 8 + e.seed))));
      if ((e.t1 -= dt) <= 0) { if (d < 175 && d > 40) { e.mode = 'brace'; e.mt = .6; e.ca = Z.angTo(e); } else e.t1 = .5; }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 12, m = e.mode, br = m === 'brace', st = br ? 0 : Math.sin(e.ph * 8 + e.seed), O = W(white, '#1c2236');
      c.save(); c.translate(e.x, e.y - Math.abs(st) * s); c.scale(s, s); face(c, e);
      if (br) c.translate(-2 + Math.sin(Z.now * 40) * .5, 0);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const pa = br || m === 'lunge' ? -.05 : -1.2 + st * .05, push = m === 'lunge' ? 8 : br ? -3 : 0, dx = Math.cos(pa), dy = Math.sin(pa), hx = 4 + push, hy = -2;
      const sh = new Path2D(); sh.moveTo(hx - dx * 12, hy - dy * 12); sh.lineTo(hx + dx * 26, hy + dy * 26);
      c.strokeStyle = O; c.lineWidth = 3.2; c.stroke(sh); c.strokeStyle = W(white, '#a8743e'); c.lineWidth = 1.6; c.stroke(sh);
      const tx = hx + dx * 26, ty = hy + dy * 26, hd = new Path2D();
      poly(hd, [tx + dx * 9, ty + dy * 9, tx - dy * 2.8, ty + dx * 2.8, tx - dx * 1.5, ty - dy * 1.5, tx + dy * 2.8, ty - dx * 2.8]);
      c.lineWidth = 1.2; c.strokeStyle = O; c.stroke(hd); c.fillStyle = W(white, '#f2f6fc'); c.fill(hd);
      const lg = new Path2D(); lg.rect(-4.6 + st * 2, 4, 3.6, 9); lg.rect(1 - st * 2, 4, 3.6, 9);
      const bd = new Path2D(); poly(bd, [-6, -8, 6, -8, 7, 6, -7, 6]);
      const hdp = new Path2D(); circ(hdp, 1, -12, 4);
      const hm = new Path2D(); hm.moveTo(-6.5, -13); hm.quadraticCurveTo(1, -10.5, 8.5, -13.5); hm.lineTo(6, -14.5); hm.quadraticCurveTo(1, -22, -4, -14.5); hm.closePath();
      const sil = new Path2D(); sil.addPath(lg); sil.addPath(bd); sil.addPath(hdp); sil.addPath(hm);
      c.lineWidth = 2.2; c.stroke(sil);
      c.fillStyle = W(white, '#a2acbc'); c.fill(lg);
      c.fillStyle = W(white, '#2c56d4'); c.fill(bd);
      c.fillStyle = W(white, '#ecbc90'); c.fill(hdp);
      c.fillStyle = W(white, '#d8e0ec'); c.fill(hm);
      if (!white) {
        const tr = new Path2D(); tr.rect(-1.1, -7, 2.4, 12); tr.rect(-5, -3.2, 10, 2.2); c.fillStyle = '#f2c84a'; c.fill(tr);
        c.fillStyle = '#c4ccda'; c.fillRect(-6.4, -9, 12.8, 2.6);
        c.fillStyle = '#1a1010'; c.fillRect(3, -12.6, 1.5, 1.5);
        const pl = new Path2D(); pl.moveTo(0, -19); pl.quadraticCurveTo(-5, -23, -9, -18 + st);
        c.strokeStyle = '#ec3a2e'; c.lineWidth = 2.4; c.stroke(pl);
        if (br) { c.fillStyle = '#ffffff'; c.fillRect(tx + dx * 7 - 1.6, ty + dy * 7 - 1.6, 3.2, 3.2); }
      }
      c.restore();
      stackBox(c, e, 'pike');
    },
    death(e, Z) { Z.burst(e.x, e.y, '#c4ccda', 7, 80); },
  };

  // Wolf riders: goblins on grey wolves. Circle wide, crouch, then dash straight through.
  const wolf = {
    hp: 16, sp: 96, dmg: 8, xp: 2, r: 13, eye: false,
    init(e, Z) { stackInit(e, Z); e.mode = 'circle'; e.side = Math.random() < .5 ? 1 : -1; e.t1 = Z.rnd(1.5, 3.5); e.mt = 0; e.ca = 0; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e), a = Z.angTo(e);
      if (e.mode === 'crouch') { Z.move(e, 0, 0); e.ang = e.ca; if ((e.mt -= dt) <= 0) { e.mode = 'dash'; e.mt = .55; } return; }
      if (e.mode === 'dash') { Z.move(e, Math.cos(e.ca) * e.sp * 3.1, Math.sin(e.ca) * e.sp * 3.1); e.ang = e.ca; if ((e.mt -= dt) <= 0) { e.mode = 'circle'; e.side = -e.side; e.t1 = Z.rnd(2, 3.5); } return; }
      if (d > 380) { Z.chase(e); return; }
      const rad = d > 215 ? 1 : d < 165 ? -.7 : 0, vx = Math.cos(a) * rad - Math.sin(a) * e.side * .95, vy = Math.sin(a) * rad + Math.cos(a) * e.side * .95, l = Math.hypot(vx, vy) || 1;
      Z.move(e, vx / l * e.sp, vy / l * e.sp); e.ang = Math.atan2(vy, vx);
      if ((e.t1 -= dt) <= 0 && d < 330) { e.mode = 'crouch'; e.mt = .38; e.ca = a; }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 13, m = e.mode, cr = m === 'crouch', run = cr ? 0 : Math.sin(e.ph * (m === 'dash' ? 26 : 15) + e.seed), O = W(white, '#22160c');
      c.save(); c.translate(e.x, e.y - Math.abs(run) * 1.4 * s + (cr ? 2 : 0)); c.scale(s, s); face(c, e);
      if (cr) c.translate(Math.sin(Z.now * 44) * .6, 0);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const lg = new Path2D();
      lg.moveTo(7, 4); lg.lineTo(7 + run * 4, 12); lg.moveTo(4, 4); lg.lineTo(4 - run * 4, 12); lg.moveTo(-6, 4); lg.lineTo(-6 - run * 4, 12); lg.moveTo(-9, 4); lg.lineTo(-9 + run * 4, 12);
      lg.moveTo(-11, 0); lg.quadraticCurveTo(-17, -4 + run * 2, -21, 1 + run * 3);
      c.strokeStyle = O; c.lineWidth = 4; c.stroke(lg); c.strokeStyle = W(white, '#7a7680'); c.lineWidth = 2.2; c.stroke(lg);
      const wf = new Path2D(); ell(wf, 0, 2, 11.5, 6); circ(wf, 10, -3, 5); poly(wf, [12, -6, 20, -3, 19.5, 0.5, 12, 1]); poly(wf, [7, -6, 8.5, -12.5, 12, -7]);
      const rd = new Path2D(); rd.rect(-4, -12, 7, 10);
      const gh = new Path2D(); circ(gh, -.5, -15.5, 4); poly(gh, [-3.5, -16.5, -10, -19, -3.5, -13.5]);
      const sil = new Path2D(); sil.addPath(wf); sil.addPath(rd); sil.addPath(gh);
      c.lineWidth = 2.2; c.stroke(sil);
      c.fillStyle = W(white, '#8e8a96'); c.fill(wf);
      c.fillStyle = W(white, '#7e4a22'); c.fill(rd);
      c.fillStyle = W(white, '#88c83c'); c.fill(gh);
      if (!white) {
        const bl = new Path2D(); ell(bl, 0, 5, 8, 2.6); poly(bl, [13, -1, 19.5, -.5, 19, .5, 12, 1]); c.fillStyle = '#c4c0ca'; c.fill(bl);
        c.fillStyle = '#e4302a'; c.fillRect(-4.6, -19.4, 8.4, 2.4);
        c.fillStyle = '#ff3a20'; c.fillRect(11.4, -5, 1.8, 1.8);
        c.fillStyle = '#ffe23a'; c.fillRect(1.2, -16.4, 1.6, 1.6);
      }
      const sa = m === 'dash' ? .15 : -1.05 + run * .1, dx = Math.cos(sa), dy = Math.sin(sa), sp = new Path2D();
      sp.moveTo(1 - dx * 6, -8 - dy * 6); sp.lineTo(1 + dx * 16, -8 + dy * 16);
      c.strokeStyle = O; c.lineWidth = 3; c.stroke(sp); c.strokeStyle = W(white, '#9a6a3a'); c.lineWidth = 1.4; c.stroke(sp);
      const tp = new Path2D(), tx = 1 + dx * 16, ty = -8 + dy * 16; poly(tp, [tx + dx * 6, ty + dy * 6, tx - dy * 2.2, ty + dx * 2.2, tx + dy * 2.2, ty - dx * 2.2]);
      c.fillStyle = W(white, '#eef2fa'); c.fill(tp);
      c.restore();
      stackBox(c, e, 'wolf');
    },
    death(e, Z) { Z.burst(e.x, e.y, '#8e8a96', 8, 90); },
  };

  // Gargoyles: stone-winged, flutter erratically, rise up, then dive at a locked angle.
  const garg = {
    hp: 70, sp: 66, dmg: 13, xp: 6, r: 15, eye: false,
    init(e, Z) { stackInit(e, Z); e.mode = 'fly'; e.t1 = Z.rnd(2.5, 5); e.mt = 0; e.ca = 0; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e);
      switch (e.mode) {
        case 'rise': Z.move(e, 0, 0); e.ang = e.ca; if ((e.mt -= dt) <= 0) { e.mode = 'dive'; e.mt = .42; } break;
        case 'dive': Z.move(e, Math.cos(e.ca) * 360, Math.sin(e.ca) * 360); e.ang = e.ca; if ((e.mt -= dt) <= 0) { e.mode = 'land'; e.mt = .5; Z.burst(e.x, e.y, '#9a9eaa', 6, 70); } break;
        case 'land': Z.move(e, 0, 0); if ((e.mt -= dt) <= 0) { e.mode = 'fly'; e.t1 = Z.rnd(3.5, 5.5); } break;
        default: {
          const a = Z.angTo(e) + Math.sin(e.ph * 2.3 + e.seed) * .9 + Math.sin(e.ph * 5.3 + e.seed * 2) * .35, k = .7 + .5 * Math.abs(Math.sin(e.ph * 3 + e.seed));
          Z.move(e, Math.cos(a) * e.sp * k, Math.sin(a) * e.sp * k); e.ang = Z.angTo(e);
          if ((e.t1 -= dt) <= 0) { if (d < 300 && d > 80) { e.mode = 'rise'; e.mt = .55; e.ca = Z.angTo(e); } else e.t1 = .6; }
        }
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 15, m = e.mode, O = W(white, '#20222c');
      const lift = m === 'rise' ? Math.max(0, Math.min(1, 1 - e.mt / .55)) * 10 : m === 'dive' ? 3 : m === 'land' ? 0 : 4 + Math.sin(e.ph * 3) * 2;
      const fp = m === 'dive' ? -.6 : m === 'rise' ? Math.sin(e.ph * 22) : Math.sin(e.ph * 11 + e.seed);
      c.save(); c.translate(e.x, e.y - lift * s); c.scale(s, s); face(c, e);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const wg = new Path2D(), fb = new Path2D();
      for (const sd of [-1, 1]) {
        const tx = sd * 20, ty = -17 - fp * 8;
        poly(wg, [sd * 2.5, -7, tx, ty, sd * 18, -4 + fp * 2, sd * 13, 0 + fp, sd * 8.5, -1, sd * 4.5, 2]);
        fb.moveTo(sd * 2.5, -7); fb.lineTo(sd * 18, -4 + fp * 2); fb.moveTo(sd * 7, -9 - fp * 3); fb.lineTo(sd * 13, 0 + fp);
      }
      c.strokeStyle = O; c.lineWidth = 1.8; c.stroke(wg); c.fillStyle = W(white, '#5e6476'); c.fill(wg);
      if (!white) { c.strokeStyle = '#3a3e4c'; c.lineWidth = 1; c.stroke(fb); }
      // tail + wiry limbs (stroked twice: dark outline, then stone core)
      const tl = new Path2D(); tl.moveTo(-3, 6); tl.quadraticCurveTo(-12, 12, -14, 5);
      tl.moveTo(-2.5, 6); tl.lineTo(-4, 12.5); tl.lineTo(-6, 13.5);
      tl.moveTo(2.5, 6); tl.lineTo(3.5, 12.5); tl.lineTo(5.8, 13.5);
      tl.moveTo(-3.5, -4); tl.lineTo(-6.5, 2.5); tl.lineTo(-5.5, 5.5);
      tl.moveTo(3.5, -4.5); tl.lineTo(6.5, 2); tl.lineTo(6, 5.5);
      c.strokeStyle = O; c.lineWidth = 3; c.stroke(tl); c.strokeStyle = W(white, '#8a90a0'); c.lineWidth = 1.3; c.stroke(tl);
      // lean angular torso + wedge head
      const bd = new Path2D(); poly(bd, [-4, -6, 4, -6.5, 5, -1, 3, 7, -3, 7, -4.8, -1]);
      poly(bd, [-2, -7, 6, -7.5, 7.8, -10.5, 6.5, -14.5, 1, -15, -2.6, -12]);
      const hn = new Path2D(); poly(hn, [-1.6, -13.5, -6.5, -22.5, 1.2, -14.9]); poly(hn, [4.4, -14.8, 7.8, -23, 6.9, -13.6]);
      c.lineWidth = 1.8; c.strokeStyle = O; c.stroke(bd); c.stroke(hn);
      c.fillStyle = W(white, '#929aaa'); c.fill(bd); c.fillStyle = W(white, '#e0d6bc'); c.fill(hn);
      if (!white) {
        const sh = new Path2D(); poly(sh, [-3.6, -4.5, -.5, -5, -.8, 6, -2.6, 6, -4, -1]); poly(sh, [-1.6, -11.6, 1, -14, 1.4, -12]); c.fillStyle = '#727888'; c.fill(sh);
        c.fillStyle = '#ffb22a'; c.fillRect(2.6, -11.6, 1.8, 1.8); c.fillRect(5.4, -11.6, 1.8, 1.8);
        if (m === 'rise' || m === 'dive') Z.glow('255,170,40', 12, 4.5, -10.5, .8);
        c.fillStyle = '#f4f0e4'; c.fillRect(3.4, -7.6, 1.2, 1.6); c.fillRect(5.8, -7.6, 1.2, 1.6);
      }
      c.restore();
      stackBox(c, e, 'garg');
    },
    death(e, Z) { Z.burst(e.x, e.y, '#9a9eaa', 14, 110); },
  };

  // Marksmen: crimson-clad longbowmen. Keep their distance, draw (telegraph), loose arrows.
  const archer = {
    hp: 30, sp: 62, dmg: 8, xp: 4, r: 11, eye: false,
    init(e, Z) { stackInit(e, Z); e.t1 = Z.rnd(1.5, 3); e.aim = 0; e.side = Math.random() < .5 ? 1 : -1; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e), a = Z.angTo(e);
      let mv = a, k = 1;
      if (d < 220) mv = a + Math.PI; else if (d < 330) { mv = a + e.side * Math.PI / 2; k = .5; }
      Z.move(e, Math.cos(mv) * e.sp * k, Math.sin(mv) * e.sp * k); e.ang = a;
      e.t1 -= dt;
      if (e.t1 < .5 && e.aim <= 0 && d < 560) e.aim = .5;
      if (e.aim > 0) e.aim -= dt;
      if (e.t1 <= 0) {
        e.t1 = Z.rnd(2.6, 3.4); e.aim = 0;
        if (d < 600) {
          const o = { r: 5, dmg: 8, life: 3.2, col: '255,222,90' };
          Z.shoot(e.x, e.y - 6, a, 240, o);
          if (Math.random() < .3) Z.shoot(e.x, e.y - 6, a + (Math.random() < .5 ? .14 : -.14), 240, o);
          Z.sfx('shoot');
        }
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 11, st = Math.sin(e.ph * 8 + e.seed), aim = e.aim > 0, O = W(white, '#2a1410');
      c.save(); c.translate(e.x, e.y - Math.abs(st) * s); c.scale(s, s); face(c, e);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const qv = new Path2D(); poly(qv, [-7, -10, -3, -11, -1, 0, -5, 1]);
      c.strokeStyle = O; c.lineWidth = 1.6; c.stroke(qv); c.fillStyle = W(white, '#6a4220'); c.fill(qv);
      if (!white) { c.fillStyle = '#f4f0e0'; c.fillRect(-8, -13, 2, 3); c.fillRect(-5.4, -14, 2, 3); }
      const lg = new Path2D(); lg.rect(-4 + st * 1.8, 4, 3.4, 8); lg.rect(.8 - st * 1.8, 4, 3.4, 8);
      const bd = new Path2D(); poly(bd, [-5, -8, 5, -8, 6.5, 6, -6.5, 6]);
      const hd = new Path2D(); circ(hd, 1, -12, 3.8);
      const ht = new Path2D(); poly(ht, [-5, -13, 6.5, -14, 2, -19]);
      const sil = new Path2D(); sil.addPath(lg); sil.addPath(bd); sil.addPath(hd); sil.addPath(ht);
      c.lineWidth = 2.1; c.stroke(sil);
      c.fillStyle = W(white, '#5a3a1e'); c.fill(lg); c.fillStyle = W(white, '#cc2c30'); c.fill(bd); c.fillStyle = W(white, '#eab48a'); c.fill(hd); c.fillStyle = W(white, '#7a4a20'); c.fill(ht);
      if (!white) {
        c.fillStyle = '#f2c84a'; c.fillRect(-6, 1, 12.5, 1.8);
        c.fillStyle = '#1a1010'; c.fillRect(2.8, -12.6, 1.4, 1.4);
        const fe = new Path2D(); fe.moveTo(-3, -15); fe.quadraticCurveTo(-8, -20, -11, -17); c.strokeStyle = '#ec3a2e'; c.lineWidth = 1.8; c.stroke(fe);
      }
      const bw = new Path2D(); bw.arc(4, -4, 10, -1.25, 1.25);
      c.strokeStyle = O; c.lineWidth = 3; c.stroke(bw); c.strokeStyle = W(white, '#9a5a24'); c.lineWidth = 1.5; c.stroke(bw);
      const ex = 4 + Math.cos(1.25) * 10, ey1 = -4 - Math.sin(1.25) * 10, ey2 = -4 + Math.sin(1.25) * 10, pull = aim ? 4 + (1 - Math.max(0, e.aim) / .5) * 5 : 0;
      const sg = new Path2D(); sg.moveTo(ex, ey1); sg.lineTo(ex - pull, -4); sg.lineTo(ex, ey2);
      if (aim) { sg.moveTo(ex - pull, -4); sg.lineTo(15, -4); }
      c.strokeStyle = W(white, '#f4ecd4'); c.lineWidth = .9; c.stroke(sg);
      if (aim && !white) { c.fillStyle = '#ffffff'; c.fillRect(14, -5.3, 2.6, 2.6); }
      c.restore();
      stackBox(c, e, 'archer');
    },
    death(e, Z) { Z.burst(e.x, e.y, '#cc2c30', 9, 90); },
  };

  // Air elementals (summoned by the sultan only): a whirling funnel with bright eyes.
  const airelem = {
    hp: 40, sp: 92, dmg: 10, xp: 3, r: 13, eye: false,
    init(e, Z) { stackInit(e, Z); e.base = 2 + fl(Math.random() * 7); },
    update(e, Z) { const a = Z.angTo(e) + Math.sin(e.ph * 3 + e.seed) * .7; Z.move(e, Math.cos(a) * e.sp, Math.sin(a) * e.sp); e.ang = a; },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 13, t = e.ph * 7 + e.seed;
      c.save(); c.translate(e.x, e.y); c.scale(s, s);
      const tw = new Path2D(), sw = new Path2D(), du = new Path2D();
      for (let i = 0; i < 5; i++) {
        const y = 11 - i * 5.5, rx = 3 + i * 2.8, ox = Math.sin(t + i * .9) * 2.2;
        ell(tw, ox, y, rx, 1.6 + i * .8);
        sw.moveTo(ox - rx * .7, y + .5); sw.quadraticCurveTo(ox, y + 2.5, ox + rx * .8, y - .6);
      }
      for (let i = 0; i < 5; i++) { const a = t * .9 + i * 1.26, rr = 12 + (i % 2) * 3; du.rect(Math.cos(a) * rr - 1, -6 + Math.sin(a) * rr * .35 + i * 2 - 1, 2, 2); }
      c.strokeStyle = W(white, '#1c4a88'); c.lineWidth = 2; c.stroke(tw);
      c.fillStyle = W(white, '#cdeeff'); c.fill(tw);
      if (!white) {
        c.strokeStyle = '#6ab0ee'; c.lineWidth = 1.2; c.stroke(sw);
        c.fillStyle = '#e8f8ff'; c.fill(du);
        Z.glow('160,220,255', 14, 0, -11, .7);
        c.fillStyle = '#1c4a88'; c.fillRect(-3.4, -12, 2.4, 2.4); c.fillRect(1.6, -12, 2.4, 2.4);
      }
      c.restore();
      stackBox(c, e, 'airelem');
    },
    death(e, Z) { Z.burst(e.x, e.y, '#cdeeff', 12, 110); },
  };

  /* ================= Boss: Sulimar, Sultan of the Storm ================= */
  const SPELL = { chain: 'Chain Lightning', bolt: 'Lightning Bolt', meteor: 'Meteor Shower', frost: 'Frost Ring', summon: 'Summon Air Elementals' };
  const WIND = { chain: .8, bolt: .35, meteor: .65, frost: .55, summon: .8 };
  const BPAT = ['chain', 'bolt', 'meteor', 'frost', 'summon', 'chain', 'meteor', 'bolt', 'frost', 'chain', 'summon', 'bolt'];
  const handOf = e => [e.x + (Math.cos(e.ang) < 0 ? -1 : 1) * 30 * e.r / 46, e.y - 62 * e.r / 46];
  const castBolt = (e, Z, x, y, t) => { Z.hazard(x, y, { r: 74, t, dmg: 20, col: '210,230,255' }); e.bolts.push({ x, y, t }); };
  const fire = (e, Z, sp) => {
    const P = Z.P;
    if (sp === 'chain') {
      const [hx, hy] = handOf(e), pts = [[hx, hy]];
      let px = P.x + Z.rnd(-24, 24), py = P.y + Z.rnd(-24, 24), dir = Math.atan2(py - hy, px - hx);
      pts.push([px, py]);
      const jumps = e.rage ? 4 : 3 + (Math.random() < .5 ? 1 : 0);
      for (let j = 0; j < jumps; j++) { dir += (j % 2 ? 1 : -1) * Z.rnd(.7, 1.25); px += Math.cos(dir) * Z.rnd(110, 150); py += Math.sin(dir) * Z.rnd(110, 150); pts.push([px, py]); }
      let k = 0;
      for (let i = 0; i < pts.length - 1 && k < 28; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(L / 52));
        for (let q = i === 0 ? 0 : 1; q <= n && k < 28; q++) {
          const x = ax + (bx - ax) * q / n, y = ay + (by - ay) * q / n;
          if (Math.hypot(x - e.x, y - e.y) < e.r + 24) continue;
          Z.hazard(x, y, { r: 30, t: .78 + k * .04, dmg: 12, col: '140,200,255' }); k++;
        }
      }
      e.chain = pts; e.chT0 = .78 + k * .04 + .4; e.chT = e.chT0; Z.sfx('chain');
    } else if (sp === 'bolt') {
      castBolt(e, Z, P.x, P.y, 1);
      if (e.rage) for (const o of [-1, 1]) castBolt(e, Z, P.x + o * Z.rnd(110, 150), P.y + Z.rnd(-60, 60), 1.25);
      Z.sfx('warn');
    } else if (sp === 'meteor') {
      const n = e.rage ? 10 : 7;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU, d = i === 0 ? 0 : 50 + Math.random() * 130, x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d, t = .95 + i * .1;
        Z.hazard(x, y, { r: 44, t, dmg: 14, col: '255,120,40' }); e.mets.push({ x, y, t, T: t });
      }
      Z.sfx('warn');
    } else if (sp === 'frost') {
      const n = 12, R = 165, cx = P.x, cy = P.y;
      for (let i = 0; i < n; i++) { const a = i / n * TAU; Z.hazard(cx + Math.cos(a) * R, cy + Math.sin(a) * R, { r: 34, t: 1, dmg: 10, col: '170,230,255' }); }
      e.frost = { x: cx, y: cy, t: 1, R }; Z.sfx('warn');
    } else if (sp === 'summon') {
      const n = e.rage ? 4 : 2 + (Math.random() < .5 ? 1 : 0);
      for (let i = 0; i < n; i++) { const a = e.ph + i * TAU / n, x = e.x + Math.cos(a) * (e.r + 34), y = e.y + Math.sin(a) * (e.r + 34); if (Z.spawn('airelem', x, y)) Z.burst(x, y, '#cdeeff', 12, 120); }
      Z.sfx('boss'); Z.shake(4);
    }
  };
  const boss = {
    name: 'Sulimar, Sultan of the Storm', hp: 3800, sp: 54, dmg: 24, xp: 0, r: 46, heavy: true, eye: false,
    init(e) {
      e.mode = 'walk'; e.mt = 2.2; e.pi = 0; e.rage = false; e.spell = ''; e.lab = ''; e.labT = 0; e.orb = Math.random() < .5 ? 1 : -1;
      e.chain = null; e.chT = 0; e.chT0 = 1; e.bolts = []; e.mets = []; e.frost = null;
    },
    update(e, Z) {
      const dt = Z.dt;
      if (!e.rage && e.hp < e.max * .4) {
        e.rage = true; Z.banner('Sulimar summons the full fury of the storm!', '#8ad0ff', true); Z.sfx('boss'); Z.shake(10);
        Z.ring(e.x, e.y - 20, 16, 150, { r: 7, dmg: 9, col: '140,200,255' }, e.ph);
      }
      if (e.labT > 0) e.labT -= dt;
      if (e.chT > 0) e.chT -= dt;
      for (let i = e.bolts.length - 1; i >= 0; i--) { const b = e.bolts[i], was = b.t; b.t -= dt; if (was > 0 && b.t <= 0) { Z.shake(6); Z.burst(b.x, b.y, '#e8f4ff', 14, 160); } if (b.t < -.35) e.bolts.splice(i, 1); }
      for (let i = e.mets.length - 1; i >= 0; i--) { const m = e.mets[i]; m.t -= dt; if (m.t <= 0) { Z.burst(m.x, m.y, '#ff8a30', 10, 130); e.mets.splice(i, 1); } }
      if (e.frost) {
        const f = e.frost, was = f.t; f.t -= dt;
        if (was > 0 && f.t <= 0) {
          for (let i = 0; i < 12; i++) {
            const a = i / 12 * TAU, x = f.x + Math.cos(a) * f.R, y = f.y + Math.sin(a) * f.R;
            Z.shoot(x, y, a + Math.PI, 95, { r: 6, dmg: 6, life: 2.2, col: '150,225,255', slow: true });
            Z.shoot(x, y, a, 140, { r: 6, dmg: 6, life: 2.2, col: '150,225,255', slow: true });
          }
          Z.sfx('nova');
        }
        if (f.t < -.5) e.frost = null;
      }
      e.mt -= dt;
      const d = Z.dist(e), a = Z.angTo(e);
      switch (e.mode) {
        case 'walk': {
          const sp = e.sp * (e.rage ? 1.3 : 1);
          let mv = a, k = 1;
          if (d < 200) { mv = a + Math.PI; k = .8; } else if (d < 320) { mv = a + e.orb * Math.PI / 2; k = .7; }
          Z.move(e, Math.cos(mv) * sp * k, Math.sin(mv) * sp * k); e.ang = a;
          if (e.mt <= 0) {
            const sp2 = BPAT[e.pi++ % BPAT.length];
            e.mode = 'cast'; e.spell = sp2; e.mt = WIND[sp2] * (e.rage ? .75 : 1);
            e.lab = 'Sulimar casts ' + SPELL[sp2] + '!'; e.labT = 2.1; Z.sfx('charge');
            if (Math.random() < .3) e.orb = -e.orb;
          }
          break;
        }
        case 'cast':
          Z.move(e, Math.cos(a + e.orb * Math.PI / 2) * e.sp * .25, Math.sin(a + e.orb * Math.PI / 2) * e.sp * .25); e.ang = a;
          if (e.mt <= 0) {
            fire(e, Z, e.spell);
            if (e.rage && e.spell !== 'bolt') { castBolt(e, Z, Z.P.x, Z.P.y, 1.1); e.lab = 'Sulimar casts ' + SPELL[e.spell] + ' and Lightning Bolt!'; e.labT = 2; }
            e.mode = 'recover'; e.mt = e.rage ? .4 : .7;
          }
          break;
        case 'recover':
          Z.move(e, 0, 0); e.ang = a;
          if (e.mt <= 0) { e.mode = 'walk'; e.mt = (e.rage ? .9 : 1.6) + Math.random() * .7; }
          break;
        default: e.mode = 'walk'; e.mt = 1;
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 46, now = Z.now, cast = e.mode === 'cast', O = W(white, '#141a3e');
      // ---- spell visuals in world space ----
      if (!white) {
        c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
        if (e.chain && e.chT > 0) {
          const el = e.chT0 - e.chT, pts = e.chain, z = new Path2D();
          if (el < .78) {
            z.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) z.lineTo(pts[i][0], pts[i][1]);
            c.globalAlpha = .25 + .2 * Math.sin(now * 24); c.strokeStyle = '#a8d8ff'; c.lineWidth = 2; c.stroke(z);
          } else {
            z.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < pts.length; i++) {
              const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / L, ny = (bx - ax) / L;
              for (let q = 1; q <= 4; q++) { const j = q === 4 ? 0 : Math.sin(now * 53 + i * 3.1 + q * 1.7) * 12; z.lineTo(ax + (bx - ax) * q / 4 + nx * j, ay + (by - ay) * q / 4 + ny * j); }
            }
            const k = Math.min(1, e.chT / .4 + .3);
            c.globalAlpha = .45 * k; c.strokeStyle = '#6ab4ff'; c.lineWidth = 8; c.stroke(z);
            c.globalAlpha = k; c.strokeStyle = '#f4faff'; c.lineWidth = 2.4; c.stroke(z);
            for (let i = 1; i < pts.length; i++) Z.glow('150,210,255', 30, pts[i][0], pts[i][1], .6 * k);
          }
        }
        if (e.bolts.length) {
          const ch = new Path2D(), lz = new Path2D();
          let strike = false;
          for (const b of e.bolts) {
            if (b.t > 0) {
              const r = 20 + b.t * 30;
              ch.moveTo(b.x + r, b.y); ch.arc(b.x, b.y, r, 0, TAU); ch.moveTo(b.x - 30, b.y); ch.lineTo(b.x + 30, b.y); ch.moveTo(b.x, b.y - 22); ch.lineTo(b.x, b.y + 22);
            } else {
              strike = true; lz.moveTo(b.x + 40, b.y - 520);
              for (let q = 1; q <= 7; q++) lz.lineTo(b.x + 40 * (1 - q / 7) + (q < 7 ? Math.sin(now * 61 + q * 2.3 + b.x) * 16 : 0), b.y - 520 * (1 - q / 7));
              Z.glow('200,230,255', 80, b.x, b.y, .8);
            }
          }
          c.globalAlpha = .55 + .35 * Math.sin(now * 20); c.strokeStyle = '#e8f4ff'; c.lineWidth = 2; c.stroke(ch);
          if (strike) { c.globalAlpha = .5; c.strokeStyle = '#7ab8ff'; c.lineWidth = 10; c.stroke(lz); c.globalAlpha = 1; c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.stroke(lz); }
        }
        if (e.mets.length) {
          const tl = new Path2D(), co = new Path2D();
          for (const m of e.mets) {
            const k = Math.max(0, Math.min(1, 1 - m.t / m.T)); if (k < .3) continue;
            const x = m.x - (1 - k) * 240, y = m.y - (1 - k) * 420;
            tl.moveTo(x, y); tl.lineTo(x - 28, y - 48); circ(co, x, y, 7);
            Z.glow('255,140,40', 26, x, y, .8);
          }
          c.globalAlpha = .75; c.strokeStyle = '#ff8a30'; c.lineWidth = 6; c.stroke(tl); c.globalAlpha = 1;
          c.fillStyle = '#ffe080'; c.fill(co); c.strokeStyle = '#a02a10'; c.lineWidth = 1.5; c.stroke(co);
        }
        if (e.frost && e.frost.t > 0) {
          const f = e.frost, ic = new Path2D();
          ic.moveTo(f.x + f.R, f.y); ic.arc(f.x, f.y, f.R, 0, TAU);
          for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + .26, r0 = f.R - 10, r1 = f.R + 12; ic.moveTo(f.x + Math.cos(a) * r0, f.y + Math.sin(a) * r0); ic.lineTo(f.x + Math.cos(a) * r1, f.y + Math.sin(a) * r1); }
          c.globalAlpha = .45 + .3 * Math.sin(now * 16); c.strokeStyle = '#c8f0ff'; c.lineWidth = 2; c.stroke(ic);
        }
        if (e.rage) { const ra = new Path2D(); for (let i = 0; i < 8; i++) { const a = now * 2 + i * TAU / 8, r = e.r + 10; ra.moveTo(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r * .7); ra.lineTo(e.x + Math.cos(a + .2) * (r + 9), e.y + Math.sin(a + .2) * (r + 9) * .7 + Math.sin(now * 40 + i) * 4); } c.globalAlpha = .7; c.strokeStyle = '#9ad8ff'; c.lineWidth = 2; c.stroke(ra); }
        c.restore();
      }
      // ---- the djinn ----
      const bob = Math.sin(e.ph * 2.2) * 4;
      c.save(); c.translate(e.x, e.y + bob * s); c.scale(s, s); face(c, e);
      c.lineCap = 'round'; c.lineJoin = 'round';
      // smoky tail
      const tl = new Path2D(), tli = new Path2D();
      for (let i = 0; i < 7; i++) { const t = i / 6, x = -2 - 16 * t + Math.sin(e.ph * 3 + i) * 4, y = 10 + 40 * t, r = 17 - 12.5 * t; circ(tl, x, y, r); circ(tli, x - r * .25, y - r * .25, r * .55); }
      c.strokeStyle = O; c.lineWidth = 2.2; c.stroke(tl); c.fillStyle = W(white, '#6c80c4'); c.fill(tl);
      if (!white) { c.fillStyle = '#a4b6ea'; c.fill(tli); }
      // back arm
      const ba = new Path2D(); poly(ba, [-14, -22, -28, -8, -26, 2, -20, 0, -18, -10, -10, -16]);
      // torso
      const tor = new Path2D(); poly(tor, [-17, -26, 17, -26, 15, 6, -15, 6]);
      // front arm: raised high while casting
      const fa = new Path2D(), hx = cast ? 30 : 26, hy = cast ? -62 : 0;
      if (cast) poly(fa, [12, -24, 20, -28, 34, -58, 26, -62]); else poly(fa, [12, -24, 20, -26, 30, -6, 22, 0]);
      const hd = new Path2D(); circ(hd, 3, -36, 12);
      const tb = new Path2D(); ell(tb, 3, -55, 17, 9); circ(tb, 3, -62, 11);
      const sil = new Path2D(); sil.addPath(ba); sil.addPath(tor); sil.addPath(fa); sil.addPath(hd); sil.addPath(tb);
      c.strokeStyle = O; c.lineWidth = 2.6; c.stroke(sil);
      const SK = W(white, '#3c80e6');
      c.fillStyle = SK; c.fill(ba); c.fill(tor); c.fill(fa); c.fill(hd);
      if (!white) {
        const ch = new Path2D(); ell(ch, -3, -16, 8, 7); ell(ch, 0, -40, 6, 4.5); c.fillStyle = '#6aa6f4'; c.fill(ch);
        const vs = new Path2D(); poly(vs, [-17, -26, -6, -26, -9, 6, -15, 6]); poly(vs, [17, -26, 9, -26, 11, 6, 15, 6]);
        c.fillStyle = '#7a2a9c'; c.fill(vs); c.strokeStyle = '#f0c040'; c.lineWidth = 1.6; c.stroke(vs);
        c.fillStyle = '#d8302a'; c.fillRect(-16, 0, 32, 7); c.fillStyle = '#f0c040'; c.fillRect(-3, -.5, 7, 8);
        const bc = new Path2D(); bc.rect(-27, -6, 7, 4); if (cast) bc.rect(25, -54, 8, 4); else bc.rect(23, -8, 8, 4);
        c.fillStyle = '#f0c040'; c.fill(bc);
        // beard and moustache
        const bd = new Path2D(); poly(bd, [-4, -31, 11, -31, 6, -16, 3, -14]); bd.moveTo(-2, -32); bd.quadraticCurveTo(4, -29, 11, -32);
        c.fillStyle = '#16121e'; c.fill(bd);
        c.fillStyle = '#16121e'; c.fillRect(1, -44.5, 6, 1.6); c.fillRect(9, -44.5, 6, 1.6); c.fillStyle = '#fff4c0'; c.fillRect(3, -41.5, 3.6, 2.6); c.fillRect(10, -41.5, 3.6, 2.6);
        c.strokeStyle = '#f0c040'; c.lineWidth = 1.8; c.beginPath(); c.arc(-6, -31, 3.2, 0, TAU); c.stroke();
      } else { c.fillStyle = '#fff'; c.fill(tb); }
      // turban with a ruby and a plume
      if (!white) {
        c.fillStyle = '#f2ecdc'; c.fill(tb);
        const fo = new Path2D(); fo.moveTo(-12, -57); fo.quadraticCurveTo(3, -49, 19, -57); fo.moveTo(-7, -65); fo.quadraticCurveTo(4, -57, 13, -67);
        c.strokeStyle = '#c8bea6'; c.lineWidth = 1.6; c.stroke(fo);
        const pl = new Path2D(); pl.moveTo(6, -66); pl.quadraticCurveTo(-4, -84, -14, -82); pl.quadraticCurveTo(-4, -76, 2, -64); pl.closePath();
        c.fillStyle = '#4ad0e0'; c.fill(pl); c.strokeStyle = O; c.lineWidth = 1.2; c.stroke(pl);
        c.fillStyle = '#f0c040'; c.beginPath(); c.arc(7, -59, 5.4, 0, TAU); c.fill();
        c.fillStyle = '#e01c40'; c.beginPath(); c.arc(7, -59, 3.4, 0, TAU); c.fill();
      }
      // crackling lightning in the raised hand (or a spark on the hip)
      if (!white) {
        const k = cast ? 1 : .35, lz = new Path2D();
        lz.moveTo(hx, hy);
        for (let q = 1; q <= 4; q++) lz.lineTo(hx + Math.sin(now * 47 + q * 2.1) * 7 * k, hy - q * 7 * k - (cast ? 4 : 0));
        lz.moveTo(hx, hy); lz.lineTo(hx + 9 * k, hy + Math.sin(now * 39) * 6 * k);
        Z.glow('150,210,255', (cast ? 40 : 18), hx, hy - 8 * k, cast ? .9 : .5);
        c.strokeStyle = '#7ab8ff'; c.lineWidth = 4 * k + 1; c.stroke(lz); c.strokeStyle = '#ffffff'; c.lineWidth = 1.6; c.stroke(lz);
      }
      c.restore();
      // ---- spell label ----
      if (e.labT > 0 && !white) {
        const a = Math.min(1, e.labT / .4), w = e.lab.length * 5.4 + 14, y = e.y - e.r * 1.95 - (2.1 - Math.min(2.1, e.labT)) * 6;
        c.save(); c.globalAlpha = a;
        c.fillStyle = 'rgba(16,22,60,.85)'; c.fillRect(e.x - w / 2, y - 9, w, 18);
        c.strokeStyle = '#e8c050'; c.lineWidth = 1.4; c.strokeRect(e.x - w / 2, y - 9, w, 18);
        c.fillStyle = '#fff2c0'; c.font = 'bold 10px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(e.lab, e.x, y + .5);
        c.restore();
      }
    },
    death(e, Z) { Z.burst(e.x, e.y, '#3c80e6', 36, 220); Z.burst(e.x, e.y - 40, '#cdeeff', 24, 200); Z.shake(14); Z.banner('The Sultan of the Storm is banished!', '#f2d27a', false); },
  };

  /* ================= Events ================= */
  const ahead = (Z, d) => { const f = Z.P.face || { x: 1, y: 0 }, l = Math.hypot(f.x, f.y) || 1, a = Math.atan2(f.y / l, f.x / l); return { x: Z.P.x + Math.cos(a) * d, y: Z.P.y + Math.sin(a) * d, a }; };
  const spot = (Z, d) => { const a = Math.random() * TAU; return { x: Z.P.x + Math.cos(a) * d, y: Z.P.y + Math.sin(a) * d, a }; };
  const events = [
    { t: 5, run(Z) { Z.banner('Day 1, Week 1: the frontier awaits its hero.', '#f2d27a', false); } },
    { t: 16, run(Z) {
      Z.banner('A wandering stack of pikemen blocks the road!', '#9cb8ff', false); Z.sfx('warn');
      const p = ahead(Z, 430), px = -Math.sin(p.a), py = Math.cos(p.a);
      for (let i = 0; i < 9; i++) { const n = Z.spawn('pike', p.x + px * (i - 4) * 30, p.y + py * (i - 4) * 30); if (n) { n.mode = 'march'; n.dir = p.a + Math.PI; n.mt = 6; n.base = 20 + fl(Math.random() * 20); } }
    } },
    { t: 34, run(Z) {
      Z.banner('Wolf riders raid the caravan!', '#e8b070', false); Z.sfx('warn');
      const p = spot(Z, 400);
      for (let k = 0; k < 2; k++) {
        const a = p.a + (k ? 1 : -1) * 1.1;
        for (let i = 0; i < 4; i++) { const n = Z.spawn('wolf', Z.P.x + Math.cos(a) * (400 + i * 26), Z.P.y + Math.sin(a) * (400 + i * 26)); if (n) { n.side = k ? 1 : -1; n.t1 = .6 + i * .25; } }
      }
    } },
    { t: 60, run(Z) {
      Z.banner('Day 3: the creatures grow…', '#c8a0f0', true); Z.sfx('boss');
      for (const f of Z.foes()) if (!f.boss) { f.base = Math.round((f.base || 8) * 1.5); f.max *= 1.25; f.hp *= 1.25; }
      const p = spot(Z, 420);
      for (let i = 0; i < 5; i++) Z.spawn('pike', p.x + Math.cos(i * 1.3) * 34, p.y + Math.sin(i * 1.3) * 34);
      for (let i = 0; i < 3; i++) Z.spawn('archer', p.x - Math.cos(p.a) * 70 + (i - 1) * 40, p.y - Math.sin(p.a) * 70);
    } },
    { t: 86, run(Z) {
      Z.banner('Week of the Gargoyle!', '#b8c0d8', true); Z.sfx('boss'); Z.shake(5);
      for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, n = Z.spawn('garg', Z.P.x + Math.cos(a) * 420, Z.P.y + Math.sin(a) * 420); if (n) { n.t1 = 1 + i * .3; n.base = 10 + fl(Math.random() * 30); } }
    } },
    { t: 112, run(Z) {
      Z.banner('Marksmen take the high ground!', '#ff8a6a', false); Z.sfx('warn');
      const p = ahead(Z, 360), px = -Math.sin(p.a), py = Math.cos(p.a);
      for (let i = 0; i < 5; i++) Z.spawn('archer', p.x + Math.cos(p.a) * 80 + px * (i - 2) * 46, p.y + Math.sin(p.a) * 80 + py * (i - 2) * 46);
      for (let i = 0; i < 4; i++) { const n = Z.spawn('pike', p.x + px * (i - 1.5) * 32, p.y + py * (i - 1.5) * 32); if (n) { n.mode = 'march'; n.dir = p.a + Math.PI; n.mt = 4; } }
    } },
    { t: 132, run(Z) {
      Z.banner('Day 7: one last stand before the new week!', '#f2d27a', false); Z.sfx('warn');
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, n = Z.spawn('wolf', Z.P.x + Math.cos(a) * 420, Z.P.y + Math.sin(a) * 420); if (n) n.t1 = .5 + i * .2; }
      for (let i = 0; i < 3; i++) { const p = spot(Z, 380); Z.spawn('garg', p.x, p.y); }
    } },
  ];

  /* ================= Music: original pastoral adventure-map theme, D major / lydian, 92 bpm ================= */
  const MAJ = [0, 2, 4, 5, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10];
  const deg = (sc, base, i, sharp) => { const o = ((i % 7) + 7) % 7; return base + sc[o] + (sharp === o ? 1 : 0) + 12 * Math.floor(i / 7); };
  const CH = [0, 4, 5, 3, 0, 2, 3, 4, 1, 3, 0, 4, 3, 1, 4, 0]; // D A Bm G | D F#m G A | Em G D A | G E(lydian #4) A D
  const _ = null;
  const MEL = [
    [4, _, _, 5, 4, _, 2, _, 1, _, _, _, _, _, 2, 3],
    [2, _, 4, _, 7, _, _, 6, 7, _, 8, _, 7, _, _, _],
    [8, _, _, 7, 6, _, 4, _, 5, _, _, 4, 3, _, _, _],
    [4, _, 3, 2, 1, _, _, 2, 0, _, _, _, _, _, _, _],
  ];
  const ORD = [0, 1, 0, 2, 1, 0, 2, 3];
  const ARP = [0, 2, 4, 7, 9, 7, 4, 2];
  const CHB = [0, 5, 6, 4, 0, 5, 3, 4]; // Dm Bb C A | Dm Bb Gm A
  const BMEL = [
    [0, _, _, 4, _, _, 3, 4, 5, _, 4, _, 3, _, 1, _],
    [2, _, _, 1, 0, _, 1, _, 6, _, _, _, _, _, _, _],
    [7, _, _, 6, 5, _, 4, _, 3, _, 4, _, 5, _, _, _],
    [4, _, 5, _, 6, _, 4, _, 4, _, _, _, 7, _, 6, _],
  ];
  const music = {
    bpm: 92, div: 2,
    step(s, t, A) {
      const spb = 60 / 92 / 2, b = s % 8, boss = A.boss, inten = A.inten || 0;
      if (!boss) {
        const bar = fl(s / 8) % 16, ch = CH[bar], sh = bar === 13 ? 3 : -1, M = (base, i) => deg(MAJ, base, i, sh);
        const ph = MEL[ORD[fl(bar / 2) % 8]], idx = (bar % 2) * 8 + b, n = ph[idx];
        let len = 1; while (idx + len < 16 && ph[idx + len] === null && len < 6) len++;
        if (b === 0) A.tone(t, M(38, ch), spb * 3.8, .065, { type: 'triangle', attack: .03 });
        if (b === 4) A.tone(t, M(38, ch + 4), spb * 3.6, .045, { type: 'triangle', attack: .03 });
        if (b === 0) A.pad([M(57, ch), M(57, ch + 2), M(57, ch + 4)], t, spb * 8.4, .012, { type: 'sawtooth', cutoff: 1200, q: 1, detune: 8 });
        A.pluck(M(50, ch + ARP[b]), t, b === 0 ? .5 : .32);
        if (n !== null) {
          A.tone(t, M(62, n), spb * len * .95, .05, { type: 'triangle', attack: .06, vib: .45, cutoff: 3600 });
          if (bar >= 8) A.tone(t + .004, M(62, n - 2), spb * len * .9, .018, { type: 'square', attack: .05, vib: .25, cutoff: 1600 });
        }
        if (b === 0 && bar % 4 === 0) A.tom(t, 73, .2);
        if (b === 6 && bar % 4 === 3) { A.tom(t, 98, .14); A.tom(t + spb, 73, .18); }
        if (b % 2 === 1) A.noise(t, .045, .007 + inten * .006, { type: 'highpass', f: 7000 });
        if (b === 6 && bar % 2 === 1) A.bell(M(86, ch + 4), t, .03);
      } else {
        // heroic battle: timpani, snare rolls, brass stabs, driving strings, D minor (harmonic on A)
        const bar = fl(s / 8) % 8, ch = CHB[bar], sh = ch === 4 ? 6 : -1, M = (base, i) => deg(MIN, base, i, sh);
        const ph = BMEL[fl(bar / 2) % 4], idx = (bar % 2) * 8 + b, n = ph[idx];
        let len = 1; while (idx + len < 16 && ph[idx + len] === null && len < 4) len++;
        A.tone(t, M(50, ch + [0, 0, 4, 0, 7, 0, 4, 2][b]), spb * .85, .036, { type: 'sawtooth', cutoff: 1100, attack: .01 });
        if (b % 2 === 0) A.tone(t, M(38, ch), spb * 1.8, .07, { type: 'sawtooth', cutoff: 380 });
        if (b === 0 || b === 3 || b === 6) A.tom(t, A.mtof(M(38, b === 6 ? ch + 4 : ch)), b === 0 ? .42 : .3);
        if (b === 0 || b === 4) A.kick(t, .55);
        if (b === 4) A.snare(t, .27); else if (b === 2 || b === 7) A.snare(t, .07);
        if (bar % 4 === 3 && b >= 4) { A.snare(t, .1 + (b - 4) * .04); A.snare(t + spb / 2, .1 + (b - 4) * .04); }
        if (b === 0 || b === 3) for (const o of [0, 2, 4]) A.tone(t, M(62, ch + o), spb * 1.15, .026, { type: 'sawtooth', cutoff: 1800, sweep: 700, attack: .012 });
        if (n !== null) A.tone(t, M(74, n), spb * len * .92, .042, { type: 'sawtooth', cutoff: 2200, vib: .25, attack: .02 });
        A.hat(t, b % 2 ? .03 : .045, false);
      }
    },
  };

  return {
    id: 'homm', name: 'The Land of Might and Magic', nod: 'Heroes of Might and Magic III', portal: '60,100,230', bg: BG, dark: .35, dim: .12,
    ground, under, ambient,
    mix: { pike: 5, wolf: 3, garg: 1.4, archer: 1.2 },
    target: 1,
    foes: { pike, wolf, garg, archer, airelem },
    boss, events, music,
  };
})());
