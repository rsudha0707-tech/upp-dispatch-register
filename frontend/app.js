const API_URL = 'http://127.0.0.1:8002';
let token = localStorage.getItem('daak_token');
let currentUser = JSON.parse(localStorage.getItem('daak_user') || 'null');
let allUsers = [];

// DOM Elements
const authView = document.getElementById('auth-view');
const appView = document.getElementById('app-view');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const registerForm = document.getElementById('register-form');
const registerError = document.getElementById('register-error');
const userWelcome = document.getElementById('user-welcome');

// Initialize
function init() {
    console.log("App Initializing...");
    if (token && currentUser) {
        console.log("Session found for user:", currentUser.username, "ID:", currentUser.id);
        showApp();
        loadDashboard();
        fetchUsers();
    } else {
        console.log("No session found, showing login.");
        showAuth();
    }
}

// Navigation
function showAuth() {
    authView.classList.remove('hidden');
    appView.classList.add('hidden');
}

function showApp() {
    authView.classList.add('hidden');
    appView.classList.remove('hidden');
    userWelcome.innerText = `Welcome, ${currentUser.username} (${currentUser.role}) [ID: ${currentUser.id}]`;
}

function toggleAuthMode() {
    const loginSec = document.getElementById('login-section');
    const registerSec = document.getElementById('register-section');
    loginSec.classList.toggle('hidden');
    registerSec.classList.toggle('hidden');
}

function navigate(viewId) {
    console.log("Navigating to:", viewId);
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    const viewEl = document.getElementById(`view-${viewId}`);
    if (viewEl) viewEl.classList.remove('hidden');
    
    const activeNav = Array.from(document.querySelectorAll('.nav-item')).find(el => el.getAttribute('onclick')?.includes(`'${viewId}'`));
    if(activeNav) activeNav.classList.add('active');

    // Load data based on view
    if (viewId === 'dashboard') loadDashboard();
    if (viewId === 'my-tasks') loadMyTasks();
    if (viewId === 'all-daaks') loadAllDaaks();
    if (viewId === 'new-daak') fetchUsers();
}

// Auth - Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const res = await fetch(`${API_URL}/auth/token`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error('Invalid credentials');

        const data = await res.json();
        token = data.access_token;
        currentUser = data.user;
        
        localStorage.setItem('daak_token', token);
        localStorage.setItem('daak_user', JSON.stringify(currentUser));
        
        loginError.style.display = 'none';
        showApp();
        loadDashboard();
        fetchUsers();
    } catch (err) {
        loginError.innerText = err.message;
        loginError.style.display = 'block';
    }
});

// Auth - Register
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        username: document.getElementById('reg-username').value,
        email: document.getElementById('reg-email').value,
        mobile_number: document.getElementById('reg-mobile').value,
        role: document.getElementById('reg-role').value,
        password: document.getElementById('reg-password').value
    };

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Registration failed');
        }

        alert('Registration successful! Please login.');
        toggleAuthMode();
        registerError.style.display = 'none';
    } catch (err) {
        registerError.innerText = err.message;
        registerError.style.display = 'block';
    }
});

function logout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('daak_token');
    localStorage.removeItem('daak_user');
    showAuth();
}

// Fetch helper with auth
async function fetchWithAuth(url, options = {}) {
    if (!token) {
        logout();
        throw new Error('Not authenticated');
    }
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };
    
    const res = await fetch(`${API_URL}${url}`, { ...options, headers });
    if (res.status === 401) {
        logout();
        throw new Error('Session expired');
    }
    return res;
}

// Data Fetching & Rendering
async function fetchUsers() {
    try {
        console.log("Fetching users list...");
        const res = await fetchWithAuth('/auth/users');
        allUsers = await res.json();
        
        const routingSelect = document.getElementById('daak-routing');
        const actionNextRecipient = document.getElementById('action-next-recipient');
        
        const populateSelect = (selectEl) => {
            if (!selectEl) return;
            selectEl.innerHTML = '<option value="" disabled selected>Select Recipient</option>';
            allUsers.forEach(u => {
                // Allow routing to any user including self if needed, but usually others
                const opt = document.createElement('option');
                opt.value = u.id;
                opt.text = `${u.username} (${u.role})`;
                selectEl.appendChild(opt);
            });
        };

        populateSelect(routingSelect);
        populateSelect(actionNextRecipient);
        console.log("Users dropdowns updated.");
    } catch(e) {
        console.error("Error fetching users:", e);
    }
}

async function loadDashboard() {
    try {
        const res = await fetchWithAuth('/daak/dashboard');
        const stats = await res.json();
        
        document.getElementById('stat-total').innerText = stats.total_received;
        document.getElementById('stat-pending').innerText = stats.pending;
        document.getElementById('stat-completed').innerText = stats.completed;
        document.getElementById('stat-mytasks').innerText = stats.my_assigned;
        lucide.createIcons();
    } catch(e) {
        console.error(e);
    }
}

// Format Date
function formatDate(isoStr) {
    if (!isoStr) return 'N/A';
    return new Date(isoStr).toLocaleString();
}

// Badges
function getStatusBadge(status) {
    const s = status.toLowerCase();
    if (s === 'pending') return `<span class="badge badge-pending">Pending</span>`;
    if (s === 'read') return `<span class="badge badge-read">Read</span>`;
    if (s === 'completed') return `<span class="badge badge-completed">Completed</span>`;
    return `<span class="badge" style="background: gray">${status}</span>`;
}

// Create Daak
document.getElementById('daak-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const recipientId = document.getElementById('daak-routing').value;
    if (!recipientId) {
        alert("Please select a recipient");
        return;
    }

    const formData = new FormData();
    formData.append('letter_no', document.getElementById('daak-letter-no').value);
    formData.append('subject', document.getElementById('daak-subject').value);
    formData.append('sender', document.getElementById('daak-sender').value);
    formData.append('department', document.getElementById('daak-department').value);
    formData.append('recipient_id', recipientId);
    
    const remarks = document.getElementById('daak-remarks').value;
    if (remarks) formData.append('remarks', remarks);
    
    const fileInput = document.getElementById('daak-file');
    if (fileInput.files[0]) {
        formData.append('file', fileInput.files[0]);
    }

    try {
        const res = await fetchWithAuth('/daak/', {
            method: 'POST',
            body: formData
        });
        
        if (res.ok) {
            alert('Daak created and sent successfully!');
            document.getElementById('daak-form').reset();
            navigate('dashboard');
        } else {
            const data = await res.json();
            alert(`Error: ${data.detail}`);
        }
    } catch(e) {
        console.error(e);
        alert('An error occurred');
    }
});

// Load Tasks
async function loadMyTasks() {
    try {
        console.log("Loading tasks for current user ID:", currentUser.id);
        const res = await fetchWithAuth('/daak/my-tasks');
        const tasks = await res.json();
        console.log("Tasks received:", tasks);
        
        const tbody = document.querySelector('#my-tasks-table tbody');
        tbody.innerHTML = '';
        
        if (tasks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">No pending tasks assigned to you.</td></tr>';
            return;
        }
        
        tasks.forEach(task => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${task.daak_id}</strong></td>
                <td>${task.letter_no}</td>
                <td>${task.subject}</td>
                <td>${task.sender}</td>
                <td>${formatDate(task.date_received)}</td>
                <td>${getStatusBadge(task.status)}</td>
                <td>
                    <div style="display: flex; gap: 5px;">
                        ${task.status === 'Pending' ? `<button class="action-btn btn-read" onclick="openActionModal(${task.id}, 'Read')" title="Mark as Read">Read</button>` : ''}
                        <button class="action-btn btn-forward" onclick="openActionModal(${task.id}, 'Forward')" title="Forward to someone else">Forward</button>
                        <button class="action-btn btn-history" style="background: var(--success); color: white;" onclick="openActionModal(${task.id}, 'Complete')" title="Finish work on this document">Complete</button>
                        <button class="action-btn btn-history" onclick="viewHistory(${task.id})" title="View tracking history">History</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch(e) {
        console.error("Error loading tasks:", e);
    }
}

async function loadAllDaaks() {
    try {
        const res = await fetchWithAuth('/daak/all');
        const daaks = await res.json();
        const tbody = document.querySelector('#all-daaks-table tbody');
        tbody.innerHTML = '';
        
        if (daaks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">No documents found in the system.</td></tr>';
            return;
        }

        daaks.forEach(daak => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${daak.daak_id}</strong></td>
                <td>${daak.letter_no}</td>
                <td>${daak.subject}</td>
                <td>${daak.sender}</td>
                <td>${formatDate(daak.date_received)}</td>
                <td>${getStatusBadge(daak.status)}</td>
                <td>${daak.current_recipient_username || 'None'}</td>
                <td><button class="action-btn btn-history" onclick="viewHistory(${daak.id})">View History</button></td>
            `;
            tbody.appendChild(tr);
        });
    } catch(e) {
        console.error(e);
    }
}

// Action Modal
let currentActionDaakId = null;
let currentActionType = null;
const actionModal = document.getElementById('action-modal');

function openActionModal(daakId, actionType) {
    currentActionDaakId = daakId;
    currentActionType = actionType;
    document.getElementById('modal-title').innerText = `${actionType} Daak`;
    document.getElementById('action-comments').value = '';
    
    const forwardGroup = document.getElementById('forward-group');
    if (actionType === 'Forward') {
        forwardGroup.style.display = 'block';
        fetchUsers(); // Refresh recipient list for forwarding
    } else {
        forwardGroup.style.display = 'none';
    }
    
    actionModal.classList.remove('hidden');
    actionModal.style.display = 'flex';
}

function closeModal() {
    actionModal.classList.add('hidden');
    actionModal.style.display = 'none';
    currentActionDaakId = null;
    currentActionType = null;
}

document.getElementById('modal-confirm-btn').addEventListener('click', async () => {
    if (!currentActionDaakId || !currentActionType) return;
    
    const comments = document.getElementById('action-comments').value;
    const formData = new FormData();
    formData.append('action', currentActionType);
    if(comments) formData.append('comments', comments);
    
    if (currentActionType === 'Forward') {
        const nextRecipientId = document.getElementById('action-next-recipient').value;
        if (!nextRecipientId) {
            alert('Please select the next recipient');
            return;
        }
        formData.append('next_recipient_id', nextRecipientId);
    }
    
    try {
        const res = await fetchWithAuth(`/daak/${currentActionDaakId}/action`, {
            method: 'POST',
            body: formData
        });
        
        if (res.ok) {
            closeModal();
            loadMyTasks(); // Refresh
            loadDashboard();
        } else {
            const data = await res.json();
            alert(`Error: ${data.detail}`);
        }
    } catch(e) {
        console.error(e);
        alert('An error occurred');
    }
});

// History View
async function viewHistory(daakId) {
    try {
        const res = await fetchWithAuth(`/daak/${daakId}/history`);
        const historyLogs = await res.json();
        
        const container = document.getElementById('history-container');
        container.innerHTML = '';
        
        historyLogs.forEach(log => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div>
                    <div style="font-weight: 600">${log.action} by ${log.username}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">${formatDate(log.timestamp)}</div>
                    ${log.comments ? `<div style="margin-top: 8px; font-style: italic; color: #cbd5e1;">"${log.comments}"</div>` : ''}
                </div>
            `;
            container.appendChild(div);
        });
        
        navigate('history');
    } catch(e) {
        console.error(e);
    }
}

// Start
init();
