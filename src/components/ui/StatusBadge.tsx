import React from 'react';

export type ClaimStatus =
    | 'reported' | 'processing' | 'under_review' | 'info_requested' | 'approved' | 'rejected' | 'settled';

interface StatusBadgeProps {
    status: ClaimStatus;
    size?: 'sm' | 'md';
}

const statusConfig: Record<ClaimStatus, { label: string; classes: string; dot: string }> = {
    reported: {
        label: 'Déclaré',
        classes: 'bg-blue-50 text-blue-700 border border-blue-200',
        dot: 'bg-blue-500',
    },
    processing: {
        label: 'En traitement',
        classes: 'bg-accent text-primary border border-[var(--secondary)]',
        dot: 'bg-secondary',
    },
    under_review: {
        label: 'En révision',
        classes: 'bg-severity-medium-bg text-severity-medium border border-[var(--severity-medium-border)]',
        dot: 'bg-severity-medium',
    },
    info_requested: {
        label: 'Info requise',
        classes: 'bg-orange-50 text-orange-700 border border-orange-200',
        dot: 'bg-orange-500',
    },
    approved: {
        label: 'Approuvé',
        classes: 'bg-severity-low-bg text-severity-low border border-[var(--severity-low-border)]',
        dot: 'bg-severity-low',
    },
    rejected: {
        label: 'Rejeté',
        classes: 'bg-severity-critical-bg text-severity-critical border border-[var(--severity-critical-border)]',
        dot: 'bg-severity-critical',
    },
    settled: {
        label: 'Réglé',
        classes: 'bg-purple-50 text-purple-700 border border-purple-200',
        dot: 'bg-purple-500',
    },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
    const config = statusConfig[status];
    return (
        <span
            className={`inline-flex items-center gap-1.5 font-medium rounded-full ${config.classes} ${size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1'
                }`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {config.label}
        </span>
    );
}