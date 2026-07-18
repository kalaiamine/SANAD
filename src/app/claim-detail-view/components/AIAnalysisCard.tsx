'use client';

import React, { useState } from 'react';
import { Claim } from '@/data/mockClaims';
import SeverityBadge from '@/components/ui/SeverityBadge';
import ConfidenceBar from '@/components/ui/ConfidenceBar';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface AIAnalysisCardProps {
    claim: Claim;
}

export default function AIAnalysisCard({ claim }: AIAnalysisCardProps) {
    const [showAr, setShowAr] = useState(false);
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="card-base overflow-hidden">
            {/* Severity accent bar */}
            <div
                className={`h-1 w-full ${claim.severity === 'critical' ? 'bg-severity-critical' :
                        claim.severity === 'high' ? 'bg-severity-high' :
                            claim.severity === 'medium' ? 'bg-severity-medium' : 'bg-severity-low'
                    }`}
            />

            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
                            <Sparkles size={16} className="text-primary" />
                        </div>
                        <div>
                            <p className="section-label">Analyse IA</p>
                            <h2 className="text-base font-semibold text-foreground">Résumé du sinistre</h2>
                        </div>
                    </div>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="btn-ghost p-2 rounded-xl"
                        aria-label={expanded ? 'Réduire' : 'Développer'}
                    >
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>

                {expanded && (
                    <div className="space-y-5 fade-in-up">
                        {/* Severity + confidence row */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 bg-muted rounded-2xl p-4">
                                <p className="section-label mb-3">Niveau de sévérité</p>
                                <SeverityBadge level={claim.severity} score={claim.severityScore} size="lg" animated />
                            </div>
                            <div className="flex-1 bg-muted rounded-2xl p-4">
                                <p className="section-label mb-3">Confiance de l&apos;analyse</p>
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl font-bold tabular-nums text-foreground">{claim.confidence}%</span>
                                    <div className="flex-1">
                                        <ConfidenceBar value={claim.confidence} showLabel={false} />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {claim.confidence >= 85 ? 'Haute confiance' : claim.confidence >= 70 ? 'Confiance modérée' : 'Données partielles'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Summary */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="section-label">Résumé</p>
                                <button
                                    onClick={() => setShowAr(!showAr)}
                                    className="text-xs text-muted-foreground hover:text-secondary transition-colors flex items-center gap-1"
                                >
                                    {showAr ? '🇫🇷 Français' : '🇲🇦 العربية'}
                                </button>
                            </div>
                            <p className={`text-sm text-foreground leading-relaxed ${showAr ? 'rtl-text' : ''}`}>
                                {showAr ? claim.aiSummaryAr : claim.aiSummary}
                            </p>
                        </div>

                        {/* Recommended action */}
                        <div className={`rounded-2xl p-4 ${claim.severity === 'critical' || claim.severity === 'high' ? 'bg-severity-critical-bg border border-[var(--severity-critical-border)]' : 'bg-accent border border-[var(--secondary)]'
                            }`}>
                            <p className={`section-label mb-2 ${claim.severity === 'critical' || claim.severity === 'high' ? 'text-severity-critical' : 'text-primary'
                                }`}>
                                Action recommandée
                            </p>
                            <p className={`text-sm font-medium leading-relaxed ${claim.severity === 'critical' || claim.severity === 'high' ? 'text-severity-critical' : 'text-primary'
                                }`}>
                                {claim.recommendedAction}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}