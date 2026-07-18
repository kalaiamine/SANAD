import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { SESSION_COOKIE } from '@/lib/auth/session';

const INSURER_PATHS = ['/dashboard', '/api/dossiers'];
const CLIENT_PATHS = ['/chat', '/historique'];
const AUTH_PATHS = ['/login'];

function getSecret(): Uint8Array {
    return new TextEncoder().encode(process.env.JWT_SECRET || 'sanad-dev-secret-change-in-production');
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get(SESSION_COOKIE)?.value;

    const isInsurerPath = INSURER_PATHS.some((p) => pathname.startsWith(p));
    const isClientPath = CLIENT_PATHS.some((p) => pathname.startsWith(p));
    const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

    if (isAuthPath) {
        if (token) {
            try {
                const { payload } = await jwtVerify(token, getSecret());
                const role = String(payload.role || 'client');
                const dest = role === 'insurer' || role === 'admin' ? '/dashboard' : '/chat';
                return NextResponse.redirect(new URL(dest, request.url));
            } catch {
                // invalid token — allow login page
            }
        }
        return NextResponse.next();
    }

    if (!isInsurerPath && !isClientPath) {
        return NextResponse.next();
    }

    if (!token) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Non autorisé — connexion requise.' }, { status: 401 });
        }
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
    }

    try {
        const { payload } = await jwtVerify(token, getSecret());
        const role = String(payload.role || 'client');

        if (isInsurerPath && role !== 'insurer' && role !== 'admin') {
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ error: 'Accès réservé aux assureurs.' }, { status: 403 });
            }
            return NextResponse.redirect(new URL('/chat', request.url));
        }
    } catch {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Session invalide.' }, { status: 401 });
        }
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/chat/:path*', '/historique/:path*', '/login', '/api/dossiers/:path*'],
};
