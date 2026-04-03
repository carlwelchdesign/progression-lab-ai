/**
 * Product Charter for ProgressionLab
 *
 * Defines the core product identity, target personas, jobs-to-be-done,
 * and non-goals to ground boardroom recommendations within realistic
 * product scope and strategy.
 */

export interface BoardroomProductCharter {
  // Core product identity
  productName: string;
  productVision: string;
  corePurpose: string;

  // What we solve for: Jobs-to-be-done (ranked by priority)
  jobsToBeDone: Array<{
    job: string;
    priority: 'primary' | 'secondary' | 'tertiary';
    context: string;
  }>;

  // Who we serve: Target personas (ranked by priority)
  targetPersonas: Array<{
    persona: string;
    priority: 'primary' | 'secondary';
    painPoint: string;
    expectedUsagePattern: string;
  }>;

  // Primary use cases
  primaryUseCases: string[];

  // What we explicitly do NOT do (non-goals and out-of-scope features)
  nonGoals: Array<{
    category: string;
    explanation: string;
    examples: string[];
  }>;

  // Competitive positioning
  positioningInsights: string[];

  // Product constraints that inform strategy
  strategicConstraints: string[];
}

/**
 * Get the current product charter for ProgressionLab
 * This is a static charter that defines the product's core identity.
 * Update this function if product positioning or strategy evolves.
 */
export function getBoardroomProductCharter(): BoardroomProductCharter {
  return {
    productName: 'ProgressionLab',
    productVision:
      'An AI-assisted harmony and songwriting workspace that transforms harmonic intent into playable, shareable music through intuitive generation, instant playback, and practical voicings.',
    corePurpose:
      'Help musicians and songwriters generate, explore, and iterate on chord progressions with AI assistance, hear them instantly, and share their ideas.',

    jobsToBeDone: [
      {
        job: 'Generate chord progressions for songwriting and composition',
        priority: 'primary',
        context:
          'Users describe a mood, style, or harmonic idea and receive AI-suggested progressions with practical voicings.',
      },
      {
        job: 'Quickly audition chord progressions before committing to a song',
        priority: 'primary',
        context:
          'Users hear BPM-aware playback with humanized timing to test if a progression works emotionally and structurally.',
      },
      {
        job: 'Share harmonic ideas with collaborators or the public',
        priority: 'secondary',
        context:
          'Users create shareable public links to progression pages, enabling feedback from other musicians or audience discovery.',
      },
      {
        job: 'Learn harmonic theory and explore voicing options interactively',
        priority: 'secondary',
        context:
          'Users build understanding through exploring AI suggestions, inline diagrams, and varied voicings (piano/guitar).',
      },
    ],

    targetPersonas: [
      {
        persona: 'Casual Explorer / Hobbyist',
        priority: 'primary',
        painPoint: 'Wants to try AI songwriting without technical barriers or cost',
        expectedUsagePattern:
          'Occasional use (1-2x per week), small number of progressions saved, never exports',
      },
      {
        persona: 'Serious Composer / Producer',
        priority: 'primary',
        painPoint:
          'Needs many generations per month, wants to export for DAW integration, uses advanced voicing controls',
        expectedUsagePattern:
          'Regular use (2-3x per week), 20-50 progressions saved per month, exports to MIDI/PDF for production',
      },
      {
        persona: 'Power User / Studio Professional',
        priority: 'secondary',
        painPoint:
          'Needs unlimited generations, premium AI model, no friction for high-volume workflow',
        expectedUsagePattern:
          'Frequent daily use, 100+ generations per month, integrates into production pipeline, shares internally',
      },
      {
        persona: 'Music Educator / Student',
        priority: 'secondary',
        painPoint:
          'Needs affordable tool for learning harmony theory, class demonstrations, student assignments',
        expectedUsagePattern:
          'Episodic classroom use, sharing progressions with students, exploring harmonic concepts interactively',
      },
    ],

    primaryUseCases: [
      'Songwriting: Generate chord progressions for a new song idea in minutes',
      'Arrangement: Explore alternative progressions for a song that needs harmonic refresh',
      'Sketchpad: Rapidly iterate on harmonic ideas without opening a DAW',
      'Learning: Understand voicing options and harmonic theory through interactive exploration',
      'Collaboration: Share harmonic sketches with bandmates or producers for feedback',
      'Reference: Build a searchable library of progressions by mood, key, style, and mode',
      'Export: Generate MIDI files for production and PDF lead sheets for performers',
    ],

    nonGoals: [
      {
        category: 'Full Digital Audio Workstation (DAW)',
        explanation:
          'ProgressionLab is a companion to DAWs, not a replacement. Real-time synthesis, audio recording, mixing, and effects are out of scope.',
        examples: [
          'Recording live audio or vocals',
          'Mix and mastering tools',
          'Real-time audio synthesis or plugin hosting',
          'Comprehensive MIDI sequencing or step editing',
        ],
      },
      {
        category: 'Melody or Lyric Generation',
        explanation:
          'We focus exclusively on harmony (chord progressions and voicings). Melody or lyric generation are separate product bets.',
        examples: [
          'AI melody line generation',
          'Lyrics or songwriting text generation',
          'Hook or riff composition',
        ],
      },
      {
        category: 'Real-Time Collaboration',
        explanation:
          'Real-time multiplayer editing and live jam sessions require different infrastructure. We support async sharing and feedback.',
        examples: [
          'Live multiplayer progression editing',
          'Real-time jam sessions or ensemble audio',
          'Synchronous pair composing',
        ],
      },
      {
        category: 'Transposition or Key Modulation Automation',
        explanation:
          'While users can manually re-generate in different keys, automatic transposition or modulation detection is not a core feature.',
        examples: [
          'Key detection and auto-transposition',
          'Modulation analysis',
          'Automatic key recommendation based on user skill level',
        ],
      },
      {
        category: 'Fitness, Wellness, or Non-Music Domains',
        explanation:
          'We are exclusively a music/harmony product. Adjacent domains are out of scope.',
        examples: [
          'Meditation or wellness music generation',
          'Meal planning or fitness apps',
          'Language learning or non-music education',
        ],
      },
    ],

    positioningInsights: [
      'We compete on speed and ease of use, not on AI model sophistication alone. SESSION plan users need instant gratification.',
      'Export capability (MIDI/PDF) is a critical differentiator for converting free users to COMPOSER tier.',
      'Voicing diagrams (piano + guitar) address multiple instrument players; this is a product advantage vs. code-only competitors.',
      'Public sharing + searchability creates network effects and organic discovery, unique among private composition tools.',
      'Marketing emphasis: "Hear your idea in seconds" vs. "Download our VST" or "Learn theory." We are real-time iteration, not installation friction.',
    ],

    strategicConstraints: [
      'All AI generation is on-demand (not real-time), so session-based auth + quota tracking is required.',
      'Plan tiers are defined by generation count + feature availability, not by audio quality or model version (mostly).',
      'Public sharing requires anti-abuse safeguards (reporting, moderation prep), not just open database dumps.',
      'MIDI export quality depends on voicing precision; poor export = TAO abandonment, so this must remain high-quality.',
      'Free-to-paid conversion funnel must be frictionless; aggressive upsell or feature gatekeeping on SESSION can backfire.',
      'Locale support and marketing CMS are required for international growth; one-off English-only product limits TAM.',
    ],
  };
}

/**
 * Format the product charter into a concise boardroom-prompt-friendly string.
 * Suitable for injection into all boardroom phases to ground strategy discussions.
 */
export function formatProductCharterForPrompt(charter: BoardroomProductCharter): string {
  const jobsStr = charter.jobsToBeDone
    .map((j) => `- [${j.priority.toUpperCase()}] ${j.job}\n  Context: ${j.context}`)
    .join('\n');

  const personasStr = charter.targetPersonas
    .map(
      (p) =>
        `- [${p.priority.toUpperCase()}] ${p.persona}: "${p.painPoint}" (${p.expectedUsagePattern})`,
    )
    .join('\n');

  const useCasesStr = charter.primaryUseCases.map((u) => `- ${u}`).join('\n');

  const nonGoalsStr = charter.nonGoals
    .map((ng) => `- **${ng.category}**: ${ng.explanation}\n  Examples: ${ng.examples.join(', ')}`)
    .join('\n');

  const positioningStr = charter.positioningInsights.map((p) => `- ${p}`).join('\n');

  const constraintsStr = charter.strategicConstraints.map((c) => `- ${c}`).join('\n');

  return `## Product Charter

**Product**: ${charter.productName}

**Vision**: ${charter.productVision}

**Core Purpose**: ${charter.corePurpose}

### Jobs to Be Done (Ranked by Priority)
${jobsStr}

### Target Personas (Ranked by Priority)
${personasStr}

### Primary Use Cases
${useCasesStr}

### Strategic Non-Goals (What We Do NOT Do)
${nonGoalsStr}

### Competitive Positioning Insights
${positioningStr}

### Strategic Constraints (Product Realities)
${constraintsStr}

---

**Guideline for Strategy Board**: All boardroom recommendations must serve one of the primary jobs-to-be-done for a primary persona. Recommendations that require building non-goals (DAW features, melody generation, real-time collaboration) are out of scope. Recommendations that violate strategic constraints (e.g., suggesting aggressive feature gatekeeping that would harm conversion) should be flagged as high-risk.
`;
}
