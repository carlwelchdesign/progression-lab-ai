import type { PianoVoicing } from './types';
import { NOTE_NAME_TO_SEMITONE } from '../domain/music/musicNoteConstants';

/**
 * MIDI encoding constants used for exported chord/progression files.
 */
const TICKS_PER_QUARTER = 480;
const DEFAULT_VELOCITY = 84;
const DEFAULT_TEMPO_BPM = 100;
const MIN_TEMPO_BPM = 40;
const MAX_TEMPO_BPM = 240;
const CHORD_DURATION_TICKS = TICKS_PER_QUARTER * 4;

type MidiNoteEvent = {
  midi: number;
  startTick: number;
  durationTicks: number;
  velocity?: number;
};

/**
 * Converts a note in scientific pitch notation (e.g., C#4) to a MIDI note number.
 */
function parseNoteToMidi(note: string): number {
  const parsed = note.trim().match(/^([A-Ga-g])([#b]?)(-?\d+)$/);

  if (!parsed) {
    throw new Error(`Unsupported note format: ${note}`);
  }

  const [, letter, accidental, octaveText] = parsed;
  const noteClass = `${letter.toUpperCase()}${accidental}`;
  const semitone = NOTE_NAME_TO_SEMITONE[noteClass];

  if (semitone === undefined) {
    throw new Error(`Unsupported note class: ${noteClass}`);
  }

  const octave = Number(octaveText);

  return (octave + 1) * 12 + semitone;
}

function encodeVariableLength(value: number): number[] {
  let buffer = value & 0x7f;
  const bytes = [];

  while ((value >>= 7) > 0) {
    buffer <<= 8;
    buffer |= (value & 0x7f) | 0x80;
  }

  while (true) {
    bytes.push(buffer & 0xff);

    if (buffer & 0x80) {
      buffer >>= 8;
      continue;
    }

    break;
  }

  return bytes;
}

function encodeText(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

function numberToBytes(value: number, length: number): number[] {
  return Array.from({ length }, (_, index) => {
    const shift = (length - index - 1) * 8;
    return (value >> shift) & 0xff;
  });
}

function normalizeTempoBpm(value?: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_TEMPO_BPM;
  }

  return Math.min(MAX_TEMPO_BPM, Math.max(MIN_TEMPO_BPM, Math.round(value ?? DEFAULT_TEMPO_BPM)));
}

/**
 * Builds a single MIDI track chunk including tempo and note events.
 */
function buildTrackChunk(events: MidiNoteEvent[], trackName: string, tempoBpm: number): Uint8Array {
  const sortedEvents = events
    .flatMap((event) => [
      {
        tick: event.startTick,
        bytes: [0x90, event.midi, event.velocity ?? DEFAULT_VELOCITY],
        order: 1,
      },
      {
        tick: event.startTick + event.durationTicks,
        bytes: [0x80, event.midi, 0],
        order: 0,
      },
    ])
    .sort((a, b) => (a.tick === b.tick ? a.order - b.order : a.tick - b.tick));

  const tempoMicroseconds = Math.round(60000000 / normalizeTempoBpm(tempoBpm));
  const trackBytes = [
    ...encodeVariableLength(0),
    0xff,
    0x03,
    trackName.length,
    ...encodeText(trackName),
    ...encodeVariableLength(0),
    0xff,
    0x51,
    0x03,
    ...numberToBytes(tempoMicroseconds, 3),
  ];

  let previousTick = 0;

  sortedEvents.forEach((event) => {
    const delta = event.tick - previousTick;
    trackBytes.push(...encodeVariableLength(delta), ...event.bytes);
    previousTick = event.tick;
  });

  trackBytes.push(0x00, 0xff, 0x2f, 0x00);

  return new Uint8Array([
    0x4d,
    0x54,
    0x72,
    0x6b,
    ...numberToBytes(trackBytes.length, 4),
    ...trackBytes,
  ]);
}

/**
 * Creates a complete Type-0 MIDI file containing one track.
 */
function buildMidiFile(events: MidiNoteEvent[], trackName: string, tempoBpm: number): Uint8Array {
  const header = new Uint8Array([
    0x4d,
    0x54,
    0x68,
    0x64,
    0x00,
    0x00,
    0x00,
    0x06,
    0x00,
    0x00,
    0x00,
    0x01,
    ...numberToBytes(TICKS_PER_QUARTER, 2),
  ]);
  const track = buildTrackChunk(events, trackName, tempoBpm);

  return new Uint8Array([...header, ...track]);
}

function sanitizeFileName(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'progression-lab-ai'
  );
}

/**
 * Triggers browser download for generated MIDI bytes.
 */
function downloadMidi(bytes: Uint8Array, fileName: string): void {
  const arrayBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(arrayBuffer).set(bytes);

  const blob = new Blob([arrayBuffer], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function getVoicingMidiEvents(voicing: PianoVoicing, startTick: number): MidiNoteEvent[] {
  return [...voicing.leftHand, ...voicing.rightHand].map((note) => ({
    midi: parseNoteToMidi(note),
    startTick,
    durationTicks: CHORD_DURATION_TICKS,
  }));
}

/**
 * Downloads a single voicing as a MIDI file.
 */
export function downloadChordMidi(
  chordName: string,
  voicing: PianoVoicing,
  tempoBpm?: number,
): void {
  const bytes = buildMidiFile(
    getVoicingMidiEvents(voicing, 0),
    chordName,
    normalizeTempoBpm(tempoBpm),
  );
  downloadMidi(bytes, `${sanitizeFileName(chordName)}.mid`);
}

/**
 * Downloads a full progression as a MIDI file, one chord per bar.
 */
export function downloadProgressionMidi(
  progressionName: string,
  voicings: PianoVoicing[],
  tempoBpm?: number,
): void {
  const events = voicings.flatMap((voicing, index) =>
    getVoicingMidiEvents(voicing, index * CHORD_DURATION_TICKS),
  );
  const bytes = buildMidiFile(events, progressionName, normalizeTempoBpm(tempoBpm));
  downloadMidi(bytes, `${sanitizeFileName(progressionName)}.mid`);
}
