'use client';

import React, { useState } from 'react';
import { mockClaims } from '@/data/mockClaims';
import ClaimDetailHeader from './ClaimDetailHeader';
import AIAnalysisCard from './AIAnalysisCard';
import ExtractedDataPanel from './ExtractedDataPanel';
import DocumentGallery from './DocumentGallery';
import ClaimTimeline from './ClaimTimeline';
import ActionConfirmModal from './ActionConfirmModal';
import { CheckCircle, Info, XCircle } from 'lucide-react';

type ActionType = 'approve' | 'request_info' | 'reject' | null;
type TabId = 'analysis' | 'data' | 'documents' | 'timeline';

const tabs: { id: TabId; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: 'analysis', label: 'Analyse IA', icon: CheckCircle },
    { id: 'data', label: 'Données extraites', icon: Info },
    { id: 'documents', label: 'Documents', icon: XCircle },
    { id: 'timeline', label: 'Chronologie', icon: XCircle },
];

export default function ClaimDetailContent() {
    // Use the first claim (CLM-2026-0847) as the detail view subject
    // TODO: Replace with router param — e.g. useSearchParams().get('id') → find claim by id
    const claim = mockClaims[0];

    const [pendingAction, setPendingAction] = useState<ActionType>(null);
    const [activeTab, setActiveTab] = useState<TabId>('analysis');
    const [actionDone, setActionDone] = useState<string | null>(null);

    const handleStatusAction = (action: ActionType) => {
        setPendingAction(action);
    };

    const handleConfirmAction = () => {
        const messages: Record<NonNullable<ActionType>, string> = {
            approve: 'Dossier approuvé avec succès. L\'assuré a été notifié.',
            request_info: 'Demande d\'informations envoyée à l\'assuré.',
            reject: 'Dossier rejeté. L\'assuré a été informé.',
        };
        if (pendingAction) {
            setActionDone(messages[pendingAction]);
            setPendingAction(null);
            setTimeout(() => setActionDone(null), 4000);
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <ClaimDetailHeader claim={claim} onStatusAction={handleStatusAction} />

            {/* Success toast */}
            {actionDone && (
                <div className="mx-auto mt-4 max-w-screen-2xl w-full px-6 lg:px-8 xl:px-10 2xl:px-16">
                    <div className="flex items-center gap-3 bg-severity-low-bg border border-[var(--severity-low-border)] text-severity-low rounded-xl px-4 py-3 fade-in-up">
                        <CheckCircle size={16} />
                        <p className="text-sm font-medium">{actionDone}</p>
                    </div>
                </div>
            )}

            {/* Tab nav */}
            <div className="bg-card border-b border-border px-6 lg:px-8 xl:px-10 2xl:px-16">
                <div className="max-w-screen-2xl mx-auto">
                    <div className="flex gap-1 overflow-x-auto scrollbar-thin py-2">
                        {tabs.map((tab) => (
                            <button
                                key={`tab-${tab.id}`}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeTab === tab.id
                                        ? 'bg-accent text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 2xl:px-16 py-8">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Main content */}
                        <div className="xl:col-span-2 space-y-6">
                            {activeTab === 'analysis' && <AIAnalysisCard claim={claim} />}
                            {activeTab === 'data' && <ExtractedDataPanel claim={claim} />}
                            {activeTab === 'documents' && <DocumentGallery claim={claim} />}
                            {activeTab === 'timeline' && <ClaimTimeline claim={claim} />}
                        </div>

                        {/* Sidebar — always visible */}
                        <div className="xl:col-span-1 space-y-6">
                            {/* Quick summary card */}
                            <div className="card-base p-5">
                                <p className="section-label mb-4">Résumé rapide</p>
                                <div className="space-y-3">
                                    {[
                                        { label: 'N° dossier', value: claim.id, mono: true },
                                        { label: 'Police', value: claim.policyNumber, mono: true },
                                        { label: 'Assuré', value: claim.policyholder },
                                        { label: 'Véhicule', value: claim.vehicle },
                                        { label: 'Plaque', value: claim.licensePlate, mono: true },
                                        { label: 'Date incident', value: claim.incidentDate },
                                    ].map((item) => (
                                        <div key={`summary-${item.label}`} className="flex items-start justify-between gap-2">
                                            <span className="text-xs text-muted-foreground flex-shrink-0">{item.label}</span>
                                            <span className={`text-xs font-medium text-foreground text-right ${item.mono ? 'font-mono' : ''}`}>
                                                {item.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Cost estimate */}
                            <div className="card-base p-5">
                                <p className="section-label mb-3">Estimation des dommages</p>
                                <p className="text-2xl font-bold tabular-nums text-foreground">
                                    {new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(claim.estimatedCostMin)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    à {new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(claim.estimatedCostMax)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">Estimation générée par IA — sujet à expertise</p>
                            </div>

                            {/* Timeline preview (always) */}
                            {activeTab !== 'timeline' && (
                                <div className="card-base p-5">
                                    <p className="section-label mb-4">Derniers événements</p>
                                    <div className="space-y-3">
                                        {claim.timeline.slice(-3).map((event) => (
                                            <div key={`sidebar-ev-${event.id}`} className="flex items-start gap-2.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-foreground leading-snug">{event.event}</p>
                                                    <p className="text-xs text-muted-foreground tabular-nums">{event.timestamp}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('timeline')}
                                        className="mt-3 text-xs text-secondary hover:underline"
                                    >
                                        Voir tout l&apos;historique →
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm modal */}
            <ActionConfirmModal
                action={pendingAction}
                claimId={claim.id}
                onConfirm={handleConfirmAction}
                onClose={() => setPendingAction(null)}
            />
        </div>
    );
}