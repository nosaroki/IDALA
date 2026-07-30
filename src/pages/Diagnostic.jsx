import { useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { LangCtx } from '../components/LangContext'
import BookingCalendar from '../components/BookingCalendar'
import Footer from '../components/Footer'

const SUPABASE_FN = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

const DIAGNOSTIC_SCHEDULE_ID = '840661'
const DIAGNOSTIC_DURATION = 20

export default function Diagnostic() {
  const { lang } = useContext(LangCtx)

  const [step, setStep] = useState('slot')   // slot | form | done
  const [selectedSlot, setSelectedSlot] = useState(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [besoin, setBesoin] = useState('')
  const [mode, setMode] = useState('visio')

  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [roomUrl, setRoomUrl] = useState(null)

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const phoneNeeded = mode === 'whatsapp'
  const phoneValid = !phoneNeeded || phone.replace(/[^\d]/g, '').length >= 8
  const formValid = name.trim().length > 1 && emailValid && phoneValid

  function handleSelectSlot(slot) {
    setSelectedSlot(slot)
    setStep('form')
  }

  function backToCalendar() {
    setStep('slot')
    setError(null)
  }

  async function submit() {
    setError(null)
    if (!formValid) {
      setError(lang === 'fr'
        ? 'Veuillez remplir les champs obligatoires.'
        : 'Please fill in the required fields.')
      return
    }
    setSending(true)
    try {
      const res = await fetch(`${SUPABASE_FN}/functions/v1/book-diagnostic`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduled_at: selectedSlot.start,
          client_name: name,
          client_email: email,
          client_phone: phone,
          besoin,
          mode,
          lang,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setRoomUrl(data.room_url || null)
        setStep('done')
      } else if (data.error === 'SLOT_UNAVAILABLE') {
        setError(lang === 'fr'
          ? 'Ce créneau vient d\'être réservé. Choisissez-en un autre.'
          : 'This time slot has just been booked. Please choose another one.')
        setStep('slot')
      } else {
        setError(lang === 'fr'
          ? 'Une erreur est survenue. Réessayez.'
          : 'An error occurred. Please try again.')
      }
    } catch (e) {
      setError(lang === 'fr' ? 'Erreur technique. Réessayez.' : 'Technical error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  // Formatage du créneau choisi
  let slotDateStr = '', slotTimeStr = ''
  if (selectedSlot) {
    const d = new Date(selectedSlot.start)
    slotDateStr = d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
    slotTimeStr = selectedSlot.start.slice(11, 16)
  }

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? 'Diagnostic personnalisé : The Idala Family' : 'Personalized consultation : The Idala Family'}</title>
        <meta name="description" content={lang === 'fr'
          ? 'Réservez un diagnostic personnalisé gratuit de 20 minutes avec la fondatrice de The Idala Family.'
          : 'Book a free 20-minute personalized consultation with the founder of The Idala Family.'} />
      </Helmet>

      <div className="resa-page">

        <header className="resa-header">
          <p className="resa-header__eyebrow">
            {lang === 'fr' ? 'Diagnostic personnalisé' : 'Personalized consultation'}
          </p>
          <h1 className="resa-header__title">
            {lang === 'fr' ? 'Trouvons votre voie' : 'Let us find your path'}
          </h1>
          <p className="resa-header__prat">
            {lang === 'fr'
              ? 'Un échange privé de 20 minutes avec la fondatrice'
              : 'A private 20-minute conversation with the founder'}
          </p>
          <div className="resa-header__meta">
            <span>{DIAGNOSTIC_DURATION} min</span>
            <span className="resa-header__dot">·</span>
            <span className="resa-header__price">{lang === 'fr' ? 'Gratuit' : 'Free'}</span>
          </div>
        </header>

        {/* ETAPE 1 : CALENDRIER */}
        {step === 'slot' && (
          <section className="resa-section">
            <h2 className="resa-section__title">
              {lang === 'fr' ? 'Choisissez un créneau' : 'Pick a time'}
            </h2>
            {error && <p className="resa-error">{error}</p>}
            <BookingCalendar
              scheduleId={DIAGNOSTIC_SCHEDULE_ID}
              lengthMinutes={DIAGNOSTIC_DURATION}
              onSelectSlot={handleSelectSlot}
              selectedSlot={selectedSlot}
            />
          </section>
        )}

        {/* ETAPE 2 : FORMULAIRE */}
        {step === 'form' && selectedSlot && (
          <section className="resa-section">
            <div className="resa-slot-recap">
              <div>
                <p className="resa-slot-recap__label">{lang === 'fr' ? 'Votre créneau' : 'Your time'}</p>
                <p className="resa-slot-recap__value">{slotDateStr} · {slotTimeStr}</p>
              </div>
              <button type="button" className="resa-slot-recap__edit" onClick={backToCalendar}>
                ‹ {lang === 'fr' ? 'Modifier le créneau' : 'Change time'}
              </button>
            </div>

            <div className="resa-field">
              <label>{lang === 'fr' ? 'Nom complet *' : 'Full name *'}</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={lang === 'fr' ? 'Prénom Nom' : 'First name Last name'}
              />
            </div>

            <div className="resa-field">
              <label>Email *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@email.com"
              />
            </div>

            {/* Choix du format */}
            <div className="resa-field">
              <label>{lang === 'fr' ? 'Format de l\'échange *' : 'Format *'}</label>
              <div className="diag-modes">
                <button
                  type="button"
                  className={`diag-mode ${mode === 'visio' ? 'diag-mode--active' : ''}`}
                  onClick={() => setMode('visio')}
                >
                  {lang === 'fr' ? 'Visioconférence' : 'Video call'}
                </button>
                <button
                  type="button"
                  className={`diag-mode ${mode === 'whatsapp' ? 'diag-mode--active' : ''}`}
                  onClick={() => setMode('whatsapp')}
                >
                  {lang === 'fr' ? 'Appel WhatsApp' : 'WhatsApp call'}
                </button>
              </div>
            </div>

            <div className="resa-field">
              <label>
                {lang === 'fr'
                  ? (phoneNeeded ? 'Téléphone *' : 'Téléphone')
                  : (phoneNeeded ? 'Phone *' : 'Phone')}
              </label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+33 6 12 34 56 78"
              />
              {phoneNeeded && (
                <p className="resa-hint">
                  {lang === 'fr'
                    ? 'Diane vous appellera sur ce numéro via WhatsApp.'
                    : 'Diane will call you on this number via WhatsApp.'}
                </p>
              )}
            </div>

            <div className="resa-field">
              <label>{lang === 'fr' ? 'Votre besoin en quelques mots' : 'Your needs in a few words'}</label>
              <textarea
                rows={3}
                value={besoin}
                onChange={e => setBesoin(e.target.value)}
                placeholder={lang === 'fr'
                  ? 'Ce que vous cherchez, ce qui vous amène...'
                  : 'What you are looking for, what brings you here...'}
              />
            </div>

            {error && <p className="resa-error">{error}</p>}

            <button
              type="button"
              className="btn btn--violet-mid"
              onClick={submit}
              disabled={sending || !formValid}
            >
              {sending
                ? (lang === 'fr' ? 'Réservation...' : 'Booking...')
                : (lang === 'fr' ? 'Confirmer mon diagnostic' : 'Confirm my consultation')}
            </button>
          </section>
        )}

        {/* ETAPE 3 : CONFIRMATION */}
        {step === 'done' && (
          <div className="resa-confirm">
            <p className="resa-confirm__icon">✦</p>
            <h2 className="resa-confirm__title">
              {lang === 'fr' ? 'Diagnostic confirmé' : 'Consultation confirmed'}
            </h2>
            <p className="resa-confirm__text">
              {lang === 'fr'
                ? <>Merci, votre échange est réservé. <br/>Un email de confirmation vous a été envoyé.</>
                : <>Thank you, your consultation is booked. <br/>A confirmation email has been sent to you.</>}
            </p>

            <div className="resa-confirm__recap">
              <div className="resa-confirm__row">
                <span>{lang === 'fr' ? 'Date' : 'Date'}</span>
                <strong>{slotDateStr}</strong>
              </div>
              <div className="resa-confirm__row">
                <span>{lang === 'fr' ? 'Heure' : 'Time'}</span>
                <strong>{slotTimeStr}</strong>
              </div>
              <div className="resa-confirm__row">
                <span>{lang === 'fr' ? 'Format' : 'Format'}</span>
                <strong>
                  {mode === 'visio'
                    ? (lang === 'fr' ? 'Visioconférence' : 'Video call')
                    : (lang === 'fr' ? 'Appel WhatsApp' : 'WhatsApp call')}
                </strong>
              </div>
            </div>

            {mode === 'visio' && (
              <p className="resa-confirm__text">
                {lang === 'fr'
                  ? <>Le lien de connexion vous a été envoyé par email. <br/>Il sera actif quelques minutes avant votre échange.</>
                  : <>The connection link has been sent to you by email. <br/>It will be active a few minutes before your session.</>}
              </p>
            )}

            {mode === 'whatsapp' && (
              <p className="resa-confirm__text">
                {lang === 'fr'
                  ? 'Diane vous appellera sur WhatsApp à l\'heure convenue.'
                  : 'Diane will call you on WhatsApp at the scheduled time.'}
              </p>
            )}

            <Link to="/" className="btn btn--violet-mid">
              {lang === 'fr' ? 'Retour à l\'accueil' : 'Back home'}
            </Link>
          </div>
        )}

      </div>
      <Footer />
    </>
  )
}