import { state } from '../state.js';
import * as api from '../api.js';
import { formatAppointmentDate, formatDateOnly, formatDateSimple, escapeHtml, formatChanges } from '../utils.js';
import { renderAppointmentFiles } from './files.js';

const appointmentModal = document.getElementById('appointment-modal');
const confirmOverlay = document.getElementById('confirm-overlay');
const appointmentForm = document.getElementById('appointment-form');
const modalTitle = document.getElementById('modal-title');
const appointmentIdInput = document.getElementById('appointment-id');
const titleInput = document.getElementById('title');
const dateInput = document.getElementById('appointment_date');
const locationInput = document.getElementById('location');
const notesInput = document.getElementById('notes');
const appointmentIconInput = document.getElementById('appointment-icon');
const emojiPicker = document.getElementById('emoji-picker');
const emojiBtns = emojiPicker ? emojiPicker.querySelectorAll('.emoji-btn') : [];

const filterEmojiBar = document.getElementById('filter-emoji-bar');
const filterEmojiBtns = filterEmojiBar ? filterEmojiBar.querySelectorAll('.filter-emoji-btn') : [];
const filterEmojiSelect = document.getElementById('filter-emoji-select');

const addBtn = document.getElementById('add-appointment-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelModalBtn = document.getElementById('cancel-modal-btn');
const deleteBtn = document.getElementById('delete-btn');
const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const historySection = document.getElementById('modal-history-section');
const historyContent = document.getElementById('history-content');
const historyDetails = document.getElementById('history-details');

const btnUploadAppointmentFile = document.getElementById('btn-upload-appointment-file');
const filesHint = document.getElementById('files-hint');
const appointmentFilesList = document.getElementById('appointment-files-list');

let fp;
if (dateInput) {
    fp = flatpickr(dateInput, {
        locale: "de",
        altInput: true,
        altFormat: "d.m.Y",
        dateFormat: "Y-m-d",
        disableMobile: true
    });
}

export function loadAppointments() {
    api.fetchAppointments()
        .then(data => {
            state.cachedAppointments = data.upcoming;
            state.cachedPastAppointments = data.past;
            applyFilters();
        })
        .catch(err => {
            console.error('Error loading appointments:', err);
        });
}

export function applyFilters() {
    let filteredUpcoming = state.cachedAppointments;
    let filteredPast = state.cachedPastAppointments;

    if (state.currentEmojiFilter !== 'all') {
        filteredUpcoming = state.cachedAppointments.filter(apt => (apt.icon || '') === state.currentEmojiFilter);
        filteredPast = state.cachedPastAppointments.filter(apt => (apt.icon || '') === state.currentEmojiFilter);
    }

    renderTable(filteredUpcoming, 'upcoming-tbody', 'Lade Termine...', 'Keine anstehenden Termine vorhanden.');
    renderTable(filteredPast, 'past-tbody', 'Lade Termine...', 'Keine vergangenen Termine vorhanden.');
}

function renderTable(appointments, tbodyId, loadingText, emptyText) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
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
        
        const dateHtml = formatAppointmentDate(apt.appointment_date, apt.all_day, apt.duration_hours, apt.duration_days);
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
            <td data-label="Notizen" class="cell-notes">${notesEscaped}</td>
        `;

        tr.addEventListener('click', () => openEditModal(apt.id));
        tbody.appendChild(tr);
    });
}

export function openCreateModal() {
    appointmentForm.reset();
    appointmentIdInput.value = '';
    modalTitle.textContent = 'Termin erstellen';
    deleteBtn.classList.add('hidden');
    historySection.classList.add('hidden');
    historyContent.innerHTML = '';
    
    if (state.appointmentSharingSelect) {
        state.appointmentSharingSelect.clear();
        state.appointmentSharingSelect.setDisabled(false);
    }

    appointmentIconInput.value = '';
    emojiBtns.forEach(btn => {
        if (btn.dataset.emoji === '') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    btnUploadAppointmentFile.disabled = true;
    filesHint.classList.remove('hidden');
    appointmentFilesList.innerHTML = '';

    // Reset Termintyp to all_day
    const allDayRadio = document.querySelector('input[name="appointment_type"][value="all_day"]');
    if (allDayRadio) {
        allDayRadio.checked = true;
    }
    const durationHoursInput = document.getElementById('duration_hours');
    const durationDaysInput = document.getElementById('duration_days');
    if (durationHoursInput) durationHoursInput.value = '';
    if (durationDaysInput) durationDaysInput.value = '';
    const startTimeInput = document.getElementById('start_time');
    if (startTimeInput) startTimeInput.value = "08:00";
    const durationDaysError = document.getElementById('duration-days-error');
    if (durationDaysError) durationDaysError.style.display = 'none';
    toggleAppointmentTypeFields();
    
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    if (fp) fp.setDate(`${yyyy}-${mm}-${dd}`);

    appointmentModal.classList.add('active');
}

export function openEditModal(id) {
    api.fetchAppointmentDetails(id)
        .then(data => {
            const apt = data.appointment;
            appointmentIdInput.value = apt.id;
            titleInput.value = apt.title;
            locationInput.value = apt.location || '';
            notesInput.value = apt.notes || '';

            const isCreator = parseInt(apt.created_by, 10) === state.currentUserId;

            if (state.appointmentSharingSelect) {
                state.appointmentSharingSelect.setSelected(data.allowed_users || []);
                state.appointmentSharingSelect.setDisabled(!isCreator);
            }

            const currentIcon = apt.icon || '';
            appointmentIconInput.value = currentIcon;
            emojiBtns.forEach(btn => {
                if (btn.dataset.emoji === currentIcon) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            btnUploadAppointmentFile.disabled = false;
            filesHint.classList.add('hidden');
            renderAppointmentFiles(data.files || [], apt.id);

            // Set Termintyp UI
            let type = 'all_day';
            const isAllDay = apt.all_day === true || apt.all_day === 1 || apt.all_day === '1' || apt.all_day === 'true';
            const durationHoursInput = document.getElementById('duration_hours');
            const durationDaysInput = document.getElementById('duration_days');
            
            if (durationHoursInput) durationHoursInput.value = '';
            if (durationDaysInput) durationDaysInput.value = '';
            const startTimeInput = document.getElementById('start_time');
            if (startTimeInput) startTimeInput.value = "08:00";
            const durationDaysError = document.getElementById('duration-days-error');
            if (durationDaysError) durationDaysError.style.display = 'none';

            if (!isAllDay) {
                type = 'time_based';
                const parts = apt.appointment_date.split(' ');
                if (parts.length > 1) {
                    const timePart = parts[1].substring(0, 5); // HH:MM
                    if (startTimeInput) startTimeInput.value = timePart;
                }
                if (durationHoursInput) durationHoursInput.value = apt.duration_hours || '';
            } else if (apt.duration_days && parseInt(apt.duration_days, 10) > 1) {
                type = 'multi_day';
                if (durationDaysInput) durationDaysInput.value = apt.duration_days;
            }

            const radioToSelect = document.querySelector(`input[name="appointment_type"][value="${type}"]`);
            if (radioToSelect) radioToSelect.checked = true;
            toggleAppointmentTypeFields();

            const d = new Date(apt.appointment_date.replace(' ', 'T'));
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            if (fp) fp.setDate(`${yyyy}-${mm}-${dd}`);

            const historyItems = [];
            if (data.history && data.history.length > 0) {
                data.history.forEach(log => {
                    historyItems.push(log);
                });
            }
            
            historyItems.push({
                changed_at: apt.created_at,
                changer_name: apt.creator_name,
                is_creation: true
            });

            historyContent.innerHTML = '';
            historySection.classList.remove('hidden');
            historyDetails.removeAttribute('open');
            
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
            if (isCreator) {
                deleteBtn.classList.remove('hidden');
            } else {
                deleteBtn.classList.add('hidden');
            }
            appointmentModal.classList.add('active');
        })
        .catch(err => {
            console.error('Error fetching appointment details:', err);
            alert('Systemfehler beim Abrufen der Details.');
        });
}

// formatChanges is now imported from ../utils.js

export function closeModal() {
    appointmentModal.classList.remove('active');
    appointmentForm.reset();
}

export function showConfirmOverlay(id) {
    state.currentDeleteId = id;
    confirmOverlay.classList.add('active');
}

export function hideConfirmOverlay() {
    state.currentDeleteId = null;
    state.adminActionType = null;
    state.currentAdminActionUserId = null;
    confirmOverlay.classList.remove('active');
    
    const confirmTitle = document.querySelector('#confirm-overlay h3');
    const confirmDesc = document.querySelector('#confirm-overlay p');
    if (confirmTitle) confirmTitle.textContent = 'Termin löschen?';
    if (confirmDesc) confirmDesc.textContent = 'Bist du sicher, dass du diesen Termin dauerhaft löschen möchtest?';
}

if (addBtn) addBtn.addEventListener('click', openCreateModal);
if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);

emojiBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        emojiBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        appointmentIconInput.value = btn.dataset.emoji;
    });
});

function handleEmojiFilterClick(emoji) {
    if (state.currentEmojiFilter === emoji) {
        state.currentEmojiFilter = 'all';
        filterEmojiBtns.forEach(b => b.classList.remove('active'));
        if (filterEmojiSelect) filterEmojiSelect.value = 'all';
    } else {
        state.currentEmojiFilter = emoji;
        filterEmojiBtns.forEach(b => {
            b.classList.toggle('active', b.dataset.emoji === emoji);
        });
        if (filterEmojiSelect) filterEmojiSelect.value = emoji;
    }
    applyFilters();
}

filterEmojiBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        handleEmojiFilterClick(btn.dataset.emoji);
    });
});

if (filterEmojiSelect) {
    filterEmojiSelect.addEventListener('change', () => {
        const selectedEmoji = filterEmojiSelect.value;
        state.currentEmojiFilter = selectedEmoji;
        filterEmojiBtns.forEach(b => {
            b.classList.toggle('active', b.dataset.emoji === selectedEmoji);
        });
        applyFilters();
    });
}

if (deleteBtn) {
    deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = appointmentIdInput.value;
        if (id) {
            showConfirmOverlay(id);
        }
    });
}

if (confirmCancelBtn) {
    confirmCancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        hideConfirmOverlay();
    });
}

if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (state.adminActionType && state.currentAdminActionUserId) {
            document.dispatchEvent(new CustomEvent('admin-action-confirm'));
            return;
        }
        if (state.currentDeleteId) {
            api.deleteAppointment(state.currentDeleteId)
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
                    alert('Systemfehler beim Löschen des Termins.');
                });
        }
    });
}

if (appointmentForm) {
    appointmentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const selectedType = document.querySelector('input[name="appointment_type"]:checked')?.value;
        const durationDaysInput = document.getElementById('duration_days');
        const durationDaysError = document.getElementById('duration-days-error');
        
        if (selectedType === 'multi_day') {
            const val = durationDaysInput ? parseInt(durationDaysInput.value, 10) : 0;
            if (isNaN(val) || val < 2) {
                if (durationDaysError) durationDaysError.style.display = 'block';
                if (durationDaysInput) durationDaysInput.focus();
                return;
            }
        }

        const formData = new FormData(appointmentForm);
        
        if (state.appointmentSharingSelect) {
            const allowedUsers = state.appointmentSharingSelect.getSelected();
            formData.append('allowed_users', JSON.stringify(allowedUsers));
        }

        api.saveAppointment(formData)
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
}

document.addEventListener('view-changed', (e) => {
    if (e.detail.view === 'calendar') {
        loadAppointments();
    }
});

function toggleAppointmentTypeFields() {
    const timeBasedFields = document.getElementById('time-based-fields');
    const multiDayFields = document.getElementById('multi-day-fields');
    const dateLabel = document.getElementById('date-label');
    const startTimeInput = document.getElementById('start_time');
    const durationHoursInput = document.getElementById('duration_hours');
    const durationDaysInput = document.getElementById('duration_days');
    const durationDaysError = document.getElementById('duration-days-error');
    
    const selectedType = document.querySelector('input[name="appointment_type"]:checked')?.value || 'all_day';
    
    if (durationDaysError) durationDaysError.style.display = 'none';

    if (selectedType === 'all_day') {
        if (timeBasedFields) timeBasedFields.style.display = 'none';
        if (multiDayFields) multiDayFields.style.display = 'none';
        if (dateLabel) dateLabel.textContent = 'Datum';
        if (startTimeInput) startTimeInput.removeAttribute('required');
        if (durationHoursInput) durationHoursInput.removeAttribute('required');
        if (durationDaysInput) durationDaysInput.removeAttribute('required');
    } else if (selectedType === 'time_based') {
        if (timeBasedFields) timeBasedFields.style.display = 'grid';
        if (multiDayFields) multiDayFields.style.display = 'none';
        if (dateLabel) dateLabel.textContent = 'Datum';
        if (startTimeInput) startTimeInput.setAttribute('required', 'required');
        if (durationHoursInput) durationHoursInput.setAttribute('required', 'required');
        if (durationDaysInput) durationDaysInput.removeAttribute('required');
    } else if (selectedType === 'multi_day') {
        if (timeBasedFields) timeBasedFields.style.display = 'none';
        if (multiDayFields) multiDayFields.style.display = 'block';
        if (dateLabel) dateLabel.textContent = 'Startdatum';
        if (startTimeInput) startTimeInput.removeAttribute('required');
        if (durationHoursInput) durationHoursInput.removeAttribute('required');
        if (durationDaysInput) durationDaysInput.setAttribute('required', 'required');
    }
}

// Add event listener for radio selector
const typeRadios = document.querySelectorAll('input[name="appointment_type"]');
typeRadios.forEach(radio => {
    radio.addEventListener('change', toggleAppointmentTypeFields);
});

// Add real-time duration checks
const durationDaysInput = document.getElementById('duration_days');
const durationDaysError = document.getElementById('duration-days-error');
if (durationDaysInput) {
    durationDaysInput.addEventListener('input', () => {
        const val = parseInt(durationDaysInput.value, 10);
        const selectedType = document.querySelector('input[name="appointment_type"]:checked')?.value;
        if (selectedType === 'multi_day' && (isNaN(val) || val < 2)) {
            if (durationDaysError) durationDaysError.style.display = 'block';
        } else {
            if (durationDaysError) durationDaysError.style.display = 'none';
        }
    });
}

function initCustomTimePicker() {
    const startTimeInput = document.getElementById('start_time');
    const dropdown = document.getElementById('time-picker-dropdown');
    if (!startTimeInput || !dropdown) return;

    // Show/hide dropdown on focus/click
    startTimeInput.addEventListener('focus', () => {
        dropdown.classList.add('active');
        highlightSelectedTime();
    });

    document.addEventListener('click', (e) => {
        if (!startTimeInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });

    // Handle hour selection
    const hourCells = dropdown.querySelectorAll('.hour-cell');
    hourCells.forEach(cell => {
        cell.addEventListener('click', () => {
            hourCells.forEach(c => c.classList.remove('selected'));
            cell.classList.add('selected');
            updateInputFromSelection();
        });
    });

    // Handle minute selection
    const minuteCells = dropdown.querySelectorAll('.minute-cell');
    minuteCells.forEach(cell => {
        cell.addEventListener('click', () => {
            minuteCells.forEach(c => c.classList.remove('selected'));
            cell.classList.add('selected');
            updateInputFromSelection();
            // Auto close after selecting minute
            dropdown.classList.remove('active');
        });
    });

    // Auto format typing / validation
    startTimeInput.addEventListener('blur', () => {
        formatTimeInput();
    });

    // Utility: Update input value HH:MM based on highlighted cells
    function updateInputFromSelection() {
        const selectedHourCell = dropdown.querySelector('.hour-cell.selected');
        const selectedMinuteCell = dropdown.querySelector('.minute-cell.selected');
        
        const h = selectedHourCell ? selectedHourCell.dataset.value : '08';
        const m = selectedMinuteCell ? selectedMinuteCell.dataset.value : '00';
        
        startTimeInput.value = `${h}:${m}`;
        // Trigger input event so any parent validation is run
        startTimeInput.dispatchEvent(new Event('input'));
    }

    // Utility: Highlight cells in dropdown matching input value
    function highlightSelectedTime() {
        const val = startTimeInput.value.trim();
        const parts = val.split(':');
        let h = '08';
        let m = '00';
        if (parts.length === 2) {
            h = parts[0].padStart(2, '0');
            m = parts[1].padEnd(2, '0').substring(0, 2);
        }

        // Highlight hour
        hourCells.forEach(cell => {
            if (cell.dataset.value === h) {
                cell.classList.add('selected');
                cell.scrollIntoView({ block: 'nearest' });
            } else {
                cell.classList.remove('selected');
            }
        });

        // Highlight minute
        minuteCells.forEach(cell => {
            if (cell.dataset.value === m) {
                cell.classList.add('selected');
                cell.scrollIntoView({ block: 'nearest' });
            } else {
                cell.classList.remove('selected');
            }
        });
    }

    // Utility: Format and validate manually typed input value
    function formatTimeInput() {
        let val = startTimeInput.value.trim().replace(/[^0-9:]/g, '');
        if (!val) {
            startTimeInput.value = '08:00';
            return;
        }

        // Handle HHMM (e.g. 1130 -> 11:30)
        if (val.length === 4 && !val.includes(':')) {
            val = val.substring(0, 2) + ':' + val.substring(2);
        }
        
        const parts = val.split(':');
        let h = parseInt(parts[0], 10);
        let m = parts[1] ? parseInt(parts[1], 10) : 0;

        if (isNaN(h) || h < 0 || h > 23) h = 8;
        if (isNaN(m) || m < 0 || m > 59) m = 0;

        const hStr = String(h).padStart(2, '0');
        const mStr = String(m).padStart(2, '0');

        startTimeInput.value = `${hStr}:${mStr}`;
    }
}

// Initialize on page load
initCustomTimePicker();
