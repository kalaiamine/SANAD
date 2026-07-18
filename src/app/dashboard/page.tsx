'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
    Search, Filter, TrendingUp, Clock, CheckCircle,
    AlertTriangle, ChevronDown, ChevronUp, ArrowUpDown, BarChart2, Loader2, Users, LogOut
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import type { SeverityLevel } from '@/components/ui/SeverityBadge';
import SeverityBadge from '@/components/ui/SeverityBadge';
import type { ClaimStatus } from '@/components/ui/StatusBadge';
import StatusBadge from '@/components/ui/StatusBadge';

// ---------------------------------------------------------------------------
// Types for real dossier data coming from the backend
// ---------------------------------------------------------------------------

interface DossierStep {
    step: string;
    timestamp: string;
    status: string;
    metadata?: Record<string, any>;
}

interface RawDossier {
    dossierId: string;
    createdAt: string;
    updatedAt: string;
    identity: Record<string, any>;
    steps: DossierStep[];
    riskAssessment: { level: string; score: number } | null;
    finalStatus: string;
}

// The shape we display in the table
interface DashboardRow {
    id: string;
    name: string;
    cin: string;
    createdAt: string;
    finalStatus: string;
    severity: SeverityLevel;
    severityScore: number;
    status: ClaimStatus;
    riskLevel: string;
    amlScore: number;
    faceConfidence: number;
    ocrConfidence: number;
    stepsCount: number;
    birthPlace: string;
    phone: string;
    steps: DossierStep[];
}

// ---------------------------------------------------------------------------
// Dossier → DashboardRow transformer
// ---------------------------------------------------------------------------

function transformDossier(d: RawDossier): DashboardRow {
    const identity = d.identity || {};

    // Derive severity from risk level and AML score
    const riskLevel = d.riskAssessment?.level || 'UNKNOWN';
    const amlScore = d.riskAssessment?.score ?? 0;
    let severity: SeverityLevel = 'low';
    if (riskLevel === 'CRITICAL' || amlScore >= 80) severity = 'critical';
    else if (riskLevel === 'HIGH' || amlScore >= 50) severity = 'high';
    else if (riskLevel === 'MEDIUM' || amlScore >= 20) severity = 'medium';

    // Derive status from finalStatus
    let status: ClaimStatus = 'processing';
    if (d.finalStatus === 'APPROVED') status = 'approved';
    else if (d.finalStatus === 'REJECTED') status = 'rejected';
    else if (d.finalStatus === 'IN_PROGRESS') status = 'processing';

    // Extract key metrics from steps
    let faceConfidence = 0;
    let ocrConfidence = 0;
    for (const step of d.steps) {
        if (step.step === 'FACE_MATCH' && step.status === 'SUCCESS') {
            faceConfidence = step.metadata?.confidence || 0;
        }
        if (step.step === 'OCR_SCAN' && step.metadata?.confidence) {
            ocrConfidence = step.metadata.confidence;
        }
    }

    return {
        id: d.dossierId,
        name: identity.fullNameLatin || identity.fullNameArabic || 'N/A',
        cin: identity.cin || '',
        createdAt: d.createdAt,
        finalStatus: d.finalStatus,
        severity,
        severityScore: Math.min(10, Math.round(amlScore / 10)),
        status,
        riskLevel,
        amlScore,
        faceConfidence: Math.round(faceConfidence * 100) / 100,
        ocrConfidence: Math.round(ocrConfidence * 100) / 100,
        stepsCount: d.steps.length,
        birthPlace: identity.birthPlace || '',
        phone: identity.phone || '',
        steps: d.steps,
    };
}

// ---------------------------------------------------------------------------
// Row component
// ---------------------------------------------------------------------------

function DossierRow({ row }: { row: DashboardRow }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <>
            <tr
                className={`border-b border-border transition-colors hover:bg-muted/50 cursor-pointer ${row.severity === 'critical' ? 'severity-critical-row' : row.severity === 'high' ? 'severity-high-row' : ''}`}
                onClick={() => setExpanded(!expanded)}
            >
                <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                        {(row.severity === 'critical' || row.severity === 'high') && (
                            <span className="w-2 h-2 rounded-full bg-severity-critical flex-shrink-0" />
                        )}
                        <div>
                            <p className="font-semibold text-sm text-foreground">{row.name}</p>
                            <p className="text-xs text-muted-foreground">CIN: {row.cin}</p>
                        </div>
                    </div>
                </td>
                <td className="px-4 py-3">
                    <span className="text-sm font-mono text-primary">{row.id}</span>
                </td>
                <td className="px-4 py-3">
                    <SeverityBadge level={row.severity} size="sm" />
                </td>
                <td className="px-4 py-3">
                    <StatusBadge status={row.status} size="sm" />
                </td>
                <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${row.ocrConfidence >= 80 ? 'bg-sanad-success' : row.ocrConfidence >= 60 ? 'bg-[#F4B740]' : 'bg-sanad-danger'}`}
                                style={{ width: `${Math.min(100, row.ocrConfidence)}%` }}
                            />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">{row.ocrConfidence.toFixed(0)}%</span>
                    </div>
                </td>
                <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${row.faceConfidence >= 50 ? 'bg-sanad-success' : row.faceConfidence >= 30 ? 'bg-[#F4B740]' : 'bg-sanad-danger'}`}
                                style={{ width: `${Math.min(100, row.faceConfidence)}%` }}
                            />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">{row.faceConfidence.toFixed(0)}%</span>
                    </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(row.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Informations</p>
                                <div className="space-y-1 text-sm">
                                    <p><span className="text-muted-foreground">Lieu de naissance:</span> <span className="text-foreground">{row.birthPlace || 'N/A'}</span></p>
                                    <p><span className="text-muted-foreground">Téléphone:</span> <span className="text-foreground">{row.phone || 'N/A'}</span></p>
                                    <p><span className="text-muted-foreground">Risque AML:</span> <span className="text-foreground">{row.riskLevel} (score: {row.amlScore})</span></p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Étapes de vérification ({row.stepsCount})</p>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {row.steps.map((step, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs">
                                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${step.status === 'SUCCESS' ? 'bg-sanad-success' : 'bg-sanad-danger'}`} />
                                            <span className="text-muted-foreground">{step.step}</span>
                                            <span className={step.status === 'SUCCESS' ? 'text-sanad-success' : 'text-sanad-danger'}>{step.status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Statut final</p>
                                <p className={`text-lg font-display font-bold ${row.finalStatus === 'APPROVED' ? 'text-sanad-success' : row.finalStatus === 'REJECTED' ? 'text-sanad-danger' : 'text-[#B5850A]'}`}>
                                    {row.finalStatus === 'APPROVED' ? '✅ Approuvé' : row.finalStatus === 'REJECTED' ? '❌ Rejeté' : '⏳ En cours'}
                                </p>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

type SortField = 'severity' | 'status' | 'date';
type SortDir = 'asc' | 'desc';
const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

// ---------------------------------------------------------------------------
// Main Dashboard Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
    const [rows, setRows] = useState<DashboardRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    // Fetch real dossiers from the backend
    useEffect(() => {
        async function fetchDossiers() {
            try {
                const res = await fetch('/api/dossiers');
                if (res.ok) {
                    const data: RawDossier[] = await res.json();
                    setRows(data.map(transformDossier));
                }
            } catch (err) {
                console.error('Failed to fetch dossiers:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchDossiers();
    }, []);

    const handleSort = (field: SortField) => {
        if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    };

    const filteredRows = useMemo(() => {
        let result = [...rows];
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(
                (r) => r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.cin.includes(q)
            );
        }
        if (filterSeverity !== 'all') result = result.filter((r) => r.severity === filterSeverity);
        if (filterStatus !== 'all') result = result.filter((r) => r.status === filterStatus);
        result.sort((a, b) => {
            let cmp = 0;
            if (sortField === 'severity') cmp = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
            else if (sortField === 'date') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
            return sortDir === 'asc' ? cmp : -cmp;
        });
        return result;
    }, [rows, search, filterSeverity, filterStatus, sortField, sortDir]);

    // Compute KPIs from real data
    const kpis = useMemo(() => {
        const total = rows.length;
        const approved = rows.filter((r) => r.finalStatus === 'APPROVED').length;
        const inProgress = rows.filter((r) => r.finalStatus === 'IN_PROGRESS').length;
        const highRisk = rows.filter((r) => r.severity === 'critical' || r.severity === 'high').length;
        const avgOcr = total > 0 ? Math.round(rows.reduce((s, r) => s + r.ocrConfidence, 0) / total) : 0;
        return [
            { label: 'Total dossiers', value: String(total), icon: Users, color: 'text-primary', bg: 'bg-accent' },
            { label: 'Approuvés', value: String(approved), icon: CheckCircle, color: 'text-sanad-success', bg: 'bg-sanad-success/10' },
            { label: 'En cours', value: String(inProgress), icon: Clock, color: 'text-[#B5850A]', bg: 'bg-[#F4B740]/10' },
            { label: 'Risque élevé', value: String(highRisk), icon: AlertTriangle, color: 'text-sanad-danger', bg: 'bg-sanad-danger/10' },
            { label: 'Confiance OCR moy.', value: `${avgOcr}%`, icon: BarChart2, color: 'text-primary', bg: 'bg-accent' },
        ];
    }, [rows]);

    // Compute chart data from real dossiers
    const statusChartData = useMemo(() => {
        const approved = rows.filter((r) => r.finalStatus === 'APPROVED').length;
        const inProgress = rows.filter((r) => r.finalStatus === 'IN_PROGRESS').length;
        const rejected = rows.filter((r) => r.finalStatus === 'REJECTED').length;
        return [
            { name: 'Approuvé', value: approved, color: '#2E8B57' },
            { name: 'En cours', value: inProgress, color: '#3BA99C' },
            { name: 'Rejeté', value: rejected, color: '#D9534F' },
        ].filter((d) => d.value > 0);
    }, [rows]);

    const riskChartData = useMemo(() => {
        const critical = rows.filter((r) => r.severity === 'critical').length;
        const high = rows.filter((r) => r.severity === 'high').length;
        const medium = rows.filter((r) => r.severity === 'medium').length;
        const low = rows.filter((r) => r.severity === 'low').length;
        return [
            { name: 'Risque', Critique: critical, Élevé: high, Modéré: medium, Faible: low },
        ];
    }, [rows]);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <nav className="border-b border-border bg-card sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
                            <img src="/sanad.png" alt="SANAD" className="h-12 w-auto object-contain" />
                        </Link>
                        <span className="text-muted-foreground hidden sm:block">/</span>
                        <span className="text-sm font-medium text-foreground hidden sm:block">Tableau de bord assureur</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-sanad-success bg-sanad-success/10 border border-sanad-success/20 px-3 py-1.5 rounded-full font-medium">
                            ● Données en direct
                        </span>
                        <Link href="/chat" className="btn-secondary text-sm hidden sm:flex">
                            Nouvelle déclaration
                        </Link>
                        <button
                            onClick={async () => {
                                await fetch('/api/auth/logout', { method: 'POST' });
                                window.location.href = '/';
                            }}
                            className="btn-ghost text-sm flex items-center gap-1.5 text-muted-foreground"
                            title="Se déconnecter"
                        >
                            <LogOut size={15} />
                            <span className="hidden sm:inline">Déconnexion</span>
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Page title */}
                <div className="mb-8">
                    <h1 className="font-display font-bold text-3xl text-foreground mb-1">Tableau de bord</h1>
                    <p className="text-muted-foreground">Vue d&apos;ensemble des dossiers eKYC — données réelles</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={32} className="text-primary animate-spin" />
                        <span className="ml-3 text-muted-foreground">Chargement des dossiers...</span>
                    </div>
                ) : (
                    <>
                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                            {kpis.map((card) => (
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
                                        <h3 className="font-display font-semibold text-base text-foreground">Répartition par niveau de risque</h3>
                                        <p className="text-xs text-muted-foreground">Dossiers réels</p>
                                    </div>
                                </div>
                                {riskChartData[0] && (riskChartData[0].Critique + riskChartData[0].Élevé + riskChartData[0].Modéré + riskChartData[0].Faible) > 0 ? (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={riskChartData} barSize={24} barGap={4}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }} />
                                            <Bar dataKey="Critique" fill="#C0392B" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="Élevé" fill="#D4651A" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="Modéré" fill="#F4B740" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="Faible" fill="#2E8B57" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                                        Aucune donnée disponible
                                    </div>
                                )}
                            </div>

                            {/* Pie chart */}
                            <div className="card-base p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <h3 className="font-display font-semibold text-base text-foreground">Par statut</h3>
                                        <p className="text-xs text-muted-foreground">Tous les dossiers</p>
                                    </div>
                                </div>
                                {statusChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                                                {statusChartData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }} />
                                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                                        Aucune donnée disponible
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Dossiers Table */}
                        <div className="card-base overflow-hidden">
                            {/* Table header */}
                            <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                                <h3 className="font-display font-semibold text-base text-foreground">Dossiers eKYC</h3>
                                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                    {/* Search */}
                                    <div className="relative flex-1 sm:flex-none">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="text"
                                            placeholder="Rechercher (nom, CIN)..."
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
                                            <option value="all">Tous risques</option>
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
                                        <option value="processing">En cours</option>
                                        <option value="approved">Approuvé</option>
                                        <option value="rejected">Rejeté</option>
                                    </select>
                                </div>
                            </div>

                            {filteredRows.length === 0 ? (
                                <div className="py-16 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                                        <Search size={24} className="text-muted-foreground" />
                                    </div>
                                    <p className="font-semibold text-foreground mb-1">
                                        {rows.length === 0 ? 'Aucun dossier enregistré' : 'Aucun résultat trouvé'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {rows.length === 0
                                            ? 'Les dossiers eKYC apparaîtront ici automatiquement après inscription.'
                                            : "Essayez d'ajuster vos filtres de recherche."}
                                    </p>
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
                                                        Risque <ArrowUpDown size={12} />
                                                    </button>
                                                </th>
                                                <th className="px-4 py-3 text-left">
                                                    <button onClick={() => handleSort('status')} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground">
                                                        Statut <ArrowUpDown size={12} />
                                                    </button>
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">OCR</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Face match</th>
                                                <th className="px-4 py-3 text-left">
                                                    <button onClick={() => handleSort('date')} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground">
                                                        Date <ArrowUpDown size={12} />
                                                    </button>
                                                </th>
                                                <th className="px-4 py-3 w-10" />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredRows.map((row) => (
                                                <DossierRow key={row.id} row={row} />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <div className="px-6 py-3 border-t border-border bg-muted/20">
                                <p className="text-xs text-muted-foreground">
                                    {filteredRows.length} dossier{filteredRows.length !== 1 ? 's' : ''} affiché{filteredRows.length !== 1 ? 's' : ''}
                                    {rows.length !== filteredRows.length ? ` sur ${rows.length}` : ''}
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
