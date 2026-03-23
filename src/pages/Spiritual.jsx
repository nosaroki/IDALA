// ─────────────────────────────────────────
//  SPIRITUAL / TAROT & INTUITIVE GUIDANCE v2
// ─────────────────────────────────────────

import { useLang } from '../components/LangContext';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

// ── Images — remplace par tes vraies photos ──────────────────────────
// import tarotImg   from '../assets/tarot.jpg';
// import psychicImg from '../assets/psychic.jpg';
// Pour l'instant on utilise tes images existantes comme placeholder
import tarotImg   from '../assets/yogameditdiane.png';
import psychicImg from '../assets/meditationdiane.png';
// ────────────────────────────────────────────────────────────────────

const TAROT_SESSIONS = [
  {
    duration: '30',
    chakra: 'c7',
    amount: { fr: 40, en: 40 },
    currency: { fr: '€', en: '€' },
    en: {
      title: '30-Minute Tarot Reading',
      desc: 'Focused guidance on one specific question or situation — relationship, career, decision, or challenge. A clear and direct reading designed to bring immediate clarity and direction.',
    },
    fr: {
      title: 'Lecture de Tarot 30 Minutes',
      desc: 'Guidance ciblée sur une question ou situation précise — relation, carrière, décision ou défi. Une lecture claire et directe conçue pour apporter une clarté et une direction immédiates.',
    },
  },
  {
    duration: '60',
    chakra: 'c5',
    amount: { fr: 80, en: 80 },
    currency: { fr: '€', en: '€' },
    en: {
      title: '60-Minute Tarot Reading',
      desc: 'A deeper reading covering several aspects of your life, offering broader perspective and short-term direction. Includes pattern analysis and forward guidance across multiple life areas.',
    },
    fr: {
      title: 'Lecture de Tarot 60 Minutes',
      desc: "Une lecture approfondie couvrant plusieurs aspects de votre vie, offrant une perspective plus large et une direction à court terme. Inclut une analyse des patterns et une guidance vers l'avenir.",
    },
  },
];

function Spiritual() {
  const { lang } = useLang();
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? 'Tarot & Guidance Intuitive | The Idala Family' : 'Tarot & Intuitive Guidance | The Idala Family'}</title>
        <meta name="description" content={lang === 'fr'
          ? 'Réservez une séance de lecture tarot ou psychique avec Diane Thomas. Lectures ciblées ou approfondies pour apporter clarté, direction et alignement énergétique.'
          : 'Book a tarot or psychic reading session with Diane Thomas. Focused or in-depth readings to bring clarity, direction and energetic alignment.'} />
      </Helmet>

      <div className="page-wrap">

        {/* ── Hero ── */}
        <section className="spiritual-hero-v2">
          <div className="spiritual-hero-v2__inner">
            <div className="spiritual-hero-v2__text">
              <span className="eyebrow">
                {lang === 'fr' ? 'Guidance Intuitive' : 'Intuitive Guidance'}
              </span>
              <h1 className="spiritual-hero-v2__title">
                {lang === 'fr' ? 'Tarot & Guidance Intuitive' : 'Tarot & Intuitive Guidance'}
              </h1>
              <div className="divider" />
              <p className="spiritual-hero-v2__body">
                {lang === 'fr'
                  ? "Le tarot est une forme de guidance intuitive qui utilise des cartes symboliques pour apporter clarté, perspective et alignement énergétique. Chaque lecture est conçue pour vous aider à comprendre votre situation actuelle, explorer les chemins possibles et avancer avec plus de confiance."
                  : 'Tarot is a form of intuitive guidance that uses symbolic cards to bring clarity, perspective, and energetic alignment. Each reading is designed to help you understand your current situation, explore possible paths, and move forward with more confidence.'}
              </p>
            </div>
            <div className="spiritual-hero-v2__visual">
              <div className="spiritual-orb">
                {/* Icône SVG carte de tarot */}
                <svg viewBox="0 0 60 80" fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 48, height: 64, opacity: .85 }}>
                  <rect x="4" y="2" width="52" height="76" rx="4"/>
                  <path d="M30 15 L36 28 L50 30 L40 40 L43 54 L30 47 L17 54 L20 40 L10 30 L24 28 Z"/>
                  <circle cx="30" cy="65" r="3" fill="white" stroke="none" opacity=".6"/>
                </svg>
              </div>
              <span className="spiritual-orb-label">IDALA Tarot &amp; Oracle</span>
            </div>
          </div>
        </section>

        {/* ── Tarot Readings ── */}
        <section className="spiritual-section">
          <div className="spiritual-section__header">
            <span className="eyebrow" style={{ textAlign: 'center' }}>Tarot</span>
            <h2 className="spiritual-section__title">
              {lang === 'fr' ? 'Lectures de Tarot' : 'Tarot Readings'}
            </h2>
          </div>

          <div className="spiritual-cards">
            {TAROT_SESSIONS.map(s => {
              const copy = lang === 'fr' ? s.fr : s.en;
              const sym  = s.currency[lang];
              const amt  = s.amount[lang];
              return (
                <div key={s.duration} className={`spiritual-card spiritual-card--${s.chakra}`}>
                  <div className="spiritual-card__image">
                    <img src={tarotImg} alt={copy.title} />
                  </div>
                  <div className="spiritual-card__content">
                    <div className="spiritual-card__duration">{s.duration} min</div>
                    <h3 className="spiritual-card__title">{copy.title}</h3>
                    <div className="spiritual-card__price">
                      <sup>{sym}</sup>{amt}
                    </div>
                    <div className="divider" style={{ margin: '16px 0' }} />
                    <p className="spiritual-card__desc">{copy.desc}</p>
                    <button className={`btn spiritual-card__btn spiritual-card__btn--${s.chakra}`}>
                      {lang === 'fr' ? 'Réserver une Séance' : 'Book a Session'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Psychic Session ── */}
        <section className="spiritual-psychic">
          <div className="spiritual-psychic__inner">
            <div className="spiritual-psychic__image">
              <img src={psychicImg} alt="Psychic Session" />
            </div>
            <div className="spiritual-psychic__content">
              <span className="eyebrow">
                {lang === 'fr' ? 'Guidance Psychique' : 'Psychic Guidance'}
              </span>
              <h2 className="spiritual-psychic__title">
                {lang === 'fr' ? 'Séance Psychique' : 'Psychic Session'}
              </h2>
              <div className="divider" />
              <p className="spiritual-psychic__body">
                {lang === 'fr'
                  ? "Une séance psychique est une consultation intuitive qui offre insight, clarté et une perspective plus élevée sur votre vie. Le praticien se connecte à votre énergie pour explorer des thèmes tels que les relations, la carrière, la direction personnelle et les dynamiques émotionnelles — vous aidant à comprendre les patterns sous-jacents et vos prochaines étapes."
                  : 'A psychic session is an intuitive consultation that offers insight, clarity, and a higher perspective on your life. The practitioner tunes into your energy to explore themes such as relationships, career, personal direction, and emotional dynamics — helping you understand underlying patterns and your next steps.'}
              </p>
              <button className="btn spiritual-psychic__btn">
                {lang === 'fr' ? 'Réserver une Séance' : 'Book a Session'}
              </button>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

export default Spiritual;
