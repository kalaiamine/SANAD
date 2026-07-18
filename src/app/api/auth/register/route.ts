import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { User, toSafeUser } from '@/lib/db/models/User';
import { hashPassword } from '@/lib/auth/password';
import { createSessionToken, sessionCookieOptions } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password, cin, dossierId, profile } = body;

        if (!email || !password || !cin || !dossierId) {
            return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 });
        }
        if (String(password).length < 8) {
            return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' }, { status: 400 });
        }

        await connectDB();

        const cleanEmail = String(email).trim().toLowerCase();
        const existing = await User.findOne({ $or: [{ email: cleanEmail }, { cin: String(cin).trim() }] });
        if (existing) {
            return NextResponse.json({ error: 'Un compte existe déjà avec cet email ou ce CIN.' }, { status: 409 });
        }

        const passwordHash = await hashPassword(String(password).trim());
        const user = await User.create({
            email: cleanEmail,
            passwordHash,
            cin: String(cin).trim(),
            dossierId,
            role: 'client',
            profile: profile || {},
        });

        const token = await createSessionToken({
            sub: user._id.toString(),
            email: user.email,
            role: user.role,
            cin: user.cin,
            name: user.profile.fullNameLatin || user.profile.fullNameArabic || user.email,
            dossierId: user.dossierId,
        });

        const res = NextResponse.json({ user: toSafeUser(user) });
        res.cookies.set(sessionCookieOptions(token));
        return res;
    } catch (err) {
        console.error('Register error:', err);
        return NextResponse.json({ error: 'Inscription impossible.' }, { status: 500 });
    }
}
