/**
 * PDF generation utilities for session charts.
 *
 * Designed for session musicians: clean Nashville-number chart layout,
 * piano voicings, guitar tabs, function explanations, and performance tips.
 *
 * Extensible via PdfChordEntry — add fields here as the app grows.
 */

import type { jsPDF as JsPDFType } from 'jspdf';

// ─── Public data types ─────────────────────────────────────────────────────

export type PdfChordEntry = {
  /** Chord symbol, e.g. "Cmaj7" */
  chord: string;
  /** Roman numeral from API, e.g. "IVmaj7" — auto-converted to Nashville */
  romanNumeral?: string | null;
  /** Plain-language role in the progression */
  functionExplanation?: string | null;
  /** Voicing advice */
  voicingHint?: string | null;
  /** Piano left-hand / right-hand notes */
  pianoVoicing?: { leftHand: string[]; rightHand: string[] } | null;
  /** Guitar tab string, e.g. "x32010" */
  guitarVoicingText?: string | null;
  /** 1–5 tension rating */
  tensionLevel?: number | null;
  /** Number of beats the chord lasts */
  beats?: number;
};

export type PdfChartOptions = {
  /** Printed title at the top of the page */
  title: string;
  /** Ordered list of chords to include */
  chords: PdfChordEntry[];
  /** Optional feel descriptor, e.g. "dark and moody" */
  feel?: string;
  /** Optional performance instruction for the band */
  performanceTip?: string | null;
  /** Playback / reference BPM */
  tempoBpm?: number;
  /** Genre context */
  genre?: string;
  /** Key / scale / mode, e.g. "C Dorian" */
  scale?: string;
  /** Any free-form notes added to the foot of the chart */
  extraNotes?: string;
};

// ─── Nashville converter ───────────────────────────────────────────────────

/**
 * Converts a Roman-numeral chord symbol to the Nashville Number System.
 *
 * Examples:
 *   "IVmaj7" → "4maj7"
 *   "bVII"   → "b7"
 *   "ii7"    → "2m7"  (lowercase Roman = minor)
 */
export function romanToNashville(roman: string): string {
  if (!roman) return '';

  let working = roman.trim();
  let accidental = '';

  if (working.startsWith('bb')) {
    accidental = 'bb';
    working = working.slice(2);
  } else if (working.startsWith('b') && !/^b[^b]/.test(working) === false) {
    // only strip leading 'b' if it reads as flat, not as the note B
    accidental = 'b';
    working = working.slice(1);
  } else if (working.startsWith('#')) {
    accidental = '#';
    working = working.slice(1);
  }

  // Ordered longest-first so "VII" is matched before "V"
  const romanNumerals: [string, string][] = [
    ['VII', '7'],
    ['VI', '6'],
    ['IV', '4'],
    ['V', '5'],
    ['III', '3'],
    ['II', '2'],
    ['I', '1'],
  ];

  for (const [rom, num] of romanNumerals) {
    const upper = working.toUpperCase();
    if (upper.startsWith(rom)) {
      const isMinor =
        working[0] === working[0].toLowerCase() && working[0] !== working[0].toUpperCase();
      const qualitySuffix = working.slice(rom.length);
      // If the Roman numeral was lowercase and there's no explicit 'm' suffix, add one
      const minorMark = isMinor && !qualitySuffix.startsWith('m') ? 'm' : '';
      return accidental + num + minorMark + qualitySuffix;
    }
  }

  return roman; // Unrecognised — pass through unchanged
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatVoicing(entry: PdfChordEntry): string {
  if (entry.pianoVoicing) {
    const lh = entry.pianoVoicing.leftHand.join(' ');
    const rh = entry.pianoVoicing.rightHand.join(' ');
    return `LH: ${lh}\nRH: ${rh}`;
  }
  if (entry.guitarVoicingText) {
    return entry.guitarVoicingText;
  }
  return '—';
}

function tensionDots(level?: number | null): string {
  if (!level) return '';
  return '●'.repeat(level) + '○'.repeat(5 - level);
}

// ─── PDF generator ────────────────────────────────────────────────────────

/** Dynamically imports jsPDF to stay compatible with Next.js SSR */
async function loadJsPdf(): Promise<{
  jsPDF: typeof JsPDFType;
  autoTable: (doc: JsPDFType, options: object) => void;
}> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  return { jsPDF, autoTable };
}

/**
 * Generates and triggers a browser download of a session-ready PDF chart.
 */
export async function downloadSessionPdf(options: PdfChartOptions): Promise<void> {
  const { jsPDF, autoTable } = await loadJsPdf();

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentW = pageW - margin * 2;

  // ── Palette ────────────────────────────────────────────────────────────
  const blue: [number, number, number] = [37, 99, 235];
  const darkBlue: [number, number, number] = [30, 58, 138];
  const lightGrey: [number, number, number] = [245, 247, 250];
  const midGrey: [number, number, number] = [107, 114, 128];
  const black: [number, number, number] = [17, 24, 39];

  // ── Header bar ─────────────────────────────────────────────────────────
  doc.setFillColor(...darkBlue);
  doc.rect(0, 0, pageW, 16, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PROGRESSIONLAB.AI', margin, 10.5);
  doc.setFont('helvetica', 'normal');
  doc.text('SESSION CHART', pageW - margin, 10.5, { align: 'right' });

  // ── Title ──────────────────────────────────────────────────────────────
  let y = 26;
  doc.setTextColor(...black);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(options.title, margin, y);
  y += 8;

  // ── Metadata row ───────────────────────────────────────────────────────
  const meta: [string, string | undefined][] = [
    ['Key / Scale', options.scale],
    ['Genre', options.genre],
    ['BPM', options.tempoBpm !== undefined ? String(options.tempoBpm) : undefined],
    ['Feel', options.feel],
  ].filter((pair): pair is [string, string] => typeof pair[1] === 'string' && pair[1].length > 0);

  if (meta.length > 0) {
    const colW = contentW / meta.length;
    meta.forEach(([label, value], i) => {
      const x = margin + i * colW;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...midGrey);
      doc.text(label.toUpperCase(), x, y);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...black);
      doc.text(String(value), x, y + 5);
    });
    y += 14;
  }

  // ── Divider ────────────────────────────────────────────────────────────
  doc.setDrawColor(...blue);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  // ── Section label ──────────────────────────────────────────────────────
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...blue);
  doc.text('NASHVILLE CHART', margin, y);
  y += 4;

  // ── Chord table ────────────────────────────────────────────────────────
  const hasVoicings = options.chords.some((c) => c.pianoVoicing ?? c.guitarVoicingText);
  const hasFunction = options.chords.some((c) => c.functionExplanation);

  const columns: { header: string; dataKey: string }[] = [
    { header: 'Nashville', dataKey: 'nashville' },
    { header: 'Roman', dataKey: 'roman' },
    { header: 'Chord', dataKey: 'chord' },
  ];

  if (hasVoicings) {
    columns.push({ header: 'Voicing', dataKey: 'voicing' });
  }
  if (hasFunction) {
    columns.push({ header: 'Function', dataKey: 'function' });
  }
  columns.push({ header: 'Tension', dataKey: 'tension' });

  const rows = options.chords.map((entry) => ({
    nashville: entry.romanNumeral ? romanToNashville(entry.romanNumeral) : '—',
    roman: entry.romanNumeral ?? '—',
    chord: entry.chord,
    voicing: formatVoicing(entry),
    function: entry.functionExplanation ?? '—',
    tension: tensionDots(entry.tensionLevel),
  }));

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => r[c.dataKey as keyof typeof r])),
    theme: 'grid',
    headStyles: {
      fillColor: blue,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: black,
    },
    alternateRowStyles: {
      fillColor: lightGrey,
    },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: 'bold' },
      1: { cellWidth: 22 },
      2: { cellWidth: 26, fontStyle: 'bold' },
    },
    styles: {
      lineColor: [209, 213, 219],
      lineWidth: 0.3,
      overflow: 'linebreak',
    },
  });

  // Get Y after the table
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  y = finalY;

  // ── Voicing hints ──────────────────────────────────────────────────────
  const hints = options.chords.filter((c) => c.voicingHint);
  if (hints.length > 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...blue);
    doc.text('VOICING HINTS', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...black);
    hints.forEach((entry) => {
      const line = `• ${entry.chord}: ${entry.voicingHint}`;
      const wrapped = doc.splitTextToSize(line, contentW);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 4.5;
    });
    y += 3;
  }

  // ── Performance tip ────────────────────────────────────────────────────
  if (options.performanceTip) {
    doc.setFillColor(...lightGrey);
    const tipLines = doc.splitTextToSize(
      `Performance tip: ${options.performanceTip}`,
      contentW - 8,
    );
    const tipBoxH = tipLines.length * 4.5 + 8;
    doc.roundedRect(margin, y, contentW, tipBoxH, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bolditalic');
    doc.setTextColor(...darkBlue);
    doc.text(tipLines, margin + 4, y + 5.5);
    y += tipBoxH + 6;
  }

  // ── Extra notes ────────────────────────────────────────────────────────
  if (options.extraNotes) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...midGrey);
    const noteLines = doc.splitTextToSize(options.extraNotes, contentW);
    doc.text(noteLines, margin, y);
  }

  // ── Footer ─────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(lightGrey[0], lightGrey[1], lightGrey[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...midGrey);
  doc.text('Generated by ProgressionLab.AI', margin, pageH - 7);
  doc.text(new Date().toLocaleDateString(), pageW - margin, pageH - 7, { align: 'right' });

  // ── Download ───────────────────────────────────────────────────────────
  const safeName = options.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`${safeName}_session_chart.pdf`);
}
