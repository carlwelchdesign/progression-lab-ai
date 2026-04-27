import type { VisualizationModel, AnimationState } from './circleOfFifths.types';
import { CIRCLE_NODES, CATEGORY_COLORS } from './circleOfFifths.constants';
import { posToAngle, posToPoint } from './circleOfFifths.math';

export type AnnotationKind = 'tonic' | 'anchor' | 'suggestion' | 'live' | 'dominant' | 'borrowed';

export type CircleAnnotation = {
  id: string;
  targetX: number;
  targetY: number;
  idealAngle: number;
  priority: number;
  title: string;
  body?: string;
  kind: AnnotationKind;
  color: string;
  opacity: number;
};

const KIND_COLORS: Record<AnnotationKind, string> = {
  tonic: '#00d4ff',
  anchor: '#ffcc44',
  suggestion: '#4db8ff',
  live: '#c8ddff',
  dominant: '#ff7043',
  borrowed: '#ce93d8',
};

const CATEGORY_BODIES: Record<string, string> = {
  diatonic: 'stays in key',
  resolution: 'resolves tension',
  tension: 'secondary dominant',
  color: 'borrowed modal color',
  jazzy: 'jazz harmony',
};

type AnimSnapshot = Pick<AnimationState, 'outerGlow' | 'innerGlow' | 'selectedOpacity'>;

export function buildAnnotations(
  model: VisualizationModel,
  anim: AnimSnapshot,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
): CircleAnnotation[] {
  const out: CircleAnnotation[] = [];

  // ── Key center / tonic (skip when same node as anchor) ──────────────────────
  if (model.keyCenterPos !== null) {
    const isAlsoAnchor = model.keyCenterPos === model.anchorPos && !model.anchorIsMinor;
    if (!isAlsoAnchor) {
      const pt = posToPoint(model.keyCenterPos, outerR, cx, cy);
      out.push({
        id: 'keycenter',
        targetX: pt.x,
        targetY: pt.y,
        idealAngle: posToAngle(model.keyCenterPos),
        priority: 85,
        title: `${CIRCLE_NODES[model.keyCenterPos].major}: tonic`,
        body: 'home base of the key',
        kind: 'tonic',
        color: KIND_COLORS.tonic,
        opacity: Math.min(anim.outerGlow[model.keyCenterPos] + 0.4, 0.92),
      });
    }
  }

  // ── Harmonic anchor ─────────────────────────────────────────────────────────
  if (model.anchorPos !== null) {
    const isMinor = model.anchorIsMinor;
    const pt = posToPoint(model.anchorPos, isMinor ? innerR : outerR, cx, cy);
    const chordLabel = isMinor
      ? CIRCLE_NODES[model.anchorPos].minor
      : CIRCLE_NODES[model.anchorPos].major;
    const isAlsoTonic = !isMinor && model.keyCenterPos === model.anchorPos;
    const glow = isMinor ? anim.innerGlow[model.anchorPos] : anim.outerGlow[model.anchorPos];

    out.push({
      id: 'anchor',
      targetX: pt.x,
      targetY: pt.y,
      idealAngle: posToAngle(model.anchorPos),
      priority: 100,
      title: isAlsoTonic ? `${chordLabel}: tonic · anchor` : `${chordLabel}: anchor`,
      body: isAlsoTonic ? 'home base and starting point' : 'starting point',
      kind: 'anchor',
      color: KIND_COLORS.anchor,
      opacity: Math.max(glow * 0.95, 0.75),
    });
  }

  // ── Selected suggestion ─────────────────────────────────────────────────────
  if (model.selectedPos !== null && model.anchorPos !== null && anim.selectedOpacity > 0.08) {
    const isMinor = model.selectedIsMinor;
    const pt = posToPoint(model.selectedPos, isMinor ? innerR : outerR, cx, cy);
    const chordLabel = isMinor
      ? CIRCLE_NODES[model.selectedPos].minor
      : CIRCLE_NODES[model.selectedPos].major;
    const body = CATEGORY_BODIES[model.selectedCategory ?? ''];
    const color = CATEGORY_COLORS[model.selectedCategory ?? ''] ?? KIND_COLORS.suggestion;

    out.push({
      id: 'selected',
      targetX: pt.x,
      targetY: pt.y,
      idealAngle: posToAngle(model.selectedPos),
      priority: 80,
      title: `${chordLabel}: next move`,
      body,
      kind: 'suggestion',
      color,
      opacity: Math.min(anim.selectedOpacity * 1.1, 0.92),
    });
  }

  // ── Live playing chord (with anchor, different from anchor and selected) ─────
  if (
    model.liveChordPos !== null &&
    model.anchorPos !== null &&
    model.liveChordPos !== model.anchorPos &&
    model.liveChordPos !== model.selectedPos
  ) {
    const isMinor = model.liveChordIsMinor;
    const glow = isMinor ? anim.innerGlow[model.liveChordPos] : anim.outerGlow[model.liveChordPos];
    if (glow > 0.2) {
      const pt = posToPoint(model.liveChordPos, isMinor ? innerR : outerR, cx, cy);
      const chordLabel = isMinor
        ? CIRCLE_NODES[model.liveChordPos].minor
        : CIRCLE_NODES[model.liveChordPos].major;
      out.push({
        id: 'live',
        targetX: pt.x,
        targetY: pt.y,
        idealAngle: posToAngle(model.liveChordPos),
        priority: 65,
        title: `${chordLabel}: playing now`,
        kind: 'live',
        color: KIND_COLORS.live,
        opacity: Math.min(glow + 0.12, 0.88),
      });
    }
  }

  // ── Live playing chord (no anchor yet) ──────────────────────────────────────
  if (model.anchorPos === null && model.liveChordPos !== null) {
    const isMinor = model.liveChordIsMinor;
    const glow = isMinor ? anim.innerGlow[model.liveChordPos] : anim.outerGlow[model.liveChordPos];
    if (glow > 0.2) {
      const pt = posToPoint(model.liveChordPos, isMinor ? innerR : outerR, cx, cy);
      const chordLabel = isMinor
        ? CIRCLE_NODES[model.liveChordPos].minor
        : CIRCLE_NODES[model.liveChordPos].major;
      out.push({
        id: 'live-noanchor',
        targetX: pt.x,
        targetY: pt.y,
        idealAngle: posToAngle(model.liveChordPos),
        priority: 70,
        title: `${chordLabel}: playing`,
        body: 'hold to set as anchor',
        kind: 'live',
        color: KIND_COLORS.live,
        opacity: Math.min(glow + 0.1, 0.85),
      });
    }
  }

  // ── Dominant (V chord) of the key ───────────────────────────────────────────
  // One step clockwise on the circle = the dominant fifth above
  if (model.keyCenterPos !== null && model.anchorPos !== null) {
    const vPos = (model.keyCenterPos + 1) % 12;
    const alreadyLabeled =
      vPos === model.anchorPos || vPos === model.selectedPos || vPos === model.keyCenterPos;
    if (!alreadyLabeled) {
      const isSuggested = model.suggestions.some((s) => s.pos === vPos && !s.isMinor);
      if (isSuggested) {
        const pt = posToPoint(vPos, outerR, cx, cy);
        out.push({
          id: 'dominant',
          targetX: pt.x,
          targetY: pt.y,
          idealAngle: posToAngle(vPos),
          priority: 50,
          title: `${CIRCLE_NODES[vPos].major}: dominant`,
          body: 'V · strong pull to tonic',
          kind: 'dominant',
          color: KIND_COLORS.dominant,
          opacity: Math.min(anim.outerGlow[vPos] + 0.28, 0.8),
        });
      }
    }
  }

  out.sort((a, b) => b.priority - a.priority);
  return out.slice(0, 5);
}
