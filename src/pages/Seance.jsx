import { useState, useEffect, useContext, useRef } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import DailyIframe from '@daily-co/daily-js'
import { LangCtx } from '../components/LangContext'
import { supabase } from '../lib/supabaseClient'

const SUPABASE_FN = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

export default function Seance() {
  const { lang, setLang } = useContext(LangCtx)
  const { sessionId } = useParams()
  const [searchParams] = useSearchParams()

  // Identification : ?r=reservation_id (client) ou ?p=praticien_secret (praticien)
  const reservationId = searchParams.get('r')
  const praticienSecret = searchParams.get('p')

  const [state, setState] = useState('loading') // loading | ready | connecting | joined | error | too_early | ended | denied
  const [errorMsg, setErrorMsg] = useState(null)
  const [sessionInfo, setSessionInfo] = useState(null)
  const [reconnecting, setReconnecting] = useState(false)

  const callFrameRef = useRef(null)
  const containerRef = useRef(null)
  // Verrou anti-double-clic : empeche deux joinCall en parallele.
  const joiningRef = useRef(false)
  // Vrai uniquement quand on a reellement rejoint la visio.
  // Sert a distinguer un vrai depart de seance d'un left-meeting emis
  // pendant une destruction interne du frame.
  const inCallRef = useRef(false)

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

  // Destruction propre et attendue de tout frame existant.
  // On coupe d'abord inCallRef pour que le left-meeting declenche par
  // la destruction ne soit PAS interprete comme une fin de seance.
  async function destroyFrame() {
    const frame = callFrameRef.current
    callFrameRef.current = null
    inCallRef.current = false
    if (frame) {
      try {
        await frame.destroy()
      } catch (e) {
        // Frame deja detruit ou en cours de destruction : sans consequence.
      }
    }
  }

  // ─── Charger les infos de la séance (via RPC SECURITY DEFINER) ───
  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!sessionId || (!reservationId && !praticienSecret)) {
        setState('denied')
        setErrorMsg(msg('INVALID_ACCESS'))
        return
      }

      try {
        const { data, error } = await supabase.rpc('get_seance_display', {
          p_session_id: sessionId,
          p_reservation_id: reservationId,
          p_praticien_secret: praticienSecret,
        })

        if (cancelled) return

        if (error || !data || data.ok === false) {
          setState('denied')
          setErrorMsg(msg('INVALID_ACCESS'))
          return
        }

        if (!data.daily_room_url) {
          setState('error')
          setErrorMsg(msg('NO_ROOM'))
          return
        }

        setSessionInfo({
          scheduled_at: data.scheduled_at,
          mode_seance: data.mode_seance,
          daily_room_url: data.daily_room_url,
          praticiens: { prenom: data.praticien_prenom, nom: data.praticien_nom },
          pratiques: { nom: data.pratique_nom },
          clientName: data.client_name || null,
        })
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
    // Verrou : si un join est deja en cours, on ignore le clic.
    if (joiningRef.current) return
    joiningRef.current = true
    setErrorMsg(null)
    // Passe en connexion : affiche le loader ET rend la zone video visible,
    // condition necessaire pour que Daily finalise l'entree dans la room.
    setState('connecting')

    try {
      const token = await fetchToken()

      // Toujours repartir d'un etat propre : on detruit et on attend
      // la fin de destruction de tout frame precedent avant d'en creer un.
      await destroyFrame()

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
        // Une erreur du frame ne doit pas laisser d'instance zombie.
        inCallRef.current = false
        setState('error')
        setErrorMsg(msg('GENERIC'))
      })

      // Daily a fini de charger son interface (prejoin ou visio) :
      // on retire notre loader et on laisse la main a Daily. Sans ca,
      // notre loader recouvre le bouton du prejoin et bloque l'entree.
      frame.on('loaded', () => {
        setState('joined')
      })

      // Entree confirmee dans la seance.
      frame.on('joined-meeting', () => {
        inCallRef.current = true
        setState('joined')
      })

      // On ne bascule sur "terminee" QUE si on etait reellement en seance.
      // Un left-meeting emis pendant une destruction interne est ignore.
      frame.on('left-meeting', () => {
        if (inCallRef.current) {
          inCallRef.current = false
          setState('ended')
        }
      })

      await frame.join({ url: sessionInfo.daily_room_url, token })
      // Filet de securite si joined-meeting n'a pas encore bascule l'etat.
      inCallRef.current = true
      setState('joined')

    } catch (err) {
      // Le join a echoue : pas d'instance active, on nettoie.
      await destroyFrame()

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
    } finally {
      joiningRef.current = false
    }
  }

  // ─── Nettoyage au démontage ───
  useEffect(() => {
    return () => {
      // On coupe le drapeau avant de detruire pour ne pas declencher "ended".
      inCallRef.current = false
      const frame = callFrameRef.current
      callFrameRef.current = null
      if (frame) {
        try {
          frame.destroy()
        } catch (e) {
          // Sans consequence si deja detruit.
        }
      }
    }
  }, [])

  // ─── Infos d'affichage ───
  const prat = sessionInfo?.praticiens
  const prq = sessionInfo?.pratiques
  const isPraticien = Boolean(praticienSecret)
  const clientName = sessionInfo?.clientName || null

  // Le conteneur video doit etre visible pendant la connexion ET la seance.
  const videoActive = state === 'connecting' || state === 'joined'

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
          <div className="seance-header__right">
            {sessionInfo && (
              <div className="seance-header__info">
                <span className="seance-header__practice">{prq?.nom}</span>
                {prat && (prat.prenom || prat.nom) && (
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
            <div className="lang-toggle">
              <button
                type="button"
                className={`lang-btn${lang === 'fr' ? ' active' : ''}`}
                onClick={() => setLang('fr')}
              >FR</button>
              <button
                type="button"
                className={`lang-btn${lang === 'en' ? ' active' : ''}`}
                onClick={() => setLang('en')}
              >EN</button>
            </div>
          </div>
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

          {/* Conteneur de la visio (toujours monté, visible en connexion + séance) */}
          <div
            ref={containerRef}
            className={`seance-video ${videoActive ? 'seance-video--active' : ''}`}
            aria-label={lang === 'fr' ? 'Visioconférence' : 'Video call'}
          />

          {/* Loader de connexion, par-dessus la zone vidéo */}
          {state === 'connecting' && (
            <div className="seance-connecting" role="status" aria-live="polite">
              <div className="onboarding-dots">
                <span className="onboarding-dots__dot" style={{ background: 'var(--c1)' }} />
                <span className="onboarding-dots__dot" style={{ background: 'var(--c2)' }} />
                <span className="onboarding-dots__dot" style={{ background: 'var(--c3)' }} />
                <span className="onboarding-dots__dot" style={{ background: 'var(--c4)' }} />
                <span className="onboarding-dots__dot" style={{ background: 'var(--c5)' }} />
                <span className="onboarding-dots__dot" style={{ background: 'var(--c6)' }} />
                <span className="onboarding-dots__dot" style={{ background: 'var(--c7)' }} />
              </div>
              <p className="seance-connecting__text">
                {lang === 'fr' ? 'Connexion à votre séance...' : 'Connecting to your session...'}
              </p>
            </div>
          )}

          {/* Bandeau de reconnexion */}
          {reconnecting && (
            <div className="seance-reconnect" role="status" aria-live="polite">
              <span className="seance-reconnect__dot" />
              {lang === 'fr' ? 'Reconnexion en cours...' : 'Reconnecting...'}
            </div>
          )}

          {/* États de chargement / erreur / fin */}
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