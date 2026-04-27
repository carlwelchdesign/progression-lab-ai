export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0–1, decreasing
  decay: number; // life units lost per second
  r: number;
  color: string;
};

export type AnimationState = {
  outerGlow: Float32Array; // [12] current brightness per circle position
  outerGlowTarget: Float32Array; // [12] target brightness
  innerGlow: Float32Array; // [12] minor ring
  innerGlowTarget: Float32Array;
  sectorGlow: Float32Array; // [12] active-note sector fills
  sectorGlowTarget: Float32Array;
  selectedOpacity: number;
  selectedOpacityTarget: number;
  anchorPhase: number; // oscillates for pulse animation
  keyCenterPhase: number;
  particles: Particle[];
  prevActivePCs: Set<number>;
  prevAnchorPos: number | null;
  prevSelectedPos: number | null;
  prevLiveMatchPos: number | null;
  t: number; // elapsed seconds
};

export type VisualizationModel = {
  activePitchClasses: number[];
  anchorPos: number | null;
  anchorIsMinor: boolean;
  keyCenterPos: number | null;
  selectedPos: number | null;
  selectedIsMinor: boolean;
  selectedCategory: string | null;
  suggestions: Array<{ pos: number; isMinor: boolean; category: string }>;
  liveChordPos: number | null;
  liveChordIsMinor: boolean;
};
