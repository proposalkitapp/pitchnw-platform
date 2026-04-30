import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = 
  import.meta.env?.VITE_SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.SUPABASE_URL;

const SUPABASE_PUBLISHABLE_KEY = 
  import.meta.env?.VITE_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_ANON_KEY;

const isBrowser = typeof window !== 'undefined';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: isBrowser ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  }
});
