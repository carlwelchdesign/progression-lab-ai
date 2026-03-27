/**
 * PDF generation utilities for session charts.
 *
 * Designed for session musicians: clean Nashville-number chart layout,
 * piano/guitar charts, and performance tips.
 *
 * Extensible via PdfChordEntry — add fields here as the app grows.
 */

import type { jsPDF as JsPDFType } from 'jspdf';

import { NOTE_TO_SEMITONE } from './noteToSemitone';

// ─── Public data types ─────────────────────────────────────────────────────

export type PdfChordEntry = {
  /** Chord symbol, e.g. "Cmaj7" */
  chord: string;
  /** Roman numeral from API, e.g. "IVmaj7" — auto-converted to Nashville */
  romanNumeral?: string | null;
  /** Voicing advice */
  voicingHint?: string | null;
  /** Piano left-hand / right-hand notes */
  pianoVoicing?: { leftHand: string[]; rightHand: string[] } | null;
  /** Guitar tab/fret string, e.g. "x32010" */
  guitarVoicingText?: string | null;
  /** Structured guitar diagram data used for printable chart rendering */
  guitarDiagram?: {
    position: number | null;
    fingers: Array<[number, number | 'x']>;
  } | null;
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
 *   "I/V"    → "1/5"  (slash bass / inversion)
 *   "vii°"   → "7°"   (diminished)
 */
export function romanToNashville(roman: string): string {
  if (!roman) return '';

  const romanNumerals: Record<string, string> = {
    I: '1',
    II: '2',
    III: '3',
    IV: '4',
    V: '5',
    VI: '6',
    VII: '7',
  };

  const convertToken = (token: string): string => {
    const match = token.match(/^(bb|b|#)?(vii|vi|iv|v|iii|ii|i)(.*)$/i);
    if (!match) {
      return token;
    }

    const [, accidental = '', numeralRaw, suffixRaw = ''] = match;
    const numeralUpper = numeralRaw.toUpperCase();
    const degree = romanNumerals[numeralUpper];
    if (!degree) {
      return token;
    }

    const isLowercase = numeralRaw === numeralRaw.toLowerCase();
    let suffix = suffixRaw.trim();

    if (/^(dim|o)(?![a-z])/i.test(suffix)) {
      suffix = suffix.replace(/^(dim|o)(?![a-z])/i, '°');
    }

    const hasExplicitQualityPrefix = /^(m|-|maj|min|sus|add|aug|\+|°|o|dim|ø)/i.test(suffix);
    const minorMark = isLowercase && !hasExplicitQualityPrefix ? 'm' : '';

    return `${accidental}${degree}${minorMark}${suffix}`;
  };

  const [basePart, slashPart] = roman.trim().split('/');
  const convertedBase = convertToken(basePart);

  if (!slashPart) {
    return convertedBase;
  }

  const convertedSlash = convertToken(slashPart);
  return `${convertedBase}/${convertedSlash}`;
}

const MAJOR_SCALE_STEPS = [0, 2, 4, 5, 7, 9, 11];

function parseRoot(noteLike: string): string | null {
  const match = noteLike.trim().match(/^([A-G](?:#|b)?)/);
  return match ? match[1] : null;
}

function parseChordSymbol(chord: string): { root: string; suffix: string; bass?: string } | null {
  const [main, bassRaw] = chord.trim().split('/');
  const match = main.match(/^([A-G](?:#|b)?)(.*)$/);
  if (!match) {
    return null;
  }

  const root = match[1];
  const suffix = match[2] ?? '';
  const bass = bassRaw ? (parseRoot(bassRaw) ?? undefined) : undefined;

  return { root, suffix, bass };
}

function semitoneToNashvilleDegree(interval: number): string {
  const normalized = ((interval % 12) + 12) % 12;

  const directDegree = MAJOR_SCALE_STEPS.indexOf(normalized);
  if (directDegree !== -1) {
    return String(directDegree + 1);
  }

  const preferredChromaticMap: Record<number, string> = {
    1: 'b2',
    3: 'b3',
    6: '#4',
    8: 'b6',
    10: 'b7',
  };

  const preferred = preferredChromaticMap[normalized];
  if (preferred) {
    return preferred;
  }

  let bestDegree = 1;
  let bestDelta = Number.POSITIVE_INFINITY;

  for (let i = 0; i < MAJOR_SCALE_STEPS.length; i += 1) {
    const base = MAJOR_SCALE_STEPS[i];
    const up = ((normalized - base + 18) % 12) - 6;
    const absUp = Math.abs(up);
    if (absUp < bestDelta) {
      bestDelta = absUp;
      bestDegree = i + 1;
    }
  }

  const base = MAJOR_SCALE_STEPS[bestDegree - 1];
  const delta = ((normalized - base + 18) % 12) - 6;
  const accidental = delta < 0 ? 'b'.repeat(Math.abs(delta)) : '#'.repeat(delta);
  return `${accidental}${bestDegree}`;
}

function nashvilleQualityFromSuffix(suffixInput: string): string {
  let suffix = suffixInput.trim();
  if (!suffix) {
    return '';
  }

  if (/^(maj)/i.test(suffix)) {
    return suffix;
  }

  if (/^(m(?!aj)|min)/i.test(suffix)) {
    suffix = suffix.replace(/^(m(?!aj)|min)/i, '');
    return `m${suffix}`;
  }

  if (/^(dim|o|°)/i.test(suffix)) {
    suffix = suffix.replace(/^(dim|o|°)/i, '');
    return `°${suffix}`;
  }

  return suffix;
}

function inferTonicFromScaleOrChords(
  scale: string | undefined,
  chords: PdfChordEntry[],
): string | null {
  const fromScale = scale ? parseRoot(scale) : null;
  if (fromScale) {
    return fromScale;
  }

  for (const chord of chords) {
    const parsed = parseChordSymbol(chord.chord);
    if (parsed) {
      return parsed.root;
    }
  }

  return null;
}

/**
 * Converts a chord symbol into Nashville notation relative to a tonic.
 */
export function chordToNashville(chord: string, tonic: string): string | null {
  const parsed = parseChordSymbol(chord);
  if (!parsed) {
    return null;
  }

  const tonicSemitone = NOTE_TO_SEMITONE[tonic];
  const rootSemitone = NOTE_TO_SEMITONE[parsed.root];

  if (tonicSemitone === undefined || rootSemitone === undefined) {
    return null;
  }

  const interval = (rootSemitone - tonicSemitone + 12) % 12;
  const degree = semitoneToNashvilleDegree(interval);
  const quality = nashvilleQualityFromSuffix(parsed.suffix);

  if (!parsed.bass) {
    return `${degree}${quality}`;
  }

  const bassSemitone = NOTE_TO_SEMITONE[parsed.bass];
  if (bassSemitone === undefined) {
    return `${degree}${quality}`;
  }

  const bassInterval = (bassSemitone - tonicSemitone + 12) % 12;
  const bassDegree = semitoneToNashvilleDegree(bassInterval);
  return `${degree}${quality}/${bassDegree}`;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const NOTE_CLASS_TO_SEMITONE: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
};

const WHITE_PITCH_CLASSES = new Set([0, 2, 4, 5, 7, 9, 11]);
const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);
const PIANO_START_MIDI = 36; // C2
const PIANO_END_MIDI = 95; // B6

function parseNoteToMidi(note: string): number | null {
  const parsed = note.trim().match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
  if (!parsed) {
    return null;
  }

  const [, letter, accidental, octaveText] = parsed;
  const noteClass = `${letter.toUpperCase()}${accidental}`;
  const semitone = NOTE_CLASS_TO_SEMITONE[noteClass];

  if (semitone === undefined) {
    return null;
  }

  const octave = Number(octaveText);
  return (octave + 1) * 12 + semitone;
}

function drawPianoChart(
  doc: JsPDFType,
  x: number,
  y: number,
  width: number,
  height: number,
  voicing: PdfChordEntry['pianoVoicing'],
): void {
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, width, height, 1.5, 1.5, 'S');

  if (!voicing) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text('No piano voicing', x + 3, y + height / 2 + 1);
    return;
  }

  const highlightedMidis = new Set<number>();
  [...voicing.leftHand, ...voicing.rightHand].forEach((note) => {
    const midi = parseNoteToMidi(note);
    if (midi !== null && midi >= PIANO_START_MIDI && midi <= PIANO_END_MIDI) {
      highlightedMidis.add(midi);
    }
  });

  const keyboardX = x + 2.5;
  const keyboardY = y + 3.2;
  const keyboardW = width - 6;
  const keyboardH = Math.max(10, height - 12.2);

  const whiteMidis: number[] = [];
  for (let midi = PIANO_START_MIDI; midi <= PIANO_END_MIDI; midi += 1) {
    if (WHITE_PITCH_CLASSES.has(midi % 12)) {
      whiteMidis.push(midi);
    }
  }

  const whiteKeyW = keyboardW / whiteMidis.length;
  const whiteXByMidi = new Map<number, number>();

  for (let i = 0; i < whiteMidis.length; i += 1) {
    const midi = whiteMidis[i];
    const keyX = keyboardX + i * whiteKeyW;
    whiteXByMidi.set(midi, keyX);

    if (highlightedMidis.has(midi)) {
      doc.setFillColor(208, 230, 253);
      doc.rect(keyX, keyboardY, whiteKeyW, keyboardH, 'F');
    }

    doc.setDrawColor(156, 163, 175);
    doc.rect(keyX, keyboardY, whiteKeyW, keyboardH, 'S');
  }

  const blackKeyW = whiteKeyW * 0.56;
  const blackKeyH = keyboardH * 0.58;

  for (let midi = PIANO_START_MIDI; midi <= PIANO_END_MIDI; midi += 1) {
    if (!BLACK_PITCH_CLASSES.has(midi % 12)) {
      continue;
    }

    let prevWhiteMidi: number | null = null;
    let nextWhiteMidi: number | null = null;
    for (let probe = midi - 1; probe >= PIANO_START_MIDI; probe -= 1) {
      if (WHITE_PITCH_CLASSES.has(probe % 12)) {
        prevWhiteMidi = probe;
        break;
      }
    }
    for (let probe = midi + 1; probe <= PIANO_END_MIDI; probe += 1) {
      if (WHITE_PITCH_CLASSES.has(probe % 12)) {
        nextWhiteMidi = probe;
        break;
      }
    }

    if (prevWhiteMidi === null || nextWhiteMidi === null) {
      continue;
    }

    const prevX = whiteXByMidi.get(prevWhiteMidi);
    const nextX = whiteXByMidi.get(nextWhiteMidi);
    if (prevX === undefined || nextX === undefined) {
      continue;
    }

    const keyCenterX = (prevX + whiteKeyW + nextX) / 2;
    const keyX = keyCenterX - blackKeyW / 2;

    if (highlightedMidis.has(midi)) {
      doc.setFillColor(96, 165, 250);
      doc.rect(keyX, keyboardY, blackKeyW, blackKeyH, 'F');
    } else {
      doc.setFillColor(31, 41, 55);
      doc.rect(keyX, keyboardY, blackKeyW, blackKeyH, 'F');
    }
  }

  // Label each C on the keyboard so octave span is visible at a glance.
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  for (let midi = PIANO_START_MIDI; midi <= PIANO_END_MIDI; midi += 1) {
    if (midi % 12 !== 0) {
      continue;
    }
    const keyX = whiteXByMidi.get(midi);
    if (keyX === undefined) {
      continue;
    }
    const octave = Math.floor(midi / 12) - 1;
    doc.text(`C${octave}`, keyX + 0.2, keyboardY + keyboardH - 0.7);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(75, 85, 99);
  doc.text(`LH: ${voicing.leftHand.join(' ')}`, x + 3, y + height - 4);
  doc.text(`RH: ${voicing.rightHand.join(' ')}`, x + 3, y + height - 1.2);
}

function drawGuitarChart(
  doc: JsPDFType,
  x: number,
  y: number,
  width: number,
  height: number,
  entry: PdfChordEntry,
): void {
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(55, 65, 81);
  doc.text('Guitar', x, y - 1.5);

  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, width, height, 1.5, 1.5, 'S');

  const diagram = entry.guitarDiagram;
  if (!diagram || diagram.fingers.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    const fallback = entry.guitarVoicingText
      ? `Shape: ${entry.guitarVoicingText}`
      : 'No guitar chart';
    doc.text(fallback, x + 3, y + height / 2 + 1);
    return;
  }

  const innerPad = width < 26 ? 2.5 : 5;
  const gridX = x + innerPad;
  const gridY = y + 4;
  const gridW = width - innerPad * 2;
  const gridH = height - 9;
  const stringGap = gridW / 5;
  const fretGap = gridH / 5;
  const baseFret = diagram.position && diagram.position > 1 ? diagram.position : 1;

  doc.setDrawColor(156, 163, 175);
  doc.setLineWidth(baseFret === 1 ? 0.5 : 0.2);
  doc.line(gridX, gridY, gridX + gridW, gridY);

  doc.setLineWidth(0.2);
  for (let fret = 1; fret <= 5; fret += 1) {
    const lineY = gridY + fret * fretGap;
    doc.line(gridX, lineY, gridX + gridW, lineY);
  }

  for (let stringIndex = 0; stringIndex < 6; stringIndex += 1) {
    const lineX = gridX + stringIndex * stringGap;
    doc.line(lineX, gridY, lineX, gridY + gridH);
  }

  if (baseFret > 1) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(75, 85, 99);
    doc.text(`${baseFret}fr`, x + 1.2, gridY + 2.4);
  }

  diagram.fingers.forEach(([stringNumber, fret]) => {
    const xPos = gridX + (6 - stringNumber) * stringGap;

    if (fret === 'x') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(width < 26 ? 6 : 7);
      doc.setTextColor(107, 114, 128);
      doc.text('x', xPos - (width < 26 ? 0.8 : 1), gridY - 1.2);
      return;
    }

    if (fret === 0 && baseFret === 1) {
      doc.setDrawColor(96, 165, 250);
      doc.circle(xPos, gridY - 1.2, 0.9, 'S');
      return;
    }

    const relativeFret = fret - baseFret + 1;
    if (relativeFret < 1 || relativeFret > 5) {
      return;
    }

    const yPos = gridY + (relativeFret - 0.5) * fretGap;
    doc.setFillColor(96, 165, 250);
    doc.circle(xPos, yPos, width < 26 ? 0.8 : 1.2, 'F');
  });
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
  const inferredTonic = inferTonicFromScaleOrChords(options.scale, options.chords);
  const getNashvilleForEntry = (entry: PdfChordEntry): string => {
    if (entry.romanNumeral) {
      return romanToNashville(entry.romanNumeral);
    }

    if (inferredTonic) {
      const fromChord = chordToNashville(entry.chord, inferredTonic);
      if (fromChord) {
        return fromChord;
      }
    }

    return '?';
  };

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

  // ── Nashville line for quick band readability ─────────────────────────
  const nashvilleLine = options.chords.map((entry) => getNashvilleForEntry(entry)).join('   |   ');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  const wrappedNashville = doc.splitTextToSize(
    nashvilleLine || 'No Nashville data provided',
    contentW,
  );
  doc.text(wrappedNashville, margin, y + 1);
  y += wrappedNashville.length * 4.5 + 4;

  // ── Chord table ────────────────────────────────────────────────────────
  const hasBeats = options.chords.some((c) => typeof c.beats === 'number' && c.beats > 0);
  const hasPiano = options.chords.some((c) => c.pianoVoicing);
  const hasGuitar = options.chords.some((c) => c.guitarDiagram ?? c.guitarVoicingText);

  const columns: { header: string; dataKey: string }[] = [
    { header: 'Nashville', dataKey: 'nashville' },
    { header: 'Chord', dataKey: 'chord' },
  ];

  if (hasBeats) {
    columns.push({ header: 'Beats', dataKey: 'beats' });
  }

  if (hasPiano) {
    columns.push({ header: 'Piano Notes', dataKey: 'piano' });
  }
  if (hasGuitar) {
    columns.push({ header: 'Guitar Shape', dataKey: 'guitar' });
  }

  const rows = options.chords.map((entry) => ({
    nashville: getNashvilleForEntry(entry),
    chord: entry.chord,
    beats: entry.beats ? String(entry.beats) : '—',
    piano: entry.pianoVoicing
      ? `LH: ${entry.pianoVoicing.leftHand.join(' ')}\nRH: ${entry.pianoVoicing.rightHand.join(' ')}`
      : '—',
    guitar: entry.guitarVoicingText ?? '—',
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
      1: { cellWidth: 26, fontStyle: 'bold' },
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

  // ── Printable instrument charts ───────────────────────────────────────
  const hasAnyChartData = options.chords.some((chord) => chord.pianoVoicing || chord.guitarDiagram);
  if (hasAnyChartData) {
    const pageH = doc.internal.pageSize.getHeight();
    const chartHeight = 24;
    const cardGap = 4;

    if (y + 10 > pageH - 18) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...blue);
    doc.text('CHORD CHARTS', margin, y);
    y += 5;

    options.chords.forEach((entry) => {
      const requiredHeight = chartHeight + 8;
      if (y + requiredHeight > pageH - 18) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...black);
      const nashville = getNashvilleForEntry(entry);
      doc.text(`${entry.chord}  (${nashville})`, margin, y);
      y += 2.5;

      const priorGuitarWidth = (contentW - cardGap) / 2;
      const guitarW = priorGuitarWidth / 4;
      const pianoW = contentW - cardGap - guitarW;
      drawPianoChart(doc, margin, y, pianoW, chartHeight, entry.pianoVoicing);
      drawGuitarChart(doc, margin + pianoW + cardGap, y, guitarW, chartHeight, entry);
      y += chartHeight + 5.5;
    });
  }

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
