/**
 * Analytics and experiment tracking client.
 * Tracks user behavior, feature adoption, and conversion metrics.
 */

export type AnalyticsEventType =
  | 'page_view'
  | 'auth_modal_opened'
  | 'auth_completed'
  | 'progression_created'
  | 'progression_saved'
  | 'progression_shared'
  | 'upgrade_intent'
  | 'upgrade_completed'
  | 'cms_section_viewed'
  | 'cms_cta_clicked'
  | 'sample_content_selected'
  | 'sample_progression_selected'
  | 'onboarding_persona_selected'
  | 'onboarding_persona_skipped'
  | 'export_requested'
  | 'lesson_flow';

export type AnalyticsEventProperties = Record<string, string | number | boolean | null | undefined>;

export type ExperimentVariant = 'control' | 'treatment_a' | 'treatment_b';

export interface AnalyticsEvent {
  eventType: AnalyticsEventType;
  properties?: AnalyticsEventProperties;
  timestamp?: number;
}

export interface ExperimentContext {
  experimentId: string;
  variant: ExperimentVariant;
  version: number;
}

class AnalyticsClient {
  private queue: AnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private experiments: Map<string, ExperimentContext> = new Map();
  private userId: string | null = null;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeFlushInterval();
    this.loadExperiments();
  }

  private generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadExperiments(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('analytics_experiments');
      if (stored) {
        const experiments = JSON.parse(stored) as Record<string, ExperimentContext>;
        Object.entries(experiments).forEach(([id, context]) => {
          this.experiments.set(id, context);
        });
      }
    } catch {
      // Silently ignore localStorage errors
    }
  }

  private saveExperiments(): void {
    if (typeof window === 'undefined') return;
    try {
      const experiments: Record<string, ExperimentContext> = {};
      this.experiments.forEach((context, id) => {
        experiments[id] = context;
      });
      localStorage.setItem('analytics_experiments', JSON.stringify(experiments));
    } catch {
      // Silently ignore localStorage errors
    }
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  enrollExperiment(experimentId: string, variant: ExperimentVariant, version: number): void {
    this.experiments.set(experimentId, { experimentId, variant, version });
    this.saveExperiments();
  }

  getExperimentVariant(experimentId: string): ExperimentVariant {
    return this.experiments.get(experimentId)?.variant ?? 'control';
  }

  track(eventType: AnalyticsEventType, properties?: AnalyticsEventProperties): void {
    const event: AnalyticsEvent = {
      eventType,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        ...(this.userId && { userId: this.userId }),
      },
      timestamp: Date.now(),
    };

    this.queue.push(event);

    // Flush if queue is getting large
    if (this.queue.length >= 10) {
      this.flush();
    }
  }

  private initializeFlushInterval(): void {
    if (typeof window === 'undefined') return;
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30000); // Flush every 30 seconds
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = this.queue.splice(0, this.queue.length);

    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });
    } catch {
      // Silently ignore analytics errors
      // Re-queue events if send failed, but cap queue size
      if (this.queue.length < 100) {
        this.queue.unshift(...events);
      }
    }
  }

  cleanup(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();
  }
}

let instance: AnalyticsClient | null = null;

export function getAnalytics(): AnalyticsClient {
  if (!instance) {
    instance = new AnalyticsClient();
  }
  return instance;
}

export function trackEvent(
  eventType: AnalyticsEventType,
  properties?: AnalyticsEventProperties,
): void {
  getAnalytics().track(eventType, properties);
}

export function enrollExperiment(
  experimentId: string,
  variant: ExperimentVariant,
  version: number,
): void {
  getAnalytics().enrollExperiment(experimentId, variant, version);
}

export function getExperimentVariant(experimentId: string): ExperimentVariant {
  return getAnalytics().getExperimentVariant(experimentId);
}
