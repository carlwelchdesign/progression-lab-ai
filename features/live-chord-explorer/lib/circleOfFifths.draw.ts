import type { AnimationState, VisualizationModel } from './circleOfFifths.types';
import { CIRCLE_NODES, PC_TO_POS, CATEGORY_COLORS, PALETTE } from './circleOfFifths.constants';
import { posToAngle, posToPoint, lerp, clamp, hexToRgba } from './circleOfFifths.math';
import { drawAnnotations } from './circleOfFifths.drawAnnotations';

// ── helpers ──────────────────────────────────────────────────────────────────

function drawGlowCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  glowR: number,
  color: string,
  alpha: number,
): void {
  if (alpha < 0.01) return;
  const grad = ctx.createRadialGradient(x, y, 0, x, y, glowR);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, glowR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  nodeR: number,
  fillColor: string,
  borderColor: string,
  intensity: number,
): void {
  ctx.beginPath();
  ctx.arc(x, y, nodeR, 0, Math.PI * 2);
  ctx.fillStyle = intensity > 0.05 ? fillColor : PALETTE.nodeBase;
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawArcPath(
  ctx: CanvasRenderingContext2D,
  fromPos: number,
  toPos: number,
  radius: number,
  cx: number,
  cy: number,
  color: string,
  opacity: number,
  lineWidth: number,
): void {
  if (opacity < 0.01 || fromPos === toPos) return;
  const from = posToPoint(fromPos, radius * 0.88, cx, cy);
  const to = posToPoint(toPos, radius * 0.88, cx, cy);
  // Control point bows toward center (25% from midpoint toward center)
  const cpX = lerp((from.x + to.x) / 2, cx, 0.75);
  const cpY = lerp((from.y + to.y) / 2, cy, 0.75);

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.quadraticCurveTo(cpX, cpY, to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

// ── per-layer draw functions ─────────────────────────────────────────────────

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cx: number,
  cy: number,
  r: number,
): void {
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, width, height);

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.1);
  grad.addColorStop(0, PALETTE.bgInner);
  grad.addColorStop(1, PALETTE.bg);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

function drawSpokes(ctx: CanvasRenderingContext2D, cx: number, cy: number, outerR: number): void {
  ctx.save();
  ctx.strokeStyle = PALETTE.ringSpoke;
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    const a = posToAngle(i);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + outerR * 1.02 * Math.cos(a), cy + outerR * 1.02 * Math.sin(a));
    ctx.stroke();
  }
  ctx.restore();
}

function drawRingOrbits(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
): void {
  ctx.save();
  ctx.strokeStyle = PALETTE.ring;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSectors(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  anim: AnimationState,
): void {
  const halfSlice = Math.PI / 12; // 15°
  for (let i = 0; i < 12; i++) {
    const g = anim.sectorGlow[i];
    if (g < 0.01) continue;
    const a = posToAngle(i);
    ctx.save();
    ctx.globalAlpha = g * 0.55;
    ctx.fillStyle = PALETTE.sectorFill;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR * 1.05, a - halfSlice, a + halfSlice);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawSuggestionPaths(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  model: VisualizationModel,
  anim: AnimationState,
): void {
  if (model.anchorPos === null) return;
  for (const s of model.suggestions) {
    if (s.pos === model.anchorPos) continue;
    const color = CATEGORY_COLORS[s.category] ?? '#ffffff';
    drawArcPath(ctx, model.anchorPos, s.pos, outerR, cx, cy, color, 0.11, 1);
  }
}

function drawSelectedPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  model: VisualizationModel,
  anim: AnimationState,
): void {
  if (
    model.anchorPos === null ||
    model.selectedPos === null ||
    model.selectedPos === model.anchorPos
  )
    return;

  const color = CATEGORY_COLORS[model.selectedCategory ?? ''] ?? PALETTE.keyCenter;
  const opacity = anim.selectedOpacity * 0.75;
  drawArcPath(ctx, model.anchorPos, model.selectedPos, outerR, cx, cy, color, opacity, 2.5);

  // Arrowhead at destination
  if (opacity < 0.05) return;
  const dest = posToPoint(model.selectedPos, outerR * 0.88, cx, cy);
  const srcAngle = Math.atan2(dest.y - cy, dest.x - cx);
  const arrowLen = 8;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(dest.x, dest.y);
  ctx.lineTo(
    dest.x - arrowLen * Math.cos(srcAngle - 0.4),
    dest.y - arrowLen * Math.sin(srcAngle - 0.4),
  );
  ctx.lineTo(
    dest.x - arrowLen * Math.cos(srcAngle + 0.4),
    dest.y - arrowLen * Math.sin(srcAngle + 0.4),
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function nodeColorForPos(
  pos: number,
  isOuter: boolean,
  model: VisualizationModel,
  anim: AnimationState,
): { fill: string; glow: string; border: string } {
  const isLive = isOuter && model.activePitchClasses.some((pc) => PC_TO_POS[pc] === pos);

  const isAnchor =
    model.anchorPos === pos && (isOuter ? !model.anchorIsMinor : model.anchorIsMinor);

  const isKeyCenter = isOuter && model.keyCenterPos === pos;

  const isSelected =
    model.selectedPos === pos && (isOuter ? !model.selectedIsMinor : model.selectedIsMinor);

  const suggestion = model.suggestions.find(
    (s) => s.pos === pos && (isOuter ? !s.isMinor : s.isMinor),
  );

  if (isAnchor) {
    return { fill: hexToRgba('#ffcc44', 0.85), glow: PALETTE.anchorGlow, border: PALETTE.anchor };
  }
  if (isLive) {
    return {
      fill: hexToRgba('#e8f4ff', 0.7),
      glow: PALETTE.liveNoteGlow,
      border: PALETTE.liveNote,
    };
  }
  if (isKeyCenter) {
    return {
      fill: hexToRgba('#00d4ff', 0.5),
      glow: PALETTE.keyCenterGlow,
      border: PALETTE.keyCenter,
    };
  }
  if (isSelected) {
    const c = CATEGORY_COLORS[model.selectedCategory ?? ''] ?? PALETTE.keyCenter;
    return { fill: hexToRgba(c, 0.55), glow: hexToRgba(c, 0.4), border: c };
  }
  if (suggestion) {
    const c = CATEGORY_COLORS[suggestion.category] ?? '#aaaaaa';
    return { fill: hexToRgba(c, 0.22), glow: hexToRgba(c, 0.28), border: hexToRgba(c, 0.6) };
  }
  return { fill: PALETTE.nodeBase, glow: 'rgba(0,0,0,0)', border: PALETTE.nodeBorder };
}

function drawOuterNodes(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  nodeR: number,
  model: VisualizationModel,
  anim: AnimationState,
): void {
  const isAnchorPulsing = model.anchorPos !== null && !model.anchorIsMinor;

  for (let i = 0; i < 12; i++) {
    const g = anim.outerGlow[i];
    const pt = posToPoint(i, outerR, cx, cy);
    const { fill, glow, border } = nodeColorForPos(i, true, model, anim);

    // Anchor pulse
    let extraGlow = g;
    if (isAnchorPulsing && i === model.anchorPos) {
      extraGlow = g * (0.75 + 0.25 * Math.sin(anim.anchorPhase));
    }

    drawGlowCircle(ctx, pt.x, pt.y, nodeR * 3.5, glow, extraGlow * 0.9);
    drawNode(ctx, pt.x, pt.y, nodeR, fill, border, g);
  }
}

function drawInnerNodes(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  innerR: number,
  nodeR: number,
  model: VisualizationModel,
  anim: AnimationState,
): void {
  const isAnchorPulsing = model.anchorPos !== null && model.anchorIsMinor;

  for (let i = 0; i < 12; i++) {
    const g = anim.innerGlow[i];
    const pt = posToPoint(i, innerR, cx, cy);
    const { fill, glow, border } = nodeColorForPos(i, false, model, anim);

    let extraGlow = g;
    if (isAnchorPulsing && i === model.anchorPos) {
      extraGlow = g * (0.75 + 0.25 * Math.sin(anim.anchorPhase));
    }

    drawGlowCircle(ctx, pt.x, pt.y, nodeR * 3, glow, extraGlow * 0.85);
    drawNode(ctx, pt.x, pt.y, nodeR, fill, border, g);
  }
}

function drawLabels(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  outerNodeR: number,
  innerNodeR: number,
  model: VisualizationModel,
  anim: AnimationState,
  fontSize: number,
): void {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const outerLabelR = outerR + outerNodeR + clamp(fontSize * 0.9, 6, 12);
  const innerLabelR = innerR;

  for (let i = 0; i < 12; i++) {
    const node = CIRCLE_NODES[i];
    const outerG = anim.outerGlow[i];
    const innerG = anim.innerGlow[i];

    // Outer (major) label
    const outerPt = posToPoint(i, outerLabelR, cx, cy);
    const isAnchorOuter = model.anchorPos === i && !model.anchorIsMinor;
    const isLive = model.activePitchClasses.some((pc) => PC_TO_POS[pc] === i);
    const isKeyCenter = model.keyCenterPos === i;
    const outerBright = isAnchorOuter || isLive || isKeyCenter || outerG > 0.5;

    ctx.save();
    ctx.font = `${outerBright ? 700 : 400} ${fontSize}px system-ui,sans-serif`;
    ctx.fillStyle = outerBright
      ? PALETTE.labelBright
      : outerG > 0.15
        ? PALETTE.labelNormal
        : PALETTE.labelDim;
    ctx.fillText(node.major, outerPt.x, outerPt.y);
    ctx.restore();

    // Inner (minor) label — only visible when somewhat active
    if (innerG > 0.08) {
      const innerPt = posToPoint(i, innerLabelR, cx, cy);
      const isAnchorInner = model.anchorPos === i && model.anchorIsMinor;
      ctx.save();
      ctx.font = `${isAnchorInner ? 700 : 400} ${Math.round(fontSize * 0.78)}px system-ui,sans-serif`;
      ctx.fillStyle = isAnchorInner ? PALETTE.labelBright : PALETTE.labelNormal;
      ctx.globalAlpha = clamp(innerG * 1.4, 0, 1);
      ctx.fillText(node.minor, innerPt.x, innerPt.y);
      ctx.restore();
    }
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, anim: AnimationState): void {
  for (const p of anim.particles) {
    ctx.save();
    ctx.globalAlpha = clamp(p.life, 0, 1) * 0.9;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawKeyCenterRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  model: VisualizationModel,
  anim: AnimationState,
): void {
  if (model.keyCenterPos === null) return;
  const pt = posToPoint(model.keyCenterPos, outerR, cx, cy);
  const pulse = 0.5 + 0.5 * Math.sin(anim.keyCenterPhase);
  const ringR = outerR * 0.09 + pulse * outerR * 0.02;

  ctx.save();
  ctx.strokeStyle = PALETTE.keyCenter;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.35 + pulse * 0.25;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.arc(pt.x, pt.y, ringR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// ── public entry point ────────────────────────────────────────────────────────

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  model: VisualizationModel,
  anim: AnimationState,
): void {
  if (width < 10 || height < 10) return;

  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(cx, cy);
  const outerR = r * 0.76;
  const innerR = outerR * 0.62;
  const outerNodeR = clamp(r * 0.075, 8, 18);
  const innerNodeR = clamp(r * 0.055, 6, 13);
  const fontSize = clamp(r * 0.068, 9, 14);

  ctx.clearRect(0, 0, width, height);

  drawBackground(ctx, width, height, cx, cy, r);
  drawSpokes(ctx, cx, cy, outerR);
  drawSectors(ctx, cx, cy, outerR, anim);
  drawRingOrbits(ctx, cx, cy, outerR, innerR);
  drawSuggestionPaths(ctx, cx, cy, outerR, model, anim);
  drawSelectedPath(ctx, cx, cy, outerR, model, anim);
  drawInnerNodes(ctx, cx, cy, innerR, innerNodeR, model, anim);
  drawOuterNodes(ctx, cx, cy, outerR, outerNodeR, model, anim);
  drawKeyCenterRing(ctx, cx, cy, outerR, model, anim);
  drawLabels(ctx, cx, cy, outerR, innerR, outerNodeR, innerNodeR, model, anim, fontSize);
  drawParticles(ctx, anim);
  drawAnnotations(ctx, width, height, cx, cy, outerR, innerR, model, anim, fontSize);
}
