'use client';

import React, { useEffect, useRef, useState } from 'react';
import Modal from '@/components/ui/Modal';
import SketchPad from '@/components/ui/SketchPad';
import SignaturePad from '@/components/ui/SignaturePad';
import { CIRCONSTANCES_LABELS, emptyConstatData, type ConstatData, type ConstatVehicleInfo } from '@/lib/constat/types';
import {
    defaultAccidentDateInput,
    defaultAccidentTimeInput,
    toDisplayDate,
    toDisplayTime,
    toInputDate,
    toInputTime,
} from '@/lib/constat/dateTime';
import { generateConstatPdf, type ConstatFraudResults } from '@/lib/constat/generateConstatPdf';
import type { FraudCheckResult } from '@/lib/ai/fraudCheckPrompt';
import { Download, Loader2, Camera, CheckCircle2, AlertTriangle, ShieldAlert, MapPin, X } from 'lucide-react';

interface ConstatModalProps {
    open: boolean;
    onClose: () => void;
    /** Fired when the PDF is downloaded successfully, passing constat data, photos, and fraud results */
    onDownloadPdf?: (
        data: ConstatData,
        fileA: File | null,
        fileB: File | null,
        fraudResults: ConstatFraudResults
    ) => void;
    /** Fired whenever a photo/declaration mismatch is confirmed for a vehicle — lets the
     * host page (e.g. the chat) react, such as asking the user for a police report. */
    onFraudFlagged?: (vehicleLabel: 'A' | 'B', result: FraudCheckResult) => void;
}

type VehiclePhotoState = {
    file: File | null;
    previewUrl: string | null;
    analyzing: boolean;
    result: FraudCheckResult | null;
    error: string | null;
};

const EMPTY_PHOTO_STATE: VehiclePhotoState = { file: null, previewUrl: null, analyzing: false, result: null, error: null };

function NumberBadge({ n }: { n: number }) {
    return (
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex-shrink-0">
            {n}
        </span>
    );
}

function Field({
    label,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    return (
        <label className="block">
            <span className="text-xs font-medium text-muted-foreground mb-1 block">{label}</span>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="input-base text-sm py-2"
            />
        </label>
    );
}

// Photo upload + live anti-fraud comparison for one vehicle. The user MUST
// attach a photo of the vehicle; once uploaded, it's automatically compared
// against what was declared for "point de choc initial" / "dégâts apparents"
// for that same vehicle using a vision model. A flagged mismatch is treated
// as a potential fraud case and requires a police report.
function VehiclePhotoUpload({
    label,
    vehicle,
    photo,
    onPhotoSelected,
}: {
    label: 'A' | 'B';
    vehicle: ConstatVehicleInfo;
    photo: VehiclePhotoState;
    onPhotoSelected: (file: File) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <NumberBadge n={9} /> Photo du véhicule {label} (facultatif)
            </span>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onPhotoSelected(f);
                    e.target.value = '';
                }}
            />
            {!photo.previewUrl ? (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className={`w-full flex flex-col items-center justify-center gap-1.5 py-6 rounded-xl border-2 border-dashed transition-colors ${
                        label === 'A' ? 'border-cyan-300 hover:bg-cyan-50' : 'border-amber-300 hover:bg-amber-50'
                    }`}
                >
                    <Camera size={20} className="text-primary" />
                    <span className="text-xs text-muted-foreground text-center px-2">
                        Ajouter une photo du véhicule {label}
                    </span>
                </button>
            ) : (
                <div className="relative rounded-xl overflow-hidden border border-border">
                    <img src={photo.previewUrl} alt={`Véhicule ${label}`} className="w-full h-32 object-cover" />
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] px-2 py-1 rounded-lg backdrop-blur-sm"
                    >
                        Remplacer
                    </button>
                    {photo.analyzing && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 text-white text-xs">
                            <Loader2 size={14} className="animate-spin" /> Vérification anti-fraude...
                        </div>
                    )}
                </div>
            )}

            {photo.error && (
                <p className="text-[11px] text-sanad-danger flex items-start gap-1">
                    <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" /> {photo.error}
                </p>
            )}

            {photo.result && !photo.analyzing && (
                <div
                    className={`rounded-lg p-2.5 text-[11px] leading-snug flex items-start gap-1.5 ${
                        photo.result.inconsistencyDetected
                            ? 'bg-sanad-danger/10 text-sanad-danger border border-sanad-danger/30'
                            : 'bg-sanad-success/10 text-sanad-success border border-sanad-success/30'
                    }`}
                >
                    {photo.result.inconsistencyDetected ? (
                        <ShieldAlert size={13} className="flex-shrink-0 mt-0.5" />
                    ) : (
                        <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" />
                    )}
                    <span>
                        {photo.result.inconsistencyDetected
                            ? 'Incohérence détectée avec la déclaration — cas suspect, rapport de police requis. '
                            : 'Cohérent avec la déclaration. '}
                        {photo.result.explanation}
                    </span>
                </div>
            )}

            {!vehicle.pointChocInitial && !vehicle.degatsApparents && photo.previewUrl && !photo.analyzing && (
                <p className="text-[10px] text-muted-foreground">
                    Renseignez le point de choc / dégâts apparents ci-dessus pour une vérification plus précise.
                </p>
            )}
        </div>
    );
}

function VehicleForm({
    label,
    data,
    onChange,
    photo,
    onPhotoSelected,
    signature,
    onSignatureChange,
}: {
    label: 'A' | 'B';
    data: ConstatVehicleInfo;
    onChange: (v: ConstatVehicleInfo) => void;
    photo: VehiclePhotoState;
    onPhotoSelected: (file: File) => void;
    signature: string;
    onSignatureChange: (value: string) => void;
}) {
    const set = <K extends keyof ConstatVehicleInfo>(key: K, value: ConstatVehicleInfo[K]) =>
        onChange({ ...data, [key]: value });

    const tint = label === 'A' ? 'bg-cyan-50/60 border-cyan-200' : 'bg-amber-50/60 border-amber-200';
    const headTint = label === 'A' ? 'text-cyan-800' : 'text-amber-800';

    return (
        <div className={`border rounded-2xl p-4 space-y-4 ${tint}`}>
            <p className={`font-display font-bold text-sm ${headTint}`}>Véhicule {label}</p>

            <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <NumberBadge n={8} /> Conducteur
                </span>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Nom" value={data.conducteurNom} onChange={(v) => set('conducteurNom', v)} />
                    <Field label="Téléphone" value={data.conducteurTelephone} onChange={(v) => set('conducteurTelephone', v)} />
                </div>
                <Field label="Adresse" value={data.conducteurAdresse} onChange={(v) => set('conducteurAdresse', v)} />
                <div className="grid grid-cols-2 gap-3">
                    <Field label="N° permis" value={data.permisNumero} onChange={(v) => set('permisNumero', v)} />
                    <Field label="Délivré le" value={data.permisDelivreLe} onChange={(v) => set('permisDelivreLe', v)} placeholder="jj/mm/aaaa" />
                </div>
            </div>

            <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <NumberBadge n={5} /> Assuré (voir attestation)
                </span>
                <Field label="Souscripteur assurance (si différent)" value={data.assureNom} onChange={(v) => set('assureNom', v)} />
            </div>

            <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <NumberBadge n={6} /> Véhicule
                </span>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Marque / type" value={data.vehiculeMarqueType} onChange={(v) => set('vehiculeMarqueType', v)} />
                    <Field label="Immatriculation" value={data.immatriculation} onChange={(v) => set('immatriculation', v)} />
                </div>
            </div>

            <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <NumberBadge n={7} /> Société d&apos;assurance
                </span>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Société assurance" value={data.societeAssurance} onChange={(v) => set('societeAssurance', v)} />
                    <Field label="N° contrat" value={data.numeroContrat} onChange={(v) => set('numeroContrat', v)} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <Field label="Agence" value={data.agence} onChange={(v) => set('agence', v)} />
                    <Field label="Attestation valable du" value={data.attestationValableDu} onChange={(v) => set('attestationValableDu', v)} placeholder="jj/mm/aaaa" />
                    <Field label="au" value={data.attestationValableAu} onChange={(v) => set('attestationValableAu', v)} placeholder="jj/mm/aaaa" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Field label="Point de choc initial" value={data.pointChocInitial} onChange={(v) => set('pointChocInitial', v)} placeholder="ex: avant droit" />
                <Field label="Dégâts apparents" value={data.degatsApparents} onChange={(v) => set('degatsApparents', v)} />
            </div>

            <VehiclePhotoUpload label={label} vehicle={data} photo={photo} onPhotoSelected={onPhotoSelected} />

            <label className="block">
                <span className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1.5">Observations</span>
                <textarea
                    value={data.observations}
                    onChange={(e) => set('observations', e.target.value)}
                    rows={2}
                    className="input-base text-sm py-2 resize-none"
                />
            </label>

            <SignaturePad
                label={`Signature conducteur ${label}`}
                value={signature}
                onChange={onSignatureChange}
                accentClass={label === 'A' ? 'border-cyan-300' : 'border-amber-300'}
            />
        </div>
    );
}

// Shared 17-row circonstances grid, exactly like the printed form: one
// checkbox column for vehicle A, the numbered label, one checkbox column
// for vehicle B.
function CirconstancesGrid({
    circA,
    circB,
    onToggleA,
    onToggleB,
}: {
    circA: boolean[];
    circB: boolean[];
    onToggleA: (i: number, checked: boolean) => void;
    onToggleB: (i: number, checked: boolean) => void;
}) {
    const countA = circA.filter(Boolean).length;
    const countB = circB.filter(Boolean).length;

    return (
        <div className="border border-border rounded-2xl p-3 flex flex-col">
            <p className="font-display font-bold text-sm text-primary text-center mb-1 flex items-center justify-center gap-1.5">
                <NumberBadge n={12} /> Circonstances
            </p>
            <p className="text-[10px] text-muted-foreground text-center mb-2">
                Cochez les cases utiles pour préciser le croquis
            </p>
            <div className="flex items-center justify-between px-1 mb-1">
                <span className="text-xs font-bold text-cyan-700">A</span>
                <span className="text-xs font-bold text-amber-700">B</span>
            </div>
            <div className="space-y-0.5 flex-1 overflow-y-auto pr-1 max-h-[420px]">
                {CIRCONSTANCES_LABELS.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-foreground py-1 border-b border-border/50 last:border-0">
                        <input
                            type="checkbox"
                            checked={circA[i]}
                            onChange={(e) => onToggleA(i, e.target.checked)}
                            className="flex-shrink-0 accent-cyan-600"
                        />
                        <span className="flex-1 leading-tight">
                            {i + 1}. {c}
                        </span>
                        <input
                            type="checkbox"
                            checked={circB[i]}
                            onChange={(e) => onToggleB(i, e.target.checked)}
                            className="flex-shrink-0 accent-amber-600"
                        />
                    </div>
                ))}
            </div>
            <div className="flex items-center justify-between px-1 mt-2 pt-2 border-t border-border text-[10px] font-semibold text-muted-foreground">
                <span>Cases marquées: {countA}</span>
                <span>Cases marquées: {countB}</span>
            </div>
        </div>
    );
}

// Optional photo of the accident scene/location itself (as opposed to the
// per-vehicle damage photos above). Shown right above the sketch pad so the
// user can either upload a real photo of where it happened, or fall back to
// drawing the croquis by hand.
function LocationPhotoUpload({ dataUrl, onChange }: { dataUrl: string; onChange: (dataUrl: string) => void }) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => onChange(typeof reader.result === 'string' ? reader.result : '');
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <MapPin size={13} className="text-primary" /> Photo du lieu de l&apos;accident (facultatif)
            </span>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = '';
                }}
            />
            {!dataUrl ? (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-1.5 py-5 rounded-xl border-2 border-dashed border-border hover:bg-accent transition-colors"
                >
                    <MapPin size={18} className="text-primary" />
                    <span className="text-xs text-muted-foreground text-center px-2">
                        Ajouter une photo de l&apos;emplacement de l&apos;accident
                    </span>
                </button>
            ) : (
                <div className="relative rounded-xl overflow-hidden border border-border">
                    <img src={dataUrl} alt="Lieu de l'accident" className="w-full h-40 object-cover" />
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] px-2 py-1 rounded-lg backdrop-blur-sm"
                    >
                        Remplacer
                    </button>
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        className="absolute top-1.5 right-1.5 bg-black/60 text-white p-1 rounded-lg backdrop-blur-sm"
                        title="Retirer la photo"
                    >
                        <X size={12} />
                    </button>
                </div>
            )}
            <p className="text-[10px] text-muted-foreground">
                Cette photo est jointe au PDF telle quelle, en plus du croquis dessiné ci-dessous.
            </p>
        </div>
    );
}

export default function ConstatModal({ open, onClose, onDownloadPdf, onFraudFlagged }: ConstatModalProps) {
    const [data, setData] = useState<ConstatData>(emptyConstatData());
    const [generating, setGenerating] = useState(false);
    const [photoA, setPhotoA] = useState<VehiclePhotoState>(EMPTY_PHOTO_STATE);
    const [photoB, setPhotoB] = useState<VehiclePhotoState>(EMPTY_PHOTO_STATE);
    const [locating, setLocating] = useState(false);

    useEffect(() => {
        if (!open) return;
        setData({
            ...emptyConstatData(),
            date: toDisplayDate(defaultAccidentDateInput()),
            heure: defaultAccidentTimeInput(),
        });
        setPhotoA(EMPTY_PHOTO_STATE);
        setPhotoB(EMPTY_PHOTO_STATE);
    }, [open]);

    const handleLocate = () => {
        if (!navigator.geolocation) {
            alert("La géolocalisation n'est pas supportée par votre navigateur.");
            return;
        }

        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
                        {
                            headers: {
                                'Accept-Language': 'fr',
                                'User-Agent': 'SANAD-Accident-Reporting-App'
                            }
                        }
                    );
                    if (res.ok) {
                        const json = await res.json();
                        const address = json.address;
                        
                        const street = address.road || address.suburb || address.neighbourhood || address.pedestrian || '';
                        const city = address.city || address.town || address.village || address.county || '';
                        
                        let displayAddress = '';
                        if (street) displayAddress += street;
                        if (city) displayAddress += (displayAddress ? `, ${city}` : city);
                        if (displayAddress) {
                            setData((prev) => ({
                                ...prev,
                                lieu: `${displayAddress} (GPS: ${mapsUrl})`
                            }));
                            setLocating(false);
                            return;
                        }
                    }
                } catch (err) {
                    console.error("Error geocoding:", err);
                }

                // Fallback to coordinates
                setData((prev) => ({
                    ...prev,
                    lieu: `Position GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (${mapsUrl})`
                }));
                setLocating(false);
            },
            (error) => {
                console.error("Geolocation error:", error);
                alert("Impossible d'obtenir votre position. Assurez-vous d'avoir autorisé l'accès à la localisation dans votre navigateur.");
                setLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const fraudFlagged = (photoA.result?.inconsistencyDetected || photoB.result?.inconsistencyDetected) ?? false;
    const anyAnalyzing = photoA.analyzing || photoB.analyzing;

    const runFraudCheck = async (label: 'A' | 'B', file: File, vehicle: ConstatVehicleInfo) => {
        const setPhoto = label === 'A' ? setPhotoA : setPhotoB;
        setPhoto((prev) => ({ ...prev, analyzing: true, error: null }));
        try {
            const buildFormData = () => {
                const formData = new FormData();
                formData.append('photo', file);
                formData.append('vehicleLabel', label);
                formData.append('pointChocInitial', vehicle.pointChocInitial);
                formData.append('degatsApparents', vehicle.degatsApparents);
                formData.append('vehiculeMarqueType', vehicle.vehiculeMarqueType);
                formData.append(
                    'circonstancesCochees',
                    JSON.stringify(vehicle.circonstances.map((c, i) => (c ? CIRCONSTANCES_LABELS[i] : null)).filter(Boolean))
                );
                return formData;
            };

            const fetchFraudCheck = async (): Promise<Response> => {
                const res = await fetch('/api/check-fraud', { method: 'POST', body: buildFormData() });
                if (res.status === 429) {
                    const json = await res.json().catch(() => ({}));
                    const retryMs = typeof json.retryAfterMs === 'number' ? json.retryAfterMs : 5000;
                    await new Promise((resolve) => setTimeout(resolve, retryMs));
                    return fetch('/api/check-fraud', { method: 'POST', body: buildFormData() });
                }
                return res;
            };

            const res = await fetchFraudCheck();
            const json = await res.json();

            if (!res.ok) {
                // Silently skip fraud check on failure — it's optional
                setPhoto((prev) => ({ ...prev, analyzing: false }));
                return;
            }

            const result: FraudCheckResult = json.result;
            setPhoto((prev) => ({ ...prev, analyzing: false, result }));
            if (result.inconsistencyDetected) {
                onFraudFlagged?.(label, result);
            }
        } catch {
            // Silently skip — fraud check is a nice-to-have, not a blocker
            setPhoto((prev) => ({ ...prev, analyzing: false }));
        }
    };

    const handlePhotoSelected = (label: 'A' | 'B', file: File) => {
        const setPhoto = label === 'A' ? setPhotoA : setPhotoB;
        const vehicle = label === 'A' ? data.vehiculeA : data.vehiculeB;
        const previewUrl = URL.createObjectURL(file);
        setPhoto({ file, previewUrl, analyzing: false, result: null, error: null });
        runFraudCheck(label, file, vehicle);
    };

    const handleDownload = async () => {
        if (fraudFlagged) {
            const confirmed = window.confirm(
                "⚠️ Une incohérence a été détectée entre au moins une photo et la déclaration correspondante.\n\n" +
                    "Ce dossier est marqué comme cas suspect et un rapport de police (PV) sera requis avant traitement.\n\n" +
                    'Voulez-vous quand même télécharger le constat (avec la mention de la vérification anti-fraude incluse) ?'
            );
            if (!confirmed) return;
        }

        setGenerating(true);
        try {
            const fraudResults: ConstatFraudResults = { A: photoA.result, B: photoB.result };
            const bytes = await generateConstatPdf(data, fraudResults);
            const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `constat-amiable-${data.date || 'sanad'}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            
            // Automatically close modal and notify the parent chat to show estimations
            onClose();
            onDownloadPdf?.(data, photoA.file, photoB.file, fraudResults);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title="Constat Amiable d'Accident Automobile" maxWidth="max-w-6xl">
            <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
                {fraudFlagged && (
                    <div className="bg-sanad-danger/10 border border-sanad-danger/40 rounded-2xl p-4 flex items-start gap-3">
                        <ShieldAlert size={20} className="text-sanad-danger flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-sanad-danger">
                            <p className="font-semibold">Cas suspect — incohérence photo / déclaration détectée</p>
                            <p className="text-xs mt-1 leading-relaxed">
                                Au moins une photo de véhicule ne correspond pas à ce qui a été déclaré (point de choc /
                                dégâts). Ce dossier nécessite un rapport de police (procès-verbal) avant traitement.
                                Vous pouvez le joindre via le trombone dans le chat (« Rapport de police »).
                            </p>
                        </div>
                    </div>
                )}

                <div className="border border-border rounded-2xl p-4 space-y-3">
                    <p className="font-display font-bold text-sm text-primary">Informations générales</p>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="text-xs font-medium text-muted-foreground mb-1 block">1. Date de l&apos;accident</span>
                            <input
                                type="date"
                                value={toInputDate(data.date)}
                                onChange={(e) => setData({ ...data, date: toDisplayDate(e.target.value) })}
                                className="input-base text-sm py-2"
                            />
                        </label>
                        <label className="block">
                            <span className="text-xs font-medium text-muted-foreground mb-1 block">Heure</span>
                            <input
                                type="time"
                                value={toInputTime(data.heure)}
                                onChange={(e) => setData({ ...data, heure: toDisplayTime(e.target.value) })}
                                className="input-base text-sm py-2"
                            />
                        </label>
                    </div>
                    <label className="block">
                        <span className="text-xs font-medium text-muted-foreground mb-1 block flex justify-between items-center">
                            <span>2. Lieu</span>
                            <button
                                type="button"
                                onClick={handleLocate}
                                disabled={locating}
                                className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 font-semibold transition-colors disabled:opacity-50"
                            >
                                {locating ? (
                                    <>
                                        <Loader2 size={10} className="animate-spin" />
                                        Localisation...
                                    </>
                                ) : (
                                    <>
                                        <MapPin size={10} />
                                        Me localiser (GPS / Rue)
                                    </>
                                )}
                            </button>
                        </span>
                        <div className="relative">
                            <input
                                type="text"
                                value={data.lieu}
                                onChange={(e) => setData({ ...data, lieu: e.target.value })}
                                placeholder="Adresse de l'accident, Rue, Ville..."
                                className="input-base text-sm py-2 pr-20"
                            />
                            {data.lieu && data.lieu.includes('google.com/maps') && (
                                <a
                                    href={data.lieu.match(/https:\/\/www\.google\.com\/maps\S*/)?.[0]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] bg-primary text-white px-2 py-1 rounded-md hover:bg-primary/95 transition-colors font-semibold shadow-sm"
                                >
                                    Voir Map
                                </a>
                            )}
                        </div>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="text-xs font-medium text-muted-foreground mb-1 block">3. Blessé(s), même léger</span>
                            <select
                                value={data.blesses}
                                onChange={(e) => setData({ ...data, blesses: e.target.value as 'oui' | 'non' })}
                                className="input-base text-sm py-2"
                            >
                                <option value="non">Non</option>
                                <option value="oui">Oui</option>
                            </select>
                        </label>
                        <label className="block">
                            <span className="text-xs font-medium text-muted-foreground mb-1 block">4. Dégâts autres véhicules</span>
                            <select
                                value={data.degatsAutresVehicules}
                                onChange={(e) => setData({ ...data, degatsAutresVehicules: e.target.value as 'oui' | 'non' })}
                                className="input-base text-sm py-2"
                            >
                                <option value="non">Non</option>
                                <option value="oui">Oui</option>
                            </select>
                        </label>
                    </div>
                    <Field label="Témoins (nom, adresse, tél.)" value={data.temoins} onChange={(v) => setData({ ...data, temoins: v })} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px_1fr] gap-4 items-start">
                    <VehicleForm
                        label="A"
                        data={data.vehiculeA}
                        onChange={(v) => setData({ ...data, vehiculeA: v })}
                        photo={photoA}
                        onPhotoSelected={(f) => handlePhotoSelected('A', f)}
                        signature={data.signatureConducteurA}
                        onSignatureChange={(v) => setData({ ...data, signatureConducteurA: v })}
                    />
                    <CirconstancesGrid
                        circA={data.vehiculeA.circonstances}
                        circB={data.vehiculeB.circonstances}
                        onToggleA={(i, checked) => {
                            const next = [...data.vehiculeA.circonstances];
                            next[i] = checked;
                            setData({ ...data, vehiculeA: { ...data.vehiculeA, circonstances: next } });
                        }}
                        onToggleB={(i, checked) => {
                            const next = [...data.vehiculeB.circonstances];
                            next[i] = checked;
                            setData({ ...data, vehiculeB: { ...data.vehiculeB, circonstances: next } });
                        }}
                    />
                    <VehicleForm
                        label="B"
                        data={data.vehiculeB}
                        onChange={(v) => setData({ ...data, vehiculeB: v })}
                        photo={photoB}
                        onPhotoSelected={(f) => handlePhotoSelected('B', f)}
                        signature={data.signatureConducteurB}
                        onSignatureChange={(v) => setData({ ...data, signatureConducteurB: v })}
                    />
                </div>

                <div className="border border-border rounded-2xl p-4">
                    <LocationPhotoUpload
                        dataUrl={data.lieuPhotoDataUrl}
                        onChange={(dataUrl) => setData((prev) => ({ ...prev, lieuPhotoDataUrl: dataUrl }))}
                    />
                </div>

                <div className="border border-border rounded-2xl p-4">
                    <SketchPad onChange={(dataUrl) => setData((prev) => ({ ...prev, croquisDataUrl: dataUrl }))} />
                </div>

                <div className="border border-border rounded-2xl p-4">
                    <label className="block">
                        <span className="text-xs font-medium text-muted-foreground mb-1 block">13. Observations générales</span>
                        <textarea
                            value={data.observationsGenerales}
                            onChange={(e) => setData({ ...data, observationsGenerales: e.target.value })}
                            rows={3}
                            className="input-base text-sm py-2 resize-none"
                        />
                    </label>
                </div>


            </div>

            <div className="flex gap-3 pt-4 mt-2 border-t border-border">
                <button onClick={onClose} className="btn-secondary flex-1 justify-center text-sm py-2.5">
                    Annuler
                </button>
                <button
                    onClick={handleDownload}
                    disabled={generating || anyAnalyzing}
                    className="btn-primary flex-1 justify-center text-sm py-2.5 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    Télécharger le PDF
                </button>
            </div>
        </Modal>
    );
}
