import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';


export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

interface SeverityBadgeProps {
    level: SeverityLevel;
    score?: number;
    size?: 'sm' | 'md' | 'lg';
    animated?: boolean;
}

const severityConfig: Record<SeverityLevel, {
    label: string;
    labelFr: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    classes: string;
    iconColor: string;
}> = {
    critical: {
        label: 'Critique',
        labelFr: 'Critique',
        icon: AlertCircle,
        classes: 'bg-severity-critical-bg text-severity-critical border border-[var(--severity-critical-border)]',
        iconColor: 'text-severity-critical',
    },
    high: {
        label: 'Élevé',
        labelFr: 'Élevé',
        icon: AlertTriangle,
        classes: 'bg-severity-high-bg text-severity-high border border-[var(--severity-high-border)]',
        iconColor: 'text-severity-high',
    },
    medium: {
        label: 'Modéré',
        labelFr: 'Modéré',
        icon: Info,
        classes: 'bg-severity-medium-bg text-severity-medium border border-[var(--severity-medium-border)]',
        iconColor: 'text-severity-medium',
    },
    low: {
        label: 'Faible',
        labelFr: 'Faible',
        icon: CheckCircle,
        classes: 'bg-severity-low-bg text-severity-low border border-[var(--severity-low-border)]',
        iconColor: 'text-severity-low',
    },
};

const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3 py-1.5 gap-2',
    lg: 'text-base px-4 py-2 gap-2.5',
};

const iconSizes = { sm: 12, md: 14, lg: 18 };

export default function SeverityBadge({ level, score, size = 'md', animated = false }: SeverityBadgeProps) {
    const config = severityConfig[level];
    const Icon = config.icon;

    return (
        <span
            className={`inline-flex items-center font-semibold rounded-full ${config.classes} ${sizeClasses[size]} ${animated ? 'badge-pop' : ''}`}
        >
            <Icon size={iconSizes[size]} className={config.iconColor} />
            {config.label}
            {score !== undefined && (
                <span className="ml-1 opacity-70 tabular-nums">({score}/10)</span>
            )}
        </span>
    );
}