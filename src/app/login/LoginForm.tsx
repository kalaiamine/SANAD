'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Mail, Lock, CreditCard, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get('next') || '/chat';
    const cinParam = searchParams.get('cin') || '';

    const [mode, setMode] = useState<'email' | 'cin'>(cinParam ? 'cin' : 'email');
    const [email, setEmail] = useState('');
    const [cin, setCin] = useState(cinParam);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                    mode === 'email'
                        ? { email: email.trim(), password: password.trim() }
                        : { cin: cin.trim(), password: password.trim() }
                ),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Connexion impossible.');
                return;
            }
            if (data.user?.role === 'insurer' || data.user?.role === 'admin') {
                router.push('/dashboard');
            } else {
                router.push(next);
            }
        } catch {
            setError('Erreur réseau. Réessayez.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <nav className="border-b border-border bg-card px-6 h-16 flex items-center">
                <Link href="/">
                    <img src="/sanad.png" alt="SANAD" className="h-10 w-auto" />
                </Link>
            </nav>

            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md card-base p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mx-auto">
                            <Shield size={22} className="text-primary" />
                        </div>
                        <h1 className="font-display font-bold text-2xl text-foreground">Connexion sécurisée</h1>
                        <p className="text-sm text-muted-foreground">
                            Accédez à votre espace SANAD — eKYC et déclaration sinistre unifiés.
                        </p>
                    </div>

                    <div className="flex rounded-xl bg-muted p-1 gap-1">
                        <button
                            type="button"
                            onClick={() => setMode('email')}
                            className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all ${mode === 'email' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground'}`}
                        >
                            Email
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('cin')}
                            className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all ${mode === 'cin' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground'}`}
                        >
                            CIN
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'email' ? (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                    <Mail size={12} /> Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    className="input-base w-full"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="vous@exemple.tn"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                    <CreditCard size={12} /> Numéro CIN
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="input-base w-full"
                                    value={cin}
                                    onChange={(e) => setCin(e.target.value)}
                                    placeholder="12345678"
                                />
                            </div>
                        )}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                <Lock size={12} /> Mot de passe
                            </label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                className="input-base w-full"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        {error && <p className="text-xs text-sanad-danger bg-sanad-danger/10 rounded-lg p-2">{error}</p>}
                        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <>Se connecter <ArrowRight size={16} /></>}
                        </button>
                    </form>

                    <p className="text-center text-xs text-muted-foreground">
                        Pas encore de compte ?{' '}
                        <Link href="/register" className="text-primary font-semibold hover:underline">
                            Inscription eKYC
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
