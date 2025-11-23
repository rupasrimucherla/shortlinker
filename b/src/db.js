const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_DIR = process.env.SQLITE_DIR || path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DB_DIR, 'b.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_FILE);

function runMigrations() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  for (const f of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, f), 'utf8');
    db.exec(sql);
  }
}
runMigrations();

module.exports = {
  db,
  prepare: (sql) => db.prepare(sql),
  transaction: (fn) => db.transaction(fn)
};
