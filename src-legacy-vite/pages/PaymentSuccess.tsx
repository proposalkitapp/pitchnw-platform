import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'

export default function PaymentSuccess() {
  const navigate = useNavigate()
  const [status, setStatus] =
    useState<'verifying'|'success'|'error'>(
      'verifying'
    )

  useEffect(() => {
    const activate = async () => {
      try {
        const { data: { session } } =
          await supabase.auth.getSession()

        if (!session) {
          navigate('/auth')
          return
        }

        const { error } = await supabase
          .from('profiles')
          .update({ plan: 'pro', subscription_status: 'active' })
          .eq('user_id', session.user.id)

        if (error) {
          console.error('Activation error:', error)
          setStatus('error')
          return
        }

        await supabase.auth.refreshSession()
        setStatus('success')

        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 3000)

      } catch (err) {
        console.error('Activation failed:', err)
        setStatus('error')
      }
    }

    activate()
  }, [])

  if (status === 'verifying') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#08080F',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        fontFamily: 'DM Sans',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px' }}>⏳</div>
        <h2 style={{
          fontFamily: 'Syne',
          fontWeight: 800,
          color: '#EEEEFF',
          fontSize: '24px'
        }}>
          Activating your Pro plan...
        </h2>
        <p style={{ color: '#8888AA' }}>
          Please wait. Do not close this page.
        </p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#08080F',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        fontFamily: 'DM Sans',
        textAlign: 'center',
        padding: '24px'
      }}>
        <div style={{ fontSize: '48px' }}>⚠️</div>
        <h2 style={{
          fontFamily: 'Syne',
          fontWeight: 800,
          color: '#EEEEFF',
          fontSize: '24px'
        }}>
          Payment received
        </h2>
        <p style={{
          color: '#8888AA',
          maxWidth: '400px'
        }}>
          Your payment was successful but activation
          encountered an issue. Contact us at
          support@pitchnw.app and we will activate
          your account within minutes.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: '#7C6FF7',
            color: 'white',
            padding: '12px 28px',
            borderRadius: '14px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'DM Sans',
            fontWeight: 600
          }}
        >
          Go to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#08080F',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
      fontFamily: 'DM Sans',
      textAlign: 'center',
      padding: '24px'
    }}>
      <div style={{ fontSize: '64px' }}>🎉</div>
      <h1 style={{
        fontFamily: 'Syne',
        fontWeight: 800,
        color: '#EEEEFF',
        fontSize: '32px'
      }}>
        Welcome to Pro!
      </h1>
      <p style={{
        color: '#8888AA',
        fontSize: '17px',
        maxWidth: '440px',
        lineHeight: 1.7
      }}>
        Your Pro plan is now active. Every feature
        is unlocked. Start pitching and closing.
      </p>
      <p style={{ color: '#44445A', fontSize: '13px' }}>
        Redirecting to your dashboard in 3 seconds...
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          background: '#7C6FF7',
          color: 'white',
          padding: '14px 32px',
          borderRadius: '14px',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'DM Sans',
          fontWeight: 600,
          fontSize: '16px'
        }}
      >
        Go to Dashboard Now →
      </button>
    </div>
  )
}
