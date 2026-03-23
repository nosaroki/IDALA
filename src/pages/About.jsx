// ─────────────────────────────────────────
//  ABOUT v2
// ─────────────────────────────────────────

import { useNavigate } from 'react-router-dom';
import { useLang } from '../components/LangContext';
import { Helmet } from 'react-helmet-async';
import Footer from '../components/Footer';
import dianeRegard  from '../assets/dianeregard.png';
import idaPingala   from '../assets/idapingala.png';

function About() {
  const { lang }   = useLang();
  const navigate   = useNavigate();

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? 'À propos de Diane Thomas | The Idala Family' : 'About Diane Thomas | The Idala Family'}</title>
        <meta name="description" content={lang === 'fr'
          ? 'Découvrez Diane Thomas, fondatrice de The Idala Family. Professeure de yoga certifiée, praticienne reiki et tarologue avec une formation en neurosciences.'
          : 'Meet Diane Thomas, founder of The Idala Family. Certified yoga teacher, reiki practitioner and tarot reader with a background in neuroscience.'} />
      </Helmet>

      <div className="page-wrap">

        {/* ── SECTION 1 — HERO FOUNDER ── */}
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

              {lang === 'en' ? (
                <>
                  <p className="about-founder__body">Diane Thomas is dedicated to supporting physical and mental well-being through a structured and integrative approach that strengthens both body and mind.</p>
                  <p className="about-founder__body">She holds a Master's degree in Entrepreneurship and Innovation from the University of Southern California (USC), bringing a strong foundation in building purpose-driven initiatives.</p>
                  <p className="about-founder__body">She has worked in neuroscience-based coaching, applying principles focused on mental fitness, emotional resilience, and the ability to shift from stress-driven patterns to more positive and empowered states of mind.</p>
                  <p className="about-founder__body">Certified in Hatha and Vinyasa Yoga and a Reiki Master, Diane combines scientific understanding with holistic practices. Through yoga and energy work, she supports individuals in creating alignment, self-awareness, and lasting balance.</p>
                  <p className="about-founder__body">Guided by <em>mens sana in corpore sano</em>, she founded The Idala Family, a platform connecting individuals with trusted practitioners in holistic and integrative wellness.</p>
                  <p className="about-founder__body">Her mission is simple: to strengthen the body, clarify the mind, and support long-term well-being.</p>
                </>
              ) : (
                <>
                  <p className="about-founder__body">Diane Thomas se consacre au soutien du bien-être physique et mental à travers une approche structurée et intégrative qui renforce à la fois le corps et l'esprit.</p>
                  <p className="about-founder__body">Elle est titulaire d'un Master en Entrepreneuriat et Innovation de l'Université de Californie du Sud (USC), apportant une solide base dans la construction d'initiatives à vocation.</p>
                  <p className="about-founder__body">Elle a travaillé dans le coaching basé sur les neurosciences, appliquant des principes axés sur la forme mentale, la résilience émotionnelle et la capacité à passer de schémas axés sur le stress vers des états d'esprit plus positifs et responsabilisants.</p>
                  <p className="about-founder__body">Certifiée en Yoga Hatha et Vinyasa et Maître Reiki, Diane combine compréhension scientifique et pratiques holistiques. Par le yoga et le travail énergétique, elle aide les individus à créer alignement, conscience de soi et équilibre durable.</p>
                  <p className="about-founder__body">Guidée par <em>mens sana in corpore sano</em>, elle a fondé The Idala Family, une plateforme connectant les individus avec des praticiens de confiance en bien-être holistique et intégratif.</p>
                  <p className="about-founder__body">Sa mission est simple : renforcer le corps, clarifier l'esprit et soutenir le bien-être à long terme.</p>
                </>
              )}
            </div>

          </div>
        </section>

      {/* ── SECTION 2 — POURQUOI IDALA ── */}
      <section className="about-idala">
        <div className="about-idala__header">
          <span className="eyebrow">{lang === 'fr' ? 'Le Nom Derrière la Vision' : 'The Name Behind the Vision'}</span>
          <h2 className="about-idala__title">{lang === 'fr' ? 'Pourquoi IDALA ?' : 'Why IDALA?'}</h2>
        </div>

        {/* Phrase d'intro — pleine largeur AU DESSUS de la grille */}
        <div className="about-idala__intro">
          {lang === 'en'
            ? <p className="about-idala__body about-idala__body--intro">The name IDALA is inspired by Ida and Pingala : the two primary energy channels in yogic philosophy that represent balance within the human system.</p>
            : <p className="about-idala__body about-idala__body--intro">Le nom IDALA s'inspire d'Ida et Pingala : les deux principaux canaux énergétiques de la philosophie yogique qui représentent l'équilibre au sein du système humain.</p>
          }
        </div>

        {/* Grille 3 colonnes — Ida | Image | Pingala */}
        <div className="about-idala__diagram">

          <div className="about-idala__col about-idala__col--left">
            <div className="about-idala__channel-label">Ida</div>
            <p className="about-idala__body">
              {lang === 'en'
                ? 'Ida is associated with the feminine principle: intuition, calm, receptivity, and inner awareness.'
                : 'Ida est associé au principe féminin : intuition, calme, réceptivité et conscience intérieure.'}
            </p>
          </div>

          <div className="about-idala__image-col">
            <img src={idaPingala} alt="Ida & Pingala — energy channels" className="about-idala__img" />
          </div>

          <div className="about-idala__col about-idala__col--right">
            <div className="about-idala__channel-label">Pingala</div>
            <p className="about-idala__body">
              {lang === 'en'
                ? 'Pingala represents the masculine principle: action, strength, structure, and outward expression.'
                : 'Pingala représente le principe masculin : action, force, structure et expression extérieure.'}
            </p>
          </div>

        </div>

        {/* Phrase "Together" — pleine largeur EN DESSOUS de la grille */}
        <div className="about-idala__together">
          {lang === 'en'
            ? <p className="about-idala__body">Together, they symbolize harmony between opposites : softness and strength, intuition and logic, rest and movement. When these two forces are balanced, the body and mind function in alignment.</p>
            : <p className="about-idala__body">Ensemble, ils symbolisent l'harmonie entre les opposés : douceur et force, intuition et logique, repos et mouvement. Quand ces deux forces sont équilibrées, le corps et l'esprit fonctionnent en alignement.</p>
          }
        </div>

          {/* Encart Équilibre & Communauté */}
          <div className="about-idala__balance">
            <div className="about-idala__balance-label">
              {lang === 'fr' ? 'Équilibre & Communauté' : 'Balance & Community'}
            </div>
            {lang === 'en' ? (
              <>
                <p className="about-idala__balance-body">IDALA reflects this integration. It represents equilibrium between physical discipline and inner awareness, science and spirituality, structure and flow.</p>
                <p className="about-idala__balance-body">The word <strong>"Family"</strong> embodies the deeper vision: a connected community built on trust, shared values, and collective growth. It is a space where professionals and individuals come together — not just for services, but for support, collaboration, and evolution.</p>
                <p className="about-idala__balance-body">IDALA is balance in motion, strengthened by community.</p>
              </>
            ) : (
              <>
                <p className="about-idala__balance-body">IDALA reflète cette intégration. Il représente l'équilibre entre discipline physique et conscience intérieure, science et spiritualité, structure et fluidité.</p>
                <p className="about-idala__balance-body">Le mot <strong>« Family »</strong> incarne la vision profonde : une communauté connectée construite sur la confiance, des valeurs partagées et une croissance collective. C'est un espace où professionnels et individus se réunissent — non seulement pour des services, mais pour le soutien, la collaboration et l'évolution.</p>
                <p className="about-idala__balance-body">IDALA est l'équilibre en mouvement, renforcé par la communauté.</p>
              </>
            )}
          </div>

        </section>

        {/* ── SECTION 3 — CLOSING ── */}
        <section className="about-closing">
          <blockquote className="about-closing__quote">
            {lang === 'fr' ? '« Mens sana in corpore sano »' : '"Mens sana in corpore sano"'}
          </blockquote>
          <div className="divider divider--center" style={{ marginTop: 28 }} />
          <div style={{ marginTop: 24 }}>
            <button className="btn btn--gold" onClick={() => navigate('/practitioners')}>
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