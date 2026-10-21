-- Till Dawn leaderboard: one row per submitted run.
CREATE TABLE IF NOT EXISTS runs (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT NOT NULL,
  version   TEXT NOT NULL,
  banished  INTEGER NOT NULL,        -- 1 if the Eclipse Moth was banished
  banish_t  REAL,                    -- seconds to banish (NULL if not banished)
  dmg       INTEGER NOT NULL,
  kills     INTEGER NOT NULL,
  lv        INTEGER NOT NULL,
  survived  REAL NOT NULL,           -- dawn clock at the end (600 = dawn)
  clock     REAL NOT NULL,           -- in-game seconds including rifts
  rifts     INTEGER NOT NULL,
  relic     TEXT,
  build     TEXT,                    -- JSON: weapons [lv, evolved] and charms
  created   INTEGER NOT NULL         -- unix ms
);
CREATE INDEX IF NOT EXISTS runs_banish ON runs(version, banished, banish_t);
CREATE INDEX IF NOT EXISTS runs_dmg    ON runs(version, dmg);
CREATE INDEX IF NOT EXISTS runs_kills  ON runs(version, kills);
CREATE INDEX IF NOT EXISTS runs_lv     ON runs(version, lv);
CREATE INDEX IF NOT EXISTS runs_name   ON runs(version, name);
