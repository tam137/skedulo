    // Helpers for formatting
    function formatAppointmentDate(dateString, allDay = true, durationHours = null, durationDays = null) {
        const d = new Date(dateString.replace(' ', 'T'));
        if (isNaN(d.getTime())) return escapeHtml(dateString);
        
        const weekday = d.toLocaleDateString('de-DE', { weekday: 'short' });
        const dateStr = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        
        let display = `<span class="weekday-tag">${weekday}</span>${dateStr}`;
        
        const isAllDay = allDay === true || allDay === 1 || allDay === '1' || allDay === 'true';
        
        if (!isAllDay && durationHours !== null) {
            const timeStr = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
            const formattedHours = String(durationHours).replace('.', ',');
            display += `, ${timeStr} (${formattedHours} Std.)`;
        } else if (isAllDay && durationDays !== null && parseInt(durationDays, 10) > 1) {
            const days = parseInt(durationDays, 10);
            const endD = new Date(d);
            endD.setDate(d.getDate() + (days - 1));
            const endWeekday = endD.toLocaleDateString('de-DE', { weekday: 'short' });
            const endDateStr = endD.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
            display += ` bis <span class="weekday-tag">${endWeekday}</span>${endDateStr} (${days} Tage)`;
        }
        
        return display;
    }

    function formatDateOnly(dateString) {
        if (!dateString) return '';
        const d = new Date(dateString.replace(' ', 'T'));
        if (isNaN(d.getTime())) return dateString;
        const dateStr = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeStr = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        if (timeStr !== '00:00') {
            return `${dateStr}, ${timeStr} Uhr`;
        }
        return dateStr;
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
