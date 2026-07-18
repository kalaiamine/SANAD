export type ClaimDocType = 'police' | 'medical' | 'invoice' | 'other';

export interface ExtractedDocumentFields {
    docType: ClaimDocType;
    /** Short human-readable summary of the document, in French. */
    summary: string;
    // Common fields (null when not found in the document)
    date: string | null;
    issuedBy: string | null; // e.g. police station, hospital/clinic, garage name
    referenceNumber: string | null; // report number / invoice number
    // Police report specific
    location: string | null;
    partiesInvolved: string | null;
    // Medical report specific
    patientName: string | null;
    injuryDescription: string | null;
    // Invoice specific
    amount: number | null;
    currency: string | null;
    lineItems: string[] | null;
    confidence: number; // 0-100, the model's own confidence in this extraction
}

export const DOCUMENT_EXTRACTION_SYSTEM_PROMPT = `You are a document-understanding assistant for a Tunisian car-insurance claims platform (SANAD).

You receive raw OCR/PDF-extracted text from a claim-related document (police report / "procès-verbal", medical certificate, or garage repair invoice). The text may be noisy (OCR errors), and may mix French and Arabic.

Your job: classify the document type and extract structured fields as STRICT JSON ONLY (no markdown fences), matching exactly this shape:
{
  "docType": "police" | "medical" | "invoice" | "other",
  "summary": "<one short French sentence describing the document>",
  "date": string | null,
  "issuedBy": string | null,
  "referenceNumber": string | null,
  "location": string | null,
  "partiesInvolved": string | null,
  "patientName": string | null,
  "injuryDescription": string | null,
  "amount": number | null,
  "currency": string | null,
  "lineItems": string[] | null,
  "confidence": number
}

Rules:
- Only fill fields that are actually relevant to the detected docType; leave the others null.
- Never invent data that isn't in the text. If a field isn't present, use null.
- "amount" must be a plain number (no currency symbol, no thousands separator).
- "confidence" is your honest 0-100 estimate of how reliable this extraction is, given OCR noise.
- If the text is too garbled/short to extract anything meaningful, set docType to "other", explain briefly in "summary", and set confidence below 30.`;

export function buildDocumentExtractionUserTurn(rawText: string, fileName: string, hint?: string): string {
    return JSON.stringify({
        fileName,
        hintFromUser: hint || null,
        ocrText: rawText.slice(0, 6000), // keep prompt small/cheap
    });
}
