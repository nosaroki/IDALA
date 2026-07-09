import { useState, useEffect, useContext, useRef } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import DailyIframe from '@daily-co/daily-js'
import { LangCtx } from '../components/LangContext'
import { supabase } from '../lib/supabaseClient'

const SUPABASE_FN = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

export default function Seance() {
  const { lang } = useContext(LangCtx)
  const { sessionId } = useParams()
  const [searchParams] = useSearchParams()

  // Identification : ?r=reservation_id (client) ou ?p=praticien_secret (praticien)
  const reservationId = searchParams.get('r')
  const praticienSecret = searchParams.get('p')

  const [state, setState] = useState('loading') // loading | ready | joined | error | too_early | ended | denied
  const [errorMsg, setErrorMsg] = useState(null)
  const [sessionInfo, setSessionInfo] = useState(null)
  const [reconnecting, setReconnecting] = useState(false)

  const callFrameRef = useRef(null)
  const containerRef = useRef(null)

  // ─── Messages d'erreur bilingues ───
  const ERROR_MESSAGES = {
    TOO_EARLY: {
      fr: "L'accès à votre séance ouvre 15 minutes avant l'heure prévue. Revenez un peu plus tard.",
      en: 'Access to your session opens 15 minutes before the scheduled time. Please come back shortly.',
    },
    SESSION_ENDED: {
      fr: 'Cette séance est terminée.',
      en: 'This session has ended.',
    },
    RESERVATION_NOT_CONFIRMED: {
      fr: "Votre réservation n'est pas confirmée. Contactez-nous à contact@theidalafamily.com.",
      en: 'Your booking is not confirmed. Please contact us at contact@theidalafamily.com.',
    },
    INVALID_ACCESS: {
      fr: "Ce lien d'accès n'est pas valide.",
      en: 'This access link is not valid.',
    },
    NO_ROOM: {
      fr: "La salle de visioconférence n'est pas disponible pour cette séance.",
      en: 'The video room is not available for this session.',
    },
    GENERIC: {
      fr: 'Une erreur est survenue. Réessayez ou contactez-nous.',
      en: 'An error occurred. Please try again or contact us.',
    },
  }

  function msg(code) {
    const entry = ERROR_MESSAGES[code] || ERROR_MESSAGES.GENERIC
    return lang === 'fr' ? entry.fr : entry.en
  }

  // ─── Charger les infos de la séance ───
  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!sessionId || (!reservationId && !praticienSecret)) {
        setState('denied')
        setErrorMsg(msg('INVALID_ACCESS'))
        return
      }

      try {
        const { data: session } = await supabase
          .from('sessions')
          .select(`
            id, scheduled_at, duration_minutes, mode_seance, daily_room_url, status,
            praticiens ( prenom, nom ),
            pratiques ( nom ),
            reservations ( client_name, status )
          `)
          .eq('id', sessionId)
          .maybeSingle()

        if (cancelled) return

        if (!session) {
          setState('denied')
          setErrorMsg(msg('INVALID_ACCESS'))
          return
        }

        if (!session.daily_room_url) {
          setState('error')
          setErrorMsg(msg('NO_ROOM'))
          return
        }

        setSessionInfo(session)
        setSessionInfo(session)
        setState('ready')
      } catch (e) {
        if (!cancelled) {
          setState('error')
          setErrorMsg(msg('GENERIC'))
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [sessionId, reservationId, praticienSecret, lang])

  // ─── Demander un token Daily ───
  async function fetchToken() {
    const body = praticienSecret
      ? { session_id: sessionId, praticien_join_secret: praticienSecret }
      : { session_id: sessionId, reservation_id: reservationId }

    const res = await fetch(`${SUPABASE_FN}/functions/v1/create-daily-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok || data.error) {
      const code = data.error || 'GENERIC'
      throw new Error(code)
    }
    return data.token
  }

  // ─── Rejoindre la visio ───
  async function joinCall() {
    setErrorMsg(null)
    try {
      const token = await fetchToken()

      if (callFrameRef.current) {
        callFrameRef.current.destroy()
        callFrameRef.current = null
      }

      const frame = DailyIframe.createFrame(containerRef.current, {
        showLeaveButton: true,
        showFullscreenButton: true,
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: '0',
          borderRadius: '12px',
        },
        theme: {
          colors: {
            accent: '#9B6EBF',
            accentText: '#FFFFFF',
            background: '#F0EAFA',
            backgroundAccent: '#E4D8F5',
            baseText: '#281745',
            border: '#C9A8E0',
            mainAreaBg: '#3e295d',
            mainAreaBgAccent: '#7A4FA0',
            mainAreaText: '#FFFFFF',
            supportiveText: '#413459',
          },
        },
      })

      callFrameRef.current = frame

      // Événements de reconnexion réseau
      frame.on('network-connection', (ev) => {
        if (ev?.event === 'interrupted') {
          setReconnecting(true)
        } else if (ev?.event === 'connected') {
          setReconnecting(false)
        }
      })

      frame.on('error', () => {
        setReconnecting(false)
        setState('error')
        setErrorMsg(msg('GENERIC'))
      })

      frame.on('left-meeting', () => {
        setState('ended')
      })

      await frame.join({ url: sessionInfo.daily_room_url, token })
      setState('joined')

    } catch (err) {
      const code = String(err.message || '')
      if (code.includes('TOO_EARLY')) {
        setState('too_early')
        setErrorMsg(msg('TOO_EARLY'))
      } else if (code.includes('SESSION_ENDED')) {
        setState('ended')
        setErrorMsg(msg('SESSION_ENDED'))
      } else if (code.includes('RESERVATION_NOT_CONFIRMED')) {
        setState('denied')
        setErrorMsg(msg('RESERVATION_NOT_CONFIRMED'))
      } else if (code.includes('INVALID')) {
        setState('denied')
        setErrorMsg(msg('INVALID_ACCESS'))
      } else {
        setState('error')
        setErrorMsg(msg('GENERIC'))
      }
    }
  }

  // ─── Nettoyage ───
  useEffect(() => {
    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.destroy()
        callFrameRef.current = null
      }
    }
  }, [])

  // ─── Infos d'affichage ───
  const prat = sessionInfo?.praticiens
  const prq = sessionInfo?.pratiques
  const isPraticien = Boolean(praticienSecret)
  const reservations = sessionInfo?.reservations || []
  const clientName = Array.isArray(reservations)
    ? (reservations.find(r => r.status === 'confirmed')?.client_name || null)
    : (reservations?.client_name || null)

  let dateStr = '', timeStr = ''
  if (sessionInfo?.scheduled_at) {
    const d = new Date(sessionInfo.scheduled_at)
    dateStr = d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
    timeStr = d.toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
      hour: '2-digit', minute: '2-digit',
    })
  }

 

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? 'Votre séance : The Idala Family' : 'Your session : The Idala Family'}</title>
      </Helmet>

      <main className="seance-page">

        {/* En-tête brandé */}
        <header className="seance-header">
          <span className="seance-header__brand">THE IDALA FAMILY</span>
          {sessionInfo && (
            <div className="seance-header__info">
              <span className="seance-header__practice">{prq?.nom}</span>
              {prat && (
                <>
                  <span className="seance-header__dot">·</span>
                  <span>{prat.prenom} {prat.nom?.charAt(0)}.</span>
                </>
              )}
              {dateStr && (
                <>
                  <span className="seance-header__dot">·</span>
                  <span>{dateStr} {timeStr}</span>
                </>
              )}
            </div>
          )}
        </header>

        {/* Zone principale */}
        <div className="seance-stage">

          {/* Écran d'accueil avant de rejoindre */}
          {state === 'ready' && (
            <div className="seance-lobby">
              <p className="seance-lobby__icon">✦</p>
              <h1 className="seance-lobby__title">
                {isPraticien
                  ? (lang === 'fr' ? 'Votre client vous attend' : 'Your client awaits')
                  : (lang === 'fr' ? 'Votre séance vous attend' : 'Your session awaits')}
              </h1>
              <p className="seance-lobby__text">
                {isPraticien ? (
                  lang === 'fr'
                    ? <>Avec <strong>{clientName || 'votre client'}</strong> · {prq?.nom}</>
                    : <>With <strong>{clientName || 'your client'}</strong> · {prq?.nom}</>
                ) : (
                  lang === 'fr'
                    ? <>Avec <strong>{prat?.prenom} {prat?.nom?.charAt(0)}.</strong> · {prq?.nom}</>
                    : <>With <strong>{prat?.prenom} {prat?.nom?.charAt(0)}.</strong> · {prq?.nom}</>
                )}
              </p>
              <p className="seance-lobby__hint">
                {lang === 'fr'
                  ? 'Votre navigateur vous demandera l\'accès à la caméra et au micro.'
                  : 'Your browser will ask for camera and microphone access.'}
              </p>
              {errorMsg && <p className="resa-error">{errorMsg}</p>}
              <button type="button" className="btn btn--violet-mid" onClick={joinCall}>
                {lang === 'fr' ? 'Rejoindre la séance' : 'Join session'}
              </button>
            </div>
          )}

          {/* Conteneur de la visio (toujours monté quand on rejoint) */}
          <div
            ref={containerRef}
            className={`seance-video ${state === 'joined' ? 'seance-video--active' : ''}`}
            aria-label={lang === 'fr' ? 'Visioconférence' : 'Video call'}
          />

          {/* Bandeau de reconnexion */}
          {reconnecting && (
            <div className="seance-reconnect" role="status" aria-live="polite">
              <span className="seance-reconnect__dot" />
              {lang === 'fr' ? 'Reconnexion en cours...' : 'Reconnecting...'}
            </div>
          )}

          {/* États d'erreur / fin */}
          {(state === 'loading') && (
            <div className="seance-lobby">
              <p className="seance-lobby__text">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</p>
            </div>
          )}

          {(state === 'too_early' || state === 'denied' || state === 'error') && (
            <div className="seance-lobby">
              <h1 className="seance-lobby__title">
                {state === 'too_early'
                  ? (lang === 'fr' ? 'Un peu trop tôt' : 'A little too early')
                  : (lang === 'fr' ? 'Accès impossible' : 'Access not possible')}
              </h1>
              <p className="seance-lobby__text">{errorMsg}</p>
              {state === 'too_early' && (
                <button type="button" className="btn btn--violet-mid" onClick={joinCall}>
                  {lang === 'fr' ? 'Réessayer' : 'Try again'}
                </button>
              )}
              <Link to="/" className="btn btn--outline">
                {lang === 'fr' ? 'Retour à l\'accueil' : 'Back home'}
              </Link>
            </div>
          )}

          {state === 'ended' && (
            <div className="seance-lobby">
              <p className="seance-lobby__icon">✦</p>
              <h1 className="seance-lobby__title">
                {lang === 'fr' ? 'Séance terminée' : 'Session ended'}
              </h1>
              <p className="seance-lobby__text">
                {lang === 'fr'
                  ? 'Merci pour ce moment. Prenez soin de vous.'
                  : 'Thank you for this moment. Take care of yourself.'}
              </p>
              <Link to="/" className="btn btn--violet-mid">
                {lang === 'fr' ? 'Retour à l\'accueil' : 'Back home'}
              </Link>
            </div>
          )}

        </div>

        <p className="seance-footer">Mens sana in corpore sano</p>
      </main>
    </>
  )
}