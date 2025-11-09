## 📦 Project Structure

```text
nowly/
├── app/                                # Next.js App Router root
│   ├── (public)/                       # Publicly accessible routes
│   │   ├── login/                      # Supabase Auth
│   │   │   └── page.tsx
│   │   ├── reset-password/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   │
│   ├── (protected)/                    # Authenticated routes
│   │   ├── layout.tsx                  # Dashboard layout (sidebar + header)
│   │   ├── all-tasks/                  # Master list
│   │   │   └── page.tsx
│   │   ├── daily/                      # "Daily" focused task view (Defaults to "today")
│   │   │   └── page.tsx
│   │   ├── recurring/                  # Recurring items
│   │   │   └── page.tsx
│   │   └── settings/                   # Settings / Account view
│   │       └── page.tsx
│   │
│   ├── actions/                        # Server actions
│   │   ├── auth/                       # Authentication server actions
│   │   │   ├── loginAction.ts
│   │   │   ├── logoutAction.ts
│   │   │   ├── resetPasswordConfirmAction.ts
│   │   │   ├── resetPasswordRequestAction.ts
│   │   │   └── signupAction.ts
│   │   ├── createTaskAction.ts
│   │   └── updateTaskAction.ts
│   │
│   ├── auth/                           # Auth Confirmation Route Handler
│   │   └── confirm/
│   │       └── route.ts
│   ├── test/                           # Test pages (Temporary - to be removed)
│   │
│   ├── global-error.tsx
│   ├── layout.tsx                      # Root layout (theme, providers, metadata)
│   ├── globals.css                     # Tailwind global styles
│   └── page.tsx                        # Default redirect (e.g. to /login or /today)
│
├── src/
│   ├── presentation/                   # UI layer (React components + hooks)
│   │   ├── components/                 # UI components (Shadcn/UI, shared)
│   │   ├── hooks/                      # UI state hooks (useUser, useTheme)
│   │   ├── pages/                      # Optional shared UI views
│   │   └── providers/                  # Theme, Query, Supabase providers
│   │
│   ├── application/                    # Use cases (business logic)
│   │   ├── tasks/                      # Task-specific domain actions
│   │   │   ├── createTask.usecase.ts
│   │   │   ├── updateTask.usecase.ts
│   │   │   ├── listTasks.usecase.ts
│   │   │   └── deleteTask.usecase.ts
│   │   └── categories/
│   │       ├── createCategory.usecase.ts
│   │       └── listCategories.usecase.ts
│   │
│   ├── domain/                         # Core entities and rules
│   │   ├── models/                     # Entity definitions (no framework deps)
│   │   │   ├── Task.ts
│   │   │   ├── Category.ts
│   │   │   └── User.ts
│   │   ├── types/                      # Value objects, enums
│   │   └── validation/                 # Zod schemas for domain validation
│   │
│   ├── infrastructure/                 # Framework & DB layer (Supabase)
│   │   ├── supabase/                   # Supabase client & data adapters
│   │   │   ├── client.ts
│   │   │   ├── types.ts                # Database types (snake_case)
│   │   │   └── taskRepository.ts
│   │   ├── repositories/               # Repository interfaces + impls
│   │   │   ├── ITaskRepository.ts
│   │   │   ├── SupabaseCategoryRepository.ts
│   │   │   └── SupabaseTaskRepository.ts
│   │   ├── services/                   # External APIs, caching, etc.
│   │   └── utils/                      # Infra-level utils
│   │
│   ├── config/                         # Env vars, constants
│   │   ├── constants.ts
│   │   ├── env.ts
│   │   └── query-keys.ts
│   │
│   └── shared/                         # Common code
│       ├── utils/                      # Formatting, dates, etc.
│       ├── types/                      # Global types
│       └── errors/                     # Custom error classes
│
├── docs/                               # Documentation
├── public/
├── tests/                              # Vitest test setup
├── .env.example
├── tailwind.config.ts
├── next.config.mjs
└── package.json
```
