// Next.js reserved filename: this hook must be named instrumentation.ts.
import { registerSentryRuntime } from './sentry';

export async function register() {
  await registerSentryRuntime();
}
