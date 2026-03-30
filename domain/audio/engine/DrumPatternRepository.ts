import { Midi } from '@tonejs/midi';

export type DrumPatternEvent = {
  beat: number;
  durationBeats: number;
  midi: number;
  velocity: number;
};

export type DrumPattern = {
  path: string;
  events: DrumPatternEvent[];
  durationBeats: number;
};

const DRUM_PATTERN_CACHE = new Map<string, DrumPattern>();
const DRUM_PATTERN_PROMISE_CACHE = new Map<string, Promise<DrumPattern | null>>();

export const normalizeDrumPatternPath = (path: string | null | undefined): string | null => {
  if (!path || typeof path !== 'string') {
    return null;
  }

  const trimmed = path.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  return `/${trimmed}`;
};

export const loadDrumPattern = async (path: string): Promise<DrumPattern | null> => {
  const normalizedPath = normalizeDrumPatternPath(path);
  if (!normalizedPath) {
    return null;
  }

  const cached = DRUM_PATTERN_CACHE.get(normalizedPath);
  if (cached) {
    return cached;
  }

  const pending = DRUM_PATTERN_PROMISE_CACHE.get(normalizedPath);
  if (pending) {
    return pending;
  }

  const request = fetch(normalizedPath, { cache: 'force-cache' })
    .then(async (response) => {
      if (!response.ok) {
        return null;
      }

      const midiBytes = await response.arrayBuffer();
      const midi = new Midi(midiBytes);
      const ppq = midi.header.ppq || 480;
      const events: DrumPatternEvent[] = [];
      let maxEndBeat = 0;

      midi.tracks.forEach((track) => {
        track.notes.forEach((note) => {
          const beat = note.ticks / ppq;
          const durationBeats = Math.max(0.05, note.durationTicks / ppq);
          const endBeat = beat + durationBeats;

          maxEndBeat = Math.max(maxEndBeat, endBeat);
          events.push({
            beat,
            durationBeats,
            midi: note.midi,
            velocity: note.velocity,
          });
        });
      });

      if (events.length === 0) {
        return null;
      }

      const pattern: DrumPattern = {
        path: normalizedPath,
        events,
        durationBeats: Math.max(1, maxEndBeat),
      };

      DRUM_PATTERN_CACHE.set(normalizedPath, pattern);
      return pattern;
    })
    .catch(() => null)
    .finally(() => {
      DRUM_PATTERN_PROMISE_CACHE.delete(normalizedPath);
    });

  DRUM_PATTERN_PROMISE_CACHE.set(normalizedPath, request);
  return request;
};
