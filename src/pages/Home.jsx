// ─────────────────────────────────────────
//  HOME
// ─────────────────────────────────────────

import { useRef } from 'react';
import { useNavigate,  } from 'react-router-dom';
import { useLang } from '../components/LangContext';
import { Helmet } from 'react-helmet-async';
import Footer from '../components/Footer';  

// import logoIdala      from '../assets/logoidala.png';
import logoIdalaTrspr      from '../assets/logoidalatrspr.png';
import dianeRegard    from '../assets/dianeregard.png';
import yogaPlage      from '../assets/yogaplage.png';
import yogaMeditDiane from '../assets/yogameditdiane.png';
import souplesseRocher from '../assets/souplesserocher.png';
import meditDiane from '../assets/meditationdiane.png';

const TESTIMONIALS = [
  { text: '"Working with an IDALA practitioner completely shifted how I approach my daily routine. My body feels stronger and my mind is finally quiet."', author: '— Sarah M., London' },
  { text: '"The tarot reading gave me exactly the clarity I needed. It felt grounded, professional and deeply insightful."', author: '— Marie-Claire D., Paris' },
  { text: '"I attended one of Diane\'s retreats in Costa Rica and it was life-changing. The nervous system reset was exactly what my body needed."', author: '— Thomas R., New York' },
  { text: '"The yoga sessions through IDALA are unlike any I\'ve tried before. Structured, intentional and beautifully guided."', author: '— Amara L., Berlin' },
  { text: '"My birth chart reading opened a whole new dimension of self-understanding. Incredibly thorough and compassionate."', author: '— Isabelle F., Montréal' },
  { text: '"IDALA feels like a trusted family. Every practitioner is professional and the community is genuinely supportive."', author: '— Yuki T., Tokyo' },
];

function Home() {
  const { lang } = useLang();
  const navigate  = useNavigate();
  const trackRef  = useRef(null);
  const durRef    = useRef(44);
  const all       = [...TESTIMONIALS, ...TESTIMONIALS];

  const adjustSpeed = faster => {
    if (!trackRef.current) return;
    durRef.current = faster ? Math.max(durRef.current*.65, 8) : Math.min(durRef.current*1.4, 120);
    trackRef.current.style.animationDuration = durRef.current + 's';
  };

  const conceptEN = (
    <>
      <p>The Idala Family is a modern digital platform that connects trusted holistic wellness professionals with individuals who want to strengthen their body, sharpen their mind, and grow consciously.</p>
      <p>It is built for people who understand that well-being is not one-dimensional. Physical strength, nervous system balance, and mental clarity work together. When one improves, the others follow.</p>
      <p>IDALA is not an alternative to medicine. It supports a healthy lifestyle by integrating movement, regulation, and personal development into everyday life.</p>
      <div className="divider divider--center"/>
      <p>At the heart of IDALA is a simple and powerful principle:<br/><strong>the body and the mind are deeply connected.</strong></p>
      <p>When the body moves and builds resilience, the mind becomes clearer and more stable.<br/>When the mind is regulated and focused, the body performs, adapts, and recovers more effectively.</p>
      <p>True, sustainable well-being happens when both are strengthened together.</p>
      <p>The IDALA Family exists to make that connection accessible, structured, and supported within a trusted community.</p>
    </>
  );

  const conceptFR = (
    <>
      <p>The Idala Family est une plateforme numérique moderne qui connecte des professionnels du bien-être holistique de confiance avec des personnes souhaitant renforcer leur corps, aiguiser leur esprit et évoluer consciemment.</p>
      <p>Elle est construite pour des personnes qui comprennent que le bien-être n'est pas unidimensionnel. La force physique, l'équilibre du système nerveux et la clarté mentale fonctionnent ensemble. Quand l'un s'améliore, les autres suivent.</p>
      <p>IDALA n'est pas une alternative à la médecine. Elle soutient un mode de vie sain en intégrant mouvement, régulation et développement personnel dans la vie quotidienne.</p>
      <div className="divider divider--center"/>
      <p>Au cœur d'IDALA se trouve un principe simple et puissant :<br/><strong>le corps et l'esprit sont profondément connectés.</strong></p>
      <p>Quand le corps bouge et développe sa résilience, l'esprit devient plus clair et plus stable.<br/>Quand l'esprit est régulé et concentré, le corps performe, s'adapte et récupère plus efficacement.</p>
      <p>Un vrai bien-être durable advient quand les deux sont renforcés ensemble.</p>
      <p>The IDALA Family existe pour rendre cette connexion accessible, structurée et soutenue au sein d'une communauté de confiance.</p>
    </>
  );

  return (
    <><Helmet>
        <title>{lang === 'fr' ? 'The Idala Family — Bien-être Holistique' : 'The Idala Family — Holistic Wellness'}</title>
        <meta name="description" content={lang === 'fr'
          ? 'Plateforme de bien-être holistique — yoga, reiki, astrologie, méditation. Fondée par Diane Thomas.'
          : 'Holistic wellness platform — yoga, reiki, astrology, meditation. Founded by Diane Thomas.'} />
      </Helmet>
    <div className="page-wrap">
      <section className="hero">
        <div className="hero-photos">
          <div className="photo-blob pb1">
            <img src={meditDiane} alt="Yoga" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          </div>
          <div className="photo-blob pb2">
            <img src={yogaMeditDiane} alt="Méditation" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          </div>
          <div className="photo-blob pb3">
            <img src={souplesseRocher} alt="Reiki" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          </div>
          <div className="photo-blob pb4">
            <img src={yogaPlage} alt="Bien-être" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          </div>
        </div>

        <div className="hero-center">
          <div className="circle-logo circle-logo--main">
             {/* <img src={logoIdala} alt="IDALA" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.4)' }} /> */}
            <img src={logoIdalaTrspr} alt="IDALA" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(2)' }} />
          </div>
          <div className="hero-brand">THE IDALA FAMILY</div>
          <div className="concept-label">Concept</div>
          <div className="concept-text">{lang==='fr' ? conceptFR : conceptEN}</div>
          <div className="cta-row">
            <button className="btn btn--gold" onClick={()=>navigate('/practitioners')}>{lang==='fr'?'Trouver un Praticien':'Find a Practitioner'}</button>
            <button className="btn btn--outline" onClick={()=>navigate('/spiritual')}>{lang==='fr'?'Guidance Spirituelle':'Spiritual Guidance'}</button>
            <button className="btn btn--outline" onClick={()=>navigate('/astrology')}>{lang==='fr'?'Thème Astral':'Astrology'}</button>
          </div>
        </div>

        <div className="hero-diane">
            <img src={dianeRegard} alt="Diane Thomas" style={{ width: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          <div>
            <div className="diane-name">Diane Thomas</div>
            <div className="diane-role">The Mindful Links</div>
            <p className="diane-blurb">{lang==='fr'?'Fondatrice de The Idala Family — Professeure de Yoga certifiée, Praticienne Reiki & Tarologue.':'Founder of The Idala Family — Certified Yoga Teacher, Reiki Practitioner & Tarot Reader.'}</p>
            <button className="btn btn--outline btn--sm" onClick={()=>navigate('/about')}>{lang==='fr'?'En savoir plus':'Learn More'}</button>
          </div>
        </div>
      </section>

      <section className="testimonials-wrap">
        <div className="testimonials-header">
          <span className="eyebrow">{lang==='fr'?'Témoignages':'Testimonials'}</span>
          <h2 className="section-title">{lang==='fr'?'Ce que dit notre communauté':'What Our Community Says'}</h2>
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
          <button className="tcard-btn" onClick={()=>adjustSpeed(false)}>←</button>
          <button className="tcard-btn" onClick={()=>adjustSpeed(true)}>→</button>
        </div>
      </section>
      <Footer/>
    </div>
    </>
  );
}

export default Home;