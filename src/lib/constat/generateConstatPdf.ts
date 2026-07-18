import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from 'pdf-lib';
import { CIRCONSTANCES_LABELS, type ConstatData, type ConstatVehicleInfo } from './types';
import type { FraudCheckResult } from '../ai/fraudCheckPrompt';

export interface ConstatFraudResults {
    A?: FraudCheckResult | null;
    B?: FraudCheckResult | null;
}

const PAGE_WIDTH = 595.28; // A4 in points
const PAGE_HEIGHT = 841.89;
const MARGIN = 30;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// SANAD color palette (matching the UI)
const COLORS = {
    primary: rgb(0.122, 0.435, 0.471),       // #1F6F78
    primaryLight: rgb(0.91, 0.96, 0.96),      // light teal background
    white: rgb(1, 1, 1),
    black: rgb(0.14, 0.2, 0.23),              // #24333A
    muted: rgb(0.42, 0.48, 0.5),              // #6B7A80
    border: rgb(0.85, 0.89, 0.89),            // #D8E4E2
    cyanLight: rgb(0.9, 0.97, 1),             // cyan-50/60
    cyanBorder: rgb(0.65, 0.85, 0.9),         // cyan-200
    cyanText: rgb(0.15, 0.42, 0.5),           // cyan-800
    amberLight: rgb(1, 0.97, 0.9),            // amber-50/60
    amberBorder: rgb(0.9, 0.82, 0.55),        // amber-200
    amberText: rgb(0.55, 0.45, 0.1),          // amber-800
    success: rgb(0.18, 0.545, 0.341),         // #2E8B57
    danger: rgb(0.851, 0.325, 0.31),          // #D9534F
    checkGreen: rgb(0.08, 0.55, 0.45),        // checkmark green
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

export async function generateConstatPdf(data: ConstatData, fraudResults?: ConstatFraudResults): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);

    let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN;

    const ensureSpace = (needed: number) => {
        if (y - needed < MARGIN) {
            page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            y = PAGE_HEIGHT - MARGIN;
        }
    };

    // ── Helpers ──────────────────────────────────────────────────────

    const drawRoundedRect = (
        x: number, yBottom: number, w: number, h: number,
        opts: { fill?: ReturnType<typeof rgb>; border?: ReturnType<typeof rgb>; borderWidth?: number }
    ) => {
        if (opts.fill) {
            page.drawRectangle({ x, y: yBottom, width: w, height: h, color: opts.fill });
        }
        if (opts.border) {
            page.drawRectangle({ x, y: yBottom, width: w, height: h, borderColor: opts.border, borderWidth: opts.borderWidth ?? 0.5 });
        }
    };

    const drawSectionBox = (title: string, headerBg: ReturnType<typeof rgb>, headerText: ReturnType<typeof rgb>, contentHeight: number, contentDrawer: (startY: number, boxX: number, boxW: number) => void, boxX = MARGIN, boxW = CONTENT_WIDTH) => {
        const headerH = 24;
        const totalH = headerH + contentHeight + 8;
        ensureSpace(totalH + 4);

        // Box border
        drawRoundedRect(boxX, y - totalH, boxW, totalH, { border: COLORS.border, borderWidth: 0.8 });
        // Header background
        drawRoundedRect(boxX, y - headerH, boxW, headerH, { fill: headerBg });
        // Header text
        page.drawText(title, { x: boxX + 12, y: y - headerH + 7, size: 10, font: bold, color: headerText });
        // Content
        contentDrawer(y - headerH - 4, boxX, boxW);
        y -= totalH + 6;
    };

    const drawLabelValue = (label: string, value: string, x: number, currentY: number, maxW: number) => {
        const displayVal = value?.trim() || '—';
        page.drawText(label, { x, y: currentY, size: 8, font: bold, color: COLORS.muted });
        const valLines = wrapText(displayVal, font, 9, maxW - 4);
        valLines.forEach((line, i) => {
            page.drawText(line, { x, y: currentY - 11 - i * 11, size: 9, font, color: COLORS.black });
        });
        return 11 + valLines.length * 11 + 4;
    };

    const drawInputField = (label: string, value: string, x: number, currentY: number, fieldW: number): number => {
        const displayVal = value?.trim() || '';
        page.drawText(label, { x, y: currentY, size: 7.5, font, color: COLORS.muted });
        // Draw input box
        const inputY = currentY - 13;
        const inputH = 18;
        drawRoundedRect(x, inputY - inputH + 4, fieldW, inputH, { fill: rgb(0.98, 0.98, 0.98), border: COLORS.border, borderWidth: 0.5 });
        if (displayVal) {
            page.drawText(displayVal, { x: x + 4, y: inputY - 6, size: 8.5, font, color: COLORS.black });
        }
        return 35;
    };

    const drawSelectField = (label: string, value: string, x: number, currentY: number, fieldW: number): number => {
        page.drawText(label, { x, y: currentY, size: 7.5, font, color: COLORS.muted });
        const inputY = currentY - 13;
        const inputH = 18;
        drawRoundedRect(x, inputY - inputH + 4, fieldW, inputH, { fill: rgb(0.98, 0.98, 0.98), border: COLORS.border, borderWidth: 0.5 });
        page.drawText(value || 'Non', { x: x + 4, y: inputY - 6, size: 8.5, font, color: COLORS.black });
        return 35;
    };

    // ── Title ────────────────────────────────────────────────────────

    ensureSpace(50);
    // Title bar
    drawRoundedRect(MARGIN, y - 36, CONTENT_WIDTH, 36, { fill: COLORS.primary });
    page.drawText("Constat Amiable d'Accident Automobile", {
        x: MARGIN + 14, y: y - 24, size: 14, font: bold, color: COLORS.white,
    });
    y -= 44;

    // Subtitle
    page.drawText('Document genere via SANAD - a faire valider et signer par les deux conducteurs.', {
        x: MARGIN, y, size: 7.5, font, color: COLORS.muted,
    });
    y -= 16;

    // ── Informations générales ───────────────────────────────────────

    const infoContentH = 120;
    drawSectionBox('Informations générales', COLORS.primaryLight, COLORS.primary, infoContentH, (startY, boxX, boxW) => {
        const pad = 10;
        const innerW = boxW - pad * 2;
        const halfW = (innerW - 10) / 2;
        let cy = startY - 4;

        // Row: Date + Heure
        drawInputField('1. Date de l\'accident', data.date, boxX + pad, cy, halfW);
        drawInputField('Heure', data.heure, boxX + pad + halfW + 10, cy, halfW);
        cy -= 38;

        // Row: Lieu
        drawInputField('2. Lieu', data.lieu, boxX + pad, cy, innerW);
        cy -= 38;

        // Row: Blessés + Dégâts
        drawSelectField('3. Blessé(s), même léger', data.blesses === 'oui' ? 'Oui' : 'Non', boxX + pad, cy, halfW);
        drawSelectField('4. Dégâts autres véhicules', data.degatsAutresVehicules === 'oui' ? 'Oui' : 'Non', boxX + pad + halfW + 10, cy, halfW);
        cy -= 38;

        // Row: Témoins (left space for wrapping)
        drawInputField('Témoins (nom, adresse, tél.)', data.temoins, boxX + pad, cy, innerW);
    });

    // ── Vehicle sections + Circonstances (3-column layout) ──────────

    const vehicleContentH = 320;
    const circContentH = vehicleContentH;
    const colGap = 6;
    const vehColW = (CONTENT_WIDTH - colGap * 2) * 0.37; // ~37% each vehicle
    const circColW = CONTENT_WIDTH - vehColW * 2 - colGap * 2; // center column

    ensureSpace(vehicleContentH + 30);

    const threeColTopY = y;

    // Helper to draw a vehicle column
    const drawVehicleColumn = (label: 'A' | 'B', v: ConstatVehicleInfo, colX: number) => {
        const isA = label === 'A';
        const bgColor = isA ? COLORS.cyanLight : COLORS.amberLight;
        const borderColor = isA ? COLORS.cyanBorder : COLORS.amberBorder;
        const titleColor = isA ? COLORS.cyanText : COLORS.amberText;
        const headerH = 22;

        // Box
        drawRoundedRect(colX, threeColTopY - vehicleContentH - headerH, vehColW, vehicleContentH + headerH, { fill: bgColor, border: borderColor, borderWidth: 0.8 });
        // Header
        page.drawText(`Véhicule ${label}`, { x: colX + 10, y: threeColTopY - headerH + 7, size: 10, font: bold, color: titleColor });

        const pad = 8;
        const innerW = vehColW - pad * 2;
        const halfInner = (innerW - 6) / 2;
        let cy = threeColTopY - headerH - 6;

        // Conducteur section header
        page.drawText('1. Conducteur', { x: colX + pad, y: cy, size: 7.5, font: bold, color: COLORS.primary });
        cy -= 12;

        // Nom + Téléphone side by side
        drawInputField('Nom', v.conducteurNom, colX + pad, cy, halfInner);
        drawInputField('Téléphone', v.conducteurTelephone, colX + pad + halfInner + 6, cy, halfInner);
        cy -= 34;

        // Adresse
        drawInputField('Adresse', v.conducteurAdresse, colX + pad, cy, innerW);
        cy -= 34;

        // Permis
        drawInputField('N° permis', v.permisNumero, colX + pad, cy, halfInner);
        drawInputField('Délivré le', v.permisDelivreLe, colX + pad + halfInner + 6, cy, halfInner);
        cy -= 34;

        // Vehicule
        page.drawText('2. Vehicule', { x: colX + pad, y: cy, size: 7.5, font: bold, color: COLORS.primary });
        cy -= 12;
        drawInputField('Marque / type', v.vehiculeMarqueType, colX + pad, cy, halfInner);
        drawInputField('Immatriculation', v.immatriculation, colX + pad + halfInner + 6, cy, halfInner);
        cy -= 34;

        // Assurance
        page.drawText('3. Assurance', { x: colX + pad, y: cy, size: 7.5, font: bold, color: COLORS.primary });
        cy -= 12;
        drawInputField('Société', v.societeAssurance, colX + pad, cy, halfInner);
        drawInputField('N° contrat', v.numeroContrat, colX + pad + halfInner + 6, cy, halfInner);
        cy -= 34;

        // Point choc + dégâts
        drawInputField('Point de choc initial', v.pointChocInitial, colX + pad, cy, halfInner);
        drawInputField('Dégâts apparents', v.degatsApparents, colX + pad + halfInner + 6, cy, halfInner);
        cy -= 34;

        // Observations
        drawInputField('Observations', v.observations, colX + pad, cy, innerW);
    };

    // Draw Vehicle A (left)
    drawVehicleColumn('A', data.vehiculeA, MARGIN);

    // Draw Circonstances (center)
    const circX = MARGIN + vehColW + colGap;
    const circHeaderH = 22;
    drawRoundedRect(circX, threeColTopY - circContentH - circHeaderH, circColW, circContentH + circHeaderH, { border: COLORS.border, borderWidth: 0.8 });
    // Circonstances header
    drawRoundedRect(circX, threeColTopY - circHeaderH, circColW, circHeaderH, { fill: COLORS.primaryLight });
    const circTitle = '12. Circonstances';
    const circTitleW = bold.widthOfTextAtSize(circTitle, 9);
    page.drawText(circTitle, { x: circX + (circColW - circTitleW) / 2, y: threeColTopY - circHeaderH + 7, size: 9, font: bold, color: COLORS.primary });

    // A / B column headers
    let circY = threeColTopY - circHeaderH - 12;
    page.drawText('A', { x: circX + 6, y: circY, size: 8, font: bold, color: COLORS.cyanText });
    page.drawText('B', { x: circX + circColW - 14, y: circY, size: 8, font: bold, color: COLORS.amberText });
    circY -= 12;

    // Draw each circonstance row
    const rowH = 15;
    const labelMaxW = circColW - 40;
    CIRCONSTANCES_LABELS.forEach((c, i) => {
        if (circY - rowH < threeColTopY - circContentH - circHeaderH + 20) return; // safety

        // Checkbox A
        const cbSize = 7;
        const cbAx = circX + 5;
        const cbBx = circX + circColW - 13;
        const cbY = circY - 1;

        // Checkbox box A
        drawRoundedRect(cbAx, cbY - cbSize, cbSize, cbSize, { border: COLORS.muted, borderWidth: 0.4 });
        if (data.vehiculeA.circonstances[i]) {
            page.drawText('X', { x: cbAx + 1, y: cbY - cbSize + 1, size: 6, font: bold, color: COLORS.checkGreen });
        }

        // Checkbox box B
        drawRoundedRect(cbBx, cbY - cbSize, cbSize, cbSize, { border: COLORS.muted, borderWidth: 0.4 });
        if (data.vehiculeB.circonstances[i]) {
            page.drawText('X', { x: cbBx + 1, y: cbY - cbSize + 1, size: 6, font: bold, color: COLORS.checkGreen });
        }

        // Label
        const labelText = `${i + 1}. ${c}`;
        const truncated = font.widthOfTextAtSize(labelText, 6.5) > labelMaxW
            ? labelText.substring(0, Math.floor(labelMaxW / (font.widthOfTextAtSize('W', 6.5)))) + '…'
            : labelText;
        page.drawText(truncated, { x: circX + 16, y: circY - 6, size: 6.5, font, color: COLORS.black });

        // Separator line
        if (i < CIRCONSTANCES_LABELS.length - 1) {
            page.drawLine({
                start: { x: circX + 3, y: circY - rowH + 4 },
                end: { x: circX + circColW - 3, y: circY - rowH + 4 },
                thickness: 0.2, color: COLORS.border,
            });
        }
        circY -= rowH;
    });

    // Counts at bottom
    const countA = data.vehiculeA.circonstances.filter(Boolean).length;
    const countB = data.vehiculeB.circonstances.filter(Boolean).length;
    const countY = threeColTopY - circContentH - circHeaderH + 8;
    page.drawText(`Cochées: ${countA}`, { x: circX + 6, y: countY, size: 6.5, font: bold, color: COLORS.muted });
    page.drawText(`Cochées: ${countB}`, { x: circX + circColW - 40, y: countY, size: 6.5, font: bold, color: COLORS.muted });

    // Draw Vehicle B (right)
    drawVehicleColumn('B', data.vehiculeB, MARGIN + vehColW + colGap + circColW + colGap);

    y = threeColTopY - vehicleContentH - 22 - 10;

    // ── Location photo ───────────────────────────────────────────────
    if (data.lieuPhotoDataUrl) {
        try {
            ensureSpace(200);
            drawRoundedRect(MARGIN, y - 24, CONTENT_WIDTH, 24, { fill: COLORS.primaryLight });
            page.drawText("Photo du lieu de l'accident", { x: MARGIN + 10, y: y - 17, size: 10, font: bold, color: COLORS.primary });
            y -= 28;

            const base64 = data.lieuPhotoDataUrl.split(',')[1] || '';
            const isPng = data.lieuPhotoDataUrl.startsWith('data:image/png');
            const bytes = Uint8Array.from(Buffer.from(base64, 'base64'));
            const img = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
            const maxWidth = CONTENT_WIDTH - 20;
            const maxHeight = 200;
            const scale = Math.min(1, maxWidth / img.width, maxHeight / img.height);
            const drawW = img.width * scale;
            const drawH = img.height * scale;
            ensureSpace(drawH + 10);
            const imgX = MARGIN + (CONTENT_WIDTH - drawW) / 2;
            drawRoundedRect(imgX - 2, y - drawH - 2, drawW + 4, drawH + 4, { border: COLORS.border, borderWidth: 0.5 });
            page.drawImage(img, { x: imgX, y: y - drawH, width: drawW, height: drawH });
            y -= drawH + 12;
        } catch {
            // Skip silently if format is unsupported
        }
    }

    // ── Sketch (croquis) ─────────────────────────────────────────────
    if (data.croquisDataUrl) {
        try {
            ensureSpace(200);
            drawRoundedRect(MARGIN, y - 24, CONTENT_WIDTH, 24, { fill: COLORS.primaryLight });
            page.drawText("Croquis de l'accident", { x: MARGIN + 10, y: y - 17, size: 10, font: bold, color: COLORS.primary });
            y -= 28;

            const base64 = data.croquisDataUrl.split(',')[1] || '';
            const bytes = Uint8Array.from(Buffer.from(base64, 'base64'));
            const png = await doc.embedPng(bytes);
            const maxWidth = CONTENT_WIDTH - 20;
            const scale = Math.min(1, maxWidth / png.width);
            const drawW = png.width * scale;
            const drawH = png.height * scale;
            ensureSpace(drawH + 10);
            const imgX = MARGIN + (CONTENT_WIDTH - drawW) / 2;
            drawRoundedRect(imgX - 2, y - drawH - 2, drawW + 4, drawH + 4, { border: COLORS.border, borderWidth: 0.5 });
            page.drawImage(png, { x: imgX, y: y - drawH, width: drawW, height: drawH });
            y -= drawH + 12;
        } catch {
            // Skip silently
        }
    }

    // ── Observations générales ───────────────────────────────────────
    const obsText = data.observationsGenerales || '-';
    const obsLines = wrapText(obsText, font, 9, CONTENT_WIDTH - 24);
    const obsContentH = 8 + obsLines.length * 12 + 8;

    drawSectionBox('13. Observations générales', COLORS.primaryLight, COLORS.primary, obsContentH, (startY, boxX, boxW) => {
        obsLines.forEach((line, i) => {
            page.drawText(line, { x: boxX + 12, y: startY - 8 - i * 12, size: 9, font, color: COLORS.black });
        });
    });

    // ── Fraud results (if any) ───────────────────────────────────────
    if (fraudResults && (fraudResults.A || fraudResults.B)) {
        ensureSpace(40);
        drawRoundedRect(MARGIN, y - 20, CONTENT_WIDTH, 20, { fill: rgb(0.98, 0.92, 0.91) });
        page.drawText('Vérification anti-fraude (photos vs. déclaration)', { x: MARGIN + 10, y: y - 14, size: 9, font: bold, color: COLORS.danger });
        y -= 26;

        (['A', 'B'] as const).forEach((label) => {
            const r = fraudResults[label];
            if (!r) return;
            const flagged = r.inconsistencyDetected;
            ensureSpace(50);

            const statusColor = flagged ? COLORS.danger : COLORS.success;
            const statusBg = flagged ? rgb(0.98, 0.92, 0.91) : rgb(0.92, 0.97, 0.94);
            const statusText = flagged ? 'INCOHÉRENCE DÉTECTÉE' : 'Cohérent avec la déclaration';

            drawRoundedRect(MARGIN + 4, y - 14, CONTENT_WIDTH - 8, 14, { fill: statusBg });
            page.drawText(`Véhicule ${label}: ${statusText}`, { x: MARGIN + 10, y: y - 11, size: 8.5, font: bold, color: statusColor });
            y -= 18;

            const explLines = wrapText(`Constat: ${r.explanation}`, font, 8, CONTENT_WIDTH - 30);
            explLines.forEach((line, i) => {
                page.drawText(line, { x: MARGIN + 14, y: y - i * 11, size: 8, font, color: COLORS.muted });
            });
            y -= explLines.length * 11 + 6;
        });
        y -= 4;
    }

    // ── Signatures ───────────────────────────────────────────────────
    ensureSpace(70);
    const sigColWidth = CONTENT_WIDTH / 2;
    const sigBoxH = 60;

    drawRoundedRect(MARGIN, y - sigBoxH, CONTENT_WIDTH, sigBoxH, { border: COLORS.border, borderWidth: 0.5 });

    page.drawText('Signature conducteur A:', { x: MARGIN + 14, y: y - 14, size: 9, font: bold, color: COLORS.cyanText });
    page.drawText('Signature conducteur B:', { x: MARGIN + sigColWidth + 14, y: y - 14, size: 9, font: bold, color: COLORS.amberText });

    page.drawLine({
        start: { x: MARGIN + sigColWidth, y: y },
        end: { x: MARGIN + sigColWidth, y: y - sigBoxH },
        thickness: 0.5,
        color: COLORS.border,
    });

    const embedSignature = async (dataUrl: string, boxX: number, boxW: number) => {
        if (!dataUrl) return;
        try {
            const base64 = dataUrl.split(',')[1] || '';
            const bytes = Uint8Array.from(Buffer.from(base64, 'base64'));
            const png = await doc.embedPng(bytes);
            const maxW = boxW - 28;
            const maxH = 36;
            const scale = Math.min(1, maxW / png.width, maxH / png.height);
            const drawW = png.width * scale;
            const drawH = png.height * scale;
            const imgX = boxX + (boxW - drawW) / 2;
            const imgY = y - 52;
            page.drawImage(png, { x: imgX, y: imgY, width: drawW, height: drawH });
        } catch {
            // keep blank line if signature invalid
        }
    };

    await embedSignature(data.signatureConducteurA, MARGIN, sigColWidth);
    await embedSignature(data.signatureConducteurB, MARGIN + sigColWidth, sigColWidth);

    if (!data.signatureConducteurA) {
        page.drawLine({
            start: { x: MARGIN + 14, y: y - 48 },
            end: { x: MARGIN + sigColWidth - 14, y: y - 48 },
            thickness: 0.4,
            color: COLORS.muted,
        });
    }
    if (!data.signatureConducteurB) {
        page.drawLine({
            start: { x: MARGIN + sigColWidth + 14, y: y - 48 },
            end: { x: MARGIN + CONTENT_WIDTH - 14, y: y - 48 },
            thickness: 0.4,
            color: COLORS.muted,
        });
    }

    y -= sigBoxH + 8;

    // Footer
    ensureSpace(16);
    page.drawText("Genere par SANAD - Plateforme d'assurance automobile", {
        x: MARGIN, y: y - 4, size: 7, font, color: COLORS.muted,
    });

    return doc.save();
}
