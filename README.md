# 🦉 Nowly

A modern, productivity-focused task management application built with Next.js 15 and Clean Architecture principles.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Architecture](#architecture)
- [Scripts](#scripts)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Resources](#resources)

---

## 🎯 Overview

**Nowly** is a "Today-first" task management web app designed to help users focus on what matters today. It features:

- **Daily-focused task view** - Prioritize tasks for today with morning/afternoon/evening sections
- **Master task list** - Comprehensive view of all tasks with advanced filtering and grouping
- **Category management** - Organize tasks with color-coded categories
- **Recurring tasks** - Automatically generate tasks based on custom recurrence patterns
- **Flexible scheduling** - Schedule tasks, set due dates, and manage priorities
- **Responsive design** - Beautiful, modern UI built with TailwindCSS and Shadcn/UI
  Production url: https://nowly-sand.vercel.app/

## 🛠️ Tech Stack

### Frontend

- **[Next.js 15](https://nextjs.org/)** - React framework with App Router and Server Components
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[TailwindCSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Shadcn/UI](https://ui.shadcn.com/)** - Accessible component library
- **[Lucide React](https://lucide.dev/)** - Icon library

### Backend & Database

- **[Supabase](https://supabase.com/)** - Backend-as-a-Service (PostgreSQL + Auth + Realtime)
- **[React Query (TanStack Query)](https://tanstack.com/query/latest)** - Server state management (to be added)
- **[Zod](https://zod.dev/)** - Schema validation (to be added)

### Development Tools

- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[Husky](https://typicode.github.io/husky/)** - Git hooks
- **[lint-staged](https://github.com/okonet/lint-staged)** - Run linters on staged files

### Architecture

- **Clean Architecture** - Domain-driven design with clear layer separation
- **Repository Pattern** - Abstracted data access layer
- **Use Cases** - Business logic isolated from frameworks

---

## ✅ Prerequisites

Before you begin, ensure you have the following installed:

- **[Node.js](https://nodejs.org/)** (v20.x or higher)

  ```bash
  node --version  # Should be v20.x or higher
  ```

- **[npm](https://www.npmjs.com/)** (comes with Node.js)

  ```bash
  npm --version  # Should be 10.x or higher
  ```

- **[Git](https://git-scm.com/)**

  ```bash
  git --version
  ```

- **[Supabase Account](https://supabase.com/)** - You'll need a project set up

---

## 📁 Project Structure

```
nowly/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Public routes (landing, auth)
│   ├── (protected)/              # Authenticated routes (dashboard, tasks)
│   ├── actions/                  # Server Actions
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
│
├── src/
│   ├── presentation/             # UI Layer (React components)
│   │   ├── components/           # Reusable UI components
│   │   ├── hooks/                # Custom React hooks
│   │   ├── pages/                # Page-level components
│   │   └── providers/            # Context providers
│   │
│   ├── application/              # Application Layer (Use Cases)
│   │   ├── tasks/                # Task-related business logic
│   │   └── categories/           # Category-related business logic
│   │
│   ├── domain/                   # Domain Layer (Entities & Rules)
│   │   ├── model/                # Domain entities (Task, Category, etc.)
│   │   ├── types/                # Enums, value objects
│   │   └── validation/           # Zod schemas
│   │
│   ├── infrastructure/           # Infrastructure Layer (External Services)
│   │   ├── supabase/             # Supabase client & types
│   │   ├── repositories/         # Repository implementations
│   │   ├── services/             # External services
│   │   └── utils/                # Infrastructure utilities
│   │
│   ├── config/                   # Configuration
│   │   ├── env.ts                # Environment variables
│   │   └── constants.ts          # Application constants
│   │
│   └── shared/                   # Shared utilities
│       └── utils/                # Common utilities (cn, formatters, etc.)
│
├── tests/                        # Tests (mirrors src/ structure)
│   ├── domain/
│   ├── application/
│   └── infrastructure/
│
├── public/                       # Static assets
├── supabase/                     # Supabase migrations (to be added)
├── .cursor/                      # AI assistant rules & guidelines
└── [config files]                # ESLint, TypeScript, Tailwind, etc.
```

### Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│  Presentation Layer (React Components, Hooks)      │
│  • Client Components                               │
│  • Server Components                               │
│  • Server Actions                                  │
└──────────────────────┬──────────────────────────────┘
                       │ uses
                       ▼
┌─────────────────────────────────────────────────────┐
│  Application Layer (Use Cases)                     │
│  • Business Logic                                  │
│  • Orchestration                                   │
└──────────────────────┬──────────────────────────────┘
                       │ uses
                       ▼
┌─────────────────────────────────────────────────────┐
│  Domain Layer (Entities, Types, Validation)        │
│  • Pure TypeScript                                 │
│  • No framework dependencies                       │
└─────────────────────────────────────────────────────┘
                       ▲
                       │ implements
                       │
┌─────────────────────────────────────────────────────┐
│  Infrastructure Layer (Supabase, Repositories)     │
│  • Database access                                 │
│  • External services                               │
│  • Data transformation                             │
└─────────────────────────────────────────────────────┘
```

**Dependency Rule:** Dependencies only point inward. Outer layers depend on inner layers, never the reverse.

---

## 🚀 Getting Started

Follow these steps to set up the project on your local machine:

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/nowly.git
cd nowly
```

### 2. Install Dependencies

**⚠️ Important:** This project uses **npm only**. Do not use yarn, pnpm, or bun.

```bash
npm install
```

### 3. Set Up Environment Variables

1. **Copy the example environment file:**

   ```bash
   cp .env.example .env.local
   ```

2. **Get your Supabase credentials:**
   - Go to your [Supabase Dashboard](https://app.supabase.com/)
   - Select your project (or create a new one)
   - Navigate to **Settings > API**
   - Copy the following values:
     - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
     - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ keep secret!)

3. **Edit `.env.local` and fill in your values:**

   ```bash
   # Public variables (safe for client-side)
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Private variables (server-side only)
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   NODE_ENV=development
   ```

4. **⚠️ Security Note:**
   - **Never commit `.env.local`** - It contains secrets!
   - Only use `NEXT_PUBLIC_*` variables for non-sensitive data
   - Service role keys should **never** be exposed to the client

### 4. Set Up the Database

**Option A: Use Supabase Dashboard (Recommended for now)**

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the migration files from `supabase/migrations/` (once created)

**Option B: Local Supabase (Future)**

```bash
# This will be available once local development is set up
npx supabase db push
```

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

### 6. Verify Setup

✅ You should see:

- The app running without errors
- No console errors about missing environment variables
- Able to access the landing page

---

### Running the App

```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build

# Production server
npm run start
```

### Code Quality

```bash
# Lint your code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting without modifying
npm run format:check
```

### Recommended Workflow

1. **On starting any planned changes:** Create a feature branch:
   Create a feature branch: `git checkout -b feature/your-feature-name`

2. **Make changes:**

3. **Before committing:**

   ```bash
   npm run format && npm run lint:fix
   ```

4. **Pre-commit hooks** (Husky) will automatically:
   - Format staged files with Prettier
   - Lint staged files with ESLint
   - Block commits if there are errors

5. **Push branch** `git push origin feature/your-feature-name`

6. **Create Pull Request on GitHub**
   - Review changes in PR
   - Review changes in Preview branch
   - Merge to main

7. **Writing code:**
   - Follow the [Architecture Guidelines](./.cursor/rules/architecture.mdc)
   - Use type-safe environment variables from `src/config/env.ts`
   - Import constants from `src/config/constants.ts`
   - Prefer Server Components over Client Components
   - Transform database types at repository boundaries

---

## 🏗️ Architecture

Nowly follows **Clean Architecture** principles with strict layer separation:

### Layer Responsibilities

| Layer              | Purpose                      | Dependencies           | Examples                        |
| ------------------ | ---------------------------- | ---------------------- | ------------------------------- |
| **Domain**         | Business entities and rules  | None (pure TypeScript) | `Task`, `Category`, Zod schemas |
| **Application**    | Business logic (use cases)   | Domain only            | `createTask`, `updateTask`      |
| **Infrastructure** | External services, DB access | Domain, Application    | Supabase, repositories          |
| **Presentation**   | UI components and hooks      | Application, Domain    | React components, hooks         |

### Key Principles

1. **Dependencies point inward** - Outer layers depend on inner layers, never reverse
2. **Framework independence** - Domain and Application layers have no framework dependencies
3. **Testability** - Business logic is testable without UI or database
4. **Repository pattern** - Data access is abstracted behind interfaces
5. **Type safety** - Transform database types (snake_case) to domain types (camelCase) at boundaries

### Example: Creating a Task

```typescript
// 1. Domain Layer - Entity definition
// src/domain/model/Task.ts
export interface Task {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Application Layer - Business logic
// src/application/tasks/createTask.usecase.ts
export async function createTask(
  input: CreateTaskInput,
  userId: string,
  repository: TaskRepository
): Promise<Task> {
  // Validation, business rules, orchestration
  return await repository.create({ ...input, userId });
}

// 3. Infrastructure Layer - Data access
// src/infrastructure/repositories/SupabaseTaskRepository.ts
export class SupabaseTaskRepository implements TaskRepository {
  async create(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    // Transform domain → database types
    // Call Supabase
    // Transform database → domain types
  }
}

// 4. Presentation Layer - UI
// app/actions/createTaskAction.ts (Server Action)
('use server');
export async function createTaskAction(formData: FormData) {
  const repository = new SupabaseTaskRepository(supabase);
  return await createTask(data, userId, repository);
}
```

**📚 For detailed architecture guidelines, see:**

- [Architecture Guidelines](./.cursor/rules/architecture.mdc)
- [TypeScript Guidelines](./.cursor/rules/typescript.mdc)
- [React Guidelines](./.cursor/rules/react.mdc)
- [Forms Guidelines](./.cursor/rules/forms.mdc)
- [Supabase Guidelines](./.cursor/rules/supabase-database.mdc)

---

## 📜 Scripts

| Command                | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Start development server (http://localhost:3000) |
| `npm run build`        | Build for production                             |
| `npm run start`        | Start production server                          |
| `npm run lint`         | Lint code with ESLint                            |
| `npm run lint:fix`     | Auto-fix linting issues                          |
| `npm run format`       | Format code with Prettier                        |
| `npm run format:check` | Check formatting without modifying               |

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Missing required environment variable"

**Problem:** App fails to start with environment variable error.

**Solution:**

```bash
# Ensure .env.local exists
ls -la .env.local

# If missing, copy from example
cp .env.example .env.local

# Edit and fill in your Supabase credentials
```

#### 2. Environment variables not updating

**Problem:** Changed `.env.local` but values aren't reflected.

**Solution:**

```bash
# Stop the dev server (Ctrl+C)
# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev
```

#### 3. "Cannot access SUPABASE_SERVICE_ROLE_KEY on client-side"

**Problem:** Security error when trying to use private variable in Client Component.

**Solution:**

- Private variables (without `NEXT_PUBLIC_` prefix) can only be used in:
  - Server Components
  - Server Actions
  - API Routes
- Never use them in Client Components (files with `'use client'`)

#### 4. Husky pre-commit hook fails

**Problem:** Git commit is blocked by linting/formatting errors.

**Solution:**

```bash
# Fix linting and formatting issues
npm run format && npm run lint:fix

# Try committing again
git commit -m "your message"
```

#### 5. Port 3000 already in use

**Problem:** Another service is using port 3000.

**Solution:**

```bash
# Kill the process using port 3000 (macOS/Linux)
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

#### 6. Module not found errors after pulling changes

**Problem:** Missing dependencies after pulling from git.

**Solution:**

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

#### 7. TypeScript errors in editor

**Problem:** VS Code or Cursor shows TypeScript errors.

**Solution:**

```bash
# Restart TypeScript server in your editor
# In VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"

# Or rebuild
npm run build
```

---

## 🤝 Contributing

### Development Guidelines

1. **Read the architecture guidelines** in `.cursor/rules/` before coding
2. **Follow the coding standards:**
   - Use TypeScript strictly (no `any` types)
   - Follow Clean Architecture principles
   - Write self-documenting code with clear naming
   - Add JSDoc comments for complex logic

3. **Before committing:**

   ```bash
   # Format and lint
   npm run format && npm run lint:fix

   # Ensure it builds
   npm run build
   ```

4. **Commit message format:**

   ```
   feat: add task filtering by category
   fix: resolve date formatting issue
   perf: optimize task list rendering
   docs: update setup instructions
   ```

5. **Pull request process:**
   - Create a feature branch from `main`
   - Keep PRs focused and small
   - Include screenshots for UI changes
   - Update documentation if needed
   - Ensure all checks pass

### Project Conventions

- **Use npm only** - No yarn, pnpm, or bun
- **Absolute imports** - Use `@/src/...` or `@/app/...`
- **File naming:**
  - Components: `PascalCase.tsx`
  - Use cases: `camelCase.usecase.ts`
  - Repositories: `SupabasePascalCase.ts`
  - Hooks: `useSomething.ts`
- **Folder naming:** `kebab-case`

---

## 📚 Resources

### Documentation

- **Project Guidelines:**
  - [Architecture Guidelines](./.cursor/rules/architecture.mdc)
  - [TypeScript Guidelines](./.cursor/rules/typescript.mdc)
  - [React Guidelines](./.cursor/rules/react.mdc)
  - [Forms Guidelines](./.cursor/rules/forms.mdc)
  - [Supabase & Database Guidelines](./.cursor/rules/supabase-database.mdc)
  - [Code Style Guidelines](./.cursor/rules/code-style.mdc)

- **Module Documentation:**
  - [Configuration Module](./src/config/README.md)

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Shadcn/UI Documentation](https://ui.shadcn.com/)
- [Zod Documentation](https://zod.dev/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)

### Community

- [GitHub Issues](https://github.com/yourusername/nowly/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/yourusername/nowly/discussions) - Questions and community chat

---

## 📄 License

This project is private and proprietary.

---

## 🎉 Welcome!

Thank you for contributing to Nowly! If you have any questions, don't hesitate to:

- Check the documentation in `.cursor/rules/`
- Open a GitHub Discussion
- Ask in your team chat

Happy coding! 🦉
