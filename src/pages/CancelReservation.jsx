import { useState, useEffect, useContext } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { LangCtx } from '../components/LangContext'

const SUPABASE_FN = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

export default function CancelReservation() {
  const { lang } = useContext(LangCtx)
  const { token } = useParams()

  const [state, setState] = useState('loading') // loading | can_cancel | too_late | done | already | notfound | error
  const [info, setInfo] = useState(null)
  const [processing, setProcessing] = useState(false)

  // Vérifier l'état de la réservation au chargement
  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        const res = await fetch(`${SUPABASE_FN}/functions/v1/refund-reservation`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cancel_token: token, action: 'check' }),
        })
        const data = await res.json()
        if (cancelled) return

        if (data.error === 'NOT_FOUND') { setState('notfound'); return }
        if (data.error === 'ALREADY_CANCELLED') { setState('already'); return }
        if (data.error) { setState('error'); return }

        setInfo(data)
        setState(data.can_cancel ? 'can_cancel' : 'too_late')
      } catch (e) {
        if (!cancelled) setState('error')
      }
    }
    check()
    return () => { cancelled = true }
  }, [token])

  async function confirmCancel() {
    setProcessing(true)
    try {
      const res = await fetch(`${SUPABASE_FN}/functions/v1/refund-reservation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cancel_token: token }),
      })
      const data = await res.json()

      if (data.success) {
        setState('done')
      } else if (data.error === 'TOO_LATE') {
        setState('too_late')
      } else if (data.error === 'ALREADY_CANCELLED') {
        setState('already')
      } else {
        setState('error')
      }
    } catch (e) {
      setState('error')
    } finally {
      setProcessing(false)
    }
  }

  // Formatage date/heure du créneau
  let dateStr = '', timeStr = ''
  if (info?.scheduled_at) {
    const d = new Date(info.scheduled_at)
    dateStr = d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    timeStr = d.toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
      hour: '2-digit', minute: '2-digit',
    })
  }

  const priceEuros = info?.price_cents ? (info.price_cents / 100) : null

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? 'Annulation : The Idala Family' : 'Cancellation : The Idala Family'}</title>
      </Helmet>

      <div className="resa-page">
        <div className="resa-state-card">

          {state === 'loading' && (
            <p className="resa-state-card__text">
              {lang === 'fr' ? 'Chargement...' : 'Loading...'}
            </p>
          )}

          {state === 'can_cancel' && (
            <>
              <p className="resa-state-card__title">
                {lang === 'fr' ? 'Annuler votre réservation' : 'Cancel your booking'}
              </p>
              <p className="resa-state-card__text">
                {lang === 'fr'
                  ? <>Vous êtes sur le point d'annuler votre séance du <br/><strong>{dateStr}</strong> à <strong>{timeStr}</strong>.</>
                  : <>You are about to cancel your session on <br/><strong>{dateStr}</strong> at <strong>{timeStr}</strong>.</>}
              </p>
              <p className="resa-state-card__text">
                {lang === 'fr'
                  ? <>Un remboursement intégral{priceEuros ? <> de <strong>{priceEuros} €</strong></> : ''} sera effectué. <br/>Le crédit apparaît sous cinq à dix jours ouvrés selon votre banque.</>
                  : <>A full refund{priceEuros ? <> of <strong>{priceEuros} €</strong></> : ''} will be issued. <br/>The credit appears within five to ten business days depending on your bank.</>}
              </p>
              <button
                type="button"
                className="btn btn--violet-mid"
                onClick={confirmCancel}
                disabled={processing}
              >
                {processing
                  ? (lang === 'fr' ? 'Annulation en cours...' : 'Cancelling...')
                  : (lang === 'fr' ? 'Confirmer l\'annulation' : 'Confirm cancellation')}
              </button>
            </>
          )}

          {state === 'too_late' && (
            <>
              <p className="resa-state-card__title">
                {lang === 'fr' ? 'Annulation impossible' : 'Cancellation not possible'}
              </p>
              <p className="resa-state-card__text">
                {lang === 'fr'
                  ? <>Votre séance a lieu dans moins de 24 heures. <br/>Conformément aux conditions générales de vente, elle ne peut plus être annulée ni remboursée.</>
                  : <>Your session takes place in less than 24 hours. <br/>In accordance with the terms and conditions, it can no longer be cancelled or refunded.</>}
              </p>
              <Link to="/" className="btn btn--violet-mid">
                {lang === 'fr' ? 'Retour à l\'accueil' : 'Back home'}
              </Link>
            </>
          )}

          {state === 'done' && (
            <>
              <p className="resa-state-card__icon">✦</p>
              <p className="resa-state-card__title">
                {lang === 'fr' ? 'Réservation annulée' : 'Booking cancelled'}
              </p>
              <p className="resa-state-card__text">
                {lang === 'fr'
                  ? <>Votre réservation a bien été annulée et votre remboursement est en cours de traitement. <br/>Vous recevrez le crédit sous cinq à dix jours ouvrés.</>
                  : <>Your booking has been cancelled and your refund is being processed. <br/>You will receive the credit within five to ten business days.</>}
              </p>
              <Link to="/" className="btn btn--violet-mid">
                {lang === 'fr' ? 'Retour à l\'accueil' : 'Back home'}
              </Link>
            </>
          )}

          {state === 'already' && (
            <>
              <p className="resa-state-card__title">
                {lang === 'fr' ? 'Déjà annulée' : 'Already cancelled'}
              </p>
              <p className="resa-state-card__text">
                {lang === 'fr'
                  ? 'Cette réservation a déjà été annulée.'
                  : 'This booking has already been cancelled.'}
              </p>
              <Link to="/" className="btn btn--violet-mid">
                {lang === 'fr' ? 'Retour à l\'accueil' : 'Back home'}
              </Link>
            </>
          )}

          {state === 'notfound' && (
            <>
              <p className="resa-state-card__title">
                {lang === 'fr' ? 'Réservation introuvable' : 'Booking not found'}
              </p>
              <p className="resa-state-card__text">
                {lang === 'fr'
                  ? 'Ce lien d\'annulation n\'est pas valide. Pour toute question, écrivez à contact@theidalafamily.com.'
                  : 'This cancellation link is not valid. For any question, email us at contact@theidalafamily.com.'}
              </p>
              <Link to="/" className="btn btn--violet-mid">
                {lang === 'fr' ? 'Retour à l\'accueil' : 'Back home'}
              </Link>
            </>
          )}

          {state === 'error' && (
            <>
              <p className="resa-state-card__title">
                {lang === 'fr' ? 'Une erreur est survenue' : 'An error occurred'}
              </p>
              <p className="resa-state-card__text">
                {lang === 'fr'
                  ? 'Impossible de traiter votre demande pour le moment. Réessayez ou écrivez à contact@theidalafamily.com.'
                  : 'We could not process your request at the moment. Please try again or email us at contact@theidalafamily.com.'}
              </p>
              <Link to="/" className="btn btn--violet-mid">
                {lang === 'fr' ? 'Retour à l\'accueil' : 'Back home'}
              </Link>
            </>
          )}

        </div>
      </div>
    </>
  )
}