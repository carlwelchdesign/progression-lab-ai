export type BoardroomProductStage = 'IDEA' | 'MVP' | 'EARLY_TRACTION' | 'GROWTH' | 'SCALE';

export type BoardroomRiskTolerance = 'LOW' | 'MEDIUM' | 'HIGH';

export type BoardroomModelClass = 'SMALL' | 'LARGE';

export type BoardroomBoardMemberInput = {
  id?: string;
  personaLabel: string;
  title: string;
  priorities?: string[];
  biases?: string[];
  modelClass?: BoardroomModelClass;
  maxOutputChars?: number;
  displayOrder?: number;
  suggestionKey?: string | null;
  isActive?: boolean;
};

export type BoardroomBoardMemberDefinition = {
  id?: string;
  personaLabel: string;
  title: string;
  priorities: string[];
  biases: string[];
  modelClass: BoardroomModelClass;
  maxOutputChars: number;
  displayOrder: number;
  suggestionKey?: string | null;
  isActive: boolean;
};

export type BoardroomBoardDefinition = {
  id?: string;
  name: string;
  description?: string | null;
  isDefault?: boolean;
  members: BoardroomBoardMemberDefinition[];
};

export type BoardroomPersonaSuggestion = {
  key: string;
  label: string;
  group: string;
  title: string;
  priorities: string[];
  biases: string[];
  modelClass: BoardroomModelClass;
};

export type BoardroomContext = {
  productStage?: BoardroomProductStage;
  goals?: string[];
  constraints?: string[];
  budget?: string;
  timeframe?: string;
  riskTolerance?: BoardroomRiskTolerance;
  extraNotes?: string;
};

export type BoardroomRunRequest = {
  question: string;
  context?: BoardroomContext;
  boardId?: string;
  boardName?: string;
  boardMembers?: BoardroomBoardMemberDefinition[];
};

export type BoardroomFeatureAvailability = {
  isAvailableToAll: boolean;
  availablePlans: string[];
  unavailablePlans: string[];
};

export type BoardroomFeatureCatalog = {
  generatedAtIso: string;
  plansConsidered: string[];
  capabilities: {
    canExportMidi: BoardroomFeatureAvailability;
    canExportPdf: BoardroomFeatureAvailability;
    canSharePublicly: BoardroomFeatureAvailability;
    canUseVocalTrackRecording: BoardroomFeatureAvailability;
    canUseAdvancedVoicingControls: BoardroomFeatureAvailability;
  };
};

export type BoardroomIndependentResponse = {
  recommendation: string;
  reasoning: string;
  risks: string[];
  assumptions: string[];
};

export type BoardroomCritiqueResponse = {
  missingPoints: string[];
  disagreements: string[];
  weakAssumptions: string[];
};

export type BoardroomRevisionResponse = {
  updatedRecommendation: string;
  updatedReasoning: string;
  changedBecause: string[];
};

export type BoardroomSpecialistRoundBundle = {
  memberLabel: string;
  independent: BoardroomIndependentResponse;
  critique: BoardroomCritiqueResponse;
  revision: BoardroomRevisionResponse;
};

export type BoardroomDecision = {
  decision: string;
  reasoning: string;
  keyTradeoffs: string[];
  risks: string[];
  actionPlan: string[];
  dissentingOpinions: string[];
};

export type BoardroomRunResult = BoardroomDecision;

export type BoardroomPhaseSummary = {
  memberLabel: string;
  summary: string;
  keyRisks: string[];
  topTradeoffs: string[];
};

export type BoardroomDebateMetadata = {
  independentSummaries: BoardroomPhaseSummary[];
  critiqueSummaries: BoardroomPhaseSummary[];
  revisionSummaries: BoardroomPhaseSummary[];
};

export type BoardroomRunResponse = BoardroomDecision & {
  debate?: BoardroomDebateMetadata;
};
