/**
 * Creates the default insurer account for the dashboard.
 * Run: npm run seed:insurer
 * Requires dev server on http://localhost:3000 (or set SANAD_URL).
 */
const base = process.env.SANAD_URL || 'http://localhost:3000';
const secret = process.env.SETUP_SECRET || 'sanad-setup-2026';

const res = await fetch(`${base}/api/auth/setup-insurer`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-setup-secret': secret,
    },
    body: JSON.stringify({}),
});

const data = await res.json();
if (!res.ok) {
    console.error('Seed failed:', data);
    process.exit(1);
}

console.log('Insurer account ready:', data.message);
console.log('Email:', data.user?.email, '| Role:', data.user?.role);
