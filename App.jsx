// ============================================================
//  THE IDALA FAMILY — App.jsx
//  Single-file React app. ALL CSS lives in styles.css.
//
//  Setup:
//    npm create vite@latest idala -- --template react
//    cd idala
//    npm install react-router-dom
//    npm run dev
//
//  Replace src/App.jsx with this file.
//  Replace src/index.css with styles.css (or import it here).
// ============================================================

import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './styles.css';

// ─── Language Context ───────────────────
const LangCtx = createContext();
const useLang = () => useContext(LangCtx);

// ─────────────────────────────────────────
//  LOADER  (lotus + 7 orbiting chakra dots)
// ─────────────────────────────────────────
function Loader({ onDone }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setReady(true), 800);
    const t2 = setTimeout(() => onDone(), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  const RADIUS = 68;
  const COLORS = ['var(--c1)','var(--c2)','var(--c3)','var(--c4)','var(--c5)','var(--c6)','var(--c7)'];

  return (
    <>
      <div className={`loader-orbit${ready ? ' ready' : ''}`}>
        <div className="loader-ring" />
        {COLORS.map((color, i) => {
          const angle = (i / COLORS.length) * 360 - 90;
          const rad   = angle * (Math.PI / 180);
          const cx    = 80 + RADIUS * Math.cos(rad);
          const cy    = 80 + RADIUS * Math.sin(rad);
          return (
            <span
              key={i}
              className="loader-dot"
              style={{ background: color, left: cx, top: cy }}
            />
          );
        })}

        {/* Lotus SVG */}
        <svg className="loader-lotus" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="50" cy="38" rx="8"  ry="18" fill="var(--c6)" opacity=".75" />
          <ellipse cx="50" cy="38" rx="8"  ry="18" fill="var(--c5)" opacity=".65" transform="rotate(-30 50 58)" />
          <ellipse cx="50" cy="38" rx="8"  ry="18" fill="var(--c7)" opacity=".65" transform="rotate(30 50 58)" />
          <ellipse cx="50" cy="38" rx="6"  ry="16" fill="var(--c4)" opacity=".55" transform="rotate(-55 50 60)" />
          <ellipse cx="50" cy="38" rx="6"  ry="16" fill="var(--c2)" opacity=".55" transform="rotate(55 50 60)" />
          <ellipse cx="50" cy="38" rx="5"  ry="14" fill="var(--c4)" opacity=".38" transform="rotate(-80 50 62)" />
          <ellipse cx="50" cy="38" rx="5"  ry="14" fill="var(--c4)" opacity=".38" transform="rotate(80 50 62)" />
          <circle cx="50" cy="56" r="8" fill="var(--gold)" opacity=".88" />
          <circle cx="50" cy="56" r="4" fill="white"      opacity=".92" />
          <line x1="20" y1="68" x2="80" y2="68" stroke="var(--gold-light)" strokeWidth="1" opacity=".5" />
          <line x1="50" y1="68" x2="50" y2="80" stroke="var(--c4)"         strokeWidth="2" opacity=".45" />
        </svg>
      </div>
      <div className="loader-label">THE IDALA FAMILY</div>
    </>
  );
}

// ─────────────────────────────────────────
//  TOP BAR
// ─────────────────────────────────────────
const NAV = [
  { path: '/',              en: 'Home',               fr: 'Accueil'              },
  { path: '/practitioners', en: 'Practitioners',      fr: 'Praticiens'           },
  { path: '/spiritual',     en: 'Spiritual Guidance', fr: 'Guidance Spirituelle' },
  { path: '/astrology',     en: 'Birth Chart',        fr: 'Thème Astral'         },
  { path: '/about',         en: 'About',              fr: 'À propos'             },
];

function TopBar() {
  const { lang, setLang } = useLang();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);

  const go = (path) => { navigate(path); setOpen(false); };

  return (
    <>
      <header className="topbar">
        <div className="topbar__brand">THE IDALA FAMILY</div>
        <nav className="topbar__nav">
          {NAV.map(item => (
            <button key={item.path}
              className={`topbar__nav-link${location.pathname === item.path ? ' active' : ''}`}
              onClick={() => go(item.path)}>
              {lang === 'fr' ? item.fr : item.en}
            </button>
          ))}
          <div className="lang-toggle">
            <button className={`lang-btn${lang==='en'?' active':''}`} onClick={()=>setLang('en')}>EN</button>
            <button className={`lang-btn${lang==='fr'?' active':''}`} onClick={()=>setLang('fr')}>FR</button>
          </div>
        </nav>
        <button className={`hamburger${open?' open':''}`} onClick={()=>setOpen(o=>!o)} aria-label="Menu">
          <span className="hamburger__line"/><span className="hamburger__line"/><span className="hamburger__line"/>
        </button>
      </header>

      {open && (
        <nav className="mobile-drawer">
          {NAV.map(item => (
            <button key={item.path}
              className={`mobile-drawer__link${location.pathname===item.path?' active':''}`}
              onClick={()=>go(item.path)}>
              {lang==='fr'?item.fr:item.en}
            </button>
          ))}
          <div className="mobile-drawer__lang">
            <button className={`lang-btn${lang==='en'?' active':''}`} onClick={()=>setLang('en')}>EN</button>
            <button className={`lang-btn${lang==='fr'?' active':''}`} onClick={()=>setLang('fr')}>FR</button>
          </div>
        </nav>
      )}
    </>
  );
}

function Footer() {
  const { lang } = useLang();
  return (
    <footer className="site-footer">
      <div className="footer-brand">THE IDALA FAMILY — The Mindful Links</div>
      <div className="footer-copy">
        {lang==='fr' ? '© 2025 Diane Thomas. Tous droits réservés.' : '© 2025 Diane Thomas. All rights reserved.'}
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────
//  HOME
// ─────────────────────────────────────────
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
    <div className="page-wrap">
      <section className="hero">
        <div className="hero-photos">
          <div className="photo-blob pb1">Yoga</div>
          <div className="photo-blob pb2">Nature</div>
          <div className="photo-blob pb3">Reiki</div>
          <div className="photo-blob pb4">Bien-être</div>
        </div>

        <div className="hero-center">
          <div className="circle-logo circle-logo--main">
            <span className="logo-word">IDALA</span>
            <span className="logo-sub">Family</span>
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
          <div className="diane-circle">Photo</div>
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
  );
}

// ─────────────────────────────────────────
//  PRACTITIONERS
// ─────────────────────────────────────────
const PRACTS = [
  { icon:'🧘', title:'Yoga',                   chakra:'c1', en:'A movement-based practice that strengthens the body, improves flexibility, and supports mental clarity through breath and mindful awareness.', fr:'Une pratique corporelle qui renforce le corps, améliore la flexibilité et soutient la clarté mentale par la respiration et la pleine conscience.' },
  { icon:'🤲', title:'Massage Therapy',         chakra:'c2', en:'Hands-on therapeutic techniques designed to relieve muscle tension, improve circulation, and promote physical recovery.', fr:'Techniques thérapeutiques manuelles conçues pour soulager les tensions musculaires, améliorer la circulation et favoriser la récupération physique.' },
  { icon:'✦',  title:'Acupuncture',             chakra:'c3', en:'An ancient system focused on restoring balance in the body through targeted stimulation of energy pathways.', fr:"Un système ancestral visant à restaurer l'équilibre du corps par la stimulation ciblée des voies énergétiques." },
  { icon:'🌬', title:'Breathwork',              chakra:'c4', en:'Structured breathing techniques that regulate the nervous system, reduce stress, and enhance emotional resilience.', fr:'Techniques respiratoires structurées qui régulent le système nerveux, réduisent le stress et renforcent la résilience émotionnelle.' },
  { icon:'🧠', title:'Meditation',              chakra:'c5', en:'Mental training practices that improve focus, increase self-awareness, and cultivate inner stability.', fr:"Pratiques d'entraînement mental qui améliorent la concentration, augmentent la conscience de soi et cultivent la stabilité intérieure." },
  { icon:'🌱', title:'Transformative Coaching', chakra:'c6', en:'Guided personal development sessions that support clarity, mindset growth, and intentional life direction.', fr:'Séances guidées de développement personnel soutenant la clarté, la croissance mentale et une direction de vie intentionnelle.' },
  { icon:'🌸', title:'Reiki',                   chakra:'c7', en:'A gentle energy-based practice that promotes relaxation, emotional balance, and overall well-being.', fr:"Une pratique énergétique douce qui favorise la relaxation, l'équilibre émotionnel et le bien-être général." },
  { icon:'🔮', title:'Psychic Session',         chakra:'c2', en:"A psychic session is a guided intuitive consultation designed to provide insight, clarity, and perspective on your life situation.\n\nDuring the session, the practitioner uses intuitive perception to explore themes related to relationships, career, personal direction, or emotional dynamics. The goal is to help you better understand underlying patterns, gain guidance, and move forward with greater confidence.", fr:"Une séance psychique est une consultation intuitive guidée conçue pour apporter insight, clarté et perspective sur votre situation de vie.\n\nDurant la séance, le praticien utilise la perception intuitive pour explorer des thèmes liés aux relations, la carrière, la direction personnelle ou les dynamiques émotionnelles. L'objectif est de vous aider à mieux comprendre les schémas sous-jacents, à obtenir des conseils et à avancer avec plus de confiance." },
];
const CHAKRA_DOTS = [{color:'var(--c1)',name:'Root'},{color:'var(--c2)',name:'Sacral'},{color:'var(--c3)',name:'Solar'},{color:'var(--c4)',name:'Heart'},{color:'var(--c5)',name:'Throat'},{color:'var(--c6)',name:'Third Eye'},{color:'var(--c7)',name:'Crown'}];

function Practitioners() {
  const { lang } = useLang();
  return (
    <div className="page-wrap">
      <div className="chakra-bar">
        {CHAKRA_DOTS.map(d=><div key={d.name} className="chakra-dot" style={{background:d.color}} data-name={d.name}/>)}
      </div>
      <div className="page-hero">
        <span className="eyebrow">{lang==='fr'?'Bien-être Holistique':'Holistic Wellness'}</span>
        <h1 className="section-title">{lang==='fr'?'Trouvez le Praticien qui vous convient':'Find the Right Practitioner for You'}</h1>
        <div className="divider divider--center"/>
        <p className="body-text" style={{maxWidth:620,margin:'0 auto',textAlign:'center'}}>
          {lang==='fr'
            ?"The Idala Family vous connecte avec des professionnels holistiques certifiés et de confiance, dédiés à soutenir votre bien-être physique et mental. Chaque praticien est soigneusement sélectionné pour garantir professionnalisme, qualité et intégrité. Explorez par catégorie et trouvez l'approche qui correspond à vos besoins."
            :"The Idala Family connects you with trusted, certified holistic professionals dedicated to supporting your physical and mental well-being. Each practitioner is carefully selected to ensure professionalism, quality, and integrity. Explore by category and find the approach that aligns with your needs."}
        </p>
      </div>
      <div className="practitioners-grid">
        {PRACTS.map(p=>(
          <div key={p.title} className={`pcard pcard--${p.chakra}`}>
            <div className="pcard__icon">{p.icon}</div>
            <div className="pcard__title">{p.title}</div>
            <p className="pcard__text">{lang==='fr'?p.fr:p.en}</p>
            <button className={`btn btn--chakra btn--${p.chakra}`}>{lang==='fr'?'Réserver une Séance':'Book a Session'}</button>
          </div>
        ))}
      </div>
      <Footer/>
    </div>
  );
}

// ─────────────────────────────────────────
//  SPIRITUAL
// ─────────────────────────────────────────
const PRICING = [
  { duration:'20', chakra:'c6', btnCls:'btn--p1', amount:45,
    en:{title:'Focus Reading',    desc:'Ideal for one specific question.\nClear, direct guidance on a precise topic (relationship, career, decision, situation).'},
    fr:{title:'Lecture Ciblée',   desc:'Idéal pour une question précise.\nGuidance claire et directe sur un sujet précis (relation, carrière, décision, situation).'}},
  { duration:'30', chakra:'c7', btnCls:'btn--p2', amount:65,
    en:{title:'General Reading',  desc:'A broader overview of your current energy and circumstances.\nPerfect for gaining perspective and short-term direction.'},
    fr:{title:'Lecture Générale', desc:"Un aperçu plus large de votre énergie actuelle et de vos circonstances.\nParfait pour gagner en perspective et trouver une direction à court terme."}},
  { duration:'60', chakra:'c5', btnCls:'btn--p3', amount:120,
    en:{title:'In-Depth Reading',   desc:'A complete general reading covering multiple areas of your life.\nIncludes deeper insights, pattern analysis, and forward guidance.'},
    fr:{title:'Lecture Approfondie',desc:"Une lecture générale complète couvrant plusieurs domaines de votre vie.\nInclut des insights approfondis, une analyse des patterns et une guidance vers l'avenir."}},
];

function Spiritual() {
  const { lang } = useLang();
  const sym = lang==='fr'?'€':'$';
  return (
    <div className="page-wrap">
      <div className="spiritual-hero">
        <div className="sub-logo">🔮</div>
        <div className="sub-logo-label">IDALA Tarot &amp; Oracle</div>
        <span className="eyebrow">{lang==='fr'?'Guidance Intuitive':'Intuitive Guidance'}</span>
        <h1 className="section-title">Spiritual Guidance</h1>
      </div>
      <div className="guidance-intro">
        <span className="eyebrow" style={{textAlign:'center'}}>Tarot &amp; Oracle Sessions</span>
        <p className="body-text">
          {lang==='fr'
            ?"Les lectures de tarot et d'oracle apportent insight, direction et alignement énergétique.\nChaque séance est conçue pour apporter clarté, perspective et compréhension approfondie de votre chemin passé, présent et futur.\nCes lectures soutiennent la prise de décision, révèlent les dynamiques sous-jacentes et vous aident à avancer avec confiance."
            :"Tarot and oracle readings provide insight, direction, and energetic alignment.\nEach session is designed to bring clarity, perspective, and deeper understanding of your past, current and future path.\nThese readings support decision-making, reveal underlying dynamics, and help you move forward with confidence."}
        </p>
      </div>
      <div className="pricing-grid">
        {PRICING.map(p=>{
          const copy = lang==='fr'?p.fr:p.en;
          return (
            <div key={p.duration} className={`pricing-card pricing-card--${p.chakra}`}>
              <div className="pricing-duration">{p.duration} Minutes</div>
              <div className="pricing-title">{copy.title}</div>
              <div className="pricing-amount"><sup>{sym}</sup><span>{p.amount}</span></div>
              <div className="divider divider--center" style={{margin:'18px auto 22px'}}/>
              <p className="pricing-desc">{copy.desc}</p>
              <button className={`btn btn--pricing ${p.btnCls}`}>{lang==='fr'?'Réserver':'Book Now'}</button>
            </div>
          );
        })}
      </div>
      <Footer/>
    </div>
  );
}

// ─────────────────────────────────────────
//  ASTROLOGY — real astronomical engine
// ─────────────────────────────────────────
const D2R=Math.PI/180, R2D=180/Math.PI;
const mod360=x=>((x%360)+360)%360;
const toJD=(y,m,d,h=12)=>{let Y=y,M=m;if(M<=2){Y--;M+=12;}const A=Math.floor(Y/100),B=2-A+Math.floor(A/4);return Math.floor(365.25*(Y+4716))+Math.floor(30.6001*(M+1))+d+h/24+B-1524.5;};
const sunLon=jd=>{const n=jd-2451545,L=mod360(280.460+0.9856474*n),g=mod360(357.528+0.9856003*n)*D2R;return mod360(L+1.915*Math.sin(g)+0.020*Math.sin(2*g));};
const moonLon=jd=>{const T=(jd-2451545)/36525,Lp=mod360(218.3164477+481267.88123421*T),D=mod360(297.8501921+445267.1114034*T),M=mod360(357.5291092+35999.0502909*T),Mp=mod360(134.9633964+477198.8675055*T),F=mod360(93.2720950+483202.0175233*T);return mod360(Lp+6.288774*Math.sin(Mp*D2R)+1.274027*Math.sin((2*D-Mp)*D2R)+0.658314*Math.sin(2*D*D2R)+0.213618*Math.sin(2*Mp*D2R)-0.185116*Math.sin(M*D2R)-0.114332*Math.sin(2*F*D2R)+0.058793*Math.sin((2*D-2*Mp)*D2R)+0.057066*Math.sin((2*D-M-Mp)*D2R)+0.053322*Math.sin((2*D+Mp)*D2R)+0.045758*Math.sin((2*D-M)*D2R)-0.040923*Math.sin((M-Mp)*D2R)-0.034720*Math.sin(D*D2R)-0.030383*Math.sin((M+Mp)*D2R));};
const PP={Mercury:[252.250324,4.092338427],Venus:[181.979801,1.602130476],Mars:[355.433275,0.524071084],Jupiter:[34.351519,0.083086762],Saturn:[50.077444,0.033459928]};
const pLon=(name,jd)=>{const d=jd-2451545,[L0,r]=PP[name];return mod360(L0+r*d);};
const calcAsc=(jd,lat,lon)=>{const T=(jd-2451545)/36525,GMST=mod360(280.46061837+360.98564736629*(jd-2451545)+0.000387933*T*T),LST=mod360(GMST+lon),eps=(23.439292-0.013004*T)*D2R,lstR=LST*D2R,latR=lat*D2R,y=-Math.cos(lstR),x=Math.sin(lstR)*Math.cos(eps)+Math.tan(latR)*Math.sin(eps);let asc=Math.atan2(y,x)*R2D;if(Math.sin(lstR)<0)asc+=180;else if(Math.cos(lstR)<0)asc+=180;return mod360(asc);};
const geocode=async place=>{try{const r=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`,{headers:{'Accept-Language':'en'}});const d=await r.json();if(d.length)return{lat:+d[0].lat,lon:+d[0].lon,display:d[0].display_name.split(',').slice(0,2).join(',')};} catch(e){}return null;};
const S_EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const S_FR=['Bélier','Taureau','Gémeaux','Cancer','Lion','Vierge','Balance','Scorpion','Sagittaire','Capricorne','Verseau','Poissons'];
const S_GL=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const signFrom=lon=>{const i=Math.floor(mod360(lon)/30),deg=Math.floor(mod360(lon)%30),min=Math.floor((mod360(lon)%1)*60);return{en:S_EN[i],fr:S_FR[i],g:S_GL[i],deg:`${deg}° ${min}'`};};

const BENEFITS=[
  {en:'Self-Awareness',      fr:'Connaissance de Soi',        chakra:'c3',de:'Gain clearer insight into your personality, motivations, and natural tendencies.',df:"Obtenez une vision plus claire de votre personnalité, de vos motivations et de vos tendances naturelles."},
  {en:'Emotional Insight',   fr:'Perspicacité Émotionnelle',  chakra:'c4',de:'Understand how you process emotions and respond to stress and relationships.',df:'Comprenez comment vous traitez les émotions et répondez au stress et aux relations.'},
  {en:'Relationship Clarity',fr:'Clarté Relationnelle',       chakra:'c5',de:'Identify compatibility patterns and communication dynamics.',df:'Identifiez les schémas de compatibilité et les dynamiques de communication.'},
  {en:'Direction & Strengths',fr:'Direction & Forces',        chakra:'c6',de:'Recognize your talents, ambitions, and areas for growth.',df:'Reconnaissez vos talents, vos ambitions et vos domaines de croissance.'},
  {en:'Life Perspective',    fr:'Perspective de Vie',         chakra:'c7',de:'Understand recurring themes and cycles shaping your personal evolution.',df:'Comprenez les thèmes récurrents et les cycles qui façonnent votre évolution personnelle.'},
];

function Astrology() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [dob,setDob]=useState(''); const [tob,setTob]=useState(''); const [pob,setPob]=useState('');
  const [result,setResult]=useState(null); const [loading,setLoading]=useState(false); const [err,setErr]=useState(false);

  const calc = async () => {
    setErr(false); setResult(null);
    if (!dob){setErr(true);return;}
    const [y,m,d]=dob.split('-').map(Number);
    let h=12; if(tob){const[hh,mm]=tob.split(':').map(Number);h=hh+mm/60;}
    const jd=toJD(y,m,d,h);
    const sun=signFrom(sunLon(jd)),moon=signFrom(moonLon(jd));
    const planets=[{lEN:'Mercury',lFR:'Mercure',s:signFrom(pLon('Mercury',jd))},{lEN:'Venus',lFR:'Vénus',s:signFrom(pLon('Venus',jd))},{lEN:'Mars',lFR:'Mars',s:signFrom(pLon('Mars',jd))},{lEN:'Jupiter',lFR:'Jupiter',s:signFrom(pLon('Jupiter',jd))},{lEN:'Saturn',lFR:'Saturne',s:signFrom(pLon('Saturn',jd))}];
    let asc=null,coord='';
    if(tob&&pob){setLoading(true);const geo=await geocode(pob);setLoading(false);if(geo){asc=signFrom(calcAsc(jd,geo.lat,geo.lon));coord=`${geo.display} · ${Math.abs(geo.lat).toFixed(2)}°${geo.lat>=0?'N':'S'} ${Math.abs(geo.lon).toFixed(2)}°${geo.lon>=0?'E':'W'}`;}}
    const MEN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],MFR=['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    setResult({sun,moon,asc,coord,planets,tob,name:lang==='fr'?`Thème Natal — ${MFR[m-1]} ${d}, ${y}`:`Birth Chart — ${MEN[m-1]} ${d}, ${y}`});
  };

  const S = ({s}) => <>{s.g} {lang==='fr'?s.fr:s.en}</>;

  return (
    <div className="page-wrap">
      <div className="astro-hero">
        <div>
          <span className="eyebrow">{lang==='fr'?'Thème Natal & Connaissance de Soi':'Birth Chart & Self-Understanding'}</span>
          <h1 className="section-title">Astrology</h1>
          <div className="divider"/>
          {lang==='en'?(
            <><p className="body-text" style={{marginBottom:12}}>Astrology is a system of self-understanding based on the position of the planets at the exact moment of your birth. Using your date, time, and place of birth, a personalized birth chart is calculated. This chart reflects your personality traits, emotional patterns, strengths, challenges, and life themes.</p>
            <p className="body-text" style={{marginBottom:12}}>Astrology offers a structured framework to better understand how you think, feel, relate, and evolve.</p>
            <p className="body-text">Astrology supports conscious growth by helping you navigate life with greater clarity and alignment.</p></>
          ):(
            <><p className="body-text" style={{marginBottom:12}}>L'astrologie est un système de connaissance de soi basé sur la position des planètes au moment exact de votre naissance. À partir de votre date, heure et lieu de naissance, un thème natal personnalisé est calculé. Ce thème reflète vos traits de personnalité, vos schémas émotionnels, vos forces, vos défis et vos thèmes de vie.</p>
            <p className="body-text" style={{marginBottom:12}}>L'astrologie offre un cadre structuré pour mieux comprendre comment vous pensez, ressentez, vous reliez et évoluez.</p>
            <p className="body-text">L'astrologie soutient la croissance consciente en vous aidant à naviguer dans la vie avec plus de clarté et d'alignement.</p></>
          )}
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
          <div className="astro-orb">✦</div>
        </div>
      </div>

      <div className="benefits-section">
        <div className="benefits-header">
          <span className="eyebrow">{lang==='fr'?'Bénéfices':'Benefits'}</span>
          <h2 className="section-title">{lang==='fr'?"Ce que l'Astrologie Révèle":'What Astrology Reveals'}</h2>
        </div>
        <div className="benefits-grid">
          {BENEFITS.map(b=>(
            <div key={b.en} className={`benefit-card benefit-card--${b.chakra}`}>
              <div className="benefit-title">{lang==='fr'?b.fr:b.en}</div>
              <p className="body-text">{lang==='fr'?b.df:b.de}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="calculator-section">
        <div className="calc-inner">
          <div className="calc-header">
            <span className="eyebrow">{lang==='fr'?'Découvrez votre Thème':'Discover Your Chart'}</span>
            <h2 className="section-title">{lang==='fr'?'Calculateur de Thème Natal':'Birth Chart Calculator'}</h2>
            <div className="divider divider--center"/>
          </div>
          <div className="calc-form">
            <div className="form-group"><label>{lang==='fr'?'Date de Naissance':'Date of Birth'}</label><input type="date" value={dob} onChange={e=>setDob(e.target.value)}/></div>
            <div className="form-group"><label>{lang==='fr'?'Heure de Naissance':'Time of Birth'}</label><input type="time" value={tob} onChange={e=>setTob(e.target.value)}/></div>
            <div className="form-group"><label>{lang==='fr'?'Lieu de Naissance':'Place of Birth'}</label><input type="text" value={pob} onChange={e=>setPob(e.target.value)} placeholder="e.g. Paris, France"/></div>
          </div>
          <p className="calc-note">{lang==='fr'?"Pour un Ascendant précis, veuillez indiquer votre heure et ville de naissance. Sans heure, l'Ascendant ne peut pas être déterminé.":'For an accurate Rising Sign, please enter your birth time and city. Without a birth time, Rising Sign cannot be determined.'}</p>
          <div className="calc-cta">
            <button className="btn btn--gold" onClick={calc} disabled={loading}>{loading?'…':(lang==='fr'?'Calculer mon Thème':'Calculate My Chart')}</button>
          </div>
          {err && <p className="error-msg">{lang==='fr'?'Veuillez entrer votre date de naissance pour continuer.':'Please enter your date of birth to continue.'}</p>}
          {result && (
            <div className="chart-result">
              <div className="result-header">
                <div className="result-circle">✦</div>
                <div><div className="result-name">{result.name}</div><div className="result-coords">{result.coord||(result.tob?`${result.tob} UT`:'')}</div></div>
              </div>
              <div className="result-grid">
                <div className="result-item result-item--highlight"><div className="result-label">{lang==='fr'?'Signe Solaire':'Sun Sign'}</div><div className="result-value"><S s={result.sun}/></div><div className="result-degree">{result.sun.deg}</div></div>
                {result.asc
                  ? <div className="result-item result-item--highlight"><div className="result-label">{lang==='fr'?'Ascendant':'Rising Sign'}</div><div className="result-value"><S s={result.asc}/></div><div className="result-degree">{result.asc.deg}</div></div>
                  : <div className="result-item"><div className="result-label">{lang==='fr'?'Ascendant':'Rising Sign'}</div><div className="result-value" style={{fontSize:12,color:'var(--text-light)'}}>{lang==='fr'?'Heure & lieu requis':'Time & place required'}</div></div>}
                <div className="result-item result-item--highlight"><div className="result-label">{lang==='fr'?'Signe Lunaire':'Moon Sign'}</div><div className="result-value"><S s={result.moon}/></div><div className="result-degree">{result.moon.deg}</div></div>
                {result.planets.map(p=>(
                  <div key={p.lEN} className="result-item"><div className="result-label">{lang==='fr'?p.lFR:p.lEN}</div><div className="result-value"><S s={p.s}/></div><div className="result-degree">{p.s.deg}</div></div>
                ))}
              </div>
              <div className="result-disclaimer">{lang==='fr'?"Il s'agit d'une lecture indicative basée sur des calculs astronomiques. Pour une interprétation complète et personnalisée, réservez une séance d'astrologie avec Diane.":'This is an indicative reading based on astronomical calculations. For a complete, personalised interpretation, book a full astrology session with Diane.'}</div>
              <div style={{textAlign:'center',marginTop:22}}><button className="btn btn--outline" onClick={()=>navigate('/spiritual')}>{lang==='fr'?'Réserver une Séance avec Diane':'Book a Session with Diane'}</button></div>
            </div>
          )}
        </div>
      </div>
      <Footer/>
    </div>
  );
}

// ─────────────────────────────────────────
//  ABOUT
// ─────────────────────────────────────────
function About() {
  const { lang } = useLang();
  const navigate = useNavigate();
  return (
    <div className="page-wrap">
      <div className="about-hero">
        <div className="about-photo-col">
          <div className="diane-portrait">Photo</div>
          <div className="about-name">Diane Thomas</div>
          <div className="about-role">{lang==='fr'?'Fondatrice de The Idala Family\nConnue sous le nom de The Mindful Links':'Founder of The Idala Family\nKnown as The Mindful Links'}</div>
        </div>
        <div className="about-text-col">
          <span className="eyebrow">{lang==='fr'?'À propos':'About'}</span>
          {lang==='en'?(
            <>
              <p>Diane Thomas is dedicated to supporting physical and mental well-being through structured, integrative practices that strengthen both body and mind.</p>
              <p>She is a Certified Hatha &amp; Vinyasa Yoga Teacher, Certified Reiki Practitioner, and Tarot Reader. She has led multiple Nervous System Reset Retreats in Costa Rica, guiding individuals through transformative experiences designed to regulate the nervous system, restore balance, and build resilience.</p>
              <p>With a professional background in neuroscience, Diane bridges science and holistic practice, bringing clarity, structure, and depth to modern wellness.</p>
              <p>Through yoga, energy work, and tarot guidance, she supports individuals in cultivating alignment, self-awareness, and sustainable growth.</p>
              <p>Guided by the philosophy <em>mens sana in corpore sano</em> "a healthy mind in a healthy body" she founded The Idala Family to create meaningful connections between holistic professionals and individuals seeking balance, clarity, and conscious evolution.</p>
              <p>Her mission is simple: strengthen the body, clarify the mind, and support long-term well-being.</p>
            </>
          ):(
            <>
              <p>Diane Thomas se consacre au soutien du bien-être physique et mental à travers des pratiques structurées et intégratives qui renforcent à la fois le corps et l'esprit.</p>
              <p>Elle est Professeure de Yoga Hatha &amp; Vinyasa certifiée, Praticienne Reiki certifiée et Tarologue. Elle a animé plusieurs Retraites de Reset du Système Nerveux au Costa Rica, guidant des individus à travers des expériences transformatrices conçues pour réguler le système nerveux, restaurer l'équilibre et développer la résilience.</p>
              <p>Avec une formation professionnelle en neurosciences, Diane fait le pont entre science et pratique holistique, apportant clarté, structure et profondeur au bien-être moderne.</p>
              <p>Par le yoga, le travail énergétique et la guidance tarot, elle aide les individus à cultiver l'alignement, la conscience de soi et une croissance durable.</p>
              <p>Guidée par la philosophie <em>mens sana in corpore sano</em> « un esprit sain dans un corps sain », elle a fondé The Idala Family pour créer des connexions significatives entre professionnels holistiques et individus en quête d'équilibre, de clarté et d'évolution consciente.</p>
              <p>Sa mission est simple : renforcer le corps, clarifier l'esprit et soutenir le bien-être à long terme.</p>
            </>
          )}
        </div>
      </div>

      <div className="idala-section">
        <div className="idala-section-header">
          <span className="eyebrow">{lang==='fr'?'Le Nom Derrière la Vision':'The Name Behind the Vision'}</span>
          <h2 className="section-title">{lang==='fr'?'Pourquoi IDALA ?':'Why IDALA?'}</h2>
        </div>
        <div className="idala-grid">
          <div className="idala-card">
            <div className="idala-card-label">Ida</div>
            {lang==='en'?(<><p>The name IDALA is inspired by <strong>Ida and Pingala</strong> — the two primary energy channels in yogic philosophy that represent balance within the human system.</p><p><strong>Ida</strong> is associated with the feminine principle: intuition, calm, receptivity, and inner awareness.</p></>):(<><p>Le nom IDALA s'inspire d'<strong>Ida et Pingala</strong> — les deux principaux canaux énergétiques de la philosophie yogique qui représentent l'équilibre au sein du système humain.</p><p><strong>Ida</strong> est associé au principe féminin : intuition, calme, réceptivité et conscience intérieure.</p></>)}
          </div>
          <div className="idala-card">
            <div className="idala-card-label">Pingala</div>
            {lang==='en'?(<><p><strong>Pingala</strong> represents the masculine principle: action, strength, structure, and outward expression.</p><p>Together, they symbolize <strong>harmony between opposites</strong> — softness and strength, intuition and logic, rest and movement. When these two forces are balanced, the body and mind function in alignment.</p></>):(<><p><strong>Pingala</strong> représente le principe masculin : action, force, structure et expression extérieure.</p><p>Ensemble, ils symbolisent <strong>l'harmonie entre les opposés</strong> — douceur et force, intuition et logique, repos et mouvement. Quand ces deux forces sont équilibrées, le corps et l'esprit fonctionnent en alignement.</p></>)}
          </div>
          <div className="idala-card idala-card--full">
            <div className="idala-card-label">{lang==='fr'?'Équilibre & Communauté':'Balance & Community'}</div>
            {lang==='en'?(<><p>IDALA reflects this integration. It represents equilibrium between physical discipline and inner awareness, science and spirituality, structure and flow.</p><p>The word <strong>"Family"</strong> embodies the deeper vision: a connected community built on trust, shared values, and collective growth. It is a space where professionals and individuals come together — not just for services, but for support, collaboration, and evolution.</p><p><strong>IDALA is balance in motion — strengthened by community.</strong></p></>):(<><p>IDALA reflète cette intégration. Il représente l'équilibre entre discipline physique et conscience intérieure, science et spiritualité, structure et fluidité.</p><p>Le mot <strong>« Family »</strong> incarne la vision profonde : une communauté connectée construite sur la confiance, des valeurs partagées et une croissance collective. C'est un espace où professionnels et individus se réunissent — non seulement pour des services, mais pour le soutien, la collaboration et l'évolution.</p><p><strong>IDALA est l'équilibre en mouvement — renforcé par la communauté.</strong></p></>)}
          </div>
        </div>
      </div>

      <div className="closing-quote">
        <blockquote>{lang==='fr'?'« IDALA est l\'équilibre en mouvement — renforcé par la communauté. »':'"IDALA is balance in motion — strengthened by community."'}</blockquote>
        <div className="divider divider--center" style={{marginTop:28}}/>
        <div style={{marginTop:20}}><button className="btn btn--gold" onClick={()=>navigate('/practitioners')}>{lang==='fr'?'Explorer la Communauté':'Explore the Community'}</button></div>
      </div>
      <Footer/>
    </div>
  );
}

// ─────────────────────────────────────────
//  COMING SOON
// ─────────────────────────────────────────
function ComingSoon() {
  const { lang, setLang } = useLang();
  const navigate = useNavigate();
  const [email,setEmail]=useState('');
  const [sent,setSent]=useState(false);

  return (
    <div className="coming-soon">
      <div className="coming-soon__logo">
        <div className="circle-logo circle-logo--main" style={{position:'relative'}}>
          <div className="coming-soon__ring"/>
          <div className="coming-soon__ring-2"/>
          <span className="logo-word">IDALA</span>
          <span className="logo-sub">Family</span>
        </div>
      </div>

      <span className="eyebrow coming-soon__eyebrow">THE IDALA FAMILY</span>
      <h1 className="coming-soon__title">{lang==='fr'?'Bientôt disponible':'Coming Soon'}</h1>
      <div className="divider divider--center coming-soon__divider"/>
      <p className="coming-soon__subtitle">
        {lang==='fr'
          ?"Nous construisons quelque chose de beau.\nUne plateforme de bien-être holistique conçue pour connecter, aligner et élever.\nRejoignez notre liste pour être les premiers informés."
          :"We are building something beautiful.\nA holistic wellness platform designed to connect, align, and elevate.\nJoin our list to be the first to know."}
      </p>

      <div className="coming-soon__chakra-row">
        {['c1','c2','c3','c4','c5','c6','c7'].map(c=>(
          <div key={c} className="coming-soon__dot" style={{background:`var(--${c})`}}/>
        ))}
      </div>

      {!sent ? (
        <div className="coming-soon__notify">
          <input className="coming-soon__input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder={lang==='fr'?'Votre adresse e-mail':'Your email address'}/>
          <button className="btn btn--gold" onClick={()=>{if(email)setSent(true);}}>{lang==='fr'?"M'avertir":'Notify Me'}</button>
        </div>
      ):(
        <p style={{fontSize:13,color:'var(--gold)',letterSpacing:2,marginBottom:20}}>{lang==='fr'?'✓ Merci, nous vous contacterons bientôt.':'✓ Thank you, we will be in touch soon.'}</p>
      )}

      <button className="btn btn--outline btn--sm" onClick={()=>navigate('/')} style={{marginTop:16}}>
        {lang==='fr'?'Aperçu du site →':'Preview site →'}
      </button>

      <div className="coming-soon__lang-row">
        <button className={`lang-btn${lang==='en'?' active':''}`} onClick={()=>setLang('en')}>EN</button>
        <button className={`lang-btn${lang==='fr'?' active':''}`} onClick={()=>setLang('fr')}>FR</button>
      </div>

      <div className="coming-soon__credit">© 2025 The Idala Family — The Mindful Links</div>
    </div>
  );
}

// ─────────────────────────────────────────
//  ROOT APP
// ─────────────────────────────────────────
export default function App() {
  const [lang, setLangState] = useState(()=>localStorage.getItem('idala-lang')||'en');
  const [showLoader, setShowLoader] = useState(true);
  const [fading,    setFading]     = useState(false);

  const setLang = l => { setLangState(l); localStorage.setItem('idala-lang', l); };
  const handleDone = () => { setFading(true); setTimeout(()=>setShowLoader(false), 650); };

  return (
    <LangCtx.Provider value={{lang, setLang}}>
      <BrowserRouter>
        {/* Loader overlay */}
        {showLoader && (
          <div className={`loader${fading?' fade-out':''}`}>
            <Loader onDone={handleDone}/>
          </div>
        )}

        <Routes>
          <Route path="/coming-soon" element={<ComingSoon/>}/>
          <Route path="/" element={<><TopBar/><Home/></>}/>
          <Route path="/practitioners" element={<><TopBar/><Practitioners/></>}/>
          <Route path="/spiritual" element={<><TopBar/><Spiritual/></>}/>
          <Route path="/astrology" element={<><TopBar/><Astrology/></>}/>
          <Route path="/about" element={<><TopBar/><About/></>}/>
        </Routes>
      </BrowserRouter>
    </LangCtx.Provider>
  );
}
