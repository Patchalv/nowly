# Authentication Configuration

## Staging Environment

### Email Verification

- **Status:** REQUIRED
- **Users must verify email before logging in**

### Redirect URLs

- Local: `http://localhost:3000/auth/callback`
- Preview: `https://*.vercel.app/auth/callback`

### Email Templates

- Using Supabase defaults
- Confirmation link expires: 24 hours

### SMTP

- Using Supabase email service
- Rate limits apply (2 emails/hour)
