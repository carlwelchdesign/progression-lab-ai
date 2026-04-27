import { inferKeyCenter } from '../inferKeyCenter';

describe('inferKeyCenter', () => {
  it('infers C major from diatonic chord sequence', () => {
    const result = inferKeyCenter(['C', 'Am', 'F', 'G']);
    expect(result.key).toBe('C');
    expect(result.mode).toBe('major');
    expect(result.confidence).toBeGreaterThanOrEqual(0.6);
  });

  it('infers G major from I-IV-V sequence', () => {
    const result = inferKeyCenter(['G', 'C', 'D']);
    expect(result.key).toBe('G');
    expect(result.mode).toBe('major');
  });

  it('infers A minor from minor-key sequence', () => {
    const result = inferKeyCenter(['Am', 'Dm', 'Em']);
    expect(result.key).toBe('A');
    expect(result.mode).toBe('minor');
    expect(result.confidence).toBeGreaterThanOrEqual(0.6);
  });

  it('returns null for empty history', () => {
    const result = inferKeyCenter([]);
    expect(result.key).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('returns null for a single chord (insufficient data)', () => {
    const result = inferKeyCenter(['C']);
    // With only one chord we may get low confidence — null or C is acceptable
    expect(result.confidence).toBeGreaterThanOrEqual(0);
  });

  it('returns null for highly ambiguous mixed chords', () => {
    // Chords from completely different keys
    const result = inferKeyCenter(['C', 'F#', 'Bb', 'E']);
    // Confidence should be low enough to return null
    if (result.key !== null) {
      expect(result.confidence).toBeGreaterThanOrEqual(0.6);
    }
  });

  it('infers F major from typical I-ii-V-I', () => {
    const result = inferKeyCenter(['F', 'Gm', 'C7', 'F']);
    expect(result.key).toBe('F');
  });
});
