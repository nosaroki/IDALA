// ─────────────────────────────────────────
//  SPIRITUAL
// ─────────────────────────────────────────

import { useLang } from '../components/LangContext';
import { Helmet } from 'react-helmet-async';
import Footer from '../components/Footer';


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
    <>
    <Helmet>
      <title>{lang === 'fr' ? 'Guidance Spirituelle — Tarot & Oracle | The Idala Family' : 'Spiritual Guidance — Tarot & Oracle | The Idala Family'}</title>
      <meta name="description" content={lang === 'fr'
        ? 'Réservez une séance de lecture tarot ou oracle avec Diane Thomas. Lectures ciblées, générales ou approfondies pour apporter clarté, direction et alignement énergétique.'
        : 'Book a tarot or oracle reading session with Diane Thomas. Focus, general or in-depth readings to bring clarity, direction and energetic alignment.'} />
    </Helmet>
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
    </>
  );
}

export default Spiritual;