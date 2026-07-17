'use client';

import React from 'react';
import Modal from '@/components/ui/Modal';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


type ActionType = 'approve' | 'request_info' | 'reject' | null;

interface ActionConfirmModalProps {
    action: ActionType;
    claimId: string;
    onConfirm: () => void;
    onClose: () => void;
}

const actionConfig: Record<NonNullable<ActionType>, {
    title: string;
    description: string;
    confirmLabel: string;
    confirmClass: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    iconClass: string;
}> = {
    approve: {
        title: 'Approuver le dossier',
        description: 'Vous allez approuver ce dossier de sinistre. L\'assuré sera notifié et le processus de remboursement sera initié.',
        confirmLabel: 'Confirmer l\'approbation',
        confirmClass: 'btn-primary',
        icon: CheckCircle,
        iconClass: 'text-severity-low',
    },
    request_info: {
        title: 'Demander des informations',
        description: 'Une demande d\'informations complémentaires sera envoyée à l\'assuré. Le dossier sera mis en attente jusqu\'à réception.',
        confirmLabel: 'Envoyer la demande',
        confirmClass: 'btn-secondary',
        icon: Info,
        iconClass: 'text-secondary',
    },
    reject: {
        title: 'Rejeter le dossier',
        description: 'Cette action est irréversible. Le dossier sera rejeté et l\'assuré sera notifié avec le motif de refus. Êtes-vous certain de vouloir continuer ?',
        confirmLabel: 'Confirmer le rejet',
        confirmClass: 'btn-danger',
        icon: AlertTriangle,
        iconClass: 'text-severity-critical',
    },
};

export default function ActionConfirmModal({ action, claimId, onConfirm, onClose }: ActionConfirmModalProps) {
    if (!action) return null;

    const config = actionConfig[action];
    const Icon = config.icon;

    return (
        <Modal open={!!action} onClose={onClose} title={config.title}>
            <div className="flex flex-col gap-5">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                        <Icon size={20} className={config.iconClass} />
                    </div>
                    <div>
                        <p className="text-sm text-foreground leading-relaxed">{config.description}</p>
                        <p className="text-xs text-muted-foreground mt-2 font-mono">Dossier : {claimId}</p>
                    </div>
                </div>

                {action === 'request_info' && (
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                            Message à l&apos;assuré
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Précisez les informations manquantes..."
                            className="input-base resize-none"
                            defaultValue="Merci de fournir le constat amiable signé par les deux parties ainsi que des photos supplémentaires de la scène."
                        />
                    </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                    <button onClick={onClose} className="btn-secondary">
                        Annuler
                    </button>
                    <button onClick={onConfirm} className={config.confirmClass}>
                        {config.confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
}