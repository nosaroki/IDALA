// ─────────────────────────────────────────
//  HOME 
// ─────────────────────────────────────────

import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../components/LangContext';
import { Helmet } from 'react-helmet-async';
import { useReveal } from '../hooks/useReveal';
import Footer from '../components/Footer';

import trsprlogo from '../assets/trsprlogo.png';
import dianeRegard    from '../assets/dianeregard.png';
import soundHealing   from '../assets/soundhealing.jpg';
import groupsound     from '../assets/groupsound.jpg';
import groupyoga       from '../assets/groupyoga.jpg';
import groupmedit      from '../assets/groupmedit.jpg';
// import yogaPose       from '../assets/souplesserocher.png';
// import breathwork     from '../assets/yogaplage.png';
import meditation from '../assets/meditation.jpg';
import sointbt from '../assets/sointbt.jpg';
import acu from '../assets/practitioners/acu.jpg';
import marine_reiki from '../assets/practitioners/marine_reiki.JPG';
import gobowl from '../assets/practitioners/gobowl.jpg';
import taichilady from '../assets/practitioners/taichilady.jpg';
import gogong from '../assets/practitioners/gogong.jpg';
import ladyyoga from '../assets/practitioners/ladyyoga.jpg';
import breathwork from '../assets/practitioners/breathwrk.jpg';
import facemedit from '../assets/practitioners/meditt.jpg';
import updownyoga from '../assets/banner/banner_yoga2.jpg'

const TESTIMONIALS = [
  {
    en: '"Working with an IDALA practitioner completely shifted how I approach my daily routine. My body feels stronger and my mind is finally quiet."',
    fr: '"Travailler avec un praticien IDALA a complètement transformé ma façon d\'aborder mon quotidien. Mon corps est plus fort et mon esprit est enfin apaisé."',
    author: '— Sarah M., London',
  },
  {
    en: '"The coaching gave me exactly the clarity I needed. It felt grounded, professional and deeply insightful."',
    fr: '"Le coaching m\'a apporté exactement la clarté dont j\'avais besoin. C\'était ancré, professionnel et vraiment éclairant."',
    author: '— Marie-Claire D., Paris',
  },
  {
    en: '"I attended one of Isabelle\'s retreats in Costa Rica and it was life-changing. The nervous system reset was exactly what my body needed."',
    fr: '"J\'ai participé à l\'une des retraites d\'Isabelle au Costa Rica et c\'était une expérience transformatrice. La remise à zéro du système nerveux était exactement ce dont mon corps avait besoin."',
    author: '— Thomas R., New York',
  },
  {
    en: '"The yoga sessions through IDALA are unlike any I\'ve tried before. Structured, intentional and beautifully guided."',
    fr: '"Les séances de yoga via IDALA sont incomparables. Structurées, intentionnelles et magnifiquement guidées."',
    author: '— Amara L., Berlin',
  },
  {
    en: '"My birth chart reading opened a whole new dimension of self-understanding. Incredibly thorough and compassionate."',
    fr: '"La lecture de mon thème astral a ouvert une toute nouvelle dimension de connaissance de moi-même. Incroyablement approfondie et bienveillante."',
    author: '— Isabelle F., Montréal',
  },
  {
    en: '"IDALA feels like a trusted family. Every practitioner is professional and the community is genuinely supportive."',
    fr: '"IDALA ressemble à une famille de confiance. Chaque praticien est professionnel et la communauté est vraiment bienveillante."',
    author: '— Yuki T., Tokyo',
  },
];

function Home() {
  const { lang }  = useLang();
  const navigate  = useNavigate();
   const refConcept     = useReveal(0);
  const refStrip       = useReveal(100);
  const refPhilosophy  = useReveal(0);
  const refGallery     = useReveal(0);
  const refDiane       = useReveal(0);
  const refCta         = useReveal(0);
  const refTestimonials = useReveal(0);
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
        <title>{lang === 'fr' ? 'The Idala Family | Bien-être' : 'The Idala Family | Wellness'}</title>
        <meta name="description" content={lang === 'fr'
          ? 'Plateforme de bien-être : yoga, reiki, astrologie, méditation. Fondée par Diane Thomas.'
          : 'Wellness platform: yoga, reiki, astrology, meditation. Founded by Diane Thomas.'} />
      </Helmet>

      <div className="page-wrap">

<section className="home-hero">
  <div className="home-hero__inner">
    <div className="home-hero__logo-wrap">
      <img src={trsprlogo} alt="The Idala Family" className="home-hero__logo" />
    </div>
    <p className="home-hero__tagline">
      {lang === 'fr' ? 'Bien-être · Corps · Esprit · Énergie' : 'Wellness · Body · Mind · Energy'}
    </p>
    <h1 className="home-hero__headline">
      {lang === 'fr'
        ? 'Prenez soin de vous'
        : 'Taking care of yourself'}
    </h1>
  </div>
</section>

        {/* ── SECTION 2 — CONCEPT ── */}
        <section className="home-concept reveal" ref={refConcept}>
          <div className="home-concept__inner">
            <div className="home-concept__heading-block">
              <div className="home-concept__heading-title">THE IDALA FAMILY</div>
              <div className="home-concept__heading-sub">CONCEPT</div>
            </div>
            <div className="home-concept__text-col">
              {lang === 'en' ? (
                <>
                   <p className="home-concept__body">The Idala Family is a space dedicated to those who wish to evolve with intention and consistency.</p>
                   <p className="home-concept__body">We bring together practitioners of excellence around a vision of well-being that <strong>unifies body, mind and energy</strong>: strengthening the body, calming the mind and cultivating inner clarity.</p>
                   <p className="home-concept__body">Well-being is not a sum of practices, but a living balance. <strong>Physical strength, emotional stability and clarity</strong> nourish one another when one dimension rises, the whole transforms.</p>
                   <p className="home-concept__body">We converge these dimensions within a structured and demanding approach to modern well-being, designed for those seeking <strong>meaning, alignment and lasting transformation.</strong></p>
                   <div className="home-concept__trust">
                    <span className="home-concept__trust-icon">✦</span>
                    <p>Every practitioner on The Idala Family platform is <strong>rigorously verified and selected</strong> through a thorough and supported vetting process, so you can explore with confidence.</p>
                  </div>
                </>
              ) : (
                <>
                  <p className="home-concept__body">The Idala Family est un espace dédié à celles et ceux qui souhaitent évoluer avec intention et cohérence.</p>
                  <p className="home-concept__body">Nous rassemblons des praticiens d’excellence autour d’une vision du bien‑être qui <strong>unifie corps, mental et énergie</strong>: renforcer le corps, apaiser le mental et cultiver la clarté intérieure.</p>
                  <p className="home-concept__body">Le bien‑être n’est pas une somme de pratiques, mais un équilibre vivant. <strong>Force physique, stabilité émotionnelle et lucidité</strong> se nourrissent mutuellement, quand une dimension s’élève, l’ensemble se transforme.</p>
                  <p className="home-concept__body">Nous faisons converger ces dimensions au sein d’une approche structurée et exigeante du bien‑être moderne pensée pour celles et ceux qui recherchent <strong>sens, alignement et transformation durable.</strong></p>                 
                  <div className="home-concept__trust">
                    <span className="home-concept__trust-icon">✦</span>
                    <p>Chaque praticien de la plateforme The Idala Family est <strong>rigoureusement vérifié et sélectionné</strong> via un processus d'évaluation soutenu et exigeant, pour que vous puissiez explorer en toute confiance.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── FRISE PRATICIENS ── */}
        <section className="home-practitioners-strip reveal" ref={refStrip}>
          <div className="home-practitioners-strip__track">
            {[...Array(2)].map((_, pass) => (
              <div key={pass} className="home-practitioners-strip__row">
                <img src={gogong} alt="Qi Gong" onClick={() => navigate('/practices/qi-gong')} style={{ cursor: 'pointer' }} />
                <img src={ladyyoga} alt="Yoga" onClick={() => navigate('/practices/yoga')} style={{ cursor: 'pointer' }} />
                <img src={taichilady} alt="Tai Chi" onClick={() => navigate('/practices/tai-chi')} style={{ cursor: 'pointer' }} />
                <img src={acu} alt="Acupuncture" onClick={() => navigate('/practices/acupuncture')} style={{ cursor: 'pointer' }} />
                <img src={gobowl} alt="Sound Healing" onClick={() => navigate('/practices/sound-healing')} style={{ cursor: 'pointer' }} />
                <img src={breathwork} alt="Breathwork" onClick={() => navigate('/practices/breathwork')} style={{ cursor: 'pointer' }} />
                <img src={facemedit} alt="Meditation" onClick={() => navigate('/practices/meditation')} style={{ cursor: 'pointer' }} />
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 3 — BODY & MIND PHILOSOPHY ── */}
        <section className="home-philosophy reveal" ref={refPhilosophy}>
          <div className="home-philosophy__inner">

            {/* Titre centré en haut */}
            <div className="home-concept__heading-block">
              <div className="home-concept__heading-title">BODY & MIND</div>
              <div className="home-concept__heading-sub">{lang === 'fr' ? 'PHILOSOPHIE' : 'PHILOSOPHY'}</div>
            </div>

            {/* Texte */}
            <div className="home-philosophy__text-col">
              {lang === 'en' ? (
                <>
                  <p className="home-concept__body">At the core of IDALA lies a simple truth: the body and the mind cannot be separated.</p>
                  <p className="home-concept__body">A stronger body creates a clearer, more stable mind. A regulated mind allows the body to perform, adapt and recover at its highest level. True well-being is built through this alignment.</p>
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

            {/* Citation */}
            <div className="home-philosophy__quote">
              <span className="home-philosophy__quote-mark">"</span>
              <p className="home-philosophy__quote-text">Mens sana in corpore sano</p>
              <span className="home-philosophy__quote-mark">"</span>
            </div>

          </div>
        </section>

        {/* ── SECTION 4 — GALERIE ── */}
          <section className="home-gallery reveal" ref={refGallery}>
            <div className="home-gallery__grid">
              <div className="home-gallery__item home-gallery__item--tall" onClick={() => navigate('/practices/reiki')} style={{ cursor: 'pointer' }}>
                <img src={sointbt} alt="Healing" />
                <span className="home-gallery__caption">{lang === 'fr' ? 'Soin énergetique' : 'Energetic alignment'}</span>
              </div>
              <div className="home-gallery__item" onClick={() => navigate('/practices/reiki')} style={{ cursor: 'pointer' }}>
                <img src={marine_reiki} alt="Reiki" />
                <span className="home-gallery__caption">Reiki</span>
              </div>
              <div className="home-gallery__item" onClick={() => navigate('/practices/yoga')} style={{ cursor: 'pointer' }}>
                <img src={updownyoga} alt="Yoga" />
                <span className="home-gallery__caption">Yoga</span>
              </div>
              <div className="home-gallery__item home-gallery__item--wide" onClick={() => navigate('/practices/meditation')} style={{ cursor: 'pointer' }}>
                <img src={meditation} alt="meditation" />
                <span className="home-gallery__caption">Meditation</span>
              </div>
            </div>
          </section>

        {/* ── SECTION 5 — DIANE ── */}
        <section className="home-diane reveal" ref={refDiane}>
          <div className="home-diane__inner">
            <div className="home-diane__text">
              <span className="eyebrow">{lang === 'fr' ? 'La Fondatrice' : 'The Founder'}</span>
              <h2 className="home-diane__name">Diane Thomas</h2>
              <div className="divider" />
              <p className="home-diane__body">
                {lang === 'fr'
                  ? "Professeure de Yoga & Maître Reiki, Diane a fondé The Idala Family pour créer un espace où le corps et l'esprit se renforcent ensemble, au sein d'une communauté de confiance."
                  : 'Yoga Teacher & Reiki Master, Diane founded The Idala Family to create a space where body and mind strengthen together, within a trusted community.'}
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

        {/* ── SECTION 6 — GALLERY 2 ── */}
        <section className="home-gallery-2">
          <div className="home-gallery-2__row">
            <div className="home-gallery-2__item" onClick={() => navigate('/practices/sound-healing')} style={{ cursor: 'pointer' }}>
              <img src={groupsound} alt="Sound Healing" />
              <span className="home-gallery__caption">Sound Healing</span>
            </div>
            <div className="home-gallery-2__item" onClick={() => navigate('/practices/yoga')} style={{ cursor: 'pointer' }}>
              <img src={groupyoga} alt="Yoga" />
              <span className="home-gallery__caption">Yoga</span>
            </div>
            <div className="home-gallery-2__item" onClick={() => navigate('/practices/meditation')} style={{ cursor: 'pointer' }}>
              <img src={groupmedit} alt="Meditation" />
              <span className="home-gallery__caption">Meditation</span>
            </div>
          </div>
        </section>

        {/* ── SECTION 6BIS — CTA ── */}
        <section className="home-cta reveal" ref={refCta}>
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
            <button className="btn btn--outline home-cta__btn" onClick={() => navigate('/retreats')}>
              {lang === 'fr' ? 'Retraites' : 'Retreats'}
            </button>
            <button className="btn btn--outline home-cta__btn" onClick={() => navigate('/corporate')}>
              {lang === 'fr' ? 'Bien-être en entreprise' : 'Corporate Wellbeing'}
            </button>
            {/* <button className="btn btn--outline home-cta__btn" onClick={() => navigate('/spiritual')}>
              {lang === 'fr' ? 'Tarot & Guidance' : 'Reading & Guidance'}
            </button> */}
            <button className="btn btn--outline home-cta__btn" onClick={() => navigate('/astrology')}>
              {lang === 'fr' ? 'Thème Astral' : 'Birth Chart'}
            </button>
          </div>
        </section>

        {/* ── SECTION 7 — TESTIMONIALS ── */}
        <section className="testimonials-wrap reveal" ref={refTestimonials}>
          <div className="testimonials-header">
            <span className="eyebrow">{lang === 'fr' ? 'Témoignages' : 'Testimonials'}</span>
            <h2 className="section-title">{lang === 'fr' ? 'Ce que dit notre communauté' : 'What Our Community Says'}</h2>
          </div>
          <div className="testimonials-track-outer">
            <div className="testimonials-track" ref={trackRef}>
              {all.map((t, i) => (
                <div className="tcard" key={i}>
                  <p className="tcard-text">{lang === 'fr' ? t.fr : t.en}</p>
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
