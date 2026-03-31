export type ClientAnalyticsEvent = {
  name: string;
  properties?: Record<string, unknown>;
};

type GtagFn = (command: 'event', eventName: string, params?: Record<string, unknown>) => void;

type PostHogClient = {
  capture?: (eventName: string, properties?: Record<string, unknown>) => void;
};

type AnalyticsWindow = Window & {
  gtag?: GtagFn;
  dataLayer?: Array<Record<string, unknown>>;
  posthog?: PostHogClient;
};

export function trackClientAnalyticsEvent({ name, properties }: ClientAnalyticsEvent): void {
  if (typeof window === 'undefined') {
    return;
  }

  const analyticsWindow = window as AnalyticsWindow;

  window.dispatchEvent(
    new CustomEvent('plai:vocal-event', {
      detail: {
        name,
        properties,
      },
    }),
  );

  if (typeof analyticsWindow.gtag === 'function') {
    analyticsWindow.gtag('event', name, properties);
  }

  if (Array.isArray(analyticsWindow.dataLayer)) {
    analyticsWindow.dataLayer.push({
      event: name,
      ...properties,
    });
  }

  analyticsWindow.posthog?.capture?.(name, properties);
}
