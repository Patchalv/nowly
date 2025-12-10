# Migration to Unified Logging System

This document provides a step-by-step guide for migrating from the old error handling patterns to the new unified logging system.

## Overview

The unified logging system provides:

- ✅ Clean architecture boundaries (error handling separate from UI feedback)
- ✅ Layer-appropriate methods
- ✅ Consistent structured logging
- ✅ Smart sampling in production
- ✅ Better developer experience

## Status

**Phase 1-4: ✅ COMPLETE**

- ✅ Core logging system implemented
- ✅ Comprehensive documentation created
- ✅ Cursor rules updated
- ✅ Architecture guidelines updated
- ✅ Smart log sampling configured

**Phase 5: ⏳ IN PROGRESS**

- Migration will happen gradually file-by-file
- New code should use the new system
- Old files will be migrated as they are worked on

## Quick Migration Guide

### Old Pattern → New Pattern

#### Server Actions

```typescript
// ❌ OLD
import { handleError } from '@/src/shared/errors/handler';

if (authError) {
  const error = handleError.return(authError);
  return { success: false, error };
}

// ✅ NEW
import { handleError } from '@/src/shared/logging';

if (authError) {
  const error = handleError.log(authError);
  return { success: false, error: error.message };
}
```

#### Validation Errors

```typescript
// ❌ OLD
if (!result.success) {
  logger.error('Validation failed', { error: result.error });
}

// ✅ NEW
if (!result.success) {
  handleError.validation('Validation failed', result.error);
}
```

#### Repositories

```typescript
// ❌ OLD
import { handleError } from '@/src/shared/errors/handler';

if (error) {
  handleError.throw(error);
}

// ✅ NEW
import { handleError } from '@/src/shared/logging';

if (error) {
  handleError.throw(error);
}
```

#### Client Components

```typescript
// ❌ OLD
import { handleError } from '@/src/shared/errors/handler';

onError: (error) => {
  handleError.toast(error, 'Failed to create task');
};

// ✅ NEW
import { showError } from '@/src/presentation/utils/error-display';

onError: (error) => {
  showError(error, 'Failed to create task');
};
```

## Migration Checklist

When migrating a file:

- [ ] Update imports from `@/src/shared/errors/handler` to `@/src/shared/logging`
- [ ] Replace `handleError.return()` with `handleError.log()`
- [ ] Replace `handleError.toast()` with `showError()` (client components only)
- [ ] Add `handleError.validation()` for validation errors
- [ ] Add context objects to all logger calls
- [ ] Remove direct Sentry logger imports
- [ ] Test the changes

## Priority Order

1. **High Priority** - New files (use new system from the start)
2. **Medium Priority** - Files being actively modified
3. **Low Priority** - Stable files (migrate when convenient)

## Resources

- **Complete Guide**: [docs/LOGGING_AND_ERROR_HANDLING.md](LOGGING_AND_ERROR_HANDLING.md)
- **Code Examples**: [docs/examples/logging-examples.md](examples/logging-examples.md)
- **Cursor Rules**: [.cursor/rules/logging.md](../.cursor/rules/logging.md)
- **Architecture**: [.cursor/rules/architecture.mdc](../.cursor/rules/architecture.mdc)

## Questions?

See the troubleshooting section in [LOGGING_AND_ERROR_HANDLING.md](LOGGING_AND_ERROR_HANDLING.md) or refer to the code examples.
