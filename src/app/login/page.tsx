import { Suspense } from 'react';
import LoginPage from './LoginForm';

export default function Page() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Chargement…</div>}>
            <LoginPage />
        </Suspense>
    );
}
