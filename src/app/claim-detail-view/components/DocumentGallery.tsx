'use client';

import React, { useState } from 'react';
import { Claim, ClaimDocument } from '@/data/mockClaims';
import AppImage from '@/components/ui/AppImage';
import { ImageIcon, FileText, X, ZoomIn } from 'lucide-react';

interface DocumentGalleryProps {
    claim: Claim;
}

export default function DocumentGallery({ claim }: DocumentGalleryProps) {
    const [lightboxDoc, setLightboxDoc] = useState<ClaimDocument | null>(null);

    const photos = claim.documents.filter((d) => d.type === 'photo');
    const docs = claim.documents.filter((d) => d.type !== 'photo');

    return (
        <div className="card-base p-6">
            <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
                    <ImageIcon size={16} className="text-primary" />
                </div>
                <div>
                    <p className="section-label">Pièces jointes</p>
                    <h2 className="text-base font-semibold text-foreground">
                        Documents et photos
                        <span className="ml-2 text-sm font-normal text-muted-foreground">({claim.documents.length})</span>
                    </h2>
                </div>
            </div>

            {/* Photos grid */}
            {photos.length > 0 && (
                <div className="mb-5">
                    <p className="section-label mb-3">Photos du sinistre</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {photos.map((doc) => (
                            <button
                                key={`photo-${doc.id}`}
                                onClick={() => setLightboxDoc(doc)}
                                className="relative group aspect-video rounded-xl overflow-hidden border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label={`Voir ${doc.name}`}
                            >
                                <AppImage
                                    src={doc.url}
                                    alt={doc.alt}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                />
                                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-all duration-200 flex items-center justify-center">
                                    <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/60 to-transparent px-2 py-1.5">
                                    <p className="text-xs text-white truncate">{doc.name}</p>
                                    <p className="text-xs text-white/70">{doc.uploadedAt}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Other documents */}
            {docs.length > 0 && (
                <div>
                    <p className="section-label mb-3">Autres documents</p>
                    <div className="space-y-2">
                        {docs.map((doc) => (
                            <button
                                key={`doc-${doc.id}`}
                                onClick={() => setLightboxDoc(doc)}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-muted transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                                    <FileText size={16} className="text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {doc.type === 'constat' ? 'Constat amiable' : 'Document'} · {doc.uploadedAt}
                                    </p>
                                </div>
                                <ZoomIn size={14} className="text-muted-foreground flex-shrink-0" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {claim.documents.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                        <ImageIcon size={20} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Aucun document joint</p>
                    <p className="text-xs text-muted-foreground mt-1">L&apos;assuré n&apos;a pas encore téléchargé de fichiers.</p>
                </div>
            )}

            {/* Lightbox */}
            {lightboxDoc && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/70 backdrop-blur-sm"
                    onClick={() => setLightboxDoc(null)}
                >
                    <div
                        className="relative bg-card rounded-2xl border border-border shadow-elevated overflow-hidden max-w-3xl w-full card-reveal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                            <div>
                                <p className="text-sm font-semibold text-foreground">{lightboxDoc.name}</p>
                                <p className="text-xs text-muted-foreground">{lightboxDoc.uploadedAt}</p>
                            </div>
                            <button
                                onClick={() => setLightboxDoc(null)}
                                className="btn-ghost p-2 rounded-xl"
                                aria-label="Fermer"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="relative w-full aspect-video bg-muted">
                            <AppImage
                                src={lightboxDoc.url}
                                alt={lightboxDoc.alt}
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 100vw, 768px"
                                priority
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}