import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { User, toSafeUser } from '@/lib/db/models/User';
import { hashPassword } from '@/lib/auth/password';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

/** One-time setup: create insurer account. Requires SETUP_SECRET header. */
export async function POST(req: NextRequest) {
    const secret = req.headers.get('x-setup-secret');
    if (!secret || secret !== process.env.SETUP_SECRET) {
        return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
    }

    const body = await req.json();
    const email = String(body.email || process.env.INSURER_EMAIL || 'insurer@sanad.tn');
    const password = String(body.password || process.env.INSURER_PASSWORD || 'SanadInsurer2026!');
    const cin = String(body.cin || 'INSURER-001');

    await connectDB();
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
        user.role = 'insurer';
        await user.save();
        return NextResponse.json({ user: toSafeUser(user), message: 'Compte assureur mis à jour.' });
    }

    user = await User.create({
        email: email.toLowerCase(),
        passwordHash: await hashPassword(password),
        cin,
        dossierId: 'INSURER-SYSTEM',
        role: 'insurer',
        profile: { fullNameLatin: 'Assureur SANAD', fullNameArabic: 'SANAD', birthDate: '', birthPlace: '', fatherName: '', phone: '', address: '' },
    });

    return NextResponse.json({ user: toSafeUser(user), message: 'Compte assureur créé.' });
}

export async function GET() {
    const session = await getSession();
    if (!session || (session.role !== 'insurer' && session.role !== 'admin')) {
        return NextResponse.json({ configured: false });
    }
    return NextResponse.json({ configured: true, email: session.email });
}
