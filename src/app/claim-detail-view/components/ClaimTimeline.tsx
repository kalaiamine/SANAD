import React from 'react';
import { Claim } from '@/data/mockClaims';
import { MessageSquare, Sparkles, UserCheck, Clock } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface ClaimTimelineProps {
    claim: Claim;
}

const actorConfig = {
    policyholder: {
        icon: MessageSquare,
        label: 'Assuré',
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-600',
        dotColor: 'bg-blue-400',
    },
    ai: {
        icon: Sparkles,
        label: 'Analyse IA',
        iconBg: 'bg-accent',
        iconColor: 'text-primary',
        dotColor: 'bg-secondary',
    },
    adjuster: {
        icon: UserCheck,
        label: 'Expert',
        iconBg: 'bg-muted',
        iconColor: 'text-muted-foreground',
        dotColor: 'bg-muted-foreground',
    },
};

export default function ClaimTimeline({ claim }: ClaimTimelineProps) {
    return (
        <div className="card-base p-6">
            <div className="flex items-center gap-2.5 mb-6">
                <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
                    <Clock size={16} className="text-primary" />
                </div>
                <div>
                    <p className="section-label">Historique</p>
                    <h2 className="text-base font-semibold text-foreground">Chronologie du dossier</h2>
                </div>
            </div>

            <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

                <div className="space-y-5">
                    {claim.timeline.map((event, i) => {
                        const config = actorConfig[event.actor];
                        const Icon = config.icon;
                        const isLast = i === claim.timeline.length - 1;

                        return (
                            <div key={`timeline-${event.id}`} className="flex gap-4 relative">
                                {/* Icon */}
                                <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-xl ${config.iconBg} flex items-center justify-center border border-border`}>
                                    <Icon size={14} className={config.iconColor} />
                                </div>

                                {/* Content */}
                                <div className={`flex-1 pb-1 ${isLast ? '' : ''}`}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{event.event}</p>
                                            {event.detail && (
                                                <p className="text-xs text-muted-foreground mt-0.5">{event.detail}</p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-1">{config.label}</p>
                                        </div>
                                        <span className="text-xs tabular-nums text-muted-foreground font-mono flex-shrink-0">
                                            {event.timestamp}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Adjuster assignment */}
            {claim.adjuster && (
                <div className="mt-6 pt-5 border-t border-border flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                        <UserCheck size={14} className="text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Expert assigné</p>
                        <p className="text-sm font-medium text-foreground">{claim.adjuster}</p>
                    </div>
                </div>
            )}
            {!claim.adjuster && (
                <div className="mt-6 pt-5 border-t border-border">
                    <p className="text-xs text-severity-high font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-severity-high inline-block" />
                        Aucun expert assigné — action requise
                    </p>
                </div>
            )}
        </div>
    );
}