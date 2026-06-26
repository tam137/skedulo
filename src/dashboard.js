document.addEventListener('DOMContentLoaded', () => {
    // Sidebar Elements
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebarDrawer = document.getElementById('sidebar-drawer');
    const drawerBackdrop = document.getElementById('drawer-backdrop');

    // Modal & Overlay Elements
    const appointmentModal = document.getElementById('appointment-modal');
    const confirmOverlay = document.getElementById('confirm-overlay');
    const appointmentForm = document.getElementById('appointment-form');
    const modalTitle = document.getElementById('modal-title');
    
    // Form Fields
    const appointmentIdInput = document.getElementById('appointment-id');
    const titleInput = document.getElementById('title');
    const dateInput = document.getElementById('appointment_date');
    const locationInput = document.getElementById('location');
    const notesInput = document.getElementById('notes');
    const appointmentIconInput = document.getElementById('appointment-icon');
    const emojiPicker = document.getElementById('emoji-picker');
    const emojiBtns = emojiPicker.querySelectorAll('.emoji-btn');
    
    // Buttons
    const addBtn = document.getElementById('add-appointment-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelModalBtn = document.getElementById('cancel-modal-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const historySection = document.getElementById('modal-history-section');
    const historyContent = document.getElementById('history-content');
    const historyDetails = document.getElementById('history-details');

    // View Management
    const navCalendar = document.getElementById('nav-calendar');
    const navFiles = document.getElementById('nav-files');
    const navAdmin = document.getElementById('nav-admin');
    const calendarView = document.getElementById('calendar-view');
    const filesView = document.getElementById('files-view');
    const adminView = document.getElementById('admin-view');
    const mainTitle = document.getElementById('main-title');

    // Admin Elements
    const usersTbody = document.getElementById('users-tbody');
    const addUserBtn = document.getElementById('add-user-btn');
    const addUserModal = document.getElementById('add-user-modal');
    const closeAddUserModalBtn = document.getElementById('close-add-user-modal-btn');
    const cancelAddUserModalBtn = document.getElementById('cancel-add-user-modal-btn');
    const addUserForm = document.getElementById('add-user-form');
    const newUsernameInput = document.getElementById('new-username');
    const newRoleInput = document.getElementById('new-role');
    const addUserErrorAlert = document.getElementById('add-user-error-alert');
    const addUserErrorMessage = document.getElementById('add-user-error-message');

    // Files Elements
    const uploadGlobalBtn = document.getElementById('upload-global-file-btn');
    const globalFileInput = document.getElementById('global-file-input');
    const filesTbody = document.getElementById('files-tbody');
    
    const btnUploadAppointmentFile = document.getElementById('btn-upload-appointment-file');
    const appointmentFileInput = document.getElementById('appointment-file-input');
    const appointmentFilesList = document.getElementById('appointment-files-list');
    const filesHint = document.getElementById('files-hint');

    // Change Password Elements
    const changePwdBtn = document.getElementById('change-pwd-btn');
    const changePwdModal = document.getElementById('change-password-modal');
    const closePwdModalBtn = document.getElementById('close-pwd-modal-btn');
    const cancelPwdModalBtn = document.getElementById('cancel-pwd-modal-btn');
    const changePwdForm = document.getElementById('change-password-form');
    const currentPwdInput = document.getElementById('current-password');
    const newPwdInput = document.getElementById('new-password');
    const confirmPwdInput = document.getElementById('confirm-password');
    const reqLength = document.getElementById('req-length');
    const reqLowercase = document.getElementById('req-lowercase');
    const reqUppercase = document.getElementById('req-uppercase');
    const reqNumber = document.getElementById('req-number');
    const reqMatch = document.getElementById('req-match');
    const savePwdBtn = document.getElementById('save-pwd-btn');
    const pwdErrorAlert = document.getElementById('pwd-error-alert');
    const pwdErrorMessage = document.getElementById('pwd-error-message');
    const pwdSuccessAlert = document.getElementById('pwd-success-alert');

    // Initialize Flatpickr datepicker
    const fp = flatpickr(dateInput, {
        locale: "de",
        altInput: true,
        altFormat: "d.m.Y",
        dateFormat: "Y-m-d",
        disableMobile: true
    });

    let currentDeleteId = null;

    // Global Upload Modal Elements
    const uploadFileModal = document.getElementById('upload-file-modal');
    const closeUploadModalBtn = document.getElementById('close-upload-modal-btn');
    const cancelUploadModalBtn = document.getElementById('cancel-upload-modal-btn');
    const globalFileUploadForm = document.getElementById('global-file-upload-form');
    const globalUploadFileField = document.getElementById('global-upload-file-field');
    const saveUploadModalBtn = document.getElementById('save-upload-modal-btn');
    const btnSelectGlobalFile = document.getElementById('btn-select-global-file');
    const globalFileNameDisplay = document.getElementById('global-file-name-display');
    const globalUploadAppointmentField = document.getElementById('global-upload-appointment-field');
    const fileSharingGroup = document.getElementById('file-sharing-group');
    const uploadFileErrorAlert = document.getElementById('upload-file-error-alert');
    const uploadFileErrorMessage = document.getElementById('upload-file-error-message');

    // Edit File Modal Elements
    const editFileModal = document.getElementById('edit-file-modal');
    const closeEditModalBtn = document.getElementById('close-edit-modal-btn');
    const cancelEditModalBtn = document.getElementById('cancel-edit-modal-btn');
    const editFileForm = document.getElementById('edit-file-form');
    const editFileId = document.getElementById('edit-file-id');
    const editFileNameDisplay = document.getElementById('edit-file-name-display');
    const editAppointmentField = document.getElementById('edit-appointment-field');
    const editFileSharingGroup = document.getElementById('edit-file-sharing-group');
    const editFileErrorAlert = document.getElementById('edit-file-error-alert');
    const editFileErrorMessage = document.getElementById('edit-file-error-message');

    class CustomMultiSelect {
        constructor(elementId, placeholderText = 'Benutzer auswählen...') {
            this.container = document.getElementById(elementId);
            this.trigger = this.container.querySelector('.multiselect-trigger');
            this.placeholder = this.trigger.querySelector('.multiselect-placeholder');
            this.dropdown = this.container.querySelector('.multiselect-dropdown');
            this.searchInput = this.container.querySelector('.multiselect-search');
            this.optionsContainer = this.container.querySelector('.multiselect-options');
            this.placeholderText = placeholderText;
            this.users = []; // {id, username}
            this.selectedIds = new Set();
            
            this.initEvents();
        }
        
        setUsers(users) {
            this.users = users;
            this.renderOptions();
        }
        
        initEvents() {
            this.trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
            
            this.searchInput.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            
            this.searchInput.addEventListener('input', () => {
                this.filterOptions();
            });
            
            document.addEventListener('click', () => {
                this.closeDropdown();
            });
        }
        
        toggleDropdown() {
            document.querySelectorAll('.custom-multiselect').forEach(el => {
                if (el !== this.container) {
                    el.classList.remove('active');
                }
            });
            this.container.classList.toggle('active');
            if (this.container.classList.contains('active')) {
                this.searchInput.focus();
                this.searchInput.value = '';
                this.filterOptions();
            }
        }
        
        closeDropdown() {
            this.container.classList.remove('active');
        }
        
        renderOptions() {
            this.optionsContainer.innerHTML = '';
            this.users.forEach(user => {
                const option = document.createElement('div');
                option.className = 'multiselect-option';
                option.dataset.id = user.id;
                if (this.selectedIds.has(user.id)) {
                    option.classList.add('selected');
                }
                
                option.innerHTML = `
                    <div class="multiselect-option-checkbox"></div>
                    <div class="multiselect-option-text">${escapeHtml(user.username)}</div>
                `;
                
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleOption(user.id, option);
                });
                
                this.optionsContainer.appendChild(option);
            });
            
            this.updateTrigger();
        }
        
        toggleOption(id, optionElement) {
            if (this.selectedIds.has(id)) {
                this.selectedIds.delete(id);
                optionElement.classList.remove('selected');
            } else {
                this.selectedIds.add(id);
                optionElement.classList.add('selected');
            }
            this.updateTrigger();
            this.triggerEvent();
        }
        
        getSelected() {
            return Array.from(this.selectedIds);
        }
        
        setSelected(ids) {
            this.selectedIds = new Set(ids.map(Number));
            this.updateOptionsUI();
            this.updateTrigger();
            this.searchInput.value = '';
            this.filterOptions();
        }
        
        clear() {
            this.selectedIds.clear();
            this.updateOptionsUI();
            this.updateTrigger();
            this.searchInput.value = '';
            this.filterOptions();
        }
        
        updateOptionsUI() {
            const options = this.optionsContainer.querySelectorAll('.multiselect-option:not(.no-results)');
            options.forEach(opt => {
                const id = Number(opt.dataset.id);
                if (this.selectedIds.has(id)) {
                    opt.classList.add('selected');
                } else {
                    opt.classList.remove('selected');
                }
            });
        }
        
        updateTrigger() {
            const existingTags = this.trigger.querySelector('.multiselect-tags');
            if (existingTags) {
                existingTags.remove();
            }
            
            if (this.selectedIds.size === 0) {
                this.placeholder.classList.remove('hidden');
                this.placeholder.textContent = this.placeholderText;
            } else {
                this.placeholder.classList.add('hidden');
                const tagsContainer = document.createElement('div');
                tagsContainer.className = 'multiselect-tags';
                
                this.users.forEach(user => {
                    if (this.selectedIds.has(user.id)) {
                        const tag = document.createElement('span');
                        tag.className = 'multiselect-tag';
                        tag.textContent = user.username;
                        
                        const removeBtn = document.createElement('span');
                        removeBtn.className = 'multiselect-tag-remove';
                        removeBtn.innerHTML = '&times;';
                        removeBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.selectedIds.delete(user.id);
                            this.updateOptionsUI();
                            this.updateTrigger();
                            this.triggerEvent();
                        });
                        
                        tag.appendChild(removeBtn);
                        tagsContainer.appendChild(tag);
                    }
                });
                
                this.trigger.insertBefore(tagsContainer, this.trigger.querySelector('.multiselect-arrow'));
            }
        }
        
        filterOptions() {
            const query = this.searchInput.value.toLowerCase().trim();
            const options = this.optionsContainer.querySelectorAll('.multiselect-option:not(.no-results)');
            let visibleCount = 0;
            options.forEach(opt => {
                const username = opt.querySelector('.multiselect-option-text').textContent.toLowerCase();
                if (username.includes(query)) {
                    opt.classList.remove('hidden');
                    visibleCount++;
                } else {
                    opt.classList.add('hidden');
                }
            });
            
            let noResults = this.optionsContainer.querySelector('.no-results');
            if (visibleCount === 0) {
                if (!noResults) {
                    noResults = document.createElement('div');
                    noResults.className = 'multiselect-option no-results';
                    noResults.style.color = 'var(--text-secondary)';
                    noResults.style.cursor = 'default';
                    noResults.style.justifyContent = 'center';
                    noResults.textContent = 'Keine Benutzer gefunden';
                    this.optionsContainer.appendChild(noResults);
                }
                noResults.classList.remove('hidden');
            } else if (noResults) {
                noResults.classList.add('hidden');
            }
        }
        
        triggerEvent() {
            const event = new CustomEvent('change', { detail: this.getSelected() });
            this.container.dispatchEvent(event);
        }
    }

    let userList = [];
    let appointmentSharingSelect = null;
    let fileSharingSelect = null;
    let editFileSharingSelect = null;
    let cachedAppointments = [];

    function fetchUsers() {
        fetch('appointments_api.php?action=users')
            .then(res => res.json())
            .then(data => {
                if (data && data.success) {
                    userList = data.users;
                    appointmentSharingSelect = new CustomMultiSelect('appointment-sharing-select', 'Niemandem freigegeben');
                    appointmentSharingSelect.setUsers(userList);
                    
                    fileSharingSelect = new CustomMultiSelect('file-sharing-select', 'Niemandem freigegeben');
                    fileSharingSelect.setUsers(userList);

                    editFileSharingSelect = new CustomMultiSelect('edit-file-sharing-select', 'Niemandem freigegeben');
                    editFileSharingSelect.setUsers(userList);
                }
            })
            .catch(err => console.error('Error fetching users:', err));
    }
    
    fetchUsers();

    // --- Toggle Sidebar ---
    function openSidebar() {
        hamburgerBtn.classList.add('active');
        sidebarDrawer.classList.add('active');
        drawerBackdrop.classList.add('active');
    }

    function closeSidebar() {
        hamburgerBtn.classList.remove('active');
        sidebarDrawer.classList.remove('active');
        drawerBackdrop.classList.remove('active');
    }

    hamburgerBtn.addEventListener('click', () => {
        if (sidebarDrawer.classList.contains('active')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    drawerBackdrop.addEventListener('click', closeSidebar);

    // --- Change Password Modal Functions ---
    function openPwdModal() {
        closeSidebar();
        changePwdForm.reset();
        pwdErrorAlert.classList.add('hidden');
        pwdSuccessAlert.classList.add('hidden');
        changePwdForm.classList.remove('hidden');
        validatePassword();
        changePwdModal.classList.add('active');
    }

    function closePwdModal() {
        changePwdModal.classList.remove('active');
        changePwdForm.reset();
    }

    function validatePassword() {
        const pwd = newPwdInput.value;
        const confirmPwd = confirmPwdInput.value;

        const isLengthValid = pwd.length >= 9;
        const isLowercaseValid = /[a-z]/.test(pwd);
        const isUppercaseValid = /[A-Z]/.test(pwd);
        const isNumberValid = /\d/.test(pwd);
        const isMatchValid = pwd !== '' && pwd === confirmPwd;

        function updateReqUI(element, isValid) {
            if (isValid) {
                element.classList.add('valid');
            } else {
                element.classList.remove('valid');
            }
        }

        updateReqUI(reqLength, isLengthValid);
        updateReqUI(reqLowercase, isLowercaseValid);
        updateReqUI(reqUppercase, isUppercaseValid);
        updateReqUI(reqNumber, isNumberValid);
        updateReqUI(reqMatch, isMatchValid);

        const allValid = isLengthValid && isLowercaseValid && isUppercaseValid && isNumberValid && isMatchValid;
        savePwdBtn.disabled = !allValid;
    }

    changePwdBtn.addEventListener('click', openPwdModal);
    closePwdModalBtn.addEventListener('click', closePwdModal);
    cancelPwdModalBtn.addEventListener('click', closePwdModal);
    newPwdInput.addEventListener('input', validatePassword);
    confirmPwdInput.addEventListener('input', validatePassword);

    // --- Copy ICS Feed Link ---
    const copyIcsBtn = document.getElementById('copy-ics-btn');
    if (copyIcsBtn) {
        copyIcsBtn.addEventListener('click', () => {
            const token = copyIcsBtn.getAttribute('data-token');
            if (token) {
                // Determine absolute URL based on current origin and path
                let path = window.location.pathname;
                let dir = path.substring(0, path.lastIndexOf('/'));
                const url = `${window.location.origin}${dir}/calendar_feed.php?token=${token}`;
                
                navigator.clipboard.writeText(url).then(() => {
                    alert('Outlook Kalender-Link wurde in die Zwischenablage kopiert!\nDu kannst ihn nun in Outlook (oder anderen Apps) abonnieren.');
                }).catch(err => {
                    console.error('Fehler beim Kopieren:', err);
                    alert('Fehler beim Kopieren des Links. Bitte kopiere ihn ggf. manuell: ' + url);
                });
            } else {
                alert('Dein Kalender-Token konnte nicht geladen werden. Bitte lade die Seite neu.');
            }
        });
    }

    // --- AJAX: Load & Render Appointments ---
    function loadAppointments() {
        fetch('appointments_api.php?action=list')
            .then(response => {
                if (response.status === 401) {
                    window.location.href = 'login.php';
                    return;
                }
                return response.json();
            })
            .then(data => {
                if (!data || !data.success) {
                    alert(data?.error || 'Fehler beim Laden der Termine.');
                    return;
                }
                cachedAppointments = data.upcoming || [];
                renderTable(data.upcoming, 'upcoming-tbody', 'Lade Termine...', 'Keine anstehenden Termine vorhanden.');
                renderTable(data.past, 'past-tbody', 'Lade Termine...', 'Keine vergangenen Termine vorhanden.');
            })
            .catch(err => {
                console.error('Error loading appointments:', err);
            });
    }

    function renderTable(appointments, tbodyId, loadingText, emptyText) {
        const tbody = document.getElementById(tbodyId);
        tbody.innerHTML = '';

        if (appointments.length === 0) {
            tbody.innerHTML = `<tr>
                <td colspan="4" class="table-empty-message">
                    ${emptyText}
                </td>
            </tr>`;
            return;
        }

        appointments.forEach(apt => {
            const tr = document.createElement('tr');
            tr.dataset.id = apt.id;
            
            const dateHtml = formatAppointmentDate(apt.appointment_date);
            const iconPrefix = apt.icon ? apt.icon + ' ' : '';
            const titleEscaped = iconPrefix + escapeHtml(apt.title);
            const locationEscaped = escapeHtml(apt.location || '-');
            const notesEscaped = escapeHtml(apt.notes || '-');

            const fileCount = parseInt(apt.file_count || 0, 10);
            const fileIndicatorHtml = fileCount > 0 ? ` <span class="file-indicator" title="${fileCount} Datei${fileCount > 1 ? 'en' : ''} angehängt">📎</span>` : '';

            tr.innerHTML = `
                <td class="cell-date" data-label="Datum">${dateHtml}${fileIndicatorHtml}</td>
                <td class="cell-title" data-label="Name">${titleEscaped}</td>
                <td data-label="Ort">${locationEscaped}</td>
                <td data-label="Notizen" style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${notesEscaped}</td>
            `;

            tr.addEventListener('click', () => openEditModal(apt.id));
            tbody.appendChild(tr);
        });
    }

    // Helpers for formatting
    function formatAppointmentDate(dateString) {
        const d = new Date(dateString.replace(' ', 'T'));
        if (isNaN(d.getTime())) return escapeHtml(dateString);
        
        const weekday = d.toLocaleDateString('de-DE', { weekday: 'short' });
        const dateStr = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        
        return `<span class="weekday-tag">${weekday}</span>${dateStr}`;
    }

    function formatDateOnly(dateString) {
        if (!dateString) return '';
        const d = new Date(dateString.replace(' ', 'T'));
        if (isNaN(d.getTime())) return dateString;
        return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    function formatDateSimple(dateString) {
        if (!dateString) return '';
        const d = new Date(dateString.replace(' ', 'T'));
        if (isNaN(d.getTime())) return dateString;
        const dateStr = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeStr = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        return `${dateStr} um ${timeStr} Uhr`;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // --- Form Helpers ---
    function openCreateModal() {
        appointmentForm.reset();
        appointmentIdInput.value = '';
        modalTitle.textContent = 'Termin erstellen';
        deleteBtn.classList.add('hidden');
        historySection.classList.add('hidden');
        historyContent.innerHTML = '';
        
        // Clear sharing selection
        if (appointmentSharingSelect) {
            appointmentSharingSelect.clear();
        }

        // Reset emoji picker to none
        appointmentIconInput.value = '';
        emojiBtns.forEach(btn => {
            if (btn.dataset.emoji === '') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Files Section
        btnUploadAppointmentFile.disabled = true;
        filesHint.classList.remove('hidden');
        appointmentFilesList.innerHTML = '';
        
        // Pre-fill date to today (Berlin local)
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        fp.setDate(`${yyyy}-${mm}-${dd}`);

        appointmentModal.classList.add('active');
    }

    function openEditModal(id) {
        fetch(`appointments_api.php?action=get&id=${id}`)
            .then(response => response.json())
            .then(data => {
                if (!data || !data.success) {
                    alert(data?.error || 'Fehler beim Laden des Termins.');
                    return;
                }

                const apt = data.appointment;
                appointmentIdInput.value = apt.id;
                titleInput.value = apt.title;
                locationInput.value = apt.location || '';
                notesInput.value = apt.notes || '';

                // Set sharing permissions
                if (appointmentSharingSelect) {
                    appointmentSharingSelect.setSelected(data.allowed_users || []);
                }

                // Set emoji picker value and active button styling
                const currentIcon = apt.icon || '';
                appointmentIconInput.value = currentIcon;
                emojiBtns.forEach(btn => {
                    if (btn.dataset.emoji === currentIcon) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });

                // Files section
                btnUploadAppointmentFile.disabled = false;
                filesHint.classList.add('hidden');
                renderAppointmentFiles(data.files || [], apt.id);

                // Format timestamp to datetime-local
                const d = new Date(apt.appointment_date.replace(' ', 'T'));
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                fp.setDate(`${yyyy}-${mm}-${dd}`);

                // Build history items array
                const historyItems = [];
                if (data.history && data.history.length > 0) {
                    data.history.forEach(log => {
                        historyItems.push(log);
                    });
                }
                
                // Push virtual creation log at the bottom of the list
                historyItems.push({
                    changed_at: apt.created_at,
                    changer_name: apt.creator_name,
                    is_creation: true
                });

                // History render
                historyContent.innerHTML = '';
                historySection.classList.remove('hidden');
                historyDetails.removeAttribute('open'); // Collapsed by default
                
                historyItems.forEach(log => {
                    const item = document.createElement('div');
                    item.className = 'history-item';
                    
                    const timeStr = formatDateSimple(log.changed_at);
                    const userStr = escapeHtml(log.changer_name);
                    
                    let changesHtml = '';
                    if (log.is_creation) {
                        changesHtml = `<div class="history-change-line history-creation">Termin erstellt</div>`;
                    } else {
                        changesHtml = formatChanges(log.changes);
                    }

                    item.innerHTML = `
                        <div class="history-meta">
                            <span>${timeStr}</span>
                            <span>von <strong>${userStr}</strong></span>
                        </div>
                        <div class="history-changes">
                            ${changesHtml}
                        </div>
                    `;
                    historyContent.appendChild(item);
                });

                modalTitle.textContent = 'Termin bearbeiten';
                deleteBtn.classList.remove('hidden');
                appointmentModal.classList.add('active');
            })
            .catch(err => {
                console.error('Error fetching appointment details:', err);
                alert('Systemfehler beim Abrufen der Details.');
            });
    }

    function formatChanges(changes) {
        const labels = {
            title: 'Name',
            location: 'Ort',
            appointment_date: 'Datum',
            notes: 'Notizen',
            icon: 'Symbol'
        };
        let html = '';
        for (const field in changes) {
            const fieldLabel = labels[field] || field;
            let oldVal = changes[field]['old'] || 'Keine';
            let newVal = changes[field]['new'] || 'Keine';
            
            if (field === 'appointment_date') {
                oldVal = formatDateOnly(oldVal);
                newVal = formatDateOnly(newVal);
            }
            
            html += `<div class="history-change-line">
                <strong>${fieldLabel}:</strong> 
                <span class="history-old-value">${escapeHtml(oldVal)}</span> 
                <span class="change-arrow">➔</span> 
                <span class="history-new-value">${escapeHtml(newVal)}</span>
            </div>`;
        }
        return html;
    }

    function closeModal() {
        appointmentModal.classList.remove('active');
        appointmentForm.reset();
    }

    // --- Delete Confirmation Overlay toggles ---
    function showConfirmOverlay(id) {
        currentDeleteId = id;
        confirmOverlay.classList.add('active');
    }

    function hideConfirmOverlay() {
        currentDeleteId = null;
        if (typeof adminActionType !== 'undefined') adminActionType = null;
        if (typeof currentAdminActionUserId !== 'undefined') currentAdminActionUserId = null;
        confirmOverlay.classList.remove('active');
        // Reset texts for appointment deletion as default
        document.querySelector('#confirm-overlay h3').textContent = 'Termin löschen?';
        document.querySelector('#confirm-overlay p').textContent = 'Bist du sicher, dass du diesen Termin dauerhaft löschen möchtest?';
    }

    // Event Listeners for UI
    addBtn.addEventListener('click', openCreateModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);
    
    // Emoji Selection Handler
    emojiBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            emojiBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            appointmentIconInput.value = btn.dataset.emoji;
        });
    });
    
    deleteBtn.addEventListener('click', () => {
        const id = appointmentIdInput.value;
        if (id) {
            showConfirmOverlay(id);
        }
    });

    confirmCancelBtn.addEventListener('click', hideConfirmOverlay);

    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            hideConfirmOverlay();
            closeSidebar();
            closePwdModal();
            if (typeof closeAddUserModal === 'function') closeAddUserModal();
            if (typeof closeUploadModal === 'function') {
                closeUploadModal();
            }
        }
    });

    // --- Submit Form (Create / Update) ---
    appointmentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = appointmentIdInput.value;
        const isEdit = id !== '';
        const payload = {
            action: isEdit ? 'update' : 'create',
            id: isEdit ? intval(id) : null,
            title: titleInput.value,
            appointment_date: dateInput.value,
            location: locationInput.value,
            notes: notesInput.value,
            icon: appointmentIconInput.value,
            allowed_users: appointmentSharingSelect ? appointmentSharingSelect.getSelected() : []
        };

        function intval(val) {
            const parsed = parseInt(val, 10);
            return isNaN(parsed) ? 0 : parsed;
        }

        fetch('appointments_api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            if (data && data.success) {
                closeModal();
                loadAppointments();
            } else {
                alert(data?.error || 'Fehler beim Speichern des Termins.');
            }
        })
        .catch(err => {
            console.error('Error saving appointment:', err);
            alert('Systemfehler beim Speichern.');
        });
    });

    // --- Confirm Delete Action ---
    confirmDeleteBtn.addEventListener('click', () => {
        if (typeof adminActionType !== 'undefined' && adminActionType) {
            fetch('admin_api.php?action=' + adminActionType, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: currentAdminActionUserId })
            })
            .then(res => res.json())
            .then(data => {
                if (data && data.success) {
                    hideConfirmOverlay();
                    loadUsersAdmin();
                } else {
                    alert(data?.error || 'Fehler beim Ausführen der Aktion.');
                }
            })
            .catch(err => {
                console.error(err);
                alert('Systemfehler.');
            });
            return;
        }

        if (!currentDeleteId) return;

        fetch('appointments_api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'delete',
                id: parseInt(currentDeleteId, 10)
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data && data.success) {
                hideConfirmOverlay();
                closeModal();
                loadAppointments();
            } else {
                alert(data?.error || 'Fehler beim Löschen des Termins.');
            }
        })
        .catch(err => {
            console.error('Error deleting appointment:', err);
            alert('Systemfehler beim Löschen.');
        });
    });

    // --- Submit Password Change ---
    changePwdForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const payload = {
            current_password: currentPwdInput.value,
            new_password: newPwdInput.value,
            confirm_password: confirmPwdInput.value
        };

        fetch('change_password_api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(response => {
            return response.json().then(data => ({
                ok: response.ok,
                data: data
            }));
        })
        .then(({ ok, data }) => {
            if (ok && data && data.success) {
                pwdErrorAlert.classList.add('hidden');
                pwdSuccessAlert.classList.remove('hidden');
                changePwdForm.classList.add('hidden');
                
                // Redirect after 2 seconds
                setTimeout(() => {
                    window.location.href = 'login.php?password_changed=1';
                }, 2000);
            } else {
                pwdErrorMessage.textContent = data?.error || 'Fehler beim Ändern des Passworts.';
                pwdErrorAlert.classList.remove('hidden');
            }
        })
        .catch(err => {
            console.error('Error changing password:', err);
            pwdErrorMessage.textContent = 'Systemfehler beim Speichern des Passworts.';
            pwdErrorAlert.classList.remove('hidden');
        });
    });

    function switchView(viewName, isInitialLoad = false) {
        const validViews = ['calendar', 'files'];
        if (navAdmin) validViews.push('admin');

        if (!validViews.includes(viewName)) {
            viewName = 'calendar';
        }

        // Toggle active class on navigation links
        navCalendar.classList.toggle('active', viewName === 'calendar');
        navFiles.classList.toggle('active', viewName === 'files');
        if (navAdmin) {
            navAdmin.classList.toggle('active', viewName === 'admin');
        }

        // Toggle hidden class on view containers
        calendarView.classList.toggle('hidden', viewName !== 'calendar');
        filesView.classList.toggle('hidden', viewName !== 'files');
        if (adminView) {
            adminView.classList.toggle('hidden', viewName !== 'admin');
        }

        // Set page title and load data
        if (viewName === 'files') {
            mainTitle.textContent = 'Dateien';
            loadGlobalFiles();
        } else if (viewName === 'admin') {
            mainTitle.textContent = 'Benutzerverwaltung';
            loadUsersAdmin();
        } else {
            mainTitle.textContent = 'Kalender';
            loadAppointments();
        }

        // Close the sidebar if it was opened
        if (!isInitialLoad) {
            closeSidebar();
        }

        // Save to sessionStorage
        sessionStorage.setItem('dashboard_current_view', viewName);
    }

    // Navigation toggles
    navCalendar.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('calendar');
    });

    navFiles.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('files');
    });

    if (navAdmin) {
        navAdmin.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('admin');
        });
    }

    // Initial load of active view
    const savedView = sessionStorage.getItem('dashboard_current_view') || 'calendar';
    switchView(savedView, true);

    function formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

    // Global Files Load
    function loadGlobalFiles() {
        fetch('files_api.php?action=list')
            .then(res => res.json())
            .then(data => {
                if (data && data.success) {
                    renderGlobalFiles(data.files);
                } else {
                    filesTbody.innerHTML = `<tr><td colspan="6" class="table-empty-message" style="color:red;">Fehler beim Laden.</td></tr>`;
                }
            })
            .catch(err => console.error(err));
    }

    function renderGlobalFiles(files) {
        filesTbody.innerHTML = '';
        if (files.length === 0) {
            filesTbody.innerHTML = `<tr><td colspan="6" class="table-empty-message">Keine Dateien vorhanden.</td></tr>`;
            return;
        }
        
        files.forEach(f => {
            const tr = document.createElement('tr');
            const isViewable = f.mime_type === 'application/pdf' || f.mime_type.startsWith('image/') || f.mime_type.startsWith('video/');
            const actionsHtml = `
                <div class="actions-flex-container">
                    ${isViewable ? `<a href="files_api.php?action=view&id=${f.id}" target="_blank" class="action-icon action-icon-view" title="Ansehen">👁️</a>` : ''}
                    <a href="files_api.php?action=download&id=${f.id}" class="action-icon action-icon-download" title="Herunterladen">⬇️</a>
                    <button onclick="openEditFileModal(${f.id})" class="action-icon action-btn-edit" title="Bearbeiten">✏️</button>
                    <button onclick="deleteFile(${f.id}, null)" class="action-icon action-btn-delete" title="Löschen">🗑️</button>
                </div>
            `;
            tr.innerHTML = `
                <td data-label="Dateiname">${escapeHtml(f.original_filename)}</td>
                <td data-label="Termin">${f.appointment_title ? escapeHtml(f.appointment_title) : '-'}</td>
                <td data-label="Größe">${formatBytes(f.file_size)}</td>
                <td data-label="Von">${escapeHtml(f.uploader_name)}</td>
                <td data-label="Datum">${formatDateOnly(f.uploaded_at)}</td>
                <td data-label="Aktionen">${actionsHtml}</td>
            `;

            tr.addEventListener('click', (e) => {
                if (e.target.closest('a') || e.target.closest('button')) return;
                openEditFileModal(f.id);
            });

            filesTbody.appendChild(tr);
        });
    }

    function renderAppointmentFiles(files, appointmentId) {
        appointmentFilesList.innerHTML = '';
        if (files.length === 0) {
            appointmentFilesList.innerHTML = `<span style="color: var(--text-secondary); font-size: 0.9rem;">Keine Dateien angehängt.</span>`;
            return;
        }
        
        files.forEach(f => {
            const div = document.createElement('div');
            div.className = 'appointment-file-item';
            
            const isViewable = f.mime_type === 'application/pdf' || f.mime_type.startsWith('image/') || f.mime_type.startsWith('video/');
            
            div.innerHTML = `
                <div class="appointment-file-info">
                    <span class="appointment-file-name" title="${escapeHtml(f.original_filename)}">${escapeHtml(f.original_filename)}</span>
                    <span class="appointment-file-meta">${formatBytes(f.file_size)} • ${escapeHtml(f.uploader_name)}</span>
                </div>
                <div class="appointment-file-actions">
                    ${isViewable ? `<a href="files_api.php?action=view&id=${f.id}" target="_blank" class="action-icon-view" title="Ansehen">👁️</a>` : ''}
                    <a href="files_api.php?action=download&id=${f.id}" class="action-icon-download" title="Herunterladen">⬇️</a>
                    <button type="button" onclick="openEditFileModal(${f.id}, ${appointmentId})" class="action-btn-edit" title="Bearbeiten">✏️</button>
                    <button type="button" onclick="deleteFile(${f.id}, ${appointmentId})" class="action-btn-delete" title="Löschen">🗑️</button>
                </div>
            `;
            appointmentFilesList.appendChild(div);
        });
    }

    window.openEditFileModal = function(fileId, fromAppointmentId = null) {
        if (editFileErrorAlert) {
            editFileErrorAlert.classList.add('hidden');
            editFileErrorMessage.textContent = '';
        }
        
        fetch(`files_api.php?action=get&id=${fileId}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.success) {
                    const file = data.file;
                    editFileId.value = file.id;
                    editFileNameDisplay.textContent = file.original_filename;
                    
                    // Populate appointment dropdown
                    editAppointmentField.innerHTML = '<option value="">Kein Termin zugeordnet</option>';
                    cachedAppointments.forEach(apt => {
                        const dateStr = formatDateOnly(apt.appointment_date);
                        const opt = document.createElement('option');
                        opt.value = apt.id;
                        opt.textContent = `Termin am ${dateStr}: ${apt.title}`;
                        editAppointmentField.appendChild(opt);
                    });
                    
                    if (file.appointment_id) {
                        editAppointmentField.value = file.appointment_id;
                        editFileSharingGroup.classList.add('hidden');
                    } else {
                        editAppointmentField.value = '';
                        editFileSharingGroup.classList.remove('hidden');
                    }
                    
                    if (editFileSharingSelect) {
                        editFileSharingSelect.setSelected(file.allowed_users || []);
                    }
                    
                    // We might need to remember if we opened from an appointment modal
                    editFileModal.dataset.fromAppointment = fromAppointmentId || '';
                    
                    editFileModal.classList.add('active');
                } else {
                    alert(data?.error || 'Fehler beim Laden der Dateidetails.');
                }
            })
            .catch(err => {
                console.error(err);
                alert('Systemfehler beim Laden.');
            });
    };

    function closeEditFileModal() {
        editFileModal.classList.remove('active');
        editFileForm.reset();
        editFileNameDisplay.textContent = '';
        if (editFileErrorAlert) {
            editFileErrorAlert.classList.add('hidden');
            editFileErrorMessage.textContent = '';
        }
    }

    closeEditModalBtn.addEventListener('click', closeEditFileModal);
    cancelEditModalBtn.addEventListener('click', closeEditFileModal);

    editAppointmentField.addEventListener('change', () => {
        if (editAppointmentField.value) {
            editFileSharingGroup.classList.add('hidden');
        } else {
            editFileSharingGroup.classList.remove('hidden');
        }
    });

    editFileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const appointmentId = editAppointmentField.value || null;
        let allowedUsers = [];
        if (!appointmentId && editFileSharingSelect) {
            allowedUsers = editFileSharingSelect.getSelected();
        }
        
        const payload = {
            action: 'update',
            id: parseInt(editFileId.value, 10),
            appointment_id: appointmentId,
            allowed_users: allowedUsers
        };

        const saveBtn = document.getElementById('save-edit-modal-btn');
        const originalBtnText = saveBtn.textContent;
        saveBtn.textContent = 'Speichert...';
        saveBtn.disabled = true;

        fetch('files_api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            saveBtn.textContent = originalBtnText;
            saveBtn.disabled = false;
            
            if (data && data.success) {
                closeEditFileModal();
                
                const fromAppointmentId = editFileModal.dataset.fromAppointment;
                if (fromAppointmentId) {
                    openEditModal(fromAppointmentId); // refresh appointment modal
                } else {
                    loadGlobalFiles(); // refresh global file list
                }
            } else {
                editFileErrorMessage.textContent = data?.error || 'Fehler beim Speichern.';
                editFileErrorAlert.classList.remove('hidden');
            }
        })
        .catch(err => {
            console.error(err);
            saveBtn.textContent = originalBtnText;
            saveBtn.disabled = false;
            editFileErrorMessage.textContent = 'Systemfehler beim Speichern.';
            editFileErrorAlert.classList.remove('hidden');
        });
    });

    window.deleteFile = function(fileId, appointmentId) {
        if (!confirm('Möchtest du diese Datei wirklich löschen?')) return;
        
        fetch('files_api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id: fileId })
        })
        .then(res => res.json())
        .then(data => {
            if (data && data.success) {
                if (appointmentId) {
                    openEditModal(appointmentId); // Refresh modal
                } else {
                    loadGlobalFiles(); // Refresh list
                }
            } else {
                alert(data?.error || 'Fehler beim Löschen.');
            }
        })
        .catch(err => console.error(err));
    };

    function openUploadModal() {
        globalFileUploadForm.reset();
        globalFileNameDisplay.textContent = 'Keine Datei ausgewählt';
        if (fileSharingSelect) {
            fileSharingSelect.clear();
        }
        
        // Hide error alert
        if (uploadFileErrorAlert) {
            uploadFileErrorAlert.classList.add('hidden');
            uploadFileErrorMessage.textContent = '';
        }
        
        // Populate the appointment dropdown with only upcoming appointments
        globalUploadAppointmentField.innerHTML = '<option value="">Kein Termin zugeordnet</option>';
        cachedAppointments.forEach(apt => {
            const dateStr = formatDateOnly(apt.appointment_date);
            const opt = document.createElement('option');
            opt.value = apt.id;
            opt.textContent = `Termin am ${dateStr}: ${apt.title}`;
            globalUploadAppointmentField.appendChild(opt);
        });
        
        fileSharingGroup.classList.remove('hidden');
        uploadFileModal.classList.add('active');
    }

    function closeUploadModal() {
        uploadFileModal.classList.remove('active');
        globalFileUploadForm.reset();
        globalFileNameDisplay.textContent = 'Keine Datei ausgewählt';
        if (uploadFileErrorAlert) {
            uploadFileErrorAlert.classList.add('hidden');
            uploadFileErrorMessage.textContent = '';
        }
    }

    uploadGlobalBtn.addEventListener('click', openUploadModal);
    closeUploadModalBtn.addEventListener('click', closeUploadModal);
    cancelUploadModalBtn.addEventListener('click', closeUploadModal);

    btnSelectGlobalFile.addEventListener('click', () => {
        globalUploadFileField.click();
    });

    globalUploadFileField.addEventListener('change', () => {
        const file = globalUploadFileField.files[0];
        if (file) {
            globalFileNameDisplay.textContent = file.name;
        } else {
            globalFileNameDisplay.textContent = 'Keine Datei ausgewählt';
        }
    });

    globalUploadAppointmentField.addEventListener('change', () => {
        if (globalUploadAppointmentField.value) {
            fileSharingGroup.classList.add('hidden');
        } else {
            fileSharingGroup.classList.remove('hidden');
        }
    });

    globalFileUploadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const appointmentId = globalUploadAppointmentField.value || null;
        let allowed = [];
        if (!appointmentId && fileSharingSelect) {
            allowed = fileSharingSelect.getSelected();
        }
        handleFileUpload(globalUploadFileField, appointmentId, allowed);
    });

    function handleFileUpload(fileInput, appointmentId = null, allowedUsers = []) {
        const file = fileInput.files[0];
        if (!file) return;
        
        // Limit 1 GB
        if (file.size > 1073741824) {
            alert('Die Datei ist zu groß. (Max. 1 GB)');
            fileInput.value = '';
            return;
        }

        const formData = new FormData();
        formData.append('action', 'upload');
        formData.append('file', file);
        if (appointmentId) {
            formData.append('appointment_id', appointmentId);
        } else {
            formData.append('allowed_users', JSON.stringify(allowedUsers));
        }

        const isGlobalUpload = uploadFileModal.classList.contains('active');

        // Show uploading state
        let originalBtnText = '';
        let btnToRestore = null;
        
        if (!isGlobalUpload) {
            originalBtnText = btnUploadAppointmentFile.textContent;
            btnUploadAppointmentFile.textContent = 'Lädt...';
            btnUploadAppointmentFile.disabled = true;
            btnToRestore = btnUploadAppointmentFile;
        } else {
            originalBtnText = saveUploadModalBtn.textContent;
            saveUploadModalBtn.textContent = 'Lädt...';
            saveUploadModalBtn.disabled = true;
            btnToRestore = saveUploadModalBtn;
        }

        fetch('files_api.php', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            fileInput.value = '';
            if (btnToRestore) {
                btnToRestore.textContent = originalBtnText;
                btnToRestore.disabled = false;
            }

            if (data && data.success) {
                if (isGlobalUpload && uploadFileErrorAlert) {
                    uploadFileErrorAlert.classList.add('hidden');
                    uploadFileErrorMessage.textContent = '';
                }
                if (appointmentId && !isGlobalUpload) {
                    openEditModal(appointmentId); // Refresh modal to show new file
                } else {
                    closeUploadModal();
                    loadGlobalFiles(); // Refresh list
                }
            } else {
                const errMsg = data?.error || 'Fehler beim Upload.';
                if (isGlobalUpload && uploadFileErrorAlert) {
                    uploadFileErrorMessage.textContent = errMsg;
                    uploadFileErrorAlert.classList.remove('hidden');
                } else {
                    alert(errMsg);
                }
            }
        })
        .catch(err => {
            fileInput.value = '';
            if (btnToRestore) {
                btnToRestore.textContent = originalBtnText;
                btnToRestore.disabled = false;
            }
            console.error('Upload Error:', err);
            const errMsg = 'Systemfehler beim Upload.';
            if (isGlobalUpload && uploadFileErrorAlert) {
                uploadFileErrorMessage.textContent = errMsg;
                uploadFileErrorAlert.classList.remove('hidden');
            } else {
                alert(errMsg);
            }
        });
    }

    btnUploadAppointmentFile.addEventListener('click', () => {
        if (!btnUploadAppointmentFile.disabled) {
            appointmentFileInput.click();
        }
    });
    appointmentFileInput.addEventListener('change', () => {
        const appId = appointmentIdInput.value;
        if (appId) handleFileUpload(appointmentFileInput, appId);
    });

    // --- ADMIN LOGIC ---
    let adminActionType = null; // 'deactivate_user', 'activate_user', 'reset_password'
    let currentAdminActionUserId = null;

    function loadUsersAdmin() {
        if (!usersTbody) return;
        fetch('admin_api.php?action=list_users')
            .then(res => res.json())
            .then(data => {
                if (data && data.success) {
                    renderUsersAdmin(data.users);
                } else {
                    usersTbody.innerHTML = `<tr><td colspan="5" class="table-empty-message" style="color:red;">Fehler beim Laden.</td></tr>`;
                }
            })
            .catch(err => console.error('Error fetching admin users:', err));
    }

    function renderUsersAdmin(users) {
        usersTbody.innerHTML = '';
        if (users.length === 0) {
            usersTbody.innerHTML = `<tr><td colspan="5" class="table-empty-message">Keine Benutzer vorhanden.</td></tr>`;
            return;
        }

        users.forEach(u => {
            const tr = document.createElement('tr');
            
            const nameEscaped = escapeHtml(u.username);
            const roleStr = u.role === 'admin' ? 'Admin' : 'User';
            const statusDot = u.is_active 
                ? '<span class="status-dot" style="background:var(--success-color)"></span> Aktiv' 
                : '<span class="status-dot" style="background:var(--error-color)"></span> Inaktiv';
            
            let loginStr = '-';
            if (u.last_login_at) {
                loginStr = formatDateSimple(u.last_login_at);
            }

            let actionsHtml = `<div class="action-buttons" style="display:flex; justify-content:flex-end; gap:8px;">
                <button class="btn-cancel btn-sm" onclick="promptResetPassword(${u.id})">Passwort zurücksetzen</button>
            `;
            if (u.is_active) {
                actionsHtml += `<button class="btn-delete btn-sm" onclick="promptToggleActive(${u.id}, false)">Deaktivieren</button>`;
            } else {
                actionsHtml += `<button class="btn-save btn-sm" onclick="promptToggleActive(${u.id}, true)">Aktivieren</button>`;
            }
            actionsHtml += `</div>`;

            tr.innerHTML = `
                <td data-label="Benutzername"><strong>${nameEscaped}</strong></td>
                <td data-label="Rolle">${roleStr}</td>
                <td data-label="Status">${statusDot}</td>
                <td data-label="Letzter Login">${loginStr}</td>
                <td data-label="Aktionen" class="text-right">${actionsHtml}</td>
            `;
            usersTbody.appendChild(tr);
        });
    }

    window.promptResetPassword = function(id) {
        adminActionType = 'reset_password';
        currentAdminActionUserId = id;
        document.querySelector('#confirm-overlay h3').textContent = 'Passwort zurücksetzen?';
        document.querySelector('#confirm-overlay p').textContent = 'Das Passwort dieses Benutzers wird auf "Start123!" zurückgesetzt. Möchtest du fortfahren?';
        confirmOverlay.classList.add('active');
    };

    window.promptToggleActive = function(id, activate) {
        adminActionType = activate ? 'activate_user' : 'deactivate_user';
        currentAdminActionUserId = id;
        document.querySelector('#confirm-overlay h3').textContent = activate ? 'Benutzer aktivieren?' : 'Benutzer deaktivieren?';
        document.querySelector('#confirm-overlay p').textContent = activate ? 'Der Benutzer kann sich danach wieder anmelden.' : 'Der Benutzer wird sofort abgemeldet und kann sich nicht mehr einloggen. Termine und Dateien bleiben erhalten.';
        confirmOverlay.classList.add('active');
    };

    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            addUserForm.reset();
            addUserErrorAlert.classList.add('hidden');
            addUserModal.classList.add('active');
        });

        window.closeAddUserModal = function() {
            addUserModal.classList.remove('active');
        };

        closeAddUserModalBtn.addEventListener('click', closeAddUserModal);
        cancelAddUserModalBtn.addEventListener('click', closeAddUserModal);

        addUserForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = newUsernameInput.value.trim();
            const role = newRoleInput.value;

            if (!username) return;

            fetch('admin_api.php?action=add_user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, role })
            })
            .then(res => res.json())
            .then(data => {
                if (data && data.success) {
                    closeAddUserModal();
                    loadUsersAdmin();
                } else {
                    addUserErrorMessage.textContent = data.error || 'Fehler beim Erstellen.';
                    addUserErrorAlert.classList.remove('hidden');
                }
            })
            .catch(err => {
                console.error(err);
                addUserErrorMessage.textContent = 'Systemfehler.';
                addUserErrorAlert.classList.remove('hidden');
            });
        });
    }
});
