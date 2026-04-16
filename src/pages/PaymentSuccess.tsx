import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from "@/integrations/supabase/client";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying')

  useEffect(() => {
    const verifyAndActivate = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          navigate('/auth')
          return
        }

        // Update plan directly in database
        // The webhook may be delayed so we do this immediately on the success page
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            plan: 'pro',
            subscription_status: 'active'
          })
          .eq('user_id', session.user.id)

        if (updateError) {
          console.error('Plan update error:', updateError)
          setStatus('error')
          return
        }

        // Force refresh the session so the app re-reads the updated profile everywhere
        await supabase.auth.refreshSession()

        setStatus('success')

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 3000)

      } catch (err) {
        console.error('Verification error:', err)
        setStatus('error')
      }
    }

    verifyAndActivate()
  }, [navigate]);

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
        fontFamily: 'DM Sans, sans-serif'
      }}>
        <div style={{ fontSize: '48px' }}>⏳</div>
        <h2 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          color: '#EEEEFF',
          fontSize: '24px'
        }}>
          Activating your Pro plan...
        </h2>
        <p style={{ color: '#8888AA' }}>
          Please wait, do not close this page.
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
        fontFamily: 'DM Sans, sans-serif',
        textAlign: 'center',
        padding: '24px'
      }}>
        <div style={{ fontSize: '48px' }}>⚠️</div>
        <h2 style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          color: '#EEEEFF',
          fontSize: '24px'
        }}>
          Payment received but activation failed
        </h2>
        <p style={{ color: '#8888AA', maxWidth: '400px' }}>
          Your payment went through successfully.
          Please contact us at hello@pitchnw.app
          and we will activate your account manually
          within minutes.
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
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 600
          }}
        >
          Go to Dashboard
        </button>
      </div>
    )
  }

  // Success state
  return (
    <div style={{
      minHeight: '100vh',
      background: '#08080F',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
      fontFamily: 'DM Sans, sans-serif',
      textAlign: 'center',
      padding: '24px'
    }}>
      <div style={{ fontSize: '64px' }}>🎉</div>

      <h1 style={{
        fontFamily: 'Syne, sans-serif',
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
        Your Pro plan is now active. You have
        unlimited proposal generation, full CRM
        access, pitch analysis, and every feature
        Pitchnw offers.
      </p>

      <div style={{
        background: '#141428',
        border: '1px solid #2A2A45',
        borderRadius: '16px',
        padding: '20px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '360px',
        width: '100%',
        textAlign: 'left'
      }}>
        {[
          '✓ Unlimited AI proposal generation',
          '✓ AI Pitch Analysis & Rating',
          '✓ Sophisticated CRM pipeline',
          '✓ Proposal analytics',
          '✓ Digital signatures',
          '✓ AI Win-Rate Coach',
          '✓ Priority support'
        ].map((feature, i) => (
          <p key={i} style={{
            color: '#4EEAA0',
            fontSize: '14px',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 500
          }}>
            {feature}
          </p>
        ))}
      </div>

      <p style={{
        color: '#44445A',
        fontSize: '13px'
      }}>
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
          fontFamily: 'DM Sans, sans-serif',
          fontWeight: 600,
          fontSize: '16px'
        }}
      >
        Go to Dashboard Now →
      </button>
    </div>
  )
}
