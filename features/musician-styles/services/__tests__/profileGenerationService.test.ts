import { generateMusicianProfile, slugifyMusicianName } from '../profileGenerationService';

describe('profileGenerationService', () => {
  it('slugifies musician names', () => {
    expect(slugifyMusicianName('Thelonious Monk')).toBe('thelonious-monk');
  });

  it('generates fallback profile without API key', async () => {
    const previousKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const profile = await generateMusicianProfile({ name: 'Ahmad Jamal', genre: 'Jazz' });
    expect(profile.slug).toBe('ahmad-jamal');
    expect(profile.genre).toBe('Jazz');

    process.env.OPENAI_API_KEY = previousKey;
  });
});
