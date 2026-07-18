import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { User, toSafeUser } from '@/lib/db/models/User';
import { verifyPassword } from '@/lib/auth/password';
import { createSessionToken, sessionCookieOptions } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, cin, password } = body;

        if (!password || (!email && !cin)) {
            return NextResponse.json({ error: 'Email ou CIN et mot de passe requis.' }, { status: 400 });
        }

        await connectDB();

        // Trim everything: copy-pasted credentials often carry an invisible
        // trailing space/newline which must not cause a false "bad credentials".
        const query = email ? { email: String(email).trim().toLowerCase() } : { cin: String(cin).trim() };
        const user = await User.findOne(query).select('+passwordHash');
        if (!user || !(await verifyPassword(String(password).trim(), user.passwordHash))) {
            return NextResponse.json({ error: 'Identifiants invalides.' }, { status: 401 });
        }

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
        console.error('Login error:', err);
        return NextResponse.json({ error: 'Connexion impossible.' }, { status: 500 });
    }
}
