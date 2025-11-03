# Configuration Module

Centralized configuration for the Nowly application.

## Overview

This directory contains all application configuration, including:

- **`env.ts`** - Type-safe environment variable access with validation
- **`constants.ts`** - Application-wide constants

## Environment Variables (`env.ts`)

### Usage

**✅ ALWAYS use the `env` module for environment variable access:**

```typescript
import { env, isDevelopment } from '@/src/config/env';

// ✅ Good
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;

if (isDevelopment) {
  console.log('Running in development mode');
}
```

**❌ NEVER access `process.env` directly:**

```typescript
// ❌ Bad - No type safety, no validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
```

### Security Rules

1. **Public Variables** (`NEXT_PUBLIC_*`)
   - Safe to use in client-side code
   - Exposed to the browser
   - Use for non-sensitive configuration

2. **Private Variables** (no prefix)
   - Server-side only
   - Never exposed to the browser
   - Protected by getter functions that throw errors if accessed client-side
   - Use for secrets, API keys, service role keys

```typescript
// ✅ Good - Public variable (client-side safe)
const appUrl = env.NEXT_PUBLIC_APP_URL;

// ✅ Good - Private variable (server-side only)
// This will throw an error if accessed in a client component
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
```

### Validation

Environment variables are validated on application startup (server-side only):

- **Required variables** must be present or the app will fail to start
- **Optional variables** fall back to sensible defaults
- Clear error messages guide you to fix missing variables

### Available Variables

See `.env.example` for a complete list of available environment variables.

### Setup Instructions

1. **Copy the example file:**

   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your actual values:**
   - Get Supabase credentials from: https://app.supabase.com/project/_/settings/api
   - Generate NextAuth secret: `openssl rand -base64 32`

3. **Never commit `.env.local`:**
   - This file is already in `.gitignore`
   - Contains sensitive credentials
   - Each developer/environment should have their own

4. **Update `.env.example` when adding new variables:**
   - Keep it in sync with actual requirements
   - Use placeholder values
   - Add comments explaining each variable

## Constants (`constants.ts`)

### Usage

Import and use constants throughout the application:

```typescript
import { APP_NAME, TASK_LIMITS, ROUTES } from '@/src/config/constants';

// App metadata
console.log(APP_NAME); // "Nowly"

// Validation limits
const isValidTitle = title.length <= TASK_LIMITS.TITLE_MAX_LENGTH;

// Navigation
router.push(ROUTES.DAILY);
```

### Categories

1. **Application Metadata**
   - Name, description, version

2. **Business Rules & Limits**
   - Task limits, category limits, recurring task configuration
   - Validation messages

3. **UI Configuration**
   - Themes, animation durations, toast settings
   - Date formats, pagination settings

4. **Domain Configuration**
   - Priority levels, daily sections, bonus sections
   - Recurrence frequency settings
   - Default categories

5. **Routes & Paths**
   - Application routes
   - API endpoints

6. **Storage Keys**
   - Local storage keys for persistence

### When to Add a Constant

Add values to `constants.ts` when they are:

- ✅ Used in multiple places across the codebase
- ✅ Business rules or limits defined in requirements
- ✅ Configuration that rarely changes
- ✅ Values that should be consistent across the app

Don't add constants for:

- ❌ Values used only once
- ❌ Temporary/experimental values
- ❌ Values that change per environment (use `env.ts` instead)

## File Organization

```
src/config/
├── README.md          # This file
├── env.ts             # Environment variables (runtime)
└── constants.ts       # Application constants (compile-time)
```

## Best Practices

### 1. Environment Variables

- Always validate required variables
- Provide sensible defaults for optional variables
- Document each variable in `.env.example`
- Use type-safe access via `env` module
- Never expose secrets to the client

### 2. Constants

- Group related constants together
- Use `as const` for immutable values
- Export individual constants or groups as needed
- Document complex configurations with comments
- Keep values DRY (Don't Repeat Yourself)

### 3. Security

- Never commit `.env.local` or any file with actual credentials
- Keep service role keys and secrets server-side only
- Use `NEXT_PUBLIC_*` prefix only for non-sensitive values
- Validate and sanitize all environment inputs

## Examples

### Adding a New Environment Variable

1. **Add to `.env.example`:**

   ```bash
   # My new feature configuration
   NEXT_PUBLIC_FEATURE_FLAG=true
   ```

2. **Add to `env.ts`:**

   ```typescript
   export const env = {
     // ... existing vars ...
     NEXT_PUBLIC_FEATURE_FLAG:
       getOptionalEnv('NEXT_PUBLIC_FEATURE_FLAG', 'false') === 'true',
   } as const;
   ```

3. **Use in your code:**

   ```typescript
   import { env } from '@/src/config/env';

   if (env.NEXT_PUBLIC_FEATURE_FLAG) {
     // Feature enabled
   }
   ```

### Adding a New Constant

1. **Add to `constants.ts`:**

   ```typescript
   export const MY_FEATURE = {
     MAX_ITEMS: 100,
     DEFAULT_SORT: 'name-asc' as const,
   } as const;
   ```

2. **Use in your code:**

   ```typescript
   import { MY_FEATURE } from '@/src/config/constants';

   const items = data.slice(0, MY_FEATURE.MAX_ITEMS);
   ```

## Troubleshooting

### "Missing required environment variable"

**Solution:** Ensure the variable is defined in your `.env.local` file.

```bash
# Check if .env.local exists
ls -la .env.local

# Copy from example if missing
cp .env.example .env.local

# Edit and fill in actual values
nano .env.local
```

### "Cannot access SUPABASE_SERVICE_ROLE_KEY on client-side"

**Solution:** This is a security error. Only use private variables in:

- Server Components
- Server Actions
- API Routes
- Server-side code

Never access them in Client Components (files with `'use client'`).

### Environment variables not updating

**Solution:**

1. Stop your dev server
2. Restart: `npm run dev`
3. Clear Next.js cache if needed: `rm -rf .next`

## Related Documentation

- [Project Structure](/.cursor/rules/project-structure.mdc)
- [Supabase Guidelines](/.cursor/rules/supabase-database.mdc)
- [Architecture Guidelines](/.cursor/rules/architecture.mdc)
