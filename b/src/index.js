require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { prepare, transaction } = require('./db');
const { isValidCode, isValidUrl } = require('./validators');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/healthz', (req, res) => {
  res.json({ ok: true, version: "1.0" });
});

function randomCode(len = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: len }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

function generateUniqueCode() {
  for (let i = 0; i < 10; i++) {
    let c = randomCode(6);
    if (!prepare("SELECT 1 FROM links WHERE code=?").get(c)) return c;
  }
  throw new Error("Could not generate code");
}

app.post('/api/links', (req, res) => {
  const { target_url, code } = req.body;

  if (!isValidUrl(target_url))
    return res.status(400).json({ error: "Invalid URL" });

  let finalCode = code || generateUniqueCode();
  if (!isValidCode(finalCode))
    return res.status(400).json({ error: "Invalid code format" });

  try {
    prepare("INSERT INTO links (code, target_url) VALUES (?,?)")
      .run(finalCode, target_url);

    const row = prepare("SELECT * FROM links WHERE code=?").get(finalCode);
    res.status(201).json(row);

  } catch (e) {
    if (String(e).includes("UNIQUE")) {
      res.status(409).json({ error: "Code already exists" });
    } else {
      res.status(500).json({ error: "Server error" });
    }
  }
});

app.get('/api/links', (req, res) => {
  const rows = prepare("SELECT * FROM links ORDER BY created_at DESC").all();
  res.json(rows);
});

app.get('/api/links/:code', (req, res) => {
  const row = prepare("SELECT * FROM links WHERE code=?").get(req.params.code);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

app.delete('/api/links/:code', (req, res) => {
  const result = prepare("DELETE FROM links WHERE code=?").run(req.params.code);
  if (result.changes === 0) return res.status(404).json({ error: "Not found" });
  res.status(204).send();
});

app.get('/:code', (req, res) => {
  const code = req.params.code;

  const redirectTxn = transaction((code) => {
    const row = prepare("SELECT target_url FROM links WHERE code=?").get(code);
    if (!row) return null;

    prepare(`
      UPDATE links
      SET total_clicks = total_clicks + 1,
          last_clicked = (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      WHERE code=?
    `).run(code);

    return row.target_url;
  });

  const target = redirectTxn(code);
  if (!target) return res.status(404).send("Not found");

  res.redirect(302, target);
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
