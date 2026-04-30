import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { clientConfig } from '@/lib/client-config'
import { serverConfig } from '@/lib/server-config'

export const createAdminClient = () =>
  createClient(
    clientConfig.supabaseUrl,
    serverConfig.supabaseServiceRoleKey!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
