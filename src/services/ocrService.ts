// OCR Service Client - Connects to the FastAPI OCR Microservice at localhost:8001

const OCR_API_URL = process.env.NEXT_PUBLIC_OCR_API_URL || 'http://localhost:8001';

// ─── TypeScript Interfaces ───────────────────────────────────────────────────

export interface OCRRawResponse {
    success: boolean;
    documentType: 'identity_card' | 'invoice' | 'unknown';
    confidence: number;
    rawText: string[];
    extractedData: Record<string, unknown>;
}

export interface IdentityCardData {
    fullNameArabic: string;
    fullNameLatin: string;
    cin: string;
    birthDate: string;
    expiryDate: string;
    nationality?: string;
    birthPlace?: string;
    fatherName?: string;
}

export interface InvoiceData {
    garage: string;
    amount: number;
    currency: string;
    date: string;
}

export interface OCRIdentityResult {
    success: boolean;
    documentType: 'identity_card';
    confidence: number;
    rawText: string[];
    extractedData: IdentityCardData;
}

export interface OCRInvoiceResult {
    success: boolean;
    documentType: 'invoice';
    confidence: number;
    rawText: string[];
    extractedData: InvoiceData;
}

export interface OCRUnknownResult {
    success: boolean;
    documentType: 'unknown';
    confidence: number;
    rawText: string[];
    extractedData: Record<string, unknown>;
}

export type OCRResult = OCRIdentityResult | OCRInvoiceResult | OCRUnknownResult;

export interface OCRError {
    success: false;
    error: string;
}

// ─── Service Functions ───────────────────────────────────────────────────────

/**
 * Upload a document image to the OCR service and receive structured data.
 */
export async function uploadDocument(file: File): Promise<OCRResult> {
    const formData = new FormData();
    formData.append('file', file);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout (OCR typically completes in ~2-5s)

    try {
        const response = await fetch(`${OCR_API_URL}/ocr`, {
            method: 'POST',
            body: formData,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(
                errorBody.detail || `OCR service returned ${response.status}`
            );
        }

        const data: OCRRawResponse = await response.json();

        if (!data.success) {
            throw new Error('OCR processing returned unsuccessful result');
        }

        return data as OCRResult;
    } catch (error: unknown) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error('OCR request timed out. Please try again.');
        }
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error(
                'Cannot connect to OCR service. Make sure the service is running on port 8001.'
            );
        }
        throw error;
    }
}

/**
 * Check if the OCR service is running and healthy.
 */
export async function checkOCRHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${OCR_API_URL}/`, { method: 'GET' });
        if (!response.ok) return false;
        const data = await response.json();
        return data.status === 'running';
    } catch {
        return false;
    }
}

export interface FaceMatchResult {
    matched: boolean;
    confidence: number;
    liveness: number;
    error: string | null;
}

/**
 * Compare a captured selfie with the ID card photo.
 */
export async function compareSelfieToID(selfie: File, idCard: File): Promise<FaceMatchResult> {
    const formData = new FormData();
    formData.append('selfie', selfie);
    formData.append('id_card', idCard);

    const response = await fetch(`${OCR_API_URL}/face-match`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || 'Face matching failed');
    }

    return response.json();
}

export interface AMLFactor {
    factor: string;
    description: string;
    weight: number;
    severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

export interface AMLHit {
    name: string;
    name_ar: string;
    similarity: number;
    source: string;
    reason: string;
    type: string;
    matched_on: string;
}

export interface AMLScreenResult {
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    risk_score: number;
    sanctions_hits: AMLHit[];
    pep_hits: AMLHit[];
    factors: AMLFactor[];
    screened_at: string;
    legal_basis: string;
}

/**
 * Screen identity data against AML sanctions & PEP list.
 */
export async function screenAML(identity: {
    name_arabic: string;
    name_latin: string;
    cin: string;
    birth_date: string;
    birth_place: string;
}): Promise<AMLScreenResult> {
    const response = await fetch(`${OCR_API_URL}/aml-screen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(identity),
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || 'AML screening failed');
    }

    return response.json();
}

export interface AuditStep {
    step: string;
    timestamp: string;
    status: string;
    metadata?: Record<string, any>;
}

export interface AuditDossier {
    dossierId: string;
    createdAt: string;
    updatedAt: string;
    identity: Record<string, any>;
    steps: AuditStep[];
    riskAssessment?: {
        level: string;
        score: number;
    } | null;
    finalStatus: 'IN_PROGRESS' | 'APPROVED';
}

/**
 * Create a new audit trail KYC dossier.
 */
export async function createAuditDossier(): Promise<AuditDossier> {
    const response = await fetch(`${OCR_API_URL}/audit/create`, {
        method: 'POST',
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || 'Failed to create audit dossier');
    }

    return response.json();
}

/**
 * Add a verification step to an existing audit dossier.
 */
export async function addAuditStep(
    dossierId: string,
    stepName: string,
    status: string,
    metadata: Record<string, any> = {}
): Promise<AuditDossier> {
    const response = await fetch(`${OCR_API_URL}/audit/step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            dossier_id: dossierId,
            step_name: stepName,
            status,
            metadata,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || 'Failed to add audit step');
    }

    return response.json();
}

/**
 * Update identity information in the audit dossier.
 */
export async function updateAuditIdentity(
    dossierId: string,
    identity: Record<string, any>
): Promise<AuditDossier> {
    const response = await fetch(`${OCR_API_URL}/audit/identity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            dossier_id: dossierId,
            identity,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || 'Failed to update audit identity');
    }

    return response.json();
}

/**
 * Retrieve a KYC dossier audit trail by ID.
 */
export async function getAuditDossier(dossierId: string): Promise<AuditDossier> {
    const response = await fetch(`${OCR_API_URL}/audit/get/${dossierId}`);

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || 'Failed to retrieve audit dossier');
    }

    return response.json();
}

/**
 * Send email confirmation with extracted kyc details.
 */
export async function sendKYCConfirmationEmail(email: string, userInfo: Record<string, any>): Promise<boolean> {
    const response = await fetch(`${OCR_API_URL}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userInfo }),
    });

    if (!response.ok) {
        return false;
    }

    const data = await response.json();
    return data.success;
}

