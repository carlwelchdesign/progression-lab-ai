/**
 * Sample content management for targeted user personas.
 * Provides curated progressions for different skill levels and musical genres.
 */

export type UserPersona = 'beginner' | 'intermediate' | 'professional';

/** A curated sample progression shown in the showcase and onboarding UI. */
export interface SampleProgression {
  /** Display name shown in UI cards. */
  name: string;
  /** Short description of the harmonic concept. */
  description: string;
  /** Comma-separated chord string, ready to paste into the generator seedChords field. */
  chords: string;
}

const SAMPLE_PROGRESSIONS: Record<UserPersona, SampleProgression[]> = {
  beginner: [
    {
      name: 'Classic I-V-vi-IV',
      description: 'The most universal pop progression — instantly recognizable and very singable.',
      chords: 'C, G, Am, F',
    },
    {
      name: 'Jazz Blues Intro',
      description: 'A gentle jazz-blues opening built on major 7ths — smooth and open-sounding.',
      chords: 'Cmaj7, Fmaj7, Cmaj7, G7',
    },
    {
      name: 'Simple Minor',
      description: 'A clean four-chord minor loop with a strong sense of resolution.',
      chords: 'Am, F, C, G',
    },
  ],
  intermediate: [
    {
      name: 'Extended Diatonic Movement',
      description:
        'A full diatonic ii-V-I cycle using extended chords — foundational jazz vocabulary.',
      chords: 'Cmaj7, Dm7, G7, Cmaj7, Am7, Dm7, G7, Cmaj7',
    },
    {
      name: 'Ascending Chromatic',
      description: 'Stepwise chromatic motion — creates tension and momentum across the bar.',
      chords: 'C, C#, D, D#, E, F, F#, G',
    },
    {
      name: 'Mixolydian Funk',
      description: 'A two-chord dominant groove rooted in the Mixolydian mode — very rhythmic.',
      chords: 'G7, C, G7, Bb',
    },
  ],
  professional: [
    {
      name: 'Tritone Substitution Workout',
      description:
        'Replaces the dominant with its tritone sub — advanced reharmonisation technique.',
      chords: 'Cmaj7, Dm7, G7alt, Cmaj7, F#7alt, B7alt, Cmaj7',
    },
    {
      name: 'Augmented Symmetry',
      description: 'Three augmented triads a major third apart — symmetrical harmonic space.',
      chords: 'Caug, Eaug, G#aug, Caug',
    },
    {
      name: 'Polytonal Exploration',
      description: 'Two tonal centres operating simultaneously — complex but rewarding tension.',
      chords: 'C, Gm, Bb, F, C, Am, F, C',
    },
  ],
};

/** Get sample progressions for a specific persona. */
export function getSampleProgressionsByPersona(persona: UserPersona): SampleProgression[] {
  return SAMPLE_PROGRESSIONS[persona] ?? SAMPLE_PROGRESSIONS.beginner;
}

/** Alias kept for backward compatibility. */
export const getSamplesForPersona = getSampleProgressionsByPersona;

/** Get all available personas. */
export function getAvailablePersonas(): UserPersona[] {
  return ['beginner', 'intermediate', 'professional'];
}

/** Detect suggested persona based on user behaviour or explicit selection. */
export function getSuggestedPersona(): UserPersona {
  return 'beginner';
}

/** Get a human-readable description for a persona. */
export function getPersonaDescription(persona: UserPersona): string {
  const descriptions: Record<UserPersona, string> = {
    beginner: 'Simple, popular progressions to get started',
    intermediate: 'Sophisticated harmonies for exploring advanced concepts',
    professional: 'Complex harmonic structures for expert musicians',
  };
  return descriptions[persona] ?? '';
}
