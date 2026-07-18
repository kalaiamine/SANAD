'use client';

import React, { useState, useRef } from 'react';
import { Paperclip, Send, X, ImageIcon, FileText, Shield } from 'lucide-react';

interface PendingFile {
    id: string;
    name: string;
    type: 'photo' | 'pdf';
}

interface ChatInputBarProps {
    onSend: (text: string, files: PendingFile[]) => void;
    disabled?: boolean;
}

export default function ChatInputBar({ onSend, disabled }: ChatInputBarProps) {
    const [input, setInput] = useState('');
    const [files, setFiles] = useState<PendingFile[]>([]);
    const [showUploadMenu, setShowUploadMenu] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed && files.length === 0) return;
        onSend(trimmed, files);
        setInput('');
        setFiles([]);
        setShowUploadMenu(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleAddFile = (type: 'photo' | 'pdf') => {
        const newFile: PendingFile = {
            id: `file-${Date.now()}`,
            name: type === 'photo' ? 'Photo_vehicule.jpg' : 'Rapport_police.pdf',
            type,
        };
        setFiles((prev) => [...prev, newFile]);
        setShowUploadMenu(false);
    };

    const handleRemoveFile = (id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    return (
        <div className="bg-card border-t border-border flex-shrink-0 px-4 sm:px-6 lg:px-8 py-3">
            <div className="max-w-2xl mx-auto">
                {/* Pending files preview */}
                {files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {files.map((file) => (
                            <div key={file.id} className="flex items-center gap-1.5 bg-muted border border-border px-3 py-1 rounded-xl text-xs text-foreground">
                                {file.type === 'photo' ? <ImageIcon size={14} className="text-primary" /> : <FileText size={14} className="text-primary" />}
                                <span className="truncate max-w-[150px]">{file.name}</span>
                                <button onClick={() => handleRemoveFile(file.id)} className="text-muted-foreground hover:text-foreground">
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Upload menu */}
                {showUploadMenu && (
                    <div className="bg-card border border-border rounded-2xl p-3 mb-3 shadow-elevated fade-in-up">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Joindre un document</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleAddFile('photo')}
                                className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-muted transition-colors text-left"
                            >
                                <ImageIcon size={20} className="text-primary" />
                                <span className="text-xs text-muted-foreground">Photos du véhicule</span>
                            </button>
                            <button
                                onClick={() => handleAddFile('pdf')}
                                className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-muted transition-colors text-left"
                            >
                                <FileText size={20} className="text-primary" />
                                <span className="text-xs text-muted-foreground">Rapport de police / PDF</span>
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex items-end gap-2">
                    <button
                        onClick={() => setShowUploadMenu(!showUploadMenu)}
                        className={`btn-ghost p-2.5 flex-shrink-0 ${showUploadMenu ? 'bg-accent text-primary' : ''}`}
                        disabled={disabled}
                    >
                        {showUploadMenu ? <X size={20} /> : <Paperclip size={20} />}
                    </button>
                    <div className="flex-1 relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Décrivez votre accident... / صف حادثك..."
                            rows={1}
                            disabled={disabled}
                            className="input-base resize-none min-h-[44px] max-h-32 py-3 pr-12 leading-relaxed"
                        />
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={disabled || (!input.trim() && files.length === 0)}
                        className="btn-primary p-2.5 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}