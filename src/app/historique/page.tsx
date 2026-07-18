'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    History, Loader2, MessageSquare, FileText, ShieldCheck,
    AlertTriangle, ChevronDown, ChevronUp, Car, ArrowLeft,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Shape of a claim as returned by GET /api/claims (MongoDB ClaimReport)
// ---------------------------------------------------------------------------

interface VehicleSlice {
    label: 'A' | 'B';
    brand: string;
    immatriculation: string;
    source: string;
    result: {
        damageVisible: boolean;
        detectedDamage: string;
        severity: string;
        estimatedCostMin: number;
        estimatedCostMax: number;
        confidence: number;
        explanation: string;
    };
}

interface StoredClaim {
    _id: string;
    cin: string;
    dossierId: string;
    createdAt: string;
    fnolDurationSec?: number;
    report: {
        generatedAt: string;
        settlementMin: number;
        settlementMax: number;
        settlementMid: number;
        fraudScore: number;
        riskLevel: string;
        aiConfidence: number;
        vehicleA: VehicleSlice | null;
        vehicleB: VehicleSlice | null;
        constatData?: {
            dateAccident?: string;
            lieu?: string;
            circonstances?: string;
        };
    };
}

function riskBadgeClasses(riskLevel: string): string {
    if (riskLevel === 'Élevé') return 'bg-red-100 text-red-700';
    if (riskLevel === 'Modéré') return 'bg-amber-100 text-amber-700';
    return 'bg-emerald-100 text-emerald-700';
}

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString('fr-TN', {
            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    } catch {
        return iso;
    }
}

function VehicleLine({ vehicle }: { vehicle: VehicleSlice }) {
    return (
        <div className="flex items-start gap-3 bg-muted rounded-xl px-4 py-3">
            <Car size={16} className="mt-0.5 text-muted-foreground shrink-0" />
            <div className="text-sm">
                <p className="font-medium">
                    Véhicule {vehicle.label} — {vehicle.brand}
                    {vehicle.immatriculation && vehicle.immatriculation !== '—' && (
                        <span className="text-muted-foreground font-normal"> · {vehicle.immatriculation}</span>
                    )}
                </p>
                <p className="text-muted-foreground">
                    {vehicle.result.detectedDamage} — sévérité {vehicle.result.severity} ·{' '}
                    {vehicle.result.estimatedCostMin}–{vehicle.result.estimatedCostMax} TND
                </p>
            </div>
        </div>
    );
}

export default function HistoriquePage() {
    const router = useRouter();
    const [claims, setClaims] = useState<StoredClaim[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openId, setOpenId] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/claims')
            .then(async (r) => {
                if (!r.ok) throw new Error((await r.json())?.error || 'Chargement impossible.');
                return r.json();
            })
            .then((data) => setClaims(Array.isArray(data) ? data : []))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <main className="max-w-4xl mx-auto px-6 py-10">
            <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground bg-card border border-border px-4 py-2 rounded-xl mb-6 transition-colors"
            >
                <ArrowLeft size={16} /> Retour
            </button>
            <div className="flex items-center gap-3 mb-2">
                <History size={22} className="text-primary" />
                <h1 className="text-2xl font-semibold">Historique de mes sinistres</h1>
            </div>
            <p className="text-sm text-muted-foreground mb-8">
                Toutes vos déclarations analysées par SANAD, avec l&apos;estimation d&apos;indemnisation et le niveau de risque.
            </p>

            {loading && (
                <div className="flex items-center gap-2 text-muted-foreground py-16 justify-center">
                    <Loader2 size={18} className="animate-spin" /> Chargement de votre historique…
                </div>
            )}

            {!loading && error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">
                    <AlertTriangle size={16} /> {error}
                </div>
            )}

            {!loading && !error && claims.length === 0 && (
                <div className="text-center py-16 bg-card border border-border rounded-2xl">
                    <FileText size={32} className="mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium mb-1">Aucun sinistre déclaré pour le moment</p>
                    <p className="text-sm text-muted-foreground mb-5">
                        Déclarez un sinistre en quelques minutes avec notre assistant.
                    </p>
                    <Link href="/chat" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium">
                        <MessageSquare size={16} /> Déclarer un sinistre
                    </Link>
                </div>
            )}

            <div className="space-y-4">
                {claims.map((claim) => {
                    const r = claim.report;
                    const isOpen = openId === claim._id;
                    return (
                        <div key={claim._id} className="bg-card border border-border rounded-2xl overflow-hidden">
                            <button
                                onClick={() => setOpenId(isOpen ? null : claim._id)}
                                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-muted/50 transition-colors"
                            >
                                <div className="min-w-0">
                                    <p className="font-medium text-sm truncate">
                                        {r.constatData?.lieu ? `Accident — ${r.constatData.lieu}` : 'Sinistre automobile'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Déclaré le {formatDate(claim.createdAt)} · Dossier KYC {claim.dossierId}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${riskBadgeClasses(r.riskLevel)}`}>
                                        Risque {r.riskLevel}
                                    </span>
                                    <span className="text-sm font-semibold whitespace-nowrap">
                                        {r.settlementMin}–{r.settlementMax} TND
                                    </span>
                                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                            </button>

                            {isOpen && (
                                <div className="border-t border-border px-5 py-4 space-y-3">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                        <div className="bg-muted rounded-xl py-3">
                                            <p className="text-lg font-semibold">{r.settlementMid} TND</p>
                                            <p className="text-xs text-muted-foreground">Estimation médiane</p>
                                        </div>
                                        <div className="bg-muted rounded-xl py-3">
                                            <p className="text-lg font-semibold">{r.fraudScore}/100</p>
                                            <p className="text-xs text-muted-foreground">Score de fraude</p>
                                        </div>
                                        <div className="bg-muted rounded-xl py-3">
                                            <p className="text-lg font-semibold">{r.aiConfidence}%</p>
                                            <p className="text-xs text-muted-foreground">Confiance IA</p>
                                        </div>
                                        <div className="bg-muted rounded-xl py-3">
                                            <p className="text-lg font-semibold flex items-center justify-center gap-1">
                                                <ShieldCheck size={16} className="text-emerald-600" />
                                            </p>
                                            <p className="text-xs text-muted-foreground">Identité vérifiée eKYC</p>
                                        </div>
                                    </div>

                                    {r.constatData?.dateAccident && (
                                        <p className="text-sm text-muted-foreground">
                                            Accident du {r.constatData.dateAccident}
                                            {r.constatData.circonstances ? ` — ${r.constatData.circonstances}` : ''}
                                        </p>
                                    )}

                                    {r.vehicleA && <VehicleLine vehicle={r.vehicleA} />}
                                    {r.vehicleB && <VehicleLine vehicle={r.vehicleB} />}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </main>
    );
}
