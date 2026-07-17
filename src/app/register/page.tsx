'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Shield, ArrowRight, ArrowLeft, Upload, CheckCircle, User, CreditCard,
    Phone, Mail, MapPin, Calendar, AlertCircle, Loader2, Lock
} from 'lucide-react';
import { mockOCR } from '@/lib/mockServices';

type Step = 1 | 2 | 3;

interface FormData {
    fullName: string;
    cin: string;
    birthDate: string;
    phone: string;
    email: string;
    address: string;
    password?: string;
    confirmPassword?: string;
}

const STEPS = [
    { num: 1, label: 'Scan ID', labelAr: 'مسح الهوية' },
    { num: 2, label: 'Review Information', labelAr: 'مراجعة المعلومات' },
    { num: 3, label: 'Create Account', labelAr: 'إنشاء الحساب' },
];

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);
    const [form, setForm] = useState<FormData>({
        fullName: '',
        cin: '',
        birthDate: '',
        phone: '',
        email: '',
        address: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<Partial<FormData>>({});

    // OCR / File Upload States
    const [idFile, setIdFile] = useState<File | null>(null);
    const [isDragActive, setIsDragActive] = useState(false);
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrLoadingStep, setOcrLoadingStep] = useState<1 | 2>(1);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragActive(true);
        } else if (e.type === 'dragleave') {
            setIsDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processUploadedId(e.dataTransfer.files[0]);
        }
    };

    const handleFileBrowse = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processUploadedId(e.target.files[0]);
        }
    };

    const processUploadedId = async (file: File) => {
        setIdFile(file);
        setOcrLoading(true);
        setOcrLoadingStep(1);

        // Transition loading step texts
        const timer1 = setTimeout(() => {
            setOcrLoadingStep(2);
        }, 1200);

        try {
            // Wait total 2.5s to simulate scan & extract
            await new Promise((resolve) => setTimeout(resolve, 2500));
            const ocrResult = await mockOCR();
            
            setForm((prev) => ({
                ...prev,
                fullName: ocrResult.name,
                cin: ocrResult.cin,
                birthDate: ocrResult.birthDate,
                address: '123 Rue Mohammed V, Casablanca', // Simulated extracted address
            }));
            
            setOcrLoading(false);
            setStep(2);
        } catch (err) {
            setOcrLoading(false);
            alert("Erreur lors de la lecture de la carte d'identité. Veuillez réessayer.");
        }
    };

    const handleScanAgain = () => {
        setIdFile(null);
        setForm({
            fullName: '',
            cin: '',
            birthDate: '',
            phone: '',
            email: '',
            address: '',
            password: '',
            confirmPassword: '',
        });
        setErrors({});
        setStep(1);
    };

    const validateStep2 = () => {
        const e: Partial<FormData> = {};
        if (!form.fullName.trim()) e.fullName = 'Nom complet requis';
        if (!form.cin.trim()) e.cin = 'CIN requis';
        if (!form.birthDate) e.birthDate = 'Date de naissance requise';
        if (!form.address.trim()) e.address = 'Adresse requise';
        
        if (!form.email.trim()) {
            e.email = 'Email requis';
        } else if (!/\S+@\S+\.\S+/.test(form.email)) {
            e.email = 'Email invalide';
        }
        
        if (!form.phone.trim()) {
            e.phone = 'Téléphone requis';
        }
        
        if (!form.password) {
            e.password = 'Mot de passe requis';
        } else if (form.password.length < 6) {
            e.password = 'Le mot de passe doit faire au moins 6 caractères';
        }
        
        if (form.password !== form.confirmPassword) {
            e.confirmPassword = 'Les mots de passe ne correspondent pas';
        }
        
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleStep2Submit = () => {
        if (validateStep2()) {
            setStep(3);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <nav className="border-b border-border bg-card sticky top-0 z-40">
                <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
                        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                            <Shield size={14} className="text-white" />
                        </div>
                        <span className="font-display font-bold text-lg text-primary">SANAD</span>
                    </Link>
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                        Inscription sécurisée
                    </span>
                </div>
            </nav>

            <div className="max-w-2xl mx-auto px-6 py-10">
                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-10">
                    {STEPS.map((s, i) => (
                        <React.Fragment key={s.num}>
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                                        step > s.num
                                            ? 'bg-sanad-success text-white'
                                            : step === s.num
                                            ? 'bg-primary text-white shadow-chat'
                                            : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    {step > s.num ? <CheckCircle size={18} /> : s.num}
                                </div>
                                <span className={`text-xs mt-1.5 font-medium ${step === s.num ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {s.label}
                                </span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-3 mb-5 transition-all duration-300 ${step > s.num ? 'bg-sanad-success' : 'bg-border'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Step 1: Scan ID */}
                {step === 1 && !ocrLoading && (
                    <div className="card-base p-8 fade-in-up">
                        <h2 className="font-display font-bold text-2xl text-foreground mb-2">Vérification de votre identité</h2>
                        <p className="text-muted-foreground text-sm mb-8">Veuillez scanner ou télécharger votre carte d&apos;identité nationale pour lancer la vérification d&apos;identité assistée par IA.</p>

                        <div
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            className={`w-full min-h-[260px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all duration-250 p-6 text-center group cursor-pointer ${
                                isDragActive
                                    ? 'border-primary bg-primary/5 scale-[1.01]'
                                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                            }`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-250 shadow-sm">
                                <Upload size={28} />
                            </div>
                            <div>
                                <p className="text-base font-semibold text-foreground">
                                    Glissez-déposez votre carte d&apos;identité ici
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    ou sélectionnez un fichier sur votre appareil
                                </p>
                                <p className="text-xs text-muted-foreground mt-3">
                                    Formats acceptés : JPG, PNG ou PDF (Max. 10 Mo)
                                </p>
                            </div>
                            <button
                                type="button"
                                className="btn-primary gap-2 mt-2 px-5 py-2.5"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRef.current?.click();
                                }}
                            >
                                <Upload size={16} />
                                Scanner / Importer la carte d&apos;identité
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={handleFileBrowse}
                            />
                        </div>
                    </div>
                )}

                {/* Step 1 OCR Loading Screen */}
                {step === 1 && ocrLoading && (
                    <div className="card-base p-8 text-center flex flex-col items-center justify-center py-16 fade-in-up">
                        <div className="relative mb-8">
                            <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Shield size={24} className="text-primary animate-pulse" />
                            </div>
                        </div>
                        
                        <h3 className="font-display font-bold text-xl text-foreground mb-6">
                            Traitement de votre identité
                        </h3>
                        
                        <div className="space-y-4 w-full max-w-xs mx-auto">
                            <div className="flex items-center gap-3 text-sm text-foreground font-medium justify-center">
                                <Loader2 size={16} className="animate-spin text-primary" />
                                <span>Scanning your identity card...</span>
                            </div>
                            
                            {ocrLoadingStep >= 2 && (
                                <div className="flex items-center gap-3 text-sm text-foreground font-medium justify-center fade-in-up">
                                    <Loader2 size={16} className="animate-spin text-primary" />
                                    <span>Extracting personal information...</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Review Information */}
                {step === 2 && (
                    <div className="card-base p-8 fade-in-up">
                        <h2 className="font-display font-bold text-2xl text-foreground mb-2">Vérifier vos informations</h2>
                        <p className="text-muted-foreground text-sm mb-6">Veuillez vérifier les informations extraites de votre carte d&apos;identité nationale.</p>

                        {/* Success Verification Banner */}
                        <div className="bg-sanad-success/10 border border-sanad-success/20 rounded-2xl p-4 mb-6 flex items-start gap-3 fade-in-up">
                            <CheckCircle size={20} className="text-sanad-success flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-foreground">
                                    Vérification réussie
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                    Your identity has been successfully verified. Please review your information before continuing.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Group 1: Extracted and Editable */}
                            <div>
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">
                                    Informations extraites de la carte d&apos;identité (Modifiables)
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-foreground mb-1.5">
                                            Nom complet
                                        </label>
                                        <input
                                            type="text"
                                            className={`input-base ${errors.fullName ? 'border-sanad-danger ring-1 ring-sanad-danger' : ''}`}
                                            value={form.fullName}
                                            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                                        />
                                        {errors.fullName && <p className="text-xs text-sanad-danger mt-1">{errors.fullName}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-foreground mb-1.5">
                                            CIN (Carte Nationale)
                                        </label>
                                        <input
                                            type="text"
                                            className={`input-base ${errors.cin ? 'border-sanad-danger ring-1 ring-sanad-danger' : ''}`}
                                            value={form.cin}
                                            onChange={(e) => setForm({ ...form, cin: e.target.value })}
                                        />
                                        {errors.cin && <p className="text-xs text-sanad-danger mt-1">{errors.cin}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-foreground mb-1.5">
                                            Date de naissance
                                        </label>
                                        <input
                                            type="date"
                                            className={`input-base ${errors.birthDate ? 'border-sanad-danger ring-1 ring-sanad-danger' : ''}`}
                                            value={form.birthDate}
                                            onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                                        />
                                        {errors.birthDate && <p className="text-xs text-sanad-danger mt-1">{errors.birthDate}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-foreground mb-1.5">
                                            Adresse
                                        </label>
                                        <input
                                            type="text"
                                            className={`input-base ${errors.address ? 'border-sanad-danger ring-1 ring-sanad-danger' : ''}`}
                                            value={form.address}
                                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                                        />
                                        {errors.address && <p className="text-xs text-sanad-danger mt-1">{errors.address}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Group 2: Manual Credentials */}
                            <div className="pt-4 border-t border-border">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">
                                    Informations d&apos;accès requises (Manuel)
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                                            <Mail size={12} className="text-muted-foreground" />
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="nom@example.com"
                                            className={`input-base ${errors.email ? 'border-sanad-danger ring-1 ring-sanad-danger' : ''}`}
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        />
                                        {errors.email && <p className="text-xs text-sanad-danger mt-1">{errors.email}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                                            <Phone size={12} className="text-muted-foreground" />
                                            Téléphone
                                        </label>
                                        <input
                                            type="tel"
                                            placeholder="+212 6 XX XX XX XX"
                                            className={`input-base ${errors.phone ? 'border-sanad-danger ring-1 ring-sanad-danger' : ''}`}
                                            value={form.phone}
                                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        />
                                        {errors.phone && <p className="text-xs text-sanad-danger mt-1">{errors.phone}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                                            <Lock size={12} className="text-muted-foreground" />
                                            Mot de passe
                                        </label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className={`input-base ${errors.password ? 'border-sanad-danger ring-1 ring-sanad-danger' : ''}`}
                                            value={form.password}
                                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        />
                                        {errors.password && <p className="text-xs text-sanad-danger mt-1">{errors.password}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                                            <Lock size={12} className="text-muted-foreground" />
                                            Confirmer le mot de passe
                                        </label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className={`input-base ${errors.confirmPassword ? 'border-sanad-danger ring-1 ring-sanad-danger' : ''}`}
                                            value={form.confirmPassword}
                                            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                        />
                                        {errors.confirmPassword && <p className="text-xs text-sanad-danger mt-1">{errors.confirmPassword}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation / Action buttons */}
                        <div className="flex justify-between items-center mt-8 gap-4">
                            <button
                                type="button"
                                onClick={handleScanAgain}
                                className="btn-secondary gap-2 px-5 py-2.5"
                            >
                                <ArrowLeft size={16} />
                                Scan Again / Réimporter
                            </button>
                            <button
                                type="button"
                                onClick={handleStep2Submit}
                                className="btn-primary gap-2 px-6 py-2.5 ml-auto"
                            >
                                Créer mon compte
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Create Account Confirmation */}
                {step === 3 && (
                    <div className="card-base p-8 text-center fade-in-up">
                        <div className="w-16 h-16 rounded-full bg-sanad-success/15 text-sanad-success flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <CheckCircle size={36} />
                        </div>
                        
                        <h2 className="font-display font-bold text-2xl text-foreground mb-2">Compte créé avec succès !</h2>
                        <p className="text-muted-foreground text-sm mb-6">Bienvenue chez SANAD. Votre profil a été configuré avec vos informations vérifiées.</p>

                        <div className="bg-muted rounded-2xl p-5 mb-8 text-left max-w-md mx-auto space-y-3">
                            <div className="flex justify-between text-sm py-1 border-b border-border">
                                <span className="text-muted-foreground">Assuré</span>
                                <span className="font-semibold text-foreground">{form.fullName}</span>
                            </div>
                            <div className="flex justify-between text-sm py-1 border-b border-border">
                                <span className="text-muted-foreground">Numéro CIN</span>
                                <span className="font-semibold text-foreground font-mono">{form.cin}</span>
                            </div>
                            <div className="flex justify-between text-sm py-1 border-b border-border">
                                <span className="text-muted-foreground">Email</span>
                                <span className="font-semibold text-foreground">{form.email}</span>
                            </div>
                            <div className="flex justify-between text-sm py-1">
                                <span className="text-muted-foreground">Téléphone</span>
                                <span className="font-semibold text-foreground">{form.phone}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => router.push('/chat')}
                            className="btn-primary gap-2 w-full justify-center py-3"
                        >
                            Continuer vers le chat d&apos;assistance
                            <ArrowRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
