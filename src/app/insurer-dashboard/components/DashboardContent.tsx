'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { mockClaims } from '@/data/mockClaims';
import DashboardKPICards from './DashboardKPICards';
import ClaimsFilterBar from './ClaimsFilterBar';
import ClaimsTable from './ClaimsTable';
import { SeverityLevel } from '@/components/ui/SeverityBadge';
import { ClaimStatus } from '@/components/ui/StatusBadge';
import { RefreshCw } from 'lucide-react';

const DailyClaimsChart = dynamic(() => import('./DailyClaimsChart'), { ssr: false });
const SeverityDistributionChart = dynamic(() => import('./SeverityDistributionChart'), { ssr: false });

export default function DashboardContent() {
    const [search, setSearch] = useState('');
    const [severityFilter, setSeverityFilter] = useState<SeverityLevel | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<ClaimStatus | 'all'>('all');
    const [sortBy, setSortBy] = useState('severity');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const filteredClaims = mockClaims?.filter((c) => {
        const matchesSearch =
            !search ||
            c?.policyholder?.toLowerCase()?.includes(search?.toLowerCase()) ||
            c?.id?.toLowerCase()?.includes(search?.toLowerCase()) ||
            c?.vehicle?.toLowerCase()?.includes(search?.toLowerCase()) ||
            c?.licensePlate?.toLowerCase()?.includes(search?.toLowerCase());
        const matchesSeverity = severityFilter === 'all' || c?.severity === severityFilter;
        const matchesStatus = statusFilter === 'all' || c?.status === statusFilter;
        return matchesSearch && matchesSeverity && matchesStatus;
    });

    const handleRefresh = () => {
        setIsRefreshing(true);
        // TODO: Replace with real data refetch
        setTimeout(() => setIsRefreshing(false), 1200);
    };

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 2xl:px-16 py-8">
                {/* Page header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-semibold text-foreground">Tableau de bord des sinistres</h1>
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-severity-medium inline-block" />
                                Données de démo
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Dernière mise à jour : aujourd&apos;hui à 13h08 ·
                            <span className="ml-1 text-xs font-mono">17/07/2026</span>
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="btn-secondary gap-2"
                        disabled={isRefreshing}
                    >
                        <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
                        {isRefreshing ? 'Actualisation...' : 'Actualiser'}
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="mb-8">
                    <DashboardKPICards claims={mockClaims} />
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                    <div className="lg:col-span-2">
                        <DailyClaimsChart />
                    </div>
                    <div className="lg:col-span-1">
                        <SeverityDistributionChart />
                    </div>
                </div>

                {/* Claims table */}
                <div className="card-base p-5">
                    <div className="mb-5">
                        <h2 className="text-base font-semibold text-foreground mb-4">Dossiers en cours</h2>
                        <ClaimsFilterBar
                            search={search}
                            onSearchChange={setSearch}
                            severityFilter={severityFilter}
                            onSeverityChange={setSeverityFilter}
                            statusFilter={statusFilter}
                            onStatusChange={setStatusFilter}
                            sortBy={sortBy}
                            onSortChange={setSortBy}
                            totalCount={mockClaims?.length}
                            filteredCount={filteredClaims?.length}
                        />
                    </div>
                    <ClaimsTable claims={filteredClaims} isLoading={isRefreshing} />
                </div>
            </div>
        </div>
    );
}