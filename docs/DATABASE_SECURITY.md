# Database Security - Row Level Security

## Overview

All tables use Row Level Security (RLS) to ensure data isolation between users.

## Policy Model

- **User-Owned Data:** Users can only access rows where `user_id` matches their authenticated user ID
- **Operations:** Full CRUD (Create, Read, Update, Delete) on own data
- **Enforcement:** Automatic at database level

## Tables with RLS

1.  **user_profiles** - Users can only access their own profile
2.  **categories** - Users can only access their own categories
3.  **tasks** - Users can only access their own tasks

## Policy Structure

Each table has 4 policies:

- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id`
- DELETE: `auth.uid() = user_id`

## Testing RLS

RLS is tested in NOWLY-54 with multiple users to ensure complete isolation.

## Bypassing RLS

- **Service Role:** Can bypass RLS (use only in trusted server code)
- **Anon Key:** Respects RLS (safe for client-side use)
