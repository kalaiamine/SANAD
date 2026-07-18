import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { User, toSafeUser } from '@/lib/db/models/User';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.sub);
    if (!user) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user: toSafeUser(user) });
}
