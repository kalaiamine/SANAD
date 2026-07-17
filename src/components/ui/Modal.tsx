'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) {
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (open) {
            document.addEventListener('keydown', handleKey);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />
            <div className={`relative bg-card rounded-2xl border border-border shadow-elevated w-full ${maxWidth} card-reveal`}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 id="modal-title" className="text-base font-semibold text-foreground">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="btn-ghost p-1.5 rounded-lg"
                        aria-label="Fermer"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}