// NoteNest Premium Application State & Logic

document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let state = {
        currentUser: null,
        notes: [],
        categories: [],
        currentView: 'dashboard',
        selectedCategory: null,
        searchQuery: '',
        sortBy: 'newest',
        currentCalendarDate: new Date(),
        activeNoteId: null,
        deleteTargetId: null,
        unlockedNotes: new Set(),
        isDictating: false,
        recognition: null
    };

    // --- DOM Element References ---
    const elements = {
        themeToggleBtn: document.getElementById('theme-toggle-btn'),
        mobileMenuBtn: document.getElementById('mobile-menu-btn'),
        mobileCloseBtn: document.getElementById('mobile-close-btn'),
        sidebar: document.getElementById('sidebar'),
        searchInput: document.getElementById('search-input'),
        clearSearchBtn: document.getElementById('clear-search-btn'),
        newNoteBtn: document.getElementById('new-note-btn'),
        logoutBtn: document.getElementById('logout-btn'),
        commandPaletteBtn: document.getElementById('command-palette-btn'),
        focusModeBtn: document.getElementById('focus-mode-btn'),

        // Nav Lists
        viewFilters: document.getElementById('view-filters'),
        categoryFilters: document.getElementById('category-filters'),

        // Badges
        badgeAll: document.getElementById('badge-all'),
        badgePinned: document.getElementById('badge-pinned'),
        badgeArchived: document.getElementById('badge-archived'),

        // Views
        dashboardView: document.getElementById('dashboard-view'),
        notesView: document.getElementById('notes-view'),
        calendarView: document.getElementById('calendar-view'),
        kanbanView: document.getElementById('kanban-view'),

        // Dashboard Stats
        statTotalNotes: document.getElementById('stat-total-notes'),
        statPinnedNotes: document.getElementById('stat-pinned-notes'),
        statCategories: document.getElementById('stat-categories'),
        statTotalWords: document.getElementById('stat-total-words'),
        categoryAnalytics: document.getElementById('category-analytics'),
        recentNotesGrid: document.getElementById('recent-notes-grid'),

        // Notes Grid & Header
        currentViewTitle: document.getElementById('current-view-title'),
        sortSelect: document.getElementById('sort-select'),
        searchResultsInfo: document.getElementById('search-results-info'),
        notesGrid: document.getElementById('notes-grid'),
        emptyState: document.getElementById('empty-state'),

        // Calendar
        calMonthTitle: document.getElementById('cal-month-title'),
        calPrevBtn: document.getElementById('cal-prev-month'),
        calNextBtn: document.getElementById('cal-next-month'),
        calendarGrid: document.getElementById('calendar-grid'),

        // Kanban
        kanbanCardsTodo: document.getElementById('kanban-cards-todo'),
        kanbanCardsProgress: document.getElementById('kanban-cards-progress'),
        kanbanCardsDone: document.getElementById('kanban-cards-done'),
        kanbanCardsIdeas: document.getElementById('kanban-cards-ideas'),
        kanbanCountTodo: document.getElementById('kanban-count-todo'),
        kanbanCountProgress: document.getElementById('kanban-count-progress'),
        kanbanCountDone: document.getElementById('kanban-count-done'),
        kanbanCountIdeas: document.getElementById('kanban-count-ideas'),

        // Note Modal
        noteModal: document.getElementById('note-modal'),
        modalTitle: document.getElementById('modal-title'),
        noteForm: document.getElementById('note-form'),
        noteIdInput: document.getElementById('note-id'),
        noteTitleInput: document.getElementById('note-title'),
        noteCategorySelect: document.getElementById('note-category'),
        noteStatusSelect: document.getElementById('note-status'),
        noteColorSelect: document.getElementById('note-color'),
        notePinInput: document.getElementById('note-pin-code'),
        noteTagsInput: document.getElementById('note-tags'),
        noteBodyInput: document.getElementById('note-body'),
        tabWrite: document.getElementById('tab-write'),
        tabPreview: document.getElementById('tab-preview'),
        editorTextareaWrapper: document.getElementById('editor-textarea-wrapper'),
        editorPreviewWrapper: document.getElementById('editor-preview-wrapper'),
        wordCountBadge: document.getElementById('word-count-badge'),
        closeModalBtn: document.getElementById('close-modal-btn'),
        cancelNoteBtn: document.getElementById('cancel-note-btn'),
        editorToolbar: document.getElementById('editor-toolbar'),
        voiceDictateBtn: document.getElementById('voice-dictate-btn'),

        // Command Palette
        commandPaletteModal: document.getElementById('command-palette-modal'),
        commandPaletteInput: document.getElementById('command-palette-input'),
        commandPaletteList: document.getElementById('command-palette-list'),

        // PIN Verification Modal
        pinVerifyModal: document.getElementById('pin-verify-modal'),
        pinInput: document.getElementById('pin-input'),
        pinError: document.getElementById('pin-error'),
        closePinModal: document.getElementById('close-pin-modal'),
        cancelPinBtn: document.getElementById('cancel-pin-btn'),
        submitPinBtn: document.getElementById('submit-pin-btn'),

        // Delete Modal
        deleteModal: document.getElementById('delete-modal'),
        closeDeleteModalBtn: document.getElementById('close-delete-modal-btn'),
        cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
        confirmDeleteBtn: document.getElementById('confirm-delete-btn'),

        // Focus Mode Overlay
        focusModeOverlay: document.getElementById('focus-mode-overlay'),
        focusTitle: document.getElementById('focus-title'),
        focusBody: document.getElementById('focus-body'),
        focusWordCount: document.getElementById('focus-word-count'),
        focusSaveBtn: document.getElementById('focus-save-btn'),
        focusExitBtn: document.getElementById('focus-exit-btn'),

        // Scratchpad Widget
        scratchpadToggleBtn: document.getElementById('scratchpad-toggle-btn'),
        scratchpadBox: document.getElementById('scratchpad-box'),
        scratchpadText: document.getElementById('scratchpad-text'),
        closeScratchpad: document.getElementById('close-scratchpad'),

        // Toast Container
        toastContainer: document.getElementById('toast-container')
    };

    // --- Toast Notification System ---
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '⚠️';

        toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
        elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // --- Markdown Parser ---
    function parseMarkdown(text) {
        if (!text) return '';
        let html = escapeHtml(text);

        // Code blocks
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        // Bold & Italic
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        // Checklists
        html = html.replace(/- \[ \] (.*)/g, '<div class="todo-item"><input type="checkbox" disabled> <span>$1</span></div>');
        html = html.replace(/- \[x\] (.*)/g, '<div class="todo-item"><input type="checkbox" checked disabled> <span style="text-decoration: line-through;">$1</span></div>');
        // Bullet lists
        html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
        // Line breaks
        html = html.replace(/\n/g, '<br>');

        return html;
    }

    function escapeHtml(str) {
        return (str || '').replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function calculateReadingTime(text) {
        const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
        const minutes = Math.ceil(words / 200);
        return { words, time: `${minutes} min read` };
    }

    // --- Theme System ---
    function initTheme() {
        const savedTheme = localStorage.getItem('notenest_theme') || 'light-mode';
        document.body.className = savedTheme;
        elements.themeToggleBtn.textContent = savedTheme === 'dark-mode' ? '☀️' : '🌙';
    }

    elements.themeToggleBtn.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark-mode');
        const newTheme = isDark ? 'light-mode' : 'dark-mode';
        document.body.className = newTheme;
        localStorage.setItem('notenest_theme', newTheme);
        elements.themeToggleBtn.textContent = newTheme === 'dark-mode' ? '☀️' : '🌙';
        showToast(`Switched to ${newTheme === 'dark-mode' ? 'Dark' : 'Light'} Mode`, 'info');
    });

    // --- Fetch Initial Data ---
    async function initApp() {
        initTheme();
        initScratchpad();
        initVoiceDictation();
        await Promise.all([fetchCurrentUser(), fetchCategories(), fetchNotes()]);
        renderCurrentView();
        setupEventListeners();
    }

    async function fetchCurrentUser() {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const user = await res.json();
                state.currentUser = user;
                const userDisplayName = document.getElementById('user-display-name');
                if (userDisplayName && user.username) {
                    userDisplayName.textContent = user.username;
                }
                const greeting = document.getElementById('dashboard-greeting');
                if (greeting && user.username) {
                    greeting.textContent = `Welcome back, ${user.username} 👋`;
                }
                if (user.role === 'admin') {
                    const adminLink = document.getElementById('admin-panel-link');
                    if (adminLink) adminLink.classList.remove('hidden');
                }
            }
        } catch (err) {
            console.error('Failed to fetch user:', err);
        }
    }

    // --- Dashboard Quick Actions Wiring ---
    function setupEventListeners() {
        // Quick Action buttons on Dashboard
        const quickNew = document.getElementById('dash-quick-new');
        const quickCal = document.getElementById('dash-quick-cal');
        const quickKanban = document.getElementById('dash-quick-kanban');

        if (quickNew) quickNew.addEventListener('click', () => openNoteModal());
        if (quickCal) quickCal.addEventListener('click', () => {
            state.currentView = 'calendar';
            setActiveNav(document.querySelector('[data-view="calendar"]'));
            renderCurrentView();
        });
        if (quickKanban) quickKanban.addEventListener('click', () => {
            state.currentView = 'kanban';
            setActiveNav(document.querySelector('[data-view="kanban"]'));
            renderCurrentView();
        });
    }

    async function fetchCategories() {
        try {
            const res = await fetch('/api/categories');
            if (res.status === 401) {
                window.location.href = '/login';
                return;
            }
            state.categories = await res.json();
            renderCategoriesNav();
            populateCategoryDropdown();
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    }

    async function fetchNotes() {
        try {
            const res = await fetch('/api/notes');
            if (res.status === 401) {
                window.location.href = '/login';
                return;
            }
            state.notes = await res.json();
            updateBadges();
        } catch (err) {
            console.error('Failed to fetch notes:', err);
        }
    }

    function updateBadges() {
        const activeNotes = state.notes.filter(n => !n.archived);
        const pinnedNotes = state.notes.filter(n => n.pinned && !n.archived);
        const archivedNotes = state.notes.filter(n => n.archived);

        elements.badgeAll.textContent = activeNotes.length;
        elements.badgePinned.textContent = pinnedNotes.length;
        elements.badgeArchived.textContent = archivedNotes.length;
    }

    // --- Render Categories Nav ---
    const categoryColors = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

    function renderCategoriesNav() {
        elements.categoryFilters.innerHTML = '';
        state.categories.forEach((cat, index) => {
            const color = categoryColors[index % categoryColors.length];
            const count = state.notes.filter(n => n.category === cat && !n.archived).length;

            const li = document.createElement('li');
            li.dataset.category = cat;
            li.innerHTML = `
                <span class="category-dot" style="background-color: ${color};"></span>
                <span>${escapeHtml(cat)}</span>
                <span class="badge">${count}</span>
            `;

            if (state.currentView === 'category' && state.selectedCategory === cat) {
                li.classList.add('active');
            }

            li.addEventListener('click', () => {
                state.currentView = 'category';
                state.selectedCategory = cat;
                setActiveNav(li);
                renderCurrentView();
            });

            elements.categoryFilters.appendChild(li);
        });
    }

    function populateCategoryDropdown() {
        elements.noteCategorySelect.innerHTML = '';
        state.categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            elements.noteCategorySelect.appendChild(opt);
        });
    }

    function setActiveNav(activeElement) {
        document.querySelectorAll('.sidebar-nav li').forEach(el => el.classList.remove('active'));
        if (activeElement) activeElement.classList.add('active');
    }

    // --- View Navigation Router ---
    elements.viewFilters.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li) return;
        
        const view = li.dataset.view;
        if (!view) return;

        state.currentView = view;
        state.selectedCategory = null;
        setActiveNav(li);
        renderCurrentView();
    });

    function renderCurrentView() {
        // Hide all views first
        elements.dashboardView.classList.add('hidden');
        elements.notesView.classList.add('hidden');
        elements.calendarView.classList.add('hidden');
        elements.kanbanView.classList.add('hidden');

        if (state.currentView === 'dashboard') {
            elements.dashboardView.classList.remove('hidden');
            renderDashboard();
        } else if (state.currentView === 'calendar') {
            elements.calendarView.classList.remove('hidden');
            renderCalendar();
        } else if (state.currentView === 'kanban') {
            elements.kanbanView.classList.remove('hidden');
            renderKanban();
        } else {
            elements.notesView.classList.remove('hidden');
            renderNotesView();
        }
    }

    // --- Dashboard View Renderer ---
    function renderDashboard() {
        const activeNotes = state.notes.filter(n => !n.archived);
        const pinnedNotes = state.notes.filter(n => n.pinned && !n.archived);

        let totalWords = 0;
        activeNotes.forEach(n => {
            totalWords += (n.content || '').trim().split(/\s+/).filter(Boolean).length;
        });

        elements.statTotalNotes.textContent = activeNotes.length;
        elements.statPinnedNotes.textContent = pinnedNotes.length;
        elements.statCategories.textContent = state.categories.length;
        elements.statTotalWords.textContent = totalWords.toLocaleString();

        // Render Category Analytics Bars
        elements.categoryAnalytics.innerHTML = '';
        state.categories.forEach((cat, index) => {
            const count = activeNotes.filter(n => n.category === cat).length;
            const percentage = activeNotes.length ? Math.round((count / activeNotes.length) * 100) : 0;
            const color = categoryColors[index % categoryColors.length];

            const item = document.createElement('div');
            item.className = 'chart-item';
            item.innerHTML = `
                <div class="chart-label">${escapeHtml(cat)}</div>
                <div class="chart-track">
                    <div class="chart-fill" style="width: ${percentage}%; background: ${color};"></div>
                </div>
                <div class="chart-val">${count}</div>
            `;
            elements.categoryAnalytics.appendChild(item);
        });

        // Render Recent Notes (top 6 newest)
        const recent = [...activeNotes]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 6);

        renderNotesGrid(recent, elements.recentNotesGrid);
    }

    // --- Filter & Sort Helper ---
    function getFilteredNotes() {
        let list = [...state.notes];

        // View Filtering
        if (state.currentView === 'all') {
            list = list.filter(n => !n.archived);
        } else if (state.currentView === 'pinned') {
            list = list.filter(n => n.pinned && !n.archived);
        } else if (state.currentView === 'archived') {
            list = list.filter(n => n.archived);
        } else if (state.currentView === 'category') {
            list = list.filter(n => n.category === state.selectedCategory && !n.archived);
        }

        // Search Query Filtering
        if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase();
            list = list.filter(n => 
                n.title.toLowerCase().includes(query) ||
                n.content.toLowerCase().includes(query) ||
                n.category.toLowerCase().includes(query) ||
                (n.tags && n.tags.some(t => t.toLowerCase().includes(query)))
            );
        }

        // Sorting
        if (state.sortBy === 'newest') {
            list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (state.sortBy === 'oldest') {
            list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (state.sortBy === 'updated') {
            list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        } else if (state.sortBy === 'az') {
            list.sort((a, b) => a.title.localeCompare(b.title));
        }

        return list;
    }

    // --- Notes View Renderer ---
    function renderNotesView() {
        // Set Header Title
        if (state.currentView === 'all') elements.currentViewTitle.textContent = 'All Notes';
        else if (state.currentView === 'pinned') elements.currentViewTitle.textContent = 'Pinned Notes';
        else if (state.currentView === 'archived') elements.currentViewTitle.textContent = 'Archived Notes';
        else if (state.currentView === 'category') elements.currentViewTitle.textContent = `Category: ${state.selectedCategory}`;

        const filtered = getFilteredNotes();

        if (state.searchQuery) {
            elements.searchResultsInfo.textContent = `Found ${filtered.length} matching notes for "${state.searchQuery}"`;
            elements.searchResultsInfo.classList.remove('hidden');
        } else {
            elements.searchResultsInfo.classList.add('hidden');
        }

        if (filtered.length === 0) {
            elements.emptyState.classList.remove('hidden');
            elements.notesGrid.innerHTML = '';
        } else {
            elements.emptyState.classList.add('hidden');
            renderNotesGrid(filtered, elements.notesGrid);
        }
    }

    // --- Notes Grid Card Component Builder ---
    function renderNotesGrid(notesList, container) {
        container.innerHTML = '';

        const accentThemes = ['accent-purple', 'accent-cyan', 'accent-emerald', 'accent-amber', 'accent-rose'];
        notesList.forEach((note, index) => {
            const isLocked = Boolean(note.pinCode && !state.unlockedNotes.has(note.id));
            const card = document.createElement('div');
            const colorClass = (note.color && note.color !== 'default') ? note.color : accentThemes[index % accentThemes.length];
            card.className = `note-card ${colorClass}`;
            card.dataset.id = note.id;

            const readStats = calculateReadingTime(note.content);

            let previewText = isLocked ? '🔒 Private Note (PIN Protected)' : parseMarkdown(note.content);
            let tagsHtml = (note.tags || []).map(t => `<span class="tag-pill">#${escapeHtml(t)}</span>`).join('');

            card.innerHTML = `
                <div class="note-header">
                    <div class="note-title">${isLocked ? '🔒 Locked Note' : escapeHtml(note.title)}</div>
                    <div class="note-actions">
                        <button class="action-icon-btn ${note.pinned ? 'pinned' : ''}" title="Pin Note" data-action="pin">📌</button>
                        <button class="action-icon-btn" title="Duplicate Note" data-action="duplicate">📋</button>
                        <button class="action-icon-btn" title="Export Note" data-action="export">📥</button>
                        <button class="action-icon-btn" title="${note.archived ? 'Unarchive' : 'Archive'}" data-action="archive">📦</button>
                        <button class="action-icon-btn" title="Delete Note" data-action="delete" style="color: var(--danger-color);">🗑️</button>
                    </div>
                </div>

                <span class="note-category-badge">${escapeHtml(note.category)}</span>

                <div class="note-content-preview">${previewText}</div>

                <div class="note-tags">${tagsHtml}</div>

                <div class="note-footer">
                    <span>${new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span class="read-time">⏱️ ${readStats.time}</span>
                </div>
            `;

            // Card Click Event for Edit or Unlock
            card.addEventListener('click', (e) => {
                // If action button was clicked, don't open full editor modal
                if (e.target.closest('.note-actions')) return;

                if (isLocked) {
                    openPinModal(note.id);
                } else {
                    openNoteModal(note.id);
                }
            });

            // Action Button Event Handlers
            const actionsContainer = card.querySelector('.note-actions');
            actionsContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;
                const action = btn.dataset.action;

                if (action === 'pin') togglePin(note.id);
                else if (action === 'duplicate') duplicateNote(note.id);
                else if (action === 'export') exportNotePrompt(note);
                else if (action === 'archive') toggleArchive(note.id);
                else if (action === 'delete') confirmDelete(note.id);
            });

            container.appendChild(card);
        });
    }

    // --- Note Actions API Handlers ---
    async function togglePin(id) {
        try {
            const res = await fetch(`/api/notes/${id}/pin`, { method: 'PATCH' });
            if (res.ok) {
                await fetchNotes();
                renderCurrentView();
                showToast('Pin status updated', 'success');
            }
        } catch (err) {
            showToast('Failed to toggle pin', 'error');
        }
    }

    async function toggleArchive(id) {
        try {
            const res = await fetch(`/api/notes/${id}/archive`, { method: 'PATCH' });
            if (res.ok) {
                await fetchNotes();
                renderCurrentView();
                showToast('Archive status updated', 'success');
            }
        } catch (err) {
            showToast('Failed to toggle archive', 'error');
        }
    }

    async function duplicateNote(id) {
        try {
            const res = await fetch(`/api/notes/${id}/duplicate`, { method: 'POST' });
            if (res.ok) {
                await fetchNotes();
                renderCurrentView();
                showToast('Note duplicated successfully!', 'success');
            }
        } catch (err) {
            showToast('Failed to duplicate note', 'error');
        }
    }

    function exportNotePrompt(note) {
        const format = prompt('Export Note Format: Type "md" for Markdown, "txt" for Plain Text, or "html" for Web HTML', 'md');
        if (!format) return;

        let content = '';
        let filename = `${note.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        let mimeType = 'text/plain';

        if (format.toLowerCase() === 'md') {
            content = `# ${note.title}\nCategory: ${note.category}\nTags: ${note.tags.join(', ')}\n\n${note.content}`;
            filename += '.md';
            mimeType = 'text/markdown';
        } else if (format.toLowerCase() === 'html') {
            content = `<!DOCTYPE html><html><head><title>${escapeHtml(note.title)}</title></head><body><h1>${escapeHtml(note.title)}</h1><div>${parseMarkdown(note.content)}</div></body></html>`;
            filename += '.html';
            mimeType = 'text/html';
        } else {
            content = `${note.title}\n====================\n\n${note.content}`;
            filename += '.txt';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Exported ${filename}`, 'success');
    }

    function confirmDelete(id) {
        state.deleteTargetId = id;
        elements.deleteModal.classList.remove('hidden');
    }

    elements.confirmDeleteBtn.addEventListener('click', async () => {
        if (!state.deleteTargetId) return;
        try {
            const res = await fetch(`/api/notes/${state.deleteTargetId}`, { method: 'DELETE' });
            if (res.ok) {
                elements.deleteModal.classList.add('hidden');
                await fetchNotes();
                renderCurrentView();
                showToast('Note deleted', 'success');
            }
        } catch (err) {
            showToast('Failed to delete note', 'error');
        }
    });

    elements.closeDeleteModalBtn.addEventListener('click', () => elements.deleteModal.classList.add('hidden'));
    elements.cancelDeleteBtn.addEventListener('click', () => elements.deleteModal.classList.add('hidden'));

    // --- PIN Unlock Protection Modal ---
    function openPinModal(id) {
        state.activeNoteId = id;
        elements.pinInput.value = '';
        elements.pinError.style.display = 'none';
        elements.pinVerifyModal.classList.remove('hidden');
        elements.pinInput.focus();
    }

    elements.submitPinBtn.addEventListener('click', () => verifyPin());
    elements.pinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') verifyPin();
    });

    function verifyPin() {
        const note = state.notes.find(n => n.id === state.activeNoteId);
        if (!note) return;

        if (elements.pinInput.value.trim() === note.pinCode) {
            state.unlockedNotes.add(note.id);
            elements.pinVerifyModal.classList.add('hidden');
            openNoteModal(note.id);
            showToast('Note unlocked', 'success');
        } else {
            elements.pinError.style.display = 'block';
        }
    }

    elements.closePinModal.addEventListener('click', () => elements.pinVerifyModal.classList.add('hidden'));
    elements.cancelPinBtn.addEventListener('click', () => elements.pinVerifyModal.classList.add('hidden'));

    // --- Calendar View Renderer ---
    function renderCalendar() {
        const year = state.currentCalendarDate.getFullYear();
        const month = state.currentCalendarDate.getMonth();

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        elements.calMonthTitle.textContent = `${monthNames[month]} ${year}`;

        elements.calendarGrid.innerHTML = '';

        // Day Headers
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(d => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.textContent = d;
            elements.calendarGrid.appendChild(header);
        });

        // Date Calculations
        const firstDayIndex = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        // Empty cells for previous month overflow
        for (let i = 0; i < firstDayIndex; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-cell empty';
            elements.calendarGrid.appendChild(emptyCell);
        }

        // Active Days of Month
        for (let day = 1; day <= totalDays; day++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';

            if (today.getFullYear() === year && today.getMonth() === month && today.getDate() === day) {
                cell.classList.add('today');
            }

            const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayNotes = state.notes.filter(n => {
                if (n.archived) return false;
                const createdDate = new Date(n.createdAt).toISOString().split('T')[0];
                return createdDate === cellDateStr;
            });

            let notesListHtml = dayNotes.map(n => `<div class="calendar-note-item">${escapeHtml(n.title)}</div>`).join('');

            cell.innerHTML = `
                <div class="day-number">${day}</div>
                <div class="calendar-notes-list">${notesListHtml}</div>
            `;

            cell.addEventListener('click', () => {
                openNoteModal(null, cellDateStr);
            });

            elements.calendarGrid.appendChild(cell);
        }
    }

    elements.calPrevBtn.addEventListener('click', () => {
        state.currentCalendarDate.setMonth(state.currentCalendarDate.getMonth() - 1);
        renderCalendar();
    });

    elements.calNextBtn.addEventListener('click', () => {
        state.currentCalendarDate.setMonth(state.currentCalendarDate.getMonth() + 1);
        renderCalendar();
    });

    // --- Kanban View Renderer ---
    function renderKanban() {
        const activeNotes = state.notes.filter(n => !n.archived);

        const todo = activeNotes.filter(n => (n.status || 'Todo') === 'Todo');
        const progress = activeNotes.filter(n => n.status === 'In Progress');
        const done = activeNotes.filter(n => n.status === 'Done');
        const ideas = activeNotes.filter(n => n.status === 'Ideas');

        elements.kanbanCountTodo.textContent = todo.length;
        elements.kanbanCountProgress.textContent = progress.length;
        elements.kanbanCountDone.textContent = done.length;
        elements.kanbanCountIdeas.textContent = ideas.length;

        renderKanbanCards(todo, elements.kanbanCardsTodo);
        renderKanbanCards(progress, elements.kanbanCardsProgress);
        renderKanbanCards(done, elements.kanbanCardsDone);
        renderKanbanCards(ideas, elements.kanbanCardsIdeas);
    }

    function renderKanbanCards(notesList, container) {
        container.innerHTML = '';
        notesList.forEach(note => {
            const card = document.createElement('div');
            card.className = `note-card ${note.color || ''}`;
            card.style.padding = '14px';
            card.style.cursor = 'pointer';

            card.innerHTML = `
                <div style="font-weight: 700; font-size: 15px; margin-bottom: 6px;">${escapeHtml(note.title)}</div>
                <span class="note-category-badge" style="font-size: 10px;">${escapeHtml(note.category)}</span>
                <p style="font-size: 12px; color: var(--text-secondary); margin-top: 6px;">${escapeHtml(note.content.substring(0, 70))}...</p>
            `;

            card.addEventListener('click', () => openNoteModal(note.id));
            container.appendChild(card);
        });
    }

    // --- Note Modal (Create & Edit) ---
    elements.newNoteBtn.addEventListener('click', () => openNoteModal());

    function openNoteModal(id = null, presetDate = null) {
        state.activeNoteId = id;
        elements.noteForm.reset();

        if (id) {
            const note = state.notes.find(n => n.id === id);
            if (!note) return;

            elements.modalTitle.textContent = 'Edit Note';
            elements.noteIdInput.value = note.id;
            elements.noteTitleInput.value = note.title;
            elements.noteCategorySelect.value = note.category;
            elements.noteStatusSelect.value = note.status || 'Todo';
            elements.noteColorSelect.value = note.color || 'default';
            elements.notePinInput.value = note.pinCode || '';
            elements.noteTagsInput.value = (note.tags || []).join(', ');
            elements.noteBodyInput.value = note.content;
        } else {
            elements.modalTitle.textContent = 'New Note';
            elements.noteIdInput.value = '';
            if (presetDate) showToast(`New note for ${presetDate}`, 'info');
        }

        updateWordCountBadge();
        showEditorTab('write');
        elements.noteModal.classList.remove('hidden');
        elements.noteTitleInput.focus();
    }

    elements.closeModalBtn.addEventListener('click', () => elements.noteModal.classList.add('hidden'));
    elements.cancelNoteBtn.addEventListener('click', () => elements.noteModal.classList.add('hidden'));

    // Note Form Submit
    elements.noteForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = elements.noteIdInput.value;
        const title = elements.noteTitleInput.value.trim();
        const category = elements.noteCategorySelect.value;
        const status = elements.noteStatusSelect.value;
        const color = elements.noteColorSelect.value;
        const pinCode = elements.notePinInput.value.trim() || null;
        const tags = elements.noteTagsInput.value.split(',').map(t => t.trim()).filter(Boolean);
        const content = elements.noteBodyInput.value.trim();

        if (!title || !content || !category) {
            showToast('Title, content, and category are required', 'error');
            return;
        }

        const payload = { title, category, status, color, pinCode, tags, content };

        try {
            let res;
            if (id) {
                res = await fetch(`/api/notes/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch('/api/notes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                elements.noteModal.classList.add('hidden');
                await fetchNotes();
                await fetchCategories();
                renderCurrentView();
                showToast(id ? 'Note updated!' : 'Note created successfully!', 'success');
            } else {
                const data = await res.json();
                showToast(data.error || 'Failed to save note', 'error');
            }
        } catch (err) {
            showToast('Error saving note', 'error');
        }
    });

    // --- Editor Tabs & Markdown Live Preview ---
    elements.tabWrite.addEventListener('click', () => showEditorTab('write'));
    elements.tabPreview.addEventListener('click', () => showEditorTab('preview'));

    function showEditorTab(tab) {
        if (tab === 'write') {
            elements.tabWrite.classList.add('active');
            elements.tabPreview.classList.remove('active');
            elements.editorTextareaWrapper.classList.remove('hidden');
            elements.editorPreviewWrapper.classList.add('hidden');
            elements.editorToolbar.classList.remove('hidden');
        } else {
            elements.tabPreview.classList.add('active');
            elements.tabWrite.classList.remove('active');
            elements.editorTextareaWrapper.classList.add('hidden');
            elements.editorPreviewWrapper.classList.remove('hidden');
            elements.editorToolbar.classList.add('hidden');
            // Render preview immediately on tab switch
            updateLivePreview();
        }
    }

    function updateLivePreview() {
        if (!elements.editorPreviewWrapper.classList.contains('hidden')) {
            const rendered = parseMarkdown(elements.noteBodyInput.value);
            elements.editorPreviewWrapper.innerHTML = rendered || '<p style="color: var(--text-muted); font-style: italic;">Nothing to preview yet. Switch to Write tab and type something!</p>';
        }
    }

    elements.noteBodyInput.addEventListener('input', () => {
        updateWordCountBadge();
        updateLivePreview(); // Keep preview in sync if it's open
    });

    function updateWordCountBadge() {
        const stats = calculateReadingTime(elements.noteBodyInput.value);
        elements.wordCountBadge.textContent = `${stats.words} words • ${stats.time}`;
    }

    // Toolbar Buttons (Bold, Italic, Code, etc.)
    elements.editorToolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn || btn.id === 'voice-dictate-btn') return;

        const cmd = btn.dataset.cmd;
        const textarea = elements.noteBodyInput;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selText = textarea.value.substring(start, end);

        let insert = '';
        if (cmd === 'bold') insert = `**${selText || 'bold text'}**`;
        else if (cmd === 'italic') insert = `*${selText || 'italic text'}*`;
        else if (cmd === 'h2') insert = `\n## ${selText || 'Heading 2'}\n`;
        else if (cmd === 'code') insert = `\`\`\`\n${selText || 'code snippet'}\n\`\`\``;
        else if (cmd === 'ul') insert = `\n- ${selText || 'List item'}\n`;
        else if (cmd === 'todo') insert = `\n- [ ] ${selText || 'Todo task'}\n`;

        textarea.value = textarea.value.substring(0, start) + insert + textarea.value.substring(end);
        textarea.focus();
        updateWordCountBadge();
    });

    // --- Voice-to-Text Dictation (Web Speech API) ---
    function initVoiceDictation() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            elements.voiceDictateBtn.style.display = 'none';
            return;
        }

        state.recognition = new SpeechRecognition();
        state.recognition.continuous = true;
        state.recognition.interimResults = true;

        state.recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    transcript += event.results[i][0].transcript + ' ';
                }
            }
            if (transcript) {
                elements.noteBodyInput.value += (elements.noteBodyInput.value ? ' ' : '') + transcript;
                updateWordCountBadge();
            }
        };

        state.recognition.onerror = () => {
            stopDictation();
            showToast('Voice dictation error', 'error');
        };

        elements.voiceDictateBtn.addEventListener('click', () => {
            if (state.isDictating) stopDictation();
            else startDictation();
        });
    }

    function startDictation() {
        if (!state.recognition) return;
        state.recognition.start();
        state.isDictating = true;
        elements.voiceDictateBtn.classList.add('pulsing');
        elements.voiceDictateBtn.textContent = '⏹️ Stop Dictating';
        showToast('Listening... Speak clearly into your mic.', 'info');
    }

    function stopDictation() {
        if (!state.recognition) return;
        state.recognition.stop();
        state.isDictating = false;
        elements.voiceDictateBtn.classList.remove('pulsing');
        elements.voiceDictateBtn.textContent = '🎙️ Dictate';
    }

    // --- Command Palette (Ctrl + K) ---
    function getCommands() {
        const cmds = [
            { label: '✏️ Create New Note', action: () => openNoteModal() },
            { label: '📊 Go to Dashboard', action: () => switchView('dashboard') },
            { label: '📝 View All Notes', action: () => switchView('all') },
            { label: '📅 Open Calendar View', action: () => switchView('calendar') },
            { label: '📋 Open Kanban Board', action: () => switchView('kanban') },
            { label: '🎯 Open Focus Writing Mode', action: () => openFocusMode() },
            { label: '🌙 Toggle Theme (Dark/Light)', action: () => elements.themeToggleBtn.click() }
        ];
        if (state.currentUser && state.currentUser.role === 'admin') {
            cmds.push({ label: '⚙️ Open Admin Panel', action: () => window.location.href = '/admin' });
        }
        return cmds;
    }

    function switchView(view) {
        state.currentView = view;
        state.selectedCategory = null;
        renderCurrentView();
    }

    elements.commandPaletteBtn.addEventListener('click', () => openCommandPalette());

    function openCommandPalette() {
        elements.commandPaletteInput.value = '';
        renderCommandList(getCommands());
        elements.commandPaletteModal.classList.remove('hidden');
        elements.commandPaletteInput.focus();
    }

    elements.commandPaletteInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const baseCmds = getCommands();
        const filteredCmds = baseCmds.filter(c => c.label.toLowerCase().includes(query));
        
        // Also add matching notes to command palette results
        const matchingNotes = state.notes.filter(n => !n.archived && n.title.toLowerCase().includes(query)).slice(0, 5);
        matchingNotes.forEach(note => {
            filteredCmds.push({
                label: `📄 Open Note: ${note.title}`,
                action: () => openNoteModal(note.id)
            });
        });

        renderCommandList(filteredCmds);
    });

    function renderCommandList(items) {
        elements.commandPaletteList.innerHTML = '';
        items.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = `command-item ${index === 0 ? 'selected' : ''}`;
            li.textContent = item.label;

            li.addEventListener('click', () => {
                elements.commandPaletteModal.classList.add('hidden');
                item.action();
            });

            elements.commandPaletteList.appendChild(li);
        });
    }

    elements.commandPaletteModal.addEventListener('click', (e) => {
        if (e.target === elements.commandPaletteModal) {
            elements.commandPaletteModal.classList.add('hidden');
        }
    });

    // --- Search Input Bar ---
    elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim();
        if (state.searchQuery) {
            elements.clearSearchBtn.classList.remove('hidden');
            if (state.currentView === 'dashboard') state.currentView = 'all';
        } else {
            elements.clearSearchBtn.classList.add('hidden');
        }
        renderCurrentView();
    });

    elements.clearSearchBtn.addEventListener('click', () => {
        elements.searchInput.value = '';
        state.searchQuery = '';
        elements.clearSearchBtn.classList.add('hidden');
        renderCurrentView();
    });

    elements.sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        renderCurrentView();
    });

    // --- Fullscreen Focus Writing Mode ---
    elements.focusModeBtn.addEventListener('click', () => openFocusMode());

    function openFocusMode() {
        elements.focusTitle.value = '';
        elements.focusBody.value = '';
        elements.focusWordCount.textContent = '0 words';
        elements.focusModeOverlay.classList.remove('hidden');
        elements.focusTitle.focus();
    }

    elements.focusBody.addEventListener('input', () => {
        const stats = calculateReadingTime(elements.focusBody.value);
        elements.focusWordCount.textContent = `${stats.words} words • ${stats.time}`;
    });

    elements.focusExitBtn.addEventListener('click', () => elements.focusModeOverlay.classList.add('hidden'));

    elements.focusSaveBtn.addEventListener('click', async () => {
        const title = elements.focusTitle.value.trim() || 'Untitled Focus Document';
        const content = elements.focusBody.value.trim();

        if (!content) {
            showToast('Cannot save empty document', 'error');
            return;
        }

        try {
            const res = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content,
                    category: state.categories[0] || 'Personal',
                    tags: ['focus-mode']
                })
            });

            if (res.ok) {
                elements.focusModeOverlay.classList.add('hidden');
                await fetchNotes();
                renderCurrentView();
                showToast('Focus document saved as Note!', 'success');
            }
        } catch (err) {
            showToast('Failed to save focus document', 'error');
        }
    });

    // --- Floating Quick Scratchpad Widget ---
    function initScratchpad() {
        const savedScratch = localStorage.getItem('notenest_scratchpad') || '';
        elements.scratchpadText.value = savedScratch;
    }

    elements.scratchpadToggleBtn.addEventListener('click', () => {
        elements.scratchpadBox.classList.toggle('hidden');
        elements.scratchpadText.focus();
    });

    elements.closeScratchpad.addEventListener('click', () => {
        elements.scratchpadBox.classList.add('hidden');
    });

    elements.scratchpadText.addEventListener('input', () => {
        localStorage.setItem('notenest_scratchpad', elements.scratchpadText.value);
    });

    // --- Keyboard Shortcuts Engine ---
    document.addEventListener('keydown', (e) => {
        // Ctrl + K or Cmd + K: Command Palette
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            openCommandPalette();
        }

        // Ctrl + N or Cmd + N: New Note
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
            e.preventDefault();
            openNoteModal();
        }

        // Ctrl + Shift + F: Search Focus
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
            e.preventDefault();
            elements.searchInput.focus();
        }

        // Escape: Close all modals & overlays
        if (e.key === 'Escape') {
            elements.noteModal.classList.add('hidden');
            elements.commandPaletteModal.classList.add('hidden');
            elements.pinVerifyModal.classList.add('hidden');
            elements.deleteModal.classList.add('hidden');
            elements.focusModeOverlay.classList.add('hidden');
            elements.scratchpadBox.classList.add('hidden');
        }
    });

    // Mobile Sidebar Drawer Handlers
    elements.mobileMenuBtn.addEventListener('click', () => elements.sidebar.classList.add('mobile-open'));
    elements.mobileCloseBtn.addEventListener('click', () => elements.sidebar.classList.remove('mobile-open'));

    // Logout
    elements.logoutBtn.addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    });

    // Start App
    initApp();
});
