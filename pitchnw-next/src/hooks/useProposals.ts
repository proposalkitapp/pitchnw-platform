'use client'

import { useQuery, useMutation,
         useQueryClient } from '@tanstack/react-query'
import { createClient } from
  '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export const useGenerateProposal = () => {
  const supabase = createClient()
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: Record<string, unknown>) => {
      const { data: { session } } =
        await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(
        '/api/generate-proposal',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization':
              `Bearer ${session.access_token}`
          },
          body: JSON.stringify(formData)
        }
      )

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(
          data.message || 'Generation failed.'
        )
      }

      return data
    },
    onSuccess: (data) => {
      toast.success('Proposal generated!')
      queryClient.invalidateQueries({
        queryKey: ['proposals']
      })
      router.push(`/proposals/${data.proposal.id}`)
    },
    onError: (error: Error) => {
      if (error.message.includes('limit_reached')) {
        toast.error('Free limit reached. Upgrade to Pro.')
        router.push('/checkout')
        return
      }
      toast.error(error.message)
    }
  })
}

export const useProposals = (userId?: string) => {
  const supabase = createClient()

  return useQuery({
    queryKey: ['proposals', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!userId,
    staleTime: 0,
  })
}
