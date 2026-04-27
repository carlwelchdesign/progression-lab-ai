import { PC_TO_POS } from './circleOfFifths.constants';
import { getChordRootSemitone } from '../../../domain/music/circleOfFifths';

// Position 0 = 12 o'clock (C), going clockwise
export function posToAngle(pos: number): number {
  return (pos / 12) * 2 * Math.PI - Math.PI / 2;
}

export function posToPoint(
  pos: number,
  radius: number,
  cx: number,
  cy: number,
): { x: number; y: number } {
  const a = posToAngle(pos);
  return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
}

export function pitchClassToPos(pc: number): number {
  return PC_TO_POS[((pc % 12) + 12) % 12];
}

// Minor-chord detector: matches Am, Am7, F#m, Gm7, Bbm, Cdim7, etc.
// Does NOT match Amaj7, Cmaj, Gsus2, etc.
const MINOR_RE = /^[A-G][#b]?m(?!a)|dim/i;

export function chordNameToPos(name: string): { pos: number; isMinor: boolean } | null {
  const pc = getChordRootSemitone(name);
  if (pc === null) return null;
  const isMinor = MINOR_RE.test(name);
  if (isMinor) {
    // Inner ring: relative-major position = PC_TO_POS[(root + 3) % 12]
    return { pos: PC_TO_POS[(pc + 3) % 12], isMinor: true };
  }
  return { pos: PC_TO_POS[pc], isMinor: false };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

export function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 0xff},${(n >> 8) & 0xff},${n & 0xff},${alpha.toFixed(3)})`;
}
