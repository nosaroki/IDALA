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
  visio:    { fr: 'En visio', en: 'Online' },
  domicile: { fr: 'À domicile', en: 'At home' },
  cabinet:  { fr: 'En cabinet', en: 'At the practice' },
}

export default function Reservation() {
  const { lang } = useContext(LangCtx)
  const { praticienSlug, pratiqueSlug } = useParams()

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

  const [clientSecret, setClientSecret] = useState(null)
  const [stripeAccountId, setStripeAccountId] = useState(null)
  const [preparingPayment, setPreparingPayment] = useState(false)
  const [payError, setPayError] = useState(null)

  // Charger praticien + prestation
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

        const { data: pp } = await supabase
          .from('praticien_pratiques')
          .select('prix, duree_seance, mode_seance, max_participants')
          .eq('praticien_id', prat.id)
          .eq('pratique_id', prq.id)
          .single()

        if (cancelled) return
        setPraticien(prat)
        setPratique(prq)
        setOffre(pp)
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
  }, [praticienSlug, pratiqueSlug, lang])

  const durationMin = useMemo(() => {
    return offre?.duree_seance ? parseInt(offre.duree_seance, 10) : 60
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
  const infosValid = clientName.trim().length > 1 && emailValid && cgvAccepted

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
            scheduled_at: selectedSlot.start,
            client_name: clientName,
            client_email: clientEmail,
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

// import { useState, useEffect, useContext, useMemo } from 'react'
// import { useParams, Link } from 'react-router-dom'
// import { Helmet } from 'react-helmet-async'
// import { loadStripe } from '@stripe/stripe-js'
// import { Elements } from '@stripe/react-stripe-js'
// import { LangCtx } from '../components/LangContext'
// import { supabase } from '../lib/supabaseClient'
// import PaymentForm from '../components/PaymentForm'
// import BookingCalendar from '../components/BookingCalendar'

// // const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
// const SUPABASE_FN = import.meta.env.VITE_SUPABASE_URL
// const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

// // Libellés de mode de séance
// const MODE_LABELS = {
//   visio:    { fr: 'En visio', en: 'Online' },
//   domicile: { fr: 'À domicile', en: 'At home' },
//   cabinet:  { fr: 'En cabinet', en: 'At the practice' },
// }

// export default function Reservation() {
//   const { lang } = useContext(LangCtx)
//   const { praticienSlug, pratiqueSlug } = useParams()

//   const [praticien, setPraticien] = useState(null)
//   const [pratique, setPratique] = useState(null)
//   const [offre, setOffre] = useState(null) // { prix, duree_seance, mode_seance, max_participants }
//   const [loading, setLoading] = useState(true)
//   const [loadError, setLoadError] = useState(null)

//   const [selectedSlot, setSelectedSlot] = useState(null)
//   const [clientName, setClientName] = useState('')
//   const [clientEmail, setClientEmail] = useState('')
//   const [cgvAccepted, setCgvAccepted] = useState(false)

//   const [clientSecret, setClientSecret] = useState(null)
//   const [stripeAccountId, setStripeAccountId] = useState(null)

//   const stripePromise = useMemo(() => {
//     if (!stripeAccountId) return null
//       return loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY, {
//         stripeAccount: stripeAccountId,
//       })
//     }, [stripeAccountId])
  
//   const [preparingPayment, setPreparingPayment] = useState(false)
//   const [payError, setPayError] = useState(null)

//   // ── Charger praticien + prestation ──
//   useEffect(() => {
//     let cancelled = false
//     async function load() {
//       setLoading(true)
//       setLoadError(null)
//       try {
//         const { data: prat } = await supabase
//           .from('praticiens')
//           .select('id, prenom, nom, slug')
//           .eq('slug', praticienSlug)
//           .single()

//         const { data: prq } = await supabase
//           .from('pratiques')
//           .select('id, nom, slug')
//           .eq('slug', pratiqueSlug)
//           .single()

//         if (!prat || !prq) {
//           if (!cancelled) setLoadError(
//             lang === 'fr' ? 'Praticien ou pratique introuvable.' : 'Practitioner or practice not found.'
//           )
//           return
//         }

//         const { data: pp } = await supabase
//           .from('praticien_pratiques')
//           .select('prix, duree_seance, mode_seance, max_participants')
//           .eq('praticien_id', prat.id)
//           .eq('pratique_id', prq.id)
//           .single()

//         if (cancelled) return
//         setPraticien(prat)
//         setPratique(prq)
//         setOffre(pp)
//       } catch (e) {
//         if (!cancelled) setLoadError(
//           lang === 'fr' ? 'Erreur de chargement.' : 'Loading error.'
//         )
//       } finally {
//         if (!cancelled) setLoading(false)
//       }
//     }
//     load()
//     return () => { cancelled = true }
//   }, [praticienSlug, pratiqueSlug, lang])

//   const durationMin = useMemo(() => {
//     return offre?.duree_seance ? parseInt(offre.duree_seance, 10) : 60
//   }, [offre])

//   // ── Préparer le paiement quand un créneau est choisi + infos client OK ──
//   async function preparePayment() {
//     setPayError(null)
//     if (!selectedSlot) return
//     if (!clientName.trim() || !clientEmail.trim()) {
//       setPayError(lang === 'fr' ? 'Renseignez votre nom et email.' : 'Enter your name and email.')
//       return
//     }
//     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
//       setPayError(lang === 'fr' ? 'Email invalide.' : 'Invalid email.')
//       return
//     }

//     setPreparingPayment(true)
//     try {
//       const res = await fetch(`${SUPABASE_FN}/functions/v1/create-payment-intent`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${SUPABASE_ANON}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           praticien_id: praticien.id,
//           pratique_id: pratique.id,
//           scheduled_at: selectedSlot.start,
//           client_name: clientName,
//           client_email: clientEmail,
//           lang,
//         }),
//       })
//       const data = await res.json()

//       if (data.error === 'PRACTITIONER_NOT_READY') {
//         setPayError(lang === 'fr'
//           ? 'Ce praticien ne peut pas encore recevoir de réservations. Réessayez plus tard.'
//           : 'This practitioner cannot accept bookings yet. Please try again later.')
//         return
//       }
//       if (!data.client_secret) {
//         setPayError(lang === 'fr' ? 'Impossible de préparer le paiement.' : 'Could not prepare payment.')
//         return
//       }
//       setClientSecret(data.client_secret)
//       setStripeAccountId(data.stripe_account_id)
//     } catch (e) {
//       setPayError(lang === 'fr' ? 'Erreur technique. Réessayez.' : 'Technical error. Please try again.')
//     } finally {
//       setPreparingPayment(false)
//     }
//   }

//   // ── Rendus d'état ──
//   if (loading) {
//     return (
//       <div className="resa-page">
//         <p className="resa-loading">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</p>
//       </div>
//     )
//   }

//   if (loadError) {
//     return (
//       <div className="resa-page">
//         <div className="resa-state-card">
//           <p className="resa-state-card__title">{lang === 'fr' ? 'Oups' : 'Oops'}</p>
//           <p className="resa-state-card__text">{loadError}</p>
//           <Link to="/" className="btn btn--violet-mid">{lang === 'fr' ? 'Retour à l\'accueil' : 'Back home'}</Link>
//         </div>
//       </div>
//     )
//   }

//   if (!offre || !offre.prix) {
//     return (
//       <div className="resa-page">
//         <div className="resa-state-card">
//           <p className="resa-state-card__title">{lang === 'fr' ? 'Prestation indisponible' : 'Unavailable'}</p>
//           <p className="resa-state-card__text">
//             {lang === 'fr'
//               ? 'Cette prestation n\'est pas encore réservable en ligne.'
//               : 'This service is not yet bookable online.'}
//           </p>
//           <Link to="/" className="btn btn--violet-mid">{lang === 'fr' ? 'Retour à l\'accueil' : 'Back home'}</Link>
//         </div>
//       </div>
//     )
//   }

//   const modeLabel = MODE_LABELS[offre.mode_seance]
//     ? (lang === 'fr' ? MODE_LABELS[offre.mode_seance].fr : MODE_LABELS[offre.mode_seance].en)
//     : offre.mode_seance

//   const stripeOptions = clientSecret ? {
//     clientSecret,
//     appearance: {
//       theme: 'flat',
//       variables: {
//         colorPrimary: '#9B6EBF',
//         colorText: '#3e295d',
//         fontFamily: 'Jost, sans-serif',
//         borderRadius: '8px',
//       },
//     },
//   } : null

//   return (
//     <>
//       <Helmet>
//         <title>
//           {lang === 'fr'
//             ? `Réserver ${pratique.nom} — The Idala Family`
//             : `Book ${pratique.nom} — The Idala Family`}
//         </title>
//       </Helmet>

//       <div className="resa-page">
//         {/* En-tête récap prestation */}
//         <header className="resa-header">
//           <p className="resa-header__eyebrow">{lang === 'fr' ? 'Réservation' : 'Booking'}</p>
//           <h1 className="resa-header__title">{pratique.nom}</h1>
//           <p className="resa-header__prat">
//             {lang === 'fr' ? 'avec' : 'with'} {praticien.prenom} {praticien.nom}
//           </p>
//           <div className="resa-header__meta">
//             <span>{durationMin} min</span>
//             <span className="resa-header__dot">·</span>
//             <span>{modeLabel}</span>
//             <span className="resa-header__dot">·</span>
//             <span className="resa-header__price">{offre.prix} €</span>
//           </div>
//         </header>

//         {/* Étape 1 : calendrier */}
//         <section className="resa-section">
//           <h2 className="resa-section__title">
//             <span className="resa-step-num">1</span>
//             {lang === 'fr' ? 'Choisissez un créneau' : 'Pick a time'}
//           </h2>
//           <BookingCalendar
//             praticienId={praticien.id}
//             lengthMinutes={durationMin}
//             onSelectSlot={(slot) => { setSelectedSlot(slot); setClientSecret(null) }}
//             selectedSlot={selectedSlot}
//           />
//         </section>

//         {/* Étape 2 : infos client (apparaît une fois le créneau choisi) */}
//         {selectedSlot && (
//           <section className="resa-section">
//             <h2 className="resa-section__title">
//               <span className="resa-step-num">2</span>
//               {lang === 'fr' ? 'Vos informations' : 'Your details'}
//             </h2>
//             <div className="resa-field">
//               <label>{lang === 'fr' ? 'Nom complet' : 'Full name'}</label>
//               <input
//                 value={clientName}
//                 onChange={e => { setClientName(e.target.value); setClientSecret(null) }}
//                 placeholder={lang === 'fr' ? 'Prénom Nom' : 'First name Last name'}
//               />
//             </div>
//             <div className="resa-field">
//               <label>Email</label>
//               <input
//                 type="email"
//                 value={clientEmail}
//                 onChange={e => { setClientEmail(e.target.value); setClientSecret(null) }}
//                 placeholder="vous@email.com"
//               />
//             </div>

//             <label className="resa-cgv">
//               <input
//                 type="checkbox"
//                 checked={cgvAccepted}
//                 onChange={e => setCgvAccepted(e.target.checked)}
//               />
//               <span>
//                 {lang === 'fr'
//                   ? <>J'accepte les <Link to="/cgv" className="resa-cgv__link">conditions générales de vente</Link>.</>
//                   : <>I accept the <Link to="/cgv" className="resa-cgv__link">terms and conditions</Link>.</>}
//               </span>
//             </label>

//             {!clientSecret && (
//               <>
//                 {payError && <p className="resa-error">{payError}</p>}
//                 <button
//                   type="button"
//                   className="btn btn--violet-mid"
//                   onClick={preparePayment}
//                   disabled={preparingPayment || !cgvAccepted}
//                 >
//                   {preparingPayment
//                     ? (lang === 'fr' ? 'Préparation...' : 'Preparing...')
//                     : (lang === 'fr' ? 'Continuer vers le paiement' : 'Continue to payment')}
//                 </button>
//               </>
//             )}
//           </section>
//         )}

//         {/* Étape 3 : paiement (apparaît une fois le PaymentIntent prêt) */}
//         {clientSecret && stripeOptions && stripePromise && (
//           <section className="resa-section">
//             <h2 className="resa-section__title">
//               <span className="resa-step-num">3</span>
//               {lang === 'fr' ? 'Paiement' : 'Payment'}
//             </h2>
//             <div className="resa-recap">
//               <span>{pratique.nom} · {selectedSlot.start.slice(0, 10)} · {selectedSlot.start.slice(11, 16)}</span>
//               <strong>{offre.prix} €</strong>
//             </div>
//             <Elements stripe={stripePromise} options={stripeOptions}>
//               <PaymentForm
//                 clientName={clientName}
//                 clientEmail={clientEmail}
//                 cgvAccepted={cgvAccepted}
//                 onError={setPayError}
//               />
//             </Elements>
//           </section>
//         )}
//       </div>
//     </>
//   )
// }
