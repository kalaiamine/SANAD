'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronUp, ChevronDown, Eye, AlertTriangle, User, Car } from 'lucide-react';
import { Claim } from '@/data/mockClaims';
import SeverityBadge from '@/components/ui/SeverityBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfidenceBar from '@/components/ui/ConfidenceBar';

interface ClaimsTableProps {
    claims: Claim[];
    isLoading?: boolean;
}

const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

function formatCostRange(min: number, max: number) {
    const fmt = (n: number) =>
        new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n);
    return `${fmt(min)} – ${fmt(max)}`;
}

function timeAgo(iso: string) {
    const now = new Date('2026-07-17T13:08:45Z');
    const then = new Date(iso);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `Il y a ${diffHrs}h`;
    const diffDays = Math.floor(diffHrs / 24);
    return `Il y a ${diffDays}j`;
}

function TableSkeleton() {
    return (
        <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={`skel-row-${i + 1}`} className="animate-pulse h-14 bg-muted rounded-xl" />
            ))}
        </div>
    );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-4">
                <AlertTriangle size={24} className="text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">
                {hasFilters ? 'Aucun dossier correspondant' : 'Aucun dossier pour le moment'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
                {hasFilters
                    ? 'Essayez d\'ajuster vos filtres pour voir plus de résultats.' : 'Les nouvelles déclarations de sinistres apparaîtront ici dès leur soumission.'}
            </p>
        </div>
    );
}

export default function ClaimsTable({ claims, isLoading = false }: ClaimsTableProps) {
    const [sortField, setSortField] = useState<string>('severity');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    const sorted = [...claims].sort((a, b) => {
        let cmp = 0;
        if (sortField === 'severity') cmp = severityOrder[a.severity] - severityOrder[b.severity];
        else if (sortField === 'confidence') cmp = b.confidence - a.confidence;
        else if (sortField === 'date') cmp = new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
        else if (sortField === 'cost') cmp = b.estimatedCostMax - a.estimatedCostMax;
        return sortDir === 'asc' ? cmp : -cmp;
    });

    const SortIcon = ({ field }: { field: string }) => (
        <span className="ml-1 inline-flex flex-col">
            <ChevronUp size={10} className={sortField === field && sortDir === 'asc' ? 'text-primary' : 'text-muted-foreground opacity-40'} />
            <ChevronDown size={10} className={sortField === field && sortDir === 'desc' ? 'text-primary' : 'text-muted-foreground opacity-40'} />
        </span>
    );

    if (isLoading) return <TableSkeleton />;
    if (claims.length === 0) return <EmptyState hasFilters={false} />;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border">
                        <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                            <button onClick={() => handleSort('severity')} className="flex items-center hover:text-foreground transition-colors focus-visible:outline-none">
                                Sévérité <SortIcon field="severity" />
                            </button>
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                            N° Dossier
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                            <button className="flex items-center hover:text-foreground transition-colors focus-visible:outline-none">
                                <User size={12} className="mr-1" />Assuré
                            </button>
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                            <Car size={12} className="inline mr-1" />Véhicule
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                            <button onClick={() => handleSort('confidence')} className="flex items-center hover:text-foreground transition-colors focus-visible:outline-none">
                                Confiance IA <SortIcon field="confidence" />
                            </button>
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                            <button onClick={() => handleSort('cost')} className="flex items-center hover:text-foreground transition-colors focus-visible:outline-none">
                                Coût estimé <SortIcon field="cost" />
                            </button>
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                            Statut
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                            <button onClick={() => handleSort('date')} className="flex items-center hover:text-foreground transition-colors focus-visible:outline-none">
                                Déclaré <SortIcon field="date" />
                            </button>
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                            Expert
                        </th>
                        <th className="py-3 px-3" />
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((claim) => {
                        const isCritical = claim.severity === 'critical';
                        const isHigh = claim.severity === 'high';
                        return (
                            <tr
                                key={`row-${claim.id}`}
                                className={`border-b border-border last:border-0 transition-colors hover:bg-muted/40 group ${isCritical ? 'severity-critical-row' : isHigh ? 'severity-high-row' : ''
                                    }`}
                            >
                                {/* Severity */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        {(isCritical || isHigh) && (
                                            <AlertTriangle
                                                size={14}
                                                className={isCritical ? 'text-severity-critical' : 'text-severity-high'}
                                            />
                                        )}
                                        <SeverityBadge level={claim.severity} score={claim.severityScore} size="sm" />
                                    </div>
                                </td>
                                {/* ID */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                    <span className="text-xs font-mono text-muted-foreground">{claim.id}</span>
                                </td>
                                {/* Policyholder */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                    <div>
                                        <p className={`font-medium ${isCritical ? 'text-severity-critical' : isHigh ? 'text-severity-high' : 'text-foreground'}`}>
                                            {claim.policyholder}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{claim.policyNumber}</p>
                                    </div>
                                </td>
                                {/* Vehicle */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                    <div>
                                        <p className="text-foreground">{claim.vehicle}</p>
                                        <p className="text-xs font-mono text-muted-foreground">{claim.licensePlate}</p>
                                    </div>
                                </td>
                                {/* Confidence */}
                                <td className="py-3 px-3 min-w-[120px]">
                                    <ConfidenceBar value={claim.confidence} size="sm" />
                                </td>
                                {/* Cost */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                    <span className="text-xs tabular-nums text-foreground font-medium">
                                        {formatCostRange(claim.estimatedCostMin, claim.estimatedCostMax)}
                                    </span>
                                </td>
                                {/* Status */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                    <StatusBadge status={claim.status} size="sm" />
                                </td>
                                {/* Date */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                    <div>
                                        <p className="text-xs text-foreground">{claim.incidentDate}</p>
                                        <p className="text-xs text-muted-foreground">{timeAgo(claim.reportedAt)}</p>
                                    </div>
                                </td>
                                {/* Adjuster */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                    {claim.adjuster ? (
                                        <span className="text-xs text-muted-foreground">{claim.adjuster}</span>
                                    ) : (
                                        <span className="text-xs text-severity-high font-medium">Non assigné</span>
                                    )}
                                </td>
                                {/* Actions */}
                                <td className="py-3 px-3">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link
                                            href="/claim-detail-view"
                                            className="inline-flex items-center gap-1.5 text-xs btn-ghost px-3 py-1.5 rounded-lg"
                                        >
                                            <Eye size={13} />
                                            Voir
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}