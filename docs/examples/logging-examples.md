# Logging and Error Handling Examples

This file contains real-world examples of how to use the unified logging and error handling system across different layers of the application.

See [docs/LOGGING_AND_ERROR_HANDLING.md](../LOGGING_AND_ERROR_HANDLING.md) for the complete guide.

---

## Imports

```typescript
// Infrastructure and Application layers
import { logger, handleError } from '@/src/shared/logging';

// Presentation layer only (client-side)
import {
  showError,
  showSuccess,
  showInfo,
  showWarning,
} from '@/src/presentation/utils/error-display';
```

---

## Server Actions Examples

### Example 1: Full Error Handling

```typescript
'use server';

import { logger, handleError } from '@/src/shared/logging';
import { createClient } from '@/src/infrastructure/supabase/server';
import { createTaskSchema } from '@/src/domain/validation/task/task.schema';
import { createTask } from '@/src/application/tasks/createTask.usecase';

export async function createTaskAction(formData: FormData) {
  const supabase = await createClient();

  // 1. Validate input with handleError.validation()
  const result = createTaskSchema.safeParse({
    title: formData.get('title'),
    scheduledDate: formData.get('scheduledDate'),
  });

  if (!result.success) {
    // Logs at info level (not error) to reduce Sentry noise
    handleError.validation('Create task validation failed', result.error);
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  // 2. Check authentication with handleError.log()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    // Log and return error to client
    const error = handleError.log(authError);
    return { success: false, error: error.message };
  }

  // 3. Execute use case with handleError.silent() for non-critical errors
  const repository = new SupabaseTaskRepository(supabase);
  const response = await createTask(result.data, user.id, repository);

  if (!response.success) {
    // Silent logging for non-critical failures
    const error = handleError.silent(response.error);
    return { success: false, error: error.message };
  }

  // 4. Log success with structured context
  logger.info('Task created successfully', {
    taskId: response.task.id,
    userId: user.id,
    hasScheduledDate: !!result.data.scheduledDate,
  });

  revalidatePath('/tasks');
  return { success: true, task: response.task };
}
```

### Example 2: With Optional Background Task

```typescript
'use server';

import { logger, handleError } from '@/src/shared/logging';

export async function getTasksByWeekAction(date: Date) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Try to generate recurring tasks (non-critical)
  const generationResult = await ensureTasksGenerated(
    user.id,
    recurringRepository,
    taskRepository
  );

  if (!generationResult.success) {
    // Log at warning level - operation failed but we can continue
    handleError.silent(generationResult.error);
    logger.warn('Task generation failed, continuing anyway', {
      userId: user.id,
      generatedCount: 0,
    });
  } else {
    logger.info('Tasks generated successfully', {
      count: generationResult.generatedTasks.length,
    });
  }

  // Continue with main operation regardless
  const tasks = await listTasksByWeek(user.id, date, taskRepository);
  return tasks;
}
```

---

## Use Case Examples

### Example 3: With Detailed Logging

```typescript
import { logger } from '@/src/shared/logging';

export async function createTask(
  input: CreateTaskInput,
  userId: string,
  repository: ITaskRepository
): Promise<MutateTaskResponse> {
  try {
    // Debug log with operation details
    logger.debug('Creating task', {
      userId,
      title: input.title,
      hasScheduledDate: !!input.scheduledDate,
    });

    // Generate position
    const position = await generatePositionForNewTask(
      userId,
      input.scheduledDate ?? null,
      repository
    );

    logger.debug('Position generated', { position, userId });

    // Create task
    const task = await repository.create({
      title: input.title,
      userId,
      scheduledDate: input.scheduledDate ?? null,
      // ...other fields
      position,
    });

    // Info log for business event
    logger.info('Task created', {
      taskId: task.id,
      userId,
      position: task.position,
    });

    return { success: true, task };
  } catch (error) {
    // Error log with context
    logger.error('Create task failed', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      input: { title: input.title }, // Don't log full input (may contain sensitive data)
    });

    // Return error object (don't throw)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create task',
    };
  }
}
```

### Example 4: With Edge Case Handling

```typescript
import { logger } from '@/src/shared/logging';

export async function listTasksByDate(
  userId: string,
  date: Date,
  repository: ITaskRepository
): Promise<ListTasksResponse> {
  try {
    logger.debug('Listing tasks by date', {
      userId,
      date: date.toISOString(),
    });

    const tasks = await repository.findByUserIdAndDate(userId, date);

    if (tasks.length === 0) {
      // Warn for empty results (might indicate an issue)
      logger.warn('No tasks found for date', {
        userId,
        date: date.toISOString(),
      });
    } else {
      logger.info('Tasks retrieved', {
        userId,
        count: tasks.length,
        date: date.toISOString(),
      });
    }

    return { success: true, tasks };
  } catch (error) {
    logger.error('List tasks failed', { error, userId, date });
    return {
      success: false,
      tasks: [],
      error: error instanceof Error ? error.message : 'Failed to list tasks',
    };
  }
}
```

---

## Repository Examples

### Example 5: Database Operations

```typescript
import { logger, handleError } from '@/src/shared/logging';

export class SupabaseTaskRepository implements ITaskRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async create(
    task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Task> {
    // Debug log for operation details
    logger.debug('Creating task in database', {
      userId: task.userId,
      title: task.title,
      hasScheduledDate: !!task.scheduledDate,
    });

    const { data, error } = await this.client
      .from('tasks')
      .insert(this.toDatabase(task))
      .select()
      .single();

    if (error) {
      // Log additional context before throwing
      logger.error('Database insert failed', {
        error: error.message,
        code: error.code,
        table: 'tasks',
        userId: task.userId,
      });
      // Throw to propagate to use case layer
      handleError.throw(error);
    }

    if (!data) {
      handleError.throw(new Error('No data returned after insert'));
    }

    logger.debug('Task created in database', {
      taskId: data.id,
      userId: task.userId,
    });

    return this.toDomain(data);
  }

  async findById(id: string): Promise<Task | null> {
    logger.debug('Finding task by ID', { taskId: id });

    const { data, error } = await this.client
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found - return null (expected behavior)
        logger.debug('Task not found', { taskId: id });
        return null;
      }
      // Other errors - throw
      handleError.throw(error);
    }

    logger.debug('Task found', { taskId: id });
    return this.toDomain(data);
  }

  async findByUserId(userId: string): Promise<Task[]> {
    logger.debug('Finding tasks by user', { userId });

    const { data, error } = await this.client
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Database query failed', {
        error: error.message,
        query: 'findByUserId',
        userId,
      });
      handleError.throw(error);
    }

    if (!data || data.length === 0) {
      logger.warn('No tasks found for user', { userId });
      return [];
    }

    logger.debug('Tasks retrieved', { userId, count: data.length });
    return data.map((row) => this.toDomain(row));
  }

  async delete(id: string): Promise<void> {
    logger.debug('Deleting task', { taskId: id });

    const { error } = await this.client.from('tasks').delete().eq('id', id);

    if (error) {
      logger.error('Database delete failed', {
        error: error.message,
        taskId: id,
      });
      handleError.throw(error);
    }

    logger.info('Task deleted', { taskId: id });
  }
}
```

---

## Client Component Examples

### Example 6: React Query Mutation

```typescript
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showError, showSuccess } from '@/src/presentation/utils/error-display';
import { createTaskAction } from '@/app/actions/tasks/createTaskAction';

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const formData = new FormData();
      Object.entries(input).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, String(value));
        }
      });

      return createTaskAction(formData);
    },

    // Handle errors with toast
    onError: (error) => {
      showError(error, 'Failed to create task. Please try again.');
    },

    // Handle success
    onSuccess: (response) => {
      if (response.success) {
        showSuccess('Task created successfully!');
        queryClient.invalidateQueries({ queryKey: taskKeys.all });
      } else {
        // Server action returned error
        showError(response.error, 'Failed to create task');
      }
    },
  });
}
```

### Example 7: Component with Multiple Operations

```typescript
'use client';

import { showError, showSuccess } from '@/src/presentation/utils/error-display';

export function TaskActions({ task }: { task: Task }) {
  const deleteTask = useDeleteTask();
  const toggleComplete = useToggleTaskCompleted();

  const handleDelete = () => {
    deleteTask.mutate(task.id, {
      onSuccess: () => showSuccess('Task deleted'),
      onError: (error) => showError(error, 'Failed to delete task'),
    });
  };

  const handleToggle = () => {
    toggleComplete.mutate(
      { taskId: task.id, completed: !task.completed },
      {
        onSuccess: () => {
          const message = task.completed
            ? 'Task marked incomplete'
            : 'Task completed!';
          showSuccess(message);
        },
        onError: (error) => showError(error, 'Failed to update task'),
      }
    );
  };

  return (
    <>
      <button onClick={handleToggle}>Toggle Complete</button>
      <button onClick={handleDelete}>Delete</button>
    </>
  );
}
```

### Example 8: Component with Info/Warning Toasts

```typescript
'use client';

import {
  showError,
  showSuccess,
  showInfo,
  showWarning,
} from '@/src/presentation/utils/error-display';

export function TaskSync() {
  const syncTasks = useSyncTasks();

  const handleSync = async () => {
    try {
      const result = await syncTasks.mutateAsync();

      if (result.syncedCount === 0) {
        showInfo('All tasks are up to date');
      } else if (result.failedCount > 0) {
        showWarning(
          `${result.syncedCount} tasks synced, ${result.failedCount} failed`
        );
      } else {
        showSuccess(`${result.syncedCount} tasks synced`);
      }
    } catch (error) {
      showError(error, 'Failed to sync tasks');
    }
  };

  return <button onClick={handleSync}>Sync Tasks</button>;
}
```

---

## Advanced Patterns

### Example 9: Batch Operations

```typescript
'use server';

import { logger } from '@/src/shared/logging';

export async function batchUpdateTasks(
  updates: Array<{ taskId: string; updates: Partial<Task> }>
) {
  logger.info('Starting batch update', {
    count: updates.length,
    taskIds: updates.map((u) => u.taskId),
  });

  const results = await Promise.allSettled(
    updates.map(({ taskId, updates: taskUpdates }) =>
      updateTask(taskId, taskUpdates)
    )
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  if (failed > 0) {
    logger.warn('Batch update partially failed', {
      succeeded,
      failed,
      total: updates.length,
    });
  } else {
    logger.info('Batch update completed', {
      succeeded,
      total: updates.length,
    });
  }

  return { succeeded, failed, total: updates.length };
}
```

### Example 10: Retry Logic

```typescript
import { logger } from '@/src/shared/logging';

export async function operationWithRetry(taskId: string) {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      logger.debug('Attempting operation', { taskId, attempt: attempt + 1 });

      const result = await riskyOperation(taskId);

      logger.info('Operation succeeded', { taskId, attempts: attempt + 1 });
      return result;
    } catch (error) {
      attempt++;

      if (attempt >= maxRetries) {
        logger.error('Operation failed after retries', {
          taskId,
          attempts: maxRetries,
          error,
        });
        throw error;
      }

      logger.warn('Operation failed, retrying', {
        taskId,
        attempt,
        maxRetries,
        error,
      });

      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
}
```

---

## Anti-Patterns (DO NOT USE)

### ❌ Using showError in Server Action

```typescript
// ❌ BAD: showError is client-side only
'use server';

export async function serverAction() {
  try {
    // ... operation ...
  } catch (error) {
    showError(error); // ERROR: This will fail!
  }
}

// ✅ GOOD: Use handleError.log instead
('use server');

export async function serverAction() {
  try {
    // ... operation ...
  } catch (error) {
    const appError = handleError.log(error);
    return { success: false, error: appError.message };
  }
}
```

### ❌ Using handleError.throw in Client Component

```typescript
// ❌ BAD: Don't throw in UI layer
'use client';

export function Component() {
  const handleClick = async () => {
    try {
      await someOperation();
    } catch (error) {
      handleError.throw(error); // Wrong layer!
    }
  };
}

// ✅ GOOD: Use showError instead
('use client');

export function Component() {
  const handleClick = async () => {
    try {
      await someOperation();
    } catch (error) {
      showError(error, 'Operation failed');
    }
  };
}
```

### ❌ Missing Context Objects

```typescript
// ❌ BAD: No context
logger.info('Task created');
logger.error('Failed');

// ✅ GOOD: Include relevant context
logger.info('Task created', {
  taskId: task.id,
  userId: task.userId,
});
logger.error('Operation failed', {
  error: error.message,
  userId,
  operation: 'createTask',
});
```

### ❌ Logging Sensitive Data

```typescript
// ❌ BAD: Logging passwords and tokens
logger.info('User authenticated', {
  email: user.email,
  password: password, // NEVER!
  sessionToken: user.token, // NEVER!
});

// ✅ GOOD: Only log safe data
logger.info('User authenticated', {
  userId: user.id,
  loginMethod: 'email',
});
```

### ❌ Using Wrong Error Handler Method

```typescript
// ❌ BAD: Using log() instead of throw() in repository
export class BadRepository {
  async create(task: Task): Promise<Task> {
    const { data, error } = await this.client.from('tasks').insert(task);

    if (error) {
      handleError.log(error); // Wrong! Should throw
      return null;
    }
  }
}

// ✅ GOOD: Use throw() to propagate error
export class GoodRepository {
  async create(task: Task): Promise<Task> {
    const { data, error } = await this.client.from('tasks').insert(task);

    if (error) {
      handleError.throw(error); // Correct!
    }

    return this.toDomain(data);
  }
}
```

### ❌ Direct Sentry Import

```typescript
// ❌ BAD: Importing directly from Sentry
import { logger } from '@sentry/nextjs';

export function badFunction() {
  logger.error('Error occurred');
}

// ✅ GOOD: Use unified system
import { logger } from '@/src/shared/logging';

export function goodFunction() {
  logger.error('Error occurred', { context: 'value' });
}
```

---

## Summary

**Key Patterns by Layer:**

| Layer             | Logging                 | Error Handling                  |
| ----------------- | ----------------------- | ------------------------------- |
| Server Actions    | `logger.*`              | `handleError.log()`             |
| Use Cases         | `logger.*`              | Return error objects            |
| Repositories      | `logger.debug()` (rare) | `handleError.throw()`           |
| Client Components | `logger.*` (sparingly)  | `showError()` / `showSuccess()` |

**Import Locations:**

- Infrastructure/Application: `import { logger, handleError } from '@/src/shared/logging'`
- Presentation (UI feedback): `import { showError, showSuccess } from '@/src/presentation/utils/error-display'`

For complete documentation, see [LOGGING_AND_ERROR_HANDLING.md](../LOGGING_AND_ERROR_HANDLING.md).
