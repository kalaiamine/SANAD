import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connect';
import { User } from '@/lib/db/models/User';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ cin: string }> }) {
    const { cin } = await params;
    if (!cin?.trim()) {
        return NextResponse.json({ registered: false });
    }

    try {
        await connectDB();
        const user = await User.findOne({ cin: cin.trim() });
        if (!user) {
            return NextResponse.json({ registered: false });
        }
        return NextResponse.json({
            registered: true,
            name: user.profile.fullNameLatin || user.profile.fullNameArabic || user.email,
        });
    } catch {
        return NextResponse.json({ registered: false });
    }
}
