'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
    Shield, Search, Filter, TrendingUp, Clock, CheckCircle,
    AlertTriangle, ChevronDown, ChevronUp, ArrowUpDown, BarChart2
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { mockClaims, type Claim } from '@/data/mockClaims';
import SeverityBadge from '@/components/ui/SeverityBadge';
import StatusBadge from '@/components/ui/StatusBadge';

const KPI_CARDS = [
    { label: 'Déclarations aujourd\'hui', value: '12', icon: TrendingUp, color: 'text-primary', bg: 'bg-accent' },
    { label: 'Approuvées', value: '7', icon: CheckCircle, color: 'text-sanad-success', bg: 'bg-sanad-success/10' },
    { label: 'En attente', value: '3', icon: Clock, color: 'text-[#B5850A]', bg: 'bg-[#F4B740]/10' },
    { label: 'Révision fraude', value: '2', icon: AlertTriangle, color: 'text-sanad-danger', bg: 'bg-sanad-danger/10' },
    { label: 'Règlement moyen', value: '1 840 TND', icon: BarChart2, color: 'text-primary', bg: 'bg-accent' },
];

const STATUS_CHART_DATA = [
    { name: 'Approuvé', value: 7, color: '#2E8B57' },
    { name: 'En révision', value: 3, color: '#F4B740' },
    { name: 'En attente', value: 2, color: '#3BA99C' },
    { name: 'Rejeté', value: 1, color: '#D9534F' },
];

const SEVERITY_CHART_DATA = [
    { name: 'Lun', Critique: 2, Élevé: 3, Modéré: 4, Faible: 2 },
    { name: 'Mar', Critique: 1, Élevé: 4, Modéré: 3, Faible: 5 },
    { name: 'Mer', Critique: 3, Élevé: 2, Modéré: 5, Faible: 3 },
    { name: 'Jeu', Critique: 1, Élevé: 3, Modéré: 4, Faible: 4 },
    { name: 'Ven', Critique: 2, Élevé: 5, Modéré: 3, Faible: 2 },
    { name: 'Sam', Critique: 0, Élevé: 2, Modéré: 6, Faible: 5 },
    { name: 'Dim', Critique: 1, Élevé: 1, Modéré: 2, Faible: 3 },
];

type SortField = 'severity' | 'status' | 'date';
type SortDir = 'asc' | 'desc';

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function ClaimRow({ claim }: { claim: Claim }) {
    const [expanded, setExpanded] = useState(false);
    const isHighPriority = claim.severity === 'critical' || claim.severity === 'high';

    return (
        <>
            <tr
                className={`border-b border-border transition-colors hover:bg-muted/50 cursor-pointer ${claim.severity === 'critical' ? 'severity-critical-row' : claim.severity === 'high' ? 'severity-high-row' : ''
                    }`}
                onClick={() => setExpanded(!expanded)}
            >
                <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                        {isHighPriority && (
                            <span className="w-2 h-2 rounded-full bg-severity-critical flex-shrink-0" />
                        )}
                        <div>
                            <p className="font-semibold text-sm text-foreground">{claim.policyholder}</p>
                            <p className="text-xs text-muted-foreground">{claim.vehicle}</p>
                        </div>
                    </div>
                </td>
                <td className="px-4 py-3">
                    <Link
                        href={`/dashboard/claims/${claim.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-mono text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                        {claim.id}
                    </Link>
                </td>
                <td className="px-4 py-3">
                    <SeverityBadge level={claim.severity} size="sm" />
                </td>
                <td className="px-4 py-3">
                    <StatusBadge status={claim.status} size="sm" />
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-foreground tabular-nums">
                    {claim.estimatedCostMin.toLocaleString('fr-FR')} TND
                </td>
                <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${claim.severityScore <= 3 ? 'bg-sanad-success' : claim.severityScore <= 6 ? 'bg-[#F4B740]' : 'bg-sanad-danger'}`}
                                style={{ width: `${claim.severityScore * 10}%` }}
                            />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">{claim.severityScore}/10</span>
                    </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(claim.reportedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                </td>
                <td className="px-4 py-3">
                    <button className="btn-ghost p-1.5" aria-label={expanded ? 'Réduire' : 'Développer'}>
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </td>
            </tr>
            {expanded && (
                <tr className="bg-muted/30">
                    <td colSpan={8} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Résumé IA</p>
                                <p className="text-sm text-foreground leading-relaxed">{claim.aiSummary}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Action recommandée</p>
                                <p className="text-sm text-foreground leading-relaxed mb-3">{claim.recommendedAction}</p>
                                <Link
                                    href={`/dashboard/claims/${claim.id}`}
                                    className="btn-primary text-xs py-2 px-4"
                                >
                                    Voir le dossier complet →
                                </Link>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

export default function DashboardPage() {
    const [search, setSearch] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortField, setSortField] = useState<SortField>('severity');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    const handleSort = (field: SortField) => {
        if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    };

    const filteredClaims = useMemo(() => {
        let result = [...mockClaims];
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(
                (c) => c.id.toLowerCase().includes(q) || c.policyholder.toLowerCase().includes(q) || c.status.includes(q)
            );
        }
        if (filterSeverity !== 'all') result = result.filter((c) => c.severity === filterSeverity);
        if (filterStatus !== 'all') result = result.filter((c) => c.status === filterStatus);
        result.sort((a, b) => {
            let cmp = 0;
            if (sortField === 'severity') cmp = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
            else if (sortField === 'date') cmp = new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime();
            else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
            return sortDir === 'asc' ? cmp : -cmp;
        });
        return result;
    }, [search, filterSeverity, filterStatus, sortField, sortDir]);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <nav className="border-b border-border bg-card sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
                            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                                <Shield size={14} className="text-white" />
                            </div>
                            <span className="font-display font-bold text-lg text-primary">SANAD</span>
                        </Link>
                        <span className="text-muted-foreground hidden sm:block">/</span>
                        <span className="text-sm font-medium text-foreground hidden sm:block">Tableau de bord assureur</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground bg-[#F4B740]/10 border border-[#F4B740]/30 text-[#B5850A] px-3 py-1.5 rounded-full font-medium">
                            ⚡ Données de démo
                        </span>
                        <Link href="/chat" className="btn-secondary text-sm hidden sm:flex">
                            Nouvelle déclaration
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Page title */}
                <div className="mb-8">
                    <h1 className="font-display font-bold text-3xl text-foreground mb-1">Tableau de bord</h1>
                    <p className="text-muted-foreground">Vue d&apos;ensemble des déclarations de sinistres</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                    {KPI_CARDS.map((card) => (
                        <div key={card.label} className="card-base p-5">
                            <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                                <card.icon size={18} className={card.color} />
                            </div>
                            <p className={`font-display font-bold text-2xl ${card.color} tabular-nums`}>{card.value}</p>
                            <p className="text-xs text-muted-foreground mt-1 leading-tight">{card.label}</p>
                        </div>
                    ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Bar chart */}
                    <div className="lg:col-span-2 card-base p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="font-display font-semibold text-base text-foreground">Déclarations par sévérité</h3>
                                <p className="text-xs text-muted-foreground">7 derniers jours</p>
                            </div>
                            <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">DÉMO</span>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={SEVERITY_CHART_DATA} barSize={8} barGap={2}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }} />
                                <Bar dataKey="Critique" fill="#C0392B" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Élevé" fill="#D4651A" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Modéré" fill="#F4B740" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Faible" fill="#2E8B57" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Pie chart */}
                    <div className="card-base p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="font-display font-semibold text-base text-foreground">Par statut</h3>
                                <p className="text-xs text-muted-foreground">Aujourd&apos;hui</p>
                            </div>
                            <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">DÉMO</span>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={STATUS_CHART_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                                    {STATUS_CHART_DATA.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }} />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Claims Table */}
                <div className="card-base overflow-hidden">
                    {/* Table header */}
                    <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                        <h3 className="font-display font-semibold text-base text-foreground">Déclarations récentes</h3>
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            {/* Search */}
                            <div className="relative flex-1 sm:flex-none">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="input-base pl-9 py-2 text-xs w-full sm:w-48"
                                />
                            </div>
                            {/* Severity filter */}
                            <div className="relative">
                                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <select
                                    value={filterSeverity}
                                    onChange={(e) => setFilterSeverity(e.target.value)}
                                    className="input-base pl-9 py-2 text-xs pr-8 appearance-none cursor-pointer"
                                >
                                    <option value="all">Toutes sévérités</option>
                                    <option value="critical">Critique</option>
                                    <option value="high">Élevé</option>
                                    <option value="medium">Modéré</option>
                                    <option value="low">Faible</option>
                                </select>
                            </div>
                            {/* Status filter */}
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="input-base py-2 text-xs pr-8 appearance-none cursor-pointer"
                            >
                                <option value="all">Tous statuts</option>
                                <option value="under_review">En révision</option>
                                <option value="approved">Approuvé</option>
                                <option value="info_requested">Info requise</option>
                                <option value="rejected">Rejeté</option>
                            </select>
                        </div>
                    </div>

                    {filteredClaims.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                                <Search size={24} className="text-muted-foreground" />
                            </div>
                            <p className="font-semibold text-foreground mb-1">Aucun résultat trouvé</p>
                            <p className="text-sm text-muted-foreground">Essayez d&apos;ajuster vos filtres de recherche.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Client</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">N° Dossier</th>
                                        <th className="px-4 py-3 text-left">
                                            <button onClick={() => handleSort('severity')} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground">
                                                Sévérité <ArrowUpDown size={12} />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            <button onClick={() => handleSort('status')} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground">
                                                Statut <ArrowUpDown size={12} />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Règlement</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Score fraude</th>
                                        <th className="px-4 py-3 text-left">
                                            <button onClick={() => handleSort('date')} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground">
                                                Date <ArrowUpDown size={12} />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 w-10" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredClaims.map((claim) => (
                                        <ClaimRow key={claim.id} claim={claim} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="px-6 py-3 border-t border-border bg-muted/20">
                        <p className="text-xs text-muted-foreground">
                            {filteredClaims.length} dossier{filteredClaims.length !== 1 ? 's' : ''} affiché{filteredClaims.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
