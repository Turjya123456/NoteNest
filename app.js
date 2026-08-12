// State
let state = {
    notes: [],
    categories: [],
    currentView: 'dashboard',
    currentCategory: null,
    searchQuery: '',
    sortBy: 'newest',
    noteToDelete: null
};

// DOM Elements
const elements = {
    themeBtn: document.getElementById('theme-toggle-btn'),
    newNoteBtn: document.getElementById('new-note-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    sidebar: document.getElementById('sidebar'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    mobileCloseBtn: document.getElementById('mobile-close-btn'),
    
    // Search & Sort
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    sortSelect: document.getElementById('sort-select'),
    searchResultsInfo: document.getElementById('search-results-info'),
    
    // Navigation
    viewFilters: document.getElementById('view-filters'),
    categoryFilters: document.getElementById('category-filters'),
    
    // Views
    dashboardView: document.getElementById('dashboard-view'),
    notesView: document.getElementById('notes-view'),
    currentViewTitle: document.getElementById('current-view-title'),
    
    // Containers
    statsContainer: document.getElementById('stats-container'),
    recentNotesGrid: document.getElementById('recent-notes-grid'),
    notesGrid: document.getElementById('notes-grid'),
    emptyState: document.getElementById('empty-state'),
    
    // Modals
    noteModal: document.getElementById('note-modal'),
    noteForm: document.getElementById('note-form'),
    modalTitle: document.getElementById('modal-title'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    cancelNoteBtn: document.getElementById('cancel-note-btn'),
    
    deleteModal: document.getElementById('delete-modal'),
    confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
    cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
    
    // Form Inputs
    noteId: document.getElementById('note-id'),
    noteTitle: document.getElementById('note-title'),
    noteCategory: document.getElementById('note-category'),
    noteTags: document.getElementById('note-tags'),
    noteBody: document.getElementById('note-body'),
    
    // Notification
    notificationArea: document.getElementById('notification-area')
};

// API Functions
const api = {
    async get(endpoint) {
        try {
            const res = await fetch(`/api${endpoint}`);
            if (res.status === 401 || res.status === 403) {
                window.location.href = '/login';
                return null;
            }
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return await res.json();
        } catch (error) {
            showNotification(error.message, 'error');
            return null;
        }
    },
    async post(endpoint, data) {
        return this.send('POST', endpoint, data);
    },
    async put(endpoint, data) {
        return this.send('PUT', endpoint, data);
    },
    async patch(endpoint, data = {}) {
        return this.send('PATCH', endpoint, data);
    },
    async delete(endpoint) {
        return this.send('DELETE', endpoint, null);
    },
    async send(method, endpoint, data) {
        try {
            const options = {
                method,
                headers: { 'Content-Type': 'application/json' }
            };
            if (data) options.body = JSON.stringify(data);
            
            const res = await fetch(`/api${endpoint}`, options);
            if (res.status === 401 || res.status === 403) {
                window.location.href = '/login';
                return null;
            }
            
            const result = await res.json();
            
            if (!res.ok) throw new Error(result.error || `HTTP error! status: ${res.status}`);
            return result;
        } catch (error) {
            showNotification(error.message, 'error');
            throw error;
        }
    }
};

// Initialize App
async function init() {
    setupTheme();
    setupEventListeners();
    await loadData();
    renderSidebar();
    renderCurrentView();
}

// Data Loading
async function loadData() {
    state.categories = await api.get('/categories') || [];
    state.notes = await api.get('/notes') || [];
}

// Rendering
function renderSidebar() {
    elements.categoryFilters.innerHTML = state.categories.map(cat => 
        `<li data-view="category" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</li>`
    ).join('');

    elements.noteCategory.innerHTML = state.categories.map(cat =>
        `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`
    ).join('');
}

function renderCurrentView() {
    // Handle Navigation Active States
    document.querySelectorAll('.nav-section li').forEach(li => li.classList.remove('active'));
    
    if (state.currentView === 'category') {
        const catLi = document.querySelector(`li[data-category="${state.currentCategory}"]`);
        if (catLi) catLi.classList.add('active');
    } else {
        const viewLi = document.querySelector(`li[data-view="${state.currentView}"]`);
        if (viewLi) viewLi.classList.add('active');
    }

    // Toggle Views
    if (state.currentView === 'dashboard') {
        elements.dashboardView.classList.add('active-view');
        elements.dashboardView.classList.remove('hidden');
        elements.notesView.classList.remove('active-view');
        elements.notesView.classList.add('hidden');
        renderDashboard();
    } else {
        elements.dashboardView.classList.remove('active-view');
        elements.dashboardView.classList.add('hidden');
        elements.notesView.classList.add('active-view');
        elements.notesView.classList.remove('hidden');
        renderNotesView();
    }

    // Close mobile menu if open
    if (window.innerWidth <= 768) {
        elements.sidebar.classList.remove('open');
    }
}

function renderDashboard() {
    const total = state.notes.length;
    const pinned = state.notes.filter(n => n.pinned).length;
    const archived = state.notes.filter(n => n.archived).length;
    const active = total - archived;
    const categoriesCount = state.categories.length;

    elements.statsContainer.innerHTML = `
        <div class="stat-card">
            <h3>Total Notes</h3>
            <div class="stat-value">${total}</div>
        </div>
        <div class="stat-card">
            <h3>Active Notes</h3>
            <div class="stat-value">${active}</div>
        </div>
        <div class="stat-card">
            <h3>Pinned Notes</h3>
            <div class="stat-value">${pinned}</div>
        </div>
        <div class="stat-card">
            <h3>Archived Notes</h3>
            <div class="stat-value">${archived}</div>
        </div>
        <div class="stat-card">
            <h3>Categories</h3>
            <div class="stat-value">${categoriesCount}</div>
        </div>
    `;

    const recent = [...state.notes]
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 3);
    
    renderNotesGrid(recent, elements.recentNotesGrid);
}

function renderNotesView() {
    let filteredNotes = [...state.notes];
    let title = 'All Notes';

    // Apply View Filter
    if (state.currentView === 'all') {
        filteredNotes = filteredNotes.filter(n => !n.archived);
        title = 'All Notes';
    } else if (state.currentView === 'pinned') {
        filteredNotes = filteredNotes.filter(n => n.pinned && !n.archived);
        title = 'Pinned Notes';
    } else if (state.currentView === 'archived') {
        filteredNotes = filteredNotes.filter(n => n.archived);
        title = 'Archived Notes';
    } else if (state.currentView === 'category') {
        filteredNotes = filteredNotes.filter(n => n.category === state.currentCategory && !n.archived);
        title = `${state.currentCategory}`;
    }

    // Apply Search Filter from API, but we already have client-side state.
    // The instructions say "Search must communicate with /api/notes/search/:keyword".
    // I will implement a check: if state.searchQuery exists, use the API.
    
    const applySortAndRender = (notesToRender) => {
        notesToRender.sort((a, b) => {
            // Pinned notes always at top unless in archived view
            if (state.currentView !== 'archived') {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
            }

            switch (state.sortBy) {
                case 'newest': return new Date(b.createdAt) - new Date(a.createdAt);
                case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
                case 'updated': return new Date(b.updatedAt) - new Date(a.updatedAt);
                case 'az': return a.title.localeCompare(b.title);
                default: return 0;
            }
        });

        renderNotesGrid(notesToRender, elements.notesGrid);
    };

    elements.currentViewTitle.textContent = title;

    if (state.searchQuery) {
        api.get(`/notes/search/${encodeURIComponent(state.searchQuery)}`).then(searchResults => {
            if (!searchResults) searchResults = [];
            
            // Still need to apply the view filters on the search results (e.g. if looking at 'pinned', only show pinned search results)
            if (state.currentView === 'all') {
                searchResults = searchResults.filter(n => !n.archived);
            } else if (state.currentView === 'pinned') {
                searchResults = searchResults.filter(n => n.pinned && !n.archived);
            } else if (state.currentView === 'archived') {
                searchResults = searchResults.filter(n => n.archived);
            } else if (state.currentView === 'category') {
                searchResults = searchResults.filter(n => n.category === state.currentCategory && !n.archived);
            }
            
            elements.searchResultsInfo.textContent = `Found ${searchResults.length} result(s) for "${state.searchQuery}"`;
            elements.searchResultsInfo.classList.remove('hidden');
            applySortAndRender(searchResults);
        });
    } else {
        elements.searchResultsInfo.classList.add('hidden');
        applySortAndRender(filteredNotes);
    }
}

function renderNotesGrid(notes, container) {
    if (notes.length === 0) {
        container.innerHTML = '';
        if (container === elements.notesGrid) elements.emptyState.classList.remove('hidden');
        return;
    }
    
    if (container === elements.notesGrid) elements.emptyState.classList.add('hidden');

    container.innerHTML = notes.map(note => `
        <div class="note-card">
            <div class="note-header">
                <div class="note-category">${escapeHtml(note.category)}</div>
                ${note.pinned ? '<span title="Pinned" class="note-action-btn pinned">📌</span>' : ''}
            </div>
            <h3 class="note-title">${escapeHtml(note.title)}</h3>
            <div class="note-content">${escapeHtml(note.content)}</div>
            <div class="note-tags">
                ${note.tags.map(tag => `<span class="note-tag">#${escapeHtml(tag)}</span>`).join('')}
            </div>
            <div class="note-footer">
                <div class="note-date">${new Date(note.updatedAt).toLocaleDateString()}</div>
                <div class="note-actions">
                    <button class="note-action-btn" onclick="editNote('${note.id}')" title="Edit">✏️</button>
                    <button class="note-action-btn" onclick="togglePin('${note.id}')" title="${note.pinned ? 'Unpin' : 'Pin'}">
                        ${note.pinned ? '📌' : '📍'}
                    </button>
                    <button class="note-action-btn" onclick="toggleArchive('${note.id}')" title="${note.archived ? 'Unarchive' : 'Archive'}">
                        ${note.archived ? '📤' : '🗄️'}
                    </button>
                    <button class="note-action-btn delete" onclick="confirmDelete('${note.id}')" title="Delete">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Event Listeners Setup
function setupEventListeners() {
    // Navigation
    document.querySelector('.sidebar-nav').addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li) return;
        
        state.currentView = li.dataset.view;
        if (state.currentView === 'category') {
            state.currentCategory = li.dataset.category;
        } else {
            state.currentCategory = null;
        }
        
        // Clear search on navigation
        if (state.searchQuery) {
            state.searchQuery = '';
            elements.searchInput.value = '';
            elements.clearSearchBtn.classList.add('hidden');
        }
        
        renderCurrentView();
    });

    // Mobile Menu
    elements.mobileMenuBtn.addEventListener('click', () => {
        elements.sidebar.classList.add('open');
    });
    elements.mobileCloseBtn.addEventListener('click', () => {
        elements.sidebar.classList.remove('open');
    });

    // Theme Toggle
    elements.themeBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        document.body.classList.toggle('light-mode');
        elements.themeBtn.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    // Logout
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/login';
            } catch (error) {
                console.error('Logout failed:', error);
            }
        });
    }

    // Search
    let searchTimeout;
    elements.searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const value = e.target.value.trim();
        
        if (value) {
            elements.clearSearchBtn.classList.remove('hidden');
        } else {
            elements.clearSearchBtn.classList.add('hidden');
        }

        searchTimeout = setTimeout(() => {
            state.searchQuery = value;
            if (state.currentView === 'dashboard' && value) {
                state.currentView = 'all';
            }
            renderCurrentView();
        }, 300);
    });

    elements.clearSearchBtn.addEventListener('click', () => {
        elements.searchInput.value = '';
        state.searchQuery = '';
        elements.clearSearchBtn.classList.add('hidden');
        renderCurrentView();
    });

    // Sort
    elements.sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        renderNotesView();
    });

    // Modals (New Note)
    elements.newNoteBtn.addEventListener('click', () => {
        elements.noteForm.reset();
        elements.noteId.value = '';
        elements.modalTitle.textContent = 'New Note';
        elements.noteModal.classList.remove('hidden');
    });

    const closeModals = () => {
        elements.noteModal.classList.add('hidden');
        elements.deleteModal.classList.add('hidden');
        state.noteToDelete = null;
    };

    elements.closeModalBtn.addEventListener('click', closeModals);
    elements.cancelNoteBtn.addEventListener('click', closeModals);
    elements.cancelDeleteBtn.addEventListener('click', closeModals);

    window.addEventListener('click', (e) => {
        if (e.target === elements.noteModal || e.target === elements.deleteModal) {
            closeModals();
        }
    });

    // Form Submit
    elements.noteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = elements.noteId.value;
        const tagsStr = elements.noteTags.value;
        const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t) : [];
        
        const noteData = {
            title: elements.noteTitle.value.trim(),
            category: elements.noteCategory.value,
            tags: tags,
            content: elements.noteBody.value.trim()
        };

        try {
            if (id) {
                const updatedNote = await api.put(`/notes/${id}`, noteData);
                const index = state.notes.findIndex(n => n.id === id);
                if (index !== -1) state.notes[index] = updatedNote;
                showNotification('✓ Note updated successfully', 'success');
            } else {
                const newNote = await api.post('/notes', noteData);
                state.notes.push(newNote);
                showNotification('✓ Note created successfully', 'success');
            }
            closeModals();
            renderCurrentView();
        } catch (error) {
            // Error handled in API func
        }
    });

    // Confirm Delete
    elements.confirmDeleteBtn.addEventListener('click', async () => {
        if (state.noteToDelete) {
            try {
                await api.delete(`/notes/${state.noteToDelete}`);
                state.notes = state.notes.filter(n => n.id !== state.noteToDelete);
                showNotification('✓ Note deleted successfully', 'success');
                closeModals();
                renderCurrentView();
            } catch (error) {
                // error handled
            }
        }
    });
}

// Global Note Actions (exposed to window for inline onclick)
window.editNote = (id) => {
    const note = state.notes.find(n => n.id === id);
    if (!note) return;

    elements.noteId.value = note.id;
    elements.noteTitle.value = note.title;
    elements.noteCategory.value = note.category;
    elements.noteTags.value = note.tags.join(', ');
    elements.noteBody.value = note.content;
    
    elements.modalTitle.textContent = 'Edit Note';
    elements.noteModal.classList.remove('hidden');
};

window.togglePin = async (id) => {
    try {
        const updated = await api.patch(`/notes/${id}/pin`);
        const index = state.notes.findIndex(n => n.id === id);
        if (index !== -1) state.notes[index] = updated;
        renderCurrentView();
    } catch (error) {}
};

window.toggleArchive = async (id) => {
    try {
        const updated = await api.patch(`/notes/${id}/archive`);
        const index = state.notes.findIndex(n => n.id === id);
        if (index !== -1) state.notes[index] = updated;
        renderCurrentView();
        const action = updated.archived ? 'archived' : 'unarchived';
        showNotification(`✓ Note ${action}`, 'success');
    } catch (error) {}
};

window.confirmDelete = (id) => {
    state.noteToDelete = id;
    elements.deleteModal.classList.remove('hidden');
};

// Utilities
function setupTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        elements.themeBtn.textContent = '☀️';
    } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
        elements.themeBtn.textContent = '🌙';
    }
}

function showNotification(message, type = 'success') {
    const el = document.createElement('div');
    el.className = `notification ${type}`;
    el.textContent = message;
    elements.notificationArea.appendChild(el);
    
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateX(100%)';
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
         .toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// Start
init();
