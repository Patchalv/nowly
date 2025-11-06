# Authentication Flow Documentation

Comprehensive documentation of all authentication flows in Nowly.

## Overview

Nowly implements secure, server-side authentication using Supabase Auth with Next.js 16 App Router patterns. All authentication operations use Server Actions for maximum security and follow the PKCE (Proof Key for Code Exchange) flow for email confirmations.

---

## Architecture Components

### 1. Client Components (Presentation Layer)

- **Location:** `src/presentation/components/authentication/`
- **Purpose:** UI forms for login, signup, password reset
- **Technology:** React 19 Client Components with React Hook Form + Zod validation
- **Responsibilities:**
  - Display forms to users
  - Client-side validation (instant feedback)
  - Submit to Server Actions
  - Display error messages

### 2. Server Actions (Application Layer)

- **Location:** `app/actions/`
- **Purpose:** Secure server-side auth operations
- **Technology:** Next.js Server Actions
- **Responsibilities:**
  - Server-side validation (security)
  - Call Supabase Auth APIs
  - Handle errors securely
  - Redirect on success

### 3. Auth Confirmation Handler (Infrastructure Layer)

- **Location:** `app/auth/confirm/route.ts`
- **Purpose:** Exchange PKCE tokens from email links
- **Technology:** Next.js Route Handler
- **Responsibilities:**
  - Receive `token_hash` from email links
  - Verify token with Supabase
  - Establish user session
  - Redirect to destination

### 4. Proxy Middleware

- **Location:** `proxy.ts`
- **Purpose:** Session management and route protection
- **Technology:** Next.js Proxy (formerly Middleware)
- **Responsibilities:**
  - Refresh expired sessions
  - Protect routes from unauthorized access
  - Handle redirects
  - Manage auth cookies

---

## Flow Diagrams

### Login Flow

```
┌──────────────────────────────────────────────────────────────┐
│ 1. USER ENTERS CREDENTIALS                                   │
│    Location: /login                                          │
│    Component: LogInForm (Client Component)                   │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ Form Submit
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. CLIENT-SIDE VALIDATION                                    │
│    - React Hook Form validates with Zod schema              │
│    - Instant feedback to user                                │
│    - Prevents unnecessary server calls                       │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ Validation Passes
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. CALL SERVER ACTION                                        │
│    File: app/actions/loginAction.ts                          │
│    Function: loginAction(formData)                           │
│    - Converts form data to FormData                          │
│    - useTransition for pending state                         │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ Server Action Executes
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. SERVER-SIDE VALIDATION                                    │
│    - Re-validates with Zod (security)                        │
│    - Never trust client input                                │
│    - Returns validation errors if invalid                    │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ Validation Passes
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. AUTHENTICATE WITH SUPABASE                                │
│    - Creates Supabase server client                          │
│    - Calls supabase.auth.signInWithPassword()                │
│    - Supabase verifies credentials                           │
│    - Establishes session                                     │
└────────────────────┬─────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
       Success               Failure
          │                     │
          ▼                     ▼
┌─────────────────────┐  ┌─────────────────────────────────────┐
│ 6a. REDIRECT        │  │ 6b. RETURN ERROR                    │
│     to /daily       │  │     - Specific error messages       │
│                     │  │     - Field errors if applicable    │
│                     │  │     - User sees toast notification  │
└─────────────────────┘  └─────────────────────────────────────┘
```

**Key Security Features:**

- ✅ Credentials never exposed in URL
- ✅ Server-side validation prevents tampering
- ✅ Session established server-side
- ✅ HTTPS encrypts transmission
- ✅ Email confirmation required before login

---

### Signup + Email Confirmation Flow

```
┌──────────────────────────────────────────────────────────────┐
│ 1. USER FILLS SIGNUP FORM                                    │
│    Location: /signup                                         │
│    Component: SignUpForm (Client Component)                  │
│    Fields: email, password, confirmPassword, firstName,      │
│            lastName                                           │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ Form Submit
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. CLIENT-SIDE VALIDATION                                    │
│    - Validates all fields with Zod                           │
│    - Checks password match                                   │
│    - Validates email format                                  │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ Validation Passes
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. CALL SIGNUP SERVER ACTION                                 │
│    File: app/actions/signupAction.ts                         │
│    Function: signupAction(formData)                          │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ Server Action Executes
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. SERVER-SIDE VALIDATION + CREATE ACCOUNT                   │
│    - Re-validates all fields                                 │
│    - Calls supabase.auth.signUp()                            │
│    - Sets emailRedirectTo parameter                          │
│    - User account created but NOT active yet                 │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ Account Created
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. REDIRECT TO SUCCESS PAGE                                  │
│    Location: /signup/success                                 │
│    Message: "Check your email for confirmation link"         │
└─────────────────────────────────────────────────────────────┘
                     ║
                     ║ Parallel: Supabase sends email
                     ║
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. USER RECEIVES EMAIL                                       │
│    From: noreply@mail.app.supabase.io                       │
│    Subject: "Confirm your email"                             │
│    Link: /auth/confirm?token_hash=XXX&type=email&next=/daily│
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ User Clicks Link
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 7. AUTH CONFIRMATION HANDLER                                 │
│    File: app/auth/confirm/route.ts                           │
│    - Extracts token_hash, type, next from URL                │
│    - Creates Supabase server client                          │
│    - Calls supabase.auth.verifyOtp()                         │
│    - Exchanges token for valid session                       │
└────────────────────┬─────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
       Success               Failure
          │                     │
          ▼                     ▼
┌─────────────────────┐  ┌─────────────────────────────────────┐
│ 8a. SESSION CREATED │  │ 8b. REDIRECT TO ERROR PAGE          │
│     Redirect to     │  │     Message: "Invalid or expired    │
│     /daily          │  │               link"                 │
│     User logged in  │  │                                     │
└─────────────────────┘  └─────────────────────────────────────┘
```

**Key Security Features:**

- ✅ Email confirmation required (verified email ownership)
- ✅ Token hash cannot be reused (one-time use)
- ✅ Token expires after 24 hours
- ✅ Server-side token verification (PKCE flow)
- ✅ No password in URL or email

---

### Password Reset Flow

```
┌──────────────────────────────────────────────────────────────┐
│ 1. USER REQUESTS PASSWORD RESET                              │
│    Location: /reset-password                                 │
│    Component: ResetPasswordRequestForm                       │
│    Input: Email address only                                 │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ Form Submit
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. CALL RESET REQUEST SERVER ACTION                          │
│    File: app/actions/resetPasswordRequestAction.ts           │
│    - Validates email format                                  │
│    - Calls supabase.auth.resetPasswordForEmail()             │
│    - ALWAYS returns success (prevents email enumeration)     │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ Always Shows Success
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. SUCCESS MESSAGE SHOWN                                     │
│    Message: "If account exists, you'll receive an email"     │
│    - Prevents attackers from discovering valid emails        │
└─────────────────────────────────────────────────────────────┘
                     ║
                     ║ IF email exists: Supabase sends email
                     ║ IF email doesn't exist: No email sent
                     ║
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. USER RECEIVES RESET EMAIL (if account exists)             │
│    Link: /auth/confirm?token_hash=XXX&type=recovery&        │
│          next=/reset-password/confirm                        │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ User Clicks Link
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. AUTH CONFIRMATION HANDLER                                 │
│    File: app/auth/confirm/route.ts                           │
│    - Extracts token_hash, type=recovery, next                │
│    - Verifies token with Supabase                            │
│    - Establishes recovery session                            │
│    - Redirects to /reset-password/confirm                    │
└────────────────────┬─────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
       Success               Failure
          │                     │
          ▼                     ▼
┌─────────────────────┐  ┌─────────────────────────────────────┐
│ 6a. SHOW RESET FORM │  │ 6b. SHOW ERROR                      │
│     Location:       │  │     Message: "Session expired"      │
│     /reset-password/│  │     Action: Request new link        │
│     confirm         │  │                                     │
└──────────┬──────────┘  └─────────────────────────────────────┘
           │
           │ User Enters New Password
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│ 7. PASSWORD RESET FORM                                       │
│    Component: ResetPasswordConfirmForm                       │
│    - Checks for valid session (established in step 5)        │
│    - Shows form if session exists                            │
│    - Shows error if no session                               │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ Form Submit
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 8. CALL PASSWORD UPDATE SERVER ACTION                        │
│    File: app/actions/resetPasswordConfirmAction.ts           │
│    - Validates new password                                  │
│    - Confirms password match                                 │
│    - Calls supabase.auth.updateUser({ password })            │
│    - Uses existing recovery session                          │
└────────────────────┬─────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
       Success               Failure
          │                     │
          ▼                     ▼
┌─────────────────────┐  ┌─────────────────────────────────────┐
│ 9a. PASSWORD UPDATED│  │ 9b. SHOW ERROR                      │
│     Redirect to     │  │     - Invalid password format       │
│     /login          │  │     - Session expired               │
│     Toast: Success! │  │     - Same as old password          │
└─────────────────────┘  └─────────────────────────────────────┘
```

**Key Security Features:**

- ✅ Prevents email enumeration (always shows success)
- ✅ Token expires after 24 hours
- ✅ Token is one-time use only
- ✅ Server-side token verification
- ✅ Recovery session required to change password
- ✅ Old password cannot be reused (Supabase checks)

---

## Session Management

### How Sessions Work

```
┌──────────────────────────────────────────────────────────────┐
│ AUTHENTICATION EVENT (Login/Signup/Reset)                    │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ SUPABASE CREATES SESSION                                     │
│  - Access token (JWT) - expires in 1 hour                    │
│  - Refresh token - expires in 60 days                        │
│  - Stored in HTTP-only cookies (secure)                      │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ PROXY MIDDLEWARE RUNS ON EVERY REQUEST                       │
│  File: proxy.ts                                              │
│  - Reads session from cookies                                │
│  - Calls supabase.auth.getUser() (validates + refreshes)     │
│  - If token expired: automatically refreshes                 │
│  - Updates cookies with new tokens                           │
└────────────────────┬─────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
    Has Session           No Session
          │                     │
          ▼                     ▼
┌─────────────────────┐  ┌─────────────────────────────────────┐
│ ALLOW REQUEST       │  │ CHECK ROUTE                         │
│  - User object      │  │  - Public route: Allow              │
│    available in     │  │  - Protected route: Redirect login  │
│    Server Components│  │                                     │
└─────────────────────┘  └─────────────────────────────────────┘
```

### Session Lifecycle

1. **Creation**
   - User logs in successfully
   - Supabase generates access token (JWT) + refresh token
   - Tokens stored in HTTP-only cookies
   - Cookie attributes: Secure, SameSite=Lax, Path=/

2. **Validation** (Every Request)
   - Proxy middleware runs
   - Calls `supabase.auth.getUser()`
   - Validates access token signature
   - Checks expiration
   - Refreshes if expired

3. **Refresh** (Automatic)
   - Access token expires after 1 hour
   - Middleware detects expiration
   - Uses refresh token to get new access token
   - Updates cookies with new tokens
   - User never sees interruption

4. **Expiration**
   - Refresh token expires after 60 days
   - User must log in again
   - All tokens invalidated on logout

---

## Route Protection

### Public Routes

Routes accessible without authentication:

```typescript
// File: src/config/constants.ts
export const PUBLIC_ROUTES = [
  '/', // Home/landing
  '/login', // Login page
  '/signup', // Signup page
  '/signup/success', // Post-signup confirmation
  '/reset-password', // Request reset
  '/reset-password/confirm', // Reset form
  '/auth/confirm', // Auth token handler
  '/error', // Error display
];
```

### Protected Routes

All other routes require authentication:

- `/daily` - Main app
- `/tasks` - Task list
- `/settings` - User settings
- etc.

### Protection Mechanism

```typescript
// File: proxy.ts
export async function proxy(request: NextRequest) {
  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_ROUTES.includes(pathname);

  // Protect non-public routes
  if (!isPublic && !user) {
    return NextResponse.redirect('/login');
  }

  // Prevent logged-in users from accessing auth pages
  if ((pathname === '/login' || pathname === '/signup') && user) {
    return NextResponse.redirect('/daily');
  }

  return NextResponse.next();
}
```

---

## Error Handling

### Client-Side Errors

**Location:** Forms display errors inline

```typescript
// Example: LoginForm
if (!result.success) {
  toast.error('Login failed', {
    description: result.error,
  });

  // Set field-specific errors
  if (result.fieldErrors) {
    form.setError('email', {
      message: result.fieldErrors.email[0],
    });
  }
}
```

### Server-Side Errors

**Location:** Server Actions catch and return errors

```typescript
// Example: loginAction
try {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { success: false, error: 'Invalid email or password' };
    }
    return { success: false, error: 'Login failed' };
  }
} catch (error) {
  return { success: false, error: 'Unexpected error' };
}
```

### Common Error Scenarios

| Error               | Cause                           | User Message                | Action           |
| ------------------- | ------------------------------- | --------------------------- | ---------------- |
| Invalid credentials | Wrong email/password            | "Invalid email or password" | Try again        |
| Email not confirmed | Clicked login before confirming | "Please verify your email"  | Check email      |
| Session expired     | Token > 24 hours old            | "Session expired"           | Request new link |
| Token invalid       | Token already used              | "Link invalid or expired"   | Request new link |
| Account exists      | Signup with existing email      | "Account already exists"    | Login instead    |
| Rate limit          | Too many requests               | "Too many attempts"         | Wait 1 hour      |

---

## Security Considerations

### 1. CSRF Protection

- ✅ Next.js 15+ has built-in CSRF protection for Server Actions
- ✅ Tokens automatically validated
- ✅ Origin headers checked

### 2. XSS Prevention

- ✅ React escapes all output by default
- ✅ No `dangerouslySetInnerHTML` used
- ✅ Content Security Policy headers

### 3. SQL Injection Prevention

- ✅ Supabase uses parameterized queries
- ✅ No raw SQL from user input
- ✅ Row Level Security (RLS) enabled

### 4. Password Security

- ✅ Passwords never logged or exposed
- ✅ Transmitted over HTTPS only
- ✅ Hashed by Supabase (bcrypt)
- ✅ Minimum complexity enforced

### 5. Session Security

- ✅ HTTP-only cookies (not accessible to JavaScript)
- ✅ Secure flag (HTTPS only)
- ✅ SameSite=Lax (CSRF protection)
- ✅ Automatic expiration and refresh

### 6. Email Enumeration Prevention

- ✅ Password reset always returns success
- ✅ Signup errors are generic
- ✅ Rate limiting on auth endpoints

---

## Supabase Configuration Required

### Email Templates (Dashboard → Authentication → Email Templates)

**1. Confirm Signup:**

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/daily
```

**2. Reset Password:**

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password/confirm
```

### Redirect URLs (Dashboard → Authentication → URL Configuration)

**Site URL:** `https://your-domain.com`

**Redirect URLs:**

- `http://localhost:3000/auth/confirm` (development)
- `https://*.vercel.app/auth/confirm` (preview)
- `https://your-domain.com/auth/confirm` (production)

---

## Testing Checklist

- [ ] User can sign up with valid email
- [ ] User receives confirmation email
- [ ] Email confirmation link works
- [ ] User can log in after confirming email
- [ ] User cannot login without confirming email
- [ ] User can request password reset
- [ ] Password reset email is received
- [ ] Password reset link works
- [ ] User can set new password
- [ ] User can login with new password
- [ ] Sessions persist across page reloads
- [ ] Sessions refresh automatically
- [ ] Protected routes redirect to login
- [ ] Logged-in users can't access login page
- [ ] Logout works properly
- [ ] Error messages are user-friendly
- [ ] Invalid tokens show error page
- [ ] Expired links show error message

---

## Related Documentation

- [AUTH_CONFIG.md](./AUTH_CONFIG.md) - Supabase configuration
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common auth issues
- [README.md](../README.md#authentication) - Overview
- [Architecture Guidelines](../.cursor/rules/architecture.mdc) - Code structure
