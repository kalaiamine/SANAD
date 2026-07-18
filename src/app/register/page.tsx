'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Shield, ArrowRight, ArrowLeft, Upload, CheckCircle, User, CreditCard,
    Phone, Mail, MapPin, Calendar, AlertCircle, Loader2, Lock, XCircle
} from 'lucide-react';
import { uploadDocument, compareSelfieToID, sendKYCConfirmationEmail, type IdentityCardData } from '@/services/ocrService';
import { Camera, Image as ImageIcon } from 'lucide-react';

type Step = 1 | 2 | 3 | 4;

const STEPS = [
    { num: 1, label: 'Scan ID', labelAr: 'مسح الهوية' },
    { num: 2, label: 'Selfie Match', labelAr: 'صورة شخصية' },
    { num: 3, label: 'Review & Create', labelAr: 'مراجعة وحساب' },
];

interface FormData {
    fullNameArabic: string;
    fullNameLatin: string;
    cin: string;
    birthDate: string;
    expiryDate: string;
    birthPlace: string;
    fatherName: string;
    phone: string;
    email: string;
    address: string;
    password?: string;
    confirmPassword?: string;
}

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);
    const [form, setForm] = useState<FormData>({
        fullNameArabic: '',
        fullNameLatin: '',
        cin: '',
        birthDate: '',
        expiryDate: '',
        birthPlace: '',
        fatherName: '',
        phone: '',
        email: '',
        address: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<Partial<FormData>>({});

    // OCR / File Upload States
    const [frontIdFile, setFrontIdFile] = useState<File | null>(null);
    const [backIdFile, setBackIdFile] = useState<File | null>(null);
    const [isDragActive, setIsDragActive] = useState(false);
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrLoadingStep, setOcrLoadingStep] = useState<1 | 2 | 3>(1);
    const [ocrError, setOcrError] = useState<string | null>(null);
    const [ocrConfidence, setOcrConfidence] = useState<number>(0);
    const [uploadSide, setUploadSide] = useState<'front' | 'back'>('front');
    const frontFileInputRef = useRef<HTMLInputElement>(null);
    const backFileInputRef = useRef<HTMLInputElement>(null);

    // Selfie States
    const [selfieFile, setSelfieFile] = useState<File | null>(null);
    const [selfieLoading, setSelfieLoading] = useState(false);
    const [selfieError, setSelfieError] = useState<string | null>(null);
    const [faceMatchResult, setFaceMatchResult] = useState<{
        matched: boolean;
        confidence: number;
        liveness: number;
        error: string | null;
    } | null>(null);
    const selfieFileInputRef = useRef<HTMLInputElement>(null);
    const [emailLoading, setEmailLoading] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragActive(true);
        } else if (e.type === 'dragleave') {
            setIsDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent, side: 'front' | 'back') => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            if (side === 'front') {
                setFrontIdFile(e.dataTransfer.files[0]);
                if (!backIdFile) {
                    setUploadSide('back');
                }
            } else {
                setBackIdFile(e.dataTransfer.files[0]);
            }
        }
    };

    const handleFileBrowse = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
        if (e.target.files && e.target.files[0]) {
            if (side === 'front') {
                setFrontIdFile(e.target.files[0]);
                if (!backIdFile) {
                    setUploadSide('back');
                }
            } else {
                setBackIdFile(e.target.files[0]);
            }
        }
    };

    const processOCR = async () => {
        if (!frontIdFile) return;
        setOcrLoading(true);
        setOcrLoadingStep(1);
        setOcrError(null);

        // Transition loading step texts progressively
        const timer1 = setTimeout(() => setOcrLoadingStep(2), 1500);
        const timer2 = setTimeout(() => setOcrLoadingStep(3), 4000);

        try {
            // Call real OCR service with the front ID image
            const frontResult = await uploadDocument(frontIdFile);

            // Also process back ID if available, for supplementary data
            let backResult = null;
            if (backIdFile) {
                try {
                    backResult = await uploadDocument(backIdFile);
                } catch {
                    // Back ID OCR failure is non-critical, we continue with front data
                }
            }

            // Extract identity data from front result
            const extracted = frontResult.extractedData as IdentityCardData;

            // Merge back result if it contains additional fields
            let mergedData = { ...extracted };
            if (backResult && backResult.documentType === 'identity_card') {
                const backData = backResult.extractedData as IdentityCardData;
                // Fill in any missing fields from back scan
                if (!mergedData.fullNameArabic && backData.fullNameArabic) mergedData.fullNameArabic = backData.fullNameArabic;
                if (!mergedData.fullNameLatin && backData.fullNameLatin) mergedData.fullNameLatin = backData.fullNameLatin;
                if (!mergedData.cin && backData.cin) mergedData.cin = backData.cin;
                if (!mergedData.birthDate && backData.birthDate) mergedData.birthDate = backData.birthDate;
                if (!mergedData.expiryDate && backData.expiryDate) mergedData.expiryDate = backData.expiryDate;
                if (!mergedData.birthPlace && backData.birthPlace) mergedData.birthPlace = backData.birthPlace;
                if (!mergedData.fatherName && backData.fatherName) mergedData.fatherName = backData.fatherName;
            }

            setOcrConfidence(Math.round(frontResult.confidence));

            setForm((prev) => ({
                ...prev,
                fullNameArabic: mergedData.fullNameArabic || '',
                fullNameLatin: mergedData.fullNameLatin || '',
                cin: mergedData.cin || '',
                birthDate: mergedData.birthDate || '',
                expiryDate: mergedData.expiryDate || '',
                birthPlace: mergedData.birthPlace || '',
                fatherName: mergedData.fatherName || '',
            }));

            clearTimeout(timer1);
            clearTimeout(timer2);
            setOcrLoading(false);
            setStep(2);
        } catch (err: unknown) {
            clearTimeout(timer1);
            clearTimeout(timer2);
            setOcrLoading(false);
            const errorMessage = err instanceof Error ? err.message : "Erreur lors de la lecture de la carte d'identité.";
            setOcrError(errorMessage);
        }
    };

    const handleScanAgain = () => {
        setFrontIdFile(null);
        setBackIdFile(null);
        setUploadSide('front');
        setOcrError(null);
        setSelfieFile(null);
        setFaceMatchResult(null);
        setSelfieError(null);
        setForm({
            fullNameArabic: '',
            fullNameLatin: '',
            cin: '',
            birthDate: '',
            expiryDate: '',
            birthPlace: '',
            fatherName: '',
            phone: '',
            email: '',
            address: '',
            password: '',
            confirmPassword: '',
        });
        setErrors({});
        setStep(1);
    };

    const handleFaceMatch = async () => {
        if (!selfieFile || !frontIdFile) return;
        setSelfieLoading(true);
        setSelfieError(null);
        setFaceMatchResult(null);

        try {
            const res = await compareSelfieToID(selfieFile, frontIdFile);
            setFaceMatchResult(res);
            if (res.error) {
                setSelfieError(res.error);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Face matching failed";
            setSelfieError(msg);
        } finally {
            setSelfieLoading(false);
        }
    };

    const validateStep3 = () => {
        const e: Partial<FormData> = {};
        if (!form.fullNameLatin.trim() && !form.fullNameArabic.trim()) e.fullNameLatin = 'Nom complet requis';
        if (!form.cin.trim()) e.cin = 'CIN requis';
        if (!form.birthDate) e.birthDate = 'Date de naissance requise';
        
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

    const handleStep3Submit = async () => {
        if (validateStep3()) {
            setEmailLoading(true);
            try {
                // Trigger backend SMTP email dispatch
                await sendKYCConfirmationEmail(form.email, {
                    fullNameArabic: form.fullNameArabic,
                    fullNameLatin: form.fullNameLatin,
                    cin: form.cin,
                    birthDate: form.birthDate,
                    birthPlace: form.birthPlace,
                    fatherName: form.fatherName,
                    phone: form.phone,
                    address: form.address,
                });
            } catch (err) {
                console.error("Failed to send confirmation email", err);
            } finally {
                setEmailLoading(false);
                setStep(4);
            }
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

                {/* Step 1: Upload ID Card(s) */}
                {step === 1 && !ocrLoading && (
                    <div className="card-base p-8 fade-in-up">
                        <h2 className="font-display font-bold text-2xl text-foreground mb-2">Vérification de votre identité</h2>
                        <p className="text-muted-foreground text-sm mb-8">Veuillez scanner ou télécharger votre carte d&apos;identité nationale pour lancer la vérification d&apos;identité assistée par IA.</p>

                        {/* OCR Error Banner */}
                        {ocrError && (
                            <div className="bg-sanad-danger/10 border border-sanad-danger/20 rounded-2xl p-4 mb-6 flex items-start gap-3 fade-in-up">
                                <XCircle size={20} className="text-sanad-danger flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Erreur OCR</p>
                                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{ocrError}</p>
                                </div>
                                <button onClick={() => setOcrError(null)} className="ml-auto text-muted-foreground hover:text-foreground">
                                    <XCircle size={16} />
                                </button>
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Front ID Upload */}
                            <div>
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">
                                    Recto de la carte d&apos;identité (Obligatoire)
                                </p>
                                <div
                                    onDragEnter={handleDrag}
                                    onDragOver={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDrop={(e) => handleDrop(e, 'front')}
                                    className={`w-full min-h-[180px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all duration-250 p-6 text-center group cursor-pointer ${
                                        frontIdFile
                                            ? 'border-sanad-success bg-sanad-success/5'
                                            : isDragActive && uploadSide === 'front'
                                            ? 'border-primary bg-primary/5 scale-[1.01]'
                                            : 'border-border hover:border-primary/50 hover:bg-muted/30'
                                    }`}
                                    onClick={() => frontFileInputRef.current?.click()}
                                >
                                    {frontIdFile ? (
                                        <>
                                            <CheckCircle size={28} className="text-sanad-success" />
                                            <p className="text-sm font-medium text-foreground">{frontIdFile.name}</p>
                                            <p className="text-xs text-sanad-success">Fichier sélectionné ✓</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-250 shadow-sm">
                                                <Upload size={22} />
                                            </div>
                                            <p className="text-sm font-semibold text-foreground">Recto — Glissez ou cliquez pour importer</p>
                                            <p className="text-xs text-muted-foreground">JPG, PNG ou PDF (Max. 10 Mo)</p>
                                        </>
                                    )}
                                    <input
                                        ref={frontFileInputRef}
                                        type="file"
                                        accept="image/*,.pdf"
                                        className="hidden"
                                        onChange={(e) => handleFileBrowse(e, 'front')}
                                    />
                                </div>
                            </div>

                            {/* Back ID Upload */}
                            <div>
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">
                                    Verso de la carte d&apos;identité (Optionnel)
                                </p>
                                <div
                                    onDragEnter={handleDrag}
                                    onDragOver={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDrop={(e) => handleDrop(e, 'back')}
                                    className={`w-full min-h-[140px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all duration-250 p-6 text-center group cursor-pointer ${
                                        backIdFile
                                            ? 'border-sanad-success bg-sanad-success/5'
                                            : isDragActive && uploadSide === 'back'
                                            ? 'border-primary bg-primary/5 scale-[1.01]'
                                            : 'border-border hover:border-primary/50 hover:bg-muted/30'
                                    }`}
                                    onClick={() => backFileInputRef.current?.click()}
                                >
                                    {backIdFile ? (
                                        <>
                                            <CheckCircle size={24} className="text-sanad-success" />
                                            <p className="text-sm font-medium text-foreground">{backIdFile.name}</p>
                                            <p className="text-xs text-sanad-success">Fichier sélectionné ✓</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-250 shadow-sm">
                                                <Upload size={18} />
                                            </div>
                                            <p className="text-sm font-semibold text-foreground">Verso — Glissez ou cliquez pour importer</p>
                                            <p className="text-xs text-muted-foreground">JPG, PNG ou PDF (Max. 10 Mo)</p>
                                        </>
                                    )}
                                    <input
                                        ref={backFileInputRef}
                                        type="file"
                                        accept="image/*,.pdf"
                                        className="hidden"
                                        onChange={(e) => handleFileBrowse(e, 'back')}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Launch OCR Button */}
                        <button
                            type="button"
                            disabled={!frontIdFile}
                            onClick={processOCR}
                            className="btn-primary gap-2 mt-6 px-5 py-2.5 w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CreditCard size={16} />
                            Lancer la vérification OCR
                        </button>
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
                            Lecture de votre carte d&apos;identité...
                        </h3>
                        
                        <div className="space-y-4 w-full max-w-xs mx-auto">
                            <div className="flex items-center gap-3 text-sm text-foreground font-medium justify-center">
                                <Loader2 size={16} className="animate-spin text-primary" />
                                <span>Scanning your identity card...</span>
                            </div>
                            
                            {ocrLoadingStep >= 2 && (
                                <div className="flex items-center gap-3 text-sm text-foreground font-medium justify-center fade-in-up">
                                    <Loader2 size={16} className="animate-spin text-primary" />
                                    <span>Reading your identity document...</span>
                                </div>
                            )}

                            {ocrLoadingStep >= 3 && (
                                <div className="flex items-center gap-3 text-sm text-foreground font-medium justify-center fade-in-up">
                                    <Loader2 size={16} className="animate-spin text-primary" />
                                    <span>Extracting personal information...</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Selfie & Biometric Match */}
                {step === 2 && (
                    <div className="card-base p-8 fade-in-up">
                        <h2 className="font-display font-bold text-2xl text-foreground mb-2">Vérification Biométrique</h2>
                        <p className="text-muted-foreground text-sm mb-8">Veuillez importer ou prendre un selfie pour comparer votre visage avec la photo de votre carte d&apos;identité nationale.</p>

                        {selfieError && (
                            <div className="bg-sanad-danger/10 border border-sanad-danger/20 rounded-2xl p-4 mb-6 flex items-start gap-3 fade-in-up">
                                <XCircle size={20} className="text-sanad-danger flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Erreur Biométrique</p>
                                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{selfieError}</p>
                                </div>
                                <button onClick={() => setSelfieError(null)} className="ml-auto text-muted-foreground hover:text-foreground">
                                    <XCircle size={16} />
                                </button>
                            </div>
                        )}

                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-3xl bg-muted/10 hover:bg-muted/20 transition-all duration-200 mb-8">
                            {selfieFile ? (
                                <div className="text-center space-y-4">
                                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 mx-auto shadow-md">
                                        <img
                                            src={URL.createObjectURL(selfieFile)}
                                            alt="Selfie"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{selfieFile.name}</p>
                                        <button
                                            type="button"
                                            onClick={() => { setSelfieFile(null); setFaceMatchResult(null); }}
                                            className="text-xs text-sanad-danger font-medium hover:underline mt-1"
                                        >
                                            Changer de photo
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="text-center cursor-pointer py-6 w-full"
                                    onClick={() => selfieFileInputRef.current?.click()}
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-accent text-primary flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <Camera size={22} />
                                    </div>
                                    <p className="text-sm font-semibold text-foreground">Prendre ou importer un Selfie</p>
                                    <p className="text-xs text-muted-foreground mt-1">Format portrait requis (JPG, PNG)</p>
                                    <input
                                        ref={selfieFileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                setSelfieFile(e.target.files[0]);
                                                setSelfieError(null);
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Selfie Loading State */}
                        {selfieLoading && (
                            <div className="bg-muted/30 rounded-2xl p-5 mb-8 text-center space-y-3">
                                <Loader2 className="animate-spin text-primary mx-auto" size={24} />
                                <p className="text-sm font-medium text-foreground">Analyse et comparaison faciale en cours...</p>
                                <p className="text-xs text-muted-foreground">Extraction des caractéristiques géométriques du visage...</p>
                            </div>
                        )}

                        {/* Comparison Results */}
                        {faceMatchResult && !selfieLoading && (
                            <div className={`rounded-2xl p-6 mb-8 border ${
                                faceMatchResult.matched
                                    ? 'bg-sanad-success/10 border-sanad-success/20'
                                    : 'bg-sanad-danger/10 border-sanad-danger/20'
                            } fade-in-up`}>
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        faceMatchResult.matched ? 'bg-sanad-success/20 text-sanad-success' : 'bg-sanad-danger/20 text-sanad-danger'
                                    }`}>
                                        {faceMatchResult.matched ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm text-foreground">
                                            {faceMatchResult.matched ? 'Reconnaissance Faciale Réussie' : 'Échec de Reconnaissance'}
                                        </h4>
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                            {faceMatchResult.matched
                                                ? 'Le selfie correspond à la photo d’identité nationale détectée sur la carte.'
                                                : 'Le visage détecté sur le selfie ne correspond pas à celui de la carte d’identité.'}
                                        </p>
                                        
                                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/40">
                                            <div>
                                                <span className="text-xs text-muted-foreground block">Score de Match</span>
                                                <span className="text-lg font-bold text-foreground">{faceMatchResult.confidence}%</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground block">Vérification Liveness (Vivacité)</span>
                                                <span className="text-lg font-bold text-foreground">{faceMatchResult.liveness}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center mt-8 gap-4">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="btn-secondary gap-2 px-5 py-2.5"
                            >
                                <ArrowLeft size={16} />
                                Retour
                            </button>
                            
                            {!faceMatchResult?.matched ? (
                                <button
                                    type="button"
                                    disabled={!selfieFile || selfieLoading}
                                    onClick={handleFaceMatch}
                                    className="btn-primary gap-2 px-6 py-2.5 ml-auto disabled:opacity-50"
                                >
                                    Vérifier mon visage
                                    <Camera size={16} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setStep(3)}
                                    className="btn-primary gap-2 px-6 py-2.5 ml-auto"
                                >
                                    Suivant
                                    <ArrowRight size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 3: Review Information & Account Credentials */}
                {step === 3 && (
                    <div className="card-base p-8 fade-in-up">
                        <h2 className="font-display font-bold text-2xl text-foreground mb-2">Vérifier vos informations</h2>
                        <p className="text-muted-foreground text-sm mb-6">Veuillez vérifier les informations extraites de votre carte d&apos;identité nationale.</p>

                        <div className="space-y-6">
                            {/* Group 1: OCR Extracted Fields (Editable) */}
                            <div>
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">
                                    Informations extraites de la carte d&apos;identité (Modifiables)
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-foreground mb-1.5">
                                            الإسم بالعربية (Arabic Name)
                                        </label>
                                        <input
                                            type="text"
                                            dir="rtl"
                                            className="input-base"
                                            value={form.fullNameArabic}
                                            onChange={(e) => setForm({ ...form, fullNameArabic: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-foreground mb-1.5">
                                            Nom complet (Latin)
                                        </label>
                                        <input
                                            type="text"
                                            className={`input-base ${errors.fullNameLatin ? 'border-sanad-danger ring-1 ring-sanad-danger' : ''}`}
                                            value={form.fullNameLatin}
                                            onChange={(e) => setForm({ ...form, fullNameLatin: e.target.value })}
                                        />
                                        {errors.fullNameLatin && <p className="text-xs text-sanad-danger mt-1">{errors.fullNameLatin}</p>}
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
                                            Lieu de naissance
                                        </label>
                                        <input
                                            type="text"
                                            className={`input-base ${errors.birthPlace ? 'border-sanad-danger ring-1 ring-sanad-danger' : ''}`}
                                            value={form.birthPlace}
                                            onChange={(e) => setForm({ ...form, birthPlace: e.target.value })}
                                        />
                                        {errors.birthPlace && <p className="text-xs text-sanad-danger mt-1">{errors.birthPlace}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-foreground mb-1.5">
                                            Nom du père
                                        </label>
                                        <input
                                            type="text"
                                            className={`input-base ${errors.fatherName ? 'border-sanad-danger ring-1 ring-sanad-danger' : ''}`}
                                            value={form.fatherName}
                                            onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                                        />
                                        {errors.fatherName && <p className="text-xs text-sanad-danger mt-1">{errors.fatherName}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-foreground mb-1.5">
                                            Date d&apos;expiration
                                        </label>
                                        <input
                                            type="date"
                                            className="input-base"
                                            value={form.expiryDate}
                                            onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-foreground mb-1.5">
                                            Adresse (Résidence)
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
                                            placeholder="+216 XX XXX XXX"
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
                                onClick={() => setStep(2)}
                                className="btn-secondary gap-2 px-5 py-2.5"
                                disabled={emailLoading}
                            >
                                <ArrowLeft size={16} />
                                Retour
                            </button>
                            <button
                                type="button"
                                onClick={handleStep3Submit}
                                className="btn-primary gap-2 px-6 py-2.5 ml-auto disabled:opacity-75 flex items-center"
                                disabled={emailLoading}
                            >
                                {emailLoading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin mr-1.5" />
                                        Finalisation...
                                    </>
                                ) : (
                                    <>
                                        Créer mon compte
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Create Account Confirmation */}
                {step === 4 && (
                    <div className="card-base p-8 text-center fade-in-up">
                        <div className="w-16 h-16 rounded-full bg-sanad-success/15 text-sanad-success flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <CheckCircle size={36} />
                        </div>
                        
                        <h2 className="font-display font-bold text-2xl text-foreground mb-2">Compte créé avec succès !</h2>
                        <p className="text-muted-foreground text-sm mb-4">Bienvenue chez SANAD. Votre profil a été configuré avec vos informations vérifiées.</p>
                        <p className="text-xs text-sanad-success font-medium bg-sanad-success/10 border border-sanad-success/20 rounded-full px-3 py-1.5 max-w-sm mx-auto mb-6">
                            Un e-mail récapitulatif contenant toutes vos informations KYC a été envoyé.
                        </p>

                        <div className="bg-muted rounded-2xl p-5 mb-8 text-left max-w-md mx-auto space-y-3">
                            {form.fullNameArabic && (
                                <div className="flex justify-between text-sm py-1 border-b border-border">
                                    <span className="text-muted-foreground">الإسم</span>
                                    <span className="font-semibold text-foreground" dir="rtl">{form.fullNameArabic}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm py-1 border-b border-border">
                                <span className="text-muted-foreground">Assuré</span>
                                <span className="font-semibold text-foreground">{form.fullNameLatin}</span>
                            </div>
                            <div className="flex justify-between text-sm py-1 border-b border-border">
                                <span className="text-muted-foreground">Numéro CIN</span>
                                <span className="font-semibold text-foreground font-mono">{form.cin}</span>
                            </div>
                            <div className="flex justify-between text-sm py-1 border-b border-border">
                                <span className="text-muted-foreground">Lieu de naissance</span>
                                <span className="font-semibold text-foreground">{form.birthPlace}</span>
                            </div>
                            <div className="flex justify-between text-sm py-1 border-b border-border">
                                <span className="text-muted-foreground">Nom du père</span>
                                <span className="font-semibold text-foreground">{form.fatherName}</span>
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
