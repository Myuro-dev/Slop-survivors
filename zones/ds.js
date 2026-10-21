// Zone ds: a poison mire beneath a rotting stilt-town, where the drowned still shamble. A nod to Dark Souls.
ZONES.push((() => {
  const TAU = Math.PI * 2;
  const W = (white, c) => white ? '#fff' : c;
  const face = (c, e) => { const f = Math.cos(e.ang) < 0 ? -1 : 1; c.scale(f, 1); return f; };
  const pl = (p, pts) => { for (let i = 0; i < pts.length; i++) i ? p.lineTo(pts[i][0], pts[i][1]) : p.moveTo(pts[i][0], pts[i][1]); p.closePath(); return p; };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  // Thin, slightly green-tinted outline (the player found heavy black outlines too much).
  const OUT = '#141a0c';
  const ACID = '150,255,60';

  // Lingering poison clouds (visual only; damage is done by Z.hazard). Cache with age-based expiry.
  const clouds = [];
  const addCloud = (Z, x, y, delay, dur, r) => { if (clouds.length > 26) clouds.shift(); clouds.push({ x, y, t0: Z.now + delay, dur, r, sd: Math.random() * 6 }); };

  // value noise for large-scale regions (scum density)
  const vnoise = (Z, x, y, S, k) => {
    const gx = Math.floor(x / S), gy = Math.floor(y / S);
    let fx = x / S - gx, fy = y / S - gy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    const h = (i, j) => Z.hash(i * 31 + k, j * 17 - k * 3);
    const a = h(gx, gy), b = h(gx + 1, gy), c = h(gx, gy + 1), d = h(gx + 1, gy + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
  const blot = (c, x, y, r, rgb, a, sy = .55) => { // ground only (cached)
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.save(); c.translate(x, y); c.scale(1, sy); c.translate(-x, -y); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
  };

  // ---------- Layout: shanty hubs on a 1400 px macro grid, joined by zig-zag boardwalks ----------
  const MG = 1400, WW = 34, PW = 10;
  const hub = (Z, mx, my) => {
    const h = Z.hash(mx * 7 + 3, my * 11 - 5), h2 = Z.hash(mx * 13 - 2, my * 5 + 9), h3 = Z.hash(mx * 3 + 17, my * 19 + 1);
    const x = mx * MG + MG / 2 + (h - .5) * 380, y = my * MG + MG / 2 + (h2 - .5) * 380;
    const w = 170 + h3 * 70, d = 110 + h * 40, hut = h3 > .3, f = h2 > .5 ? 1 : -1;
    const lx = hut ? x + f * (w * .17 + 4) : x + f * (w / 2 - 12), ly = hut ? y - 28 : y - d / 2 - 28;
    return { x, y, w, d, hut, f, h, h2, h3, lx, ly, cx2: x - f * w * .2, cy2: y - 4, sd: mx * 37 + my * 91 };
  };
  const LC = new Map();
  const links = (Z, mx, my) => {
    const key = mx * 100003 + my; let L = LC.get(key); if (L) return L;
    if (LC.size > 800) LC.clear();
    L = { s: [], el: [] };
    const a = hub(Z, mx, my);
    if (Z.hash(mx * 5 + 1, my * 9 + 2) > .16) {
      const b = hub(Z, mx + 1, my), ex = a.x + (b.x - a.x) * (.35 + Z.hash(mx, my * 3 + 7) * .3);
      L.s.push([a.x, a.y, ex, a.y, 1], [ex, a.y, ex, b.y, Z.hash(mx * 3, my) > .3 ? 1 : 0], [ex, b.y, b.x, b.y, 1]);
      if (Z.hash(mx * 11, my * 7 + 1) > .45) L.el.push({ x: ex + WW / 2 + 4, y: a.y - WW / 2 - 2 });
    }
    if (Z.hash(mx * 9 - 4, my * 5 + 6) > .16) {
      const b = hub(Z, mx, my + 1), ey = a.y + (b.y - a.y) * (.35 + Z.hash(mx * 5 + 2, my) * .3);
      L.s.push([a.x, a.y, a.x, ey, 1], [a.x, ey, b.x, ey, Z.hash(mx, my * 5) > .3 ? 1 : 0], [b.x, ey, b.x, b.y, 1]);
      if (Z.hash(mx * 2 + 9, my * 13) > .45) L.el.push({ x: b.x + WW / 2 + 4, y: ey - WW / 2 - 2 });
    }
    LC.set(key, L); return L;
  };
  // is (x, y) on a boardwalk or shanty platform?
  const onDeck = (Z, x, y, pad) => {
    const mx = Math.floor(x / MG), my = Math.floor(y / MG);
    for (let j = my - 1; j <= my + 1; j++) for (let i = mx - 1; i <= mx + 1; i++) {
      const hb = hub(Z, i, j);
      if (Math.abs(x - hb.x) < hb.w / 2 + pad && y > hb.y - hb.d / 2 - 90 - pad && y < hb.y + hb.d / 2 + 22 + pad) return true;
      const S = links(Z, i, j).s;
      for (let k = 0; k < S.length; k++) {
        const s = S[k];
        if (x > Math.min(s[0], s[2]) - WW / 2 - pad && x < Math.max(s[0], s[2]) + WW / 2 + pad && y > Math.min(s[1], s[3]) - WW / 2 - 14 - pad && y < Math.max(s[1], s[3]) + WW / 2 + 14 + pad) return true;
      }
    }
    return false;
  };
  // mud islands on a 360 px grid
  const IG = 360;
  const island = (Z, gx, gy) => {
    const h = Z.hash(gx * 17 + 4, gy * 29 - 3); if (h > .42) return null;
    return {
      x: gx * IG + IG / 2 + (Z.hash(gx * 3 - 7, gy * 7 + 2) - .5) * 160, y: gy * IG + IG / 2 + (Z.hash(gx * 5 + 1, gy * 3 - 9) - .5) * 160,
      r: 55 + Z.hash(gx * 11, gy * 13 + 5) * 85, k: Z.hash(gx * 23 + 9, gy * 3 - 11), sd: gx * 53 + gy * 97,
    };
  };
  const onLand = (Z, x, y) => {
    const gx = Math.floor(x / IG), gy = Math.floor(y / IG);
    for (let j = gy - 1; j <= gy + 1; j++) for (let i = gx - 1; i <= gx + 1; i++) {
      const I = island(Z, i, j); if (!I) continue;
      const dx = x - I.x, dy = (y - I.y) / .62;
      if (dx * dx + dy * dy < I.r * I.r * .7) return true;
    }
    return false;
  };
  // glowing toxic pools on a 520 px grid (never under a deck)
  const PG = 520, PC = new Map();
  const pool = (Z, gx, gy) => {
    const key = gx * 100003 + gy; if (PC.has(key)) return PC.get(key);
    if (PC.size > 2000) PC.clear();
    let p = null;
    if (Z.hash(gx * 19 - 6, gy * 23 + 4) < .38) {
      const x = gx * PG + PG / 2 + (Z.hash(gx * 7, gy * 3 + 1) - .5) * 300, y = gy * PG + PG / 2 + (Z.hash(gx * 3 + 4, gy * 7) - .5) * 300;
      const r = 32 + Z.hash(gx, gy * 9 + 3) * 40;
      if (!onDeck(Z, x, y, r)) p = { x, y, r, sd: gx * 31 + gy * 17 };
    }
    PC.set(key, p); return p;
  };
  const RC = new Map();
  const ripple = (Z, gx, gy) => {
    const key = gx * 100003 + gy; if (RC.has(key)) return RC.get(key);
    if (RC.size > 4000) RC.clear();
    let p = null;
    const h = Z.hash(gx * 7 + 1, gy * 5 - 3);
    if (h < .5) {
      const x = gx * 170 + 20 + Z.hash(gx, gy * 3) * 130, y = gy * 170 + 20 + Z.hash(gx * 3, gy) * 130;
      if (!onLand(Z, x, y) && !onDeck(Z, x, y, 16)) p = { x, y, per: 2.6 + h * 5, off: Z.hash(gx * 13, gy * 11) * 9 };
    }
    RC.set(key, p); return p;
  };

  // ---------- Floor pieces (ground only) ----------
  const PLANK = ['#5f472c', '#6b5233', '#56402a'];
  const newB = () => ({ shade: new Path2D(), str: new Path2D(), edge: new Path2D(), pl: [new Path2D(), new Path2D(), new Path2D()], brk: new Path2D(), grain: new Path2D(), stil: new Path2D(), ring: new Path2D(), post: new Path2D(), rope: new Path2D() });
  const flushB = (c, B) => {
    c.fillStyle = 'rgba(12,12,4,.42)'; c.fill(B.shade);
    c.fillStyle = '#22180d'; c.fill(B.stil);
    c.strokeStyle = 'rgba(160,180,90,.32)'; c.lineWidth = 1.2; c.stroke(B.ring);
    c.fillStyle = '#21170d'; c.fill(B.str);
    for (let k = 0; k < 3; k++) { c.fillStyle = PLANK[k]; c.fill(B.pl[k]); }
    c.fillStyle = '#2e2214'; c.fill(B.edge);
    c.fillStyle = '#33251a'; c.fill(B.brk);
    c.fillStyle = 'rgba(28,18,8,.5)'; c.fill(B.grain);
    c.fillStyle = '#3a2a18'; c.fill(B.post); c.strokeStyle = '#1a1208'; c.lineWidth = 1; c.stroke(B.post);
    c.lineCap = 'round'; c.strokeStyle = '#1a1208'; c.lineWidth = 2.6; c.stroke(B.rope); c.strokeStyle = '#9a8456'; c.lineWidth = 1.2; c.stroke(B.rope); c.lineCap = 'butt';
  };
  const deckH = (B, Z, xa, xb, y, rail, X0, X1) => {
    const x1 = Math.max(Math.min(xa, xb), X0 - 40), x2 = Math.min(Math.max(xa, xb), X1 + 40); if (x2 <= x1) return;
    const T = y - WW / 2, yk = Math.round(y);
    B.shade.rect(x1 + 4, T + WW + 2, x2 - x1, 14);
    B.str.rect(x1, T + 4, x2 - x1, 3); B.str.rect(x1, T + WW - 7, x2 - x1, 3);
    B.edge.rect(x1, T + WW, x2 - x1, 4);
    for (let i = Math.floor(x1 / PW); i * PW < x2; i++) {
      const px = Math.max(i * PW, x1), pw = Math.min(i * PW + PW - 1.3, x2) - px; if (pw <= .5) continue;
      const h = Z.hash(i * 7 + 3, yk * 3 + 1), h2 = Z.hash(i * 3 - 5, yk + 7), jt = (h2 - .5) * 3;
      if (h < .055) continue; // missing plank
      if (h < .12) { B.pl[(h2 * 2.99) | 0].rect(px, T + jt, pw, WW * .45); B.brk.rect(px, T + WW * .45 + jt - 1, pw, 1.6); continue; }
      B.pl[(h2 * 2.99) | 0].rect(px, T - 1 + jt, pw, WW + 2 - jt * .5);
      if (h2 > .72) B.grain.rect(px + pw * .4, T + 4 + h * 10, 1, 8 + h2 * 10);
    }
    for (let i = Math.ceil(x1 / 64); i * 64 < x2; i++) {
      const px = i * 64, h = Z.hash(i + 11, yk);
      B.stil.rect(px - 2, T + WW + 4, 4, 9); B.ring.moveTo(px + 6, T + WW + 13); B.ring.ellipse(px, T + WW + 13, 6, 2, 0, 0, TAU);
      if (!rail || h < .12) continue;
      B.post.rect(px - 2, T - 12, 4, 13); B.post.rect(px - 2, T + WW - 12, 4, 14);
      if (px + 64 <= x2 && h > .25) { B.rope.moveTo(px, T - 11); B.rope.quadraticCurveTo(px + 32, T - 3, px + 64, T - 11); }
      if (px + 64 <= x2 && h < .85) { B.rope.moveTo(px, T + WW - 11); B.rope.quadraticCurveTo(px + 32, T + WW - 3 + h * 4, px + 64, T + WW - 11); }
      else if (h >= .85) { B.rope.moveTo(px, T + WW - 11); B.rope.quadraticCurveTo(px + 8, T + WW, px + 6, T + WW + 12); }
    }
  };
  const deckV = (B, Z, x, ya, yb, rail, Y0, Y1) => {
    const y1 = Math.max(Math.min(ya, yb), Y0 - 40), y2 = Math.min(Math.max(ya, yb), Y1 + 40); if (y2 <= y1) return;
    const L = x - WW / 2, xk = Math.round(x);
    B.shade.rect(L + WW, y1 + 6, 12, y2 - y1);
    B.str.rect(L + 4, y1, 3, y2 - y1); B.str.rect(L + WW - 7, y1, 3, y2 - y1);
    B.edge.rect(L + WW, y1, 3, y2 - y1);
    for (let i = Math.floor(y1 / PW); i * PW < y2; i++) {
      const py = Math.max(i * PW, y1), ph = Math.min(i * PW + PW - 1.3, y2) - py; if (ph <= .5) continue;
      const h = Z.hash(xk * 3 + 1, i * 7 + 3), h2 = Z.hash(xk + 7, i * 3 - 5), jt = (h2 - .5) * 3;
      if (h < .055) continue;
      if (h < .12) { B.pl[(h2 * 2.99) | 0].rect(L + jt, py, WW * .5, ph); B.brk.rect(L + WW * .5 + jt - 1, py, 1.6, ph); continue; }
      B.pl[(h2 * 2.99) | 0].rect(L - 1 + jt, py, WW + 2 - jt * .5, ph);
      if (h2 > .72) B.grain.rect(L + 4 + h * 10, py + ph * .4, 8 + h2 * 10, 1);
    }
    for (let i = Math.ceil(y1 / 64); i * 64 < y2; i++) {
      const py = i * 64, h = Z.hash(xk, i + 11);
      B.stil.rect(L + WW + 3, py, 3, 8); B.ring.moveTo(L + WW + 11, py + 9); B.ring.ellipse(L + WW + 5, py + 9, 6, 2, 0, 0, TAU);
      if (!rail || h < .12) continue;
      B.post.rect(L - 3, py - 12, 4, 13); B.post.rect(L + WW - 1, py - 12, 4, 13);
      if (py + 64 <= y2 && h > .25) { B.rope.moveTo(L - 1, py - 11); B.rope.quadraticCurveTo(L - 6, py + 21, L - 1, py + 53); }
      if (py + 64 <= y2 && h < .85) { B.rope.moveTo(L + WW + 1, py - 11); B.rope.quadraticCurveTo(L + WW + 6, py + 21, L + WW + 1, py + 53); }
    }
  };
  const platB = (B, Z, p) => {
    const L = p.x - p.w / 2, T = p.y - p.d / 2;
    B.shade.rect(L + 6, T + p.d + 2, p.w, 20);
    for (let x = L + 8; x < L + p.w; x += 34) { B.stil.rect(x - 3, T + p.d + 6, 6, 13); B.ring.moveTo(x + 8, T + p.d + 19); B.ring.ellipse(x, T + p.d + 19, 8, 2.6, 0, 0, TAU); }
    B.str.rect(L - 2, T - 2, p.w + 4, p.d + 4);
    for (let i = 0; i * 11 < p.w; i++) {
      const px = L + i * 11, pw = Math.min(10, L + p.w - px), h = Z.hash(p.sd + i, 41), h2 = Z.hash(i * 3, p.sd + 7);
      if (h < .03 || pw <= .5) continue;
      B.pl[(h2 * 2.99) | 0].rect(px, T + (h - .5) * 2, pw, p.d - Math.abs(h2 - .5) * 3);
      if (h2 > .65) B.grain.rect(px + 4, T + 8 + h * 30, 1, 14);
    }
    B.edge.rect(L, T + p.d, p.w, 8);
    B.brk.rect(L, T + p.d * .3, p.w, 4); B.brk.rect(L, T + p.d * .78, p.w, 4);
  };
  const cage = (c, x, y) => {
    c.fillStyle = '#1e160c'; c.fillRect(x - 4, y - 6, 8, 11);
    c.fillStyle = '#d0d878'; c.fillRect(x - 2.5, y - 4, 5, 7);
    c.fillStyle = '#1e160c'; c.fillRect(x - .5, y - 4, 1, 7);
  };
  const barrel = (c, x, y) => {
    c.fillStyle = '#4e3822'; c.fillRect(x - 7, y - 14, 14, 14);
    c.strokeStyle = '#1a1208'; c.lineWidth = 1.2; c.strokeRect(x - 7, y - 14, 14, 14);
    c.fillStyle = '#2a2420'; c.fillRect(x - 7, y - 11, 14, 2); c.fillRect(x - 7, y - 4, 14, 2);
    c.fillStyle = '#654a2c'; c.beginPath(); c.ellipse(x, y - 14, 7, 3, 0, 0, TAU); c.fill(); c.stroke();
  };
  const crate = (c, x, y, s) => {
    c.fillStyle = '#5a4428'; c.fillRect(x - s / 2, y - s * .8, s, s * .8);
    c.fillStyle = '#6e5634'; c.fillRect(x - s / 2, y - s * 1.15, s, s * .35);
    c.strokeStyle = '#1a1208'; c.lineWidth = 1.2; c.strokeRect(x - s / 2, y - s * 1.15, s, s * 1.15);
    c.beginPath(); c.moveTo(x - s / 2, y - s * .8); c.lineTo(x + s / 2, y); c.moveTo(x - s / 2, y - s * .8); c.lineTo(x + s / 2, y - s * .8); c.stroke();
  };
  const drawHut = (c, Z, p) => {
    const hw = p.w * .58, cx = p.x - p.f * p.w * .12, base = p.y + 2, H = 48, l = cx - hw / 2, r = cx + hw / 2;
    c.fillStyle = 'rgba(12,10,4,.35)'; c.fillRect(l - 6, base - 4, hw + 18, 10);
    c.fillStyle = '#1c140a'; c.fillRect(l - 1, base - H - 2, hw + 2, H + 2);
    const bd = [new Path2D(), new Path2D(), new Path2D()], WC = ['#4e3a24', '#5a4429', '#463320'];
    for (let i = 0; i * 8 < hw; i++) { const h = Z.hash(p.sd * 3 + i, 77), bw = Math.min(7, hw - i * 8); if (bw > .5) bd[(h * 2.99) | 0].rect(l + i * 8, base - H + (h - .5) * 3, bw, H - (h - .5) * 3); }
    for (let k = 0; k < 3; k++) { c.fillStyle = WC[k]; c.fill(bd[k]); }
    c.fillStyle = '#33251a'; c.fillRect(l, base - H * .55, hw, 4);
    const dx = cx + p.f * hw * .16 - 9;
    c.fillStyle = '#120d07'; c.fillRect(dx, base - 32, 18, 32);
    c.strokeStyle = '#2e2214'; c.lineWidth = 2; c.strokeRect(dx, base - 32, 18, 32);
    c.fillStyle = '#4a3550'; c.fill(pl(new Path2D(), [[dx + 1, base - 31], [dx + 10, base - 31], [dx + 8, base - 12], [dx + 5, base - 16], [dx + 1, base - 9]]));
    const wx = cx - p.f * hw * .26 - 7;
    c.fillStyle = '#5c5a22'; c.fillRect(wx, base - 38, 14, 11);
    c.strokeStyle = '#2a1c10'; c.lineWidth = 2; c.strokeRect(wx, base - 38, 14, 11);
    c.beginPath(); c.moveTo(wx + 7, base - 38); c.lineTo(wx + 7, base - 27); c.stroke();
    // sagging roof seen from above
    const rf = new Path2D(); rf.moveTo(l - 12, base - H + 6); rf.lineTo(r + 12, base - H + 3); rf.lineTo(r + 6, base - H - 34); rf.quadraticCurveTo(cx, base - H - 28, l - 4, base - H - 36); rf.closePath();
    c.fillStyle = '#4a3a26'; c.fill(rf); c.strokeStyle = '#1a120a'; c.lineWidth = 1.6; c.stroke(rf);
    const rb = new Path2D(); for (let k = 1; k < 5; k++) { const yy = base - H + 6 - k * 8; rb.moveTo(l - 12 + k * 1.6, yy); rb.lineTo(r + 12 - k * 1.4, yy - 1); }
    c.strokeStyle = '#2c2014'; c.lineWidth = 1.2; c.stroke(rb);
    const pa = new Path2D(), ho = new Path2D(), mo = new Path2D();
    for (let k = 0; k < 3; k++) {
      const x = l + Z.hash(p.sd, k * 3) * (hw - 20), y = base - H - 4 - Z.hash(k * 3, p.sd) * 24;
      pa.rect(x, y, 14 + k * 3, 7);
      if (k < 2) pl(ho, [[x + 30, y + 2], [x + 38, y], [x + 36, y + 6], [x + 31, y + 7]]);
      mo.moveTo(x + 50, y + 4); mo.ellipse(x + 44, y + 4, 8 + k * 2, 3.4, 0, 0, TAU);
    }
    c.fillStyle = '#5e4a30'; c.fill(pa); c.fillStyle = '#140e08'; c.fill(ho); c.fillStyle = '#56622a'; c.fill(mo);
    const ms = new Path2D();
    for (let k = 0; k < 8; k++) { const x = l - 8 + Z.hash(p.sd, k * 5) * (hw + 16), L2 = 5 + Z.hash(k, p.sd) * 16; ms.moveTo(x, base - H + 5); ms.lineTo(x + 1, base - H + 5 + L2); }
    c.strokeStyle = '#4e5a26'; c.lineWidth = 1.6; c.stroke(ms);
    c.strokeStyle = '#1a120a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(p.lx, base - H + 4); c.lineTo(p.lx, p.ly - 5); c.stroke();
    cage(c, p.lx, p.ly);
    barrel(c, p.x + p.f * p.w * .36, p.y + p.d * .22); crate(c, p.x + p.f * p.w * .24, p.y + p.d * .36, 16);
  };
  const drawCamp = (c, Z, p) => { // bare platform: drying rack, cauldron of brew, lantern pole, barrels
    const rx = p.x + p.f * p.w * .1, ry = p.y - p.d * .22;
    c.lineCap = 'round';
    const rk = new Path2D(); rk.moveTo(rx - 34, ry); rk.lineTo(rx - 34, ry - 40); rk.moveTo(rx + 34, ry); rk.lineTo(rx + 34, ry - 40); rk.moveTo(rx - 40, ry - 38); rk.lineTo(rx + 40, ry - 38);
    c.strokeStyle = '#1a1208'; c.lineWidth = 5; c.stroke(rk); c.strokeStyle = '#4a3622'; c.lineWidth = 3; c.stroke(rk);
    const rg = new Path2D(), bn = new Path2D();
    for (let k = 0; k < 5; k++) { const x = rx - 28 + k * 13, L2 = 12 + Z.hash(k, p.sd) * 14; if (k % 2) { bn.moveTo(x, ry - 38); bn.lineTo(x + 1, ry - 38 + L2); } else pl(rg, [[x - 4, ry - 38], [x + 4, ry - 38], [x + 3, ry - 38 + L2], [x, ry - 41 + L2], [x - 3, ry - 37 + L2]]); }
    c.fillStyle = '#5a4a3c'; c.fill(rg); c.strokeStyle = '#d0c6a2'; c.lineWidth = 2; c.stroke(bn);
    // cauldron on a tripod
    const kx = p.cx2, ky = p.cy2 + 8;
    const tp = new Path2D(); tp.moveTo(kx - 18, ky + 6); tp.lineTo(kx, ky - 26); tp.lineTo(kx + 18, ky + 6);
    c.strokeStyle = '#1a1208'; c.lineWidth = 3; c.stroke(tp);
    c.fillStyle = '#2a2622'; c.beginPath(); c.ellipse(kx, ky, 14, 10, 0, 0, Math.PI); c.lineTo(kx - 14, ky - 8); c.lineTo(kx + 14, ky - 8); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#7ab02a'; c.beginPath(); c.ellipse(kx, ky - 8, 13, 4.5, 0, 0, TAU); c.fill();
    c.strokeStyle = '#141210'; c.lineWidth = 1.6; c.stroke();
    c.fillStyle = '#b8e060'; c.fillRect(kx - 4, ky - 10, 3, 2); c.fillRect(kx + 4, ky - 8, 2, 2);
    c.lineCap = 'butt';
    // lantern pole
    const T = p.y - p.d / 2;
    c.fillStyle = '#2e2014'; c.fillRect(p.lx - 2, p.ly - 10, 4, T + 14 - p.ly + 10);
    c.fillRect(p.lx - 2, p.ly - 10, p.f * -10, 3);
    cage(c, p.lx, p.ly);
    barrel(c, p.x - p.f * p.w * .38, p.y + p.d * .3); barrel(c, p.x - p.f * p.w * .3, p.y + p.d * .36);
    crate(c, p.x + p.f * p.w * .32, p.y + p.d * .3, 18);
  };
  // giant rotten stump with roots arching into the water, bracket fungus and hanging moss
  const drawStump = (c, Z, x, y, s, sd) => {
    c.lineCap = 'round'; c.lineJoin = 'round';
    const rt = new Path2D();
    for (let i = 0; i < 7; i++) {
      const a = (i / 6) * Math.PI * 1.2 - Math.PI * .1 + (Z.hash(i, sd) - .5) * .3, L = (50 + Z.hash(sd, i) * 34) * s;
      const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L * .45 + 6 * s;
      rt.moveTo(x + Math.cos(a) * 14 * s, y - 4 * s); rt.quadraticCurveTo(x + Math.cos(a) * L * .55, y - 14 * s + Math.sin(a) * 6 * s, ex, ey);
    }
    c.strokeStyle = '#1a120a'; c.lineWidth = 11 * s; c.stroke(rt); c.strokeStyle = '#4a3622'; c.lineWidth = 7.5 * s; c.stroke(rt);
    c.strokeStyle = '#5e4a30'; c.lineWidth = 2 * s; c.stroke(rt);
    const tr = pl(new Path2D(), [[x - 22 * s, y + 4 * s], [x - 25 * s, y - 38 * s], [x - 18 * s, y - 52 * s], [x - 10 * s, y - 44 * s], [x - 3 * s, y - 64 * s], [x + 5 * s, y - 48 * s], [x + 12 * s, y - 57 * s], [x + 20 * s, y - 42 * s], [x + 25 * s, y - 36 * s], [x + 22 * s, y + 4 * s]]);
    c.strokeStyle = '#1a120a'; c.lineWidth = 2; c.stroke(tr); c.fillStyle = '#45351f'; c.fill(tr);
    c.fillStyle = 'rgba(10,8,4,.3)'; c.fillRect(x + 8 * s, y - 40 * s, 14 * s, 44 * s);
    c.fillStyle = '#1c140a'; c.beginPath(); c.ellipse(x, y - 44 * s, 13 * s, 5 * s, 0, 0, TAU); c.fill();
    const gr = new Path2D(); for (let k = 0; k < 5; k++) { const gx = x + (-17 + k * 8) * s; gr.moveTo(gx, y); gr.quadraticCurveTo(gx + 3 * s, y - 20 * s, gx - 1 * s, y - 38 * s); }
    c.strokeStyle = '#2e2216'; c.lineWidth = 1.4; c.stroke(gr);
    const fu = new Path2D(), fr = new Path2D();
    for (let k = 0; k < 3; k++) { const fx = x + (k === 1 ? 18 : -16 + k * 4) * s, fy = y - (12 + k * 11) * s, fw = (9 - k) * s; fu.moveTo(fx + fw, fy); fu.ellipse(fx, fy, fw, fw * .45, 0, Math.PI, TAU); fu.closePath(); fr.moveTo(fx - fw, fy); fr.lineTo(fx + fw, fy); }
    c.fillStyle = '#7a3e8a'; c.fill(fu); c.strokeStyle = '#c08ad0'; c.lineWidth = 1.4; c.stroke(fr);
    const ms = new Path2D(); for (let k = 0; k < 6; k++) { const mx = x + (-20 + k * 8) * s, L = (8 + Z.hash(k, sd * 3) * 22) * s; ms.moveTo(mx, y - 40 * s - Z.hash(sd, k) * 8 * s); ms.lineTo(mx + 1, y - 40 * s + L); }
    c.strokeStyle = '#56642a'; c.lineWidth = 1.8; c.stroke(ms);
    c.lineCap = 'butt';
  };
  const drawBones = (c, x, y) => {
    c.fillStyle = 'rgba(26,20,10,.5)'; c.beginPath(); c.ellipse(x + 4, y + 2, 34, 9, 0, 0, TAU); c.fill();
    const rb = new Path2D();
    for (let i = 0; i < 5; i++) { const rx = x - 16 + i * 7, rr = 8 - Math.abs(i - 2) * 1.2; rb.moveTo(rx - rr, y); rb.quadraticCurveTo(rx - rr * .2, y - rr * 2.1, rx + rr * .5, y - .5); }
    rb.moveTo(x - 20, y - 1); rb.lineTo(x + 16, y + 1);
    c.lineCap = 'round'; c.strokeStyle = '#1a140c'; c.lineWidth = 4.2; c.stroke(rb); c.strokeStyle = '#c4ba96'; c.lineWidth = 2.2; c.stroke(rb);
    const sx = x + 26, sy = y + 3, sk = new Path2D(); sk.arc(sx, sy, 6.5, Math.PI, 0); sk.lineTo(sx + 5, sy + 2); sk.lineTo(sx - 5, sy + 2); sk.closePath();
    c.strokeStyle = '#1a140c'; c.lineWidth = 1.6; c.stroke(sk); c.fillStyle = '#cfc6a2'; c.fill(sk);
    c.fillStyle = '#1e1810'; c.fillRect(sx - 4, sy - 3, 2.6, 2.6); c.fillRect(sx + 1.4, sy - 3, 2.6, 2.6);
    c.fillStyle = '#42341f'; c.beginPath(); c.ellipse(x, y + 3, 26, 3.5, 0, 0, TAU); c.fill();
    c.lineCap = 'butt';
  };
  const drawArmour = (c, x, y) => {
    c.fillStyle = 'rgba(26,20,10,.5)'; c.beginPath(); c.ellipse(x, y + 2, 40, 10, 0, 0, TAU); c.fill();
    c.strokeStyle = '#1a140c'; c.lineWidth = 1.4;
    const sh = new Path2D(); sh.ellipse(x - 26, y + 3, 12, 6, 0, Math.PI, TAU); sh.closePath();
    c.fillStyle = '#4e3a28'; c.fill(sh); c.stroke(sh);
    const hm = new Path2D(); hm.arc(x - 6, y + 1, 9, Math.PI, 0); hm.closePath();
    c.fillStyle = '#6a5238'; c.fill(hm); c.stroke(hm);
    c.fillStyle = '#1a140c'; c.fillRect(x - 12, y - 4, 12, 2);
    c.fillStyle = '#9a5a28'; c.fillRect(x - 4, y - 7, 2, 7);
    const bp = pl(new Path2D(), [[x + 6, y + 2], [x + 8, y - 10], [x + 18, y - 12], [x + 24, y - 4], [x + 22, y + 3]]);
    c.fillStyle = '#5c4a38'; c.fill(bp); c.stroke(bp);
    const sw = new Path2D(); sw.moveTo(x + 32, y + 2); sw.lineTo(x + 37, y - 18); sw.moveTo(x + 31, y - 15); sw.lineTo(x + 43, y - 12); sw.moveTo(x + 37, y - 18); sw.lineTo(x + 39, y - 25);
    c.lineCap = 'round'; c.strokeStyle = '#1a140c'; c.lineWidth = 4; c.stroke(sw); c.strokeStyle = '#7a6a54'; c.lineWidth = 2; c.stroke(sw); c.lineCap = 'butt';
    c.fillStyle = '#42341f'; c.beginPath(); c.ellipse(x, y + 3, 36, 3.5, 0, 0, TAU); c.fill();
  };
  const drawFungus = (c, Z, x, y, sd, n) => {
    blot(c, x, y, 70, '170,90,210', .16);
    const st = new Path2D(), c1 = new Path2D(), c2 = new Path2D(), sp = new Path2D();
    for (let i = 0; i < n; i++) {
      const fx = x + (Z.hash(sd + i, 5) - .5) * 44, fy = y + (Z.hash(5, sd + i) - .5) * 18, h = 5 + Z.hash(i, sd) * 9, r = 3.5 + Z.hash(sd, i) * 5;
      st.rect(fx - 1.2, fy - h, 2.4, h);
      const cp = i % 2 ? c1 : c2; cp.moveTo(fx + r, fy - h); cp.ellipse(fx, fy - h, r, r * .62, 0, Math.PI, TAU); cp.closePath();
      sp.rect(fx - r * .4, fy - h - r * .35, 1.4, 1.2); sp.rect(fx + r * .25, fy - h - r * .25, 1.2, 1.1);
    }
    c.fillStyle = '#cbbcae'; c.fill(st);
    c.strokeStyle = '#1e1020'; c.lineWidth = 1.2; c.stroke(c1); c.stroke(c2);
    c.fillStyle = '#7e3f92'; c.fill(c1); c.fillStyle = '#9a52b0'; c.fill(c2);
    c.fillStyle = '#ecc8f8'; c.fill(sp);
  };
  const islandPath = (p, Z, I, sc, dy) => {
    const n = 14, P = [];
    for (let i = 0; i < n; i++) { const a = i / n * TAU, rr = I.r * sc * (.8 + Z.hash(I.sd + i, i * 7 - I.sd) * .32); P.push([I.x + Math.cos(a) * rr, I.y + dy + Math.sin(a) * rr * .62]); }
    const m = (i, j) => [(P[i][0] + P[j][0]) / 2, (P[i][1] + P[j][1]) / 2];
    const s0 = m(n - 1, 0); p.moveTo(s0[0], s0[1]);
    for (let i = 0; i < n; i++) { const q = m(i, (i + 1) % n); p.quadraticCurveTo(P[i][0], P[i][1], q[0], q[1]); }
    p.closePath();
  };

  // ---------- Ground (cached per chunk): toxic water, scum, mud islands, pools, boardwalks, stilt shanties ----------
  const ground = (Z, x0, y0, x1, y1) => {
    const c = Z.ctx;
    c.save();
    c.fillStyle = '#2a3017'; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    // deep / sickly / sludge regions
    const G = 260;
    for (let gy = Math.floor(y0 / G) - 1; gy <= Math.floor(y1 / G); gy++) for (let gx = Math.floor(x0 / G) - 1; gx <= Math.floor(x1 / G); gx++) {
      const h = Z.hash(gx * 19 - 4, gy * 23 + 6), x = gx * G + Z.hash(gx, gy * 5) * G, y = gy * G + Z.hash(gx * 5, gy) * G;
      if (h < .35) blot(c, x, y, 140 + h * 300, '14,16,6', .45);
      else if (h < .55) blot(c, x, y, 120 + h * 160, '98,112,36', .2);
      else if (h < .68) blot(c, x, y, 90 + h * 120, '34,26,12', .4);
    }
    // floating scum, algae specks
    const sc = [new Path2D(), new Path2D()], spk = new Path2D(), alg = new Path2D(), SG = 44;
    for (let gy = Math.floor(y0 / SG) - 1; gy <= Math.ceil(y1 / SG); gy++) for (let gx = Math.floor(x0 / SG) - 1; gx <= Math.ceil(x1 / SG); gx++) {
      const h = Z.hash(gx * 5 - 2, gy * 7 + 3), h2 = Z.hash(gx * 3 + 1, gy * 11 - 4), x = gx * SG + h2 * SG, y = gy * SG + h * SG;
      const n = vnoise(Z, x, y, 260, 5);
      if (n > .5 && h < (n - .5) * 3.4) { const rx = 8 + h2 * 20; sc[(h2 * 1.99) | 0].moveTo(x + rx, y); sc[(h2 * 1.99) | 0].ellipse(x, y, rx, rx * .45, 0, 0, TAU); spk.rect(x - rx * .3, y - 1, 2.2, 1.6); spk.rect(x + rx * .4, y + 1, 1.6, 1.4); }
      if (h2 > .8) for (let k = 0; k < 3; k++) alg.rect(x + (Z.hash(gx + k, gy) - .5) * 30, y + (Z.hash(gx, gy + k) - .5) * 14, 2.4, 1.6);
    }
    c.fillStyle = 'rgba(86,100,32,.5)'; c.fill(sc[0]); c.fillStyle = 'rgba(112,126,40,.4)'; c.fill(sc[1]);
    c.fillStyle = 'rgba(160,176,70,.5)'; c.fill(spk); c.fillStyle = '#1e2810'; c.fill(alg);
    // mud islands (bases batched), then their props back to front
    const isl = [], pad = 260;
    for (let gy = Math.floor((y0 - pad) / IG); gy <= Math.floor((y1 + pad) / IG); gy++) for (let gx = Math.floor((x0 - pad) / IG); gx <= Math.floor((x1 + pad) / IG); gx++) {
      const I = island(Z, gx, gy); if (I && I.x > x0 - pad && I.x < x1 + pad && I.y > y0 - pad && I.y < y1 + pad) isl.push(I);
    }
    isl.sort((a, b) => a.y - b.y);
    const rim = new Path2D(), mud = new Path2D(), top = new Path2D(), lip = new Path2D(), pud = new Path2D(), clod = new Path2D(), reed = new Path2D(), cat = new Path2D();
    for (const I of isl) {
      islandPath(rim, Z, I, 1.16, 3); islandPath(lip, Z, I, 1.06, 1); islandPath(mud, Z, I, 1, 0); islandPath(top, Z, I, .66, -4);
      for (let k = 0; k < 4; k++) { const a = Z.hash(I.sd, k * 7) * TAU, d = Z.hash(k * 7, I.sd) * I.r * .6, px = I.x + Math.cos(a) * d, py = I.y + Math.sin(a) * d * .55, rr = 5 + Z.hash(k, I.sd) * 10; pud.moveTo(px + rr, py); pud.ellipse(px, py, rr, rr * .4, 0, 0, TAU); }
      for (let k = 0; k < 7; k++) clod.rect(I.x + (Z.hash(I.sd + k, 3) - .5) * I.r * 1.3, I.y + (Z.hash(3, I.sd + k) - .5) * I.r * .7, 3, 2);
      for (let k = 0; k < 9; k++) {
        if (Z.hash(I.sd * 3 + k, 13) > .62) continue;
        const a = k / 9 * TAU + Z.hash(k, I.sd * 5) * .4, px = I.x + Math.cos(a) * I.r * .92, py = I.y + Math.sin(a) * I.r * .57;
        for (let j = 0; j < 4; j++) { const dx = (j - 1.5) * 3 + (Z.hash(k, j + I.sd) - .5) * 4, ht = 10 + Z.hash(j, k + I.sd) * 14; reed.moveTo(px + j * 2 - 3, py); reed.lineTo(px + j * 2 - 3 + dx, py - ht); if (j === 1) cat.rect(px + j * 2 - 4 + dx, py - ht - 1, 2.6, 6); }
      }
    }
    c.fillStyle = 'rgba(16,14,6,.5)'; c.fill(rim);
    c.strokeStyle = 'rgba(130,150,56,.3)'; c.lineWidth = 2; c.stroke(lip);
    c.fillStyle = '#4a3b25'; c.fill(mud); c.strokeStyle = '#2c2214'; c.lineWidth = 2.4; c.stroke(mud);
    c.fillStyle = '#55452c'; c.fill(top);
    c.fillStyle = '#33281a'; c.fill(pud); c.fillStyle = '#6a5636'; c.fill(clod);
    for (const I of isl) {
      if (I.k < .24 && I.r > 80) drawStump(c, Z, I.x, I.y + 6, I.r / 95, I.sd);
      else if (I.k < .42) drawBones(c, I.x, I.y);
      else if (I.k < .54) drawArmour(c, I.x, I.y);
      else if (I.k < .76) drawFungus(c, Z, I.x, I.y, I.sd, 6 + ((I.k * 20) | 0) % 4);
    }
    c.lineCap = 'round'; c.strokeStyle = '#6a7234'; c.lineWidth = 1.4; c.stroke(reed); c.lineCap = 'butt';
    c.fillStyle = '#4a2e1a'; c.fill(cat);
    // glowing toxic pools
    for (let gy = Math.floor((y0 - 120) / PG); gy <= Math.floor((y1 + 120) / PG); gy++) for (let gx = Math.floor((x0 - 120) / PG); gx <= Math.floor((x1 + 120) / PG); gx++) {
      const p = pool(Z, gx, gy); if (!p) continue;
      blot(c, p.x, p.y, p.r * 2.6, '120,210,40', .3);
      c.fillStyle = '#2e3010'; c.beginPath(); c.ellipse(p.x, p.y + 2, p.r * 1.12, p.r * .62, 0, 0, TAU); c.fill();
      c.fillStyle = '#6f9a26'; c.beginPath(); c.ellipse(p.x, p.y, p.r, p.r * .52, 0, 0, TAU); c.fill();
      c.fillStyle = '#8fc432'; c.beginPath(); c.ellipse(p.x - p.r * .1, p.y - p.r * .05, p.r * .66, p.r * .32, 0, 0, TAU); c.fill();
      c.fillStyle = '#b8e060'; c.beginPath(); c.ellipse(p.x - p.r * .2, p.y - p.r * .1, p.r * .25, p.r * .1, 0, 0, TAU); c.fill();
      const fm = new Path2D(); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + Z.hash(k, p.sd), rr = 1.2 + Z.hash(p.sd, k) * 2; fm.moveTo(p.x + Math.cos(a) * p.r * .96 + rr, p.y + Math.sin(a) * p.r * .5); fm.arc(p.x + Math.cos(a) * p.r * .96, p.y + Math.sin(a) * p.r * .5, rr, 0, TAU); }
      c.fillStyle = 'rgba(214,236,140,.7)'; c.fill(fm);
    }
    // lily pads and floating logs on open water
    const ly = [new Path2D(), new Path2D()], vn = new Path2D(), flw = new Path2D(), LG = 90;
    for (let gy = Math.floor(y0 / LG) - 1; gy <= Math.ceil(y1 / LG); gy++) for (let gx = Math.floor(x0 / LG) - 1; gx <= Math.ceil(x1 / LG); gx++) {
      const h = Z.hash(gx * 13 + 5, gy * 7 - 1); if (h > .12) continue;
      const cx = gx * LG + Z.hash(gx, gy * 7) * LG, cy = gy * LG + Z.hash(gx * 7, gy) * LG;
      if (onLand(Z, cx, cy)) continue;
      const n = 2 + ((h * 30) | 0) % 3;
      for (let k = 0; k < n; k++) {
        const px = cx + (Z.hash(gx + k, gy * 3) - .5) * 40, py = cy + (Z.hash(gx * 3, gy + k) - .5) * 20, r = 6 + Z.hash(k, gx + gy) * 7, a = Z.hash(gx - k, gy) * TAU;
        const P = ly[k % 2]; P.moveTo(px, py); P.ellipse(px, py, r, r * .6, 0, a + .35, a + TAU - .2); P.closePath();
        vn.moveTo(px, py); vn.lineTo(px + Math.cos(a + 2) * r * .8, py + Math.sin(a + 2) * r * .5);
        if (h < .02 && k === 0) { flw.moveTo(px + 3, py - 2); flw.arc(px, py - 2, 3, 0, TAU); }
      }
    }
    c.fillStyle = '#3f5a26'; c.fill(ly[0]); c.fillStyle = '#4c6a2c'; c.fill(ly[1]);
    c.strokeStyle = '#2c4018'; c.lineWidth = 1; c.stroke(ly[0]); c.stroke(ly[1]); c.stroke(vn);
    c.fillStyle = '#d8c0dc'; c.fill(flw);
    for (let gy = Math.floor(y0 / 300); gy <= Math.floor(y1 / 300); gy++) for (let gx = Math.floor(x0 / 300); gx <= Math.floor(x1 / 300); gx++) {
      if (Z.hash(gx * 41 + 3, gy * 37 - 2) > .07) continue;
      const x = gx * 300 + 60 + Z.hash(gx, gy * 9) * 180, y = gy * 300 + 60 + Z.hash(gx * 9, gy) * 180;
      if (onLand(Z, x, y)) continue;
      c.save(); c.translate(x, y); c.rotate((Z.hash(gx, gy) - .5) * 1.2);
      c.fillStyle = 'rgba(12,12,4,.4)'; c.fillRect(-36, 2, 74, 9);
      c.fillStyle = '#3e2e1c'; c.fillRect(-38, -6, 76, 11); c.strokeStyle = '#1a120a'; c.lineWidth = 1.4; c.strokeRect(-38, -6, 76, 11);
      c.fillStyle = '#56622a'; c.fillRect(-20, -6, 24, 3);
      c.fillStyle = '#5a4630'; c.beginPath(); c.ellipse(38, -.5, 3, 5.5, 0, 0, TAU); c.fill(); c.stroke();
      c.restore();
    }
    // boardwalks, then shanty platforms, then huts and props
    const B = newB(), hubs = [], els = [];
    const mx0 = Math.floor(x0 / MG) - 1, mx1 = Math.floor(x1 / MG) + 1, my0 = Math.floor(y0 / MG) - 1, my1 = Math.floor(y1 / MG) + 1;
    for (let my = my0; my <= my1; my++) for (let mx = mx0; mx <= mx1; mx++) {
      const L = links(Z, mx, my);
      for (const s of L.s) { if (s[1] === s[3]) deckH(B, Z, s[0], s[2], s[1], s[4], x0, x1); else deckV(B, Z, s[0], s[1], s[3], s[4], y0, y1); }
      for (const e of L.el) if (e.x > x0 - 60 && e.x < x1 + 60 && e.y > y0 - 60 && e.y < y1 + 90) els.push(e);
      const p = hub(Z, mx, my);
      if (p.x + p.w / 2 > x0 - 40 && p.x - p.w / 2 < x1 + 40 && p.y + p.d / 2 + 30 > y0 && p.y - p.d / 2 - 100 < y1) hubs.push(p);
    }
    flushB(c, B);
    for (const e of els) { // lantern posts at boardwalk corners
      c.fillStyle = '#2e2014'; c.fillRect(e.x - 2, e.y - 34, 4, 36); c.fillRect(e.x - 2, e.y - 34, 10, 3);
      c.strokeStyle = '#1a1208'; c.lineWidth = 1; c.strokeRect(e.x - 2, e.y - 34, 4, 36);
      cage(c, e.x + 6, e.y - 26);
    }
    hubs.sort((a, b) => a.y - b.y);
    const B2 = newB();
    for (const p of hubs) platB(B2, Z, p);
    flushB(c, B2);
    for (const p of hubs) { c.save(); if (p.hut) drawHut(c, Z, p); else drawCamp(c, Z, p); c.restore(); }
    c.restore();
  };

  // ---------- Under (every frame, before foes): ripples, bubbling pools, mist banks, clouds, telegraphs ----------
  const under = Z => {
    const c = Z.ctx, t = Z.now, P = Z.P, hw = Z.W / 2 + 80, hh = Z.H / 2 + 80;
    c.save();
    // slow water ripples
    const rp = [new Path2D(), new Path2D(), new Path2D()];
    for (let gy = Math.floor((P.y - hh) / 170); gy <= Math.floor((P.y + hh) / 170); gy++) for (let gx = Math.floor((P.x - hw) / 170); gx <= Math.floor((P.x + hw) / 170); gx++) {
      const q = ripple(Z, gx, gy); if (!q) continue;
      const ph = ((t + q.off) % q.per) / q.per, r = 3 + ph * 28, b = ph < .33 ? 0 : ph < .66 ? 1 : 2;
      rp[b].moveTo(q.x + r, q.y); rp[b].ellipse(q.x, q.y, r, r * .42, 0, 0, TAU);
      if (ph < .6) { const r2 = r * .55; rp[b].moveTo(q.x + r2, q.y); rp[b].ellipse(q.x, q.y, r2, r2 * .42, 0, 0, TAU); }
    }
    c.lineWidth = 1.1; c.strokeStyle = '#b4c470';
    c.globalAlpha = .3; c.stroke(rp[0]); c.globalAlpha = .18; c.stroke(rp[1]); c.globalAlpha = .08; c.stroke(rp[2]);
    c.globalAlpha = 1;
    // bubbling toxic pools: bubbles swell, rise and pop
    const bub = new Path2D(), bhl = new Path2D(), pop = new Path2D();
    for (let gy = Math.floor((P.y - hh) / PG); gy <= Math.floor((P.y + hh) / PG) + 1; gy++) for (let gx = Math.floor((P.x - hw) / PG); gx <= Math.floor((P.x + hw) / PG) + 1; gx++) {
      const p = pool(Z, gx, gy); if (!p || Math.abs(p.x - P.x) > hw + p.r || Math.abs(p.y - P.y) > hh + p.r) continue;
      Z.glow('130,230,50', p.r * 1.7, p.x, p.y, .1 + .05 * Math.sin(t * 1.7 + p.sd));
      for (let k = 0; k < 5; k++) {
        const per = 1.2 + k * .37 + Z.hash(k, p.sd) * .6, ph = (((t + k * .71 + p.sd) % per + per) % per) / per;
        const bx = p.x + (Z.hash(k * 3, p.sd) - .5) * p.r * 1.3, by = p.y + (Z.hash(p.sd, k * 3) - .5) * p.r * .6;
        if (ph < .82) { const r = 1.2 + ph * 4.5; bub.moveTo(bx + r, by - ph * 5); bub.arc(bx, by - ph * 5, r, 0, TAU); bhl.rect(bx - r * .45, by - ph * 5 - r * .55, 1.3, 1.3); }
        else { const r = 5 + (ph - .82) * 70; pop.moveTo(bx + r, by - 4); pop.ellipse(bx, by - 4, r, r * .45, 0, 0, TAU); }
      }
    }
    c.fillStyle = 'rgba(190,236,110,.62)'; c.fill(bub); c.strokeStyle = 'rgba(40,60,10,.6)'; c.lineWidth = .8; c.stroke(bub);
    c.fillStyle = '#f2ffd0'; c.fill(bhl);
    c.strokeStyle = 'rgba(200,245,120,.55)'; c.lineWidth = 1; c.stroke(pop);
    // poison mist banks drifting low over the water
    const mist = new Path2D(), MB = 640;
    for (let gy = Math.floor((P.y - hh) / MB); gy <= Math.floor((P.y + hh) / MB); gy++) for (let gx = Math.floor((P.x - hw) / MB); gx <= Math.floor((P.x + hw) / MB); gx++) {
      const h = Z.hash(gx * 9 + 2, gy * 15 - 7); if (h > .65) continue;
      const x = gx * MB + MB / 2 + Math.sin(t * .07 + h * 9) * 160, y = gy * MB + MB / 2 + Math.cos(t * .05 + h * 5) * 50;
      for (let k = 0; k < 3; k++) { const ex = x + (k - 1) * 110 + Math.sin(t * .2 + k + h) * 20, ey = y + (k % 2) * 30 - 10, rx = 120 + k * 20; mist.moveTo(ex + rx, ey); mist.ellipse(ex, ey, rx, 32, 0, 0, TAU); }
    }
    c.fillStyle = 'rgba(150,180,80,.05)'; c.fill(mist);
    // lingering poison clouds
    const cp = new Path2D();
    for (let i = clouds.length - 1; i >= 0; i--) {
      const q = clouds[i], age = t - q.t0;
      if (age > q.dur || age < -12) { clouds.splice(i, 1); continue; }
      if (age < 0 || Math.abs(q.x - P.x) > hw + 80 || Math.abs(q.y - P.y) > hh + 80) continue;
      const k = age / q.dur, a = Math.min(1, age * 4) * (1 - k);
      Z.glow('130,220,50', q.r * (1.3 + k * .5), q.x, q.y, .3 * a);
      for (let j = 0; j < 4; j++) { const an = q.sd + j * 1.6 + age * .5, rr = q.r * (.35 + .1 * j) * (1 + k * .4), px = q.x + Math.cos(an) * q.r * .4, py = q.y + Math.sin(an) * q.r * .25 - age * 6; cp.moveTo(px + rr, py); cp.ellipse(px, py, rr, rr * .6, 0, 0, TAU); }
    }
    c.fillStyle = 'rgba(156,210,64,.16)'; c.fill(cp);
    // telegraphs: dart aim lines, mosquito dive lines, the witch's spit fan
    const fs = Z.foes(), lines = new Path2D(), lock = new Path2D(), dive = new Path2D();
    let n = 0;
    for (let i = 0; i < fs.length; i++) {
      const e = fs[i];
      if (e.kind === 'sniper' && e.aim > 0 && n < 16) {
        n++; const dst = e.aim <= .3 ? lock : lines;
        dst.moveTo(e.x, e.y - 6); dst.lineTo(e.x + Math.cos(e.aa) * 340, e.y - 6 + Math.sin(e.aa) * 340);
      } else if (e.kind === 'mosq' && e.cr > 0 && n < 30) {
        n++; dive.moveTo(e.x, e.y); dive.lineTo(e.x + Math.cos(e.da) * 120, e.y + Math.sin(e.da) * 120);
      } else if (e.boss) bossTele(c, Z, e);
    }
    c.lineWidth = 1.2; c.strokeStyle = 'rgba(190,255,110,.35)'; c.stroke(lines);
    c.lineWidth = 2; c.strokeStyle = 'rgba(160,255,60,.8)'; c.stroke(lock);
    c.lineWidth = 1.4; c.strokeStyle = 'rgba(255,120,90,.45)'; c.stroke(dive);
    c.restore();
  };

  // ---------- Ambient (after darkness): lanterns, insect swarms, spores, pool glints, fungus glow ----------
  const ambient = Z => {
    const c = Z.ctx, P = Z.P, t = Z.now, hw = Z.W / 2 + 120, hh = Z.H / 2 + 140;
    c.save();
    const fl = new Path2D();
    let n = 0;
    const lamp = (x, y, ph) => {
      if (Math.abs(x - P.x) > hw || Math.abs(y - P.y) > hh || n > 24) return;
      n++; const f = Math.sin(t * 7 + ph) * .5 + Math.sin(t * 17 + ph * 2) * .3;
      Z.glow('220,235,120', 95 + f * 6, x, y, .2 + f * .03); Z.glow('250,250,190', 14, x, y, .75);
      fl.rect(x - 1.5, y - 3 + f, 3, 4);
    };
    for (let my = Math.floor((P.y - hh) / MG) - 1; my <= Math.floor((P.y + hh) / MG) + 1; my++) for (let mx = Math.floor((P.x - hw) / MG) - 1; mx <= Math.floor((P.x + hw) / MG) + 1; mx++) {
      const p = hub(Z, mx, my); lamp(p.lx, p.ly, p.sd);
      if (!p.hut && Math.abs(p.cx2 - P.x) < hw && Math.abs(p.cy2 - P.y) < hh) Z.glow('140,240,60', 40 + Math.sin(t * 3 + p.sd) * 4, p.cx2, p.cy2, .4);
      for (const e of links(Z, mx, my).el) lamp(e.x + 6, e.y - 26, e.x * .01);
    }
    c.fillStyle = '#f4f8c0'; c.fill(fl);
    // pool bubble pops glint green
    for (let gy = Math.floor((P.y - hh) / PG); gy <= Math.floor((P.y + hh) / PG) + 1; gy++) for (let gx = Math.floor((P.x - hw) / PG); gx <= Math.floor((P.x + hw) / PG) + 1; gx++) {
      const p = pool(Z, gx, gy); if (!p) continue;
      const per = 1.2 + Z.hash(0, p.sd) * .6, ph = (((t + p.sd) % per + per) % per) / per;
      if (ph > .8) Z.glow('180,255,90', 16, p.x + (Z.hash(0, p.sd) - .5) * p.r * 1.3, p.y + (Z.hash(p.sd, 0) - .5) * p.r * .6 - 4, .7 * (1 - (ph - .8) * 5));
    }
    // fungus clusters breathe a violet light
    let fg = 0;
    for (let gy = Math.floor((P.y - hh) / IG); gy <= Math.floor((P.y + hh) / IG); gy++) for (let gx = Math.floor((P.x - hw) / IG); gx <= Math.floor((P.x + hw) / IG); gx++) {
      const I = island(Z, gx, gy); if (!I || fg > 14) continue;
      if (I.k >= .54 && I.k < .76) { fg++; Z.glow('190,110,240', 34, I.x, I.y - 8, .22 + .08 * Math.sin(t * 1.3 + I.sd)); }
      else if (I.k < .24 && I.r > 80) { fg++; Z.glow('190,110,240', 22, I.x - 14 * I.r / 95, I.y - 20 * I.r / 95, .2); }
    }
    // swarms of glowing swamp insects hovering over fixed spots
    const sw = new Path2D(), SG = 520;
    for (let gy = Math.floor((P.y - hh) / SG); gy <= Math.floor((P.y + hh) / SG); gy++) for (let gx = Math.floor((P.x - hw) / SG); gx <= Math.floor((P.x + hw) / SG); gx++) {
      const h = Z.hash(gx * 29 + 5, gy * 31 - 8); if (h > .5) continue;
      const cx = gx * SG + 80 + Z.hash(gx, gy * 3) * 360 + Math.sin(t * .3 + h * 9) * 30, cy = gy * SG + 80 + Z.hash(gx * 3, gy) * 360 + Math.cos(t * .23 + h * 7) * 16;
      Z.glow('200,240,90', 46, cx, cy - 18, .1);
      for (let j = 0; j < 14; j++) { const a = t * (1.6 + j * .17) + j * 2.1; sw.rect(cx + Math.sin(a) * (12 + (j % 4) * 7), cy - 20 + Math.cos(a * 1.3) * (7 + (j % 3) * 5), 1.7, 1.7); }
    }
    c.globalAlpha = .85; c.fillStyle = '#e6ff90'; c.fill(sw);
    // drifting toxic spores
    const sp = new Path2D(), sv = new Path2D();
    for (let i = 0; i < 70; i++) {
      const a = Z.hash(i, 5), b = Z.hash(i, 11), spd = 6 + b * 12, span = Z.H + 120, swd = Z.W + 160;
      const yy = P.y + Z.H / 2 + 60 - ((t * spd + b * span) % span), xx = P.x - swd / 2 + ((a * swd + Math.sin(t * .6 + i) * 16 + t * 5) % swd);
      (i % 6 ? sp : sv).rect(xx, yy, 1.4 + (i % 3) * .6, 1.4 + (i % 3) * .6);
    }
    c.globalAlpha = .5; c.fillStyle = '#d0ec80'; c.fill(sp); c.fillStyle = '#d6a8f0'; c.fill(sv);
    c.restore();
  };

  // ---------- Foes ----------
  // Swamp hollow: gaunt mud-caked drowned dead with a rusty cleaver. Shambles, winds up, lunges.
  const hollow = {
    hp: 16, sp: 58, dmg: 8, xp: 1, r: 11, eye: false,
    init(e, Z) { e.cd = Z.rnd(.8, 2.5); e.ws = 0; e.lu = 0; e.rc = 0; e.la = 0; e.rise = e.rise || 0; },
    update(e, Z) {
      const dt = Z.dt;
      if (e.rise > 0) { e.rise -= dt; Z.move(e, 0, 0); return; }
      if (e.ws > 0) { e.ws -= dt; Z.move(e, 0, 0); e.ang = e.la; if (e.ws <= 0) e.lu = .24; return; }
      if (e.lu > 0) { e.lu -= dt; Z.move(e, Math.cos(e.la) * 270, Math.sin(e.la) * 270); e.ang = e.la; if (e.lu <= 0) e.rc = .45; return; }
      if (e.rc > 0) { e.rc -= dt; Z.move(e, 0, 0); return; }
      e.cd -= dt;
      Z.chase(e, e.sp * (.5 + .75 * Math.max(0, Math.sin(e.ph * 3.2 + e.seed))));
      if (e.cd <= 0 && Z.dist(e) < 88) { e.ws = .5; e.la = Z.angTo(e); e.cd = Z.rnd(2.2, 3.2); }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 11, O = W(white, OUT), st = Math.sin(e.ph * 6.4 + e.seed), wind = e.ws > 0, lunge = e.lu > 0;
      c.save(); c.translate(e.x, e.y);
      if (e.rise > 0) { const k = clamp(1 - e.rise / .9, 0, 1); c.globalAlpha = .35 + .65 * k; c.translate(0, (1 - k) * 8 * s); c.scale(1, .3 + .7 * k); }
      face(c, e); c.rotate(lunge ? .32 : wind ? -.16 : .12 + st * .05);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const lg = new Path2D(); lg.moveTo(-2.5 * s, 4 * s); lg.lineTo(-3 * s + st * 3 * s, 11 * s); lg.moveTo(2 * s, 4 * s); lg.lineTo(2.5 * s - st * 3 * s, 11 * s);
      c.strokeStyle = O; c.lineWidth = 4.6 * s; c.stroke(lg); c.strokeStyle = W(white, '#5a4228'); c.lineWidth = 2.8 * s; c.stroke(lg);
      // hunched, sickly pale torso
      const bd = pl(new Path2D(), [[-5 * s, 5 * s], [-5.5 * s, -3 * s], [-2.5 * s, -7.5 * s], [3.5 * s, -7 * s], [5.5 * s, -1 * s], [4.5 * s, 5 * s]]);
      c.strokeStyle = O; c.lineWidth = 2; c.stroke(bd); c.fillStyle = W(white, '#b4ae84'); c.fill(bd);
      if (!white) {
        const rb = new Path2D(); for (let k = 0; k < 3; k++) { rb.moveTo(-1 * s, (-4.5 + k * 2.2) * s); rb.lineTo(3.5 * s, (-4 + k * 2.2) * s); }
        c.strokeStyle = '#7a7450'; c.lineWidth = .9 * s; c.stroke(rb);
        // mud caked over the lower half, dripping
        const md = pl(new Path2D(), [[-5.2 * s, 5 * s], [-5.4 * s, 0], [-2 * s, 1.5 * s], [1 * s, -.5 * s], [4.9 * s, 1 * s], [4.6 * s, 5 * s], [2 * s, 8.5 * s], [.5 * s, 5.5 * s], [-2 * s, 9 * s], [-3 * s, 5.5 * s]]);
        c.fillStyle = '#5e4424'; c.fill(md);
        c.fillStyle = '#9cc03a'; c.fillRect(-4 * s, -2.5 * s, 1.6 * s, 1.4 * s); c.fillRect(2.8 * s, 2.2 * s, 1.4 * s, 1.2 * s);
      }
      // bald gaunt head with acid pinprick eyes
      const hd = new Path2D(); hd.arc(2.5 * s, -10.5 * s, 3.8 * s, 0, TAU); pl(hd, [[.5 * s, -9 * s], [5.8 * s, -9 * s], [5 * s, -6 * s], [1.5 * s, -6.2 * s]]);
      c.strokeStyle = O; c.lineWidth = 2; c.stroke(hd); c.fillStyle = W(white, '#bdb68e'); c.fill(hd);
      if (!white) {
        c.fillStyle = '#2a2014'; c.fillRect(3 * s, -11.8 * s, 3 * s, 2 * s); c.fillRect(3.4 * s, -7.6 * s, 2.2 * s, 1 * s);
        c.fillStyle = '#c8ff50'; c.fillRect(3.4 * s, -11.4 * s, 1 * s, 1 * s); c.fillRect(5.2 * s, -11.4 * s, .9 * s, .9 * s);
        c.fillStyle = '#5e4424'; c.fillRect(-1 * s, -14 * s, 4 * s, 1.6 * s);
      }
      // rusty cleaver
      const ra = wind ? -2.3 : lunge ? .5 : -.5 + st * .15;
      c.save(); c.translate(3 * s, -4 * s); c.rotate(ra);
      const am = new Path2D(); am.moveTo(0, 0); am.lineTo(6 * s, 0);
      c.strokeStyle = O; c.lineWidth = 3.6 * s; c.stroke(am); c.strokeStyle = W(white, '#b0aa80'); c.lineWidth = 2 * s; c.stroke(am);
      const bl = pl(new Path2D(), [[6.5 * s, -1.6 * s], [16 * s, -3 * s], [17 * s, 4.5 * s], [7.5 * s, 3.2 * s]]);
      c.strokeStyle = O; c.lineWidth = 1.8; c.stroke(bl); c.fillStyle = W(white, '#b85c2c'); c.fill(bl);
      if (!white) {
        c.strokeStyle = '#ecdcc0'; c.lineWidth = 1.2 * s; c.beginPath(); c.moveTo(8 * s, 3.3 * s); c.lineTo(16.8 * s, 4.4 * s); c.stroke();
        c.fillStyle = '#3a2010'; c.fillRect(13 * s, -1.6 * s, 1.8 * s, 1.8 * s);
        if (wind) { c.fillStyle = '#fff'; c.fillRect(15.5 * s, 3 * s, 1.6 * s, 1.4 * s); }
      }
      c.restore();
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#8a7a50', 8, 80); },
  };

  // Blowdart sniper: crouched hooded swamp-dweller. Keeps its distance, aims (line on the ground), spits a poison dart.
  const sniper = {
    hp: 30, sp: 50, dmg: 6, xp: 3, r: 11, eye: false,
    init(e, Z) { e.cd = Z.rnd(1.5, 3); e.aim = 0; e.aa = 0; e.side = e.seed > 3 ? 1 : -1; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e), a = Z.angTo(e);
      if (e.aim > 0) {
        e.aim -= dt; Z.move(e, 0, 0);
        if (e.aim > .3) e.aa = a;
        e.ang = e.aa;
        if (e.aim <= 0) { Z.shoot(e.x + Math.cos(e.aa) * 16, e.y - 6 + Math.sin(e.aa) * 16, e.aa, 245, { r: 5, dmg: 8, life: 3, col: ACID, slow: true }); Z.sfx('shoot'); }
        return;
      }
      const k = d > 340 ? 1 : d < 220 ? -.85 : 0, sa = a + (k === 0 ? Math.PI / 2 * e.side : 0), m = k === 0 ? .45 : k;
      Z.move(e, Math.cos(sa) * e.sp * m, Math.sin(sa) * e.sp * m); e.ang = a;
      if ((e.cd -= dt) <= 0 && d < 540) { e.cd = Z.rnd(3, 3.8); e.aim = .9; e.aa = a; }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 11, O = W(white, OUT), aim = e.aim > 0, bob = Math.sin(e.ph * 5 + e.seed) * .7 * s;
      c.save(); c.translate(e.x, e.y + bob); face(c, e);
      c.lineCap = 'round'; c.lineJoin = 'round';
      // tucked legs
      const lg = new Path2D(); lg.moveTo(-5 * s, 5 * s); lg.lineTo(-7 * s, 9 * s); lg.lineTo(-3 * s, 9.5 * s); lg.moveTo(4 * s, 5 * s); lg.lineTo(7 * s, 9.5 * s);
      c.strokeStyle = O; c.lineWidth = 3.4 * s; c.stroke(lg); c.strokeStyle = W(white, '#4a3424'); c.lineWidth = 1.8 * s; c.stroke(lg);
      // fringed straw mantle
      const mt = new Path2D(); mt.moveTo(-10 * s, 6 * s); mt.quadraticCurveTo(-11 * s, -6 * s, -3 * s, -9 * s); mt.lineTo(5 * s, -9 * s); mt.quadraticCurveTo(10 * s, -4 * s, 10 * s, 6 * s);
      for (let i = 1; i <= 6; i++) mt.lineTo(10 * s - i * 20 * s / 6, 6 * s + (i % 2 ? 3.5 * s : 0));
      mt.closePath();
      c.strokeStyle = O; c.lineWidth = 2; c.stroke(mt); c.fillStyle = W(white, '#b09848'); c.fill(mt);
      if (!white) {
        const sr = new Path2D(); for (let k = 0; k < 5; k++) { sr.moveTo((-7 + k * 3.6) * s, -5 * s + Math.abs(k - 2) * s); sr.lineTo((-8 + k * 4) * s, 5 * s); }
        c.strokeStyle = '#7a6630'; c.lineWidth = .9 * s; c.stroke(sr);
      }
      // purple hood with a bone mask
      const hd = new Path2D(); hd.moveTo(-5 * s, -6 * s); hd.quadraticCurveTo(-6 * s, -17 * s, 1 * s, -18 * s); hd.quadraticCurveTo(8 * s, -16 * s, 7.5 * s, -6 * s); hd.closePath();
      c.strokeStyle = O; c.lineWidth = 2; c.stroke(hd); c.fillStyle = W(white, '#7a3e88'); c.fill(hd);
      if (!white) {
        c.fillStyle = '#1a1018'; c.beginPath(); c.ellipse(3 * s, -10.5 * s, 3.6 * s, 3.6 * s, 0, 0, TAU); c.fill();
        c.fillStyle = '#e2d8bc'; c.fill(pl(new Path2D(), [[1 * s, -13 * s], [6.5 * s, -12.5 * s], [6 * s, -8 * s], [3.5 * s, -6.8 * s], [1.2 * s, -8.5 * s]]));
        c.fillStyle = aim ? '#eaff70' : '#b8e040'; c.fillRect(2.4 * s, -11.6 * s, 1.6 * s, .9 * s); c.fillRect(4.8 * s, -11.4 * s, 1.4 * s, .9 * s);
      }
      // the long reed blowgun
      const pitch = Math.atan2(Math.sin(e.aa), Math.abs(Math.cos(e.aa)) || 1e-6);
      c.save(); c.translate(5 * s, -8.5 * s); c.rotate(aim ? pitch : .65);
      const tb = new Path2D(); tb.moveTo(0, 0); tb.lineTo(24 * s, 0);
      c.strokeStyle = O; c.lineWidth = 4 * s; c.stroke(tb); c.strokeStyle = W(white, '#8c7c3c'); c.lineWidth = 2.2 * s; c.stroke(tb);
      if (!white) {
        c.fillStyle = '#3a2a14'; c.fillRect(8 * s, -1.3 * s, 1.4 * s, 2.6 * s); c.fillRect(16 * s, -1.3 * s, 1.4 * s, 2.6 * s);
        if (aim) Z.glow(ACID, 9 * s, 24 * s, 0, .45 + .45 * (1 - e.aim / .9));
      }
      c.restore();
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#7a3e88', 9, 90); },
  };

  // Giant swamp mosquito: erratic buzzing flier with a blood-swollen abdomen. Hovers, rears back, dives.
  const mosq = {
    hp: 12, sp: 120, dmg: 7, xp: 2, r: 9, eye: false,
    init(e, Z) { e.cd = Z.rnd(1, 2.6); e.cr = 0; e.ds = 0; e.rc = 0; e.da = 0; e.dir = e.seed > 3 ? 1 : -1; e.kid = e.kid || false; },
    update(e, Z) {
      const dt = Z.dt;
      if (e.lead === undefined) { // the first of a small group brings two companions
        e.lead = !e.kid;
        if (e.lead && Z.foes().length < 230) for (let i = 0; i < 2; i++) { const k = Z.spawn('mosq', e.x + Z.rnd(-36, 36), e.y + Z.rnd(-36, 36)); if (k) { k.kid = true; k.cd += .4 + i * .5; } }
      }
      if (e.cr > 0) { e.cr -= dt; Z.move(e, 0, 0); e.ang = e.da; if (e.cr <= 0) e.ds = .3; return; }
      if (e.ds > 0) { e.ds -= dt; Z.move(e, Math.cos(e.da) * 380, Math.sin(e.da) * 380); e.ang = e.da; if (e.ds <= 0) e.rc = .35; return; }
      if (e.rc > 0) { e.rc -= dt; Z.move(e, Math.cos(e.da) * 60, Math.sin(e.da) * 60); return; }
      e.cd -= dt;
      const d = Z.dist(e), a = Z.angTo(e), j = Math.sin(e.ph * 4.3 + e.seed) * .8 + Math.sin(e.ph * 9.1 + e.seed * 2) * .4;
      const w = d > 170 ? a + j * .6 : a + (Math.PI / 2 - .2) * e.dir + j, v = e.sp * (d > 170 ? 1 : .85);
      Z.move(e, Math.cos(w) * v, Math.sin(w) * v); e.ang = a;
      if (e.cd <= 0 && d < 230) { e.cr = .4; e.da = a; e.cd = Z.rnd(2.2, 3.4); }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 9, O = W(white, OUT), crouch = e.cr > 0, dash = e.ds > 0, bob = Math.sin(e.ph * 11 + e.seed) * 2 * s;
      c.save(); c.translate(e.x + (crouch ? Math.sin(Z.now * 60) * s : 0), e.y - 6 * s + bob); face(c, e);
      c.rotate(dash ? .2 : crouch ? -.3 : 0);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const lg = new Path2D();
      for (let i = 0; i < 3; i++) { const rx = (-1 + i * 2.2) * s, sw = Math.sin(e.ph * 6 + i) * 1.5 * s; lg.moveTo(rx, 1 * s); lg.lineTo(rx - 4 * s + i * 3 * s, 6 * s); lg.lineTo(rx - 6 * s + i * 5 * s + sw, 13 * s); }
      c.strokeStyle = O; c.lineWidth = 2.2 * s; c.stroke(lg); c.strokeStyle = W(white, '#5a4028'); c.lineWidth = 1 * s; c.stroke(lg);
      // blood-swollen abdomen
      const ab = new Path2D(); ab.ellipse(-8 * s, 1.5 * s, 8.5 * s, 5 * s, .35, 0, TAU);
      c.strokeStyle = O; c.lineWidth = 2; c.stroke(ab); c.fillStyle = W(white, '#cc3a28'); c.fill(ab);
      if (!white) {
        const sr = new Path2D(); for (let k = 0; k < 3; k++) { const x = (-12 + k * 3.5) * s; sr.moveTo(x - 1 * s, -2 * s + k * .6 * s); sr.lineTo(x + 1.5 * s, 5.5 * s + k * .4 * s); }
        c.strokeStyle = '#5a1810'; c.lineWidth = 1.3 * s; c.stroke(sr);
        c.fillStyle = '#ff9a7a'; c.fillRect(-9 * s, -1.5 * s, 3 * s, 1.4 * s);
      }
      // thorax and head
      const th = new Path2D(); th.ellipse(1 * s, -1 * s, 4.6 * s, 4 * s, 0, 0, TAU); th.moveTo(9 * s, -2 * s); th.arc(6.3 * s, -2 * s, 2.8 * s, 0, TAU);
      c.strokeStyle = O; c.lineWidth = 1.8; c.stroke(th); c.fillStyle = W(white, '#5a3a24'); c.fill(th);
      // long proboscis
      const L = dash ? 22 : crouch ? 18 : 16, pr = new Path2D(); pr.moveTo(8 * s, -1 * s); pr.lineTo(L * s, 2.5 * s);
      c.strokeStyle = O; c.lineWidth = 2.4 * s; c.stroke(pr); c.strokeStyle = W(white, '#e0c898'); c.lineWidth = 1 * s; c.stroke(pr);
      if (!white) {
        c.fillStyle = '#ff5a2a'; c.beginPath(); c.arc(7 * s, -3 * s, 1.9 * s, 0, TAU); c.fill();
        if (crouch) { c.fillStyle = '#fff'; c.fillRect((L - 2) * s, 1.4 * s, 2 * s, 1.6 * s); }
      }
      // whirring wings
      const fl = Math.abs(Math.sin(Z.now * 46 + e.seed)), wg = new Path2D();
      wg.ellipse(-3 * s, -6.5 * s, 9 * s, (.8 + fl * 2.8) * s, -.45, 0, TAU); wg.moveTo(-1 * s, -5 * s); wg.ellipse(-5 * s, -5 * s, 8 * s, (.6 + (1 - fl) * 2.4) * s, -.85, 0, TAU);
      c.globalAlpha = white ? 1 : .55; c.fillStyle = W(white, '#e8f4d0'); c.fill(wg);
      c.globalAlpha = 1; c.strokeStyle = W(white, '#2a3018'); c.lineWidth = .8; c.stroke(wg);
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#cc3a28', 7, 90); },
  };

  // Bloated plague maggot: slow, heavy, pustule-studded. Bursts into a lingering poison cloud.
  const maggot = {
    hp: 70, sp: 30, dmg: 12, xp: 5, r: 16, heavy: true, eye: false,
    update(e, Z) { Z.chase(e, e.sp * (.55 + .7 * Math.max(0, Math.sin(e.ph * 2.6 + e.seed)))); },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 16, O = W(white, OUT), w = e.ph * 2.6 + e.seed, near = Z.dist(e) < 90;
      const th = 1 + Math.sin(e.ph * (near ? 10 : 3)) * (near ? .06 : .03);
      c.save(); c.translate(e.x, e.y); face(c, e); c.scale(th, 2 - th);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const seg = new Path2D(), fold = new Path2D(), pu = new Path2D();
      for (let i = 0; i < 5; i++) {
        const x = (-16 + i * 8) * s + Math.sin(w - i) * 1.5 * s, ry = (i === 0 ? 6 : i === 4 ? 7.5 : 10.5 + Math.sin(w - i * .9) * 1.2) * s, rx = (i === 4 ? 7.5 : 7.8) * s, y = -ry * .8;
        seg.moveTo(x + rx, y); seg.ellipse(x, y, rx, ry, 0, 0, TAU);
        if (i > 0) { fold.moveTo(x - rx * .7, y - ry * .8); fold.quadraticCurveTo(x - rx * 1.05, y, x - rx * .7, y + ry * .8); }
        if (i > 0 && i < 4) { const pr = (1.6 + (i % 2)) * s; pu.moveTo(x + 2 * s + pr, y - ry * .45); pu.arc(x + 2 * s, y - ry * .45, pr, 0, TAU); }
      }
      c.strokeStyle = O; c.lineWidth = 2.4; c.stroke(seg); c.fillStyle = W(white, '#d8ca88'); c.fill(seg);
      if (!white) {
        c.strokeStyle = '#9a8a52'; c.lineWidth = 1.4 * s; c.stroke(fold);
        c.fillStyle = 'rgba(80,70,30,.35)'; c.fillRect(-20 * s, -2 * s, 38 * s, 3 * s);
        c.fillStyle = near ? '#d8ff60' : '#a8ff48'; c.fill(pu); c.strokeStyle = '#4a6a14'; c.lineWidth = 1; c.stroke(pu);
        // mouth and hooks
        c.fillStyle = '#3a1a10'; c.beginPath(); c.ellipse(19 * s, -5 * s, 2.4 * s, 3 * s, 0, 0, TAU); c.fill();
        c.strokeStyle = '#2a120a'; c.lineWidth = 1.4 * s; c.beginPath(); c.moveTo(20 * s, -8 * s); c.lineTo(23 * s, -6 * s); c.moveTo(20 * s, -2 * s); c.lineTo(23 * s, -4 * s); c.stroke();
        Z.glow(ACID, 10 * s, 0, -9 * s, near ? .45 : .22);
      }
      c.restore();
    },
    death(e, Z) {
      Z.burst(e.x, e.y, '#b8ff50', 14, 120); Z.burst(e.x, e.y, '#e2d6a0', 8, 80);
      Z.hazard(e.x, e.y, { r: 60, t: .85, dmg: 8, col: ACID });
      Z.hazard(e.x, e.y, { r: 48, t: 2.1, dmg: 6, col: '190,230,70' });
      addCloud(Z, e.x, e.y, 0, 3.2, 60);
    },
  };

  // ---------- Miniboss: Mother Selvaine, the Mire-Witch ----------
  const PATTERN = ['spit', 'rain', 'burst', 'summon', 'spit', 'burst', 'rain', 'spit', 'summon', 'rain'];
  const mouth = e => { const s = e.r / 50, f = Math.cos(e.ang) < 0 ? -1 : 1; return [e.x + f * 18 * s, e.y - 84 * s]; };
  const start = (e, Z, p) => {
    const enr = e.enr, d = Z.dist(e);
    if (p === 'summon' && d < 170) p = 'stomp';
    if (p === 'spit') { e.st = 'spitW'; e.mt = e.mx = enr ? .75 : .95; e.ba = Z.angTo(e); e.ang = e.ba; Z.sfx('charge'); }
    else if (p === 'rain') { e.st = 'rainW'; e.mt = e.mx = .7; Z.sfx('warn'); }
    else if (p === 'burst') {
      e.st = 'burstW'; e.mt = e.mx = 1; Z.sfx('warn');
      const rings = enr ? 3 : 2;
      for (let i = 0; i < rings; i++) {
        const R = 100 + i * 100, n = 7 + i * 3, off = e.ph + i * .5;
        for (let k = 0; k < n; k++) { const a = off + k / n * TAU; Z.hazard(e.x + Math.cos(a) * R, e.y + Math.sin(a) * R, { r: 46, t: 1 + i * .45, dmg: 14, col: ACID }); }
      }
    } else if (p === 'stomp') { e.st = 'stompW'; e.mt = e.mx = .8; Z.sfx('warn'); Z.hazard(e.x, e.y, { r: 165, t: .8, dmg: 18, col: '200,240,80' }); }
    else { e.st = 'summonW'; e.mt = e.mx = 1; Z.sfx('boss'); Z.shake(5); }
  };
  const rest = (e, t) => { e.st = 'rec'; e.mt = e.mx = e.enr ? t * .65 : t; };
  const boss = {
    name: 'Mother Selvaine, the Mire-Witch', hp: 4000, sp: 50, dmg: 24, xp: 0, r: 50, heavy: true, eye: false,
    init(e) { e.st = 'move'; e.aw = 2.2; e.mt = 0; e.mx = 1; e.pi = 0; e.enr = false; e.ba = 0; e.bt = 0; e.vol = 0; e.rn = 0; e.hug = 0; e.stride = 1; },
    update(e, Z) {
      const dt = Z.dt;
      if (!e.enr && e.hp < e.max * .4) {
        e.enr = true; Z.banner('The Mire-Witch shrieks in fury', '#b8ff50', true); Z.shake(10); Z.sfx('boss');
        Z.ring(e.x, e.y, 14, 120, { r: 7, dmg: 9, col: ACID, slow: true }, e.ph);
      }
      switch (e.st) {
        case 'move': {
          const d = Z.dist(e), a = Z.angTo(e), sp = e.sp * (e.enr ? 1.3 : 1);
          if (d > 180) Z.chase(e, sp);
          else if (d < 110) { Z.move(e, -Math.cos(a) * sp * .6, -Math.sin(a) * sp * .6); e.ang = a; }
          else { const w = a + Math.PI / 2 * e.stride; Z.move(e, Math.cos(w) * sp * .5, Math.sin(w) * sp * .5); e.ang = a; }
          if (Math.sin(e.ph * .7) > .98) e.stride = -e.stride;
          e.hug = d < e.r + 45 ? e.hug + dt : 0;
          if (e.hug > 1.4) { e.hug = 0; start(e, Z, 'stomp'); break; }
          if ((e.aw -= dt) <= 0) start(e, Z, PATTERN[e.pi++ % PATTERN.length]);
          break;
        }
        case 'spitW': {
          Z.move(e, 0, 0);
          let df = Z.angTo(e) - e.ba; df = Math.atan2(Math.sin(df), Math.cos(df)); e.ba += clamp(df, -2 * dt, 2 * dt); e.ang = e.ba;
          if ((e.mt -= dt) <= 0) { e.st = 'spit'; e.vol = e.enr ? 4 : 3; e.bt = 0; e.mt = e.mx = 1.4; }
          break;
        }
        case 'spit': {
          Z.move(e, 0, 0); e.ang = e.ba; e.mt -= dt;
          if ((e.bt -= dt) <= 0 && e.vol > 0) {
            e.bt = .32; e.vol--;
            const [hx, hy] = mouth(e), n = e.enr ? 9 : 7, sp = .95, half = e.vol % 2 ? sp / (n - 1) / 2 : 0;
            for (let i = 0; i < n; i++) Z.shoot(hx, hy, e.ba + (i / (n - 1) - .5) * sp + half, 175, { r: 7, dmg: 9, life: 3.2, col: ACID, slow: true });
            Z.sfx('shoot');
            let df = Z.angTo(e) - e.ba; df = Math.atan2(Math.sin(df), Math.cos(df)); e.ba += clamp(df, -.25, .25);
          }
          if (e.vol <= 0 && e.bt <= 0) rest(e, .9);
          break;
        }
        case 'rainW':
          Z.move(e, 0, 0); e.ang = Z.angTo(e);
          if ((e.mt -= dt) <= 0) { e.st = 'rain'; e.rn = e.enr ? 11 : 8; e.bt = 0; e.mt = e.mx = 3; }
          break;
        case 'rain':
          Z.move(e, 0, 0); e.ang = Z.angTo(e);
          if ((e.bt -= dt) <= 0 && e.rn > 0) {
            e.bt = .24; e.rn--;
            const P = Z.P, lead = e.rn % 2 ? 60 : 0, a = Z.rnd(0, TAU), j = Z.rnd(0, 40);
            Z.hazard(P.x + P.face.x * lead + Math.cos(a) * j, P.y + P.face.y * lead + Math.sin(a) * j, { r: 50, t: 1.05, dmg: 12, col: '170,235,60' });
          }
          if (e.rn <= 0 && e.bt <= 0) rest(e, .8);
          break;
        case 'burstW':
          Z.move(e, 0, 0); e.ang = Z.angTo(e);
          if ((e.mt -= dt) <= 0) { Z.shake(9); Z.sfx('nova'); Z.burst(e.x, e.y, '#b8ff50', 24, 220); e.st = 'burst'; e.mt = e.mx = e.enr ? 1.05 : .6; }
          break;
        case 'burst':
          Z.move(e, 0, 0);
          if ((e.mt -= dt) <= 0) rest(e, .7);
          break;
        case 'stompW':
          Z.move(e, 0, 0);
          if ((e.mt -= dt) <= 0) { Z.shake(8); Z.burst(e.x, e.y, '#5a4a2a', 16, 240); e.st = 'stomp'; e.mt = e.mx = .35; }
          break;
        case 'stomp':
          Z.move(e, 0, 0);
          if ((e.mt -= dt) <= 0) rest(e, .7);
          break;
        case 'summonW':
          Z.move(e, 0, 0); e.ang = Z.angTo(e);
          if ((e.mt -= dt) <= 0) {
            const crowd = Z.foes().length > 220, nm = crowd ? 2 : e.enr ? 6 : 4, ng = crowd ? 0 : e.enr ? 2 : 1;
            for (let i = 0; i < nm + ng; i++) {
              const a = i / (nm + ng) * TAU + e.ph, h = Z.spawn(i < nm ? 'mosq' : 'maggot', e.x + Math.cos(a) * 95, e.y + Math.sin(a) * 95);
              if (h) { h.kid = true; Z.burst(h.x, h.y, '#9ad040', 8, 70); }
            }
            rest(e, .6);
          }
          break;
        default:
          Z.move(e, 0, 0); e.ang = Z.angTo(e);
          if ((e.mt -= dt) <= 0) { e.st = 'move'; e.aw = e.enr ? 1.1 : 1.8; }
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 50, O = W(white, '#160c14'), st = e.st, enr = e.enr, k = clamp(1 - e.mt / (e.mx || 1), 0, 1);
      const walk = st === 'move' ? e.ph * 7 : 0, cast = st === 'rainW' || st === 'rain', spit = st === 'spitW' || st === 'spit', summ = st === 'summonW';
      const MK = enr ? '#d8ff60' : '#8cff3a', SKIN = W(white, '#d8d0c2');
      c.save(); c.translate(e.x, e.y - (st === 'stompW' ? 8 * s * k : 0)); face(c, e);
      if (summ || st === 'stompW') c.translate(Math.sin(Z.now * 40) * 1.5 * s, 0);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const legs = far => {
        const p = new Path2D();
        for (let i = 0; i < 4; i++) {
          const sw = Math.sin(walk + i * 1.7 + (far ? 1 : 0)) * 6 * s, lift = st === 'stompW' ? 12 * s * k * (i % 2) : 0;
          const rx = (-4 + i * 6) * s, fx = (-64 + i * 42) * s + sw + (far ? 10 * s : 0), fy = (far ? 26 : 40) * s - Math.max(0, sw) * .4 - lift;
          p.moveTo(rx, 2 * s); p.lineTo(rx + (fx - rx) * .55, (far ? -36 : -28) * s - Math.abs(sw) * .5 - lift); p.lineTo(fx, fy);
        }
        c.strokeStyle = O; c.lineWidth = (far ? 7 : 8.5) * s; c.stroke(p);
        c.strokeStyle = far ? W(white, '#24141e') : W(white, '#33202c'); c.lineWidth = (far ? 4.5 : 5.5) * s; c.stroke(p);
        if (!white && !far) { c.strokeStyle = '#5a3a4a'; c.lineWidth = 1.4 * s; c.stroke(p); }
      };
      legs(true);
      // the bloated abdomen
      const pulse = summ ? 1 + Math.sin(Z.now * 18) * .04 + k * .08 : st === 'burstW' ? 1 + k * .1 : 1 + Math.sin(e.ph * 2) * .02;
      c.save(); c.translate(-46 * s, -18 * s); c.scale(pulse, pulse);
      const ab = new Path2D(); ab.ellipse(0, 0, 48 * s, 38 * s, -.15, 0, TAU);
      c.strokeStyle = O; c.lineWidth = 3; c.stroke(ab); c.fillStyle = W(white, enr ? '#5a2a40' : '#4a2a3a'); c.fill(ab);
      if (!white) {
        c.fillStyle = '#331c2a'; c.beginPath(); c.ellipse(4 * s, 12 * s, 40 * s, 20 * s, -.15, 0, Math.PI); c.fill();
        const hr = new Path2D(); for (let i = 0; i < 9; i++) { const a = -2.8 + i * .3, bx = Math.cos(a) * 46 * s, by = Math.sin(a) * 36 * s; hr.moveTo(bx, by); hr.lineTo(bx * 1.12, by * 1.14); }
        c.strokeStyle = '#1a0e16'; c.lineWidth = 1.6 * s; c.stroke(hr);
        const mk = pl(new Path2D(), [[-8 * s, -28 * s], [8 * s, -28 * s], [2 * s, -14 * s], [8 * s, 0], [-8 * s, 0], [-2 * s, -14 * s]]);
        mk.moveTo(-34 * s, -6 * s); mk.lineTo(-24 * s, -14 * s); mk.lineTo(-22 * s, -10 * s); mk.closePath();
        mk.moveTo(24 * s, -16 * s); mk.lineTo(34 * s, -6 * s); mk.lineTo(30 * s, -4 * s); mk.closePath();
        c.fillStyle = MK; c.fill(mk);
        const pu = new Path2D(); for (const [px, py, pr] of [[-24, 8, 4], [18, 6, 3.4], [-12, 18, 3], [28, -24, 2.6], [-30, -22, 3]]) { pu.moveTo((px + pr) * s, py * s); pu.arc(px * s, py * s, pr * s, 0, TAU); }
        c.fillStyle = '#c8ff70'; c.fill(pu); c.strokeStyle = '#3a5a10'; c.lineWidth = 1; c.stroke(pu);
        c.fillStyle = '#1e1018'; c.fill(pl(new Path2D(), [[-44 * s, 4 * s], [-56 * s, 10 * s], [-44 * s, 14 * s]]));
        Z.glow(ACID, (st === 'burstW' ? 40 + 30 * k : 30) * s, 0, -14 * s, .35 + .2 * Math.sin(Z.now * 4) + (st === 'burstW' ? .3 * k : 0));
      }
      c.restore();
      // cephalothorax, spider eyes, fangs
      const ct = new Path2D(); ct.ellipse(6 * s, 0, 24 * s, 16 * s, .1, 0, TAU);
      c.strokeStyle = O; c.lineWidth = 2.6; c.stroke(ct); c.fillStyle = W(white, '#3c2232'); c.fill(ct);
      if (!white) {
        const ey = new Path2D(); for (const [px, py, pr] of [[24, -6, 2.4], [28, -3, 2], [22, -1, 1.8], [27, 1.5, 1.5], [19, -4, 1.4], [30, -7, 1.3]]) { ey.moveTo((px + pr) * s, py * s); ey.arc(px * s, py * s, pr * s, 0, TAU); }
        c.fillStyle = MK; c.fill(ey);
        const fg = new Path2D(); fg.moveTo(26 * s, 8 * s); fg.quadraticCurveTo(32 * s, 12 * s, 28 * s, 18 * s); fg.moveTo(20 * s, 10 * s); fg.quadraticCurveTo(25 * s, 14 * s, 21 * s, 19 * s);
        c.strokeStyle = O; c.lineWidth = 4 * s; c.stroke(fg); c.strokeStyle = '#e8dcc0'; c.lineWidth = 2.2 * s; c.stroke(fg);
      }
      legs(false);
      // the pale witch rising from the carapace
      const lean = spit ? (st === 'spitW' ? -.28 * k : .16) : cast ? -.12 : summ ? -.2 : Math.sin(e.ph * 1.6) * .04;
      c.save(); c.translate(10 * s, -8 * s); c.rotate(lean);
      const hair = new Path2D(); for (let i = 0; i < 5; i++) { const hy = (-62 + i * 3) * s, sw = Math.sin(e.ph * 2.2 + i) * 4 * s; hair.moveTo(0, hy); hair.quadraticCurveTo(-18 * s, hy + 14 * s + sw, (-30 - i * 3) * s, (-24 + i * 6) * s + sw); }
      c.strokeStyle = O; c.lineWidth = 6 * s; c.stroke(hair); c.strokeStyle = W(white, '#241a22'); c.lineWidth = 3.8 * s; c.stroke(hair);
      const tor = pl(new Path2D(), [[-8 * s, 4 * s], [-10 * s, -20 * s], [-7 * s, -40 * s], [-2 * s, -48 * s], [8 * s, -48 * s], [12 * s, -38 * s], [10 * s, -20 * s], [8 * s, 4 * s]]);
      c.strokeStyle = O; c.lineWidth = 2.4; c.stroke(tor); c.fillStyle = SKIN; c.fill(tor);
      if (!white) {
        const rb = new Path2D(); for (let i = 0; i < 4; i++) { rb.moveTo(-6 * s, (-34 + i * 6) * s); rb.quadraticCurveTo(1 * s, (-31 + i * 6) * s, 8 * s, (-34 + i * 6) * s); }
        c.strokeStyle = '#a89c8c'; c.lineWidth = 1.2 * s; c.stroke(rb);
        c.fillStyle = '#3a2a3e'; c.fill(pl(new Path2D(), [[-11 * s, -42 * s], [-2 * s, -50 * s], [10 * s, -49 * s], [14 * s, -38 * s], [9 * s, -30 * s], [6 * s, -38 * s], [1 * s, -32 * s], [-4 * s, -38 * s], [-9 * s, -30 * s]]));
        const tt = new Path2D(); for (let i = 0; i < 5; i++) tt.rect((-4 + i * 3) * s, -44 * s + Math.abs(i - 2) * .8 * s, 1.4 * s, 3 * s);
        c.fillStyle = '#efe6cc'; c.fill(tt);
        c.fillStyle = MK; c.fillRect(0, -24 * s, 3 * s, 3 * s);
      }
      // arms: reaching forward to spit, raised to call the rain, spread to summon
      const arm = (sx, ang, el, far) => {
        const a1 = ang, a2 = ang + el, L1 = 15 * s, L2 = 14 * s;
        const ex = sx + Math.cos(a1) * L1, ey = -42 * s + Math.sin(a1) * L1, hx = ex + Math.cos(a2) * L2, hy = ey + Math.sin(a2) * L2;
        const p = new Path2D(); p.moveTo(sx, -42 * s); p.lineTo(ex, ey); p.lineTo(hx, hy);
        for (let i = -1; i <= 1; i++) { p.moveTo(hx, hy); p.lineTo(hx + Math.cos(a2 + i * .4) * 6 * s, hy + Math.sin(a2 + i * .4) * 6 * s); }
        c.strokeStyle = O; c.lineWidth = 5 * s; c.stroke(p); c.strokeStyle = far ? W(white, '#b4ac9e') : SKIN; c.lineWidth = 3 * s; c.stroke(p);
      };
      const A1 = spit ? -.2 : cast ? -2 : summ ? -1.1 : .9, A2 = spit ? -.5 : cast ? -1.6 : summ ? -2.2 : 1.2;
      arm(-4 * s, A2 + Math.sin(e.ph * 2) * .1, cast ? .3 : -.6, true);
      // head
      const hd = new Path2D(); hd.ellipse(4 * s, -58 * s, 7.5 * s, 9 * s, 0, 0, TAU);
      c.strokeStyle = O; c.lineWidth = 2.2; c.stroke(hd); c.fillStyle = SKIN; c.fill(hd);
      if (!white) {
        c.fillStyle = '#1a0e14'; c.fillRect(4 * s, -62 * s, 4 * s, 2.6 * s); c.fillRect(9 * s, -61.6 * s, 2.4 * s, 2.2 * s);
        c.fillStyle = MK; c.fillRect(5 * s, -61.6 * s, 1.8 * s, 1.6 * s); c.fillRect(9.4 * s, -61.2 * s, 1.4 * s, 1.4 * s);
        c.fillStyle = '#a89a8e'; c.fillRect(3 * s, -57 * s, 6 * s, 1.2 * s);
        const op = st === 'spit' ? 4 * s : st === 'spitW' ? 3 * s * k : summ ? 3 * s : .8 * s;
        c.fillStyle = spit ? '#b8ff50' : '#2a1018'; c.beginPath(); c.ellipse(8 * s, -52.5 * s, 2.6 * s, op, 0, 0, TAU); c.fill();
        if (spit) Z.glow(ACID, (st === 'spit' ? 26 : 10 + 16 * k) * s, 9 * s, -53 * s, .85);
        if (enr) Z.glow(ACID, 16 * s, 7 * s, -61 * s, .5 + .2 * Math.sin(Z.now * 8));
      }
      // crown of twisted roots with a toxic gem
      const cr = new Path2D(); cr.moveTo(-3 * s, -64 * s); cr.quadraticCurveTo(-8 * s, -74 * s, -4 * s, -82 * s); cr.moveTo(2 * s, -66 * s); cr.quadraticCurveTo(0, -76 * s, 4 * s, -84 * s);
      cr.moveTo(8 * s, -66 * s); cr.quadraticCurveTo(12 * s, -74 * s, 10 * s, -80 * s); cr.moveTo(-6 * s, -62 * s); cr.quadraticCurveTo(-14 * s, -68 * s, -14 * s, -76 * s);
      c.strokeStyle = O; c.lineWidth = 4.4 * s; c.stroke(cr); c.strokeStyle = W(white, '#5a4430'); c.lineWidth = 2.4 * s; c.stroke(cr);
      if (!white) { c.fillStyle = MK; c.beginPath(); c.arc(3 * s, -67 * s, 2.4 * s, 0, TAU); c.fill(); }
      arm(8 * s, A1 + Math.sin(e.ph * 2 + 1) * .1, spit ? .1 : cast ? .3 : -.5, false);
      if (cast && !white) Z.glow(ACID, 20 * s, 8 * s + Math.cos(A1) * 26 * s, -42 * s + Math.sin(A1) * 26 * s, .6);
      c.restore();
      c.restore();
    },
    death(e, Z) {
      Z.burst(e.x, e.y, '#b8ff50', 40, 240); Z.burst(e.x, e.y, '#4a2a3a', 24, 180); Z.shake(16);
      addCloud(Z, e.x, e.y, 0, 3.5, 110);
      Z.banner('VICTORY ACHIEVED', '#e8c068', true);
    },
  };

  // Witch telegraphs drawn flat in world space (from under)
  function bossTele(c, Z, e) {
    const k = clamp(1 - e.mt / (e.mx || 1), 0, 1);
    if (e.st === 'spitW' || e.st === 'spit') {
      const [hx, hy] = mouth(e);
      c.save(); c.translate(hx, hy); c.rotate(e.ba);
      c.globalAlpha = e.st === 'spit' ? .1 : .08 + .2 * k; c.fillStyle = '#9aff40';
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 340, -.52, .52); c.closePath(); c.fill();
      c.globalAlpha = e.st === 'spit' ? .25 : .35 + .45 * k; c.strokeStyle = '#d0ff80'; c.lineWidth = 1.8; c.stroke();
      c.restore();
    } else if (e.st === 'summonW') {
      c.save(); c.globalAlpha = .2 + .3 * k; c.strokeStyle = '#b8ff50'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(e.x, e.y + 10, 95, 48, 0, 0, TAU); c.stroke(); c.restore();
    }
  }

  // ---------- Events ----------
  const erupt = (Z, n, spread, t0) => {
    for (let i = 0; i < n; i++) {
      const a = Z.rnd(0, TAU), d = Z.rnd(30, spread), x = Z.P.x + Math.cos(a) * d, y = Z.P.y + Math.sin(a) * d, tt = t0 + i * .22;
      Z.hazard(x, y, { r: 50, t: tt, dmg: 11, col: ACID }); addCloud(Z, x, y, tt, 1.6, 46);
    }
  };
  const events = [
    { t: 14, run(Z) { Z.banner('The mire bubbles…', '#b8e060', false); Z.sfx('warn'); erupt(Z, 8, 280, 1.1); } },
    { t: 30, run(Z) { // three swarms rise from one bank of reeds
      Z.banner('A swarm rises from the reeds', '#e08a6a', false); Z.sfx('warn');
      const a = Z.rnd(0, TAU);
      for (let g = 0; g < 3; g++) {
        const b = a + (g - 1) * .5, cx = Z.P.x + Math.cos(b) * 470, cy = Z.P.y + Math.sin(b) * 470;
        for (let i = 0; i < 3; i++) { const m = Z.spawn('mosq', cx + Z.rnd(-30, 30), cy + Z.rnd(-30, 30)); if (m) m.kid = true; }
      }
    } },
    { t: 72, run(Z) { // snipers take the nearest shanty platforms; hollows crawl out of the mud
      Z.banner('Snipers in the shanties', '#c08ad0', false); Z.sfx('warn');
      const P = Z.P, mx = Math.floor(P.x / MG), my = Math.floor(P.y / MG);
      let ns = 0;
      for (let j = my - 1; j <= my + 1 && ns < 4; j++) for (let i = mx - 1; i <= mx + 1 && ns < 4; i++) {
        const h = hub(Z, i, j), d = Math.hypot(h.x - P.x, h.y - P.y);
        if (d > 240 && d < 720) for (let q = 0; q < 2 && ns < 4; q++) { Z.spawn('sniper', h.x + (q ? 40 : -40), h.y + 10); ns++; }
      }
      for (; ns < 4; ns++) { const a = Z.rnd(0, TAU); Z.spawn('sniper', P.x + Math.cos(a) * 400, P.y + Math.sin(a) * 400); }
      const a0 = Z.rnd(0, TAU);
      for (let i = 0; i < 5; i++) { const a = a0 + i / 5 * TAU, h = Z.spawn('hollow', P.x + Math.cos(a) * 170, P.y + Math.sin(a) * 170); if (h) h.rise = .9; }
    } },
    { t: 98, run(Z) {
      Z.banner('The rot spreads', '#a8d040', true); Z.sfx('boss'); Z.shake(4);
      const a0 = Z.rnd(0, TAU);
      for (let i = 0; i < 5; i++) { const a = a0 + i / 5 * TAU; Z.spawn('maggot', Z.P.x + Math.cos(a) * 380, Z.P.y + Math.sin(a) * 380); }
      erupt(Z, 5, 220, 1.3);
    } },
    { t: 124, run(Z) { // the drowned and the bloated close in from every side
      Z.banner('The mire claims its own…', '#9ad040', true); Z.sfx('boss'); Z.shake(6);
      const a0 = Z.rnd(0, TAU);
      for (let i = 0; i < 10; i++) {
        const a = a0 + i / 10 * TAU, kind = i % 5 === 0 ? 'maggot' : i % 5 === 3 ? 'sniper' : 'hollow';
        const h = Z.spawn(kind, Z.P.x + Math.cos(a) * 420, Z.P.y + Math.sin(a) * 420);
        if (h && kind === 'hollow') h.rise = .7;
      }
    } },
  ];

  // ---------- Music: original. Near-silent swamp outside the fight; a frantic, grotesque choral storm for the witch ----------
  const music = (() => {
    const BPM = 88, DIV = 4, SD = 60 / BPM / DIV;
    const mk = bars => { const o = []; let p = 0; for (const bar of bars) for (const [m, l] of bar) { if (m) o[p] = [m, l]; p += l; } return o; };
    // Boss: E minor riddled with diminished sevenths, a Neapolitan-ish F diminished, and tritone bass jabs
    const CH = [[40, [52, 55, 59]], [37, [49, 52, 55]], [36, [48, 52, 55]], [35, [47, 51, 54]], [40, [52, 55, 59]], [41, [53, 56, 59]], [34, [46, 49, 52]], [35, [47, 51, 57]]];
    const MEL = [
      mk([[[71, 6], [72, 2], [71, 4], [67, 4]], [[70, 8], [67, 4], [64, 4]], [[72, 6], [71, 2], [67, 8]], [[66, 4], [63, 4], [66, 4], [71, 4]],
        [[76, 8], [74, 4], [72, 4]], [[71, 6], [68, 2], [65, 8]], [[67, 4], [70, 4], [73, 4], [76, 4]], [[75, 12], [0, 4]]]),
      mk([[[64, 4], [67, 4], [71, 8]], [[70, 6], [73, 2], [76, 8]], [[79, 8], [76, 4], [72, 4]], [[75, 8], [71, 8]],
        [[76, 4], [79, 4], [83, 8]], [[80, 6], [77, 2], [74, 8]], [[73, 4], [70, 4], [67, 4], [64, 4]], [[63, 6], [66, 2], [71, 8]]]),
    ];
    const OST = [0, 12, 0, 1, 0, 12, 0, -1, 0, 12, 0, 1, 12, 0, 6, -1];
    // Swamp: a faint lonely phrase in E phrygian, three bars each, with a tritone sigh
    const LONE = [
      mk([[[64, 8], [65, 4], [64, 4]], [[62, 12], [59, 4]], [[58, 16]]]),
      mk([[[71, 6], [70, 2], [67, 8]], [[65, 8], [64, 8]], [[64, 16]]]),
      mk([[[59, 8], [64, 8]], [[65, 6], [62, 2], [61, 8]], [[64, 16]]]),
    ];
    const DRONE = [0, 0, 1, -2, 0, -4, 1, -5];
    return {
      bpm: BPM, div: DIV,
      step(s, t, A) {
        const bar = Math.floor(s / 16), sb = s % 16;
        if (!A.boss) {
          // murky drone, wet bubbling, distant insects, creaking timber, now and then a ghostly voice
          const r = DRONE[Math.floor(bar / 4) % DRONE.length];
          if (bar % 4 === 0 && sb === 0) {
            A.pad([40 + r, 47 + r], t, SD * 64, .012, { type: 'sawtooth', cutoff: 260, q: 3, detune: 16 });
            A.tone(t, 28 + r, SD * 62, .055, { type: 'sine', attack: 2.5 });
          }
          const hb = (s * 13 + bar * 7) % 23;
          if (hb === 0 || (hb === 11 && bar % 2)) A.tone(t, 50 + (s * 5) % 9, .09, .022, { type: 'sine', glide: 62 + (s * 3) % 7, attack: .004 });
          if ((s * 11 + 3) % 37 === 0) A.noise(t, .35, .012, { type: 'lowpass', f: 300, f2: 120, q: 2 });
          if (bar % 3 !== 1 && (s * 7 + bar) % 29 === 0) for (let k = 0; k < 3; k++) A.tone(t + k * .06, 100 + (bar % 3), .025, .006, { type: 'sine' });
          if (bar % 5 === 2 && sb === 6) A.tone(t, 38, SD * 6, .016, { type: 'sawtooth', glide: 35, cutoff: 500, q: 8, vib: .6 });
          if (bar % 7 === 4 && sb === 0) A.noise(t, SD * 24, .01, { type: 'bandpass', f: 220, f2: 520, q: 1.4 });
          const grp = Math.floor(bar / 8), pos = (bar % 8 - 2) * 16 + sb;
          if (grp % 4 !== 3 && pos >= 0 && pos < 48) {
            const ev = LONE[grp % 3][pos];
            if (ev) {
              if (grp % 2 === 0) A.tone(t, ev[0], ev[1] * SD * .98, .028, { type: 'triangle', attack: .35, vib: .5, detune: 6 });
              else { A.pluck(ev[0], t, .34); A.pluck(ev[0] + 12, t + SD * 2, .1); }
            }
          }
          return;
        }
        // ----- boss: choir, tremolo strings, brass stabs, timpani, a frantic tritone ostinato -----
        const lb = bar % 16, ch = CH[lb % 8], bass = ch[0], tri = ch[1];
        if (sb === 0) {
          A.pad(tri.map(m => m + 12), t, SD * 16, .02, { type: 'triangle', cutoff: 1700, q: 2, detune: 16 });
          A.tone(t, bass - 12, SD * 15, .06, { type: 'sawtooth', cutoff: 200, attack: .03 });
          for (const m of [tri[0], tri[2]]) A.tone(t, m, SD * 2.4, .028, { type: 'sawtooth', cutoff: 800, sweep: 2600, attack: .01 });
        }
        if (sb === 10 && lb % 2 === 1) for (const m of [tri[1], tri[2]]) A.tone(t, m + 12, SD * 1.4, .022, { type: 'sawtooth', cutoff: 1000, sweep: 2400, attack: .01 });
        // fast tremolo strings: two upper chord tones re-bowed every sixteenth
        A.tone(t, tri[2] + 12, SD * .85, .012, { type: 'sawtooth', cutoff: 2200, attack: .004, decay: true });
        A.tone(t, tri[1] + 12, SD * .85, .01, { type: 'sawtooth', cutoff: 2000, attack: .004, decay: true, detune: 8 });
        A.tone(t, bass + OST[sb], SD * .8, .04, { type: 'sawtooth', cutoff: 760, sweep: 260, decay: true, q: 3 });
        if (sb === 0) { A.kick(t, .62); A.tom(t, 56, .44); }
        if (sb === 6) A.kick(t, .4);
        if (sb === 8) { A.kick(t, .5); A.tom(t, 56, .36); }
        if (sb === 11 || sb === 14) A.tom(t, 74, .24);
        if (lb % 4 === 3 && sb >= 12) A.tom(t, 60 + (sb - 12) * 10, .24 + (sb - 12) * .05);
        if (sb === 4 || sb === 12) A.snare(t, .22);
        if (sb % 2 === 1) A.hat(t, .024, false);
        if (lb % 8 === 7 && sb === 4) A.noise(t, SD * 12, .03, { type: 'highpass', f: 2500, f2: 8000 });
        if (lb % 8 === 0 && sb === 0) A.noise(t, 1.4, .03, { type: 'highpass', f: 5000 });
        const ev = MEL[lb >> 3][(lb % 8) * 16 + sb];
        if (ev) {
          A.tone(t, ev[0], ev[1] * SD * .96, .05, { type: 'sawtooth', cutoff: 1400, sweep: 2600, attack: .05, vib: .4, detune: -5 });
          A.tone(t, ev[0] - 12, ev[1] * SD * .96, .026, { type: 'triangle', attack: .08, vib: .25 });
        }
      },
    };
  })();

  return {
    id: 'ds', name: 'The Hollow Depths', nod: 'Dark Souls', portal: '120,230,60', bg: '#2a3017', dark: .72, dim: .18,
    ground, under, ambient,
    mix: { hollow: 6, mosq: 1, sniper: 1.3, maggot: .8 },
    target: 1,
    foes: { hollow, sniper, mosq, maggot },
    boss, events, music,
  };
})());
