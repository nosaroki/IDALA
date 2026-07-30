import { useState, useContext, useRef, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import DailyIframe from '@daily-co/daily-js'
import { LangCtx } from '../components/LangContext'

// Page seance allegee pour le diagnostic gratuit, mais avec le meme niveau de
// controle que les seances payantes : arrivee trop tot, trop tard, erreurs,
// le tout brande Idala. La room Daily est passee dans l'URL, ainsi que l'heure
// du rendez-vous (start) et la duree (min), pour verrouiller l'acces cote Idala.
// Format : /#/diagnostic-seance?room=URL&start=ISO&min=20
export default function DiagnosticSeance() {
  const { lang, setLang } = useContext(LangCtx)
  const [searchParams] = useSearchParams()

  const roomUrl = searchParams.get('room')
  const startParam = searchParams.get('start')          // ISO UTC du rendez-vous
  const durationMin = parseInt(searchParams.get('min') || '20', 10)

  // Fenetre d'acces : on ouvre 10 min avant le debut, on ferme 15 min apres la fin.
  const OPEN_BEFORE_MIN = 10
  const CLOSE_AFTER_MIN = 15

  const startMs = startParam ? new Date(startParam).getTime() : null
  const openMs = startMs != null ? startMs - OPEN_BEFORE_MIN * 60 * 1000 : null
  const endMs = startMs != null ? startMs + (durationMin + CLOSE_AFTER_MIN) * 60 * 1000 : null

  // Etat initial calcule selon le lien et l'heure.
  function initialState() {
    if (!roomUrl || startMs == null) return 'denied'
    const now = Date.now()
    if (now < openMs) return 'too_early'
    if (now > endMs) return 'too_late'
    return 'ready'
  }

  const [state, setState] = useState(initialState) // ready | too_early | too_late | connecting | joined | ended | error | denied
  const [errorMsg, setErrorMsg] = useState(null)
  const [reconnecting, setReconnecting] = useState(false)
  const [countdown, setCountdown] = useState('')

  const callFrameRef = useRef(null)
  const containerRef = useRef(null)
  const joiningRef = useRef(false)
  const inCallRef = useRef(false)

  const MESSAGES = {
    INVALID: {
      fr: "Ce lien d'accès n'est pas valide.",
      en: 'This access link is not valid.',
    },
    GENERIC: {
      fr: 'Une erreur est survenue. Réessayez ou contactez-nous.',
      en: 'An error occurred. Please try again or contact us.',
    },
  }
  function msg(code) {
    const entry = MESSAGES[code] || MESSAGES.GENERIC
    return lang === 'fr' ? entry.fr : entry.en
  }

  // Formate un compte a rebours "dans 1 h 12 min" jusqu'a l'ouverture.
  function formatCountdown(ms) {
    const totalMin = Math.max(0, Math.round(ms / 60000))
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    if (lang === 'fr') {
      if (h > 0) return `dans ${h} h ${String(m).padStart(2, '0')} min`
      return `dans ${m} min`
    }
    if (h > 0) return `in ${h} h ${String(m).padStart(2, '0')} min`
    return `in ${m} min`
  }

  // Rafraichit l'etat selon l'heure : bascule automatiquement de too_early a ready.
  useEffect(() => {
    if (startMs == null) return
    function tick() {
      const now = Date.now()
      if (now < openMs) {
        setState((s) => (s === 'too_early' || s === 'ready' ? 'too_early' : s))
        setCountdown(formatCountdown(openMs - now))
      } else if (now > endMs) {
        setState((s) => (s === 'joined' || s === 'connecting' ? s : 'too_late'))
      } else {
        setState((s) => (s === 'too_early' ? 'ready' : s))
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openMs, endMs, startMs, lang])

  async function destroyFrame() {
    const frame = callFrameRef.current
    callFrameRef.current = null
    inCallRef.current = false
    if (frame) {
      try {
        await frame.destroy()
      } catch (e) {
        // Frame deja detruit : sans consequence.
      }
    }
  }

  async function joinCall() {
    if (joiningRef.current) return
    // Garde-fou : on ne rejoint jamais hors de la fenetre horaire.
    const now = Date.now()
    if (now < openMs) { setState('too_early'); return }
    if (now > endMs) { setState('too_late'); return }

    joiningRef.current = true
    setErrorMsg(null)
    setState('connecting')

    try {
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

      frame.on('network-connection', (ev) => {
        if (ev?.event === 'interrupted') setReconnecting(true)
        else if (ev?.event === 'connected') setReconnecting(false)
      })
      frame.on('error', () => {
        setReconnecting(false)
        inCallRef.current = false
        setState('error')
        setErrorMsg(msg('GENERIC'))
      })
      frame.on('loaded', () => setState('joined'))
      frame.on('joined-meeting', () => {
        inCallRef.current = true
        setState('joined')
      })
      frame.on('left-meeting', () => {
        if (inCallRef.current) {
          inCallRef.current = false
          setState('ended')
        }
      })

      // Room publique : pas de token, on rejoint directement avec l'URL.
      await frame.join({ url: roomUrl })
      inCallRef.current = true
      setState('joined')

    } catch (err) {
      await destroyFrame()
      setState('error')
      setErrorMsg(msg('GENERIC'))
    } finally {
      joiningRef.current = false
    }
  }

  useEffect(() => {
    return () => {
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

  const videoActive = state === 'connecting' || state === 'joined'

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? 'Votre diagnostic : The Idala Family' : 'Your consultation : The Idala Family'}</title>
      </Helmet>

      <main className="seance-page">

        <header className="seance-header">
          <span className="seance-header__brand">THE IDALA FAMILY</span>
          <div className="seance-header__right">
            <div className="seance-header__info">
              <span className="seance-header__practice">
                {lang === 'fr' ? 'Diagnostic personnalisé' : 'Personalized consultation'}
              </span>
            </div>
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

        <div className="seance-stage">

          {/* Lien invalide */}
          {state === 'denied' && (
            <div className="seance-lobby">
              <h1 className="seance-lobby__title">
                {lang === 'fr' ? 'Accès impossible' : 'Access not possible'}
              </h1>
              <p className="seance-lobby__text">{msg('INVALID')}</p>
              <Link to="/" className="btn btn--outline">
                {lang === 'fr' ? 'Retour à l\'accueil' : 'Back home'}
              </Link>
            </div>
          )}

          {/* Arrivee trop tot : compte a rebours brande */}
          {state === 'too_early' && (
            <div className="seance-lobby">
              <p className="seance-lobby__icon">✦</p>
              <h1 className="seance-lobby__title">
                {lang === 'fr' ? 'Votre diagnostic n\'a pas encore commencé' : 'Your consultation has not started yet'}
              </h1>
              <p className="seance-lobby__text">
                {lang === 'fr'
                  ? <>L'accès s'ouvre quelques minutes avant l'heure prévue. Revenez <strong>{countdown}</strong>.</>
                  : <>Access opens a few minutes before the scheduled time. Come back <strong>{countdown}</strong>.</>}
              </p>
              <p className="seance-lobby__hint">
                {lang === 'fr'
                  ? 'Vous pouvez garder cette page ouverte, elle s\'activera toute seule.'
                  : 'You can keep this page open, it will activate on its own.'}
              </p>
              <Link to="/" className="btn btn--outline">
                {lang === 'fr' ? 'Retour à l\'accueil' : 'Back home'}
              </Link>
            </div>
          )}

          {/* Arrivee trop tard */}
          {state === 'too_late' && (
            <div className="seance-lobby">
              <h1 className="seance-lobby__title">
                {lang === 'fr' ? 'Ce diagnostic est terminé' : 'This consultation has ended'}
              </h1>
              <p className="seance-lobby__text">
                {lang === 'fr'
                  ? 'Le créneau de ce rendez-vous est passé. Pour en reprendre un, revenez sur le site.'
                  : 'This appointment slot has passed. To book another, please return to the site.'}
              </p>
              <Link to="/" className="btn btn--violet-mid">
                {lang === 'fr' ? 'Retour à l\'accueil' : 'Back home'}
              </Link>
            </div>
          )}

          {/* Pret a rejoindre */}
          {state === 'ready' && (
            <div className="seance-lobby">
              <p className="seance-lobby__icon">✦</p>
              <h1 className="seance-lobby__title">
                {lang === 'fr' ? 'Votre diagnostic vous attend' : 'Your consultation awaits'}
              </h1>
              <p className="seance-lobby__text">
                {lang === 'fr'
                  ? <>Un échange privé avec <strong>Diane</strong>, la fondatrice.</>
                  : <>A private conversation with <strong>Diane</strong>, the founder.</>}
              </p>
              <p className="seance-lobby__hint">
                {lang === 'fr'
                  ? 'Votre navigateur vous demandera l\'accès à la caméra et au micro.'
                  : 'Your browser will ask for camera and microphone access.'}
              </p>
              {errorMsg && <p className="resa-error">{errorMsg}</p>}
              <button type="button" className="btn btn--violet-mid" onClick={joinCall}>
                {lang === 'fr' ? 'Rejoindre l\'échange' : 'Join the call'}
              </button>
            </div>
          )}

          {/* Conteneur visio */}
          <div
            ref={containerRef}
            className={`seance-video ${videoActive ? 'seance-video--active' : ''}`}
            aria-label={lang === 'fr' ? 'Visioconférence' : 'Video call'}
          />

          {/* Connexion */}
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
                {lang === 'fr' ? 'Connexion à votre échange...' : 'Connecting to your call...'}
              </p>
            </div>
          )}

          {/* Reconnexion */}
          {reconnecting && (
            <div className="seance-reconnect" role="status" aria-live="polite">
              <span className="seance-reconnect__dot" />
              {lang === 'fr' ? 'Reconnexion en cours...' : 'Reconnecting...'}
            </div>
          )}

          {/* Erreur */}
          {state === 'error' && (
            <div className="seance-lobby">
              <h1 className="seance-lobby__title">
                {lang === 'fr' ? 'Accès impossible' : 'Access not possible'}
              </h1>
              <p className="seance-lobby__text">{errorMsg || msg('GENERIC')}</p>
              <Link to="/" className="btn btn--outline">
                {lang === 'fr' ? 'Retour à l\'accueil' : 'Back home'}
              </Link>
            </div>
          )}

          {/* Fin */}
          {state === 'ended' && (
            <div className="seance-lobby">
              <p className="seance-lobby__icon">✦</p>
              <h1 className="seance-lobby__title">
                {lang === 'fr' ? 'Échange terminé' : 'Call ended'}
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