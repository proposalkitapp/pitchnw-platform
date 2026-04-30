import { createBrowserClient } from '@supabase/ssr'
import { clientConfig } from '@/lib/client-config'

export const createClient = () =>
  createBrowserClient(
    clientConfig.supabaseUrl,
    clientConfig.supabaseAnonKey
  )
