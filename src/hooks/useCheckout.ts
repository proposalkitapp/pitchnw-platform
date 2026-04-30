'use client'

import { useMutation } from '@tanstack/react-query'
import { createClient } from
  '@/lib/supabase/client'

export const useCheckout = () => {
  const supabase = createClient()

  return useMutation({
    mutationFn: async () => {
      const { data: { session } } =
        await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(
        '/api/create-checkout',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization':
              `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ plan: 'pro' })
        }
      )

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(
          data.message || 'Checkout failed.'
        )
      }

      return data
    },
    onSuccess: (data) => {
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      }
    }
  })
}
