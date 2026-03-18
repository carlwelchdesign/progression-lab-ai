type TagCategory = 'genre' | 'feeling' | 'custom';

const GENRE_TAGS = [
  'house',
  'piano house',
  'deep house',
  'disco house',
  'tech house',
  'funk / disco',
  'pop',
  'indie pop',
  'r&b / neo soul',
  'jazz',
  'lo-fi',
  'ambient',
  'cinematic',
  'edm',
  'afro house',
  'progressive house',
  'hip-hop',
  'rock',
  'folk',
];

const FEELING_TAGS = [
  'dreamy',
  'emotional',
  'uplifting',
  'moody',
  'dark',
  'melancholic',
  'hopeful',
  'nostalgic',
  'warm',
  'energetic',
  'chill',
  'smooth',
  'aggressive',
  'romantic',
  'atmospheric',
  'euphoric',
];

const normalize = (value: string) => value.trim().toLowerCase();

const GENRE_TAG_SET = new Set(GENRE_TAGS.map(normalize));
const FEELING_TAG_SET = new Set(FEELING_TAGS.map(normalize));

const GENRE_COLORS = [
  '#1565c0',
  '#0d47a1',
  '#283593',
  '#2e7d32',
  '#00695c',
  '#455a64',
  '#6a1b9a',
  '#0277bd',
];

const FEELING_COLORS = [
  '#ad1457',
  '#6a1b9a',
  '#d81b60',
  '#7b1fa2',
  '#c2185b',
  '#8e24aa',
  '#4a148c',
  '#880e4f',
];

const CUSTOM_COLORS = ['#37474f', '#4e342e', '#3e2723', '#424242', '#5d4037', '#263238'];

const CHORD_COLORS = [
  '#0277bd', // cyan blue
  '#1565c0', // blue
  '#283593', // indigo
  '#6a1b9a', // purple
  '#ad1457', // deep pink
  '#c41c3b', // red
  '#e74c3c', // orange-red
  '#f39c12', // orange
  '#27ae60', // green
  '#1abc9c', // teal
];

const MOOD_COLORS = [
  '#00838f', // dark cyan
  '#0d47a1', // dark blue
  '#512da8', // deep purple
  '#7b1fa2', // purple
  '#c2185b', // pink
  '#d32f2f', // red
  '#f57c00', // deep orange
  '#fbc02d', // amber
  '#388e3c', // green
  '#00796b', // teal
];

function getColorIndex(tag: string, paletteLength: number): number {
  const normalized = normalize(tag);
  let hash = 0;

  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }

  return hash % paletteLength;
}

export const PRESET_TAG_OPTIONS = [...GENRE_TAGS, ...FEELING_TAGS];

export function sanitizeTags(tags: string[]): string[] {
  const seen = new Set<string>();

  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag) => {
      const key = normalize(tag);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

export function getTagCategory(tag: string): TagCategory {
  const normalized = normalize(tag);

  if (GENRE_TAG_SET.has(normalized)) {
    return 'genre';
  }

  if (FEELING_TAG_SET.has(normalized)) {
    return 'feeling';
  }

  return 'custom';
}

export function getTagChipSx(tag: string) {
  const category = getTagCategory(tag);
  const palette =
    category === 'genre' ? GENRE_COLORS : category === 'feeling' ? FEELING_COLORS : CUSTOM_COLORS;
  const backgroundColor = palette[getColorIndex(tag, palette.length)];

  return {
    backgroundColor,
    color: '#ffffff',
    borderColor: 'rgba(255, 255, 255, 0.35)',
    fontWeight: 600,
  };
}

export function getChordChipSx(chord: string) {
  const backgroundColor = CHORD_COLORS[getColorIndex(chord, CHORD_COLORS.length)];

  return {
    backgroundColor,
    color: '#ffffff',
    borderColor: 'rgba(255, 255, 255, 0.35)',
    fontWeight: 600,
  };
}

export function getMoodChipSx(mood: string) {
  const backgroundColor = MOOD_COLORS[getColorIndex(mood, MOOD_COLORS.length)];

  return {
    backgroundColor,
    color: '#ffffff',
    borderColor: 'rgba(255, 255, 255, 0.35)',
    fontWeight: 600,
  };
}
