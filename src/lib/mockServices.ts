// Mock async services simulating real AI APIs
// Each returns a Promise matching realistic future API shapes

export interface OCRResult {
    name: string;
    cin: string;
    birthDate: string;
    expiryDate: string;
}

export interface FaceVerificationResult {
    match: number;
    verified: boolean;
    risk: 'Low' | 'Medium' | 'High';
}

export interface DamageDetectionResult {
    damage: string;
    confidence: number;
}

export interface ChatResponse {
    reply: string;
    isArabic?: boolean;
}

export interface FraudResult {
    score: number;
    risk: 'Low' | 'Medium' | 'High';
}

export interface SettlementResult {
    severity: 'Low' | 'Medium' | 'High';
    summary: string;
    recommendation: 'Approve' | 'Manual Review' | 'Reject';
    amount: number;
    garageName: string;
    invoiceAmount: number;
    invoiceDate: string;
    detectedDamage: string;
    damageConfidence: number;
}

export const mockOCR = (): Promise<OCRResult> =>
    new Promise((resolve) =>
        setTimeout(
            () =>
                resolve({
                    name: 'Ahmed Ali',
                    cin: '12345678',
                    birthDate: '1998-04-03',
                    expiryDate: '2032-04-03',
                }),
            2000
        )
    );

export const mockFaceVerification = (): Promise<FaceVerificationResult> =>
    new Promise((resolve) =>
        setTimeout(
            () =>
                resolve({
                    match: 97,
                    verified: true,
                    risk: 'Low',
                }),
            2500
        )
    );

export const mockDamageDetection = (): Promise<DamageDetectionResult> =>
    new Promise((resolve) =>
        setTimeout(
            () =>
                resolve({
                    damage: 'Windshield Damage',
                    confidence: 96,
                }),
            3000
        )
    );

export const mockChat = (message: string): Promise<ChatResponse> => {
    const isArabic = /[\u0600-\u06FF]/.test(message);
    const replies = isArabic
        ? [
            'أفهم وضعك. هل يمكنك وصف الحادث بمزيد من التفاصيل؟',
            'شكراً على المعلومات. هل تعرضت لأي إصابات؟',
            'هل يمكنك تحميل صور للسيارة؟ سيساعدنا ذلك في تقييم الأضرار.',
            'تم استلام طلبك. سنقوم بمعالجته في أقرب وقت ممكن.',
        ]
        : [
            'Je comprends votre situation. Pouvez-vous me décrire l\'accident en détail?',
            'Merci pour ces informations. Avez-vous subi des blessures?',
            'Pouvez-vous télécharger des photos du véhicule? Cela nous aidera à évaluer les dommages.',
            'Votre déclaration a bien été reçue. Nous allons la traiter dans les plus brefs délais.',
        ];
    const reply = replies[Math.floor(replies.length * 0.5)];
    return new Promise((resolve) =>
        setTimeout(() => resolve({ reply, isArabic }), 1500)
    );
};

export const mockFraud = (): Promise<FraudResult> =>
    new Promise((resolve) =>
        setTimeout(
            () =>
                resolve({
                    score: 3,
                    risk: 'Low',
                }),
            1000
        )
    );

export const mockSettlement = (): Promise<SettlementResult> =>
    new Promise((resolve) =>
        setTimeout(
            () =>
                resolve({
                    severity: 'Medium',
                    summary: 'Windshield crack caused by road debris. Damage is localized to the front windshield with no structural impact.',
                    recommendation: 'Approve',
                    amount: 420,
                    garageName: 'Garage Auto Plus Casablanca',
                    invoiceAmount: 420,
                    invoiceDate: '2026-07-17',
                    detectedDamage: 'Windshield Damage',
                    damageConfidence: 96,
                }),
            2000
        )
    );
