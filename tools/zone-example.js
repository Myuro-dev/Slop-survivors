// Minimal reference zone showing the contract. Real zones should be far richer than this.
ZONES.push((() => {
  const SCALE = [0, 2, 3, 5, 7, 8, 10]; // natural minor degrees
  return {
    id: 'example', name: 'The Grey Hollow', nod: 'Example Game', portal: '160,160,200', bg: '#14161c', dark: .7,
    ground(Z, x0, y0, x1, y1) {
      const C = 64, stones = new Path2D();
      for (let cy = Math.floor(y0 / C); cy <= Math.floor(y1 / C); cy++)
        for (let cx = Math.floor(x0 / C); cx <= Math.floor(x1 / C); cx++) {
          const h = Z.hash(cx, cy);
          if (h < .3) { const x = cx * C + h * 40, y = cy * C + Z.hash(cy, cx) * 40; stones.moveTo(x + 6, y); stones.arc(x, y, 6, 0, Z.TAU); }
        }
      Z.ctx.fillStyle = '#22262e'; Z.ctx.fill(stones);
    },
    mix: { blob: 3, spitter: 1, brute: 1 },
    foes: {
      blob: { hp: 10, sp: 60, dmg: 6, xp: 1, r: 10, eye: '#ff8060',
        draw(e, Z, white) { const c = Z.ctx; c.fillStyle = white ? '#fff' : '#5a6a7a'; c.beginPath(); c.arc(e.x, e.y, e.r * (1 + Math.sin(e.ph * 6) * .08), 0, Z.TAU); c.fill(); } },
      spitter: { hp: 35, sp: 50, dmg: 8, xp: 3, r: 12, eye: '#80ff80',
        update(e, Z) {
          const d = Z.dist(e), a = Z.angTo(e);
          Z.move(e, Math.cos(a) * e.sp * (d > 220 ? 1 : -0.6), Math.sin(a) * e.sp * (d > 220 ? 1 : -0.6)); e.ang = a;
          if ((e.t1 -= Z.dt) <= 0) { e.t1 = 3; Z.shoot(e.x, e.y, a, 180, { col: '120,255,120', dmg: 7 }); }
        },
        draw(e, Z, white) { const c = Z.ctx; c.fillStyle = white ? '#fff' : '#3a6a3a'; c.beginPath(); c.arc(e.x, e.y, e.r, 0, Z.TAU); c.fill(); } },
      brute: { hp: 90, sp: 34, dmg: 14, xp: 6, r: 17, heavy: true, eye: '#ff4040',
        draw(e, Z, white) { const c = Z.ctx; c.save(); c.translate(e.x, e.y); c.rotate(e.ang); c.fillStyle = white ? '#fff' : '#4a3a5a'; c.fillRect(-e.r, -e.r * .7, e.r * 2, e.r * 1.4); c.restore(); } },
    },
    boss: { name: 'The Grey Warden', hp: 3000, sp: 50, dmg: 22, xp: 0, r: 40, heavy: true, eye: '#ff2040',
      update(e, Z) {
        Z.chase(e);
        if ((e.t1 -= Z.dt) <= 0) { e.t1 = 3; Z.ring(e.x, e.y, 12, 150, { col: '200,200,255' }, e.ph); Z.sfx('shoot'); }
        if ((e.t2 -= Z.dt) <= 0) { e.t2 = 6; for (let i = 0; i < 3; i++) Z.hazard(Z.P.x + Z.rnd(-80, 80), Z.P.y + Z.rnd(-80, 80), { r: 60 }); }
      },
      draw(e, Z, white) { const c = Z.ctx; c.fillStyle = white ? '#fff' : '#6a6a8a'; c.beginPath(); c.arc(e.x, e.y, e.r, 0, Z.TAU); c.fill(); } },
    music: { bpm: 90, div: 2,
      step(s, t, A) {
        const bar = Math.floor(s / 8), b = s % 8, root = 50 + [0, 5, 3, 7][bar % 4];
        if (b === 0) { A.pad([root + 12, root + 15, root + 19], t, 60 / 90 * 4, .015); A.tone(t, root - 12, 1.2, .07, { type: 'triangle' }); }
        if (b % 2 === 0) A.pluck(root + 12 + SCALE[(s * 3) % 7], t, .5);
        if (A.boss && b % 4 === 0) A.kick(t, .6);
      } },
  };
})());
