import React from 'react';
import { Claim } from '@/data/mockClaims';
import ConfidenceBar from '@/components/ui/ConfidenceBar';
import { Database } from 'lucide-react';

interface ExtractedDataPanelProps {
    claim: Claim;
}

const sourceLabel: Record<string, string> = {
    photo: '📷 Photo',
    document: '📄 Document',
    chat: '💬 Chat',
};

export default function ExtractedDataPanel({ claim }: ExtractedDataPanelProps) {
    return (
        <div className="card-base p-6">
            <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
                    <Database size={16} className="text-primary" />
                </div>
                <div>
                    <p className="section-label">Extraction IA</p>
                    <h2 className="text-base font-semibold text-foreground">Données extraites</h2>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Champ</th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valeur extraite</th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-40">Confiance</th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source</th>
                        </tr>
                    </thead>
                    <tbody>
                        {claim.extractedFields.map((field) => (
                            <tr key={`ef-row-${field.id}`} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                                <td className="py-3 px-3">
                                    <span className="font-medium text-foreground">{field.label}</span>
                                </td>
                                <td className="py-3 px-3">
                                    <span className={`text-sm ${field.confidence < 60 ? 'text-severity-high' : 'text-foreground'}`}>
                                        {field.value}
                                        {field.confidence < 60 && (
                                            <span className="ml-2 text-xs text-severity-high">(incertain)</span>
                                        )}
                                    </span>
                                </td>
                                <td className="py-3 px-3 w-40">
                                    <ConfidenceBar value={field.confidence} size="sm" />
                                </td>
                                <td className="py-3 px-3">
                                    <span className="text-xs text-muted-foreground">{sourceLabel[field.source]}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {claim.extractedFields.some((f) => f.confidence < 60) && (
                <div className="mt-4 flex items-start gap-2 bg-severity-high-bg border border-[var(--severity-high-border)] rounded-xl px-4 py-3">
                    <span className="text-severity-high text-lg leading-none">⚠️</span>
                    <p className="text-xs text-severity-high">
                        Certains champs ont une confiance faible. Une vérification manuelle est recommandée pour les valeurs marquées comme incertaines.
                    </p>
                </div>
            )}
        </div>
    );
}