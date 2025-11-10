# Position Generation with Lexorank

## Overview

Nowly uses the **Lexorank** algorithm to generate unique, orderable position values for tasks. This ensures that tasks can be sorted and reordered efficiently without position collisions.

## What is Lexorank?

Lexorank is a list ordering system similar to JIRA's approach. It generates string-based position values that:

- Are **lexicographically sortable** (can be sorted as strings)
- Support **efficient insertion** between existing items
- **Minimize collisions** through intelligent spacing
- Allow **reordering** without updating all items

### Example Lexorank Values

```text
a0
a1
a2
a3
...
```

When you need to insert between `a0` and `a1`, Lexorank can generate a value like `a05` that sorts between them.

## Implementation

### Architecture

Position generation follows CLEAN architecture principles:

- **Infrastructure Layer**: `src/infrastructure/utils/position.ts` - Position generation utilities
- **Application Layer**: `src/application/tasks/createTask.usecase.ts` - Uses position generation when creating tasks
- **Domain Layer**: `src/domain/model/Task.ts` - Defines `position: string` field

### Key Functions

#### `generateNextPosition(existingPositions: string[]): string`

Generates the next position from an array of existing positions.

- **Input**: Array of existing position strings
- **Output**: Next position string to append to the end
- **Behavior**:
  - If no positions exist, returns `LexoRank.min().toString()` (typically `'a0'`)
  - Sorts existing positions to find the maximum
  - Generates next position after the maximum
  - Handles invalid/corrupted positions gracefully

#### `generatePositionForNewTask(userId: string, date: Date, repository: ITaskRepository): Promise<string>`

Main function for generating positions when creating new tasks.

- **Input**: User ID, scheduled date, and task repository
- **Output**: Generated position string
- **Behavior**:
  1. Fetches existing tasks for the user+date combination
  2. Extracts positions from existing tasks
  3. Calls `generateNextPosition()` to generate next position
  4. Falls back to minimum position if fetching fails

### Position Scoping

Positions are **scoped per user and date**:

- Tasks for the same user on the same date share position space
- Tasks for different dates have independent position sequences
- This matches the query pattern: `findByUserIdAndDate(userId, date)`

### Usage in CreateTask Use Case

```typescript
// Generate position for the new task, scoped per user+date
const scheduledDate = input.scheduledDate ?? null;
const position =
  scheduledDate !== null
    ? await generatePositionForNewTask(userId, scheduledDate, repository)
    : LexoRank.min().toString(); // Fallback for null scheduledDate

// Create task with generated position
const task = await repository.create({
  // ... other fields
  position,
});
```

## Edge Cases Handled

### 1. No Existing Tasks

When creating the first task for a user+date:

- Returns `LexoRank.min().toString()` (typically `'a0'`)

### 2. Null Scheduled Date

When `scheduledDate` is `null`:

- Cannot query by date, so uses `LexoRank.min().toString()`
- Future enhancement: Could query all tasks for user without date filter

### 3. Invalid/Corrupted Positions

If existing tasks have invalid position strings:

- Falls back to string comparison for sorting
- Generates new position from minimum if parsing fails
- Ensures task creation never fails due to position issues

### 4. Position Collisions

If multiple tasks have the same position (legacy data):

- Sorts positions and finds maximum
- Generates next position after maximum
- New tasks will have unique positions going forward

### 5. Repository Errors

If fetching existing tasks fails:

- Falls back to minimum position
- Task creation continues successfully
- Prevents position generation from blocking task creation

## Database Schema

The `position` field is defined in the database schema:

```sql
position TEXT NOT NULL DEFAULT 'a0',
```

- Type: `TEXT` (allows lexorank string values)
- Default: `'a0'` (minimum lexorank value)
- Indexed: Tasks are ordered by `position ASC` in queries

## Testing

Comprehensive tests are located in `tests/infrastructure/utils/position.test.ts`:

- ✅ No existing tasks (returns min position)
- ✅ Single existing task (generates next position)
- ✅ Multiple existing tasks (appends to end)
- ✅ Unsorted positions (handles correctly)
- ✅ Invalid position strings (graceful fallback)
- ✅ Position collisions (handles duplicates)
- ✅ Repository errors (graceful fallback)
- ✅ Per user+date scoping (independent sequences)

## Future Enhancements

### Drag-and-Drop Reordering

When implementing drag-and-drop task reordering:

1. **Insert Between Items**: Use `LexoRank.between(a, b)` to generate position between two tasks
2. **Move to End**: Use `generatePositionForNewTask()` to append
3. **Move to Beginning**: Use `LexoRank.min()` or generate position before first task

### Position Rebalancing

If positions become too dense (many insertions between same two items):

1. Periodically rebalance positions
2. Regenerate positions for all tasks in a date
3. Maintain relative order while improving spacing

### Null Scheduled Date Handling

Currently, tasks with `null` scheduledDate use minimum position. Future options:

1. Query all tasks for user without date filter
2. Maintain separate position sequence for unscheduled tasks
3. Use a different position prefix (e.g., `z0`, `z1` for unscheduled)

## Dependencies

- **lexorank** (v1.0.5): NPM package providing Lexorank implementation
- TypeScript compatible (no additional type definitions needed)

## Related Documentation

- [Default Data Creation](./DEFAULT_DATA.md) - Mentions lexorank for categories
- [Database Schema](../supabase/migrations/001_initial_schema.sql) - Position field definition
- [Architecture Guidelines](../.cursor/rules/architecture.mdc) - CLEAN architecture principles
