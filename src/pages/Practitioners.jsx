// ─────────────────────────────────────────
//  PRACTITIONERS v5 — wordings updated
// ─────────────────────────────────────────

import { useLang } from '../components/LangContext';
import { Helmet } from 'react-helmet-async';
import Footer from '../components/Footer';
import chakras from '../assets/chakras.png';

const Icons = {
  Yoga: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="20" cy="7" r="3"/><path d="M20 10 Q14 18 8 22M20 10 Q26 18 32 22"/><path d="M14 30 Q17 24 20 22 Q23 24 26 30"/><path d="M8 22 Q10 28 14 30M32 22 Q30 28 26 30"/></svg>),
  Breathwork: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 34 Q20 26 20 20"/><path d="M20 20 Q14 16 8 18"/><path d="M20 20 Q26 16 32 18"/><path d="M8 18 Q6 14 9 12 Q12 10 14 13"/><path d="M32 18 Q34 14 31 12 Q28 10 26 13"/><circle cx="20" cy="8" r="4" strokeDasharray="2 2"/></svg>),
  Meditation: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="20" cy="8" r="3"/><path d="M12 22 Q16 18 20 17 Q24 18 28 22"/><path d="M8 26 Q12 22 20 22 Q28 22 32 26"/><path d="M12 22 Q10 26 8 26M28 22 Q30 26 32 26"/><path d="M16 32 Q18 28 20 28 Q22 28 24 32"/></svg>),
  Coaching: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="14" cy="12" r="4"/><circle cx="28" cy="16" r="3"/><path d="M6 32 Q6 24 14 24 Q22 24 22 32"/><path d="M22 28 Q22 22 28 22 Q34 22 34 28"/><path d="M18 16 L24 14"/></svg>),
  Reiki: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="20" cy="20" r="6"/><path d="M20 6 L20 10M20 30 L20 34M6 20 L10 20M30 20 L34 20"/><path d="M10.1 10.1 L13 13M27 27 L29.9 29.9M29.9 10.1 L27 13M13 27 L10.1 29.9"/><circle cx="20" cy="20" r="2" fill="currentColor" stroke="none"/></svg>),
  SoundHealing: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="20" cy="20" r="12"/><circle cx="20" cy="20" r="7"/><circle cx="20" cy="20" r="2" fill="currentColor" stroke="none"/><path d="M20 4 Q24 8 24 12"/><path d="M20 4 Q16 8 16 12"/><path d="M34 14 Q34 20 30 24"/><path d="M6 14 Q6 20 10 24"/></svg>),
  Acupuncture: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><line x1="20" y1="4" x2="20" y2="36"/><line x1="12" y1="8" x2="12" y2="32"/><line x1="28" y1="8" x2="28" y2="32"/><circle cx="20" cy="4" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="28" cy="8" r="1.5" fill="currentColor" stroke="none"/></svg>),
  Ayurvedic: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 8 Q28 12 28 20 Q28 30 20 34 Q12 30 12 20 Q12 12 20 8Z"/><path d="M20 8 Q20 20 20 34"/><path d="M12 20 Q20 18 28 20"/><path d="M14 13 Q20 14 26 13"/><path d="M13 27 Q20 26 27 27"/></svg>),
  Osteopathy: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 Q22 10 20 14 Q18 18 20 22 Q22 26 20 34"/><path d="M14 10 Q18 12 20 14 Q22 16 26 14"/><path d="M12 20 Q16 20 20 22 Q24 24 28 22"/><path d="M14 28 Q18 27 20 28 Q22 29 26 28"/></svg>),
  Hypnotherapy: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="20" cy="20" r="14"/><circle cx="20" cy="20" r="9"/><circle cx="20" cy="20" r="4"/><circle cx="20" cy="20" r="1.5" fill="currentColor" stroke="none"/><path d="M6 20 Q13 14 20 20 Q27 26 34 20" strokeDasharray="2 2"/></svg>),
};

const PRACTS = [
  {
    icon: 'Yoga', title: 'Yoga', chakra: 'c1',
    en: 'A movement-based practice that builds strength, improves flexibility, and supports mental clarity by integrating posture, breath, and mindful awareness.',
    fr: 'Une pratique corporelle qui renforce le corps, améliore la flexibilité et soutient la clarté mentale en intégrant posture, respiration et pleine conscience.',
  },
  {
    icon: 'Breathwork', title: 'Breathwork', chakra: 'c4',
    en: 'A set of guided breathing techniques that regulate the nervous system, reduce stress, and enhance emotional resilience and presence.',
    fr: 'Un ensemble de techniques respiratoires guidées qui régulent le système nerveux, réduisent le stress et renforcent la résilience émotionnelle et la présence.',
  },
  {
    icon: 'Meditation', title: 'Meditation', chakra: 'c5',
    en: 'A family of mental training practices that improve focus, deepen self-awareness, and cultivate inner calm and emotional balance over time.',
    fr: "Un ensemble de pratiques d'entraînement mental qui améliorent la concentration, approfondissent la conscience de soi et cultivent la sérénité intérieure.",
  },
  {
    icon: 'Coaching', title: 'Transformative Coaching', chakra: 'c6',
    en: 'Guided one-to-one sessions that bring clarity to life choices, unlock limiting patterns, and support intentional, values-aligned change.',
    fr: "Séances individuelles guidées qui apportent de la clarté aux choix de vie, libèrent les schémas limitants et soutiennent un changement intentionnel aligné sur vos valeurs.",
  },
  {
    icon: 'Reiki', title: 'Reiki', chakra: 'c7',
    en: 'A gentle energy-based practice in which hands are placed on or above the body to promote relaxation, emotional harmony, and a sense of overall well-being.',
    fr: "Une pratique énergétique douce dans laquelle les mains sont posées sur ou au-dessus du corps pour favoriser la relaxation, l'harmonie émotionnelle et le bien-être général.",
  },
  {
    icon: 'SoundHealing', title: 'Sound Healing', chakra: 'c2',
    en: 'A vibrational practice using instruments and sound frequencies to calm the nervous system, release tension, and restore a deep sense of inner equilibrium.',
    fr: "Une pratique vibratoire utilisant des instruments et des fréquences sonores pour calmer le système nerveux, libérer les tensions et restaurer un profond sentiment d'équilibre intérieur.",
  },
  {
    icon: 'Acupuncture', title: 'Acupuncture', chakra: 'c3',
    en: 'A traditional Chinese practice that stimulates specific points on the body with very fine needles to relieve pain, improve circulation, and activate the body\'s natural healing response.',
    fr: "Une pratique traditionnelle chinoise qui stimule des points spécifiques du corps avec de très fines aiguilles pour soulager la douleur, améliorer la circulation et activer la réponse naturelle de guérison.",
  },
  {
    icon: 'Ayurvedic', title: 'Ayurveda', chakra: 'c4',
    en: 'An ancient Indian system of medicine that balances body, mind, and spirit through personalized nutrition, herbal support, and lifestyle rituals aimed at maintaining long-term health.',
    fr: "Un système médical indien ancestral qui équilibre corps, esprit et âme par une nutrition personnalisée, un soutien herbal et des rituels de vie visant à maintenir une santé durable.",
  },
  {
    icon: 'Osteopathy', title: 'Osteopathy', chakra: 'c1',
    en: 'A hands-on therapy focused on the body\'s structure — muscles, joints, and skeleton — to ease tension, improve mobility, and support the body\'s natural capacity to heal.',
    fr: "Une thérapie manuelle centrée sur la structure du corps — muscles, articulations et squelette — pour soulager les tensions, améliorer la mobilité et soutenir la capacité naturelle de guérison.",
  },
  {
    icon: 'Hypnotherapy', title: 'Hypnotherapy', chakra: 'c6',
    en: 'A therapeutic approach that uses guided relaxation and focused attention to work with the subconscious mind, gently release limiting patterns, and support meaningful emotional and behavioral change.',
    fr: "Une approche thérapeutique utilisant la relaxation guidée et l'attention focalisée pour travailler avec le subconscient, libérer doucement les schémas limitants et soutenir un changement émotionnel et comportemental significatif.",
  },
];

const CHAKRA_DOTS = [
  { color: 'var(--c1)', name: 'Root',      nameFr: 'Racine'        },
  { color: 'var(--c2)', name: 'Sacral',    nameFr: 'Sacré'         },
  { color: 'var(--c3)', name: 'Solar',     nameFr: 'Solaire'       },
  { color: 'var(--c4)', name: 'Heart',     nameFr: 'Cœur'          },
  { color: 'var(--c5)', name: 'Throat',    nameFr: 'Gorge'         },
  { color: 'var(--c6)', name: 'Third Eye', nameFr: 'Troisième Œil' },
  { color: 'var(--c7)', name: 'Crown',     nameFr: 'Couronne'      },
];

const CHAKRA_COLORS = {
  c1: '#FFB5B5', c2: '#FFCFA8', c3: '#e8c840',
  c4: '#B8E8C2', c5: '#A8D4F0', c6: '#C5B8F0', c7: '#E8B8F0',
};

function PractCard({ p, lang }) {
  return (
    <div className="pcard-wrap" style={{ '--chakra-color': CHAKRA_COLORS[p.chakra] }}>
      <div className="pcard-face pcard-front">
        <div className="pcard-front__ring" />
        <div className="pcard-front__icon">{Icons[p.icon]}</div>
        <div className="pcard-front__title">{p.title}</div>
        <div className="pcard-front__hint">{lang === 'fr' ? 'En savoir plus' : 'Learn more'}</div>
      </div>
      <div className="pcard-face pcard-back">
        <div className="pcard-back__title">{p.title}</div>
        <p className="pcard-back__text">{lang === 'fr' ? p.fr : p.en}</p>
        <button className={`pcard-back__btn btn--chakra-pill btn--chakra-pill--${p.chakra}`}>
          {lang === 'fr' ? 'Réserver une Séance' : 'Book a Session'}
        </button>
      </div>
    </div>
  );
}

function Practitioners() {
  const { lang } = useLang();

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? 'Praticiens | The Idala Family' : 'Practitioners | The Idala Family'}</title>
        <meta name="description" content={lang === 'fr'
          ? 'Trouvez le praticien holistique qui vous convient : yoga, breathwork, méditation, coaching, reiki, sound healing, acupuncture, ayurveda, ostéopathie, hypnothérapie.'
          : 'Find the right holistic practitioner for you: yoga, breathwork, meditation, coaching, reiki, sound healing, acupuncture, ayurveda, osteopathy, hypnotherapy.'} />
      </Helmet>

      <div className="page-wrap">

        <section className="pract-hero">

          {/* Texte centré en dessous */}
          <div className="pract-hero__text pract-hero__text--centered">
            <h1 className="pract-hero__title">
              {lang === 'fr' ? 'Trouvez le Praticien qui vous convient' : 'Find the Right Practitioner for You'}
            </h1>
            <div className="divider divider--center" />
            <p className="pract-hero__body">
              {lang === 'fr'
                ? "The Idala Family vous connecte avec des professionnels holistiques certifiés et rigoureusement sélectionnés, dédiés à soutenir votre bien-être physique et mental. Chaque praticien est soigneusement choisi pour garantir professionnalisme, qualité et intégrité, afin que vous puissiez faire votre choix en toute confiance. Explorez par catégorie et trouvez l'approche qui correspond le mieux à vos besoins."
                : 'Connect with trusted, certified holistic professionals dedicated to supporting your physical and mental well-being. Each practitioner is carefully selected to ensure professionalism, quality, and integrity, so you can feel confident in your choice. Explore by category and find the approach that best aligns with your needs.'}
            </p>
            <div className="pract-hero__quote">
              <span className="pract-hero__quote-mark">"</span>
                <p className="pract-hero__quote-text">Mens sana in corpore sano</p>
              <span className="pract-hero__quote-mark">"</span>
            </div>
          </div>

                    {/* Bonhomme centré en haut */}
          <div className="pract-chakra-top">
            <div className="pract-chakra-figure">
              <img src={chakras} alt="Chakra meditation figure" className="chakra-figure-img" />
              <div className="chakra-labels">
                {[...CHAKRA_DOTS].reverse().map(d => (
                  <div key={d.name} className="chakra-label">
                    <span className="chakra-label__line" style={{ background: d.color }} />
                    <span className="chakra-label__name">
                      {lang === 'fr' ? d.nameFr : d.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </section>

        <section className="pract-grid-section">
          <div className="pract-grid">
            {PRACTS.map(p => <PractCard key={p.title} p={p} lang={lang} />)}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

export default Practitioners;
