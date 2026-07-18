import React, { useState } from 'react';
import { AIResultCard as AIResultCardType } from '@/data/mockChat';
import SeverityBadge from '@/components/ui/SeverityBadge';
import ConfidenceBar from '@/components/ui/ConfidenceBar';
import { CheckCircle, ArrowRight, Copy, Check } from 'lucide-react';
import Link from 'next/link';

interface AIResultCardProps {
    result: AIResultCardType;
}

export default function AIResultCard({ result }: AIResultCardProps) {
    const [copied, setCopied] = useState(false);
    const [showAr, setShowAr] = useState(false);

    const handleCopy = () => {
        // Copy case ID to clipboard
        navigator.clipboard.writeText(result.caseId).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const formattedMin = new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(result.estimatedCostMin);
    const formattedMax = new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(result.estimatedCostMax);

    return (
        <div className="card-reveal">
            {/* Signature visual moment — the result card */}
            <div className="bg-card border border-border rounded-2xl shadow-elevated overflow-hidden max-w-lg">
                {/* Header bar — severity color */}
                <div className={`h-1.5 w-full ${result.severity === 'critical' ? 'bg-severity-critical' :
                    result.severity === 'high' ? 'bg-severity-high' :
                        result.severity === 'medium' ? 'bg-severity-medium' : 'bg-severity-low'
                    }`} />

                <div className="p-5">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-secondary flex-shrink-0" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Dossier créé
                            </span>
                        </div>
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
                        >
                            {copied ? <Check size={12} className="text-severity-low" /> : <Copy size={12} />}
                            {result.caseId}
                        </button>
                    </div>

                    {/* Severity — the signature moment */}
                    <div className="mb-4">
                        <SeverityBadge level={result.severity} score={result.severityScore} size="lg" animated />
                    </div>

                    {/* Summary */}
                    <div className="mb-4">
                        <button
                            onClick={() => setShowAr(!showAr)}
                            className="text-xs text-muted-foreground mb-2 hover:text-secondary transition-colors flex items-center gap-1"
                        >
                            {showAr ? '🇫🇷 Voir en français' : '🇲🇦 عرض بالعربية'}
                        </button>
                        <p className={`text-sm text-foreground leading-relaxed ${showAr ? 'rtl-text' : ''}`}>
                            {showAr ? result.summaryAr : result.summary}
                        </p>
                    </div>

                    {/* Cost estimate */}
                    <div className="flex items-center justify-between bg-muted rounded-xl px-4 py-3 mb-4">
                        <span className="text-xs text-muted-foreground font-medium">Estimation des dommages</span>
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                            {formattedMin} – {formattedMax}
                        </span>
                    </div>

                    {/* Confidence */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-muted-foreground">Confiance IA</span>
                        </div>
                        <ConfidenceBar value={result.confidence} />
                    </div>

                    {/* Next step */}
                    <div className={`rounded-xl p-4 mb-4 ${result.severity === 'critical' || result.severity === 'high' ? 'bg-severity-critical-bg border border-[var(--severity-critical-border)]' : 'bg-accent border border-[var(--secondary)]'
                        }`}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                            Prochaine étape
                        </p>
                        <p className={`text-sm leading-relaxed ${result.severity === 'critical' || result.severity === 'high' ? 'text-severity-critical' : 'text-primary'
                            }`}>
                            {showAr ? result.nextStepAr : result.nextStep}
                        </p>
                    </div>

                    {/* Action */}
                    <Link
                        href="/claim-detail-view"
                        className="btn-primary w-full justify-center"
                    >
                        Voir le dossier complet
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
