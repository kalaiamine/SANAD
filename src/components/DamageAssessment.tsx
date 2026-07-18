import React from 'react';
import { AlertCircle, AlertTriangle, ShieldAlert, CheckCircle, Shield } from 'lucide-react';
import type { AssessmentResult } from '@/lib/costEstimator';

interface DamageAssessmentProps {
    assessment: AssessmentResult;
    loading?: boolean;
    error?: string;
}

export default function DamageAssessment({ assessment, loading, error }: DamageAssessmentProps) {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-3xl animate-pulse">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
                <p className="text-sm font-medium text-muted-foreground">Analyse des dégâts en cours par l'IA...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-5 bg-sanad-danger/10 border border-sanad-danger/20 rounded-2xl flex items-start gap-3">
                <AlertCircle className="text-sanad-danger flex-shrink-0 mt-0.5" size={18} />
                <div>
                    <h4 className="text-sm font-bold text-sanad-danger">Échec de l'analyse</h4>
                    <p className="text-xs text-sanad-danger/95 mt-1">{error}</p>
                </div>
            </div>
        );
    }

    const { damages, totalEstimatedCost, summary } = assessment;

    if (damages.length === 0) {
        return (
            <div className="p-6 bg-accent border border-border rounded-3xl text-center space-y-2">
                <CheckCircle className="text-sanad-success mx-auto" size={32} />
                <h4 className="font-display font-bold text-sm text-foreground">Aucun dégât détecté</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Le modèle de vision n'a repéré aucune anomalie de carrosserie ou d'optique sur les images soumises.
                </p>
            </div>
        );
    }

    // Color helpers for severity levels
    const severityStyles = (severity: string) => {
        switch (severity) {
            case 'Severe':
                return {
                    bg: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50',
                    badge: 'bg-red-500 text-white',
                    text: 'text-red-900 dark:text-red-200',
                    border: 'border-red-200 dark:border-red-900/50'
                };
            case 'Medium':
                return {
                    bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50',
                    badge: 'bg-amber-500 text-white',
                    text: 'text-amber-900 dark:text-amber-200',
                    border: 'border-amber-200 dark:border-amber-900/50'
                };
            case 'Minor':
            default:
                return {
                    bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50',
                    badge: 'bg-emerald-500 text-white',
                    text: 'text-emerald-900 dark:text-emerald-200',
                    border: 'border-emerald-200 dark:border-emerald-900/50'
                };
        }
    };

    return (
        <div className="bg-card border border-border rounded-3xl shadow-card overflow-hidden card-reveal space-y-6 p-6">
            {/* Header / Summary banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5">
                <div>
                    <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                        <Shield className="text-primary" size={20} />
                        Évaluation IA des dommages
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Rapport analytique de détection YOLO</p>
                </div>
                <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-2xl flex flex-col items-end">
                    <span className="text-[10px] uppercase font-semibold text-primary">Estimation globale</span>
                    <span className="text-2xl font-display font-bold text-primary tabular-nums">
                        {totalEstimatedCost.toLocaleString('fr-FR')} TND
                    </span>
                </div>
            </div>

            {/* AI Textual Summary */}
            <div className="bg-accent/40 border border-border rounded-2xl p-4">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block mb-1">
                    Résumé de l'assureur
                </span>
                <p className="text-sm text-foreground leading-relaxed font-medium">
                    {summary}
                </p>
            </div>

            {/* Individual damage items */}
            <div className="space-y-3">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                    Détail des anomalies repérées ({damages.length})
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {damages.map((damage, index) => {
                        const style = severityStyles(damage.severity);
                        return (
                            <div
                                key={index}
                                className={`flex items-start justify-between p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${style.bg}`}
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${style.badge}`}>
                                            {damage.severity}
                                        </span>
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            Confiance: {Math.round(damage.confidence * 100)}%
                                        </span>
                                    </div>
                                    <h4 className="font-display font-bold text-sm text-foreground">
                                        {damage.type}
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                        Zone : {damage.part}
                                    </p>
                                </div>
                                <div className="text-right flex flex-col justify-between h-full min-h-[50px]">
                                    <span className="text-sm font-display font-bold text-foreground tabular-nums">
                                        +{damage.estimatedCost} TND
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer warning */}
            <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border">
                Ce rapport a été généré via l'IA de vision par ordinateur Roboflow YOLO. Les montants calculés sont purement indicatifs et basés sur la grille tarifaire de l'assurance automobile en Tunisie.
            </p>
        </div>
    );
}
