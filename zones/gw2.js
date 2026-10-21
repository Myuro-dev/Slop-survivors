// Zone gw2: the brand-scar, a wasteland of the feline war-legions torn open by a crystal dragon's flight. A nod to Guild Wars 2.
ZONES.push((() => {
  const TAU = Math.PI * 2;
  const W = (white, c) => white ? '#fff' : c;
  const face = (c, e) => { const f = Math.cos(e.ang) < 0 ? -1 : 1; c.scale(f, 1); return f; };
  const pl = (p, pts) => { for (let i = 0; i < pts.length; i++) i ? p.lineTo(pts[i][0], pts[i][1]) : p.moveTo(pts[i][0], pts[i][1]); p.closePath(); return p; };

  // Crystal palettes (the only saturated things on the floor)
  const CRY = { o: '#1c0a26', lf: '#b452e6', rf: '#5c1f8c', tl: '#f4c2ff', tr: '#d77af2', hl: 'rgba(255,255,255,.8)' };
  const CRYP = { o: '#24081e', lf: '#e055c8', rf: '#7a1c66', tl: '#ffc8f0', tr: '#f27ad8', hl: 'rgba(255,255,255,.8)' };
  const FACET = ['#4a1c70', '#6a2a96', '#8a3cb8', '#b058d8'];

  // ---------- Floor helpers (ground only: gradients allowed, it is cached) ----------
  const blot = (c, x, y, r, rgb, a) => {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.save(); c.translate(x, y); c.scale(1, .6); c.translate(-x, -y); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
  };
  const shadow = (c, x, y, rx, ry, a = .34) => { c.fillStyle = `rgba(8,5,6,${a})`; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); };
  // One faceted crystal shard standing up from (x, y): light left face, dark right face, two top facets, white edge glints.
  const shard = (c, x, y, h, w, lean, P) => {
    const ax = lean * .72;
    const BL = [x - w, y - w * .2], BM = [x + w * .25, y + w * .32], BR = [x + w, y - w * .28];
    const SL = [x - w * .78 + ax, y - h * .72], SM = [x + w * .22 + ax, y - h * .64], SR = [x + w * .8 + ax, y - h * .74], T = [x + lean, y - h];
    const out = pl(new Path2D(), [BL, SL, T, SR, BR, BM]), rf = pl(new Path2D(), [BM, BR, SR, SM]);
    const tr = pl(new Path2D(), [SM, SR, T]), tl = pl(new Path2D(), [SL, SM, T]), hl = new Path2D();
    hl.moveTo(BM[0], BM[1]); hl.lineTo(SM[0], SM[1]); hl.lineTo(T[0], T[1]); hl.moveTo(SL[0], SL[1] + 2); hl.lineTo(T[0] - .5, T[1] + 1.5);
    c.strokeStyle = P.o; c.lineWidth = 3; c.stroke(out);
    c.fillStyle = P.lf; c.fill(out); c.fillStyle = P.rf; c.fill(rf); c.fillStyle = P.tr; c.fill(tr); c.fillStyle = P.tl; c.fill(tl);
    c.strokeStyle = P.hl; c.lineWidth = 1; c.stroke(hl);
  };
  // Deterministic cluster of shards (shared by ground and ambient so glints sit on real tips)
  const clusterShards = (Z, x, y, n, hmax, spread, sa, sb) => {
    const o = [];
    for (let i = 0; i < n; i++) {
      const a = Z.hash(sa * 7 + i * 3, sb * 5 - i), b = Z.hash(sa * 3 - i * 5, sb * 11 + i * 2), q = Z.hash(sa + i * 13, sb - i * 7);
      const ox = (a - .5) * spread * 2, oy = (b - .5) * spread * .8, cen = 1 - Math.min(1, Math.hypot(ox / spread, oy / spread * 1.6) * .7);
      const h = hmax * (.35 + .65 * cen) * (.7 + q * .3);
      o.push({ x: x + ox, y: y + oy, h, w: Math.max(3, h * (.16 + q * .08)), lean: ox * .25 + (q - .5) * 10 });
    }
    o.sort((p, q) => p.y - q.y);
    return o;
  };
  const drawCluster = (c, list, P) => { for (const s of list) shard(c, s.x, s.y, s.h, s.w, s.lean, P); };

  // ---------- Brand scars: long crystal rifts in two diagonal families ----------
  const FAM = [
    { ux: Math.cos(.36), uy: Math.sin(.36), sp: 620, w0: 36, w1: 34, p: .85, s: 11 },
    { ux: Math.cos(-.95), uy: Math.sin(-.95), sp: 1100, w0: 14, w1: 14, p: .7, s: 29 },
  ];
  const bandOn = (Z, f, k) => Z.hash(k * 7 + f.s, 41) < f.p;
  const vOff = (Z, f, k) => k * f.sp + (Z.hash(k * 3 - f.s, 17) - .5) * f.sp * .35;
  const cvAt = (Z, f, k, u) => vOff(Z, f, k) + Math.sin(u * .0019 + k * 1.7) * 95 + Math.sin(u * .0053 + k * 3.1) * 38;
  const hwAt = (Z, f, k, u) => {
    const g = Math.min(1, Math.max(0, Math.sin(u * .0011 + k * 2.3 + f.s) * 1.8 + .95));
    return (f.w0 + Z.hash(k, f.s * 3) * f.w1) * (.6 + .4 * Math.sin(u * .0034 + k)) * g;
  };
  const scarDist = (Z, x, y) => {
    let best = 1e9;
    for (const f of FAM) {
      const u = x * f.ux + y * f.uy, v = -x * f.uy + y * f.ux, kc = Math.round(v / f.sp);
      for (let k = kc - 1; k <= kc + 1; k++) {
        if (!bandOn(Z, f, k)) continue;
        const w = hwAt(Z, f, k, u); if (w < 5) continue;
        const d = Math.abs(v - cvAt(Z, f, k, u)) - w; if (d < best) best = d;
      }
    }
    return best;
  };
  // Sample every scar touching a rect into runs of points { u, c, w, x, y (centre), lx, ly, rx, ry (jagged edges), mx, my (facet apex) }
  const scarRuns = (Z, x0, y0, x1, y1, step) => {
    const out = [];
    for (const f of FAM) {
      const nx = -f.uy, ny = f.ux;
      let umin = 1e9, umax = -1e9, vmin = 1e9, vmax = -1e9;
      for (const [x, y] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) {
        const u = x * f.ux + y * f.uy, v = x * nx + y * ny;
        umin = Math.min(umin, u); umax = Math.max(umax, u); vmin = Math.min(vmin, v); vmax = Math.max(vmax, v);
      }
      const k0 = Math.floor((vmin - f.sp * .2 - 220) / f.sp), k1 = Math.ceil((vmax + f.sp * .2 + 220) / f.sp);
      for (let k = k0; k <= k1; k++) {
        if (!bandOn(Z, f, k)) continue;
        let run = null;
        const flush = () => { if (run && run.length > 1) out.push({ f, k, pts: run }); run = null; };
        for (let j = Math.floor(umin / step) - 1; j <= Math.ceil(umax / step) + 1; j++) {
          const u = j * step, w = hwAt(Z, f, k, u), cc = cvAt(Z, f, k, u);
          if (w < 5 || cc < vmin - 160 || cc > vmax + 160) { flush(); continue; }
          const jl = (Z.hash(j * 5 + f.s, k * 13 + 1) - .5) * w * .55, jr = (Z.hash(j * 7 - f.s, k * 11 + 3) - .5) * w * .55;
          const ca = cc + (Z.hash(j * 3 + 2, k * 7 - f.s) - .5) * w * .45;
          const P = v => [u * f.ux + v * nx, u * f.uy + v * ny];
          const C = P(cc), L = P(cc - w - jl), R = P(cc + w + jr), Mx = P(ca);
          (run || (run = [])).push({ u, j, c: cc, w, jl, jr, x: C[0], y: C[1], lx: L[0], ly: L[1], rx: R[0], ry: R[1], mx: Mx[0], my: Mx[1] });
        }
        flush();
      }
    }
    return out;
  };
  const band = (path, pts, fl, fr) => {
    for (let i = 0; i < pts.length; i++) { const q = fl(pts[i]); i ? path.lineTo(q[0], q[1]) : path.moveTo(q[0], q[1]); }
    for (let i = pts.length - 1; i >= 0; i--) { const q = fr(pts[i]); path.lineTo(q[0], q[1]); }
    path.closePath();
  };
  const drawScars = (c, Z, runs) => {
    const halo = new Path2D(), rim = new Path2D(), bed = new Path2D(), F = FACET.map(() => new Path2D());
    const hl = new Path2D(), eL = new Path2D(), eR = new Path2D(), seam = new Path2D(), cl = [];
    for (const R of runs) {
      const p = R.pts, f = R.f, nx = -f.uy, ny = f.ux;
      const off = (q, dv) => [q.u * f.ux + dv * nx, q.u * f.uy + dv * ny];
      band(halo, p, q => off(q, q.c - q.w * 1.9 - 28), q => off(q, q.c + q.w * 1.9 + 28));
      band(rim, p, q => off(q, q.c - q.w - q.jl - 7), q => off(q, q.c + q.w + q.jr + 7));
      band(bed, p, q => [q.lx, q.ly], q => [q.rx, q.ry]);
      for (let i = 0; i < p.length - 1; i++) {
        const a = p[i], b = p[i + 1], hA = Z.hash(a.j * 3 + 1, R.k * 7 + f.s), hB = Z.hash(a.j * 3 + 2, R.k * 5 - f.s);
        pl(F[1 + ((hA * 3) | 0)], [[a.lx, a.ly], [b.lx, b.ly], [a.mx, a.my]]);
        pl(F[1 + ((hB * 3) | 0) % 3], [[b.lx, b.ly], [b.mx, b.my], [a.mx, a.my]]);
        pl(F[((hB * 3) | 0)], [[a.mx, a.my], [b.mx, b.my], [b.rx, b.ry]]);
        pl(F[((hA * 2) | 0)], [[a.mx, a.my], [b.rx, b.ry], [a.rx, a.ry]]);
        if (hA > .5) { hl.moveTo(a.lx, a.ly); hl.lineTo(a.mx, a.my); }
        if (hB > .7) { hl.moveTo(a.mx, a.my); hl.lineTo(b.rx, b.ry); }
        eL.moveTo(a.lx, a.ly); eL.lineTo(b.lx, b.ly); eR.moveTo(a.rx, a.ry); eR.lineTo(b.rx, b.ry);
        seam.moveTo(a.mx, a.my); seam.lineTo(b.mx, b.my);
        const hc = Z.hash(a.j * 11 + 5, R.k * 3 + f.s);
        if (a.w > 12 && hc < .2) {
          const side = hc < .1, ex = side ? a.lx : a.rx, ey = side ? a.ly : a.ry;
          cl.push({ x: ex, y: ey, list: clusterShards(Z, ex, ey, 2 + ((hc * 30) | 0) % 3, 22 + a.w * 1.1, 14, a.j, R.k * 7 + f.s), P: hc < .05 || hc > .17 ? CRYP : CRY });
        }
      }
    }
    c.fillStyle = 'rgba(16,10,14,.34)'; c.fill(halo);
    c.fillStyle = 'rgba(10,5,12,.62)'; c.fill(rim);
    c.fillStyle = '#3a1656'; c.fill(bed);
    for (let i = 0; i < 4; i++) { c.fillStyle = FACET[i]; c.fill(F[i]); }
    c.lineWidth = 1; c.strokeStyle = 'rgba(255,225,255,.45)'; c.stroke(hl);
    c.lineWidth = 2.6; c.strokeStyle = '#14081c'; c.stroke(eR); c.stroke(eL);
    c.lineWidth = 1.1; c.strokeStyle = '#e6a8ff'; c.stroke(eL);
    c.lineWidth = 3; c.strokeStyle = 'rgba(255,110,240,.5)'; c.stroke(seam);
    c.lineWidth = 1; c.strokeStyle = '#ffe2ff'; c.stroke(seam);
    cl.sort((a, b) => a.y - b.y);
    for (const k of cl) { shadow(c, k.x + 6, k.y + 3, 18, 6, .3); drawCluster(c, k.list, k.P); }
  };

  // ---------- Set-pieces: one per macro cell, deterministic so ground and ambient agree ----------
  const M = 470;
  const CAMP = 1, TANK = 2, BARR = 3, TREE = 4, BEAST = 5, RUIN = 6, SPIRE = 7, CRATER = 8;
  const piece = (Z, mx, my) => {
    const h = Z.hash(mx * 3 + 11, my * 5 - 7);
    const x = mx * M + M / 2 + (Z.hash(mx * 13 - 1, my * 7 + 4) - .5) * 150;
    const y = my * M + M / 2 + (Z.hash(mx * 17 + 5, my * 11 - 3) - .5) * 150;
    const v = Z.hash(mx * 29 + 2, my * 23 + 9), w = Z.hash(mx * 5 + 1, my * 3 + 8);
    let k = 0;
    if (h < .11) k = CAMP; else if (h < .19) k = TANK; else if (h < .29) k = BARR; else if (h < .41) k = TREE;
    else if (h < .48) k = BEAST; else if (h < .58) k = RUIN; else if (h < .67) k = SPIRE; else if (h < .73) k = CRATER;
    if (k && scarDist(Z, x, y) < 95) k = (k === SPIRE || h < .3) ? SPIRE : 0;
    return { k, x, y, v, w, mx, my };
  };
  const spireList = (Z, p) => clusterShards(Z, p.x, p.y, 5 + ((p.v * 4) | 0), 70 + p.w * 60, 46, p.mx * 3 + 1, p.my * 3 - 2);
  // Light sources { x, y, kind: 0 campfire, 1 wreck fire, 2 embers }
  const lights = p => {
    if (p.k === CAMP) return [{ x: p.x, y: p.y - 2, kind: 0 }];
    if (p.k === TANK) return [{ x: p.x + (p.w < .5 ? -14 : 14), y: p.y - 40, kind: 1 }];
    if (p.k === CRATER) return [{ x: p.x, y: p.y, kind: 2 }];
    return null;
  };

  const banner = (c, Z, x, y, H, sd) => {
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(8,5,5,.35)'; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + H * .5, y + H * .16); c.stroke();
    const pole = new Path2D(); pole.moveTo(x, y); pole.lineTo(x, y - H); pole.moveTo(x - 15, y - H + 6); pole.lineTo(x + 15, y - H + 6);
    c.strokeStyle = '#0e0a0a'; c.lineWidth = 6; c.stroke(pole); c.strokeStyle = '#4e4236'; c.lineWidth = 2.6; c.stroke(pole);
    const fin = pl(new Path2D(), [[x - 3.5, y - H], [x, y - H - 12], [x + 3.5, y - H]]);
    c.strokeStyle = '#0e0a0a'; c.lineWidth = 2; c.stroke(fin); c.fillStyle = '#8e857a'; c.fill(fin);
    const top = y - H + 8, bot = top + 46, b1 = (Z.hash(sd, 3) - .5) * 8;
    const cloth = pl(new Path2D(), [[x - 13, top], [x + 13, top], [x + 13, bot - 8 + b1], [x + 8, bot], [x + 4, bot - 8], [x - 1, bot + 2],
      [x - 6, bot - 6], [x - 10, bot - 1 - b1], [x - 13, bot - 12]]);
    c.strokeStyle = '#0c0606'; c.lineWidth = 3; c.stroke(cloth); c.fillStyle = '#8a1c16'; c.fill(cloth);
    c.save(); c.clip(cloth);
    c.fillStyle = '#1a0f0e'; c.fillRect(x - 13, top, 26, 7); c.fillRect(x - 13, top, 3, 40); c.fillRect(x + 10, top, 3, 40);
    const claw = new Path2D();
    for (let q = 0; q < 3; q++) { const ox = x - 6 + q * 5; pl(claw, [[ox + 2.5, top + 12], [ox + 4.2, top + 13], [ox - 2, top + 34], [ox - 3.2, top + 31]]); }
    c.fillStyle = '#d8c8a2'; c.fill(claw);
    c.fillStyle = 'rgba(14,6,4,.62)'; c.fillRect(x - 14, bot - 15, 28, 20);
    c.fillStyle = '#120808'; c.beginPath(); c.ellipse(x + 4 + b1, top + 26, 2.6, 3.4, 0, 0, TAU); c.fill();
    c.restore(); c.lineCap = 'butt';
  };
  const box3 = (c, x, y, w, d, h, top, front, o = '#16120f') => {
    const tp = new Path2D(), fr = new Path2D();
    tp.rect(x - w / 2, y - d / 2 - h, w, d); fr.rect(x - w / 2, y + d / 2 - h, w, h);
    c.strokeStyle = o; c.lineWidth = 2; c.stroke(fr); c.stroke(tp); c.fillStyle = front; c.fill(fr); c.fillStyle = top; c.fill(tp);
  };
  const STN = { t: '#8a8478', f: '#68635a', d: '#4c4842' };
  const column = (c, x, y, r, h) => {
    const body = new Path2D(); body.ellipse(x, y, r, r * .45, 0, 0, Math.PI); body.lineTo(x - r, y - h); body.lineTo(x + r, y - h); body.closePath();
    c.strokeStyle = '#16120f'; c.lineWidth = 2; c.stroke(body); c.fillStyle = STN.f; c.fill(body);
    c.fillStyle = 'rgba(30,26,22,.35)'; c.fillRect(x + r * .35, y - h, r * .65, h);
    const tp = new Path2D(); tp.ellipse(x, y - h, r, r * .45, 0, 0, TAU);
    c.stroke(tp); c.fillStyle = STN.t; c.fill(tp);
    c.strokeStyle = '#4c4842'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - r * .4, y - h + 3); c.lineTo(x - r * .4, y - 2); c.moveTo(x + r * .1, y - h + 4); c.lineTo(x + r * .1, y); c.stroke();
  };

  const drawCamp = (c, Z, p) => {
    const x = p.x, y = p.y;
    blot(c, x, y, 190, '150,70,30', .16); blot(c, x, y + 4, 80, '12,8,6', .5);
    const bs = p.v < .5 ? [[-74, -34], [70, -30]] : [[-62, -40], [20, -60], [78, -22]];
    for (const [bx, by] of bs) banner(c, Z, x + bx, y + by, 76 + Z.hash(p.mx * 3 + bx, p.my) * 22, p.mx * 7 + bx);
    // supply crates and a bedroll
    box3(c, x + 48, y + 34, 22, 16, 15, '#5e4a36', '#40322a'); box3(c, x + 64, y + 46, 18, 13, 12, '#56442f', '#3a2e25');
    c.fillStyle = '#4a3a30'; c.strokeStyle = '#140e0b'; c.lineWidth = 2; c.beginPath(); c.ellipse(x - 52, y + 32, 22, 8, -.2, 0, TAU); c.fill(); c.stroke();
    c.strokeStyle = '#6a5240'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - 60, y + 28); c.lineTo(x - 56, y + 38); c.moveTo(x - 46, y + 25); c.lineTo(x - 42, y + 35); c.stroke();
    // fire pit: stone ring, ash bed, crossed logs and coals
    c.fillStyle = '#120c0a'; c.beginPath(); c.ellipse(x, y, 21, 11, 0, 0, TAU); c.fill();
    const logs = new Path2D(); logs.moveTo(x - 14, y + 4); logs.lineTo(x + 12, y - 5); logs.moveTo(x - 12, y - 5); logs.lineTo(x + 14, y + 5);
    c.lineCap = 'round'; c.strokeStyle = '#0c0807'; c.lineWidth = 6.5; c.stroke(logs); c.strokeStyle = '#4a3020'; c.lineWidth = 3.8; c.stroke(logs); c.lineCap = 'butt';
    c.fillStyle = '#b8461a'; for (let i = 0; i < 6; i++) c.fillRect(x - 10 + i * 4, y - 2 + (i % 2) * 3, 2.6, 2);
    const st = new Path2D();
    for (let i = 0; i < 11; i++) { const a = i / 11 * TAU, sx = x + Math.cos(a) * 25, sy = y + Math.sin(a) * 14; st.moveTo(sx + 5, sy); st.ellipse(sx, sy, 5, 3.6, a, 0, TAU); }
    c.strokeStyle = '#120d0b'; c.lineWidth = 2.4; c.stroke(st); c.fillStyle = '#6a635a'; c.fill(st);
  };
  const drawTank = (c, Z, p) => {
    const f = p.w < .5 ? 1 : -1;
    c.save(); c.translate(p.x, p.y); c.scale(f, 1);
    blot(c, 0, 8, 140, '10,7,6', .5); shadow(c, 6, 32, 104, 16, .4);
    const lt = new Path2D(); // loose tread strip trailing off the wreck
    for (let i = 0; i < 7; i++) lt.rect(80 + i * 11, 22 + i * 3, 9, 7);
    c.strokeStyle = '#0e0c0b'; c.lineWidth = 2; c.stroke(lt); c.fillStyle = '#2e2a28'; c.fill(lt);
    c.fillStyle = '#211e1c'; c.fillRect(-74, -52, 148, 10);
    const top = pl(new Path2D(), [[-66, -46], [62, -46], [70, -6], [-72, -6]]), fr = pl(new Path2D(), [[-72, -6], [70, -6], [66, 10], [-68, 10]]);
    c.strokeStyle = '#0e0c0b'; c.lineWidth = 3; c.stroke(top); c.stroke(fr); c.fillStyle = '#57504a'; c.fill(top); c.fillStyle = '#3a3532'; c.fill(fr);
    const rust = new Path2D(); rust.ellipse(-36, -24, 18, 8, .2, 0, TAU); rust.ellipse(30, -14, 14, 5, -.1, 0, TAU); rust.ellipse(46, 2, 12, 4, 0, 0, TAU);
    c.fillStyle = 'rgba(122,60,26,.55)'; c.fill(rust);
    c.fillStyle = '#7c1a14'; c.fillRect(-60, -3, 46, 5); c.fillRect(10, -3, 30, 5);
    const rv = new Path2D(); for (let i = 0; i < 13; i++) rv.rect(-62 + i * 10, -43, 2.4, 2.4);
    c.fillStyle = '#7a7268'; c.fill(rv);
    // near tread with road wheels (one missing)
    const tr = new Path2D(); tr.rect(-78, 8, 156, 26);
    c.strokeStyle = '#0a0908'; c.lineWidth = 3; c.stroke(tr); c.fillStyle = '#23201e'; c.fill(tr);
    const seg = new Path2D(); for (let i = 1; i < 17; i++) { seg.moveTo(-78 + i * 9.2, 9); seg.lineTo(-78 + i * 9.2, 33); }
    c.strokeStyle = '#3c3632'; c.lineWidth = 1.4; c.stroke(seg);
    const wh = new Path2D(), hub = new Path2D(), miss = (p.v * 7) | 0;
    for (let i = 0; i < 7; i++) { if (i === miss) continue; const wx = -60 + i * 20; wh.moveTo(wx + 8, 21); wh.arc(wx, 21, 8, 0, TAU); hub.rect(wx - 2, 19, 4, 4); }
    c.strokeStyle = '#0a0908'; c.lineWidth = 2; c.stroke(wh); c.fillStyle = '#4a4540'; c.fill(wh); c.fillStyle = '#1a1716'; c.fill(hub);
    // turret, hatch and the broken, bent barrel
    const bar = new Path2D(); bar.moveTo(12, -34); bar.lineTo(62, -42); bar.lineTo(90, -30);
    c.lineCap = 'round'; c.strokeStyle = '#0c0a09'; c.lineWidth = 11; c.stroke(bar); c.strokeStyle = '#4e4842'; c.lineWidth = 6.5; c.stroke(bar);
    c.strokeStyle = '#7a726a'; c.lineWidth = 1.5; c.save(); c.translate(0, -2); c.stroke(bar); c.restore(); c.lineCap = 'butt';
    const tur = pl(new Path2D(), [[-34, -30], [-24, -44], [8, -44], [18, -30], [10, -18], [-26, -18]]);
    c.strokeStyle = '#0c0a09'; c.lineWidth = 3; c.stroke(tur); c.fillStyle = '#625a52'; c.fill(tur);
    c.fillStyle = '#433d38'; c.fillRect(-28, -24, 40, 6);
    c.fillStyle = '#141010'; c.beginPath(); c.ellipse(-14, -36, 9, 4.5, 0, 0, TAU); c.fill();
    // the brand speared straight through the hull
    drawCluster(c, clusterShards(Z, -44, -16, 3, 58, 14, p.mx * 5 + 3, p.my * 7 + 1), CRY);
    c.restore();
  };
  const drawBarr = (c, Z, p) => {
    const a = (p.v - .5) * .9, dx = Math.cos(a), dy = Math.sin(a), n = 4 + ((p.w * 3) | 0), it = [];
    c.lineCap = 'round'; c.strokeStyle = 'rgba(10,7,6,.3)'; c.lineWidth = 34; c.beginPath();
    c.moveTo(p.x - dx * n * 24, p.y - dy * n * 24 + 4); c.lineTo(p.x + dx * n * 24, p.y + dy * n * 24 + 4); c.stroke();
    for (let i = 0; i < n; i++) { if (Z.hash(p.mx * 7 + i, p.my * 3 - i) < .18) continue; const t = (i - (n - 1) / 2) * 46; it.push([p.x + dx * t, p.y + dy * t, i]); }
    it.sort((q, r) => q[1] - r[1]);
    for (const [cx, cy] of it) {
      const fr = new Path2D(), tip = new Path2D();
      fr.moveTo(cx - 14, cy + 5); fr.lineTo(cx + 12, cy - 24); fr.moveTo(cx + 14, cy + 5); fr.lineTo(cx - 12, cy - 24); fr.moveTo(cx - 22, cy - 9); fr.lineTo(cx + 22, cy - 9);
      pl(tip, [[cx + 10, cy - 21], [cx + 16, cy - 30], [cx + 14, cy - 20]]); pl(tip, [[cx - 10, cy - 21], [cx - 16, cy - 30], [cx - 14, cy - 20]]);
      pl(tip, [[cx + 21, cy - 11], [cx + 30, cy - 9], [cx + 21, cy - 7]]); pl(tip, [[cx - 21, cy - 11], [cx - 30, cy - 9], [cx - 21, cy - 7]]);
      shadow(c, cx + 6, cy + 5, 22, 5, .3);
      c.strokeStyle = '#0c0a0a'; c.lineWidth = 6.5; c.stroke(fr); c.strokeStyle = '#3e3834'; c.lineWidth = 3.4; c.stroke(fr);
      c.strokeStyle = '#7a726a'; c.lineWidth = 1; c.stroke(fr);
      c.strokeStyle = '#0c0a0a'; c.lineWidth = 1.6; c.stroke(tip); c.fillStyle = '#a89c8c'; c.fill(tip);
    }
    c.lineCap = 'butt';
    // a dropped horned legion helm
    const hx = p.x + dy * 40 + 10, hy = p.y - dx * 30 + 26, hm = new Path2D();
    hm.ellipse(hx, hy, 9, 6, 0, Math.PI, TAU); hm.closePath(); hm.moveTo(hx - 7, hy - 3); hm.quadraticCurveTo(hx - 16, hy - 6, hx - 14, hy - 15); hm.lineTo(hx - 10, hy - 6);
    hm.moveTo(hx + 7, hy - 3); hm.quadraticCurveTo(hx + 16, hy - 6, hx + 14, hy - 15); hm.lineTo(hx + 10, hy - 6);
    c.strokeStyle = '#0c0a0a'; c.lineWidth = 2.4; c.stroke(hm); c.fillStyle = '#4e4842'; c.fill(hm);
  };
  const drawTree = (c, Z, p) => {
    const x = p.x, y = p.y, H = 80 + p.v * 50, ln = (p.w - .5) * 22, cry = p.v > .55, P = p.w < .3 ? CRYP : CRY;
    shadow(c, x + 30, y + 4, 56, 11, .3);
    const roots = new Path2D(); roots.moveTo(x - 6, y); roots.quadraticCurveTo(x - 16, y + 2, x - 24, y + 7); roots.moveTo(x + 6, y); roots.quadraticCurveTo(x + 16, y + 1, x + 22, y + 8); roots.moveTo(x, y + 2); roots.lineTo(x + 3, y + 10);
    c.lineCap = 'round'; c.strokeStyle = '#0e0a0a'; c.lineWidth = 6; c.stroke(roots); c.strokeStyle = cry ? P.rf : '#3a3430'; c.lineWidth = 3; c.stroke(roots);
    const tk = pl(new Path2D(), [[x - 10, y], [x - 5 + ln * .5, y - H * .5], [x - 3 + ln, y - H], [x + 3 + ln, y - H], [x + 5 + ln * .5, y - H * .5], [x + 10, y]]);
    const tr = pl(new Path2D(), [[x + 1, y], [x + 1 + ln * .5, y - H * .5], [x + ln, y - H], [x + 3 + ln, y - H], [x + 5 + ln * .5, y - H * .5], [x + 10, y]]);
    c.strokeStyle = '#100a10'; c.lineWidth = 3; c.stroke(tk); c.fillStyle = cry ? P.lf : '#3e3834'; c.fill(tk); c.fillStyle = cry ? P.rf : '#2a2522'; c.fill(tr);
    const br = new Path2D(), tips = [];
    for (let i = 0; i < 4; i++) {
      const t = .42 + i * .15, bx = x + ln * t, by = y - H * t, dir = i % 2 ? 1 : -1, L = 22 + Z.hash(p.mx + i, p.my * 3) * 18, an = .5 + Z.hash(p.mx * 3, p.my + i) * .5;
      const tx = bx + dir * Math.cos(an) * L, ty = by - Math.sin(an) * L;
      br.moveTo(bx, by); br.quadraticCurveTo(bx + dir * L * .5, by - 2, tx, ty); tips.push([tx, ty, dir]);
    }
    c.strokeStyle = '#100a10'; c.lineWidth = 6; c.stroke(br); c.strokeStyle = cry ? P.lf : '#3e3834'; c.lineWidth = 3; c.stroke(br);
    c.strokeStyle = cry ? '#f4c8ff' : '#5e564e'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 7, y - 2); c.lineTo(x - 3 + ln * .9, y - H * .95); c.stroke();
    c.lineCap = 'butt';
    for (const [tx, ty, dir] of tips) shard(c, tx, ty + 4, 14 + Z.hash(tx | 0, ty | 0) * 10, 3.5, dir * 5, P);
    shard(c, x + ln, y - H + 6, 30, 6, ln * .4, P);
    shard(c, x - 12, y + 3, 22, 5, -6, P); shard(c, x + 13, y + 5, 16, 4, 5, P);
  };
  const drawBeast = (c, Z, p) => {
    const f = p.w < .5 ? 1 : -1;
    c.save(); c.translate(p.x, p.y); c.scale(f, 1);
    blot(c, 0, 0, 130, '14,9,10', .42);
    const pts = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12, u = 1 - t; pts.push([u * u * -92 + 2 * u * t * -10 + t * t * 70, u * u * 8 + 2 * u * t * -16 + t * t * 0]); }
    const rib = new Path2D(), vt = new Path2D();
    for (let i = 3; i <= 9; i++) {
      const [sx, sy] = pts[i], k = 1 - Math.abs(i - 6) / 4.5;
      rib.moveTo(sx, sy); rib.quadraticCurveTo(sx + 10, sy - 30 * k, sx + 18, sy - 18 * k);
      rib.moveTo(sx, sy); rib.quadraticCurveTo(sx + 12, sy + 26 * k, sx + 20, sy + 16 * k);
    }
    for (const [sx, sy] of pts) { vt.moveTo(sx + 4, sy); vt.ellipse(sx, sy, 4, 3, 0, 0, TAU); }
    c.lineCap = 'round'; c.strokeStyle = '#141010'; c.lineWidth = 5.5; c.stroke(rib); c.strokeStyle = '#9e9584'; c.lineWidth = 3; c.stroke(rib);
    c.strokeStyle = '#c4bba6'; c.lineWidth = 1; c.stroke(rib);
    c.strokeStyle = '#141010'; c.lineWidth = 2.4; c.stroke(vt); c.fillStyle = '#aaa08e'; c.fill(vt);
    // horned skull and jaw
    const sk = pl(new Path2D(), [[70, -12], [92, -13], [112, -5], [110, 3], [92, 5], [72, 8]]), jw = pl(new Path2D(), [[80, 8], [108, 9], [104, 14], [82, 14]]);
    const hn = new Path2D(); hn.moveTo(76, -11); hn.quadraticCurveTo(62, -22, 56, -38); hn.quadraticCurveTo(68, -28, 84, -12);
    c.strokeStyle = '#141010'; c.lineWidth = 2.6; c.stroke(jw); c.stroke(sk); c.stroke(hn);
    c.fillStyle = '#958c7a'; c.fill(jw); c.fillStyle = '#aaa18e'; c.fill(sk); c.fillStyle = '#c2b89e'; c.fill(hn);
    c.fillStyle = '#16100e'; c.beginPath(); c.ellipse(88, -4, 4, 3, 0, 0, TAU); c.ellipse(104, -2, 1.6, 1.2, 0, 0, TAU); c.fill();
    c.lineCap = 'butt';
    c.fillStyle = '#2a1238'; c.beginPath(); c.ellipse(-6, -6, 26, 9, 0, 0, TAU); c.fill();
    drawCluster(c, clusterShards(Z, -6, -8, 4, 54, 20, p.mx * 9 - 2, p.my * 4 + 5), p.v < .5 ? CRY : CRYP);
    c.restore();
  };
  const drawRuin = (c, Z, p) => {
    const x = p.x, y = p.y, side = p.w < .5 ? -1 : 1;
    const fl = new Path2D(), gap = new Path2D();
    for (let i = -3; i <= 2; i++) for (let j = -2; j <= 2; j++) {
      if (Z.hash(p.mx * 9 + i, p.my * 7 + j) < .2) continue;
      const fx = x + i * 30 + (j % 2) * 12, fy = y + j * 20; fl.rect(fx, fy, 28, 18); gap.moveTo(fx, fy + 18); gap.lineTo(fx + 28, fy + 18);
    }
    c.fillStyle = '#5e594f'; c.fill(fl); c.strokeStyle = '#3a362f'; c.lineWidth = 2; c.stroke(fl); c.strokeStyle = '#78726a'; c.lineWidth = 1; c.stroke(gap);
    c.strokeStyle = '#3a362f'; c.lineWidth = 3; c.beginPath(); c.ellipse(x - 4, y + 6, 40, 20, 0, 0, TAU); c.moveTo(x + 22, y + 6); c.ellipse(x - 4, y + 6, 26, 13, 0, 0, TAU); c.stroke();
    // broken wall run, highest in the middle
    for (let i = 0; i < 5; i++) {
      const hh = Z.hash(p.mx * 5 + i, p.my * 9 - i); if (hh < .15) continue;
      box3(c, x - 70 + i * 27, y - 34, 26, 18, 10 + (1 - Math.abs(i - 2) / 2.5) * 34 * (.5 + hh * .5), STN.t, STN.f);
    }
    column(c, x - side * 64, y + 26, 12, 46 + p.v * 20); column(c, x + side * 56, y + 14, 13, 18);
    // a fallen drum
    const fx = x + side * 8, fy = y + 44;
    c.strokeStyle = '#16120f'; c.lineWidth = 2; c.fillStyle = STN.f; c.beginPath(); c.rect(fx - 22, fy - 10, 40, 20); c.fill(); c.stroke();
    c.fillStyle = STN.t; c.beginPath(); c.ellipse(fx + 18, fy, 6, 10, 0, 0, TAU); c.fill(); c.stroke();
    // crystal swallowing one end
    const cx = x + side * 62, cy = y - 10, cr = new Path2D();
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, b = (i + 1) / 7 * TAU, r1 = 30 + Z.hash(p.mx + i, p.my) * 16, r2 = 30 + Z.hash(p.mx + i + 1, p.my) * 16; pl(cr, [[cx, cy], [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * .5], [cx + Math.cos(b) * r2, cy + Math.sin(b) * r2 * .5]]); }
    c.strokeStyle = '#1c0a26'; c.lineWidth = 2.5; c.stroke(cr); c.fillStyle = '#6a2a96'; c.fill(cr);
    drawCluster(c, clusterShards(Z, cx, cy, 5, 62, 30, p.mx * 4 + 7, p.my * 6 - 3), CRY);
  };
  const drawSpire = (c, Z, p) => {
    blot(c, p.x, p.y, 150, '40,10,52', .45);
    const cr = new Path2D(), cd = new Path2D();
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU, b = (i + 1) / 9 * TAU, r1 = 52 + Z.hash(p.mx * 3 + i, p.my) * 22, r2 = 52 + Z.hash(p.mx * 3 + i + 1, p.my) * 22;
      pl(i % 2 ? cd : cr, [[p.x, p.y], [p.x + Math.cos(a) * r1, p.y + Math.sin(a) * r1 * .45], [p.x + Math.cos(b) * r2, p.y + Math.sin(b) * r2 * .45]]);
    }
    c.strokeStyle = '#1c0a26'; c.lineWidth = 3; c.stroke(cr); c.stroke(cd); c.fillStyle = '#7a34a8'; c.fill(cr); c.fillStyle = '#4a1c70'; c.fill(cd);
    shadow(c, p.x + 30, p.y + 8, 70, 14, .3);
    drawCluster(c, spireList(Z, p), p.v < .35 ? CRYP : CRY);
  };
  const drawCrater = (c, Z, p) => {
    const x = p.x, y = p.y;
    blot(c, x, y, 96, '6,4,4', .85);
    const ej = new Path2D();
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + Z.hash(i, p.mx) * .3, r1 = 66, r2 = 84 + Z.hash(p.my, i) * 34; ej.moveTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1 * .5); ej.lineTo(x + Math.cos(a) * r2, y + Math.sin(a) * r2 * .5); }
    c.lineCap = 'round'; c.strokeStyle = 'rgba(20,14,12,.6)'; c.lineWidth = 4; c.stroke(ej); c.lineCap = 'butt';
    c.strokeStyle = '#16100e'; c.lineWidth = 9; c.beginPath(); c.ellipse(x, y, 64, 31, 0, 0, TAU); c.stroke();
    c.strokeStyle = '#5e544a'; c.lineWidth = 4; c.beginPath(); c.ellipse(x, y - 1, 64, 31, 0, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
    c.fillStyle = '#6a2410'; for (let i = 0; i < 9; i++) c.fillRect(x - 40 + Z.hash(i, p.my) * 80, y - 14 + Z.hash(p.mx, i) * 26, 2.6, 2);
    drawCluster(c, clusterShards(Z, x, y + 2, 3, 46, 12, p.mx * 2 + 9, p.my * 8 - 1), CRYP);
  };
  const DRAW = { [CAMP]: drawCamp, [TANK]: drawTank, [BARR]: drawBarr, [TREE]: drawTree, [BEAST]: drawBeast, [RUIN]: drawRuin, [SPIRE]: drawSpire, [CRATER]: drawCrater };

  // ---------- Ground (cached per chunk): cracked ash plates, charred grass, the brand, the wreckage ----------
  const G = 70, PLATE = ['#4a4440', '#544a42', '#4e4640', '#5a4c40', '#47403c'];
  const V = (Z, i, j) => [i * G + (Z.hash(i * 3 + 1, j * 7 - 2) - .5) * G * .55, j * G + (Z.hash(i * 5 - 3, j * 2 + 9) - .5) * G * .55];
  const ground = (Z, x0, y0, x1, y1) => {
    const c = Z.ctx;
    c.save();
    c.fillStyle = '#2c2522'; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    const sh = PLATE.map(() => new Path2D()), hi = new Path2D(), lo = new Path2D(), crk = new Path2D();
    const straw = new Path2D(), chr = new Path2D(), peb = new Path2D(), fleck = new Path2D(), soot = new Path2D();
    const i0 = Math.floor(x0 / G) - 1, i1 = Math.floor(x1 / G) + 1, j0 = Math.floor(y0 / G) - 1, j1 = Math.floor(y1 / G) + 1;
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const a = V(Z, i, j), b = V(Z, i + 1, j), d = V(Z, i, j + 1), e = V(Z, i + 1, j + 1);
      const mx = (a[0] + b[0] + d[0] + e[0]) / 4, my = (a[1] + b[1] + d[1] + e[1]) / 4;
      const ins = q => [q[0] + (mx - q[0]) * .07, q[1] + (my - q[1]) * .05];
      const A = ins(a), B = ins(b), D = ins(d), E = ins(e);
      const h = Z.hash(i * 7 + 1, j * 9 - 4), h2 = Z.hash(i * 3 - 8, j * 5 + 2), h3 = Z.hash(i * 11 + 5, j * 2 - 13);
      const s0 = (h * 5) | 0;
      if (h2 < .22) { pl(sh[s0], [A, B, E]); pl(sh[(s0 + 2) % 5], [A, E, D]); crk.moveTo(A[0], A[1]); crk.lineTo(E[0], E[1]); }
      else pl(sh[s0], [A, B, E, D]);
      hi.moveTo(D[0], D[1]); hi.lineTo(A[0], A[1]); hi.lineTo(B[0], B[1]);
      lo.moveTo(B[0], B[1]); lo.lineTo(E[0], E[1]); lo.lineTo(D[0], D[1]);
      if (h > .72) { const sx = (A[0] + B[0]) / 2, sy = (A[1] + B[1]) / 2; crk.moveTo(sx, sy); crk.lineTo(sx + (mx - sx) * .5 + (h3 - .5) * 10, sy + (my - sy) * .5); crk.lineTo(mx + (h2 - .5) * 14, my + 6); }
      const sd = scarDist(Z, mx, my);
      if (sd < 80) {
        soot.moveTo(mx + 36, my); soot.ellipse(mx, my, 36, 20, 0, 0, TAU);
        for (let k = 0; k < 3; k++) { const fx = mx + (Z.hash(i * 5 + k, j * 3) - .5) * 60, fy = my + (Z.hash(i * 3, j * 5 + k) - .5) * 60, z = 1.6 + k; pl(fleck, [[fx, fy - z * 1.6], [fx + z, fy], [fx, fy + z * .8], [fx - z, fy]]); }
      } else if (h3 < .34) {
        const tx = mx + (h - .5) * 30, ty = my + (h2 - .5) * 30;
        for (let q = 0; q < 6; q++) {
          const an = -Math.PI / 2 + (Z.hash(i * 13 + q, j * 7 - q) - .5) * 1.6, L = 5 + Z.hash(i + q * 3, j * 11 + q) * 8, bx = tx + (q - 2.5) * 2.2;
          const pth = q % 2 ? chr : straw;
          pth.moveTo(bx, ty); pth.quadraticCurveTo(bx + Math.cos(an) * L * .4, ty + Math.sin(an) * L * .6, bx + Math.cos(an) * L, ty + Math.sin(an) * L);
        }
      }
      if (h3 > .86) { const px = mx + (h2 - .5) * 34, py = my + (h - .5) * 34; peb.moveTo(px + 3.5, py); peb.ellipse(px, py, 3.5, 2.4, 0, 0, TAU); peb.moveTo(px + 9, py + 4); peb.ellipse(px + 7, py + 4, 2, 1.4, 0, 0, TAU); }
    }
    for (let k = 0; k < 5; k++) { c.fillStyle = PLATE[k]; c.fill(sh[k]); }
    c.lineWidth = 1.2; c.strokeStyle = 'rgba(120,108,96,.35)'; c.stroke(hi);
    c.lineWidth = 1.6; c.strokeStyle = 'rgba(20,16,14,.55)'; c.stroke(lo);
    c.lineWidth = 1.3; c.strokeStyle = '#1e1917'; c.stroke(crk);
    // rust bloom and soot, soft
    const GG = 240, gx0 = Math.floor(x0 / GG), gx1 = Math.floor(x1 / GG), gy0 = Math.floor(y0 / GG), gy1 = Math.floor(y1 / GG);
    for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
      const h = Z.hash(gx * 19 - 4, gy * 23 + 6); if (h > .4) continue;
      const x = gx * GG + Z.hash(gx, gy * 5) * GG, y = gy * GG + Z.hash(gx * 5, gy) * GG;
      blot(c, x, y, 70 + h * 240, h < .16 ? '118,62,32' : '12,9,8', h < .16 ? .22 : .32);
    }
    c.fillStyle = 'rgba(14,9,12,.14)'; c.fill(soot);
    c.lineCap = 'round'; c.lineWidth = 1.6; c.strokeStyle = '#6a5a42'; c.stroke(straw); c.strokeStyle = '#1e1814'; c.stroke(chr); c.lineCap = 'butt';
    c.strokeStyle = '#1a1614'; c.lineWidth = 1.2; c.stroke(peb); c.fillStyle = '#6e665c'; c.fill(peb);
    c.fillStyle = '#a04ad0'; c.fill(fleck);
    // the brand itself
    drawScars(c, Z, scarRuns(Z, x0 - 60, y0 - 60, x1 + 60, y1 + 60, 22));
    // set-pieces near the rect, back to front
    const pad = 260, ps = [];
    for (let my = Math.floor((y0 - pad) / M); my <= Math.floor((y1 + pad) / M); my++)
      for (let mx = Math.floor((x0 - pad) / M); mx <= Math.floor((x1 + pad) / M); mx++) {
        const p = piece(Z, mx, my);
        if (p.k && p.x > x0 - pad && p.x < x1 + pad && p.y > y0 - pad && p.y < y1 + pad) ps.push(p);
      }
    ps.sort((a, b) => a.y - b.y);
    for (const p of ps) { c.save(); DRAW[p.k](c, Z, p); c.restore(); }
    c.restore();
  };

  // ---------- Under (every frame): the scars pulse, and purple lightning crawls along them ----------
  let cacheT = -1, cacheRuns = [];
  const nearRuns = Z => {
    if (cacheT !== Z.now) {
      const P = Z.P, hw = Z.W / 2 + 100, hh = Z.H / 2 + 100;
      cacheRuns = scarRuns(Z, P.x - hw, P.y - hh, P.x + hw, P.y + hh, 44); cacheT = Z.now;
    }
    return cacheRuns;
  };
  const under = Z => {
    const c = Z.ctx, t = Z.now, runs = nearRuns(Z);
    if (!runs.length) return;
    const B = [new Path2D(), new Path2D(), new Path2D()], bolt = new Path2D(), fl = Math.floor(t * 14);
    let nb = 0;
    for (const R of runs) {
      const p = R.pts, f = R.f, nx = -f.uy, ny = f.ux;
      for (let i = 0; i < p.length - 1; i++) {
        const a = p[i], b = p[i + 1], k = .5 + .5 * Math.sin(a.u * .008 - t * 2.4 + R.k * 1.3);
        const path = B[k > .8 ? 2 : k > .45 ? 1 : 0]; path.moveTo(a.x, a.y); path.lineTo(b.x, b.y);
      }
      if (nb > 6 || p.length < 6) continue;
      for (let q = 0; q < 2; q++) {
        const cyc = 2.4 + Z.hash(R.k + q, 9) * 1.6, ph = ((t + R.k * 1.3 + q * 1.7) % cyc + cyc) % cyc / cyc;
        if (ph > .4) continue;
        const i0 = Math.floor(ph / .4 * (p.length - 5)), seg = 10;
        nb++;
        for (let s = 0; s <= seg; s++) {
          const fi = i0 + s * 4 / seg, ia = Math.min(p.length - 1, Math.floor(fi)), ib = Math.min(p.length - 1, ia + 1), fr = fi - ia;
          const cx = p[ia].x + (p[ib].x - p[ia].x) * fr, cy = p[ia].y + (p[ib].y - p[ia].y) * fr, w = p[ia].w;
          const o = (Z.hash(fl + s * 7, R.k * 5 + q) - .5) * w * 1.6;
          s ? bolt.lineTo(cx + nx * o, cy + ny * o) : bolt.moveTo(cx + nx * o, cy + ny * o);
        }
      }
    }
    c.save(); c.lineCap = 'round';
    c.globalAlpha = .3; c.strokeStyle = '#9a40d0'; c.lineWidth = 3; c.stroke(B[0]);
    c.globalAlpha = .5; c.strokeStyle = '#d060f0'; c.lineWidth = 4; c.stroke(B[1]);
    c.globalAlpha = .8; c.strokeStyle = '#ff8af4'; c.lineWidth = 5; c.stroke(B[2]);
    c.globalAlpha = .9; c.strokeStyle = '#ffe8ff'; c.lineWidth = 1.4; c.stroke(B[2]);
    if (nb) {
      c.globalAlpha = .55; c.strokeStyle = '#c070ff'; c.lineWidth = 5; c.stroke(bolt);
      c.globalAlpha = 1; c.strokeStyle = '#ffffff'; c.lineWidth = 1.5; c.stroke(bolt);
    }
    c.restore();
  };

  // ---------- Ambient (after darkness): fires, embers, wreck smoke, crystal glow and glints, motes, sky lightning ----------
  const star = (p, x, y, r) => { p.moveTo(x - r, y); p.lineTo(x + r, y); p.moveTo(x, y - r * 1.3); p.lineTo(x, y + r * 1.3); };
  const ambient = Z => {
    const c = Z.ctx, P = Z.P, t = Z.now, hw = Z.W / 2 + 200, hh = Z.H / 2 + 200;
    const fl = new Path2D(), core = new Path2D(), emb = new Path2D(), smoke = new Path2D(), gl = new Path2D(), mote = new Path2D(), mote2 = new Path2D();
    let n = 0;
    c.save();
    for (let my = Math.floor((P.y - hh) / M); my <= Math.floor((P.y + hh) / M); my++)
      for (let mx = Math.floor((P.x - hw) / M); mx <= Math.floor((P.x + hw) / M); mx++) {
        if (n > 40) break;
        const p = piece(Z, mx, my);
        if (p.k === SPIRE) {
          const k = .5 + .5 * Math.sin(t * 1.3 + p.v * 9);
          Z.glow('210,90,255', 90, p.x, p.y - 30, .16 + k * .12); n++;
          const L = spireList(Z, p);
          for (let i = 0; i < L.length; i++) {
            const s = L[i], tw = Math.sin(t * 2.2 + i * 2.1 + p.w * 11);
            if (tw > .55) star(gl, s.x + s.lean, s.y - s.h, 2 + (tw - .55) * 12);
          }
          continue;
        }
        const ls = lights(p); if (!ls) continue;
        for (const Lt of ls) {
          const x = Lt.x, y = Lt.y, f = Math.sin(t * 9 + x * .03) * .5 + Math.sin(t * 23 + y * .05) * .3;
          if (Lt.kind === 0) {
            Z.glow('255,120,40', 100 + f * 6, x, y + 6, .32 + f * .04); Z.glow('255,200,120', 36, x, y - 6, .7); n += 2;
            for (let k = -1; k <= 1; k++) {
              const hgt = (k ? 16 : 26) + f * 5 + Math.sin(t * 14 + k * 2) * 3, bx = x + k * 7;
              fl.moveTo(bx - 6, y); fl.quadraticCurveTo(bx - 4, y - hgt * .6, bx + Math.sin(t * 7 + k) * 3, y - hgt); fl.quadraticCurveTo(bx + 4, y - hgt * .6, bx + 6, y); fl.closePath();
              core.moveTo(bx - 3, y); core.quadraticCurveTo(bx, y - hgt * .7, bx + 3, y); core.closePath();
            }
            for (let i = 0; i < 7; i++) {
              const per = 1.4 + (i % 3) * .4, ph = ((t + i * .37) % per) / per, ex = x + Math.sin(t * 2 + i * 1.7) * (6 + ph * 16), ey = y - 10 - ph * 70;
              emb.rect(ex, ey, 1.8, 1.8);
            }
          } else if (Lt.kind === 1) {
            Z.glow('255,110,40', 64 + f * 4, x, y + 4, .3 + f * .04); n++;
            const hgt = 14 + f * 4 + Math.sin(t * 13 + x) * 2;
            fl.moveTo(x - 6, y); fl.quadraticCurveTo(x - 3, y - hgt * .6, x + Math.sin(t * 8 + y) * 2, y - hgt); fl.quadraticCurveTo(x + 3, y - hgt * .6, x + 6, y); fl.closePath();
            core.moveTo(x - 2.4, y); core.quadraticCurveTo(x, y - hgt * .65, x + 2.4, y); core.closePath();
            for (let i = 0; i < 5; i++) {
              const ph = ((t * .35 + i / 5) % 1), sx = x + Math.sin(t * .8 + i * 2) * 6 + ph * 40, sy = y - 16 - ph * 110, r = 5 + ph * 16;
              smoke.moveTo(sx + r, sy); smoke.arc(sx, sy, r, 0, TAU);
            }
          } else {
            Z.glow('255,90,30', 70, x, y, .22 + f * .06); Z.glow('230,100,255', 60, x, y - 20, .2); n += 2;
            for (let i = 0; i < 4; i++) { const ph = ((t * .6 + i / 4) % 1); emb.rect(x - 30 + Z.hash(i, 5) * 60, y - ph * 50, 1.8, 1.8); }
          }
        }
      }
    // glints along the scars
    const runs = nearRuns(Z);
    let ng = 0;
    for (const R of runs) for (const q of R.pts) {
      if (ng > 26) break;
      const hq = Z.hash(q.j * 3 + 7, R.k * 9 + R.f.s);
      if (hq > .3) continue;
      const tw = Math.sin(t * 2.6 + hq * 60);
      if (tw > .6) { star(gl, q.lx + (q.mx - q.lx) * .5, q.ly + (q.my - q.ly) * .5, 2 + (tw - .6) * 10); ng++; }
    }
    // drifting crystal motes
    for (let i = 0; i < 46; i++) {
      const a = Z.hash(i, 13), b = Z.hash(i, 31), sp = 10 + b * 20, span = Z.H + 160;
      const yy = P.y + Z.H / 2 + 80 - ((t * sp + b * span) % span), xx = P.x - Z.W / 2 - 60 + ((a * Z.W * 1.1 + Math.sin(t * .6 + i) * 24 + t * 4) % (Z.W + 120));
      const z = 1.4 + (i % 3) * .7;
      pl(i % 4 ? mote : mote2, [[xx, yy - z * 1.6], [xx + z, yy], [xx, yy + z * 1.6], [xx - z, yy]]);
    }
    c.globalAlpha = .28; c.fillStyle = '#2a2428'; c.fill(smoke);
    c.globalAlpha = .95; c.fillStyle = '#ff7a1c'; c.fill(fl); c.fillStyle = '#ffe6a0'; c.fill(core);
    c.globalAlpha = .8; c.fillStyle = '#ffa040'; c.fill(emb);
    c.globalAlpha = .6; c.fillStyle = '#d86aff'; c.fill(mote); c.globalAlpha = .85; c.fillStyle = '#fff0ff'; c.fill(mote2);
    c.globalAlpha = .95; c.strokeStyle = '#ffffff'; c.lineWidth = 1.3; c.stroke(gl);
    // the sky over the brand cracks with purple lightning
    const per = 6.5, cyc = Math.floor(t / per), ph = t - cyc * per;
    if (ph < .24 && Z.hash(cyc, 77) < .8) {
      const flick = ph < .06 || (ph > .11 && ph < .17) ? 1 : .35;
      const bx = P.x + (Z.hash(cyc, 3) - .5) * Z.W * .8, ex = bx + (Z.hash(cyc, 4) - .5) * 160, y0 = P.y - Z.H / 2 - 40, y1 = P.y + (Z.hash(cyc, 5) - .3) * Z.H * .6;
      const bl = new Path2D(); let lx = bx, ly = y0; bl.moveTo(lx, ly);
      for (let s = 1; s <= 12; s++) {
        const k = s / 12; lx = bx + (ex - bx) * k + (Z.hash(cyc * 13 + s, 7) - .5) * 60 * (s < 12 ? 1 : 0); ly = y0 + (y1 - y0) * k; bl.lineTo(lx, ly);
        if (s === 5 || s === 8) { bl.lineTo(lx + (Z.hash(cyc, s) - .5) * 140, ly + 70); bl.moveTo(lx, ly); }
      }
      Z.glow('190,110,255', 300, ex, y1, .14 * flick); Z.glow('255,180,255', 90, ex, y1, .5 * flick);
      c.globalAlpha = .5 * flick; c.strokeStyle = '#c27aff'; c.lineWidth = 7; c.stroke(bl);
      c.globalAlpha = .95 * flick; c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.stroke(bl);
    }
    c.restore();
  };

  // ---------- Foes ----------
  const OUT = '#10061a';
  // Brand-sworn warrior: a hulking horned feline legionary, crystal bursting from its back. Lunges with a crystal greatsword, or snipes.
  const FUR = '#9c8a98', FURD = '#4e4058', BELLY = '#d2c4c4', HORN = '#f2e4c4';
  const CRYS = [[-8, -11, -12, -23, 2.8], [-2, -13, -1, -26, 3.2], [4, -14, 8, -22, 2.4], [-12, -5, -20, -11, 2.4]];
  const warrior = {
    hp: 72, sp: 50, dmg: 14, xp: 6, r: 17, eye: false,
    init(e, Z) { e.rifle = e.seed > 4.4; e.cd = Z.rnd(1.2, 3); e.ws = 0; e.lu = 0; e.la = 0; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e);
      if (e.ws > 0) {
        e.ws -= dt; Z.move(e, 0, 0);
        if (e.rifle) { e.la = Z.angTo(e); e.ang = e.la; }
        if (e.ws <= 0) {
          if (e.rifle) { Z.shoot(e.x + Math.cos(e.la) * 22, e.y - 6 + Math.sin(e.la) * 22, e.la, 220, { r: 6, dmg: 8, life: 3.5, col: '255,80,225' }); Z.sfx('shoot'); }
          else e.lu = .28;
        }
        return;
      }
      if (e.lu > 0) { e.lu -= dt; Z.move(e, Math.cos(e.la) * 300, Math.sin(e.la) * 300); e.ang = e.la; return; }
      e.cd -= dt;
      if (e.rifle) {
        const a = Z.angTo(e), k = d > 270 ? 1 : d < 170 ? -.7 : 0, sa = a + (k === 0 ? Math.PI / 2 : 0), m = k === 0 ? .35 * Math.sin(e.ph * .7 + e.seed) : k;
        Z.move(e, Math.cos(sa) * e.sp * m, Math.sin(sa) * e.sp * m); e.ang = a;
        if (e.cd <= 0 && d < 480) { e.cd = Z.rnd(2.8, 3.6); e.ws = .5; }
      } else {
        Z.chase(e, e.sp * (.8 + .35 * Math.max(0, Math.sin(e.ph * 3 + e.seed))));
        if (e.cd <= 0 && d < 125) { e.cd = Z.rnd(2.4, 3.2); e.ws = .45; e.la = Z.angTo(e); }
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 16, O = W(white, OUT), st = Math.sin(e.ph * 7 + e.seed), wind = e.ws > 0, lunge = e.lu > 0;
      c.save(); c.translate(e.x, e.y - Math.abs(st) * 1.2 * s); face(c, e);
      if (lunge) c.rotate(.18); else if (wind && !e.rifle) c.rotate(-.12);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const lg = new Path2D();
      lg.moveTo(-9 * s, 3 * s); lg.quadraticCurveTo(-20 * s, 2 * s + st * 3 * s, -21 * s, -9 * s + st * 2 * s);
      lg.moveTo(-6 * s, 5 * s); lg.lineTo(-9 * s + st * 3 * s, 10 * s); lg.lineTo(-6 * s + st * 4 * s, 15 * s);
      lg.moveTo(4 * s, 6 * s); lg.lineTo(6 * s - st * 3 * s, 10.5 * s); lg.lineTo(4 * s - st * 4 * s, 15 * s);
      c.strokeStyle = O; c.lineWidth = 6 * s; c.stroke(lg); c.strokeStyle = W(white, FURD); c.lineWidth = 3.2 * s; c.stroke(lg);
      const bd = new Path2D();
      bd.moveTo(-12 * s, 5 * s); bd.quadraticCurveTo(-14 * s, -9 * s, -3 * s, -13 * s); bd.quadraticCurveTo(9 * s, -16 * s, 12 * s, -7 * s);
      bd.quadraticCurveTo(13 * s, 4 * s, 6 * s, 8 * s); bd.lineTo(-7 * s, 9 * s); bd.closePath();
      c.strokeStyle = O; c.lineWidth = 3.4; c.stroke(bd); c.fillStyle = W(white, FUR); c.fill(bd);
      if (!white) {
        const bl = new Path2D(); bl.moveTo(3 * s, -4 * s); bl.quadraticCurveTo(10 * s, -3 * s, 8 * s, 5 * s); bl.lineTo(1 * s, 7 * s); bl.closePath();
        c.fillStyle = BELLY; c.fill(bl);
        const sp = new Path2D(); for (let k = 0; k < 3; k++) { sp.moveTo((-10 + k * 4) * s, (-8 + k) * s); sp.lineTo((-8 + k * 4) * s, -2 * s); }
        c.strokeStyle = FURD; c.lineWidth = 1.6 * s; c.stroke(sp);
      }
      // rusted pauldron with legion-red trim
      const pd = pl(new Path2D(), [[1 * s, -14 * s], [10 * s, -13 * s], [11.5 * s, -6 * s], [3 * s, -6 * s]]);
      c.strokeStyle = O; c.lineWidth = 2.6; c.stroke(pd); c.fillStyle = W(white, '#56525e'); c.fill(pd);
      if (!white) { c.fillStyle = '#e8402e'; c.fillRect(3 * s, -7.6 * s, 8.5 * s, 1.6 * s); }
      // crystal erupting from back and shoulder
      const co = new Path2D(), cd = new Path2D(), cl = new Path2D();
      for (const [bx, by, tx, ty, hw] of CRYS) {
        const L = Math.hypot(tx - bx, ty - by) || 1, nx = -(ty - by) / L * hw, ny = (tx - bx) / L * hw;
        pl(co, [[(bx + nx) * s, (by + ny) * s], [tx * s, ty * s], [(bx - nx) * s, (by - ny) * s]]);
        pl(cd, [[bx * s, by * s], [tx * s, ty * s], [(bx - nx) * s, (by - ny) * s]]);
        cl.moveTo((bx + nx * .4) * s, (by + ny * .4) * s); cl.lineTo(tx * s, ty * s);
      }
      c.strokeStyle = O; c.lineWidth = 2.6; c.stroke(co); c.fillStyle = W(white, '#ff5ae0'); c.fill(co);
      if (!white) { c.fillStyle = '#a81cb8'; c.fill(cd); c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.stroke(cl); }
      // weapon
      const wa = e.rifle ? (wind ? -.05 : .1 + st * .05) : wind ? -2.3 : lunge ? .9 : .32 + st * .08;
      c.save(); c.translate(8 * s, -6 * s); c.rotate(wa);
      if (e.rifle) {
        const gun = pl(new Path2D(), [[-7 * s, -2.6 * s], [4 * s, -2 * s], [24 * s, -1.6 * s], [24 * s, 1.6 * s], [4 * s, 2.4 * s], [-6 * s, 3.4 * s]]);
        const mz = pl(new Path2D(), [[23 * s, -3.6 * s], [31 * s, 0], [23 * s, 3.6 * s], [21 * s, 0]]);
        c.strokeStyle = O; c.lineWidth = 2.6; c.stroke(gun); c.stroke(mz); c.fillStyle = W(white, '#3a3640'); c.fill(gun); c.fillStyle = W(white, '#ff6ae8'); c.fill(mz);
        if (wind && !white) Z.glow('255,90,230', 16 * s, 26 * s, 0, .9);
      } else {
        const bl = pl(new Path2D(), [[0, -1.6 * s], [5 * s, -1.6 * s], [5 * s, -4.5 * s], [7 * s, -4.5 * s], [7 * s, -3 * s], [24 * s, -3.4 * s], [31 * s, 0],
          [24 * s, 3.4 * s], [7 * s, 3 * s], [7 * s, 4.5 * s], [5 * s, 4.5 * s], [5 * s, 1.6 * s], [0, 1.6 * s]]);
        c.strokeStyle = O; c.lineWidth = 2.6; c.stroke(bl); c.fillStyle = W(white, '#ff6ae8'); c.fill(bl);
        if (!white) {
          c.fillStyle = '#a42cc8'; c.fillRect(7 * s, 0, 17 * s, 3 * s);
          const eg = new Path2D(); eg.moveTo(7 * s, -2.6 * s); eg.lineTo(24 * s, -2.9 * s); eg.lineTo(30 * s, 0);
          c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.stroke(eg);
        }
      }
      c.restore();
      // head: maned skull, muzzle, ears; four horns
      const mn = pl(new Path2D(), [[8 * s, -21 * s], [1 * s, -18 * s], [4 * s, -15 * s], [-1 * s, -12 * s], [4 * s, -10 * s], [2 * s, -6 * s], [8 * s, -8 * s]]);
      c.strokeStyle = O; c.lineWidth = 2.6; c.stroke(mn); c.fillStyle = W(white, FURD); c.fill(mn);
      const hd = new Path2D(); hd.arc(11 * s, -14 * s, 7 * s, 0, TAU);
      pl(hd, [[14 * s, -18.5 * s], [22.5 * s, -15.5 * s], [22 * s, -10.5 * s], [18 * s, -8.2 * s], [12 * s, -8 * s]]);
      pl(hd, [[6.5 * s, -19 * s], [3.5 * s, -27 * s], [10.5 * s, -20.5 * s]]);
      c.strokeStyle = O; c.lineWidth = 3; c.stroke(hd); c.fillStyle = W(white, FUR); c.fill(hd);
      const hn = new Path2D();
      hn.moveTo(9 * s, -19 * s); hn.quadraticCurveTo(1 * s, -28 * s, -7 * s, -22 * s); hn.quadraticCurveTo(1 * s, -24.5 * s, 6 * s, -17 * s); hn.closePath();
      hn.moveTo(13 * s, -19.5 * s); hn.quadraticCurveTo(15 * s, -27 * s, 10 * s, -31 * s); hn.quadraticCurveTo(18 * s, -28 * s, 16.5 * s, -18.5 * s); hn.closePath();
      c.strokeStyle = O; c.lineWidth = 2.2; c.stroke(hn); c.fillStyle = W(white, HORN); c.fill(hn);
      if (!white) Z.glow('220,120,255', 6 * s, 16 * s, -16 * s, .75);
      c.fillStyle = W(white, '#f8d0ff'); c.fillRect(14.4 * s, -17 * s, 3.6 * s, 2 * s);
      c.fillStyle = W(white, '#1a0c14'); c.fillRect(20.6 * s, -15.6 * s, 2 * s, 1.8 * s);
      c.fillStyle = W(white, '#f4f0e6'); c.fillRect(17 * s, -10 * s, 1.4 * s, 2.2 * s); c.fillRect(19.6 * s, -10.2 * s, 1.2 * s, 1.8 * s);
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#7a5aa0', 10, 100); Z.burst(e.x, e.y - 12, '#f070ff', 8, 130); },
  };

  // Shardhound: lean ash-violet hunting beast with a ridge of crystal spines. Crouches, then leaps.
  const hound = {
    hp: 22, sp: 104, dmg: 8, xp: 2, r: 11, eye: false,
    init(e, Z) { e.cd = Z.rnd(.8, 2.4); e.cr = 0; e.lp = 0; e.la = 0; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e);
      if (e.cr > 0) { e.cr -= dt; Z.move(e, 0, 0); e.la = Z.angTo(e); e.ang = e.la; if (e.cr <= 0) e.lp = .36; return; }
      if (e.lp > 0) { e.lp -= dt; Z.move(e, Math.cos(e.la) * 370, Math.sin(e.la) * 370); e.ang = e.la; return; }
      e.cd -= dt;
      const a = Z.angTo(e) + (d > 120 ? Math.sin(e.ph * 2.6 + e.seed * 2) * .5 : 0);
      Z.move(e, Math.cos(a) * e.sp, Math.sin(a) * e.sp); e.ang = a;
      if (e.cd <= 0 && d < 240 && d > 60) { e.cd = Z.rnd(2.4, 3.4); e.cr = .38; }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 11, O = W(white, OUT), run = e.cr > 0 ? 0 : Math.sin(e.ph * 15 + e.seed), lp = e.lp > 0;
      c.save(); c.translate(e.x, e.y); face(c, e);
      if (e.cr > 0) { c.translate(0, 3 * s); c.scale(1.08, .8); } else if (lp) { c.rotate(-.14); c.scale(1.18, .9); }
      c.lineCap = 'round'; c.lineJoin = 'round';
      const lg = new Path2D(), ex = lp ? 5 : 0;
      lg.moveTo(-8 * s, 0); lg.lineTo((-10 - ex + run * 4) * s, 9 * s); lg.moveTo(-5 * s, 1 * s); lg.lineTo((-4 - ex - run * 4) * s, 9 * s);
      lg.moveTo(4 * s, 0); lg.lineTo((5 + ex - run * 4) * s, 9 * s); lg.moveTo(7 * s, 0); lg.lineTo((9 + ex + run * 4) * s, 8.5 * s);
      lg.moveTo(-11 * s, -2 * s); lg.quadraticCurveTo(-17 * s, -3 * s, -19 * s, (-9 + run * 2) * s);
      c.strokeStyle = O; c.lineWidth = 4.4 * s; c.stroke(lg); c.strokeStyle = W(white, '#2c2240'); c.lineWidth = 2.2 * s; c.stroke(lg);
      const bd = new Path2D();
      bd.moveTo(-12 * s, -1 * s); bd.quadraticCurveTo(-10 * s, -8 * s, -2 * s, -7 * s); bd.lineTo(6 * s, -8 * s); bd.quadraticCurveTo(11 * s, -8 * s, 10 * s, -2 * s);
      bd.quadraticCurveTo(6 * s, 3 * s, -2 * s, 1.5 * s); bd.quadraticCurveTo(-9 * s, 4 * s, -12 * s, -1 * s); bd.closePath();
      pl(bd, [[5 * s, -9 * s], [8 * s, -14 * s], [11 * s, -9.5 * s], [19 * s, -7 * s], [18.5 * s, -3.5 * s], [12 * s, -2.5 * s], [17 * s, (lp ? 1 : -2) * s], [8 * s, -2 * s]]);
      c.strokeStyle = O; c.lineWidth = 3; c.stroke(bd); c.fillStyle = W(white, '#4a3a66'); c.fill(bd);
      const spn = new Path2D(), sh = new Path2D();
      for (let i = 0; i < 5; i++) {
        const bx = (-9 + i * 3.4) * s, by = (-7.2 - (i === 0 ? 0 : .6)) * s, hgt = (5 + (i % 2) * 3 + (i === 2 ? 2 : 0)) * s;
        pl(spn, [[bx - 2 * s, by + s], [bx - 3 * s, by - hgt], [bx + 2 * s, by + s]]); sh.moveTo(bx - 1.6 * s, by); sh.lineTo(bx - 2.8 * s, by - hgt + 1.5 * s);
      }
      c.strokeStyle = O; c.lineWidth = 2; c.stroke(spn); c.fillStyle = W(white, '#ff52dc'); c.fill(spn);
      if (!white) {
        c.strokeStyle = '#ffffff'; c.lineWidth = .9; c.stroke(sh);
        if (e.cr > 0) Z.glow('255,90,230', 24 * s, -2 * s, -12 * s, .85);
        c.fillStyle = '#c8fbff'; c.fillRect(13 * s, -7.6 * s, 2.6 * s, 1.6 * s);
      }
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#ff52dc', 7, 90); },
  };

  // Brandmaw stalker: a crystal-carapaced scorpion beast that keeps its distance and spits shard volleys from its tail.
  const devourer = {
    hp: 44, sp: 46, dmg: 9, xp: 4, r: 14, eye: false,
    init(e, Z) { e.t1 = Z.rnd(1.5, 3); e.cast = 0; },
    update(e, Z) {
      const dt = Z.dt, d = Z.dist(e), a = Z.angTo(e);
      const k = d > 320 ? 1 : d < 200 ? -.8 : .3 * Math.sin(e.ph * .8 + e.seed), sa = a + (d < 320 && d > 200 ? Math.PI / 2 : 0);
      Z.move(e, Math.cos(sa) * e.sp * k, Math.sin(sa) * e.sp * k); e.ang = a;
      e.t1 -= dt; e.cast = e.t1 < .6 ? Math.min(1, 1 - e.t1 / .6) : 0;
      if (e.t1 <= 0) {
        e.t1 = Z.rnd(3, 3.8);
        if (d < 560) { for (let i = -1; i <= 1; i++) Z.shoot(e.x, e.y - 20, a + i * .2, 185, { r: 6, dmg: 8, life: 4, col: '255,90,230' }); Z.sfx('shoot'); }
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 14, O = W(white, OUT), wk = Math.sin(e.ph * 10 + e.seed), cast = e.cast || 0;
      c.save(); c.translate(e.x, e.y); face(c, e);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const lg = new Path2D();
      for (let i = 0; i < 4; i++) { const bx = (-9 + i * 5) * s, w = (i % 2 ? wk : -wk) * 2 * s; lg.moveTo(bx, 2 * s); lg.quadraticCurveTo(bx - 6 * s, -3 * s, bx - 8 * s + w, 10 * s); }
      lg.moveTo(8 * s, 1 * s); lg.lineTo(13 * s, -1 * s); lg.moveTo(8 * s, 3 * s); lg.lineTo(13 * s, 5 * s);
      c.strokeStyle = O; c.lineWidth = 3.6 * s; c.stroke(lg); c.strokeStyle = W(white, '#3a1446'); c.lineWidth = 1.8 * s; c.stroke(lg);
      const pc = new Path2D(), op = Math.max(0, wk) * 2 * s;
      for (const oy of [-1, 5]) { pc.moveTo(12 * s, (oy - 3) * s); pc.quadraticCurveTo(23 * s, (oy - 7) * s - op, 22 * s, oy * s); pc.lineTo(17 * s, (oy - 1) * s); pc.quadraticCurveTo(17 * s, (oy - 3.5) * s, 13 * s, (oy - 1) * s); pc.closePath(); }
      c.strokeStyle = O; c.lineWidth = 2.6; c.stroke(pc); c.fillStyle = W(white, '#b03ad0'); c.fill(pc);
      const bd = new Path2D(); bd.ellipse(-8 * s, 1 * s, 7 * s, 5.5 * s, 0, 0, TAU); bd.moveTo(6.5 * s, 0); bd.ellipse(-1 * s, 0, 7.5 * s, 6 * s, 0, 0, TAU); bd.moveTo(13 * s, 0); bd.ellipse(7 * s, 0, 6 * s, 5 * s, 0, 0, TAU);
      c.strokeStyle = O; c.lineWidth = 3; c.stroke(bd); c.fillStyle = W(white, '#8a2cb4'); c.fill(bd);
      if (!white) {
        const lt = new Path2D(); pl(lt, [[-13 * s, -1 * s], [-9 * s, -4.5 * s], [-4 * s, -1 * s]]); pl(lt, [[-6 * s, -2 * s], [-1 * s, -5.6 * s], [4 * s, -2 * s]]); pl(lt, [[3 * s, -1.5 * s], [7 * s, -4.6 * s], [11 * s, -1.5 * s]]);
        c.fillStyle = '#e07cff'; c.fill(lt); c.fillStyle = '#4e1670'; c.fillRect(-14 * s, 3 * s, 25 * s, 2.2 * s);
      }
      // arched segmented tail ending in a crystal stinger
      const tl = new Path2D(), sx = -2 * s - cast * 3 * s, sy = -21 * s + cast * 2 * s;
      for (let i = 0; i < 5; i++) {
        const t = i / 5, u = 1 - t, x = u * u * -13 * s + 2 * u * t * -24 * s + t * t * sx, y = u * u * -1 * s + 2 * u * t * -24 * s + t * t * sy, r = (4.6 - i * .4) * s;
        tl.moveTo(x + r, y); tl.arc(x, y, r, 0, TAU);
      }
      c.strokeStyle = O; c.lineWidth = 2.6; c.stroke(tl); c.fillStyle = W(white, '#9a38c0'); c.fill(tl);
      if (!white) Z.glow('255,100,230', (14 + cast * 16) * s, sx + 2 * s, sy - 2 * s, .55 + cast * .4);
      const sg = pl(new Path2D(), [[sx - 3 * s, sy - 5 * s], [sx + 8 * s, sy - 1 * s], [sx + 1 * s, sy + 5 * s], [sx - 4 * s, sy]]);
      c.strokeStyle = O; c.lineWidth = 2.4; c.stroke(sg); c.fillStyle = W(white, cast > .5 ? '#ffd0ff' : '#ff6ae8'); c.fill(sg);
      if (!white) {
        const eg = new Path2D(); eg.moveTo(sx - 2.5 * s, sy - 4 * s); eg.lineTo(sx + 7 * s, sy - 1 * s);
        c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.stroke(eg);
        c.fillStyle = '#ffe86a'; c.fillRect(9 * s, -3 * s, 1.8 * s, 1.8 * s); c.fillRect(11.5 * s, -2.4 * s, 1.6 * s, 1.6 * s);
      }
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#b03ad0', 12, 110); },
  };

  // Shardling: a floating, spinning crystal geode with one eye. Some burst into a ring of shards when broken.
  const shardling = {
    hp: 12, sp: 70, dmg: 6, xp: 1, r: 10, eye: false,
    update(e, Z) { const d = Z.dist(e), a = Z.angTo(e) + (d > 80 ? Math.sin(e.ph * 2 + e.seed * 3) * .4 : 0); Z.move(e, Math.cos(a) * e.sp, Math.sin(a) * e.sp); e.ang = a; },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 10, O = W(white, OUT), spin = Math.cos(e.ph * 3 + e.seed), bob = Math.sin(e.ph * 4 + e.seed) * 2 * s;
      c.save(); c.translate(e.x, e.y + bob);
      if (!white) Z.glow('210,100,255', 18 * s, 0, 8 * s - bob, .45);
      const wd = 8 * s, mx = spin * wd * .6, T = [0, -13 * s], L = [-wd, -2 * s], R = [wd, -2 * s], B = [0, 10 * s], Mm = [mx, -1 * s];
      const out = pl(new Path2D(), [T, R, B, L]);
      c.strokeStyle = O; c.lineWidth = 2.6; c.stroke(out); c.fillStyle = W(white, '#c050f0'); c.fill(out);
      if (!white) {
        c.fillStyle = '#f4b4ff'; c.fill(pl(new Path2D(), [T, L, Mm]));
        c.fillStyle = '#5e1a8a'; c.fill(pl(new Path2D(), [Mm, R, B]));
        const hl = new Path2D(); hl.moveTo(T[0], T[1]); hl.lineTo(Mm[0], Mm[1]); hl.lineTo(B[0], B[1]);
        c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1; c.stroke(hl);
        c.fillStyle = '#1a0622'; c.fillRect(mx - 3 * s, -4 * s, 6 * s, 3 * s);
        c.fillStyle = '#fff2a0'; c.fillRect(mx - 1 * s, -3.6 * s, 2 * s, 2.2 * s);
        const ch = new Path2D(), oa = e.ph * 2.5 + e.seed;
        for (let i = 0; i < 2; i++) { const a = oa + i * Math.PI, x = Math.cos(a) * 13 * s, y = Math.sin(a) * 5 * s; pl(ch, [[x, y - 3 * s], [x + 2 * s, y], [x, y + 3 * s], [x - 2 * s, y]]); }
        c.fillStyle = '#f6c8ff'; c.fill(ch);
      }
      c.restore();
    },
    death(e, Z) {
      Z.burst(e.x, e.y, '#d070ff', 8, 110);
      if (e.seed < 2.4) Z.ring(e.x, e.y, 6, 125, { r: 5, dmg: 6, life: 1.4, col: '235,120,255' }, e.seed);
    },
  };

  // ---------- Miniboss: Ysmarrok, Prism-Tyrant of the Brand ----------
  const BSEQ = ['breath', 'wave', 'rain', 'summon', 'breath', 'rain', 'wave', 'summon'];
  const mouth = (e, s) => { const f = Math.cos(e.ang) < 0 ? -1 : 1; return [e.x + f * 78 * s, e.y - 48 * s]; };
  const start = (e, Z, p) => {
    if (p === 'breath') { e.st = 'breathW'; e.mt = 1; e.ba = Z.angTo(e); e.ang = e.ba; Z.sfx('charge'); }
    else if (p === 'wave') { e.st = 'waveW'; e.mt = .8; e.wa = Z.angTo(e); e.ang = e.wa; Z.sfx('warn'); }
    else if (p === 'rain') {
      const P = Z.P, n = e.enr ? 8 : 6;
      Z.hazard(P.x, P.y, { r: 62, t: 1.05, dmg: 14, col: '230,110,255' });
      for (let i = 0; i < n; i++) { const a = i / n * TAU + e.ph; Z.hazard(P.x + Math.cos(a) * 125, P.y + Math.sin(a) * 125, { r: 52, t: 1.25 + (i % 3) * .2, dmg: 14, col: '230,110,255' }); }
      e.r2 = 1.3; Z.sfx('warn'); e.st = 'recover'; e.mt = 1;
    } else { e.st = 'summonW'; e.mt = .9; Z.sfx('boss'); Z.shake(4); }
  };
  const boss = {
    name: 'Ysmarrok, Prism-Tyrant of the Brand', hp: 3800, sp: 52, dmg: 24, xp: 0, r: 50, heavy: true, eye: false,
    init(e, Z) {
      e.st = 'move'; e.aw = 2.4; e.pi = 0; e.enr = false; e.ba = 0; e.bt = 0; e.mt = 0; e.wa = 0; e.r2 = -1;
      Z.banner('Event: Slay the Prism-Tyrant before the brand spreads', '#ff7ae8', false);
    },
    update(e, Z) {
      const dt = Z.dt, s = e.r / 50;
      if (!e.enr && e.hp < e.max * .4) {
        e.enr = true; Z.banner('The Tyrant\'s hide splits with light. It is enraged!', '#ff4fd0', true); Z.shake(10); Z.sfx('boss');
        Z.ring(e.x, e.y, 18, 120, { r: 7, dmg: 10, col: '255,90,230' }, e.ph);
      }
      if (e.r2 >= 0 && (e.r2 -= dt) < 0) { // second volley of crystal rain lands where the hero fled
        const P = Z.P, n = e.enr ? 6 : 4; e.r2 = -1;
        Z.hazard(P.x, P.y, { r: 58, t: 1, dmg: 14, col: '255,120,240' });
        for (let i = 0; i < n; i++) { const a = i / n * TAU + .4; Z.hazard(P.x + Math.cos(a) * 150, P.y + Math.sin(a) * 150, { r: 50, t: 1.2, dmg: 14, col: '255,120,240' }); }
      }
      switch (e.st) {
        case 'move':
          if (Z.dist(e) > 170) Z.chase(e, e.sp * (e.enr ? 1.3 : 1)); else { Z.move(e, 0, 0); e.ang = Z.angTo(e); }
          if ((e.aw -= dt) <= 0) start(e, Z, BSEQ[e.pi++ % BSEQ.length]);
          break;
        case 'breathW': {
          Z.move(e, 0, 0);
          let df = Z.angTo(e) - e.ba; df = Math.atan2(Math.sin(df), Math.cos(df)); e.ba += df * Math.min(1, dt * 2.5); e.ang = e.ba;
          if ((e.mt -= dt) <= 0) { e.st = 'breath'; e.mt = 1.4; e.bt = 0; }
          break;
        }
        case 'breath': {
          Z.move(e, 0, 0); e.ang = e.ba;
          if ((e.bt -= dt) <= 0) {
            e.bt = .08;
            const prog = 1 - e.mt / 1.4, base = e.ba + Math.sin(prog * TAU) * .4, [hx, hy] = mouth(e, s);
            for (let i = 0; i < (e.enr ? 3 : 2); i++) Z.shoot(hx, hy, base + Z.rnd(-.12, .12), 210 + Z.rnd(-20, 20), { r: 7, dmg: 10, life: 2.6, col: '255,110,235' });
          }
          if ((e.mt -= dt) <= 0) { e.st = 'recover'; e.mt = .7; }
          break;
        }
        case 'waveW':
          Z.move(e, 0, 0); e.ang = e.wa;
          if ((e.mt -= dt) <= 0) { // the brand wave: rows of crystal eruptions marching outward
            const a = e.wa, px = -Math.sin(a), py = Math.cos(a), half = e.enr ? 3 : 2;
            for (let i = 1; i <= 7; i++) {
              const d = 40 + i * 64;
              for (let q = -half; q <= half; q++) Z.hazard(e.x + Math.cos(a) * d + px * q * 66, e.y + Math.sin(a) * d + py * q * 66, { r: 36, t: .45 + i * .16, dmg: 14, col: '255,80,220' });
            }
            Z.shake(8); Z.sfx('nova'); Z.burst(e.x, e.y + 30, '#ff7ae8', 18, 200); e.st = 'recover'; e.mt = .9;
          }
          break;
        case 'summonW':
          Z.move(e, 0, 0); e.ang = Z.angTo(e);
          if ((e.mt -= dt) <= 0) {
            const crowd = Z.foes().length > 220, n = crowd ? 2 : e.enr ? 6 : 4;
            for (let i = 0; i < n; i++) { const a = i / n * TAU + e.ph; Z.spawn(i % 2 ? 'hound' : 'warrior', e.x + Math.cos(a) * 90, e.y + Math.sin(a) * 90); }
            Z.burst(e.x, e.y, '#c58cff', 22, 180); Z.sfx('star'); e.st = 'recover'; e.mt = .8;
          }
          break;
        default:
          Z.move(e, 0, 0); e.ang = Z.angTo(e);
          if ((e.mt -= dt) <= 0) { e.st = 'move'; e.aw = e.enr ? 1.2 : 2; }
      }
    },
    draw(e, Z, white) {
      const c = Z.ctx, s = e.r / 50, O = W(white, '#0c0414'), enr = e.enr, now = Z.now;
      const fl = Math.sin(e.ph * (enr ? 4 : 2.4)) * 8, breath = e.st === 'breathW' || e.st === 'breath';
      const HIDE = enr ? '#7a2aa8' : '#6a2ea4', HL = enr ? '#ff8af0' : '#e07cff';
      const sp = pts => { const p = new Path2D(); for (let i = 0; i < pts.length; i++) i ? p.lineTo(pts[i][0] * s, pts[i][1] * s) : p.moveTo(pts[i][0] * s, pts[i][1] * s); p.closePath(); return p; };
      const spAdd = (p, pts) => { for (let i = 0; i < pts.length; i++) i ? p.lineTo(pts[i][0] * s, pts[i][1] * s) : p.moveTo(pts[i][0] * s, pts[i][1] * s); p.closePath(); return p; };
      if (!white) {
        if (breath) { // breath cone from the jaws
          const [hx, hy] = mouth(e, s), cone = new Path2D();
          cone.moveTo(hx, hy); cone.arc(hx, hy, 380, e.ba - .55, e.ba + .55); cone.closePath();
          c.save(); c.globalAlpha = e.st === 'breathW' ? .12 + .22 * Math.max(0, Math.min(1, 1 - e.mt)) : .1; c.fillStyle = '#e07cff'; c.fill(cone);
          c.globalAlpha = .7; c.strokeStyle = '#ffd2ff'; c.lineWidth = 2; c.stroke(cone); c.restore();
        }
        if (e.st === 'waveW') { // lane of the coming brand wave
          const k = Math.max(0, Math.min(1, 1 - e.mt / .8)), wd = ((enr ? 3 : 2) * 2 + 1) * 66;
          c.save(); c.translate(e.x, e.y); c.rotate(e.wa);
          c.globalAlpha = .12 + .25 * k; c.fillStyle = '#ff50d0'; c.fillRect(60, -wd / 2, 470, wd);
          c.globalAlpha = .7; c.strokeStyle = '#ffb0f0'; c.lineWidth = 2; c.strokeRect(60, -wd / 2, 470, wd); c.restore();
        }
        if (enr) Z.glow('255,70,220', 150 * s, e.x, e.y - 20 * s, .3 + .1 * Math.sin(now * 6));
      }
      c.save(); c.translate(e.x, e.y + Math.sin(e.ph * 2) * 2 * s); face(c, e);
      if (e.st === 'waveW') c.translate(0, -6 * s * Math.max(0, 1 - e.mt / .8));
      if (e.st === 'summonW') c.translate(Math.sin(now * 40) * 2 * s, 0);
      c.lineJoin = 'round'; c.lineCap = 'round';
      // far wing
      const fwp = sp([[-4, -24], [-10, -60 + fl], [-22, -100 + fl], [-34, -72 + fl], [-44, -92 + fl * .8], [-52, -58 + fl * .7], [-66, -68 + fl * .6], [-66, -40 + fl * .4], [-82, -38 + fl * .3], [-58, -18], [-28, -14]]);
      c.strokeStyle = O; c.lineWidth = 4; c.stroke(fwp); c.fillStyle = W(white, '#3e1462'); c.fill(fwp);
      // tail with crystal spikes
      const tl = sp([[-30, 2], [-58, 6], [-86, 0], [-114, -12], [-90, 12], [-60, 22], [-30, 22]]);
      c.lineWidth = 4; c.stroke(tl); c.fillStyle = W(white, '#5a2690'); c.fill(tl);
      const ts = new Path2D(); spAdd(ts, [[-50, 6], [-57, -10], [-63, 6]]); spAdd(ts, [[-74, 3], [-82, -12], [-87, 2]]); spAdd(ts, [[-112, -10], [-128, -22], [-108, -1]]);
      c.lineWidth = 2.5; c.stroke(ts); c.fillStyle = W(white, '#ff5ae0'); c.fill(ts);
      // far legs
      const flg = sp([[-22, 10], [-12, 10], [-10, 32], [-2, 37], [-20, 37], [-24, 24]]); spAdd(flg, [[14, 6], [22, 6], [26, 32], [32, 37], [16, 37], [16, 20]]);
      c.lineWidth = 3.5; c.stroke(flg); c.fillStyle = W(white, '#3e1462'); c.fill(flg);
      // body
      const bd = sp([[-40, -6], [-30, -28], [-6, -36], [18, -30], [30, -18], [34, 4], [24, 22], [-8, 26], [-34, 20]]);
      c.lineWidth = 5; c.stroke(bd); c.fillStyle = W(white, HIDE); c.fill(bd);
      if (!white) {
        c.fillStyle = '#a060cc'; c.fill(sp([[-32, 12], [-8, 16], [22, 12], [24, 20], [-8, 25], [-32, 19]]));
        const lt = new Path2D(), dk = new Path2D(), hl = new Path2D();
        spAdd(lt, [[-28, -20], [-14, -30], [-8, -14], [-22, -6]]); spAdd(lt, [[6, -12], [2, -30], [18, -24], [20, -8]]);
        spAdd(dk, [[-8, -14], [-14, -30], [2, -30], [6, -12]]); spAdd(dk, [[-22, -6], [-8, -14], [6, -12], [-4, 4]]);
        hl.moveTo(-28 * s, -20 * s); hl.lineTo(-14 * s, -30 * s); hl.lineTo(2 * s, -30 * s); hl.lineTo(18 * s, -24 * s);
        c.fillStyle = HL; c.fill(lt); c.fillStyle = '#9a2ec0'; c.fill(dk);
        c.strokeStyle = '#ffffff'; c.lineWidth = 1.4; c.stroke(hl);
      }
      // dorsal and neck crystal spines
      const SPN = [[-34, -22, -48, -46], [-24, -30, -32, -64], [-12, -34, -14, -72], [0, -35, 4, -64], [12, -32, 20, -52], [32, -44, 26, -60], [40, -56, 34, -72]];
      const sl = new Path2D(), sdk = new Path2D(), shl = new Path2D();
      for (const [bx, by, tx, ty] of SPN) {
        spAdd(sl, [[bx - 6, by + 2], [tx, ty], [bx + 6, by + 2]]); spAdd(sdk, [[bx, by + 2], [tx, ty], [bx + 6, by + 2]]);
        shl.moveTo((bx - 3) * s, by * s); shl.lineTo(tx * s, ty * s);
      }
      c.strokeStyle = O; c.lineWidth = 3; c.stroke(sl); c.fillStyle = W(white, '#ff70e6'); c.fill(sl);
      if (!white) { c.fillStyle = '#b02cc0'; c.fill(sdk); c.strokeStyle = '#ffffff'; c.lineWidth = 1.2; c.stroke(shl); }
      // near wing: big faceted crystal membrane
      const nw = [[6, -26], [2, -70 + fl], [-6, -118 + fl], [-18, -86 + fl], [-30, -112 + fl * .8], [-38, -74 + fl * .7], [-54, -92 + fl * .6], [-56, -54 + fl * .4], [-76, -56 + fl * .3], [-50, -30], [-20, -22]];
      const nwp = sp(nw);
      c.strokeStyle = O; c.lineWidth = 4.5; c.stroke(nwp); c.fillStyle = W(white, '#8a3cc8'); c.fill(nwp);
      if (!white) {
        const fa = new Path2D(), fb = new Path2D(), bn = new Path2D();
        for (let i = 1; i < nw.length - 1; i++) spAdd(i % 2 ? fa : fb, [nw[0], nw[i], nw[i + 1]]);
        for (const i of [2, 4, 6, 8]) { bn.moveTo(nw[0][0] * s, nw[0][1] * s); bn.lineTo(nw[i][0] * s, nw[i][1] * s); }
        c.fillStyle = '#d878f6'; c.fill(fa); c.fillStyle = '#6e2aa0'; c.fill(fb);
        c.strokeStyle = '#ffd8ff'; c.lineWidth = 1.6; c.stroke(bn);
      }
      // near legs and claws
      const lg = sp([[-26, 0], [-8, -2], [-4, 18], [-6, 32], [4, 38], [-18, 38], [-24, 24]]); spAdd(lg, [[16, 0], [28, -2], [30, 20], [38, 34], [40, 38], [22, 38], [22, 20]]);
      c.strokeStyle = O; c.lineWidth = 4; c.stroke(lg); c.fillStyle = W(white, HIDE); c.fill(lg);
      const cw = new Path2D(); for (const fx of [-16, -9, -2, 24, 31, 38]) spAdd(cw, [[fx, 36], [fx + 3, 43], [fx + 5, 36]]);
      c.lineWidth = 2; c.stroke(cw); c.fillStyle = W(white, '#ffd0ff'); c.fill(cw);
      // neck
      const nk = sp([[16, -26], [30, -40], [38, -56], [50, -60], [52, -46], [40, -30], [30, -8]]);
      c.lineWidth = 4.5; c.stroke(nk); c.fillStyle = W(white, HIDE); c.fill(nk);
      // head, jaw, horns
      const jaw = breath ? (e.st === 'breath' ? 1 : .5) : 0;
      const jw = sp([[48, -48], [76, -46 + jaw * 8], [74, -40 + jaw * 9], [52, -40 + jaw * 4]]);
      if (jaw && !white) { c.fillStyle = '#ffd0ff'; c.fill(sp([[50, -50], [78, -50], [74, -44 + jaw * 7], [52, -44 + jaw * 3]])); Z.glow('255,120,240', 40 * s, 66 * s, -46 * s, .9); }
      c.lineWidth = 3.5; c.stroke(jw); c.fillStyle = W(white, '#5a2690'); c.fill(jw);
      const hd = sp([[38, -60], [50, -68], [66, -64], [80, -56], [78, -50], [60, -50], [46, -46]]);
      c.lineWidth = 4; c.stroke(hd); c.fillStyle = W(white, '#7a36b8'); c.fill(hd);
      if (!white) { c.fillStyle = '#c060ec'; c.fill(sp([[50, -68], [66, -64], [62, -58], [46, -60]])); }
      const hn = new Path2D();
      spAdd(hn, [[46, -66], [36, -84], [20, -106], [32, -82], [40, -62]]); spAdd(hn, [[56, -66], [54, -88], [46, -112], [62, -88], [62, -64]]);
      spAdd(hn, [[62, -64], [67, -78], [69, -62]]); spAdd(hn, [[69, -62], [76, -71], [75, -58]]);
      c.lineWidth = 3; c.stroke(hn); c.fillStyle = W(white, '#ff70e6'); c.fill(hn);
      if (!white) {
        const hh = new Path2D(); hh.moveTo(40 * s, -64 * s); hh.lineTo(20 * s, -106 * s); hh.moveTo(57 * s, -66 * s); hh.lineTo(46 * s, -112 * s);
        c.strokeStyle = '#ffffff'; c.lineWidth = 1.4; c.stroke(hh);
        Z.glow(enr ? '255,220,90' : '255,140,250', 20 * s, 64 * s, -59 * s, .95);
        Z.glow('255,90,230', (22 + (breath ? 14 : 0) + Math.sin(now * 5) * 4) * s, 24 * s, -6 * s, .6);
        c.fillStyle = '#ffd6ff'; c.fill(sp([[24, -14], [29, -6], [24, 2], [19, -6]]));
      }
      c.fillStyle = W(white, enr ? '#fff070' : '#fff4ff'); c.fillRect(60 * s, -61.5 * s, 7 * s, 2.8 * s);
      c.restore();
    },
    death(e, Z) { Z.burst(e.x, e.y, '#ff70e6', 40, 240); Z.burst(e.x, e.y, '#ffffff', 16, 180); Z.shake(14); Z.banner('Event complete: The Prism-Tyrant shatters', '#ffd36a', true); },
  };

  // ---------- Events ----------
  const events = [
    { t: 9, run(Z) {
      Z.banner('Event: Hold the line against the branded warband', '#ff7a5a', false); Z.sfx('warn');
      const a = Z.rnd(0, TAU), px = -Math.sin(a), py = Math.cos(a), bx = Z.P.x + Math.cos(a) * 430, by = Z.P.y + Math.sin(a) * 430;
      for (let i = -3; i <= 3; i++) { const n = Z.spawn('warrior', bx + px * i * 40, by + py * i * 40); if (n) n.rifle = Math.abs(i) === 3; }
    } },
    { t: 32, run(Z) {
      Z.banner('Event: The scar pulses — crystal storm incoming', '#e07cff', true); Z.sfx('boss'); Z.shake(5);
      const P = Z.P;
      for (let i = 0; i < 16; i++) { const a = Z.rnd(0, TAU), d = Z.rnd(40, 300); Z.hazard(P.x + Math.cos(a) * d, P.y + Math.sin(a) * d, { r: 48, t: 1 + i * .22, dmg: 12, col: '230,110,255' }); }
      for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; Z.spawn('shardling', P.x + Math.cos(a) * 380, P.y + Math.sin(a) * 380); }
    } },
    { t: 64, run(Z) {
      Z.banner('Event: Branded hunters are on your trail', '#ff52dc', false); Z.sfx('warn');
      const a0 = Z.rnd(0, TAU);
      for (let i = 0; i < 8; i++) { const a = a0 + i / 8 * TAU; Z.spawn('hound', Z.P.x + Math.cos(a) * 420, Z.P.y + Math.sin(a) * 420); }
    } },
    { t: 96, run(Z) {
      Z.banner('Event: Shatter the crystal brood', '#c58cff', false); Z.sfx('warn');
      const a = Z.rnd(0, TAU), cx = Z.P.x + Math.cos(a) * 400, cy = Z.P.y + Math.sin(a) * 400;
      for (let i = 0; i < 8; i++) Z.spawn('shardling', cx + Math.cos(i) * 40, cy + Math.sin(i) * 40);
      for (let i = 0; i < 2; i++) Z.spawn('devourer', cx + (i ? 70 : -70), cy);
    } },
    { t: 126, run(Z) {
      Z.banner('Event: Survive the brand\'s final surge', '#ff4fd0', true); Z.sfx('boss'); Z.shake(6);
      const a0 = Z.rnd(0, TAU);
      for (let i = 0; i < 8; i++) { const a = a0 + i / 8 * TAU; Z.spawn(i % 2 ? 'hound' : 'warrior', Z.P.x + Math.cos(a) * 440, Z.P.y + Math.sin(a) * 440); }
    } },
  ];

  // ---------- Music: original dark war-hymn in D aeolian/phrygian, 88 bpm ----------
  const music = (() => {
    const BPM = 88, DIV = 4, SD = 60 / BPM / DIV, _ = null;
    // two-bar chords: [root semitones above D, minor?]
    const PROG = [[0, 1], [8, 0], [5, 1], [1, 0], [0, 1], [8, 0], [10, 0], [7, 0], [3, 0], [10, 0], [8, 0], [1, 0], [5, 1], [8, 0], [1, 0], [0, 1]];
    // slow brass phrases (8 bars each): [step, semitones above D4, length in steps]
    const MEL = [
      [[0, 0, 8], [8, 3, 4], [12, 5, 4], [16, 7, 16], [32, 5, 8], [40, 7, 4], [44, 8, 4], [48, 8, 16], [64, 12, 12], [76, 10, 4], [80, 8, 8], [88, 7, 8], [96, 5, 16], [112, 1, 16]],
      [[0, 7, 12], [12, 8, 4], [16, 7, 8], [24, 5, 8], [32, 3, 16], [48, 5, 8], [56, 7, 8], [64, 10, 16], [80, 14, 8], [88, 12, 8], [96, 11, 12], [108, 14, 4], [112, 7, 16]],
      [[0, 10, 8], [8, 15, 8], [16, 14, 8], [24, 12, 8], [32, 14, 12], [44, 12, 4], [48, 10, 16], [64, 12, 16], [80, 15, 8], [88, 12, 8], [96, 13, 8], [104, 12, 8], [112, 10, 16]],
      [[0, 12, 16], [16, 10, 8], [24, 8, 8], [32, 8, 12], [44, 7, 4], [48, 5, 16], [64, 5, 8], [72, 3, 8], [80, 1, 16], [96, 0, 32]],
    ];
    const OST = [0, _, 0, 0, 12, _, 0, 0, 0, _, 0, 0, 7, _, 12, _];
    const BTOM = [58, 74, 62, 88];
    return {
      bpm: BPM, div: DIV,
      step(s, t, A) {
        const ls = s % 512, bar = ls >> 4, sb = ls % 16, ch = PROG[bar >> 1], r = ch[0], tri = ch[1] ? [0, 3, 7] : [0, 4, 7], boss = !!A.boss, inten = A.inten || 0;
        // huge low choir
        if (sb === 0 && bar % 2 === 0) A.pad([50 + r, 50 + r + tri[1], 57 + r], t, SD * 32, .018, { type: 'sawtooth', cutoff: 1000, q: 2, detune: 12 });
        if (boss && sb === 2 && bar % 2 === 0) A.pad([62 + r, 62 + r + tri[1]], t, SD * 30, .015, { type: 'triangle', cutoff: 1800, q: 2, detune: 10 });
        // sub drone
        if (sb === 0) A.tone(t, 26 + r, SD * 15, .07, { type: 'sawtooth', cutoff: 200, attack: .02 });
        // staccato low strings
        const on = OST[sb];
        if (on !== null && (bar >= 2 || boss)) A.tone(t, 38 + r + on, SD * .8, .045 + inten * .015, { type: 'sawtooth', cutoff: boss ? 780 : 480, sweep: 260, decay: true, q: 3 });
        // taiko war drums (double time when the tyrant is out)
        if (!boss) {
          if (sb === 0) { A.kick(t, .62); A.tom(t, 58, .42); }
          if (sb === 6) A.tom(t, 74, .3);
          if (sb === 8) A.kick(t, .42);
          if (sb === 10) A.tom(t, 58, .34);
          if (sb === 12 && bar % 2 === 1) A.tom(t, 88, .26);
          if (bar % 4 === 3 && sb >= 13) A.tom(t, 70 + (sb - 13) * 12, .22 + (sb - 13) * .06);
          if (inten > .5 && sb % 4 === 2) A.hat(t, .028, false);
        } else {
          if (sb % 2 === 0) A.tom(t, BTOM[(sb >> 1) % 4], sb % 8 === 0 ? .44 : .3);
          if (sb % 4 === 0) A.kick(t, .7);
          if (sb === 4 || sb === 12) A.snare(t, .28);
          if (sb % 2 === 1) A.hat(t, .03, false);
        }
        // brass stabs on the chord changes, and a syncopated answer
        if (sb === 0 && bar % 2 === 0) for (const x of tri) A.tone(t, 62 + r + x - (r > 6 ? 12 : 0), SD * 2.2, .026, { type: 'sawtooth', cutoff: 900, sweep: 2400, attack: .012 });
        if (sb === 11 && bar % 2 === 1) for (const x of [0, 7]) A.tone(t, 50 + r + x, SD * 1.6, .022, { type: 'sawtooth', cutoff: 800, sweep: 2000, attack: .01 });
        // slow heroic-tragic brass melody (enters after the first phrase; an octave up for the boss)
        if (s >= 128 || boss) {
          const ph = MEL[bar >> 3], off = ls % 128;
          for (const [p, semi, len] of ph) if (p === off) {
            const m = 62 + semi + (boss ? 12 : 0);
            A.tone(t, m, len * SD * .96, .04, { type: 'sawtooth', cutoff: 800, sweep: boss ? 2600 : 1700, attack: .09, vib: .25, detune: -6 });
            A.tone(t, m, len * SD * .96, .022, { type: 'sawtooth', cutoff: 700, sweep: 1500, attack: .12, detune: 7 });
          }
        }
        // crystalline shimmer
        if (sb === 10 && bar % 2 === 1) A.bell(86 + ((r + tri[(bar >> 1) % 3]) % 12), t, .035);
        if ((s * 7) % 19 === 3 && sb % 2 === 0) A.tone(t, 93 + tri[s % 3] + (r % 5), SD * 1.5, .012, { type: 'sine', decay: true });
        // dissonant crystal ring swell
        if (bar % 8 === 6 && sb === 4) {
          A.noise(t, SD * 28, .022, { type: 'bandpass', f: 700, q: 5, f2: 5200 });
          A.tone(t, 85, SD * 24, .009, { type: 'sine', attack: 1 }); A.tone(t, 86, SD * 24, .009, { type: 'sine', attack: 1 });
        }
      },
    };
  })();

  return {
    id: 'gw2', name: 'The Brandscar Wastes', nod: 'Guild Wars 2', portal: '200,70,255', bg: '#3e3834', dark: .55, dim: .22,
    ground, under, ambient,
    mix: { shardling: 4, hound: 2.5, warrior: 2.2, devourer: 1 },
    target: 1,
    foes: { warrior, hound, devourer, shardling },
    boss, events, music,
  };
})());
