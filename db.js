const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'notenest.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

let db = null;

// ─── Save database to disk ─────────────────────────────
function saveToDisk() {
    if (!db) return;
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
}

// ─── Auto-save wrapper: run a write query and persist ───
function runWrite(sql, params = []) {
    db.run(sql, params);
    saveToDisk();
}

// ─── Query helpers matching better-sqlite3-style API ────
function queryGet(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    let result = null;
    if (stmt.step()) {
        result = stmt.getAsObject();
    }
    stmt.free();
    return result;
}

function queryAll(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

function queryRun(sql, params = []) {
    db.run(sql, params);
    saveToDisk();
}

// ─── Transaction helper ────────────────────────────────
function transaction(fn) {
    db.run('BEGIN TRANSACTION');
    try {
        fn();
        db.run('COMMIT');
        saveToDisk();
    } catch (err) {
        db.run('ROLLBACK');
        throw err;
    }
}

// ─── Initialize database ───────────────────────────────
async function initDatabase() {
    const SQL = await initSqlJs();

    // Load existing database or create new one
    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
        console.log('[DB] Loaded existing database:', DB_PATH);
    } else {
        db = new SQL.Database();
        console.log('[DB] Created new database:', DB_PATH);
    }

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Create tables
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user'
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT DEFAULT 'Other',
            tags TEXT DEFAULT '[]',
            color TEXT DEFAULT 'default',
            pinCode TEXT,
            targetDate TEXT,
            status TEXT DEFAULT 'Todo',
            pinned INTEGER DEFAULT 0,
            archived INTEGER DEFAULT 0,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    `);

    // Create indexes
    db.run('CREATE INDEX IF NOT EXISTS idx_notes_userId ON notes(userId)');
    db.run('CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category)');
    db.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');

    // Seed default admin
    const adminExists = queryGet('SELECT id FROM users WHERE username = ?', ['admin']);
    if (!adminExists) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        queryRun('INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)',
            ['1', 'admin', hashedPassword, 'admin']);
        console.log('[DB] Default admin account created (admin / admin123)');
    }

    // Seed default categories
    const catCount = queryGet('SELECT COUNT(*) as count FROM categories');
    if (catCount.count === 0) {
        const defaultCategories = ['Study', 'Programming', 'Personal', 'Work', 'Projects', 'Other'];
        transaction(() => {
            for (const cat of defaultCategories) {
                db.run('INSERT OR IGNORE INTO categories (name) VALUES (?)', [cat]);
            }
        });
        console.log('[DB] Default categories seeded');
    }

    saveToDisk();
    console.log('[DB] SQLite database ready');

    return { queryGet, queryAll, queryRun, transaction, saveToDisk };
}

module.exports = { initDatabase };
