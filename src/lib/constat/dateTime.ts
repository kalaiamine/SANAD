/** Converts YYYY-MM-DD (date input) or existing dd/mm/yyyy to dd/mm/yyyy for PDF/display. */
export function toDisplayDate(value: string): string {
    if (!value) return '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
    const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
    return value;
}

/** Converts dd/mm/yyyy or YYYY-MM-DD to YYYY-MM-DD for `<input type="date">`. */
export function toInputDate(value: string): string {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const fr = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (fr) return `${fr[3]}-${fr[2]}-${fr[1]}`;
    return '';
}

/** Normalizes HH:mm from time input or free text. */
export function toDisplayTime(value: string): string {
    if (!value) return '';
    const t = value.match(/^(\d{1,2}):(\d{2})/);
    if (!t) return value;
    return `${t[1].padStart(2, '0')}:${t[2]}`;
}

export function toInputTime(value: string): string {
    const normalized = toDisplayTime(value);
    return /^\d{2}:\d{2}$/.test(normalized) ? normalized : '';
}

export function defaultAccidentDateInput(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function defaultAccidentTimeInput(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}
