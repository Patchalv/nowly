These examples should be used as guidance when configuring Sentry functionality within a project.

# Exception Catching

Use `Sentry.captureException(error)` to capture an exception and log the error in Sentry.
Use this in try catch blocks or areas where exceptions are expected

# Tracing Examples

Spans should be created for meaningful actions within an applications like button clicks, API calls, and function calls
Use the `Sentry.startSpan` function to create a span
Child spans can exist within a parent span

## Custom Span instrumentation in component actions

The `name` and `op` properties should be meaninful for the activities in the call.
Attach attributes based on relevant information and metrics from the request

```javascript
function TestComponent() {
  const handleTestButtonClick = () => {
    // Create a transaction/span to measure performance
    Sentry.startSpan(
      {
        op: 'ui.click',
        name: 'Test Button Click',
      },
      (span) => {
        const value = 'some config';
        const metric = 'some metric';

        // Metrics can be added to the span
        span.setAttribute('config', value);
        span.setAttribute('metric', metric);

        doSomething();
      }
    );
  };

  return (
    <button type="button" onClick={handleTestButtonClick}>
      Test Sentry
    </button>
  );
}
```

## Custom span instrumentation in API calls

The `name` and `op` properties should be meaninful for the activities in the call.
Attach attributes based on relevant information and metrics from the request

```javascript
async function fetchUserData(userId) {
  return Sentry.startSpan(
    {
      op: 'http.client',
      name: `GET /api/users/${userId}`,
    },
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      return data;
    }
  );
}
```

# Logs

## ⚠️ DEPRECATED: Direct Sentry Logger Import

**DO NOT** import logger directly from Sentry in application code:

```javascript
// ❌ DEPRECATED - Do not use
import { logger } from '@sentry/nextjs';
import * as Sentry from '@sentry/nextjs';
const { logger } = Sentry;
```

**Instead**, use the unified logging system:

```javascript
// ✅ USE THIS - Unified logging system
import { logger, handleError } from '@/src/shared/logging';
```

See [.cursor/rules/logging.md](.cursor/rules/logging.md) and [docs/LOGGING_AND_ERROR_HANDLING.md](../../docs/LOGGING_AND_ERROR_HANDLING.md) for complete guide.

## Configuration

Sentry is already configured with smart log sampling in:

- `instrumentation-client.ts` (client-side)
- `sentry.server.config.ts` (server-side)
- `sentry.edge.config.ts` (edge runtime)

**Logging is enabled with:**

- `enableLogs: true`
- `beforeSendLog` hook for smart sampling (production only)
- Sampling rates: trace 5%, debug 10%, info 20%, warn/error/fatal 100%

**You should NOT modify these files** unless updating Sentry configuration itself.

### Baseline Configuration (Reference Only)

```javascript
import * as Sentry from '@sentry/nextjs';
import { env, isProduction } from './src/config/env';

Sentry.init({
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: isProduction ? 0.1 : 1,
  enableLogs: true,

  // Smart log sampling in production
  beforeSendLog: (logEvent) => {
    if (!isProduction) return logEvent;

    const samplingRates = {
      trace: 0.05,
      debug: 0.1,
      info: 0.2,
      warn: 1.0,
      error: 1.0,
      fatal: 1.0,
    };

    const rate = samplingRates[logEvent.level] || 1.0;
    return Math.random() < rate ? logEvent : null;
  },

  sendDefaultPii: !isProduction,
  environment: env.VERCEL_ENV,
});
```

## Logging in Application Code

**Use the unified logging system** instead of direct Sentry logger:

```typescript
// Import from unified system
import { logger, handleError } from '@/src/shared/logging';

// Structured logging with context objects
logger.info('Task created', { taskId: task.id, userId: user.id });
logger.error('Operation failed', { error: error.message, userId });

// Error handling by layer
// Server actions: handleError.log()
// Repositories: handleError.throw()
// Validation: handleError.validation()
```

**Benefits of unified system:**

- Clean architecture boundaries
- Layer-appropriate error handling
- Consistent structured logging
- Development prefixes ([ERROR], [WARN])
- Single import location

See [.cursor/rules/logging.md](.cursor/rules/logging.md) for complete usage guide.
