import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, "conf.db"));
db.pragma("foreign_keys = ON");

// Создать таблицу users
db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  login TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  fio TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);`);

// Создать таблицу rooms
db.exec(`CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);`);

// Создать таблицу requests
db.exec(`CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  room_id INTEGER NOT NULL,
  date_start TEXT NOT NULL,
  payment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Новая',
  review TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT
);`);

// Наполнить БД тестовыми данными (users)
const count = db.prepare("SELECT COUNT(*) AS c FROM users").get().c;
if (count === 0) {
  const stmt = db.prepare(
    `INSERT INTO users (login, password, fio, phone, email) VALUES (?, ?, ?, ?, ?)`,
  );
  stmt.run(
    "ivan",
    bcrypt.hashSync("demo", 10),
    "Иванов Иван",
    "8(999)123-45-67",
    "ivan@example.com",
  );
  stmt.run(
    "petr",
    bcrypt.hashSync("demo", 10),
    "Петров Пётр",
    "8(999)123-45-68",
    "petr@example.com",
  );
  stmt.run(
    "anna",
    bcrypt.hashSync("demo", 10),
    "Анна Сидорова",
    "8(999)123-45-69",
    "anna@example.com",
  );
  stmt.run(
    "Conf2027",
    bcrypt.hashSync("Demo77", 10),
    "Администратор",
    "8(999)000-00-00",
    "admin@conf.ru",
  );
  console.log("Тестовые пользователи добавлены");
}

// Наполнить БД тестовыми данными (rooms)
const count1 = db.prepare("SELECT COUNT(*) AS c FROM rooms").get().c;
if (count1 === 0) {
  const stmt = db.prepare(
    `INSERT INTO rooms (name, type, capacity) VALUES (?, ?, ?)`,
  );
  stmt.run("Аудитория №1", "Аудитория", 100);
  stmt.run("Аудитория №2", "Аудитория", 50);
  stmt.run("Коворкинг «Точка»", "Коворкинг", 4);
  stmt.run("Кинозал «Октябрь»", "Кинозал", 80);
  console.log("Тестовые комнаты добавлены");
}

// Наполнить БД тестовыми данными (requests)
const count2 = db.prepare("SELECT COUNT(*) AS c FROM requests").get().c;
if (count2 === 0) {
  const stmtRequest = db.prepare(
    `INSERT INTO requests (user_id, room_id, date_start, payment) VALUES (?, ?, ?, ?)`,
  );
  stmtRequest.run(1, 1, "2027-03-15", "При очном посещении");
  stmtRequest.run(1, 3, "2027-03-20", "Перевод по СБП");
  stmtRequest.run(2, 4, "2027-04-01", "При очном посещении");
  console.log("Тестовые заявки добавлены");
}

class User {
  constructor() {
    this.table = "users";
  }

  findById(id) {
    return db.prepare(`SELECT * FROM ${this.table} WHERE id = ?`).get(id);
  }

  findByLogin(login) {
    return db.prepare(`SELECT * FROM ${this.table} WHERE login = ?`).get(login);
  }

  findAll() {
    return db.prepare(`SELECT * FROM ${this.table}`).all();
  }

  count() {
    return db.prepare(`SELECT COUNT(*) AS c FROM ${this.table}`).get().c;
  }

  exists(login) {
    const user = this.findByLogin(login);
    return user !== undefined;
  }

  create({ login, password, fio, phone, email }) {
    const hash = bcrypt.hashSync(password, 10);
    const result = db
      .prepare(
        `INSERT INTO ${this.table} (login, password, fio, phone, email)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        String(login).trim(),
        hash,
        String(fio).trim(),
        String(phone).trim(),
        String(email).trim(),
      );

    return this.findById(result.lastInsertRowid);
  }
}

class Room {
  constructor() {
    this.table = "rooms";
  }

  findAll() {
    return db.prepare(`SELECT * FROM ${this.table} ORDER BY type, name`).all();
  }

  findById(id) {
    return db.prepare(`SELECT * FROM ${this.table} WHERE id = ?`).get(id);
  }

  findByType(type) {
    return db
      .prepare(`SELECT * FROM ${this.table} WHERE type = ? ORDER BY name`)
      .all(type);
  }

  count() {
    return db.prepare(`SELECT COUNT(*) AS c FROM ${this.table}`).get().c;
  }
}

class Request {
  constructor() {
    this.table = "requests";
  }

  create({ userId, roomId, dateStart, payment }) {
    const r = db
      .prepare(
        `
      INSERT INTO ${this.table} (user_id, room_id, date_start, payment)
      VALUES (?, ?, ?, ?)
      `,
      )
      .run(userId, roomId, dateStart, payment);
    return this.findById(r.lastInsertRowid);
  }

  findById(id) {
    return db.prepare(`SELECT * FROM ${this.table} WHERE id = ?`).get(id);
  }

  findByUser(userId) {
    return db
      .prepare(
        `SELECT r.*, rooms.name AS room_name, rooms.type AS room_type
       FROM ${this.table} r
       JOIN rooms ON r.room_id = rooms.id
       WHERE r.user_id = ?
       ORDER BY r.id DESC`,
      )
      .all(userId);
  }

  findAllDetailed() {
    return db
      .prepare(
        `SELECT r.*, u.fio AS user_fio, u.login AS user_login,
                rooms.name AS room_name, rooms.type AS room_type
       FROM ${this.table} r
       JOIN users u ON r.user_id = u.id
       JOIN rooms ON r.room_id = rooms.id
       ORDER BY r.id DESC`,
      )
      .all();
  }

  count() {
    return db.prepare(`SELECT COUNT(*) AS c FROM ${this.table}`).get().c;
  }

  updateStatus(id, status) {
    const result = db
      .prepare(`UPDATE ${this.table} SET status = ? WHERE id = ?`)
      .run(status, id);
    return result.changes > 0;
  }
}

export const Users = new User();
export const Rooms = new Room();
export const Requests = new Request();
export default db;
