# Authentication Configuration

## Overview

Nowly uses Supabase Auth with server-side token exchange for secure authentication flows. All auth tokens are exchanged server-side through a dedicated route handler following the [official Supabase Next.js guide](https://supabase.com/docs/guides/auth/server-side/nextjs).

## Architecture

### Auth Flow Components

1. **Proxy Middleware** (`proxy.ts`) - Refreshes auth sessions on every request
2. **Auth Route Handler** (`app/auth/confirm/route.ts`) - Exchanges auth tokens server-side
3. **Server Actions** - Handle form submissions and API calls
4. **Client Components** - UI for authentication forms

### Server-Side Token Exchange

All authentication links (password reset, email confirmation) go through `/auth/confirm` which:

- Receives `token_hash` from email links
- Exchanges token with Supabase using `verifyOtp()`
- Establishes a valid session
- Redirects user to the appropriate page

## Staging Environment

### Email Verification

- **Status:** REQUIRED
- **Users must verify email before logging in**

### Redirect URLs

The app uses a unified auth confirmation handler:

- **Local Development:** `http://localhost:3000/auth/confirm`
- **Preview/Production:** `https://*.vercel.app/auth/confirm`

### Email Template Configuration

**IMPORTANT:** You must manually update the email templates in your Supabase dashboard.

#### Password Reset Email

Navigate to: **Authentication → Email Templates → Reset Password**

Change the confirmation URL to:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password/confirm
```

**Explanation:**

- `token_hash`: The secure token for verification
- `type=recovery`: Identifies this as a password reset flow
- `next=/reset-password/confirm`: Where to redirect after successful verification

#### Email Signup Confirmation

Navigate to: **Authentication → Email Templates → Confirm Signup**

Change the confirmation URL to:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/daily
```

**Explanation:**

- `token_hash`: The secure token for verification
- `type=email`: Identifies this as an email confirmation flow
- `next=/daily`: Where to redirect after successful verification (the main app)

### Email Settings

- **SMTP:** Using Supabase email service
- **Rate Limits:** 2 emails/hour (staging), higher for production
- **Link Expiration:** 24 hours (default)

## Local Development

### Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Testing Auth Flows

1. **Password Reset:**
   - Go to `/reset-password`
   - Enter email
   - Check email for reset link
   - Click link → redirects to `/auth/confirm` → redirects to `/reset-password/confirm`
   - Set new password

2. **Email Signup:**
   - Go to `/signup`
   - Fill out form and submit
   - Check email for confirmation link
   - Click link → redirects to `/auth/confirm` → redirects to `/daily`

## Troubleshooting

### "PKCE validation failed" Error

**Cause:** Email template is using `code` parameter instead of `token_hash`

**Solution:** Update email templates as described above to use `token_hash` with proper `type` parameter

### "Authentication link is invalid or has expired"

**Causes:**

1. Link is older than 24 hours
2. Link has already been used
3. Email template configuration is incorrect

**Solution:**

1. Request a new link
2. Verify email templates are configured correctly
3. Check Supabase Auth logs for detailed error messages

### Session Not Found

**Cause:** User arrived at password reset form without going through the auth confirmation handler

**Solution:**

- Ensure redirect URL in `resetPasswordRequestAction.ts` includes `/auth/confirm` in the path
- Verify email template uses the correct URL format

## Production Deployment

### Pre-Deployment Checklist

- [ ] Email templates updated in Supabase dashboard (both staging and production projects)
- [ ] Redirect URLs configured in Supabase Auth settings
- [ ] Environment variables set in Vercel
- [ ] Test password reset flow end-to-end
- [ ] Test email signup confirmation end-to-end

### Monitoring

Check these logs to monitor auth flows:

- **Supabase Auth Logs:** Authentication → Logs
- **Vercel Function Logs:** Check `/auth/confirm` route handler logs
- **Browser Console:** Client-side errors (development only)

## Security Notes

- All token exchange happens server-side (secure)
- PKCE flow prevents token interception attacks
- Rate limiting prevents abuse
- Sessions are refreshed automatically by proxy middleware
- Invalid tokens redirect to error page with helpful messaging
