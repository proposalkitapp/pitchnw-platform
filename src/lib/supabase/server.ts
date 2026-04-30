import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { clientConfig } from '@/lib/client-config'

export const createClient = () => {
  const cookieStore = cookies()
  return createServerClient(
    clientConfig.supabaseUrl,
    clientConfig.supabaseAnonKey,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name, options) {
          cookieStore.set({
            name,
            value: '',
            ...options
          })
        },
      },
    }
  )
}
