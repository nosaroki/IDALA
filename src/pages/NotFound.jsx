// ─────────────────────────────────────────
//  404 — NOT FOUND
// ─────────────────────────────────────────

import { useNavigate } from 'react-router-dom';
import { useLang } from '../components/LangContext';
import { Helmet } from 'react-helmet-async';

function NotFound() {
  const { lang } = useLang();
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? 'Page introuvable | The Idala Family' : 'Page Not Found | The Idala Family'}</title>
      </Helmet>

      <div className="not-found">

        {/* Cercles décoratifs */}
        <div className="not-found__ring not-found__ring--1" />
        <div className="not-found__ring not-found__ring--2" />

        {/* Dots chakras */}
        <div className="not-found__chakra-row">
          {['c1','c2','c3','c4','c5','c6','c7'].map(c => (
            <span key={c} className={`not-found__dot not-found__dot--${c}`} />
          ))}
        </div>

        <div className="not-found__inner">
          <span className="eyebrow">404</span>
          <h1 className="not-found__title">
            {lang === 'fr' ? 'Page introuvable' : 'Page not found'}
          </h1>
          <div className="divider divider--center" />
          <p className="not-found__body">
            {lang === 'fr'
              ? <>Cette page n'existe pas ou a été déplacée.<br /> Revenez à l'accueil et continuez votre exploration.</>
              : <>This page doesn't exist or has been moved. <br /> Head back home and continue your journey.</>}
          </p>
          <div className="not-found__actions">
            <button className="btn btn--violet-mid" onClick={() => navigate('/')}>
              {lang === 'fr' ? 'Retour à l\'accueil' : 'Back to Home'}
            </button>
            <button className="btn btn--outline" onClick={() => navigate('/practitioners')}>
              {lang === 'fr' ? 'Voir les praticiens' : 'View Practitioners'}
            </button>
          </div>
          <p className="not-found__quote">
            <em>Mens sana in corpore sano</em>
          </p>
        </div>

      </div>
    </>
  );
}

export default NotFound;