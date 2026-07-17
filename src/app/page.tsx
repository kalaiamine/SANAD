'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, MessageSquare, Zap, Eye, ArrowRight, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: 'var(--font-display)' }}>
      {/* Demo badge */}
      <div className="fixed top-4 right-4 z-50">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground bg-card border border-border px-3 py-1.5 rounded-full shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-sanad-warning inline-block" />
          Données de démonstration
        </span>
      </div>
      {/* Nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-primary tracking-tight">SANAD</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="btn-ghost text-sm hidden sm:flex">
              Tableau de bord
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              Déclarer un sinistre
            </Link>
          </div>
        </div>
      </nav>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(31,111,120,0.12) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-accent border border-[var(--secondary)]/30 text-primary text-xs font-semibold px-4 py-2 rounded-full mb-8 fade-in-up">
            <Zap size={12} />
            Déclaration IA en moins de 2 minutes
          </div>
          <h1
            className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl text-foreground tracking-tight leading-[1.1] mb-6 fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            Déclarez votre accident
            <br />
            <span className="text-primary">avec confiance.</span>
          </h1>
          <p
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            Assistance IA pour vos déclarations de sinistre en quelques minutes.
          </p>
          <p
            className="text-base text-muted-foreground mb-10 rtl-text fade-in-up"
            style={{ animationDelay: '0.25s', fontFamily: 'var(--font-sans)' }}
            dir="rtl"
          >
            مساعدة ذكاء اصطناعي لتقديم مطالبات التأمين في دقائق
          </p>
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center fade-in-up"
            style={{ animationDelay: '0.3s' }}
          >
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-primary text-white font-semibold text-base transition-all duration-200 hover:opacity-90 active:scale-95 shadow-chat focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Démarrer une déclaration
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-card border border-border text-foreground font-semibold text-base transition-all duration-200 hover:bg-muted active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Tableau de bord assureur
            </Link>
          </div>
        </div>
      </section>
      {/* Bento Feature Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-auto">
          {/* Large card - AI Identity */}
          <div className="md:col-span-2 card-base p-8 group hover:shadow-elevated transition-shadow duration-300">
            <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mb-6">
              <Eye size={24} className="text-primary" />
            </div>
            <h3 className="font-display font-bold text-xl text-foreground mb-3">
              Vérification d&apos;identité par IA
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              OCR instantané de votre carte d&apos;identité et reconnaissance faciale pour confirmer votre identité en quelques secondes. Sécurisé, précis, sans paperasse.
            </p>
            <div className="flex items-center gap-3 p-4 bg-accent rounded-xl">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">97% de précision</p>
                <p className="text-xs text-muted-foreground">Correspondance faciale confirmée</p>
              </div>
              <span className="ml-auto text-xs font-semibold text-sanad-success bg-sanad-success/10 px-2.5 py-1 rounded-full">Vérifié</span>
            </div>
          </div>

          {/* Smart Claims */}
          <div className="card-base p-6 group hover:shadow-elevated transition-shadow duration-300 flex flex-col">
            <div className="w-10 h-10 rounded-2xl bg-[#F4B740]/15 flex items-center justify-center mb-5">
              <MessageSquare size={20} className="text-[#B5850A]" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground mb-2">
              Déclarations intelligentes
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
              Chat bilingue (français & arabe) avec détection RTL automatique. Décrivez l&apos;accident naturellement.
            </p>
            <div className="mt-5 flex gap-2">
              <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium">Français</span>
              <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium" dir="rtl">العربية</span>
            </div>
          </div>

          {/* Instant Recommendation */}
          <div className="card-base p-6 group hover:shadow-elevated transition-shadow duration-300 flex flex-col">
            <div className="w-10 h-10 rounded-2xl bg-sanad-success/10 flex items-center justify-center mb-5">
              <Zap size={20} className="text-sanad-success" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground mb-2">
              Recommandation instantanée
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
              Analyse IA des dommages, extraction de facture et estimation de règlement en temps réel.
            </p>
            <div className="mt-5 p-3 bg-sanad-success/5 rounded-xl border border-sanad-success/20">
              <p className="text-xs text-muted-foreground">Règlement estimé</p>
              <p className="text-2xl font-display font-bold text-sanad-success">420 TND</p>
            </div>
          </div>

          {/* Fraud Detection - spans 2 */}
          <div className="md:col-span-2 card-base p-8 group hover:shadow-elevated transition-shadow duration-300">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-sanad-danger/10 flex items-center justify-center mb-4">
                  <Shield size={20} className="text-sanad-danger" />
                </div>
                <h3 className="font-display font-bold text-xl text-foreground mb-2">
                  Détection de fraude
                </h3>
                <p className="text-muted-foreground leading-relaxed max-w-md">
                  Analyse multi-couche de chaque déclaration pour détecter les anomalies et protéger contre la fraude à l&apos;assurance.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Score de fraude', value: '3/100', color: 'text-sanad-success' },
                { label: 'Niveau de risque', value: 'Faible', color: 'text-sanad-success' },
                { label: 'Confiance IA', value: '96%', color: 'text-primary' },
              ]?.map((stat) => (
                <div key={stat?.label} className="bg-muted rounded-xl p-4 text-center">
                  <p className={`text-xl font-display font-bold ${stat?.color}`}>{stat?.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat?.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* CTA Banner */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div
          className="rounded-3xl p-10 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1F6F78 0%, #3BA99C 100%)' }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
            aria-hidden="true"
          />
          <h2 className="font-display font-bold text-3xl text-white mb-4 relative z-10">
            Prêt à déclarer votre sinistre?
          </h2>
          <p className="text-white/80 mb-8 relative z-10">
            Commencez maintenant — le processus prend moins de 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-primary font-semibold text-sm transition-all duration-200 hover:bg-white/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              Démarrer maintenant
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-white/10 border border-white/30 text-white font-semibold text-sm transition-all duration-200 hover:bg-white/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              Voir le tableau de bord
            </Link>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
              <Shield size={12} className="text-white" />
            </div>
            <span className="font-display font-bold text-sm text-primary">SANAD</span>
            <span className="text-xs text-muted-foreground">· Compagnon d&apos;assurance automobile</span>
          </div>
          <p className="text-xs text-muted-foreground">Prototype de démonstration · Données fictives réalistes</p>
        </div>
      </footer>
    </div>
  );
}