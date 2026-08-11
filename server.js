const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'notenest-super-secret-key-123';

app.use(express.json());
app.use(cookieParser());

const DATA_DIR = path.join(__dirname, 'data');
const NOTES_FILE = path.join(DATA_DIR, 'notes.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Helper functions for reading/writing data
async function readUsers() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            const defaultAdmin = {
                id: '1',
                username: 'admin',
                password: await bcrypt.hash('admin123', 10),
                role: 'admin'
            };
            await fs.writeFile(USERS_FILE, JSON.stringify([defaultAdmin], null, 2));
            return [defaultAdmin];
        }
        throw error;
    }
}

async function writeUsers(users) {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

// Authentication Middlewares
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

// Protect HTML files
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

// Auth APIs
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

        const users = await readUsers();
        const user = users.find(u => u.username === username);
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

app.post('/api/auth/logout', (req, res) => {
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    res.clearCookie('token', { sameSite: isSecure ? 'none' : 'lax', secure: isSecure });
    res.json({ message: 'Logged out' });
});

app.get('/api/auth/me', authenticateUser, (req, res) => {
    res.json(req.user);
});

// Admin APIs
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
    try {
        const users = await readUsers();
        // Don't send passwords
        const safeUsers = users.map(u => ({ id: u.id, username: u.username, role: u.role }));
        res.json(safeUsers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read users' });
    }
});

app.post('/api/admin/users', authenticateAdmin, async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
        if (role !== 'user' && role !== 'admin') return res.status(400).json({ error: 'Invalid role' });

        const users = await readUsers();
        if (users.find(u => u.username === username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const newUser = {
            id: Date.now().toString(),
            username,
            password: await bcrypt.hash(password, 10),
            role
        };

        users.push(newUser);
        await writeUsers(users);
        res.status(201).json({ id: newUser.id, username: newUser.username, role: newUser.role });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
});

app.delete('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
    try {
        const users = await readUsers();
        const index = users.findIndex(u => u.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'User not found' });
        if (users[index].username === 'admin') return res.status(400).json({ error: 'Cannot delete default admin' });

        users.splice(index, 1);
        await writeUsers(users);
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Original Helper functions for reading/writing data
async function readNotes() {

    try {
        const data = await fs.readFile(NOTES_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(NOTES_FILE, '[]');
            return [];
        }
        throw error;
    }
}

async function writeNotes(notes) {
    await fs.writeFile(NOTES_FILE, JSON.stringify(notes, null, 2));
}

async function readCategories() {
    try {
        const data = await fs.readFile(CATEGORIES_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            const defaultCategories = ["Study", "Programming", "Personal", "Work", "Projects", "Other"];
            await fs.writeFile(CATEGORIES_FILE, JSON.stringify(defaultCategories, null, 2));
            return defaultCategories;
        }
        throw error;
    }
}

// API Endpoints

// GET /api/categories
app.get('/api/categories', authenticateUser, async (req, res) => {
    try {
        const categories = await readCategories();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read categories' });
    }
});

// GET /api/notes
app.get('/api/notes', authenticateUser, async (req, res) => {
    try {
        const notes = await readNotes();
        const userNotes = notes.filter(n => n.userId === req.user.id);
        res.json(userNotes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read notes' });
    }
});

// GET /api/notes/:id
app.get('/api/notes/:id', authenticateUser, async (req, res) => {
    try {
        const notes = await readNotes();
        const note = notes.find(n => n.id === req.params.id && n.userId === req.user.id);
        if (!note) return res.status(404).json({ error: 'Note not found' });
        res.json(note);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read note' });
    }
});

// POST /api/notes
app.post('/api/notes', authenticateUser, async (req, res) => {
    try {
        const { title, content, category, tags } = req.body;
        
        if (!title || !content || !category) {
            return res.status(400).json({ error: 'Title, content, and category are required' });
        }

        const notes = await readNotes();
        
        const newNote = {
            id: Date.now().toString(),
            userId: req.user.id,
            title,
            content,
            category,
            tags: Array.isArray(tags) ? tags : [],
            pinned: false,
            archived: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        notes.push(newNote);
        await writeNotes(notes);
        
        res.status(201).json(newNote);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create note' });
    }
});

// PUT /api/notes/:id
app.put('/api/notes/:id', authenticateUser, async (req, res) => {
    try {
        const { title, content, category, tags } = req.body;
        
        if (!title || !content || !category) {
            return res.status(400).json({ error: 'Title, content, and category are required' });
        }

        const notes = await readNotes();
        const index = notes.findIndex(n => n.id === req.params.id && n.userId === req.user.id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Note not found' });
        }

        notes[index] = {
            ...notes[index],
            title,
            content,
            category,
            tags: Array.isArray(tags) ? tags : [],
            updatedAt: new Date().toISOString()
        };

        await writeNotes(notes);
        res.json(notes[index]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update note' });
    }
});

// DELETE /api/notes/:id
app.delete('/api/notes/:id', authenticateUser, async (req, res) => {
    try {
        const notes = await readNotes();
        const index = notes.findIndex(n => n.id === req.params.id && n.userId === req.user.id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Note not found' });
        }

        notes.splice(index, 1);
        await writeNotes(notes);
        
        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete note' });
    }
});

// GET /api/notes/search/:keyword
app.get('/api/notes/search/:keyword', authenticateUser, async (req, res) => {
    try {
        const keyword = req.params.keyword.toLowerCase();
        const notes = await readNotes();
        
        const filtered = notes.filter(note => {
            if (note.userId !== req.user.id) return false;
            const titleMatch = note.title.toLowerCase().includes(keyword);
            const contentMatch = note.content.toLowerCase().includes(keyword);
            const categoryMatch = note.category.toLowerCase().includes(keyword);
            const tagsMatch = note.tags.some(tag => tag.toLowerCase().includes(keyword));
            
            return titleMatch || contentMatch || categoryMatch || tagsMatch;
        });

        res.json(filtered);
    } catch (error) {
        res.status(500).json({ error: 'Failed to search notes' });
    }
});

// PATCH /api/notes/:id/pin
app.patch('/api/notes/:id/pin', authenticateUser, async (req, res) => {
    try {
        const notes = await readNotes();
        const index = notes.findIndex(n => n.id === req.params.id && n.userId === req.user.id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Note not found' });
        }

        notes[index].pinned = !notes[index].pinned;
        notes[index].updatedAt = new Date().toISOString();
        
        await writeNotes(notes);
        res.json(notes[index]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle pin' });
    }
});

// PATCH /api/notes/:id/archive
app.patch('/api/notes/:id/archive', authenticateUser, async (req, res) => {
    try {
        const notes = await readNotes();
        const index = notes.findIndex(n => n.id === req.params.id && n.userId === req.user.id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Note not found' });
        }

        notes[index].archived = !notes[index].archived;
        notes[index].updatedAt = new Date().toISOString();
        
        await writeNotes(notes);
        res.json(notes[index]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle archive' });
    }
});

// Fallback for SPA or unknown routes to serve index.html
app.get('*', authenticatePage, (req, res) => {
    if (req.user.role === 'admin') {
        return res.redirect('/admin');
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
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
