import { useState, useEffect, useContext } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { LangCtx } from '../components/LangContext'
import BookingCalendar from '../components/BookingCalendar'

const SUPABASE_FN = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

export default function ModifyReservation() {
  const { lang } = useContext(LangCtx)
  const { token } = useParams()

  const [state, setState] = useState('loading') // loading | can_modify | too_late | done | already | notfound | error
  const [info, setInfo] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [slotError, setSlotError] = useState(null)

  // Vérifier l'état au chargement
  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        const res = await fetch(`${SUPABASE_FN}/functions/v1/modify-reservation`, {
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
        setState(data.can_modify ? 'can_modify' : 'too_late')
      } catch (e) {
        if (!cancelled) setState('error')
      }
    }
    check()
    return () => { cancelled = true }
  }, [token])

  async function confirmModify() {
    if (!selectedSlot) return
    setProcessing(true)
    setSlotError(null)
    try {
      const res = await fetch(`${SUPABASE_FN}/functions/v1/modify-reservation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cancel_token: token, new_start: selectedSlot.start }),
      })
      const data = await res.json()

      if (data.success) {
        setInfo(prev => ({ ...prev, scheduled_at: data.new_scheduled_at }))
        setState('done')
      } else if (data.error === 'SLOT_TAKEN') {
        setSlotError(lang === 'fr'
          ? 'Ce créneau vient d\'être réservé. Merci d\'en choisir un autre.'
          : 'This slot has just been taken. Please choose another one.')
        setSelectedSlot(null)
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

  // Formatage de l'ancien créneau
  let oldDateStr = '', oldTimeStr = ''
  if (info?.scheduled_at) {
    const d = new Date(info.scheduled_at)
    oldDateStr = d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    oldTimeStr = d.toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
      hour: '2-digit', minute: '2-digit',
    })
  }

  // Formatage du nouveau créneau choisi
  let newDateStr = '', newTimeStr = ''
  if (selectedSlot) {
    const d = new Date(selectedSlot.start)
    newDateStr = d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
    newTimeStr = selectedSlot.start.slice(11, 16)
  }

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? 'Modifier mon rendez-vous : The Idala Family' : 'Reschedule : The Idala Family'}</title>
      </Helmet>

      <div className="resa-page">

        {state === 'loading' && (
          <div className="resa-state-card">
            <p className="resa-state-card__text">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</p>
          </div>
        )}

        {state === 'can_modify' && info && (
          <>
            <header className="resa-header">
              <p className="resa-header__eyebrow">{lang === 'fr' ? 'Modification' : 'Reschedule'}</p>
              <h1 className="resa-header__title">
                {lang === 'fr' ? 'Choisissez un nouveau créneau' : 'Pick a new time'}
              </h1>
              <p className="resa-header__prat">
                {lang === 'fr'
                  ? <>Rendez-vous actuel : {oldDateStr} à {oldTimeStr}</>
                  : <>Current appointment: {oldDateStr} at {oldTimeStr}</>}
              </p>
            </header>

            <section className="resa-section">
              {slotError && <p className="resa-error">{slotError}</p>}

              <BookingCalendar
                praticienId={info.praticien_id}
                lengthMinutes={info.duration_minutes || 60}
                onSelectSlot={setSelectedSlot}
                selectedSlot={selectedSlot}
              />

              {selectedSlot && (
                <div className="resa-payment-wrap">
                  <div className="resa-slot-recap">
                    <div>
                      <p className="resa-slot-recap__label">{lang === 'fr' ? 'Nouveau créneau' : 'New time'}</p>
                      <p className="resa-slot-recap__value">{newDateStr} · {newTimeStr}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn--violet-mid"
                    onClick={confirmModify}
                    disabled={processing}
                  >
                    {processing
                      ? (lang === 'fr' ? 'Modification en cours...' : 'Rescheduling...')
                      : (lang === 'fr' ? 'Confirmer le nouveau créneau' : 'Confirm new time')}
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        {state === 'too_late' && (
          <div className="resa-state-card">
            <p className="resa-state-card__title">
              {lang === 'fr' ? 'Modification impossible' : 'Rescheduling not possible'}
            </p>
            <p className="resa-state-card__text">
              {lang === 'fr'
                ? <>Votre séance a lieu dans moins de 24 heures. <br/>Elle ne peut plus être modifiée. <br/>Pour toute question, écrivez à contact@theidalafamily.com.</>
                : <>Your session takes place in less than 24 hours. <br/>It can no longer be rescheduled. <br/>For any question, email contact@theidalafamily.com.</>}
            </p>
            <Link to="/" className="btn btn--violet-mid">
              {lang === 'fr' ? 'Retour à l\'accueil' : 'Back home'}
            </Link>
          </div>
        )}

        {state === 'done' && (
          <div className="resa-state-card">
            <p className="resa-state-card__icon">✦</p>
            <p className="resa-state-card__title">
              {lang === 'fr' ? 'Rendez-vous modifié' : 'Appointment updated'}
            </p>
            <p className="resa-state-card__text">
              {lang === 'fr'
                ? <>Votre rendez-vous a bien été déplacé au <br/><strong>{oldDateStr}</strong> à <strong>{oldTimeStr}</strong>. <br/>Un email de confirmation vient de vous être envoyé.</>
                : <>Your appointment has been moved to <br/><strong>{oldDateStr}</strong> at <strong>{oldTimeStr}</strong>. <br/>A confirmation email has just been sent to you.</>}
            </p>
            <Link to="/" className="btn btn--violet-mid">
              {lang === 'fr' ? 'Retour à l\'accueil' : 'Back home'}
            </Link>
          </div>
        )}

        {state === 'already' && (
          <div className="resa-state-card">
            <p className="resa-state-card__title">
              {lang === 'fr' ? 'Réservation annulée' : 'Booking cancelled'}
            </p>
            <p className="resa-state-card__text">
              {lang === 'fr'
                ? 'Cette réservation a été annulée et ne peut plus être modifiée.'
                : 'This booking has been cancelled and can no longer be rescheduled.'}
            </p>
            <Link to="/" className="btn btn--violet-mid">
              {lang === 'fr' ? 'Retour à l\'accueil' : 'Back home'}
            </Link>
          </div>
        )}

        {state === 'notfound' && (
          <div className="resa-state-card">
            <p className="resa-state-card__title">
              {lang === 'fr' ? 'Réservation introuvable' : 'Booking not found'}
            </p>
            <p className="resa-state-card__text">
              {lang === 'fr'
                ? <>Ce lien de modification n'est pas valide. <br/>Pour toute question, écrivez à contact@theidalafamily.com.</>
                : <>This link is not valid. <br/>For any question, email contact@theidalafamily.com.</>}
            </p>
            <Link to="/" className="btn btn--violet-mid">
              {lang === 'fr' ? 'Retour à l\'accueil' : 'Back home'}
            </Link>
          </div>
        )}

        {state === 'error' && (
          <div className="resa-state-card">
            <p className="resa-state-card__title">
              {lang === 'fr' ? 'Une erreur est survenue' : 'An error occurred'}
            </p>
            <p className="resa-state-card__text">
              {lang === 'fr'
                ? <>Impossible de traiter votre demande. <br/>Réessayez ou écrivez à contact@theidalafamily.com.</>
                : <>We could not process your request. <br/>Please try again or email contact@theidalafamily.com.</>}
            </p>
            <Link to="/" className="btn btn--violet-mid">
              {lang === 'fr' ? 'Retour à l\'accueil' : 'Back home'}
            </Link>
          </div>
        )}

      </div>
    </>
  )
}