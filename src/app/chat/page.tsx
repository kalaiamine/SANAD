'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Send, Paperclip, X, Loader2, FileText, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { mockChat, mockSettlement, mockFraud, type SettlementResult, type FraudResult } from '@/lib/mockServices';

interface Message {
    id: string;
    role: 'user' | 'ai';
    content: string;
    isArabic?: boolean;
    timestamp: string;
    resultCard?: AIResultData;
}

interface AIResultData {
    settlement: SettlementResult;
    fraud: FraudResult;
}

interface UploadFile {
    id: string;
    name: string;
    type: 'photo' | 'invoice' | 'police';
    status: 'uploading' | 'processing' | 'completed';
    progress: number;
}

const WELCOME_MESSAGES: Message[] = [
    {
        id: 'welcome-1',
        role: 'ai',
        content: 'Bonjour! Je suis votre assistant SANAD. Je suis là pour vous aider à déclarer votre sinistre automobile calmement et rapidement.\n\nPouvez-vous me décrire ce qui s\'est passé?',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    },
];

function isArabicText(text: string): boolean {
    return /[\u0600-\u06FF]/.test(text);
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

function AIResultCard({ data }: { data: AIResultData }) {
    const { settlement, fraud } = data;
    const severityColors: Record<string, string> = {
        Low: 'bg-sanad-success/10 text-sanad-success border-sanad-success/20',
        Medium: 'bg-[#F4B740]/10 text-[#B5850A] border-[#F4B740]/30',
        High: 'bg-sanad-danger/10 text-sanad-danger border-sanad-danger/20',
    };

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card card-reveal mt-2 mb-4">
            {/* Header */}
            <div className="bg-accent px-5 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                    <p className="font-display font-bold text-base text-foreground">Analyse IA du sinistre</p>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border badge-pop ${severityColors[settlement.severity] || severityColors.Medium}`}>
                        Sévérité {settlement.severity === 'Low' ? 'Faible' : settlement.severity === 'Medium' ? 'Modérée' : 'Élevée'}
                    </span>
                </div>
            </div>

            <div className="p-5 space-y-4">
                {/* Summary */}
                <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Résumé</p>
                    <p className="text-sm text-foreground leading-relaxed">{settlement.summary}</p>
                </div>

                {/* Damage */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">Dommage détecté</p>
                        <p className="text-sm font-semibold text-foreground">{settlement.detectedDamage}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Confiance: {settlement.damageConfidence}%</p>
                    </div>
                    <div className="bg-muted rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">Score de fraude</p>
                        <p className="text-sm font-semibold text-sanad-success">{fraud.score}/100</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Risque: {fraud.risk}</p>
                    </div>
                </div>

                {/* Invoice */}
                <div className="bg-muted rounded-xl p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Données de facture extraites</p>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Garage</span>
                            <span className="font-medium text-foreground">{settlement.garageName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Montant</span>
                            <span className="font-semibold text-foreground">{settlement.invoiceAmount} TND</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Date</span>
                            <span className="font-medium text-foreground">{settlement.invoiceDate}</span>
                        </div>
                    </div>
                </div>

                {/* Settlement */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-primary uppercase tracking-wide">Règlement recommandé</p>
                        <span className="text-xs bg-sanad-success/10 text-sanad-success px-2 py-0.5 rounded-full font-medium">
                            {settlement.recommendation === 'Approve' ? 'Approuver' : 'Révision manuelle'}
                        </span>
                    </div>
                    <p className="text-3xl font-display font-bold text-primary">{settlement.amount} TND</p>
                    <p className="text-xs text-muted-foreground mt-1">Estimation basée sur l&apos;analyse IA</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                    <Link href="/dashboard" className="flex-1 btn-primary justify-center text-sm py-2.5">
                        Soumettre la déclaration
                    </Link>
                    <button
                        onClick={() => window.location.reload()}
                        className="flex-1 btn-secondary justify-center text-sm py-2.5"
                    >
                        Nouvelle déclaration
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>(WELCOME_MESSAGES);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzingMessage, setAnalyzingMessage] = useState('');
    const [uploads, setUploads] = useState<UploadFile[]>([]);
    const [showUploadMenu, setShowUploadMenu] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const addMessage = (msg: Omit<Message, 'id' | 'timestamp'>) => {
        const newMsg: Message = {
            ...msg,
            id: `msg-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
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
        setIsTyping(true);
        try {
            const response = await mockChat(text);
            setIsTyping(false);
            addMessage({ role: 'ai', content: response.reply, isArabic: response.isArabic });
        } catch {
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

    const simulateUpload = async (file: File, type: UploadFile['type']) => {
        const id = `upload-${Date.now()}`;
        const uploadFile: UploadFile = { id, name: file.name, type, status: 'uploading', progress: 0 };
        setUploads((prev) => [...prev, uploadFile]);

        // Simulate upload progress
        for (let p = 0; p <= 100; p += 20) {
            await new Promise((r) => setTimeout(r, 150));
            setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, progress: p } : u)));
        }
        setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'processing', progress: 100 } : u)));

        // Simulate AI analysis
        const analyzeMessages = [
            'Analyse de vos documents...',
            'Estimation des dommages...',
            'Préparation de la recommandation...',
        ];
        for (const msg of analyzeMessages) {
            setAnalyzingMessage(msg);
            setIsAnalyzing(true);
            await new Promise((r) => setTimeout(r, 1200));
        }
        setIsAnalyzing(false);
        setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'completed' } : u)));

        // Get AI results
        const [settlement, fraud] = await Promise.all([mockSettlement(), mockFraud()]);
        addMessage({
            role: 'ai',
            content: 'J\'ai analysé vos documents. Voici le résumé de votre déclaration:',
            resultCard: { settlement, fraud },
        });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: UploadFile['type']) => {
        const file = e.target.files?.[0];
        if (file) {
            setShowUploadMenu(false);
            addMessage({ role: 'user', content: `📎 ${file.name} téléchargé` });
            simulateUpload(file, type);
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
                    <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full hidden sm:block">Démo</span>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
                <div className="max-w-2xl mx-auto px-4 py-6 space-y-1">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
                            {msg.role === 'ai' && (
                                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                                    <Shield size={14} className="text-primary" />
                                </div>
                            )}
                            <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                                <div
                                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed message-bubble-enter ${msg.role === 'user' ? 'bg-primary text-white rounded-br-sm' : 'bg-card border border-border text-foreground rounded-bl-sm'
                                        } ${msg.isArabic ? 'rtl-text' : ''}`}
                                    dir={msg.isArabic ? 'rtl' : 'ltr'}
                                >
                                    {msg.content}
                                </div>
                                {msg.resultCard && <AIResultCard data={msg.resultCard} />}
                                <span className="text-[10px] text-muted-foreground mt-1 px-1">{msg.timestamp}</span>
                            </div>
                        </div>
                    ))}

                    {isTyping && <TypingIndicator />}

                    {isAnalyzing && (
                        <div className="flex items-center gap-3 bg-accent border border-border rounded-2xl px-4 py-3 mb-3 fade-in-up">
                            <Loader2 size={16} className="text-primary animate-spin flex-shrink-0" />
                            <p className="text-sm text-foreground">{analyzingMessage}</p>
                        </div>
                    )}

                    {/* Upload progress */}
                    {uploads.filter((u) => u.status !== 'completed').map((u) => (
                        <div key={u.id} className="bg-card border border-border rounded-2xl p-4 mb-3 fade-in-up">
                            <div className="flex items-center gap-3 mb-2">
                                <FileText size={16} className="text-primary flex-shrink-0" />
                                <p className="text-sm font-medium text-foreground flex-1 truncate">{u.name}</p>
                                <span className="text-xs text-muted-foreground">
                                    {u.status === 'uploading' ? 'Téléchargement...' : 'Traitement...'}
                                </span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-300"
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
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { label: 'Photos du véhicule', icon: ImageIcon, type: 'photo' as const, accept: 'image/*' },
                                    { label: 'Facture', icon: FileText, type: 'invoice' as const, accept: 'image/*,.pdf' },
                                    { label: 'Rapport de police', icon: Shield, type: 'police' as const, accept: 'image/*,.pdf' },
                                ].map((item) => (
                                    <label key={item.type} className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-muted cursor-pointer transition-colors">
                                        <item.icon size={20} className="text-primary" />
                                        <span className="text-xs text-center text-muted-foreground leading-tight">{item.label}</span>
                                        <input type="file" accept={item.accept} className="hidden" onChange={(e) => handleFileUpload(e, item.type)} />
                                    </label>
                                ))}
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
                            disabled={!input.trim()}
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
        </div>
    );
}
