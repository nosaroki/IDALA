// ─────────────────────────────────────────
//  HOME 
// ─────────────────────────────────────────

import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../components/LangContext';
import { Helmet } from 'react-helmet-async';
import { useReveal } from '../hooks/useReveal';
import Footer from '../components/Footer';
import newlogo from '../assets/newlogo.webp';
import dianeRegard    from '../assets/dianeregard.webp';
import groupsound     from '../assets/groupsound.webp';
import groupyoga       from '../assets/groupyoga.webp';
import groupmedit      from '../assets/groupmedit.webp';
import meditation from '../assets/meditation.webp';
import sointbt from '../assets/sointbt.webp';
import marine_reiki from '../assets/practitioners/marine_reiki.webp';
import gobowl from '../assets/practitioners/gobowl.webp';
import taichilady from '../assets/practitioners/taichilady.webp';
import gogong from '../assets/practitioners/gogong.webp';
import ladyyoga from '../assets/practitioners/ladyyoga.webp';
import breathwork from '../assets/practitioners/breathwrk.webp';
import facemedit from '../assets/practitioners/meditt.webp';
import yogabeige from '../assets/yogabeige.webp'
import OptimizedImage from "../components/OptimizedImage"

// const TESTIMONIALS = [
//   {
//     fr: '"J\'ai fait une première séance de tarot avec Diane. Elle m\'a tout de suite mise en confiance et bien expliqué le fonctionnement, car c\'était la première fois de ma vie que je me faisais tirer les cartes. Ce fut une super expérience, très intéressante et surtout très vraie. C\'est assez impressionnant ! Je recommande à 100%."',
//     en: '"I had my first tarot session with Diane. She immediately put me at ease and explained everything clearly, as it was the very first time in my life I had a card reading. It was a great experience, very interesting and above all very true. Quite impressive! I recommend it 100%."',
//     author: 'B. C.',
//   },
//   {
//     fr: '"Cours de yoga au top chez The Idala Family ! J\'ai réservé pour la première fois et j\'ai adoré. Plutôt débutant, j\'ai été agréablement surpris par la façon dont Diane a su s\'adapter à mon niveau tout en me mettant à l\'aise dès le début. Une belle découverte, je recommande sans hésiter et je reviendrai !"',
//     en: '"Top yoga class at The Idala Family! I booked for the first time and loved it. As a beginner, I was pleasantly surprised by how Diane adapted to my level while putting me at ease from the start. A lovely discovery, I recommend it without hesitation and I\'ll be back!"',
//     author: 'Alexis R.',
//   },
//   {
//     fr: '"Une très belle découverte ! Les cours de yoga sont de grande qualité, dans une ambiance à la fois bienveillante et apaisante. On se sent tout de suite à l\'aise, quel que soit son niveau. Les séances sont parfaitement guidées et permettent de se reconnecter à soi tout en relâchant les tensions. Je recommande vivement The Idala Family à toutes les personnes qui recherchent un accompagnement de qualité et une atmosphère chaleureuse."',
//     en: '"A truly lovely discovery! The yoga classes are top quality, in an atmosphere that is both caring and soothing. You feel at ease right away, whatever your level. The sessions are perfectly guided and let you reconnect with yourself while releasing tension. I highly recommend The Idala Family to anyone looking for quality support and a warm atmosphere."',
//     author: 'Elvira N.',
//   },
//   {
//     fr: '"C\'était la première fois que j\'utilisais cette plateforme pour réserver une séance de yoga et j\'ai vécu une belle expérience. La professeure était excellente : professionnelle, compétente et inspirante. Je réserverai sans hésiter une autre séance, car la plateforme propose un large choix de praticiens intéressants. Je recommande vivement !"',
//     en: '"It was my first time using this platform to book a yoga session, and I had a great experience. The teacher was excellent: professional, knowledgeable and inspiring. I\'ll definitely book another session, as the platform offers a wide variety of interesting practitioners to choose from. Highly recommended!"',
//     author: 'Gaia B.',
//   },
//   {
//     fr: '"Très satisfaite. Diane est pédagogue, à l\'écoute et de très bon conseil. Ravie de pouvoir découvrir le yoga sous ce spectre. Je reviendrai avec plaisir !"',
//     en: '"Very satisfied. Diane is a great teacher, attentive and full of good advice. Delighted to discover yoga from this angle. I\'ll gladly come back!"',
//     author: 'Luna',
//   },
//   {
//     fr: '"Super cours de yoga, vrai savoir-faire. L\'instructrice a pris le temps de montrer les postures et de nous corriger, indispensable pour progresser ! Merci."',
//     en: '"Great yoga class, real expertise, and the instructor took the time to show the postures and correct us, essential to progress! Thank you."',
//     author: 'Lea C.',
//   },
//   {
//     fr: '"J\'ai participé à une séance de méditation guidée avec Dani et j\'ai adoré l\'expérience. Sa voix est apaisante, ses guidances sont douces et accessibles, on se laisse porter très facilement. Cette séance m\'a permis de me recentrer, de relâcher le stress et de retrouver un vrai sentiment de calme intérieur. Un magnifique moment de reconnexion à soi que je referai avec grand plaisir. Merci Dani !"',
//     en: '"I took part in a guided meditation session with Dani and loved the experience. Her voice is soothing, her guidance gentle and accessible, and you let yourself be carried very easily. This session helped me recenter, release stress and find a real sense of inner calm. A beautiful moment of reconnection with myself that I\'ll happily do again. Thank you Dani!"',
//     author: 'Jean-Pierre T.',
//   },
//   {
//     fr: '"Une très belle découverte ! J\'ai réalisé des séances de breathwork, d\'hypnose et de Reiki à distance, ainsi qu\'un massage thérapeutique à domicile avec la formidable Gabrielle. Chaque séance m\'a apporté un réel mieux-être et un accompagnement adapté à mes besoins. Les praticiens sont bienveillants, professionnels et à l\'écoute. Je recommande The Idala Family à 100% pour toutes les personnes qui souhaitent prendre soin d\'elles avec un accompagnement de qualité."',
//     en: '"A truly lovely discovery! I did breathwork, hypnosis and distance Reiki sessions, plus a therapeutic massage at home with the wonderful Gabrielle. Each session brought me real well-being and support tailored to my needs. The practitioners are caring, professional and attentive. I recommend The Idala Family 100% to anyone who wants to take care of themselves with quality support."',
//     author: 'Oscar M.',
//   },
//   {
//     fr: '"J\'ai toujours été très sceptique vis-à-vis de ce type d\'accompagnement, je n\'y croyais pas vraiment avant de franchir la porte d\'Idala Family. Finalement, j\'ai été agréablement surprise. L\'équipe est bienveillante, à l\'écoute et prend vraiment le temps de comprendre vos besoins, sans jamais rien imposer. On se sent tout de suite en confiance et le cadre est très apaisant. Je suis ressortie détendue, reboostée et avec une vraie sensation de bien-être. Une très belle découverte que je recommande, même aux plus sceptiques comme moi !"',
//     en: '"I\'ve always been very skeptical about this kind of support, I didn\'t really believe in it before walking through Idala Family\'s door. In the end, I was pleasantly surprised. The team is caring, attentive and really takes the time to understand your needs, without ever imposing anything. You feel at ease right away and the setting is very soothing. I left relaxed, re-energized and with a real sense of well-being. A truly lovely discovery that I recommend, even to the most skeptical like me!"',
//     author: 'Elsa B.',
//   },
//   {
//     fr: '"Une magnifique découverte ! Diane est une praticienne d\'une grande bienveillance, à l\'écoute et très professionnelle. On se sent immédiatement en confiance. Sa séance m\'a permis de me détendre profondément et de repartir apaisée, avec une vraie sensation de bien-être. Je recommande les yeux fermés à toute personne qui souhaite prendre un moment pour soi. Merci encore pour cette belle expérience !"',
//     en: '"A magnificent discovery! Diane is a deeply caring, attentive and very professional practitioner. You feel at ease immediately. Her session let me relax deeply and leave soothed, with a real sense of well-being. I recommend her with my eyes closed to anyone who wants to take a moment for themselves. Thank you again for this beautiful experience!"',
//     author: 'Solenne de M.',
//   },
//   {
//     fr: '"J\'ai participé à une séance avec The Idala Family et j\'ai passé un super moment. L\'ambiance est bienveillante, on se sent tout de suite à l\'aise et accompagné. Le cours de yoga était à la fois apaisant et ressourçant, avec beaucoup de professionnalisme et de douceur. On repart détendu, reboosté et avec une vraie sensation de bien-être. Une très belle expérience que je recommande sans hésiter !"',
//     en: '"I took part in a session with The Idala Family and had a wonderful time. The atmosphere is caring, you feel at ease and supported right away. The yoga class was both soothing and restorative, with a lot of professionalism and gentleness. You leave relaxed, re-energized and with a real sense of well-being. A truly beautiful experience that I recommend without hesitation!"',
//     author: 'Laurence S.',
//   },
//   {
//     fr: '"Praticienne au top. Cela m\'a beaucoup aidé, émotionnellement et physiquement."',
//     en: '"Top practitioner. It helped me a great deal, emotionally and physically."',
//     author: 'Rayane K.',
//   },
//   {
//     fr: '"J\'ai pris des cours de yoga avec Idala Family et je recommande vivement. Tarot, yoga, recette de cuisine sur mesure. Je recommande !"',
//     en: '"I took yoga classes with Idala Family and highly recommend it. Tarot, yoga, tailor-made cooking recipes. I recommend!"',
//     author: 'Joy S.',
//   },
//   {
//     fr: '"Premier cours d\'initiation au yoga à domicile, professeure très à l\'écoute, elle s\'est adaptée à mon niveau. On retrouve tout ce qu\'on cherche : tarot, yoga. Je me suis sentie écoutée et surtout en paix, cette séance m\'a fait beaucoup de bien. Je recommande vivement."',
//     en: '"First introductory yoga class at home, a very attentive teacher who adapted to my level. You find everything you\'re looking for: tarot, yoga. I felt listened to and above all at peace, this session did me a lot of good. I highly recommend it."',
//     author: 'Yasmine K.',
//   },
// 
// ];

const TESTIMONIALS = [
  {
    fr: '"J\'ai fait une première séance de tarot avec Diane. Elle m\'a tout de suite mise en confiance et bien expliqué le fonctionnement, car c\'était la première fois de ma vie que je me faisais tirer les cartes. Ce fut une super expérience, très intéressante et surtout très vraie. C\'est assez impressionnant ! Je recommande à 100%."',
    en: '"I had my first tarot session with Diane. She immediately put me at ease and explained everything clearly, as it was the very first time in my life I had a card reading. It was a great experience, very interesting and above all very true. Quite impressive! I recommend it 100%."',
    author: 'B. C.',
  },
  {
    fr: '"Cours de yoga au top chez The Idala Family ! J\'ai réservé pour la première fois et j\'ai adoré. Plutôt débutant, j\'ai été agréablement surpris par la façon dont Diane a su s\'adapter à mon niveau tout en me mettant à l\'aise dès le début. Une belle découverte, je recommande sans hésiter et je reviendrai !"',
    en: '"Top yoga class at The Idala Family! I booked for the first time and loved it. As a beginner, I was pleasantly surprised by how Diane adapted to my level while putting me at ease from the start. A lovely discovery, I recommend it without hesitation and I\'ll be back!"',
    author: 'Alexis R.',
  },
  {
    fr: '"Une très belle découverte ! Les cours de yoga sont de grande qualité, dans une ambiance à la fois bienveillante et apaisante. On se sent tout de suite à l\'aise, quel que soit son niveau. Les séances sont parfaitement guidées et permettent de se reconnecter à soi tout en relâchant les tensions. Je recommande vivement The Idala Family à toutes les personnes qui recherchent un accompagnement de qualité et une atmosphère chaleureuse."',
    en: '"A truly lovely discovery! The yoga classes are top quality, in an atmosphere that is both caring and soothing. You feel at ease right away, whatever your level. The sessions are perfectly guided and let you reconnect with yourself while releasing tension. I highly recommend The Idala Family to anyone looking for quality support and a warm atmosphere."',
    author: 'Elvira N.',
  },
    {
    fr: '"J\'ai vécu une séance de Reiki à distance incroyable avec Sylvie, une expérience vraiment hors du commun. Je me suis sentie soutenue, détendue et profondément connectée tout au long de la séance. Ce qui rend Idala Family si spécial, c\'est cette chaleur et cette bienveillance sincères : on se sent vraiment faire partie de la famille. Je recommande Idala Family à toute personne en quête d\'une expérience de soin authentique et attentionnée. Merci, Sylvie !"',
    en: '"I had an amazing distance Reiki session with Sylvie, and the experience was truly incredible. I felt supported, relaxed and deeply connected throughout the session. What makes Idala Family so special is the genuine warmth and kindness: they really make you feel like part of the family. I highly recommend Idala Family to anyone looking for an authentic and caring healing experience. Thank you, Sylvie!"',
    author: 'Madison F.',
  },
  {
    fr: '"C\'était la première fois que j\'utilisais cette plateforme pour réserver une séance de yoga et j\'ai vécu une belle expérience. La professeure était excellente : professionnelle, compétente et inspirante. Je réserverai sans hésiter une autre séance, car la plateforme propose un large choix de praticiens intéressants. Je recommande vivement !"',
    en: '"It was my first time using this platform to book a yoga session, and I had a great experience. The teacher was excellent: professional, knowledgeable and inspiring. I\'ll definitely book another session, as the platform offers a wide variety of interesting practitioners to choose from. Highly recommended!"',
    author: 'Gaia B.',
  },
  {
    fr: '"Très satisfaite. Diane est pédagogue, à l\'écoute et de très bon conseil. Ravie de pouvoir découvrir le yoga sous ce spectre. Je reviendrai avec plaisir !"',
    en: '"Very satisfied. Diane is a great teacher, attentive and full of good advice. Delighted to discover yoga from this angle. I\'ll gladly come back!"',
    author: 'Luna',
  },
  {
    fr: '"Super cours de yoga, vrai savoir-faire. L\'instructrice a pris le temps de montrer les postures et de nous corriger, indispensable pour progresser ! Merci."',
    en: '"Great yoga class, real expertise. The instructor took the time to show the postures and correct us, essential to progress! Thank you."',
    author: 'Lea C.',
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
  const durRef    = useRef(80);
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
            
            <div className="home-hero__content">
              <h1 className="home-hero__headline">
                {lang === 'fr' ? (
                  <>
                    Le bien-être commence par la{' '}
                    <span style={{ color: '#9B6EBF', whiteSpace: 'nowrap' }}>bonne rencontre</span>
                  </>
                ) : (
                  <>
                    Wellness begins with the{' '}
                    <span style={{ color: '#9B6EBF', whiteSpace: 'nowrap' }}>right connection</span>
                  </>
                )}
              </h1>

              <p className="home-hero__subtext">
                {lang === 'fr'
                  ? <>Des praticiens d'excellence sélectionnés pour vous : <span style={{ color: '#9B6EBF' }}>yoga</span>, <span style={{ color: '#9B6EBF' }}>reiki</span>, <span style={{ color: '#9B6EBF' }}>breathwork</span>, <span style={{ color: '#9B6EBF' }}>méditation</span> et bien d'autres disciplines.</>
                  : <>A curated selection of exceptional practitioners specializing in <span style={{ color: '#9B6EBF' }}>yoga</span>, <span style={{ color: '#9B6EBF' }}>reiki</span>, <span style={{ color: '#9B6EBF' }}>breathwork</span>, <span style={{ color: '#9B6EBF' }}>meditation</span> and beyond.</>}
              </p>

              <button 
                className="home-hero__cta"
                onClick={() => navigate('/practitioners')}
                onMouseEnter={(e) => e.target.style.background = '#7d5599'}
                onMouseLeave={(e) => e.target.style.background = '#9B6EBF'}
                style={{
                  background: '#9B6EBF',
                  color: 'white',
                  border: 'none',
                  padding: '14px 32px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'background 0.2s',
                }}
              >
                {lang === 'fr' ? 'Découvrez les praticiens' : 'Discover our practitioners'}
              </button>
            </div>
             <div className="home-hero__left">
              <div className="home-hero__logo-wrap">
                <img src={newlogo} alt="The Idala Family" className="home-hero__logo" />
              </div>
              <p className="home-hero__tagline">
                {lang === 'fr' ? 'Corps · Esprit · Énergie' : 'Body · Mind · Energy'}
              </p>
            </div>
          </div>
        </section>

                {/* ── FRISE PRATICIENS ── */}
        <section className="home-practitioners-strip reveal" ref={refStrip}>
          <div className="home-practitioners-strip__track">
            {[...Array(2)].map((_, pass) => (
              <div key={pass} className="home-practitioners-strip__row">
                <OptimizedImage src={gogong} alt="Qi Gong" onClick={() => navigate('/practices/qi-gong')} style={{ cursor: 'pointer' }} />
                <OptimizedImage src={ladyyoga} alt="Yoga" onClick={() => navigate('/practices/yoga')} style={{ cursor: 'pointer' }} />
                <OptimizedImage src={taichilady} alt="Tai Chi" onClick={() => navigate('/practices/tai-chi')} style={{ cursor: 'pointer' }} />
                <OptimizedImage src={gobowl} alt="Sound Healing" onClick={() => navigate('/practices/sound-healing')} style={{ cursor: 'pointer' }} />
                <OptimizedImage src={breathwork} alt="Breathwork" onClick={() => navigate('/practices/breathwork')} style={{ cursor: 'pointer' }} />
                <OptimizedImage src={facemedit} alt="Meditation" onClick={() => navigate('/practices/meditation')} style={{ cursor: 'pointer' }} />
              </div>
            ))}
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
                   <p className="home-concept__body">The Idala Family is a premium space dedicated to those who wish to evolve with intention and consistency.</p>
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
                  <p className="home-concept__body">The Idala Family est un espace premium dédié à celles et ceux qui souhaitent évoluer avec intention et cohérence.</p>
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
              <div className="home-gallery__item home-gallery__item--tall" onClick={() => navigate('/practices/sound-healing')} style={{ cursor: 'pointer' }}>
                <OptimizedImage src={sointbt} alt="Healing" />
                <span className="home-gallery__caption">{lang === 'fr' ? 'Sound Healing' : 'Sound Healing'}</span>
              </div>
              <div className="home-gallery__item" onClick={() => navigate('/practices/reiki')} style={{ cursor: 'pointer' }}>
                <OptimizedImage src={marine_reiki} alt="Reiki" />
                <span className="home-gallery__caption">Reiki</span>
              </div>
              <div className="home-gallery__item" onClick={() => navigate('/practices/yoga')} style={{ cursor: 'pointer' }}>
                <OptimizedImage src={yogabeige} alt="Yoga" style={{ objectFit: 'cover', objectPosition: 'center 95%' }} />
                <span className="home-gallery__caption">Yoga</span>
              </div>
              <div className="home-gallery__item home-gallery__item--wide" onClick={() => navigate('/practices/meditation')} style={{ cursor: 'pointer' }}>
                <OptimizedImage src={meditation} alt="meditation" />
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
                  ? "Diane a fondé The Idala Family pour créer un espace où le corps et l'esprit se renforcent ensemble, au sein d'une communauté de confiance."
                  : 'Diane founded The Idala Family to create a space where body and mind strengthen together, within a trusted community.'}
              </p>
              <button className="btn btn--outline" onClick={() => navigate('/about')}>
                {lang === 'fr' ? 'En savoir plus' : 'Learn More'}
              </button>
            </div>
            <div className="home-diane__photo-wrap">
              <OptimizedImage src={dianeRegard} alt="Diane Thomas" className="home-diane__photo" />
              <div className="home-diane__photo-ring" />
            </div>
          </div>
        </section>

        {/* ── SECTION 6 — GALLERY 2 ── */}
        <section className="home-gallery-2">
          <div className="home-gallery-2__row">
            <div className="home-gallery-2__item" onClick={() => navigate('/practices/sound-healing')} style={{ cursor: 'pointer' }}>
              <OptimizedImage src={groupsound} alt="Sound Healing" />
              <span className="home-gallery__caption">Sound Healing</span>
            </div>
            <div className="home-gallery-2__item" onClick={() => navigate('/practices/yoga')} style={{ cursor: 'pointer' }}>
              <OptimizedImage src={groupyoga} alt="Yoga" />
              <span className="home-gallery__caption">Yoga</span>
            </div>
            <div className="home-gallery-2__item" onClick={() => navigate('/practices/meditation')} style={{ cursor: 'pointer' }}>
              <OptimizedImage src={groupmedit} alt="Meditation" />
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
            {/* <button className="btn btn--outline home-cta__btn" onClick={() => navigate('/practitioners')}>
              {lang === 'fr' ? 'Trouver un Praticien' : 'Find a Practitioner'}
            </button> */}
            <button className="btn btn--outline home-cta__btn" onClick={() => navigate('/retreats')}>
              {lang === 'fr' ? 'Retraites' : 'Retreats'}
            </button>
            <button className="btn btn--outline home-cta__btn" onClick={() => navigate('/corporate')}>
              {lang === 'fr' ? 'Bien-être en entreprise' : 'Corporate Wellbeing'}
            </button>
            <button className="btn btn--outline home-cta__btn" onClick={() => navigate('/spiritual')}>
              {lang === 'fr' ? 'Guidance' : 'Guidance'}
            </button>
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
