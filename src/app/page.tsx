'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, MessageSquare, Zap, Eye, ArrowRight, CheckCircle, TrendingDown, Clock, BarChart3, Layers } from 'lucide-react';
import { getLandingInsights, riskLevelColor, type LandingInsights } from '@/lib/claims/claimInsights';

type Language = 'fr' | 'ar';

const TRANSLATIONS = {
  fr: {
    demoData: 'Données de démonstration',
    chatAssistant: 'Chat Assistant',
    dashboard: 'Tableau de bord',
    declareSinistre: 'Déclarer un sinistre',
    heroTag: 'Votre sinistre déclaré en moins de 2 minutes',
    heroTitleLine1: 'Déclarez votre accident',
    heroTitleLine2: 'avec confiance.',
    heroSub: "Fini la paperasse et les files d'attente : ouvrez votre compte, déclarez votre accident et suivez votre indemnisation — depuis votre téléphone, à toute heure.",
    startDeclaration: 'Démarrer une déclaration',
    dashboardAssureur: 'Tableau de bord assureur',
    historique: 'Mon historique',
    bentoTitle1: "Votre identité vérifiée en quelques secondes",
    bentoDesc1: "Prenez votre carte d'identité et un selfie en photo — c'est tout. Plus besoin de vous déplacer en agence ni d'envoyer des copies : votre compte est vérifié et sécurisé en quelques minutes.",
    bentoStat1_val: "97% de précision",
    bentoStat1_desc: "Correspondance faciale confirmée",
    verifiedBadge: "Vérifié",
    bentoTitle2: "Parlez comme vous voulez",
    bentoDesc2: "Racontez votre accident avec vos propres mots — en français, en arabe ou en tunisien. Notre assistant vous comprend et remplit le dossier à votre place, 24h/24.",
    langFr: "Français",
    langAr: "العربية",
    bentoTitle3: "Votre estimation immédiatement",
    bentoDesc3: "Envoyez une photo de votre véhicule : vous obtenez tout de suite une estimation de réparation en dinars, sans attendre le passage d'un expert.",
    estSettlement: "Règlement estimé",
    bentoTitle4: "Des décisions justes et transparentes",
    bentoDesc4: "Chaque dossier est vérifié avec les mêmes règles pour tous, et chaque décision vous est expliquée clairement. Les fraudes sont écartées — les assurés honnêtes sont indemnisés plus vite.",
    statFraudScore: "Score de fraude",
    statRiskLevel: "Niveau de risque",
    statConfidence: "Confiance IA",
    riskLow: "Faible",
    riskModerate: "Modéré",
    riskHigh: "Élevé",
    insightsSourceSession: "Dernier constat analysé",
    insightsSourceDossiers: "Moyenne des dossiers SANAD",
    ctaTitle: "Prêt à déclarer votre sinistre?",
    ctaSub: "Commencez maintenant — le processus prend moins de 2 minutes.",
    startNow: "Démarrer maintenant",
    viewDashboard: "Voir le tableau de bord",
    footerCompanion: "· Compagnon d'assurance automobile",
    footerDemo: 'Prototype de démonstration · Données chiffrées MongoDB',
    problemTitle: 'Le problème en Tunisie',
    problemDesc: "Les compagnies d'assurance perdent du temps et de l'argent : déclarations papier, eKYC déconnecté du sinistre, fraude difficile à détecter, et parcours non bilingue.",
    problemStat1: '15–20 min',
    problemStat1Desc: 'FNOL traditionnel',
    problemStat2: '25–30%',
    problemStat2Desc: 'coûts opérationnels évitables',
    problemStat3: 'Loi 2015-26',
    problemStat3Desc: 'conformité AML/CFT',
    impactTitle: 'Impact mesurable SANAD',
    impactFnol: 'FNOL IA',
    impactFnolVal: '< 2 min',
    impactCost: 'Réduction coûts',
    impactCostVal: '25–30%',
    impactEkyc: 'Précision eKYC',
    impactEkycVal: '97%',
    impactExplain: 'Décisions 100 % expliquées',
    unifiedTitle: "Un seul parcours, de l'identité à l'indemnisation",
    unifiedDesc: "Ouvrez votre compte une seule fois, puis tout s'enchaîne : déclaration en quelques messages, constat amiable numérique, estimation immédiate et suivi de votre dossier — sans refaire deux fois la même démarche.",
    diffTitle: 'Pourquoi SANAD ?',
    diff1: "Tout au même endroit : inscription, déclaration, suivi",
    diff2: 'Chaque décision est expliquée, rien de caché',
    diff3: 'On vous parle dans votre langue : français, arabe, tunisien',
    diff4: 'Des estimations en dinars, adaptées au marché tunisien',
    diff5: 'Vos données personnelles protégées et chiffrées',
  },
  ar: {
    demoData: 'بيانات تجريبية',
    chatAssistant: 'مساعد المحادثة',
    dashboard: 'لوحة القيادة',
    declareSinistre: 'الإبلاغ عن حادث',
    heroTag: 'صرّح عن حادثك في أقل من دقيقتين',
    heroTitleLine1: 'صرح عن حادث السيارة الخاص بك',
    heroTitleLine2: 'بكل ثقة.',
    heroSub: 'وداعاً للأوراق وطوابير الانتظار: افتح حسابك، صرّح عن حادثك وتابع تعويضك — من هاتفك وفي أي وقت.',
    startDeclaration: 'ابدأ التصريح الآن',
    dashboardAssureur: 'لوحة قيادة شركة التأمين',
    historique: 'سجل مطالباتي',
    bentoTitle1: 'هويتك مؤكدة في ثوانٍ',
    bentoDesc1: 'صوّر بطاقة تعريفك والتقط سيلفي — هذا كل شيء. لا حاجة للتنقل إلى الوكالة ولا لإرسال نسخ: حسابك يتأكد ويؤمَّن في دقائق.',
    bentoStat1_val: 'دقة 97%',
    bentoStat1_desc: 'تأكيد مطابقة ملامح الوجه',
    verifiedBadge: 'تم التحقق',
    bentoTitle2: 'تكلّم كما تحب',
    bentoDesc2: 'احكِ حادثك بكلماتك — بالفرنسية أو العربية أو بالدارجة التونسية. مساعدنا يفهمك ويملأ الملف مكانك، على مدار الساعة.',
    langFr: 'الفرنسية',
    langAr: 'العربية',
    bentoTitle3: 'تقديرك فوراً',
    bentoDesc3: 'أرسل صورة سيارتك: تحصل فوراً على تقدير تكلفة الإصلاح بالدينار، دون انتظار مرور خبير.',
    estSettlement: 'التعويض المقدر',
    bentoTitle4: 'قرارات عادلة وشفافة',
    bentoDesc4: 'كل ملف يُراجع بنفس القواعد للجميع، وكل قرار يُشرح لك بوضوح. يُستبعد المحتالون — ويُعوَّض المؤمَّنون النزهاء أسرع.',
    statFraudScore: 'مؤشر الاحتيال',
    statRiskLevel: 'مستوى المخاطر',
    statConfidence: 'ثقة الذكاء الاصطناعي',
    riskLow: 'منخفض',
    riskModerate: 'متوسط',
    riskHigh: 'مرتفع',
    insightsSourceSession: 'آخر تصريح تم تحليله',
    insightsSourceDossiers: 'متوسط ملفات SANAD',
    ctaTitle: 'هل أنت مستعد للإبلاغ عن الحادث؟',
    ctaSub: 'ابدأ الآن — تستغرق العملية أقل من دقيقتين.',
    startNow: 'ابدأ الآن',
    viewDashboard: 'عرض لوحة القيادة',
    footerCompanion: '· مساعد التأمين على السيارات',
    footerDemo: 'نسخة تجريبية · بيانات مشفرة MongoDB',
    problemTitle: 'المشكلة في تونس',
    problemDesc: 'تخسر شركات التأمين الوقت والمال: تصاريح ورقية، eKYC منفصل عن المطالبات، صعوبة كشف الاحتيال، ومسارات غير ثنائية اللغة.',
    problemStat1: '15–20 د',
    problemStat1Desc: 'FNOL تقليدي',
    problemStat2: '25–30%',
    problemStat2Desc: 'تكاليف تشغيلية قابلة للتجنب',
    problemStat3: 'قانون 2015-26',
    problemStat3Desc: 'امتثال AML/CFT',
    impactTitle: 'أثر SANAD القابل للقياس',
    impactFnol: 'FNOL بالذكاء الاصطناعي',
    impactFnolVal: '< 2 د',
    impactCost: 'خفض التكاليف',
    impactCostVal: '25–30%',
    impactEkyc: 'دقة eKYC',
    impactEkycVal: '97%',
    impactExplain: 'قرارات مفسّرة 100%',
    unifiedTitle: 'مسار واحد، من الهوية إلى التعويض',
    unifiedDesc: 'افتح حسابك مرة واحدة، ثم كل شيء يتسلسل: تصريح في بضع رسائل، محضر مشترك رقمي، تقدير فوري ومتابعة ملفك — دون إعادة نفس الإجراء مرتين.',
    diffTitle: 'لماذا SANAD؟',
    diff1: 'كل شيء في مكان واحد: التسجيل، التصريح، المتابعة',
    diff2: 'كل قرار مشروح، لا شيء مخفي',
    diff3: 'نخاطبك بلغتك: الفرنسية والعربية والتونسية',
    diff4: 'تقديرات بالدينار تناسب السوق التونسية',
    diff5: 'بياناتك الشخصية محمية ومشفرة',
  }
};

export default function LandingPage() {
  const [lang, setLang] = useState<Language>('fr');
  const [insights, setInsights] = useState<LandingInsights | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    setInsights(getLandingInsights());
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setRole(data?.user?.role || null))
      .catch(() => {});
  }, []);

  // Un client connecté voit son historique ; l'assureur (ou un visiteur) voit le tableau de bord
  const isClient = role === 'client';
  const dashHref = isClient ? '/historique' : '/dashboard';

  const riskLabel =
    insights?.riskLevel === 'Élevé'
      ? t.riskHigh
      : insights?.riskLevel === 'Modéré'
        ? t.riskModerate
        : t.riskLow;

  const riskColor = insights ? riskLevelColor(insights.riskLevel) : 'text-sanad-success';

  return (
    <div 
      className="min-h-screen bg-background" 
      style={{ fontFamily: 'var(--font-display)' }}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Demo badge */}
      <div className={`fixed top-4 z-50 ${lang === 'ar' ? 'left-4' : 'right-4'}`}>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground bg-card border border-border px-3 py-1.5 rounded-full shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-sanad-warning inline-block" />
          {t.demoData}
        </span>
      </div>

      {/* Nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/sanad.png" alt="SANAD" className="h-12 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-3">
            {/* Language Toggle Button */}
            <button
              onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
              className="btn-ghost text-xs px-2.5 py-1.5 rounded-xl border border-border hover:bg-muted font-semibold flex items-center gap-1.5 transition-all duration-150"
            >
              🌐 {lang === 'fr' ? 'العربية' : 'Français'}
            </button>

            <Link href="/chat" className="btn-ghost text-sm">
              {t.chatAssistant}
            </Link>
            <Link href="/login" className="btn-ghost text-sm hidden sm:flex">
              Connexion
            </Link>
            <Link href={dashHref} className="btn-ghost text-sm hidden sm:flex">
              {isClient ? t.historique : t.dashboard}
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              {t.declareSinistre}
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
            {t.heroTag}
          </div>
          <h1
            className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl text-foreground tracking-tight leading-[1.1] mb-6 fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            {t.heroTitleLine1}
            <br />
            <span className="text-primary">{t.heroTitleLine2}</span>
          </h1>
          <p
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            {t.heroSub}
          </p>
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center fade-in-up"
            style={{ animationDelay: '0.3s' }}
          >
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-primary text-white font-semibold text-base transition-all duration-200 hover:opacity-90 active:scale-95 shadow-chat focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {t.startDeclaration}
              <ArrowRight size={18} className={lang === 'ar' ? 'rotate-180' : ''} />
            </Link>
            <Link
              href={dashHref}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-card border border-border text-foreground font-semibold text-base transition-all duration-200 hover:bg-muted active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {isClient ? t.historique : t.dashboardAssureur}
            </Link>
          </div>
        </div>
      </section>

      {/* Problem + Impact KPIs */}
      <section className="max-w-6xl mx-auto px-6 pb-12">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="card-base p-8">
            <h2 className="font-display font-bold text-2xl text-foreground mb-3">{t.problemTitle}</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">{t.problemDesc}</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { val: t.problemStat1, desc: t.problemStat1Desc },
                { val: t.problemStat2, desc: t.problemStat2Desc },
                { val: t.problemStat3, desc: t.problemStat3Desc },
              ].map((s) => (
                <div key={s.desc} className="bg-muted rounded-xl p-3 text-center">
                  <p className="text-sm font-display font-bold text-primary">{s.val}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="card-base p-8 border-primary/20">
            <h2 className="font-display font-bold text-2xl text-foreground mb-6 flex items-center gap-2">
              <TrendingDown size={22} className="text-sanad-success" />
              {t.impactTitle}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Clock, label: t.impactFnol, val: t.impactFnolVal, color: 'text-primary' },
                { icon: TrendingDown, label: t.impactCost, val: t.impactCostVal, color: 'text-sanad-success' },
                { icon: Eye, label: t.impactEkyc, val: t.impactEkycVal, color: 'text-primary' },
                { icon: BarChart3, label: t.impactExplain, val: 'SHAP', color: 'text-[#B5850A]' },
              ].map((k) => (
                <div key={k.label} className="p-4 bg-accent/50 rounded-xl">
                  <k.icon size={18} className={`${k.color} mb-2`} />
                  <p className={`text-2xl font-display font-bold ${k.color}`}>{k.val}</p>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
              * Estimations basées sur benchmarks insurtech (McKinsey, BCG) et démo SANAD : FNOL chat + constat + rapport unifié.
            </p>
          </div>
        </div>
      </section>

      {/* Unified platform + differentiation */}
      <section className="max-w-6xl mx-auto px-6 pb-12">
        <div className="card-base p-8 md:p-10">
          <div className="flex items-center gap-3 mb-4">
            <Layers size={24} className="text-primary" />
            <h2 className="font-display font-bold text-2xl text-foreground">{t.unifiedTitle}</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed max-w-3xl mb-8">{t.unifiedDesc}</p>
          <div className="flex flex-wrap gap-2 mb-8">
            {['OCR CIN', 'Face Match', 'AML/CFT', 'Chat FNOL', 'Constat PDF', 'Roboflow YOLO', 'Fraude Vision', 'MongoDB'].map((tag) => (
              <span key={tag} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
            ))}
          </div>
          <h3 className="font-display font-bold text-lg text-foreground mb-4">{t.diffTitle}</h3>
          <ul className="grid sm:grid-cols-2 gap-3">
            {[t.diff1, t.diff2, t.diff3, t.diff4, t.diff5].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle size={16} className="text-sanad-success flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
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
              {t.bentoTitle1}
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              {t.bentoDesc1}
            </p>
            <div className="flex items-center gap-3 p-4 bg-accent rounded-xl">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.bentoStat1_val}</p>
                <p className="text-xs text-muted-foreground">{t.bentoStat1_desc}</p>
              </div>
              <span className={`text-xs font-semibold text-sanad-success bg-sanad-success/10 px-2.5 py-1 rounded-full ${lang === 'ar' ? 'mr-auto' : 'ml-auto'}`}>{t.verifiedBadge}</span>
            </div>
          </div>

          {/* Smart Claims */}
          <div className="card-base p-6 group hover:shadow-elevated transition-shadow duration-300 flex flex-col">
            <div className="w-10 h-10 rounded-2xl bg-[#F4B740]/15 flex items-center justify-center mb-5">
              <MessageSquare size={20} className="text-[#B5850A]" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground mb-2">
              {t.bentoTitle2}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
              {t.bentoDesc2}
            </p>
            <div className="mt-5 flex gap-2">
              <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium">{t.langFr}</span>
              <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium" dir="rtl">{t.langAr}</span>
            </div>
          </div>

          {/* Instant Recommendation */}
          <div className="card-base p-6 group hover:shadow-elevated transition-shadow duration-300 flex flex-col">
            <div className="w-10 h-10 rounded-2xl bg-sanad-success/10 flex items-center justify-center mb-5">
              <Zap size={20} className="text-sanad-success" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground mb-2">
              {t.bentoTitle3}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
              {t.bentoDesc3}
            </p>
            <div className="mt-5 p-3 bg-sanad-success/5 rounded-xl border border-sanad-success/20">
              <p className="text-xs text-muted-foreground">{t.estSettlement}</p>
              <p className="text-2xl font-display font-bold text-sanad-success">
                {insights ? insights.settlementLabel : '—'}
              </p>
              {insights && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {insights.source === 'session' ? t.insightsSourceSession : t.insightsSourceDossiers}
                </p>
              )}
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
                  {t.bentoTitle4}
                </h3>
                <p className="text-muted-foreground leading-relaxed max-w-md">
                  {t.bentoDesc4}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: t.statFraudScore,
                  value: insights ? `${insights.fraudScore}/100` : '—',
                  color: riskColor,
                },
                {
                  label: t.statRiskLevel,
                  value: insights ? riskLabel : '—',
                  color: riskColor,
                },
                {
                  label: t.statConfidence,
                  value: insights ? `${insights.aiConfidence}%` : '—',
                  color: 'text-primary',
                },
              ].map((stat) => (
                <div key={stat.label} className="bg-muted rounded-xl p-4 text-center">
                  <p className={`text-xl font-display font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
            {insights && (
              <p className="text-[10px] text-muted-foreground mt-3">
                {insights.source === 'session' ? t.insightsSourceSession : t.insightsSourceDossiers}
                {insights.sourceDetail ? ` · ${insights.sourceDetail}` : ''}
              </p>
            )}
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
            {t.ctaTitle}
          </h2>
          <p className="text-white/80 mb-8 relative z-10">
            {t.ctaSub}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-primary font-semibold text-sm transition-all duration-200 hover:bg-white/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              {t.startNow}
              <ArrowRight size={16} className={lang === 'ar' ? 'rotate-180' : ''} />
            </Link>
            <Link
              href={dashHref}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-white/10 border border-white/30 text-white font-semibold text-sm transition-all duration-200 hover:bg-white/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              {isClient ? t.historique : t.viewDashboard}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/sanad.png" alt="SANAD" className="h-8 w-auto object-contain" />
            <span className="text-xs text-muted-foreground">{t.footerCompanion}</span>
          </div>
          <p className="text-xs text-muted-foreground">{t.footerDemo}</p>
        </div>
      </footer>
    </div>
  );
}