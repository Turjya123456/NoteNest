const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { initDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'notenest-super-secret-key-123';

app.use(express.json());
app.use(cookieParser());

// Database query helpers — set after init
let q = null;

// ─── Helper: convert DB row to API note format ──────────
function dbNoteToApi(row) {
    if (!row) return null;
    return {
        id: row.id,
        userId: row.userId,
        title: row.title,
        content: row.content,
        category: row.category,
        tags: JSON.parse(row.tags || '[]'),
        color: row.color || 'default',
        pinCode: row.pinCode || null,
        targetDate: row.targetDate || null,
        status: row.status || 'Todo',
        pinned: !!row.pinned,
        archived: !!row.archived,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
    };
}

// ─── Authentication Middlewares ──────────────────────────
const authenticateUser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Access denied' });

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

const authenticateAdmin = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Access denied' });

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        if (verified.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied, admin only' });
        }
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

const authenticatePage = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect('/login');
    }
    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.redirect('/login');
    }
};

const authenticateAdminPage = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect('/login');
    }
    try {
        const verified = jwt.verify(token, JWT_SECRET);
        if (verified.role !== 'admin') {
            return res.redirect('/');
        }
        req.user = verified;
        next();
    } catch (error) {
        res.redirect('/login');
    }
};

// ─── Page Routes ────────────────────────────────────────
app.get('/', authenticatePage, (req, res) => {
    if (req.user.role === 'admin') {
        return res.redirect('/admin');
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/index.html', (req, res) => res.redirect('/'));

app.get('/admin', authenticateAdminPage, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin.html', (req, res) => res.redirect('/admin'));

app.get('/login', (req, res) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const verified = jwt.verify(token, JWT_SECRET);
            if (verified.role === 'admin') return res.redirect('/admin');
            return res.redirect('/');
        } catch (e) {
            // Token invalid, proceed to login
        }
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/login.html', (req, res) => res.redirect('/login'));

// Static files (must be after our manual page routes to prevent bypass)
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// ─── Auth APIs ──────────────────────────────────────────

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        let { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        username = username.trim();
        password = password.trim();

        if (username.length < 3 || username.length > 30) {
            return res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            return res.status(400).json({ error: 'Username can only contain letters, numbers, hyphens and underscores' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        const existing = q.queryGet('SELECT id FROM users WHERE LOWER(username) = LOWER(?)', [username]);
        if (existing) {
            return res.status(400).json({ error: 'Username already taken. Please choose another one.' });
        }

        const userId = Date.now().toString();
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        q.queryRun('INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)',
            [userId, username, hashedPassword, 'user']);

        // Seed welcome note (separate so user creation succeeds even if this fails)
        try {
            const noteId = (Date.now() + 1).toString();
            const now = new Date().toISOString();
            q.queryRun(
                `INSERT INTO notes (id, userId, title, content, category, tags, color, pinCode, targetDate, status, pinned, archived, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    noteId, userId,
                    'Welcome to NoteNest! 🎉',
                    `### Welcome to your personal notebook, **${username}**!\n\nHere are some tips to get started:\n\n- [x] Create an account\n- [ ] Write your first note\n- [ ] Explore the **Calendar** and **Kanban** views\n- [ ] Try **Voice Dictation** or **Focus Mode**\n- [ ] Press \`Ctrl + K\` to open the **Command Palette**\n\nEnjoy organized, private note taking!`,
                    'Personal',
                    JSON.stringify(['welcome', 'guide']),
                    'accent-purple',
                    null, null, 'Todo',
                    1, 0, now, now
                ]
            );
        } catch (noteErr) {
            console.error('Failed to seed welcome note:', noteErr);
        }

        const token = jwt.sign({ id: userId, username, role: 'user' }, JWT_SECRET, { expiresIn: '24h' });
        const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
        const cookieOptions = {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: isSecure ? 'none' : 'lax',
            secure: isSecure
        };
        res.cookie('token', token, cookieOptions);
        res.status(201).json({ message: 'Account created successfully', role: 'user', username });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

        const user = q.queryGet('SELECT * FROM users WHERE username = ?', [username]);
        if (!user) return res.status(400).json({ error: 'Invalid username or password.' });

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ error: 'Invalid username or password.' });

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
        const cookieOptions = {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: isSecure ? 'none' : 'lax',
            secure: isSecure
        };
        res.cookie('token', token, cookieOptions);
        res.json({ message: 'Logged in', role: user.role });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    res.clearCookie('token', { sameSite: isSecure ? 'none' : 'lax', secure: isSecure });
    res.json({ message: 'Logged out' });
});

// Current user
app.get('/api/auth/me', authenticateUser, (req, res) => {
    res.json(req.user);
});

// ─── Admin APIs ─────────────────────────────────────────

// List users
app.get('/api/admin/users', authenticateAdmin, (req, res) => {
    try {
        const users = q.queryAll('SELECT id, username, role FROM users');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read users' });
    }
});

// Create user (admin)
app.post('/api/admin/users', authenticateAdmin, async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
        if (role !== 'user' && role !== 'admin') return res.status(400).json({ error: 'Invalid role' });

        const existing = q.queryGet('SELECT id FROM users WHERE username = ?', [username]);
        if (existing) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const newUser = { id: Date.now().toString(), username, role };
        const hashedPassword = await bcrypt.hash(password, 10);
        q.queryRun('INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)',
            [newUser.id, username, hashedPassword, role]);
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Delete user (admin)
app.delete('/api/admin/users/:id', authenticateAdmin, (req, res) => {
    try {
        const user = q.queryGet('SELECT * FROM users WHERE id = ?', [req.params.id]);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.username === 'admin') return res.status(400).json({ error: 'Cannot delete default admin' });

        q.queryRun('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// ─── Categories API ─────────────────────────────────────

app.get('/api/categories', authenticateUser, (req, res) => {
    try {
        const rows = q.queryAll('SELECT name FROM categories');
        const categories = rows.map(r => r.name);
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read categories' });
    }
});

// ─── Notes APIs ─────────────────────────────────────────

// GET all notes for user
app.get('/api/notes', authenticateUser, (req, res) => {
    try {
        const rows = q.queryAll('SELECT * FROM notes WHERE userId = ?', [req.user.id]);
        const notes = rows.map(dbNoteToApi);
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read notes' });
    }
});

// GET single note
app.get('/api/notes/:id', authenticateUser, (req, res) => {
    try {
        const row = q.queryGet('SELECT * FROM notes WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
        if (!row) return res.status(404).json({ error: 'Note not found' });
        res.json(dbNoteToApi(row));
    } catch (error) {
        res.status(500).json({ error: 'Failed to read note' });
    }
});

// POST create note
app.post('/api/notes', authenticateUser, (req, res) => {
    try {
        const { title, content, category, tags, color, pinCode, targetDate, status } = req.body;

        if (!title || !content || !category) {
            return res.status(400).json({ error: 'Title, content, and category are required' });
        }

        const now = new Date().toISOString();
        const newNote = {
            id: Date.now().toString(),
            userId: req.user.id,
            title,
            content,
            category,
            tags: Array.isArray(tags) ? tags : [],
            color: color || 'default',
            pinCode: pinCode || null,
            targetDate: targetDate || null,
            status: status || 'Todo',
            pinned: false,
            archived: false,
            createdAt: now,
            updatedAt: now
        };

        q.queryRun(
            `INSERT INTO notes (id, userId, title, content, category, tags, color, pinCode, targetDate, status, pinned, archived, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newNote.id, newNote.userId, newNote.title, newNote.content,
                newNote.category, JSON.stringify(newNote.tags), newNote.color,
                newNote.pinCode, newNote.targetDate, newNote.status,
                0, 0, now, now
            ]
        );

        res.status(201).json(newNote);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create note' });
    }
});

// PUT update note
app.put('/api/notes/:id', authenticateUser, (req, res) => {
    try {
        const { title, content, category, tags, color, pinCode, targetDate, status } = req.body;

        if (!title || !content || !category) {
            return res.status(400).json({ error: 'Title, content, and category are required' });
        }

        const existing = q.queryGet('SELECT * FROM notes WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
        if (!existing) {
            return res.status(404).json({ error: 'Note not found' });
        }

        const now = new Date().toISOString();
        const tagsStr = JSON.stringify(Array.isArray(tags) ? tags : JSON.parse(existing.tags || '[]'));
        const finalColor = color !== undefined ? color : (existing.color || 'default');
        const finalPinCode = pinCode !== undefined ? pinCode : (existing.pinCode || null);
        const finalTargetDate = targetDate !== undefined ? targetDate : (existing.targetDate || null);
        const finalStatus = status !== undefined ? status : (existing.status || 'Todo');

        q.queryRun(
            `UPDATE notes SET title=?, content=?, category=?, tags=?, color=?, pinCode=?, targetDate=?, status=?, updatedAt=?
             WHERE id=? AND userId=?`,
            [title, content, category, tagsStr, finalColor, finalPinCode, finalTargetDate, finalStatus, now,
             req.params.id, req.user.id]
        );

        const updated = q.queryGet('SELECT * FROM notes WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
        res.json(dbNoteToApi(updated));
    } catch (error) {
        res.status(500).json({ error: 'Failed to update note' });
    }
});

// POST duplicate note
app.post('/api/notes/:id/duplicate', authenticateUser, (req, res) => {
    try {
        const original = q.queryGet('SELECT * FROM notes WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
        if (!original) {
            return res.status(404).json({ error: 'Note not found' });
        }

        const now = new Date().toISOString();
        const newId = Date.now().toString();

        q.queryRun(
            `INSERT INTO notes (id, userId, title, content, category, tags, color, pinCode, targetDate, status, pinned, archived, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newId, original.userId, `${original.title} (Copy)`, original.content,
                original.category, original.tags, original.color,
                original.pinCode, original.targetDate, original.status,
                0, 0, now, now
            ]
        );

        const duplicated = q.queryGet('SELECT * FROM notes WHERE id = ? AND userId = ?', [newId, req.user.id]);
        res.status(201).json(dbNoteToApi(duplicated));
    } catch (error) {
        res.status(500).json({ error: 'Failed to duplicate note' });
    }
});

// DELETE note
app.delete('/api/notes/:id', authenticateUser, (req, res) => {
    try {
        const existing = q.queryGet('SELECT * FROM notes WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
        if (!existing) {
            return res.status(404).json({ error: 'Note not found' });
        }

        q.queryRun('DELETE FROM notes WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete note' });
    }
});

// GET search notes
app.get('/api/notes/search/:keyword', authenticateUser, (req, res) => {
    try {
        const keyword = `%${req.params.keyword.toLowerCase()}%`;
        const rows = q.queryAll(
            `SELECT * FROM notes WHERE userId = ? AND (
                LOWER(title) LIKE ? OR LOWER(content) LIKE ? OR LOWER(category) LIKE ? OR LOWER(tags) LIKE ?
            )`,
            [req.user.id, keyword, keyword, keyword, keyword]
        );
        const notes = rows.map(dbNoteToApi);
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to search notes' });
    }
});

// PATCH toggle pin
app.patch('/api/notes/:id/pin', authenticateUser, (req, res) => {
    try {
        const existing = q.queryGet('SELECT * FROM notes WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
        if (!existing) {
            return res.status(404).json({ error: 'Note not found' });
        }

        const now = new Date().toISOString();
        q.queryRun('UPDATE notes SET pinned = NOT pinned, updatedAt = ? WHERE id = ? AND userId = ?',
            [now, req.params.id, req.user.id]);

        const updated = q.queryGet('SELECT * FROM notes WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
        res.json(dbNoteToApi(updated));
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle pin' });
    }
});

// PATCH toggle archive
app.patch('/api/notes/:id/archive', authenticateUser, (req, res) => {
    try {
        const existing = q.queryGet('SELECT * FROM notes WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
        if (!existing) {
            return res.status(404).json({ error: 'Note not found' });
        }

        const now = new Date().toISOString();
        q.queryRun('UPDATE notes SET archived = NOT archived, updatedAt = ? WHERE id = ? AND userId = ?',
            [now, req.params.id, req.user.id]);

        const updated = q.queryGet('SELECT * FROM notes WHERE id = ? AND userId = ?', [req.params.id, req.user.id]);
        res.json(dbNoteToApi(updated));
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle archive' });
    }
});

// ─── SPA Fallback ───────────────────────────────────────
app.get('*', authenticatePage, (req, res) => {
    if (req.user.role === 'admin') {
        return res.redirect('/admin');
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start Server ───────────────────────────────────────
async function main() {
    // Initialize database first
    q = await initDatabase();
    console.log('[Server] Database initialized');

    function startServer(port) {
        const server = app.listen(port, '0.0.0.0', () => {
            console.log(`Server is running on port ${port}`);
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`Port ${port} is already in use. Trying port ${port + 1}...`);
                startServer(port + 1);
            } else {
                console.error('Server error:', err);
            }
        });
    }

    startServer(PORT);
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    process.exit(0);
});

main().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
