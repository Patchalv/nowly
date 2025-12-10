// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';
import { env, isProduction } from './src/config/env';

Sentry.init({
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: isProduction ? 0.1 : 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Smart log sampling in production to reduce volume and costs
  // Development: Keep all logs for debugging
  // Production: Sample by level (trace: 5%, debug: 10%, info: 20%, warn/error/fatal: 100%)
  beforeSendLog: (logEvent) => {
    // Keep all logs in development
    if (!isProduction) return logEvent;

    // Sample based on log level in production
    const level = logEvent.level;
    const samplingRates: Record<string, number> = {
      trace: 0.05, // 5% - very detailed, rarely needed
      debug: 0.1, // 10% - development diagnostics
      info: 0.2, // 20% - business events
      warn: 1.0, // 100% - always keep warnings
      error: 1.0, // 100% - always keep errors
      fatal: 1.0, // 100% - always keep critical errors
    };

    const rate = samplingRates[level] || 1.0;
    return Math.random() < rate ? logEvent : null;
  },

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: !isProduction,
  environment: env.VERCEL_ENV,
});
