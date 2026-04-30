'use client'

import { useMutation } from '@tanstack/react-query'
import { createClient } from
  '@/lib/supabase/client'

export const useAnalyzePitch = () => {
  const supabase = createClient()

  return useMutation({
    mutationFn: async (proposalText: string) => {
      const { data: { session } } =
        await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(
        '/api/analyze-pitch',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization':
              `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ proposalText })
        }
      )

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(
          data.message || 'Analysis failed.'
        )
      }

      return data.analysis
    }
  })
}
