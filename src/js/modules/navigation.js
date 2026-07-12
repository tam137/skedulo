import { state } from '../state.js';
import { changePassword } from '../api.js';

// Sidebar Elements
const hamburgerBtn = document.getElementById('hamburger-btn');
const sidebarDrawer = document.getElementById('sidebar-drawer');
const drawerBackdrop = document.getElementById('drawer-backdrop');

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

// View elements
const navCalendar = document.getElementById('nav-calendar');
const navFiles = document.getElementById('nav-files');
const navAdmin = document.getElementById('nav-admin');
const calendarView = document.getElementById('calendar-view');
const filesView = document.getElementById('files-view');
const adminView = document.getElementById('admin-view');
const mainTitle = document.getElementById('main-title');

// Sidebar toggle functions
export function openSidebar() {
    hamburgerBtn.classList.add('active');
    sidebarDrawer.classList.add('active');
    drawerBackdrop.classList.add('active');
}

export function closeSidebar() {
    hamburgerBtn.classList.remove('active');
    sidebarDrawer.classList.remove('active');
    drawerBackdrop.classList.remove('active');
}

// Password modal functions
export function openPwdModal() {
    closeSidebar();
    changePwdForm.reset();
    pwdErrorAlert.classList.add('hidden');
    pwdSuccessAlert.classList.add('hidden');
    changePwdForm.classList.remove('hidden');
    validatePassword();
    changePwdModal.classList.add('active');
}

export function closePwdModal() {
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

// Switch View
export function switchView(viewName, isInitialLoad = false) {
    const validViews = ['calendar', 'files'];
    if (navAdmin) validViews.push('admin');

    if (!validViews.includes(viewName)) {
        viewName = 'calendar';
    }

    navCalendar.classList.toggle('active', viewName === 'calendar');
    navFiles.classList.toggle('active', viewName === 'files');
    if (navAdmin) {
        navAdmin.classList.toggle('active', viewName === 'admin');
    }

    calendarView.classList.toggle('hidden', viewName !== 'calendar');
    filesView.classList.toggle('hidden', viewName !== 'files');
    if (adminView) {
        adminView.classList.toggle('hidden', viewName !== 'admin');
    }

    // Trigger data loads via custom events
    if (viewName === 'files') {
        mainTitle.textContent = 'Dateien';
        document.dispatchEvent(new CustomEvent('view-changed', { detail: { view: 'files' } }));
    } else if (viewName === 'admin') {
        mainTitle.textContent = 'Benutzerverwaltung';
        document.dispatchEvent(new CustomEvent('view-changed', { detail: { view: 'admin' } }));
    } else {
        mainTitle.textContent = 'Kalender';
        document.dispatchEvent(new CustomEvent('view-changed', { detail: { view: 'calendar' } }));
    }

    if (!isInitialLoad) {
        closeSidebar();
    }

    sessionStorage.setItem('dashboard_current_view', viewName);
}

// Event Listeners
if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => {
        if (sidebarDrawer.classList.contains('active')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });
}

if (drawerBackdrop) {
    drawerBackdrop.addEventListener('click', closeSidebar);
}

if (changePwdBtn) {
    changePwdBtn.addEventListener('click', openPwdModal);
}
if (closePwdModalBtn) closePwdModalBtn.addEventListener('click', closePwdModal);
if (cancelPwdModalBtn) cancelPwdModalBtn.addEventListener('click', closePwdModal);
if (newPwdInput) newPwdInput.addEventListener('input', validatePassword);
if (confirmPwdInput) confirmPwdInput.addEventListener('input', validatePassword);

if (changePwdForm) {
    changePwdForm.addEventListener('submit', (e) => {
        e.preventDefault();
        pwdErrorAlert.classList.add('hidden');
        pwdSuccessAlert.classList.add('hidden');

        const formData = new FormData(changePwdForm);
        changePassword(formData)
            .then(data => {
                if (data && data.success) {
                    pwdSuccessAlert.classList.remove('hidden');
                    changePwdForm.classList.add('hidden');
                    setTimeout(() => {
                        window.location.href = 'logout.php';
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
}

const copyIcsBtn = document.getElementById('copy-ics-btn');
if (copyIcsBtn) {
    copyIcsBtn.addEventListener('click', () => {
        const token = copyIcsBtn.getAttribute('data-token');
        if (token) {
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

if (navCalendar) {
    navCalendar.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('calendar');
    });
}
if (navFiles) {
    navFiles.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('files');
    });
}
if (navAdmin) {
    navAdmin.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('admin');
    });
}
