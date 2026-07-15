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

    function formatChanges(changes) {
        const labels = {
            title: 'Name',
            location: 'Ort',
            appointment_date: 'Datum',
            notes: 'Notizen',
            icon: 'Symbol',
            all_day: 'Ganztägig',
            duration_hours: 'Dauer (Stunden)',
            duration_days: 'Dauer (Tage)'
        };
        let html = '';
        for (const field in changes) {
            if (field === 'file_added') {
                const fileName = changes[field]['name'] ?? 'Unbekannt';
                html += `<div class="history-change-line">
                    <span class="history-new-value">Datei hinzugefügt: ${escapeHtml(String(fileName))}</span>
                </div>`;
                continue;
            }
            if (field === 'file_deleted') {
                const fileName = changes[field]['name'] ?? 'Unbekannt';
                html += `<div class="history-change-line">
                    <span class="history-old-value">Datei entfernt: ${escapeHtml(String(fileName))}</span>
                </div>`;
                continue;
            }

            const fieldLabel = labels[field] || field;
            let oldVal = changes[field]['old'] ?? 'Keine';
            let newVal = changes[field]['new'] ?? 'Keine';
            
            if (field === 'appointment_date') {
                oldVal = formatDateOnly(oldVal);
                newVal = formatDateOnly(newVal);
            } else if (field === 'all_day') {
                oldVal = (oldVal === true || oldVal === 1 || oldVal === '1' || oldVal === 'true') ? 'Ja' : 'Nein';
                newVal = (newVal === true || newVal === 1 || newVal === '1' || newVal === 'true') ? 'Ja' : 'Nein';
            }
            
            html += `<div class="history-change-line">
                <strong>${fieldLabel}:</strong> 
                <span class="history-old-value">${escapeHtml(String(oldVal))}</span> 
                <span class="change-arrow">➔</span> 
                <span class="history-new-value">${escapeHtml(String(newVal))}</span>
            </div>`;
        }
        return html;
    }

export { formatAppointmentDate, formatDateOnly, formatDateSimple, escapeHtml, formatBytes, formatChanges };
