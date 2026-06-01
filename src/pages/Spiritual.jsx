import { useLang } from '../components/LangContext';
import { Helmet } from 'react-helmet-async';
import Footer from '../components/Footer';
import tarotOrb from '../assets/tarot2.webp'
import OptimizedImage from '../components/OptimizedImage'


function Spiritual() {
  const { lang } = useLang();

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? 'Guidance Intuitive | The Idala Family' : 'Intuitive Guidance | The Idala Family'}</title>
        <meta name="description" content={lang === 'fr'
          ? 'Lecture tarot et guidance intuitive avec Diane Thomas. Lectures ciblées 30 min ou complètes 60 min pour clarifier votre situation et avancer avec confiance.'
          : 'Tarot reading and intuitive guidance with Diane Thomas. Focused 30 min or full 60 min readings to clarify your situation and move forward with confidence.'} />
      </Helmet>

      <div className="page-wrap">

        {/* ── Hero ── */}
        <section className="spiritual-hero-v2">
          <div className="spiritual-hero-v2__inner">
            <div className="spiritual-hero-v2__text">
              <span className="eyebrow">
                {lang === 'fr' ? 'Guidance Intuitive' : 'Intuitive Guidance'}
              </span>
              <h1 className="spiritual-hero-v2__title">
                {lang === 'fr' ? 'Guidance' : 'Guidance'}
              </h1>
              <div className="divider" />
              {lang === 'fr' ? (
                <>
                  <p className="spiritual-hero-v2__body">
                    La guidance est une lecture intuitive basée sur le tarot et les oracles, utilisée comme un outil d'analyse, de clarification et de prise de recul.
                  </p>
                  <p className="spiritual-hero-v2__body">
                    Elle permet d'éclairer une situation, de mieux comprendre les dynamiques en cours et d'identifier les évolutions possibles. Les cartes offrent une lecture du présent tout en mettant en lumière les tendances à venir.
                  </p>
                  <p className="spiritual-hero-v2__body">
                    L'objectif est de vous aider à prendre du recul, à y voir plus clair et à avancer avec davantage de confiance et de justesse dans vos décisions.
                  </p>
                </>
              ) : (
                <>
                  <p className="spiritual-hero-v2__body">
                    Guidance is an intuitive reading based on tarot and oracles, used as a tool for analysis, clarification and perspective.
                  </p>
                  <p className="spiritual-hero-v2__body">
                    It helps illuminate a situation, better understand current dynamics and identify possible developments. The cards offer a reading of the present while highlighting emerging trends.
                  </p>
                  <p className="spiritual-hero-v2__body">
                    The goal is to help you step back, gain clarity and move forward with greater confidence and discernment in your decisions.
                  </p>
                </>
              )}
            </div>
            <div className="spiritual-hero-v2__visual">
              <div className="spiritual-orb spiritual-orb--photo">
                <OptimizedImage src={tarotOrb} alt="Tarot" />
              </div>
              <span className="spiritual-orb-label">IDALA Tarot &amp; Oracle</span>
            </div>
          </div>
        </section>

        {/* ── Sessions ── */}
        <section className="spiritual-section">
          <div className="spiritual-section__header">
            <span className="eyebrow" style={{ textAlign: 'center' }}>
              {lang === 'fr' ? 'Séances' : 'Sessions'}
            </span>
          </div>

          <div className="spiritual-cards">

            {/* Lecture ciblée 30 min */}
            <div className="spiritual-card spiritual-card--c7">
              {/* <div className="spiritual-card__image">
                <OptimizedImage src={tarotImg} alt={lang === 'fr' ? 'Lecture ciblée' : 'Focused reading'} />
              </div> */}
              <div className="spiritual-card__content">
                <div className="spiritual-card__duration">30 min</div>
                <h3 className="spiritual-card__title">
                  {lang === 'fr' ? 'Lecture ciblée' : 'Focused reading'}
                </h3>
                <div className="spiritual-card__price">
                  <sup>€</sup>50
                </div>
                <div className="divider" style={{ margin: '16px 0' }} />
                <p className="spiritual-card__desc" style={{ marginBottom: '12px' }}>
                  {lang === 'fr'
                    ? 'Une séance courte, précise et centrée sur une problématique spécifique : relation, choix personnel, situation professionnelle, prise de décision ou blocage actuel.'
                    : 'A short, precise session focused on a specific issue: relationship, personal choice, professional situation, decision-making or current block.'}
                </p>
                <ul className="spiritual-card__list">
                  {lang === 'fr' ? (
                    <>
                      <li>Clarifier une situation précise</li>
                      <li>Comprendre les éléments en jeu</li>
                      <li>Identifier les tendances à court terme</li>
                      <li>Obtenir des pistes concrètes et immédiates</li>
                    </>
                  ) : (
                    <>
                      <li>Clarify a specific situation</li>
                      <li>Understand the elements at play</li>
                      <li>Identify short-term trends</li>
                      <li>Get concrete and immediate guidance</li>
                    </>
                  )}
                </ul>
                <p className="spiritual-card__format-note">
                  {lang === 'fr'
                    ? 'Idéal pour une réponse rapide, claire et orientée sur un sujet précis.'
                    : 'Ideal for a quick, clear answer focused on a specific topic.'}
                </p>
                <div className="spiritual-card__cta">
                  <span className="pract-card__coming-soon">
                    {lang === 'fr' ? 'Bientôt disponible' : 'Coming soon'}
                  </span>
                </div>
              </div>
            </div>

            {/* Lecture complète 60 min */}
            <div className="spiritual-card spiritual-card--c5">
              {/* <div className="spiritual-card__image">
                <OptimizedImage src={psychicImg} alt={lang === 'fr' ? 'Lecture complète' : 'Full reading'} />
              </div> */}
              <div className="spiritual-card__content">
                <div className="spiritual-card__duration">60 min</div>
                <h3 className="spiritual-card__title">
                  {lang === 'fr' ? 'Lecture complète' : 'Full reading'}
                </h3>
                <div className="spiritual-card__price">
                  <sup>€</sup>100
                </div>
                <div className="divider" style={{ margin: '16px 0' }} />
                <p className="spiritual-card__desc">
                  {lang === 'fr'
                    ? 'Une séance approfondie pour obtenir une vision plus globale de votre situation et explorer plusieurs domaines de vie.'
                    : 'An in-depth session to gain a broader view of your situation and explore several areas of life.'}
                </p>
                <ul className="spiritual-card__list">
                  {lang === 'fr' ? (
                    <>
                      <li>Analyser les dynamiques actuelles</li>
                      <li>Mettre en lumière les schémas récurrents</li>
                      <li>Mieux comprendre les freins et les opportunités</li>
                      <li>Anticiper les évolutions possibles</li>
                      <li>Dégager des directions claires pour la suite</li>
                    </>
                  ) : (
                    <>
                      <li>Analyse current dynamics</li>
                      <li>Illuminate recurring patterns</li>
                      <li>Better understand blocks and opportunities</li>
                      <li>Anticipate possible developments</li>
                      <li>Define clear directions going forward</li>
                    </>
                  )}
                </ul>
                <p className="spiritual-card__format-note">
                  {lang === 'fr'
                    ? 'Recommandé pour prendre du recul sur une période de vie et bénéficier d\'un accompagnement plus complet.'
                    : 'Recommended to step back on a life period and benefit from more complete support.'}
                </p>
                <div className="spiritual-card__cta">
                  <span className="pract-card__coming-soon">
                    {lang === 'fr' ? 'Bientôt disponible' : 'Coming soon'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

export default Spiritual;