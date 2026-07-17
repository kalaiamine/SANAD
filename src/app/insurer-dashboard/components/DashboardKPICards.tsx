import React from 'react';
import { AlertCircle, TrendingUp, Eye } from 'lucide-react';
import { Claim } from '@/data/mockClaims';
import Icon from '@/components/ui/AppIcon';


interface DashboardKPICardsProps {
    claims: Claim[];
}

export default function DashboardKPICards({ claims }: DashboardKPICardsProps) {
    const todayClaims = claims.length;
    const highSeverityUnreviewed = claims.filter(
        (c) => (c.severity === 'critical' || c.severity === 'high') && c.status === 'under_review'
    ).length;
    const avgConfidence = Math.round(
        claims.reduce((sum, c) => sum + c.confidence, 0) / claims.length
    );
    const pendingReview = claims.filter((c) => c.status === 'under_review' || c.status === 'reported').length;

    const cards = [
        {
            id: 'kpi-total',
            label: 'Dossiers aujourd\'hui',
            value: todayClaims,
            unit: '',
            icon: TrendingUp,
            trend: '+3 vs hier',
            trendPositive: false,
            bgClass: 'bg-card',
            valueClass: 'text-foreground',
        },
        {
            id: 'kpi-urgent',
            label: 'Critique/Élevé — Non traités',
            value: highSeverityUnreviewed,
            unit: '',
            icon: AlertCircle,
            trend: 'Action requise',
            trendPositive: false,
            bgClass: 'bg-severity-critical-bg',
            valueClass: 'text-severity-critical',
            alert: true,
        },
        {
            id: 'kpi-confidence',
            label: 'Confiance IA moyenne',
            value: avgConfidence,
            unit: '%',
            icon: TrendingUp,
            trend: '+2% vs semaine dernière',
            trendPositive: true,
            bgClass: 'bg-card',
            valueClass: 'text-foreground',
        },
        {
            id: 'kpi-pending',
            label: 'En attente de révision',
            value: pendingReview,
            unit: '',
            icon: Eye,
            trend: 'Dans la file',
            trendPositive: null,
            bgClass: 'bg-card',
            valueClass: 'text-foreground',
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {cards.map((card) => {
                const Icon = card.icon;
                return (
                    <div
                        key={card.id}
                        className={`${card.bgClass} rounded-2xl border ${card.alert ? 'border-[var(--severity-critical-border)]' : 'border-border'} p-5 shadow-card fade-in-up`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider leading-tight">
                                {card.label}
                            </p>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${card.alert ? 'bg-severity-critical text-white' : 'bg-accent text-primary'
                                }`}>
                                <Icon size={16} />
                            </div>
                        </div>
                        <p className={`text-4xl font-bold tabular-nums mb-2 ${card.valueClass}`}>
                            {card.value}<span className="text-xl font-semibold">{card.unit}</span>
                        </p>
                        {card.alert && (
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-severity-critical animate-pulse" />
                                <p className="text-xs font-semibold text-severity-critical">{card.trend}</p>
                            </div>
                        )}
                        {!card.alert && (
                            <p className={`text-xs font-medium ${card.trendPositive === true ? 'text-severity-low' :
                                    card.trendPositive === false ? 'text-severity-high' : 'text-muted-foreground'
                                }`}>
                                {card.trend}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}