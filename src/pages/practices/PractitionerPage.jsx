import { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../../lib/supabaseClient'
import { LangCtx } from '../../components/LangContext'
import Footer from '../../components/Footer'

function ModeTags({ mode, lang }) {
  const tags = []
  if (mode === 'in-person' || mode === 'both') {
    tags.push({ fr: 'En personne', en: 'In person', bg: '#3DCC7022', color: '#1a8844', border: '#3DCC7044' })
  }
  if (mode === 'online' || mode === 'both') {
    tags.push({ fr: 'En ligne', en: 'Online', bg: '#3AA8E022', color: '#1166aa', border: '#3AA8E044' })
  }
  return (
    <div className="mode-tags">
      {tags.map(t => (
        <span
          key={t.en}
          className="mode-tag"
          style={{ background: t.bg, color: t.color, border: `1px solid ${t.border}` }}
        >
          {lang === 'fr' ? t.fr : t.en}
        </span>
      ))}
    </div>
  )
}

export default function PractitionerPage() {
  const { practiceSlug, practitionerSlug } = useParams()
  const { lang }                           = useContext(LangCtx)
  const navigate                           = useNavigate()
  const [praticien, setPraticien]          = useState(null)
  const [pratique, setPratique]            = useState(null)
  const [loading, setLoading]              = useState(true)

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('praticiens')
        .select('*, pratiques(*)')
        .eq('slug', practitionerSlug)
        .single()

      if (error || !data) { navigate('*'); return }

      setPraticien(data)
      setPratique(data.pratiques)
      setLoading(false)
    }
    fetchData()
  }, [practitionerSlug])

  if (loading) return <div className="practice-page__loader">...</div>

  const practiceName = pratique?.nom

  return (
    <>
      <Helmet>
        <title>{praticien.prenom} {praticien.nom} — {practiceName} — The Idala Family</title>
        <meta name="description"
          content={praticien.bio || `Book a session with ${praticien.prenom} ${praticien.nom}, ${practiceName} practitioner at The Idala Family.`} />
      </Helmet>

      <div className="pract-profile">

        <button
          className="pract-profile__back btn btn--outline btn--sm"
          onClick={() => navigate(`/practices/${practiceSlug}`)}
        >
          {lang === 'fr' ? '← Retour' : '← Back'}
        </button>

        <div className="pract-profile__card">

          {/* Bloc haut : photo + infos identité */}
          <div className="pract-profile__hero">
            <div className="pract-profile__photo">
              {praticien.photo_url
                ? <img src={praticien.photo_url} alt={`${praticien.prenom} ${praticien.nom}`} />
                : <div className="pract-profile__photo-placeholder" />
              }
            </div>
            <div className="pract-profile__info">
              <p className="pract-profile__practice">{practiceName}</p>
              <h1 className="pract-profile__name">
                {praticien.prenom} {praticien.nom}
              </h1>
              {praticien.localisation && (
                <p className="pract-profile__location">{praticien.localisation}</p>
              )}
              <ModeTags mode={praticien.mode_exercice} lang={lang} />
            </div>
          </div>

          {/* Séparateur */}
          <div className="pract-profile__divider" />

          {/* Bloc bas : bios + bouton sur toute la largeur */}
          <div className="pract-profile__content">
            {praticien.bio && (
              <p className="pract-profile__bio pract-profile__bio--intro">{praticien.bio}</p>
            )}
            {praticien.bio_complete && (
              <p className="pract-profile__bio">{praticien.bio_complete}</p>
            )}
            {praticien.lien_reservation ? (
              
               <a href={praticien.lien_reservation}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--violet-mid"
              >
                {lang === 'fr' ? 'Réserver une séance' : 'Book a session'}
              </a>
            ) : (
              <p className="pract-card__coming-soon">
                {lang === 'fr' ? 'Bientôt disponible' : 'Coming soon'}
              </p>
            )}
          </div>

        </div>
      </div>
      <Footer />
    </>
  )
}