import { getGuitarDiagramFromChord } from '../../lib/guitarDiagramUtils';

jest.mock('../../lib/audio', () => ({
  playChordVoicing: jest.fn(),
  playProgression: jest.fn(),
}));

import { inferFallbackBarres, inferFallbackFingerLabels } from './ProgressionIdeasSection';

describe('ProgressionIdeasSection fallback guitar fingering', () => {
  it('infers finger labels and barre for Bm fallback diagram', () => {
    const bmDiagram = getGuitarDiagramFromChord('Bm');

    expect(bmDiagram).not.toBeNull();

    const fingers = inferFallbackFingerLabels(bmDiagram!.fingers);
    const barres = inferFallbackBarres(bmDiagram!.fingers);

    const firstFingerFrets = fingers
      .filter(([, fret, text]) => typeof fret === 'number' && text === '1')
      .map(([, fret]) => fret);

    expect(firstFingerFrets.length).toBeGreaterThan(1);
    expect(firstFingerFrets.every((fret) => fret === 2)).toBe(true);
    expect(barres).toEqual([{ fromString: 1, toString: 5, fret: 2 }]);
  });

  it('infers finger labels and barre for F#7 fallback diagram', () => {
    const fSharp7Diagram = getGuitarDiagramFromChord('F#7');

    expect(fSharp7Diagram).not.toBeNull();

    const fingers = inferFallbackFingerLabels(fSharp7Diagram!.fingers);
    const barres = inferFallbackBarres(fSharp7Diagram!.fingers);

    const firstFingerFrets = fingers
      .filter(([, fret, text]) => typeof fret === 'number' && text === '1')
      .map(([, fret]) => fret);

    expect(firstFingerFrets.length).toBeGreaterThan(1);
    expect(firstFingerFrets.every((fret) => fret === 2)).toBe(true);
    expect(barres).toEqual([{ fromString: 1, toString: 6, fret: 2 }]);
  });
});
