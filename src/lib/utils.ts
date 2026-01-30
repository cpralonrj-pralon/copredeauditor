import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
export function formatExcelDate(serial: string | number): string {
    if (!serial) return '';

    // If it's already a string that looks like a date/time/text that isn't a serial number
    // Just try to return it or handle specific formats. 
    // Excel serials are numbers.
    const num = Number(serial);
    if (isNaN(num)) return String(serial);

    // Excel base date: Dec 30, 1899
    // Unix epoch: Jan 1, 1970
    // Difference is 25569 days
    const utc_days = Math.floor(num - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);

    // Calculate fractional day part
    const fractional_day = num - Math.floor(num) + 0.0000001;

    let total_seconds = Math.floor(86400 * fractional_day);
    const seconds = total_seconds % 60;

    total_seconds -= seconds;

    const hours = Math.floor(total_seconds / (60 * 60));
    const minutes = Math.floor(total_seconds / 60) % 60;

    const date = new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);

    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
