# Authentication Setup

This project now uses Supabase SSR auth as the single source of truth for browser and server authentication.

## Environment

Set these variables in your local environment:

```bash
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_KEY=your_supabase_anon_key_here
```

`SUPABASE_KEY` is the public anon key. It is exposed to the browser through Nuxt runtime config so the browser Supabase client can maintain the session cookie chain.

## How It Works

- The browser uses `@supabase/ssr` `createBrowserClient()` for login, logout, session refresh, and multi-tab auth synchronization.
- The server uses request-scoped `createServerClient()` instances that read and write the same Supabase auth cookies.
- Nitro server middleware calls `auth.getUser()` early on HTML and API requests so stale access tokens can be refreshed before route handlers run.
- App UI state comes from `useAuth()`, which mirrors the verified Supabase auth state instead of storing a second app-owned auth session.

## Important Behavior

- Supabase access tokens are short-lived by design.
- Durable login comes from refresh-token rotation, not from extending an app cookie lifetime.
- On the Free plan, the app relies on Supabase default session behavior. There is no app-side one-month timer; the goal is to keep the refresh chain healthy so normal usage stays logged in long-term.
- Same-browser multi-tab sync is handled by Supabase auth state events and shared browser storage/cookies.

## Main Files

- `composables/useAuth.ts`: app-facing auth state and login/logout helpers
- `composables/useSupabaseClient.ts`: browser Supabase client singleton
- `server/utils/supabase.ts`: request-scoped server client helpers
- `server/middleware/auth.ts`: early server-side refresh hook

## Verification Checklist

- Login once, refresh the page, and confirm protected pages still load.
- Open two tabs and verify login/logout propagates across both.
- Wait past the JWT lifetime and confirm the next authenticated request still works.
- Hard refresh a protected page after being idle and confirm the session is recovered without logging in again.
