import { useState, useContext, useRef, useEffect } from 'react';
import { LangCtx } from './LangContext';

// À remplacer quand le calendrier SuperSaaS de Diane sera configuré
const DIAGNOSTIC_CALENDAR_URL = '#';
const WHATSAPP_URL = 'https://wa.me/33674869019';

export default function DiagnosticBubble() {
  const { lang } = useContext(LangCtx);
  const [isOpen, setIsOpen] = useState(false);
  const bubbleRef = useRef(null);

  const t = {
    label: lang === 'fr' ? 'Diagnostic personnalisé' : 'Personalised diagnostic',
    title: lang === 'fr' ? "Besoin d'être orienté ?" : 'Need guidance?',
    subtitle:
      lang === 'fr'
        ? 'Diane vous aide à trouver le praticien adapté à votre situation.'
        : 'Diane helps you find the right practitioner for your needs.',
    cta1: lang === 'fr' ? 'Réserver un diagnostic' : 'Book a diagnostic',
    cta2: 'WhatsApp',
  };

  // Fermer au clic en dehors (mobile)
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Fermer avec Échap
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <div
      ref={bubbleRef}
      className={`diagnostic-bubble ${isOpen ? 'is-open' : ''}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="diagnostic-bubble__trigger-wrap">
        <span className="diagnostic-bubble__ripple" aria-hidden="true"></span>
        <span className="diagnostic-bubble__ripple diagnostic-bubble__ripple--delayed" aria-hidden="true"></span>
        <button
            type="button"
            className="diagnostic-bubble__trigger"
            aria-label={t.label}
            aria-expanded={isOpen}
            onClick={() => setIsOpen(!isOpen)}
            >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 1.5 L13 10.5 L22.5 12 L13 13.5 L12 22.5 L11 13.5 L1.5 12 L11 10.5 Z"/>
            </svg>
            </button>
      </div>

      <div
        className="diagnostic-bubble__panel"
        role="dialog"
        aria-label={t.label}
        aria-hidden={!isOpen}
      >
        <h3 className="diagnostic-bubble__title">{t.title}</h3>
        <p className="diagnostic-bubble__subtitle">{t.subtitle}</p>
        <div className="diagnostic-bubble__actions">
          
            <a href={DIAGNOSTIC_CALENDAR_URL}
            className="diagnostic-bubble__cta diagnostic-bubble__cta--primary"
            tabIndex={isOpen ? 0 : -1}
          >
            {t.cta1}
          </a>
          
            <a href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="diagnostic-bubble__cta diagnostic-bubble__cta--secondary"
            tabIndex={isOpen ? 0 : -1}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
            </svg>
            {t.cta2}
          </a>
        </div>
      </div>
    </div>
  );
}