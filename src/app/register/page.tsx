'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Shield, ArrowRight, ArrowLeft, Upload, CheckCircle, User, CreditCard,
    Phone, Mail, MapPin, Calendar, AlertCircle, Loader2, Lock, XCircle
} from 'lucide-react';
import { 
    uploadDocument, 
    compareSelfieToID, 
    sendKYCConfirmationEmail, 
    type IdentityCardData,
    screenAML,
    createAuditDossier,
    addAuditStep,
    updateAuditIdentity,
    getAuditDossier,
    type AMLScreenResult,
    type AuditStep
} from '@/services/ocrService';
import { Camera, Image as ImageIcon } from 'lucide-react';
import ExplainabilityPanel from '@/components/ExplainabilityPanel';
import { amlFactorsToShap } from '@/lib/ai/explainability';

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
    const [emailLoading, setEmailLoading] = useState(false);

    // Unified Audit Trail & AML/CFT Risk Scoring
    const [dossierId, setDossierId] = useState<string | null>(null);
    const [amlResult, setAmlResult] = useState<AMLScreenResult | null>(null);
    const [auditSteps, setAuditSteps] = useState<AuditStep[]>([]);
    const [amlBypassed, setAmlBypassed] = useState(false);
    const [infoAccepted, setInfoAccepted] = useState(false);
    const [welcomeBackUser, setWelcomeBackUser] = useState<{ name: string } | null>(null);

    // Webcam States & Refs
    const [cameraActive, setCameraActive] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Liveness guidance
    const LIVENESS_STEPS = [
        { icon: '😐', text: 'Regardez droit devant', direction: 'center' as const },
        { icon: '👈', text: 'Tournez légèrement la tête à gauche', direction: 'left' as const },
        { icon: '👉', text: 'Tournez légèrement la tête à droite', direction: 'right' as const },
        { icon: '📸', text: 'Parfait ! Restez immobile pour la capture', direction: 'center' as const },
    ];
    const [livenessStep, setLivenessStep] = useState(0);
    const [livenessComplete, setLivenessComplete] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const livenessTimerRef = useRef<NodeJS.Timeout | null>(null);

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

        let activeDossierId: string | null = null;

        try {
            // 1. Create the Audit Dossier
            const dossier = await createAuditDossier();
            activeDossierId = dossier.dossierId;
            setDossierId(dossier.dossierId);
            setAuditSteps(dossier.steps);

            // Run front + back OCR in PARALLEL to save time (instead of sequential)
            const frontPromise = uploadDocument(frontIdFile);
            const backPromise = backIdFile
                ? uploadDocument(backIdFile).catch(() => null)  // Back failure is non-critical
                : Promise.resolve(null);

            const [frontResult, backResult] = await Promise.all([frontPromise, backPromise]);

            // Log OCR Step
            await addAuditStep(dossier.dossierId, 'OCR_SCAN', 'SUCCESS', {
                confidence: frontResult.confidence,
                frontFileName: frontIdFile.name,
                backFileName: backIdFile?.name || null
            });

            // Extract identity data from front result
            const extracted = frontResult.extractedData as IdentityCardData;
            const mergedData = { ...extracted };

            // Merge back result if it contains additional identity fields
            if (backResult && backResult.documentType === 'identity_card') {
                const backData = backResult.extractedData as IdentityCardData;
                if (!mergedData.fullNameArabic && backData.fullNameArabic) mergedData.fullNameArabic = backData.fullNameArabic;
                if (!mergedData.fullNameLatin && backData.fullNameLatin) mergedData.fullNameLatin = backData.fullNameLatin;
                if (!mergedData.cin && backData.cin) mergedData.cin = backData.cin;
                if (!mergedData.birthDate && backData.birthDate) mergedData.birthDate = backData.birthDate;
                if (!mergedData.expiryDate && backData.expiryDate) mergedData.expiryDate = backData.expiryDate;
                if (!mergedData.birthPlace && backData.birthPlace) mergedData.birthPlace = backData.birthPlace;
                if (!mergedData.fatherName && backData.fatherName) mergedData.fatherName = backData.fatherName;
            }

            // Check if CIN is already registered and redirect if so
            if (mergedData.cin) {
                try {
                    const checkRes = await fetch(`/api/auth/check-cin/${encodeURIComponent(mergedData.cin)}`).then((r) => r.json());
                    if (checkRes.registered) {
                        setOcrError(null);
                        setOcrLoading(false);
                        clearTimeout(timer1);
                        clearTimeout(timer2);

                        setWelcomeBackUser({ name: checkRes.name });

                        setTimeout(() => {
                            router.push(`/login?cin=${encodeURIComponent(mergedData.cin!)}`);
                        }, 2500);
                        return;
                    }
                    // Fallback: Python audit trail
                    const checkUrl = `${process.env.NEXT_PUBLIC_OCR_API_URL || 'http://localhost:8001'}/check-cin/${encodeURIComponent(mergedData.cin)}`;
                    const legacyCheck = await fetch(checkUrl).then((r) => r.json());
                    if (legacyCheck.registered) {
                        setWelcomeBackUser({ name: legacyCheck.name });
                        setTimeout(() => router.push('/login'), 2500);
                        return;
                    }
                } catch (checkErr) {
                    console.error('Failed to check duplicate CIN during OCR', checkErr);
                }
            }

            // Update dossier identity info
            await updateAuditIdentity(dossier.dossierId, mergedData);

            // 2. Perform AML/CFT screening aligned with Tunisian Law 2015-26
            const aml = await screenAML({
                name_arabic: mergedData.fullNameArabic || '',
                name_latin: mergedData.fullNameLatin || '',
                cin: mergedData.cin || '',
                birth_date: mergedData.birthDate || '',
                birth_place: mergedData.birthPlace || '',
            });

            setAmlResult(aml);
            
            // Log AML Screening step in the audit dossier
            const updatedDossier = await addAuditStep(
                dossier.dossierId, 
                'AML_SCREENING', 
                aml.risk_level === 'CRITICAL' ? 'FAILED' : aml.risk_level === 'HIGH' ? 'WARNING' : 'SUCCESS', 
                { risk_level: aml.risk_level, risk_score: aml.risk_score, factors: aml.factors }
            );
            setAuditSteps(updatedDossier.steps);

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

            // Log step failure if dossier was created
            if (activeDossierId) {
                try {
                    const updatedDossier = await addAuditStep(activeDossierId, 'OCR_SCAN', 'FAILED', { error: errorMessage });
                    setAuditSteps(updatedDossier.steps);
                } catch (auditErr) {
                    console.error("Failed to log step failure in audit dossier:", auditErr);
                }
            }
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

    // ─── Webcam functions ────────────────────────────────────────────────
    const startCamera = async () => {
        setSelfieError(null);
        setSelfieFile(null);
        setFaceMatchResult(null);
        setLivenessStep(0);
        setLivenessComplete(false);
        setCountdown(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 480, height: 480, facingMode: 'user' }
            });
            setStream(mediaStream);
            setCameraActive(true);
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            }, 120);
        } catch (err: unknown) {
            console.error('Camera access error:', err);
            setSelfieError("Impossible d'accéder à la caméra. Veuillez autoriser l'accès dans les paramètres de votre navigateur.");
        }
    };

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setCameraActive(false);
        if (livenessTimerRef.current) {
            clearInterval(livenessTimerRef.current);
            livenessTimerRef.current = null;
        }
    }, [stream]);

    // Liveness guidance progression: cycle through steps then auto-capture
    useEffect(() => {
        if (!cameraActive || selfieFile) return;

        // Start liveness step timer
        const timer = setInterval(() => {
            setLivenessStep(prev => {
                const next = prev + 1;
                if (next >= LIVENESS_STEPS.length) {
                    clearInterval(timer);
                    setLivenessComplete(true);
                    // Start 3-second countdown before capture
                    setCountdown(2);
                    return prev;
                }
                return next;
            });
        }, 1500);

        livenessTimerRef.current = timer;
        return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cameraActive, selfieFile]);

    // Countdown to auto-capture
    useEffect(() => {
        if (countdown === null) return;
        if (countdown <= 0) {
            captureSelfie();
            setCountdown(null);
            return;
        }
        const t = setTimeout(() => setCountdown(prev => (prev !== null ? prev - 1 : null)), 1000);
        return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [countdown]);

    const captureSelfie = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            if (context) {
                const size = Math.min(video.videoWidth, video.videoHeight) || 480;
                canvas.width = size;
                canvas.height = size;
                const sx = (video.videoWidth - size) / 2;
                const sy = (video.videoHeight - size) / 2;
                context.drawImage(video, sx, sy, size, size, 0, 0, size, size);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
                        setSelfieFile(file);
                        stopCamera();
                    }
                }, 'image/jpeg', 0.95);
            }
        }
    };

    const handleFaceMatch = async () => {
        if (!selfieFile || !frontIdFile) return;

        // FRAUD CHECK: If the user did not complete the liveness steps, reject
        if (!livenessComplete) {
            const fraudResult = {
                matched: false,
                confidence: 0,
                liveness: 0,
                error: 'Fraude détectée : Vous n\'avez pas suivi les instructions de vivacité. Veuillez reprendre le selfie et suivre toutes les étapes.',
            };
            setFaceMatchResult(fraudResult);
            setSelfieError('Fraude détectée : Vous devez bouger la tête selon les instructions avant la capture.');
            
            if (dossierId) {
                try {
                    const updatedDossier = await addAuditStep(dossierId, 'LIVENESS_CHECK', 'FAILED', { 
                        error: 'Fraude détectée - étapes de vivacité ignorées ou contournées' 
                    });
                    setAuditSteps(updatedDossier.steps);
                } catch (auditErr) {
                    console.error("Failed to log liveness failure:", auditErr);
                }
            }
            return;
        }

        setSelfieLoading(true);
        setSelfieError(null);
        setFaceMatchResult(null);

        try {
            const res = await compareSelfieToID(selfieFile, frontIdFile);
            setFaceMatchResult(res);
            
            if (dossierId) {
                // Log liveness passed
                await addAuditStep(dossierId, 'LIVENESS_CHECK', 'SUCCESS', { liveness_score: res.liveness });
                // Log face match status
                const updatedDossier = await addAuditStep(dossierId, 'FACE_MATCH', res.matched ? 'SUCCESS' : 'FAILED', {
                    confidence: res.confidence,
                    liveness: res.liveness,
                    matched: res.matched,
                    error: res.error
                });
                setAuditSteps(updatedDossier.steps);
            }

            if (res.error) {
                setSelfieError(res.error);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Face matching failed";
            setSelfieError(msg);

            if (dossierId) {
                try {
                    const updatedDossier = await addAuditStep(dossierId, 'FACE_MATCH', 'FAILED', { error: msg });
                    setAuditSteps(updatedDossier.steps);
                } catch (auditErr) {
                    console.error("Failed to log face match exception:", auditErr);
                }
            }
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
        } else if (form.password.length < 8) {
            e.password = 'Le mot de passe doit faire au moins 8 caractères';
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
                let finalAuditSteps = auditSteps;

                // 1. Log Info validation & Account creation to audit dossier
                if (dossierId) {
                    try {
                        // Update the dossier with any manual edits the user made
                        await updateAuditIdentity(dossierId, {
                            fullNameArabic: form.fullNameArabic,
                            fullNameLatin: form.fullNameLatin,
                            cin: form.cin,
                            birthDate: form.birthDate,
                            birthPlace: form.birthPlace,
                            fatherName: form.fatherName,
                            phone: form.phone,
                            address: form.address,
                        });
                        
                        await addAuditStep(dossierId, 'INFO_VALIDATION', 'SUCCESS');
                        const finalDossier = await addAuditStep(dossierId, 'ACCOUNT_CREATED', 'SUCCESS');
                        setAuditSteps(finalDossier.steps);
                        finalAuditSteps = finalDossier.steps;
                    } catch (auditErr) {
                        console.error("Failed to write final audit steps:", auditErr);
                        throw auditErr;
                    }
                }

                // 2. Trigger backend SMTP email dispatch with full KYC & AML Audit data
                await sendKYCConfirmationEmail(form.email, {
                    fullNameArabic: form.fullNameArabic,
                    fullNameLatin: form.fullNameLatin,
                    cin: form.cin,
                    birthDate: form.birthDate,
                    birthPlace: form.birthPlace,
                    fatherName: form.fatherName,
                    phone: form.phone,
                    address: form.address,
                    dossierId: dossierId || 'Non spécifié',
                    amlLevel: amlResult?.risk_level || 'LOW',
                    amlScore: amlResult?.risk_score || 0,
                    auditSteps: finalAuditSteps
                });

                // 3. Secure account in MongoDB (bcrypt + JWT session)
                const regRes = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: form.email,
                        password: form.password,
                        cin: form.cin,
                        dossierId,
                        profile: {
                            fullNameLatin: form.fullNameLatin,
                            fullNameArabic: form.fullNameArabic,
                            birthDate: form.birthDate,
                            birthPlace: form.birthPlace,
                            fatherName: form.fatherName,
                            phone: form.phone,
                            address: form.address,
                            expiryDate: form.expiryDate,
                        },
                    }),
                });
                if (!regRes.ok) {
                    const regErr = await regRes.json().catch(() => ({}));
                    throw new Error(regErr.error || 'Création du compte sécurisé impossible.');
                }
                
                setStep(4);
            } catch (err: any) {
                console.error("Failed to submit registration", err);
                setSelfieError(err instanceof Error ? err.message : String(err));
            } finally {
                setEmailLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <nav className="border-b border-border bg-card sticky top-0 z-40">
                <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
                        <img src="/sanad.png" alt="SANAD" className="h-12 w-auto object-contain" />
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
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-foreground">Erreur OCR / Inscription</p>
                                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{ocrError}</p>
                                    {ocrError.includes("déjà") && (
                                        <div className="mt-2.5">
                                            <Link href="/chat" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                                                Accéder directement au Chat Assistant
                                                <ArrowRight size={12} />
                                            </Link>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setOcrError(null)} className="text-muted-foreground hover:text-foreground">
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

                {/* Step 2: Live Selfie & Biometric Match */}
                {step === 2 && (
                    <div className="card-base p-8 fade-in-up">
                        <h2 className="font-display font-bold text-2xl text-foreground mb-2">Vérification de l&apos;Identité & Biométrie</h2>
                        <p className="text-muted-foreground text-sm mb-6">
                            Veuillez vérifier les informations extraites de votre carte d&apos;identité et procéder à la vérification de présence.
                        </p>

                        {/* Part 1: Extracted Information Preview */}
                        <div className="bg-muted/30 rounded-2xl p-5 mb-6 border border-border/60">
                            <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase mb-3 flex items-center gap-1.5">
                                <User size={13} className="text-primary" />
                                Informations extraites de votre CIN :
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                                {form.fullNameArabic && (
                                    <div className="flex justify-between py-1 border-b border-border/40">
                                        <span className="text-muted-foreground">الإسم واللقب</span>
                                        <span className="font-semibold text-foreground" dir="rtl">{form.fullNameArabic}</span>
                                    </div>
                                )}
                                <div className="flex justify-between py-1 border-b border-border/40">
                                    <span className="text-muted-foreground">Nom complet (Latin)</span>
                                    <span className="font-semibold text-foreground">{form.fullNameLatin}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-border/40">
                                    <span className="text-muted-foreground">Numéro CIN</span>
                                    <span className="font-semibold text-foreground font-mono">{form.cin}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-border/40">
                                    <span className="text-muted-foreground">Date de naissance</span>
                                    <span className="font-semibold text-foreground">{form.birthDate}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-border/40">
                                    <span className="text-muted-foreground">Lieu de naissance</span>
                                    <span className="font-semibold text-foreground">{form.birthPlace || '-'}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-border/40">
                                    <span className="text-muted-foreground">Nom du père</span>
                                    <span className="font-semibold text-foreground">{form.fatherName || '-'}</span>
                                </div>
                            </div>

                            {/* Part 2: AML/CFT Risk Scoring Banner (Loi 2015-26) */}
                            {amlResult && (
                                <div className="mt-4 pt-4 border-t border-border/60">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Statut Conformité AML/CFT :</span>
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                                            amlResult.risk_level === 'CRITICAL'
                                                ? 'bg-red-500/10 text-red-600 border-red-500/20'
                                                : amlResult.risk_level === 'HIGH'
                                                ? 'bg-orange-500/10 text-orange-600 border-orange-500/20'
                                                : amlResult.risk_level === 'MEDIUM'
                                                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                : 'bg-green-500/10 text-green-600 border-green-500/20'
                                        }`}>
                                            {amlResult.risk_level === 'CRITICAL' ? '⛔ CRITIQUE' : 
                                             amlResult.risk_level === 'HIGH' ? '⚠️ ÉLEVÉ' : 
                                             amlResult.risk_level === 'MEDIUM' ? '🟡 MODÉRÉ' : '🟢 FAIBLE'} ({amlResult.risk_score}/100)
                                        </span>
                                    </div>

                                    {/* Critical Risk Blocker */}
                                    {amlResult.risk_level === 'CRITICAL' && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-left mb-3 flex items-start gap-3">
                                            <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">Accès Bloqué (Loi n° 2015-26)</p>
                                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                                    Cette identité figure sur une liste de sanctions ou présente un niveau de risque non conforme. La création de compte est suspendue.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* High Risk Acknowledgment */}
                                    {amlResult.risk_level === 'HIGH' && (
                                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 text-left mb-3">
                                            <div className="flex gap-3">
                                                <AlertCircle size={20} className="text-orange-500 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">Vigilance Renforcée Requise</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                                        Un risque élevé a été identifié. Vous pouvez continuer, mais votre dossier fera l&apos;objet d&apos;un audit approfondi.
                                                    </p>
                                                </div>
                                            </div>
                                            <label className="flex items-center gap-2.5 mt-3 p-2 bg-card rounded-lg border border-orange-500/20 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={amlBypassed}
                                                    onChange={(e) => setAmlBypassed(e.target.checked)}
                                                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                                                />
                                                <span className="text-xs text-foreground font-medium select-none">
                                                    J&apos;accepte de soumettre mon dossier KYC sous vigilance renforcée.
                                                </span>
                                            </label>
                                        </div>
                                    )}

                                    {/* Safe / Low Risk Confirmation */}
                                    {(amlResult.risk_level === 'LOW' || amlResult.risk_level === 'MEDIUM') && (
                                        <p className="text-xs text-muted-foreground leading-relaxed bg-green-500/5 p-3 rounded-xl border border-green-500/10">
                                            ✓ Aucun signal critique détecté dans la base nationale de filtrage (Loi 2015-26).
                                        </p>
                                    )}

                                    {amlResult.factors?.length > 0 && (
                                        <div className="mt-3">
                                            <ExplainabilityPanel
                                                title="Score AML — explicabilité SHAP"
                                                titleAr="تفسير مؤشر AML"
                                                contributions={amlFactorsToShap(amlResult.factors)}
                                                methodology={`Score AML : ${amlResult.risk_score}/100. Chaque facteur montre sa contribution marginale au risque (Loi 2015-26).`}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Part 3: Confirmation Checkbox */}
                            {amlResult?.risk_level !== 'CRITICAL' && (
                                <label className="flex items-center gap-3 mt-5 p-3 bg-card border border-border rounded-xl cursor-pointer hover:bg-muted/5 transition-all">
                                    <input
                                        type="checkbox"
                                        checked={infoAccepted}
                                        onChange={(e) => setInfoAccepted(e.target.checked)}
                                        className="w-4.5 h-4.5 rounded border-border text-primary focus:ring-primary"
                                    />
                                    <span className="text-xs text-foreground font-medium select-none">
                                        Je confirme que ces informations extraites sont exactes et correspondent à ma carte d&apos;identité.
                                    </span>
                                </label>
                            )}
                        </div>

                        {/* Error Banners */}
                        {selfieError && (
                            <div className="bg-sanad-danger/10 border border-sanad-danger/20 rounded-2xl p-4 mb-6 flex items-start gap-3 fade-in-up">
                                <XCircle size={20} className="text-sanad-danger flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-foreground">Erreur</p>
                                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{selfieError}</p>
                                    {selfieError.includes("déjà") && (
                                        <div className="mt-2.5">
                                            <Link href="/chat" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                                                Accéder directement au Chat Assistant
                                                <ArrowRight size={12} />
                                            </Link>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setSelfieError(null)} className="text-muted-foreground hover:text-foreground">
                                    <XCircle size={16} />
                                </button>
                            </div>
                        )}

                        {/* Webcam Capture Frame (Unlocked only if infoAccepted is true and AML risk is not Critical) */}
                        {amlResult?.risk_level !== 'CRITICAL' && (
                            <div className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-3xl transition-all duration-200 mb-8 ${
                                !infoAccepted || (amlResult?.risk_level === 'HIGH' && !amlBypassed)
                                    ? 'opacity-40 pointer-events-none'
                                    : 'bg-muted/10'
                            }`}>
                                {(!infoAccepted || (amlResult?.risk_level === 'HIGH' && !amlBypassed)) && (
                                    <div className="absolute inset-0 bg-background/5 rounded-3xl flex items-center justify-center z-10 backdrop-blur-[0.5px]">
                                        <span className="text-xs font-semibold bg-foreground/90 text-background px-4 py-2 rounded-full shadow-md">
                                            {amlResult?.risk_level === 'HIGH' && !amlBypassed
                                                ? 'Acceptez la vigilance renforcée pour débloquer la caméra'
                                                : 'Confirmez vos informations ci-dessus pour débloquer la caméra'}
                                        </span>
                                    </div>
                                )}

                                {selfieFile ? (
                                    /* ── Captured selfie preview ── */
                                    <div className="text-center space-y-4">
                                        <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-primary mx-auto shadow-lg">
                                            <img
                                                src={URL.createObjectURL(selfieFile)}
                                                alt="Selfie"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-xs text-sanad-success font-semibold">✓ Selfie capturé avec succès</p>
                                            <button
                                                type="button"
                                                onClick={() => { setSelfieFile(null); setFaceMatchResult(null); startCamera(); }}
                                                className="text-xs text-primary font-medium hover:underline mt-2 flex items-center gap-1 mx-auto"
                                            >
                                                <Camera size={12} />
                                                Reprendre la photo
                                            </button>
                                        </div>
                                    </div>
                                ) : cameraActive ? (
                                    /* ── Live camera feed + liveness guidance ── */
                                    <div className="text-center space-y-5 w-full max-w-sm">
                                        <div className="relative w-52 h-52 rounded-full overflow-hidden border-4 border-primary/40 mx-auto bg-black shadow-lg flex items-center justify-center">
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                className="w-full h-full object-cover scale-x-[-1]"
                                            />
                                            {/* Alignment guide */}
                                            <div className="absolute inset-4 rounded-full border-2 border-dashed border-white/50 pointer-events-none" />

                                            {/* Countdown overlay */}
                                            {countdown !== null && countdown > 0 && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                                                    <span className="text-5xl font-bold text-white drop-shadow-lg animate-pulse">{countdown}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* ── Liveness instruction notification ── */}
                                        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 fade-in-up" key={livenessStep}>
                                            <div className="flex items-center gap-3 justify-center">
                                                <span className="text-2xl">{LIVENESS_STEPS[livenessStep]?.icon}</span>
                                                <div className="text-left">
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {LIVENESS_STEPS[livenessStep]?.text}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        Étape {livenessStep + 1} / {LIVENESS_STEPS.length}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Progress bar */}
                                            <div className="w-full bg-border/40 rounded-full h-1.5 mt-3">
                                                <div
                                                    className="bg-primary h-1.5 rounded-full transition-all duration-700 ease-out"
                                                    style={{ width: `${((livenessStep + 1) / LIVENESS_STEPS.length) * 100}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Direction arrow indicator */}
                                        <div className="flex items-center justify-center gap-6 py-1">
                                            <span className={`text-xl transition-all duration-300 ${
                                                LIVENESS_STEPS[livenessStep]?.direction === 'left'
                                                    ? 'text-primary scale-125 animate-bounce'
                                                    : 'text-muted-foreground/30'
                                            }`}>←</span>
                                            <span className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                                LIVENESS_STEPS[livenessStep]?.direction === 'center'
                                                    ? 'bg-primary scale-125'
                                                    : 'bg-muted-foreground/20'
                                            }`} />
                                            <span className={`text-xl transition-all duration-300 ${
                                                LIVENESS_STEPS[livenessStep]?.direction === 'right'
                                                    ? 'text-primary scale-125 animate-bounce'
                                                    : 'text-muted-foreground/30'
                                            }`}>→</span>
                                        </div>

                                        {!livenessComplete ? (
                                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                                                <p className="text-xs font-semibold text-amber-600">⚠️ Suivez les instructions ci-dessus</p>
                                                <p className="text-xs text-muted-foreground mt-1">La capture sera automatique après les étapes de vivacité. Ne bougez pas trop vite.</p>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-sanad-success font-semibold">✓ Vivacité confirmée — capture imminente...</p>
                                        )}
                                    </div>
                                ) : (
                                    /* ── Camera start prompt ── */
                                    <div className="text-center py-8 w-full">
                                        <div className="w-16 h-16 rounded-2xl bg-accent text-primary flex items-center justify-center mx-auto mb-5 shadow-sm">
                                            <Camera size={28} />
                                        </div>
                                        <p className="text-base font-semibold text-foreground">Vérification par Selfie en Direct</p>
                                        <p className="text-xs text-muted-foreground mt-2 mb-1 max-w-xs mx-auto leading-relaxed">
                                            Votre caméra sera activée pour capturer votre visage.
                                            Vous devrez bouger légèrement la tête pour prouver votre vivacité.
                                        </p>
                                        <div className="flex items-center justify-center gap-2 text-xs text-primary/80 font-medium mb-5">
                                            <Shield size={12} />
                                            Aucune image n&apos;est stockée — traitement instantané
                                        </div>
                                        <button
                                            type="button"
                                            onClick={startCamera}
                                            className="btn-primary gap-2 px-6 py-2.5 mx-auto"
                                        >
                                            <Camera size={16} />
                                            Démarrer la caméra
                                        </button>
                                    </div>
                                )}

                                {/* Hidden canvas for video frame grab */}
                                <canvas ref={canvasRef} className="hidden" />
                            </div>
                        )}

                        {/* Selfie Loading State */}
                        {selfieLoading && (
                            <div className="bg-muted/30 rounded-2xl p-5 mb-8 text-center space-y-3">
                                <Loader2 className="animate-spin text-primary mx-auto" size={24} />
                                <p className="text-sm font-medium text-foreground">Analyse et comparaison faciale en cours...</p>
                                <p className="text-xs text-muted-foreground">Extraction et comparaison des traits faciaux en direct...</p>
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
                                                ? 'Le selfie correspond à la photo d\u2019identité nationale détectée sur la carte.'
                                                : 'Le visage détecté sur le selfie ne correspond pas à celui de la carte d\u2019identité.'}
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
                                onClick={() => { stopCamera(); setStep(1); }}
                                className="btn-secondary gap-2 px-5 py-2.5"
                            >
                                <ArrowLeft size={16} />
                                Retour
                            </button>
                            
                            {amlResult?.risk_level === 'CRITICAL' ? (
                                <button
                                    type="button"
                                    onClick={handleScanAgain}
                                    className="btn-primary gap-2 px-6 py-2.5 ml-auto"
                                >
                                    Scanner à nouveau
                                    <ArrowRight size={16} />
                                </button>
                            ) : !faceMatchResult?.matched ? (
                                <button
                                    type="button"
                                    disabled={!selfieFile || selfieLoading || !infoAccepted || (amlResult?.risk_level === 'HIGH' && !amlBypassed)}
                                    onClick={handleFaceMatch}
                                    className="btn-primary gap-2 px-6 py-2.5 ml-auto disabled:opacity-50"
                                >
                                    Vérifier mon visage
                                    <Camera size={16} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => { stopCamera(); setStep(3); }}
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
                    <div className="card-base p-8 fade-in-up">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-sanad-success/15 text-sanad-success flex items-center justify-center mx-auto mb-4 shadow-sm animate-pulse">
                                <CheckCircle size={36} />
                            </div>
                            <h2 className="font-display font-bold text-2xl text-foreground mb-1">Dossier KYC Enregistré !</h2>
                            <p className="text-muted-foreground text-sm">Votre profil d&apos;assuré a été validé et sécurisé dans le registre partagé.</p>
                        </div>
                        
                        {/* Dossier ID Badge */}
                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6 text-center">
                            <span className="text-xs text-muted-foreground font-medium block mb-1">DOSSIER KYC RÉUTILISABLE (ID UNIQUE)</span>
                            <span className="font-mono text-base font-bold text-primary tracking-wider">{dossierId || 'KYC-2026-PENDING'}</span>
                            <p className="text-[10px] text-muted-foreground mt-1">Dossier certifié conforme pour toutes les compagnies d&apos;assurance partenaires.</p>
                        </div>

                        {/* KYC Extracted Details */}
                        <div className="bg-muted/30 rounded-2xl p-5 mb-6 text-left space-y-3 border border-border/40">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Informations Certifiées</h3>
                            {form.fullNameArabic && (
                                <div className="flex justify-between text-sm py-1 border-b border-border/40">
                                    <span className="text-muted-foreground">الإسم واللقب</span>
                                    <span className="font-semibold text-foreground" dir="rtl">{form.fullNameArabic}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm py-1 border-b border-border/40">
                                <span className="text-muted-foreground">Nom complet</span>
                                <span className="font-semibold text-foreground">{form.fullNameLatin}</span>
                            </div>
                            <div className="flex justify-between text-sm py-1 border-b border-border/40">
                                <span className="text-muted-foreground">Numéro CIN</span>
                                <span className="font-semibold text-foreground font-mono">{form.cin}</span>
                            </div>
                            {amlResult && (
                                <div className="flex justify-between text-sm py-1 border-b border-border/40">
                                    <span className="text-muted-foreground">Score Risque AML</span>
                                    <span className={`font-semibold ${
                                        amlResult.risk_level === 'HIGH' ? 'text-orange-600' : 'text-green-600'
                                    }`}>
                                        {amlResult.risk_level} ({amlResult.risk_score}/100)
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm py-1 border-b border-border/40">
                                <span className="text-muted-foreground">Email</span>
                                <span className="font-semibold text-foreground">{form.email}</span>
                            </div>
                            <div className="flex justify-between text-sm py-1">
                                <span className="text-muted-foreground">Téléphone</span>
                                <span className="font-semibold text-foreground">{form.phone}</span>
                            </div>
                        </div>

                        {/* Unified Audit Trail Timeline */}
                        {auditSteps && auditSteps.length > 0 && (
                            <div className="bg-muted/20 border border-border/50 rounded-2xl p-5 mb-8 text-left">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Piste d&apos;Audit Unifiée (Audit Trail)</h3>
                                <div className="relative border-l border-border/80 pl-4 ml-2 space-y-4">
                                    {auditSteps.map((s, idx) => (
                                        <div key={idx} className="relative">
                                            {/* dot */}
                                            <span className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-background ${
                                                s.status === 'SUCCESS' || s.status === 'PASSED'
                                                    ? 'bg-sanad-success'
                                                    : s.status === 'WARNING'
                                                    ? 'bg-amber-500'
                                                    : 'bg-red-500'
                                            }`} />
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-foreground">{s.step}</span>
                                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                                        s.status === 'SUCCESS' || s.status === 'PASSED'
                                                            ? 'bg-sanad-success/15 text-sanad-success'
                                                            : s.status === 'WARNING'
                                                            ? 'bg-amber-500/15 text-amber-600'
                                                            : 'bg-red-500/15 text-red-600'
                                                    }`}>
                                                        {s.status}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground block mt-0.5">
                                                    {new Date(s.timestamp).toLocaleTimeString()} — Horodatage certifié
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-sanad-success/10 border border-sanad-success/20 rounded-xl p-3 text-center mb-6">
                            <p className="text-xs text-sanad-success font-medium">
                                Un e-mail récapitulatif avec l&apos;audit complet et les attestations a été envoyé à {form.email}.
                            </p>
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

            {/* Welcome Back / Redirect Modal */}
            {welcomeBackUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-foreground/45 backdrop-blur-sm" />
                    <div className="relative bg-card rounded-2xl border border-border shadow-elevated w-full max-w-md p-8 text-center card-reveal flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-sanad-success/15 text-sanad-success flex items-center justify-center mb-6 shadow-sm">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="font-display font-bold text-2xl text-foreground mb-3">
                            Bienvenue de retour !
                        </h3>
                        <p className="text-sm font-semibold text-primary mb-2">
                            {welcomeBackUser.name}
                        </p>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed mb-6">
                            Votre eKYC est déjà validé. Connectez-vous avec votre CIN et mot de passe pour accéder au chat sécurisé.
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 size={14} className="animate-spin text-primary" />
                            Redirection en cours...
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
