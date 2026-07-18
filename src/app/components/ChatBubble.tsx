import React from 'react';
import { Shield } from 'lucide-react';
import { ChatMessage } from '@/data/mockChat';
import AppImage from '@/components/ui/AppImage';

interface ChatBubbleProps {
    message: ChatMessage;
    isNew?: boolean;
}

export default function ChatBubble({ message, isNew = false }: ChatBubbleProps) {
    const isUser = message.role === 'user';

    return (
        <div
            className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} ${isNew ? 'message-bubble-enter' : ''}`}
        >
            {/* Avatar */}
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary flex items-center justify-center mt-0.5">
                    <Shield size={16} className="text-primary-foreground" strokeWidth={2} />
                </div>
            )}

            <div className={`flex flex-col gap-1 max-w-[80%] sm:max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
                {/* Main bubble */}
                <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-card border border-border text-foreground rounded-tl-sm shadow-sm'
                        }`}
                >
                    <p>{message.content}</p>
                    {message.contentAr && !isUser && (
                        <p className="rtl-text text-xs mt-2 opacity-60 border-t border-border pt-2">
                            {message.contentAr}
                        </p>
                    )}
                </div>

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                        {message.attachments.map((att) => (
                            <div
                                key={`att-${att.id}`}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border ${att.status === 'done'
                                    ? 'bg-accent text-primary border-[var(--secondary)]'
                                    : att.status === 'processing' ? 'bg-muted text-muted-foreground border-border animate-pulse' : 'bg-muted text-muted-foreground border-border'
                                    }`}
                            >
                                {att.type === 'photo' && att.url && att.status === 'done' ? (
                                    <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0">
                                        <AppImage src={att.url} alt={att.alt || att.name} width={24} height={24} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <span>{att.type === 'photo' ? '📷' : '📄'}</span>
                                )}
                                <span className="max-w-[120px] truncate">{att.name}</span>
                                {att.status === 'processing' && <span className="ml-1">...</span>}
                                {att.status === 'done' && <span className="text-severity-low">✓</span>}
                            </div>
                        ))}
                    </div>
                )}

                {/* Timestamp */}
                <span className="text-xs text-muted-foreground tabular-nums">{message.timestamp}</span>
            </div>
        </div>
    );
}
