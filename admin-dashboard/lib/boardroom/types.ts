export type BoardroomProductStage = 'IDEA' | 'MVP' | 'EARLY_TRACTION' | 'GROWTH' | 'SCALE';

export type BoardroomRiskTolerance = 'LOW' | 'MEDIUM' | 'HIGH';

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
    canUseAdvancedVoicingControls: BoardroomFeatureAvailability;
  };
};

export type BoardroomSpecialistRole = 'CTO' | 'CMO' | 'CFO' | 'INVESTOR' | 'OPERATOR';

export type BoardroomAgentRole = BoardroomSpecialistRole | 'CHAIRMAN';

export type BoardroomModelClass = 'SMALL' | 'LARGE';

export type BoardroomAgentDefinition = {
  role: BoardroomSpecialistRole;
  title: string;
  priorities: string[];
  biases: string[];
  modelClass: BoardroomModelClass;
  maxOutputChars: number;
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
  role: BoardroomSpecialistRole;
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
  role: BoardroomSpecialistRole;
  summary: string;
  keyRisks: string[];
  topTradeoffs: string[];
};

export type BoardroomDebateMetadata = {
  independentSummaries: BoardroomPhaseSummary[];
  critiqueSummaries: BoardroomPhaseSummary[];
  revisionSummaries: BoardroomPhaseSummary[];
};

export interface BoardroomProductCharter {
  productName: string;
  productVision: string;
  corePurpose: string;
  jobsToBeDone: Array<{
    job: string;
    priority: 'primary' | 'secondary' | 'tertiary';
    context: string;
  }>;
  targetPersonas: Array<{
    persona: string;
    priority: 'primary' | 'secondary';
    painPoint: string;
    expectedUsagePattern: string;
  }>;
  primaryUseCases: string[];
  nonGoals: Array<{
    category: string;
    explanation: string;
    examples: string[];
  }>;
  positioningInsights: string[];
  strategicConstraints: string[];
}

export type BoardroomRunResponse = BoardroomDecision & {
  debate?: BoardroomDebateMetadata;
};
