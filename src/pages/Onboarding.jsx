import { useEffect, useState, useContext } from 'react'
import { useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabaseClient'
import { LangCtx } from '../components/LangContext'
import Footer from '../components/Footer'

export default function Onboarding() {
  const { token }               = useParams()
  const { lang }                = useContext(LangCtx)
  const [praticien, setPraticien] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [iban, setIban]         = useState('')
  const [error, setError]       = useState(null)

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

  async function handleSubmit(e) {
    e.preventDefault()
    const ibanClean = iban.replace(/\s/g, '').toUpperCase()
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(ibanClean)) {
      setError(lang === 'fr' ? 'Format IBAN invalide.' : 'Invalid IBAN format.')
      return
    }
    setSaving(true)
    const { error } = await supabase.functions.invoke('complete-onboarding', {
      body: { token, iban: ibanClean }
    })
    if (!error) setSubmitted(true)
    setSaving(false)
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

  if (submitted) return (
    <div className="join-success">
      <div className="join-success__card">
        <p className="join-success__icon">✦</p>
        <h1 className="join-success__title">
          {lang === 'fr' ? 'Inscription finalisée !' : 'Registration complete!'}
        </h1>
        <p className="join-success__text">
          {lang === 'fr'
            ? 'Votre profil sera mis en ligne très prochainement. Bienvenue dans la famille !'
            : 'Your profile will be published very soon. Welcome to the family!'}
        </p>
      </div>
    </div>
  )

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? 'Finaliser mon inscription — The Idala Family' : 'Complete my registration — The Idala Family'}</title>
      </Helmet>

      <div className="join-page">
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
                ? 'Votre profil a été retenu pour rejoindre la famille IDALA. Pour finaliser votre inscription et mettre votre profil en ligne, veuillez renseigner votre IBAN ci-dessous. Vos informations sont sécurisées et ne seront jamais partagées.'
                : 'Your profile has been selected to join the IDALA family. To complete your registration and publish your profile, please enter your IBAN below. Your information is secure and will never be shared.'}
            </p>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="join-form">
          <div className="join-section">
            <div className="join-field">
              <label>IBAN *</label>
              <input
                required
                value={iban}
                placeholder="FR76..."
                onChange={e => { setIban(e.target.value); setError(null) }}
              />
              {error && <p className="join-error">{error}</p>}
            </div>
          </div>

          <div className="join-submit" style={{ paddingBottom: '3rem' }}>
            <button type="submit" className="btn btn--violet-mid" disabled={saving}>
              {saving
                ? (lang === 'fr' ? 'Envoi...' : 'Sending...')
                : (lang === 'fr' ? 'Confirmer mon inscription' : 'Confirm my registration')}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </>
  )
}