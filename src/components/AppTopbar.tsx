'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Menu, X, MessageSquare, LayoutDashboard, Home, UserPlus } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const navItems = [
    { label: 'Accueil', href: '/', icon: Home },
    { label: 'Déclarer', href: '/register', icon: UserPlus },
    { label: 'Chat', href: '/chat', icon: MessageSquare },
    { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
];

export default function AppTopbar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
                    <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                        <Shield size={16} className="text-white" />
                    </div>
                    <span className="font-display font-bold text-xl text-primary tracking-tight hidden sm:block">SANAD</span>
                </Link>

                <nav className="hidden md:flex items-center gap-1">
                    {navItems?.map((item) => {
                        const isActive = pathname === item?.href;
                        const Icon = item?.icon;
                        return (
                            <Link
                                key={item?.href}
                                href={item?.href}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? 'bg-accent text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                            >
                                <Icon size={16} />
                                {item?.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-3">
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
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium mb-1 transition-all duration-150 ${isActive ? 'bg-accent text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
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