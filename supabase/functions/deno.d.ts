/**
 * Minimal Deno globals for Supabase Edge Functions when the IDE uses Node/TS
 * (actual runtime is Deno on Supabase).
 */
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};
