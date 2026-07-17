'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Shield, ArrowLeft, CheckCircle, AlertTriangle, AlertCircle, Clock, User, Car, MapPin, Phone, Mail, FileText } from 'lucide-react';
import { mockClaims } from '@/data/mockClaims';
import SeverityBadge from '@/components/ui/SeverityBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { evaluateClaimDecision } from '@/lib/businessRule';

type ActionState = 'idle' | 'approving' | 'reviewing' | 'rejecting' | 'done';

export default function ClaimDetailPage() {
    const params = useParams();
    const claimId = params?.id as string;
    const claim = mockClaims.find((c) => c.id === claimId) ?? mockClaims[0];
    const [actionState, setActionState] = useState<ActionState>('idle');
    const [actionDone, setActionDone] = useState<string | null>(null);
    const [showArabic, setShowArabic] = useState(false);

    const businessRule = evaluateClaimDecision(claim.estimatedCostMin);

    const handleAction = async (action: 'approve' | 'review' | 'reject') => {
        const stateMap = { approve: 'approving', review: 'reviewing', reject: 'rejecting' } as const;
        const doneMap = {
            approve: 'Dossier approuvé avec succès.',
            review: 'Dossier envoyé en révision manuelle.',
            reject: 'Dossier rejeté.',
        };
        setActionState(stateMap[action]);
        await new Promise((r) => setTimeout(r, 1500));
        setActionState('done');
        setActionDone(doneMap[action]);
    };

    const actorConfig = {
        policyholder: { label: 'Assuré', color: 'bg-accent text-primary', icon: User },
        ai: { label: 'IA SANAD', color: 'bg-primary/10 text-primary', icon: Shield },
        adjuster: { label: 'Agent', color: 'bg-muted text-muted-foreground', icon: CheckCircle },
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <nav className="border-b border-border bg-card sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-3">
                    <Link href="/dashboard" className="btn-ghost p-2 -ml-2 gap-2 text-sm">
                        <ArrowLeft size={16} />
                        <span className="hidden sm:block">Tableau de bord</span>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-sm font-mono text-foreground font-medium">{claim.id}</span>
                    <div className="ml-auto flex items-center gap-2">
                        <SeverityBadge level={claim.severity} size="sm" />
                        <StatusBadge status={claim.status} size="sm" />
                    </div>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Action done banner */}
                {actionDone && (
                    <div className="bg-sanad-success/10 border border-sanad-success/20 rounded-2xl px-5 py-4 mb-6 flex items-center gap-3 fade-in-up">
                        <CheckCircle size={20} className="text-sanad-success flex-shrink-0" />
                        <p className="text-sm font-medium text-foreground">{actionDone}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Customer Info */}
                        <div className="card-base p-6">
                            <h2 className="font-display font-bold text-lg text-foreground mb-5 flex items-center gap-2">
                                <User size={18} className="text-primary" />
                                Informations client
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { icon: User, label: 'Nom', value: claim.policyholder },
                                    { icon: FileText, label: 'Police', value: claim.policyNumber },
                                    { icon: Phone, label: 'Téléphone', value: claim.phone },
                                    { icon: Mail, label: 'Email', value: claim.email },
                                    { icon: Car, label: 'Véhicule', value: claim.vehicle },
                                    { icon: FileText, label: 'Plaque', value: claim.licensePlate },
                                    { icon: MapPin, label: 'Lieu', value: claim.incidentLocation },
                                    { icon: Clock, label: 'Date incident', value: claim.incidentDate },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <item.icon size={14} className="text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">{item.label}</p>
                                            <p className="text-sm font-medium text-foreground">{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Identity Status */}
                        <div className="card-base p-6">
                            <h2 className="font-display font-bold text-lg text-foreground mb-5 flex items-center gap-2">
                                <Shield size={18} className="text-primary" />
                                Statut d&apos;identité
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-sanad-success/5 border border-sanad-success/20 rounded-xl p-4 text-center">
                                    <p className="text-3xl font-display font-bold text-sanad-success mb-1">97%</p>
                                    <p className="text-xs font-medium text-foreground">Correspondance faciale</p>
                                    <p className="text-xs text-muted-foreground mt-1">Vérifié par IA</p>
                                </div>
                                <div className="bg-accent rounded-xl p-4 text-center">
                                    <CheckCircle size={28} className="text-sanad-success mx-auto mb-2" />
                                    <p className="text-xs font-medium text-foreground">OCR validé</p>
                                    <p className="text-xs text-muted-foreground mt-1">Données extraites</p>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Nom', value: 'Ahmed Ali' },
                                    { label: 'CIN', value: '12345678' },
                                    { label: 'Date de naissance', value: '03/04/1998' },
                                    { label: 'Expiration', value: '03/04/2032' },
                                ].map((f) => (
                                    <div key={f.label} className="bg-muted rounded-xl p-3">
                                        <p className="text-xs text-muted-foreground">{f.label}</p>
                                        <p className="text-sm font-medium text-foreground">{f.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Document Gallery */}
                        {claim.documents.length > 0 && (
                            <div className="card-base p-6">
                                <h2 className="font-display font-bold text-lg text-foreground mb-5 flex items-center gap-2">
                                    <FileText size={18} className="text-primary" />
                                    Documents ({claim.documents.length})
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {claim.documents.map((doc) => (
                                        <div key={doc.id} className="rounded-xl overflow-hidden border border-border group">
                                            {doc.type === 'photo' ? (
                                                <div className="aspect-video bg-muted relative overflow-hidden">
                                                    <img
                                                        src={doc.url}
                                                        alt={doc.alt}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="aspect-video bg-muted flex items-center justify-center">
                                                    <FileText size={32} className="text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="p-2.5">
                                                <p className="text-xs font-medium text-foreground truncate">{doc.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{doc.uploadedAt}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* AI Analysis */}
                        <div className="card-base p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                                    <Shield size={18} className="text-primary" />
                                    Analyse IA
                                </h2>
                                <button
                                    onClick={() => setShowArabic(!showArabic)}
                                    className="btn-ghost text-xs py-1.5 px-3"
                                >
                                    {showArabic ? 'Français' : 'العربية'}
                                </button>
                            </div>

                            {/* Summary */}
                            <div className="bg-muted rounded-xl p-4 mb-4">
                                <p className={`text-sm text-foreground leading-relaxed ${showArabic ? 'rtl-text' : ''}`} dir={showArabic ? 'rtl' : 'ltr'}>
                                    {showArabic ? claim.aiSummaryAr : claim.aiSummary}
                                </p>
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="text-center p-3 bg-muted rounded-xl">
                                    <p className="text-xl font-display font-bold text-primary tabular-nums">{claim.confidence}%</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Confiance IA</p>
                                </div>
                                <div className="text-center p-3 bg-muted rounded-xl">
                                    <p className="text-xl font-display font-bold text-sanad-success tabular-nums">{claim.severityScore}/10</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Score sévérité</p>
                                </div>
                                <div className="text-center p-3 bg-muted rounded-xl">
                                    <SeverityBadge level={claim.severity} size="sm" animated />
                                </div>
                            </div>

                            {/* Confidence bar */}
                            <div>
                                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                                    <span>Confiance de l&apos;analyse</span>
                                    <span className="font-medium text-foreground">{claim.confidence}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="confidence-bar h-full"
                                        style={{ width: `${claim.confidence}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Extracted Fields */}
                        {claim.extractedFields.length > 0 && (
                            <div className="card-base p-6">
                                <h2 className="font-display font-bold text-lg text-foreground mb-5">Données extraites</h2>
                                <div className="space-y-3">
                                    {claim.extractedFields.map((field) => (
                                        <div key={field.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${field.source === 'photo' ? 'bg-accent text-primary' :
                                                    field.source === 'document' ? 'bg-muted text-muted-foreground' :
                                                        'bg-[#F4B740]/10 text-[#B5850A]'
                                                    }`}>
                                                    {field.source === 'photo' ? 'Photo' : field.source === 'document' ? 'Doc' : 'Chat'}
                                                </span>
                                                <span className="text-sm text-muted-foreground">{field.label}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-medium text-foreground">{field.value}</span>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${field.confidence >= 80 ? 'bg-sanad-success' : field.confidence >= 60 ? 'bg-[#F4B740]' : 'bg-sanad-danger'}`}
                                                            style={{ width: `${field.confidence}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground tabular-nums w-8">{field.confidence}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right column */}
                    <div className="space-y-6">
                        {/* Settlement */}
                        <div className="card-base p-6">
                            <h3 className="font-display font-semibold text-base text-foreground mb-4">Règlement recommandé</h3>
                            <div className="text-center py-4">
                                <p className="text-xs text-muted-foreground mb-1">Estimation</p>
                                <p className="text-4xl font-display font-bold text-primary tabular-nums">
                                    {claim.estimatedCostMin.toLocaleString('fr-FR')} TND
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Fourchette: {claim.estimatedCostMin.toLocaleString('fr-FR')} – {claim.estimatedCostMax.toLocaleString('fr-FR')} TND
                                </p>
                            </div>
                            <div className={`rounded-xl p-4 mt-4 ${businessRule.decision === 'auto_approve' ? 'bg-sanad-success/5 border border-sanad-success/20' : 'bg-[#F4B740]/5 border border-[#F4B740]/30'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {businessRule.decision === 'auto_approve' ? (
                                        <CheckCircle size={16} className="text-sanad-success flex-shrink-0" />
                                    ) : (
                                        <AlertTriangle size={16} className="text-[#B5850A] flex-shrink-0" />
                                    )}
                                    <p className="text-xs font-semibold text-foreground">
                                        {businessRule.decision === 'auto_approve' ? 'Approbation automatique' : 'Révision manuelle requise'}
                                    </p>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">{businessRule.explanation}</p>
                            </div>
                        </div>

                        {/* Recommended Action */}
                        <div className="card-base p-6">
                            <h3 className="font-display font-semibold text-base text-foreground mb-3">Action recommandée</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{claim.recommendedAction}</p>
                        </div>

                        {/* Actions */}
                        {actionState === 'idle' && (
                            <div className="card-base p-6 space-y-3">
                                <h3 className="font-display font-semibold text-base text-foreground mb-4">Actions</h3>
                                <button
                                    onClick={() => handleAction('approve')}
                                    className="w-full btn-primary justify-center gap-2"
                                >
                                    <CheckCircle size={16} />
                                    Approuver
                                </button>
                                <button
                                    onClick={() => handleAction('review')}
                                    className="w-full btn-secondary justify-center gap-2"
                                >
                                    <AlertTriangle size={16} />
                                    Révision manuelle
                                </button>
                                <button
                                    onClick={() => handleAction('reject')}
                                    className="w-full btn-danger justify-center gap-2"
                                >
                                    <AlertCircle size={16} />
                                    Rejeter
                                </button>
                            </div>
                        )}

                        {(actionState === 'approving' || actionState === 'reviewing' || actionState === 'rejecting') && (
                            <div className="card-base p-6 text-center">
                                <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">
                                    {actionState === 'approving' ? 'Approbation en cours...' :
                                        actionState === 'reviewing' ? 'Envoi en révision...' : 'Rejet en cours...'}
                                </p>
                            </div>
                        )}

                        {/* Timeline */}
                        <div className="card-base p-6">
                            <h3 className="font-display font-semibold text-base text-foreground mb-5">Chronologie</h3>
                            <div className="space-y-4">
                                {claim.timeline.map((event, i) => {
                                    const config = actorConfig[event.actor];
                                    const ActorIcon = config.icon;
                                    return (
                                        <div key={event.id} className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                                                    <ActorIcon size={12} />
                                                </div>
                                                {i < claim.timeline.length - 1 && (
                                                    <div className="w-px flex-1 bg-border mt-1 min-h-[16px]" />
                                                )}
                                            </div>
                                            <div className="pb-4">
                                                <p className="text-sm font-medium text-foreground leading-tight">{event.event}</p>
                                                {event.detail && <p className="text-xs text-muted-foreground mt-0.5">{event.detail}</p>}
                                                <p className="text-[10px] text-muted-foreground mt-1">{event.timestamp} · {config.label}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
