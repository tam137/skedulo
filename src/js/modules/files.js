import { state } from '../state.js';
import * as api from '../api.js';
import { formatBytes, formatDateSimple, escapeHtml } from '../utils.js';

const filesTbody = document.getElementById('files-tbody');
const uploadGlobalBtn = document.getElementById('upload-global-file-btn');
const globalFileInput = document.getElementById('global-file-input');

// Global File Upload Modal
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

// Edit File Modal
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

// Appointment Modal elements
const btnUploadAppointmentFile = document.getElementById('btn-upload-appointment-file');
const appointmentFileInput = document.getElementById('appointment-file-input');
const appointmentFilesList = document.getElementById('appointment-files-list');

export function loadGlobalFiles() {
    api.fetchFiles()
        .then(data => {
            if (data && data.success) {
                renderGlobalFiles(data.files || []);
            } else {
                alert(data?.error || 'Fehler beim Laden der Dateien.');
            }
        })
        .catch(err => {
            console.error('Error loading files:', err);
        });
}

function renderGlobalFiles(files) {
    if (!filesTbody) return;
    filesTbody.innerHTML = '';

    if (files.length === 0) {
        filesTbody.innerHTML = `<tr>
            <td colspan="6" class="table-empty-message">
                Keine Dateien hochgeladen.
            </td>
        </tr>`;
        return;
    }

    files.forEach(file => {
        const tr = document.createElement('tr');
        tr.dataset.id = file.id;

        const sizeFormatted = formatBytes(file.file_size);
        const dateFormatted = formatDateSimple(file.uploaded_at);
        const nameEscaped = escapeHtml(file.original_name);
        const creatorEscaped = escapeHtml(file.creator_name);
        
        let appointmentLabel = '-';
        if (file.appointment_title) {
            const iconPrefix = file.appointment_icon ? file.appointment_icon + ' ' : '';
            appointmentLabel = iconPrefix + escapeHtml(file.appointment_title);
        }

        const isCreator = parseInt(file.created_by, 10) === state.currentUserId;
        let actionsHtml = `
            <a href="files_api.php?action=view&id=${file.id}" target="_blank" class="action-icon-view" title="Ansehen">👁️</a>
            <a href="files_api.php?action=download&id=${file.id}" class="action-icon-download" title="Herunterladen">📥</a>
        `;
        
        if (isCreator) {
            actionsHtml += `
                <button type="button" class="action-btn-edit" title="Bearbeiten" data-id="${file.id}">✏️</button>
                <button type="button" class="action-btn-delete" title="Löschen" data-id="${file.id}">🗑️</button>
            `;
        }

        tr.innerHTML = `
            <td data-label="Dateiname" style="font-weight: 500;">${nameEscaped}</td>
            <td data-label="Termin">${appointmentLabel}</td>
            <td data-label="Größe">${sizeFormatted}</td>
            <td data-label="Hochgeladen von">${creatorEscaped}</td>
            <td data-label="Datum">${dateFormatted}</td>
            <td class="text-right" data-label="Aktionen">
                <div class="actions-flex-container">
                    ${actionsHtml}
                </div>
            </td>
        `;

        tr.addEventListener('click', (e) => {
            if (e.target.closest('a') || e.target.closest('button')) {
                return;
            }
            if (isCreator) {
                openEditFileModal(file.id);
            }
        });

        filesTbody.appendChild(tr);
    });

    filesTbody.querySelectorAll('.action-btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (confirm('Bist du sicher, dass du diese Datei dauerhaft löschen möchtest?')) {
                api.deleteFile(id)
                    .then(data => {
                        if (data && data.success) {
                            loadGlobalFiles();
                        } else {
                            alert(data?.error || 'Fehler beim Löschen der Datei.');
                        }
                    })
                    .catch(err => {
                        console.error('Error deleting file:', err);
                    });
            }
        });
    });

    filesTbody.querySelectorAll('.action-btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            openEditFileModal(id);
        });
    });
}

export function renderAppointmentFiles(files, appointmentId) {
    if (!appointmentFilesList) return;
    appointmentFilesList.innerHTML = '';

    if (files.length === 0) {
        appointmentFilesList.innerHTML = '<div style="color: var(--text-secondary); font-size: 0.9rem; padding: 4px 0;">Keine Dateien angehängt.</div>';
        return;
    }

    files.forEach(file => {
        const div = document.createElement('div');
        div.className = 'appointment-file-item';

        const sizeFormatted = formatBytes(file.file_size);
        const nameEscaped = escapeHtml(file.original_name);
        const isCreator = parseInt(file.created_by, 10) === state.currentUserId;

        let actionsHtml = `
            <a href="files_api.php?action=view&id=${file.id}" target="_blank" class="action-icon-view" title="Ansehen">👁️</a>
            <a href="files_api.php?action=download&id=${file.id}" class="action-icon-download" title="Herunterladen">📥</a>
        `;

        if (isCreator) {
            actionsHtml += `<button type="button" class="action-btn-delete" title="Löschen" data-id="${file.id}">🗑️</button>`;
        }

        div.innerHTML = `
            <div class="appointment-file-info">
                <span class="appointment-file-name" title="${nameEscaped}">${nameEscaped}</span>
                <span class="appointment-file-meta">von ${escapeHtml(file.creator_name)} (${sizeFormatted})</span>
            </div>
            <div class="appointment-file-actions">
                ${actionsHtml}
            </div>
        `;

        div.querySelector('.action-btn-delete')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Bist du sicher, dass du diese Datei dauerhaft löschen möchtest?')) {
                api.deleteFile(file.id)
                    .then(data => {
                        if (data && data.success) {
                            fetch(`appointments_api.php?action=get&id=${appointmentId}`)
                                .then(res => res.json())
                                .then(aptData => {
                                    if (aptData && aptData.success) {
                                        renderAppointmentFiles(aptData.files || [], appointmentId);
                                    }
                                });
                        } else {
                            alert(data?.error || 'Fehler beim Löschen der Datei.');
                        }
                    })
                    .catch(err => {
                        console.error('Error deleting file:', err);
                    });
            }
        });

        appointmentFilesList.appendChild(div);
    });
}

export function openEditFileModal(id) {
    editFileForm.reset();
    editFileErrorAlert.classList.add('hidden');
    editFileId.value = id;

    fetch('appointments_api.php?action=list')
        .then(res => res.json())
        .then(data => {
            const select = editAppointmentField;
            select.innerHTML = '<option value="">Kein Termin zugeordnet</option>';
            if (data && data.success) {
                const allApts = [...(data.upcoming || []), ...(data.past || [])];
                allApts.forEach(apt => {
                    const option = document.createElement('option');
                    option.value = apt.id;
                    const iconPrefix = apt.icon ? apt.icon + ' ' : '';
                    option.textContent = `${iconPrefix}${apt.title}`;
                    select.appendChild(option);
                });
            }
            return api.fetchFileDetails(id);
        })
        .then(fileData => {
            if (!fileData || !fileData.success) {
                alert(fileData?.error || 'Fehler beim Laden der Dateidetails.');
                return;
            }

            const file = fileData.file;
            editFileNameDisplay.textContent = file.original_name;
            editAppointmentField.value = file.appointment_id || '';

            if (state.editFileSharingSelect) {
                state.editFileSharingSelect.setSelected(fileData.allowed_users || []);
            }

            toggleEditSharingGroup();
            editFileModal.classList.add('active');
        })
        .catch(err => {
            console.error('Error opening file edit modal:', err);
        });
}

function closeEditFileModal() {
    editFileModal.classList.remove('active');
}

function toggleEditSharingGroup() {
    if (editAppointmentField.value !== '') {
        editFileSharingGroup.classList.add('hidden');
    } else {
        editFileSharingGroup.classList.remove('hidden');
    }
}

export function openUploadModal() {
    globalFileUploadForm.reset();
    uploadFileErrorAlert.classList.add('hidden');
    globalFileNameDisplay.textContent = 'Keine Datei ausgewählt';
    globalUploadFileField.value = '';

    fetch('appointments_api.php?action=list')
        .then(res => res.json())
        .then(data => {
            const select = globalUploadAppointmentField;
            select.innerHTML = '<option value="">Kein Termin zugeordnet</option>';
            if (data && data.success) {
                const allApts = [...(data.upcoming || []), ...(data.past || [])];
                allApts.forEach(apt => {
                    const option = document.createElement('option');
                    option.value = apt.id;
                    const iconPrefix = apt.icon ? apt.icon + ' ' : '';
                    option.textContent = `${iconPrefix}${apt.title}`;
                    select.appendChild(option);
                });
            }
            if (state.fileSharingSelect) {
                state.fileSharingSelect.clear();
            }
            toggleUploadSharingGroup();
            uploadFileModal.classList.add('active');
        })
        .catch(err => console.error('Error initializing upload modal:', err));
}

function closeUploadModal() {
    uploadFileModal.classList.remove('active');
}

function toggleUploadSharingGroup() {
    if (globalUploadAppointmentField.value !== '') {
        fileSharingGroup.classList.add('hidden');
    } else {
        fileSharingGroup.classList.remove('hidden');
    }
}

export function handleFileUpload(fileInput, appointmentId = null, allowedUsers = []) {
    if (!fileInput.files || fileInput.files.length === 0) return;
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    if (appointmentId) {
        formData.append('appointment_id', appointmentId);
    } else {
        formData.append('allowed_users', JSON.stringify(allowedUsers));
    }

    return api.uploadFileAPI(formData);
}

if (uploadGlobalBtn) {
    uploadGlobalBtn.addEventListener('click', openUploadModal);
}

if (btnSelectGlobalFile) {
    btnSelectGlobalFile.addEventListener('click', () => {
        globalUploadFileField.click();
    });
}

if (globalUploadFileField) {
    globalUploadFileField.addEventListener('change', () => {
        if (globalUploadFileField.files && globalUploadFileField.files[0]) {
            globalFileNameDisplay.textContent = globalUploadFileField.files[0].name;
        } else {
            globalFileNameDisplay.textContent = 'Keine Datei ausgewählt';
        }
    });
}

if (globalUploadAppointmentField) {
    globalUploadAppointmentField.addEventListener('change', toggleUploadSharingGroup);
}

if (closeUploadModalBtn) closeUploadModalBtn.addEventListener('click', closeUploadModal);
if (cancelUploadModalBtn) cancelUploadModalBtn.addEventListener('click', closeUploadModal);

if (globalFileUploadForm) {
    globalFileUploadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        uploadFileErrorAlert.classList.add('hidden');

        const file = globalUploadFileField.files[0];
        if (!file) {
            uploadFileErrorMessage.textContent = 'Bitte wähle eine Datei aus.';
            uploadFileErrorAlert.classList.remove('hidden');
            return;
        }

        const allowedUsers = state.fileSharingSelect ? state.fileSharingSelect.getSelected() : [];
        const appointmentId = globalUploadAppointmentField.value || null;

        handleFileUpload(globalUploadFileField, appointmentId, allowedUsers)
            .then(data => {
                if (data && data.success) {
                    closeUploadModal();
                    loadGlobalFiles();
                } else {
                    uploadFileErrorMessage.textContent = data?.error || 'Fehler beim Hochladen.';
                    uploadFileErrorAlert.classList.remove('hidden');
                }
            })
            .catch(err => {
                console.error('Error uploading file:', err);
                uploadFileErrorMessage.textContent = 'Systemfehler beim Hochladen.';
                uploadFileErrorAlert.classList.remove('hidden');
            });
    });
}

if (btnUploadAppointmentFile) {
    btnUploadAppointmentFile.addEventListener('click', () => {
        appointmentFileInput.click();
    });
}

if (appointmentFileInput) {
    appointmentFileInput.addEventListener('change', () => {
        const appointmentId = document.getElementById('appointment-id').value;
        if (!appointmentId) return;

        handleFileUpload(appointmentFileInput, appointmentId)
            .then(data => {
                if (data && data.success) {
                    fetch(`appointments_api.php?action=get&id=${appointmentId}`)
                        .then(res => res.json())
                        .then(aptData => {
                            if (aptData && aptData.success) {
                                renderAppointmentFiles(aptData.files || [], appointmentId);
                            }
                        });
                } else {
                    alert(data?.error || 'Fehler beim Hochladen der Datei.');
                }
                appointmentFileInput.value = '';
            })
            .catch(err => {
                console.error('Error uploading file:', err);
                appointmentFileInput.value = '';
            });
    });
}

if (editAppointmentField) {
    editAppointmentField.addEventListener('change', toggleEditSharingGroup);
}

if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', closeEditFileModal);
if (cancelEditModalBtn) cancelEditModalBtn.addEventListener('click', closeEditFileModal);

if (editFileForm) {
    editFileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        editFileErrorAlert.classList.add('hidden');

        const formData = new FormData(editFileForm);
        formData.append('id', editFileId.value);
        formData.append('appointment_id', editAppointmentField.value || '');
        
        const allowedUsers = state.editFileSharingSelect ? state.editFileSharingSelect.getSelected() : [];
        formData.append('allowed_users', JSON.stringify(allowedUsers));

        api.saveFile(formData)
            .then(data => {
                if (data && data.success) {
                    closeEditFileModal();
                    loadGlobalFiles();
                } else {
                    editFileErrorMessage.textContent = data?.error || 'Fehler beim Speichern der Datei.';
                    editFileErrorAlert.classList.remove('hidden');
                }
            })
            .catch(err => {
                console.error('Error saving file details:', err);
                editFileErrorMessage.textContent = 'Systemfehler beim Speichern.';
                editFileErrorAlert.classList.remove('hidden');
            });
    });
}

document.addEventListener('view-changed', (e) => {
    if (e.detail.view === 'files') {
        loadGlobalFiles();
    }
});
