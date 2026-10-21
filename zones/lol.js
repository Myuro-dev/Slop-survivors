// Zone: The Riftbound Lane — a top-down MOBA battlefield. Teal jungle, rocky cliff walls, worn dirt lanes,
// a winding violet river, rune-ringed camps and ruined crystal turrets. The crimson team's minion waves march in.
ZONES.push((() => {
  const TAU = Math.PI * 2, S2 = Math.SQRT2;
  const md = (a, b) => ((a % b) + b) % b;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const INK = '#120a10'; // near-black outline for every actor

  // ---------- macro map layout ----------
  // A repeating M×M pattern: dirt lanes run along x+y ≡ 0 (mod M), the river along x-y ≡ 0 (mod M).
  // They carve the world into diamonds of jungle; each diamond holds 4 cliff walls, a rune camp,
  // brush patches and maybe a ruined turret. Diamonds alternate cool (blue side) and warm (red side).
  const M = 1600, H = M / 2;
  const RW = 80, LW = 58; // river / lane half-widths (perpendicular px)
  const rw = p => 64 * Math.sin(p * TAU / M + .5);         // river wobble (in x-y units)
  const lw = q => 40 * Math.sin(q * TAU * 2 / M + 1.3);    // lane wobble (in x+y units)
  const rOff = (x, y) => (md(x - y - rw(x + y) + H, M) - H) / S2; // signed perpendicular distance to river centre
  const lOff = (x, y) => (md(x + y - lw(x - y) + H, M) - H) / S2;
  const toW = (cx, cy, a, b) => [cx + (a + b) / S2, cy + (a - b) / S2];
  const eachDiamond = (x0, y0, x1, y1, pad, fn) => {
    for (let j = Math.floor((y0 - pad) / M) - 1; j <= Math.floor((y1 + pad) / M) + 1; j++)
      for (let i = Math.floor((x0 - pad) / M) - 1; i <= Math.floor((x1 + pad) / M) + 1; i++)
        for (let t = 0; t < 2; t++) {
          const cx = i * M + (t ? 0 : H), cy = j * M + (t ? H : 0);
          if (cx < x0 - pad || cx > x1 + pad || cy < y0 - pad || cy > y1 + pad) continue;
          fn(cx, cy, t, (i * 2 + t) * 131 + j * 977 + 5000);
        }
  };
  const WALLS = [[-290, -262, 142], [290, -262, 136], [-290, 262, 136], [290, 262, 142]];
  const turretOf = (Z, cx, cy, t, k) => {
    if (Z.hash(k, 17) > .72) return null;
    const s = Z.hash(k, 23) < .5 ? 1 : -1, [x, y] = toW(cx, cy, s * 452, (Z.hash(k, 29) - .5) * 70);
    return { x, y, red: t === 1, k };
  };
  const SIDE = [{ rune: '#7fc4f0', glow: '120,190,255', tip: '#4aa8ff', hi: '#d8f0ff' },
                { rune: '#f0a070', glow: '255,130,90', tip: '#ff4a4a', hi: '#ffd8cc' }];
  const polyPath = (p, pts, dx, dy) => {
    p.moveTo(pts[0] + dx, pts[1] + dy);
    for (let i = 2; i < pts.length; i += 2) p.lineTo(pts[i] + dx, pts[i + 1] + dy);
    p.closePath();
  };
  // thick polyline along a lane (fam 0) or river (fam 1), k = line index, off = perpendicular offset
  const linePath = (p, fam, k, off, s0, s1, st) => {
    let first = true;
    for (let s = s0; s <= s1 + st; s += st) {
      let x, y;
      if (fam === 0) { const c = k * M + lw(s) + off * S2; x = (c + s) / 2; y = (c - s) / 2; }
      else { const c = k * M + rw(s) + off * S2; x = (s + c) / 2; y = (s - c) / 2; }
      if (first) { p.moveTo(x, y); first = false; } else p.lineTo(x, y);
    }
  };

  // ---------- music data (original) ----------
  const PROG1 = [[0, 'm'], [-4, 'M'], [5, 'm'], [7, 'M']];   // i - VI - iv - V
  const PROG2 = [[0, 'm'], [3, 'M'], [-2, 'M'], [7, 'M']];   // i - III - VII - V
  // Lead melody, 8 bars: [step, semitones above D4, length in steps]
  const MEL = [
    [[0, 0, 3], [3, 7, 3], [6, 12, 6], [12, 10, 2], [14, 12, 2]],
    [[0, 15, 6], [6, 14, 2], [8, 12, 8]],
    [[0, 12, 3], [3, 10, 3], [6, 8, 6], [12, 3, 4]],
    [[0, 8, 4], [4, 10, 4], [8, 12, 8]],
    [[0, 17, 6], [6, 15, 2], [8, 12, 4], [12, 8, 4]],
    [[0, 10, 6], [6, 8, 2], [8, 5, 8]],
    [[0, 7, 3], [3, 14, 3], [6, 11, 6], [12, 7, 4]],
    [[0, 14, 4], [4, 15, 2], [6, 14, 2], [8, 11, 4], [12, 7, 4]],
  ];
  const OST = [0, 2, 3, 2, 1, 2, 3, 4, 0, 2, 3, 2, 1, 3, 4, 3]; // string ostinato over chord tones
  const BASS = { 0: 0, 3: 0, 6: 0, 8: 0, 10: 12, 13: 0, 14: 7 };

  // ---------- events: marching minion waves and jungle ambushes ----------
  const wave = (Z, big) => {
    const a = Z.rnd(0, TAU), cx = Z.P.x + Math.cos(a) * 640, cy = Z.P.y + Math.sin(a) * 640;
    const dir = a + Math.PI, mx = Math.cos(dir), my = Math.sin(dir), px = -my, py = mx;
    const rows = big ? [['trooper', 4], ['caster', 3], ['cannon', 1]] : [['trooper', 4], ['caster', 2]];
    if (Z.t > 70) rows[0][1] = 5;
    rows.forEach(([kind, n], ri) => {
      for (let i = 0; i < n; i++) {
        const off = (i - (n - 1) / 2) * 30, back = ri * 34;
        const m = Z.spawn(kind, cx + px * off - mx * back, cy + py * off - my * back);
        if (m) { m.march = 5; m.mx = mx; m.my = my; m.ang = dir; }
      }
    });
    Z.banner(big ? 'A crimson siege wave marches down the lane!' : 'The crimson ranks march!', '#ff5a4a', false);
    Z.sfx('warn');
  };
  const flock = (Z, n, text) => {
    const a = Z.rnd(0, TAU), cx = Z.P.x + Math.cos(a) * 560, cy = Z.P.y + Math.sin(a) * 560;
    for (let i = 0; i < n; i++) { const r = Z.spawn('raptor', cx + Z.rnd(-60, 60), cy + Z.rnd(-60, 60)); if (r) r.t1 = .6 + i * .25; }
    Z.banner(text, '#ffb060', false);
  };

  // ---------- boss helpers ----------
  const BOSS_PAT = ['spit', 'spikes', 'slam', 'spit', 'summon', 'spikes', 'slam'];
  const WIND = { spit: .75, spikes: .55, slam: 1.15, summon: .7 };
  const fan = (Z, e, n, spread, sp) => {
    const a = Z.angTo(e), hx = e.x + Math.cos(a) * e.r * .9, hy = e.y + Math.sin(a) * e.r * .9;
    for (let i = 0; i < n; i++) Z.shoot(hx, hy, a + (i / (n - 1) - .5) * spread, sp, { r: 6, dmg: 9, life: 4, col: '240,110,255' });
  };
  const bossFire = (e, Z) => {
    const enr = e.enr, P = Z.P;
    if (e.act === 'spit') {
      e.open = .9; Z.sfx('shoot');
      for (let i = 0; i < 3; i++) e.q.push({ d: i * .24, k: 'fan' });
      if (enr) e.q.push({ d: .85, k: 'fan' });
    } else if (e.act === 'spikes') {
      Z.sfx('warn');
      Z.hazard(P.x, P.y, { r: 55, t: .9, dmg: 14, col: '170,80,255' });
      e.q.push({ d: .55, k: 'spkring', n: 6, rr: 100 });
      e.q.push({ d: 1.1, k: 'spkline' });
      if (enr) e.q.push({ d: 1.65, k: 'spkring', n: 8, rr: 150 });
    } else if (e.act === 'slam') {
      Z.shake(12); Z.sfx('nova'); Z.burst(e.x, e.y, '#b07aff', 30, 260);
      Z.ring(e.x, e.y, enr ? 26 : 20, 150, { r: 7, dmg: 10, life: 4, col: '200,120,255' }, e.ph);
      if (enr) e.q.push({ d: .35, k: 'ring2' });
    } else if (e.act === 'summon') {
      Z.sfx('star'); Z.burst(e.x, e.y, '#7a3cff', 24, 160);
      const n = enr ? 7 : 5;
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU + e.ph, v = Z.spawn('voidling', e.x + Math.cos(a) * (e.r + 26), e.y + Math.sin(a) * (e.r + 26));
        if (v) { v.kx = Math.cos(a) * 160; v.ky = Math.sin(a) * 160; }
      }
    }
  };
  const runQueue = (e, Z) => {
    for (let i = e.q.length - 1; i >= 0; i--) {
      const it = e.q[i];
      if ((it.d -= Z.dt) > 0) continue;
      e.q.splice(i, 1);
      const P = Z.P;
      if (it.k === 'fan') fan(Z, e, e.enr ? 9 : 7, e.enr ? 1.1 : .9, 200);
      else if (it.k === 'spkring') { for (let j = 0; j < it.n; j++) { const a = j / it.n * TAU + e.ph; Z.hazard(P.x + Math.cos(a) * it.rr, P.y + Math.sin(a) * it.rr, { r: 45, t: .9, dmg: 14, col: '170,80,255' }); } }
      else if (it.k === 'spkline') {
        const a = Math.atan2(P.y - e.y, P.x - e.x), d = Math.max(60, Math.hypot(P.x - e.x, P.y - e.y));
        for (let j = 1; j <= 4; j++) Z.hazard(e.x + Math.cos(a) * d * j / 4, e.y + Math.sin(a) * d * j / 4, { r: 50, t: .8 + j * .08, dmg: 14, col: '170,80,255' });
      } else if (it.k === 'ring2') Z.ring(e.x, e.y, 26, 120, { r: 7, dmg: 10, life: 4, col: '255,90,200' }, e.ph + Math.PI / 26);
    }
  };

  // shared helpers for drawing
  const face = e => (Math.cos(e.ang) < 0 ? -1 : 1);
  const marchStep = (e, Z) => {
    if (!(e.march > 0)) return false;
    e.march -= Z.dt;
    if (Z.dist(e) < 240) e.march = 0;
    Z.move(e, e.mx * 52, e.my * 52); e.ang = Math.atan2(e.my, e.mx);
    return true;
  };
  const keepRange = (e, Z, want, sp) => {
    const d = Z.dist(e), a = Z.angTo(e), k = d > want + 30 ? 1 : d < want - 40 ? -.7 : 0;
    const s = Math.sin(e.ph * .7 + e.seed) * .5; // strafe
    Z.move(e, (Math.cos(a) * k - Math.sin(a) * s) * sp, (Math.sin(a) * k + Math.cos(a) * s) * sp); e.ang = a;
  };

  return {
    id: 'lol', name: 'The Riftbound Lane', nod: 'League of Legends', portal: '90,170,255', bg: '#3d6a58', dark: .3, dim: .12, target: 1,

    // Static, cached floor (no animation here).
    ground(Z, x0, y0, x1, y1) {
      const c = Z.ctx;
      c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
      // --- warm vs cool tint per jungle diamond ---
      eachDiamond(x0, y0, x1, y1, 900, (cx, cy, t) => {
        const g = c.createRadialGradient(cx, cy, 60, cx, cy, 760);
        g.addColorStop(0, t ? 'rgba(170,130,70,.16)' : 'rgba(70,130,190,.16)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0);
      });
      // --- painterly grass ---
      const G = 44, gd = new Path2D(), gl = new Path2D(), gt = new Path2D(), blades = new Path2D(), flw = new Path2D(), flb = new Path2D();
      for (let cy = Math.floor(y0 / G); cy <= Math.floor(y1 / G); cy++) for (let cx = Math.floor(x0 / G); cx <= Math.floor(x1 / G); cx++) {
        const h = Z.hash(cx, cy), h2 = Z.hash(cx * 7 + 3, cy * 13 - 5), h3 = Z.hash(cx * 11 - 2, cy * 5 + 9);
        const x = cx * G + h2 * G, y = cy * G + h3 * G, rx = 14 + h * 26, ry = 7 + h2 * 11, rot = -.5 + h3 * .6;
        const p = h < .4 ? gd : h < .75 ? gl : gt;
        p.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot)); p.ellipse(x, y, rx, ry, rot, 0, TAU);
        if (h2 < .45) { const bx = cx * G + h * G, by = cy * G + (1 - h2) * G; blades.moveTo(bx - 4, by); blades.lineTo(bx - 6, by - 7); blades.moveTo(bx, by); blades.lineTo(bx + 1, by - 9); blades.moveTo(bx + 4, by); blades.lineTo(bx + 7, by - 6); }
        if (h3 > .965) { const fx = cx * G + h * G, fy = cy * G + h2 * G, fp = h > .5 ? flw : flb; fp.moveTo(fx + 2.4, fy); fp.arc(fx, fy, 2.4, 0, TAU); }
      }
      c.fillStyle = '#35604f'; c.fill(gd);
      c.fillStyle = '#477763'; c.fill(gl);
      c.fillStyle = '#3f6d50'; c.fill(gt);
      c.strokeStyle = '#2d5244'; c.lineWidth = 1.6; c.stroke(blades);
      c.fillStyle = '#d6b866'; c.fill(flw);
      c.fillStyle = '#86b4d8'; c.fill(flb);

      // --- lanes: soft worn earth ---
      const lk0 = Math.floor((x0 + y0 - 300) / M), lk1 = Math.ceil((x1 + y1 + 300) / M);
      const qa = x0 - y1 - 120, qb = x1 - y0 + 120;
      const lane = new Path2D(), ruts = new Path2D();
      for (let k = lk0; k <= lk1; k++) { linePath(lane, 0, k, 0, qa, qb, 40); linePath(ruts, 0, k, -17, qa, qb, 40); linePath(ruts, 0, k, 19, qa, qb, 40); }
      c.globalAlpha = .45; c.strokeStyle = '#5c6a45'; c.lineWidth = LW * 2 + 52; c.stroke(lane);
      c.globalAlpha = .8; c.strokeStyle = '#7d7350'; c.lineWidth = LW * 2 + 18; c.stroke(lane);
      c.globalAlpha = 1; c.strokeStyle = '#9b8659'; c.lineWidth = LW * 2; c.stroke(lane);
      c.globalAlpha = .55; c.strokeStyle = '#ab9465'; c.lineWidth = LW * 1.1; c.stroke(lane);
      c.globalAlpha = .4; c.strokeStyle = '#6e5e3e'; c.lineWidth = 4; c.setLineDash([46, 22]); c.stroke(ruts); c.setLineDash([]);
      c.globalAlpha = 1;
      // --- river: sandy banks, violet-blue water ---
      const rk0 = Math.floor((x0 - y1 - 300) / M), rk1 = Math.ceil((x1 - y0 + 300) / M);
      const pa = x0 + y0 - 120, pb = x1 + y1 + 120;
      const riv = new Path2D(), sh = new Path2D();
      for (let k = rk0; k <= rk1; k++) { linePath(riv, 1, k, 0, pa, pb, 40); linePath(sh, 1, k, -RW + 12, pa, pb, 40); linePath(sh, 1, k, RW - 12, pa, pb, 40); }
      c.strokeStyle = '#a8996e'; c.lineWidth = RW * 2 + 50; c.stroke(riv);
      c.strokeStyle = '#87805f'; c.lineWidth = RW * 2 + 14; c.stroke(riv);
      c.strokeStyle = '#4f5a96'; c.lineWidth = RW * 2; c.stroke(riv);
      c.strokeStyle = '#5f6ca6'; c.lineWidth = 12; c.globalAlpha = .7; c.stroke(sh); c.globalAlpha = 1;
      c.strokeStyle = '#424a86'; c.lineWidth = RW * 1.15; c.stroke(riv);
      c.strokeStyle = '#3a4079'; c.lineWidth = RW * .5; c.stroke(riv);

      // --- pebbles on lanes, rocks on river banks ---
      const C = 36, peb = new Path2D(), pebHi = new Path2D(), rk = new Path2D(), rkHi = new Path2D();
      for (let cy = Math.floor(y0 / C); cy <= Math.floor(y1 / C); cy++) for (let cx = Math.floor(x0 / C); cx <= Math.floor(x1 / C); cx++) {
        const h = Z.hash(cx * 3 + 1, cy * 5 + 2), x = cx * C + Z.hash(cx, cy + 7) * C, y = cy * C + Z.hash(cx + 7, cy) * C;
        const ld = Math.abs(lOff(x, y)), rd = Math.abs(rOff(x, y));
        if (ld < LW && h < .33 && rd > RW + 20) { const r = 1.6 + h * 6; peb.moveTo(x + r, y); peb.ellipse(x, y, r, r * .7, 0, 0, TAU); if (r > 3) { pebHi.moveTo(x, y - r * .3); pebHi.ellipse(x - r * .2, y - r * .3, r * .45, r * .25, 0, 0, TAU); } }
        else if (rd > RW - 14 && rd < RW + 24 && h < .2) { const r = 6 + h * 40; rk.moveTo(x + r, y); rk.ellipse(x, y, r, r * .72, h * 9, 0, TAU); rkHi.moveTo(x, y - r * .3); rkHi.ellipse(x - r * .2, y - r * .3, r * .5, r * .28, 0, 0, TAU); }
      }
      c.fillStyle = '#6c5f45'; c.fill(peb); c.fillStyle = '#c3b183'; c.fill(pebHi);
      c.strokeStyle = '#2a2a30'; c.lineWidth = 2; c.stroke(rk);
      c.fillStyle = '#6b6876'; c.fill(rk); c.fillStyle = '#9b97a3'; c.fill(rkHi);

      // --- per-diamond features: camps, brush, cliff walls, turrets ---
      const camp = new Path2D(), brushB = new Path2D(), bl1 = new Path2D(), bl2 = new Path2D(), blHi = new Path2D();
      const shad = new Path2D(), side = new Path2D(), sideDk = new Path2D(), top = new Path2D(), moss = new Path2D(), mossDk = new Path2D();
      const tree = new Path2D(), treeHi = new Path2D(), slab = new Path2D(), slabHi = new Path2D();
      const camps = [], turrets = [];
      eachDiamond(x0, y0, x1, y1, 820, (cx, cy, t, k) => {
        camp.moveTo(cx + 118, cy); camp.ellipse(cx, cy, 118, 104, 0, 0, TAU); camps.push([cx, cy, t]);
        // brush patches: two by the river, two by the lanes
        const BR = [[0, -404, 92, 30, 1], [0, 404, 92, 30, 1], [430, 150 * (Z.hash(k, 3) < .5 ? 1 : -1), 72, 26, 0], [-430, 150 * (Z.hash(k, 4) < .5 ? 1 : -1), 72, 26, 0]];
        BR.forEach(([a, b, L, T, alongA], bi) => {
          if (Z.hash(k + bi, 31) < .2) return;
          const [bx, by] = toW(cx, cy, a, b), rot = alongA ? Math.PI / 4 : -Math.PI / 4, ca = Math.cos(rot), sa = Math.sin(rot);
          brushB.moveTo(bx + ca * L, by + sa * L); brushB.ellipse(bx, by, L, T, rot, 0, TAU);
          for (let n = 0; n < 46; n++) {
            const u = (Z.hash(k * 3 + n, bi * 7 + 1) * 2 - 1) * L * .92, v = (Z.hash(k * 5 - n, bi * 3 + 2) * 2 - 1) * T * Math.sqrt(1 - (u / L) ** 2) * .9;
            const px = bx + ca * u - sa * v, py = by + sa * u + ca * v, ht = 11 + Z.hash(n, k) * 9, lean = (Z.hash(n + 9, k) - .5) * 8;
            const p = n % 3 ? bl1 : bl2;
            p.moveTo(px - 3.5, py + 3); p.lineTo(px + lean, py - ht); p.lineTo(px + 3.5, py + 3);
            if (n % 4 === 0) { blHi.moveTo(px + lean * .5, py - ht * .5); blHi.lineTo(px + lean, py - ht); }
          }
        });
        // cliff walls
        WALLS.forEach(([a0, b0, R0], wi) => {
          const wa = a0 + (Z.hash(k + wi, 41) - .5) * 40, wb = b0 + (Z.hash(k + wi, 43) - .5) * 30, R = R0 * (.9 + Z.hash(k + wi, 47) * .18);
          const N = 18, rad = [];
          for (let v = 0; v < N; v++) rad.push(.78 + .34 * Z.hash(k * 7 + wi * 31 + v, 53));
          const pts = [];
          for (let v = 0; v < N; v++) {
            const rr = R * (rad[v] * .6 + (rad[(v + 1) % N] + rad[(v + N - 1) % N]) * .2), an = v / N * TAU;
            const p = toW(cx, cy, wa + Math.cos(an) * rr * 1.08, wb + Math.sin(an) * rr * .92);
            pts.push(p[0], p[1]);
          }
          polyPath(shad, pts, 14, 38);
          for (let d = 0; d <= 28; d += 7) polyPath(side, pts, 0, d);
          polyPath(sideDk, pts, 0, 30);
          polyPath(top, pts, 0, 0);
          const [wx, wy] = toW(cx, cy, wa, wb);
          for (let n = 0; n < 9; n++) {
            const an = Z.hash(k + n, wi + 61) * TAU, dd = Z.hash(k - n, wi + 67) * R * .55, px = wx + Math.cos(an) * dd, py = wy + Math.sin(an) * dd * .85;
            const rr = 12 + Z.hash(n, k + wi) * 16;
            if (n < 4) { tree.moveTo(px + rr, py); tree.arc(px, py, rr, 0, TAU); treeHi.moveTo(px - 4 + rr * .55, py - 5); treeHi.arc(px - 4, py - 5, rr * .55, 0, TAU); }
            else if (n < 6) { slab.moveTo(px - rr * .7, py + 2); slab.lineTo(px - rr * .2, py - rr * .55); slab.lineTo(px + rr * .65, py - rr * .3); slab.lineTo(px + rr * .5, py + rr * .4); slab.closePath(); slabHi.moveTo(px - rr * .5, py); slabHi.lineTo(px - rr * .2, py - rr * .45); slabHi.lineTo(px + rr * .4, py - rr * .25); slabHi.closePath(); }
            else { (n & 1 ? moss : mossDk).moveTo(px + rr, py); (n & 1 ? moss : mossDk).ellipse(px, py, rr * 1.3, rr * .8, an, 0, TAU); }
          }
        });
        const tu = turretOf(Z, cx, cy, t, k); if (tu) turrets.push(tu);
      });
      // camps: trampled clearings with faint rune circles
      c.fillStyle = '#5a6448'; c.globalAlpha = .55; c.fill(camp); c.globalAlpha = 1;
      for (const [cx, cy, t] of camps) {
        if (cx < x0 - 200 || cx > x1 + 200 || cy < y0 - 200 || cy > y1 + 200) continue;
        const rune = new Path2D();
        rune.moveTo(cx + 92, cy); rune.ellipse(cx, cy, 92, 80, 0, 0, TAU);
        rune.moveTo(cx + 70, cy); rune.ellipse(cx, cy, 70, 60, 0, 0, TAU);
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * TAU, mx = cx + Math.cos(a) * 81, my = cy + Math.sin(a) * 70;
          rune.moveTo(mx, my - 6); rune.lineTo(mx + 4, my); rune.lineTo(mx, my + 6); rune.lineTo(mx - 4, my); rune.closePath();
        }
        rune.moveTo(cx, cy - 26); rune.lineTo(cx + 22, cy + 13); rune.lineTo(cx - 22, cy + 13); rune.closePath();
        c.globalAlpha = .38; c.strokeStyle = SIDE[t].rune; c.lineWidth = 2.5; c.stroke(rune);
        c.globalAlpha = .3; c.strokeStyle = '#d8b860'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(cx, cy, 104, 91, 0, 0, TAU); c.stroke();
        c.globalAlpha = 1;
      }
      // brush
      c.fillStyle = '#1e3a31'; c.fill(brushB);
      c.fillStyle = '#244a3c'; c.fill(bl1);
      c.fillStyle = '#183129'; c.fill(bl2);
      c.strokeStyle = '#4c8566'; c.lineWidth = 1.3; c.stroke(blHi);
      // cliff walls: ground shadow, slate-brown sides, mossy tops with highlighted rims
      c.fillStyle = 'rgba(12,24,20,.35)'; c.fill(shad);
      c.fillStyle = '#3c434f'; c.fill(side);
      c.strokeStyle = '#1f242c'; c.lineWidth = 3; c.stroke(sideDk);
      c.strokeStyle = '#262a31'; c.lineWidth = 5; c.stroke(top);
      c.fillStyle = '#56703f'; c.fill(top);
      c.strokeStyle = '#a9bb76'; c.lineWidth = 2.2; c.globalAlpha = .75; c.stroke(top); c.globalAlpha = 1;
      c.fillStyle = '#4a6237'; c.fill(mossDk);
      c.fillStyle = '#668348'; c.fill(moss);
      c.fillStyle = '#5a6170'; c.fill(slab); c.fillStyle = '#848c9a'; c.fill(slabHi);
      c.fillStyle = '#2f4b2f'; c.fill(tree); c.fillStyle = '#46683d'; c.fill(treeHi);
      // ruined turrets with hextech gold-and-blue trim
      for (const tu of turrets) {
        if (tu.x < x0 - 90 || tu.x > x1 + 90 || tu.y < y0 - 90 || tu.y > y1 + 90) continue;
        const sd = SIDE[tu.red ? 1 : 0];
        c.save(); c.translate(tu.x, tu.y);
        c.fillStyle = 'rgba(12,24,20,.35)'; c.beginPath(); c.ellipse(6, 12, 46, 30, 0, 0, TAU); c.fill();
        c.fillStyle = '#5e5a55'; c.strokeStyle = '#25221f'; c.lineWidth = 3; c.beginPath();
        for (let j = 0; j < 8; j++) { const a = j / 8 * TAU + .39; c.lineTo(Math.cos(a) * 44, Math.sin(a) * 36); }
        c.closePath(); c.fill(); c.stroke();
        c.strokeStyle = '#c9a24a'; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 0, 34, 27, 0, 0, TAU); c.stroke();
        c.strokeStyle = sd.tip; c.globalAlpha = .7; c.lineWidth = 2; c.beginPath(); c.ellipse(0, 0, 28, 22, 0, 0, TAU); c.stroke(); c.globalAlpha = 1;
        c.fillStyle = '#8a8378'; c.strokeStyle = '#25221f'; c.lineWidth = 2.5; c.beginPath();
        c.moveTo(-17, 4); c.lineTo(-15, -12); c.lineTo(-6, -16); c.lineTo(2, -11); c.lineTo(9, -18); c.lineTo(17, -8); c.lineTo(16, 6); c.lineTo(0, 12); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#b8902f'; c.fillRect(-14, 1, 28, 3);
        c.fillStyle = '#23232c'; c.beginPath(); c.ellipse(0, -4, 8, 6, 0, 0, TAU); c.fill();
        c.fillStyle = '#77706a'; c.fillRect(-36, 18, 9, 6); c.fillRect(30, 14, 8, 7); c.fillRect(-4, 26, 7, 5);
        c.restore();
      }
      c.restore();
    },

    // Animated floor details: river ripples and slowly turning camp runes.
    under(Z) {
      const c = Z.ctx, now = Z.now, hw = (Z.W || 1300) / 2 + 80, hh = (Z.H || 900) / 2 + 80;
      const x0 = Z.P.x - hw, x1 = Z.P.x + hw, y0 = Z.P.y - hh, y1 = Z.P.y + hh;
      const rip = new Path2D(), rip2 = new Path2D(), ST = 90;
      const rk0 = Math.floor((x0 - y1 - 200) / M), rk1 = Math.ceil((x1 - y0 + 200) / M);
      for (let k = rk0; k <= rk1; k++) {
        for (let s = Math.floor((x0 + y0) / ST) * ST; s <= x1 + y1; s += ST) {
          for (let l = 0; l < 3; l++) {
            const h = Z.hash(s / ST, k * 5 + l), sp = s + md(now * 44 * (.8 + h * .4) + h * ST, ST);
            const lat = (l - 1) * 46 + (h - .5) * 24, cc = k * M + rw(sp) + lat * S2;
            const x = (sp + cc) / 2, y = (sp - cc) / 2;
            if (x < x0 || x > x1 || y < y0 || y > y1) continue;
            const L = 8 + h * 10, p = l === 1 ? rip2 : rip;
            p.moveTo(x - L * .5, y - L * .5); p.quadraticCurveTo(x + 2, y - 3, x + L * .5, y + L * .5);
          }
        }
      }
      c.save(); c.lineCap = 'round';
      c.globalAlpha = .55; c.strokeStyle = '#8d97dc'; c.lineWidth = 2; c.stroke(rip);
      c.globalAlpha = .45; c.strokeStyle = '#b9c2f2'; c.lineWidth = 1.6; c.stroke(rip2);
      const runes = [new Path2D(), new Path2D()];
      eachDiamond(x0, y0, x1, y1, 160, (cx, cy, t) => {
        const p = runes[t], a0 = now * .35 * (t ? -1 : 1);
        for (let i = 0; i < 3; i++) { const a = a0 + i / 3 * TAU; p.moveTo(cx + Math.cos(a) * 81, cy + Math.sin(a) * 70); p.ellipse(cx, cy, 81, 70, 0, a, a + .7); }
      });
      c.lineWidth = 3;
      for (let t = 0; t < 2; t++) { c.globalAlpha = .35 + Math.sin(now * 1.7 + t) * .1; c.strokeStyle = SIDE[t].rune; c.stroke(runes[t]); }
      c.restore();
    },

    ambient(Z) {
      const c = Z.ctx, now = Z.now, hw = (Z.W || 1300) / 2 + 60, hh = (Z.H || 900) / 2 + 60;
      const x0 = Z.P.x - hw, x1 = Z.P.x + hw, y0 = Z.P.y - hh, y1 = Z.P.y + hh;
      let n = 0;
      eachDiamond(x0, y0, x1, y1, 120, (cx, cy, t, k) => {
        const sd = SIDE[t];
        // camp motes
        for (let i = 0; i < 3; i++) {
          const a = now * .5 * (t ? -1 : 1) + i / 3 * TAU;
          Z.glow(sd.glow, 10, cx + Math.cos(a) * 81, cy + Math.sin(a) * 70, .5 + Math.sin(now * 2 + i) * .2); n++;
        }
        // floating turret crystal
        const tu = turretOf(Z, cx, cy, t, k);
        if (tu && tu.x > x0 - 60 && tu.x < x1 + 60 && tu.y > y0 - 60 && tu.y < y1 + 60) {
          const bob = Math.sin(now * 1.8 + k) * 3, ty = tu.y - 26 + bob;
          Z.glow(sd.glow, 60, tu.x, tu.y - 8, .45 + Math.sin(now * 1.3 + k) * .12);
          c.fillStyle = '#14121a'; c.beginPath(); c.moveTo(tu.x, ty - 20); c.lineTo(tu.x + 10, ty); c.lineTo(tu.x, ty + 13); c.lineTo(tu.x - 10, ty); c.closePath(); c.fill();
          c.fillStyle = sd.tip; c.beginPath(); c.moveTo(tu.x, ty - 17); c.lineTo(tu.x + 7.5, ty); c.lineTo(tu.x, ty + 10); c.lineTo(tu.x - 7.5, ty); c.closePath(); c.fill();
          c.fillStyle = sd.hi; c.beginPath(); c.moveTo(tu.x, ty - 17); c.lineTo(tu.x + 2.5, ty - 2); c.lineTo(tu.x, ty + 5); c.lineTo(tu.x - 3, ty - 2); c.closePath(); c.fill();
          n += 7;
        }
      });
      // jungle sparkles (warm on red side, cool on blue side) and river glints
      const G = 100;
      for (let cy = Math.floor(y0 / G); cy <= Math.floor(y1 / G) && n < 200; cy++) for (let cx = Math.floor(x0 / G); cx <= Math.floor(x1 / G) && n < 200; cx++) {
        const h = Z.hash(cx * 5 - 1, cy * 3 + 7);
        if (h > .09) continue;
        const x = cx * G + Z.hash(cx + 3, cy) * G + Math.sin(now * .7 + h * 50) * 10, y = cy * G + Z.hash(cx, cy + 3) * G + Math.cos(now * .9 + h * 70) * 8;
        const rd = Math.abs(rOff(x, y));
        if (rd < RW) {
          const a = Math.sin(now * 3.2 + h * 400);
          if (a > .3) { Z.glow('210,215,255', 8, x, y, (a - .3) * 1.2); n++; }
        } else if (Math.abs(lOff(x, y)) > LW + 10) {
          const warm = h < .045;
          Z.glow(warm ? '255,200,110' : '130,220,255', 12, x, y, .35 + Math.sin(now * 1.6 + h * 90) * .25); n++;
        }
      }
    },

    mix: { trooper: 5, caster: 3, cannon: 1, raptor: 2 },

    foes: {
      // Crimson Footman (melee minion): armoured, marches in formation, then charges in.
      trooper: { hp: 16, sp: 70, dmg: 8, xp: 1, r: 10, eye: false,
        update(e, Z) { if (!marchStep(e, Z)) Z.chase(e); },
        draw(e, Z, white) {
          const c = Z.ctx, W = col => (white ? '#fff' : col), O = W(INK), st = Math.sin(e.ph * 11 + e.seed);
          c.save(); c.translate(e.x, e.y - Math.abs(st) * 1.6); c.scale(face(e), 1);
          c.lineJoin = 'round'; c.strokeStyle = O;
          c.fillStyle = O; c.fillRect(-7 + st * 2, 3, 5, 9); c.fillRect(2 - st * 2, 3, 5, 9);
          c.lineWidth = 5; c.beginPath(); c.moveTo(-5, 2); c.lineTo(-13, -10 + st); c.stroke();
          c.strokeStyle = W('#eef2f6'); c.lineWidth = 2.2; c.stroke();
          c.strokeStyle = O; c.lineWidth = 2.4;
          c.fillStyle = W('#e8302a'); c.beginPath(); c.arc(0, 1, 8.5, 0, TAU); c.fill(); c.stroke();
          c.fillStyle = W('#ffcf4a'); c.fillRect(-7.5, 1, 15, 3);
          c.fillStyle = W('#c9d0d8'); c.beginPath(); c.arc(0, -6, 6.5, Math.PI, 0); c.lineTo(6.5, -2.5); c.lineTo(-6.5, -2.5); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = W('#ff3a2a'); c.beginPath(); c.moveTo(-5, -11); c.lineTo(1, -18); c.lineTo(4, -10); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = O; c.fillRect(1, -6.5, 5.5, 2.4);
          c.fillStyle = W('#ffcf4a'); c.beginPath(); c.ellipse(7.5, 2, 4, 7, 0, 0, TAU); c.fill(); c.stroke();
          c.restore();
        } },
      // Crimson Hexcaster (caster minion): keeps range, charges an orb on its staff and lobs it.
      caster: { hp: 26, sp: 58, dmg: 6, xp: 2, r: 10, eye: '#ffe08a',
        init(e) { e.cast = 0; },
        update(e, Z) {
          if (marchStep(e, Z)) return;
          keepRange(e, Z, 230, e.sp);
          if ((e.t1 -= Z.dt) <= 0) {
            e.t1 = 2.8 + Z.rnd(0, .8);
            if (Z.dist(e) < 520) { const a = Z.angTo(e); Z.shoot(e.x + Math.cos(a) * 10, e.y - 8, a, 175, { r: 7, dmg: 8, life: 4, col: '255,90,210' }); e.cast = .25; }
          }
          e.cast = Math.max(0, (e.cast || 0) - Z.dt);
        },
        draw(e, Z, white) {
          const c = Z.ctx, W = col => (white ? '#fff' : col), O = W(INK), f = face(e), fl = Math.sin(e.ph * 4 + e.seed) * 1.5;
          const charge = clamp(1 - e.t1 / 2.8, 0, 1), sx = 10 - e.cast * 8;
          c.save(); c.translate(e.x, e.y + fl); c.scale(f, 1);
          c.lineJoin = 'round'; c.strokeStyle = O;
          c.lineWidth = 5; c.beginPath(); c.moveTo(sx - 2, 11); c.lineTo(sx, -10); c.stroke();
          c.strokeStyle = W('#c79a52'); c.lineWidth = 2.2; c.stroke();
          c.strokeStyle = O; c.lineWidth = 2.4;
          c.fillStyle = W('#c8262e'); c.beginPath(); c.moveTo(0, -11); c.lineTo(10, 11); c.lineTo(-10, 11); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = W('#ff5a4a'); c.beginPath(); c.moveTo(0, -8); c.lineTo(6, 9); c.lineTo(-3, 9); c.closePath(); c.fill();
          c.fillStyle = W('#ffcf4a'); c.fillRect(-9, 6, 18, 3);
          c.fillStyle = W('#4a0e18'); c.beginPath(); c.arc(0, -8, 6, 0, TAU); c.fill(); c.stroke();
          c.fillStyle = W('#ffcf4a'); c.beginPath(); c.moveTo(-6, -11); c.lineTo(0, -17); c.lineTo(6, -11); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = W('#ff4ad0'); c.beginPath(); c.arc(sx, -12, 3 + charge * 3, 0, TAU); c.fill(); c.stroke();
          if (!white) { c.fillStyle = '#fff0fb'; c.beginPath(); c.arc(sx - .5, -12.5, 1.2 + charge * 1.2, 0, TAU); c.fill(); }
          c.restore();
        } },
      // Crimson Bombard (siege minion): slow armoured cart, alternates straight cannonballs and lobbed shells.
      cannon: { hp: 95, sp: 32, dmg: 14, xp: 6, r: 16, heavy: true, eye: false,
        init(e) { e.recoil = 0; e.roll = 0; e.shot = 0; e.t1 = 2.5; },
        update(e, Z) {
          const ox = e.x, oy = e.y;
          if (!marchStep(e, Z)) keepRange(e, Z, 300, e.sp);
          e.roll += Math.hypot(e.x - ox, e.y - oy) / 6;
          e.aim = Z.angTo(e);
          e.recoil = Math.max(0, e.recoil - Z.dt * 3);
          if ((e.t1 -= Z.dt) <= 0) {
            e.t1 = 3.8;
            if (Z.dist(e) < 620) {
              const a = e.aim;
              if (e.shot++ % 2 === 0) Z.shoot(e.x + Math.cos(a) * 20, e.y + Math.sin(a) * 20, a, 125, { r: 10, dmg: 12, life: 6, col: '255,150,40' });
              else Z.hazard(Z.P.x + Z.rnd(-20, 20), Z.P.y + Z.rnd(-20, 20), { r: 62, t: 1.2, dmg: 12, col: '255,120,40' });
              e.recoil = 1; Z.sfx('shoot'); Z.burst(e.x + Math.cos(a) * 22, e.y + Math.sin(a) * 22, '#ffb060', 6, 90);
            }
          }
        },
        draw(e, Z, white) {
          const c = Z.ctx, W = col => (white ? '#fff' : col), O = W(INK), f = face(e), a = Number.isFinite(e.aim) ? e.aim : e.ang;
          c.save(); c.translate(e.x, e.y); c.lineJoin = 'round'; c.strokeStyle = O; c.lineWidth = 2.5;
          c.save(); c.scale(f, 1);
          c.fillStyle = W('#d8302a'); c.beginPath(); c.moveTo(-12, -9); c.lineTo(-12, -24); c.lineTo(-2, -20); c.lineTo(-12, -16); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = W('#6a3a1e'); c.fillRect(-16, -5, 32, 12); c.strokeRect(-16, -5, 32, 12);
          c.fillStyle = W('#d8302a'); c.fillRect(-14, -10, 26, 7); c.strokeRect(-14, -10, 26, 7);
          c.fillStyle = W('#ffcf4a'); c.fillRect(-14, -11, 26, 2.5); c.fillRect(-16, 1, 32, 2);
          c.fillStyle = W('#2a2018');
          c.beginPath(); c.arc(-9, 8, 6.5, 0, TAU); c.moveTo(15.5, 8); c.arc(9, 8, 6.5, 0, TAU); c.fill(); c.stroke();
          c.strokeStyle = W('#ffcf4a'); c.lineWidth = 1.6; c.beginPath();
          for (const wx of [-9, 9]) for (let j = 0; j < 2; j++) { const sa = e.roll + j * Math.PI / 2; c.moveTo(wx + Math.cos(sa) * 5, 8 + Math.sin(sa) * 5); c.lineTo(wx - Math.cos(sa) * 5, 8 - Math.sin(sa) * 5); }
          c.stroke();
          c.restore();
          c.rotate(a); c.translate(-e.recoil * 6, -3); c.strokeStyle = O; c.lineWidth = 2.5;
          c.fillStyle = W('#4a5260'); c.fillRect(-6, -5.5, 24, 11); c.strokeRect(-6, -5.5, 24, 11);
          c.fillStyle = W('#ffcf4a'); c.fillRect(16, -7, 5, 14); c.strokeRect(16, -7, 5, 14);
          c.fillStyle = O; c.beginPath(); c.arc(-6, 0, 5.5, 0, TAU); c.fill();
          if (!white && e.recoil > .6) { c.fillStyle = '#ffe070'; c.beginPath(); c.arc(25, 0, 4 + e.recoil * 5, 0, TAU); c.fill(); }
          c.restore();
        } },
      // Ember Talonbird (jungle raptor): circles, winds up with a shriek, then darts through the hero.
      raptor: { hp: 13, sp: 95, dmg: 7, xp: 2, r: 8, eye: '#ffe060',
        init(e) { e.mode = 'circle'; e.t1 = 1 + Math.random() * 1.5; },
        update(e, Z) {
          if (e.mode === 'dash') {
            Z.move(e, Math.cos(e.ang) * 340, Math.sin(e.ang) * 340);
            if ((e.t1 -= Z.dt) <= 0) { e.mode = 'circle'; e.t1 = 1.8 + Z.rnd(0, 1.2); }
          } else if (e.mode === 'wind') {
            Z.move(e, -Math.cos(e.ang) * 30, -Math.sin(e.ang) * 30); e.ang = Z.angTo(e);
            if ((e.t1 -= Z.dt) <= 0) { e.mode = 'dash'; e.t1 = .42; }
          } else {
            const d = Z.dist(e), a = Z.angTo(e), side = e.seed > 3 ? 1 : -1, k = d > 170 ? 1 : -.2;
            Z.move(e, (Math.cos(a) * k - Math.sin(a) * side * .8) * e.sp, (Math.sin(a) * k + Math.cos(a) * side * .8) * e.sp);
            e.ang = Math.atan2(Math.sin(a) * k + Math.cos(a) * side * .8, Math.cos(a) * k - Math.sin(a) * side * .8);
            if ((e.t1 -= Z.dt) <= 0 && d < 420) { e.mode = 'wind'; e.t1 = .45; e.ang = a; }
          }
        },
        draw(e, Z, white) {
          const c = Z.ctx, W = col => (white ? '#fff' : col), O = W(INK), dash = e.mode === 'dash', wind = e.mode === 'wind';
          const flap = Math.sin(e.ph * (dash ? 6 : 20) + e.seed) * (dash ? .2 : .9);
          c.save(); c.translate(e.x + (wind ? Math.sin(e.ph * 60) * 1.5 : 0), e.y); c.rotate(e.ang);
          c.lineJoin = 'round'; c.strokeStyle = O; c.lineWidth = 2.2;
          c.fillStyle = W('#a8261a'); c.beginPath();
          for (const s of [-1, 1]) { c.moveTo(2, 0); c.lineTo(-4, s * (11 + flap * 4)); c.lineTo(-10, s * (8 + flap * 3)); c.lineTo(-3, s * 2); c.closePath(); }
          c.fill(); c.stroke();
          c.fillStyle = W('#ffb347'); c.beginPath(); c.moveTo(-6, 0); c.lineTo(-14, -4); c.lineTo(-11, 0); c.lineTo(-14, 4); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = W('#ff6a2a'); c.beginPath(); c.ellipse(0, 0, 8.5, 5, 0, 0, TAU); c.fill(); c.stroke();
          c.fillStyle = W('#ffe060'); c.beginPath(); c.moveTo(7, -2.5); c.lineTo(14 + (wind ? 2 : 0), 0); c.lineTo(7, 2.5); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = W('#ffd27a'); c.beginPath(); c.moveTo(4, -3); c.lineTo(-2, -8); c.lineTo(1, -2.5); c.closePath(); c.fill();
          c.restore();
        } },
      // Riftling (boss summon): a writhing void mote that wobbles toward the hero.
      voidling: { hp: 11, sp: 88, dmg: 7, xp: 1, r: 8, eye: '#d8ff6a',
        update(e, Z) {
          const a = Z.angTo(e) + Math.sin(e.ph * 5 + e.seed) * .6;
          Z.move(e, Math.cos(a) * e.sp, Math.sin(a) * e.sp); e.ang = a;
        },
        draw(e, Z, white) {
          const c = Z.ctx, W = col => (white ? '#fff' : col), O = W(INK), p = 1 + Math.sin(e.ph * 9) * .1;
          c.save(); c.translate(e.x, e.y); c.lineCap = 'round';
          c.beginPath();
          for (let j = 0; j < 5; j++) { const a = j / 5 * TAU + e.ph * 1.5, b = a + Math.sin(e.ph * 6 + j); c.moveTo(Math.cos(a) * 5, Math.sin(a) * 5); c.quadraticCurveTo(Math.cos(a + .5) * 10, Math.sin(a + .5) * 10, Math.cos(b) * 13, Math.sin(b) * 13); }
          c.strokeStyle = O; c.lineWidth = 5; c.stroke();
          c.strokeStyle = W('#b06aff'); c.lineWidth = 2.4; c.stroke();
          c.fillStyle = W('#7a32d8'); c.strokeStyle = O; c.lineWidth = 2.4; c.beginPath(); c.arc(0, 0, 8 * p, 0, TAU); c.fill(); c.stroke();
          c.fillStyle = W('#d8ff6a'); c.beginPath(); c.arc(0, 1, 3.5 * p, 0, TAU); c.fill();
          c.restore();
        } },
    },

    // Miniboss: a colossal pit-serpent that coils up from beneath the river.
    boss: { name: "Vharoth'Zul, the Coil Beneath", hp: 3800, sp: 52, dmg: 24, xp: 0, r: 48, heavy: true, eye: '#d8ff4a',
      init(e, Z) { e.tr = []; e.q = []; e.pi = 0; e.cd = 2; e.wind = 0; e.act = ''; e.open = 0; e.enr = false; Z.banner("Vharoth'Zul rises from the rift!", '#c07aff', true); Z.shake(8); },
      update(e, Z) {
        if (!e.enr && e.hp < e.max * .4) { e.enr = true; Z.banner("Vharoth'Zul is ENRAGED!", '#ff4fa0', true); Z.sfx('boss'); Z.shake(14); e.cd = Math.min(e.cd, .8); }
        runQueue(e, Z);
        e.open = Math.max(0, e.open - Z.dt * 1.2);
        if (e.wind > 0) {
          e.wind -= Z.dt; Z.move(e, 0, 0); e.ang = Z.angTo(e);
          if (e.wind <= 0) bossFire(e, Z);
        } else {
          const a = Z.angTo(e), w = Math.sin(e.ph * 2.2) * .9, sp = e.sp * (e.enr ? 1.3 : 1) * (Z.dist(e) < 120 ? .5 : 1);
          Z.move(e, (Math.cos(a) - Math.sin(a) * w) * sp, (Math.sin(a) + Math.cos(a) * w) * sp);
          e.ang = Math.atan2(Math.sin(a) + Math.cos(a) * w, Math.cos(a) - Math.sin(a) * w);
          if ((e.cd -= Z.dt) <= 0) {
            e.act = BOSS_PAT[e.pi++ % BOSS_PAT.length];
            e.wind = WIND[e.act] * (e.enr ? .8 : 1);
            e.cd = (e.enr ? 1.7 : 2.6);
            if (e.act === 'slam') { Z.hazard(e.x, e.y, { r: 150, t: e.wind, dmg: 18, col: '200,120,255' }); Z.sfx('warn'); }
            else Z.sfx('charge');
          }
        }
        e.tr.unshift({ x: e.x, y: e.y }); if (e.tr.length > 64) e.tr.length = 64;
      },
      draw(e, Z, white) {
        const c = Z.ctx, W = col => (white ? '#fff' : col), O = W(INK), tr = e.tr || [], r = e.r, enr = e.enr;
        const act = e.wind > 0 ? e.act : '', wk = e.wind > 0 ? 1 - e.wind / (WIND[e.act] || 1) : 0;
        // ---- coiled body: segments batched into a few paths ----
        const body = new Path2D(), plate = new Path2D(), spk = new Path2D(), spots = new Path2D(), belly = new Path2D();
        for (let j = 8; j >= 1; j--) {
          const p = tr[Math.min(tr.length - 1, j * 7)] || e, q = tr[Math.min(tr.length - 1, j * 7 - 4)] || e;
          const sr = r * (.9 - j * .065), a = Math.atan2(q.y - p.y, q.x - p.x) || 0, ca = Math.cos(a), sa = Math.sin(a);
          const sx = p.x + Math.sin(j * 1.3 + e.ph * 3) * 2, sy = p.y;
          body.moveTo(sx + ca * sr, sy + sa * sr); body.ellipse(sx, sy, sr, sr * .86, a, 0, TAU);
          belly.moveTo(sx + ca * sr * .3 - sa * sr * .55, sy + sa * sr * .3 + ca * sr * .55); belly.ellipse(sx - sa * sr * .55, sy + ca * sr * .55, sr * .55, sr * .22, a, 0, TAU);
          const px = sx - ca * sr * .08 + sa * sr * .1, py = sy - sa * sr * .08 - ca * sr * .1;
          plate.moveTo(px + ca * sr * .66, py + sa * sr * .66); plate.ellipse(px, py, sr * .66, sr * .5, a, 0, TAU);
          // dorsal crest spike, swept back
          const nx = sa, ny = -ca, L = sr * (1.05 + (j % 2) * .25);
          spk.moveTo(sx - ca * sr * .4 + nx * sr * .3, sy - sa * sr * .4 + ny * sr * .3);
          spk.lineTo(sx - ca * sr * .55 + nx * L, sy - sa * sr * .55 + ny * L);
          spk.lineTo(sx + ca * sr * .3 + nx * sr * .3, sy + sa * sr * .3 + ny * sr * .3); spk.closePath();
          if (j % 2) { spots.moveTo(px + sr * .14, py); spots.arc(px, py, sr * .14, 0, TAU); }
        }
        c.save(); c.lineJoin = 'round';
        c.strokeStyle = O; c.lineWidth = 6; c.stroke(spk); c.stroke(body);
        c.fillStyle = W(enr ? '#ff5ab0' : '#d6b4ff'); c.fill(spk);
        c.fillStyle = W('#4b1f86'); c.fill(body);
        c.fillStyle = W('#c48a4a'); c.fill(belly);
        c.fillStyle = W(enr ? '#a63ad8' : '#7b42d6'); c.fill(plate);
        c.strokeStyle = W('#2a0e4a'); c.lineWidth = 2; c.stroke(plate);
        if (!white) { c.fillStyle = '#c8ff3a'; c.fill(spots); }
        c.restore();
        // ---- head ----
        const rear = act === 'slam' ? 1 + wk * .18 : 1, shakeX = act === 'spikes' ? Math.sin(e.ph * 70) * 2 : 0;
        c.save(); c.translate(e.x + shakeX, e.y - (rear - 1) * 40);
        if (!white && rear > 1) { c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0, (rear - 1) * 40 + r * .6, r * .9, r * .35, 0, 0, TAU); c.fill(); }
        c.rotate(e.ang); c.scale(rear, rear); c.lineJoin = 'round';
        const jaw = .25 + Math.max(e.open, act === 'spit' ? wk : 0) * .5;
        // jaws with fangs
        const jw = new Path2D(), fang = new Path2D();
        for (const s of [-1, 1]) {
          const cs = Math.cos(s * jaw), sn = Math.sin(s * jaw), R = (x, y) => [x * cs - y * sn, x * sn + y * cs];
          const P = [R(r * .2, s * r * .22), R(r * 1.2, s * r * .1), R(r * .95, s * r * .42), R(r * .1, s * r * .58)];
          jw.moveTo(P[0][0], P[0][1]); for (let i = 1; i < 4; i++) jw.lineTo(P[i][0], P[i][1]); jw.closePath();
          for (const fx of [.55, .8, 1.05]) { const A = R(r * fx, s * r * .2), B = R(r * (fx + .06), -s * r * .02), C = R(r * (fx + .12), s * r * .18); fang.moveTo(A[0], A[1]); fang.lineTo(B[0], B[1]); fang.lineTo(C[0], C[1]); fang.closePath(); }
        }
        c.strokeStyle = O; c.lineWidth = 5; c.stroke(jw);
        c.fillStyle = W('#2e1052'); c.fill(jw);
        c.fillStyle = W('#f4ecff'); c.fill(fang);
        if (!white && (act === 'spit' || e.open > 0)) { c.fillStyle = '#e070ff'; c.globalAlpha = clamp(.4 + wk * .6 + e.open * .5, 0, 1); c.beginPath(); c.arc(r * .6, 0, r * .3, 0, TAU); c.fill(); c.globalAlpha = 1; }
        // swept horns
        const horn = new Path2D();
        for (const s of [-1, 1]) { horn.moveTo(-r * .05, s * r * .5); horn.quadraticCurveTo(-r * .6, s * r * 1.15, -r * 1.35, s * r * .85); horn.quadraticCurveTo(-r * .8, s * r * .7, -r * .5, s * r * .3); horn.closePath(); }
        c.lineWidth = 5; c.stroke(horn);
        c.fillStyle = W(enr ? '#ff8ad0' : '#e8dcff'); c.fill(horn);
        // skull carapace
        c.fillStyle = W('#5a26a0'); c.beginPath(); c.ellipse(0, 0, r * .85, r * .7, 0, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = W('#8a50e0'); c.beginPath(); c.ellipse(-r * .1, 0, r * .58, r * .42, 0, 0, TAU); c.fill();
        c.fillStyle = W(enr ? '#ff4fa0' : '#c79aff');
        c.beginPath(); c.moveTo(r * .35, 0); c.lineTo(-r * .3, -r * .17); c.lineTo(-r * .62, 0); c.lineTo(-r * .3, r * .17); c.closePath(); c.fill();
        c.lineWidth = 2.5; c.stroke();
        // gold hextech-like brow plates
        c.fillStyle = W('#ffcf4a'); c.beginPath();
        for (const s of [-1, 1]) { c.moveTo(r * .5, s * r * .14); c.lineTo(r * .2, s * r * .52); c.lineTo(r * .02, s * r * .4); c.lineTo(r * .3, s * r * .12); c.closePath(); }
        c.fill(); c.stroke();
        // acid eyes
        if (!white) {
          c.fillStyle = '#d8ff4a'; c.beginPath();
          for (const s of [-1, 1]) for (const [ex, ey, er] of [[.52, .3, .09], [.36, .42, .065], [.2, .5, .05]]) { c.moveTo(r * ex + r * er, s * r * ey); c.arc(r * ex, s * r * ey, r * er, 0, TAU); }
          c.fill();
        }
        if (!white && act === 'summon') { c.strokeStyle = '#d070ff'; c.lineWidth = 4; c.globalAlpha = wk; c.beginPath(); c.arc(0, 0, r * (1.1 + wk * .5), 0, TAU); c.stroke(); c.globalAlpha = 1; }
        c.restore();
      },
      death(e, Z) { Z.burst(e.x, e.y, '#b07aff', 50, 320); Z.burst(e.x, e.y, '#c8ff5a', 24, 220); Z.shake(16); Z.banner('The Coil Beneath has been slain!', '#c8ff5a', true); },
    },

    events: [
      { t: 6, run: Z => wave(Z, false) },
      { t: 19, run: Z => flock(Z, 6, 'Talonbirds shriek from the jungle!') },
      { t: 30, run: Z => wave(Z, false) },
      { t: 41, run: Z => { Z.banner('The river churns... something vast stirs below.', '#b07aff', false); Z.shake(4); } },
      { t: 55, run: Z => wave(Z, true) },
      { t: 70, run: Z => flock(Z, 7, 'A talonbird flock circles overhead!') },
      { t: 80, run: Z => wave(Z, false) },
      { t: 95, run: Z => {
        for (let i = 0; i < 3; i++) { const a = Z.rnd(0, TAU), m = Z.spawn('cannon', Z.P.x + Math.cos(a) * 600, Z.P.y + Math.sin(a) * 600); if (m) m.t1 = 1 + i; }
        Z.banner('Siege engines roll in from every lane!', '#ff8040', false);
      } },
      { t: 104, run: Z => wave(Z, true) },
      { t: 117, run: Z => flock(Z, 8, 'The jungle hunts!') },
      { t: 128, run: Z => wave(Z, true) },
    ],

    // Original epic orchestral-electronic battle cue in D minor, 124 bpm, sixteenth-note grid.
    music: { bpm: 124, div: 4,
      step(s, t, A) {
        const sd = 60 / 124 / 4, bar = Math.floor(s / 16), b = s % 16, sec = Math.floor(bar / 8) % 4; // 0 A, 1 B, 2 A', 3 B'
        const B = sec === 1 || sec === 3, boss = A.boss, prog = sec === 2 ? PROG2 : PROG1;
        const [off, q] = prog[Math.floor((bar % 8) / 2)], third = q === 'm' ? 3 : 4;
        const tones = [0, third, 7, 12, 12 + third];
        const root = 50 + off;
        // drums
        const kicks = boss ? [0, 3, 6, 8, 10, 13] : B ? [0, 7, 8, 10] : [0, 7, 8];
        if (kicks.includes(b)) A.kick(t, b === 0 ? .78 : .62);
        if (b === 4 || b === 12) A.snare(t, .3);
        if (B && b === 15) A.snare(t, .12);
        if (boss) A.hat(t, b % 2 ? .03 : .05, b === 14);
        else if (b % 4 === 2) A.hat(t, .045, b === 14);
        if (b === 0 && bar % 2 === 0) A.tom(t, 72, .4);
        if (bar % 4 === 3 && b >= 12) A.tom(t, [190, 150, 120, 95][b - 12], .34);
        // bass
        const bn = BASS[b];
        if (bn !== undefined || (boss && b % 2 === 1)) {
          const bm = (off > 5 ? 38 + off - 12 : 38 + off) + (bn || 0);
          A.tone(t, bm, sd * 1.7, .075, { type: 'sawtooth', cutoff: 1500 + A.inten * 600, sweep: 220, q: 6, decay: true });
        }
        // staccato string ostinato
        if (bar % 8 !== 0 || b >= 8 || sec !== 0) {
          A.tone(t, root + tones[OST[b]], sd * .55, .022, { type: 'sawtooth', cutoff: 2400, sweep: 800, decay: true, pan: b % 2 ? .3 : -.3 });
        }
        // pads / choir
        if (b === 0 && bar % 2 === 0) {
          if (boss) A.pad([root + 12, root + 12 + third, root + 19], t, sd * 32, .02, { type: 'triangle', cutoff: 1700, q: 2, detune: 14 });
          else A.pad([root + 12, root + 12 + third, root + 19], t, sd * 32, .014, { cutoff: 1000 });
        }
        // heroic brass stabs
        if (B || boss) {
          const stab = bar % 2 === 0 ? (b === 0 || b === 6) : (b === 0 || b === 3 || b === 10);
          if (stab) for (const n of [root, root + third, root + 7]) A.tone(t, n, .22, .026, { type: 'sawtooth', cutoff: 2600, sweep: 700, attack: .01, detune: n === root ? -7 : 7 });
        }
        // lead melody over B sections
        if (B) {
          const ev = MEL[bar % 8].find(m => m[0] === b);
          if (ev) {
            const n = 62 + ev[1] + (sec === 3 && boss ? 12 : 0);
            A.tone(t, n, ev[2] * sd * .95, .045, { type: 'sawtooth', cutoff: 2800, vib: .35, attack: .02, detune: 6 });
            if (sec === 3) A.tone(t, n - 12, ev[2] * sd * .95, .028, { type: 'square', cutoff: 1600, attack: .02 });
          }
        }
        // boss: risers and impacts
        if (boss && b === 0 && bar % 4 === 3) A.noise(t, sd * 16, .045, { type: 'bandpass', f: 300, f2: 5000, q: 2 });
        if (boss && b === 0 && bar % 4 === 0) A.noise(t, 1.1, .05, { type: 'highpass', f: 3000 });
      } },
  };
})());
