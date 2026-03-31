/**
 * Sample content management for targeted user personas.
 * Provides curated progressions for different skill levels and musical genres.
 */

import type { Progression } from './types';

export type UserPersona = 'beginner' | 'intermediate' | 'professional';

export interface SampleProgressionSet {
  persona: UserPersona;
  progressions: Progression[];
  description: string;
}

/**
 * Sample progressions curated for different user personas.
 * These are designed to encourage initial exploration and reduce first-use friction.
 */
export const SAMPLE_PROGRESSIONS: Record<UserPersona, Progression[]> = {
  beginner: [
    {
      id: 'sample_beginner_001',
      nameOverride: 'Classic I-V-vi-IV',
      chords: ['C', 'G', 'Am', 'F'],
      tags: ['popular', 'pop', 'folk'],
      isPublished: true,
    },
    {
      id: 'sample_beginner_002',
      nameOverride: 'Jazz Blues Basic',
      chords: ['Cmaj7', 'Fmaj7', 'Cmaj7', 'Gdom7'],
      tags: ['jazz', 'blues'],
      isPublished: true,
    },
    {
      id: 'sample_beginner_003',
      nameOverride: 'Simple Minor',
      chords: ['Am', 'F', 'C', 'G'],
      tags: ['minor', 'rock'],
      isPublished: true,
    },
  ],
  intermediate: [
    {
      id: 'sample_inter_001',
      nameOverride: 'Extended Diatonic Movement',
      chords: ['Cmaj7', 'Dm7', 'G7', 'Cmaj7', 'Am7', 'Dm7', 'G7', 'Cmaj7'],
      tags: ['jazz', 'modal', 'sophisticated'],
      isPublished: true,
    },
    {
      id: 'sample_inter_002',
      nameOverride: 'Ascending Chromatic',
      chords: ['C', 'Csharp', 'D', 'Dsharp', 'E', 'F', 'Fsharp', 'G'],
      tags: ['chromatic', 'modern'],
      isPublished: true,
    },
    {
      id: 'sample_inter_003',
      nameOverride: 'Mixolydian Funk',
      chords: ['Gdom7', 'C', 'Gdom7', 'Bb'],
      tags: ['funk', 'modern', 'groove'],
      isPublished: true,
    },
  ],
  professional: [
    {
      id: 'sample_pro_001',
      nameOverride: 'Tritone Substitution Workout',
      chords: ['Cmaj7', 'Dm7', 'G7alt', 'Cmaj7', 'Fsharp7alt', 'B7alt', 'Cmaj7'],
      tags: ['jazz', 'advanced', 'harmonic-substitution'],
      isPublished: true,
    },
    {
      id: 'sample_pro_002',
      nameOverride: 'Augmented Harmony',
      chords: ['Caug', 'Eaug', 'Gaug', 'Caug'],
      tags: ['classical', 'augmented', 'symmetrical'],
      isPublished: true,
    },
    {
      id: 'sample_pro_003',
      nameOverride: 'Polytonality Exploration',
      chords: ['C', 'Gm', 'Bb', 'F', 'C', 'Am', 'F', 'C'],
      tags: ['contemporary', 'polytonality', 'advanced'],
      isPublished: true,
    },
  ],
};

/**
 * Get sample progressions for a specific persona.
 */
export function getSamplesForPersona(persona: UserPersona): Progression[] {
  return SAMPLE_PROGRESSIONS[persona] || [];
}

/**
 * Get all available personas.
 */
export function getAvailablePersonas(): UserPersona[] {
  return ['beginner', 'intermediate', 'professional'];
}

/**
 * Get persona description for UI display.
 */
export function getPersonaDescription(persona: UserPersona): string {
  const descriptions: Record<UserPersona, string> = {
    beginner: 'Simple, popular progressions to get started',
    intermediate: 'Sophisticated harmonies for exploring advanced concepts',
    professional: 'Complex harmonic structures for expert musicians',
  };
  return descriptions[persona] || '';
}

/**
 * Detect suggested persona based on user behavior or explicit selection.
 * In a real implementation, this would use analytics and engagement data.
 */
export function getSuggestedPersona(): UserPersona {
  // Default suggestion; in production, this would consider:
  // - User signup time
  // - Number of progressions created
  // - Harmonic complexity of created progressions
  // - Feature usage patterns
  return 'beginner';
}
