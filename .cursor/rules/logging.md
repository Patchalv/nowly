# Logging and Error Handling Rules

## Mandatory Import Rules

### ✅ DO: Use Unified Logging System

```typescript
// Infrastructure and Application layers
import { logger, handleError } from '@/src/shared/logging';

// Presentation layer (for UI feedback)
import { showError, showSuccess } from '@/src/presentation/utils/error-display';
```

### ❌ DON'T: Import Directly from Sentry

```typescript
// ❌ NEVER do this in application code
import { logger } from '@sentry/nextjs';
import * as Sentry from '@sentry/nextjs';
const { logger } = Sentry;

// ❌ NEVER use old error handler
import { handleError } from '@/src/shared/errors/handler';
```

**Exception:** Only Sentry config files (`sentry.*.config.ts`, `instrumentation*.ts`) and the logging system itself (`src/shared/logging/`) may import from `@sentry/nextjs`.

---

## Layer-Specific Rules

### Server Actions (`app/actions/`)

**What to use:**

- ✅ `handleError.log()` - For errors that need to be returned to client
- ✅ `handleError.validation()` - For Zod validation failures
- ✅ `handleError.silent()` - For non-critical failures
- ✅ `logger.info()` - For successful operations (sparingly)
- ✅ `logger.error()` - For operation failures (when not using handleError)

**What NOT to use:**

- ❌ `showError()` - Client-side only (will error)
- ❌ `handleError.throw()` - Return structured results instead

**Pattern:**

```typescript
'use server';

import { logger, handleError } from '@/src/shared/logging';

export async function createTaskAction(formData: FormData) {
  // 1. Validate input - use handleError.validation()
  const result = createTaskSchema.safeParse(data);
  if (!result.success) {
    handleError.validation('Create task validation failed', result.error);
    return { success: false, errors: result.error.flatten().fieldErrors };
  }

  // 2. Check auth - use handleError.log()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    const error = handleError.log(authError);
    return { success: false, error: error.message };
  }

  // 3. Execute use case - use handleError.silent() for non-critical
  const response = await createTask(result.data, user.id, repository);
  if (!response.success) {
    const error = handleError.silent(response.error);
    return { success: false, error: error.message };
  }

  // 4. Log success
  logger.info('Task created successfully', { taskId: response.task.id });

  return { success: true, task: response.task };
}
```

---

### Use Cases (`src/application/`)

**What to use:**

- ✅ `logger.debug()` - For operation details
- ✅ `logger.info()` - For significant business events
- ✅ `logger.warn()` - For edge cases or fallback behavior
- ✅ `logger.error()` - In try-catch blocks
- ✅ Return error objects: `{ success: false, error: string }`

**What NOT to use:**

- ❌ `handleError.*` methods - Too much infrastructure coupling
- ❌ `showError()` - Wrong layer
- ❌ Throwing errors - Return error objects instead

**Pattern:**

```typescript
import { logger } from '@/src/shared/logging';

export async function createTask(
  input: CreateTaskInput,
  userId: string,
  repository: ITaskRepository
): Promise<MutateTaskResponse> {
  try {
    logger.debug('Creating task', { userId, title: input.title });

    const task = await repository.create({...});

    logger.info('Task created', { taskId: task.id, userId });
    return { success: true, task };
  } catch (error) {
    logger.error('Create task failed', { error, userId });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create task',
    };
  }
}
```

---

### Repositories (`src/infrastructure/repositories/`)

**What to use:**

- ✅ `handleError.throw()` - For database errors
- ✅ `logger.debug()` - For query details (sparingly)
- ✅ `logger.warn()` - For empty results or edge cases

**What NOT to use:**

- ❌ `handleError.log()` - Use throw() to propagate errors
- ❌ `handleError.silent()` - Use throw() to propagate errors
- ❌ `showError()` - Wrong layer

**Pattern:**

```typescript
import { logger, handleError } from '@/src/shared/logging';

export class SupabaseTaskRepository implements ITaskRepository {
  async create(
    task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Task> {
    logger.debug('Creating task in database', { userId: task.userId });

    const { data, error } = await this.client
      .from('tasks')
      .insert(this.toDatabase(task))
      .select()
      .single();

    if (error) {
      handleError.throw(error);
    }

    if (!data) {
      handleError.throw(new Error('No data returned after insert'));
    }

    return this.toDomain(data);
  }
}
```

---

### Client Components (`src/presentation/`)

**What to use:**

- ✅ `showError()` - For user-facing errors (toasts)
- ✅ `showSuccess()` - For success messages
- ✅ React Query `onError` callback for mutations
- ✅ `logger.debug()` - For UI interactions (sparingly - performance)

**What NOT to use:**

- ❌ `handleError.throw()` - Wrong layer
- ❌ `handleError.log()` - Use showError instead
- ❌ Excessive logging - Performance impact

**Pattern:**

```typescript
'use client';

import { showError, showSuccess } from '@/src/presentation/utils/error-display';

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTaskAction,
    onError: (error) => {
      showError(error, 'Failed to create task');
    },
    onSuccess: () => {
      showSuccess('Task created successfully!');
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
```

---

## Log Level Selection Guide

| Level   | Production Sampling | Use Cases                              |
| ------- | ------------------- | -------------------------------------- |
| `trace` | 5%                  | Function entry/exit (rare)             |
| `debug` | 10%                 | Development diagnostics, query details |
| `info`  | 20%                 | Business events, successful operations |
| `warn`  | 100%                | Recoverable errors, fallback behavior  |
| `error` | 100%                | Failures, caught exceptions            |
| `fatal` | 100%                | Critical system failures               |

**Examples:**

```typescript
// trace - Very detailed, rarely used
logger.trace('Entering function', { args });

// debug - Development diagnostics
logger.debug('Cache hit', { key, ttl });
logger.debug('Creating task in database', { userId });

// info - Business events
logger.info('Task created', { taskId, userId });
logger.info('User logged in', { userId });

// warn - Recoverable issues
logger.warn('Using fallback cache', { reason: 'Redis unavailable' });
logger.warn('Task generation failed', { recurringItemId });

// error - Failures
logger.error('Task creation failed', { error, userId });
logger.error('Database query failed', { query, error });

// fatal - Critical failures
logger.fatal('Database connection lost', { attempts: 3 });
```

---

## Context Object Structure

### ✅ DO: Include Relevant Context

```typescript
// Always include relevant IDs and context
logger.info('Task created', {
  taskId: task.id,
  userId: user.id,
  categoryId: task.categoryId,
  hasScheduledDate: !!task.scheduledDate,
});

// Include error details
logger.error('Operation failed', {
  error: error instanceof Error ? error.message : String(error),
  userId,
  operation: 'createTask',
});
```

### ❌ DON'T: Log Sensitive Data

```typescript
// ❌ NEVER log passwords, tokens, or sensitive data
logger.info('User authenticated', {
  password: user.password, // NEVER!
  token: session.token, // NEVER!
  creditCard: user.creditCard, // NEVER!
});

// ✅ Only log safe, relevant data
logger.info('User authenticated', {
  userId: user.id,
  loginMethod: 'email',
});
```

### Context Best Practices

- **Always** use camelCase for keys
- **Always** include relevant IDs (userId, taskId, etc.)
- **Never** include sensitive data (passwords, tokens, PII)
- **Never** log large data structures (summarize instead)
- **Keep** context focused and relevant to the operation

---

## Validation Errors

### ✅ DO: Use handleError.validation()

```typescript
// Validation errors are expected user behavior, not system failures
// Log at info level (not error) to reduce Sentry noise

const result = createTaskSchema.safeParse(data);
if (!result.success) {
  handleError.validation('Create task validation failed', result.error);
  return {
    success: false,
    errors: result.error.flatten().fieldErrors,
  };
}
```

### ❌ DON'T: Use logger.error() for Validation

```typescript
// ❌ BAD - Creates Sentry issues for expected user errors
if (!result.success) {
  logger.error('Validation failed', { error: result.error });
}
```

---

## Toast Guidelines

### ✅ DO: Use in Client Components Only

```typescript
'use client';

import { showError, showSuccess } from '@/src/presentation/utils/error-display';

// In React Query mutation
export function useCreateTask() {
  return useMutation({
    mutationFn: createTaskAction,
    onError: (error) => showError(error, 'Failed to create task'),
    onSuccess: () => showSuccess('Task created!'),
  });
}

// In component event handler
async function handleSubmit() {
  const result = await createTaskAction(formData);
  if (!result.success) {
    showError(result.error, 'Failed to create task');
  }
}
```

### ❌ DON'T: Use in Server Actions or Use Cases

```typescript
// ❌ NEVER do this - showError is client-side only
'use server';

export async function createTaskAction(formData: FormData) {
  if (error) {
    showError(error); // ERROR: Cannot use in server actions
  }
}
```

### Toast vs Inline Errors

**Use toasts for:**

- Operation feedback (success/error)
- Background operation results
- System notifications

**Use inline errors for:**

- Form field validation
- Input-specific errors
- Persistent error states

```typescript
// Toast for operation feedback
showError(error, 'Failed to save task');

// Inline for form validation
<FormField
  error={errors.title?.message}
  {...field}
/>
```

---

## Decision Flowchart

```
Need to do something?
│
├─ Show error to user? → showError() (client only)
│
├─ Server action error? → handleError.log()
│
├─ Repository error? → handleError.throw()
│
├─ Validation error? → handleError.validation()
│
├─ Non-critical error? → handleError.silent()
│
├─ Informational log? → logger.info()
│
└─ Debug log? → logger.debug()
```

---

## Common Mistakes and Corrections

### Mistake 1: Using showError in Server Actions

```typescript
// ❌ Wrong
'use server';
export async function serverAction() {
  showError(error); // Client-side only!
}

// ✅ Correct
('use server');
export async function serverAction() {
  const error = handleError.log(error);
  return { success: false, error: error.message };
}
```

### Mistake 2: Using handleError.throw in Client Components

```typescript
// ❌ Wrong
'use client';
export function Component() {
  const handleClick = () => {
    try {
      doSomething();
    } catch (error) {
      handleError.throw(error); // Wrong layer!
    }
  };
}

// ✅ Correct
('use client');
export function Component() {
  const handleClick = () => {
    try {
      doSomething();
    } catch (error) {
      showError(error, 'Operation failed');
    }
  };
}
```

### Mistake 3: Importing Logger Directly from Sentry

```typescript
// ❌ Wrong
import { logger } from '@sentry/nextjs';

// ✅ Correct
import { logger } from '@/src/shared/logging';
```

### Mistake 4: Logging Validation Errors at Error Level

```typescript
// ❌ Wrong - Creates Sentry noise
if (!result.success) {
  logger.error('Validation failed', { error: result.error });
}

// ✅ Correct - Info level, no Sentry issue
if (!result.success) {
  handleError.validation('Validation failed', result.error);
}
```

### Mistake 5: Missing Context Objects

```typescript
// ❌ Wrong - No context
logger.info('Task created');
logger.error('Failed');

// ✅ Correct - Include relevant context
logger.info('Task created', { taskId, userId });
logger.error('Operation failed', { error, userId, operation });
```

### Mistake 6: Including Sensitive Data

```typescript
// ❌ Wrong - Logging sensitive data
logger.info('User authenticated', {
  password: password, // NEVER!
  token: token, // NEVER!
});

// ✅ Correct - Only safe data
logger.info('User authenticated', {
  userId: user.id,
  loginMethod: 'email',
});
```

---

## Quick Reference Table

| Task                   | Method                     | Layer             | Import                                   |
| ---------------------- | -------------------------- | ----------------- | ---------------------------------------- |
| Return error to client | `handleError.log()`        | Server Actions    | `@/src/shared/logging`                   |
| Throw database error   | `handleError.throw()`      | Repositories      | `@/src/shared/logging`                   |
| Log non-critical error | `handleError.silent()`     | Any               | `@/src/shared/logging`                   |
| Log validation error   | `handleError.validation()` | Server Actions    | `@/src/shared/logging`                   |
| Show error to user     | `showError()`              | Client Components | `@/src/presentation/utils/error-display` |
| Show success message   | `showSuccess()`            | Client Components | `@/src/presentation/utils/error-display` |
| Log information        | `logger.info()`            | Any               | `@/src/shared/logging`                   |
| Log debug info         | `logger.debug()`           | Any               | `@/src/shared/logging`                   |
| Log warning            | `logger.warn()`            | Any               | `@/src/shared/logging`                   |
| Log error              | `logger.error()`           | Any               | `@/src/shared/logging`                   |

---

## Anti-Patterns (Never Do This)

1. ❌ Using `showError()` in server actions
2. ❌ Using `handleError.throw()` in client components
3. ❌ Importing `logger` directly from `@sentry/nextjs`
4. ❌ Logging validation errors at error level
5. ❌ Missing context objects in logs
6. ❌ Including sensitive data (passwords, tokens) in logs
7. ❌ Using `handleError.log()` in repositories (use throw)
8. ❌ Using `handleError` methods in use cases (use logger only)
9. ❌ Excessive logging in client components (performance)
10. ❌ Not validating inputs in server actions

---

## Additional Resources

- **Complete Guide:** [docs/LOGGING_AND_ERROR_HANDLING.md](../../docs/LOGGING_AND_ERROR_HANDLING.md)
- **Code Examples:** [docs/examples/logging-examples.ts](../../docs/examples/logging-examples.ts)
- **Architecture Rules:** [.cursor/rules/architecture.md](architecture.md)
- **Sentry Configuration:** [.cursor/rules/sentry.md](sentry.md)

---

## Summary for AI Agents

When implementing logging or error handling:

1. **Always import from unified system** - `@/src/shared/logging` or `@/src/presentation/utils/error-display`
2. **Use layer-appropriate methods** - Server actions: log(), Repositories: throw(), UI: showError()
3. **Always include context objects** - Include relevant IDs and data
4. **Never log sensitive data** - No passwords, tokens, or PII
5. **Use handleError.validation() for validation errors** - Reduces Sentry noise
6. **Keep UI feedback in presentation layer** - showError() is client-only
7. **Return structured results from server actions** - `{ success: boolean, error?: string }`
8. **Throw errors from repositories** - Let use cases handle them
9. **Log business events at info level** - Helps with observability
10. **Follow the decision flowchart** - When unsure, refer to flowchart above
