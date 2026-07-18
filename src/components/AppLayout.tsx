import React from 'react';
import AppTopbar from '@/components/AppTopbar';

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <AppTopbar />
            <main className="flex-1 flex flex-col">
                {children}
            </main>
        </div>
    );
}