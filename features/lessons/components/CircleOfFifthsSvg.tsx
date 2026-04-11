'use client';

import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { COF_KEYS } from '../data/circleOfFifthsData';
import type { CofKeyData } from '../data/circleOfFifthsData';

// Geometry constants
const CX = 200;
const CY = 200;

const OUTER_INNER_R = 130;
const OUTER_OUTER_R = 185;
const MIDDLE_INNER_R = 80;
const MIDDLE_OUTER_R = 130;
const INNER_INNER_R = 40;
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
  const x1 = cx + innerR * Math.cos(s);
  const y1 = cy + innerR * Math.sin(s);
  const x2 = cx + outerR * Math.cos(s);
  const y2 = cy + outerR * Math.sin(s);
  const x3 = cx + outerR * Math.cos(e);
  const y3 = cy + outerR * Math.sin(e);
  const x4 = cx + innerR * Math.cos(e);
  const y4 = cy + innerR * Math.sin(e);
  return `M ${x1} ${y1} L ${x2} ${y2} A ${outerR} ${outerR} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerR} ${innerR} 0 0 0 ${x1} ${y1} Z`;
}

function labelPoint(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = angleDeg * DEG_TO_RAD;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function sharpsFlatsLabel(n: number): string {
  if (n === 0) return '♮';
  return n > 0 ? `${n}♯` : `${Math.abs(n)}♭`;
}

type Props = {
  selectedSemitone: number | null;
  highlightedSemitones?: Set<number>;
  onKeySelect: (key: CofKeyData) => void;
  showKeySignatures?: boolean;
  showMinorRing?: boolean;
};

export default function CircleOfFifthsSvg({
  selectedSemitone,
  highlightedSemitones = new Set(),
  onKeySelect,
  showKeySignatures = true,
  showMinorRing = true,
}: Props) {
  const theme = useTheme();
  const [hoveredSemitone, setHoveredSemitone] = useState<number | null>(null);

  const getSectorFill = (semitone: number): string => {
    if (semitone === selectedSemitone) return theme.palette.primary.main;
    if (highlightedSemitones.has(semitone)) return alpha(theme.palette.primary.main, 0.25);
    if (semitone === hoveredSemitone) return theme.palette.action.selected;
    return theme.palette.action.hover;
  };

  const getTextColor = (semitone: number): string => {
    if (semitone === selectedSemitone) return theme.palette.primary.contrastText;
    return theme.palette.text.primary;
  };

  return (
    <svg
      viewBox="0 0 400 400"
      style={{ width: '100%', maxWidth: 380, display: 'block' }}
      aria-label="Circle of Fifths"
      role="img"
    >
      {COF_KEYS.map((key, i) => {
        // Sector i is centered at angle: i * 30 - 90 degrees (C at top)
        const centerAngle = i * 30 - 90;
        const startAngle = centerAngle - 15;
        const endAngle = centerAngle + 15;
        const fill = getSectorFill(key.semitone);
        const stroke = theme.palette.divider;

        // Outer ring label center
        const outerLabel = labelPoint(CX, CY, (OUTER_INNER_R + OUTER_OUTER_R) / 2, centerAngle);
        // Middle ring label center
        const middleLabel = labelPoint(CX, CY, (MIDDLE_INNER_R + MIDDLE_OUTER_R) / 2, centerAngle);
        // Inner ring label center
        const innerLabel = labelPoint(CX, CY, (INNER_INNER_R + INNER_OUTER_R) / 2, centerAngle);

        return (
          <g key={key.semitone}>
            {/* Outer major key sector */}
            <path
              d={sectorPath(CX, CY, OUTER_INNER_R, OUTER_OUTER_R, startAngle, endAngle)}
              fill={fill}
              stroke={stroke}
              strokeWidth={1}
              style={{ cursor: 'pointer', transition: 'fill 0.15s ease' }}
              onClick={() => onKeySelect(key)}
              onMouseEnter={() => setHoveredSemitone(key.semitone)}
              onMouseLeave={() => setHoveredSemitone(null)}
              role="button"
              aria-label={`${key.majorKey} major`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onKeySelect(key);
              }}
            />
            {/* Major key label */}
            <text
              x={outerLabel.x}
              y={outerLabel.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={14}
              fontWeight={key.semitone === selectedSemitone ? 700 : 500}
              fill={getTextColor(key.semitone)}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {key.majorKey}
            </text>

            {/* Middle minor key sector */}
            {showMinorRing ? (
              <>
                <path
                  d={sectorPath(CX, CY, MIDDLE_INNER_R, MIDDLE_OUTER_R, startAngle, endAngle)}
                  fill={getSectorFill(key.semitone)}
                  stroke={stroke}
                  strokeWidth={1}
                  style={{ cursor: 'pointer', transition: 'fill 0.15s ease' }}
                  onClick={() => onKeySelect(key)}
                  onMouseEnter={() => setHoveredSemitone(key.semitone)}
                  onMouseLeave={() => setHoveredSemitone(null)}
                />
                <text
                  x={middleLabel.x}
                  y={middleLabel.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={11}
                  fill={getTextColor(key.semitone)}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {key.minorKey}
                </text>
              </>
            ) : null}

            {/* Inner key signature sector */}
            {showKeySignatures ? (
              <>
                <path
                  d={sectorPath(CX, CY, INNER_INNER_R, INNER_OUTER_R, startAngle, endAngle)}
                  fill={getSectorFill(key.semitone)}
                  stroke={stroke}
                  strokeWidth={1}
                  style={{ cursor: 'pointer', transition: 'fill 0.15s ease' }}
                  onClick={() => onKeySelect(key)}
                  onMouseEnter={() => setHoveredSemitone(key.semitone)}
                  onMouseLeave={() => setHoveredSemitone(null)}
                />
                <text
                  x={innerLabel.x}
                  y={innerLabel.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={9}
                  fill={getTextColor(key.semitone)}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {sharpsFlatsLabel(key.sharpsFlats)}
                </text>
              </>
            ) : null}
          </g>
        );
      })}

      {/* Centre label */}
      <circle
        cx={CX}
        cy={CY}
        r={INNER_INNER_R}
        fill={theme.palette.background.paper}
        stroke={theme.palette.divider}
      />
      <text
        x={CX}
        y={CY - 8}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={10}
        fill={theme.palette.text.disabled}
        style={{ userSelect: 'none' }}
      >
        Circle of
      </text>
      <text
        x={CX}
        y={CY + 8}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={10}
        fill={theme.palette.text.disabled}
        style={{ userSelect: 'none' }}
      >
        Fifths
      </text>
    </svg>
  );
}
