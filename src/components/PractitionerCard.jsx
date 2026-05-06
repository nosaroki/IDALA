import { useContext } from 'react'
import { LangCtx } from './LangContext'
import { useNavigate } from 'react-router-dom'

function ModeTags({ mode, lang }) {
  const modes = mode ? mode.split(',').map(m => m.trim()) : []
  const tags = []
  if (modes.includes('in-person')) {
    tags.push({ fr: 'Au cabinet', en: 'In-person', bg: '#3DCC7022', color: '#1a8844', border: '#3DCC7044' })
  }
  if (modes.includes('home')) {
    tags.push({ fr: 'Chez vous', en: 'Home visit', bg: '#FF9A3C22', color: '#cc6600', border: '#FF9A3C44' })
  }
  if (modes.includes('visio')) {
    tags.push({ fr: 'En visio', en: 'Online', bg: '#3AA8E022', color: '#1166aa', border: '#3AA8E044' })
  }
  return (
    <div className="mode-tags">
      {tags.map(t => (
        <span key={t.en} className="mode-tag"
          style={{ background: t.bg, color: t.color, border: `1px solid ${t.border}` }}>
          {lang === 'fr' ? t.fr : t.en}
        </span>
      ))}
    </div>
  )
}

export default function PractitionerCard({ praticien, practiceSlug }) {
  const { lang } = useContext(LangCtx)
  const navigate = useNavigate()

  const handleLearnMore = () => {
    navigate(`/practices/${practiceSlug}/${praticien.slug}`)
  }

  return (
    <div className="pract-card">
      <div className="pract-card__photo">
        {praticien.photo_url
          ? <img src={praticien.photo_url} alt={`${praticien.prenom} ${praticien.nom}`} />
          : <div className="pract-card__photo-placeholder" />
        }
      </div>

      <div className="pract-card__body">
        <div className="pract-card__top">
          <h3 className="pract-card__name">
            {praticien.prenom} {praticien.nom?.charAt(0)}.
          </h3>
          <ModeTags mode={praticien.mode_exercice} lang={lang} />
          {(praticien.ville || praticien.localisation) && (
            <p className="pract-card__location">
              <span className="pract-card__location-dot" />
              {praticien.ville
                ? [praticien.ville, praticien.pays].filter(Boolean).join(', ')
                : praticien.localisation}
            </p>
          )}
          {(praticien.prix || praticien.duree_seance) && (
            <p className="pract-card__session-info">
              {praticien.duree_seance && <span>{praticien.duree_seance}</span>}
              {praticien.duree_seance && praticien.prix && <span> · </span>}
              {praticien.prix && <span>{praticien.prix} €</span>}
            </p>
          )}
          {praticien.langues && (
            <p className="pract-card__langues">{praticien.langues}</p>
          )}
          {(praticien.bio_fr || praticien.bio_en || praticien.bio) && (
            <p className="pract-card__bio">
              {lang === 'fr'
                ? (praticien.bio_fr || praticien.bio)
                : (praticien.bio_en || praticien.bio)}
            </p>
          )}
        </div>

        <div className="pract-card__actions">
          {praticien.slug && (
            <button onClick={handleLearnMore} className="btn btn--outline btn--sm">
              {lang === 'fr' ? 'En savoir plus' : 'Learn more'}
            </button>
          )}
          {praticien.lien_reservation ? (
            
              <a href={praticien.lien_reservation}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--violet-mid btn--sm"
            >
              {lang === 'fr' ? 'Réserver' : 'Book a session'}
            </a>
          ) : (
            <span className="pract-card__coming-soon">
              {lang === 'fr' ? 'Bientôt disponible' : 'Coming soon'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}