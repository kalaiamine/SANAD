import React from 'react';
import { Shield } from 'lucide-react';

export default function TypingIndicator() {
    return (
        <div className="flex gap-3 message-bubble-enter">
            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary flex items-center justify-center mt-0.5">
                <Shield size={16} className="text-primary-foreground" strokeWidth={2} />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground mr-1">SANAD analyse</span>
                    {[0, 1, 2]?.map((i) => (
                        <span
                            key={`dot-${i}`}
                            className="w-2 h-2 rounded-full bg-secondary typing-dot inline-block"
                            style={{ animationDelay: `${i * 0.16}s` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}