require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-troque-em-producao';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Horários de atendimento: de hora em hora, das 09:00 às 17:00
const SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
const ADMIN_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);

// ---------- Banco de dados (SQLite, arquivo petshop.db) ----------
const db = new Database(path.join(__dirname, 'petshop.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL CHECK (price >= 0),
  duration_min INTEGER NOT NULL DEFAULT 60
);
CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id INTEGER NOT NULL REFERENCES services(id),
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  pet_name TEXT NOT NULL,
  pet_type TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'agendado',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

// Dados iniciais de exemplo
if (db.prepare('SELECT COUNT(*) AS n FROM services').get().n === 0) {
  const ins = db.prepare('INSERT INTO services (name, price, duration_min) VALUES (?, ?, ?)');
  ins.run('Banho', 50, 60);
  ins.run('Tosa', 70, 60);
  ins.run('Banho e Tosa', 110, 60);
  ins.run('Consulta de adestramento', 120, 60);
}
if (db.prepare('SELECT COUNT(*) AS n FROM products').get().n === 0) {
  // image_url aponta para as imagens que já existem na pasta imagens/ do site
  const ins = db.prepare('INSERT INTO products (name, category, price, stock, description, image_url) VALUES (?, ?, ?, ?, ?, ?)');
  ins.run('Ração Premium Cães Adultos 10kg', 'racao', 189.9, 20, 'Ração completa para cães adultos.', 'imagens/cachorroracao.png');
  ins.run('Ração Premium Gatos 3kg', 'racao', 94.9, 25, 'Ração completa para gatos adultos.', 'imagens/gatoracao.png');
  ins.run('Areia Higiênica para Gatos 4kg', 'higiene', 24.9, 40, 'Areia que controla odores.', 'imagens/areia.png');
  ins.run('Kit Acessórios para Passeio', 'acessorios', 59.9, 15, 'Coleira, guia e peitoral.', 'imagens/acessorios.png');
  ins.run('Vermífugo e Medicamentos', 'saude', 39.9, 30, 'Consulte sempre um veterinário.', 'imagens/medicina.png');
}

// ---------- Utilidades ----------
const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

const isStr = (v, min = 1, max = 200) => typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const isId = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Não autorizado. Faça login.' });
  }
}

function freeSlots(date) {
  const taken = db
    .prepare("SELECT time FROM appointments WHERE date = ? AND status != 'cancelado'")
    .all(date)
    .map((r) => r.time);
  return SLOTS.filter((s) => !taken.includes(s));
}

// ---------- Login do administrador ----------
// Limite de tentativas erradas: 10 a cada 15 minutos por IP (protege contra quem tenta adivinhar a senha)
const tentativas = new Map();
const JANELA_MS = 15 * 60 * 1000;

function bloqueado(ip) {
  const t = tentativas.get(ip);
  return t && t.ate > Date.now() && t.n >= 10;
}
function registrarFalha(ip) {
  let t = tentativas.get(ip);
  if (!t || t.ate <= Date.now()) t = { n: 0, ate: Date.now() + JANELA_MS };
  t.n += 1;
  tentativas.set(ip, t);
}

app.post('/api/auth/login', (req, res) => {
  if (bloqueado(req.ip)) {
    return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' });
  }
  const { username, password } = req.body || {};
  if (username !== ADMIN_USER || !bcrypt.compareSync(String(password || ''), ADMIN_HASH)) {
    registrarFalha(req.ip);
    return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
  }
  tentativas.delete(req.ip);
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

// ---------- Produtos ----------
app.get('/api/products', (req, res) => {
  const { category, search } = req.query;
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (search) { sql += ' AND name LIKE ?'; params.push(`%${search}%`); }
  sql += ' ORDER BY name';
  res.json(db.prepare(sql).all(...params));
});

app.get('/api/products/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Produto não encontrado.' });
  res.json(row);
});

function validateProduct(b, partial = false) {
  if ((!partial || b.name !== undefined) && !isStr(b.name, 2)) return 'Nome inválido.';
  if ((!partial || b.category !== undefined) && !isStr(b.category, 2, 50)) return 'Categoria inválida.';
  if ((!partial || b.price !== undefined) && !(Number(b.price) >= 0)) return 'Preço inválido.';
  if ((!partial || b.stock !== undefined) && !(Number.isInteger(Number(b.stock)) && Number(b.stock) >= 0)) return 'Estoque inválido.';
  return null;
}

app.post('/api/products', auth, (req, res) => {
  const b = req.body || {};
  const err = validateProduct(b);
  if (err) return res.status(400).json({ error: err });
  const info = db
    .prepare('INSERT INTO products (name, category, price, stock, description, image_url) VALUES (?, ?, ?, ?, ?, ?)')
    .run(b.name.trim(), b.category.trim(), Number(b.price), Number(b.stock), b.description || '', b.image_url || '');
  res.status(201).json(db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid));
});

app.put('/api/products/:id', auth, (req, res) => {
  const cur = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Produto não encontrado.' });
  const b = req.body || {};
  const err = validateProduct(b, true);
  if (err) return res.status(400).json({ error: err });
  const n = { ...cur, ...b };
  db.prepare('UPDATE products SET name=?, category=?, price=?, stock=?, description=?, image_url=? WHERE id=?')
    .run(String(n.name).trim(), String(n.category).trim(), Number(n.price), Number(n.stock), n.description, n.image_url, cur.id);
  res.json(db.prepare('SELECT * FROM products WHERE id = ?').get(cur.id));
});

app.delete('/api/products/:id', auth, (req, res) => {
  const info = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Produto não encontrado.' });
  res.status(204).end();
});

// ---------- Serviços ----------
app.get('/api/services', (_req, res) => {
  res.json(db.prepare('SELECT * FROM services ORDER BY name').all());
});

app.post('/api/services', auth, (req, res) => {
  const { name, price, duration_min = 60 } = req.body || {};
  if (!isStr(name, 2) || !(Number(price) >= 0)) return res.status(400).json({ error: 'Dados do serviço inválidos.' });
  const info = db.prepare('INSERT INTO services (name, price, duration_min) VALUES (?, ?, ?)')
    .run(name.trim(), Number(price), Number(duration_min));
  res.status(201).json(db.prepare('SELECT * FROM services WHERE id = ?').get(info.lastInsertRowid));
});

app.put('/api/services/:id', auth, (req, res) => {
  const cur = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Serviço não encontrado.' });
  const n = { ...cur, ...(req.body || {}) };
  if (!isStr(n.name, 2) || !(Number(n.price) >= 0) || !(Number(n.duration_min) > 0))
    return res.status(400).json({ error: 'Dados do serviço inválidos.' });
  db.prepare('UPDATE services SET name = ?, price = ?, duration_min = ? WHERE id = ?')
    .run(String(n.name).trim(), Number(n.price), Number(n.duration_min), cur.id);
  res.json(db.prepare('SELECT * FROM services WHERE id = ?').get(cur.id));
});

app.delete('/api/services/:id', auth, (req, res) => {
  try {
    const info = db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
    if (!info.changes) return res.status(404).json({ error: 'Serviço não encontrado.' });
    res.status(204).end();
  } catch {
    res.status(409).json({ error: 'Serviço possui agendamentos e não pode ser removido.' });
  }
});

// ---------- Agendamentos ----------
// Horários livres de um dia: GET /api/appointments/available?date=2026-11-05
app.get('/api/appointments/available', (req, res) => {
  if (!isDate(req.query.date)) return res.status(400).json({ error: 'Use date=AAAA-MM-DD.' });
  res.json({ date: req.query.date, available: freeSlots(req.query.date) });
});

// Cliente cria um agendamento (público)
app.post('/api/appointments', (req, res) => {
  const b = req.body || {};
  if (!isId(b.service_id) || !db.prepare('SELECT 1 FROM services WHERE id = ?').get(b.service_id))
    return res.status(400).json({ error: 'Serviço inválido.' });
  if (!isStr(b.owner_name, 2, 100) || !isStr(b.pet_name, 1, 100) || !isStr(b.pet_type, 2, 50))
    return res.status(400).json({ error: 'Preencha nome do tutor, nome e tipo do pet.' });
  if (!/^[\d\s()+-]{8,20}$/.test(b.phone || '')) return res.status(400).json({ error: 'Telefone inválido.' });
  if (!isDate(b.date) || !SLOTS.includes(b.time)) return res.status(400).json({ error: 'Data ou horário inválido.' });
  if (new Date(`${b.date}T${b.time}:00`) < new Date()) return res.status(400).json({ error: 'Esse horário já passou.' });
  if (!freeSlots(b.date).includes(b.time)) return res.status(409).json({ error: 'Horário indisponível. Escolha outro.' });

  const info = db.prepare(`INSERT INTO appointments
    (service_id, owner_name, phone, pet_name, pet_type, date, time, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(b.service_id, b.owner_name.trim(), b.phone.trim(), b.pet_name.trim(), b.pet_type.trim(), b.date, b.time, b.notes || '');
  res.status(201).json({ id: info.lastInsertRowid, message: 'Agendamento realizado!' });
});

// Admin: lista e atualiza status
app.get('/api/appointments', auth, (req, res) => {
  let sql = `SELECT a.*, s.name AS service_name FROM appointments a
             JOIN services s ON s.id = a.service_id WHERE 1=1`;
  const params = [];
  if (req.query.date) { sql += ' AND a.date = ?'; params.push(req.query.date); }
  if (req.query.status) { sql += ' AND a.status = ?'; params.push(req.query.status); }
  sql += ' ORDER BY a.date, a.time';
  res.json(db.prepare(sql).all(...params));
});

app.patch('/api/appointments/:id/status', auth, (req, res) => {
  const { status } = req.body || {};
  if (!['agendado', 'concluido', 'cancelado'].includes(status))
    return res.status(400).json({ error: 'Status deve ser agendado, concluido ou cancelado.' });
  const info = db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Agendamento não encontrado.' });
  res.json({ id: Number(req.params.id), status });
});

// ---------- Contato ----------
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body || {};
  if (!isStr(name, 2, 100) || !/^\S+@\S+\.\S+$/.test(email || '') || !isStr(message, 5, 2000))
    return res.status(400).json({ error: 'Preencha nome, e-mail válido e mensagem.' });
  db.prepare('INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)').run(name.trim(), email.trim(), message.trim());
  res.status(201).json({ message: 'Mensagem enviada! Responderemos em breve.' });
});

app.get('/api/contact', auth, (_req, res) => {
  res.json(db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all());
});

// ---------- Front-end estático e tratamento de erros ----------
app.use(express.static(path.join(__dirname, 'public'))); // coloque seu site na pasta "public"

app.use('/api', (_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

if (ADMIN_PASSWORD === 'admin123' || !process.env.JWT_SECRET) {
  console.warn('\n[ATENÇÃO] Defina ADMIN_PASSWORD e JWT_SECRET no arquivo .env antes de colocar o site no ar.\n');
}

app.listen(PORT, () => console.log(`Petshop rodando em http://localhost:${PORT}`));
