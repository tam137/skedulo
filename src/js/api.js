export function fetchUsers() {
    return fetch('appointments_api.php?action=users')
        .then(res => res.json())
        .then(data => {
            if (data && data.success) return data.users;
            throw new Error(data?.error || 'Fehler beim Laden der Benutzer.');
        });
}

export function fetchAppointments() {
    return fetch('appointments_api.php?action=list')
        .then(res => {
            if (res.status === 401) {
                window.location.href = 'login.php';
                return;
            }
            return res.json();
        })
        .then(data => {
            if (data && data.success) {
                return { upcoming: data.upcoming || [], past: data.past || [] };
            }
            throw new Error(data?.error || 'Fehler beim Laden der Termine.');
        });
}

export function fetchAppointmentDetails(id) {
    return fetch(`appointments_api.php?action=get&id=${id}`)
        .then(res => res.json())
        .then(data => {
            if (data && data.success) return data;
            throw new Error(data?.error || 'Fehler beim Laden des Termins.');
        });
}

export function saveAppointment(formData) {
    return fetch('appointments_api.php?action=save', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json());
}

export function deleteAppointment(id) {
    return fetch(`appointments_api.php?action=delete&id=${id}`, {
        method: 'POST'
    })
    .then(res => res.json());
}

export function changePassword(formData) {
    return fetch('change_password_api.php', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json());
}

export function fetchFiles() {
    return fetch('files_api.php?action=list')
        .then(res => res.json());
}

export function fetchFileDetails(id) {
    return fetch(`files_api.php?action=get&id=${id}`)
        .then(res => res.json());
}

export function saveFile(formData) {
    return fetch('files_api.php?action=save', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json());
}

export function deleteFile(id) {
    return fetch(`files_api.php?action=delete&id=${id}`, {
        method: 'POST'
    })
    .then(res => res.json());
}

export function uploadFileAPI(formData) {
    return fetch('files_api.php?action=upload', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json());
}

export function fetchAdminUsers() {
    return fetch('admin_api.php?action=list_users')
        .then(res => res.json());
}

export function toggleUserStatus(id, active) {
    const action = active ? 'activate_user' : 'deactivate_user';
    return fetch(`admin_api.php?action=${action}&id=${id}`, {
        method: 'POST'
    })
    .then(res => res.json());
}

export function resetUserPassword(id) {
    return fetch(`admin_api.php?action=reset_password&id=${id}`, {
        method: 'POST'
    })
    .then(res => res.json());
}

export function createAdminUser(formData) {
    return fetch('admin_api.php?action=add_user', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json());
}
