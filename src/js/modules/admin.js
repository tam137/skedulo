import { state } from '../state.js';
import * as api from '../api.js';
import { formatDateSimple, escapeHtml, formatChanges } from '../utils.js';

const usersTbody = document.getElementById('users-tbody');
const addUserBtn = document.getElementById('add-user-btn');
const addUserModal = document.getElementById('add-user-modal');
const closeAddUserModalBtn = document.getElementById('close-add-user-modal-btn');
const cancelAddUserModalBtn = document.getElementById('cancel-add-user-modal-btn');
const addUserForm = document.getElementById('add-user-form');
const addUserErrorAlert = document.getElementById('add-user-error-alert');
const addUserErrorMessage = document.getElementById('add-user-error-message');

const userHistoryModal = document.getElementById('user-history-modal');
const closeUserHistoryModalBtn = document.getElementById('close-user-history-modal-btn');
const closeUserHistoryModalBtn2 = document.getElementById('close-user-history-modal-btn2');

export function loadUsersAdmin() {
    if (!usersTbody) return;
    api.fetchAdminUsers()
        .then(data => {
            if (data && data.success) {
                renderUsersAdmin(data.users || []);
            } else {
                alert(data?.error || 'Fehler beim Laden der Benutzer.');
            }
        })
        .catch(err => {
            console.error('Error loading users:', err);
        });
}

function renderUsersAdmin(users) {
    if (!usersTbody) return;
    usersTbody.innerHTML = '';

    users.forEach(u => {
        const tr = document.createElement('tr');
        tr.dataset.id = u.id;

        const roleEscaped = escapeHtml(u.role);
        const nameEscaped = escapeHtml(u.username);
        const lastLogin = u.last_login_at ? formatDateSimple(u.last_login_at) : 'Nie';
        
        let statusHtml = '';
        if (u.is_active) {
            statusHtml = '<span class="status-indicator"><span class="status-dot"></span>Aktiv</span>';
        } else {
            statusHtml = '<span class="status-indicator deactivated"><span class="status-dot"></span>Deaktiviert</span>';
        }

        const isCurrentUser = parseInt(u.id, 10) === state.currentUserId;
        let actionsHtml = '';
        const historyBtnHtml = `<button type="button" class="btn btn-cancel btn-sm action-btn-history" data-id="${u.id}">Verlauf</button>`;
        
        if (!isCurrentUser) {
            const toggleText = u.is_active ? 'Deaktivieren' : 'Aktivieren';
            actionsHtml = `
                ${historyBtnHtml}
                <button type="button" class="btn btn-cancel btn-sm action-btn-toggle-status" data-id="${u.id}" data-active="${u.is_active}">${toggleText}</button>
                <button type="button" class="btn btn-cancel btn-sm action-btn-reset-pwd" data-id="${u.id}">Passwort zurücksetzen</button>
            `;
        } else {
            actionsHtml = `
                ${historyBtnHtml}
                <span class="current-account-label">Aktuelles Konto</span>
            `;
        }

        tr.innerHTML = `
            <td data-label="Benutzername" class="font-medium">${nameEscaped}</td>
            <td data-label="Rolle">${roleEscaped}</td>
            <td data-label="Status">${statusHtml}</td>
            <td data-label="Letzter Login">${lastLogin}</td>
            <td class="text-right" data-label="Aktionen">
                <div class="actions-flex-container">
                    ${actionsHtml}
                </div>
            </td>
        `;

        usersTbody.appendChild(tr);
    });

    usersTbody.querySelectorAll('.action-btn-toggle-status').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const isActive = btn.getAttribute('data-active') === 'true';
            promptToggleStatus(id, isActive);
        });
    });

    usersTbody.querySelectorAll('.action-btn-reset-pwd').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            promptResetPassword(id);
        });
    });

    usersTbody.querySelectorAll('.action-btn-history').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            showUserHistory(id);
        });
    });
}

function promptToggleStatus(id, currentlyActive) {
    state.adminActionType = currentlyActive ? 'deactivate' : 'activate';
    state.currentAdminActionUserId = id;

    const overlay = document.getElementById('confirm-overlay');
    const overlayTitle = overlay.querySelector('h3');
    const overlayDesc = overlay.querySelector('p');

    if (currentlyActive) {
        overlayTitle.textContent = 'Benutzer deaktivieren?';
        overlayDesc.textContent = 'Bist du sicher, dass du diesen Benutzer deaktivieren möchtest? Er kann sich danach nicht mehr anmelden.';
    } else {
        overlayTitle.textContent = 'Benutzer aktivieren?';
        overlayDesc.textContent = 'Möchtest du diesen Benutzer wieder aktivieren?';
    }

    overlay.classList.add('active');
}

function promptResetPassword(id) {
    state.adminActionType = 'reset_password';
    state.currentAdminActionUserId = id;

    const overlay = document.getElementById('confirm-overlay');
    const overlayTitle = overlay.querySelector('h3');
    const overlayDesc = overlay.querySelector('p');

    overlayTitle.textContent = 'Passwort zurücksetzen?';
    overlayDesc.textContent = 'Bist du sicher, dass du das Passwort dieses Benutzers auf das Startpasswort (Start123!) zurücksetzen möchtest?';

    overlay.classList.add('active');
}

function openAddUserModal() {
    addUserForm.reset();
    addUserErrorAlert.classList.add('hidden');
    addUserModal.classList.add('active');
}

function closeAddUserModal() {
    addUserModal.classList.remove('active');
}

if (addUserBtn) addUserBtn.addEventListener('click', openAddUserModal);
if (closeAddUserModalBtn) closeAddUserModalBtn.addEventListener('click', closeAddUserModal);
if (cancelAddUserModalBtn) cancelAddUserModalBtn.addEventListener('click', closeAddUserModal);

if (addUserForm) {
    addUserForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addUserErrorAlert.classList.add('hidden');

        const formData = new FormData(addUserForm);
        api.createAdminUser(formData)
            .then(data => {
                if (data && data.success) {
                    closeAddUserModal();
                    loadUsersAdmin();
                } else {
                    addUserErrorMessage.textContent = data?.error || 'Fehler beim Erstellen des Benutzers.';
                    addUserErrorAlert.classList.remove('hidden');
                }
            })
            .catch(err => {
                console.error('Error creating user:', err);
                addUserErrorMessage.textContent = 'Systemfehler beim Erstellen.';
                addUserErrorAlert.classList.remove('hidden');
            });
    });
}

document.addEventListener('admin-action-confirm', () => {
    if (!state.adminActionType || !state.currentAdminActionUserId) return;

    let promise;
    if (state.adminActionType === 'activate') {
        promise = api.toggleUserStatus(state.currentAdminActionUserId, true);
    } else if (state.adminActionType === 'deactivate') {
        promise = api.toggleUserStatus(state.currentAdminActionUserId, false);
    } else if (state.adminActionType === 'reset_password') {
        promise = api.resetUserPassword(state.currentAdminActionUserId);
    }

    if (promise) {
        promise.then(data => {
            if (data && data.success) {
                document.getElementById('confirm-cancel-btn').click();
                loadUsersAdmin();
            } else {
                alert(data?.error || 'Fehler bei der Admin-Aktion.');
            }
        })
        .catch(err => {
            console.error('Error executing admin action:', err);
            alert('Systemfehler bei der Admin-Aktion.');
        });
    }
});

document.addEventListener('view-changed', (e) => {
    if (e.detail.view === 'admin') {
        loadUsersAdmin();
    }
});

function closeUserHistoryModal() {
    if (userHistoryModal) {
        userHistoryModal.classList.remove('active');
    }
}

if (closeUserHistoryModalBtn) closeUserHistoryModalBtn.addEventListener('click', closeUserHistoryModal);
if (closeUserHistoryModalBtn2) closeUserHistoryModalBtn2.addEventListener('click', closeUserHistoryModal);

function showUserHistory(id) {
    const userHistoryUsername = document.getElementById('user-history-username');
    const userHistoryContent = document.getElementById('user-history-content');

    if (!userHistoryModal || !userHistoryContent) return;

    userHistoryUsername.textContent = 'Lade...';
    userHistoryContent.innerHTML = '<div class="table-empty-message">Lade Verlauf...</div>';
    userHistoryModal.classList.add('active');

    api.fetchUserHistory(id)
        .then(data => {
            if (data && data.success) {
                userHistoryUsername.textContent = data.username || '';
                userHistoryContent.innerHTML = '';
                
                if (data.history && data.history.length > 0) {
                    data.history.forEach(log => {
                        const item = document.createElement('div');
                        item.className = 'history-item';
                        
                        const timeStr = formatDateSimple(log.changed_at);
                        const appointmentTitle = escapeHtml(log.appointment_title || 'Unbekannter Termin');
                        
                        let changesHtml = '';
                        if (log.is_creation) {
                            changesHtml = `<div class="history-change-line history-creation">Termin erstellt</div>`;
                        } else {
                            changesHtml = formatChanges(log.changes);
                        }

                        item.innerHTML = `
                            <div class="history-meta">
                                <span>${timeStr}</span>
                                <span>Termin: <strong>${appointmentTitle}</strong></span>
                            </div>
                            <div class="history-changes">
                                ${changesHtml}
                            </div>
                        `;
                        userHistoryContent.appendChild(item);
                    });
                } else {
                    userHistoryContent.innerHTML = '<div class="table-empty-message">Keine Änderungen vorhanden.</div>';
                }
            } else {
                alert(data?.error || 'Fehler beim Laden des Verlaufs.');
                userHistoryModal.classList.remove('active');
            }
        })
        .catch(err => {
            console.error('Error fetching user history:', err);
            alert('Systemfehler beim Abrufen des Verlaufs.');
            userHistoryModal.classList.remove('active');
        });
}
