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


    function formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

export { formatAppointmentDate, formatDateOnly, formatDateSimple, escapeHtml, formatBytes };
