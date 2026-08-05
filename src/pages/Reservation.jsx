import { useState, useEffect, useContext, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { LangCtx } from '../components/LangContext'
import { supabase } from '../lib/supabaseClient'
import PaymentForm from '../components/PaymentForm'
import BookingCalendar from '../components/BookingCalendar'

const SUPABASE_FN = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

const MODE_LABELS = {
  visio:       { fr: 'En visio', en: 'Online' },
  home:        { fr: 'À domicile', en: 'At home' },
  'in-person': { fr: 'En cabinet', en: 'At the practice' },
}

export default function Reservation() {
  const { lang } = useContext(LangCtx)
  const { praticienSlug, pratiqueSlug, offreId } = useParams()

  const [praticien, setPraticien] = useState(null)
  const [pratique, setPratique] = useState(null)
  const [offre, setOffre] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  // Étape courante : 'slot' (calendrier) ou 'finalize' (infos + paiement)
  const [step, setStep] = useState('slot')

  const [selectedSlot, setSelectedSlot] = useState(null)
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [cgvAccepted, setCgvAccepted] = useState(false)

  const [clientAdresse, setClientAdresse] = useState('')
  const [clientCodePostal, setClientCodePostal] = useState('')
  const [clientVille, setClientVille] = useState('')
  const [clientDigicode, setClientDigicode] = useState('')
  const [clientInterphone, setClientInterphone] = useState('')
  const [clientEtage, setClientEtage] = useState('')
  const [clientComplement, setClientComplement] = useState('')

  const [clientSecret, setClientSecret] = useState(null)
  const [stripeAccountId, setStripeAccountId] = useState(null)
  const [preparingPayment, setPreparingPayment] = useState(false)
  const [payError, setPayError] = useState(null)
  const [slotTakenMsg, setSlotTakenMsg] = useState(null)

  // Charger praticien + pratique + offre
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const { data: prat } = await supabase
          .from('praticiens')
          .select('id, prenom, nom, slug')
          .eq('slug', praticienSlug)
          .single()

        const { data: prq } = await supabase
          .from('pratiques')
          .select('id, nom, slug')
          .eq('slug', pratiqueSlug)
          .single()

        if (!prat || !prq) {
          if (!cancelled) setLoadError(
            lang === 'fr' ? 'Praticien ou pratique introuvable.' : 'Practitioner or practice not found.'
          )
          return
        }

        // Source unique de l'offre réservable : praticien_offres, via l'id passé dans l'URL
        const { data: offreData } = await supabase
          .from('praticien_offres')
          .select('id, prix, duree, mode_seance, max_participants')
          .eq('id', offreId)
          .single()

        if (cancelled) return
        setPraticien(prat)
        setPratique(prq)
        setOffre(offreData)
      } catch (e) {
        if (!cancelled) setLoadError(
          lang === 'fr' ? 'Erreur de chargement.' : 'Loading error.'
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [praticienSlug, pratiqueSlug, offreId, lang])

  const durationMin = useMemo(() => {
    return offre?.duree ? parseInt(offre.duree, 10) : 60
  }, [offre])

  // Instance Stripe liée au compte connecté du praticien
  const stripePromise = useMemo(() => {
    if (!stripeAccountId) return null
    return loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY, {
      stripeAccount: stripeAccountId,
    })
  }, [stripeAccountId])

  // Email valide ?
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)
  const isHome = offre?.mode_seance === 'home'
  const addressValid = !isHome || (clientAdresse.trim() && clientCodePostal.trim() && clientVille.trim())
  const infosValid = clientName.trim().length > 1 && emailValid && cgvAccepted && addressValid

  // Préparer le paiement automatiquement quand les infos deviennent valides
  useEffect(() => {
    if (step !== 'finalize' || !selectedSlot || !infosValid || clientSecret || preparingPayment) return

    let cancelled = false
    async function preparePayment() {
      setPayError(null)
      setPreparingPayment(true)
      try {
        const res = await fetch(`${SUPABASE_FN}/functions/v1/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            praticien_id: praticien.id,
            pratique_id: pratique.id,
            offre_id: offreId,
            scheduled_at: selectedSlot.start,
            client_name: clientName,
            client_email: clientEmail,
            client_adresse:     isHome ? clientAdresse     : null,
            client_code_postal: isHome ? clientCodePostal  : null,
            client_ville:       isHome ? clientVille       : null,
            client_digicode:    isHome ? clientDigicode    : null,
            client_interphone:  isHome ? clientInterphone  : null,
            client_etage:       isHome ? clientEtage       : null,
            client_complement:  isHome ? clientComplement  : null,
            lang,
          }),
        })
        const data = await res.json()
        if (cancelled) return

        if (data.error === 'PRACTITIONER_NOT_READY') {
          
          setPayError(lang === 'fr'
            ? 'Ce praticien ne peut pas encore recevoir de réservations.'
            : 'This practitioner cannot accept bookings yet.')
          return
        }
        if (data.error === 'SLOT_TAKEN') {
          
          // Le créneau a été pris entre-temps : on renvoie au calendrier
          setSlotTakenMsg(lang === 'fr'
            ? <>Ce créneau vient d'être réservé par quelqu'un d'autre. <br/>Merci d'en choisir un autre.</>
            : <>This time slot has just been booked by someone else. <br/>Please choose another one.</>)
          setSelectedSlot(null)
          setStep('slot')
          return
        }
        if (!data.client_secret) {
          setPayError(lang === 'fr' ? 'Impossible de préparer le paiement.' : 'Could not prepare payment.')
          return
        }
        setClientSecret(data.client_secret)
        setStripeAccountId(data.stripe_account_id)
      } catch (e) {
        if (!cancelled) setPayError(lang === 'fr' ? 'Erreur technique. Réessayez.' : 'Technical error. Please try again.')
      } finally {
        if (!cancelled) setPreparingPayment(false)
      }
    }
    preparePayment()
    return () => { cancelled = true }
  }, [step, selectedSlot, infosValid])

  // Si le client modifie ses infos après préparation, on réinitialise le paiement
  function resetPaymentOnEdit() {
    if (clientSecret) {
      setClientSecret(null)
      setStripeAccountId(null)
    }
  }

  function handleSelectSlot(slot) {
    setSelectedSlot(slot)
    setSlotTakenMsg(null)
    setStep('finalize')
  }

  function backToCalendar() {
    setStep('slot')
    setClientSecret(null)
    setStripeAccountId(null)
    setPayError(null)
  }

  if (loading) {
    return (
      <div className="resa-page">
        <p className="resa-loading">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="resa-page">
        <div className="resa-state-card">
          <p className="resa-state-card__title">{lang === 'fr' ? 'Oups' : 'Oops'}</p>
          <p className="resa-state-card__text">{loadError}</p>
          <Link to="/" className="btn btn--violet-mid">{lang === 'fr' ? 'Retour à l\'accueil' : 'Back home'}</Link>
        </div>
      </div>
    )
  }

  if (!offre || !offre.prix) {
    return (
      <div className="resa-page">
        <div className="resa-state-card">
          <p className="resa-state-card__title">{lang === 'fr' ? 'Prestation indisponible' : 'Unavailable'}</p>
          <p className="resa-state-card__text">
            {lang === 'fr'
              ? 'Cette prestation n\'est pas encore réservable en ligne.'
              : 'This service is not yet bookable online.'}
          </p>
          <Link to="/" className="btn btn--violet-mid">{lang === 'fr' ? 'Retour à l\'accueil' : 'Back home'}</Link>
        </div>
      </div>
    )
  }

  const modeLabel = MODE_LABELS[offre.mode_seance]
    ? (lang === 'fr' ? MODE_LABELS[offre.mode_seance].fr : MODE_LABELS[offre.mode_seance].en)
    : offre.mode_seance

  const stripeOptions = clientSecret ? {
    clientSecret,
    appearance: {
      theme: 'flat',
      variables: {
        colorPrimary: '#9B6EBF',
        colorText: '#3e295d',
        fontFamily: 'Jost, sans-serif',
        borderRadius: '8px',
      },
    },
  } : null

  // Formatage du créneau choisi pour le rappel
  let slotDateStr = '', slotTimeStr = ''
  if (selectedSlot) {
    const d = new Date(selectedSlot.start)
    slotDateStr = d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
    slotTimeStr = selectedSlot.start.slice(11, 16)
  }

  console.log('RENDER STATE:', {
  step,
  infosValid,
  preparingPayment,
  hasClientSecret: !!clientSecret,
  hasStripePromise: !!stripePromise,
  hasStripeOptions: !!stripeOptions,
})

  return (
    <>
      <Helmet>
        <title>
          {lang === 'fr'
            ? `Réserver ${pratique.nom} : The Idala Family`
            : `Book ${pratique.nom} : The Idala Family`}
        </title>
      </Helmet>

      <div className="resa-page">
        {/* En-tête récap prestation (toujours visible) */}
        <header className="resa-header">
          <p className="resa-header__eyebrow">{lang === 'fr' ? 'Réservation' : 'Booking'}</p>
          <h1 className="resa-header__title">{pratique.nom}</h1>
          <p className="resa-header__prat">
            {lang === 'fr' ? 'avec' : 'with'} {praticien.prenom} {praticien.nom}
          </p>
          <div className="resa-header__meta">
            <span>{durationMin} min</span>
            <span className="resa-header__dot">·</span>
            <span>{modeLabel}</span>
            <span className="resa-header__dot">·</span>
            <span className="resa-header__price">{offre.prix} €</span>
          </div>
        </header>

        {/* ETAPE 1 : CALENDRIER */}
        {step === 'slot' && (
          <section className="resa-section">
            <h2 className="resa-section__title">
              {lang === 'fr' ? 'Choisissez un créneau' : 'Pick a time'}
            </h2>
            {slotTakenMsg && (
              <div className="resa-slot-recap" style={{ background: '#FF9A3C18', border: '1px solid #FF9A3C44' }}>
                <p className="resa-state-card__text" style={{ margin: 0 }}>{slotTakenMsg}</p>
              </div>
            )}

            <BookingCalendar
              praticienId={praticien.id}
              lengthMinutes={durationMin}
              onSelectSlot={handleSelectSlot}
              selectedSlot={selectedSlot}
            />
          </section>
        )}

        {/* ETAPE 2 : FINALISATION (infos + paiement) */}
        {step === 'finalize' && selectedSlot && (
          <section className="resa-section">
            {/* Rappel du créneau + modifier */}
            <div className="resa-slot-recap">
              <div>
                <p className="resa-slot-recap__label">{lang === 'fr' ? 'Votre créneau' : 'Your time'}</p>
                <p className="resa-slot-recap__value">{slotDateStr} · {slotTimeStr}</p>
              </div>
              <button type="button" className="resa-slot-recap__edit" onClick={backToCalendar}>
                ‹ {lang === 'fr' ? 'Modifier le créneau' : 'Change time'}
              </button>
            </div>

            {/* Infos client */}
            <div className="resa-field">
              <label>{lang === 'fr' ? 'Nom complet' : 'Full name'}</label>
              <input
                value={clientName}
                onChange={e => { setClientName(e.target.value); resetPaymentOnEdit() }}
                placeholder={lang === 'fr' ? 'Prénom Nom' : 'First name Last name'}
              />
            </div>
            <div className="resa-field">
              <label>Email</label>
              <input
                type="email"
                value={clientEmail}
                onChange={e => { setClientEmail(e.target.value); resetPaymentOnEdit() }}
                placeholder="vous@email.com"
              />
            </div>

            {isHome && (
              <div className="resa-address-block">
                <p className="resa-hint" style={{ marginTop: 0, marginBottom: '12px' }}>
                  {lang === 'fr'
                    ? 'Cette séance a lieu à votre domicile. Indiquez l\'adresse où le praticien doit se rendre.'
                    : 'This session takes place at your home. Please provide the address where the practitioner should come.'}
                </p>
                <div className="resa-field">
                  <label>{lang === 'fr' ? 'Adresse' : 'Address'}</label>
                  <input value={clientAdresse}
                    onChange={e => { setClientAdresse(e.target.value); resetPaymentOnEdit() }}
                    placeholder={lang === 'fr' ? '123 rue des bois' : '123 Wood Street'} />
                </div>
                <div className="resa-field">
                  <label>{lang === 'fr' ? 'Code postal' : 'Postal code'}</label>
                  <input value={clientCodePostal}
                    onChange={e => { setClientCodePostal(e.target.value); resetPaymentOnEdit() }} />
                </div>
                <div className="resa-field">
                  <label>{lang === 'fr' ? 'Ville' : 'City'}</label>
                  <input value={clientVille}
                    onChange={e => { setClientVille(e.target.value); resetPaymentOnEdit() }} />
                </div>
                <div className="resa-field">
                  <label>{lang === 'fr' ? 'Digicode' : 'Door code'}</label>
                  <input value={clientDigicode}
                    onChange={e => { setClientDigicode(e.target.value); resetPaymentOnEdit() }} />
                </div>
                <div className="resa-field">
                  <label>{lang === 'fr' ? 'Interphone' : 'Intercom'}</label>
                  <input value={clientInterphone}
                    onChange={e => { setClientInterphone(e.target.value); resetPaymentOnEdit() }} />
                </div>
                <div className="resa-field">
                  <label>{lang === 'fr' ? 'Étage' : 'Floor'}</label>
                  <input value={clientEtage}
                    onChange={e => { setClientEtage(e.target.value); resetPaymentOnEdit() }} />
                </div>
                <div className="resa-field">
                  <label>{lang === 'fr' ? 'Complément' : 'Additional info'}</label>
                  <input value={clientComplement}
                    onChange={e => { setClientComplement(e.target.value); resetPaymentOnEdit() }} />
                </div>
              </div>
            )}

            <label className="resa-cgv">
              <input
                type="checkbox"
                checked={cgvAccepted}
                onChange={e => { setCgvAccepted(e.target.checked); resetPaymentOnEdit() }}
              />
              <span>
                {lang === 'fr'
                  ? <>J'accepte les <Link to="/cgu" className="resa-cgv__link">conditions générales de vente</Link>.</>
                  : <>I accept the <Link to="/cgu" className="resa-cgv__link">terms and conditions</Link>.</>}
              </span>
            </label>

            {/* Paiement : apparait des que les infos sont valides */}
            {!infosValid && (
              <p className="resa-hint">
                {lang === 'fr'
                  ? 'Renseignez votre nom, votre email et acceptez les conditions pour accéder au paiement.'
                  : 'Enter your name, email and accept the terms to access payment.'}
              </p>
            )}

            {infosValid && preparingPayment && !clientSecret && (
              <p className="resa-hint">{lang === 'fr' ? 'Préparation du paiement...' : 'Preparing payment...'}
              <div className="onboarding-dots">
                  <span className="onboarding-dots__dot" style={{ background: 'var(--c1)' }} />
                  <span className="onboarding-dots__dot" style={{ background: 'var(--c2)' }} />
                  <span className="onboarding-dots__dot" style={{ background: 'var(--c3)' }} />
                  <span className="onboarding-dots__dot" style={{ background: 'var(--c4)' }} />
                  <span className="onboarding-dots__dot" style={{ background: 'var(--c5)' }} />
                  <span className="onboarding-dots__dot" style={{ background: 'var(--c6)' }} />
                  <span className="onboarding-dots__dot" style={{ background: 'var(--c7)' }} />
                </div></p>
              
            )}

            {payError && <p className="resa-error">{payError}</p>}

            {infosValid && clientSecret && stripeOptions && stripePromise && (
              <div className="resa-payment-wrap">
                <div className="resa-recap">
                  <span>{pratique.nom} · {slotDateStr} · {slotTimeStr}</span>
                  <strong>{offre.prix} €</strong>
                </div>
                <Elements stripe={stripePromise} options={stripeOptions}>
                  <PaymentForm
                    clientName={clientName}
                    clientEmail={clientEmail}
                    cgvAccepted={cgvAccepted}
                    onError={setPayError}
                  />
                </Elements>
              </div>
            )}
          </section>
        )}
      </div>
    </>
  )
}