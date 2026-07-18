import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.OCR_SERVICE_URL || 'http://localhost:8001';

export async function GET() {
    try {
        const res = await fetch(`${BACKEND_URL}/audit/list`, {
            cache: 'no-store',
        });
        if (!res.ok) {
            return NextResponse.json([], { status: res.status });
        }
        const data = await res.json();
        return NextResponse.json(data);
    } catch (err) {
        console.error('Failed to fetch dossiers from backend:', err);
        return NextResponse.json([], { status: 502 });
    }
}
