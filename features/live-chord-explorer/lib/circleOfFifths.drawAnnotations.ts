import type { VisualizationModel, AnimationState } from './circleOfFifths.types';
import { buildAnnotations, type CircleAnnotation } from './circleOfFifths.annotations';
import { clamp, hexToRgba } from './circleOfFifths.math';

// ── internal types ────────────────────────────────────────────────────────────

type PlacedLabel = {
  ann: CircleAnnotation;
  lx: number; // label center x
  ly: number; // label center y
  lw: number;
  lh: number;
};

// ── geometry helpers ──────────────────────────────────────────────────────────

function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
  gap = 5,
): boolean {
  return (
    ax - aw / 2 - gap < bx + bw / 2 &&
    ax + aw / 2 + gap > bx - bw / 2 &&
    ay - ah / 2 - gap < by + bh / 2 &&
    ay + ah / 2 + gap > by - bh / 2
  );
}

function estimateDims(
  ann: CircleAnnotation,
  titleFs: number,
  bodyFs: number,
): { w: number; h: number } {
  const titleW = ann.title.length * titleFs * 0.54 + 20;
  const bodyW = ann.body ? ann.body.length * bodyFs * 0.54 + 20 : 0;
  const w = clamp(Math.max(titleW, bodyW), 72, 148);
  const h = ann.body
    ? Math.round(titleFs * 1.45 + bodyFs * 1.55 + 14)
    : Math.round(titleFs * 1.45 + 10);
  return { w, h };
}

function clampedCenter(
  angle: number,
  radius: number,
  cx: number,
  cy: number,
  w: number,
  h: number,
  canvasW: number,
  canvasH: number,
  bottomMargin: number,
): { x: number; y: number } {
  const margin = 5;
  return {
    x: clamp(cx + radius * Math.cos(angle), w / 2 + margin, canvasW - w / 2 - margin),
    y: clamp(
      cy + radius * Math.sin(angle),
      h / 2 + margin,
      canvasH - h / 2 - margin - bottomMargin,
    ),
  };
}

// Ray from label center toward target; returns the point where it exits the label rect.
function edgePoint(
  lx: number,
  ly: number,
  lw: number,
  lh: number,
  tx: number,
  ty: number,
): { x: number; y: number } {
  const dx = tx - lx;
  const dy = ty - ly;
  const hw = lw / 2,
    hh = lh / 2;
  const tX = Math.abs(dx) > 0.5 ? hw / Math.abs(dx) : Infinity;
  const tY = Math.abs(dy) > 0.5 ? hh / Math.abs(dy) : Infinity;
  const t = Math.min(tX, tY);
  if (!isFinite(t)) return { x: lx + hw, y: ly };
  return { x: lx + dx * t, y: ly + dy * t };
}

// ── layout ────────────────────────────────────────────────────────────────────

function layoutAnnotations(
  raw: CircleAnnotation[],
  labelR: number,
  cx: number,
  cy: number,
  canvasW: number,
  canvasH: number,
  titleFs: number,
  bodyFs: number,
  bottomMargin: number,
): PlacedLabel[] {
  const placed: PlacedLabel[] = [];
  const STEP = Math.PI / 20; // 9° nudge increments
  const MAX_STEPS = 7; // ±63° search window

  for (const ann of raw) {
    const { w, h } = estimateDims(ann, titleFs, bodyFs);
    let found = false;

    outer: for (let d = 0; d <= MAX_STEPS; d++) {
      for (const sign of d === 0 ? [0] : [1, -1]) {
        const angle = ann.idealAngle + sign * d * STEP;
        const { x, y } = clampedCenter(angle, labelR, cx, cy, w, h, canvasW, canvasH, bottomMargin);
        const overlaps = placed.some((p) => rectsOverlap(x, y, w, h, p.lx, p.ly, p.lw, p.lh));
        if (!overlaps) {
          placed.push({ ann, lx: x, ly: y, lw: w, lh: h });
          found = true;
          break outer;
        }
      }
    }

    if (!found) {
      // Last resort: push further out radially
      const { x, y } = clampedCenter(
        ann.idealAngle,
        labelR * 1.22,
        cx,
        cy,
        w,
        h,
        canvasW,
        canvasH,
        bottomMargin,
      );
      const overlaps = placed.some((p) => rectsOverlap(x, y, w, h, p.lx, p.ly, p.lw, p.lh));
      if (!overlaps) placed.push({ ann, lx: x, ly: y, lw: w, lh: h });
      // If still overlapping, drop this annotation silently
    }
  }

  return placed;
}

// ── drawing ───────────────────────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  pl: PlacedLabel,
  titleFs: number,
  bodyFs: number,
): void {
  const { ann, lx, ly, lw, lh } = pl;
  if (ann.opacity < 0.02) return;

  const bx = lx - lw / 2;
  const by = ly - lh / 2;
  const accentW = 2.5;

  ctx.save();
  ctx.globalAlpha = ann.opacity;

  // Background
  ctx.fillStyle = 'rgba(4,9,18,0.91)';
  roundRect(ctx, bx, by, lw, lh, 3);
  ctx.fill();

  // Border
  ctx.strokeStyle = hexToRgba(ann.color, 0.28);
  ctx.lineWidth = 0.75;
  roundRect(ctx, bx, by, lw, lh, 3);
  ctx.stroke();

  // Left accent bar (clipped to rounded rect inset)
  ctx.globalAlpha = ann.opacity * 0.82;
  ctx.fillStyle = ann.color;
  ctx.fillRect(bx, by + 3, accentW, lh - 6);

  // Leader line to target node
  const ep = edgePoint(lx, ly, lw, lh, ann.targetX, ann.targetY);
  ctx.globalAlpha = ann.opacity * 0.38;
  ctx.strokeStyle = ann.color;
  ctx.lineWidth = 0.8;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(Math.round(ep.x) + 0.5, Math.round(ep.y) + 0.5);
  ctx.lineTo(Math.round(ann.targetX) + 0.5, Math.round(ann.targetY) + 0.5);
  ctx.stroke();
  ctx.setLineDash([]);

  // Dot at target
  ctx.globalAlpha = ann.opacity * 0.55;
  ctx.fillStyle = ann.color;
  ctx.beginPath();
  ctx.arc(ann.targetX, ann.targetY, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Title text
  ctx.globalAlpha = ann.opacity;
  ctx.font = `700 ${titleFs}px system-ui,sans-serif`;
  ctx.fillStyle = ann.color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const textX = bx + accentW + 5;
  const textY = by + 4;
  ctx.fillText(ann.title, textX, textY, lw - accentW - 9);

  // Body text
  if (ann.body) {
    ctx.globalAlpha = ann.opacity * 0.78;
    ctx.font = `${bodyFs}px system-ui,sans-serif`;
    ctx.fillStyle = 'rgba(180,210,255,0.72)';
    ctx.fillText(ann.body, textX, textY + Math.ceil(titleFs * 1.45), lw - accentW - 9);
  }

  ctx.restore();
}

// ── public entry point ────────────────────────────────────────────────────────

export function drawAnnotations(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  model: VisualizationModel,
  anim: AnimationState,
  fontSize: number,
): void {
  const raw = buildAnnotations(model, anim, cx, cy, outerR, innerR);
  if (raw.length === 0) return;

  const titleFs = clamp(fontSize * 0.82, 7, 11);
  const bodyFs = clamp(fontSize * 0.7, 6, 9);
  // Place labels outside the ring; the chord-name text sits at ~outerR*1.15,
  // so we target ~outerR*1.5 and rely on clamping near canvas edges.
  const labelR = outerR * 1.5;
  const bottomMargin = 68; // leave room for the insight panel overlay

  const placed = layoutAnnotations(
    raw,
    labelR,
    cx,
    cy,
    width,
    height,
    titleFs,
    bodyFs,
    bottomMargin,
  );
  for (const pl of placed) {
    drawLabel(ctx, pl, titleFs, bodyFs);
  }
}
