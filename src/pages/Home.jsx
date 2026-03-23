// ─────────────────────────────────────────
//  HOME — v3 nouveaux textes
// ─────────────────────────────────────────

import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../components/LangContext';
import { Helmet } from 'react-helmet-async';
import Footer from '../components/Footer';

import logoIdalaTrspr from '../assets/logoidalatrspr2.png';
import dianeRegard    from '../assets/dianeregard.png';
import handsHealing   from '../assets/meditationdiane.png';
import soundHealing   from '../assets/yogameditdiane.png';
import yogaPose       from '../assets/souplesserocher.png';
import breathwork     from '../assets/yogaplage.png';

const TESTIMONIALS = [
  { text: '"Working with an IDALA practitioner completely shifted how I approach my daily routine. My body feels stronger and my mind is finally quiet."', author: '— Sarah M., London' },
  { text: '"The tarot reading gave me exactly the clarity I needed. It felt grounded, professional and deeply insightful."', author: '— Marie-Claire D., Paris' },
  { text: '"I attended one of Diane\'s retreats in Costa Rica and it was life-changing. The nervous system reset was exactly what my body needed."', author: '— Thomas R., New York' },
  { text: '"The yoga sessions through IDALA are unlike any I\'ve tried before. Structured, intentional and beautifully guided."', author: '— Amara L., Berlin' },
  { text: '"My birth chart reading opened a whole new dimension of self-understanding. Incredibly thorough and compassionate."', author: '— Isabelle F., Montréal' },
  { text: '"IDALA feels like a trusted family. Every practitioner is professional and the community is genuinely supportive."', author: '— Yuki T., Tokyo' },
];

function Home() {
  const { lang }  = useLang();
  const navigate  = useNavigate();
  const trackRef  = useRef(null);
  const durRef    = useRef(44);
  const all       = [...TESTIMONIALS, ...TESTIMONIALS];

  const adjustSpeed = faster => {
    if (!trackRef.current) return;
    durRef.current = faster
      ? Math.max(durRef.current * 0.65, 8)
      : Math.min(durRef.current * 1.4, 120);
    trackRef.current.style.animationDuration = durRef.current + 's';
  };

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? 'The Idala Family | Bien-être Holistique' : 'The Idala Family | Holistic Wellness'}</title>
        <meta name="description" content={lang === 'fr'
          ? 'Plateforme de bien-être holistique : yoga, reiki, astrologie, méditation. Fondée par Diane Thomas.'
          : 'Holistic wellness platform: yoga, reiki, astrology, meditation. Founded by Diane Thomas.'} />
      </Helmet>

      <div className="page-wrap">

        {/* ── SECTION 1 — HERO LOGO ── */}
        <section className="home-hero">
          <div className="home-hero__inner">
            <div className="home-hero__logo-wrap">
              <img src={logoIdalaTrspr} alt="The Idala Family" className="home-hero__logo" />
            </div>
            <h1 className="home-hero__tagline">
              {lang === 'fr'
                ? 'Bien-être holistique · Corps & Esprit'
                : 'Holistic Wellness · Body & Mind'}
            </h1>
          </div>
        </section>

        {/* ── SECTION 2 — CONCEPT ── */}
        <section className="home-concept">
          <div className="home-concept__inner">

            <div className="home-concept__label-col">
              <div className="home-concept__vertical-title">
                {'THE IDALA FAMILY'.split('').map((char, i) => (
                  <span key={i} className="home-concept__letter">{char === ' ' ? '\u00A0' : char}</span>
                ))}
              </div>
              <div className="home-concept__vertical-sub">
                {'CONCEPT'.split('').map((char, i) => (
                  <span key={i} className="home-concept__letter">{char}</span>
                ))}
              </div>
            </div>

            <div className="home-concept__text-col">
              {lang === 'en' ? (
                <>
                  <p className="home-concept__body">The Idala Family is a curated platform connecting trusted holistic practitioners with individuals committed to strengthening their body, refining their mind, and evolving with intention.</p>
                  <p className="home-concept__body">Well-being is not one-dimensional. Physical strength, nervous system balance, and mental clarity are deeply interconnected. When one transforms, everything shifts.</p>
                  <p className="home-concept__body">We bring these dimensions together into a structured and elevated approach to modern well-being, designed for those seeking depth, alignment, and lasting results.</p>
                  <div className="home-concept__trust">
                    <span className="home-concept__trust-icon">✦</span>
                    <p>Every practitioner on The Idala Family platform is <strong>rigorously verified, confirmed, and selected</strong> through a thorough and supported vetting process — so you can explore with confidence.</p>
                  </div>
                </>
              ) : (
                <>
                  <p className="home-concept__body">The Idala Family est une plateforme sélective qui connecte des praticiens holistiques de confiance avec des individus engagés à renforcer leur corps, affiner leur esprit et évoluer avec intention.</p>
                  <p className="home-concept__body">Le bien-être n'est pas unidimensionnel. La force physique, l'équilibre du système nerveux et la clarté mentale sont profondément interconnectés. Quand l'un se transforme, tout change.</p>
                  <p className="home-concept__body">Nous réunissons ces dimensions dans une approche structurée et élevée du bien-être moderne, conçue pour ceux qui recherchent profondeur, alignement et résultats durables.</p>
                  <div className="home-concept__trust">
                    <span className="home-concept__trust-icon">✦</span>
                    <p>Chaque praticien de la plateforme The Idala Family est <strong>rigoureusement vérifié, confirmé et sélectionné</strong> via un processus d'évaluation soutenu et exigeant — pour que vous puissiez explorer en toute confiance.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── SECTION 3 — BODY & MIND PHILOSOPHY ── */}
        <section className="home-philosophy">
          <div className="home-philosophy__inner">

            <div className="home-philosophy__text-col">
              {lang === 'en' ? (
                <>
                  <p className="home-concept__body">At the core of IDALA lies a simple truth: the body and the mind cannot be separated.</p>
                  <p className="home-concept__body">A stronger body creates a clearer, more stable mind. A regulated mind allows the body to perform, adapt, and recover at its highest level. True well-being is built through this alignment.</p>
                  <p className="home-concept__body">We exist to make this connection accessible through a refined and trusted ecosystem of practices and practitioners.</p>
                </>
              ) : (
                <>
                  <p className="home-concept__body">Au cœur d'IDALA se trouve une vérité simple : le corps et l'esprit ne peuvent pas être séparés.</p>
                  <p className="home-concept__body">Un corps plus fort crée un esprit plus clair et plus stable. Un esprit régulé permet au corps de performer, s'adapter et récupérer à son plus haut niveau. Le vrai bien-être se construit à travers cet alignement.</p>
                  <p className="home-concept__body">Nous existons pour rendre cette connexion accessible à travers un écosystème raffiné et de confiance de pratiques et de praticiens.</p>
                </>
              )}
            </div>


            <div className="home-philosophy__label-col">
              <div className="home-concept__vertical-sub">
                {'PHILOSOPHY'.split('').map((char, i) => (
                  <span key={i} className="home-concept__letter">{char}</span>
                ))}
              </div>
              <div className="home-concept__vertical-title">
                {'BODY & MIND'.split('').map((char, i) => (
                  <span key={i} className="home-concept__letter">{char === ' ' ? '\u00A0' : char}</span>
                ))}
              </div>
            </div>
            <div className="home-philosophy__quote">
              <span className="home-philosophy__quote-mark">"</span>
                <p className="home-philosophy__quote-text">Mens sana in corpore sano</p>
              <span className="home-philosophy__quote-mark">"</span>
            </div>

          </div>
        </section>

        {/* ── SECTION 4 — GALERIE ── */}
        <section className="home-gallery">
          <div className="home-gallery__grid">
            <div className="home-gallery__item home-gallery__item--tall">
              <img src={handsHealing} alt="Hands healing" />
              <span className="home-gallery__caption">{lang === 'fr' ? 'Soin' : 'Healing'}</span>
            </div>
            <div className="home-gallery__item">
              <img src={soundHealing} alt="Sound healing" />
              <span className="home-gallery__caption">Sound Healing</span>
            </div>
            <div className="home-gallery__item">
              <img src={yogaPose} alt="Yoga" />
              <span className="home-gallery__caption">Yoga</span>
            </div>
            <div className="home-gallery__item home-gallery__item--wide">
              <img src={breathwork} alt="Breathwork" />
              <span className="home-gallery__caption">Breathwork</span>
            </div>
          </div>
        </section>

        {/* ── SECTION 5 — DIANE ── */}
        <section className="home-diane">
          <div className="home-diane__inner">
            <div className="home-diane__text">
              <span className="eyebrow">{lang === 'fr' ? 'La Fondatrice' : 'The Founder'}</span>
              <h2 className="home-diane__name">Diane Thomas</h2>
              <div className="divider" />
              <p className="home-diane__body">
                {lang === 'fr'
                  ? "Professeure de Yoga certifiée, Praticienne Reiki & Tarologue. Diane a fondé The Idala Family pour créer un espace où le corps et l'esprit se renforcent ensemble, au sein d'une communauté holistique de confiance."
                  : 'Certified Yoga Teacher, Reiki Practitioner & Tarot Reader. Diane founded The Idala Family to create a space where body and mind strengthen together, within a trusted holistic community.'}
              </p>
              <button className="btn btn--outline" onClick={() => navigate('/about')}>
                {lang === 'fr' ? 'En savoir plus' : 'Learn More'}
              </button>
            </div>
            <div className="home-diane__photo-wrap">
              <img src={dianeRegard} alt="Diane Thomas" className="home-diane__photo" />
              <div className="home-diane__photo-ring" />
            </div>
          </div>
        </section>

        {/* ── SECTION 6 — CTA ── */}
        <section className="home-cta">
          <span className="eyebrow" style={{ textAlign: 'center', display: 'block', marginBottom: 16 }}>
            {lang === 'fr' ? 'Explorez la plateforme' : 'Explore the Platform'}
          </span>
          <h2 className="home-cta__title">
            {lang === 'fr' ? 'Par où souhaitez-vous commencer ?' : 'Where would you like to begin?'}
          </h2>
          <div className="home-cta__row">
            <button className="btn btn--outline home-cta__btn" onClick={() => navigate('/practitioners')}>
              {lang === 'fr' ? 'Trouver un Praticien' : 'Find a Practitioner'}
            </button>
            <button className="btn btn--outline home-cta__btn" onClick={() => navigate('/spiritual')}>
              {lang === 'fr' ? 'Tarot & Guidance' : 'Reading & Guidance'}
            </button>
            <button className="btn btn--outline home-cta__btn" onClick={() => navigate('/astrology')}>
              {lang === 'fr' ? 'Thème Astral' : 'Birth Chart'}
            </button>
          </div>
        </section>

        {/* ── SECTION 7 — TESTIMONIALS ── */}
        <section className="testimonials-wrap">
          <div className="testimonials-header">
            <span className="eyebrow">{lang === 'fr' ? 'Témoignages' : 'Testimonials'}</span>
            <h2 className="section-title">{lang === 'fr' ? 'Ce que dit notre communauté' : 'What Our Community Says'}</h2>
          </div>
          <div className="testimonials-track-outer">
            <div className="testimonials-track" ref={trackRef}>
              {all.map((t, i) => (
                <div className="tcard" key={i}>
                  <p className="tcard-text">{t.text}</p>
                  <div className="tcard-author">{t.author}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="tcard-controls">
            <button className="tcard-btn" onClick={() => adjustSpeed(false)}>←</button>
            <button className="tcard-btn" onClick={() => adjustSpeed(true)}>→</button>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

export default Home;
