# Phase 6: Recurring Tasks - Implementation Plan

## Executive Summary

This document outlines the complete implementation strategy for Phase 6: Recurring Tasks in Nowly. Based on research into best practices, the PRD requirements, and your existing Clean Architecture, this plan recommends a **hybrid generation strategy** combining lazy generation for the MVP with optional background generation for production scale.

**Estimated Effort:** 3-4 weeks (15-20 hours at 5-10 hrs/week)

---

## 1. Architecture Decision: Generation Strategy

### Recommended Approach: Hybrid Lazy + Background Generation

After researching common patterns (Microsoft Planner, Asana, ClickUp), the PRD's approach aligns with industry best practices:

| Strategy                               | Description                                           | Use When                                        |
| -------------------------------------- | ----------------------------------------------------- | ----------------------------------------------- |
| **Lazy Generation (MVP)**              | Generate tasks on-demand when user views a date range | Initial implementation, small user base         |
| **Background Generation (Production)** | Daily cron job pre-generates tasks ahead              | Scale, multiple users, performance optimization |

**Why Hybrid?**

- Lazy generation is simpler to implement and test
- Background generation prevents UI delays for heavy users
- Both can coexist: lazy fills gaps, background pre-populates

### Key Design Principles

1. **Materialized Instances**: Each recurring task creates actual `tasks` rows (not virtual/computed)
2. **Completion-Based Next Generation**: When a task is completed, trigger generation of subsequent tasks
3. **Finite Generation Window**: Generate limited tasks ahead (configurable per frequency)
4. **rrule for Pattern Storage**: Store iCal-compatible RRULE strings for flexibility

---

## 2. Database Schema

### 2.1 New Table: `recurring_task_items`

```sql
-- Migration: 007_recurring_task_items.sql

-- Create frequency enum
CREATE TYPE recurring_frequency AS ENUM (
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'weekdays',
  'weekends'
);

-- Create recurring_task_items table
CREATE TABLE recurring_task_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Task template fields (copied to generated tasks)
  title TEXT NOT NULL CHECK (char_length(title) > 0),
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  priority task_priority DEFAULT 'medium',
  daily_section daily_section,
  bonus_section bonus_section,

  -- Recurrence configuration
  frequency recurring_frequency NOT NULL,
  rrule_string TEXT NOT NULL,  -- iCal RRULE format

  -- Schedule boundaries
  start_date DATE NOT NULL,
  end_date DATE,  -- NULL = indefinite
  due_offset_days INTEGER DEFAULT 0,  -- Days after scheduled_date for due_date

  -- Generation tracking
  last_generated_date DATE,  -- Last date we generated tasks up to
  tasks_to_generate_ahead INTEGER DEFAULT 15,  -- Max tasks to generate ahead

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_recurring_items_user_id ON recurring_task_items(user_id);
CREATE INDEX idx_recurring_items_user_active ON recurring_task_items(user_id, is_active);
CREATE INDEX idx_recurring_items_generation ON recurring_task_items(user_id, last_generated_date)
  WHERE is_active = true;

-- RLS Policies
ALTER TABLE recurring_task_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recurring items"
  ON recurring_task_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recurring items"
  ON recurring_task_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring items"
  ON recurring_task_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring items"
  ON recurring_task_items FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER set_recurring_items_updated_at
  BEFORE UPDATE ON recurring_task_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2.2 Modify `tasks` Table

```sql
-- Migration: 008_tasks_recurring_link.sql

-- Add recurring item reference to tasks
ALTER TABLE tasks
ADD COLUMN recurring_item_id UUID REFERENCES recurring_task_items(id) ON DELETE SET NULL;

-- Index for finding tasks by recurring item
CREATE INDEX idx_tasks_recurring_item ON tasks(recurring_item_id)
  WHERE recurring_item_id IS NOT NULL;

-- Index for finding incomplete tasks by recurring item (for cleanup on delete)
CREATE INDEX idx_tasks_recurring_incomplete ON tasks(recurring_item_id, is_completed)
  WHERE recurring_item_id IS NOT NULL AND is_completed = false;
```

### 2.3 Generation Counts per Frequency (from PRD)

| Frequency | Default Tasks to Generate |
| --------- | ------------------------- |
| Daily     | 15                        |
| Weekdays  | 15                        |
| Weekends  | 15                        |
| Weekly    | 8                         |
| Monthly   | 6                         |
| Yearly    | 2                         |

---

## 3. Domain Layer Implementation

### 3.1 Domain Types

```typescript
// src/domain/types/recurring.ts

export type RecurringFrequency =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'weekdays'
  | 'weekends';

export interface RecurringTaskItem {
  id: string;
  userId: string;

  // Template
  title: string;
  description: string | null;
  categoryId: string | null;
  priority: TaskPriority;
  dailySection: DailySection | null;
  bonusSection: BonusSection | null;

  // Recurrence
  frequency: RecurringFrequency;
  rruleString: string;
  startDate: Date;
  endDate: Date | null;
  dueOffsetDays: number;

  // Generation tracking
  lastGeneratedDate: Date | null;
  tasksToGenerateAhead: number;

  // Status
  isActive: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Configuration for weekly frequency
export interface WeeklyConfig {
  daysOfWeek: number[]; // 0-6, Sunday = 0
}

// Configuration for monthly frequency
export interface MonthlyConfig {
  dayOfMonth: number; // 1-31
}

// Configuration for yearly frequency
export interface YearlyConfig {
  month: number; // 1-12
  dayOfMonth: number; // 1-31
}
```

### 3.2 Domain Model

```typescript
// src/domain/models/RecurringTaskItem.ts

import type {
  RecurringTaskItem,
  RecurringFrequency,
  TaskPriority,
  DailySection,
  BonusSection,
} from '../types';

export interface CreateRecurringTaskItemInput {
  title: string;
  description?: string;
  categoryId?: string;
  priority?: TaskPriority;
  dailySection?: DailySection;
  bonusSection?: BonusSection;
  frequency: RecurringFrequency;
  startDate: Date;
  endDate?: Date;
  dueOffsetDays?: number;

  // Frequency-specific config
  weeklyDays?: number[]; // For weekly
  monthlyDay?: number; // For monthly
  yearlyMonth?: number; // For yearly
  yearlyDay?: number; // For yearly
}

export interface UpdateRecurringTaskItemInput {
  title?: string;
  description?: string | null;
  categoryId?: string | null;
  priority?: TaskPriority;
  dailySection?: DailySection | null;
  bonusSection?: BonusSection | null;
  endDate?: Date | null;
  isActive?: boolean;
}
```

### 3.3 Validation Schema

```typescript
// src/domain/validation/recurringTaskItem.schema.ts

import { z } from 'zod';

export const recurringFrequencySchema = z.enum([
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'weekdays',
  'weekends',
]);

export const createRecurringTaskItemSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().max(1000).optional(),
    categoryId: z.string().uuid().optional(),
    priority: z.enum(['high', 'medium', 'low']).default('medium'),
    dailySection: z.enum(['morning', 'afternoon', 'evening']).optional(),
    bonusSection: z.enum(['essential', 'bonus']).optional(),
    frequency: recurringFrequencySchema,
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    dueOffsetDays: z.number().min(0).max(365).default(0),

    // Frequency-specific
    weeklyDays: z.array(z.number().min(0).max(6)).optional(),
    monthlyDay: z.number().min(1).max(31).optional(),
    yearlyMonth: z.number().min(1).max(12).optional(),
    yearlyDay: z.number().min(1).max(31).optional(),
  })
  .refine(
    (data) => {
      if (
        data.frequency === 'weekly' &&
        (!data.weeklyDays || data.weeklyDays.length === 0)
      ) {
        return false;
      }
      return true;
    },
    { message: 'Weekly frequency requires at least one day selected' }
  )
  .refine(
    (data) => {
      if (data.frequency === 'monthly' && !data.monthlyDay) {
        return false;
      }
      return true;
    },
    { message: 'Monthly frequency requires day of month' }
  )
  .refine(
    (data) => {
      if (
        data.frequency === 'yearly' &&
        (!data.yearlyMonth || !data.yearlyDay)
      ) {
        return false;
      }
      return true;
    },
    { message: 'Yearly frequency requires month and day' }
  );

export const updateRecurringTaskItemSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  dailySection: z
    .enum(['morning', 'afternoon', 'evening'])
    .nullable()
    .optional(),
  bonusSection: z.enum(['essential', 'bonus']).nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  isActive: z.boolean().optional(),
});
```

---

## 4. Infrastructure Layer

### 4.1 RRULE Utility Functions

```typescript
// src/infrastructure/utils/rruleBuilder.ts

import { RRule, Weekday } from 'rrule';
import type { RecurringFrequency } from '@/domain/types';

const WEEKDAY_MAP: Record<number, Weekday> = {
  0: RRule.SU,
  1: RRule.MO,
  2: RRule.TU,
  3: RRule.WE,
  4: RRule.TH,
  5: RRule.FR,
  6: RRule.SA,
};

interface BuildRRuleOptions {
  frequency: RecurringFrequency;
  startDate: Date;
  endDate?: Date;
  weeklyDays?: number[];
  monthlyDay?: number;
  yearlyMonth?: number;
  yearlyDay?: number;
}

export function buildRRuleString(options: BuildRRuleOptions): string {
  const {
    frequency,
    startDate,
    endDate,
    weeklyDays,
    monthlyDay,
    yearlyMonth,
    yearlyDay,
  } = options;

  let rruleOptions: Partial<ConstructorParameters<typeof RRule>[0]> = {
    dtstart: startDate,
    until: endDate || undefined,
  };

  switch (frequency) {
    case 'daily':
      rruleOptions.freq = RRule.DAILY;
      break;

    case 'weekdays':
      rruleOptions.freq = RRule.WEEKLY;
      rruleOptions.byweekday = [
        RRule.MO,
        RRule.TU,
        RRule.WE,
        RRule.TH,
        RRule.FR,
      ];
      break;

    case 'weekends':
      rruleOptions.freq = RRule.WEEKLY;
      rruleOptions.byweekday = [RRule.SA, RRule.SU];
      break;

    case 'weekly':
      rruleOptions.freq = RRule.WEEKLY;
      if (weeklyDays && weeklyDays.length > 0) {
        rruleOptions.byweekday = weeklyDays.map((d) => WEEKDAY_MAP[d]);
      }
      break;

    case 'monthly':
      rruleOptions.freq = RRule.MONTHLY;
      if (monthlyDay) {
        rruleOptions.bymonthday = monthlyDay;
      }
      break;

    case 'yearly':
      rruleOptions.freq = RRule.YEARLY;
      if (yearlyMonth) {
        rruleOptions.bymonth = yearlyMonth;
      }
      if (yearlyDay) {
        rruleOptions.bymonthday = yearlyDay;
      }
      break;
  }

  const rule = new RRule(rruleOptions);
  return rule.toString();
}

export function getNextOccurrences(
  rruleString: string,
  afterDate: Date,
  count: number
): Date[] {
  const rule = RRule.fromString(rruleString);
  return rule
    .between(
      afterDate,
      new Date(afterDate.getTime() + 365 * 24 * 60 * 60 * 1000),
      true
    )
    .slice(0, count);
}

export function getOccurrencesBetween(
  rruleString: string,
  startDate: Date,
  endDate: Date
): Date[] {
  const rule = RRule.fromString(rruleString);
  return rule.between(startDate, endDate, true);
}
```

### 4.2 Task Generation Service

```typescript
// src/infrastructure/services/taskGenerationService.ts

import { RRule } from 'rrule';
import type { RecurringTaskItem, Task } from '@/domain/types';
import { generateLexorank } from '@/infrastructure/utils/lexorank';

const GENERATION_LIMITS: Record<string, number> = {
  daily: 15,
  weekdays: 15,
  weekends: 15,
  weekly: 8,
  monthly: 6,
  yearly: 2,
};

interface GeneratedTask {
  userId: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  priority: TaskPriority;
  dailySection: DailySection | null;
  bonusSection: BonusSection | null;
  scheduledDate: Date;
  dueDate: Date | null;
  recurringItemId: string;
  position: string;
}

export function generateTasksFromRecurringItem(
  recurringItem: RecurringTaskItem,
  fromDate: Date,
  existingDates: Set<string> // ISO date strings of already-generated tasks
): GeneratedTask[] {
  const rule = RRule.fromString(recurringItem.rruleString);
  const limit = GENERATION_LIMITS[recurringItem.frequency] || 15;

  // Calculate end boundary
  const maxDate = recurringItem.endDate
    ? new Date(
        Math.min(
          recurringItem.endDate.getTime(),
          fromDate.getTime() + 365 * 24 * 60 * 60 * 1000
        )
      )
    : new Date(fromDate.getTime() + 365 * 24 * 60 * 60 * 1000);

  // Get all occurrences within range
  const occurrences = rule.between(fromDate, maxDate, true);

  const tasksToGenerate: GeneratedTask[] = [];
  let generatedCount = 0;

  for (const occurrence of occurrences) {
    if (generatedCount >= limit) break;

    const dateKey = occurrence.toISOString().split('T')[0];

    // Skip if already generated
    if (existingDates.has(dateKey)) continue;

    // Calculate due date
    const dueDate =
      recurringItem.dueOffsetDays > 0
        ? new Date(
            occurrence.getTime() +
              recurringItem.dueOffsetDays * 24 * 60 * 60 * 1000
          )
        : null;

    tasksToGenerate.push({
      userId: recurringItem.userId,
      title: recurringItem.title,
      description: recurringItem.description,
      categoryId: recurringItem.categoryId,
      priority: recurringItem.priority,
      dailySection: recurringItem.dailySection,
      bonusSection: recurringItem.bonusSection,
      scheduledDate: occurrence,
      dueDate,
      recurringItemId: recurringItem.id,
      position: generateLexorank(), // Generate unique position
    });

    generatedCount++;
  }

  return tasksToGenerate;
}
```

### 4.3 Repository Interface

```typescript
// src/infrastructure/repositories/IRecurringTaskItemRepository.ts

import type {
  RecurringTaskItem,
  CreateRecurringTaskItemInput,
  UpdateRecurringTaskItemInput,
} from '@/domain/types';

export interface IRecurringTaskItemRepository {
  create(input: CreateRecurringTaskItemInput): Promise<RecurringTaskItem>;
  getById(id: string): Promise<RecurringTaskItem | null>;
  getByUserId(
    userId: string,
    activeOnly?: boolean
  ): Promise<RecurringTaskItem[]>;
  update(
    id: string,
    input: UpdateRecurringTaskItemInput
  ): Promise<RecurringTaskItem>;
  delete(id: string): Promise<void>;
  updateLastGeneratedDate(id: string, date: Date): Promise<void>;
  getItemsNeedingGeneration(userId: string): Promise<RecurringTaskItem[]>;
}
```

### 4.4 Supabase Repository Implementation

```typescript
// src/infrastructure/repositories/SupabaseRecurringTaskItemRepository.ts

import { createClient } from '@/infrastructure/supabase/server';
import type {
  RecurringTaskItem,
  CreateRecurringTaskItemInput,
  UpdateRecurringTaskItemInput,
} from '@/domain/types';
import { buildRRuleString } from '@/infrastructure/utils/rruleBuilder';
import {
  mapDbToRecurringItem,
  mapRecurringItemToDb,
} from '@/infrastructure/supabase/mappers';

export class SupabaseRecurringTaskItemRepository implements IRecurringTaskItemRepository {
  async create(
    input: CreateRecurringTaskItemInput
  ): Promise<RecurringTaskItem> {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const rruleString = buildRRuleString({
      frequency: input.frequency,
      startDate: input.startDate,
      endDate: input.endDate,
      weeklyDays: input.weeklyDays,
      monthlyDay: input.monthlyDay,
      yearlyMonth: input.yearlyMonth,
      yearlyDay: input.yearlyDay,
    });

    const dbInput = mapRecurringItemToDb({
      ...input,
      rruleString,
      userId: user.id,
    });

    const { data, error } = await supabase
      .from('recurring_task_items')
      .insert(dbInput)
      .select()
      .single();

    if (error) throw error;
    return mapDbToRecurringItem(data);
  }

  async getByUserId(
    userId: string,
    activeOnly = true
  ): Promise<RecurringTaskItem[]> {
    const supabase = await createClient();

    let query = supabase
      .from('recurring_task_items')
      .select('*')
      .eq('user_id', userId);

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) throw error;
    return data.map(mapDbToRecurringItem);
  }

  async getItemsNeedingGeneration(
    userId: string
  ): Promise<RecurringTaskItem[]> {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    // Get active items where last_generated_date is null or before today
    const { data, error } = await supabase
      .from('recurring_task_items')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .or(`last_generated_date.is.null,last_generated_date.lt.${today}`);

    if (error) throw error;
    return data.map(mapDbToRecurringItem);
  }

  // ... other methods
}
```

---

## 5. Application Layer (Use Cases)

### 5.1 Create Recurring Task Item

```typescript
// src/application/recurring/createRecurringTaskItem.usecase.ts

import { SupabaseRecurringTaskItemRepository } from '@/infrastructure/repositories';
import { SupabaseTaskRepository } from '@/infrastructure/repositories';
import { generateTasksFromRecurringItem } from '@/infrastructure/services/taskGenerationService';
import { createRecurringTaskItemSchema } from '@/domain/validation';
import type { CreateRecurringTaskItemInput } from '@/domain/types';

export async function createRecurringTaskItemUseCase(
  input: CreateRecurringTaskItemInput
): Promise<{ recurringItem: RecurringTaskItem; generatedTasks: Task[] }> {
  // Validate
  const validated = createRecurringTaskItemSchema.parse(input);

  const recurringRepo = new SupabaseRecurringTaskItemRepository();
  const taskRepo = new SupabaseTaskRepository();

  // Create recurring item
  const recurringItem = await recurringRepo.create(validated);

  // Generate initial batch of tasks
  const tasksToGenerate = generateTasksFromRecurringItem(
    recurringItem,
    recurringItem.startDate,
    new Set()
  );

  // Insert generated tasks
  const generatedTasks = await taskRepo.createBatch(tasksToGenerate);

  // Update last generated date
  if (tasksToGenerate.length > 0) {
    const lastDate = tasksToGenerate[tasksToGenerate.length - 1].scheduledDate;
    await recurringRepo.updateLastGeneratedDate(recurringItem.id, lastDate);
  }

  return { recurringItem, generatedTasks };
}
```

### 5.2 Delete Recurring Task Item

```typescript
// src/application/recurring/deleteRecurringTaskItem.usecase.ts

export async function deleteRecurringTaskItemUseCase(
  id: string
): Promise<void> {
  const recurringRepo = new SupabaseRecurringTaskItemRepository();
  const taskRepo = new SupabaseTaskRepository();

  // Delete all uncompleted tasks linked to this recurring item
  await taskRepo.deleteUncompletedByRecurringItemId(id);

  // Delete the recurring item itself
  await recurringRepo.delete(id);
}
```

### 5.3 Generate Tasks on View (Lazy Generation)

```typescript
// src/application/recurring/ensureTasksGenerated.usecase.ts

/**
 * Called when user views a date range to ensure tasks exist
 */
export async function ensureTasksGeneratedUseCase(
  userId: string,
  viewStartDate: Date,
  viewEndDate: Date
): Promise<Task[]> {
  const recurringRepo = new SupabaseRecurringTaskItemRepository();
  const taskRepo = new SupabaseTaskRepository();

  // Get all active recurring items that might need generation
  const itemsNeedingGeneration =
    await recurringRepo.getItemsNeedingGeneration(userId);

  const allGeneratedTasks: Task[] = [];

  for (const item of itemsNeedingGeneration) {
    // Get existing tasks for this recurring item
    const existingTasks = await taskRepo.getByRecurringItemId(item.id);
    const existingDates = new Set(
      existingTasks.map((t) => t.scheduledDate.toISOString().split('T')[0])
    );

    // Generate missing tasks
    const tasksToGenerate = generateTasksFromRecurringItem(
      item,
      item.lastGeneratedDate || item.startDate,
      existingDates
    );

    if (tasksToGenerate.length > 0) {
      const generated = await taskRepo.createBatch(tasksToGenerate);
      allGeneratedTasks.push(...generated);

      // Update tracking
      const lastDate =
        tasksToGenerate[tasksToGenerate.length - 1].scheduledDate;
      await recurringRepo.updateLastGeneratedDate(item.id, lastDate);
    }
  }

  return allGeneratedTasks;
}
```

### 5.4 Handle Task Completion → Generate Next

```typescript
// src/application/tasks/completeTask.usecase.ts

export async function completeTaskUseCase(taskId: string): Promise<Task> {
  const taskRepo = new SupabaseTaskRepository();
  const recurringRepo = new SupabaseRecurringTaskItemRepository();

  // Mark task complete
  const completedTask = await taskRepo.update(taskId, { isCompleted: true });

  // If this was a recurring task, potentially generate next
  if (completedTask.recurringItemId) {
    const recurringItem = await recurringRepo.getById(
      completedTask.recurringItemId
    );

    if (recurringItem && recurringItem.isActive) {
      // Get existing tasks to avoid duplicates
      const existingTasks = await taskRepo.getByRecurringItemId(
        recurringItem.id
      );
      const existingDates = new Set(
        existingTasks.map((t) => t.scheduledDate.toISOString().split('T')[0])
      );

      // Generate from the completed task's date forward
      const tasksToGenerate = generateTasksFromRecurringItem(
        recurringItem,
        completedTask.scheduledDate,
        existingDates
      );

      if (tasksToGenerate.length > 0) {
        await taskRepo.createBatch(tasksToGenerate);
        const lastDate =
          tasksToGenerate[tasksToGenerate.length - 1].scheduledDate;
        await recurringRepo.updateLastGeneratedDate(recurringItem.id, lastDate);
      }
    }
  }

  return completedTask;
}
```

---

## 6. Server Actions

### 6.1 Recurring Task Item Actions

```typescript
// app/actions/recurring/createRecurringTaskItemAction.ts
'use server';

import { createRecurringTaskItemUseCase } from '@/application/recurring';
import { createRecurringTaskItemSchema } from '@/domain/validation';
import { handleError } from '@/shared/errors';
import { revalidatePath } from 'next/cache';

export async function createRecurringTaskItemAction(formData: FormData) {
  try {
    const input = {
      title: formData.get('title') as string,
      description: (formData.get('description') as string) || undefined,
      categoryId: (formData.get('categoryId') as string) || undefined,
      priority: (formData.get('priority') as TaskPriority) || 'medium',
      frequency: formData.get('frequency') as RecurringFrequency,
      startDate: new Date(formData.get('startDate') as string),
      endDate: formData.get('endDate')
        ? new Date(formData.get('endDate') as string)
        : undefined,
      dueOffsetDays: parseInt((formData.get('dueOffsetDays') as string) || '0'),
      weeklyDays: formData.getAll('weeklyDays').map(Number),
      monthlyDay: formData.get('monthlyDay')
        ? parseInt(formData.get('monthlyDay') as string)
        : undefined,
      yearlyMonth: formData.get('yearlyMonth')
        ? parseInt(formData.get('yearlyMonth') as string)
        : undefined,
      yearlyDay: formData.get('yearlyDay')
        ? parseInt(formData.get('yearlyDay') as string)
        : undefined,
    };

    const result = await createRecurringTaskItemUseCase(input);

    revalidatePath('/recurring');
    revalidatePath('/daily');

    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}
```

```typescript
// app/actions/recurring/getRecurringTaskItemsAction.ts
'use server';

import { SupabaseRecurringTaskItemRepository } from '@/infrastructure/repositories';
import { createClient } from '@/infrastructure/supabase/server';

export async function getRecurringTaskItemsAction(activeOnly = true) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const repo = new SupabaseRecurringTaskItemRepository();
    const items = await repo.getByUserId(user.id, activeOnly);

    return { success: true, data: items };
  } catch (error) {
    return handleError(error);
  }
}
```

```typescript
// app/actions/recurring/deleteRecurringTaskItemAction.ts
'use server';

import { deleteRecurringTaskItemUseCase } from '@/application/recurring';
import { revalidatePath } from 'next/cache';

export async function deleteRecurringTaskItemAction(id: string) {
  try {
    await deleteRecurringTaskItemUseCase(id);

    revalidatePath('/recurring');
    revalidatePath('/daily');
    revalidatePath('/all-tasks');

    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}
```

---

## 7. React Query Hooks

### 7.1 Recurring Task Items Hooks

```typescript
// src/presentation/hooks/recurring/useRecurringTaskItems.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/query-keys';
import {
  getRecurringTaskItemsAction,
  createRecurringTaskItemAction,
  updateRecurringTaskItemAction,
  deleteRecurringTaskItemAction,
} from '@/app/actions/recurring';

export function useRecurringTaskItems(activeOnly = true) {
  return useQuery({
    queryKey: queryKeys.recurringItems.list(activeOnly),
    queryFn: async () => {
      const result = await getRecurringTaskItemsAction(activeOnly);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateRecurringTaskItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRecurringTaskItemInput) => {
      const formData = new FormData();
      Object.entries(input).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => formData.append(key, String(v)));
        } else if (value !== undefined && value !== null) {
          formData.append(
            key,
            value instanceof Date ? value.toISOString() : String(value)
          );
        }
      });

      const result = await createRecurringTaskItemAction(formData);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringItems.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}

export function useDeleteRecurringTaskItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteRecurringTaskItemAction(id);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringItems.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}
```

### 7.2 Query Keys Extension

```typescript
// src/config/query-keys.ts (additions)

export const queryKeys = {
  // ... existing keys

  recurringItems: {
    all: ['recurring-items'] as const,
    list: (activeOnly: boolean) =>
      [...queryKeys.recurringItems.all, 'list', { activeOnly }] as const,
    detail: (id: string) =>
      [...queryKeys.recurringItems.all, 'detail', id] as const,
  },
};
```

---

## 8. UI Components

### 8.1 Component Tree

```
/recurring (page)
├── RecurringTaskItemsPage
│   ├── CreateRecurringTaskButton
│   │   └── CreateRecurringTaskDrawer
│   │       └── CreateRecurringTaskForm
│   │           ├── FrequencySelector
│   │           ├── WeeklyDaysPicker (conditional)
│   │           ├── MonthlyDayPicker (conditional)
│   │           ├── YearlyDatePicker (conditional)
│   │           ├── DateRangePicker (startDate, endDate)
│   │           └── DueOffsetInput
│   └── RecurringTaskItemsList
│       └── RecurringTaskItemCard
│           ├── RecurrenceDescription
│           ├── NextOccurrenceDisplay
│           └── RecurringItemActions (edit, pause, delete)
```

### 8.2 Frequency Selector Component

```typescript
// src/presentation/components/recurring/FrequencySelector.tsx

'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { RecurringFrequency } from '@/domain/types';

interface FrequencySelectorProps {
  value: RecurringFrequency;
  onChange: (value: RecurringFrequency) => void;
}

const FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Every Weekday (Mon-Fri)' },
  { value: 'weekends', label: 'Every Weekend (Sat-Sun)' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export function FrequencySelector({ value, onChange }: FrequencySelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Repeat</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select frequency" />
        </SelectTrigger>
        <SelectContent>
          {FREQUENCY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

### 8.3 Weekly Days Picker

```typescript
// src/presentation/components/recurring/WeeklyDaysPicker.tsx

'use client';

import { Label } from '@/components/ui/label';
import { Toggle } from '@/components/ui/toggle';

interface WeeklyDaysPickerProps {
  value: number[];
  onChange: (days: number[]) => void;
}

const DAYS = [
  { value: 0, label: 'S', full: 'Sunday' },
  { value: 1, label: 'M', full: 'Monday' },
  { value: 2, label: 'T', full: 'Tuesday' },
  { value: 3, label: 'W', full: 'Wednesday' },
  { value: 4, label: 'T', full: 'Thursday' },
  { value: 5, label: 'F', full: 'Friday' },
  { value: 6, label: 'S', full: 'Saturday' },
];

export function WeeklyDaysPicker({ value, onChange }: WeeklyDaysPickerProps) {
  const handleToggle = (day: number) => {
    const newValue = value.includes(day)
      ? value.filter(d => d !== day)
      : [...value, day].sort();
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <Label>Repeat on</Label>
      <div className="flex gap-1">
        {DAYS.map((day) => (
          <Toggle
            key={day.value}
            pressed={value.includes(day.value)}
            onPressedChange={() => handleToggle(day.value)}
            aria-label={day.full}
            className="h-9 w-9 rounded-full"
          >
            {day.label}
          </Toggle>
        ))}
      </div>
    </div>
  );
}
```

### 8.4 Create Recurring Task Form

```typescript
// src/presentation/components/recurring/CreateRecurringTaskForm.tsx

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRecurringTaskItemSchema } from '@/domain/validation';
import { useCreateRecurringTaskItem } from '@/presentation/hooks/recurring';
import { FrequencySelector } from './FrequencySelector';
import { WeeklyDaysPicker } from './WeeklyDaysPicker';
import { MonthlyDayPicker } from './MonthlyDayPicker';
import { YearlyDatePicker } from './YearlyDatePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CategoryPicker } from '@/presentation/components/categories';
import { PriorityPicker } from '@/presentation/components/tasks';
import type { RecurringFrequency } from '@/domain/types';

interface CreateRecurringTaskFormProps {
  onSuccess?: () => void;
}

export function CreateRecurringTaskForm({ onSuccess }: CreateRecurringTaskFormProps) {
  const [frequency, setFrequency] = useState<RecurringFrequency>('daily');
  const { mutate: createItem, isPending } = useCreateRecurringTaskItem();

  const form = useForm({
    resolver: zodResolver(createRecurringTaskItemSchema),
    defaultValues: {
      title: '',
      description: '',
      categoryId: undefined,
      priority: 'medium',
      frequency: 'daily',
      startDate: new Date(),
      endDate: undefined,
      dueOffsetDays: 0,
      weeklyDays: [],
      monthlyDay: undefined,
      yearlyMonth: undefined,
      yearlyDay: undefined,
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    createItem(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Task Title</Label>
        <Input
          id="title"
          placeholder="e.g., Morning standup"
          {...form.register('title')}
        />
        {form.formState.errors.title && (
          <p className="text-sm text-destructive">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          placeholder="Add details..."
          {...form.register('description')}
        />
      </div>

      {/* Category & Priority */}
      <div className="grid grid-cols-2 gap-4">
        <CategoryPicker
          value={form.watch('categoryId')}
          onChange={(v) => form.setValue('categoryId', v)}
        />
        <PriorityPicker
          value={form.watch('priority')}
          onChange={(v) => form.setValue('priority', v)}
        />
      </div>

      {/* Frequency */}
      <FrequencySelector
        value={frequency}
        onChange={(v) => {
          setFrequency(v);
          form.setValue('frequency', v);
        }}
      />

      {/* Frequency-specific options */}
      {frequency === 'weekly' && (
        <WeeklyDaysPicker
          value={form.watch('weeklyDays') || []}
          onChange={(days) => form.setValue('weeklyDays', days)}
        />
      )}

      {frequency === 'monthly' && (
        <MonthlyDayPicker
          value={form.watch('monthlyDay')}
          onChange={(day) => form.setValue('monthlyDay', day)}
        />
      )}

      {frequency === 'yearly' && (
        <YearlyDatePicker
          month={form.watch('yearlyMonth')}
          day={form.watch('yearlyDay')}
          onMonthChange={(m) => form.setValue('yearlyMonth', m)}
          onDayChange={(d) => form.setValue('yearlyDay', d)}
        />
      )}

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input
            type="date"
            {...form.register('startDate', { valueAsDate: true })}
          />
        </div>
        <div className="space-y-2">
          <Label>End Date (optional)</Label>
          <Input
            type="date"
            {...form.register('endDate', { valueAsDate: true })}
          />
        </div>
      </div>

      {/* Due Offset */}
      <div className="space-y-2">
        <Label>Due after (days)</Label>
        <Input
          type="number"
          min={0}
          max={365}
          {...form.register('dueOffsetDays', { valueAsNumber: true })}
        />
        <p className="text-sm text-muted-foreground">
          Days after the scheduled date when the task is due
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Recurring Task'}
      </Button>
    </form>
  );
}
```

---

## 9. Background Generation (Production)

### 9.1 Supabase Edge Function

```typescript
// supabase/functions/generate-recurring-tasks/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active recurring items needing generation
    const today = new Date().toISOString().split('T')[0];

    const { data: items, error: fetchError } = await supabase
      .from('recurring_task_items')
      .select('*')
      .eq('is_active', true)
      .or(`last_generated_date.is.null,last_generated_date.lt.${today}`);

    if (fetchError) throw fetchError;

    let generatedCount = 0;

    for (const item of items || []) {
      // Get existing tasks for this item
      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('scheduled_date')
        .eq('recurring_item_id', item.id);

      const existingDates = new Set(
        (existingTasks || []).map((t) => t.scheduled_date)
      );

      // Generate tasks (simplified - actual implementation would use rrule)
      const tasksToInsert = generateTasksForItem(item, existingDates);

      if (tasksToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('tasks')
          .insert(tasksToInsert);

        if (insertError) {
          console.error(
            `Error generating tasks for item ${item.id}:`,
            insertError
          );
          continue;
        }

        // Update last_generated_date
        const lastDate = tasksToInsert[tasksToInsert.length - 1].scheduled_date;
        await supabase
          .from('recurring_task_items')
          .update({ last_generated_date: lastDate })
          .eq('id', item.id);

        generatedCount += tasksToInsert.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        itemsProcessed: items?.length || 0,
        tasksGenerated: generatedCount,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-recurring-tasks:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### 9.2 pg_cron Schedule

```sql
-- Schedule the edge function to run daily at 2 AM UTC

-- First, store the project URL and service key in vault
SELECT vault.create_secret(
  'https://YOUR_PROJECT_REF.supabase.co',
  'project_url'
);

SELECT vault.create_secret(
  'YOUR_SERVICE_ROLE_KEY',
  'service_role_key'
);

-- Create function to call edge function
CREATE OR REPLACE FUNCTION call_generate_recurring_tasks()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  project_url text;
  service_key text;
BEGIN
  SELECT decrypted_secret INTO project_url
  FROM vault.decrypted_secrets
  WHERE name = 'project_url';

  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key';

  PERFORM net.http_post(
    url := project_url || '/functions/v1/generate-recurring-tasks',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_key,
      'Content-Type', 'application/json'
    )
  );
END;
$$;

-- Schedule the cron job
SELECT cron.schedule(
  'generate-recurring-tasks-daily',
  '0 2 * * *',  -- Run at 2:00 AM UTC every day
  $$ SELECT call_generate_recurring_tasks(); $$
);
```

---

## 10. Task Breakdown

### Phase 6.1: Database & Domain (Week 1)

| Task ID | Task                                                            | Priority | Est. Hours | Dependencies |
| ------- | --------------------------------------------------------------- | -------- | ---------- | ------------ |
| 6.1.1   | Create `recurring_task_items` table migration                   | HIGH     | 1          | -            |
| 6.1.2   | Add `recurring_item_id` to tasks table migration                | HIGH     | 0.5        | 6.1.1        |
| 6.1.3   | Create domain types (`RecurringTaskItem`, `RecurringFrequency`) | HIGH     | 1          | -            |
| 6.1.4   | Create Zod validation schemas                                   | HIGH     | 1          | 6.1.3        |
| 6.1.5   | Install and configure `rrule` library                           | HIGH     | 0.5        | -            |
| 6.1.6   | Create `rruleBuilder` utility                                   | HIGH     | 2          | 6.1.5        |
| 6.1.7   | Create `taskGenerationService`                                  | HIGH     | 3          | 6.1.6        |

### Phase 6.2: Repository & Use Cases (Week 1-2)

| Task ID | Task                                                 | Priority | Est. Hours | Dependencies |
| ------- | ---------------------------------------------------- | -------- | ---------- | ------------ |
| 6.2.1   | Create `IRecurringTaskItemRepository` interface      | HIGH     | 0.5        | 6.1.3        |
| 6.2.2   | Implement `SupabaseRecurringTaskItemRepository`      | HIGH     | 3          | 6.2.1, 6.1.1 |
| 6.2.3   | Add `createBatch` method to `SupabaseTaskRepository` | HIGH     | 1          | -            |
| 6.2.4   | Add `deleteUncompletedByRecurringItemId` method      | HIGH     | 1          | 6.1.2        |
| 6.2.5   | Create `createRecurringTaskItem` use case            | HIGH     | 2          | 6.2.2, 6.1.7 |
| 6.2.6   | Create `deleteRecurringTaskItem` use case            | HIGH     | 1          | 6.2.4        |
| 6.2.7   | Create `ensureTasksGenerated` use case (lazy gen)    | HIGH     | 2          | 6.1.7        |
| 6.2.8   | Modify `completeTask` use case for next gen          | MEDIUM   | 2          | 6.2.5        |

### Phase 6.3: Server Actions (Week 2)

| Task ID | Task                                            | Priority | Est. Hours | Dependencies |
| ------- | ----------------------------------------------- | -------- | ---------- | ------------ |
| 6.3.1   | Create `createRecurringTaskItemAction`          | HIGH     | 1          | 6.2.5        |
| 6.3.2   | Create `getRecurringTaskItemsAction`            | HIGH     | 0.5        | 6.2.2        |
| 6.3.3   | Create `updateRecurringTaskItemAction`          | MEDIUM   | 1          | 6.2.2        |
| 6.3.4   | Create `deleteRecurringTaskItemAction`          | HIGH     | 0.5        | 6.2.6        |
| 6.3.5   | Create `toggleRecurringTaskItemActiveAction`    | MEDIUM   | 0.5        | 6.2.2        |
| 6.3.6   | Modify `toggleTaskCompletedAction` for next gen | HIGH     | 1          | 6.2.8        |

### Phase 6.4: React Query Hooks (Week 2)

| Task ID | Task                                             | Priority | Est. Hours | Dependencies |
| ------- | ------------------------------------------------ | -------- | ---------- | ------------ |
| 6.4.1   | Add `recurringItems` query keys                  | HIGH     | 0.25       | -            |
| 6.4.2   | Create `useRecurringTaskItems` hook              | HIGH     | 1          | 6.3.2        |
| 6.4.3   | Create `useCreateRecurringTaskItem` hook         | HIGH     | 1          | 6.3.1        |
| 6.4.4   | Create `useUpdateRecurringTaskItem` hook         | MEDIUM   | 1          | 6.3.3        |
| 6.4.5   | Create `useDeleteRecurringTaskItem` hook         | HIGH     | 0.5        | 6.3.4        |
| 6.4.6   | Modify `useToggleTaskCompleted` for invalidation | HIGH     | 0.5        | 6.3.6        |

### Phase 6.5: UI Components (Week 3)

| Task ID | Task                                     | Priority | Est. Hours | Dependencies       |
| ------- | ---------------------------------------- | -------- | ---------- | ------------------ |
| 6.5.1   | Create `FrequencySelector` component     | HIGH     | 1          | -                  |
| 6.5.2   | Create `WeeklyDaysPicker` component      | HIGH     | 1          | -                  |
| 6.5.3   | Create `MonthlyDayPicker` component      | HIGH     | 1          | -                  |
| 6.5.4   | Create `YearlyDatePicker` component      | HIGH     | 1          | -                  |
| 6.5.5   | Create `DueOffsetInput` component        | MEDIUM   | 0.5        | -                  |
| 6.5.6   | Create `CreateRecurringTaskForm`         | HIGH     | 3          | 6.5.1-6.5.5, 6.4.3 |
| 6.5.7   | Create `CreateRecurringTaskDrawer`       | HIGH     | 1          | 6.5.6              |
| 6.5.8   | Create `RecurringTaskItemCard`           | HIGH     | 2          | 6.4.2              |
| 6.5.9   | Create `RecurrenceDescription` component | MEDIUM   | 1          | -                  |
| 6.5.10  | Create `RecurringTaskItemsList`          | HIGH     | 1          | 6.5.8              |
| 6.5.11  | Create `/recurring` page                 | HIGH     | 1          | 6.5.10, 6.5.7      |

### Phase 6.6: Integration & Polish (Week 3-4)

| Task ID | Task                                            | Priority | Est. Hours | Dependencies   |
| ------- | ----------------------------------------------- | -------- | ---------- | -------------- |
| 6.6.1   | Integrate lazy generation into `useTasksByWeek` | HIGH     | 2          | 6.2.7          |
| 6.6.2   | Add recurring indicator to `TaskListItem`       | MEDIUM   | 1          | 6.1.2          |
| 6.6.3   | Add "View recurring item" from task             | LOW      | 1          | 6.6.2          |
| 6.6.4   | Handle delete confirmation for recurring items  | MEDIUM   | 1          | 6.4.5          |
| 6.6.5   | Add pause/resume functionality                  | LOW      | 1          | 6.3.5          |
| 6.6.6   | Error handling and edge cases                   | HIGH     | 2          | All            |
| 6.6.7   | Loading states and skeletons                    | MEDIUM   | 1          | 6.5.10, 6.5.11 |

### Phase 6.7: Background Generation (Optional - Week 4)

| Task ID | Task                                            | Priority | Est. Hours | Dependencies |
| ------- | ----------------------------------------------- | -------- | ---------- | ------------ |
| 6.7.1   | Create Edge Function `generate-recurring-tasks` | LOW      | 3          | 6.2.7        |
| 6.7.2   | Configure pg_cron schedule                      | LOW      | 1          | 6.7.1        |
| 6.7.3   | Add monitoring/logging                          | LOW      | 1          | 6.7.2        |

---

## 11. Testing Strategy

### Unit Tests (Vitest)

```typescript
// tests/unit/infrastructure/rruleBuilder.test.ts

import { describe, it, expect } from 'vitest';
import {
  buildRRuleString,
  getNextOccurrences,
} from '@/infrastructure/utils/rruleBuilder';

describe('rruleBuilder', () => {
  describe('buildRRuleString', () => {
    it('should create daily rrule', () => {
      const result = buildRRuleString({
        frequency: 'daily',
        startDate: new Date('2025-01-01'),
      });
      expect(result).toContain('FREQ=DAILY');
    });

    it('should create weekly rrule with specific days', () => {
      const result = buildRRuleString({
        frequency: 'weekly',
        startDate: new Date('2025-01-01'),
        weeklyDays: [1, 3, 5], // Mon, Wed, Fri
      });
      expect(result).toContain('FREQ=WEEKLY');
      expect(result).toContain('BYDAY=MO,WE,FR');
    });

    it('should create weekdays rrule', () => {
      const result = buildRRuleString({
        frequency: 'weekdays',
        startDate: new Date('2025-01-01'),
      });
      expect(result).toContain('BYDAY=MO,TU,WE,TH,FR');
    });
  });

  describe('getNextOccurrences', () => {
    it('should return correct number of occurrences', () => {
      const rrule = 'FREQ=DAILY;DTSTART=20250101T000000Z';
      const occurrences = getNextOccurrences(rrule, new Date('2025-01-01'), 5);
      expect(occurrences).toHaveLength(5);
    });
  });
});
```

### Integration Tests

```typescript
// tests/integration/recurring/createRecurringTask.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { createRecurringTaskItemUseCase } from '@/application/recurring';

describe('createRecurringTaskItem use case', () => {
  it('should create recurring item and generate initial tasks', async () => {
    const input = {
      title: 'Daily standup',
      frequency: 'daily',
      startDate: new Date('2025-01-01'),
    };

    const result = await createRecurringTaskItemUseCase(input);

    expect(result.recurringItem.title).toBe('Daily standup');
    expect(result.generatedTasks.length).toBe(15); // Daily default
  });

  it('should respect end date when generating tasks', async () => {
    const input = {
      title: 'Limited task',
      frequency: 'daily',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-05'),
    };

    const result = await createRecurringTaskItemUseCase(input);

    expect(result.generatedTasks.length).toBe(5);
  });
});
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/recurring.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Recurring Tasks', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name=email]', 'test@example.com');
    await page.fill('[name=password]', 'password');
    await page.click('button[type=submit]');
    await page.waitForURL('/daily');
  });

  test('should create daily recurring task', async ({ page }) => {
    await page.goto('/recurring');

    // Open create drawer
    await page.click('button:has-text("Create Recurring Task")');

    // Fill form
    await page.fill('[name=title]', 'Daily standup');
    await page.selectOption('[name=frequency]', 'daily');

    // Submit
    await page.click('button[type=submit]:has-text("Create")');

    // Verify created
    await expect(page.locator('text=Daily standup')).toBeVisible();
  });

  test('should delete recurring task and cleanup future tasks', async ({
    page,
  }) => {
    // Create first, then delete
    await page.goto('/recurring');

    // Assuming a recurring task exists
    await page.click('[data-testid=recurring-item-menu]');
    await page.click('text=Delete');
    await page.click('button:has-text("Confirm")');

    // Verify deleted
    await expect(page.locator('text=No recurring tasks')).toBeVisible();
  });
});
```

---

## 12. Risk Mitigation

| Risk                                  | Impact | Mitigation                                    |
| ------------------------------------- | ------ | --------------------------------------------- |
| rrule timezone issues                 | Medium | Use UTC internally, convert at display layer  |
| Generation limits too low             | Low    | Make configurable per-user in future          |
| Orphaned tasks on delete              | High   | Use database transaction for delete + cleanup |
| Performance with many recurring items | Medium | Index properly, consider batch processing     |
| Edge function timeout                 | Low    | Process in batches, add retry logic           |

---

## 13. Success Criteria

- [ ] User can create recurring tasks with all 6 frequency types
- [ ] Tasks are automatically generated based on recurrence pattern
- [ ] Completing a recurring task generates the next instance
- [ ] Deleting a recurring item removes all future uncompleted tasks
- [ ] Generated tasks appear correctly in Daily View and All Tasks
- [ ] Recurring tasks view shows all active and inactive recurring items
- [ ] User can pause/resume recurring items
- [ ] Edge cases handled (end dates, generation limits)
- [ ] Unit tests pass with >80% coverage for recurring logic
- [ ] E2E tests pass for critical flows

---

## 14. Files to Create/Modify

### New Files

```
supabase/migrations/
├── 007_recurring_task_items.sql
└── 008_tasks_recurring_link.sql

src/domain/
├── types/recurring.ts
├── models/RecurringTaskItem.ts
└── validation/recurringTaskItem.schema.ts

src/infrastructure/
├── utils/rruleBuilder.ts
├── services/taskGenerationService.ts
└── repositories/
    ├── IRecurringTaskItemRepository.ts
    └── SupabaseRecurringTaskItemRepository.ts

src/application/recurring/
├── createRecurringTaskItem.usecase.ts
├── updateRecurringTaskItem.usecase.ts
├── deleteRecurringTaskItem.usecase.ts
├── ensureTasksGenerated.usecase.ts
└── index.ts

app/actions/recurring/
├── createRecurringTaskItemAction.ts
├── getRecurringTaskItemsAction.ts
├── updateRecurringTaskItemAction.ts
├── deleteRecurringTaskItemAction.ts
└── toggleRecurringTaskItemActiveAction.ts

src/presentation/hooks/recurring/
├── useRecurringTaskItems.ts
├── useCreateRecurringTaskItem.ts
├── useUpdateRecurringTaskItem.ts
├── useDeleteRecurringTaskItem.ts
└── index.ts

src/presentation/components/recurring/
├── FrequencySelector.tsx
├── WeeklyDaysPicker.tsx
├── MonthlyDayPicker.tsx
├── YearlyDatePicker.tsx
├── DueOffsetInput.tsx
├── CreateRecurringTaskForm.tsx
├── CreateRecurringTaskDrawer.tsx
├── RecurringTaskItemCard.tsx
├── RecurrenceDescription.tsx
├── RecurringTaskItemsList.tsx
└── index.ts

app/(protected)/recurring/
└── page.tsx

supabase/functions/generate-recurring-tasks/
└── index.ts

tests/
├── unit/infrastructure/rruleBuilder.test.ts
├── unit/services/taskGenerationService.test.ts
├── integration/recurring/
│   ├── createRecurringTask.test.ts
│   └── deleteRecurringTask.test.ts
└── e2e/recurring.spec.ts
```

### Modified Files

```
src/config/query-keys.ts         # Add recurringItems keys
src/infrastructure/repositories/SupabaseTaskRepository.ts  # Add batch methods
src/application/tasks/completeTask.usecase.ts  # Add next generation
app/actions/tasks/toggleTaskCompletedAction.ts  # Integrate next gen
src/presentation/hooks/tasks/useToggleTaskCompleted.ts  # Invalidate queries
src/presentation/components/tasks/TaskListItem.tsx  # Recurring indicator
```

---

## Summary

This implementation plan provides a complete roadmap for Phase 6: Recurring Tasks. The hybrid lazy + background generation strategy balances MVP simplicity with production scalability. Following Clean Architecture principles ensures the implementation integrates seamlessly with your existing codebase.

**Next Steps:**

1. Review and approve this plan
2. Create the first task tickets in Notion
3. Begin with Phase 6.1 (Database & Domain layer)
