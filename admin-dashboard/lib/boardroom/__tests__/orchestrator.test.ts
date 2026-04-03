/** @jest-environment node */

import { BoardroomError } from '../errors';
import { BoardroomOrchestrator } from '../orchestrator';
import type { BoardroomProvider, BoardroomProviderRequest } from '../provider';

type Role = 'CTO' | 'CMO';

class DeterministicProvider implements BoardroomProvider {
  public readonly requests: BoardroomProviderRequest[] = [];

  async generateJson(request: BoardroomProviderRequest): Promise<unknown> {
    this.requests.push(request);

    if (request.prompt.includes('You are the Chairman')) {
      return {
        decision: 'Proceed with a staged music creator experiment before full rollout',
        reasoning: 'This balances learning speed and financial downside for musicians.',
        keyTradeoffs: ['Execution speed vs confidence for music feature adoption'],
        risks: ['Short-term metric volatility'],
        actionPlan: [
          'Define music creator KPI targets',
          'Run pilot in one musician segment',
          'Review after 2 weeks',
        ],
        dissentingOpinions: ['CFO prefers smaller initial scope'],
      };
    }

    const role = this.extractRole(request.prompt);

    if (request.prompt.includes('phase 2 (critique)')) {
      return {
        missingPoints: [`${role} missing point`],
        disagreements: [`${role} disagreement`],
        weakAssumptions: [`${role} weak assumption`],
      };
    }

    if (request.prompt.includes('phase 3 (revision)')) {
      return {
        updatedRecommendation: `${role} updated recommendation`,
        updatedReasoning: `${role} updated reasoning`,
        changedBecause: [`${role} adjusted from critiques`],
      };
    }

    return {
      recommendation: `${role} recommendation`,
      reasoning: `${role} reasoning`,
      risks: [`${role} risk`],
      assumptions: [`${role} assumption`],
    };
  }

  private extractRole(prompt: string): Role {
    if (prompt.includes('Role: CTO')) {
      return 'CTO';
    }

    return 'CMO';
  }
}

class OffDomainChairmanProvider extends DeterministicProvider {
  async generateJson(request: BoardroomProviderRequest): Promise<unknown> {
    if (request.prompt.includes('You are the Chairman')) {
      return {
        decision: 'Launch subscription meal plans for fitness enthusiasts',
        reasoning: 'This market has strong retention and frequent repeat purchases.',
        keyTradeoffs: ['Fast growth vs domain mismatch risk'],
        risks: ['Team lacks nutrition expertise'],
        actionPlan: [
          'Hire nutrition advisors',
          'Create meal libraries',
          'Run influencer campaigns',
        ],
        dissentingOpinions: ['This is outside current product direction'],
      };
    }

    return super.generateJson(request);
  }
}

describe('BoardroomOrchestrator', () => {
  it('runs all phases and returns strict structured decision', async () => {
    const provider = new DeterministicProvider();
    const orchestrator = new BoardroomOrchestrator({
      provider,
      maxAgents: 2,
      maxRetries: 0,
      timeoutMsPerCall: 5000,
    });

    const result = await orchestrator.run({
      question: 'Should we prioritize retention campaigns over acquisition this quarter?',
      context: {
        productStage: 'GROWTH',
        goals: ['Increase net revenue retention'],
      },
    });

    expect(result.decision).toBe(
      'Proceed with a staged music creator experiment before full rollout',
    );
    expect(result.actionPlan.length).toBeGreaterThan(0);
    expect(result.debate?.independentSummaries.length).toBe(2);
    expect(result.debate?.critiqueSummaries.length).toBe(2);
    expect(result.debate?.revisionSummaries.length).toBe(2);

    const smallCalls = provider.requests.filter((req) => req.modelClass === 'SMALL');
    const largeCalls = provider.requests.filter((req) => req.modelClass === 'LARGE');
    expect(smallCalls.length).toBe(6);
    expect(largeCalls.length).toBe(1);
  });

  it('builds critique prompts from peers and excludes self independent response', async () => {
    const provider = new DeterministicProvider();
    const orchestrator = new BoardroomOrchestrator({
      provider,
      maxAgents: 2,
      maxRetries: 0,
      timeoutMsPerCall: 5000,
    });

    await orchestrator.run({
      question: 'Should we invest in partner-led growth?',
    });

    const ctoCritiquePrompt = provider.requests.find(
      (req) =>
        req.prompt.includes('phase 2 (critique)') &&
        req.prompt.includes('Role: CTO (Chief Technology Officer)'),
    )?.prompt;
    const cmoCritiquePrompt = provider.requests.find(
      (req) =>
        req.prompt.includes('phase 2 (critique)') &&
        req.prompt.includes('Role: CMO (Chief Marketing Officer)'),
    )?.prompt;

    expect(ctoCritiquePrompt).toContain('Recommendation: CMO recommendation');
    expect(ctoCritiquePrompt).not.toContain('Recommendation: CTO recommendation');

    expect(cmoCritiquePrompt).toContain('Recommendation: CTO recommendation');
    expect(cmoCritiquePrompt).not.toContain('Recommendation: CMO recommendation');
    expect(ctoCritiquePrompt).toContain('Current Product Surface (live plan-aware snapshot):');
    expect(cmoCritiquePrompt).toContain('Current Product Surface (live plan-aware snapshot):');
  });

  it('throws retries exhausted when provider keeps failing', async () => {
    const provider: BoardroomProvider = {
      generateJson: async () => {
        throw new Error('provider failure');
      },
    };

    const orchestrator = new BoardroomOrchestrator({
      provider,
      maxAgents: 1,
      maxRetries: 1,
      timeoutMsPerCall: 200,
    });

    await expect(
      orchestrator.run({
        question: 'Should we increase paid spend?',
      }),
    ).rejects.toMatchObject<Partial<BoardroomError>>({
      code: 'RETRIES_EXHAUSTED',
      status: 504,
    });
  });

  it('rejects off-domain final decisions that violate business-model guardrails', async () => {
    const provider = new OffDomainChairmanProvider();
    const orchestrator = new BoardroomOrchestrator({
      provider,
      maxAgents: 2,
      maxRetries: 0,
      timeoutMsPerCall: 5000,
    });

    await expect(
      orchestrator.run({
        question: 'How should we increase paid conversion this quarter?',
      }),
    ).rejects.toMatchObject<Partial<BoardroomError>>({
      code: 'MODEL_OUTPUT_INVALID',
      status: 502,
    });
  });

  it('includes product charter context in all prompt phases', async () => {
    const provider = new DeterministicProvider();
    const orchestrator = new BoardroomOrchestrator({
      provider,
      maxAgents: 1,
      maxRetries: 0,
      timeoutMsPerCall: 5000,
    });

    await orchestrator.run({
      question: 'Should we add melody generation to the product?',
    });

    // Check that all prompts include product charter information
    const allPrompts = provider.requests.map((r) => r.prompt);

    // Independent phase should have it
    expect(
      allPrompts.some(
        (p) => p.includes('phase 2 (critique)') === false && p.includes('Product Charter Summary:'),
      ),
    ).toBe(true);

    // Critique phase should have it
    expect(
      allPrompts.some(
        (p) => p.includes('phase 2 (critique)') && p.includes('Product Charter Summary:'),
      ),
    ).toBe(true);

    // Chairman phase should have it
    expect(
      allPrompts.some(
        (p) => p.includes('You are the Chairman') && p.includes('Product Charter Summary:'),
      ),
    ).toBe(true);

    // All should mention the primary jobs and non-goals
    allPrompts.forEach((p) => {
      expect(p).toContain('Primary Jobs to Be Done');
      expect(p).toContain('Strategic Non-Goals');
    });
  });
});
