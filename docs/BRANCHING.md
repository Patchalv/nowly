# Database Branching Workflow

## Overview

Nowly uses Supabase database branching to provide isolated database environments for each Pull Request. This ensures safe testing of database changes without affecting the production database.

## How It Works

### Automatic Branch Creation

1. \***\*You create a feature branch and open a PR\*\***
   - Supabase automatically creates a preview database branch
   - Branch name matches your Git branch name
   - Preview branch is a complete copy of main database

2. \***\*Vercel creates a preview deployment\*\***
   - Automatically triggered by PR
   - Environment variables automatically point to preview branch
   - No manual configuration needed

3. \***\*You test in isolation\*\***
   - All changes happen in preview branch only
   - Main database is never affected
   - Multiple team members can work simultaneously

4. \***\*You merge the PR\*\***
   - Preview branch automatically deleted
   - Vercel preview deployment removed
   - Clean slate for next feature

## Branch Lifecycle`

[Open PR] → [Preview Branch Created] → [Auto-run Migrations] → [Vercel Preview Deploys]
↓
[Merge PR] ← [Preview Branch Deleted] ← [Testing Complete] ← [Test in Isolation]

`## Important Behaviors

### Trigger: PR Open, Not Branch Push

- ❌ Pushing a branch does NOT create preview branch
- ✅ Opening a PR creates preview branch
- **Why:** Prevents unnecessary branches for work-in-progress code

### All Migrations Run Automatically

- Preview branches automatically run all migrations in `supabase/migrations/`
- Migrations run in order (001, 002, 003, etc.)
- If a migration fails, the preview branch creation fails

### Environment Variables Auto-Update

- Supabase-Vercel integration automatically updates env vars
- Preview deployments get preview branch credentials
- No manual configuration needed

### Auto-Delete on Merge

- Preview branches delete when PR is merged
- Also delete after period of inactivity (~7 days)
- Cannot be configured - automatic cleanup

## Development Workflow

### Standard Feature Development

```bash`

# 1. Create feature branch from main

git checkout main
git pull origin main
git checkout -b feature/new-feature

# 2. Make your changes... code changes ...

# 3. Commit and push

git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# 4. Open PR on GitHub- Go to GitHub and click "Compare & pull request"- Wait 1-2 minutes for preview branch to create

# 5. Test on preview deployment- Click Vercel preview URL in PR checks- Test your changes in isolated environment

# 6. Make additional changes if needed

git add .
git commit -m "fix: address feedback"
git push origin feature/new-feature

# Preview branch automatically updates

# 7. Merge PR when ready

# Preview branch automatically deleted

`### Working with Database Migrations
```bash`

# 1. Create feature branch and open PR (triggers preview branch)

git checkout -b feature/add-tasks-table

# ... open PR on GitHub, wait for preview branch ...

# 2. Create migration file locallyCreate: supabase/migrations/004_add_tasks_table.sql

# 3. Test migration on preview branch- Go to Supabase Dashboard- Switch to preview branch- Navigate to SQL Editor- Copy/paste migration SQL- Run migration- Verify success

# 4. Test on preview deployment- Changes immediately available in preview deployment- Test thoroughly

# 5. If migration needs changes:- Update migration file locally- Push changes- Re-test on preview branch

# 6. Merge PR- Migration file goes to main branch- Apply migration to main branch manually via Dashboard- See "Applying Migrations to Main" below

# 7. Commit migration file

git add supabase/migrations/004_add_tasks_table.sql
git commit -m "feat: add tasks table migration"
git push origin feature/add-tasks-table

`### Applying Migrations to Main Branch

After merging a PR with a new migration:

1. Go to Supabase Dashboard
2. **Switch to main branch**
3. Navigate to SQL Editor
4. Open your migration file from `supabase/migrations/`
5. Copy the SQL
6. Paste into SQL Editor
7. Run the migration
8. Verify success in Table Editor
9. Document migration was applied (optional: track in migration_history table)

## Cost Management

Preview branches only cost when actively used (queries running).

**Best Practices:**

- Merge PRs promptly when testing is complete
- Close draft PRs if not actively working on them
- Reopen PR when ready to continue (refreshes preview branch)
- For non-database changes (docs, UI only), consider direct commits to main after local testing

**What Costs Money:**

- ✅ Active queries on preview branch (when testing)
- ✅ Preview branch compute time (only when in use)
- ❌ Inactive preview branches (paused automatically)
- ❌ Deleted preview branches (zero cost)

## Troubleshooting

### Preview Branch Not Created

**Symptoms:** Opened PR but no preview branch in Supabase

**Causes:**

1. GitHub integration not connected
2. Branch pushed but PR not opened
3. Migration failed during branch creation

**Solutions:**

1. Check Supabase Dashboard > Settings > Integrations > GitHub (should show "Connected")
2. Ensure PR is actually opened (not just branch pushed)
3. Check migration syntax - preview branch creation fails if migration errors
4. Check Supabase logs in project settings

### Preview Deployment Uses Wrong Database

**Symptoms:** Preview deployment connects to main database instead of preview branch

**Causes:**

1. Vercel-Supabase integration not installed
2. Environment variables not updated
3. Race condition (deployment ran before env vars updated)

**Solutions:**

1. Verify integration: Vercel Dashboard > Integrations > Supabase (should show "Installed")
2. Check environment variables in preview deployment details
3. Redeploy preview deployment (may fix race condition)
4. Close and reopen PR to refresh everything

### Migration Already Exists Error

**Symptoms:** Preview branch creation fails with "migration already exists"

**Cause:** Migration file number conflicts with existing migration

**Solution:**

1. Check existing migrations: `ls supabase/migrations/`
2. Rename your migration to next sequential number
3. Push updated migration file
4. Close and reopen PR

### Data Persists Between Preview Branches

**Symptoms:** Data from previous preview branch appears in new preview branch

**Cause:** This is expected behavior - preview branches are copies of main, not clean slates

**Solution:**

1. This is normal - preview branches copy main database state
2. If you need clean slate, manually delete test data before merging
3. Consider seed files for consistent test data

## Additional Resources

- [Supabase Branching Docs](https://supabase.com/docs/guides/deployment/branching)
- [Vercel Preview Deployments](https://vercel.com/docs/concepts/deployments/preview-deployments)
- [Supabase-Vercel Integration](https://vercel.com/integrations/supabase)

## Questions?

If you encounter issues not covered here, add them to `docs/TROUBLESHOOTING.md` after resolving.
