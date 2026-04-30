import { createServerSupabaseClient } from
  '@/lib/supabase/server'
import { NextRequest, NextResponse } from
  'next/server'
import { createAdminClient } from
  '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const { searchParams, origin } =
    new URL(req.url)
  const code = searchParams.get('code')
  const next =
    searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createServerSupabaseClient()
    const { data: { session }, error } =
      await supabase.auth
        .exchangeCodeForSession(code)

    if (!error && session) {
      const adminClient = createAdminClient()

      const { data: profile } = await adminClient
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .single()

      if (!profile) {
        await adminClient
          .from('profiles')
          .insert({
            id: session.user.id,
            display_name:
              session.user.user_metadata
                ?.full_name ||
              session.user.user_metadata
                ?.name ||
              '',
            avatar_url:
              session.user.user_metadata
                ?.avatar_url || null,
            plan: null,
            onboarding_completed: false
          })
      }

      return NextResponse.redirect(
        `${origin}${next}`
      )
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=auth_failed`
  )
}
