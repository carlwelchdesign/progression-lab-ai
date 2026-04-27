'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import type {
  ActiveNote,
  DetectedChord,
  ChordSuggestion,
  SuggestionCategory,
  HarmonicInsight,
} from '../types';
import type { VisualizationModel } from '../lib/circleOfFifths.types';
import {
  initAnimState,
  syncModelToState,
  updateParticles,
  updateGlows,
  updatePhases,
} from '../lib/circleOfFifths.animation';
import { drawFrame } from '../lib/circleOfFifths.draw';
import { chordNameToPos, pitchClassToPos, posToPoint, clamp } from '../lib/circleOfFifths.math';
import { PC_TO_POS, CIRCLE_NODES } from '../lib/circleOfFifths.constants';
import { getChordRootSemitone } from '../../../domain/music/circleOfFifths';

const INSIGHT_COLORS: Record<string, string> = {
  diatonic: '#4db8ff',
  dominant: '#ff5722',
  resolution: '#4caf50',
  borrowed: '#ba68c8',
  voiceLeading: '#4db8ff',
  tension: '#ffa726',
  playing: '#c8ddff',
};

function getNodeRole(pos: number, isMinor: boolean, model: VisualizationModel): string | null {
  if (model.anchorPos === pos && (isMinor ? model.anchorIsMinor : !model.anchorIsMinor)) {
    return 'Harmonic anchor';
  }
  if (!isMinor && model.keyCenterPos === pos) return 'Key center';
  if (!isMinor && model.activePitchClasses.some((pc) => PC_TO_POS[pc] === pos))
    return 'Playing now';
  if (model.selectedPos === pos && (isMinor ? model.selectedIsMinor : !model.selectedIsMinor)) {
    return 'Selected';
  }
  const s = model.suggestions.find((s) => s.pos === pos && s.isMinor === isMinor);
  if (s) {
    const labels: Record<string, string> = {
      diatonic: 'Diatonic',
      resolution: 'Resolution',
      tension: 'Tension',
      color: 'Color chord',
      jazzy: 'Jazz move',
    };
    return labels[s.category] ?? s.category;
  }
  return null;
}

type Props = {
  activeNotes: ActiveNote[];
  liveDetectedChord: DetectedChord;
  harmonicAnchor: DetectedChord;
  selectedSuggestion: ChordSuggestion | null;
  suggestions: ChordSuggestion[];
  keyCenter: string | null;
  insight: HarmonicInsight | null;
};

function buildModel(
  activeNotes: ActiveNote[],
  liveDetectedChord: DetectedChord,
  harmonicAnchor: DetectedChord,
  selectedSuggestion: ChordSuggestion | null,
  suggestions: ChordSuggestion[],
  keyCenter: string | null,
): VisualizationModel {
  const activePitchClasses = activeNotes.map((n) => n.pitchClass);

  let anchorPos: number | null = null;
  let anchorIsMinor = false;
  if (harmonicAnchor) {
    const r = chordNameToPos(harmonicAnchor.name);
    if (r) {
      anchorPos = r.pos;
      anchorIsMinor = r.isMinor;
    }
  }

  let keyCenterPos: number | null = null;
  if (keyCenter) {
    const pc = getChordRootSemitone(keyCenter);
    if (pc !== null) keyCenterPos = PC_TO_POS[pc];
  }

  let selectedPos: number | null = null;
  let selectedIsMinor = false;
  let selectedCategory: string | null = null;
  if (selectedSuggestion) {
    const r = chordNameToPos(selectedSuggestion.name);
    if (r) {
      selectedPos = r.pos;
      selectedIsMinor = r.isMinor;
    }
    selectedCategory = selectedSuggestion.category;
  }

  const suggestionList = suggestions
    .slice(0, 16)
    .map((s) => {
      const r = chordNameToPos(s.name);
      return r ? { pos: r.pos, isMinor: r.isMinor, category: s.category } : null;
    })
    .filter(
      (s): s is { pos: number; isMinor: boolean; category: SuggestionCategory } => s !== null,
    );

  let liveChordPos: number | null = null;
  let liveChordIsMinor = false;
  if (liveDetectedChord) {
    const r = chordNameToPos(liveDetectedChord.name);
    if (r) {
      liveChordPos = r.pos;
      liveChordIsMinor = r.isMinor;
    }
  }

  return {
    activePitchClasses,
    anchorPos,
    anchorIsMinor,
    keyCenterPos,
    selectedPos,
    selectedIsMinor,
    selectedCategory,
    suggestions: suggestionList,
    liveChordPos,
    liveChordIsMinor,
  };
}

export default function CircleOfFifthsCanvas({
  activeNotes,
  liveDetectedChord,
  harmonicAnchor,
  selectedSuggestion,
  suggestions,
  keyCenter,
  insight,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animStateRef = useRef(initAnimState());
  const modelRef = useRef<VisualizationModel>(
    buildModel(
      activeNotes,
      liveDetectedChord,
      harmonicAnchor,
      selectedSuggestion,
      suggestions,
      keyCenter,
    ),
  );
  const sizeRef = useRef({ width: 0, height: 0 });
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef(0);

  const [hoverTooltip, setHoverTooltip] = useState<{
    x: number;
    y: number;
    aboveNode: boolean;
    label: string;
    role: string | null;
  } | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const { width, height } = sizeRef.current;
    if (width < 10 || height < 10) return;
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.min(cx, cy);
    const outerR = r * 0.76;
    const innerR = outerR * 0.62;
    const outerNodeR = clamp(r * 0.075, 8, 18);
    const innerNodeR = clamp(r * 0.055, 6, 13);
    const model = modelRef.current;

    for (let i = 0; i < 12; i++) {
      const pt = posToPoint(i, outerR, cx, cy);
      if (Math.hypot(mouseX - pt.x, mouseY - pt.y) <= outerNodeR * 2.2) {
        setHoverTooltip({
          x: pt.x,
          y: pt.y,
          aboveNode: pt.y > cy,
          label: CIRCLE_NODES[i].major,
          role: getNodeRole(i, false, model),
        });
        return;
      }
    }
    for (let i = 0; i < 12; i++) {
      const pt = posToPoint(i, innerR, cx, cy);
      if (Math.hypot(mouseX - pt.x, mouseY - pt.y) <= innerNodeR * 2.2) {
        setHoverTooltip({
          x: pt.x,
          y: pt.y,
          aboveNode: pt.y > cy,
          label: CIRCLE_NODES[i].minor,
          role: getNodeRole(i, true, model),
        });
        return;
      }
    }
    setHoverTooltip(null);
  }, []);

  const handleMouseLeave = useCallback(() => setHoverTooltip(null), []);

  // Keep model current and trigger animation sync
  useEffect(() => {
    const model = buildModel(
      activeNotes,
      liveDetectedChord,
      harmonicAnchor,
      selectedSuggestion,
      suggestions,
      keyCenter,
    );
    modelRef.current = model;
    const { width, height } = sizeRef.current;
    if (width > 0 && height > 0) {
      const cx = width / 2;
      const cy = height / 2;
      const outerR = Math.min(cx, cy) * 0.76;
      syncModelToState(animStateRef.current, model, cx, cy, outerR);
    }
  }, [activeNotes, liveDetectedChord, harmonicAnchor, selectedSuggestion, suggestions, keyCenter]);

  const loop = useCallback((ts: number) => {
    const dt = Math.min((ts - lastTsRef.current) / 1000, 0.05);
    lastTsRef.current = ts;

    const canvas = canvasRef.current;
    const { width, height } = sizeRef.current;
    if (canvas && width > 0 && height > 0) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        updatePhases(animStateRef.current, dt);
        updateGlows(animStateRef.current, dt);
        updateParticles(animStateRef.current, dt);
        drawFrame(ctx, width, height, modelRef.current, animStateRef.current);
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  // Start / stop RAF
  useEffect(() => {
    lastTsRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [loop]);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width < 10 || height < 10) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      sizeRef.current = { width, height };

      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        flex: 1,
        minHeight: 0,
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: '#040912',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', position: 'absolute', inset: 0, cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {/* Hover tooltip */}
      {hoverTooltip && (
        <Box
          sx={{
            position: 'absolute',
            left: hoverTooltip.x,
            top: hoverTooltip.aboveNode ? hoverTooltip.y - 10 : hoverTooltip.y + 10,
            transform: hoverTooltip.aboveNode ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
            pointerEvents: 'none',
            zIndex: 4,
            background: 'rgba(4,9,18,0.92)',
            border: '1px solid rgba(45,80,180,0.5)',
            borderRadius: '4px',
            px: 1,
            py: 0.5,
            whiteSpace: 'nowrap',
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: '#c8ddff', display: 'block', lineHeight: 1.3 }}
          >
            {hoverTooltip.label}
          </Typography>
          {hoverTooltip.role && (
            <Typography
              variant="caption"
              sx={{ color: 'rgba(150,190,230,0.75)', fontSize: '0.63rem', lineHeight: 1.2 }}
            >
              {hoverTooltip.role}
            </Typography>
          )}
        </Box>
      )}

      {/* Harmonic insight overlay */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          p: 0.75,
          pointerEvents: 'none',
          zIndex: 2,
          opacity: insight ? 1 : 0,
          transition: 'opacity 0.35s ease',
        }}
      >
        <Box
          sx={{
            background: 'rgba(4,9,18,0.84)',
            backdropFilter: 'blur(6px)',
            borderRadius: 1,
            border: '1px solid rgba(45,80,180,0.25)',
            borderLeft: `3px solid ${INSIGHT_COLORS[insight?.type ?? 'diatonic']}`,
            px: 1.25,
            py: 0.75,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.3, flexWrap: 'wrap' }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: INSIGHT_COLORS[insight?.type ?? 'diatonic'],
                lineHeight: 1.2,
              }}
            >
              {insight?.title ?? ''}
            </Typography>
            <Chip
              label={insight?.shortLabel ?? ''}
              size="small"
              sx={{
                height: 15,
                fontSize: '0.58rem',
                bgcolor: `${INSIGHT_COLORS[insight?.type ?? 'diatonic']}20`,
                color: INSIGHT_COLORS[insight?.type ?? 'diatonic'],
                border: `1px solid ${INSIGHT_COLORS[insight?.type ?? 'diatonic']}44`,
                '& .MuiChip-label': { px: 0.6, py: 0 },
              }}
            />
          </Box>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(180,210,255,0.68)',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontSize: '0.67rem',
            }}
          >
            {insight?.explanation ?? ''}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
