'use client';

import React from 'react';
import { Manrope, Plus_Jakarta_Sans } from 'next/font/google';
import '../styles/tailwind.css';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${manrope.variable} ${plusJakarta.variable}`}>
      <head>
        <title>SANAD — Votre compagnon d&apos;assurance automobile</title>
        <meta name="description" content="SANAD vous aide à déclarer un accident de voiture calmement et rapidement — chat IA bilingue, résumés instantanés et révision rapide par l'assureur." />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <script type="module" async src="https://static.rocket.new/rocket-web.js?_cfg=https%3A%2F%2Fsanad9956back.builtwithrocket.new&_be=https%3A%2F%2Fappanalytics.rocket.new&_v=0.1.19" />
        <script type="module" defer src="https://static.rocket.new/rocket-shot.js?v=0.0.2" /></head>
      <body className={plusJakarta.className}>
        {children}
      </body>
    </html>
  );
}