'use client';

import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { SeverityLevel } from '@/components/ui/SeverityBadge';
import { ClaimStatus } from '@/components/ui/StatusBadge';

interface ClaimsFilterBarProps {
    search: string;
    onSearchChange: (v: string) => void;
    severityFilter: SeverityLevel | 'all';
    onSeverityChange: (v: SeverityLevel | 'all') => void;
    statusFilter: ClaimStatus | 'all';
    onStatusChange: (v: ClaimStatus | 'all') => void;
    sortBy: string;
    onSortChange: (v: string) => void;
    totalCount: number;
    filteredCount: number;
}

const severityOptions: { value: SeverityLevel | 'all'; label: string }[] = [
    { value: 'all', label: 'Toutes sévérités' },
    { value: 'critical', label: 'Critique' },
    { value: 'high', label: 'Élevé' },
    { value: 'medium', label: 'Modéré' },
    { value: 'low', label: 'Faible' },
];

const statusOptions: { value: ClaimStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'Tous statuts' },
    { value: 'under_review', label: 'En révision' },
    { value: 'info_requested', label: 'Info requise' },
    { value: 'reported', label: 'Déclaré' },
    { value: 'approved', label: 'Approuvé' },
    { value: 'settled', label: 'Réglé' },
    { value: 'rejected', label: 'Rejeté' },
];

const sortOptions = [
    { value: 'severity', label: 'Sévérité (décroissant)' },
    { value: 'date', label: 'Date (récent)' },
    { value: 'confidence', label: 'Confiance IA' },
    { value: 'cost', label: 'Coût estimé' },
];

export default function ClaimsFilterBar({
    search, onSearchChange, severityFilter, onSeverityChange,
    statusFilter, onStatusChange, sortBy, onSortChange,
    totalCount, filteredCount,
}: ClaimsFilterBarProps) {
    const hasFilters = search || severityFilter !== 'all' || statusFilter !== 'all';

    const clearFilters = () => {
        onSearchChange('');
        onSeverityChange('all');
        onStatusChange('all');
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Rechercher par nom, dossier, véhicule..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="input-base pl-9"
                    />
                </div>

                {/* Severity filter */}
                <select
                    value={severityFilter}
                    onChange={(e) => onSeverityChange(e.target.value as SeverityLevel | 'all')}
                    className="input-base w-auto min-w-[160px] cursor-pointer"
                >
                    {severityOptions.map((o) => (
                        <option key={`sev-opt-${o.value}`} value={o.value}>{o.label}</option>
                    ))}
                </select>

                {/* Status filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => onStatusChange(e.target.value as ClaimStatus | 'all')}
                    className="input-base w-auto min-w-[150px] cursor-pointer"
                >
                    {statusOptions.map((o) => (
                        <option key={`status-opt-${o.value}`} value={o.value}>{o.label}</option>
                    ))}
                </select>

                {/* Sort */}
                <div className="relative">
                    <SlidersHorizontal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <select
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="input-base pl-8 w-auto min-w-[200px] cursor-pointer"
                    >
                        {sortOptions.map((o) => (
                            <option key={`sort-opt-${o.value}`} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Results count + clear */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {filteredCount < totalCount ? (
                        <><span className="font-semibold text-foreground">{filteredCount}</span> dossier(s) sur {totalCount}</>
                    ) : (
                        <><span className="font-semibold text-foreground">{totalCount}</span> dossier(s)</>
                    )}
                </p>
                {hasFilters && (
                    <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-severity-critical transition-colors">
                        <X size={12} />
                        Effacer les filtres
                    </button>
                )}
            </div>
        </div>
    );
}