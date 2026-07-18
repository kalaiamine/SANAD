import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { ClaimReportData } from '@/lib/claims/buildClaimReport';

export interface IClaimReport extends Document {
    userId: mongoose.Types.ObjectId;
    cin: string;
    dossierId: string;
    report: ClaimReportData;
    fnolDurationSec?: number;
    createdAt: Date;
    updatedAt: Date;
}

const ClaimReportSchema = new Schema<IClaimReport>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        cin: { type: String, required: true, index: true },
        dossierId: { type: String, default: '' },
        report: { type: Schema.Types.Mixed, required: true },
        fnolDurationSec: { type: Number },
    },
    { timestamps: true }
);

export const ClaimReport: Model<IClaimReport> =
    mongoose.models.ClaimReport ?? mongoose.model<IClaimReport>('ClaimReport', ClaimReportSchema);
