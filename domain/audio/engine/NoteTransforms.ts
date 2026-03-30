import * as Tone from 'tone';
import type { PlaybackRegister } from '../audioEngine';

const REGISTER_MIDI_RANGES: Record<
  Exclude<PlaybackRegister, 'off'>,
  { min: number; max: number }
> = {
  low: { min: 36, max: 59 },
  mid: { min: 48, max: 71 },
  high: { min: 60, max: 83 },
};

export const applyInversionLock = (notes: string[], register: PlaybackRegister): string[] => {
  if (register === 'off') return notes;
  const range = REGISTER_MIDI_RANGES[register];
  const center = (range.min + range.max) / 2;

  return notes.map((note) => {
    const baseMidi = Tone.Frequency(note).toMidi();
    let bestMidi: number = baseMidi;
    let bestDist = Infinity;

    for (let shift = -4; shift <= 4; shift += 1) {
      const candidate = baseMidi + shift * 12;
      if (candidate >= range.min && candidate <= range.max) {
        const dist = Math.abs(candidate - center);
        if (dist < bestDist) {
          bestDist = dist;
          bestMidi = candidate;
        }
      }
    }

    if (bestDist === Infinity) {
      for (let shift = -4; shift <= 4; shift += 1) {
        const candidate = baseMidi + shift * 12;
        const clampDist = Math.abs(Math.max(range.min, Math.min(range.max, candidate)) - center);
        if (clampDist < bestDist) {
          bestDist = clampDist;
          bestMidi = candidate;
        }
      }
    }

    return Tone.Frequency(bestMidi, 'midi').toNote() as string;
  });
};

export const shiftNotesByOctaves = (notes: string[], octaveShift: number): string[] => {
  if (octaveShift === 0) return notes;

  return notes.map((note) => {
    const baseMidi = Tone.Frequency(note).toMidi();
    const shiftedMidi = baseMidi + octaveShift * 12;
    return Tone.Frequency(shiftedMidi, 'midi').toNote() as string;
  });
};

export const sortNotesLowToHigh = (notes: string[]): string[] => {
  return [...notes].sort((a, b) => {
    const midiA = Tone.Frequency(a).toMidi();
    const midiB = Tone.Frequency(b).toMidi();
    return midiA - midiB;
  });
};
