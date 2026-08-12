import { useState } from 'react';
import { useLang } from '../components/LangContext';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import chakras from '../assets/chakras.webp';
import OptimizedImage from '../components/OptimizedImage'


const Icons = {
  Yoga: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="20" cy="7" r="3"/><path d="M20 10 Q14 18 8 22M20 10 Q26 18 32 22"/><path d="M14 30 Q17 24 20 22 Q23 24 26 30"/><path d="M8 22 Q10 28 14 30M32 22 Q30 28 26 30"/></svg>),
  Breathwork: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 34 Q20 26 20 20"/><path d="M20 20 Q14 16 8 18"/><path d="M20 20 Q26 16 32 18"/><path d="M8 18 Q6 14 9 12 Q12 10 14 13"/><path d="M32 18 Q34 14 31 12 Q28 10 26 13"/><circle cx="20" cy="8" r="4" strokeDasharray="2 2"/></svg>),
  Meditation: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="20" cy="8" r="3"/><path d="M12 22 Q16 18 20 17 Q24 18 28 22"/><path d="M8 26 Q12 22 20 22 Q28 22 32 26"/><path d="M12 22 Q10 26 8 26M28 22 Q30 26 32 26"/><path d="M16 32 Q18 28 20 28 Q22 28 24 32"/></svg>),
  Coaching: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="14" cy="12" r="4"/><circle cx="28" cy="16" r="3"/><path d="M6 32 Q6 24 14 24 Q22 24 22 32"/><path d="M22 28 Q22 22 28 22 Q34 22 34 28"/><path d="M18 16 L24 14"/></svg>),
  Reiki: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="20" cy="20" r="6"/><path d="M20 6 L20 10M20 30 L20 34M6 20 L10 20M30 20 L34 20"/><path d="M10.1 10.1 L13 13M27 27 L29.9 29.9M29.9 10.1 L27 13M13 27 L10.1 29.9"/><circle cx="20" cy="20" r="2" fill="currentColor" stroke="none"/></svg>),
  SoundHealing: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="20" cy="20" r="12"/><circle cx="20" cy="20" r="7"/><circle cx="20" cy="20" r="2" fill="currentColor" stroke="none"/><path d="M20 4 Q24 8 24 12"/><path d="M20 4 Q16 8 16 12"/><path d="M34 14 Q34 20 30 24"/><path d="M6 14 Q6 20 10 24"/></svg>),
  Acupuncture: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><line x1="20" y1="4" x2="20" y2="36"/><line x1="12" y1="8" x2="12" y2="32"/><line x1="28" y1="8" x2="28" y2="32"/><circle cx="20" cy="4" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="28" cy="8" r="1.5" fill="currentColor" stroke="none"/></svg>),
  Osteotherapy: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 Q22 10 20 14 Q18 18 20 22 Q22 26 20 34"/><path d="M14 10 Q18 12 20 14 Q22 16 26 14"/><path d="M12 20 Q16 20 20 22 Q24 24 28 22"/><path d="M14 28 Q18 27 20 28 Q22 29 26 28"/></svg>),
  Hypnotherapy: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="20" cy="20" r="14"/><circle cx="20" cy="20" r="9"/><circle cx="20" cy="20" r="4"/><circle cx="20" cy="20" r="1.5" fill="currentColor" stroke="none"/><path d="M6 20 Q13 14 20 20 Q27 26 34 20" strokeDasharray="2 2"/></svg>),
  Massage: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 28 Q12 20 18 18 Q24 16 30 20"/><path d="M10 32 Q16 26 22 24 Q28 22 34 26"/><path d="M18 18 Q16 14 18 11 Q20 8 23 10 Q26 12 24 16"/><path d="M24 16 Q28 14 30 16 Q32 18 30 20"/></svg>),
  Naturopathy: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 34 Q20 20 20 10"/><path d="M20 18 Q14 14 8 16 Q12 22 20 22"/><path d="M20 26 Q26 22 32 24 Q28 30 20 30"/><path d="M20 14 Q24 8 30 8 Q28 16 20 18"/></svg>),
  QiGong: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="20" cy="8" r="3"/><path d="M20 11 L20 22"/><path d="M20 16 Q12 14 8 18"/><path d="M20 16 Q28 14 32 18"/><path d="M20 22 Q14 26 12 32"/><path d="M20 22 Q26 26 28 32"/></svg>),
  TaiChi: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="20" cy="20" r="14"/><path d="M20 6 Q28 13 20 20 Q12 27 20 34"/><circle cx="20" cy="13" r="3" fill="currentColor" stroke="none" opacity=".4"/><circle cx="20" cy="27" r="3" fill="none"/></svg>),
};

const PRACTS = [
  // ── CORPS ──
  { icon: 'Yoga',        slug: 'yoga', titleFr: 'Yoga',                  titleEn: 'Yoga',               category: 'corps',   chakra: 'c1', fr: 'Une pratique corporelle basée sur le mouvement qui renforce le corps, améliore la souplesse et apaise le mental en reliant postures, respiration et présence consciente.', en: 'A movement-based practice that builds strength, improves flexibility and calms the mind by integrating postures, breath and conscious presence.' },
  { icon: 'Osteotherapy',  slug: 'osteotherapy', titleFr: 'Ostéothérapie',           titleEn: 'Ostetherapy',          category: 'corps',   chakra: 'c4', fr: "Une thérapie manuelle centrée sur la structure du corps (muscles, articulations, squelette) pour relâcher les tensions, améliorer la mobilité et soutenir la capacité naturelle du corps à s'autoréguler.", en: "A manual therapy focused on the body's structure (muscles, joints, skeleton) to release tension, improve mobility and support the body's natural capacity to self-regulate." },
  { icon: 'Massage',     slug: 'therapeutic-massage', titleFr: 'Massage Thérapeutique', titleEn: 'Therapeutic Massage', category: 'corps',   chakra: 'c2', fr: "Une approche manuelle ciblée qui agit sur les tissus du corps pour relâcher les tensions, soulager certaines douleurs, améliorer la circulation et inviter le système nerveux à un profond état de détente.", en: "A targeted manual approach that works on the body's tissues to release tension, relieve pain, improve circulation and invite the nervous system into a deep state of relaxation." },
  { icon: 'Acupuncture', slug: 'acupuncture', titleFr: 'Acupuncture',           titleEn: 'Acupuncture',         category: 'corps',   chakra: 'c6', fr: "Une pratique traditionnelle chinoise qui stimule des points précis du corps à l'aide de très fines aiguilles afin de soulager la douleur, améliorer la circulation et activer les mécanismes naturels d'auto‑guérison.", en: "A traditional Chinese practice that stimulates precise points on the body with very fine needles to relieve pain, improve circulation and activate the body's natural self-healing mechanisms." },
  { icon: 'TaiChi',      slug: 'tai-chi', titleFr: 'Tai Chi',               titleEn: 'Tai Chi',             category: 'corps',   chakra: 'c7', fr: "Un art martial doux aux mouvements lents et fluides, pratiqué comme une méditation en mouvement pour renforcer l'équilibre, assouplir le corps et réduire le stress tout en cultivant calme et stabilité intérieure.", en: 'A gentle martial art with slow, fluid movements practiced as a moving meditation to strengthen balance, soften the body and reduce stress while cultivating inner calm and stability.' },
  { icon: 'QiGong',      slug: 'qi-gong', titleFr: 'Qi Gong',              titleEn: 'Qi Gong',             category: 'corps',   chakra: 'c5', fr: "Une pratique énergétique chinoise qui combine mouvements lents, respiration et attention consciente pour harmoniser l'énergie vitale, améliorer la souplesse et apaiser le système nerveux.", en: 'A Chinese energy practice combining slow movements, breath and conscious attention to harmonise vital energy, improve flexibility and calm the nervous system.' },
  // ── ESPRIT ──
  { icon: 'Meditation',   slug: 'meditation', titleFr: 'Méditation',    titleEn: 'Meditation',    category: 'esprit',  chakra: 'c3', fr: "Un ensemble de pratiques d'entraînement de l'esprit qui améliorent la concentration, approfondissent la connaissance de soi et cultivent, au fil du temps, le calme intérieur et l'équilibre émotionnel.", en: 'A set of mind training practices that improve focus, deepen self-knowledge and cultivate, over time, inner calm and emotional balance.' },
  { icon: 'Breathwork',   slug: 'breathwork', titleFr: 'Breathwork',    titleEn: 'Breathwork',    category: 'esprit',  chakra: 'c4', fr: 'Un ensemble de techniques de respiration guidée qui régulent le système nerveux, réduisent le stress et renforcent la résilience émotionnelle et la présence à soi.', en: 'A set of guided breathing techniques that regulate the nervous system, reduce stress and strengthen emotional resilience and presence.' },
  { icon: 'Coaching',     slug: 'coaching', titleFr: 'Coaching',      titleEn: 'Coaching',      category: 'esprit',  chakra: 'c2', fr: 'Des séances individuelles guidées qui clarifient les choix de vie, aident à dépasser les schémas limitants et soutiennent des changements alignés avec ses valeurs.', en: 'Guided one-to-one sessions that clarify life choices, help overcome limiting patterns and support changes aligned with your values.' },
  { icon: 'Hypnotherapy', slug: 'hypnotherapy', titleFr: 'Hypnothérapie', titleEn: 'Hypnotherapy',  category: 'esprit',  chakra: 'c6', fr: "Une approche thérapeutique qui utilise la relaxation guidée et une attention focalisée pour dialoguer avec l'inconscient, libérer en douceur certains blocages et accompagner des changements émotionnels et comportementaux durables.", en: 'A therapeutic approach that uses guided relaxation and focused attention to engage with the subconscious, gently release certain blocks and support lasting emotional and behavioral change.' },
  // ── ÉNERGIE ──
  { icon: 'Reiki',        slug: 'reiki',  titleFr: 'Reiki',         titleEn: 'Reiki',         category: 'energie', chakra: 'c7', fr: "Une pratique énergétique douce où les mains sont posées sur ou au‑dessus du corps pour favoriser la relaxation, l'harmonie émotionnelle et une sensation de bien‑être global.", en: 'A gentle energy-based practice in which hands are placed on or above the body to promote relaxation, emotional harmony and a sense of overall well-being.' },
  { icon: 'SoundHealing', slug: 'sound-healing', titleFr: 'Sound Healing', titleEn: 'Sound Healing', category: 'energie', chakra: 'c1', fr: "Une pratique vibratoire utilisant instruments et fréquences sonores pour calmer le système nerveux, relâcher les tensions et restaurer une profonde sensation d'équilibre intérieur.", en: 'A vibrational practice using instruments and sound frequencies to calm the nervous system, release tension and restore a deep sense of inner equilibrium.' },
  { icon: 'Naturopathy',  slug: 'naturopathy', titleFr: 'Naturopathie',  titleEn: 'Naturopathy',   category: 'energie', chakra: 'c4', fr: "Une approche naturelle de la santé qui vise à renforcer les capacités d'auto‑guérison du corps en agissant sur l'alimentation, l'hygiène de vie, la gestion du stress et le soutien par les plantes, afin de retrouver et maintenir un équilibre global sur le long terme.", en: "A natural approach to health that aims to strengthen the body's self-healing capacity by addressing nutrition, lifestyle, stress management and herbal support, in order to restore and maintain long-term overall balance." },
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
  c1: '#FF6B6B', c2: '#FFB060', c3: '#FFD600',
  c4: '#3DCC70', c5: '#3AA8E0', c6: '#7B4FD8', c7: '#C060E0',
};

const CATEGORIES = [
  { key: 'all',     labelFr: 'Toutes',  labelEn: 'All',    color: 'var(--violet-mid)' },
  { key: 'corps',   labelFr: 'Corps',   labelEn: 'Body',   color: 'var(--c1)' },
  { key: 'esprit',  labelFr: 'Esprit',  labelEn: 'Mind',   color: 'var(--c5)' },
  { key: 'energie', labelFr: 'Énergie', labelEn: 'Energy', color: 'var(--c7)' },
];

// Disposition quinconce 4-3-4-2 pour les 13 pratiques
const QUINCONCE_ROWS = [
  { start: 0,  count: 4 },
  { start: 4,  count: 3 },
  { start: 7,  count: 4 },
  { start: 11, count: 2 },
];

function PractCard({ p, lang }) {

  const navigate = useNavigate();

  return (
    <div className="pcard-wrap" style={{ '--chakra-color': CHAKRA_COLORS[p.chakra] }}>
      <div className="pcard-face pcard-front">
        <div className="pcard-front__ring" />
        <div className="pcard-front__icon">{Icons[p.icon]}</div>
        <div className="pcard-front__title">
          {lang === 'fr' ? p.titleFr : p.titleEn}
        </div>
        <div className="pcard-front__hint">{lang === 'fr' ? 'En savoir plus' : 'Learn more'}</div>
      </div>
      <div className="pcard-face pcard-back">
        <div className="pcard-back__title">
          {lang === 'fr' ? p.titleFr : p.titleEn}
        </div>
        <p className="pcard-back__text">{lang === 'fr' ? p.fr : p.en}</p>
        <button
          className={`pcard-back__btn btn--chakra-pill btn--chakra-pill--${p.chakra}`}
          onClick={() => navigate(`/practices/${p.slug}`)}
        >
          {lang === 'fr' ? 'Réserver une Séance' : 'Book a Session'}
        </button>
      </div>
    </div>
  );
}

function Practitioners() {
  const { lang } = useLang();
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = activeFilter === 'all'
    ? PRACTS
    : PRACTS.filter(p => p.category === activeFilter);

  const activeCat = CATEGORIES.find(c => c.key === activeFilter);

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? 'Praticiens | The Idala Family' : 'Practitioners | The Idala Family'}</title>
        <meta name="description" content={lang === 'fr'
          ? 'Trouvez le praticien qui vous convient : yoga, breathwork, méditation, coaching, reiki, sound healing, acupuncture, ostéotherapy, hypnothérapie et plus.'
          : 'Find the right practitioner for you: yoga, breathwork, meditation, coaching, reiki, sound healing, acupuncture, osteotherapy, hypnotherapy and more.'} />
      </Helmet>

      <div className="page-wrap">

        {/* ── HERO ── */}
        <section className="pract-hero">
          <div className="pract-hero__text pract-hero__text--centered">
            <h1 className="pract-hero__title">
              {lang === 'fr'
                ? "Trouvez l'accompagnement adapté à votre besoin"
                : 'Find the support that fits your needs'}
            </h1>
            <div className="divider divider--center" />
            <p className="pract-hero__body" >
              {lang === 'fr'
                ? <>The Idala Family vous met en relation avec des <strong>praticiens certifiés et rigoureusement sélectionnés</strong>, engagés à soutenir votre bien‑être physique et mental. <br />Chaque professionnel est choisi pour son sérieux, son savoir-faire et son éthique, afin que vous puissiez faire votre choix en toute confiance. <br />Explorez les catégories, trouvez l'approche qui correspond le mieux à vos besoins.</>
                : <>The Idala Family connects you with <strong>certified, carefully selected practitioners</strong> dedicated to supporting your physical and mental well-being. <br />Each professional is chosen for their expertise, professionalism and ethical approach, so you can make your choice with complete confidence. <br />Explore the categories, find the approach that best suits your needs.</>}
            </p>
            <div className="pract-hero__quote">
              <span className="pract-hero__quote-mark">"</span>
              <p className="pract-hero__quote-text">Mens sana in corpore sano</p>
              <span className="pract-hero__quote-mark">"</span>
            </div>
          </div>

          <div className="pract-chakra-top">
            <div className="pract-chakra-figure">
              <OptimizedImage src={chakras} alt="Chakra meditation figure" className="chakra-figure-img" />
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

        {/* ── FILTRES ── */}
        <section className="pract-filter-section">
          <div className="pract-filters">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                className={`pract-filter-btn ${activeFilter === cat.key ? 'active' : ''}`}
                style={{ '--cat-color': cat.color }}
                onClick={() => setActiveFilter(cat.key)}
              >
                {lang === 'fr' ? cat.labelFr : cat.labelEn}
              </button>
            ))}
          </div>
          {activeFilter !== 'all' && (
            <p className="pract-filter-count">
              {filtered.length} {lang === 'fr' ? 'pratique' : 'practice'}{filtered.length > 1 ? 's' : ''}
              {' · '}
              <span style={{ color: activeCat.color }}>
                {lang === 'fr' ? activeCat.labelFr : activeCat.labelEn}
              </span>
            </p>
          )}
        </section>

        {/* ── GRILLE ── */}
        <section className="pract-grid-section">

          {/* Vue "Toutes" — quinconce 4-3-4-2 */}
          {activeFilter === 'all' ? (
            <div className="pract-grid-quinconce">
              {QUINCONCE_ROWS.map((row, i) => (
                <div key={i} className="pract-quinconce-row">
                  {PRACTS.slice(row.start, row.start + row.count).map(p => (
                    <div key={p.titleEn} className="pcard-anim">
                      <PractCard p={p} lang={lang} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            /* Vue filtrée — grille classique centrée */
            <div className={`pract-grid pract-grid--${filtered.length <= 4 ? 'sm' : 'md'}`}>
              {filtered.map(p => (
                <div key={p.titleEn} className="pcard-anim">
                  <PractCard p={p} lang={lang} />
                </div>
              ))}
            </div>
          )}

        </section>

        <Footer />
      </div>
    </>
  );
}

export default Practitioners;