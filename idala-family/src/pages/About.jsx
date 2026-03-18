// ─────────────────────────────────────────
//  ABOUT
// ─────────────────────────────────────────

import { useNavigate } from 'react-router-dom';
import { useLang } from '../components/LangContext'; 
import { Helmet } from 'react-helmet-async';
import Footer from '../components/Footer';
import dianeRegard from '../assets/dianeregard.png';

function About() {
  const { lang } = useLang();
  const navigate = useNavigate();
  return (
    <>
    <Helmet>
      <title>{lang === 'fr' ? 'À propos de Diane Thomas — The Idala Family' : 'About Diane Thomas — The Idala Family'}</title>
      <meta name="description" content={lang === 'fr'
        ? 'Découvrez Diane Thomas, fondatrice de The Idala Family — professeure de yoga certifiée, praticienne reiki et tarologue avec une formation en neurosciences.'
        : 'Meet Diane Thomas, founder of The Idala Family — certified yoga teacher, reiki practitioner and tarot reader with a background in neuroscience.'} />
    </Helmet>
    <div className="page-wrap">
      <div className="about-hero">
        <div className="about-photo-col">
          <div className="diane-portrait">
              <img src={dianeRegard} alt="Diane Thomas" style={{ width: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          </div>
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
    </>
  );
}

export default About;