import { useEffect, useState, useContext } from 'react'
import { useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabaseClient'
import { LangCtx } from '../components/LangContext'
import Footer from '../components/Footer'

export default function Onboarding() {
  const { token }                 = useParams()
  const { lang }                  = useContext(LangCtx)
  const [praticien, setPraticien] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [notFound, setNotFound]   = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [error, setError]         = useState(null)

  useEffect(() => {
    async function fetchPraticien() {
      const { data, error } = await supabase
        .from('praticiens')
        .select('id, prenom, nom')
        .eq('onboarding_token', token)
        .single()

      if (error || !data) { setNotFound(true); setLoading(false); return }
      setPraticien(data)
      setLoading(false)
    }
    fetchPraticien()
  }, [token])

  async function handleStartStripe() {
    setRedirecting(true)
    setError(null)

    const { data, error } = await supabase.functions.invoke('create-stripe-account', {
      body: { praticien_id: praticien.id }
    })

    if (error || !data?.onboarding_url) {
      setError(lang === 'fr'
        ? 'Une erreur est survenue. Merci de réessayer dans un instant.'
        : 'Something went wrong. Please try again in a moment.')
      setRedirecting(false)
      return
    }

    // Redirection vers l'onboarding Stripe hébergé
    window.location.href = data.onboarding_url
  }

  if (loading) return <div style={{ minHeight: '60vh', background: 'var(--root-bg)' }} />

  if (notFound) return (
    <div className="join-success">
      <div className="join-success__card">
        <p className="join-success__icon">✦</p>
        <h1 className="join-success__title">
          {lang === 'fr' ? 'Lien invalide' : 'Invalid link'}
        </h1>
        <p className="join-success__text">
          {lang === 'fr'
            ? 'Ce lien est invalide ou a déjà été utilisé.'
            : 'This link is invalid or has already been used.'}
        </p>
      </div>
    </div>
  )

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? 'Finaliser mon inscription — The Idala Family' : 'Complete my registration — The Idala Family'}</title>
      </Helmet>

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div className="join-page" style={{ flex: 1 }}>
        <section className="join-hero">
          <p className="join-hero__eyebrow">
            {lang === 'fr' ? 'Bienvenue' : 'Welcome'}
          </p>
          <h1 className="join-hero__title">
            {lang === 'fr'
              ? `Félicitations ${praticien.prenom} !`
              : `Congratulations ${praticien.prenom}!`}
          </h1>
          <div className="join-hero__body">
            <p>
              {lang === 'fr'
                ? 'Votre profil a été retenu pour rejoindre la famille Idala. Dernière étape avant la mise en ligne : configurer vos paiements. Cette étape sécurisée vous permet de recevoir vos honoraires directement après chaque séance.'
                : 'Your profile has been selected to join the Idala family. One last step before going live: setting up your payments. This secure step lets you receive your fees directly after each session.'}
            </p>
            <p style={{ marginTop: '1rem' }}>
              {lang === 'fr'
                ? 'Vous serez redirigé vers notre partenaire de paiement Stripe pour renseigner votre identité et vos coordonnées bancaires. Vos informations sont traitées et sécurisées par Stripe, jamais stockées par Idala.'
                : 'You will be redirected to our payment partner Stripe to provide your identity and bank details. Your information is handled and secured by Stripe, never stored by Idala.'}
            </p>
          </div>
        </section>

        <div className="join-submit" style={{ paddingBottom: '3rem', textAlign: 'center' }}>
          {error && <p className="join-error" style={{ marginBottom: '1rem' }}>{error}</p>}
          <button
            onClick={handleStartStripe}
            className="btn btn--violet-mid"
            disabled={redirecting}
          >
            {redirecting
              ? (lang === 'fr' ? 'Redirection...' : 'Redirecting...')
              : (lang === 'fr' ? 'Configurer mes paiements' : 'Set up my payments')}
          </button>
        </div>
      </div>
    </div>
      <Footer />
    </>
  )
}