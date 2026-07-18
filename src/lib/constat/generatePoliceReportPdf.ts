import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib';
import { type ConstatData } from './types';
import type { FraudCheckResult } from '../ai/fraudCheckPrompt';

export interface PoliceReportFraudResults {
    A?: FraudCheckResult | null;
    B?: FraudCheckResult | null;
}

const PAGE_WIDTH = 595.28; // A4 in points
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// Clean, formal police report colors (Deep Navy, Slate Blue, Charcoal, Crimson for alerts)
const COLORS = {
    primary: rgb(0.1, 0.18, 0.36),        // Deep Navy (#1A2E5C)
    primaryLight: rgb(0.94, 0.96, 0.98), // Very light cool grey
    accent: rgb(0.24, 0.38, 0.58),       // Slate Blue
    white: rgb(1, 1, 1),
    black: rgb(0.12, 0.14, 0.16),        // Charcoal
    muted: rgb(0.45, 0.48, 0.52),        // Medium Grey
    border: rgb(0.8, 0.83, 0.86),         // Light Border Grey
    danger: rgb(0.8, 0.2, 0.2),          // Alert Crimson
    dangerLight: rgb(0.99, 0.92, 0.92),  // Alert light background
};

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    if (!text) return [''];
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
            lines.push(current);
            current = word;
        } else {
            current = test;
        }
    }
    if (current) lines.push(current);
    return lines;
}

export async function generatePoliceReportPdf(data: ConstatData, fraudResults?: PoliceReportFraudResults): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);

    let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN;

    const drawSectionHeader = (title: string) => {
        // Draw line
        page.drawLine({
            start: { x: MARGIN, y: y - 4 },
            end: { x: PAGE_WIDTH - MARGIN, y: y - 4 },
            color: COLORS.accent,
            thickness: 1,
        });
        page.drawText(title.toUpperCase(), {
            x: MARGIN,
            y: y + 2,
            size: 9.5,
            font: bold,
            color: COLORS.primary,
        });
        y -= 20;
    };

    // --- Header Section ---
    // Tunisia Republic / Ministry of Interior header
    page.drawText("REPUBLIQUE TUNISIENNE", { x: MARGIN, y, size: 9, font: bold, color: COLORS.black });
    page.drawText("MINISTERE DE L'INTERIEUR", { x: MARGIN, y: y - 12, size: 8, font: bold, color: COLORS.black });
    page.drawText("DIRECTION GENERALE DE LA SURETE NATIONALE", { x: MARGIN, y: y - 24, size: 7.5, font, color: COLORS.muted });
    page.drawText("DISTRICT DE LA SECURITE ROUTIERE", { x: MARGIN, y: y - 36, size: 7.5, font, color: COLORS.muted });

    // Official Date stamp (Top Right)
    const formattedStamp = `Fait le ${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    page.drawText(formattedStamp, { x: PAGE_WIDTH - MARGIN - 170, y, size: 8, font, color: COLORS.muted });
    page.drawText("REF: PV-ACC/TUN-" + Math.floor(100000 + Math.random() * 900000), { x: PAGE_WIDTH - MARGIN - 170, y: y - 12, size: 8.5, font: bold, color: COLORS.primary });

    y -= 60;

    // Report Title
    const title = "PROCES-VERBAL DE CONSTATATION D'ACCIDENT";
    const titleW = bold.widthOfTextAtSize(title, 14);
    page.drawText(title, { x: (PAGE_WIDTH - titleW) / 2, y, size: 14, font: bold, color: COLORS.primary });
    
    const subtitle = "ETAT DES LIEUX ET DECLARATIONS PRELIMINAIRES";
    const subtitleW = font.widthOfTextAtSize(subtitle, 9.5);
    page.drawText(subtitle, { x: (PAGE_WIDTH - subtitleW) / 2, y: y - 14, size: 9.5, font, color: COLORS.muted });

    y -= 38;

    // --- General Information Block ---
    drawSectionHeader("1. Cadre & Localisation de l'Accident");
    
    // Draw background block
    page.drawRectangle({
        x: MARGIN,
        y: y - 55,
        width: CONTENT_WIDTH,
        height: 55,
        color: COLORS.primaryLight,
        borderColor: COLORS.border,
        borderWidth: 0.5,
    });

    page.drawText("Date & Heure :", { x: MARGIN + 12, y: y - 16, size: 8.5, font: bold, color: COLORS.black });
    page.drawText(`${data.date || 'Non specifiee'} a ${data.heure || 'Non specifiee'}`, { x: MARGIN + 90, y: y - 16, size: 8.5, font, color: COLORS.black });

    page.drawText("Lieu / Adresse :", { x: MARGIN + 12, y: y - 30, size: 8.5, font: bold, color: COLORS.black });
    
    // Extract maps URL if present
    let locationString = data.lieu || 'Non specifie';
    let mapsUrl = '';
    const mapsMatch = locationString.match(/https:\/\/www\.google\.com\/maps\S*/);
    if (mapsMatch) {
        mapsUrl = mapsMatch[0];
        // strip maps URL from display string
        locationString = locationString.replace(/\(GPS: https:\/\/www\.google\.com\/maps\S*\)/, '').trim();
    }

    page.drawText(locationString, { x: MARGIN + 90, y: y - 30, size: 8.5, font, color: COLORS.black });

    if (mapsUrl) {
        page.drawText("Coordonnees GPS :", { x: MARGIN + 12, y: y - 44, size: 8.5, font: bold, color: COLORS.black });
        page.drawText(mapsUrl, { x: MARGIN + 115, y: y - 44, size: 8, font: bold, color: COLORS.accent });
    }

    y -= 75;

    // --- Suspect Case / Anti-Fraud Flags (Pillar 2 Flagged items) ---
    const fraudA = fraudResults?.A;
    const fraudB = fraudResults?.B;
    const isSuspect = fraudA?.inconsistencyDetected || fraudB?.inconsistencyDetected;

    if (isSuspect) {
        drawSectionHeader("2. Alertes & Anomalies Constatées (Securité)");
        
        // Draw red background warning block
        const alertH = 50 + (fraudA?.inconsistencyDetected ? 22 : 0) + (fraudB?.inconsistencyDetected ? 22 : 0);
        page.drawRectangle({
            x: MARGIN,
            y: y - alertH,
            width: CONTENT_WIDTH,
            height: alertH,
            color: COLORS.dangerLight,
            borderColor: COLORS.danger,
            borderWidth: 0.8,
        });

        page.drawText("ATTESTATION D'ANOMALIE DE DECLARATION (SYSTEME SANAD ANTI-FRAUDE)", {
            x: MARGIN + 12,
            y: y - 16,
            size: 8.5,
            font: bold,
            color: COLORS.danger,
        });

        let alertY = y - 32;

        if (fraudA?.inconsistencyDetected) {
            page.drawText("- Vehicule A : Incoherence majeure detectee. Choc declare: " + (data.vehiculeA.pointChocInitial || "Non specifie") + " / Degats photo: " + (fraudA.observedDamage || "Incompatible"), {
                x: MARGIN + 15,
                y: alertY,
                size: 8,
                font: bold,
                color: COLORS.danger,
            });
            alertY -= 14;
        }

        if (fraudB?.inconsistencyDetected) {
            page.drawText("- Vehicule B : Incoherence majeure detectee. Choc declare: " + (data.vehiculeB.pointChocInitial || "Non specifie") + " / Degats photo: " + (fraudB.observedDamage || "Incompatible"), {
                x: MARGIN + 15,
                y: alertY,
                size: 8,
                font: bold,
                color: COLORS.danger,
            });
            alertY -= 14;
        }

        page.drawText("Note: Ce dossier est marque comme suspect et exige un PV de police physique conforme.", {
            x: MARGIN + 15,
            y: alertY - 4,
            size: 7.5,
            font,
            color: COLORS.muted,
        });

        y -= alertH + 20;
    }

    // --- Vehicule A ---
    drawSectionHeader("3. Identification des Parties et Vehicules");

    const drawVehicleDetails = (label: 'A' | 'B', vehicle: any) => {
        page.drawText(`VEHICULE ${label} (${vehicle.vehiculeMarqueType || 'Marque inconnue'})`, {
            x: MARGIN,
            y: y,
            size: 9,
            font: bold,
            color: COLORS.primary,
        });
        
        y -= 14;
        
        const details = [
            `Conducteur: ${vehicle.nom || '—'} ${vehicle.prenom || ''}`,
            `Permis No: ${vehicle.permisNumero || '—'}`,
            `Immatriculation: ${vehicle.plaque || '—'}`,
            `Assureur: ${vehicle.societeAssurance || '—'} (Contrat: ${vehicle.contratNumero || '—'})`,
            `Point d'impact initial declare: ${vehicle.pointChocInitial || '—'}`,
            `Degats apparents: ${vehicle.degatsApparents || '—'}`,
        ];

        details.forEach((txt) => {
            page.drawText("  " + txt, { x: MARGIN, y, size: 8, font, color: COLORS.black });
            y -= 11;
        });

        // Add a line break
        y -= 6;
    };

    drawVehicleDetails('A', data.vehiculeA);
    drawVehicleDetails('B', data.vehiculeB);

    // --- Blessures et temoins ---
    drawSectionHeader("4. Blessures & Temoignages");
    
    page.drawText(`Blesses declare(s) : ${data.blesses?.toUpperCase() === 'OUI' ? 'Oui (A signaler a la protection civile)' : 'Non'}`, { x: MARGIN, y, size: 8.5, font: bold, color: COLORS.black });
    y -= 12;
    page.drawText(`Degats autres vehicules : ${data.degatsAutresVehicules?.toUpperCase() === 'OUI' ? 'Oui' : 'Non'}`, { x: MARGIN, y, size: 8.5, font, color: COLORS.black });
    y -= 12;
    
    const witnessesText = `Temoins declares : ${data.temoins || 'Aucun temoin declare.'}`;
    const wrappedWitnesses = wrapText(witnessesText, font, 8.5, CONTENT_WIDTH);
    wrappedWitnesses.forEach((line) => {
        page.drawText(line, { x: MARGIN, y, size: 8.5, font, color: COLORS.black });
        y -= 12;
    });

    y -= 15;

    // --- Official Signature blocks ---
    drawSectionHeader("5. Signatures Officielles & Cloture");

    const sigY = y - 90;
    
    // Draw boxes for signatures
    page.drawRectangle({ x: MARGIN, y: sigY, width: 140, height: 75, color: COLORS.primaryLight, borderColor: COLORS.border, borderWidth: 0.5 });
    page.drawText("Signature Conducteur A", { x: MARGIN + 10, y: y - 14, size: 7.5, font: bold, color: COLORS.muted });

    page.drawRectangle({ x: MARGIN + 165, y: sigY, width: 140, height: 75, color: COLORS.primaryLight, borderColor: COLORS.border, borderWidth: 0.5 });
    page.drawText("Signature Conducteur B", { x: MARGIN + 165 + 10, y: y - 14, size: 7.5, font: bold, color: COLORS.muted });

    page.drawRectangle({ x: MARGIN + 330, y: sigY, width: 180, height: 75, color: COLORS.primaryLight, borderColor: COLORS.accent, borderWidth: 0.8 });
    page.drawText("Cachet de l'Officier de Police", { x: MARGIN + 330 + 10, y: y - 14, size: 7.5, font: bold, color: COLORS.primary });
    page.drawText("Gendarmerie Nationale Tunisienne", { x: MARGIN + 330 + 10, y: y - 26, size: 7, font, color: COLORS.muted });

    y = sigY - 20;

    // Footer
    page.drawText("Ce document est genere automatiquement pour appuyer le dossier d'accident amiable SANAD.", {
        x: MARGIN,
        y,
        size: 7,
        font,
        color: COLORS.muted,
    });

    return doc.save();
}
