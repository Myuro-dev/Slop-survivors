# Portal zone module contract (Firefly Jar: Till Dawn: portals fork)

The game is a single-file HTML5 canvas Vampire Survivors-like. The hero (a glowing hexagon, radius 13, speed 150–250 px/s)
auto-fires weapons. During a run, portals appear. Entering one moves the hero into a **zone** for **150 seconds**: a separate
arena with its own floor art, enemies, music and a **miniboss that arrives at 45 s**. When the miniboss dies, a chest drops
and an exit opens. When the timer runs out, the hero returns to the meadow.

You write ONE zone as ONE file: `zones/<id>.js`. It is inlined into the game's IIFE.

## File format

```js
ZONES.push((() => {
  // private helpers / palettes here
  return { id: 'isaac', name: '...', /* ...fields below... */ };
})());
```

Rules:
- Plain modern JS (ES2020). No imports, no DOM, no timers, no `window`, no globals except `ZONES`, `Math`, `Path2D`.
  Everything you need comes in through the `Z` (game) and `A` (audio) arguments.
- Keep all per-enemy state on the entity object `e`. Closures may hold constants and caches only.
- Must be robust. Never throw, never produce NaN positions, and always `ctx.save()`/`ctx.restore()` around transforms.
- **Original work only.** Evoke the source game through archetypes, palette, architecture and musical style. Do not use trademarked
  character, monster or place names; use invented names. Never reproduce or closely paraphrase a copyrighted melody;
  compose original motifs *in the style*. The zone's `nod` field credits the game ("A nod to …").
- Target ~350–700 lines. Quality over quantity: a few strong, readable, animated enemy designs beat many weak ones.

## Zone fields

| field | meaning |
|---|---|
| `id` | short id (given in your brief) |
| `name` | original evocative zone name shown on the portal and banner, e.g. "The Weeping Basement" |
| `nod` | the game being honored, e.g. `'The Binding of Isaac'` |
| `portal` | `'r,g,b'` portal swirl colour |
| `bg` | `'#rrggbb'`, the base floor colour (the engine fills the screen with it before `ground`) |
| `dark` | 0–0.9 strength of the darkness vignette around the hero (meadow is .86; bright outdoor zones .25–.45) |
| `ground(Z, x0, y0, x1, y1)` | draw the floor for the visible world rect (see perf rules) |
| `ambient(Z)` | optional. Drawn AFTER the darkness, world coords, for glowing details (embers, stars, sparkles, lava glints). Max ~150 draw calls |
| `mix` | `{ kind: weight }` spawn weights over your regular foes |
| `target` | optional multiplier (default 1) on how many regular foes are alive (~60 early, ~300 late). Use 0.4–1.2 |
| `foes` | `{ kind: FoeDef }` with **3–4 regular enemy types** |
| `boss` | FoeDef for the **miniboss**, plus `name` (original, shown on the HP bar) |
| `events` | optional `[{ t: seconds, run(Z) }]` scripted moments (formations, ambushes, a tower rising…), t in 5..140 |
| `music` | `{ bpm, div, step(s, t, A) }` (see Music) |

### Performance rules for `ground`
- Called every frame for a visible rect of about 1300×900 world px (up to 2000×1200).
- Iterate grid cells (40–96 px) covering the rect. Use `Z.hash(cx, cy)` (deterministic 0..1 from integer cell coords) for variety.
  Combine hashes for more randomness: `Z.hash(cx * 7 + 3, cy * 13 - 5)`.
- Batch similar shapes into `new Path2D()` and fill or stroke once. Budget: **< 1500 canvas calls per frame**. Avoid
  per-cell gradients; per-cell `fillRect` with a few colours is fine.
- Decor only. Nothing blocks movement.

## FoeDef

```js
{
  hp, sp, dmg, xp, r,          // health, speed px/s, contact damage, xp drop value, radius px
  heavy: false,                // true = immune to knockback
  eye: '#ff6040' | false,      // engine draws two glinting eye pixels near (x, y - r*.5) after the darkness; false = none
  init(e, Z) {},               // optional, called once at spawn
  update(e, Z) {},             // optional; default behaviour is Z.chase(e). Called every sim step
  draw(e, Z, white) {},        // REQUIRED. white === true means it was just hit: draw a pure white silhouette
  death(e, Z) {},              // optional, e.g. split, explode (Z.hazard), resurrect others
}
```

Balance references (the engine scales hp up with run time; weapons deal ~10–60 per hit, many hits per second late):
- moth: hp 8, sp 62, dmg 6, xp 1, r 10 (fodder)
- wasp: hp 14, sp 110, dmg 8, xp 2, r 9 (fast)
- beetle: hp 85, sp 34, dmg 14, xp 6, r 17, heavy (tank)
- ghost: hp 50, sp 72, dmg 12, xp 4, r 13
- ranged spitters: hp 30–45, keep distance, fire every 2.5–4 s, bullet dmg 6–10, speed 150–230
- Miniboss: hp 2500–4500, r 34–56, dmg 18–28, sp 40–70, heavy. It needs 3–4 attack patterns cycling with clear
  telegraphs (use `Z.hazard` for ground warnings, or draw a wind-up in `draw` using your own fields), plus summons.
  Fair and dodgeable at 150–200 px/s.

Entity fields: `x, y, r, hp, max, sp, dmg, ang` (facing; set it), `ph` (seconds alive, engine increments it), `seed` (random 0..6
constant), `flash` (>0 just after being hit), `kx, ky` (knockback velocity that Z.move/Z.chase apply), `t1, t2, t3` (spare
timers initialised to 2, 5, 9), `mode` ('walk'), `mt` (2.5), `boss`. Add your own fields freely. Don't touch `dead, def, cds, kind`. Set `e.remove = true` to make a foe vanish without dying (no xp, no death()).

## Z API (the game)
- `Z.ctx`: canvas 2D context. Inside `ground`, `draw` and `ambient`, the world transform is already applied (draw in world px).
- `Z.now` (wall-clock seconds, for animation), `Z.t` (seconds since entering the zone), `Z.dt` (sim step, valid in update),
  `Z.W`, `Z.H` (screen size px).
- `Z.P`: the hero `{ x, y, r, face: {x, y} }`. Read only.
- `Z.TAU`, `Z.rnd(a, b)`, `Z.hash(ix, iy)`.
- `Z.dist(e)`, `Z.angTo(e)` (angle from e toward the hero).
- `Z.chase(e, sp = e.sp)`: step toward the hero (plus knockback) and set `e.ang`.
- `Z.move(e, vx, vy)`: step by a velocity (plus knockback).
- `Z.shoot(x, y, angle, speed, { r: 6, dmg: 8, life: 5, col: 'r,g,b', slow: false })`: enemy bullet. `slow` webs the hero briefly.
  Keep fewer than ~150 of your bullets alive at once.
- `Z.ring(x, y, n, speed, opts, offset)`: n bullets in a circle.
- `Z.spawn(kind, x, y)` → the new foe (any key of your `foes`). Keep summons to ≤ 10 per cast.
- `Z.hazard(x, y, { r: 70, t: .9, dmg: 10, col: 'r,g,b', foes: false })`: (`foes: true` also blasts other foes for 30, e.g. an exploding baneling); telegraphed delayed blast (the engine draws a filling warning
  circle, then it explodes and hurts only the hero).
- `Z.burst(x, y, '#hex', n, speed)` particles, `Z.shake(px)`, `Z.banner(text, '#hex', big)`.
- `Z.sfx(name)` with names: `'shoot' 'charge' 'warn' 'star' 'hit' 'kill' 'boss' 'nova' 'chain'`.
- `Z.glow('r,g,b', radius, x, y, alpha)`: soft additive-looking glow sprite. Best used in `ambient`.
- `Z.foes()` → array of living foes (read only, e.g. for auras or resurrection).

## Music: `music: { bpm, div, step(s, t, A) }`
`step` is called once per step (`div` steps per beat; 2 = eighth notes, 4 = sixteenths). `s` is the step index (0, 1, 2, …) and `t` is the
exact AudioContext start time to schedule at. Write ORIGINAL music in the style of the game's soundtrack: loop 16–64
bars using chord/progression arrays, plus a melody built from motifs (arrays of scale degrees and rhythms), a bass line and
percussion. Make it get more intense when `A.boss` is true (the miniboss is alive).

A (audio helpers; all output goes through a shared hall reverb):
- `A.mtof(m)`, `A.rnd(a, b)`, `A.boss` (bool), `A.inten` (0..1 run progress)
- `A.tone(t, midi, dur, vol, { type: 'square'|'sawtooth'|'triangle'|'sine', attack: .005, decay: false, glide: midiTarget, vib: 0..1, cutoff: Hz, q, sweep: Hz, detune: cents, pan: -1..1 })`.
  `decay: true` gives a plucky exponential fade, otherwise the note is held and released at the end. `cutoff` adds a lowpass,
  and `sweep` moves that cutoff by the end of the note.
- `A.pluck(midi, t, vel)`: a Karplus-Strong string (guitar, harp, pizzicato). vel 0..1
- `A.pad(midis, t, dur, vol, { type: 'sawtooth', cutoff: 900, q: 4, detune: 9 })`: slow-swell pad, choir or strings (3 detuned voices per note)
- `A.noise(t, dur, vol, { type: 'lowpass'|'highpass'|'bandpass', f, q, f2 })`
- `A.kick(t, vol)`, `A.snare(t, vol)`, `A.hat(t, vol, open)`, `A.tom(t, freqHz, vol)`, `A.bell(midi, t, vol)`

Loudness guide: lead .03–.07, bass .05–.09, pads .010–.025, plucks vel .3–.8, kick .5–.8, snare .2–.35, hat .03–.07,
tom .2–.45, bell .03–.07. Keep it to ~10 voices per step. Durations are in seconds (one step = 60/bpm/div s).

## Validate
`node "<scratchpad>/zones/harness.js" "<scratchpad>/zones/<id>.js"` runs your zone headlessly with a mocked canvas and audio:
150 simulated seconds, the miniboss, deaths, events and 600 music steps. It must end with `OK`. Fix every error and warning it prints.


## v2 changes (READ: these override anything above)

Player feedback on v1: "Enemies were tiny and barely visible against the background", "the maps looked a little bad, make them more distinguishable as the game they mimic", and "the rifts lagged". The engine now does the following, so design for it:

1. **The floor is cached.** `ground(Z, x0, y0, x1, y1)` is called once per 512×512 world-px chunk, with the rect padded 160 px on each side. The result is baked into a texture and reused every frame. That means:
   - `ground` can be much richer: up to ~5000 canvas calls per call, and gradients are fine here.
   - It is static. `Z.now` is meaningless inside `ground`. Anything animated on the floor (water ripples, swaying grass, flowing rivers, flickering runes) goes in the new optional hook **`under(Z)`**, which is drawn every frame right after the cached floor and before enemies, in world coords. Budget ~300 calls per frame. Draw only what's near the visible area: it's centred on `Z.P` and covers about `Z.W × Z.H` px.
   - The engine bakes a darkening veil over the floor. The optional field `dim` (0..0.4, default .15) sets its strength, so the floor recedes and actors pop.
2. **Enemies are drawn after the darkness vignette**, so they are never darkened. Each one is drawn at **1.3× scale** around (e.x, e.y): keep drawing at your normal size and the engine scales it. The engine also draws a soft contact shadow under each enemy. You must still make enemies **read instantly**:
   - Give every regular enemy and the boss a **dark outline**: stroke the main silhouette with ~2 px of near-black, or draw the silhouette once in black slightly bigger first.
   - Use **saturated, high-value accent colours** on enemies (eyes, weapons, armour trim), and keep the **floor palette muted, mid-value and low-contrast**. Never let an enemy's main colour match the floor's dominant colour.
   - Make silhouettes chunky and simple, with a big recognisable shape first and details second.
3. **Enemy bullets**: the engine now draws every bullet as a solid core in `col` with a dark outline and a white glint, plus a glow. Pick a bright, saturated `col` that contrasts with your floor.
4. **Performance budgets** (the harness warns):
   - Regular enemy `draw`: ≤ 40 canvas calls.
   - Boss `draw`: ≤ 160 calls.
   - `ambient`: ≤ 250 calls per frame.
   - No gradients created per frame in `draw`, `under` or `ambient`. Use flat colours, or `Z.glow`, which is a cached sprite.
   - No `shadowBlur`, `filter`, `getImageData` or text-heavy drawing.
5. Set `e.remove = true` to make a foe vanish without dying (no xp, no `death()` call).