// ─────────────────────────────────────────
//  ABOUT 
// ─────────────────────────────────────────

import { useNavigate } from 'react-router-dom';
import { useLang } from '../components/LangContext';
import { Helmet } from 'react-helmet-async';
import Footer from '../components/Footer';
import dianeRegard from '../assets/dianeregard.png';
import idaPingala  from '../assets/idapingala.png';

function About() {
  const { lang }   = useLang();
  const navigate   = useNavigate();

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? 'À propos de Diane Thomas | The Idala Family' : 'About Diane Thomas | The Idala Family'}</title>
        <meta name="description" content={lang === 'fr'
          ? 'Découvrez Diane Thomas, fondatrice de The Idala Family. Professeure de yoga avec une formation en neurosciences.'
          : 'Meet Diane Thomas, founder of The Idala Family. Yoga teacher with a background in neuroscience.'} />
      </Helmet>

      <div className="page-wrap">

        {/* ── SECTION 1 — FONDATRICE ── */}
        <section className="about-founder">
          <div className="about-founder__inner">

            <div className="about-founder__photo-col">
              <div className="about-founder__photo-wrap">
                <img src={dianeRegard} alt="Diane Thomas" className="about-founder__photo" />
                <div className="about-founder__photo-ring" />
              </div>
              <div className="about-founder__name">Diane Thomas</div>
              <div className="about-founder__role">
                {lang === 'fr' ? 'Fondatrice de The Idala Family' : 'Founder of The Idala Family'}
              </div>
            </div>

            <div className="about-founder__text-col">
              <span className="eyebrow">{lang === 'fr' ? 'La Fondatrice' : 'The Founder'}</span>
              <h1 className="about-founder__title">
                {lang === 'fr' ? 'À propos de Diane' : 'About Diane'}
              </h1>
              <div className="divider" />

              {lang === 'fr' ? (
                <>
                  <p className="about-founder__body">Diane Thomas œuvre pour <strong>l'harmonie du corps et de l'esprit</strong> à travers une approche structurée et intégrative qui allie force physique, stabilité émotionnelle et clarté mentale.</p>
                  <p className="about-founder__body">Son parcours de <strong>coaching en neurosciences</strong> lui a permis de développer une compréhension fine du mental, de la résilience émotionnelle et des mécanismes de transformation durable.</p>
                  <p className="about-founder__body"><br /><strong>En tant que professeure de Yoga</strong> Hatha et Vinyasa, elle tisse un lien entre connaissance scientifique et équilibre intérieur, guidant chacun vers une présence plus consciente et un bien-être profond.</p>
                  <p className="about-founder__body">Diplômée en Entrepreneuriat & Innovation de l'University of Southern California (USC), elle apporte une vision stratégique et pérenne à tout ce qu'elle entreprend, incarnant l'union du sens et de la structure.</p>
                  <p className="about-founder__body">Guidée par la devise <strong>mens sana in corpore sano</strong>, elle crée The Idala Family : un espace de confiance où le corps et l'esprit évoluent ensemble, dans la recherche d'un bien-être durable et éclairé.</p>
                 
                </>
              ) : (
                <>
                  <p className="about-founder__body">Diane Thomas works towards harmony of body and mind through a structured and integrative approach that combines physical strength, emotional stability and mental clarity.</p>
                  <p className="about-founder__body">Her background in neuroscience-based coaching has given her a deep understanding of the mind, emotional resilience and the mechanisms of lasting transformation.</p>
                  <p className="about-founder__body">As a Hatha and Vinyasa Yoga Teacher, she weaves a connection between scientific knowledge and inner balance, guiding each person towards more conscious presence and profound well-being.</p>
                  <p className="about-founder__body">A graduate in Entrepreneurship & Innovation from the University of Southern California (USC), she brings strategic and lasting vision to everything she undertakes, embodying the union of meaning and structure.</p>
                  <p className="about-founder__body">Guided by the motto <em>mens sana in corpore sano</em>, she created The Idala Family : a trusted space where body and mind evolve together in the pursuit of lasting and enlightened well-being.</p>
                </>
              )}
              <p className="about-founder__body" style={{ marginTop: 24 }}>
                <strong>{lang === 'fr' ? 'Sa mission :' : 'Her mission:'}
                {lang === 'fr'
                  ? ' renforcer le corps, clarifier l\'esprit et nourrir un équilibre durable.'
                  : ' strengthen the body, clarify the mind and nurture lasting balance.'}</strong>
              </p>
            </div>

          </div>
        </section>

        {/* ── SECTION 2 — POURQUOI IDALA ── */}
        <section className="about-idala">
          <div className="about-idala__header">
            <span className="eyebrow">{lang === 'fr' ? 'Le Nom Derrière la Vision' : 'The Name Behind the Vision'}</span>
            <h2 className="about-idala__title">{lang === 'fr' ? 'Pourquoi IDALA ?' : 'Why IDALA?'}</h2>
          </div>

          {/* Phrase d'intro pleine largeur */}
          <div className="about-idala__intro">
            {lang === 'fr'
              ? <p className="about-idala__body about-idala__body--intro">Le nom IDALA s'inspire d'Ida et Pingala : les deux principaux canaux énergétiques de la philosophie yogique qui représentent l'équilibre au sein du système humain.</p>
              : <p className="about-idala__body about-idala__body--intro">The name IDALA is inspired by Ida and Pingala, the two primary energy channels in yogic philosophy that represent balance within the human system.</p>
            }
          </div>

          {/* Grille 3 colonnes — Ida | Image | Pingala */}
          <div className="about-idala__diagram">

            <div className="about-idala__col about-idala__col--left">
              <div className="about-idala__channel-label about-idala__channel-label--ida">Ida</div>
              <p className="about-idala__body">
                {lang === 'fr' ? (
                  <>Ida est associé au principe féminin :<br />intuition, calme, réceptivité et profondeur intérieure.</>
                ) : (
                  <>Ida is associated with the feminine principle:<br />intuition, calm, receptivity and inner depth.</>
                )}
              </p>
            </div>

            <div className="about-idala__image-col">
              <img src={idaPingala} alt="Ida & Pingala : energy channels" className="about-idala__img" />
            </div>

            <div className="about-idala__col about-idala__col--right">
              <div className="about-idala__channel-label about-idala__channel-label--pingala">Pingala</div>
              <p className="about-idala__body">
                {lang === 'fr' ? (
                  <>Pingala incarne le principe masculin :<br />action, force, structure et expression vers l'extérieur.</>
                ) : (
                  <>Pingala embodies the masculine principle:<br />action, strength, structure and outward expression.</>
                )}
              </p>
            </div>

          </div>

          {/* Phrase "Together" pleine largeur */}
          <div className="about-idala__together">
            {lang === 'fr'
              ? <p className="about-idala__body">Ensemble, ces deux polarités symbolisent l'harmonie des opposés : douceur et force, intuition et logique, repos et mouvement. Lorsqu'elles sont équilibrées, l'énergie peut circuler dans Sushumna, le canal central et le corps comme l'esprit accèdent à un état d'alignement plus profond.</p>
              : <p className="about-idala__body">Together, these two polarities symbolize the harmony of opposites: softness and strength, intuition and logic, rest and movement. When they are balanced, energy can flow through Sushumna, the central channel and both body and mind access a deeper state of alignment.</p>
            }
          </div>

          {/* Encart Sushumna */}
          {/* <div className="about-idala__sushumna">
            <div className="about-idala__sushumna-inner">
              <div className="about-idala__sushumna-label">Sushumna</div>
              <p className="about-idala__sushumna-text">
                {lang === 'fr'
                  ? 'Le canal central, le lien entre Ida et Pingala. Lorsque les deux énergies s\'équilibrent, Sushumna s\'éveille et ouvre la voie à l\'alignement profond.'
                  : 'The central channel, the link between Ida and Pingala. When both energies find balance, Sushumna awakens and opens the path to deep alignment.'}
              </p>
            </div>
          </div> */}

          {/* Encart Équilibre & Communauté */}
          <div className="about-idala__balance">
            <div className="about-idala__balance-label">
              {lang === 'fr' ? 'Équilibre & Communauté' : 'Balance & Community'}
            </div>
            {lang === 'fr' ? (
              <>
                <p className="about-idala__balance-body">IDALA s'inscrit dans cette dynamique d'intégration. Le nom porte l'idée d'un équilibre vivant entre discipline physique et conscience intérieure, science et spiritualité, structure et fluidité.</p>
                <p className="about-idala__balance-body">Le mot <strong>"Family"</strong> exprime une vision centrale : celle d'une communauté de confiance, fondée sur des valeurs partagées et une croissance collective. IDALA est pensé comme un espace où praticiens et individus se retrouvent non seulement pour un service, mais pour le soutien, l'échange et l'évolution.</p>
                <p className="about-idala__balance-body"><strong>IDALA, c'est l'équilibre en mouvement, porté et renforcé par la force du collectif.</strong></p>
              </>
            ) : (
              <>
                <p className="about-idala__balance-body">IDALA is rooted in this dynamic of integration. The name carries the idea of a living balance between physical discipline and inner awareness, science and spirituality, structure and flow.</p>
                <p className="about-idala__balance-body">The word <strong>"Family"</strong> expresses a central vision: that of a trusted community, built on shared values and collective growth. IDALA is conceived as a space where practitioners and individuals come together not just for a service, but for support, exchange and evolution.</p>
                <p className="about-idala__balance-body"><strong>IDALA is balance in motion, carried and strengthened by the power of the collective.</strong></p>
              </>
            )}
          </div>

        </section>

        {/* ── SECTION 3 — CLOSING ── */}
        <section className="about-closing">
          <blockquote className="about-closing__quote">
            {lang === 'fr' ? '« Mens sana in corpore sano »' : '"Mens sana in corpore sano"'}
          </blockquote>
          <div style={{ marginTop: 24 }}>
            <button className="btn btn--violet-mid" onClick={() => navigate('/practitioners')}>
              {lang === 'fr' ? 'Explorer la Communauté' : 'Explore the Community'}
            </button>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

export default About;