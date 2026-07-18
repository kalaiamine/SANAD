'use client';

import { BarChart3 } from 'lucide-react';
import type { ShapContribution } from '@/lib/ai/explainability';

interface ExplainabilityPanelProps {
    title: string;
    titleAr?: string;
    contributions: ShapContribution[];
    unit?: string;
    lang?: 'fr' | 'ar';
    methodology?: string;
}

export default function ExplainabilityPanel({
    title,
    titleAr,
    contributions,
    unit = '',
    lang = 'fr',
    methodology,
}: ExplainabilityPanelProps) {
    if (!contributions.length) return null;

    return (
        <div className="rounded-xl border border-border bg-background/60 p-4 space-y-3">
            <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-primary" />
                <div>
                    <p className="text-xs font-bold text-foreground">{lang === 'ar' && titleAr ? titleAr : title}</p>
                    <p className="text-[10px] text-muted-foreground">Explicabilité SHAP · contribution marginale</p>
                </div>
            </div>
            <div className="space-y-2">
                {contributions.map((c, i) => (
                    <div key={i} className="space-y-1">
                        <div className="flex justify-between gap-2 text-[10px]">
                            <span className="text-foreground font-medium truncate">
                                {lang === 'ar' ? c.featureAr : c.feature}
                            </span>
                            <span className={c.contribution >= 0 ? 'text-sanad-danger font-semibold' : 'text-sanad-success font-semibold'}>
                                {c.contribution >= 0 ? '+' : ''}
                                {c.contribution}
                                {unit}
                            </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${c.contribution >= 0 ? 'bg-sanad-danger/70' : 'bg-sanad-success/70'}`}
                                style={{ width: `${c.impact}%` }}
                            />
                        </div>
                        <p className="text-[9px] text-muted-foreground truncate">{c.value}</p>
                    </div>
                ))}
            </div>
            {methodology && (
                <p className="text-[9px] text-muted-foreground leading-relaxed border-t border-border pt-2">{methodology}</p>
            )}
        </div>
    );
}
