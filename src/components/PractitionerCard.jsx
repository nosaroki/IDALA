import { useContext } from 'react'
import { LangCtx } from './LangContext'
import { useNavigate } from 'react-router-dom'
import { MODES_EXERCICE } from '../constants/modes'
import OptimizedImage from './OptimizedImage'

function ModeTags({ mode, lang }) {
  const modes = mode ? mode.split(',').map(m => m.trim()) : []
  const tags = MODES_EXERCICE.filter(m => modes.includes(m.value))
  
  return (
    <div className="mode-tags">
      {tags.map(t => (
        <span key={t.value} className="mode-tag"
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
  console.log('DIANE CHECK:', praticien.prenom, '| schedule:', praticien.supersaas_schedule_id, '| charges:', praticien.charges_enabled)
  console.log('PRATICIEN COMPLET:', praticien)

  const handleLearnMore = () => {
    navigate(`/practices/${practiceSlug}/${praticien.slug}`)
  }

  return (
    <div className="pract-card">
      <div className="pract-card__photo">
        {praticien.photo_url
          ? <OptimizedImage
              src={praticien.pratique_photo || praticien.photo_url} 
              alt={praticien.slug}
              style={{ objectPosition: praticien.photo_position || 'center center' }}
            />
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
          {/* {(praticien.prix || praticien.duree_seance) && (
            <p className="pract-card__session-info">
              {praticien.duree_seance && <span>{praticien.duree_seance}</span>}
              {praticien.duree_seance && praticien.prix && <span> · </span>}
              {praticien.prix && <span>{praticien.prix} €</span>}
            </p>
          )} */}
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
          {praticien.supersaas_schedule_id && praticien.charges_enabled ? (
            <button
              onClick={() => navigate(`/reservation/${praticien.slug}/${practiceSlug}`)}
              className="btn btn--violet-mid btn--sm"
            >
              {lang === 'fr' ? 'Réserver' : 'Book a session'}
            </button>
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