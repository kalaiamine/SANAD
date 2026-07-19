'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Send, Paperclip, X, Loader2, FileText, Image as ImageIcon, ArrowLeft, AlertTriangle, Wrench, Download, RotateCcw, LogOut, History } from 'lucide-react';
import type { ExtractedDocumentFields } from '@/lib/ai/documentExtractionPrompt';
import { EMPTY_FNOL_COLLECTED, type FnolCollectedData } from '@/lib/ai/fnolPrompt';
import type { DamageEstimateResult } from '@/lib/ai/damageEstimatePrompt';
import type { ConstatData } from '@/lib/constat/types';
import type { ConstatFraudResults } from '@/lib/constat/generateConstatPdf';
import { generatePoliceReportPdf } from '@/lib/constat/generatePoliceReportPdf';
import ConstatModal from '@/app/components/ConstatModal';
import ClaimAnalysisReport from '@/components/ClaimAnalysisReport';
import { buildClaimReport, type ClaimReportData } from '@/lib/claims/buildClaimReport';
import { persistLatestClaimReport } from '@/lib/claims/persistClaimReport';
import { estimateVehicleDamage } from '@/lib/claims/estimateVehicleDamage';

interface Message {
    id: string;
    role: 'user' | 'ai';
    content: string;
    isArabic?: boolean;
    timestamp: string;
    documentCard?: DocumentCardData;
    summaryCard?: FnolCollectedData;
    errorNotice?: string;
    offerConstat?: boolean;
    damageEstimateCard?: DamageEstimateCardData;
    claimReportCard?: ClaimReportData;
    policeReportCard?: { constatData: ConstatData; fraudResults: ConstatFraudResults };
}

interface DocumentCardData {
    fileName: string;
    extracted: ExtractedDocumentFields | null;
    warning?: string;
}

interface DamageEstimateCardData {
    fileName: string;
    result: DamageEstimateResult | null;
    method?: 'roboflow' | 'groq';
    warning?: string;
}

interface UploadFile {
    id: string;
    name: string;
    type: 'photo' | 'invoice' | 'police' | 'medical';
    status: 'uploading' | 'processing' | 'completed' | 'error';
    progress: number;
}

const WELCOME_MESSAGES: Message[] = [
    {
        id: 'welcome-1',
        role: 'ai',
        content:
            "Bonjour! Je suis votre assistant SANAD. Je suis là pour vous aider à déclarer votre sinistre automobile calmement et rapidement.\n\nPouvez-vous me décrire ce qui s'est passé?",
        timestamp: "À l'instant",
    },
];

function isArabicText(text: string): boolean {
    return /[\u0600-\u06FF]/.test(text);
}

// Detects when the user is asking for the bilateral accident report form
// ("constat amiable"), in French, Arabic, or Tunisian derja spellings.
function mentionsConstat(text: string): boolean {
    const normalized = text.toLowerCase();
    return (
        normalized.includes('constat') ||
        normalized.includes('محضر') ||
        normalized.includes('التصريح المشترك') ||
        /\bdustur\b|\bconstet\b/.test(normalized)
    );
}

function nowStamp() {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function TypingIndicator() {
    return (
        <div className="flex items-end gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                <Shield size={14} className="text-primary" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1.5 items-center">
                    <span className="w-2 h-2 rounded-full bg-primary/40 typing-dot" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary/40 typing-dot" style={{ animationDelay: '200ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary/40 typing-dot" style={{ animationDelay: '400ms' }} />
                </div>
            </div>
        </div>
    );
}

// FNOL structured-intake summary card — shown once the chatbot has gathered
// the minimum required fields and is ready for document/photo upload.
function FnolSummaryCard({ data }: { data: FnolCollectedData }) {
    const rows: [string, string | null][] = [
        ['Description', data.description],
        ['Date / heure', data.dateTime],
        ['Lieu', data.location],
        ['Véhicules impliqués', data.vehiclesInvolved],
        ['Blessures', data.injuries],
        ['Tiers impliqué', data.thirdPartyInfo],
        ['PV de police', data.policeReportFiled],
    ];
    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card card-reveal mt-2 mb-4">
            <div className="bg-accent px-5 py-3 border-b border-border">
                <p className="font-display font-bold text-sm text-foreground">Résumé de votre déclaration</p>
            </div>
            <div className="p-4 space-y-2">
                {rows
                    .filter(([, v]) => !!v)
                    .map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-3 text-sm">
                            <span className="text-muted-foreground flex-shrink-0">{label}</span>
                            <span className="text-foreground text-right">{value}</span>
                        </div>
                    ))}
                <p className="text-xs text-muted-foreground pt-2 border-t border-border mt-2">
                    Vous pouvez maintenant joindre des photos du véhicule et vos documents (PV, facture, certificat médical).
                </p>
            </div>
        </div>
    );
}

// Renders the structured fields returned by /api/extract-document (real OCR + LLM extraction).
function DocumentResultCard({ data }: { data: DocumentCardData }) {
    const { fileName, extracted, warning } = data;

    if (!extracted) {
        return (
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card card-reveal mt-2 mb-4">
                <div className="p-4 flex items-start gap-3">
                    <AlertTriangle size={18} className="text-[#B5850A] flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-foreground">{fileName}</p>
                        <p className="text-xs text-muted-foreground mt-1">{warning}</p>
                    </div>
                </div>
            </div>
        );
    }

    const docTypeLabel: Record<string, string> = {
        police: 'Procès-verbal / rapport de police',
        medical: 'Certificat médical',
        invoice: 'Facture de réparation',
        other: 'Document',
    };

    const fields: [string, string | number | null | undefined][] = [
        ['Date', extracted.date],
        ['Émis par', extracted.issuedBy],
        ['Référence', extracted.referenceNumber],
        ['Lieu', extracted.location],
        ['Parties impliquées', extracted.partiesInvolved],
        ['Patient', extracted.patientName],
        ['Description des blessures', extracted.injuryDescription],
        ['Montant', extracted.amount != null ? `${extracted.amount} ${extracted.currency || 'TND'}` : null],
    ];

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card card-reveal mt-2 mb-4">
            <div className="bg-accent px-5 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                    <p className="font-display font-bold text-sm text-foreground">{docTypeLabel[extracted.docType] || 'Document'}</p>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-sanad-success/10 text-sanad-success border-sanad-success/20">
                        Confiance {extracted.confidence}%
                    </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">{fileName}</p>
            </div>
            <div className="p-4 space-y-3">
                <p className="text-sm text-foreground leading-relaxed">{extracted.summary}</p>
                <div className="space-y-1.5">
                    {fields
                        .filter(([, v]) => v !== null && v !== undefined && v !== '')
                        .map(([label, value]) => (
                            <div key={label} className="flex justify-between gap-3 text-sm">
                                <span className="text-muted-foreground flex-shrink-0">{label}</span>
                                <span className="text-foreground text-right">{value}</span>
                            </div>
                        ))}
                    {extracted.lineItems && extracted.lineItems.length > 0 && (
                        <div className="pt-2 mt-2 border-t border-border">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Détails facture</p>
                            <ul className="text-sm text-foreground space-y-1 list-disc list-inside">
                                {extracted.lineItems.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                {warning && <p className="text-xs text-[#B5850A] bg-[#F4B740]/10 border border-[#F4B740]/30 rounded-lg p-2">{warning}</p>}
            </div>
        </div>
    );
}

// Renders the repair-cost estimate for a vehicle-damage photo (/api/estimate-damage).
function DamageEstimateCard({ data }: { data: DamageEstimateCardData }) {
    const { result, method, warning } = data;

    if (!result) {
        return (
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card card-reveal mt-2 mb-4">
                <div className="p-4 flex items-start gap-3">
                    <AlertTriangle size={18} className="text-[#B5850A] flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-foreground">Estimation du coût de réparation</p>
                        <p className="text-xs text-muted-foreground mt-1">{warning}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!result.damageVisible) {
        return (
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card card-reveal mt-2 mb-4 p-4">
                <p className="text-sm text-foreground">Aucun dommage clairement visible sur cette photo — pas d&apos;estimation de coût possible pour l&apos;instant.</p>
            </div>
        );
    }

    const severityLabel: Record<DamageEstimateResult['severity'], string> = {
        legere: 'Légère',
        moderee: 'Modérée',
        severe: 'Sévère',
    };
    const severityColor: Record<DamageEstimateResult['severity'], string> = {
        legere: 'bg-sanad-success/10 text-sanad-success border-sanad-success/20',
        moderee: 'bg-[#F4B740]/10 text-[#B5850A] border-[#F4B740]/30',
        severe: 'bg-sanad-danger/10 text-sanad-danger border-sanad-danger/20',
    };

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card card-reveal mt-2 mb-4">
            <div className="bg-accent px-5 py-4 border-b border-border">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-display font-bold text-sm text-foreground flex items-center gap-1.5">
                        <Wrench size={14} className="text-primary" /> Estimation du coût de réparation
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {method === 'roboflow' ? 'Roboflow YOLO' : 'Groq Vision'}
                        </span>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${severityColor[result.severity]}`}>
                            {severityLabel[result.severity]}
                        </span>
                    </div>
                </div>
            </div>
            <div className="p-4 space-y-3">
                <p className="text-2xl font-display font-bold text-primary">
                    {result.estimatedCostMin.toLocaleString('fr-FR')} – {result.estimatedCostMax.toLocaleString('fr-FR')} TND
                </p>
                <p className="text-sm text-foreground leading-relaxed">{result.detectedDamage}</p>
                {result.items && result.items.length > 0 && (
                    <div className="border border-border rounded-xl overflow-hidden">
                        <div className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 bg-muted text-[10px] uppercase tracking-wide font-bold text-muted-foreground">
                            <span>Dégât constaté</span>
                            <span>Coût estimé</span>
                        </div>
                        {result.items.map((item, i) => (
                            <div key={i} className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 border-t border-border items-center">
                                <div>
                                    <p className="text-xs font-medium text-foreground">{item.part}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                        {item.type} · {item.severity === 'legere' ? 'légère' : item.severity === 'moderee' ? 'modérée' : 'sévère'}
                                    </p>
                                </div>
                                <p className="text-xs font-semibold text-foreground whitespace-nowrap">
                                    {item.costMin.toLocaleString('fr-FR')}–{item.costMax.toLocaleString('fr-FR')} TND
                                </p>
                            </div>
                        ))}
                    </div>
                )}
                <p className="text-xs text-muted-foreground leading-relaxed">{result.explanation}</p>
                <p className="text-[10px] text-muted-foreground pt-2 border-t border-border">
                    Estimation indicative générée automatiquement (confiance {result.confidence}%) — le montant définitif sera confirmé par un expert ou un garage agréé.
                </p>
            </div>
        </div>
    );
}

function PoliceReportCard({ data }: { data: { constatData: ConstatData; fraudResults: ConstatFraudResults } }) {
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const bytes = await generatePoliceReportPdf(data.constatData, data.fraudResults);
            const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pv-constat-police-${data.constatData.date || 'sanad'}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Failed to generate police report PDF:", e);
            alert("Erreur lors de la génération du rapport de police.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card card-reveal mt-2 mb-4 w-full max-w-sm">
            <div className="bg-[#1A2E5C]/10 px-5 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText size={18} className="text-[#1A2E5C]" />
                    <p className="font-display font-bold text-sm text-[#1A2E5C]">Procès-Verbal de Police (PV)</p>
                </div>
                <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-[#1A2E5C]/20 text-[#1A2E5C]">
                    Officiel
                </span>
            </div>
            <div className="p-4 space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Ce document PDF officiel pré-rempli contient la date, l'heure, le lieu géolocalisé avec lien GPS, les informations des véhicules, ainsi que les alertes de suspicion de fraude SANAD.
                </p>
                <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="btn-primary w-full justify-center text-xs py-2 gap-2 bg-[#1A2E5C] hover:bg-[#1A2E5C]/90 text-white disabled:opacity-50"
                >
                    {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    Télécharger le PV de Police (PDF)
                </button>
            </div>
        </div>
    );
}


export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>(WELCOME_MESSAGES);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [uploads, setUploads] = useState<UploadFile[]>([]);
    const [showUploadMenu, setShowUploadMenu] = useState(false);
    const [collected, setCollected] = useState<FnolCollectedData>(EMPTY_FNOL_COLLECTED);
    const [readyForDocuments, setReadyForDocuments] = useState(false);
    const [showConstatModal, setShowConstatModal] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const findInvoiceReference = (): number | null => {
        for (const msg of messages) {
            const amount = msg.documentCard?.extracted?.amount;
            if (msg.documentCard?.extracted?.docType === 'invoice' && typeof amount === 'number') {
                return amount;
            }
        }
        return null;
    };

    const handleDownloadPdfSuccess = async (
        constatData: ConstatData,
        fileA: File | null,
        fileB: File | null,
        fraudResults: ConstatFraudResults
    ) => {
        addMessage({
            role: 'ai',
            content:
                'Votre constat amiable PDF a été téléchargé avec succès. Nous analysons les photos et déclarations des deux véhicules pour produire votre rapport SANAD…',
        });

        setIsTyping(true);

        // Sequential calls to stay within Groq free-tier TPM limits.
        const estimateA = await estimateVehicleDamage(constatData.vehiculeA, fileA);
        await new Promise((r) => setTimeout(r, 800));
        const estimateB = await estimateVehicleDamage(constatData.vehiculeB, fileB);

        const report = buildClaimReport({
            constatData,
            estimateA,
            estimateB,
            fraudResults,
            invoiceReference: findInvoiceReference(),
        });

        persistLatestClaimReport(report);

        setIsTyping(false);

        addMessage({
            role: 'ai',
            content: 'Voici votre rapport d\'analyse complet pour les deux véhicules, basé sur les données réelles de votre constat :',
            claimReportCard: report,
        });

        if (report.fraudA?.inconsistencyDetected || report.fraudB?.inconsistencyDetected) {
            addMessage({
                role: 'ai',
                content:
                    "⚠️ Une incohérence photo / déclaration a été détectée. Un procès-verbal de police (PV) est recommandé pour compléter votre dossier :",
                policeReportCard: { constatData, fraudResults },
            });
        }
    };

    const addMessage = (msg: Omit<Message, 'id' | 'timestamp'>) => {
        const newMsg: Message = {
            ...msg,
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            timestamp: nowStamp(),
        };
        setMessages((prev) => [...prev, newMsg]);
        return newMsg;
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text) return;
        const arabic = isArabicText(text);
        setInput('');
        addMessage({ role: 'user', content: text, isArabic: arabic });

        if (mentionsConstat(text)) {
            addMessage({
                role: 'ai',
                content:
                    "Bien sûr — je peux vous ouvrir le formulaire du constat amiable à remplir pour les deux véhicules, puis vous pourrez le télécharger en PDF.",
                offerConstat: true,
            });
            return;
        }

        setIsTyping(true);

        try {
            // Send the full conversation so far (stateless API route) plus what
            // we've already extracted, so the model keeps its memory of facts.
            const history = [...messages, { id: '', role: 'user' as const, content: text, timestamp: '' }]
                .filter((m) => m.role === 'user' || m.role === 'ai')
                .map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }));

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history, collected }),
            });

            const data = await res.json();
            setIsTyping(false);

            if (!res.ok) {
                addMessage({
                    role: 'ai',
                    content: data.code === 'MISSING_API_KEY'
                        ? "Le chatbot n'est pas encore configuré : ajoutez une clé Groq gratuite dans .env.local (GROQ_API_KEY)."
                        : data.error || 'Une erreur est survenue. Veuillez réessayer.',
                });
                return;
            }

            setCollected(data.collected);
            addMessage({ role: 'ai', content: data.reply, isArabic: data.language === 'ar' });

            if (data.readyForDocuments && !readyForDocuments) {
                setReadyForDocuments(true);
                addMessage({ role: 'ai', content: '', summaryCard: data.collected } as Omit<Message, 'id' | 'timestamp'>);
            }
        } catch (err) {
            console.error(err);
            setIsTyping(false);
            addMessage({ role: 'ai', content: 'Une erreur est survenue. Veuillez réessayer.' });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const runDocumentExtraction = async (file: File, type: UploadFile['type']) => {
        const id = `upload-${Date.now()}`;
        const uploadFile: UploadFile = { id, name: file.name, type, status: 'uploading', progress: 0 };
        setUploads((prev) => [...prev, uploadFile]);

        // Lightweight visual progress while the file uploads to our own API route.
        for (let p = 0; p <= 80; p += 20) {
            await new Promise((r) => setTimeout(r, 120));
            setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, progress: p } : u)));
        }
        setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'processing', progress: 90 } : u)));

        if (type === 'photo') {
            try {
                const formData = new FormData();
                formData.append('photo', file);

                const res = await fetch('/api/estimate-damage', { method: 'POST', body: formData });
                const data = await res.json();

                setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: res.ok ? 'completed' : 'error', progress: 100 } : u)));

                if (!res.ok) {
                    addMessage({
                        role: 'ai',
                        content:
                            data.code === 'MISSING_API_KEY'
                                ? "L'estimation du coût de réparation n'est pas encore configurée : ajoutez une clé Groq gratuite dans .env.local (GROQ_API_KEY)."
                                : "Photo bien reçue et enregistrée dans votre dossier. L'estimation automatique du coût de réparation a échoué — elle sera revue manuellement.",
                    });
                    return;
                }

                addMessage({
                    role: 'ai',
                    content: "Photo bien reçue. Voici une estimation indicative du coût de réparation :",
                    damageEstimateCard: {
                        fileName: data.fileName,
                        result: data.result,
                        method: data.method === 'roboflow' ? 'roboflow' : 'groq',
                    },
                });
            } catch (err) {
                console.error(err);
                setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'error', progress: 100 } : u)));
                addMessage({
                    role: 'ai',
                    content: "Photo bien reçue et enregistrée dans votre dossier. L'estimation automatique du coût de réparation a échoué — elle sera revue manuellement.",
                });
            }
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('docType', type);

            const res = await fetch('/api/extract-document', { method: 'POST', body: formData });
            const data = await res.json();

            setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: res.ok ? 'completed' : 'error', progress: 100 } : u)));

            if (!res.ok) {
                addMessage({
                    role: 'ai',
                    content:
                        data.code === 'MISSING_API_KEY'
                            ? "L'extraction de documents n'est pas encore configurée : ajoutez une clé Groq gratuite dans .env.local (GROQ_API_KEY)."
                            : data.error || "L'analyse du document a échoué.",
                });
                return;
            }

            addMessage({
                role: 'ai',
                content: "J'ai analysé votre document. Voici ce que j'en ai extrait :",
                documentCard: { fileName: data.fileName, extracted: data.extracted, warning: data.warning },
            });
        } catch (err) {
            console.error(err);
            setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'error', progress: 100 } : u)));
            addMessage({ role: 'ai', content: "L'analyse du document a échoué. Réessayez." });
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: UploadFile['type']) => {
        const file = e.target.files?.[0];
        if (file) {
            setShowUploadMenu(false);
            addMessage({ role: 'user', content: `📎 ${file.name} téléchargé` });
            runDocumentExtraction(file, type);
        }
        e.target.value = '';
    };

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <header className="bg-card border-b border-border flex-shrink-0">
                <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
                    <Link href="/" className="btn-ghost p-2 -ml-2">
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
                        <Shield size={18} className="text-primary" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-sm text-foreground">Assistant SANAD</p>
                        <p className="text-xs text-sanad-success flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-sanad-success inline-block" />
                            En ligne · Français / العربية
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn-ghost text-xs flex items-center gap-1.5"
                        title="Démarrer une nouvelle déclaration de sinistre"
                    >
                        <RotateCcw size={14} />
                        <span className="hidden sm:inline">Nouvelle déclaration</span>
                    </button>
                    <Link href="/historique" className="btn-ghost text-xs flex items-center gap-1.5" title="Mes sinistres">
                        <History size={14} />
                        <span className="hidden sm:inline">Historique</span>
                    </Link>
                    <button
                        onClick={async () => {
                            await fetch('/api/auth/logout', { method: 'POST' });
                            window.location.href = '/';
                        }}
                        className="btn-ghost text-xs flex items-center gap-1.5 text-muted-foreground"
                        title="Se déconnecter"
                    >
                        <LogOut size={14} />
                        <span className="hidden sm:inline">Déconnexion</span>
                    </button>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
                <div className="max-w-2xl mx-auto px-4 py-6 space-y-1">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-3 ${msg.claimReportCard ? 'w-full' : ''}`}
                        >
                            {msg.role === 'ai' && (
                                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                                    <Shield size={14} className="text-primary" />
                                </div>
                            )}
                            <div
                                className={`${msg.claimReportCard ? 'max-w-full flex-1' : 'max-w-[80%]'} ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}
                            >
                                {msg.content && (
                                    <div
                                        className={`px-4 py-3 rounded-2xl text-sm leading-relaxed message-bubble-enter ${msg.role === 'user' ? 'bg-primary text-white rounded-br-sm' : 'bg-card border border-border text-foreground rounded-bl-sm'
                                            } ${msg.isArabic ? 'rtl-text' : ''}`}
                                        dir={msg.isArabic ? 'rtl' : 'ltr'}
                                    >
                                        {msg.content}
                                    </div>
                                )}
                                {msg.documentCard && <DocumentResultCard data={msg.documentCard} />}
                                {msg.damageEstimateCard && <DamageEstimateCard data={msg.damageEstimateCard} />}
                                {msg.claimReportCard && <ClaimAnalysisReport data={msg.claimReportCard} />}
                                {msg.summaryCard && <FnolSummaryCard data={msg.summaryCard} />}
                                {msg.policeReportCard && <PoliceReportCard data={msg.policeReportCard} />}
                                {msg.offerConstat && (
                                    <button
                                        onClick={() => setShowConstatModal(true)}
                                        className="btn-primary text-xs py-2 px-3 mt-2 self-start"
                                    >
                                        Ouvrir le constat amiable
                                    </button>
                                )}
                                {msg.content && <span className="text-[10px] text-muted-foreground mt-1 px-1" suppressHydrationWarning>{msg.timestamp}</span>}
                            </div>
                        </div>
                    ))}

                    {isTyping && <TypingIndicator />}

                    {/* Upload progress */}
                    {uploads.filter((u) => u.status !== 'completed').map((u) => (
                        <div key={u.id} className="bg-card border border-border rounded-2xl p-4 mb-3 fade-in-up">
                            <div className="flex items-center gap-3 mb-2">
                                {u.status === 'error' ? (
                                    <AlertTriangle size={16} className="text-sanad-danger flex-shrink-0" />
                                ) : (
                                    <FileText size={16} className="text-primary flex-shrink-0" />
                                )}
                                <p className="text-sm font-medium text-foreground flex-1 truncate">{u.name}</p>
                                <span className="text-xs text-muted-foreground">
                                    {u.status === 'uploading' ? 'Téléchargement...' : u.status === 'error' ? 'Échec' : 'Analyse en cours...'}
                                </span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-300 ${u.status === 'error' ? 'bg-sanad-danger' : 'bg-primary'}`}
                                    style={{ width: `${u.progress}%` }}
                                />
                            </div>
                        </div>
                    ))}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input area */}
            <div className="bg-card border-t border-border flex-shrink-0">
                <div className="max-w-2xl mx-auto px-4 py-3">
                    {/* Upload menu */}
                    {showUploadMenu && (
                        <div className="bg-card border border-border rounded-2xl p-3 mb-3 shadow-elevated fade-in-up">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Télécharger un document</p>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: 'Photos du véhicule', icon: ImageIcon, type: 'photo' as const, accept: 'image/*' },
                                    { label: 'Facture', icon: FileText, type: 'invoice' as const, accept: 'image/*,.pdf' },
                                    { label: 'Rapport de police', icon: Shield, type: 'police' as const, accept: 'image/*,.pdf' },
                                    { label: 'Certificat médical', icon: FileText, type: 'medical' as const, accept: 'image/*,.pdf' },
                                ].map((item) => (
                                    <label key={item.type} className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-muted cursor-pointer transition-colors">
                                        <item.icon size={20} className="text-primary" />
                                        <span className="text-xs text-center text-muted-foreground leading-tight">{item.label}</span>
                                        <input type="file" accept={item.accept} className="hidden" onChange={(e) => handleFileUpload(e, item.type)} />
                                    </label>
                                ))}
                                <button
                                    onClick={() => {
                                        setShowUploadMenu(false);
                                        setShowConstatModal(true);
                                    }}
                                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-muted transition-colors"
                                >
                                    <FileText size={20} className="text-primary" />
                                    <span className="text-xs text-center text-muted-foreground leading-tight">Constat amiable</span>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex items-end gap-2">
                        <button
                            onClick={() => setShowUploadMenu(!showUploadMenu)}
                            className={`btn-ghost p-2.5 flex-shrink-0 ${showUploadMenu ? 'bg-accent text-primary' : ''}`}
                            aria-label="Joindre un fichier"
                        >
                            {showUploadMenu ? <X size={20} /> : <Paperclip size={20} />}
                        </button>
                        <div className="flex-1 relative">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Décrivez votre accident... / صف حادثك..."
                                rows={1}
                                className="input-base resize-none min-h-[44px] max-h-32 py-3 pr-12 leading-relaxed"
                                style={{ direction: isArabicText(input) ? 'rtl' : 'ltr' }}
                            />
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isTyping}
                            className="btn-primary p-2.5 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Envoyer"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center mt-2">
                        Entrée pour envoyer · Maj+Entrée pour nouvelle ligne
                    </p>
                </div>
            </div>

            <ConstatModal
                open={showConstatModal}
                onClose={() => setShowConstatModal(false)}
                onDownloadPdf={handleDownloadPdfSuccess}
                onFraudFlagged={(label) => {
                    addMessage({
                        role: 'ai',
                        content: `⚠️ Incohérence détectée sur la photo du véhicule ${label} par rapport à ce qui a été déclaré dans le constat. Ce dossier est marqué comme cas suspect — merci de joindre le rapport de police (procès-verbal) via le trombone ci-dessous pour que votre dossier puisse être traité.`,
                    });
                }}
            />
        </div>
    );
}
