'use client';

import React, { useState, useRef, useEffect } from 'react';
import ChatBubble from './ChatBubble';
import TypingIndicator from './TypingIndicator';
import AIResultCardComponent from './AIResultCard';
import ChatInputBar from './ChatInputBar';
import ChatEntryState from './ChatEntryState';
import { ChatMessage, AIResultCard, initialMessages, simulateAIResponse } from '@/data/mockChat';

interface PendingFile {
    id: string;
    name: string;
    type: 'photo' | 'pdf';
}

export default function ChatView() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [aiResult, setAiResult] = useState<AIResultCard | null>(null);
    const [hasStarted, setHasStarted] = useState(false);
    const [msgCounter, setMsgCounter] = useState(100);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Initialize with a small delay for the entry state effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setMessages(initialMessages);
            setHasStarted(false);
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping, aiResult]);

    const handleSend = async (text: string, files: PendingFile[]) => {
        if (!hasStarted) setHasStarted(true);
        const newCounter = msgCounter + 1;
        setMsgCounter(newCounter);

        // Build user message
        const userMsg: ChatMessage = {
            id: `msg-${newCounter}`,
            role: 'user',
            content: text || (files.length > 0 ? `${files.length} fichier(s) joint(s)` : ''),
            timestamp: new Date().toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' }),
            attachments: files.map((f) => ({
                id: f.id,
                name: f.name,
                type: f.type,
                status: 'processing' as const,
            })),
        };

        setMessages((prev) => [...prev, userMsg]);
        setIsTyping(true);

        // Simulate file upload delay then mark as done
        if (files.length > 0) {
            await new Promise((r) => setTimeout(r, 800));
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === userMsg.id
                        ? {
                            ...m,
                            attachments: m.attachments?.map((a) => ({
                                ...a,
                                status: 'done' as const,
                                url: a.type === 'photo' ? 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop' : undefined,
                                alt: a.type === 'photo' ? 'Photo du véhicule endommagé téléchargée' : undefined,
                            })),
                        }
                        : m
                )
            );
        }

        // Get AI response
        // TODO: Replace simulateAIResponse with real API call
        const response = await simulateAIResponse(text);
        setIsTyping(false);

        const aiMsg: ChatMessage = {
            id: `msg-${newCounter + 1}`,
            role: response.result ? 'result' : 'assistant',
            content: response.message,
            timestamp: new Date().toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, aiMsg]);

        if (response.result) {
            setAiResult(response.result);
        }

        setMsgCounter(newCounter + 2);
    };

    const showEntryState = messages.length === 0;

    return (
        <div className="flex flex-col h-[calc(100vh-64px)]">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto scrollbar-thin px-4 sm:px-6 lg:px-8">
                {showEntryState ? (
                    <ChatEntryState />
                ) : (
                    <div className="max-w-2xl mx-auto py-6 flex flex-col gap-4">
                        {messages.map((msg, i) => (
                            <React.Fragment key={msg.id}>
                                <ChatBubble message={msg} isNew={i >= initialMessages.length} />
                            </React.Fragment>
                        ))}

                        {isTyping && <TypingIndicator />}

                        {aiResult && !isTyping && (
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary flex items-center justify-center mt-0.5 opacity-0">
                                    {/* spacer */}
                                </div>
                                <AIResultCardComponent result={aiResult} />
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>
                )}
            </div>

            {/* Input bar */}
            <ChatInputBar onSend={handleSend} disabled={isTyping} />
        </div>
    );
}