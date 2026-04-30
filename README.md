# Pitchnw — Next.js Migration

This is the Next.js 14 version of the Pitchnw platform, migrated from the original Vite architecture using the **Strangler Fig** pattern.

## 🚀 Getting Started

1.  **Configure Environment Variables:**
    Copy the values from the original project's `.env` (or Supabase dashboard) into `pitchnw-next/.env.local`.
    You will need:
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   `ANTHROPIC_API_KEY`
    *   `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)
    *   `DODO_PAYMENTS_API_KEY` & `WEBHOOK_SECRET`

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Run Locally:**
    ```bash
    npm run dev
    ```

## 🏗️ Migration Status

*   [x] **Phase 1-9:** Infrastructure, Security, Auth, and Supabase Integration.
*   [x] **Phase 10 (Partial):** Core UI Library & Dashboard Migration.
*   [ ] **Phase 11:** Porting the Proposal Generator (Complex).
*   [ ] **Phase 12:** Porting CRM & AI Strategy Coach.
*   [ ] **Phase 13:** Final Deployment & Switch.

## 🛠️ Key Architectural Decisions

*   **Server-Side Supabase:** Using `@supabase/ssr` for authenticated data fetching in Next.js Server Components and Middleware.
*   **API Routes:** Supabase Edge Functions have been moved to `src/app/api` for better local development and deployment flexibility.
*   **Claymorphism 2.0:** The UI library has been rebuilt as native Next.js components with enhanced performance and glassmorphism effects.
*   **Server Actions:** Ready for implementation to replace client-side `supabase.from().update()` calls.

## 📁 Folder Structure

*   `src/app`: App Router pages and API routes.
*   `src/components`: UI library and layout components.
*   `src/hooks`: Custom React hooks for data fetching (React Query).
*   `src/lib`: Shared utilities and configuration.
*   `src/middleware.ts`: Auth protection and role-based routing.
