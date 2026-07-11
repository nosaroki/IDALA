import { useEffect, useState, useContext, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabaseClient'
import { LangCtx } from '../components/LangContext'
import Footer from '../components/Footer'

export default function OnboardingPaymentRefresh() {
  const [searchParams]      = useSearchParams()
  const token               = searchParams.get('token')
  const { lang }            = useContext(LangCtx)
  const [failed, setFailed] = useState(false)
  const startedRef          = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function regenerate() {
      if (!token) { if (!cancelled) setFailed(true); return }
      if (startedRef.current) return
      startedRef.current = true

      const { data: prat, error: pErr } = await supabase
        .from('praticiens')
        .select('id')
        .eq('onboarding_token', token)
        .single()

      if (pErr || !prat) { if (!cancelled) setFailed(true); return }

      const { data, error } = await supabase.functions.invoke('create-stripe-account', {
        body: { praticien_id: prat.id }
      })

      if (cancelled) return

      if (!error && data?.onboarding_url) {
        window.location.href = data.onboarding_url
      } else {
        setFailed(true)
      }
    }

    regenerate()
    return () => { cancelled = true }
  }, [token])

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? 'Reprise en cours — The Idala Family' : 'Resuming — The Idala Family'}</title>
      </Helmet>

      <div className="join-success">
        <div className="join-success__card">
          <p className="join-success__icon">✦</p>
          {!failed ? (
            <>
              <h1 className="join-success__title">
                {lang === 'fr' ? 'Reprise en cours...' : 'Resuming...'}
              </h1>
              <p className="join-success__text">
                {lang === 'fr'
                  ? 'Nous vous redirigeons vers la configuration de vos paiements. Un instant.'
                  : 'We are redirecting you to your payment setup. One moment.'}
              </p>
            </>
          ) : (
            <>
              <h1 className="join-success__title">
                {lang === 'fr' ? 'Lien invalide' : 'Invalid link'}
              </h1>
              <p className="join-success__text">
                {lang === 'fr'
                  ? 'Ce lien est invalide ou a expiré. Merci de reprendre depuis le mail que vous avez reçu.'
                  : 'This link is invalid or has expired. Please start again from the email you received.'}
              </p>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}