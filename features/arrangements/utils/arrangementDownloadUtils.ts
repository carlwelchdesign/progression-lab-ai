import type { Arrangement } from '../../../lib/types';
import type { PdfChordEntry } from '../../../lib/pdf';
import type { PdfChartOptions } from '../../../lib/pdf';

/**
 * Extracts unique chords from arrangement events and source chords.
 */
function extractChordEntriesFromArrangement(arrangement: Arrangement): PdfChordEntry[] {
  const chordMap = new Map<string, PdfChordEntry>();

  // Add source chords if available
  if (Array.isArray(arrangement.sourceChords)) {
    arrangement.sourceChords.forEach((chord) => {
      if (!chordMap.has(chord.key)) {
        chordMap.set(chord.key, {
          chord: chord.chord,
          pianoVoicing: {
            leftHand: chord.leftHand,
            rightHand: chord.rightHand,
          },
        });
      }
    });
  }

  // Add chords from timeline events (preserving order of appearance)
  if (arrangement.timeline.events && Array.isArray(arrangement.timeline.events)) {
    arrangement.timeline.events.forEach((event) => {
      if (!chordMap.has(event.chord)) {
        chordMap.set(event.chord, {
          chord: event.chord,
          pianoVoicing: {
            leftHand: event.leftHand,
            rightHand: event.rightHand,
          },
        });
      }
    });
  }

  return Array.from(chordMap.values());
}

/**
 * Converts an Arrangement to PdfChartOptions for session chart generation.
 */
export function arrangementToPdfOptions(arrangement: Arrangement): PdfChartOptions {
  const chords = extractChordEntriesFromArrangement(arrangement);
  const { tempoBpm, timeSignature } = arrangement.playbackSnapshot;

  // Build metadata string showing arrangement details
  const arrangementInfo = [
    `Time Signature: ${timeSignature}`,
    `Loop: ${arrangement.timeline.loopLengthBars} bar${arrangement.timeline.loopLengthBars > 1 ? 's' : ''}`,
    `Total Events: ${arrangement.timeline.events?.length ?? 0}`,
  ].join(' · ');

  return {
    title: arrangement.title || 'Untitled Arrangement',
    chords,
    tempoBpm,
    extraNotes: arrangement.notes ? `${arrangement.notes}\n\n${arrangementInfo}` : arrangementInfo,
  };
}

/**
 * Generates MIDI note events from arrangement timeline events.
 * Each event's duration is based on the steps until the next event.
 */
export function getArrangementMidiEvents(arrangement: Arrangement): Array<{
  midi: number[];
  startTick: number;
  durationTicks: number;
  velocity?: number;
}> {
  const TICKS_PER_QUARTER = 480;
  const STEPS_PER_BEAT = 4; // Matches STEPS_PER_BEAT constant in GeneratedChordGridDialog
  const DEFAULT_VELOCITY = 84;

  // Calculate tick duration per step
  const ticksPerBeat = TICKS_PER_QUARTER;
  const ticksPerStep = ticksPerBeat / STEPS_PER_BEAT;

  // Group events by step
  const eventsByStep = new Map<
    number,
    { chord: string; leftHand: string[]; rightHand: string[] }[]
  >();

  if (arrangement.timeline.events) {
    arrangement.timeline.events.forEach((event) => {
      if (!eventsByStep.has(event.stepIndex)) {
        eventsByStep.set(event.stepIndex, []);
      }
      eventsByStep.get(event.stepIndex)?.push({
        chord: event.chord,
        leftHand: event.leftHand,
        rightHand: event.rightHand,
      });
    });
  }

  // Convert events to MIDI note groups
  const sortedSteps = Array.from(eventsByStep.keys()).sort((a, b) => a - b);
  const midiEvents: Array<{
    midi: number[];
    startTick: number;
    durationTicks: number;
    velocity?: number;
  }> = [];

  sortedSteps.forEach((stepIndex, index) => {
    const events = eventsByStep.get(stepIndex) ?? [];
    const nextStepIndex = sortedSteps[index + 1] ?? arrangement.timeline.totalSteps;
    const durationSteps = Math.max(1, nextStepIndex - stepIndex);
    const startTick = stepIndex * ticksPerStep;
    const durationTicks = Math.max(TICKS_PER_QUARTER, durationSteps * ticksPerStep);

    // Collect all MIDI notes from this step's events
    const allNotes = new Set<number>();

    // Helper function to parse note
    const parseNoteToMidi = (note: string): number | null => {
      const parsed = note.trim().match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
      if (!parsed) return null;

      const [, letter, accidental, octaveText] = parsed;
      const noteToSemitone: Record<string, number> = {
        C: 0,
        D: 2,
        E: 4,
        F: 5,
        G: 7,
        A: 9,
        B: 11,
      };

      const semitone = noteToSemitone[letter.toUpperCase()] ?? 0;
      const accidentalValue = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
      const octave = Number(octaveText);

      return (octave + 1) * 12 + semitone + accidentalValue;
    };

    events.forEach((event) => {
      event.leftHand.forEach((note) => {
        const midi = parseNoteToMidi(note);
        if (midi !== null) allNotes.add(midi);
      });
      event.rightHand.forEach((note) => {
        const midi = parseNoteToMidi(note);
        if (midi !== null) allNotes.add(midi);
      });
    });

    if (allNotes.size > 0) {
      midiEvents.push({
        midi: Array.from(allNotes).sort((a, b) => a - b),
        startTick,
        durationTicks,
        velocity: DEFAULT_VELOCITY,
      });
    }
  });

  return midiEvents;
}

/**
 * Gets the appropriate file name for downloads, sanitized.
 */
export function getArrangementFileName(title: string): string {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'arrangement'
  );
}

/**
 * Builds MIDI file bytes from arrangement events for browser download.
 * Encodes the sequencer timeline as a playable MIDI file.
 */
export function buildArrangementMidiBytes(arrangement: Arrangement): Uint8Array {
  const TICKS_PER_QUARTER = 480;
  const { tempoBpm } = arrangement.playbackSnapshot;

  function numberToBytes(value: number, length: number): number[] {
    return Array.from({ length }, (_, index) => {
      const shift = (length - index - 1) * 8;
      return (value >> shift) & 0xff;
    });
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

  // Get MIDI events from arrangement
  const midiEvents = getArrangementMidiEvents(arrangement);

  // Build track with all events
  const tempoMicroseconds = Math.round(60000000 / Math.max(40, Math.min(240, tempoBpm || 100)));
  const trackName = arrangement.title || 'Arrangement';
  const trackBytes: number[] = [
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

  // Sort and encode all note on/off events
  const allEvents: Array<{
    tick: number;
    bytes: number[];
    order: number;
  }> = [];

  midiEvents.forEach((event) => {
    // Note ons (0x90 = note on, channel 0)
    event.midi.forEach((midi) => {
      allEvents.push({
        tick: event.startTick,
        bytes: [0x90, midi, event.velocity ?? 84],
        order: 1,
      });
    });

    // Note offs (0x80 = note off, channel 0)
    const endTick = event.startTick + event.durationTicks;
    event.midi.forEach((midi) => {
      allEvents.push({
        tick: endTick,
        bytes: [0x80, midi, 0],
        order: 0,
      });
    });
  });

  // Sort events by tick, then by order (note offs before note ons at same tick)
  allEvents.sort((a, b) => (a.tick === b.tick ? a.order - b.order : a.tick - b.tick));

  let previousTick = 0;
  allEvents.forEach((event) => {
    const delta = event.tick - previousTick;
    trackBytes.push(...encodeVariableLength(delta), ...event.bytes);
    previousTick = event.tick;
  });

  // End of track
  trackBytes.push(0x00, 0xff, 0x2f, 0x00);

  // Build MIDI header
  const header = new Uint8Array([
    0x4d,
    0x54,
    0x68,
    0x64, // "MThd"
    0x00,
    0x00,
    0x00,
    0x06, // Header length
    0x00,
    0x00, // Format 0 (single track)
    0x00,
    0x01, // One track
    ...numberToBytes(TICKS_PER_QUARTER, 2),
  ]);

  // Build track chunk
  const track = new Uint8Array([
    0x4d,
    0x54,
    0x72,
    0x6b, // "MTrk"
    ...numberToBytes(trackBytes.length, 4),
    ...trackBytes,
  ]);

  // Combine header and track
  return new Uint8Array([...header, ...track]);
}

/**
 * Triggers browser download of MIDI bytes.
 */
export function downloadArrangementMidi(arrangement: Arrangement): void {
  const bytes = buildArrangementMidiBytes(arrangement);
  const fileName = `${getArrangementFileName(arrangement.title)}.mid`;

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
