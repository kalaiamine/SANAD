export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'result';
    content: string;
    contentAr?: string;
    lang?: 'fr' | 'ar';
    timestamp: string;
    attachments?: {
        id: string;
        name: string;
        type: 'photo' | 'pdf';
        status: 'uploaded' | 'processing' | 'done';
        url?: string;
        alt?: string;
    }[];
}

export interface AIResultCard {
    caseId: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    severityScore: number;
    summary: string;
    summaryAr: string;
    estimatedCostMin: number;
    estimatedCostMax: number;
    nextStep: string;
    nextStepAr: string;
    confidence: number;
}

// Simulated AI response function — backend integration point
// TODO: Replace with real API call to /api/claims/analyze
export const simulateAIResponse = (userMessage: string): Promise<{ message: string; result?: AIResultCard }> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const hasPhoto = userMessage.toLowerCase().includes('photo') || userMessage.toLowerCase().includes('image');
            const hasSevere = userMessage.toLowerCase().includes('fort') || userMessage.toLowerCase().includes('choc') || userMessage.toLowerCase().includes('airbag') || userMessage.toLowerCase().includes('bless');

            if (hasSevere || hasPhoto) {
                resolve({
                    message: "J'ai bien analysé votre situation. Voici le résumé de votre déclaration :",
                    result: {
                        caseId: 'CLM-2026-0848',
                        severity: hasSevere ? 'high' : 'medium',
                        severityScore: hasSevere ? 7 : 5,
                        summary: "Collision signalée avec dommages importants sur l'avant du véhicule. Les photos confirment un impact structurel. Aucune blessure corporelle signalée dans votre message.",
                        summaryAr: "تم الإبلاغ عن تصادم مع أضرار كبيرة في مقدمة السيارة. تؤكد الصور وجود تأثير هيكلي. لم تُبلَّغ عن أي إصابات جسدية في رسالتك.",
                        estimatedCostMin: 12000,
                        estimatedCostMax: 28000,
                        nextStep: "Un expert sera contacté dans les 24 heures. Conservez tous les documents. Votre dossier est maintenant ouvert.",
                        nextStepAr: "سيتم التواصل مع خبير خلال 24 ساعة. احتفظ بجميع الوثائق. ملفك مفتوح الآن.",
                        confidence: 88,
                    },
                });
            } else {
                resolve({
                    message: "Merci pour ces informations. Pouvez-vous me donner plus de détails sur le choc ? Y a-t-il eu des blessures ? Et si possible, partagez des photos des dommages.",
                });
            }
        }, 2200);
    });
};

export const initialMessages: ChatMessage[] = [
    {
        id: 'msg-init-001',
        role: 'assistant',
        content: "Bonjour, je suis SANAD. Je suis là pour vous accompagner dans votre déclaration de sinistre, étape par étape, à votre rythme.",
        contentAr: "مرحباً، أنا سند. أنا هنا لمرافقتك في تقديم بلاغ الحادث، خطوة بخطوة، بالوتيرة التي تناسبك.",
        timestamp: 'maintenant',
    },
    {
        id: 'msg-init-002',
        role: 'assistant',
        content: "Pouvez-vous me décrire ce qui s'est passé ? Par exemple : où étiez-vous, quel type de choc, y a-t-il d'autres véhicules impliqués ?",
        contentAr: "هل يمكنك وصف ما حدث؟ على سبيل المثال: أين كنت، نوع الصدمة، هل هناك مركبات أخرى متورطة؟",
        timestamp: 'maintenant',
    },
];