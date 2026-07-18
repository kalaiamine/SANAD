import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { UserRole } from '@/lib/db/models/User';

export const SESSION_COOKIE = 'sanad_session';
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
    sub: string;
    email: string;
    role: UserRole;
    cin: string;
    name: string;
    dossierId: string;
}

function getSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET is required in production.');
    }
    return new TextEncoder().encode(secret || 'sanad-dev-secret-change-in-production');
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${SESSION_TTL}s`)
        .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getSecret());
        if (!payload.sub || !payload.email || !payload.role) return null;
        return {
            sub: String(payload.sub),
            email: String(payload.email),
            role: payload.role as UserRole,
            cin: String(payload.cin || ''),
            name: String(payload.name || ''),
            dossierId: String(payload.dossierId || ''),
        };
    } catch {
        return null;
    }
}

export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return verifySessionToken(token);
}

export function sessionCookieOptions(token: string) {
    return {
        name: SESSION_COOKIE,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        maxAge: SESSION_TTL,
    };
}
