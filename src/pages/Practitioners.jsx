// ─────────────────────────────────────────
//  PRACTITIONERS
// ─────────────────────────────────────────

import { useLang } from '../components/LangContext'; 
import { Helmet } from 'react-helmet-async';
import Footer from '../components/Footer';

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
    <>
    <Helmet>
      <title>{lang === 'fr' ? 'Praticiens — The Idala Family' : 'Practitioners — The Idala Family'}</title>
      <meta name="description" content={lang === 'fr'
        ? 'Trouvez le praticien holistique qui vous convient — yoga, massage, acupuncture, breathwork, méditation, coaching, reiki et séances psychiques.'
        : 'Find the right holistic practitioner for you — yoga, massage, acupuncture, breathwork, meditation, coaching, reiki and psychic sessions.'} />
    </Helmet>

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
    </>
  );
}

export default Practitioners;