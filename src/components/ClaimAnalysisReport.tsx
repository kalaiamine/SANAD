'use client';

import { Shield, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { ClaimReportData } from '@/lib/claims/buildClaimReport';
import ExplainabilityPanel from '@/components/ExplainabilityPanel';

const severityLabel = {
    legere: 'Légère',
    moderee: 'Modérée',
    severe: 'Sévère',
} as const;

function VehicleEstimateRow({
    label,
    brand,
    immatriculation,
    min,
    max,
    damage,
    source,
    severity,
}: {
    label: 'A' | 'B';
    brand: string;
    immatriculation: string;
    min: number;
    max: number;
    damage: string;
    source: string;
    severity: 'legere' | 'moderee' | 'severe';
}) {
    return (
        <div className="rounded-xl border border-border bg-background/60 p-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-foreground">
                    Véhicule {label} · {brand}
                </p>
                <span className="text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {source === 'roboflow'
                        ? 'Roboflow YOLO'
                        : source === 'vision'
                          ? 'Groq Vision'
                          : 'Déclaration'}
                </span>
            </div>
            <p className="text-[11px] text-muted-foreground">{immatriculation}</p>
            <p className="text-sm font-display font-bold text-primary">
                {min.toLocaleString('fr-FR')} – {max.toLocaleString('fr-FR')} TND
            </p>
            <p className="text-xs text-foreground leading-relaxed">{damage}</p>
            <p className="text-[10px] text-muted-foreground">Gravité : {severityLabel[severity]}</p>
        </div>
    );
}

function FraudVehicleRow({
    label,
    result,
}: {
    label: 'A' | 'B';
    result: ClaimReportData['fraudA'];
}) {
    if (!result) {
        return (
            <p className="text-[11px] text-muted-foreground">
                Véhicule {label} : analyse anti-fraude non disponible.
            </p>
        );
    }

    return (
        <div className={`rounded-lg p-2.5 text-xs ${result.inconsistencyDetected ? 'bg-sanad-danger/10 border border-sanad-danger/20' : 'bg-sanad-success/5 border border-sanad-success/15'}`}>
            <div className="flex items-center gap-1.5 font-semibold mb-1">
                {result.inconsistencyDetected ? (
                    <AlertTriangle size={12} className="text-sanad-danger" />
                ) : (
                    <CheckCircle2 size={12} className="text-sanad-success" />
                )}
                <span className={result.inconsistencyDetected ? 'text-sanad-danger' : 'text-sanad-success'}>
                    Véhicule {label} · {result.inconsistencyDetected ? 'Incohérence détectée' : 'Cohérent'}
                </span>
            </div>
            <p className="text-muted-foreground leading-relaxed">{result.explanation}</p>
        </div>
    );
}

export default function ClaimAnalysisReport({ data }: { data: ClaimReportData }) {
    const riskColor =
        data.riskLevel === 'Élevé'
            ? 'text-sanad-danger'
            : data.riskLevel === 'Modéré'
              ? 'text-[#B5850A]'
              : 'text-sanad-success';

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card card-reveal mt-2 mb-4 w-full">
            <div className="bg-accent px-5 py-4 border-b border-border">
                <p className="font-display font-bold text-base text-foreground">Rapport d&apos;analyse SANAD</p>
                <p className="text-xs text-muted-foreground mt-1">
                    Constat du {data.constatData.date || '—'} à {data.constatData.heure || '—'} · {data.constatData.lieu || 'Lieu non précisé'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Généré le {data.generatedAt}</p>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Settlement recommendation */}
                <div className="card-base p-5 flex flex-col">
                    <div className="w-10 h-10 rounded-2xl bg-sanad-success/10 flex items-center justify-center mb-4">
                        <Zap size={20} className="text-sanad-success" />
                    </div>
                    <h3 className="font-display font-bold text-lg text-foreground mb-1">Recommandation instantanée</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        Analyse IA des dommages des deux véhicules, basée sur les photos et les déclarations du constat.
                    </p>
                    <div className="p-3 bg-sanad-success/5 rounded-xl border border-sanad-success/20 mb-4">
                        <p className="text-xs text-muted-foreground">Règlement estimé (fourchette totale)</p>
                        <p className="text-2xl font-display font-bold text-sanad-success">
                            {data.settlementMin.toLocaleString('fr-FR')} – {data.settlementMax.toLocaleString('fr-FR')} TND
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Milieu indicatif : {data.settlementMid.toLocaleString('fr-FR')} TND
                        </p>
                    </div>
                    {data.invoiceReference != null && (
                        <p className="text-[11px] text-muted-foreground mb-3">
                            Facture jointe : {data.invoiceReference.toLocaleString('fr-FR')} TND (référence dossier)
                        </p>
                    )}
                    <div className="space-y-2 mt-auto">
                        {data.vehicleA && (
                            <VehicleEstimateRow
                                label="A"
                                brand={data.vehicleA.brand}
                                immatriculation={data.vehicleA.immatriculation}
                                min={data.vehicleA.result.estimatedCostMin}
                                max={data.vehicleA.result.estimatedCostMax}
                                damage={data.vehicleA.result.detectedDamage}
                                source={data.vehicleA.source}
                                severity={data.vehicleA.result.severity}
                            />
                        )}
                        {data.vehicleB && (
                            <VehicleEstimateRow
                                label="B"
                                brand={data.vehicleB.brand}
                                immatriculation={data.vehicleB.immatriculation}
                                min={data.vehicleB.result.estimatedCostMin}
                                max={data.vehicleB.result.estimatedCostMax}
                                damage={data.vehicleB.result.detectedDamage}
                                source={data.vehicleB.source}
                                severity={data.vehicleB.result.severity}
                            />
                        )}
                        {data.explainability && (
                            <ExplainabilityPanel
                                title="Facteurs de coût (SHAP)"
                                titleAr="عوامل التكلفة"
                                contributions={data.explainability.settlement}
                                unit=" TND"
                                methodology={data.explainability.methodology}
                            />
                        )}
                    </div>
                </div>

                {/* Fraud detection */}
                <div className="card-base p-5 flex flex-col">
                    <div className="w-10 h-10 rounded-2xl bg-sanad-danger/10 flex items-center justify-center mb-4">
                        <Shield size={20} className="text-sanad-danger" />
                    </div>
                    <h3 className="font-display font-bold text-lg text-foreground mb-1">Détection de fraude</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        Comparaison photo vs. déclaration pour chaque véhicule du constat amiable.
                    </p>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-muted rounded-xl p-3 text-center">
                            <p className={`text-lg font-display font-bold ${riskColor}`}>{data.fraudScore}/100</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Score de fraude</p>
                        </div>
                        <div className="bg-muted rounded-xl p-3 text-center">
                            <p className={`text-lg font-display font-bold ${riskColor}`}>{data.riskLevel}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Niveau de risque</p>
                        </div>
                        <div className="bg-muted rounded-xl p-3 text-center">
                            <p className="text-lg font-display font-bold text-primary">{data.aiConfidence}%</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Confiance IA</p>
                        </div>
                    </div>
                    <div className="space-y-2 mt-auto">
                        <FraudVehicleRow label="A" result={data.fraudA} />
                        <FraudVehicleRow label="B" result={data.fraudB} />
                        {data.explainability && (
                            <ExplainabilityPanel
                                title="Score de fraude — explicabilité SHAP"
                                titleAr="تفسير مؤشر الاحتيال"
                                contributions={data.explainability.fraudScore}
                                unit=""
                                methodology={`Score final : ${data.explainability.baseScore}/100. ${data.explainability.methodology}`}
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="px-5 pb-4">
                <p className="text-[10px] text-muted-foreground leading-relaxed border-t border-border pt-3">
                    Estimations indicatives à titre informatif — le montant définitif sera confirmé par un expert agréé ou un garage partenaire. Le score de fraude signale des anomalies visuelles, pas une décision juridique.
                </p>
            </div>
        </div>
    );
}
