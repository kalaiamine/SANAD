import React from 'react';
import { Shield, MessageSquare } from 'lucide-react';

export default function ChatEntryState() {
    return (
        <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
            {/* Signature visual moment — the protective shield with calm gradient */}
            <div className="relative mb-8">
                <div className="w-24 h-24 rounded-3xl bg-primary flex items-center justify-center shadow-elevated">
                    <Shield size={44} className="text-primary-foreground" strokeWidth={1.5} />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
                    <MessageSquare size={16} className="text-primary-foreground" />
                </div>
            </div>
            <h1 className="font-display text-3xl font-semibold text-foreground mb-3 text-balance">
                Nous sommes là pour vous
            </h1>
            <p className="text-muted-foreground text-base max-w-sm mb-2 text-balance">
                Décrivez l&apos;accident dans vos propres mots — en français ou en arabe.
                SANAD s&apos;occupe du reste.
            </p>
            <p className="rtl-text text-muted-foreground text-sm max-w-xs text-balance">
                صف الحادث بكلماتك الخاصة — بالفرنسية أو العربية. سند يهتم بالباقي.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md w-full">
                {[
                    { icon: '🗣️', label: 'Décrivez en langage naturel' },
                    { icon: '📷', label: 'Partagez vos photos' },
                    { icon: '📋', label: 'Recevez un résumé instantané' },
                ]?.map((step, i) => (
                    <div key={`entry-step-${i}`} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border">
                        <span className="text-2xl">{step?.icon}</span>
                        <p className="text-xs text-muted-foreground text-center leading-tight">{step?.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}