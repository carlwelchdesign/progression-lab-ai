import type { AnimationState, Particle, VisualizationModel } from './circleOfFifths.types';
import { PC_TO_POS, CATEGORY_COLORS, PALETTE } from './circleOfFifths.constants';
import { posToPoint, lerp, clamp } from './circleOfFifths.math';

export function initAnimState(): AnimationState {
  return {
    outerGlow: new Float32Array(12),
    outerGlowTarget: new Float32Array(12),
    innerGlow: new Float32Array(12),
    innerGlowTarget: new Float32Array(12),
    sectorGlow: new Float32Array(12),
    sectorGlowTarget: new Float32Array(12),
    selectedOpacity: 0,
    selectedOpacityTarget: 0,
    anchorPhase: 0,
    keyCenterPhase: 0,
    particles: [],
    prevActivePCs: new Set(),
    prevAnchorPos: null,
    prevSelectedPos: null,
    prevLiveMatchPos: null,
    t: 0,
  };
}

function spawnParticles(
  state: AnimationState,
  pos: number,
  cx: number,
  cy: number,
  outerR: number,
  color: string,
  count: number,
): void {
  const origin = posToPoint(pos, outerR * 0.88, cx, cy);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 18 + Math.random() * 55;
    const p: Particle = {
      x: origin.x + (Math.random() - 0.5) * 6,
      y: origin.y + (Math.random() - 0.5) * 6,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.8 + Math.random() * 0.4,
      decay: 1.4 + Math.random() * 1.6,
      r: 1.2 + Math.random() * 1.8,
      color,
    };
    state.particles.push(p);
  }
}

export function syncModelToState(
  state: AnimationState,
  model: VisualizationModel,
  cx: number,
  cy: number,
  outerR: number,
): void {
  const currentPCs = new Set(model.activePitchClasses);

  // Detect note-ons and spawn burst particles
  for (const pc of currentPCs) {
    if (!state.prevActivePCs.has(pc)) {
      const pos = PC_TO_POS[pc];
      const cat = model.suggestions.find((s) => s.pos === pos)?.category;
      const color = cat ? (CATEGORY_COLORS[cat] ?? PALETTE.liveNote) : PALETTE.liveNote;
      spawnParticles(state, pos, cx, cy, outerR, color, 10);
    }
  }
  state.prevActivePCs = currentPCs;

  // Detect anchor commit and spawn ring pulse
  if (model.anchorPos !== null && model.anchorPos !== state.prevAnchorPos) {
    spawnParticles(state, model.anchorPos, cx, cy, outerR, PALETTE.anchor, 18);
    state.prevAnchorPos = model.anchorPos;
  } else if (model.anchorPos === null) {
    state.prevAnchorPos = null;
  }

  // Detect selection change and spawn brief flash
  if (model.selectedPos !== null && model.selectedPos !== state.prevSelectedPos) {
    const color = CATEGORY_COLORS[model.selectedCategory ?? ''] ?? PALETTE.keyCenter;
    spawnParticles(state, model.selectedPos, cx, cy, outerR, color, 7);
    state.prevSelectedPos = model.selectedPos;
  } else if (model.selectedPos === null) {
    state.prevSelectedPos = null;
  }

  // Detect live-chord lock-in (user plays the selected suggestion)
  const liveMatchesSelected =
    model.liveChordPos !== null && model.liveChordPos === model.selectedPos;
  if (liveMatchesSelected && model.liveChordPos !== state.prevLiveMatchPos) {
    spawnParticles(state, model.liveChordPos!, cx, cy, outerR, PALETTE.liveNote, 22);
    state.prevLiveMatchPos = model.liveChordPos;
  } else if (!liveMatchesSelected) {
    state.prevLiveMatchPos = null;
  }

  // Sector glow targets — active pitch class positions
  state.sectorGlowTarget.fill(0);
  for (const pc of model.activePitchClasses) {
    state.sectorGlowTarget[PC_TO_POS[pc]] = 1;
  }

  // Outer glow targets
  state.outerGlowTarget.fill(0);
  state.innerGlowTarget.fill(0);

  // Suggestions (lowest priority)
  for (const s of model.suggestions) {
    if (s.isMinor) {
      state.innerGlowTarget[s.pos] = Math.max(state.innerGlowTarget[s.pos], 0.28);
    } else {
      state.outerGlowTarget[s.pos] = Math.max(state.outerGlowTarget[s.pos], 0.28);
    }
  }

  // Selected suggestion
  if (model.selectedPos !== null) {
    if (model.selectedIsMinor) {
      state.innerGlowTarget[model.selectedPos] = Math.max(
        state.innerGlowTarget[model.selectedPos],
        0.85,
      );
    } else {
      state.outerGlowTarget[model.selectedPos] = Math.max(
        state.outerGlowTarget[model.selectedPos],
        0.85,
      );
    }
    state.selectedOpacityTarget = 1;
  } else {
    state.selectedOpacityTarget = 0;
  }

  // Key center
  if (model.keyCenterPos !== null) {
    state.outerGlowTarget[model.keyCenterPos] = Math.max(
      state.outerGlowTarget[model.keyCenterPos],
      0.6,
    );
  }

  // Harmonic anchor (highest priority for its type)
  if (model.anchorPos !== null) {
    if (model.anchorIsMinor) {
      state.innerGlowTarget[model.anchorPos] = 1;
    } else {
      state.outerGlowTarget[model.anchorPos] = 1;
    }
  }

  // Active MIDI notes always fully light up their outer ring position
  for (const pc of model.activePitchClasses) {
    state.outerGlowTarget[PC_TO_POS[pc]] = 1;
  }
}

export function updateParticles(state: AnimationState, dt: number): void {
  const alive: Particle[] = [];
  for (const p of state.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.94;
    p.vy *= 0.94;
    p.life -= p.decay * dt;
    if (p.life > 0) alive.push(p);
  }
  state.particles = alive;
}

export function updateGlows(state: AnimationState, dt: number): void {
  const t = clamp(dt * 9, 0, 1);
  const ts = clamp(dt * 7, 0, 1);
  for (let i = 0; i < 12; i++) {
    state.outerGlow[i] = lerp(state.outerGlow[i], state.outerGlowTarget[i], t);
    state.innerGlow[i] = lerp(state.innerGlow[i], state.innerGlowTarget[i], t);
    state.sectorGlow[i] = lerp(state.sectorGlow[i], state.sectorGlowTarget[i], ts);
  }
  state.selectedOpacity = lerp(state.selectedOpacity, state.selectedOpacityTarget, t);
}

export function updatePhases(state: AnimationState, dt: number): void {
  state.anchorPhase += dt * 1.4;
  state.keyCenterPhase += dt * 0.9;
  state.t += dt;
}
