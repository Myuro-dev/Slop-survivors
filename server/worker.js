// Till Dawn leaderboard API (Cloudflare Worker + D1).
//   POST   /runs                              submit a finished run   → { id, ranks: { board: rank } }
//   GET    /top?board=…&version=…             top 50 players (each player's best run)
//   GET    /me?board=…&version=…&name=…       that player's best run and rank
//   DELETE /runs/:id   (header X-Admin-Key)   remove an entry
// Boards: banish (fastest Eclipse Moth banish, lower is better), damage, kills, level.
// No anti-cheat yet: the server only rejects malformed data.

const BOARDS = {
  banish: { col: 'banish_t', low: true, where: 'banished = 1' },
  damage: { col: 'dmg' },
  kills: { col: 'kills' },
  level: { col: 'lv' },
};
const BAD_WORDS = ['fuck', 'shit', 'cunt', 'nigg', 'fag', 'rape', 'hitler', 'nazi'];

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const cors = {
      'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : (allowed[0] || '*'),
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
      'Vary': 'Origin',
    };
    const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

    try {
      if (url.pathname === '/runs' && req.method === 'POST') {
        const run = await req.json().catch(() => null);
        const err = validate(run);
        if (err) return json({ error: err }, 400);
        const name = run.name.trim().replace(/\s+/g, ' ');
        const res = await env.DB.prepare(
          `INSERT INTO runs (name, version, banished, banish_t, dmg, kills, lv, survived, clock, rifts, relic, build, created)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(name, run.version, run.banished ? 1 : 0, run.banished ? run.banish_t : null, Math.round(run.dmg), Math.round(run.kills),
          Math.round(run.lv), run.survived, run.clock, Math.round(run.rifts), run.relic || null, run.build || null, Date.now()).run();
        // Report where the player's best now stands on each board (this run may or may not be their best).
        const ranks = {};
        for (const [id, b] of Object.entries(BOARDS)) {
          if (id === 'banish' && !run.banished) continue;
          const best = await env.DB.prepare(bestPerPlayer(b) + ` AND lower(name) = lower(?)`).bind(run.version, name).first();
          if (best) ranks[id] = await rankOf(env, b, run.version, best[b.col]);
        }
        return json({ id: res.meta.last_row_id, ranks });
      }

      if ((url.pathname === '/top' || url.pathname === '/me') && req.method === 'GET') {
        const b = BOARDS[url.searchParams.get('board')];
        const version = url.searchParams.get('version') || '';
        if (!b || !version) return json({ error: 'board and version are required' }, 400);
        if (url.pathname === '/top') {
          const { results } = await env.DB.prepare(bestPerPlayer(b) + ` ORDER BY ${b.col} ${b.low ? 'ASC' : 'DESC'}, created ASC LIMIT 50`).bind(version).all();
          return json({ rows: results });
        }
        const name = (url.searchParams.get('name') || '').trim();
        const best = await env.DB.prepare(bestPerPlayer(b) + ` AND lower(name) = lower(?)`).bind(version, name).first();
        if (!best) return json({ best: null });
        return json({ best, rank: await rankOf(env, b, version, best[b.col]) });
      }

      const del = url.pathname.match(/^\/runs\/(\d+)$/);
      if (del && req.method === 'DELETE') {
        if (!env.ADMIN_KEY || req.headers.get('X-Admin-Key') !== env.ADMIN_KEY) return json({ error: 'forbidden' }, 403);
        await env.DB.prepare('DELETE FROM runs WHERE id = ?').bind(+del[1]).run();
        return json({ ok: true });
      }

      return json({ error: 'not found' }, 404);
    } catch (e) {
      return json({ error: 'server error' }, 500);
    }
  },
};

// Each player's best run on a board (one row per name, case-insensitive).
function bestPerPlayer(b) {
  return `SELECT id, name, ${b.col}, banished, banish_t, dmg, kills, lv, survived, rifts, relic, created FROM (
            SELECT *, ROW_NUMBER() OVER (PARTITION BY lower(name) ORDER BY ${b.col} ${b.low ? 'ASC' : 'DESC'}, created ASC) AS rn
            FROM runs WHERE version = ? ${b.where ? 'AND ' + b.where : ''}
          ) WHERE rn = 1`;
}
// 1 + the number of players whose best beats this value.
async function rankOf(env, b, version, v) {
  const agg = b.low ? 'MIN' : 'MAX', cmp = b.low ? '<' : '>';
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM (SELECT ${agg}(${b.col}) AS best FROM runs WHERE version = ? ${b.where ? 'AND ' + b.where : ''} GROUP BY lower(name)) WHERE best ${cmp} ?`
  ).bind(version, v).first();
  return (row ? row.n : 0) + 1;
}

function validate(r) {
  if (!r || typeof r !== 'object') return 'bad request';
  if (typeof r.name !== 'string') return 'name is required';
  const name = r.name.trim().replace(/\s+/g, ' ');
  if (!/^[A-Za-z0-9 _-]{3,16}$/.test(name)) return 'names are 3-16 letters, digits, spaces, _ or -';
  const low = name.toLowerCase().replace(/[^a-z]/g, '');
  if (BAD_WORDS.some(w => low.includes(w))) return 'please pick another name';
  if (typeof r.version !== 'string' || !r.version || r.version.length > 16) return 'bad version';
  const nums = ['dmg', 'kills', 'lv', 'survived', 'clock', 'rifts'];
  for (const k of nums) if (typeof r[k] !== 'number' || !Number.isFinite(r[k]) || r[k] < 0) return 'bad ' + k;
  if (typeof r.banished !== 'boolean') return 'bad banished';
  if (r.banished && (typeof r.banish_t !== 'number' || !Number.isFinite(r.banish_t) || r.banish_t <= 0)) return 'bad banish_t';
  if (r.relic != null && (typeof r.relic !== 'string' || r.relic.length > 16)) return 'bad relic';
  if (r.build != null && (typeof r.build !== 'string' || r.build.length > 2000)) return 'bad build';
  return null;
}
