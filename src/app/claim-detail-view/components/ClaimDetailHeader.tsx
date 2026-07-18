import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Car, MapPin, Calendar, Phone, Mail, User } from 'lucide-react';
import { Claim } from '@/data/mockClaims';
import SeverityBadge from '@/components/ui/SeverityBadge';
import StatusBadge from '@/components/ui/StatusBadge';

interface ClaimDetailHeaderProps {
    claim: Claim;
    onStatusAction: (action: 'approve' | 'request_info' | 'reject') => void;
}

export default function ClaimDetailHeader({ claim, onStatusAction }: ClaimDetailHeaderProps) {
    return (
        <div className="bg-card border-b border-border px-6 lg:px-8 xl:px-10 2xl:px-16 py-6">
            <div className="max-w-screen-2xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 mb-5">
                    <Link
                        href="/insurer-dashboard"
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg px-1"
                    >
                        <ArrowLeft size={15} />
                        Tableau de bord
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-sm font-medium text-foreground font-mono">{claim.id}</span>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Left — claim identity */}
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <h1 className="text-2xl font-semibold text-foreground">{claim.id}</h1>
                            <SeverityBadge level={claim.severity} score={claim.severityScore} size="md" />
                            <StatusBadge status={claim.status} />
                        </div>

                        {/* Meta row */}
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <User size={14} />
                                <span className="font-medium text-foreground">{claim.policyholder}</span>
                                <span className="text-xs">·</span>
                                <span className="font-mono text-xs">{claim.policyNumber}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Car size={14} />
                                <span>{claim.vehicle}</span>
                                <span className="font-mono text-xs">({claim.licensePlate})</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <MapPin size={14} />
                                <span>{claim.incidentLocation}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Calendar size={14} />
                                <span>{claim.incidentDate}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Phone size={14} />
                                <span>{claim.phone}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Mail size={14} />
                                <span>{claim.email}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right — actions */}
                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                        {claim.status !== 'approved' && claim.status !== 'settled' && claim.status !== 'rejected' && (
                            <>
                                <button
                                    onClick={() => onStatusAction('approve')}
                                    className="btn-primary"
                                >
                                    Approuver le dossier
                                </button>
                                <button
                                    onClick={() => onStatusAction('request_info')}
                                    className="btn-secondary"
                                >
                                    Demander des infos
                                </button>
                                <button
                                    onClick={() => onStatusAction('reject')}
                                    className="btn-danger"
                                >
                                    Rejeter
                                </button>
                            </>
                        )}
                        {(claim.status === 'approved' || claim.status === 'settled') && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-severity-low-bg border border-[var(--severity-low-border)] text-severity-low text-sm font-medium">
                                <span className="w-2 h-2 rounded-full bg-severity-low" />
                                Dossier {claim.status === 'settled' ? 'réglé' : 'approuvé'}
                            </div>
                        )}
                        {claim.status === 'rejected' && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-severity-critical-bg border border-[var(--severity-critical-border)] text-severity-critical text-sm font-medium">
                                <span className="w-2 h-2 rounded-full bg-severity-critical" />
                                Dossier rejeté
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}