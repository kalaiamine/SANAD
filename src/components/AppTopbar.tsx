'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, MessageSquare, LayoutDashboard, Home, UserPlus, LogIn, LogOut, History } from 'lucide-react';

const baseNavItems = [
    { label: 'Accueil', href: '/', icon: Home },
    { label: 'Déclarer', href: '/register', icon: UserPlus },
    { label: 'Chat', href: '/chat', icon: MessageSquare },
];

export default function AppTopbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/auth/me')
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data?.user) {
                    setUserName(data.user.profile?.fullNameLatin || data.user.email);
                    setRole(data.user.role || 'client');
                } else {
                    setRole(null);
                }
            })
            .catch(() => {});
    }, [pathname]);

    // Tableau de bord réservé à l'assureur ; l'assuré voit son historique de sinistres
    const navItems = [
        ...baseNavItems,
        ...(role === 'insurer' || role === 'admin'
            ? [{ label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard }]
            : []),
        ...(role === 'client'
            ? [{ label: 'Historique', href: '/historique', icon: History }]
            : []),
    ];

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUserName(null);
        setRole(null);
        router.push('/');
    };

    return (
        <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
                    <img src="/sanad.png" alt="SANAD" className="h-12 w-auto object-contain" />
                </Link>

                <nav className="hidden md:flex items-center gap-1">
                    {navItems?.map((item) => {
                        const isActive = pathname === item?.href;
                        const Icon = item?.icon;
                        return (
                            <Link
                                key={item?.href}
                                href={item?.href}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? 'bg-accent text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                            >
                                <Icon size={16} />
                                {item?.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-3">
                    {userName ? (
                        <>
                            <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[120px]">{userName}</span>
                            <button onClick={handleLogout} className="btn-ghost text-xs flex items-center gap-1.5">
                                <LogOut size={14} /> Déconnexion
                            </button>
                        </>
                    ) : (
                        <Link href="/login" className="btn-ghost text-xs flex items-center gap-1.5">
                            <LogIn size={14} /> Connexion
                        </Link>
                    )}
                    <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-sanad-success inline-block" />
                        Système opérationnel
                    </span>
                    <button
                        className="md:hidden btn-ghost p-2"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>
            {mobileOpen && (
                <div className="md:hidden border-t border-border bg-card px-4 py-3 fade-in-up">
                    {navItems?.map((item) => {
                        const isActive = pathname === item?.href;
                        const Icon = item?.icon;
                        return (
                            <Link
                                key={item?.href}
                                href={item?.href}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium mb-1 transition-all duration-150 ${isActive ? 'bg-accent text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                            >
                                <Icon size={18} />
                                {item?.label}
                            </Link>
                        );
                    })}
                </div>
            )}
        </header>
    );
}
