/* =============================================
   LIFE DASHBOARD — script.js
   TC-1 : Vanilla HTML/CSS/JS (no frameworks)
   TC-2 : LocalStorage persistence
   NFR-1: Responsive layout handled by CSS
   NFR-2: Consistent UI via CSS variables
   NFR-3: Readable, well-commented code
   =============================================
   Features:
   - Greeting  : time-aware + live date
   - Focus Timer: 25-min Pomodoro
   - To-Do List : CRUD + filter + duplicate prevention
   - Quick Links: CRUD + LocalStorage
   - Dark Mode  : toggle + persist
   - Custom Name: editable + persist
   ============================================= */

'use strict';

/* ─────────────────────────────────────────────
   SECTION 1 — STORAGE HELPERS (TC-2)
   ───────────────────────────────────────────── */
const KEYS = {
  theme:  'ld_theme',
  name:   'ld_name',
  todos:  'ld_todos',
  links:  'ld_links',
};

/** Read a JSON value from LocalStorage. Returns fallback if missing/corrupt. */
function lsGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/** Write any value as JSON to LocalStorage. */
function lsSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ─────────────────────────────────────────────
   SECTION 2 — UTILITY HELPERS
   ───────────────────────────────────────────── */

/** Generate a simple unique ID. */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Pad a number to 2 digits: 5 → "05". */
function pad(n) {
  return String(n).padStart(2, '0');
}

/** Show a toast notification for `duration` ms. */
let toastTimer = null;
function showToast(message, duration = 2400) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), duration);
}

/** Toggle visibility of an element via the 'hidden' class. */
function setVisible(el, visible) {
  el.classList.toggle('hidden', !visible);
}

/** Show an error message below a form field. */
function showError(el, msg) {
  el.textContent = msg;
  setVisible(el, true);
}

/** Clear an error message. */
function clearError(el) {
  el.textContent = '';
  setVisible(el, false);
}

/** Sanitise a string: trim whitespace, collapse inner spaces. */
function clean(str) {
  return str.trim().replace(/\s+/g, ' ');
}

/* ─────────────────────────────────────────────
   SECTION 3 — GREETING & LIVE CLOCK
   ───────────────────────────────────────────── */
const greetingEl   = document.getElementById('greeting-text');
const userNameEl   = document.getElementById('user-name');
const currentDateEl = document.getElementById('current-date');

/** Returns a time-aware greeting string. */
function getGreeting(hour) {
  if (hour < 5)  return 'Selamat Malam';
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 19) return 'Selamat Sore';
  return 'Selamat Malam';
}

/** Formats a Date to Indonesian locale string, e.g. "Rabu, 2 September 2026". */
function formatDate(date) {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
  });
}

/** Update greeting text and date display. Called once per minute. */
function updateGreeting() {
  const now  = new Date();
  greetingEl.textContent    = getGreeting(now.getHours()) + ',';
  currentDateEl.textContent = formatDate(now);
}

// Refresh once immediately, then every 60 s
updateGreeting();
setInterval(updateGreeting, 60_000);

/* ─────────────────────────────────────────────
   SECTION 4 — CUSTOM NAME  (Optional Feature 2)
   ───────────────────────────────────────────── */
const btnEditName   = document.getElementById('btn-edit-name');
const modalName     = document.getElementById('modal-name');
const inputName     = document.getElementById('input-name');
const btnSaveName   = document.getElementById('btn-save-name');
const btnCancelName = document.getElementById('btn-cancel-name');

/** Load persisted name into the header display. */
function loadName() {
  const saved = lsGet(KEYS.name, 'Pengguna');
  userNameEl.textContent = saved;
}

/** Open the edit-name modal. */
function openNameModal() {
  inputName.value = lsGet(KEYS.name, '');
  setVisible(modalName, true);
  inputName.focus();
}

/** Close the edit-name modal. */
function closeNameModal() {
  setVisible(modalName, false);
}

/** Save the new name to storage and update the display. */
function saveName() {
  const val = clean(inputName.value);
  if (!val) {
    inputName.focus();
    return;
  }
  lsSet(KEYS.name, val);
  userNameEl.textContent = val;
  closeNameModal();
  showToast(`✅ Nama diubah ke "${val}"`);
}

btnEditName.addEventListener('click', openNameModal);
btnSaveName.addEventListener('click', saveName);
btnCancelName.addEventListener('click', closeNameModal);

// Save on Enter key inside the modal input
inputName.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveName();
  if (e.key === 'Escape') closeNameModal();
});

// Close modal when clicking the backdrop
modalName.addEventListener('click', (e) => {
  if (e.target === modalName) closeNameModal();
});

loadName();

/* ─────────────────────────────────────────────
   SECTION 5 — DARK MODE  (Optional Feature 1)
   ───────────────────────────────────────────── */
const btnToggleTheme = document.getElementById('btn-toggle-theme');

/** Apply theme class to <body> and persist to LocalStorage. */
function applyTheme(theme) {
  document.body.classList.toggle('dark',  theme === 'dark');
  document.body.classList.toggle('light', theme !== 'dark');
  btnToggleTheme.textContent = theme === 'dark' ? '☀️' : '🌙';
  btnToggleTheme.setAttribute('title', theme === 'dark' ? 'Mode Terang' : 'Mode Gelap');
}

/** Toggle between dark and light, persist choice. */
function toggleTheme() {
  const current = lsGet(KEYS.theme, 'light');
  const next    = current === 'dark' ? 'light' : 'dark';
  lsSet(KEYS.theme, next);
  applyTheme(next);
  showToast(next === 'dark' ? '🌙 Mode Gelap aktif' : '☀️ Mode Terang aktif');
}

btnToggleTheme.addEventListener('click', toggleTheme);

// Load persisted theme immediately (before first paint)
applyTheme(lsGet(KEYS.theme, 'light'));

/* ─────────────────────────────────────────────
   SECTION 6 — FOCUS TIMER  (MVP)
   ───────────────────────────────────────────── */
const FOCUS_DURATION = 25 * 60; // seconds

const timerMinEl   = document.getElementById('timer-minutes');
const timerSecEl   = document.getElementById('timer-seconds');
const timerLabel   = document.getElementById('timer-label');
const timerFill    = document.getElementById('timer-progress-fill');
const btnStart     = document.getElementById('btn-timer-start');
const btnPause     = document.getElementById('btn-timer-pause');
const btnReset     = document.getElementById('btn-timer-reset');

let timerInterval  = null;
let timeRemaining  = FOCUS_DURATION;
let timerRunning   = false;

/** Render the current time remaining to the DOM. */
function renderTimer() {
  const m = Math.floor(timeRemaining / 60);
  const s = timeRemaining % 60;
  timerMinEl.textContent = pad(m);
  timerSecEl.textContent = pad(s);

  // Update progress bar width (100% → 0%)
  const pct = (timeRemaining / FOCUS_DURATION) * 100;
  timerFill.style.width = pct + '%';
}

/** Start or resume the countdown. */
function startTimer() {
  if (timerRunning) return;
  timerRunning = true;

  btnStart.disabled = true;
  btnPause.disabled = false;

  timerInterval = setInterval(() => {
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      timerRunning  = false;
      timerLabel.textContent = '🎉 Sesi selesai!';
      btnStart.disabled = false;
      btnPause.disabled = true;
      showToast('⏰ Focus session selesai! Istirahat dulu ya.');
      return;
    }
    timeRemaining--;
    renderTimer();
  }, 1000);
}

/** Pause the countdown. */
function pauseTimer() {
  clearInterval(timerInterval);
  timerRunning  = false;
  btnStart.disabled = false;
  btnPause.disabled = true;
  timerLabel.textContent = 'Dijeda';
}

/** Reset timer back to 25:00. */
function resetTimer() {
  clearInterval(timerInterval);
  timerRunning      = false;
  timeRemaining     = FOCUS_DURATION;
  timerLabel.textContent = 'Sesi Fokus';
  btnStart.disabled = false;
  btnPause.disabled = true;
  renderTimer();
}

btnStart.addEventListener('click', startTimer);
btnPause.addEventListener('click', pauseTimer);
btnReset.addEventListener('click', resetTimer);

// Initial render
renderTimer();

/* ─────────────────────────────────────────────
   SECTION 7 — TO-DO LIST  (MVP + Optional Feat 3)
   ───────────────────────────────────────────── */
const formTodo    = document.getElementById('form-todo');
const inputTodo   = document.getElementById('input-todo');
const todoErrorEl = document.getElementById('todo-error');
const todoListEl  = document.getElementById('todo-list');
const todoEmpty   = document.getElementById('todo-empty');
const todoCounter = document.getElementById('todo-counter');
const btnClearDone = document.getElementById('btn-clear-done');
const btnMarkAll   = document.getElementById('btn-mark-all');
const filterBtns   = document.querySelectorAll('.filter-btn');

let todos       = lsGet(KEYS.todos, []);  // Array of { id, text, done }
let activeFilter = 'all';                 // 'all' | 'active' | 'done'

/** Persist todos to LocalStorage. */
function saveTodos() {
  lsSet(KEYS.todos, todos);
}

/** Return todos matching the active filter. */
function getFiltered() {
  switch (activeFilter) {
    case 'active': return todos.filter(t => !t.done);
    case 'done':   return todos.filter(t =>  t.done);
    default:       return todos;
  }
}

/** Update the "X / Y" badge. */
function updateCounter() {
  const done  = todos.filter(t => t.done).length;
  const total = todos.length;
  todoCounter.textContent = `${done} / ${total}`;
}

/** Build and render the visible task list. */
function renderTodos() {
  todoListEl.innerHTML = '';
  const visible = getFiltered();

  setVisible(todoEmpty, visible.length === 0);

  visible.forEach(todo => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' done' : '');
    li.dataset.id = todo.id;
    li.setAttribute('role', 'listitem');

    li.innerHTML = `
      <button
        class="todo-item__checkbox"
        aria-label="${todo.done ? 'Tandai belum selesai' : 'Tandai selesai'}"
        title="${todo.done ? 'Tandai belum selesai' : 'Tandai selesai'}"
      >${todo.done ? '✓' : ''}</button>
      <span class="todo-item__text">${escapeHtml(todo.text)}</span>
      <div class="todo-item__actions">
        <button class="btn-action edit"   title="Edit tugas"   aria-label="Edit tugas">✏️</button>
        <button class="btn-action delete" title="Hapus tugas"  aria-label="Hapus tugas">🗑</button>
      </div>`;

    // Checkbox: toggle done
    li.querySelector('.todo-item__checkbox').addEventListener('click', () => toggleDone(todo.id));
    // Edit button
    li.querySelector('.btn-action.edit').addEventListener('click', () => enterEditMode(li, todo));
    // Delete button
    li.querySelector('.btn-action.delete').addEventListener('click', () => deleteTask(todo.id));

    todoListEl.appendChild(li);
  });

  updateCounter();
}

/** Escape HTML to prevent XSS when inserting user text. */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Toggle the done state of a task by ID. */
function toggleDone(id) {
  const task = todos.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  saveTodos();
  renderTodos();
}

/** Delete a task by ID. */
function deleteTask(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
  showToast('🗑 Tugas dihapus');
}

/**
 * Enter inline-edit mode for a task item.
 * Replaces the text span with an input field.
 */
function enterEditMode(li, todo) {
  const textEl    = li.querySelector('.todo-item__text');
  const actionsEl = li.querySelector('.todo-item__actions');

  // Replace text span with input
  const editInput = document.createElement('input');
  editInput.type      = 'text';
  editInput.className = 'todo-item__edit-input';
  editInput.value     = todo.text;
  editInput.maxLength = 100;
  editInput.setAttribute('aria-label', 'Edit teks tugas');
  li.replaceChild(editInput, textEl);

  // Replace action buttons with save/cancel
  actionsEl.innerHTML = `
    <button class="btn-action save"   title="Simpan" aria-label="Simpan perubahan">💾</button>
    <button class="btn-action delete" title="Batal"  aria-label="Batal edit">✕</button>`;

  editInput.focus();
  editInput.select();

  const saveEdit = () => {
    const newText = clean(editInput.value);
    if (!newText) {
      editInput.focus();
      return;
    }

    // Prevent duplicate on edit (Optional Feature 3)
    const duplicate = todos.find(
      t => t.id !== todo.id && t.text.toLowerCase() === newText.toLowerCase()
    );
    if (duplicate) {
      showToast('⚠️ Tugas dengan nama ini sudah ada!');
      editInput.focus();
      return;
    }

    todo.text = newText;
    saveTodos();
    renderTodos();
    showToast('✅ Tugas diperbarui');
  };

  actionsEl.querySelector('.btn-action.save').addEventListener('click', saveEdit);
  actionsEl.querySelector('.btn-action.delete').addEventListener('click', renderTodos); // cancel
  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  saveEdit();
    if (e.key === 'Escape') renderTodos();
  });
}

/** Add a new task. Includes duplicate prevention (Optional Feature 3). */
function addTask(text) {
  clearError(todoErrorEl);

  const trimmed = clean(text);

  // Validation: not empty
  if (!trimmed) {
    showError(todoErrorEl, '⚠️ Tugas tidak boleh kosong.');
    inputTodo.focus();
    return;
  }

  // Optional Feature 3 — Prevent Duplicate Tasks
  const duplicate = todos.find(t => t.text.toLowerCase() === trimmed.toLowerCase());
  if (duplicate) {
    showError(todoErrorEl, '⚠️ Tugas ini sudah ada dalam daftar.');
    inputTodo.focus();
    return;
  }

  todos.push({ id: uid(), text: trimmed, done: false });
  saveTodos();
  renderTodos();
  inputTodo.value = '';
  showToast('✅ Tugas ditambahkan!');
}

/** Handle the to-do form submission. */
formTodo.addEventListener('submit', (e) => {
  e.preventDefault();
  addTask(inputTodo.value);
});

/** Clear the error when the user starts typing again. */
inputTodo.addEventListener('input', () => clearError(todoErrorEl));

/** Filter buttons. */
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderTodos();
  });
});

/** Bulk: clear all completed tasks. */
btnClearDone.addEventListener('click', () => {
  const count = todos.filter(t => t.done).length;
  if (count === 0) { showToast('Tidak ada tugas selesai untuk dihapus.'); return; }
  todos = todos.filter(t => !t.done);
  saveTodos();
  renderTodos();
  showToast(`🗑 ${count} tugas selesai dihapus`);
});

/** Bulk: mark all tasks as done. */
btnMarkAll.addEventListener('click', () => {
  if (todos.length === 0) { showToast('Belum ada tugas.'); return; }
  const allDone = todos.every(t => t.done);
  todos.forEach(t => { t.done = !allDone; });
  saveTodos();
  renderTodos();
  showToast(allDone ? '↩ Semua tugas ditandai aktif' : '✔ Semua tugas ditandai selesai');
});

// Initial render
renderTodos();

/* ─────────────────────────────────────────────
   SECTION 8 — QUICK LINKS  (MVP)
   ───────────────────────────────────────────── */
const btnAddLink    = document.getElementById('btn-add-link');
const formLink      = document.getElementById('form-link');
const inputLinkLabel = document.getElementById('input-link-label');
const inputLinkUrl  = document.getElementById('input-link-url');
const linkErrorEl   = document.getElementById('link-error');
const btnCancelLink = document.getElementById('btn-cancel-link');
const linksListEl   = document.getElementById('links-list');
const linksEmpty    = document.getElementById('links-empty');

let links = lsGet(KEYS.links, []); // Array of { id, label, url }

/** Persist links to LocalStorage. */
function saveLinks() {
  lsSet(KEYS.links, links);
}

/** Render all quick links. */
function renderLinks() {
  linksListEl.innerHTML = '';
  setVisible(linksEmpty, links.length === 0);

  links.forEach(link => {
    const li = document.createElement('li');
    li.className = 'link-item';
    li.dataset.id = link.id;

    li.innerHTML = `
      <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
        🔗 ${escapeHtml(link.label)}
      </a>
      <div class="link-item__actions">
        <button class="btn-icon-sm" title="Hapus link" aria-label="Hapus link ${escapeHtml(link.label)}">🗑</button>
      </div>`;

    li.querySelector('.btn-icon-sm').addEventListener('click', () => deleteLink(link.id));
    linksListEl.appendChild(li);
  });
}

/** Delete a link by ID. */
function deleteLink(id) {
  links = links.filter(l => l.id !== id);
  saveLinks();
  renderLinks();
  showToast('🗑 Link dihapus');
}

/** Show / hide the add-link form. */
function openLinkForm() {
  setVisible(formLink, true);
  btnAddLink.disabled = true;
  inputLinkLabel.focus();
}

function closeLinkForm() {
  setVisible(formLink, false);
  btnAddLink.disabled = false;
  inputLinkLabel.value = '';
  inputLinkUrl.value   = '';
  clearError(linkErrorEl);
}

/** Validate and add a new link. */
function addLink(e) {
  e.preventDefault();
  clearError(linkErrorEl);

  const label = clean(inputLinkLabel.value);
  const url   = clean(inputLinkUrl.value);

  if (!label) {
    showError(linkErrorEl, '⚠️ Nama link tidak boleh kosong.');
    inputLinkLabel.focus();
    return;
  }

  if (!url) {
    showError(linkErrorEl, '⚠️ URL tidak boleh kosong.');
    inputLinkUrl.focus();
    return;
  }

  // Basic URL validation
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Protocol not allowed');
    }
  } catch {
    showError(linkErrorEl, '⚠️ URL tidak valid. Gunakan format https://...');
    inputLinkUrl.focus();
    return;
  }

  links.push({ id: uid(), label, url });
  saveLinks();
  renderLinks();
  closeLinkForm();
  showToast(`✅ Link "${label}" ditambahkan!`);
}

btnAddLink.addEventListener('click', openLinkForm);
btnCancelLink.addEventListener('click', closeLinkForm);
formLink.addEventListener('submit', addLink);

// Clear error on input change
inputLinkLabel.addEventListener('input', () => clearError(linkErrorEl));
inputLinkUrl.addEventListener('input',   () => clearError(linkErrorEl));

// Initial render
renderLinks();

/* ─────────────────────────────────────────────
   SECTION 9 — KEYBOARD ACCESSIBILITY
   ───────────────────────────────────────────── */

// Close name modal with Escape from anywhere
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modalName.classList.contains('hidden')) {
    closeNameModal();
  }
});
