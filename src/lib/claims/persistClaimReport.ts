import type { ClaimReportData } from './buildClaimReport';

const STORAGE_KEY = 'sanad_latest_claim_report';

export function persistLatestClaimReport(report: ClaimReportData, fnolDurationSec?: number): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(report));
    } catch {
        // ignore quota / private mode
    }

    // Sync to MongoDB for authenticated users (fire-and-forget)
    fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report, fnolDurationSec }),
    }).catch(() => {});
}

export function loadLatestClaimReport(): ClaimReportData | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as ClaimReportData;
    } catch {
        return null;
    }
}
