import { useState, useEffect, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { LangCtx } from '../components/LangContext'
import { supabase } from '../lib/supabaseClient'

const MODE_LABELS = {
  visio:    { fr: 'En visio', en: 'Online' },
  domicile: { fr: 'À domicile', en: 'At home' },
  cabinet:  { fr: 'En cabinet', en: 'At the practice' },
}

// Lit un paramètre dans l'URL, en gérant le HashRouter (#/...?param=...)
function getUrlParam(name) {
  // Cas 1 : paramètre dans le hash (HashRouter) → #/reservation/confirmation?payment_intent=...
  const hash = window.location.hash
  const qIndex = hash.indexOf('?')
  if (qIndex !== -1) {
    const params = new URLSearchParams(hash.slice(qIndex + 1))
    if (params.get(name)) return params.get(name)
  }
  // Cas 2 : paramètre dans la query classique
  const search = new URLSearchParams(window.location.search)
  return search.get(name)
}

export default function ReservationConfirmation() {
  const { lang } = useContext(LangCtx)
  const navigate = useNavigate()

  const [status, setStatus] = useState('loading') // loading | success | failed | notfound
  const [reservation, setReservation] = useState(null)

  useEffect(() => {
    const redirectStatus = getUrlParam('redirect_status')
    const paymentIntentId = getUrlParam('payment_intent')

    // Paiement échoué côté Stripe
    if (redirectStatus === 'failed') {
      setStatus('failed')
      return
    }

    if (!paymentIntentId) {
      setStatus('notfound')
      return
    }

    // Chercher la réservation créée par le webhook (avec retry, le webhook peut avoir un léger délai)
    let attempts = 0
    let cancelled = false

    async function findReservation() {
      attempts++
      const { data } = await supabase
        .from('reservations')
        .select(`
          id, client_name, status, price_cents, lang,
          sessions ( scheduled_at, duration_minutes, mode_seance ),
          praticiens ( prenom, nom ),
          pratiques ( nom )
        `)
        .eq('stripe_payment_intent_id', paymentIntentId)
        .maybeSingle()

      if (cancelled) return

      if (data && data.status === 'confirmed') {
        setReservation(data)
        setStatus('success')
      } else if (attempts < 6) {
        // Réessaie quelques fois (le webhook crée la résa en arrière-plan)
        setTimeout(findReservation, 1500)
      } else {
        // Paiement peut-être passé mais résa pas encore visible : on reste positif
        setStatus('success')
      }
    }

    findReservation()
    return () => { cancelled = true }
  }, [])

  // ── Rendu ──
  if (status === 'loading') {
    return (
      <div className="resa-page">
        <p className="resa-loading">
          {lang === 'fr' ? 'Confirmation de votre réservation...' : 'Confirming your booking...'}
        </p>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="resa-page">
        <div className="resa-state-card">
          <p className="resa-state-card__icon">⚠</p>
          <p className="resa-state-card__title">
            {lang === 'fr' ? 'Paiement non abouti' : 'Payment failed'}
          </p>
          <p className="resa-state-card__text">
            {lang === 'fr'
              ? 'Votre paiement n\'a pas pu être finalisé. Aucun montant n\'a été débité. Vous pouvez réessayer.'
              : 'Your payment could not be completed. No amount was charged. You can try again.'}
          </p>
          <button onClick={() => navigate(-1)} className="btn btn--violet-mid">
            {lang === 'fr' ? 'Réessayer' : 'Try again'}
          </button>
        </div>
      </div>
    )
  }

  if (status === 'notfound') {
    return (
      <div className="resa-page">
        <div className="resa-state-card">
          <p className="resa-state-card__title">
            {lang === 'fr' ? 'Réservation introuvable' : 'Booking not found'}
          </p>
          <p className="resa-state-card__text">
            {lang === 'fr'
              ? 'Nous n\'avons pas trouvé de réservation associée. Si vous avez été débité, contactez-nous.'
              : 'We could not find an associated booking. If you were charged, please contact us.'}
          </p>
          <Link to="/" className="btn btn--violet-mid">
            {lang === 'fr' ? 'Retour à l\'accueil' : 'Back home'}
          </Link>
        </div>
      </div>
    )
  }

  // status === 'success'
  const session = reservation?.sessions
  const prat = reservation?.praticiens
  const prq = reservation?.pratiques
  const modeLabel = session?.mode_seance && MODE_LABELS[session.mode_seance]
    ? (lang === 'fr' ? MODE_LABELS[session.mode_seance].fr : MODE_LABELS[session.mode_seance].en)
    : null

  let dateStr = '', timeStr = ''
  if (session?.scheduled_at) {
    const d = new Date(session.scheduled_at)
    dateStr = d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    timeStr = d.toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? 'Réservation confirmée — The Idala Family' : 'Booking confirmed — The Idala Family'}</title>
      </Helmet>

      <div className="resa-page">
        <div className="resa-confirm">
          <p className="resa-confirm__icon">✦</p>
          <h1 className="resa-confirm__title">
            {lang === 'fr' ? 'Réservation confirmée' : 'Booking confirmed'}
          </h1>
          <p className="resa-confirm__text">
            {lang === 'fr'
              ? 'Merci, votre séance est réservée. Un email de confirmation vous a été envoyé avec tous les détails.'
              : 'Thank you, your session is booked. A confirmation email with all the details has been sent to you.'}
          </p>

          {reservation && (prat || session) && (
            <div className="resa-confirm__recap">
              {prq && (
                <div className="resa-confirm__row">
                  <span>{lang === 'fr' ? 'Séance' : 'Session'}</span>
                  <strong>{prq.nom}</strong>
                </div>
              )}
              {prat && (
                <div className="resa-confirm__row">
                  <span>{lang === 'fr' ? 'Avec' : 'With'}</span>
                  <strong>{prat.prenom} {prat.nom?.charAt(0)}.</strong>
                </div>
              )}
              {dateStr && (
                <div className="resa-confirm__row">
                  <span>{lang === 'fr' ? 'Date' : 'Date'}</span>
                  <strong>{dateStr}</strong>
                </div>
              )}
              {timeStr && (
                <div className="resa-confirm__row">
                  <span>{lang === 'fr' ? 'Heure' : 'Time'}</span>
                  <strong>{timeStr}</strong>
                </div>
              )}
              {modeLabel && (
                <div className="resa-confirm__row">
                  <span>{lang === 'fr' ? 'Format' : 'Format'}</span>
                  <strong>{modeLabel}</strong>
                </div>
              )}
            </div>
          )}

          <Link to="/" className="btn btn--violet-mid">
            {lang === 'fr' ? 'Retour à l\'accueil' : 'Back home'}
          </Link>
        </div>
      </div>
    </>
  )
}