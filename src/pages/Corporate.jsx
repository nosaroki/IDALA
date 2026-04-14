import { useContext } from 'react'
import { Helmet } from 'react-helmet-async'
import { LangCtx } from '../components/LangContext'
import Footer from '../components/Footer'

const PROGRAMMES = [
  {
    titleFr: 'Yoga au bureau',
    titleEn: 'Yoga at work',
    descFr: 'Pour relâcher les tensions et améliorer la posture.',
    descEn: 'To release physical and mental tension.',
  },
  {
    titleFr: 'Méditation & pleine conscience',
    titleEn: 'Meditation & mindfulness',
    descFr: 'Pour développer la concentration et le calme intérieur.',
    descEn: 'To build focus and inner calm.',
  },
  {
    titleFr: 'Breathwork',
    titleEn: 'Breathwork & conscious breathing',
    descFr: 'Pour mieux gérer le stress au quotidien.',
    descEn: 'To regulate stress and energy.',
  },
  {
    titleFr: 'Coaching en neurosciences appliquées',
    titleEn: 'Neuroscience-based coaching',
    descFr: 'Pour transformer les schémas automatiques et renforcer le mental.',
    descEn: 'To shift automatic mental patterns and develop a more agile mindset.',
  },
  {
    titleFr: 'Connaissance de soi & des talents',
    titleEn: 'Self-awareness workshops',
    descFr: 'Pour mieux se comprendre et adapter ses modes de fonctionnement.',
    descEn: 'To better understand one\'s own functioning and adopt more aligned habits.',
  },
]

export default function Corporate() {
  const { lang } = useContext(LangCtx)

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? 'Bien-être en entreprise — The Idala Family' : 'Corporate Wellbeing — The Idala Family'}</title>
        <meta name="description" content={lang === 'fr'
          ? 'Programmes de bien-être et neurosciences pour vos équipes. The Idala Family.'
          : 'Wellbeing and neuroscience programmes for your teams. The Idala Family.'} />
      </Helmet>

      <div className="page-wrap">

        {/* Hero */}
        <section className="corporate-hero">
          <p className="corporate-hero__eyebrow">
            {lang === 'fr' ? 'Pour votre entreprise' : 'For your company'}
          </p>
          <h1 className="corporate-hero__title">
            {lang === 'fr'
              ? 'Bien-être & Neurosciences en entreprise'
              : 'Wellbeing & Neuroscience at work'}
          </h1>
          <p className="corporate-hero__catch">
            {lang === 'fr'
              ? 'Là où la forme mentale alimente la performance.'
              : 'Where mental fitness fuels performance.'}
          </p>
        </section>

        {/* Intro */}
        <section className="corporate-intro">
          <div className="corporate-intro__inner">
            {lang === 'fr' ? (
              <>
                <p>Nous renforçons la santé mentale et la performance de vos équipes grâce à une approche fondée sur les neurosciences, centrée sur la gestion du stress, la clarté mentale et la qualité de présence au travail.</p>
                <p>Nos interventions s'appuient sur des pratiques concrètes qui entraînent l'attention, la régulation émotionnelle, la confiance et la collaboration, au service d'une performance durable.</p>
                <p>Nous construisons des programmes sur mesure, en combinant notamment :</p>
              </>
            ) : (
              <>
                <p>We help your teams strengthen their mental fitness: less reactive stress, more clarity, perspective, and constructive energy in their daily work.</p>
                <p>Our approach is grounded in neuroscience and practical experiences to train the "muscles" that sustain sustainable performance: attention, emotional regulation, confidence, and collaboration.</p>
                <p>Together, we design a tailored journey by combining options such as:</p>
              </>
            )}
          </div>
        </section>

        {/* Programmes */}
        <section className="corporate-programmes">
          <div className="corporate-programmes__list">
            {PROGRAMMES.map((p, i) => (
              <div key={i} className="corporate-programme">
                <div className="corporate-programme__number">0{i + 1}</div>
                <div className="corporate-programme__content">
                  <h3>{lang === 'fr' ? p.titleFr : p.titleEn}</h3>
                  <p>{lang === 'fr' ? p.descFr : p.descEn}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="corporate-cta">
          <p className="corporate-cta__text">
            {lang === 'fr'
              ? <>Écrivez-nous pour co-construire le dispositif <br />le plus adapté à votre culture, vos équipes et vos objectifs.</>
              : <>Write to us to co-create the most relevant experience for your teams.</>
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