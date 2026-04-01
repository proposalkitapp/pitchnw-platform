

# Google OAuth for ProposalKit

## Overview
Add a "Continue with Google" button to the auth page (both login and signup modes), create an `/auth/callback` route, and handle error states.

## Important Note
Since this is a **Lovable Cloud project**, we must use the managed Google OAuth via `lovable.auth.signInWithOAuth("google", ...)` instead of raw `supabase.auth.signInWithOAuth`. This requires running the **Configure Social Auth tool** first to generate the `src/integrations/lovable/` module and install `@lovable.dev/cloud-auth-js`.

## Steps

### 1. Configure Social Auth (tool call)
Run the Configure Social Login tool for Google. This auto-generates the lovable auth module at `src/integrations/lovable/`.

### 2. Create `src/pages/AuthCallback.tsx`
- Minimal loading page with ProposalKit logo (h-21, pulse animation), "Signing you in..." text, and a Loader2 spinner
- On mount: call `supabase.auth.getSession()` — if session exists, navigate to `/dashboard`; if error or no session, navigate to `/auth?error=auth_failed`
- Profile auto-creation is already handled by the existing `handle_new_user` database trigger, so no manual insert needed

### 3. Update `src/App.tsx`
- Import `AuthCallback` and add route: `<Route path="/auth/callback" element={<AuthCallback />} />`

### 4. Update `src/pages/AuthPage.tsx`
- Add `googleLoading` state
- Add `handleGoogleSignIn` function using `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + '/auth/callback' })`
- Insert **Google button** (white bg, Google logo SVG, 48px height, styled per spec) above the email fields
- Insert **divider** ("or continue with email") between Google button and email fields
- On mount: check for `?error=auth_failed` search param and show error toast

### 5. Files Changed
| File | Action |
|------|--------|
| `src/pages/AuthCallback.tsx` | Create |
| `src/pages/AuthPage.tsx` | Edit — add Google button, divider, error handling |
| `src/App.tsx` | Edit — add `/auth/callback` route |

