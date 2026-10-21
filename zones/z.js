// Zone 'z': a cheeky red-vs-blue robot war on a sun-baked territory map. Original art, names and music.
ZONES.push((() => {
  const TAU = Math.PI * 2, PI = Math.PI;
  const S = 1280; // sector size: sectors are centred on multiples of S (roads cross there)
  const M = 256;  // macro decor grid
  const wrap = a => (Number.isFinite(a) ? (((a + PI) % TAU) + TAU) % TAU - PI : 0);
  const turn = (a, b, m) => a + Math.max(-m, Math.min(m, wrap(b - a)));
  const col = (w, c) => (w ? '#fff' : c);
  const owner = (Z, sx, sy) => Z.hash(sx * 31 + 7, sy * 17 - 3) < .5; // true = red sector

  // ---- palettes ---------------------------------------------------------------
  // robots: loud, saturated, black-outlined
  const OUT = '#120c0a', RED = '#ee2a1c', RED_D = '#98130b', RED_L = '#ff7a58', PANEL = '#fff4dc', GLINT = '#ffe23a';
  const METAL = '#38322f', STEEL = '#9a958f', VIS = '#15100e', BLUE = '#2f7bff';
  // floor: muted, dusty khaki, low contrast
  const DK = '#2a221a', TEAM_R = '#b4463a', TEAM_B = '#3d63b8';
  const team = red => (red ? TEAM_R : TEAM_B);

  // ---- speech bubbles -------------------------------------------------------
  const LINES = {
    grunt: ['Halt, lightbulb!', 'Pew pew pew!', 'For the red flag!', 'I want a raise.', 'Sir, yes, sir!', 'Shiny? Shoot it!', 'My aim is... ok-ish.', 'Who ordered a hexagon?'],
    gunner: ['WAHOOO!', 'Spray and pray!', 'Ammo is cheap!', 'Aim? Never heard of it.', 'Rat-a-tat-tat!', 'I LOVE THIS JOB!'],
    rocket: ['Hold still, please.', 'Rocket mail!', 'Special delivery!', 'Calculating... nah.', 'Target: glowy thing.'],
    tank: ['Beep beep, coming through!', 'Tank you very much.', 'Treads of fury!', 'Who parked here?'],
  };
  function talk(e, Z, lines) {
    if (e.sayT === undefined) e.sayT = Z.rnd(1, 8);
    if ((e.sayT -= Z.dt) > 0) return;
    e.sayT = 8;
    if (Math.random() < .14 && Z.dist(e) < 480) {
      let n = 0; for (const f of Z.foes()) if (f.say && f.ph < f.sayEnd) n++;
      if (n < 3) say(e, lines[Math.floor(Math.random() * lines.length)]);
    }
  }
  function say(e, text, dur = 2.4) { e.say = text; e.sayEnd = e.ph + dur; }
  function bubble(c, e, white, lift = 0) {
    if (white || !e.say || !(e.ph < e.sayEnd)) return;
    c.save();
    c.globalAlpha = Math.max(0, Math.min(1, (e.sayEnd - e.ph) * 3));
    c.font = 'bold 10px "Bricolage Grotesque", sans-serif';
    const w = c.measureText(e.say).width + 10, x = e.x - w / 2, y = e.y - e.r - 34 - lift;
    c.fillStyle = '#fffaf0'; c.strokeStyle = '#2a2018'; c.lineWidth = 1.5;
    c.beginPath(); c.roundRect(x, y, w, 16, 6); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(e.x - 4, y + 15); c.lineTo(e.x + 1, y + 22); c.lineTo(e.x + 4, y + 15); c.closePath(); c.fill();
    c.fillStyle = '#2a2018'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(e.say, e.x, y + 8.5);
    c.restore();
  }
  function sparks(Z, e, n = 8) { Z.burst(e.x, e.y, '#ffb040', n, 130); Z.burst(e.x, e.y, '#6a5a50', 4, 60); }

  // ---- world layout -----------------------------------------------------------
  // Each sector has one concrete base (factory / fort / gun pit) and a flag pad near its crossroads.
  const secCache = new Map();
  function sector(Z, sx, sy) {
    const key = sx + ',' + sy; let s = secCache.get(key); if (s) return s;
    const red = owner(Z, sx, sy), h = Z.hash(sx * 53 + 11, sy * 29 - 7), q = Math.floor(Z.hash(sx * 19 - 4, sy * 41 + 9) * 4) & 3;
    const qx = q & 1 ? 1 : -1, qy = q & 2 ? 1 : -1, cx = sx * S, cy = sy * S, bx = cx + qx * 340, by = cy + qy * 330;
    const type = h < .4 ? 'factory' : h < .7 ? 'fort' : 'guns';
    s = { red, type, bx, by, fx: cx - qx * 118, fy: cy - qy * 118, tur: [], smoke: [], lights: [], fans: [] };
    if (type === 'factory') {
      s.tur.push([bx + 168, by + 70]);
      s.smoke.push([bx + 62, by - 92]);
      s.lights.push([bx - 104, by - 74], [bx + 104, by - 74]);
      s.fans.push([bx - 6, by - 48]);
    } else if (type === 'fort') {
      s.tur.push([bx - 124, by - 124], [bx + 124, by + 124]);
      s.lights.push([bx + 124, by - 124], [bx - 124, by + 124]);
    } else {
      s.tur.push([bx - 85, by + 8], [bx, by - 28], [bx + 85, by + 8]);
      s.lights.push([bx - 120, by - 70], [bx + 120, by - 70]);
    }
    if (secCache.size > 300) secCache.clear();
    secCache.set(key, s); return s;
  }
  // macro decor: one feature per 256 px cell, kept off roads and bases
  function feat(Z, mx, my) {
    const h = Z.hash(mx * 17 + 5, my * 23 - 11), h2 = Z.hash(mx * 5 - 13, my * 7 + 3), h3 = Z.hash(mx * 29 + 1, my * 3 - 17);
    const x = mx * M + 50 + h2 * 156, y = my * M + 50 + h3 * 156;
    let type = h < .13 ? 'mesa' : h < .23 ? 'crater' : h < .32 ? 'scorch' : h < .43 ? 'wreck' : h < .54 ? 'bags' : h < .63 ? 'wire' : h < .77 ? 'rocks' : '';
    const sx = Math.round(x / S), sy = Math.round(y / S), rx = Math.abs(x - sx * S), ry = Math.abs(y - sy * S);
    const big = type === 'mesa' ? 175 : type === 'crater' ? 80 : 60;
    if (type !== 'scorch' && (rx < 40 + big || ry < 40 + big)) type = '';
    const s = sector(Z, sx, sy);
    if (Math.hypot(x - s.bx, y - s.by) < 210 + big || Math.hypot(x - s.fx, y - s.fy) < 70 + big) type = '';
    return { type, x, y, h, h2, h3, mx, my };
  }

  // ---- ground pieces (cached; gradients allowed) ----------------------------
  function scorch(c, x, y, r) {
    const g = c.createRadialGradient(x, y, r * .1, x, y, r);
    g.addColorStop(0, 'rgba(34,26,20,.55)'); g.addColorStop(.6, 'rgba(50,40,30,.25)'); g.addColorStop(1, 'rgba(60,50,40,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
  function mesa(c, Z, f) {
    const N = 13, R = 68 + f.h2 * 44, th = f.h3 * PI, ct = Math.cos(th), st = Math.sin(th), pts = [];
    for (let i = 0; i < N; i++) {
      const a = i / N * TAU, rr = R * (.74 + .38 * Z.hash(f.mx * 3 + i, f.my * 5 - i)), lx = Math.cos(a) * rr * 1.5, ly = Math.sin(a) * rr * .78;
      pts.push([f.x + lx * ct - ly * st, f.y + lx * st + ly * ct]);
    }
    const poly = (dx, dy) => { const p = new Path2D(); p.moveTo(pts[0][0] + dx, pts[0][1] + dy); for (let i = 1; i < N; i++) p.lineTo(pts[i][0] + dx, pts[i][1] + dy); p.closePath(); return p; };
    c.fillStyle = 'rgba(40,28,16,.3)'; c.fill(poly(26, 36));
    const base = poly(0, 32);
    c.fillStyle = '#62574a'; c.fill(base); c.strokeStyle = DK; c.lineWidth = 2.5; c.stroke(base);
    c.fillStyle = '#6e6252'; c.fill(poly(0, 24));
    c.fillStyle = '#7d705e'; c.fill(poly(0, 16));
    c.fillStyle = '#8e816b'; c.fill(poly(0, 8));
    // cliff striations
    const str = new Path2D();
    for (let i = 0; i < N; i++) { const [px, py] = pts[i]; if (py > f.y - 6) { str.moveTo(px, py + 2); str.lineTo(px + 1, py + 30); str.moveTo(px + 9, py + 6); str.lineTo(px + 8, py + 26); } }
    c.strokeStyle = 'rgba(40,30,22,.55)'; c.lineWidth = 1.5; c.stroke(str);
    // plateau top, lit from top-left
    const top = poly(0, 0), g = c.createLinearGradient(f.x - R, f.y - R, f.x + R, f.y + R);
    g.addColorStop(0, '#c6b99c'); g.addColorStop(1, '#a2957b');
    c.fillStyle = g; c.fill(top); c.strokeStyle = DK; c.lineWidth = 2; c.stroke(top);
    const hi = new Path2D(), lo = new Path2D();
    for (let i = 0; i < N; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % N], up = (bx - ax) - (by - ay) > 0;
      (up ? hi : lo).moveTo(ax + (up ? 2 : -2), ay + (up ? 2 : -2)); (up ? hi : lo).lineTo(bx + (up ? 2 : -2), by + (up ? 2 : -2));
    }
    c.lineWidth = 2.5; c.strokeStyle = '#e0d5b8'; c.stroke(hi); c.strokeStyle = 'rgba(70,58,44,.5)'; c.stroke(lo);
    // boulders and cracks on top
    const b = new Path2D(), bh = new Path2D(), cr = new Path2D();
    for (let i = 0; i < 5; i++) {
      const u = Z.hash(f.mx + i * 7, f.my - i * 3) - .5, v = Z.hash(f.my + i * 5, f.mx + i) - .5, px = f.x + u * R * 1.2, py = f.y + v * R * .6, r = 4 + 4 * Z.hash(i, f.mx + f.my);
      b.moveTo(px + r, py); b.ellipse(px, py, r, r * .75, 0, 0, TAU); bh.moveTo(px - r * .2, py - r * .3); bh.ellipse(px - r * .3, py - r * .3, r * .45, r * .3, 0, 0, TAU);
      cr.moveTo(px + 10, py + 6); cr.lineTo(px + 18, py + 3); cr.lineTo(px + 24, py + 8);
    }
    c.fillStyle = '#7f725f'; c.fill(b); c.strokeStyle = DK; c.lineWidth = 1.2; c.stroke(b);
    c.fillStyle = '#d4c8ab'; c.fill(bh);
    c.strokeStyle = 'rgba(60,48,36,.6)'; c.stroke(cr);
  }
  function crater(c, Z, f) {
    const x = f.x, y = f.y, r = 30 + f.h2 * 28;
    scorch(c, x, y, r * 2);
    c.fillStyle = '#bcb092'; c.beginPath(); c.ellipse(x, y, r * 1.18, r * .86, 0, 0, TAU); c.fill();
    c.fillStyle = '#4f4537'; c.beginPath(); c.ellipse(x, y, r, r * .7, 0, 0, TAU); c.fill();
    c.strokeStyle = DK; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#86795f'; c.beginPath(); c.ellipse(x + r * .14, y + r * .14, r * .8, r * .52, 0, 0, TAU); c.fill();
    c.fillStyle = '#5c5141'; c.beginPath(); c.ellipse(x + r * .05, y + r * .06, r * .32, r * .2, 0, 0, TAU); c.fill();
    const d = new Path2D();
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + f.h, rr = r * (1.3 + .5 * Z.hash(i, f.mx)), px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * .75, s = 2 + 3 * Z.hash(f.my, i); d.rect(px, py, s, s * .8); }
    c.fillStyle = '#7a6e5a'; c.fill(d); c.strokeStyle = 'rgba(42,34,26,.7)'; c.lineWidth = 1; c.stroke(d);
  }
  function scorchMark(c, Z, f) {
    const r = 34 + f.h2 * 26;
    scorch(c, f.x, f.y, r);
    const p = new Path2D();
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, rr = (i % 2 ? .45 : 1.05) * r * (.8 + .3 * Z.hash(i, f.mx)); i ? p.lineTo(f.x + Math.cos(a) * rr, f.y + Math.sin(a) * rr * .8) : p.moveTo(f.x + rr, f.y); }
    p.closePath(); c.fillStyle = 'rgba(30,24,18,.32)'; c.fill(p);
  }
  function wreck(c, Z, f) {
    const hull = f.h2 > .5 ? '#4b5a78' : '#7d4a3e', hullL = f.h2 > .5 ? '#6e7d9a' : '#9c6656';
    scorch(c, f.x, f.y, 58);
    c.save(); c.translate(f.x, f.y); c.rotate(f.h * 40);
    c.lineJoin = 'round'; c.strokeStyle = DK; c.lineWidth = 2;
    c.fillStyle = 'rgba(30,22,14,.3)'; c.fillRect(-22, -14, 54, 40);
    if (f.h3 < .45) { // burnt-out tank
      c.fillStyle = '#34302b'; c.beginPath(); c.rect(-27, -21, 54, 11); c.rect(-27, 10, 54, 11); c.fill(); c.stroke();
      const l = new Path2D(); for (let i = -24; i < 27; i += 6) { l.moveTo(i, -21); l.lineTo(i, -10); l.moveTo(i, 10); l.lineTo(i, 21); }
      c.strokeStyle = '#5e5850'; c.lineWidth = 1.5; c.stroke(l);
      c.fillStyle = hull; c.beginPath(); c.rect(-21, -12, 42, 24); c.fill(); c.strokeStyle = DK; c.lineWidth = 2; c.stroke();
      c.fillStyle = hullL; c.fillRect(-20, -11, 40, 3);
      c.fillStyle = 'rgba(18,14,10,.6)'; c.beginPath(); c.ellipse(-3, 2, 12, 8, .4, 0, TAU); c.ellipse(12, -5, 6, 4, 0, 0, TAU); c.fill();
      c.fillStyle = hull; c.beginPath(); c.arc(32, 22, 9, 0, TAU); c.fill(); c.stroke();
      c.strokeStyle = DK; c.lineWidth = 4; c.beginPath(); c.moveTo(38, 26); c.lineTo(50, 30); c.lineTo(56, 40); c.stroke();
    } else if (f.h3 < .75) { // toppled robot
      c.fillStyle = hull; c.beginPath(); c.roundRect(-12, -8, 22, 16, 4); c.fill(); c.stroke();
      c.beginPath(); c.roundRect(14, -9, 15, 15, 5); c.fill(); c.stroke();
      c.fillStyle = VIS; c.fillRect(20, -5, 6, 7);
      c.fillStyle = '#3a342f'; c.beginPath(); c.rect(-24, -6, 12, 5); c.rect(-24, 2, 12, 5); c.rect(-30, 14, 14, 4); c.fill(); c.stroke();
      c.fillStyle = hullL; c.fillRect(-11, -7, 18, 3);
      c.fillStyle = 'rgba(18,14,10,.55)'; c.beginPath(); c.ellipse(0, 2, 8, 5, 0, 0, TAU); c.fill();
    } else { // jeep
      c.fillStyle = '#2b2622'; c.beginPath(); c.rect(-18, -16, 9, 6); c.rect(10, -16, 9, 6); c.rect(-18, 10, 9, 6); c.fill(); c.stroke();
      c.fillStyle = hull; c.beginPath(); c.roundRect(-22, -11, 46, 22, 5); c.fill(); c.stroke();
      c.fillStyle = '#9fb0b8'; c.fillRect(8, -9, 4, 18); c.fillStyle = hullL; c.fillRect(-20, -9, 26, 3);
      c.fillStyle = 'rgba(18,14,10,.6)'; c.beginPath(); c.ellipse(-6, 3, 11, 6, 0, 0, TAU); c.fill();
      c.fillStyle = '#2b2622'; c.beginPath(); c.arc(30, 20, 5, 0, TAU); c.fill();
    }
    c.restore();
  }
  function bags(c, Z, f) {
    const R = 46 + f.h2 * 26, a0 = f.h * TAU, span = 1.2 + f.h3 * 1.6, n = Math.round(span * R / 19);
    const sh = new Path2D(), bg = new Path2D(), hl = new Path2D();
    for (let row = 0; row < 2; row++)
      for (let i = 0; i <= n - row; i++) {
        const a = a0 + (i + row * .5) / n * span, rr = R - row * 2, px = f.x + Math.cos(a) * rr, py = f.y + Math.sin(a) * rr * .8 - row * 9, ro = a + PI / 2;
        sh.moveTo(px + 15, py + 6); sh.ellipse(px + 4, py + 6, 11, 7, ro, 0, TAU);
        bg.moveTo(px + 11, py); bg.ellipse(px, py, 11, 7, ro, 0, TAU);
        hl.moveTo(px + 2, py - 3); hl.ellipse(px - 2, py - 3, 5, 2.5, ro, 0, TAU);
      }
    c.fillStyle = 'rgba(40,30,18,.35)'; c.fill(sh);
    c.fillStyle = '#b8a77e'; c.fill(bg); c.strokeStyle = '#3c3020'; c.lineWidth = 1.6; c.stroke(bg);
    c.fillStyle = '#dccca0'; c.fill(hl);
  }
  function wire(c, Z, f) {
    const a = f.h * PI, ca = Math.cos(a), sa = Math.sin(a), L = 70 + f.h2 * 50;
    const post = new Path2D(), coil = new Path2D(), shd = new Path2D();
    for (let d = -L; d <= L; d += 6) {
      const px = f.x + ca * d, py = f.y + sa * d;
      coil.moveTo(px + 6, py - 6); coil.ellipse(px, py - 6, 6, 5, a, 0, TAU);
      shd.moveTo(px + 9, py + 1); shd.ellipse(px + 3, py + 1, 6, 4, a, 0, TAU);
    }
    for (let d = -L; d <= L; d += 34) { const px = f.x + ca * d, py = f.y + sa * d; post.rect(px - 2, py - 16, 4, 16); }
    c.strokeStyle = 'rgba(40,30,20,.22)'; c.lineWidth = 1.4; c.stroke(shd);
    c.fillStyle = '#6a5440'; c.fill(post); c.strokeStyle = DK; c.lineWidth = 1.2; c.stroke(post);
    c.strokeStyle = '#4a4540'; c.lineWidth = 1.3; c.stroke(coil);
    c.strokeStyle = 'rgba(220,214,200,.5)'; c.lineWidth = .7; c.stroke(coil);
  }
  function rocks(c, Z, f) {
    const sh = new Path2D(), b = new Path2D(), hl = new Path2D(), n = 3 + Math.floor(f.h3 * 3);
    for (let i = 0; i < n; i++) {
      const px = f.x + (Z.hash(f.mx * 3 + i, f.my) - .5) * 70, py = f.y + (Z.hash(f.my * 3 - i, f.mx) - .5) * 50, r = 6 + 10 * Z.hash(i, f.mx * 7 + f.my);
      sh.moveTo(px + r + 5, py + 5); sh.ellipse(px + 5, py + 5, r, r * .7, 0, 0, TAU);
      b.moveTo(px + r, py); b.ellipse(px, py, r, r * .75, 0, 0, TAU);
      hl.moveTo(px - r * .1, py - r * .3); hl.ellipse(px - r * .3, py - r * .3, r * .45, r * .28, -.4, 0, TAU);
    }
    c.fillStyle = 'rgba(40,28,16,.3)'; c.fill(sh);
    c.fillStyle = '#8a7e69'; c.fill(b); c.strokeStyle = DK; c.lineWidth = 1.8; c.stroke(b);
    c.fillStyle = '#c3b799'; c.fill(hl);
  }
  // concrete pieces: chunky slab with a visible south face, lit top-left
  function slab(c, x, y, w, h, face, top, side) {
    c.fillStyle = 'rgba(30,22,14,.34)'; c.fillRect(x + 12, y + 14, w, h + face);
    c.fillStyle = side; c.fillRect(x, y + h, w, face);
    const g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, top[0]); g.addColorStop(1, top[1]);
    c.fillStyle = g; c.fillRect(x, y, w, h);
    c.strokeStyle = DK; c.lineWidth = 2.5; c.strokeRect(x, y, w, h + face);
    c.beginPath(); c.moveTo(x, y + h); c.lineTo(x + w, y + h); c.stroke();
    c.strokeStyle = 'rgba(255,250,235,.45)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 2, y + h - 2); c.lineTo(x + 2, y + 2); c.lineTo(x + w - 2, y + 2); c.stroke();
  }
  function hazardRect(c, x, y, w, h) {
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.fillStyle = '#d9b42e'; c.fillRect(x, y, w, h);
    const p = new Path2D(); for (let i = -h; i < w; i += 10) { p.moveTo(x + i, y + h); p.lineTo(x + i + h, y); p.lineTo(x + i + h + 5, y); p.lineTo(x + i + 5, y + h); p.closePath(); }
    c.fillStyle = '#231c16'; c.fill(p); c.restore();
    c.strokeStyle = DK; c.lineWidth = 1.5; c.strokeRect(x, y, w, h);
  }
  function plinth(c, x, y) {
    const oct = (dx, dy, r) => { const p = new Path2D(); for (let i = 0; i < 8; i++) { const a = (i + .5) / 8 * TAU; i ? p.lineTo(x + dx + Math.cos(a) * r, y + dy + Math.sin(a) * r * .85) : p.moveTo(x + dx + Math.cos(a) * r, y + dy + Math.sin(a) * r * .85); } p.closePath(); return p; };
    c.fillStyle = 'rgba(30,22,14,.35)'; c.fill(oct(10, 14, 20));
    const f = oct(0, 9, 19); c.fillStyle = '#5c5850'; c.fill(f); c.strokeStyle = DK; c.lineWidth = 2; c.stroke(f);
    const t = oct(0, 0, 19); c.fillStyle = '#aaa597'; c.fill(t); c.stroke(t);
    c.fillStyle = '#c9c4b6'; c.beginPath(); c.arc(x - 4, y - 4, 7, 0, TAU); c.fill();
    c.fillStyle = '#4a463f'; c.beginPath(); c.arc(x, y, 12, 0, TAU); c.fill();
  }
  function emblem(c, x, y, r, red) {
    c.fillStyle = team(red); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.strokeStyle = '#e8e2d2'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r - 4, 0, TAU); c.stroke();
    c.strokeStyle = DK; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
    // robot-head glyph
    c.fillStyle = '#e8e2d2'; c.fillRect(x - r * .4, y - r * .35, r * .8, r * .7);
    c.fillStyle = DK; c.fillRect(x - r * .3, y - r * .15, r * .6, r * .2);
  }
  function factory(c, s) {
    const { bx, by, red } = s, L = bx - 110, T = by - 80, W = 220, Hh = 118, wallY = T + Hh, wallH = 28;
    // apron
    c.fillStyle = '#9b968a'; c.fillRect(L - 26, T - 22, W + 52, Hh + wallH + 80);
    c.strokeStyle = '#5f5b52'; c.lineWidth = 2; c.strokeRect(L - 26, T - 22, W + 52, Hh + wallH + 80);
    const gl = new Path2D(); for (let i = 0; i < 6; i++) { gl.rect(bx - 30 + i * 12, wallY + wallH + 14, 5, 36); }
    c.fillStyle = '#b9a35a'; c.fill(gl);
    slab(c, L, T, W, Hh, wallH, ['#d2cdc0', '#9f9a8e'], '#6c6860');
    // wall panels + door
    const pl = new Path2D(); for (let x = L + 20; x < L + W; x += 20) { pl.moveTo(x, wallY + 2); pl.lineTo(x, wallY + wallH); }
    c.strokeStyle = 'rgba(30,24,18,.45)'; c.lineWidth = 1.5; c.stroke(pl);
    hazardRect(c, bx - 40, wallY + 1, 80, wallH);
    c.fillStyle = '#29241f'; c.fillRect(bx - 32, wallY + 5, 64, wallH - 5);
    const sh = new Path2D(); for (let y = wallY + 8; y < wallY + wallH; y += 4) { sh.moveTo(bx - 32, y); sh.lineTo(bx + 32, y); }
    c.strokeStyle = '#4c463f'; c.lineWidth = 1.5; c.stroke(sh);
    // roof ribs + team stripe
    const rb = new Path2D(), rl = new Path2D(); for (let x = L + 22; x < L + W - 4; x += 22) { rb.moveTo(x, T + 3); rb.lineTo(x, wallY - 14); rl.moveTo(x + 2, T + 3); rl.lineTo(x + 2, wallY - 14); }
    c.strokeStyle = 'rgba(70,64,56,.45)'; c.lineWidth = 1.5; c.stroke(rb); c.strokeStyle = 'rgba(255,252,240,.35)'; c.stroke(rl);
    c.fillStyle = team(red); c.fillRect(L + 2, wallY - 12, W - 4, 10);
    c.strokeStyle = DK; c.lineWidth = 1.5; c.strokeRect(L + 2, wallY - 12, W - 4, 10);
    emblem(c, bx - 56, by - 34, 22, red);
    // roof vents (fan housings; blades spin in `under`)
    for (const [vx, vy] of s.fans) {
      c.fillStyle = '#6a665e'; c.beginPath(); c.arc(vx + 3, vy + 4, 15, 0, TAU); c.fill();
      c.fillStyle = '#bdb8ab'; c.beginPath(); c.arc(vx, vy, 15, 0, TAU); c.fill(); c.strokeStyle = DK; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#2a2622'; c.beginPath(); c.arc(vx, vy, 11, 0, TAU); c.fill();
    }
    for (const [vx, vy] of [[bx + 20, by - 8], [bx + 48, by - 8]]) slab(c, vx, vy, 18, 14, 6, ['#cfcabc', '#a8a396'], '#6c6860');
    // chimney
    const cx = bx + 62, cb = by - 30, ct = cb - 62;
    c.fillStyle = 'rgba(30,22,14,.3)'; c.beginPath(); c.moveTo(cx - 10, cb); c.lineTo(cx + 40, cb + 30); c.lineTo(cx + 56, cb + 20); c.lineTo(cx + 13, cb - 6); c.fill();
    const g = c.createLinearGradient(cx - 13, 0, cx + 13, 0); g.addColorStop(0, '#dcd6c9'); g.addColorStop(.45, '#b4aea1'); g.addColorStop(1, '#6c675e');
    c.fillStyle = g; c.beginPath(); c.moveTo(cx - 13, ct); c.lineTo(cx - 13, cb); c.ellipse(cx, cb, 13, 5, 0, PI, 0, true); c.lineTo(cx + 13, ct); c.closePath(); c.fill();
    c.strokeStyle = DK; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = team(red); c.fillRect(cx - 13, ct + 10, 26, 7); c.fillRect(cx - 13, ct + 28, 26, 7);
    c.fillStyle = '#e8e3d7'; c.beginPath(); c.ellipse(cx, ct, 13, 5, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#1c1714'; c.beginPath(); c.ellipse(cx, ct, 9, 3.2, 0, 0, TAU); c.fill();
    for (const [lx, ly] of s.lights) { c.fillStyle = DK; c.beginPath(); c.arc(lx, ly, 4.5, 0, TAU); c.fill(); c.fillStyle = '#7a2a20'; c.beginPath(); c.arc(lx, ly, 2.8, 0, TAU); c.fill(); }
    for (const [tx, ty] of s.tur) plinth(c, tx, ty);
  }
  function fort(c, s) {
    const { bx, by, red } = s, O = 124, th = 24, face = 14, I = O - th;
    c.fillStyle = 'rgba(30,22,14,.34)'; c.fillRect(bx - O + 16, by - O + 18, O * 2 + 8, O * 2 + face + 6);
    // courtyard
    c.fillStyle = '#958f82'; c.fillRect(bx - I, by - I, I * 2, I * 2);
    const tg = new Path2D(); for (let k = -I + 25; k < I; k += 25) { tg.moveTo(bx + k, by - I); tg.lineTo(bx + k, by + I); tg.moveTo(bx - I, by + k); tg.lineTo(bx + I, by + k); }
    c.strokeStyle = 'rgba(70,64,56,.35)'; c.lineWidth = 1; c.stroke(tg);
    emblem(c, bx, by + 6, 30, red);
    c.fillStyle = '#5f5a52'; c.fillRect(bx - I, by - I, I * 2, face);
    c.fillStyle = 'rgba(30,22,14,.25)'; c.fillRect(bx - I, by - I + face, I * 2, 10);
    // wall tops
    const wl = new Path2D(); wl.rect(bx - O, by - O, O * 2, O * 2); wl.rect(bx + I, by - I, -I * 2, I * 2);
    const g = c.createLinearGradient(bx - O, by - O, bx + O, by + O); g.addColorStop(0, '#d0cabc'); g.addColorStop(1, '#9e988b');
    c.fillStyle = g; c.fill(wl);
    c.fillStyle = '#5c574f'; c.fillRect(bx - O, by + O, O * 2, face);
    c.strokeStyle = DK; c.lineWidth = 2.5; c.strokeRect(bx - O, by - O, O * 2, O * 2 + face); c.strokeRect(bx - I, by - I, I * 2, I * 2);
    // gate
    c.fillStyle = '#4a3828'; c.fillRect(bx - 22, by + I - 2, 44, th + face + 2);
    const pk = new Path2D(); for (let x = bx - 22 + 7; x < bx + 22; x += 7) { pk.moveTo(x, by + I); pk.lineTo(x, by + O + face); }
    c.strokeStyle = '#2a1e14'; c.lineWidth = 1.5; c.stroke(pk);
    c.fillStyle = team(red); c.fillRect(bx - 22, by + O - 4, 44, 6);
    c.strokeStyle = DK; c.lineWidth = 2; c.strokeRect(bx - 22, by + I - 2, 44, th + face + 2);
    // crenellations along the outer edge
    const mt = new Path2D(), mf = new Path2D(), m = 9;
    const mer = (x, y) => { mt.rect(x, y - 5, m, m); mf.rect(x, y - 5 + m, m, 5); };
    for (let k = -O + 30; k < O - 36; k += 18) { if (Math.abs(k + m / 2) > 26) mer(bx + k, by + O - m); mer(bx + k, by - O); }
    for (let k = -O + 30; k < O - 36; k += 18) { mer(bx - O, by + k); mer(bx + O - m, by + k); }
    c.fillStyle = '#5c574f'; c.fill(mf); c.fillStyle = '#ddd7c9'; c.fill(mt);
    c.strokeStyle = DK; c.lineWidth = 1.5; c.stroke(mt); c.stroke(mf);
    // corner towers
    for (const [tx, ty] of [[bx - O, by - O], [bx + O, by - O], [bx - O, by + O], [bx + O, by + O]]) {
      c.fillStyle = 'rgba(30,22,14,.34)'; c.beginPath(); c.arc(tx + 10, ty + 18, 30, 0, TAU); c.fill();
      c.fillStyle = '#5c574f'; c.beginPath(); c.arc(tx, ty + 12, 30, 0, PI); c.lineTo(tx - 30, ty); c.arc(tx, ty, 30, PI, 0, true); c.closePath(); c.fill();
      c.strokeStyle = DK; c.lineWidth = 2.5; c.stroke();
      const tgr = c.createLinearGradient(tx - 30, ty - 30, tx + 30, ty + 30); tgr.addColorStop(0, '#dcd6c8'); tgr.addColorStop(1, '#a29c8f');
      c.fillStyle = tgr; c.beginPath(); c.arc(tx, ty, 30, 0, TAU); c.fill(); c.stroke();
      const rm = new Path2D(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, px = tx + Math.cos(a) * 25, py = ty + Math.sin(a) * 25; rm.rect(px - 3.5, py - 3.5, 7, 7); }
      c.fillStyle = '#7e786c'; c.beginPath(); c.arc(tx, ty, 20, 0, TAU); c.fill();
      c.fillStyle = '#e4dfd2'; c.fill(rm); c.strokeStyle = DK; c.lineWidth = 1.2; c.stroke(rm);
    }
    for (const [tx, ty] of s.tur) { c.fillStyle = '#4a463f'; c.beginPath(); c.arc(tx, ty, 13, 0, TAU); c.fill(); }
    for (const [lx, ly] of s.lights) { c.fillStyle = DK; c.beginPath(); c.arc(lx, ly, 5, 0, TAU); c.fill(); }
  }
  function guns(c, s) {
    const { bx, by, red } = s;
    slab(c, bx - 135, by - 78, 270, 150, 9, ['#aaa597', '#8f8a7e'], '#5e5a52');
    const ln = new Path2D(); ln.rect(bx - 122, by - 66, 244, 126);
    c.save(); c.setLineDash([14, 8]); c.strokeStyle = 'rgba(205,180,90,.7)'; c.lineWidth = 3; c.stroke(ln); c.restore();
    hazardRect(c, bx - 135, by + 60, 270, 12);
    for (const [cx, cy] of [[bx - 118, by - 62], [bx + 98, by - 64], [bx + 110, by + 34]]) slab(c, cx, cy, 18, 14, 7, ['#9d9a68', '#76734c'], '#4e4c32');
    c.fillStyle = team(red); c.fillRect(bx - 20, by + 40, 40, 10); c.strokeStyle = DK; c.lineWidth = 1.5; c.strokeRect(bx - 20, by + 40, 40, 10);
    for (const [tx, ty] of s.tur) plinth(c, tx, ty);
    for (const [lx, ly] of s.lights) { c.fillStyle = DK; c.beginPath(); c.arc(lx, ly, 4.5, 0, TAU); c.fill(); }
  }
  function flagPad(c, s) {
    const { fx, fy, red } = s;
    c.fillStyle = 'rgba(30,22,14,.32)'; c.beginPath(); c.ellipse(fx + 8, fy + 12, 34, 26, 0, 0, TAU); c.fill();
    c.fillStyle = '#5f5a52'; c.beginPath(); c.ellipse(fx, fy + 7, 34, 26, 0, 0, TAU); c.fill(); c.strokeStyle = DK; c.lineWidth = 2.5; c.stroke();
    const g = c.createLinearGradient(fx - 34, fy - 26, fx + 34, fy + 26); g.addColorStop(0, '#d6d0c2'); g.addColorStop(1, '#9d978a');
    c.fillStyle = g; c.beginPath(); c.ellipse(fx, fy, 34, 26, 0, 0, TAU); c.fill(); c.stroke();
    c.strokeStyle = team(red); c.lineWidth = 5; c.beginPath(); c.ellipse(fx, fy, 25, 18, 0, 0, TAU); c.stroke();
    c.fillStyle = '#4a463f'; c.beginPath(); c.ellipse(fx, fy, 6, 4.5, 0, 0, TAU); c.fill();
    // pole + its shadow (cloth flutters in `under`)
    c.strokeStyle = 'rgba(30,22,14,.3)'; c.lineWidth = 3; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + 40, fy + 26); c.stroke();
    c.strokeStyle = DK; c.lineWidth = 4.5; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx, fy - 62); c.stroke();
    c.strokeStyle = '#c8c2b4'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(fx - .6, fy - 1); c.lineTo(fx - .6, fy - 61); c.stroke();
    c.fillStyle = '#d8b440'; c.beginPath(); c.arc(fx, fy - 64, 4, 0, TAU); c.fill(); c.strokeStyle = DK; c.lineWidth = 1.5; c.stroke();
  }

  // ---- foes -----------------------------------------------------------------
  // shared chunky robot body: slim legs + arms, torso + oversized helmet head, thinly outlined
  function robot(c, w, wk, bw, bh, hw, hh, body) {
    c.lineJoin = 'round'; c.strokeStyle = OUT; c.lineWidth = 1.8;
    c.fillStyle = col(w, METAL); c.beginPath();
    c.rect(-bw / 2 + 1.5, 1, 3, 10 + wk * 2); c.rect(bw / 2 - 4.5, 1, 3, 10 - wk * 2);
    c.rect(-bw / 2 - 2.5, -bh + 6, 2.5, bh - 3 - wk); c.rect(bw / 2, -bh + 6, 2.5, bh - 3 + wk);
    c.fill(); c.stroke();
    c.fillStyle = col(w, body); c.beginPath(); c.roundRect(-bw / 2, -bh + 4, bw, bh, 3); c.roundRect(-hw / 2, -bh + 5 - hh, hw, hh, 5); c.fill(); c.stroke();
  }

  // "grunt": stubby rifle robot, short 3-round bursts at mid range
  const grunt = { hp: 16, sp: 58, dmg: 7, xp: 1, r: 10, eye: false,
    init(e) { e.rec = 0; e.bn = 0; e.bt = 0; e.mv = true; e.t1 = 1 + Math.random() * 2; },
    update(e, Z) {
      const d = Z.dist(e), a = Z.angTo(e), ca = Math.cos(a), sa = Math.sin(a);
      e.rec = Math.max(0, e.rec - Z.dt * 5);
      if (e.bn > 0) {
        Z.move(e, 0, 0); e.ang = a; e.mv = false;
        if ((e.bt -= Z.dt) <= 0) { e.bt = .12; e.bn--; e.rec = 1; Z.shoot(e.x + ca * 14, e.y + sa * 14, a + Z.rnd(-.07, .07), 205, { r: 4, dmg: 6, col: '255,226,60', life: 3 }); }
      } else {
        e.mv = true;
        if (d > 200) Z.chase(e);
        else if (d < 120) { Z.move(e, -ca * e.sp * .6, -sa * e.sp * .6); e.ang = a; }
        else { const s = Math.sin(e.ph * .9 + e.seed) > 0 ? 1 : -1; Z.move(e, -sa * e.sp * .45 * s, ca * e.sp * .45 * s); e.ang = a; }
        if ((e.t1 -= Z.dt) <= 0) { e.t1 = Z.rnd(2.8, 3.8); if (d < 380) { e.bn = 3; e.bt = .2; } }
      }
      talk(e, Z, LINES.grunt);
    },
    draw(e, Z, w) {
      const c = Z.ctx, f = Math.cos(e.ang) < 0 ? -1 : 1, wk = e.mv ? Math.sin(e.ph * 14 + e.seed) : 0, bob = Math.abs(wk) * 1.2;
      c.save(); c.translate(e.x, e.y - bob);
      robot(c, w, wk, 11, 11, 13, 15, RED);
      if (!w) {
        c.fillStyle = RED_D; c.fillRect(2, -5, 2.5, 8); c.fillRect(-5.5, -9, 11, 2);
        c.fillStyle = RED_L; c.fillRect(-5, -19, 4, 3);
        c.fillStyle = PANEL; c.fillRect(-2.5, -4, 5, 4);
        c.fillStyle = VIS; c.fillRect(f > 0 ? -2 : -6, -16, 8, 5);
        c.fillStyle = GLINT; c.fillRect(f > 0 ? 2.5 : -5.5, -15, 3, 2);
        c.fillStyle = OUT; c.fillRect(-f * 3 - .75, -27, 1.5, 7);
        c.fillStyle = Math.sin(Z.now * 5 + e.seed) > 0 ? GLINT : '#7a4a20'; c.fillRect(-f * 3 - 1.5, -29, 3, 3);
      }
      c.restore();
      c.save(); c.translate(e.x, e.y - bob - 1); c.rotate(e.ang);
      const rc = -e.rec * 3;
      c.fillStyle = OUT; c.fillRect(1 + rc, -2.5, 16, 5);
      c.fillStyle = col(w, STEEL); c.fillRect(2 + rc, -1.2, 14, 2.4);
      c.fillStyle = col(w, RED); c.strokeStyle = OUT; c.lineWidth = 2; c.beginPath(); c.arc(3 + rc, 0, 3, 0, TAU); c.fill(); c.stroke();
      if (!w && e.rec > .5) { c.fillStyle = '#fff6a0'; c.beginPath(); c.arc(19 + rc, 0, 4, 0, TAU); c.fill(); }
      c.restore();
      bubble(c, e, w);
    },
    death(e, Z) { sparks(Z, e); },
  };

  // "gunner": manic machine-gun robot; strafes around the hero and sprays wildly
  const gunner = { hp: 24, sp: 88, dmg: 8, xp: 2, r: 11, eye: false,
    init(e) { e.rec = 0; e.spr = 0; e.ft = 0; e.dir = Math.random() < .5 ? 1 : -1; e.spin = 0; e.t1 = 1.5 + Math.random() * 2; },
    update(e, Z) {
      const d = Z.dist(e), a = Z.angTo(e), ca = Math.cos(a), sa = Math.sin(a);
      const rad = Math.max(-1, Math.min(1, (d - 175) / 60)), tg = e.dir * (.85 + Math.sin(e.ph * 2.3) * .3), k = e.spr > 0 ? .45 : 1;
      Z.move(e, (ca * rad - sa * tg) * e.sp * k, (sa * rad + ca * tg) * e.sp * k);
      e.ang = a;
      if (Math.random() < Z.dt * .35) e.dir *= -1;
      e.rec = Math.max(0, e.rec - Z.dt * 8);
      e.spin += Z.dt * (e.spr > 0 ? 40 : 4);
      if (e.spr > 0) {
        e.spr -= Z.dt;
        if ((e.ft -= Z.dt) <= 0) { e.ft = .085; e.rec = 1; Z.shoot(e.x + ca * 16, e.y + sa * 16, a + Z.rnd(-.42, .42), 225, { r: 3.5, dmg: 5, col: '255,240,90', life: 2.2 }); }
      } else if ((e.t1 -= Z.dt) <= 0) { e.t1 = Z.rnd(3.6, 4.6); if (d < 360) { e.spr = 1.1; e.ft = .25; } }
      talk(e, Z, LINES.gunner);
    },
    draw(e, Z, w) {
      const c = Z.ctx, f = Math.cos(e.ang) < 0 ? -1 : 1, wk = Math.sin(e.ph * 18 + e.seed), jit = e.spr > 0 ? Math.sin(Z.now * 60) * .8 : 0;
      c.save(); c.translate(e.x + jit, e.y - Math.abs(wk));
      robot(c, w, wk, 14, 12, 14, 15, RED);
      if (!w) {
        c.fillStyle = RED_D; c.fillRect(3, -6, 3, 9); c.fillRect(-6.5, -9, 13, 2);
        c.fillStyle = GLINT; c.fillRect(-7, -2, 14, 3); // ammo belt
        c.fillStyle = OUT; c.fillRect(-4, -16, 8, 5); // wide grin
        c.fillStyle = '#fff'; c.fillRect(-3, -15, 6, 1.6);
        c.fillStyle = GLINT; c.fillRect(f > 0 ? 1 : -5, -20, 4, 3); // mad eye
        c.fillStyle = BLUE; c.fillRect(-7.5, -23, 15, 3); // stolen blue bandana
        c.fillRect(-f * 7.5 - (f > 0 ? 3 : 0), -23 + Math.sin(Z.now * 12) * 1.2, 3, 3);
        c.fillStyle = RED_L; c.fillRect(-5.5, -20, 3, 2);
      }
      c.restore();
      c.save(); c.translate(e.x + jit, e.y - 2); c.rotate(e.ang);
      const rc = -e.rec * 2;
      c.fillStyle = OUT; c.fillRect(rc, -5, 20, 10);
      c.fillStyle = col(w, '#4a423d'); c.fillRect(1 + rc, -4, 8, 8);
      c.fillStyle = col(w, STEEL);
      for (let i = 0; i < 3; i++) c.fillRect(9 + rc, Math.sin(e.spin + i * 2.1) * 2.4 - .8, 10, 1.6);
      if (!w && e.rec > .4) { c.fillStyle = '#fff3b0'; c.beginPath(); c.moveTo(19 + rc, 0); c.lineTo(27 + rc, -4); c.lineTo(24 + rc, 0); c.lineTo(27 + rc, 4); c.fill(); }
      c.restore();
      bubble(c, e, w);
    },
    death(e, Z) { sparks(Z, e, 10); },
  };

  // "rocket": rocket trooper; plants its feet, laser-paints, then fires a rocket or lobs a shell
  const rocket = { hp: 42, sp: 46, dmg: 10, xp: 3, r: 12, eye: false,
    init(e) { e.rec = 0; e.aim = 0; e.lx = e.x; e.ly = e.y; e.t1 = 2 + Math.random() * 2; e.mv = true; },
    update(e, Z) {
      const d = Z.dist(e), a = Z.angTo(e), ca = Math.cos(a), sa = Math.sin(a);
      e.rec = Math.max(0, e.rec - Z.dt * 2.5);
      if (e.aim > 0) {
        Z.move(e, 0, 0); e.mv = false;
        e.ang = Math.atan2(e.ly - e.y, e.lx - e.x);
        if ((e.aim -= Z.dt) <= 0) {
          e.rec = 1;
          if (Math.hypot(e.lx - e.x, e.ly - e.y) > 290) { Z.hazard(e.lx, e.ly, { r: 62, t: .8, dmg: 12, col: '255,110,30' }); Z.burst(e.x, e.y - 10, '#c0b0a0', 6, 50); }
          else Z.shoot(e.x + Math.cos(e.ang) * 16, e.y + Math.sin(e.ang) * 16, e.ang, 150, { r: 8, dmg: 10, col: '255,110,30', life: 4 });
        }
      } else {
        e.mv = true;
        if (d > 300) Z.chase(e);
        else if (d < 220) { Z.move(e, -ca * e.sp, -sa * e.sp); e.ang = a; }
        else { Z.move(e, 0, 0); e.ang = a; e.mv = false; }
        if ((e.t1 -= Z.dt) <= 0) { e.t1 = Z.rnd(3.6, 4.6); if (d < 470) { e.aim = 1; e.lx = Z.P.x; e.ly = Z.P.y; } }
      }
      talk(e, Z, LINES.rocket);
    },
    draw(e, Z, w) {
      const c = Z.ctx, f = Math.cos(e.ang) < 0 ? -1 : 1, wk = e.mv ? Math.sin(e.ph * 10 + e.seed) : 0;
      if (!w && e.aim > 0) {
        c.save(); c.strokeStyle = 'rgba(255,30,20,' + (.4 + .35 * Math.sin(Z.now * 30)).toFixed(2) + ')';
        c.lineWidth = 1.5; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(e.x, e.y - 10); c.lineTo(e.lx, e.ly); c.stroke();
        c.setLineDash([]); c.beginPath(); c.arc(e.lx, e.ly, 6 + e.aim * 8, 0, TAU); c.stroke(); c.restore();
      }
      c.save(); c.translate(e.x, e.y - Math.abs(wk));
      robot(c, w, wk, 14, 12, 13, 15, RED);
      if (!w) {
        c.fillStyle = RED_D; c.fillRect(3, -6, 3, 9);
        c.fillStyle = PANEL; c.fillRect(-5, -5, 4, 6);
        c.fillStyle = GLINT; c.beginPath(); c.arc(0, -16, 7.5, PI, 0); c.fill(); c.stroke(); // yellow helmet dome
        c.fillStyle = VIS; c.fillRect(f > 0 ? -2 : -6, -15, 8, 5);
        c.fillStyle = '#ff3a2a'; c.fillRect(f > 0 ? 2.5 : -5.5, -14, 3, 3);
      }
      c.restore();
      c.save(); c.translate(e.x, e.y - 11); c.rotate(e.ang);
      const rc = -e.rec * 4;
      c.fillStyle = OUT; c.fillRect(-10 + rc, -5, 26, 10);
      c.fillStyle = col(w, '#6f8a3a'); c.fillRect(-9 + rc, -3.5, 24, 7); // launcher tube
      c.fillStyle = col(w, '#a3c25a'); c.fillRect(-9 + rc, -3.5, 24, 2);
      c.fillStyle = col(w, GLINT); c.fillRect(11 + rc, -3.5, 3, 7);
      if (!w && e.aim > 0) { c.fillStyle = '#ff2a20'; c.fillRect(15 + rc, -1.5, 3, 3); }
      if (!w && e.rec > .6) { c.fillStyle = 'rgba(230,220,200,.7)'; c.beginPath(); c.arc(-14 + rc, 0, 6 * e.rec, 0, TAU); c.fill(); }
      c.restore();
      bubble(c, e, w);
    },
    death(e, Z) { sparks(Z, e, 10); },
  };

  // "tank": light tank; treads crawl, turret tracks the hero independently and lobs shells
  const tank = { hp: 115, sp: 34, dmg: 14, xp: 6, r: 17, heavy: true, eye: false,
    init(e, Z) { e.hd = Z.angTo(e); e.tur = e.hd; e.odo = 0; e.rec = 0; e.t1 = 2 + Math.random() * 2; },
    update(e, Z) {
      const d = Z.dist(e), a = Z.angTo(e);
      e.hd = turn(e.hd, a, 1.1 * Z.dt);
      const v = d > 150 ? e.sp : e.sp * .25;
      Z.move(e, Math.cos(e.hd) * v, Math.sin(e.hd) * v);
      e.odo += v * Z.dt; e.ang = e.hd;
      e.tur = turn(e.tur, a, 1.8 * Z.dt);
      e.rec = Math.max(0, e.rec - Z.dt * 3);
      if ((e.t1 -= Z.dt) <= 0 && Math.abs(wrap(a - e.tur)) < .15 && d < 460) {
        e.t1 = Z.rnd(3.2, 4.2); e.rec = 1;
        Z.shoot(e.x + Math.cos(e.tur) * 22, e.y + Math.sin(e.tur) * 22, e.tur, 230, { r: 7, dmg: 12, col: '255,160,30', life: 3.5 });
        Z.burst(e.x + Math.cos(e.tur) * 22, e.y + Math.sin(e.tur) * 22, '#d8c8a8', 5, 60);
      }
      talk(e, Z, LINES.tank);
    },
    draw(e, Z, w) {
      const c = Z.ctx;
      c.save(); c.translate(e.x, e.y); c.rotate(e.hd);
      c.lineJoin = 'round'; c.strokeStyle = OUT; c.lineWidth = 2.2;
      c.fillStyle = col(w, METAL); c.beginPath(); c.rect(-19, -17, 38, 10); c.rect(-19, 7, 38, 10); c.fill(); c.stroke();
      if (!w) {
        c.strokeStyle = '#8f877e'; c.lineWidth = 1.6; c.beginPath();
        const o = e.odo % 5;
        for (let i = -17 + o; i < 18; i += 5) { c.moveTo(i, -15); c.lineTo(i, -9); c.moveTo(i, 9); c.lineTo(i, 15); }
        c.stroke(); c.strokeStyle = OUT; c.lineWidth = 2.2;
      }
      c.fillStyle = col(w, RED); c.beginPath(); c.roundRect(-15, -10, 30, 20, 3); c.fill(); c.stroke();
      if (!w) {
        c.fillStyle = RED_D; c.fillRect(10, -8, 4, 16); c.fillRect(-13, 5, 23, 3);
        c.fillStyle = RED_L; c.fillRect(-13, -8, 22, 3);
        c.fillStyle = GLINT; c.fillRect(-15, -10, 3, 20);
        c.fillStyle = PANEL; c.fillRect(11, -7, 2, 3); c.fillRect(11, 4, 2, 3); // headlights
      }
      c.restore();
      c.save(); c.translate(e.x, e.y); c.rotate(e.tur);
      const rc = -e.rec * 4;
      c.fillStyle = OUT; c.fillRect(3 + rc, -3.5, 20, 7); c.fillRect(20 + rc, -4.5, 5, 9);
      c.fillStyle = col(w, STEEL); c.fillRect(4 + rc, -1.8, 17, 3.6);
      c.fillStyle = col(w, RED); c.strokeStyle = OUT; c.lineWidth = 2.2; c.beginPath(); c.arc(0, 0, 8.5, 0, TAU); c.fill(); c.stroke();
      if (!w) {
        c.fillStyle = RED_L; c.beginPath(); c.arc(-2.5, -2.5, 3.5, 0, TAU); c.fill();
        c.fillStyle = VIS; c.fillRect(2, -2.5, 5, 5);
        c.fillStyle = GLINT; c.fillRect(4, -1.5, 2.5, 2);
        if (e.rec > .7) { c.fillStyle = '#fff0a0'; c.beginPath(); c.arc(28 + rc, 0, 5.5, 0, TAU); c.fill(); }
      }
      c.restore();
      bubble(c, e, w);
    },
    death(e, Z) { sparks(Z, e, 14); Z.burst(e.x, e.y, '#3a3028', 8, 50); Z.shake(2); },
  };

  // ---- miniboss: a rolling red command bunker ------------------------------
  const CYCLE = ['sweep', 'arty', 'deploy', 'charge'];
  const TUR = [[-6, -20], [-6, 20]];
  const turPos = (e, i) => { const [lx, ly] = TUR[i], ch = Math.cos(e.hd), sh = Math.sin(e.hd); return [e.x + lx * ch - ly * sh, e.y + lx * sh + ly * ch]; };
  const fireTur = (e, Z, i, ang, sp, o) => { const [tx, ty] = turPos(e, i); Z.shoot(tx + Math.cos(ang) * 24, ty + Math.sin(ang) * 24, ang, sp, o); };
  const boss = { name: 'Fort Brassbottom', hp: 3800, sp: 44, dmg: 24, xp: 0, r: 48, heavy: true, eye: false,
    init(e, Z) { e.hd = Z.angTo(e); e.ta = e.hd; e.tb = e.hd; e.state = 'idle'; e.st = 2.5; e.pi = 0; e.hatch = 0; e.ft = 1; e.alt = 0; e.n = 0; e.lock = 0; e.odo = 0; e.rec = 0; e.spawned = 0; say(e, 'Surrender, nightlight!', 3); },
    update(e, Z) {
      const dt = Z.dt, a = Z.angTo(e), d = Z.dist(e), low = e.hp < e.max * .35, k = low ? .7 : 1;
      if (low && !e.lowSaid) { e.lowSaid = 1; say(e, 'Ow! My paint job!', 3); Z.banner('The fort is on fire. And furious.', '#ff6a3a'); }
      if (low && Math.random() < dt * 6) Z.burst(e.x + Z.rnd(-30, 30), e.y + Z.rnd(-30, 30), Math.random() < .5 ? '#4a4038' : '#ff8030', 3, 40);
      e.rec = Math.max(0, e.rec - dt * 4);
      e.hatch = Math.max(0, Math.min(1, e.hatch + (e.state === 'deploy' && e.st > .5 ? dt * 2 : -dt * 2)));
      let v = 0;
      e.st -= dt;
      if (e.state === 'idle') {
        e.hd = turn(e.hd, a, .9 * dt); v = d > 170 ? e.sp : 0;
        e.ta = turn(e.ta, a, 3 * dt); e.tb = turn(e.tb, a, 3 * dt);
        if ((e.ft -= dt) <= 0) { e.ft = 1.1 * k; e.alt ^= 1; e.rec = 1; fireTur(e, Z, e.alt, e.alt ? e.tb : e.ta, 200, { r: 7, dmg: 12, col: '255,160,40', life: 4 }); }
        if (e.st <= 0) {
          e.state = CYCLE[e.pi++ % CYCLE.length]; e.n = 0; e.ft = 0; e.spawned = 0;
          if (e.state === 'sweep') { e.st = 3.8; Z.sfx('charge'); }
          else if (e.state === 'arty') { e.st = 2.6; Z.sfx('warn'); say(e, 'Taste my artillery!'); }
          else if (e.state === 'deploy') { e.st = 2.2; say(e, 'Squad, out! Go go go!'); }
          else { e.st = 2.0; e.lock = a; Z.sfx('warn'); say(e, 'Ramming speed!'); }
        }
      } else if (e.state === 'sweep') {
        v = e.sp * .3; e.hd = turn(e.hd, a, .5 * dt);
        const spinUp = e.st > 3.1;
        e.ta += (spinUp ? .8 : 2.1) * dt; e.tb -= (spinUp ? .8 : 2.1) * dt;
        if (!spinUp && (e.ft -= dt) <= 0) {
          e.ft = low ? .075 : .1;
          fireTur(e, Z, 0, e.ta, 165, { r: 5, dmg: 9, col: '255,70,170', life: 4 });
          fireTur(e, Z, 1, e.tb, 165, { r: 5, dmg: 9, col: '255,70,170', life: 4 });
          if (low) fireTur(e, Z, 0, e.ta + PI, 140, { r: 5, dmg: 9, col: '255,70,170', life: 4 });
        }
      } else if (e.state === 'arty') {
        e.ta = turn(e.ta, a, 3 * dt); e.tb = turn(e.tb, a, 3 * dt);
        if (e.n < (low ? 9 : 7) && (e.ft -= dt) <= 0) {
          e.ft = .24; e.alt ^= 1; e.rec = 1;
          const lead = e.n * 18, sp = e.n === 0 ? 0 : 110;
          Z.hazard(Z.P.x + Z.P.face.x * lead + Z.rnd(-sp, sp), Z.P.y + Z.P.face.y * lead + Z.rnd(-sp, sp), { r: 64, t: 1.1, dmg: 14, col: '255,110,50' });
          e.n++;
        }
      } else if (e.state === 'deploy') {
        e.ta = turn(e.ta, a, 3 * dt); e.tb = turn(e.tb, a, 3 * dt);
        if (!e.spawned && e.st < 1.3) {
          e.spawned = 1; Z.sfx('boss');
          const n = low ? 7 : 5, bx = e.x - Math.cos(e.hd) * 56, by = e.y - Math.sin(e.hd) * 56;
          for (let i = 0; i < n; i++) {
            const g = Z.spawn('grunt', bx + Z.rnd(-26, 26), by + Z.rnd(-26, 26));
            if (g && i === 0) say(g, 'Reporting for duty!');
          }
          Z.burst(bx, by, '#d8c8a8', 12, 90);
        }
      } else if (e.state === 'charge') {
        if (e.st > 1.1) { e.hd = turn(e.hd, e.lock, 4 * dt); v = 0; }
        else {
          if (!e.n) { e.n = 1; Z.shake(5); e.hd = e.lock; }
          v = 310;
          if ((e.ft -= dt) <= 0) { e.ft = .2; Z.hazard(e.x - Math.cos(e.hd) * 50, e.y - Math.sin(e.hd) * 50, { r: 40, t: 1.5, dmg: 12, col: '255,70,40' }); }
        }
        e.ta = turn(e.ta, a, 3 * dt); e.tb = turn(e.tb, a, 3 * dt);
      }
      if (e.state !== 'idle' && e.st <= 0) { e.state = 'idle'; e.st = low ? 1.1 : 1.8; e.ft = .8; }
      Z.move(e, Math.cos(e.hd) * v, Math.sin(e.hd) * v);
      e.odo += v * dt; e.ang = e.hd;
    },
    draw(e, Z, w) {
      const c = Z.ctx, low = e.hp < e.max * .35;
      if (!w && e.state === 'charge' && e.st > 1.1) { // telegraph: chevrons along the ram path
        c.save(); c.translate(e.x, e.y); c.rotate(e.lock);
        c.fillStyle = 'rgba(255,50,20,' + (.35 + .3 * Math.sin(Z.now * 20)).toFixed(2) + ')';
        c.beginPath();
        for (let i = 0; i < 5; i++) { const x = 70 + i * 55; c.moveTo(x, -22); c.lineTo(x + 20, 0); c.lineTo(x, 22); c.lineTo(x + 8, 0); c.closePath(); }
        c.fill(); c.restore();
      }
      c.save(); c.translate(e.x, e.y); c.rotate(e.hd);
      c.lineJoin = 'round'; c.strokeStyle = OUT; c.lineWidth = 3;
      // treads
      c.fillStyle = col(w, METAL); c.beginPath(); c.rect(-53, -51, 106, 20); c.rect(-53, 31, 106, 20); c.fill(); c.stroke();
      if (!w) {
        c.strokeStyle = '#8f877e'; c.lineWidth = 2.5; c.beginPath();
        const o = e.odo % 9;
        for (let i = -50 + o; i < 51; i += 9) { c.moveTo(i, -48); c.lineTo(i, -34); c.moveTo(i, 34); c.lineTo(i, 48); }
        c.stroke(); c.strokeStyle = OUT; c.lineWidth = 3;
      }
      // hull
      c.fillStyle = col(w, RED_D); c.beginPath(); c.roundRect(-46, -36, 92, 72, 10); c.fill(); c.stroke();
      c.fillStyle = col(w, RED); c.beginPath(); c.roundRect(-40, -31, 72, 60, 7); c.fill();
      if (!w) {
        c.fillStyle = RED_L; c.fillRect(-36, -28, 62, 5); c.fillRect(-37, -28, 5, 50);
        c.fillStyle = PANEL; c.fillRect(-26, -16, 18, 32); // white command deck panel
        c.fillStyle = OUT; c.fillRect(-22, -12, 10, 6); c.fillRect(-22, 6, 10, 6);
        c.fillStyle = GLINT; c.fillRect(-21, -11, 4, 4); c.fillRect(-21, 7, 4, 4);
      }
      c.fillStyle = col(w, RED_D); c.beginPath(); c.moveTo(32, -30); c.lineTo(48, -18); c.lineTo(48, 18); c.lineTo(32, 30); c.closePath(); c.fill(); c.stroke();
      // angry face on the prow
      c.fillStyle = col(w, '#1d1612'); c.fillRect(34, -10, 9, 20);
      if (!w) {
        c.fillStyle = GLINT;
        c.beginPath(); c.moveTo(22, -20); c.lineTo(34, -14); c.lineTo(22, -10); c.closePath(); c.moveTo(22, 20); c.lineTo(34, 14); c.lineTo(22, 10); c.closePath(); c.fill();
        c.lineWidth = 1.5; c.stroke(); c.lineWidth = 3;
        c.fillStyle = '#fff'; for (let i = 0; i < 4; i++) c.fillRect(36, -8 + i * 5, 6, 2);
        c.fillStyle = '#ffdcb0'; for (const [rx, ry] of [[-40, -30], [-40, 30], [26, -30], [26, 30], [-40, 0]]) c.fillRect(rx, ry - 1, 2, 2);
      }
      // rear hatch slides open
      c.fillStyle = col(w, '#2a1a14'); c.fillRect(-46, -12, 10, 24);
      c.fillStyle = col(w, GLINT); c.beginPath(); c.rect(-46 - e.hatch * 14, -12, 10, 24); c.fill(); c.lineWidth = 2; c.stroke();
      // command flag
      c.strokeStyle = OUT; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-34, -26); c.lineTo(-34, -62); c.stroke();
      c.fillStyle = col(w, '#ff3a20'); c.beginPath(); c.moveTo(-33, -62);
      const wv = Math.sin(Z.now * 7) * 3; c.quadraticCurveTo(-22, -65 + wv, -10, -57 - wv); c.quadraticCurveTo(-22, -50 + wv, -33, -48); c.closePath(); c.fill();
      c.lineWidth = 1.8; c.stroke();
      c.restore();
      // twin turrets (world space)
      for (let i = 0; i < 2; i++) {
        const [tx, ty] = turPos(e, i), ta = i ? e.tb : e.ta, rc = (e.alt === i ? -e.rec * 5 : 0);
        c.save(); c.translate(tx, ty); c.rotate(ta);
        c.fillStyle = OUT; c.fillRect(5 + rc, -6.5, 23, 13);
        c.fillStyle = col(w, STEEL); c.fillRect(6 + rc, -5, 21, 3.5); c.fillRect(6 + rc, 1.5, 21, 3.5);
        c.fillStyle = col(w, RED); c.strokeStyle = OUT; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 12, 0, TAU); c.fill(); c.stroke();
        if (!w) {
          c.fillStyle = RED_L; c.beginPath(); c.arc(-3, -3, 5, 0, TAU); c.fill();
          c.fillStyle = VIS; c.fillRect(3, -3, 6, 6);
          c.fillStyle = e.state === 'sweep' ? '#fff' : GLINT; c.fillRect(5, -1.5, 3, 3);
        }
        c.restore();
      }
      if (!w && low) {
        c.save();
        for (let i = 0; i < 4; i++) {
          const p = (Z.now * .8 + i / 4) % 1;
          c.fillStyle = 'rgba(50,42,38,' + (.55 * (1 - p)).toFixed(2) + ')';
          c.beginPath(); c.arc(e.x - 10 + i * 8 + Math.sin(p * 5 + i) * 6, e.y - 20 - p * 60, 6 + p * 14, 0, TAU); c.fill();
        }
        c.restore();
      }
      bubble(c, e, w, 26);
    },
    death(e, Z) { Z.burst(e.x, e.y, '#ffb040', 40, 220); Z.burst(e.x, e.y, '#3a3028', 20, 120); Z.shake(10); Z.sfx('nova'); },
  };

  // ---- music: original funky grunge-rock in A minor ------------------------
  const PENT = [0, 3, 5, 7, 10, 12, 15];
  // riffs: h = hit pattern per 16th (X power chord, m palm mute, . rest), o = semitone offsets
  const RA = { h: 'X..m.mX.m.mX.Xm.', o: [0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 5, 0, 6, 0, 0] };
  const RA2 = { h: 'X..m.mX.m.mX.X.X', o: [0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 5, 0, 3, 0, -2] };
  const RB = { h: 'X.mmmmmmX.mmX.m.', o: new Array(16).fill(0) };
  const RBR = { h: 'm.m.m.m.m.m.mmm.', o: new Array(16).fill(0) };
  const RH = { h: 'X.mmXmmmX.mmXmXm', o: [0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 5, 0, 6, 5] };
  const ROOTS = [45, 45, 45, 45, 50, 50, 45, 45, 41, 43, 45, 40, 45, 45, 48, 40];
  const BROOTS = [45, 45, 48, 50, 45, 45, 43, 40];
  const LICKS = [
    [[0, 4, 2, 1], [2, 3, 2], [4, 2, 1], [5, 3, 1], [6, 2, 2], [8, 1, 4], [12, 0, 2], [14, 1, 2]],
    [[0, 2, 1], [1, 3, 1], [2, 4, 3, 1], [6, 5, 2], [8, 4, 1], [9, 3, 1], [10, 2, 2], [12, 0, 4]],
    [[2, 0, 1], [3, 1, 1], [4, 2, 1], [5, 1, 1], [6, 2, 2, 1], [10, 3, 2], [12, 2, 2], [14, 1, 2]],
    [[0, 5, 4, 1], [4, 4, 2], [6, 3, 2], [8, 2, 1], [9, 1, 1], [10, 0, 6]],
  ];
  function guitar(A, t, root, kind, sl, heavy) {
    if (kind === 'X') {
      const dur = sl * 2.6;
      A.tone(t, root, dur, .042, { type: 'sawtooth', cutoff: heavy ? 3200 : 2500, detune: 8, decay: true, pan: -.3 });
      A.tone(t, root + 7, dur, .034, { type: 'sawtooth', cutoff: heavy ? 3200 : 2500, detune: -8, decay: true, pan: .3 });
      if (heavy) A.tone(t, root + 12, dur, .022, { type: 'square', cutoff: 2600, decay: true });
      A.tone(t, root - 12, sl * 1.8, .075, { type: 'triangle', cutoff: 900 });
      A.tone(t, root - 12, sl * 1.8, .03, { type: 'sawtooth', cutoff: 420 });
    } else if (kind === 'm') {
      A.tone(t, root, sl * .9, .04, { type: 'sawtooth', cutoff: heavy ? 900 : 650, decay: true, pan: -.2 });
      A.tone(t, root + 7, sl * .9, .024, { type: 'sawtooth', cutoff: heavy ? 900 : 650, decay: true, pan: .2 });
      A.tone(t, root - 12, sl * .85, .07, { type: 'triangle', cutoff: 700 });
    }
  }
  function lead(A, t, bar, b, sl, base) {
    const lick = LICKS[bar % LICKS.length];
    for (const [st, di, len, bend] of lick) if (st === b) {
      const m = base + PENT[di];
      A.tone(t, bend ? m - 2 : m, sl * len * .95, .05, { type: 'sawtooth', cutoff: 2300, q: 3, vib: .35, glide: bend ? m : undefined, detune: 4 });
    }
  }

  // sectors near the hero (for animated bits)
  function nearSectors(Z, pad) {
    const p = Z.P, hw = Z.W * .6 + pad, hh = Z.H * .6 + pad, out = [];
    for (let sy = Math.round((p.y - hh - 500) / S); sy <= Math.round((p.y + hh + 500) / S); sy++)
      for (let sx = Math.round((p.x - hw - 500) / S); sx <= Math.round((p.x + hw + 500) / S); sx++) out.push(sector(Z, sx, sy));
    return out;
  }
  const inView = (Z, x, y, pad) => Math.abs(x - Z.P.x) < Z.W * .6 + pad && Math.abs(y - Z.P.y) < Z.H * .6 + pad;

  return {
    id: 'z', name: 'The Robot Wars', nod: 'Z', portal: '235,90,50', bg: '#a99d82', dark: .3, dim: .14, target: .9,

    ground(Z, x0, y0, x1, y1) {
      const c = Z.ctx, C = 64;
      // 1. tiled dusty desert: four muted shades + speckle
      const sh = [new Path2D(), new Path2D(), new Path2D(), new Path2D()], spD = new Path2D(), spL = new Path2D(), tuft = new Path2D(), trk = new Path2D();
      const cx0 = Math.floor(x0 / C), cx1 = Math.floor(x1 / C), cy0 = Math.floor(y0 / C), cy1 = Math.floor(y1 / C);
      for (let cy = cy0; cy <= cy1; cy++)
        for (let cx = cx0; cx <= cx1; cx++) {
          const h = Z.hash(cx, cy), h2 = Z.hash(cx * 7 + 3, cy * 13 - 5), h3 = Z.hash(cx * 11 - 9, cy * 5 + 2), x = cx * C, y = cy * C;
          const blob = Z.hash(Math.floor(cx / 3) * 5 + 1, Math.floor(cy / 3) * 7 - 2);
          sh[Math.min(3, Math.floor(blob * 2.4 + h * 1.6))].rect(x, y, C, C);
          for (let k = 0; k < 4; k++) {
            const px = x + Z.hash(cx * 3 + k, cy * 5 - k) * C, py = y + Z.hash(cy * 3 - k, cx * 5 + k) * C;
            (k & 1 ? spL : spD).rect(px, py, 2 + (k & 2), 2);
          }
          if (h3 < .12) { const sx = x + h2 * 50, sy = y + h * 50; tuft.moveTo(sx, sy); tuft.lineTo(sx - 4, sy - 7); tuft.moveTo(sx, sy); tuft.lineTo(sx + 1, sy - 8); tuft.moveTo(sx, sy); tuft.lineTo(sx + 5, sy - 6); }
          if (h > .94) { const th = h2 * PI, ct = Math.cos(th), st = Math.sin(th), L = 90, mx = x + 32, my = y + 32; for (const s of [-8, 8]) { trk.moveTo(mx - ct * L - st * s, my - st * L + ct * s); trk.lineTo(mx + ct * L - st * s, my + st * L + ct * s); } }
        }
      const SH = ['#a5997e', '#a99d82', '#ada186', '#a1957b'];
      for (let i = 0; i < 4; i++) { c.fillStyle = SH[i]; c.fill(sh[i]); }
      c.fillStyle = 'rgba(80,66,48,.35)'; c.fill(spD);
      c.fillStyle = 'rgba(225,215,190,.35)'; c.fill(spL);
      c.strokeStyle = '#7e7b5a'; c.lineWidth = 1.5; c.stroke(tuft);
      c.save(); c.strokeStyle = 'rgba(90,72,50,.28)'; c.lineWidth = 5; c.setLineDash([3, 3]); c.stroke(trk); c.restore();
      // 2. dirt roads along sector centre lines, with shaded banks and ruts
      const road = new Path2D(), bankL = new Path2D(), bankD = new Path2D(), rut = new Path2D();
      for (let k = Math.floor((y0 - 40) / S) + 1; k * S - 40 < y1; k++) { const ry = k * S; road.rect(x0, ry - 28, x1 - x0, 56); bankL.rect(x0, ry - 30, x1 - x0, 3); bankD.rect(x0, ry + 27, x1 - x0, 4); rut.moveTo(x0, ry - 11); rut.lineTo(x1, ry - 11); rut.moveTo(x0, ry + 11); rut.lineTo(x1, ry + 11); }
      for (let k = Math.floor((x0 - 40) / S) + 1; k * S - 40 < x1; k++) { const rx = k * S; road.rect(rx - 28, y0, 56, y1 - y0); bankL.rect(rx - 30, y0, 3, y1 - y0); bankD.rect(rx + 27, y0, 4, y1 - y0); rut.moveTo(rx - 11, y0); rut.lineTo(rx - 11, y1); rut.moveTo(rx + 11, y0); rut.lineTo(rx + 11, y1); }
      c.fillStyle = 'rgba(120,100,72,.45)'; c.fill(bankD);
      c.fillStyle = 'rgba(230,220,195,.4)'; c.fill(bankL);
      c.fillStyle = '#b6ab91'; c.fill(road);
      c.strokeStyle = 'rgba(110,92,66,.4)'; c.lineWidth = 6; c.stroke(rut);
      // 3. macro decor: craters, scorch, cliffs, wrecks, sandbags, wire, rocks
      for (let my = Math.floor((y0 - 260) / M); my <= Math.floor((y1 + 260) / M); my++)
        for (let mx = Math.floor((x0 - 260) / M); mx <= Math.floor((x1 + 260) / M); mx++) {
          const f = feat(Z, mx, my);
          if (f.type === 'scorch') scorchMark(c, Z, f);
          else if (f.type === 'crater') crater(c, Z, f);
        }
      for (let my = Math.floor((y0 - 260) / M); my <= Math.floor((y1 + 260) / M); my++)
        for (let mx = Math.floor((x0 - 260) / M); mx <= Math.floor((x1 + 260) / M); mx++) {
          const f = feat(Z, mx, my);
          if (f.type === 'mesa') mesa(c, Z, f);
          else if (f.type === 'rocks') rocks(c, Z, f);
          else if (f.type === 'wire') wire(c, Z, f);
          else if (f.type === 'bags') bags(c, Z, f);
          else if (f.type === 'wreck') wreck(c, Z, f);
        }
      // 4. bases and flag pads
      for (let sy = Math.round((y0 - 700) / S); sy <= Math.round((y1 + 700) / S); sy++)
        for (let sx = Math.round((x0 - 700) / S); sx <= Math.round((x1 + 700) / S); sx++) {
          const s = sector(Z, sx, sy);
          if (s.bx + 230 > x0 && s.bx - 230 < x1 && s.by + 230 > y0 && s.by - 230 < y1) {
            c.save();
            if (s.type === 'factory') factory(c, s); else if (s.type === 'fort') fort(c, s); else guns(c, s);
            c.restore();
          }
          if (s.fx + 60 > x0 && s.fx - 60 < x1 && s.fy + 50 > y0 && s.fy - 90 < y1) flagPad(c, s);
        }
    },

    under(Z) {
      const c = Z.ctx;
      c.save(); c.lineJoin = 'round';
      for (const s of nearSectors(Z, 100)) {
        // fluttering sector flag
        if (inView(Z, s.fx, s.fy, 120)) {
          const x = s.fx, y = s.fy - 62, wv = Math.sin(Z.now * 6 + x * .01) * 4, wv2 = Math.sin(Z.now * 6 + x * .01 + 1.4) * 3;
          c.fillStyle = s.red ? '#e33a26' : '#2f6fe8'; c.strokeStyle = OUT; c.lineWidth = 2;
          c.beginPath(); c.moveTo(x + 1, y); c.quadraticCurveTo(x + 14, y - 3 + wv2, x + 30, y + 4 + wv); c.quadraticCurveTo(x + 14, y + 14 + wv2, x + 1, y + 18); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x + 3, y + 3, 10, 3);
        }
        // scanning gun turrets on their plinths
        for (const [tx, ty] of s.tur) {
          if (!inView(Z, tx, ty, 60)) continue;
          const a = Z.hash(Math.round(tx), Math.round(ty)) * TAU + Math.sin(Z.now * .5 + tx * .01) * 1.3;
          c.save(); c.translate(tx, ty - 2); c.rotate(a);
          c.fillStyle = OUT; c.fillRect(4, -5.5, 22, 11);
          c.fillStyle = '#8a857c'; c.fillRect(5, -4.2, 20, 3); c.fillRect(5, 1.2, 20, 3);
          c.fillStyle = s.red ? TEAM_R : TEAM_B; c.strokeStyle = OUT; c.lineWidth = 2.2; c.beginPath(); c.arc(0, 0, 11, 0, TAU); c.fill(); c.stroke();
          c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.arc(-3, -3, 4.5, 0, TAU); c.fill();
          c.restore();
        }
        // spinning roof fans
        for (const [vx, vy] of s.fans) {
          if (!inView(Z, vx, vy, 40)) continue;
          c.save(); c.translate(vx, vy); c.rotate(Z.now * 5);
          c.fillStyle = '#8a857a'; c.fillRect(-10, -2.5, 20, 5); c.fillRect(-2.5, -10, 5, 20);
          c.fillStyle = '#2a2622'; c.beginPath(); c.arc(0, 0, 3, 0, TAU); c.fill();
          c.restore();
        }
      }
      c.restore();
    },

    ambient(Z) {
      const c = Z.ctx, p = Z.P, hw = Z.W * .6, hh = Z.H * .6;
      // factory chimney smoke + blinking base lights
      for (const s of nearSectors(Z, 60)) {
        for (const [sx, sy] of s.smoke) {
          if (!inView(Z, sx, sy - 60, 160)) continue;
          for (let i = 0; i < 6; i++) {
            const q = (Z.now * .3 + i / 6) % 1;
            c.fillStyle = 'rgba(96,90,84,' + (.5 * (1 - q)).toFixed(3) + ')';
            c.beginPath(); c.arc(sx + Math.sin(q * 4 + i) * 5 + q * 40, sy - q * 110, 7 + q * 18, 0, TAU); c.fill();
          }
        }
        for (let i = 0; i < s.lights.length; i++) {
          const [lx, ly] = s.lights[i];
          if (inView(Z, lx, ly, 40) && Math.sin(Z.now * 4 + i * 2 + lx * .01) > .3) Z.glow(s.red ? '255,70,50' : '80,150,255', 12, lx, ly, .8);
        }
      }
      // smoking wrecks
      let n = 0;
      for (let my = Math.floor((p.y - hh - 80) / M); my <= Math.floor((p.y + hh + 80) / M) && n < 10; my++)
        for (let mx = Math.floor((p.x - hw - 80) / M); mx <= Math.floor((p.x + hw + 80) / M) && n < 10; mx++) {
          const f = feat(Z, mx, my);
          if (f.type !== 'wreck' || f.h2 < .3) continue;
          n++;
          if (Math.sin(Z.now * 9 + f.h * 30) > -.2) Z.glow('255,130,40', 10 + Math.sin(Z.now * 13 + f.h3 * 9) * 3, f.x, f.y, .55);
          for (let i = 0; i < 3; i++) {
            const q = (Z.now * .45 + i / 3 + f.h2) % 1;
            c.fillStyle = 'rgba(70,62,56,' + (.36 * (1 - q)).toFixed(3) + ')';
            c.beginPath(); c.arc(f.x + Math.sin(q * 3 + i) * 5 + q * 14, f.y - 4 - q * 48, 4 + q * 10, 0, TAU); c.fill();
          }
        }
      // distant muzzle flashes from the wider war
      for (let i = 0; i < 6; i++) {
        const tt = Z.now * 1.3 + i * .17, slot = Math.floor(tt), f = tt - slot;
        if (f > .22 || Z.hash(slot, i * 7 + 1) > .55) continue;
        const fx = p.x + (Z.hash(slot * 3 + i, 11) - .5) * hw * 2, fy = p.y + (Z.hash(slot * 5 - i, 23) - .5) * hh * 2, a = 1 - f / .22;
        Z.glow(Z.hash(slot, i) < .5 ? '255,220,120' : '160,200,255', 4 + 14 * a, fx, fy, .8 * a);
      }
      for (const e of Z.foes()) {
        if (e.kind === 'rocket' && e.aim > 0) Z.glow('255,40,30', 10, e.lx, e.ly, .6);
        else if (e.boss && e.hp < e.max * .35) Z.glow('255,120,40', 50 + Math.sin(Z.now * 13) * 8, e.x, e.y - 10, .45);
      }
    },

    mix: { grunt: 5, gunner: 2, rocket: 2, tank: 1 },
    foes: { grunt, gunner, rocket, tank },
    boss,

    events: [
      { t: 20, run(Z) {
        Z.banner('Sector under attack!', '#ff5a3a', true); Z.sfx('warn');
        const a = Z.rnd(0, TAU), ca = Math.cos(a), sa = Math.sin(a), bx = Z.P.x + ca * 520, by = Z.P.y + sa * 520;
        for (let i = 0; i < 8; i++) {
          const row = i < 5 ? 0 : 1, cl = row ? i - 6 : i - 2, off = cl * 34, back = row * 40;
          const g = Z.spawn(row ? 'gunner' : 'grunt', bx - sa * off + ca * back, by + ca * off + sa * back);
          if (g && i === 2) say(g, 'Charge! For the flag!');
        }
      } },
      { t: 70, run(Z) {
        Z.banner('Armour inbound!', '#ff8a3a');
        const a = Z.rnd(0, TAU), ca = Math.cos(a), sa = Math.sin(a);
        for (let i = 0; i < 3; i++) { const t = Z.spawn('tank', Z.P.x + ca * (560 + i * 60), Z.P.y + sa * (560 + i * 60)); if (t && i === 0) say(t, 'Convoy, roll out!'); }
      } },
      { t: 100, run(Z) {
        Z.banner('Airstrike! Take cover!', '#ffd040', true); Z.sfx('warn');
        const a = Z.rnd(0, TAU), ca = Math.cos(a), sa = Math.sin(a);
        for (let i = -4; i <= 4; i++) Z.hazard(Z.P.x + ca * i * 72, Z.P.y + sa * i * 72, { r: 58, t: 1.1 + (i + 4) * .12, dmg: 16, col: '255,200,60' });
      } },
      { t: 128, run(Z) {
        Z.banner('Last push for the flag!', '#ff5a3a');
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * TAU;
          Z.spawn(i % 2 ? 'rocket' : 'grunt', Z.P.x + Math.cos(a) * 480, Z.P.y + Math.sin(a) * 480);
        }
      } },
    ],

    music: { bpm: 124, div: 4,
      step(s, t, A) {
        const sl = 60 / 124 / 4, b = s % 16, bar = Math.floor(s / 16), sec = bar % 16;
        if (A.boss) {
          // heavier, double-time riffing
          const root = BROOTS[bar % 8], k = RH.h[b];
          guitar(A, t, root + RH.o[b], k, sl, true);
          if (b % 4 === 0) A.kick(t, .75);
          if (b % 4 === 2) A.snare(t, .3);
          if (b === 15 && bar % 2) A.snare(t, .12);
          A.hat(t, b % 2 ? .035 : .055, b === 14);
          if (bar % 4 >= 2) lead(A, t, bar, b, sl, 69);
          if (bar % 4 === 1 && b === 8) A.tone(t, root + 12, sl * 6, .03, { type: 'sawtooth', cutoff: 300, sweep: 2800, q: 9 });
          if (bar % 8 === 7 && b >= 12) A.tom(t, [240, 200, 160, 120][b - 12], .38);
          return;
        }
        const root = ROOTS[sec];
        let riff = sec < 8 ? (bar % 2 ? RA2 : RA) : sec < 12 ? RB : RBR;
        guitar(A, t, root + riff.o[b], riff.h[b], sl, false);
        // kit: tight rock beat with ghost notes
        if (b === 0 || b === 7 || b === 10 || (sec % 4 === 3 && b === 14)) A.kick(t, .7);
        if (b === 4 || b === 12) A.snare(t, .3);
        if (b === 9 || b === 15) A.snare(t, .07);
        if (b % 2 === 0) A.hat(t, .05 + A.inten * .015, b === 14 && bar % 2 === 1);
        else if (sec >= 8) A.hat(t, .025);
        if (sec % 8 === 7 && b >= 12) A.tom(t, [220, 180, 140, 110][b - 12], .32);
        // wah stabs in the chorus
        if (sec >= 8 && sec < 12 && (b === 2 || b === 10)) A.tone(t, root + 12, sl * 3, .03, { type: 'sawtooth', cutoff: 350, sweep: 2600, q: 8 });
        // blues-rock lead over the breakdown
        if (sec >= 12) lead(A, t, bar, b, sl, 69);
        // chicken-pick plucks
        if (sec < 8 && bar % 2 === 1 && b >= 13) A.pluck(root + 24 + PENT[(b + bar) % 5], t, .45);
        if (sec === 3 && b === 14) A.tone(t, root + 12, sl * 2, .028, { type: 'sawtooth', cutoff: 400, sweep: 2400, q: 8 });
      } },
  };
})());
