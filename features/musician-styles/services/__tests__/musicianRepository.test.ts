import { searchMusicians } from '../musicianRepository';

describe('musicianRepository search', () => {
  it('returns matching active musicians for 2+ char search', async () => {
    const prismaMock = {
      musicianProfile: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: '1',
            slug: 'stevie-wonder',
            displayName: 'Stevie Wonder',
            aliases: ['Stevie'],
            genre: 'Soul',
            era: '1970s',
            tagline: 'Legend',
            signatureTechniques: [],
            exampleSongs: [],
            preferredKeys: [],
            sortOrder: 1,
            isCustom: false,
            isActive: true,
            promptTemplate: 'x',
            promptVersion: 2,
          },
        ]),
      },
    };

    const results = await searchMusicians(prismaMock as never, 'ste');
    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe('stevie-wonder');
  });
});
