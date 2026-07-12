import { state } from './state.js';
import * as api from './api.js';
import { CustomMultiSelect } from './components/CustomMultiSelect.js';

// Import modules to register event listeners
import './modules/navigation.js';
import './modules/appointments.js';
import './modules/files.js';
import './modules/admin.js';

import { switchView } from './modules/navigation.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch users and initialize custom multiselect controls
    api.fetchUsers()
        .then(users => {
            state.userList = users;
            
            state.appointmentSharingSelect = new CustomMultiSelect('appointment-sharing-select', 'Niemandem freigegeben');
            state.appointmentSharingSelect.setUsers(state.userList);
            
            state.fileSharingSelect = new CustomMultiSelect('file-sharing-select', 'Niemandem freigegeben');
            state.fileSharingSelect.setUsers(state.userList);

            state.editFileSharingSelect = new CustomMultiSelect('edit-file-sharing-select', 'Niemandem freigegeben');
            state.editFileSharingSelect.setUsers(state.userList);
            
            // 2. Load the initial active view
            const savedView = sessionStorage.getItem('dashboard_current_view') || 'calendar';
            switchView(savedView, true);
        })
        .catch(err => {
            console.error('Failed to initialize app users:', err);
            // fallback load view
            const savedView = sessionStorage.getItem('dashboard_current_view') || 'calendar';
            switchView(savedView, true);
        });
});
