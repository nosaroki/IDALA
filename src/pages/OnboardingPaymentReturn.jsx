import { useEffect, useState, useContext, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabaseClient'
import { LangCtx } from '../components/LangContext'
import Footer from '../components/Footer'

export default function OnboardingPaymentReturn() {
  const [searchParams]        = useSearchParams()
  const token                 = searchParams.get('token')
  const { lang }              = useContext(LangCtx)
  const [status, setStatus]   = useState('checking') // checking | complete | incomplete | error
  const [praticien, setPraticien] = useState(null)
  const [retrying, setRetrying]   = useState(false)
  const attemptsRef           = useRef(0)

  useEffect(() => {
    let cancelled = false

    async function check() {
      if (!token) { if (!cancelled) setStatus('error'); return }

      // Retrouver le praticien via son token
      const { data: prat, error: pErr } = await supabase
        .from('praticiens')
        .select('id, prenom')
        .eq('onboarding_token', token)
        .single()

      if (pErr || !prat) { if (!cancelled) setStatus('error'); return }
      if (!cancelled) setPraticien(prat)

      // Interroger stripe_accounts, avec polling pour attendre le webhook
      async function poll() {
        const { data: sa } = await supabase
          .from('stripe_accounts')
          .select('charges_enabled, payouts_enabled, details_submitted, onboarding_completed')
          .eq('praticien_id', prat.id)
          .maybeSingle()

        if (cancelled) return

        const done = sa?.charges_enabled && sa?.details_submitted

        if (done) {
          setStatus('complete')
        } else if (attemptsRef.current < 5) {
          attemptsRef.current += 1
          setTimeout(poll, 2000)
        } else {
          setStatus('incomplete')
        }
      }

      poll()
    }

    check()
    return () => { cancelled = true }
  }, [token])

  async function handleRetry() {
    if (!praticien) return
    setRetrying(true)
    const { data, error } = await supabase.functions.invoke('create-stripe-account', {
      body: { praticien_id: praticien.id }
    })
    if (!error && data?.onboarding_url) {
      window.location.href = data.onboarding_url
    } else {
      setRetrying(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? 'Configuration des paiements — The Idala Family' : 'Payment setup — The Idala Family'}</title>
      </Helmet>

       <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div className="join-success" style={{ flex: 1, minHeight: 'auto' }}>
          <div className="join-success__card">

            {status === 'checking' && (
              <>
                <h1 className="join-success__title">
                  {lang === 'fr' ? 'Vérification en cours' : 'Verifying'}
                </h1>
                <p className="join-success__text">
                  {lang === 'fr'
                    ? <>Nous confirmons la configuration de vos paiements. <br/>Un instant.</>
                    : <>We are confirming your payment setup. <br/>One moment.</>}
                </p>
                <div className="onboarding-dots">
                  <span className="onboarding-dots__dot" style={{ background: 'var(--c1)' }} />
                  <span className="onboarding-dots__dot" style={{ background: 'var(--c2)' }} />
                  <span className="onboarding-dots__dot" style={{ background: 'var(--c3)' }} />
                  <span className="onboarding-dots__dot" style={{ background: 'var(--c4)' }} />
                  <span className="onboarding-dots__dot" style={{ background: 'var(--c5)' }} />
                  <span className="onboarding-dots__dot" style={{ background: 'var(--c6)' }} />
                  <span className="onboarding-dots__dot" style={{ background: 'var(--c7)' }} />
                </div>
              </>
            )}

            {status === 'complete' && (
              <>
                <p className="join-success__icon">✦</p>
                <h1 className="join-success__title">
                  {lang === 'fr'
                    ? `C'est fait${praticien ? ', ' + praticien.prenom : ''} !`
                    : `All set${praticien ? ', ' + praticien.prenom : ''}!`}
                </h1>
                <p className="join-success__text">
                  {lang === 'fr'
                    ? <>Vos paiements sont configurés et votre profil est désormais actif sur Idala. <br/>Vous pouvez commencer à recevoir des réservations.</>
                    : <>Your payments are set up and your profile is now active on Idala. <br/>You can start receiving bookings.</>}
                </p>
              </>
            )}

            {status === 'incomplete' && (
              <>
                <p className="join-success__icon">✦</p>
                <h1 className="join-success__title">
                  {lang === 'fr' ? 'Presque terminé' : 'Almost there'}
                </h1>
                <p className="join-success__text">
                  {lang === 'fr'
                    ? <>Il semble qu'il manque encore quelques informations pour finaliser la configuration de vos paiements. <br/>Vous pouvez reprendre là où vous vous êtes arrêté</>
                    : <>It looks like some information is still needed to complete your payment setup. <br/>You can pick up where you left off.</>}
                </p>
                <button
                  onClick={handleRetry}
                  className="btn btn--violet-mid"
                  disabled={retrying}
                  style={{ marginTop: '1.5rem' }}
                >
                  {retrying
                    ? (lang === 'fr' ? 'Redirection...' : 'Redirecting...')
                    : (lang === 'fr' ? 'Reprendre la configuration' : 'Resume setup')}
                </button>
              </>
            )}

            {status === 'error' && (
              <>
                <p className="join-success__icon">✦</p>
                <h1 className="join-success__title">
                  {lang === 'fr' ? 'Lien invalide' : 'Invalid link'}
                </h1>
                <p className="join-success__text">
                  {lang === 'fr'
                    ? <>Ce lien est invalide ou a expiré. <br />Merci de reprendre depuis le mail que vous avez reçu.</>
                    : <>This link is invalid or has expired. <br />Please start again from the email you received.</>}
                </p>
              </>
            )}

          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}