# Till Dawn: Rifts

A single-file browser game in the spirit of Vampire Survivors. You are **Hexel**, a little hexagon of living light. Every moth in the night wants you, and you have to survive ten minutes until sunrise.

**Play:** download `index.html` and open it in any modern browser (Chrome, Edge, Firefox, Safari). There's nothing to install and no server. Everything (art, music and sound) is generated live in code. It works fully offline: nothing is fetched from the internet. The only exception is the optional online leaderboard: when you press "Submit score", your chosen name and that run's stats are sent to the leaderboard server (no account or email), and the Leaderboards panel loads the top scores. Without it, your best runs are kept on your device.

## How to play

- Move with **WASD** or the **arrow keys**, or drag anywhere on the screen (touch works too). Weapons fire on their own.
- Collect the glow moths leave behind to level up, and pick 1 of 3 upgrades each time (reroll with **R**, keys **1–3**/**4** to choose).
- **Esc** pauses. **M** and **N** toggle music and sound, and volume sliders are on the title and pause screens.
- A weapon at level 6 plus its paired charm **evolves** when you open a boss chest.
- Three bosses hunt you during the night. At dawn a final shadow rises. Banish it within 60 seconds for the true ending.

## Rifts

Portals tear open during the night. Step through into one of seventeen strange worlds, each a loving homage to a game, with its own floor, enemies, guardian and soundtrack. Can you tell which game each one honors? The dawn clock stops while you're inside. Beat the rift's guardian to win its **relic**, a unique weapon that grows stronger with every guardian you beat and awakens into a **MEGA** form at four.

Want a sneak peek? Open `index.html#tour` for a self-running preview of the meadow and every rift with its music (it names the games).

## Repository layout

| Path | What it is |
|---|---|
| `index.html` | The whole game. Ship or open just this file. |
| `zones/*.js` | Source of each rift zone (floor art, enemies, guardian, events, music). They're also inlined into `index.html`. |
| `tools/inline-zones.js` | Copies `zones/*.js` into `index.html` after you edit a zone: `node tools/inline-zones.js` |
| `tools/zone-contract.md` | The rules a zone module follows (the `Z` game API, the `A` music API, budgets). |
| `tools/zone-harness.js` | Headless checker for a zone: `node tools/zone-harness.js zones/<id>.js` should print `OK`. |
| `tools/zone-example.js` | A minimal zone to start from. |
| `CLAUDE.md` | Detailed developer notes on the design, balance numbers and code map. |

Developer helpers: `index.html#debug` exposes a `window.fj` object (autopilot, time warp, spawn helpers, `fj.rift(id)` to jump into a rift).

## Credits

Made with Claude. All names, art and music in the game are original; the rifts are fan homages, and the project is not affiliated with or endorsed by the makers of the games that inspired them.

**Fonts:** [Grandstander](https://fonts.google.com/specimen/Grandstander) and [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) are embedded in `index.html`. Both are licensed under the [SIL Open Font License 1.1](https://openfontlicense.org).
