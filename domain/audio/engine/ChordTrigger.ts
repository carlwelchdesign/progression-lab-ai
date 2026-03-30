import type * as Tone from 'tone';
import type { PlaybackStyle } from '../audioEngine';
import { normalizeVelocity } from './AudioMath';
import { sortNotesLowToHigh } from './NoteTransforms';

const STRUM_STEP_SECONDS = 0.025;

type TriggerChordParams = {
  instrument: Tone.Sampler;
  notes: string[];
  duration: Tone.Unit.Time;
  startTime?: Tone.Unit.Time;
  velocity?: number;
};

export const triggerStrummedChord = ({
  instrument,
  notes,
  duration,
  startTime,
  velocity,
}: TriggerChordParams): void => {
  const orderedNotes = sortNotesLowToHigh(notes);
  const normalizedVelocity = normalizeVelocity(velocity);

  orderedNotes.forEach((note, index) => {
    if (startTime !== undefined) {
      const noteTime = Tone.Time(startTime).toSeconds() + index * STRUM_STEP_SECONDS;
      instrument.triggerAttackRelease(note, duration, noteTime, normalizedVelocity);
      return;
    }

    instrument.triggerAttackRelease(
      note,
      duration,
      `+${index * STRUM_STEP_SECONDS}`,
      normalizedVelocity,
    );
  });
};

export const triggerBlockChord = ({
  instrument,
  notes,
  duration,
  startTime,
  velocity,
}: TriggerChordParams): void => {
  const orderedNotes = sortNotesLowToHigh(notes);
  const normalizedVelocity = normalizeVelocity(velocity);

  if (orderedNotes.length === 0) {
    return;
  }

  if (startTime !== undefined) {
    instrument.triggerAttackRelease(orderedNotes, duration, startTime, normalizedVelocity);
    return;
  }

  instrument.triggerAttackRelease(orderedNotes, duration, undefined, normalizedVelocity);
};

type TriggerChordByStyleParams = TriggerChordParams & {
  style: PlaybackStyle;
  attack?: number;
  decay?: number;
};

export const triggerChordByStyle = ({
  style,
  instrument,
  notes,
  duration,
  startTime,
  attack,
  decay,
  velocity,
}: TriggerChordByStyleParams): void => {
  if (attack !== undefined) {
    instrument.attack = attack;
  }
  if (decay !== undefined) {
    instrument.release = decay;
  }

  if (style === 'block') {
    triggerBlockChord({ instrument, notes, duration, startTime, velocity });
    return;
  }

  triggerStrummedChord({ instrument, notes, duration, startTime, velocity });
};
