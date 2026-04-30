'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from
  '@/lib/supabase/client'

export const useProfile = (userId?: string) => {
  const supabase = createClient()

  const query = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      return data
    },
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const isPro = (query.data as any)?.plan === 'pro'
  const isFree = !(query.data as any)?.plan

  return { ...query, isPro, isFree }
}
