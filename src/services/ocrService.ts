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
