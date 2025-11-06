`# Troubleshooting Guide

Common issues and solutions for Nowly development.

## Database Branching Issues

### Preview Branch Not Created

\***\*Problem:\*\*** Opened PR but no preview branch appears in Supabase

\***\*Possible Causes:\*\***

1. GitHub integration not connected
2. PR not actually opened (just branch pushed)
3. Migration failed during branch creation
4. Integration permissions issue

\***\*Solutions:\*\***
```bash`

# Check 1: Verify GitHub integration- Go to Supabase Dashboard > Settings > Integrations- Should show "GitHub: Connected"- If not, reconnect integration

# Check 2: Verify PR is open- Go to GitHub repository- Check "Pull requests" tab- PR should be in "Open" state

# Check 3: Check for migration errors- Go to Supabase Dashboard > Logs- Look for errors related to migration- Fix migration syntax and close/reopen PR

# Check 4: Reconnect integration

# Supabase Dashboard > Settings > Integrations > GitHub

# Click "Disconnect"

# Click "Connect to GitHub" again

# Authorize and select repository

`### Preview Deployment Uses Wrong Database

**Problem:** Preview deployment connects to production database instead of preview branch

**Symptoms:**

- Test data appears in production database
- Environment variables show production URL
- Changes affect real users (critical!)

**Solutions:**
```bash`

# Solution 1: Verify Vercel integration installed- Go to Vercel Dashboard- Click on project- Settings > Integrations- Look for "Supabase" - should show "Installed"- If not, go to vercel.com/integrations/supabase and add

# Solution 2: Check environment variables- Vercel Dashboard > Project > Deployments- Click on preview deployment- Check "Environment Variables" section- NEXT_PUBLIC_SUPABASE_URL should be different from production- Should include branch identifier in URL

# Solution 3: Redeploy preview- Go to Vercel deployment- Click "..." menu- Click "Redeploy"- Sometimes fixes race condition

# Solution 4: Close and reopen PR

# GitHub > Close PR

# Wait 1 minute

# Reopen PR

# Forces fresh preview branch and deployment

`### Environment Variables Not Updating

**Problem:** Preview deployment still shows old environment variables

**Solution:**
```bash`

# Option 1: Manual redeploy- Vercel Dashboard > Deployment > Redeploy

# Option 2: Push new commit

git commit --allow-empty -m "trigger redeploy"
git push origin feature/branch-name

# Option 3: Check integration

# Supabase Dashboard > Integrations > Vercel

# Should show "Connected"

# Disconnect and reconnect if needed

`## Local Development Issues

### Cannot Connect to Supabase

**Problem:** Local app shows connection errors

**Solutions:**
```bash`

# Check 1: Verify .env.local exists

ls -la .env.local

# Check 2: Verify environment variables

cat .env.local

# Should show:

# NEXT_PUBLIC_SUPABASE_URL=https://...

# NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Check 3: Restart dev server

# Stop current server (Ctrl+C)

npm run dev

# Check 4: Check Supabase project is active

# Go to Supabase Dashboard

# Verify main branch is not paused

# Check project settings > General > Status

`### RLS Policy Errors

**Problem:** "Permission denied" or "RLS policy violation" errors

**Solutions:**
```bash`

# Check 1: Verify user is authenticated- Check auth state in browser dev tools- Look for auth.users() in network tab

# Check 2: Verify RLS policies exist- Supabase Dashboard > Authentication > Policies- Should show policies for tables you're querying

# Check 3: Test policy in SQL Editor

# Supabase Dashboard > SQL Editor:

SELECT \* FROM your_table WHERE user_id = auth.uid();

# Should return rows if policy is correct

# Check 4: Verify user_id matches

# Check that table's user_id column matches auth.uid()

SELECT auth.uid(); -- Your user ID
SELECT user_id FROM your_table; -- Should match

`## Migration Issues

### Migration Already Exists

**Problem:** "Migration already exists" error when creating preview branch

**Solution:**
```bash`

# Check existing migrations

ls supabase/migrations/

# Output example:001_initial_schema.sql002_rls_policies.sql003_default_data.sql

# Rename your migration to next number

mv supabase/migrations/003_my_migration.sql

supabase/migrations/004_my_migration.sql

# Commit and push

git add supabase/migrations/004_my_migration.sql
git commit -m "fix: renumber migration"
git push origin feature/branch-name

`### Migration Fails on Preview Branch

**Problem:** Preview branch creation fails with SQL error

**Solutions:**
```bash`

# Check 1: Test migration locallyCopy SQL from migration fileGo to Supabase Dashboard > SQL Editor (main branch)Paste and runFix any syntax errors

# Check 2: Check dependenciesEnsure referenced tables/functions existCheck for typos in table names

# Check 3: Use transactions

# Wrap migration in BEGIN/COMMIT

BEGIN;
-- Your migration SQL
COMMIT;

# Check 4: Make migration idempotent

# Use IF NOT EXISTS

CREATE TABLE IF NOT EXISTS...
ALTER TABLE IF EXISTS...

`### Migration Works on Preview but Fails on Main

**Problem:** Migration succeeds on preview branch but fails when applied to main

**Possible Causes:**

1. Schema drift between branches
2. Data in main violates new constraints
3. Missing dependencies

**Solutions:**
```bash`

# Solution 1: Check schema differences- Compare main and preview branch schemas- Look for missing tables, columns, indexes

# Solution 2: Check existing data- Query main branch data that would violate constraints- Clean or migrate data first

# Solution 3: Run migration in transaction

BEGIN;
-- Migration SQL
COMMIT;
-- If fails, automatically rolls back

# Solution 4: Test on main branch copy

# Create temporary preview branch from main

# Test migration there first

`## Vercel Deployment Issues

### Build Fails on Vercel

**Problem:** Vercel preview deployment fails to build

**Solutions:**
```bash`

# Check 1: Verify builds locally

npm run build

# Check 2: Check Vercel build logs- Vercel Dashboard > Deployment > View Function Logs- Look for specific error messages

# Check 3: Check environment variables- Vercel > Settings > Environment Variables- Ensure all required vars exist for Preview environment

# Check 4: Check Node version

# Vercel uses Node 18 by default

# Verify package.json engines field matches

{
"engines": {
"node": ">=18.0.0"
}
}

`### Preview Deployment Slow or Timing Out

**Problem:** Preview deployment takes forever or times out

**Solutions:**
```bash`

# Check 1: Verify Supabase branch is active- Supabase Dashboard > Select preview branch- Should show "Active" status

# Check 2: Check Supabase compute usage- Dashboard > Settings > Usage- May be throttled if over quota

# Check 3: Optimize queries- Check for missing indexes- Review slow query logs- Add indexes in migration

# Check 4: Check preview branch hasn't paused

# Inactive branches auto-pause after 24 hours

# Access dashboard to wake it up

## Authentication Issues

### Email Confirmation Not Received

**Problem:** User signs up but doesn't receive confirmation email

**Solutions:**

1. **Check spam folder**
   - Email might be filtered as spam
   - Add noreply@mail.app.supabase.io to contacts

2. **Check email address**
   - Verify email was typed correctly
   - Try signing up again with correct email

3. **Check Supabase email settings**
   - Go to Supabase Dashboard → Authentication → Email Templates
   - Verify "Confirm Signup" template is enabled
   - Check rate limits: Default is 2 emails/hour in development

4. **Check email template configuration**
   - Template should use: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/daily`
   - See [AUTH_CONFIG.md](./AUTH_CONFIG.md) for details

### PKCE Validation Failed Error

**Problem:** User clicks email link but gets "PKCE validation failed" error

**Cause:** Email template is using old `code` parameter instead of `token_hash`

**Solution:**

Update Supabase email templates (Dashboard → Authentication → Email Templates):

**Password Reset:**
\`\`\`
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password/confirm
\`\`\`

**Email Confirmation:**
\`\`\`
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/daily
\`\`\`

### Authentication Link Invalid or Expired

**Problem:** User clicks email link but sees "Authentication link is invalid or has expired"

**Causes:**

1. **Link expired** - Links are valid for 24 hours
2. **Link already used** - Can only be used once
3. **Email template misconfigured** - Wrong URL format

**Solutions:**

1. **Request new link**
   - For password reset: Go to `/reset-password` and submit again
   - For email confirmation: Contact support (can't resend automatically)

2. **Check email template**
   - Must include `token_hash`, `type`, and `next` parameters
   - See [AUTH_CONFIG.md](./AUTH_CONFIG.md) for correct format

3. **Check Supabase Auth logs**
   - Dashboard → Authentication → Logs
   - Look for detailed error messages

### Session Expired or Not Found

**Problem:** User arrives at password reset form but session is not found

**Cause:** User navigated directly to `/reset-password/confirm` without going through email link

**Solution:**

1. **Use the email link**
   - Password reset MUST go through email link
   - Link exchanges token for valid session

2. **Check redirect flow**
   - Email → `/auth/confirm` → `/reset-password/confirm`
   - If any step is skipped, session won't exist

3. **Request new reset link**
   - Go to `/reset-password`
   - Enter email and submit
   - Use the new link from email

### Redirect Loop After Login

**Problem:** After logging in, page keeps redirecting in a loop

**Causes:**

1. **Middleware not working** - Session not being set properly
2. **Cookie issues** - Cookies blocked or not persisting
3. **Proxy configuration** - Check `proxy.ts` export name

**Solutions:**

\`\`\`bash

# Check 1: Verify proxy.ts exports correctly

# File should export function named 'proxy'

# File should have proper matcher config

# Check 2: Clear browser cookies

# Chrome: Settings → Privacy → Clear browsing data

# Select "Cookies and other site data"

# Check 3: Check browser console

# Look for CORS errors or cookie warnings

# Check 4: Verify environment variables

cat .env.local

# Should have NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

\`\`\`

### Cannot Login with Correct Credentials

**Problem:** User enters correct email/password but login fails

**Solutions:**

1. **Email not confirmed**
   - Check if email verification is required (it is by default)
   - User must click confirmation link in signup email first
   - Error message should say "Please verify your email address"

2. **Check Supabase Auth logs**
   - Dashboard → Authentication → Logs
   - Look for failed login attempts
   - Check specific error messages

3. **Password requirements**
   - Minimum 6 characters (Supabase default)
   - Check if password meets requirements

4. **Account locked**
   - Too many failed attempts might lock account
   - Wait 1 hour or contact support

### Signup Form Not Working

**Problem:** Signup form submits but nothing happens

**Solutions:**

\`\`\`bash

# Check 1: Browser console errors

# F12 → Console tab

# Look for JavaScript errors or network failures

# Check 2: Network tab

# F12 → Network tab

# Find the signup request

# Check response status and error message

# Check 3: Verify Server Action

# File: app/actions/signupAction.ts

# Should exist and be properly exported

# Check 4: Check Supabase connection

# Go to /test/supabase-connection

# Should show successful connection

\`\`\`

### Session Not Persisting Across Reloads

**Problem:** User logs in successfully but is logged out on page refresh

**Causes:**

1. **Cookies not saving** - Browser settings block cookies
2. **Middleware not refreshing** - Session not being maintained
3. **Incognito/Private mode** - Cookies cleared on close

**Solutions:**

\`\`\`bash

# Check 1: Verify cookies are enabled

# Browser settings → Privacy → Allow cookies

# Check 2: Check browser storage

# F12 → Application → Cookies

# Should see supabase auth cookies

# Check 3: Verify middleware is running

# Add console.log in proxy.ts to verify it runs

# Should see logs on every page navigation

# Check 4: Check auth configuration

# File: src/infrastructure/supabase/client.ts

# createBrowserClient should NOT have persistSession: false

\`\`\`

### Cannot Access Protected Routes

**Problem:** Logged in but still redirected to login page

**Causes:**

1. **Route not properly protected** - Check PUBLIC_ROUTES config
2. **Session not recognized** - Middleware not reading session
3. **Timing issue** - Session not loaded yet

**Solutions:**

\`\`\`bash

# Check 1: Verify PUBLIC_ROUTES configuration

# File: src/config/constants.ts

# Protected routes should NOT be in PUBLIC_ROUTES array

# Check 2: Check middleware logic

# File: proxy.ts

# Verify isPublicRoute function works correctly

# Check 3: Check server logs

# Look for auth errors in terminal

# Middleware should call supabase.auth.getUser()

# Check 4: Force refresh session

# Log out completely

# Clear browser cookies

# Log in again

\`\`\`

---

## Getting More Help

### Still Stuck?

1. Check Supabase Dashboard logs
2. Check Vercel deployment logs
3. Check browser console for errors
4. Review recent changes (git log)
5. Create GitHub issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots of errors
   - Environment (local/preview/production)

### Useful Commands

```bash`

# Check Git status

git status

# Check recent commits

git log --oneline -10

# Check environment variables

cat .env.local

# Check Supabase CLI (if installed)

supabase status

# Check running processes

lsof -i :3000 # Check if port 3000 in use

# Clear node_modules and reinstall

rm -rf node_modules package-lock.json
npm install

`### Useful Links

- [Supabase Status Page](https://status.supabase.com/)
- [Vercel Status Page](https://www.vercel-status.com/)
- [GitHub Status](https://www.githubstatus.com/)
- [Supabase Discord](https://discord.supabase.com/)`
