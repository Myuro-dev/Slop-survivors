// Portal zone: The Weeping Cellar. A nod to The Binding of Isaac.
// Grim, darkly comic hand-drawn basement rooms: stone-walled cells with arched wooden doors, grid-laid rocks,
// poop piles, pits, spikes and fireplaces; pale weeping criers, buzzing flies and a hopping meat-blob.
ZONES.push((() => {
  const TAU = Math.PI * 2;
  const OUT = '#0b0605';            // chunky cartoon outline
  const RED = '255,36,36';          // tear bullets (bright, reads on brown)
  const F = (w, c) => (w ? '#fff' : c);

  // ---------------- Room grid ----------------
  // Rooms are 960x640 (15x10 tiles of 64). A 1-tile stone wall frames a 13x8 interior. Room (0,0) is centred on the origin.
  const RW = 960, RH = 640, T = 64, WL = 64, COLS = 13, ROWS = 8, DOOR = 44;
  // Obstacle legend: r rock, x tinted rock, p poop, o pit, s spikes, f fireplace, P pedestal, c chest
  const TPL = [
    ['.............', '.............', '.............', '.............', '.............', '.............', '.............', '.............'],
    ['.............', '.rr.......rr.', '.r.........r.', '.............', '.............', '.r.........r.', '.rr.......rr.', '.............'],
    ['.............', '..o.......o..', '..o..ppp..o..', '..o.......o..', '..o.......o..', '..o..rxr..o..', '..o.......o..', '.............'],
    ['r...........r', '.............', '...sss.sss...', '..x...P...x..', '...sss.sss...', '.............', '.............', 'r...........r'],
    ['.............', '.f.........f.', '.............', '....rrrrr....', '....rxrxr....', '.............', '.f.........f.', '.............'],
    ['.............', '..p.......p..', '.....ppp.....', '..p.......p..', '.............', '...p.....p...', '.............', '......c......'],
    ['.............', '....rrrrr....', '...r.....r...', '...x..c..x...', '...r.....r...', '....rr.rr....', '.............', '.............'],
    ['.............', '.............', '...ooooooo...', '...o.....o...', '...o..P..o...', '...ooooooo...', '.............', '.............'],
    ['s.s.s...s.s.s', '.............', 's.s.......s.s', '...r..f..r...', '.............', 's.s.......s.s', '.............', 's.s.s...s.s.s'],
    ['rr.........rr', 'r...........r', '.....xpx.....', '.............', '.............', '.....xpx.....', 'r...........r', 'rr.........rr'],
    ['.............', '.oo.......oo.', '.oo..f.f..oo.', '.............', '.............', '.oo.......oo.', '.oo...c...oo.', '.............'],
  ];
  const H = (Z, a, b) => Math.min(.9999, Math.max(0, Z.hash(a, b) || 0));
  const layout = (Z, rx, ry) => {
    if (rx === 0 && ry === 0) return { i: 0, mx: false, my: false };
    const i = 1 + Math.floor(H(Z, rx * 13 + 7, ry * 29 - 3) * (TPL.length - 1));
    const m = H(Z, rx * 5 - 11, ry * 7 + 13);
    return { i, mx: m < .5, my: (m * 4) % 1 < .5 };
  };
  const cellAt = (L, col, row) => {
    if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return '#';
    return TPL[L.i][L.my ? ROWS - 1 - row : row][L.mx ? COLS - 1 - col : col];
  };
  const roomsIn = (x0, y0, x1, y1, fn) => {
    const ra = Math.floor((x0 + RW / 2) / RW), rb = Math.floor((x1 + RW / 2) / RW);
    const sa = Math.floor((y0 + RH / 2) / RH), sb = Math.floor((y1 + RH / 2) / RH);
    for (let ry = sa; ry <= sb; ry++) for (let rx = ra; rx <= rb; rx++) fn(rx, ry, rx * RW - RW / 2, ry * RH - RH / 2);
  };
  // Cached per-layout lists of fireplace cells; puddles chosen per room from empty cells.
  const fireCache = new Map();
  const firesOf = L => {
    const k = L.i * 4 + (L.mx ? 1 : 0) + (L.my ? 2 : 0);
    let a = fireCache.get(k);
    if (!a) { a = []; for (let r = 0; r < ROWS; r++) for (let q = 0; q < COLS; q++) if (cellAt(L, q, r) === 'f') a.push(q, r); fireCache.set(k, a); }
    return a;
  };
  const puddlesOf = (Z, L, rx, ry) => {
    const out = [];
    for (let k = 0; k < 6 && out.length < 4; k++) {
      const q = Math.floor(H(Z, rx * 17 + k * 3, ry * 11 - k) * COLS), r = Math.floor(H(Z, rx * 3 - k * 7, ry * 19 + k) * ROWS);
      if (cellAt(L, q, r) === '.' && H(Z, rx + k * 31, ry - k * 5) < .55) out.push(q, r);
    }
    return out;
  };

  // Wobbly hand-drawn blob, appended to a Path2D.
  const blob = (p, x, y, rx, ry, sd, amp = .1, n = 9) => {
    const px = [], py = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + sd, k = 1 + amp * Math.sin(i * 2.9 + sd * 7.3) + amp * .5 * Math.sin(i * 5.3 + sd * 3.1);
      px.push(x + Math.cos(a) * rx * k); py.push(y + Math.sin(a) * ry * k);
    }
    p.moveTo((px[n - 1] + px[0]) / 2, (py[n - 1] + py[0]) / 2);
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; p.quadraticCurveTo(px[i], py[i], (px[i] + px[j]) / 2, (py[i] + py[j]) / 2); }
    p.closePath();
  };
  // Wobbly square floor tile.
  const tile = (p, x, y, s, sd) => {
    const j = k => Math.sin(sd * k) * 2.4;
    p.moveTo(x + 3 + j(1), y + 3 + j(2));
    p.quadraticCurveTo(x + s / 2, y + 1 + j(3), x + s - 3 + j(4), y + 3 + j(5));
    p.quadraticCurveTo(x + s - 1 + j(6), y + s / 2, x + s - 3 + j(7), y + s - 3 + j(8));
    p.quadraticCurveTo(x + s / 2, y + s - 1 + j(9), x + 3 + j(10), y + s - 3 + j(11));
    p.quadraticCurveTo(x + 1 + j(12), y + s / 2, x + 3 + j(1), y + 3 + j(2));
    p.closePath();
  };

  const makeRed = f => {
    if (!f || f.red) return;
    f.red = true; f.sp *= 1.55; f.hp *= 1.5; f.max = f.hp;
  };
  const champ = f => {
    if (!f) return;
    f.champ = true; f.hp *= 1.8; f.max = f.hp; f.sp *= 1.12;
  };
  const around = (Z, kind, n, R, after) => {
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + Z.rnd(-.15, .15);
      const f = Z.spawn(kind, Z.P.x + Math.cos(a) * R, Z.P.y + Math.sin(a) * R);
      if (after) after(f, i);
    }
  };

  // ---------------- Music data (original) ----------------
  // D harmonic minor, 3/4 waltz, 6 eighth-steps per bar.
  const CH = [
    { b: 38, n: [62, 65, 69] }, { b: 34, n: [62, 65, 70] }, { b: 31, n: [62, 67, 70] }, { b: 33, n: [61, 64, 69] },
    { b: 38, n: [62, 65, 69] }, { b: 36, n: [60, 64, 67] }, { b: 41, n: [60, 65, 69] }, { b: 33, n: [61, 64, 67] },
    { b: 34, n: [62, 65, 70] }, { b: 31, n: [62, 67, 70] }, { b: 38, n: [62, 65, 69] }, { b: 33, n: [61, 64, 69] },
    { b: 38, n: [62, 65, 69] }, { b: 31, n: [58, 62, 67] }, { b: 33, n: [61, 64, 67] }, { b: 38, n: [62, 65, 69] },
  ];
  // Music-box phrases: [step, semitone above D5]
  const MEL = [
    [[0, 7], [2, 8], [4, 7]], [[0, 5], [3, 3], [4, 2]], [[0, 3], [2, 2], [4, -1]], [[0, 0], [4, -5]],
    [[0, 12], [2, 10], [3, 8], [4, 7]], [[0, 4], [2, 7], [4, 4]], [[0, 5], [1, 4], [2, 5], [4, 9]], [[0, -1], [2, 4], [4, 7]],
    [[0, 10], [2, 8], [4, 5]], [[0, 7], [2, 3], [3, 2], [4, 3]], [[0, 5], [2, 2], [4, 0]], [[0, 4], [2, 1], [4, -1]],
    [[0, 2], [1, 3], [2, 5], [4, 8]], [[0, 7], [3, 3]], [[0, 1], [2, 4], [4, -1]], [[0, 0]],
  ];
  const BOSS_CH = [38, 38, 34, 33, 38, 36, 34, 37];
  const BOSS_ARP = [0, 3, 7, 12, 11, 7, 3, 7];

  // ---------------- Ground pieces ----------------
  const drawDoor = (c, x, y, rot) => {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.fillStyle = '#120a07'; c.fillRect(-DOOR, -WL - 2, DOOR * 2, WL + 4);
    const fr = new Path2D();
    fr.moveTo(-60, 8); fr.lineTo(-60, -22); fr.ellipse(0, -22, 60, 38, 0, Math.PI, TAU); fr.lineTo(60, 8);
    fr.lineTo(DOOR, 8); fr.lineTo(DOOR, -22); fr.ellipse(0, -22, DOOR, 27, 0, TAU, Math.PI, true); fr.lineTo(-DOOR, 8); fr.closePath();
    c.fillStyle = '#80522c'; c.fill(fr);
    c.strokeStyle = OUT; c.lineWidth = 4; c.lineJoin = 'round'; c.stroke(fr);
    const pl = new Path2D(); // plank seams + iron studs
    for (const a of [.2, .45, .7]) {
      const an = Math.PI + a * Math.PI;
      pl.moveTo(Math.cos(an) * DOOR, -22 + Math.sin(an) * 27); pl.lineTo(Math.cos(an) * 60, -22 + Math.sin(an) * 38);
    }
    pl.moveTo(-60, -6); pl.lineTo(-DOOR, -6); pl.moveTo(DOOR, -6); pl.lineTo(60, -6);
    c.strokeStyle = '#4a2a12'; c.lineWidth = 2.5; c.stroke(pl);
    c.fillStyle = '#b07c48'; c.beginPath(); c.moveTo(-9, -61); c.lineTo(9, -61); c.lineTo(6, -48); c.lineTo(-6, -48); c.closePath(); c.fill();
    c.lineWidth = 2.5; c.strokeStyle = OUT; c.stroke();
    c.fillStyle = '#2a2420'; c.fillRect(-55, 0, 6, 5); c.fillRect(49, 0, 6, 5);
    c.restore();
  };

  const drawRoomFloor = (Z, c, rx, ry, ox, oy, P) => {
    const ix = ox + WL, iy = oy + WL;
    c.fillStyle = '#4b3a2c'; c.fillRect(ix, iy, COLS * T, ROWS * T);
    for (let r = 0; r < ROWS; r++) for (let q = 0; q < COLS; q++) {
      const gx = rx * COLS + q, gy = ry * ROWS + r, h = H(Z, gx * 3 + 1, gy * 5 - 2);
      const x = ix + q * T, y = iy + r * T, sd = h * 50 + 1;
      tile(h < .4 ? P.t1 : h < .78 ? P.t2 : P.t3, x, y, T, sd);
      P.hi.moveTo(x + 7, y + T - 9); P.hi.quadraticCurveTo(x + 5, y + 6, x + T - 10, y + 6 + Math.sin(sd) * 2);
      const h2 = H(Z, gx * 7 + 3, gy * 13 - 5);
      if (h2 < .13) { // hairline crack
        let px = x + 12 + h2 * 200, py = y + 10;
        P.crack.moveTo(px, py);
        for (let k = 1; k <= 3; k++) { px += Math.sin(sd * k) * 9; py += 14; P.crack.lineTo(px, py); }
      } else if (h2 > .9) { // pebbles / grit
        P.grit.moveTo(x + 20 + h2 * 9, y + 40); P.grit.arc(x + 18 + h2 * 9, y + 40, 2, 0, TAU);
        P.grit.moveTo(x + 42, y + 22 + h2 * 5); P.grit.arc(x + 40, y + 22 + h2 * 5, 1.6, 0, TAU);
      }
    }
    // stains, blood splats, tear puddles
    for (let k = 0; k < 5; k++) {
      const hx = H(Z, rx * 41 + k * 7, ry * 23 - k), hy = H(Z, rx * 9 - k * 13, ry * 37 + k * 3);
      const sx = ix + 40 + hx * (COLS * T - 80), sy = iy + 40 + hy * (ROWS * T - 80);
      if (k < 3) blob(P.stain, sx, sy, 40 + hx * 50, 26 + hy * 30, hx * 9, .22, 10);
      else {
        blob(P.blood, sx, sy, 9 + hx * 8, 7 + hy * 6, hy * 7, .3, 8);
        for (let d = 0; d < 4; d++) { const a = d * 1.7 + hx * 6, rr = 18 + d * 5; P.blood.moveTo(sx + Math.cos(a) * rr + 3, sy + Math.sin(a) * rr); P.blood.arc(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr, 3 - d * .5, 0, TAU); }
      }
    }
    const L = layout(Z, rx, ry), pd = puddlesOf(Z, L, rx, ry);
    for (let k = 0; k < pd.length; k += 2) {
      const px = ix + pd[k] * T + 32, py = iy + pd[k + 1] * T + 34;
      blob(P.pud, px, py, 26, 13, k + rx, .15, 9);
      P.pudRim.moveTo(px - 16, py - 4); P.pudRim.quadraticCurveTo(px - 6, py - 10, px + 6, py - 8);
    }
  };

  const drawRoomShadows = (c, ox, oy) => {
    const ix = ox + WL, iy = oy + WL, iw = COLS * T, ih = ROWS * T;
    let g = c.createLinearGradient(0, iy, 0, iy + 44);
    g.addColorStop(0, 'rgba(8,4,2,.6)'); g.addColorStop(1, 'rgba(8,4,2,0)');
    c.fillStyle = g; c.fillRect(ix, iy, iw, 44);
    g = c.createLinearGradient(ix, 0, ix + 32, 0);
    g.addColorStop(0, 'rgba(8,4,2,.5)'); g.addColorStop(1, 'rgba(8,4,2,0)');
    c.fillStyle = g; c.fillRect(ix, iy, 32, ih);
    g = c.createLinearGradient(ix + iw, 0, ix + iw - 26, 0);
    g.addColorStop(0, 'rgba(8,4,2,.4)'); g.addColorStop(1, 'rgba(8,4,2,0)');
    c.fillStyle = g; c.fillRect(ix + iw - 26, iy, 26, ih);
    g = c.createLinearGradient(0, iy + ih, 0, iy + ih - 20);
    g.addColorStop(0, 'rgba(8,4,2,.35)'); g.addColorStop(1, 'rgba(8,4,2,0)');
    c.fillStyle = g; c.fillRect(ix, iy + ih - 20, iw, 20);
    for (const [cx, cy] of [[ix, iy], [ix + iw, iy], [ix, iy + ih], [ix + iw, iy + ih]]) {
      g = c.createRadialGradient(cx, cy, 0, cx, cy, 170);
      g.addColorStop(0, 'rgba(8,4,2,.42)'); g.addColorStop(1, 'rgba(8,4,2,0)');
      c.fillStyle = g; c.fillRect(cx - 170, cy - 170, 340, 340);
    }
  };

  const addWallStones = (Z, ox, oy, P) => {
    const mx = ox + RW / 2, my = oy + RH / 2;
    const stone = (x, y, rx, ry, k) => {
      const h = H(Z, Math.round(x) * 3 + k, Math.round(y) * 7 - k);
      const sx = rx * (.85 + h * .3), sy = ry * (.85 + (h * 7 % 1) * .3);
      blob(h < .5 ? P.sA : P.sB, x, y, sx, sy, h * 20, .12, 8);
      P.sHi.moveTo(x - sx * .65, y - sy * .05); P.sHi.quadraticCurveTo(x - sx * .55, y - sy * .7, x + sx * .1, y - sy * .72);
    };
    for (let row = 0; row < 2; row++) {
      const off = row ? 0 : 19, y1 = oy + 17 + row * 31, y2 = oy + RH - 17 - row * 31;
      for (let x = ox + off; x <= ox + RW; x += 38) {
        if (Math.abs(x - mx) < DOOR + 14) continue;
        stone(x, y1, 20, 15, 1); stone(x, y2, 20, 15, 2);
      }
      const x1 = ox + 17 + row * 31, x2 = ox + RW - 17 - row * 31;
      for (let y = oy + WL + 2 + off; y <= oy + RH - WL; y += 36) {
        if (Math.abs(y - my) < DOOR + 14) continue;
        stone(x1, y, 15, 19, 3); stone(x2, y, 15, 19, 4);
      }
    }
  };

  // Obstacles, direct or batched depending on how they layer.
  const addObstacle = (Z, c, ch, x, y, sd, L, q, r, P) => {
    switch (ch) {
      case 'r': case 'x': {
        blob(P.shadow, x + 3, y + 16, 28, 11, sd);
        const body = ch === 'r' ? P.rock : P.tint, top = ch === 'r' ? P.rockTop : P.tintTop;
        blob(body, x, y + 2, 27, 24, sd, .13, 9);
        blob(top, x - 3, y - 7, 18, 11, sd + 2, .15, 8);
        P.rockLine.moveTo(x + 8, y + 4); P.rockLine.lineTo(x + 14, y + 12); P.rockLine.lineTo(x + 11, y + 19);
        if (ch === 'x') { P.xm.moveTo(x - 8, y - 4); P.xm.lineTo(x + 8, y + 12); P.xm.moveTo(x + 8, y - 4); P.xm.lineTo(x - 8, y + 12); }
        break;
      }
      case 'o': {
        blob(P.pit, x, y, 35, 34, sd, .08, 10);
        if (cellAt(L, q, r - 1) !== 'o') { P.pitRim.moveTo(x - 24, y - 12); P.pitRim.quadraticCurveTo(x, y - 30, x + 24, y - 12); }
        break;
      }
      case 's': {
        P.plate.rect(x - 28, y - 28, 56, 56);
        for (let k = 0; k < 4; k++) {
          const sx = x + (k % 2 ? 13 : -13), sy = y + (k < 2 ? -9 : 15);
          P.spike.moveTo(sx - 9, sy + 6); P.spike.lineTo(sx, sy - 18); P.spike.lineTo(sx + 9, sy + 6); P.spike.closePath();
          P.tip.moveTo(sx - 3, sy - 10); P.tip.lineTo(sx, sy - 18); P.tip.lineTo(sx + 3, sy - 10); P.tip.closePath();
        }
        break;
      }
      case 'p': {
        blob(P.shadow, x + 2, y + 18, 26, 9, sd);
        P.poo.push(x, y, sd);
        break;
      }
      case 'f': {
        blob(P.shadow, x + 2, y + 18, 30, 10, sd);
        P.fire.push(x, y, sd);
        break;
      }
      case 'P': case 'c': {
        blob(P.shadow, x + 3, y + 20, 30, 10, sd);
        P.prop.push(ch === 'P' ? 0 : 1, x, y);
        break;
      }
    }
  };

  const drawPoo = (c, x, y, sd) => {
    c.fillStyle = '#7c4c22'; c.strokeStyle = OUT; c.lineWidth = 3;
    for (let k = 0; k < 3; k++) {
      const p = new Path2D(); blob(p, x + Math.sin(sd + k) * 2, y + 10 - k * 11, 24 - k * 7, 11 - k * 2, sd + k, .1, 8);
      c.fill(p); c.stroke(p);
    }
    const hi = new Path2D();
    hi.moveTo(x - 14, y + 6); hi.quadraticCurveTo(x - 8, y + 1, x - 2, y + 2);
    hi.moveTo(x - 9, y - 6); hi.quadraticCurveTo(x - 5, y - 10, x, y - 9);
    c.strokeStyle = '#b07a3e'; c.lineWidth = 2.5; c.stroke(hi);
  };
  const drawFirePlace = (c, x, y, sd) => {
    const ash = new Path2D(); blob(ash, x, y + 8, 24, 13, sd, .1, 8);
    c.fillStyle = '#2a1a12'; c.fill(ash); c.strokeStyle = OUT; c.lineWidth = 3; c.stroke(ash);
    const logs = new Path2D();
    logs.moveTo(x - 22, y + 2); logs.lineTo(x + 16, y + 16); logs.lineTo(x + 19, y + 9); logs.lineTo(x - 19, y - 5); logs.closePath();
    logs.moveTo(x + 22, y + 2); logs.lineTo(x - 16, y + 16); logs.lineTo(x - 19, y + 9); logs.lineTo(x + 19, y - 5); logs.closePath();
    c.fillStyle = '#6e4424'; c.fill(logs); c.lineWidth = 2.5; c.stroke(logs);
    const st = new Path2D();
    for (let k = 0; k < 7; k++) { const a = Math.PI * .05 + k / 6 * Math.PI * .9; blob(st, x + Math.cos(a) * 28, y + 8 + Math.sin(a) * 13, 7, 6, sd + k, .15, 7); }
    c.fillStyle = '#857a70'; c.fill(st); c.lineWidth = 2.5; c.stroke(st);
  };
  const drawProp = (c, kind, x, y) => {
    c.strokeStyle = OUT; c.lineWidth = 3; c.lineJoin = 'round';
    if (kind === 0) { // stone pedestal with a little heart on it
      c.fillStyle = '#8c8279'; c.beginPath(); c.rect(x - 18, y - 6, 36, 28); c.fill(); c.stroke();
      c.fillStyle = '#aaa096'; c.beginPath(); c.rect(x - 24, y - 14, 48, 10); c.fill(); c.stroke();
      c.fillStyle = '#6e655d'; c.fillRect(x - 15, y + 4, 30, 4);
      const hp = new Path2D();
      hp.moveTo(x, y - 20); hp.bezierCurveTo(x - 16, y - 30, x - 12, y - 46, x, y - 38); hp.bezierCurveTo(x + 12, y - 46, x + 16, y - 30, x, y - 20); hp.closePath();
      c.fillStyle = '#e8222a'; c.fill(hp); c.lineWidth = 2.5; c.stroke(hp);
      c.fillStyle = '#ff9a9a'; c.fillRect(x - 8, y - 36, 3, 3);
    } else { // wooden chest with brass bands
      c.fillStyle = '#8a5528'; c.beginPath(); c.rect(x - 24, y - 6, 48, 26); c.fill(); c.stroke();
      c.fillStyle = '#a8693a'; c.beginPath(); c.moveTo(x - 24, y - 6); c.quadraticCurveTo(x, y - 26, x + 24, y - 6); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#e8b030'; c.fillRect(x - 17, y - 14, 6, 34); c.fillRect(x + 11, y - 14, 6, 34);
      c.beginPath(); c.rect(x - 5, y - 4, 10, 11); c.fill(); c.lineWidth = 2; c.stroke();
    }
  };

  // ---------------- Shared enemy drawing bits ----------------
  const SKIN = '#f3cfb6', SKIN_CH = '#ff8f7c';
  const hollowFace = (c, x, y, s, w, champion) => {
    c.fillStyle = F(w, '#0a0404');
    c.beginPath();
    c.ellipse(x - s * .36, y - s * .12, s * .21, s * .28, 0, 0, TAU);
    c.moveTo(x + s * .57, y - s * .12); c.ellipse(x + s * .36, y - s * .12, s * .21, s * .28, 0, 0, TAU);
    c.moveTo(x + s * .32, y + s * .45); c.ellipse(x, y + s * .45, s * .32, s * .24, 0, 0, TAU);
    c.fill();
    if (!w) { // bright blood drips from eyes and mouth
      c.fillStyle = champion ? '#ff2a1a' : '#e01418';
      c.fillRect(x - s * .4, y + s * .08, s * .1, s * .3); c.fillRect(x + s * .33, y + s * .08, s * .1, s * .22);
      c.fillRect(x - s * .06, y + s * .62, s * .12, s * .4);
    }
  };

  return {
    id: 'isaac',
    name: 'The Weeping Cellar',
    nod: 'The Binding of Isaac',
    portal: '190,60,50',
    bg: '#3a2b20',
    dark: .62,
    dim: .2,

    ground(Z, x0, y0, x1, y1) {
      const c = Z.ctx;
      const P = {
        t1: new Path2D(), t2: new Path2D(), t3: new Path2D(), hi: new Path2D(), crack: new Path2D(), grit: new Path2D(),
        stain: new Path2D(), blood: new Path2D(), pud: new Path2D(), pudRim: new Path2D(),
        sA: new Path2D(), sB: new Path2D(), sHi: new Path2D(),
        shadow: new Path2D(), rock: new Path2D(), rockTop: new Path2D(), tint: new Path2D(), tintTop: new Path2D(), rockLine: new Path2D(), xm: new Path2D(),
        pit: new Path2D(), pitRim: new Path2D(), plate: new Path2D(), spike: new Path2D(), tip: new Path2D(),
        poo: [], fire: [], prop: [],
      };
      c.save();
      c.lineJoin = 'round'; c.lineCap = 'round';
      // 1. floors
      roomsIn(x0, y0, x1, y1, (rx, ry, ox, oy) => drawRoomFloor(Z, c, rx, ry, ox, oy, P));
      c.fillStyle = '#6e5642'; c.fill(P.t1);
      c.fillStyle = '#664f3c'; c.fill(P.t2);
      c.fillStyle = '#745b45'; c.fill(P.t3);
      c.strokeStyle = 'rgba(150,120,90,.35)'; c.lineWidth = 2; c.stroke(P.hi);
      c.fillStyle = 'rgba(30,16,8,.22)'; c.fill(P.stain);
      c.strokeStyle = '#3e2e22'; c.lineWidth = 2; c.stroke(P.crack);
      c.fillStyle = '#4a382a'; c.fill(P.grit);
      c.fillStyle = 'rgba(120,20,16,.55)'; c.fill(P.blood);
      c.fillStyle = '#556270'; c.fill(P.pud);
      c.strokeStyle = 'rgba(30,20,14,.7)'; c.lineWidth = 2; c.stroke(P.pud);
      c.strokeStyle = 'rgba(180,200,220,.5)'; c.lineWidth = 2.5; c.stroke(P.pudRim);
      // 2. wall shadows + corner shading
      roomsIn(x0, y0, x1, y1, (rx, ry, ox, oy) => drawRoomShadows(c, ox, oy));
      // 3. obstacles
      roomsIn(x0, y0, x1, y1, (rx, ry, ox, oy) => {
        const L = layout(Z, rx, ry);
        for (let r = 0; r < ROWS; r++) for (let q = 0; q < COLS; q++) {
          const ch = cellAt(L, q, r);
          if (ch !== '.') addObstacle(Z, c, ch, ox + WL + q * T + 32, oy + WL + r * T + 32, H(Z, rx * 99 + q, ry * 77 + r) * 9, L, q, r, P);
        }
      });
      c.fillStyle = 'rgba(10,5,2,.35)'; c.fill(P.shadow);
      c.strokeStyle = OUT; c.lineWidth = 8; c.stroke(P.pit);
      c.fillStyle = '#0c0705'; c.fill(P.pit);
      c.strokeStyle = '#3c2e24'; c.lineWidth = 5; c.stroke(P.pitRim);
      c.fillStyle = '#4e4138'; c.fill(P.plate); c.strokeStyle = OUT; c.lineWidth = 3; c.stroke(P.plate);
      c.fillStyle = '#ddd5ca'; c.fill(P.spike); c.lineWidth = 2.5; c.stroke(P.spike);
      c.fillStyle = '#d01c1c'; c.fill(P.tip);
      c.fillStyle = '#8c8279'; c.fill(P.rock); c.strokeStyle = OUT; c.lineWidth = 3.5; c.stroke(P.rock);
      c.fillStyle = '#a89e94'; c.fill(P.rockTop);
      c.fillStyle = '#8796a2'; c.fill(P.tint); c.stroke(P.tint);
      c.fillStyle = '#aebcc6'; c.fill(P.tintTop);
      c.strokeStyle = '#4c443e'; c.lineWidth = 2; c.stroke(P.rockLine);
      c.strokeStyle = '#3a2c22'; c.lineWidth = 6; c.stroke(P.xm);
      c.strokeStyle = '#f0e2bc'; c.lineWidth = 3; c.stroke(P.xm);
      for (let k = 0; k < P.poo.length; k += 3) drawPoo(c, P.poo[k], P.poo[k + 1], P.poo[k + 2]);
      for (let k = 0; k < P.fire.length; k += 3) drawFirePlace(c, P.fire[k], P.fire[k + 1], P.fire[k + 2]);
      for (let k = 0; k < P.prop.length; k += 3) drawProp(c, P.prop[k], P.prop[k + 1], P.prop[k + 2]);
      // 4. walls: dark mortar, chunky outlined stones, seams
      roomsIn(x0, y0, x1, y1, (rx, ry, ox, oy) => {
        c.fillStyle = '#211915';
        c.fillRect(ox, oy, RW, WL); c.fillRect(ox, oy + RH - WL, RW, WL);
        c.fillRect(ox, oy + WL, WL, RH - WL * 2); c.fillRect(ox + RW - WL, oy + WL, WL, RH - WL * 2);
        addWallStones(Z, ox, oy, P);
      });
      c.fillStyle = '#4a3e36'; c.fill(P.sA);
      c.fillStyle = '#3f342d'; c.fill(P.sB);
      c.strokeStyle = OUT; c.lineWidth = 3; c.stroke(P.sA); c.stroke(P.sB);
      c.strokeStyle = '#6c5e52'; c.lineWidth = 2.5; c.stroke(P.sHi);
      roomsIn(x0, y0, x1, y1, (rx, ry, ox, oy) => {
        c.strokeStyle = OUT; c.lineWidth = 5; c.strokeRect(ox + WL, oy + WL, COLS * T, ROWS * T);
        c.strokeStyle = '#050302'; c.lineWidth = 3; c.strokeRect(ox, oy, RW, RH);
        drawDoor(c, ox + RW / 2, oy + WL, 0);
        drawDoor(c, ox + RW / 2, oy + RH - WL, Math.PI);
        drawDoor(c, ox + WL, oy + RH / 2, -Math.PI / 2);
        drawDoor(c, ox + RW - WL, oy + RH / 2, Math.PI / 2);
      });
      c.restore();
    },

    // Animated floor bits: fireplace flames and sliding glints on tear puddles.
    under(Z) {
      const c = Z.ctx, P = Z.P, hw = Z.W / 2 + 60, hh = Z.H / 2 + 60;
      c.save();
      roomsIn(P.x - hw, P.y - hh, P.x + hw, P.y + hh, (rx, ry, ox, oy) => {
        const L = layout(Z, rx, ry), fs = firesOf(L);
        for (let k = 0; k < fs.length; k += 2) {
          const x = ox + WL + fs[k] * T + 32, y = oy + WL + fs[k + 1] * T + 32;
          if (Math.abs(x - P.x) > hw || Math.abs(y - P.y) > hh) continue;
          const t = Z.now * 8 + x * .01, a = Math.sin(t) * 3, b = Math.sin(t * 1.7 + 1) * 4, s = 1 + .12 * Math.sin(t * 2.3);
          c.fillStyle = '#ff6a14'; c.strokeStyle = OUT; c.lineWidth = 3;
          c.beginPath(); c.moveTo(x - 17, y + 6); c.quadraticCurveTo(x - 20, y - 18 * s, x + a, y - 40 * s);
          c.quadraticCurveTo(x + 20, y - 18 * s, x + 17, y + 6); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = '#ffc23a';
          c.beginPath(); c.moveTo(x - 10, y + 5); c.quadraticCurveTo(x - 12, y - 12, x + b * .6, y - 28 * s); c.quadraticCurveTo(x + 12, y - 12, x + 10, y + 5); c.closePath(); c.fill();
          c.fillStyle = '#fff4c8';
          c.beginPath(); c.ellipse(x + a * .3, y - 4, 5, 9 * s, 0, 0, TAU); c.fill();
        }
        const pd = puddlesOf(Z, L, rx, ry);
        c.fillStyle = 'rgba(220,235,255,.7)';
        for (let k = 0; k < pd.length; k += 2) {
          const x = ox + WL + pd[k] * T + 32, y = oy + WL + pd[k + 1] * T + 34, ph = (Z.now * .5 + k * .37 + rx * .13) % 1;
          if (ph < .7) c.fillRect(x - 16 + ph * 40, y - 1 + Math.sin(ph * 6) * 2, 8 - ph * 6, 2);
        }
      });
      c.restore();
    },

    ambient(Z) {
      const P = Z.P, hw = Z.W / 2 + 80, hh = Z.H / 2 + 80;
      roomsIn(P.x - hw, P.y - hh, P.x + hw, P.y + hh, (rx, ry, ox, oy) => {
        const fs = firesOf(layout(Z, rx, ry));
        for (let k = 0; k < fs.length; k += 2) {
          const x = ox + WL + fs[k] * T + 32, y = oy + WL + fs[k + 1] * T + 32;
          if (Math.abs(x - P.x) > hw || Math.abs(y - P.y) > hh) continue;
          const fl = .8 + .2 * Math.sin(Z.now * 11 + x) * Math.sin(Z.now * 3.7 + y);
          Z.glow('255,130,50', 110 + fl * 25, x, y - 14, .3 + .12 * fl);
          const ep = (Z.now * .8 + x * .003) % 1;
          Z.glow('255,200,90', 6, x + Math.sin(ep * 9 + x) * 10, y - 30 - ep * 50, .8 * (1 - ep));
        }
        // a pair of candles in each room's top-left corner
        const h = H(Z, rx * 31 + 2, ry * 17 - 3);
        if (h < .5) {
          const x = ox + WL + 26 + h * 40, y = oy + WL + 24;
          if (Math.abs(x - P.x) < hw && Math.abs(y - P.y) < hh) Z.glow('255,170,80', 60, x, y - 10, .3 + .08 * Math.sin(Z.now * 9 + h * 40));
        }
      });
    },

    mix: { fly: 5, gaper: 3, head: 1.2, spider: 2 },
    target: 1,

    foes: {
      // "fly" archetype: buzzing black flies in erratic clouds; red variants home in faster.
      fly: { hp: 7, sp: 66, dmg: 5, xp: 1, r: 6, eye: '#ff5040',
        init(e, Z) { e.wa = Z.rnd(0, TAU); if (Z.rnd(0, 1) < .18) makeRed(e); },
        update(e, Z) {
          const dt = Z.dt || 0;
          e.wa = (e.wa || 0) + Z.rnd(-1, 1) * dt * 14;
          const a = Z.angTo(e), j = Math.sin(e.ph * 6 + e.seed * 3) * (e.red ? .35 : 1.1);
          const sp = e.sp, wob = e.red ? .25 : .7;
          Z.move(e, Math.cos(a + j) * sp + Math.cos(e.wa) * sp * wob, Math.sin(a + j) * sp + Math.sin(e.wa) * sp * wob);
          e.ang = a;
        },
        draw(e, Z, w) {
          const c = Z.ctx, r = e.r, f = Math.sin(Z.now * 70 + e.seed * 9);
          c.save(); c.translate(e.x, e.y + Math.sin(e.ph * 9 + e.seed) * 2); c.scale(1.25, 1.25);
          // white wing blurs
          c.lineWidth = 1.5; c.strokeStyle = F(w, OUT); c.fillStyle = F(w, 'rgba(255,255,255,.9)');
          c.beginPath();
          c.ellipse(-r * .85, -r * .6, r * .8, r * (.28 + .3 * Math.abs(f)), -(.55 + f * .35), 0, TAU);
          c.moveTo(r * 1.65, -r * .6); c.ellipse(r * .85, -r * .6, r * .8, r * (.28 + .3 * Math.abs(f)), .55 + f * .35, 0, TAU);
          c.fill(); c.stroke();
          // pale rim so the black body reads on the dark floor
          c.fillStyle = F(w, '#f2e4d8'); c.beginPath(); c.arc(0, 0, r * 1.02, 0, TAU); c.fill(); c.lineWidth = 1.5; c.strokeStyle = F(w, OUT); c.stroke();
          c.fillStyle = F(w, e.red ? '#e01818' : '#120c0c'); c.beginPath(); c.arc(0, 0, r * .8, 0, TAU); c.fill();
          if (!w) {
            c.fillStyle = e.red ? '#ff9a80' : '#5e4e4e'; c.beginPath(); c.arc(-r * .28, -r * .32, r * .2, 0, TAU); c.fill();
            c.fillStyle = e.red ? '#7a0606' : '#3a2c2c'; c.fillRect(-r * .5, r * .2, r, r * .14);
          }
          c.restore();
        } },

      // "gaper" archetype: big-headed, hollow-eyed, gaping-mouthed crier that shambles after you.
      gaper: { hp: 30, sp: 50, dmg: 10, xp: 3, r: 12, eye: false,
        update(e, Z) {
          const shuffle = .65 + .45 * Math.abs(Math.sin(e.ph * 4.2 + e.seed));
          Z.chase(e, e.sp * shuffle);
        },
        draw(e, Z, w) {
          const c = Z.ctx, r = e.r, step = Math.sin(e.ph * 8.4 + e.seed), dir = Math.cos(e.ang || 0) < 0 ? -1 : 1;
          const skin = e.champ ? SKIN_CH : SKIN, dark = e.champ ? '#c84a3e' : '#d7a68c';
          c.save(); c.translate(e.x, e.y - Math.abs(step) * 1.5); c.scale(dir * 1.12, 1.12);
          c.strokeStyle = F(w, OUT); c.lineWidth = 3; c.lineJoin = 'round';
          // stubby legs
          c.fillStyle = F(w, dark);
          c.beginPath();
          c.ellipse(-r * .3 + step * 2, r * .85, r * .2, r * .3, 0, 0, TAU);
          c.moveTo(r * .5 - step * 2, r * .85); c.ellipse(r * .3 - step * 2, r * .85, r * .2, r * .3, 0, 0, TAU);
          c.fill(); c.stroke();
          // pale torso + reaching arms
          c.fillStyle = F(w, skin);
          c.beginPath(); c.ellipse(0, r * .38, r * .5, r * .42, 0, 0, TAU); c.fill(); c.stroke();
          c.beginPath(); c.ellipse(r * .62, r * .2 + step * 1.5, r * .4, r * .16, -.25, 0, TAU); c.fill(); c.stroke();
          // big head
          c.beginPath(); c.arc(0, -r * .42, r * .82, 0, TAU); c.fill(); c.lineWidth = 3.2; c.stroke();
          if (!w) { c.fillStyle = dark; c.beginPath(); c.ellipse(-r * .3, -r * .02, r * .4, r * .2, .3, 0, TAU); c.fill(); }
          hollowFace(c, r * .14, -r * .44, r * .7, w, e.champ);
          c.restore();
        } },

      // "bloated head" archetype: floats at range, swells, then spits bright red tears.
      head: { hp: 40, sp: 34, dmg: 8, xp: 4, r: 14, eye: false,
        init(e, Z) { e.t1 = Z.rnd(1.5, 3.5); e.pref = Z.rnd(200, 270); },
        update(e, Z) {
          const dt = Z.dt || 0, d = Z.dist(e), a = Z.angTo(e);
          const k = d > e.pref + 30 ? 1 : d < e.pref - 40 ? -.7 : 0;
          const side = Math.sin(e.ph * .7 + e.seed) * .5;
          Z.move(e, Math.cos(a) * e.sp * k + Math.cos(a + Math.PI / 2) * e.sp * side, Math.sin(a) * e.sp * k + Math.sin(a + Math.PI / 2) * e.sp * side);
          e.ang = a;
          if ((e.t1 -= dt) <= 0) {
            e.t1 = e.champ ? 2.6 : 3.3;
            if (d < 560) {
              Z.shoot(e.x, e.y, a, 175, { r: 6, dmg: 8, col: RED, life: 4.5 });
              if (e.champ) { Z.shoot(e.x, e.y, a - .3, 175, { r: 6, dmg: 8, col: RED, life: 4.5 }); Z.shoot(e.x, e.y, a + .3, 175, { r: 6, dmg: 8, col: RED, life: 4.5 }); }
              Z.sfx('shoot');
            }
          }
        },
        draw(e, Z, w) {
          const c = Z.ctx, wind = Math.max(0, 1 - (e.t1 || 0) / .7);
          const r = e.r * (1 + Math.sin(e.ph * 3 + e.seed) * .06 + wind * .18);
          c.save(); c.translate(e.x, e.y + Math.sin(e.ph * 2 + e.seed) * 3);
          c.strokeStyle = F(w, OUT); c.lineWidth = 3.4;
          c.fillStyle = F(w, e.champ ? SKIN_CH : '#efc6b2');
          c.beginPath(); c.ellipse(0, 0, r * 1.08, r, 0, 0, TAU); c.fill(); c.stroke();
          if (!w) {
            c.fillStyle = e.champ ? '#c8443a' : '#d39a86'; // bruises
            c.beginPath(); c.arc(-r * .55, -r * .5, r * .18, 0, TAU); c.moveTo(r * .74, r * .3); c.arc(r * .6, r * .3, r * .14, 0, TAU); c.fill();
            c.strokeStyle = '#c0485a'; c.lineWidth = 1.5; // veins
            c.beginPath(); c.moveTo(r * .2, -r * .9); c.lineTo(r * .35, -r * .62); c.lineTo(r * .55, -r * .6); c.stroke();
          }
          // sad sunken eyes with pin-prick pupils
          c.fillStyle = F(w, '#140606');
          c.beginPath(); c.ellipse(-r * .38, -r * .15, r * .22, r * .17, .2, 0, TAU); c.moveTo(r * .6, -r * .15); c.ellipse(r * .38, -r * .15, r * .22, r * .17, -.2, 0, TAU); c.fill();
          if (!w) {
            c.fillStyle = '#ffffff'; c.fillRect(-r * .42, -r * .2, 2, 2); c.fillRect(r * .34, -r * .2, 2, 2);
            c.strokeStyle = '#ff1e1e'; c.lineWidth = 3; c.lineCap = 'round'; // bloody tear streaks
            c.beginPath(); c.moveTo(-r * .4, 0); c.lineTo(-r * .46, r * .55); c.moveTo(r * .4, 0); c.lineTo(r * .46, r * .5); c.stroke();
          }
          // mouth, opens wider and glows red before spitting
          c.fillStyle = F(w, wind > 0 ? '#ff2a1a' : '#1a0606');
          c.beginPath(); c.ellipse(0, r * .48, r * (.26 + wind * .16), r * (.13 + wind * .22), 0, 0, TAU); c.fill();
          c.strokeStyle = F(w, OUT); c.lineWidth = 2.5; c.stroke();
          c.restore();
        } },

      // "spider" archetype: skitters, pauses, then dashes at the hero.
      spider: { hp: 14, sp: 250, dmg: 7, xp: 2, r: 9, eye: '#ff3030',
        init(e, Z) { e.mode = 'pause'; e.mt = Z.rnd(.3, 1); e.da = 0; },
        update(e, Z) {
          const dt = Z.dt || 0;
          e.mt -= dt;
          if (e.mode === 'dash') {
            Z.move(e, Math.cos(e.da) * e.sp, Math.sin(e.da) * e.sp);
            e.ang = e.da;
            if (e.mt <= 0) { e.mode = 'pause'; e.mt = Z.rnd(.45, 1.1); }
          } else {
            Z.move(e, 0, 0);
            if (e.mt <= 0) {
              e.mode = 'dash'; e.mt = Z.rnd(.28, .42);
              e.da = Z.angTo(e) + (Z.dist(e) > 300 ? Z.rnd(-.25, .25) : Z.rnd(-.7, .7));
            }
          }
        },
        draw(e, Z, w) {
          const c = Z.ctx, r = e.r, run = e.mode === 'dash' ? 26 : 5;
          c.save(); c.translate(e.x, e.y); c.rotate(e.ang || 0); c.scale(1.22, 1.22);
          c.lineCap = 'round'; c.lineJoin = 'round';
          c.beginPath();
          for (let i = 0; i < 4; i++) {
            const bx = r * (.35 - i * .25), sw = Math.sin(e.ph * run + i * 1.7) * r * .3;
            for (let s = -1; s <= 1; s += 2) {
              c.moveTo(bx, 0); c.lineTo(bx + sw * s * .5 + r * .1, s * r * 1); c.lineTo(bx + sw * s - r * .25 * (i - 1.5), s * r * 1.6);
            }
          }
          c.strokeStyle = F(w, '#e8d6c8'); c.lineWidth = 5; c.stroke(); // pale rim on legs
          c.strokeStyle = F(w, OUT); c.lineWidth = 2.6; c.stroke();
          c.fillStyle = F(w, '#e8d6c8');
          c.beginPath(); c.ellipse(-r * .3, 0, r * .86, r * .7, 0, 0, TAU); c.moveTo(r * 1.02, 0); c.arc(r * .55, 0, r * .47, 0, TAU); c.fill(); c.lineWidth = 2; c.stroke();
          c.fillStyle = F(w, '#1c1416');
          c.beginPath(); c.ellipse(-r * .3, 0, r * .72, r * .57, 0, 0, TAU); c.moveTo(r * .9, 0); c.arc(r * .55, 0, r * .35, 0, TAU); c.fill();
          if (!w) { c.fillStyle = '#ff2626'; c.beginPath(); c.ellipse(-r * .45, 0, r * .26, r * .18, 0, 0, TAU); c.fill(); }
          c.restore();
        } },
    },

    // Miniboss: an original hopping meat-blob.
    boss: { name: 'Gulpo, the Overfed Lump', hp: 3600, sp: 52, dmg: 22, xp: 0, r: 46, heavy: true, eye: false,
      init(e) { e.st = 'idle'; e.stt = 2; e.k = 0; e.z = 0; e.sq = 1; e.baseDmg = e.dmg; e.hop = 0; e.mouth = 0; },
      update(e, Z) {
        const dt = Z.dt || 0;
        if (!e.st) { e.st = 'idle'; e.stt = 2; e.k = 0; e.z = 0; e.sq = 1; e.baseDmg = e.dmg; e.hop = 0; }
        const rage = e.hp < e.max * .4, cd = rage ? .62 : 1;
        if (rage && !e.raged) {
          e.raged = true; Z.banner('The Lump is livid!', '#ff4a3a', false); Z.shake(10); Z.sfx('boss');
          Z.ring(e.x, e.y, 16, 135, { r: 7, dmg: 8, col: RED });
        }
        e.stt -= dt; e.mouth = Math.max(0, e.mouth - dt * 2);
        const a = Z.angTo(e);
        switch (e.st) {
          case 'idle': {
            e.hop += dt;
            const hs = Math.max(0, Math.sin(e.hop * 5));
            Z.chase(e, e.sp * (rage ? 1.3 : 1) * (.25 + hs));
            e.z = hs * 9; e.sq = 1 + (hs < .1 ? .1 : -hs * .06);
            if (e.stt <= 0) {
              const order = ['leap', 'spray', 'belch', 'leap', 'ring'];
              e.st = order[e.k++ % order.length];
              e.z = 0; e.sq = 1;
              if (e.st === 'leap') { e.stt = .75; Z.sfx('charge'); }
              else if (e.st === 'spray') { e.stt = .55; e.vol = rage ? 4 : 3; Z.sfx('charge'); }
              else if (e.st === 'ring') { e.stt = .65; e.vol = rage ? 3 : 2; Z.sfx('charge'); }
              else { e.stt = .6; }
            }
            break;
          }
          case 'leap': { // wind-up squash, then launch
            Z.move(e, 0, 0);
            e.sq = 1 + .28 * (1 - Math.max(0, e.stt) / .75);
            if (e.stt <= 0) {
              let tx = Z.P.x, ty = Z.P.y; const dx = tx - e.x, dy = ty - e.y, dd = Math.hypot(dx, dy);
              if (dd > 420) { tx = e.x + dx / dd * 420; ty = e.y + dy / dd * 420; }
              e.sx = e.x; e.sy = e.y; e.tx = tx; e.ty = ty; e.air = rage ? .95 : 1.15;
              e.st = 'air'; e.stt = e.air; e.dmg = 0; e.sq = .8;
              Z.hazard(tx, ty, { r: e.r + 36, t: e.air, dmg: 18, col: RED });
              Z.sfx('warn');
            }
            break;
          }
          case 'air': {
            const p = Math.min(1, Math.max(0, 1 - e.stt / (e.air || 1)));
            e.x = e.sx + (e.tx - e.sx) * p; e.y = e.sy + (e.ty - e.sy) * p;
            e.z = Math.sin(p * Math.PI) * 150; e.sq = .82 + p * .1;
            if (e.stt <= 0) {
              e.x = e.tx; e.y = e.ty; e.z = 0; e.sq = 1.35; e.dmg = e.baseDmg;
              Z.shake(12); Z.burst(e.x, e.y, '#c8302a', 26, 220); Z.sfx('nova');
              Z.ring(e.x, e.y, rage ? 14 : 10, 125, { r: 7, dmg: 8, col: RED }, Z.rnd(0, 1));
              e.st = 'idle'; e.stt = 1.5 * cd;
            }
            break;
          }
          case 'spray': { // fans of tears
            Z.move(e, 0, 0); e.mouth = 1;
            if (e.stt <= 0) {
              const n = rage ? 7 : 5, spread = rage ? .9 : .7;
              for (let i = 0; i < n; i++) Z.shoot(e.x, e.y + 8, a - spread / 2 + spread * i / (n - 1), 185, { r: 7, dmg: 8, col: RED, life: 4 });
              Z.sfx('shoot');
              e.vol--; e.stt = .42;
              if (e.vol <= 0) { e.st = 'idle'; e.stt = 1.6 * cd; }
            }
            break;
          }
          case 'ring': { // concentric tear rings
            Z.move(e, 0, 0); e.mouth = 1; e.sq = 1 + Math.sin(e.ph * 20) * .05;
            if (e.stt <= 0) {
              Z.ring(e.x, e.y, 14, 115 + e.vol * 15, { r: 7, dmg: 8, col: RED, life: 5 }, e.vol * .23);
              Z.sfx('nova');
              e.vol--; e.stt = .38;
              if (e.vol <= 0) { e.st = 'idle'; e.stt = 1.7 * cd; }
            }
            break;
          }
          default: { // 'belch': burps up a cloud of flies
            Z.move(e, 0, 0); e.mouth = 1; e.sq = 1 + (1 - Math.max(0, e.stt) / .6) * .15;
            if (e.stt <= 0) {
              const n = rage ? 7 : 5;
              for (let i = 0; i < n; i++) {
                const f = Z.spawn('fly', e.x + Z.rnd(-20, 20), e.y + 10 + Z.rnd(-10, 10));
                if (i % 3 === 0) makeRed(f);
              }
              Z.burst(e.x, e.y + 10, '#4a3a2a', 18, 160); Z.shake(5); Z.sfx('kill');
              e.st = 'idle'; e.stt = 1.6 * cd;
            }
          }
        }
        if (!Number.isFinite(e.x) || !Number.isFinite(e.y)) { e.x = Z.P.x + 300; e.y = Z.P.y; }
      },
      draw(e, Z, w) {
        const c = Z.ctx, R = e.r, z = e.z || 0, sq = e.sq || 1, rage = e.hp < e.max * .4;
        c.save();
        // ground shadow (stays on the floor while it leaps)
        if (!w) { const k = Math.max(.3, 1 - z / 300); c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(e.x, e.y + R * .75, R * k, R * .3 * k, 0, 0, TAU); c.fill(); }
        c.translate(e.x, e.y - z); c.scale(sq, 1 / sq);
        c.lineJoin = 'round';
        // lumpy body
        c.beginPath();
        for (let i = 0; i <= 14; i++) {
          const an = i / 14 * TAU, rr = R * (1 + .07 * Math.sin(i * 2.3 + e.ph * 3) + .04 * Math.sin(i * 5.1));
          const px = Math.cos(an) * rr, py = Math.sin(an) * rr * .9;
          if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
        }
        c.closePath();
        c.fillStyle = F(w, rage ? '#e2382c' : '#e0806c'); c.fill();
        c.strokeStyle = F(w, OUT); c.lineWidth = 5; c.stroke();
        if (!w) {
          c.fillStyle = rage ? '#ff7a66' : '#f4b4a0'; // belly
          c.beginPath(); c.ellipse(-R * .1, R * .25, R * .6, R * .45, 0, 0, TAU); c.fill();
          c.fillStyle = '#9a2a24'; // warts
          c.beginPath(); c.arc(-R * .7, -R * .3, R * .1, 0, TAU); c.moveTo(R * .68, -R * .55); c.arc(R * .6, -R * .55, R * .08, 0, TAU); c.moveTo(R * .82, R * .2); c.arc(R * .75, R * .2, R * .07, 0, TAU); c.fill();
          c.fillStyle = '#e01418'; // blood drips down the chin
          c.fillRect(-R * .3, R * .55, R * .08, R * .25); c.fillRect(R * .25, R * .5, R * .07, R * .18);
          c.strokeStyle = '#2a0e0c'; c.lineWidth = 2.5; // stitches
          c.beginPath(); c.moveTo(R * .2, -R * .75); c.lineTo(R * .55, -R * .35);
          for (let k = 0; k < 4; k++) { const tx = R * (.24 + k * .09), ty = -R * (.7 - k * .1); c.moveTo(tx - 4, ty - 3); c.lineTo(tx + 4, ty + 3); }
          c.stroke();
        }
        // mismatched eyes looking at the hero
        const la = Z.angTo(e), lx = Math.cos(la) * 3, ly = Math.sin(la) * 3;
        c.fillStyle = F(w, '#fbf4e4'); c.strokeStyle = F(w, OUT); c.lineWidth = 3;
        c.beginPath(); c.arc(-R * .35, -R * .35, R * .22, 0, TAU); c.fill(); c.stroke();
        c.beginPath(); c.arc(R * .22, -R * .42, R * .14, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = F(w, rage ? '#ff1010' : '#111');
        c.beginPath(); c.arc(-R * .35 + lx, -R * .35 + ly, R * .09, 0, TAU); c.moveTo(R * .22 + lx * .7 + R * .06, -R * .42 + ly * .7); c.arc(R * .22 + lx * .7, -R * .42 + ly * .7, R * .06, 0, TAU); c.fill();
        // huge mouth
        const open = .14 + (e.mouth || 0) * .16 + Math.sin(e.ph * 2) * .02;
        c.fillStyle = F(w, '#2a0505'); c.lineWidth = 3.5;
        c.beginPath(); c.ellipse(0, R * .22, R * .55, R * open * 1.8, 0, 0, TAU); c.fill(); c.stroke();
        if (!w) {
          c.fillStyle = '#fff6dc'; c.beginPath();
          for (let k = -2; k <= 2; k++) { const tx = k * R * .2; c.moveTo(tx - R * .07, R * .22 - R * open * 1.6); c.lineTo(tx + R * .07, R * .22 - R * open * 1.6); c.lineTo(tx, R * .22 - R * open * .7); }
          c.fill();
          c.fillStyle = '#ff5a7a'; c.beginPath(); c.ellipse(R * .12, R * .22 + R * open, R * .2, R * open * .6, 0, 0, TAU); c.fill();
        }
        c.restore();
      } },

    events: [
      { t: 30, run(Z) {
        Z.banner('The doors slam shut!', '#d8b090', true); Z.shake(9); Z.sfx('warn');
        around(Z, 'fly', 10, 360, (f, i) => { if (i % 4 === 0) makeRed(f); });
      } },
      { t: 34, run(Z) { around(Z, 'fly', 6, 420); around(Z, 'gaper', 4, 460); } },
      { t: 70, run(Z) {
        Z.banner('Something skitters in the walls', '#c09080', false); Z.sfx('warn');
        around(Z, 'spider', 8, 380);
      } },
      { t: 100, run(Z) {
        Z.banner('Champions rise, red with spite', '#ff4a3a', true); Z.shake(8); Z.sfx('boss');
        around(Z, 'gaper', 8, 430, champ);
      } },
      { t: 104, run(Z) { around(Z, 'head', 4, 330, champ); around(Z, 'fly', 6, 400, makeRed); } },
      { t: 128, run(Z) { Z.banner('The cellar weeps', '#ff6a5a', false); around(Z, 'head', 5, 300); around(Z, 'spider', 5, 420); } },
    ],

    music: { bpm: 88, div: 2,
      step(s, t, A) {
        const st = 60 / 88 / 2;
        if (!A.boss) {
          // slow 3/4 waltz: choir, pipe organ, music box
          const bar = Math.floor(s / 6), b = s % 6, ch = CH[bar % 16], barDur = st * 6;
          if (b === 0) {
            A.pad(ch.n, t, barDur * 1.05, .015, { type: 'sawtooth', cutoff: 800 + 300 * Math.sin(bar * .7), q: 6, detune: 12 });
            A.tone(t, ch.b, barDur * .95, .055, { type: 'square', cutoff: 380 });
            A.tone(t, ch.b + 12, barDur * .95, .03, { type: 'sawtooth', cutoff: 620 });
            if (bar % 8 === 0) A.noise(t, barDur * 2, .02, { type: 'bandpass', f: 400, q: 2, f2: 900 });
          }
          if (b === 2 || b === 4) {
            A.tone(t, ch.n[1] - 12, st * 1.6, .016, { type: 'triangle', cutoff: 1400 });
            A.tone(t, ch.n[2] - 12, st * 1.6, .014, { type: 'triangle', cutoff: 1400 });
          }
          const ph = MEL[bar % 16];
          for (const [ms, m] of ph) if (ms === b) {
            const oct = bar % 32 >= 16 ? 12 : 0;
            A.bell(74 + m + oct, t, .045);
            A.tone(t, 86 + m + oct, st * 2.5, .012, { type: 'sine', decay: true });
          }
          // heartbeat creeps in as the run goes on
          if (A.inten > .25 && b === 0) { A.kick(t, .32); }
          if (A.inten > .25 && b === 1) { A.kick(t, .2); }
          if (A.inten > .5 && (b === 2 || b === 4)) A.hat(t, .03, false);
        } else {
          // boss: driving dark organ-rock pulse, 4/4 eighths
          const bar = Math.floor(s / 8), b = s % 8, root = BOSS_CH[bar % 8];
          if (b === 0) {
            A.pad([root + 24, root + 31, root + 36], t, st * 8, .016, { type: 'sawtooth', cutoff: 1100, q: 5, detune: 14 });
          }
          A.tone(t, root, st * .9, .06, { type: 'sawtooth', cutoff: 700, decay: true });
          A.tone(t, root - 12, st * .9, .04, { type: 'square', cutoff: 300, decay: true });
          if (b === 0 || b === 3 || b === 5) A.kick(t, .7);
          if (b === 2 || b === 6) A.snare(t, .3);
          A.hat(t, b % 2 ? .04 : .06, b === 7);
          const arp = root + 36 + BOSS_ARP[(b + bar * 3) % 8];
          A.tone(t, arp, st * .8, .035, { type: 'square', cutoff: 2200, decay: true });
          if (bar % 4 === 3 && b >= 6) A.tom(t, b === 6 ? 140 : 100, .35);
          if (b === 4 && bar % 2 === 1) A.bell(root + 48 + 3, t, .04);
        }
      } },
  };
})());
