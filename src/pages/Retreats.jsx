import { useContext } from 'react'
import { Helmet } from 'react-helmet-async'
import { LangCtx } from '../components/LangContext'
import bannerRetraite from '../assets/banner/banner_retraite.webp'
import Footer from '../components/Footer'


const Icons = {
  Yoga: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="20" cy="7" r="3"/><path d="M20 10 Q14 18 8 22M20 10 Q26 18 32 22"/><path d="M14 30 Q17 24 20 22 Q23 24 26 30"/><path d="M8 22 Q10 28 14 30M32 22 Q30 28 26 30"/></svg>),
  Breathwork: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 34 Q20 26 20 20"/><path d="M20 20 Q14 16 8 18"/><path d="M20 20 Q26 16 32 18"/><path d="M8 18 Q6 14 9 12 Q12 10 14 13"/><path d="M32 18 Q34 14 31 12 Q28 10 26 13"/><circle cx="20" cy="8" r="4" strokeDasharray="2 2"/></svg>),
  Meditation: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="20" cy="8" r="3"/><path d="M12 22 Q16 18 20 17 Q24 18 28 22"/><path d="M8 26 Q12 22 20 22 Q28 22 32 26"/><path d="M12 22 Q10 26 8 26M28 22 Q30 26 32 26"/><path d="M16 32 Q18 28 20 28 Q22 28 24 32"/></svg>),
  Coaching: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="14" cy="12" r="4"/><circle cx="28" cy="16" r="3"/><path d="M6 32 Q6 24 14 24 Q22 24 22 32"/><path d="M22 28 Q22 22 28 22 Q34 22 34 28"/><path d="M18 16 L24 14"/></svg>),
  Naturopathy: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 34 Q20 20 20 10"/><path d="M20 18 Q14 14 8 16 Q12 22 20 22"/><path d="M20 26 Q26 22 32 24 Q28 30 20 30"/><path d="M20 14 Q24 8 30 8 Q28 16 20 18"/></svg>),
  TaiChi: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="20" cy="20" r="14"/><path d="M20 6 Q28 13 20 20 Q12 27 20 34"/><circle cx="20" cy="13" r="3" fill="currentColor" stroke="none" opacity=".4"/><circle cx="20" cy="27" r="3" fill="none"/></svg>),
}

const CATEGORIES = [
  {
    color: 'var(--c1)',
    icon: Icons.Yoga,
    titleFr: 'Yoga',
    titleEn: 'Yoga',
    descFr: 'Pour le corps, la souplesse, l\'ancrage et l\'équilibre global.',
    descEn: 'For the body, flexibility, grounding and overall balance.',
  },
  {
    color: 'var(--c3)',
    icon: Icons.Meditation,
    titleFr: 'Méditation & pleine conscience',
    titleEn: 'Meditation & mindfulness',
    descFr: 'Pour apaiser le mental, développer la présence et la clarté intérieure.',
    descEn: 'To calm the mind, develop presence and inner clarity.',
  },
  {
    color: 'var(--c5)',
    icon: Icons.Breathwork,
    titleFr: 'Breathwork',
    titleEn: 'Breathwork',
    descFr: 'Travail du souffle pour libérer les tensions, les émotions et relancer l\'énergie.',
    descEn: 'Breathwork to release tension, emotions and restore energy.',
  },
  {
    color: 'var(--c4)',
    icon: Icons.Naturopathy,
    titleFr: 'Détox & bien-être',
    titleEn: 'Detox & wellness',
    descFr: 'Programmes orientés nutrition, repos et revitalisation du corps.',
    descEn: 'Programmes focused on nutrition, rest and body revitalisation.',
  },
  {
    color: 'var(--c7)',
    icon: Icons.Coaching,
    titleFr: 'Développement personnel',
    titleEn: 'Personal development',
    descFr: 'Retraites axées sur la transformation, la connaissance de soi et l\'évolution intérieure.',
    descEn: 'Retreats focused on transformation, self-knowledge and inner evolution.',
  },
  {
    color: 'var(--c2)',
    icon: Icons.TaiChi,
    titleFr: 'Performance & équilibre',
    titleEn: 'Performance & balance',
    descFr: 'Pour améliorer concentration, énergie et alignement dans la vie personnelle et professionnelle.',
    descEn: 'To improve focus, energy and alignment in personal and professional life.',
  },
]

const CHAKRA_COLORS = {
  'var(--c1)': '#FF6B6B',
  'var(--c2)': '#FFB060',
  'var(--c3)': '#FFD600',
  'var(--c4)': '#3DCC70',
  'var(--c5)': '#3AA8E0',
  'var(--c6)': '#7B4FD8',
  'var(--c7)': '#C060E0',
}

export default function Retreats() {
  const { lang } = useContext(LangCtx)

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? 'Retraites — The Idala Family' : 'Retreats — The Idala Family'}</title>
        <meta name="description" content={lang === 'fr'
          ? 'Retraites de yoga, méditation, breathwork et bien-être sélectionnées par The Idala Family.'
          : 'Yoga, meditation, breathwork and wellness retreats selected by The Idala Family.'} />
      </Helmet>

      <div className="page-wrap">

       <section
          className="practice-page__banner"
          style={{ backgroundImage: `url(${bannerRetraite})` }}
        >
          <div className="practice-page__banner-overlay">
            {/* <p className="retreats-hero__eyebrow">
              {lang === 'fr' ? 'Retraites' : 'Retreats'}
            </p> */}
            <h1 className="retreats-hero__title">
              {lang === 'fr' ? 'Trouvez la retraite faite pour vous.' : 'Find the retreat made for you.'}
            </h1>
            <p className="retreats-hero__catch">
              {lang === 'fr'
                ? 'Sortir du quotidien pour mieux y revenir.'
                : 'Step away from the everyday to return to yourself.'}
            </p>
          </div>
        </section>

        {/* Intro texte */}
        <section className="retreats-intro">
          <p className="retreats-hero__intro">
            {lang === 'fr'
              ? <>Nous vous guidons vers des retraites d'exception à travers le monde, <br />conçues comme de véritables expériences immersives, hors du quotidien. <br/>Chaque séjour vous offre un cadre propice au lâcher-prise, <br />à la reconnexion et à un travail en profondeur sur l'équilibre entre le corps et l'esprit.</>
              : <>We guide you towards exceptional retreats around the world, <br/>designed as truly immersive experiences away from the everyday. <br/>Each stay offers a setting conducive to letting go, <br></br>reconnecting and working deeply on the balance between body and mind.</>}
          </p>
          <p className="retreats-hero__intro">
            {lang === 'fr'
              ? <>Retraites de yoga, méditation, breathwork et autres disciplines dédiées au bien-être : <br/>chaque programme est structuré pour accompagner une transformation durable, <br/>dans un environnement inspirant et sécurisé.</>
              : <>Yoga retreats, meditation, breathwork and other wellness disciplines: <br/>each programme is structured to support lasting transformation, in an inspiring and safe environment.</>}
          </p>
          <p className="retreats-hero__intro">
            {lang === 'fr'
              ? <>Nous sélectionnons avec exigence des lieux et des intervenants reconnus, <br/>afin de garantir des expériences authentiques, immersives et de haute qualité.</>
              : <>We rigorously select recognised venues and practitioners to guarantee <br/>authentic, immersive and high-quality experiences.</>}
          </p>
        </section>

        {/* Catégories */}
        <section className="retreats-categories">
          <div className="retreats-grid">
            {CATEGORIES.map((cat, i) => {
              const hexColor = CHAKRA_COLORS[cat.color] || '#9B6EBF'
              return (
                <div
                  key={i}
                  className="retreat-card"
                  style={{ '--retreat-color': hexColor }}
                >
                  <div className="retreat-card__circle">
                    <div className="retreat-card__icon">{cat.icon}</div>
                  </div>
                  <h3 className="retreat-card__title">
                    {lang === 'fr' ? cat.titleFr : cat.titleEn}
                  </h3>
                  <p className="retreat-card__desc">
                    {lang === 'fr' ? cat.descFr : cat.descEn}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* CTA contact */}
        <section className="retreats-cta">
          <p className="retreats-cta__text">
            {lang === 'fr'
              ? <>Une question ?<br />Contactez-nous pour trouver la retraite qui vous correspond.</>
              : <>A question?<br />Contact us to find the retreat that suits you.</>
            }
          </p>
          <a href="mailto:contact@theidalafamily.com" className="btn btn--violet-mid">
            contact@theidalafamily.com
          </a>
        </section>

        <Footer />
      </div>
    </>
  )
}