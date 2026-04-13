'use client';

import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { COF_KEYS } from '../data/circleOfFifthsData';
import type { CofKeyData } from '../data/circleOfFifthsData';

// ── Geometry ─────────────────────────────────────────────────────────────────

const CX = 200;
const CY = 200;

const OUTER_INNER_R = 128;
const OUTER_OUTER_R = 190;
const MIDDLE_INNER_R = 80;
const MIDDLE_OUTER_R = 128;
const INNER_INNER_R = 38;
const INNER_OUTER_R = 80;

const DEG_TO_RAD = Math.PI / 180;

function sectorPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startDeg: number,
  endDeg: number,
): string {
  const s = startDeg * DEG_TO_RAD;
  const e = endDeg * DEG_TO_RAD;
  const cos = Math.cos;
  const sin = Math.sin;
  return [
    `M ${cx + innerR * cos(s)} ${cy + innerR * sin(s)}`,
    `L ${cx + outerR * cos(s)} ${cy + outerR * sin(s)}`,
    `A ${outerR} ${outerR} 0 0 1 ${cx + outerR * cos(e)} ${cy + outerR * sin(e)}`,
    `L ${cx + innerR * cos(e)} ${cy + innerR * sin(e)}`,
    `A ${innerR} ${innerR} 0 0 0 ${cx + innerR * cos(s)} ${cy + innerR * sin(s)}`,
    'Z',
  ].join(' ');
}

function midPoint(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = angleDeg * DEG_TO_RAD;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function sharpsFlatsLabel(n: number): string {
  if (n === 0) return '♮';
  return n > 0 ? `${n}♯` : `${Math.abs(n)}♭`;
}

// ── Harmonic colour system ────────────────────────────────────────────────────
//
// Each of the 12 keys maps to a hue 30° apart on the colour wheel.
// Keys that are adjacent on the Circle of Fifths have adjacent hues —
// so colour proximity = harmonic proximity. The key a tritone away (6 positions)
// always lands on the complementary hue (hue + 180°), visually encoding maximum
// harmonic tension as maximum colour contrast.
//
// Position in COF_KEYS → hue: C=0°, G=30°, D=60°, A=90°, E=120°, B=150°,
// F#=180°, Db=210°, Ab=240°, Eb=270°, Bb=300°, F=330°

function hue(index: number): number {
  return index * 30;
}

type KeyState = 'selected' | 'neighbor' | 'tritone' | 'faded' | 'default';

function getKeyState(
  index: number,
  selectedIndex: number | null,
  hoveredIndex: number | null,
): { state: KeyState; hovered: boolean } {
  const hov = index === hoveredIndex;
  if (selectedIndex === null) return { state: 'default', hovered: hov };
  if (index === selectedIndex) return { state: 'selected', hovered: false };
  const tritone = (selectedIndex + 6) % 12;
  if (index === tritone) return { state: 'tritone', hovered: hov };
  const cwNeighbor = (selectedIndex + 1) % 12;
  const ccwNeighbor = (selectedIndex + 11) % 12;
  if (index === cwNeighbor || index === ccwNeighbor) return { state: 'neighbor', hovered: hov };
  return { state: 'faded', hovered: hov };
}

function sectorFill(index: number, state: KeyState, hovered: boolean, dark: boolean): string {
  const h = hue(index);
  if (dark) {
    if (state === 'selected') return `hsl(${h}, 90%, 60%)`;
    if (state === 'neighbor') return hovered ? `hsl(${h}, 72%, 44%)` : `hsl(${h}, 65%, 36%)`;
    if (state === 'tritone') return hovered ? `hsl(${h}, 55%, 30%)` : `hsl(${h}, 42%, 22%)`;
    if (state === 'faded') return hovered ? `hsl(${h}, 38%, 22%)` : `hsl(${h}, 28%, 14%)`;
    return hovered ? `hsl(${h}, 55%, 28%)` : `hsl(${h}, 42%, 18%)`;
  }
  if (state === 'selected') return `hsl(${h}, 82%, 52%)`;
  if (state === 'neighbor') return hovered ? `hsl(${h}, 70%, 68%)` : `hsl(${h}, 62%, 74%)`;
  if (state === 'tritone') return hovered ? `hsl(${h}, 48%, 78%)` : `hsl(${h}, 38%, 86%)`;
  if (state === 'faded') return hovered ? `hsl(${h}, 38%, 86%)` : `hsl(${h}, 28%, 92%)`;
  return hovered ? `hsl(${h}, 52%, 82%)` : `hsl(${h}, 42%, 88%)`;
}

function sectorStroke(state: KeyState, dark: boolean): string {
  if (state === 'tritone') return dark ? '#f59e0b' : '#d97706';
  if (state === 'selected') return dark ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.8)';
  if (state === 'neighbor') return dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';
  return dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
}

function sectorStrokeWidth(state: KeyState): number {
  if (state === 'tritone') return 2;
  if (state === 'selected') return 1.5;
  return 0.75;
}

function sectorStrokeDash(state: KeyState): string | undefined {
  return state === 'tritone' ? '4 3' : undefined;
}

function labelFill(state: KeyState, dark: boolean): string {
  if (state === 'selected') return '#000';
  if (state === 'neighbor') return dark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.85)';
  if (state === 'faded') return dark ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.28)';
  return dark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.60)';
}

// ── Props & component ─────────────────────────────────────────────────────────

type Props = {
  selectedSemitone: number | null;
  onKeySelect: (key: CofKeyData) => void;
  showKeySignatures?: boolean;
  showMinorRing?: boolean;
};

export default function CircleOfFifthsSvg({
  selectedSemitone,
  onKeySelect,
  showKeySignatures = true,
  showMinorRing = true,
}: Props) {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const selectedIndex =
    selectedSemitone !== null ? COF_KEYS.findIndex((k) => k.semitone === selectedSemitone) : null;

  return (
    <svg
      viewBox="0 0 400 400"
      style={{ width: '100%', maxWidth: 400, display: 'block' }}
      aria-label="Circle of Fifths"
      role="img"
    >
      <defs>
        {/* Glow filter for the selected key */}
        <filter id="cof-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {COF_KEYS.map((key, i) => {
        const centerAngle = i * 30 - 90;
        const startAngle = centerAngle - 15;
        const endAngle = centerAngle + 15;

        const { state, hovered } = getKeyState(i, selectedIndex, hoveredIndex);
        const fill = sectorFill(i, state, hovered, dark);
        const stroke = sectorStroke(state, dark);
        const strokeWidth = sectorStrokeWidth(state);
        const strokeDash = sectorStrokeDash(state);
        const textColor = labelFill(state, dark);
        const applyGlow = state === 'selected';

        const outerMid = midPoint(CX, CY, (OUTER_INNER_R + OUTER_OUTER_R) / 2, centerAngle);
        const middleMid = midPoint(CX, CY, (MIDDLE_INNER_R + MIDDLE_OUTER_R) / 2, centerAngle);
        const innerMid = midPoint(CX, CY, (INNER_INNER_R + INNER_OUTER_R) / 2, centerAngle);

        const sectorProps = {
          fill,
          stroke,
          strokeWidth,
          strokeDasharray: strokeDash,
          style: { cursor: 'pointer', transition: 'fill 0.18s ease, stroke 0.18s ease' },
          onClick: () => onKeySelect(key),
          onMouseEnter: () => setHoveredIndex(i),
          onMouseLeave: () => setHoveredIndex(null),
        };

        return (
          <g key={key.semitone} filter={applyGlow ? 'url(#cof-glow)' : undefined}>
            {/* Outer ring — major keys */}
            <path
              d={sectorPath(CX, CY, OUTER_INNER_R, OUTER_OUTER_R, startAngle, endAngle)}
              {...sectorProps}
              role="button"
              aria-label={`${key.majorKey} major`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onKeySelect(key);
              }}
            />
            <text
              x={outerMid.x}
              y={outerMid.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={state === 'selected' ? 16 : 14}
              fontWeight={state === 'selected' ? 800 : state === 'neighbor' ? 600 : 500}
              fill={textColor}
              style={{ pointerEvents: 'none', userSelect: 'none', transition: 'fill 0.18s ease' }}
            >
              {key.majorKey}
            </text>

            {/* Middle ring — relative minor keys */}
            {showMinorRing ? (
              <>
                <path
                  d={sectorPath(CX, CY, MIDDLE_INNER_R, MIDDLE_OUTER_R, startAngle, endAngle)}
                  {...sectorProps}
                  role={undefined}
                  aria-label={undefined}
                  tabIndex={-1}
                />
                <text
                  x={middleMid.x}
                  y={middleMid.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={10}
                  fontWeight={state === 'selected' ? 700 : 400}
                  fill={textColor}
                  style={{
                    pointerEvents: 'none',
                    userSelect: 'none',
                    transition: 'fill 0.18s ease',
                  }}
                >
                  {key.minorKey}
                </text>
              </>
            ) : null}

            {/* Inner ring — key signatures */}
            {showKeySignatures ? (
              <>
                <path
                  d={sectorPath(CX, CY, INNER_INNER_R, INNER_OUTER_R, startAngle, endAngle)}
                  {...sectorProps}
                  role={undefined}
                  aria-label={undefined}
                  tabIndex={-1}
                />
                <text
                  x={innerMid.x}
                  y={innerMid.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={8}
                  fill={textColor}
                  style={{
                    pointerEvents: 'none',
                    userSelect: 'none',
                    transition: 'fill 0.18s ease',
                  }}
                >
                  {sharpsFlatsLabel(key.sharpsFlats)}
                </text>
              </>
            ) : null}
          </g>
        );
      })}

      {/* Centre hub */}
      <circle
        cx={CX}
        cy={CY}
        r={INNER_INNER_R}
        fill={dark ? '#0f1115' : '#f5f7fb'}
        stroke={dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
        strokeWidth={1}
      />
      <text
        x={CX}
        y={CY - 7}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={9}
        fill={dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
        style={{ userSelect: 'none' }}
      >
        Circle of
      </text>
      <text
        x={CX}
        y={CY + 7}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={9}
        fill={dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
        style={{ userSelect: 'none' }}
      >
        Fifths
      </text>

      {/* Ring labels — outer rim */}
      <text
        x={CX}
        y={16}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={7}
        fill={dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'}
        style={{ userSelect: 'none' }}
      >
        MAJOR KEYS
      </text>
    </svg>
  );
}
