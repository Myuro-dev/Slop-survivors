// Zone: The Antaran Deep. A nod to Master of Orion II: a tactical star map under raider attack.
ZONES.push((() => {
  const TAU = Math.PI * 2;
  // ---------------- palettes ----------------
  // raider faction: crimson plating, orange trim, gunmetal frames, near-black outlines
  const OUT = '#07050a', CRIM = '#d02838', CRIM_D = '#8a1424', ORNG = '#ff8a24', STEEL = '#7c8090', STEEL_HI = '#c4c8d4', STEEL_D = '#3c404c';
  const ENG = '#ffb050', CRYS = '#3af0dc', VIOL = '#7a34e0';
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  // ---------------- cached unit-radius ship shapes (nose along +x) ----------------
  const poly = pts => { const p = new Path2D(); pts.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); return p; };
  // pts run from the nose down the +y side; mirrored onto -y
  const sym = pts => poly(pts.concat(pts.slice().reverse().filter(q => q[1] !== 0).map(([x, y]) => [x, -y])));
  const multi = list => { const p = new Path2D(); for (const pts of list) pts.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)), p.closePath(); return p; };
  const flip = pts => pts.map(([x, y]) => [x, -y]);

  // interceptor: swept-wing dart
  const INT_HULL = sym([[1.55, 0], [.45, .3], [-.15, 1.15], [-.8, 1.2], [-.55, .38], [-.95, .3]]);
  const INT_TRIM = (() => { const w = [[-.15, 1.15], [-.8, 1.2], [-.62, .82], [-.2, .8]]; return multi([w, flip(w)]); })();
  const INT_SPINE = sym([[1.25, 0], [.2, .16], [-.75, .14]]);
  const INT_FLAME = sym([[-.9, .2], [-1.7, 0]]), INT_CORE = sym([[-.9, .1], [-1.35, 0]]);
  // frigate: blocky hull with twin missile pods
  const FRG_HULL = sym([[1.3, 0], [.9, .34], [.2, .44], [-.45, .44], [-.65, .62], [-1.15, .62]]);
  const FRG_PODS = (() => { const p = [[-.7, .58], [.45, .58], [.62, .76], [.45, .96], [-.7, .96]]; return multi([p, flip(p)]); })();
  const FRG_TIPS = (() => { const p = [[.3, .58], [.45, .58], [.62, .76], [.45, .96], [.3, .96]]; return multi([p, flip(p)]); })();
  const FRG_STRIPE = multi([[[.05, .44], [.25, .44], [.25, -.44], [.05, -.44]], [[-.55, .44], [-.38, .44], [-.38, -.44], [-.55, -.44]]]);
  const FRG_BRIDGE = sym([[.85, 0], [.5, .18], [-.1, .18]]);
  const FRG_LIGHTS = (() => { const p = new Path2D(); for (let i = 0; i < 3; i++) for (const s of [1, -1]) p.rect(-.5 + i * .3, s > 0 ? .72 : -.84, .12, .12); return p; })();
  const FRG_FLAME = multi([[[-1.15, .5], [-1.8, .36], [-1.15, .2]], [[-1.15, -.5], [-1.8, -.36], [-1.15, -.2]]]);
  // beam cruiser: long armoured lance
  const CRU_HULL = sym([[1.5, 0], [1.25, .16], [.8, .3], [.6, .62], [-.35, .8], [-.6, .62], [-1.15, .5], [-1.3, .3]]);
  const CRU_PLATES = (() => { const p = [[.55, .64], [-.3, .8], [-.55, .64], [-.3, .5], [.4, .48]]; return multi([p, flip(p)]); })();
  const CRU_DECK = sym([[1.1, 0], [.6, .22], [-.9, .26], [-1.05, .12]]);
  const CRU_TRIM = multi([[[.15, .5], [.3, .5], [.3, -.5], [.15, -.5]], [[-.75, .45], [-.6, .45], [-.6, -.45], [-.75, -.45]]]);
  const CRU_FLAME = sym([[-1.3, .3], [-2.1, .1], [-2.3, 0]]);
  // void organism crystal core
  const CRYSTAL = (() => { const p = new Path2D(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, q = i % 2 ? .38 : .74; i ? p.lineTo(Math.cos(a) * q, Math.sin(a) * q) : p.moveTo(q, 0); } p.closePath(); return p; })();
  // boss fortress
  const B_RING = new Path2D(), B_RTRIM = new Path2D(), B_LIGHT_A = new Path2D(), B_LIGHT_B = new Path2D();
  for (let i = 0; i < 8; i++) {
    const a0 = i / 8 * TAU + .07, a1 = (i + 1) / 8 * TAU - .07, am = (a0 + a1) / 2;
    B_RING.moveTo(Math.cos(a0) * 1.2, Math.sin(a0) * 1.2); B_RING.arc(0, 0, 1.2, a0, a1); B_RING.arc(0, 0, .96, a1, a0, true); B_RING.closePath();
    B_RTRIM.moveTo(Math.cos(a0 + .05) * 1.1, Math.sin(a0 + .05) * 1.1); B_RTRIM.arc(0, 0, 1.1, a0 + .05, a1 - .05); B_RTRIM.arc(0, 0, 1.05, a1 - .05, a0 + .05, true); B_RTRIM.closePath();
    for (const k of [-1, 1]) { const L = (k < 0) === (i % 2 === 0) ? B_LIGHT_A : B_LIGHT_B, la = am + k * .22; L.rect(Math.cos(la) * 1.0 - .03, Math.sin(la) * 1.0 - .03, .06, .06); }
  }
  const B_PYLON = new Path2D(), B_PTIP = new Path2D();
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU + TAU / 8, ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
    const pt = (q, w) => [ca * q + px * w, sa * q + py * w];
    [[.7, .16], [1.3, .1], [1.3, -.1], [.7, -.16]].forEach(([q, w], j) => { const [x, y] = pt(q, w); j ? B_PYLON.lineTo(x, y) : B_PYLON.moveTo(x, y); }); B_PYLON.closePath();
    [[1.24, .17], [1.48, .13], [1.48, -.13], [1.24, -.17]].forEach(([q, w], j) => { const [x, y] = pt(q, w); j ? B_PTIP.lineTo(x, y) : B_PTIP.moveTo(x, y); }); B_PTIP.closePath();
  }
  const oct = (rr, rot) => { const p = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + rot; p.push([Math.cos(a) * rr, Math.sin(a) * rr]); } return p; };
  const B_HULL = poly(oct(.86, Math.PI / 8)), B_INNER = poly(oct(.5, 0));
  const B_PLATES = new Path2D(), B_HI = new Path2D(), B_SEAMS = new Path2D();
  for (let i = 0; i < 8; i++) {
    const a0 = i / 8 * TAU + .1, a1 = (i + 1) / 8 * TAU - .1, P = (i === 4 || i === 5) ? B_HI : B_PLATES;
    P.moveTo(Math.cos(a0) * .56, Math.sin(a0) * .56); P.lineTo(Math.cos(a0) * .8, Math.sin(a0) * .8); P.lineTo(Math.cos(a1) * .8, Math.sin(a1) * .8); P.lineTo(Math.cos(a1) * .56, Math.sin(a1) * .56); P.closePath();
    const as = i / 8 * TAU; B_SEAMS.moveTo(Math.cos(as) * .5, Math.sin(as) * .5); B_SEAMS.lineTo(Math.cos(as) * .84, Math.sin(as) * .84);
  }

  // spawn a V formation of interceptors flying in from direction `a` (≤ n ships)
  const vFormation = (Z, a, dist, n) => {
    const P = Z.P, cx = P.x + Math.cos(a) * dist, cy = P.y + Math.sin(a) * dist;
    const bx = Math.cos(a), by = Math.sin(a), px = -by, py = bx;
    for (let i = 0; i < n; i++) {
      const row = Math.ceil(i / 2), side = i === 0 ? 0 : (i % 2 ? 1 : -1);
      const f = Z.spawn('interceptor', cx + bx * row * 34 + px * side * row * 30, cy + by * row * 34 + py * side * row * 30);
      if (f) { f.seed = 1.3; f.squad = 1; }
    }
  };

  // ---------------- deterministic map features (shared by ground / under / ambient) ----------------
  const PC = 900, BC = 1300, SC = 1700, NC = 760, STC = 110;
  const PLAN = [ // [dark, base, light, band1, band2, atmosphere rgb]
    ['#5a3818', '#b07a42', '#ecc890', '#8a5a2c', '#d8b078', '230,180,120'], // amber gas giant
    ['#0e2450', '#2a5ca8', '#7ab0ec', '#3a7a3a', '#6a9a48', '120,180,255'], // ocean world
    ['#3a6274', '#8cc0d4', '#e4f6ff', '#a8d4e4', '#6a9cb0', '190,235,255'], // ice world
    ['#2e2a28', '#6e665e', '#aca49a', '#58504a', '#8a8278', '170,160,150'], // barren rock
    ['#2e4410', '#7a9a30', '#d4e470', '#5a7a20', '#a8c050', '190,230,110'], // toxic
    ['#2a1648', '#6a44a0', '#b894e4', '#4e2e80', '#9470cc', '170,130,240'], // violet gas giant
  ];
  const planetAt = (H, cx, cy) => {
    const h = H(cx * 29 + 1, cy * 31 - 9);
    if (h > .36) return null;
    const r = 30 + H(cx, cy * 2) * 62;
    return { x: cx * PC + 220 + H(cx * 2, cy) * (PC - 440), y: cy * PC + 220 + H(cx, cy * 3 + 1) * (PC - 440), r,
      kind: Math.floor(H(cx + 5, cy - 5) * 6) % 6, ring: h < .14, tilt: (H(cx - 3, cy + 8) - .5) * .7, h };
  };
  const stationAt = (H, cx, cy) => {
    const h = H(cx * 37 - 4, cy * 41 + 6);
    if (h > .24) return null;
    return { x: cx * SC + 300 + H(cx * 5, cy + 2) * (SC - 600), y: cy * SC + 300 + H(cx + 7, cy * 5) * (SC - 600), s: 64 + H(cx, cy - 7) * 40, a: h * 26, h };
  };
  const NEB = ['120,60,210', '40,90,220', '30,160,170', '190,60,170', '60,150,90'];
  const STAR_COL = ['244,244,255', '156,196,255', '255,232,144', '255,176,112', '255,122,106', '200,255,220'];
  const OWNER = ['#5aa0ff', '#60e070', '#ffe050', '#d060ff', '#f0f0f0', '#40e0e0'];
  const starAt = (H, cx, cy) => {
    const h = H(cx * 3 + 77, cy * 5 - 31);
    if (h > .3) return null;
    return { x: cx * STC + 12 + H(cx, cy - 9) * (STC - 24), y: cy * STC + 12 + H(cx - 9, cy) * (STC - 24), h, col: STAR_COL[Math.floor(H(cx * 11, cy * 7 + 3) * 6) % 6] };
  };
  const cells = (a, b, C, m) => [Math.floor((a - m) / C), Math.floor((b + m) / C)];

  // ---------------- music data (original) ----------------
  // calm: lydian / dorian colours, one chord every 2 bars, 16-bar loop
  const CALM = [
    [50, 57, 61, 64, 68], // D maj7 #11
    [47, 54, 57, 61, 64], // B m11
    [43, 50, 54, 57, 61], // G maj7 #11
    [45, 52, 57, 59, 64], // A sus2
    [50, 57, 62, 64, 68], // D add9 #11
    [52, 55, 59, 62, 66], // E m9
    [43, 50, 55, 59, 62], // G add9
    [45, 52, 55, 57, 61], // A 7sus
  ];
  const LYD = [0, 2, 4, 6, 7, 9, 11];
  const deg = (root, d) => root + LYD[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);
  // bell motifs: [step within 4-bar phrase, scale degree]
  const MOTIFS = [
    [[0, 4], [6, 6], [12, 7], [24, 9], [40, 8], [52, 4]],
    [[4, 2], [10, 3], [16, 6], [32, 5], [44, 4]],
    [[0, 7], [8, 9], [14, 11], [28, 10], [36, 7], [50, 6], [58, 4]],
    [[2, 4], [20, 3], [26, 2], [38, 0], [48, 1]],
  ];
  const ARP = [1, 3, 2, 4, 1, 2, 4, 3];
  // boss: minor/phrygian tension, chord per bar
  const DARK = [[50, 53, 57], [51, 55, 58], [48, 51, 55], [49, 52, 56], [50, 53, 57], [46, 50, 53], [48, 51, 55], [49, 53, 56]];
  const STAB = [0, 3, 7, 10, 12, 10, 7, 3, 15, 12, 7, 5, 3, 7, 0, -2];

  // ---------------- floor pieces ----------------
  const drawPlanet = (c, p) => {
    const { x, y, r } = p, pal = PLAN[p.kind], sa = .9 + p.tilt * .5, dx = Math.cos(sa), dy = Math.sin(sa);
    c.save();
    // atmosphere halo
    let g = c.createRadialGradient(x, y, r * .92, x, y, r * 1.3);
    g.addColorStop(0, 'rgba(' + pal[5] + ',.32)'); g.addColorStop(1, 'rgba(' + pal[5] + ',0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 1.3, 0, TAU); c.fill();
    // ring, back half
    if (p.ring) {
      c.save(); c.translate(x, y); c.rotate(p.tilt);
      c.strokeStyle = 'rgba(214,196,160,.5)'; c.lineWidth = r * .2; c.beginPath(); c.ellipse(0, 0, r * 1.85, r * .42, 0, Math.PI, TAU); c.stroke();
      c.strokeStyle = 'rgba(120,104,84,.55)'; c.lineWidth = r * .05; c.beginPath(); c.ellipse(0, 0, r * 1.62, r * .36, 0, Math.PI, TAU); c.stroke();
      c.restore();
    }
    // lit sphere body
    g = c.createRadialGradient(x - dx * r * .45, y - dy * r * .45, r * .08, x, y, r * 1.02);
    g.addColorStop(0, pal[2]); g.addColorStop(.45, pal[1]); g.addColorStop(1, pal[0]);
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip();
    const H2 = (k, j) => Math.abs(Math.sin(p.h * 9871 + k * 12.9898 + j * 78.233) * 43758.5453) % 1;
    if (p.kind === 1) { // continents + clouds
      c.fillStyle = pal[3];
      for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(x + (H2(k, 1) - .5) * r * 1.6, y + (H2(k, 2) - .5) * r * 1.4, r * (.18 + H2(k, 3) * .3), r * (.12 + H2(k, 4) * .2), H2(k, 5) * 3, 0, TAU); c.fill(); }
      c.fillStyle = pal[4];
      for (let k = 0; k < 3; k++) { c.beginPath(); c.ellipse(x + (H2(k, 6) - .5) * r, y + (H2(k, 7) - .5) * r, r * .12, r * .08, H2(k, 8) * 3, 0, TAU); c.fill(); }
      c.fillStyle = 'rgba(240,248,255,.45)';
      for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(x + (H2(k, 9) - .5) * r * 1.6, y + (H2(k, 10) - .5) * r * 1.6, r * (.25 + H2(k, 11) * .35), r * .05, p.tilt, 0, TAU); c.fill(); }
      c.fillStyle = 'rgba(240,248,255,.6)'; c.beginPath(); c.ellipse(x, y - r * .92, r * .5, r * .16, 0, 0, TAU); c.fill();
    } else if (p.kind === 3) { // craters
      for (let k = 0; k < 8; k++) {
        const cx = x + (H2(k, 1) - .5) * r * 1.6, cy = y + (H2(k, 2) - .5) * r * 1.6, cr = r * (.05 + H2(k, 3) * .14);
        c.fillStyle = 'rgba(20,16,14,.4)'; c.beginPath(); c.arc(cx, cy, cr, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(210,200,190,.35)'; c.lineWidth = 1.2; c.beginPath(); c.arc(cx, cy, cr, sa + Math.PI * .6, sa + Math.PI * 1.4); c.stroke();
      }
    } else { // banded worlds
      c.save(); c.translate(x, y); c.rotate(p.tilt);
      for (let k = -7; k <= 7; k++) {
        c.fillStyle = k % 2 ? pal[3] : pal[4]; c.globalAlpha = .28 + H2(k, 1) * .3;
        c.fillRect(-r, k * r * .15 + (H2(k, 2) - .5) * r * .06, r * 2, r * (.04 + H2(k, 3) * .09));
      }
      c.globalAlpha = 1;
      if (p.kind === 0 || p.kind === 5) { // storm eye
        c.fillStyle = pal[0]; c.beginPath(); c.ellipse(r * .25, r * .32, r * .2, r * .1, 0, 0, TAU); c.fill();
        c.fillStyle = pal[2]; c.beginPath(); c.ellipse(r * .25, r * .3, r * .1, r * .045, 0, 0, TAU); c.fill();
      }
      c.restore();
    }
    // terminator shadow
    g = c.createLinearGradient(x - dx * r, y - dy * r, x + dx * r, y + dy * r);
    g.addColorStop(0, 'rgba(2,2,10,0)'); g.addColorStop(.46, 'rgba(2,2,10,0)'); g.addColorStop(.6, 'rgba(2,2,10,.72)'); g.addColorStop(1, 'rgba(2,2,10,.96)');
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
    c.restore();
    // rim light on the lit limb
    c.strokeStyle = pal[2]; c.globalAlpha = .7; c.lineWidth = 1.6;
    c.beginPath(); c.arc(x, y, r - .8, sa + Math.PI - 1.15, sa + Math.PI + 1.15); c.stroke(); c.globalAlpha = 1;
    // ring, front half
    if (p.ring) {
      c.save(); c.translate(x, y); c.rotate(p.tilt);
      c.strokeStyle = 'rgba(214,196,160,.6)'; c.lineWidth = r * .2; c.beginPath(); c.ellipse(0, 0, r * 1.85, r * .42, 0, 0, Math.PI); c.stroke();
      c.strokeStyle = 'rgba(120,104,84,.6)'; c.lineWidth = r * .05; c.beginPath(); c.ellipse(0, 0, r * 1.62, r * .36, 0, 0, Math.PI); c.stroke();
      c.restore();
    }
    c.restore();
  };

  const drawStation = (c, s) => {
    const S = s.s;
    c.save(); c.translate(s.x, s.y); c.rotate(s.a); c.lineCap = 'butt';
    // broken habitat ring
    c.strokeStyle = '#121418'; c.lineWidth = S * .24; c.beginPath(); c.arc(0, 0, S, .5, TAU - .4); c.stroke();
    c.strokeStyle = '#4c505c'; c.lineWidth = S * .17; c.beginPath(); c.arc(0, 0, S, .5, TAU - .4); c.stroke();
    c.strokeStyle = '#7a7e8a'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, S - S * .05, .55, TAU - .45); c.stroke();
    c.strokeStyle = '#1a1c22'; c.lineWidth = 3; c.setLineDash([3, 7]); c.beginPath(); c.arc(0, 0, S + S * .03, .6, TAU - .5); c.stroke(); c.setLineDash([]);
    // snapped ring fragment drifting off
    c.strokeStyle = '#121418'; c.lineWidth = S * .24; c.beginPath(); c.arc(S * .22, S * .1, S, .05, .32); c.stroke();
    c.strokeStyle = '#4c505c'; c.lineWidth = S * .17; c.beginPath(); c.arc(S * .22, S * .1, S, .05, .32); c.stroke();
    // spokes (one broken)
    c.strokeStyle = '#121418'; c.lineWidth = S * .11;
    c.beginPath(); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 1.2, L = i === 3 ? S * .55 : S; c.moveTo(Math.cos(a) * S * .3, Math.sin(a) * S * .3); c.lineTo(Math.cos(a) * L, Math.sin(a) * L); } c.stroke();
    c.strokeStyle = '#5a5e6a'; c.lineWidth = S * .06; c.stroke();
    // girder truss arm
    c.strokeStyle = '#121418'; c.lineWidth = 4; c.beginPath(); c.moveTo(S * .3, -S * .08); c.lineTo(S * 1.9, -S * .08); c.moveTo(S * .3, S * .08); c.lineTo(S * 1.6, S * .08); c.stroke();
    c.strokeStyle = '#646874'; c.lineWidth = 1.6; c.beginPath();
    c.moveTo(S * .3, -S * .08); c.lineTo(S * 1.9, -S * .08); c.moveTo(S * .3, S * .08); c.lineTo(S * 1.6, S * .08);
    for (let i = 0; i < 8; i++) { const u = S * (.3 + i * .16); c.moveTo(u, -S * .08); c.lineTo(u + S * .08, S * .08); }
    c.stroke();
    // hub
    const hub = oct(S * .34, Math.PI / 8);
    c.fillStyle = '#5a5e6a'; c.strokeStyle = '#121418'; c.lineWidth = 3;
    c.beginPath(); hub.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#3a3e48'; c.beginPath(); c.arc(0, 0, S * .2, 0, TAU); c.fill();
    c.fillStyle = '#8a8e9a'; c.fillRect(-S * .3, -S * .3, S * .18, S * .06);
    // faded faction stripe, scorch and dead windows
    c.fillStyle = '#5e2a2e'; c.fillRect(-S * .05, -S * .32, S * .1, S * .64);
    c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(S * .12, S * .05, S * .2, S * .12, .6, 0, TAU); c.fill();
    c.fillStyle = '#1e2026';
    for (let i = 0; i < 18; i++) { const a = .7 + i * .29; c.fillRect(Math.cos(a) * S - 1.5, Math.sin(a) * S - 1.5, 3, 3); }
    // debris shards
    c.fillStyle = '#4c505c'; c.strokeStyle = '#121418'; c.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const a = -1 + i * .35, q = S * (1.25 + (i % 3) * .2), sz = 3 + (i * 7 % 5);
      c.beginPath(); c.moveTo(Math.cos(a) * q, Math.sin(a) * q); c.lineTo(Math.cos(a) * q + sz, Math.sin(a) * q + sz * .4); c.lineTo(Math.cos(a) * q - sz * .3, Math.sin(a) * q + sz); c.closePath(); c.fill(); c.stroke();
    }
    c.restore();
  };

  return {
    id: 'moo2', name: 'The Antaran Deep', nod: 'Master of Orion II', portal: '110,90,230', bg: '#020309', dark: .45, dim: .1,

    // ---------------- floor (cached per chunk) ----------------
    ground(Z, x0, y0, x1, y1) {
      const c = Z.ctx, H = Z.hash;
      c.save();
      // 1. nebula clouds: soft gradient blobs, defined bright wisps, dark dust lanes
      let [ax, bx] = cells(x0, x1, NC, 560), [ay, by] = cells(y0, y1, NC, 560);
      for (let cy = ay; cy <= by; cy++) for (let cx = ax; cx <= bx; cx++) {
        const h = H(cx * 5 + 11, cy * 3 - 7);
        if (h > .42) continue;
        const rgb = NEB[Math.floor(H(cx, cy * 9 + 2) * 5) % 5], R = 200 + H(cx * 3, cy + 4) * 200;
        const nx = cx * NC + NC / 2 + (H(cx + 1, cy * 2) - .5) * 200, ny = cy * NC + NC / 2 + (H(cx * 2, cy + 1) - .5) * 200;
        if (nx + R * 1.4 < x0 || nx - R * 1.4 > x1 || ny + R * 1.4 < y0 || ny - R * 1.4 > y1) continue;
        for (let k = 0; k < 6; k++) {
          const bxp = nx + (H(cx * 13 + k, cy * 7 - k) - .5) * R * 1.1, byp = ny + (H(cx * 3 - k * 5, cy * 11 + k) - .5) * R * .9, br = R * (.4 + H(cx + k * 9, cy - k) * .45);
          const g = c.createRadialGradient(bxp, byp, 0, bxp, byp, br);
          g.addColorStop(0, 'rgba(' + rgb + ',.26)'); g.addColorStop(.55, 'rgba(' + rgb + ',.1)'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
          c.fillStyle = g; c.beginPath(); c.arc(bxp, byp, br, 0, TAU); c.fill();
        }
        const rot = h * 9, wisp = new Path2D(), lane = new Path2D();
        for (let k = 0; k < 4; k++) {
          const wx = nx + (H(cx * 17 + k, cy * 5) - .5) * R, wy = ny + (H(cx * 5, cy * 17 + k) - .5) * R * .7, wr = R * (.3 + H(k, cx + cy) * .35);
          wisp.moveTo(wx + wr * Math.cos(rot + k * .3), wy + wr * Math.sin(rot + k * .3)); wisp.ellipse(wx, wy, wr, wr * .16, rot + k * .3, 0, TAU);
        }
        for (let k = 0; k < 2; k++) {
          const lx = nx + (H(cx * 23 + k, cy * 2) - .5) * R * .7, ly = ny + (H(cx * 2, cy * 23 + k) - .5) * R * .5, lr = R * .45;
          lane.moveTo(lx + lr * Math.cos(rot + 1.3), ly + lr * Math.sin(rot + 1.3)); lane.ellipse(lx, ly, lr, lr * .12, rot + 1.3, 0, TAU);
        }
        c.fillStyle = 'rgba(' + rgb + ',.12)'; c.fill(wisp);
        c.fillStyle = 'rgba(2,2,8,.22)'; c.fill(lane);
      }

      // 2. crisp background starfield (bucketed by colour)
      const C = 36, sDim = new Path2D(), sMid = new Path2D(), sBlue = new Path2D(), sWarm = new Path2D(), sRed = new Path2D();
      for (let cy = Math.floor(y0 / C); cy <= Math.floor(y1 / C); cy++)
        for (let cx = Math.floor(x0 / C); cx <= Math.floor(x1 / C); cx++) {
          const h = H(cx, cy), h2 = H(cx * 7 + 3, cy * 13 - 5);
          const x = Math.floor(cx * C + h2 * C), y = Math.floor(cy * C + h * C);
          sDim.rect(x, y, 1, 1);
          if (h < .4) sDim.rect(Math.floor(cx * C + h * C), Math.floor(cy * C + (1 - h2) * C), 1, 1);
          if (h2 < .16) sMid.rect(x + 9, y - 5, 2, 2);
          else if (h2 > .95) sWarm.rect(x - 4, y + 7, 2, 2);
          else if (h2 > .9) sBlue.rect(x - 4, y + 7, 2, 2);
          else if (h2 > .875) sRed.rect(x + 3, y + 3, 2, 2);
        }
      c.fillStyle = '#3c4660'; c.fill(sDim);
      c.fillStyle = '#b4bedc'; c.fill(sMid);
      c.fillStyle = '#ffd890'; c.fill(sWarm);
      c.fillStyle = '#8cc4ff'; c.fill(sBlue);
      c.fillStyle = '#ff8070'; c.fill(sRed);

      // 3. asteroid belts
      [ax, bx] = cells(x0, x1, BC, 560); [ay, by] = cells(y0, y1, BC, 560);
      for (let cy = ay; cy <= by; cy++) for (let cx = ax; cx <= bx; cx++) {
        const h = H(cx * 17 - 3, cy * 19 + 5);
        if (h > .3) continue;
        const mx = cx * BC + BC / 2, my = cy * BC + BC / 2, a = h * 20, ca = Math.cos(a), sa = Math.sin(a);
        const rocks = new Path2D(), lit = new Path2D(), dust = new Path2D();
        for (let i = 0; i < 110; i++) {
          const u = (H(cx * 131 + i, cy * 137 - i * 3) - .5) * 1000, v = (H(cx * 7 - i, cy * 11 + i * 5) + H(i * 3, cx - cy) - 1) * 130;
          const x = mx + ca * u - sa * v, y = my + sa * u + ca * v;
          if (x < x0 - 20 || x > x1 + 20 || y < y0 - 20 || y > y1 + 20) continue;
          const hs = H(i * 13 + cx, cy * 3 - i);
          if (hs < .35) { dust.rect(x, y, 1.5, 1.5); continue; }
          const rr = 2.5 + hs * hs * 13, rot = hs * 30;
          for (let k = 0; k < 7; k++) {
            const aa = rot + k / 7 * TAU, q = rr * (.7 + H(i + k, cx * 3 + k) * .45);
            k ? rocks.lineTo(x + Math.cos(aa) * q, y + Math.sin(aa) * q) : rocks.moveTo(x + Math.cos(aa) * q, y + Math.sin(aa) * q);
          }
          rocks.closePath();
          lit.moveTo(x - rr * .25 + rr * .4, y - rr * .3); lit.ellipse(x - rr * .25, y - rr * .3, rr * .4, rr * .28, -.6, 0, TAU);
        }
        c.lineWidth = 2; c.lineJoin = 'round'; c.strokeStyle = '#100e12'; c.stroke(rocks);
        c.fillStyle = '#4a4440'; c.fill(rocks); c.fillStyle = '#7a7068'; c.fill(lit);
        c.fillStyle = '#4a4650'; c.fill(dust);
      }

      // 4. derelict station hulks
      [ax, bx] = cells(x0, x1, SC, 260); [ay, by] = cells(y0, y1, SC, 260);
      for (let cy = ay; cy <= by; cy++) for (let cx = ax; cx <= bx; cx++) {
        const s = stationAt(H, cx, cy);
        if (s && s.x + s.s * 2.1 > x0 && s.x - s.s * 2.1 < x1 && s.y + s.s * 2.1 > y0 && s.y - s.s * 2.1 < y1) drawStation(c, s);
      }

      // 5. planets
      [ax, bx] = cells(x0, x1, PC, 200); [ay, by] = cells(y0, y1, PC, 200);
      for (let cy = ay; cy <= by; cy++) for (let cx = ax; cx <= bx; cx++) {
        const p = planetAt(H, cx, cy);
        if (p && p.x + p.r * 2 > x0 && p.x - p.r * 2 < x1 && p.y + p.r * 2 > y0 && p.y - p.r * 2 < y1) drawPlanet(c, p);
      }

      // 6. named star systems: halo, crisp core, spikes, and owner name-tags (dot + bar glyphs)
      [ax, bx] = cells(x0, x1, STC, 40); [ay, by] = cells(y0, y1, STC, 40);
      const spikes = new Path2D(), tagBars = new Path2D();
      for (let cy = ay; cy <= by; cy++) for (let cx = ax; cx <= bx; cx++) {
        const s = starAt(H, cx, cy);
        if (!s) continue;
        const { x, y, h } = s;
        if (h < .1) {
          const g = c.createRadialGradient(x, y, 0, x, y, 14);
          g.addColorStop(0, 'rgba(' + s.col + ',.55)'); g.addColorStop(1, 'rgba(' + s.col + ',0)');
          c.fillStyle = g; c.fillRect(x - 14, y - 14, 28, 28);
          c.fillStyle = 'rgb(' + s.col + ')'; c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill();
          c.fillStyle = '#fff'; c.fillRect(x - 1, y - 1, 2, 2);
          spikes.moveTo(x - 8, y); spikes.lineTo(x + 8, y); spikes.moveTo(x, y - 8); spikes.lineTo(x, y + 8);
          if (h < .07) { // colonised: owner dot + short name bars
            c.fillStyle = OWNER[Math.floor(H(cx + 3, cy * 3) * 6) % 6];
            c.fillRect(x - 10, y + 9, 3, 3);
            let bxp = x - 5;
            const nb = 2 + Math.floor(H(cx * 9, cy + 9) * 3);
            for (let k = 0; k < nb; k++) { const w = 2 + Math.floor(H(cx + k, cy * 5 + k) * 5); tagBars.rect(bxp, y + 10, w, 1.5); bxp += w + 2; }
          }
        } else {
          c.fillStyle = 'rgb(' + s.col + ')'; c.fillRect(Math.floor(x) - 1, Math.floor(y) - 1, 2, 2);
        }
      }
      c.lineWidth = 1; c.strokeStyle = 'rgba(230,236,255,.5)'; c.stroke(spikes);
      c.fillStyle = 'rgba(200,210,230,.75)'; c.fill(tagBars);

      // 7. tactical combat grid: faint dotted squares with corner ticks
      const G = 64, gx0 = Math.floor(x0 / G) * G, gy0 = Math.floor(y0 / G) * G, grid = new Path2D(), ticks = new Path2D();
      for (let gx = gx0; gx <= x1; gx += G) { grid.moveTo(gx, gy0); grid.lineTo(gx, y1 + G); }
      for (let gy = gy0; gy <= y1; gy += G) { grid.moveTo(gx0, gy); grid.lineTo(x1 + G, gy); }
      for (let gx = gx0; gx <= x1; gx += G) for (let gy = gy0; gy <= y1; gy += G) {
        const big = (Math.round(gx / G) % 4 === 0) && (Math.round(gy / G) % 4 === 0), L = big ? 6 : 2.5;
        ticks.moveTo(gx - L, gy); ticks.lineTo(gx + L, gy); ticks.moveTo(gx, gy - L); ticks.lineTo(gx, gy + L);
      }
      c.lineWidth = 1; c.strokeStyle = 'rgba(110,160,230,.17)'; c.setLineDash([2, 6]); c.stroke(grid); c.setLineDash([]);
      c.lineWidth = 1.2; c.strokeStyle = 'rgba(140,190,255,.32)'; c.stroke(ticks);
      c.restore();
    },

    // ---------------- animated floor details: orbiting moons, station beacons ----------------
    under(Z) {
      const c = Z.ctx, H = Z.hash, P = Z.P, t = Z.now;
      const x0 = P.x - Z.W * .6 - 60, x1 = P.x + Z.W * .6 + 60, y0 = P.y - Z.H * .6 - 60, y1 = P.y + Z.H * .6 + 60;
      let [ax, bx] = cells(x0, x1, PC, 200), [ay, by] = cells(y0, y1, PC, 200);
      for (let cy = ay; cy <= by; cy++) for (let cx = ax; cx <= bx; cx++) {
        const p = planetAt(H, cx, cy);
        if (!p || p.x + p.r * 2.4 < x0 || p.x - p.r * 2.4 > x1 || p.y + p.r * 2.4 < y0 || p.y - p.r * 2.4 > y1) continue;
        const a = t * (.12 + p.h * .3) + p.h * 40, D = p.r * (1.55 + p.h), mx = p.x + Math.cos(a) * D, my = p.y + Math.sin(a) * D * .38;
        if (Math.sin(a) < 0 && Math.abs(mx - p.x) < p.r) continue; // behind the planet
        const mr = 3 + p.r * .06;
        c.fillStyle = '#9a948c'; c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.fill();
        c.fillStyle = 'rgba(2,2,10,.75)'; c.beginPath(); c.arc(mx + mr * .45, my + mr * .45, mr * .9, 0, TAU); c.fill();
      }
      [ax, bx] = cells(x0, x1, SC, 200); [ay, by] = cells(y0, y1, SC, 200);
      for (let cy = ay; cy <= by; cy++) for (let cx = ax; cx <= bx; cx++) {
        const s = stationAt(H, cx, cy);
        if (!s || s.x + s.s * 2 < x0 || s.x - s.s * 2 > x1 || s.y + s.s * 2 < y0 || s.y - s.s * 2 > y1) continue;
        for (let k = 0; k < 3; k++) {
          const on = Math.sin(t * (2 + k) + s.h * 30 + k * 2) > .55;
          if (!on) continue;
          const a = s.a + 1.2 + k * 2.1, q = k === 2 ? s.s * 1.9 : s.s;
          const lx = k === 2 ? s.x + Math.cos(s.a) * q : s.x + Math.cos(a) * q, ly = k === 2 ? s.y + Math.sin(s.a) * q : s.y + Math.sin(a) * q;
          c.fillStyle = k === 1 ? '#ffb040' : '#ff4040'; c.fillRect(lx - 1.5, ly - 1.5, 3, 3);
        }
      }
    },

    // ---------------- glowing details: twinkles, planet glints, engine flares ----------------
    ambient(Z) {
      const c = Z.ctx, H = Z.hash, P = Z.P, t = Z.now;
      const x0 = P.x - Z.W * .6 - 60, x1 = P.x + Z.W * .6 + 60, y0 = P.y - Z.H * .6 - 60, y1 = P.y + Z.H * .6 + 60;
      let n = 0;
      // twinkling named stars
      let [ax, bx] = cells(x0, x1, STC, 0), [ay, by] = cells(y0, y1, STC, 0);
      for (let cy = ay; cy <= by && n < 40; cy++) for (let cx = ax; cx <= bx && n < 40; cx++) {
        const s = starAt(H, cx, cy);
        if (!s || s.h > .1) continue;
        n++;
        const tw = .5 + .5 * Math.sin(t * (1.2 + s.h * 30) + s.h * 400);
        Z.glow(s.col, 6 + tw * 7, s.x, s.y, .15 + tw * .35);
        if (tw > .9 && n < 10) {
          c.save(); c.globalAlpha = (tw - .9) * 8; c.strokeStyle = 'rgb(' + s.col + ')'; c.lineWidth = 1;
          c.beginPath(); c.moveTo(s.x - 12, s.y); c.lineTo(s.x + 12, s.y); c.moveTo(s.x, s.y - 12); c.lineTo(s.x, s.y + 12); c.stroke(); c.restore();
        }
      }
      // planet glints
      [ax, bx] = cells(x0, x1, PC, 200); [ay, by] = cells(y0, y1, PC, 200);
      for (let cy = ay; cy <= by; cy++) for (let cx = ax; cx <= bx; cx++) {
        const p = planetAt(H, cx, cy);
        if (!p || p.x + p.r < x0 || p.x - p.r > x1 || p.y + p.r < y0 || p.y - p.r > y1) continue;
        const sa = .9 + p.tilt * .5, g = .5 + .5 * Math.sin(t * .7 + p.h * 50);
        Z.glow(PLAN[p.kind][5], p.r * .35, p.x - Math.cos(sa) * p.r * .5, p.y - Math.sin(sa) * p.r * .5, .1 + g * .12);
      }
      // engine flares and boss reactor
      const fs = Z.foes();
      let f = 0;
      for (let i = 0; i < fs.length && f < 110; i++) {
        const e = fs[i];
        if (e.x < x0 || e.x > x1 || e.y < y0 || e.y > y1) continue;
        if (e.boss) { Z.glow(e.angry ? '255,70,50' : '255,140,60', e.r * 1.1, e.x, e.y, .3 + .1 * Math.sin(t * 6)); f++; continue; }
        if (!e.eng) continue;
        const q = e.r * e.eng * 1.3, fl = .45 + .15 * Math.sin(t * 30 + e.seed * 7);
        Z.glow('255,150,60', e.r * 1.1, e.x + Math.cos(e.ang) * q, e.y + Math.sin(e.ang) * q, fl); f++;
      }
    },

    mix: { interceptor: 5, frigate: 2, cruiser: 1.1, voidling: 1.6 },
    target: 1,

    foes: {
      // fast crimson raider darts that weave in squadrons
      interceptor: { hp: 11, sp: 118, dmg: 7, xp: 1, r: 11, eye: false,
        init(e) { e.eng = -1.05; },
        update(e, Z) {
          const a = Z.angTo(e), w = Math.sin(e.ph * 3.6 + e.seed * 2) * (Z.dist(e) > 90 ? .75 : .25);
          const h = a + w;
          Z.move(e, Math.cos(h) * e.sp, Math.sin(h) * e.sp); e.ang = h;
        },
        draw(e, Z, white) {
          const c = Z.ctx, r = e.r; c.save(); c.translate(e.x, e.y); c.rotate(e.ang); c.scale(r, r); c.lineJoin = 'round';
          if (white) { c.fillStyle = '#fff'; c.fill(INT_HULL); c.restore(); return; }
          const fl = .85 + .3 * Math.sin(Z.now * 40 + e.seed * 9);
          c.save(); c.translate(-.9, 0); c.scale(fl, 1); c.translate(.9, 0); c.fillStyle = ORNG; c.fill(INT_FLAME); c.fillStyle = '#fff4d0'; c.fill(INT_CORE); c.restore();
          c.lineWidth = 4.5 / r; c.strokeStyle = OUT; c.stroke(INT_HULL);
          c.fillStyle = CRIM; c.fill(INT_HULL);
          c.fillStyle = STEEL_HI; c.fill(INT_SPINE);
          c.fillStyle = ORNG; c.fill(INT_TRIM);
          c.lineWidth = 1.2 / r; c.strokeStyle = CRIM_D; c.stroke(INT_SPINE);
          c.fillStyle = '#60e8ff'; c.beginPath(); c.ellipse(.55, 0, .26, .11, 0, 0, TAU); c.fill();
          c.fillStyle = Math.sin(Z.now * 8 + e.seed) > 0 ? '#ffe070' : '#6a2010'; c.fillRect(-.6, -.08, .16, .16);
          c.restore();
        } },

      // missile frigates hold at range and fire slow missile bursts
      frigate: { hp: 38, sp: 62, dmg: 9, xp: 3, r: 14, eye: false,
        init(e) { e.burst = 0; e.bt = 0; e.t1 = 1.5 + e.seed * .4; e.eng = -1.2; },
        update(e, Z) {
          const d = Z.dist(e), a = Z.angTo(e), dir = e.seed > 3 ? 1 : -1;
          let vx, vy;
          if (d > 310) { vx = Math.cos(a) * e.sp; vy = Math.sin(a) * e.sp; }
          else if (d < 210) { vx = -Math.cos(a) * e.sp * .8; vy = -Math.sin(a) * e.sp * .8; }
          else { vx = -Math.sin(a) * e.sp * .55 * dir; vy = Math.cos(a) * e.sp * .55 * dir; }
          Z.move(e, vx, vy); e.ang = a;
          if ((e.t1 -= Z.dt) <= 0 && d < 520) { e.t1 = 3.6; e.burst = 3; e.bt = .35; }
          if (e.burst > 0 && (e.bt -= Z.dt) <= 0) {
            e.bt = .2; e.burst--;
            const side = e.burst % 2 ? 1 : -1, ox = Math.cos(a + 1.57 * side) * 7, oy = Math.sin(a + 1.57 * side) * 7;
            Z.shoot(e.x + ox, e.y + oy, a + (e.burst - 1) * .12, 155, { r: 5, dmg: 8, life: 4.5, col: '255,150,40' });
            Z.sfx('shoot');
          }
        },
        draw(e, Z, white) {
          const c = Z.ctx, r = e.r; c.save(); c.translate(e.x, e.y); c.rotate(e.ang); c.scale(r, r); c.lineJoin = 'round';
          if (white) { c.fillStyle = '#fff'; c.fill(FRG_HULL); c.fill(FRG_PODS); c.restore(); return; }
          c.globalAlpha = .75 + .25 * Math.sin(Z.now * 25 + e.seed); c.fillStyle = ORNG; c.fill(FRG_FLAME); c.globalAlpha = 1;
          c.lineWidth = 4.5 / r; c.strokeStyle = OUT; c.stroke(FRG_HULL); c.stroke(FRG_PODS);
          c.fillStyle = CRIM; c.fill(FRG_HULL);
          c.fillStyle = STEEL; c.fill(FRG_PODS);
          const ready = e.burst > 0 || e.t1 < .6;
          c.fillStyle = ready ? '#ffe040' : ORNG; c.fill(FRG_TIPS);
          c.fillStyle = CRIM_D; c.fill(FRG_STRIPE);
          c.fillStyle = STEEL_HI; c.fill(FRG_BRIDGE);
          c.lineWidth = 1.4 / r; c.strokeStyle = OUT; c.stroke(FRG_BRIDGE); c.stroke(FRG_PODS);
          c.fillStyle = ready ? '#ff3020' : '#5a1a14'; c.fill(FRG_LIGHTS);
          c.fillStyle = Math.sin(Z.now * 5 + e.seed) > .3 ? '#80f0ff' : '#204050'; c.fillRect(.55, -.08, .16, .16);
          c.restore();
        } },

      // beam cruisers stop, telegraph a growing line, then fire a lance of blasts
      cruiser: { hp: 95, sp: 42, dmg: 14, xp: 7, r: 18, heavy: true, eye: false,
        init(e) { e.mode = 'walk'; e.at = 0; e.la = 0; e.fire = 0; e.t1 = 2.5 + e.seed * .3; e.eng = -1.35; },
        update(e, Z) {
          const d = Z.dist(e), a = Z.angTo(e);
          if (e.fire > 0) e.fire -= Z.dt;
          if (e.mode === 'walk') {
            if (d > 300) Z.chase(e); else { Z.move(e, -Math.sin(a) * e.sp * .4, Math.cos(a) * e.sp * .4); e.ang = a; }
            e.la = e.ang;
            if ((e.t1 -= Z.dt) <= 0 && d < 470) { e.mode = 'aim'; e.at = 0; e.la = a; Z.sfx('charge'); }
          } else if (e.mode === 'aim') {
            Z.move(e, 0, 0);
            e.at += Z.dt;
            if (e.at < .4) { let df = a - e.la; df = Math.atan2(Math.sin(df), Math.cos(df)); e.la += df * Math.min(1, Z.dt * 6); }
            e.ang = e.la;
            if (e.at >= .8) {
              const ca = Math.cos(e.la), sa = Math.sin(e.la);
              for (let i = 0; i < 10; i++) {
                const q = e.r + 24 + i * 50;
                Z.hazard(e.x + ca * q, e.y + sa * q, { r: 26, t: .15 + i * .025, dmg: 12, col: '120,220,255' });
              }
              Z.sfx('nova'); e.fire = .35; e.mode = 'cool'; e.at = 0;
            }
          } else {
            Z.move(e, 0, 0); e.at += Z.dt;
            if (e.at > .6) { e.mode = 'walk'; e.t1 = 4.5; }
          }
        },
        draw(e, Z, white) {
          const c = Z.ctx, r = e.r;
          // warning line / beam (world space; the engine's 1.3x scale is around e.x, e.y)
          if (!white && (e.mode === 'aim' || e.fire > 0)) {
            const ca = Math.cos(e.la), sa = Math.sin(e.la);
            c.save(); c.lineCap = 'round';
            if (e.mode === 'aim') {
              const p = clamp(e.at / .8, 0, 1), L = 40 + p * 400;
              c.globalAlpha = clamp(.35 + .5 * p * (.6 + .4 * Math.sin(Z.now * 40)), 0, 1);
              c.strokeStyle = '#70e0ff'; c.lineWidth = .8 + p * 2.2; c.setLineDash([10, 6]);
              c.beginPath(); c.moveTo(e.x + ca * r, e.y + sa * r); c.lineTo(e.x + ca * L, e.y + sa * L); c.stroke(); c.setLineDash([]);
            } else {
              c.globalAlpha = clamp(e.fire / .35, 0, 1); c.strokeStyle = '#2a90c0'; c.lineWidth = 11;
              c.beginPath(); c.moveTo(e.x + ca * r, e.y + sa * r); c.lineTo(e.x + ca * 430, e.y + sa * 430); c.stroke();
              c.strokeStyle = '#e0faff'; c.lineWidth = 4; c.stroke();
            }
            c.restore();
          }
          c.save(); c.translate(e.x, e.y); c.rotate(e.ang); c.scale(r, r); c.lineJoin = 'round';
          if (white) { c.fillStyle = '#fff'; c.fill(CRU_HULL); c.restore(); return; }
          c.globalAlpha = .7 + .3 * Math.sin(Z.now * 22 + e.seed); c.fillStyle = ORNG; c.fill(CRU_FLAME); c.globalAlpha = 1;
          c.lineWidth = 4.5 / r; c.strokeStyle = OUT; c.stroke(CRU_HULL);
          c.fillStyle = STEEL; c.fill(CRU_HULL);
          c.fillStyle = CRIM; c.fill(CRU_PLATES);
          c.lineWidth = 1.4 / r; c.stroke(CRU_PLATES);
          c.fillStyle = STEEL_D; c.fill(CRU_DECK);
          c.fillStyle = ORNG; c.fill(CRU_TRIM);
          // rotating sensor dish
          c.save(); c.translate(-.3, 0); c.rotate(Z.now * 2.5 + e.seed);
          c.fillStyle = STEEL_HI; c.fillRect(-.32, -.07, .64, .14); c.restore();
          // emitter charging
          const p = e.mode === 'aim' ? clamp(e.at / .8, 0, 1) : 0;
          c.fillStyle = OUT; c.beginPath(); c.arc(1.2, 0, .2 + p * .14, 0, TAU); c.fill();
          c.fillStyle = p > 0 ? '#c8f8ff' : '#3ab0e0'; c.beginPath(); c.arc(1.2, 0, .13 + p * .14, 0, TAU); c.fill();
          c.restore();
        } },

      // crystalline void organism that splits into smaller pieces
      voidling: { hp: 55, sp: 40, dmg: 12, xp: 5, r: 16, eye: '#ffe0ff',
        init(e) { if (!e.gen) e.gen = 0; },
        update(e, Z) {
          const a = Z.angTo(e) + Math.sin(e.ph * 1.3 + e.seed) * .5;
          const s = e.sp * (.7 + .3 * Math.sin(e.ph * 2.2 + e.seed));
          Z.move(e, Math.cos(a) * s, Math.sin(a) * s); e.ang = a;
        },
        draw(e, Z, white) {
          const c = Z.ctx, r = e.r; c.save(); c.translate(e.x, e.y); c.lineJoin = 'round';
          // amoeba membrane
          c.beginPath();
          for (let i = 0; i < 9; i++) {
            const a = i / 9 * TAU, q = r * (.92 + .14 * Math.sin(e.ph * 4 + i * 2.1 + e.seed));
            i ? c.lineTo(Math.cos(a) * q, Math.sin(a) * q) : c.moveTo(q, 0);
          }
          c.closePath();
          if (white) { c.fillStyle = '#fff'; c.fill(); c.restore(); return; }
          c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
          c.fillStyle = VIOL; c.fill();
          c.lineWidth = 2; c.strokeStyle = '#c090ff'; c.beginPath(); c.arc(0, 0, r * .72, 3.6, 4.9); c.stroke();
          // rotating crystal core
          c.rotate(e.ph * 1.2 + e.seed); c.scale(r, r);
          c.lineWidth = 2.5 / r; c.strokeStyle = OUT; c.stroke(CRYSTAL);
          c.fillStyle = CRYS; c.fill(CRYSTAL);
          c.fillStyle = '#f0fffc'; c.globalAlpha = .55 + .45 * Math.sin(Z.now * 6 + e.seed);
          c.beginPath(); c.arc(0, 0, .18, 0, TAU); c.fill(); c.globalAlpha = 1;
          c.restore();
        },
        death(e, Z) {
          Z.burst(e.x, e.y, CRYS, 8, 90);
          if ((e.gen || 0) >= 2) return;
          const n = e.gen ? 2 : 3;
          for (let i = 0; i < n; i++) {
            const a = i / n * TAU + e.seed;
            const f = Z.spawn('voidling', e.x + Math.cos(a) * e.r * .6, e.y + Math.sin(a) * e.r * .6);
            if (!f) continue;
            f.gen = (e.gen || 0) + 1;
            f.r = Math.max(7, e.r * .65); f.max = f.hp = Math.max(6, e.max * .35);
            f.sp = e.sp * 1.5; f.kx = Math.cos(a) * 160; f.ky = Math.sin(a) * 160;
          }
        } },
    },

    // ---------------- miniboss ----------------
    boss: { name: 'Vorthane, the Eternal Bastion', hp: 3800, sp: 48, dmg: 24, xp: 0, r: 48, heavy: true, eye: false,
      init(e) { e.cd = 2.5; e.pat = 0; e.angry = false; e.rayAt = -9; e.rayA0 = 0; e.raySpan = 0; e.raySteps = 1; e.rayDel = .12; e.charge = 0; },
      update(e, Z) {
        const d = Z.dist(e), a = Z.angTo(e), dir = e.seed > 3 ? 1 : -1;
        if (d > 250) Z.chase(e, e.sp * (e.angry ? 1.3 : 1));
        else { Z.move(e, -Math.sin(a) * e.sp * .5 * dir, Math.cos(a) * e.sp * .5 * dir); e.ang = a; }
        if (!e.angry && e.hp < e.max * .4) {
          e.angry = true; e.cd = 1.2;
          Z.banner('The Bastion awakens in fury', '#ff5040', false); Z.shake(10); Z.sfx('boss');
          Z.ring(e.x, e.y, 20, 110, { r: 7, dmg: 10, col: '255,90,70', life: 6 }, e.ph);
        }
        if (e.charge > 0) e.charge -= Z.dt;
        if ((e.cd -= Z.dt) > 0) return;
        const pat = e.pat++ % 4, A = e.angry;
        if (pat === 0) { // sweeping death-ray: hazards across an arc, step by step
          e.raySteps = A ? 12 : 9; e.raySpan = A ? 2.6 : 1.8; e.rayDel = A ? .1 : .13;
          e.rayA0 = a - e.raySpan / 2 * dir; e.raySpan *= dir; e.rayAt = e.ph;
          for (let k = 0; k <= e.raySteps; k++) {
            const ang = e.rayA0 + e.raySpan * k / e.raySteps, ca = Math.cos(ang), sa = Math.sin(ang);
            for (let i = 0; i < 5; i++) {
              const q = e.r + 30 + i * 62;
              Z.hazard(e.x + ca * q, e.y + sa * q, { r: 30, t: .85 + k * e.rayDel, dmg: 16, col: '255,70,60' });
            }
          }
          Z.sfx('charge'); e.cd = A ? 3 : 3.8;
        } else if (pat === 1) { // radial plasma torpedo ring
          Z.ring(e.x, e.y, A ? 18 : 14, 115, { r: 8, dmg: 12, col: '255,110,210', life: 7 }, e.ph);
          if (A) Z.ring(e.x, e.y, 18, 80, { r: 7, dmg: 10, col: '200,120,255', life: 8 }, e.ph + .17);
          Z.sfx('nova'); Z.shake(4); e.charge = .4; e.cd = A ? 2 : 2.8;
        } else if (pat === 2) { // launch an interceptor squadron in V formation
          const n = A ? 7 : 5, bx = Math.cos(e.ang), by = Math.sin(e.ang);
          for (let i = 0; i < n; i++) {
            const row = Math.ceil(i / 2), side = i === 0 ? 0 : (i % 2 ? 1 : -1);
            const f = Z.spawn('interceptor', e.x + bx * (e.r - row * 26) - by * side * row * 24, e.y + by * (e.r - row * 26) + bx * side * row * 24);
            if (f) f.seed = e.ph % 6;
          }
          Z.sfx('warn'); Z.burst(e.x, e.y, ENG, 12, 140); e.cd = A ? 2.4 : 3.2;
        } else { // mass-driver fan plus targeted bombardment
          const n = A ? 7 : 5;
          for (let i = 0; i < n; i++) Z.shoot(e.x, e.y, a + (i - (n - 1) / 2) * .16, 200, { r: 6, dmg: 10, col: '255,200,90', life: 4 });
          for (let i = 0; i < (A ? 4 : 2); i++) Z.hazard(Z.P.x + Z.rnd(-90, 90), Z.P.y + Z.rnd(-90, 90), { r: 60, t: 1.1, dmg: 14, col: '255,140,60' });
          Z.sfx('shoot'); e.cd = A ? 2.2 : 3;
        }
      },
      draw(e, Z, white) {
        const c = Z.ctx, r = e.r, t = Z.now, A = e.angry;
        // sweeping ray indicator (world space)
        const el = e.ph - e.rayAt - .85, dur = e.raySteps * e.rayDel;
        if (!white && el > -.85 && el < dur + .2) {
          const p = clamp(el / dur, 0, 1), ang = e.rayA0 + e.raySpan * p, L = (r + 340) / 1.3;
          c.save(); c.globalAlpha = el < 0 ? .3 + .2 * Math.sin(t * 30) : .8; c.lineCap = 'round';
          c.strokeStyle = el < 0 ? '#ff6050' : '#ff3a20'; c.lineWidth = el < 0 ? 2 : 9;
          c.beginPath(); c.moveTo(e.x + Math.cos(ang) * r, e.y + Math.sin(ang) * r); c.lineTo(e.x + Math.cos(ang) * L, e.y + Math.sin(ang) * L); c.stroke();
          if (el >= 0) { c.strokeStyle = '#fff0d8'; c.lineWidth = 3; c.stroke(); }
          c.restore();
        }
        c.save(); c.translate(e.x, e.y); c.lineJoin = 'round';
        if (white) {
          c.scale(r, r); c.fillStyle = '#fff'; c.fill(B_RING); c.fill(B_PYLON); c.fill(B_PTIP); c.fill(B_HULL);
          c.restore(); return;
        }
        // rotating shield arcs
        c.lineWidth = 4; c.lineCap = 'round';
        for (let k = 0; k < 3; k++) {
          const s = t * (A ? 1.6 : .8) * (k % 2 ? -1 : 1) + k * 2.1, rr = r * 1.3 + k * 5;
          c.strokeStyle = A ? 'rgba(255,90,80,' + (.45 + .2 * Math.sin(t * 4 + k)) + ')' : 'rgba(90,200,255,' + (.45 + .2 * Math.sin(t * 3 + k)) + ')';
          c.beginPath(); c.arc(0, 0, rr, s, s + 1.3); c.stroke();
          c.beginPath(); c.arc(0, 0, rr, s + Math.PI, s + Math.PI + .8); c.stroke();
        }
        c.lineCap = 'butt';
        // docking pylons (slow counter-rotation)
        c.save(); c.rotate(-t * .08); c.scale(r, r);
        c.lineWidth = 5 / r; c.strokeStyle = OUT; c.stroke(B_PYLON); c.stroke(B_PTIP);
        c.fillStyle = STEEL; c.fill(B_PYLON);
        c.fillStyle = Math.sin(t * 4) > 0 ? '#ffd040' : ORNG; c.fill(B_PTIP);
        c.restore();
        // armoured outer ring
        c.save(); c.rotate(t * (A ? .35 : .15)); c.scale(r, r);
        c.lineWidth = 5 / r; c.strokeStyle = OUT; c.stroke(B_RING);
        c.fillStyle = A ? '#e83030' : CRIM; c.fill(B_RING);
        c.fillStyle = ORNG; c.fill(B_RTRIM);
        c.fillStyle = '#fff2a0'; c.fill(Math.sin(t * (A ? 10 : 5)) > 0 ? B_LIGHT_A : B_LIGHT_B);
        c.restore();
        // main hull
        c.save(); c.scale(r, r);
        c.lineWidth = 5 / r; c.strokeStyle = OUT; c.stroke(B_HULL);
        c.fillStyle = STEEL; c.fill(B_HULL);
        c.fillStyle = CRIM_D; c.fill(B_PLATES);
        c.fillStyle = STEEL_HI; c.fill(B_HI);
        c.lineWidth = 1.6 / r; c.strokeStyle = '#1c1e26'; c.stroke(B_SEAMS); c.stroke(B_PLATES);
        c.fillStyle = STEEL_D; c.fill(B_INNER); c.stroke(B_INNER);
        c.restore();
        // four turrets tracking the hero
        for (let i = 0; i < 4; i++) {
          const a = i / 4 * TAU + t * .02, px = Math.cos(a) * r * .66, py = Math.sin(a) * r * .66;
          c.save(); c.translate(px, py); c.rotate(e.ang);
          c.fillStyle = OUT; c.fillRect(0, -4.5, r * .36, 9);
          c.fillStyle = STEEL_HI; c.fillRect(1, -2.5, r * .33, 5);
          c.fillStyle = OUT; c.beginPath(); c.arc(0, 0, r * .15, 0, TAU); c.fill();
          c.fillStyle = CRIM; c.beginPath(); c.arc(0, 0, r * .11, 0, TAU); c.fill();
          c.restore();
        }
        // pulsing reactor core
        const pulse = .5 + .5 * Math.sin(t * (A ? 9 : 4)), ch = e.charge > 0 ? 1 : 0;
        c.fillStyle = OUT; c.beginPath(); c.arc(0, 0, r * .34, 0, TAU); c.fill();
        c.fillStyle = A ? '#ff3a2a' : '#ff7a2a'; c.beginPath(); c.arc(0, 0, r * (.24 + .05 * pulse + ch * .06), 0, TAU); c.fill();
        c.fillStyle = '#fff0c0'; c.globalAlpha = .55 + .45 * pulse; c.beginPath(); c.arc(0, 0, r * .11, 0, TAU); c.fill(); c.globalAlpha = 1;
        c.restore();
      } },

    // ---------------- scripted moments ----------------
    events: [
      { t: 20, run(Z) { Z.banner('Raider fleet detected', '#ff7050', false); Z.sfx('warn'); vFormation(Z, Z.rnd(0, TAU), 560, 9); } },
      { t: 38, run(Z) { vFormation(Z, Z.rnd(0, TAU), 600, 7); } },
      { t: 62, run(Z) {
        Z.banner('Missile frigates on long-range scan', '#ffb060', false);
        const a0 = Z.rnd(0, TAU);
        for (let i = 0; i < 5; i++) { const a = a0 + i / 5 * TAU; Z.spawn('frigate', Z.P.x + Math.cos(a) * 520, Z.P.y + Math.sin(a) * 520); }
      } },
      { t: 95, run(Z) {
        Z.banner('Ion storm!', '#80c8ff', true); Z.shake(6); Z.sfx('warn');
        for (let i = 0; i < 24; i++) {
          const a = Z.rnd(0, TAU), q = Z.rnd(40, 400);
          Z.hazard(Z.P.x + Math.cos(a) * q, Z.P.y + Math.sin(a) * q, { r: Z.rnd(40, 64), t: .9 + i * .14, dmg: 10, col: '140,200,255' });
        }
      } },
      { t: 112, run(Z) { vFormation(Z, Z.rnd(0, TAU), 560, 9); } },
      { t: 128, run(Z) {
        Z.banner('Crystalline bloom', '#60e8d8', false);
        for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; Z.spawn('voidling', Z.P.x + Math.cos(a) * 480, Z.P.y + Math.sin(a) * 480); }
      } },
    ],

    // ---------------- music ----------------
    music: { bpm: 88, div: 4,
      step(s, t, A) {
        const st = 60 / 88 / 4, bar = Math.floor(s / 16), b = s % 16;
        if (!A.boss) {
          const ch = CALM[Math.floor(bar / 2) % 8], first = bar % 2 === 0;
          if (first && b === 0) {
            A.pad(ch.slice(1, 5), t, st * 32, .016, { type: 'sawtooth', cutoff: 520 + 260 * Math.sin(bar * .7), q: 2, detune: 12 });
            A.tone(t, ch[0] - 12, st * 28, .075, { type: 'sine', attack: .3 });
          }
          if (!first && b === 8) A.tone(t, ch[0] - 12 + (bar % 4 === 3 ? 7 : 0), st * 8, .05, { type: 'sine', attack: .1 });
          // echoey arpeggio (enters after the intro, rests every 8th bar)
          if (bar >= 2 && bar % 8 !== 7 && b % 2 === 0) {
            const note = ch[ARP[(b / 2 + bar) % 8]] + 12, pan = Math.sin(s * .4) * .6;
            A.tone(t, note, .55, .032, { type: 'triangle', decay: true, pan });
            A.tone(t + st * 3, note + (b % 8 === 4 ? 12 : 0), .45, .012, { type: 'sine', decay: true, pan: -pan });
          }
          // shimmering bell motifs
          const m = MOTIFS[Math.floor(bar / 4) % 4], ps = s % 64;
          if (bar >= 4) for (const [at, d] of m) if (at === ps) {
            A.bell(deg(74, d), t, .045);
            if ((bar >> 2) % 2) A.tone(t, deg(62, d), st * 6, .03, { type: 'sine', attack: .08, vib: .3 });
          }
          // sparse soft percussion
          if (bar >= 4 && (b === 0 || b === 10)) A.kick(t, .38);
          if (bar >= 8 && b % 4 === 2) A.hat(t, .025, false);
          if (bar % 4 === 3 && b === 4) A.noise(t, st * 12, .025, { type: 'bandpass', f: 300, f2: 3200, q: 2 });
          if (bar % 16 === 15 && b === 12) A.bell(deg(86, 4), t, .035);
        } else {
          const ch = DARK[bar % 8], root = ch[0];
          if (b === 0) A.pad(ch.map(m => m + 12), t, st * 16, .02, { type: 'sawtooth', cutoff: 800, q: 3, detune: 14 });
          // pulsing sequenced bass in 16ths
          A.tone(t, root - 12 + (b % 4 === 3 ? 12 : 0), st * .9, .07, { type: 'sawtooth', cutoff: 380 + 520 * ((b % 8) / 8), q: 7, decay: true });
          // driving drums
          if (b % 4 === 0 || b === 14) A.kick(t, .7);
          if (b === 4 || b === 12) A.snare(t, .28);
          if (b % 2 === 0) A.hat(t, .045, b === 6);
          if (bar % 4 === 3 && b >= 12) A.tom(t, 160 - (b - 12) * 22, .3);
          // tense stab line
          if (b % 3 === 0) A.tone(t, root + 12 + STAB[(b + bar * 5) % 16], st * 2, .04, { type: 'square', cutoff: 1600, decay: true, pan: (b % 2 ? .4 : -.4) });
          if (b === 0 && bar % 2 === 0) A.bell(root + 24 + 1, t, .03);
        }
      } },
  };
})());
