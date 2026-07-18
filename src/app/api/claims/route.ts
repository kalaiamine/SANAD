import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { ClaimReport } from '@/lib/db/models/ClaimReport';
import { getSession } from '@/lib/auth/session';
import type { ClaimReportData } from '@/lib/claims/buildClaimReport';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const report = body.report as ClaimReportData;
        const fnolDurationSec = typeof body.fnolDurationSec === 'number' ? body.fnolDurationSec : undefined;

        if (!report?.settlementMid) {
            return NextResponse.json({ error: 'Rapport invalide.' }, { status: 400 });
        }

        await connectDB();
        const saved = await ClaimReport.create({
            userId: session.sub,
            cin: session.cin,
            dossierId: session.dossierId || session.sub,
            report,
            fnolDurationSec,
        });

        return NextResponse.json({ id: saved._id.toString(), ok: true });
    } catch (err) {
        console.error('Save claim error:', err);
        return NextResponse.json({ error: 'Sauvegarde impossible.' }, { status: 500 });
    }
}

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
    }

    await connectDB();

    if (session.role === 'insurer' || session.role === 'admin') {
        const claims = await ClaimReport.find().sort({ createdAt: -1 }).limit(100).lean();
        return NextResponse.json(claims);
    }

    const claims = await ClaimReport.find({ userId: session.sub }).sort({ createdAt: -1 }).limit(20).lean();
    return NextResponse.json(claims);
}
