import { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../../lib/supabaseClient'
import { LangCtx } from '../../components/LangContext'
import Footer from '../../components/Footer'
import { MODES_EXERCICE } from '../../constants/modes'
import { PRATIQUES } from '../../constants/pratiques'
import OptimizedImage from "../../components/OptimizedImage"


function ModeTags({ mode, lang }) {
  const modes = mode ? mode.split(',').map(m => m.trim()) : []
  const tags = MODES_EXERCICE.filter(m => modes.includes(m.value))
  
  return (
    <div className="pract-profile__modes">
      {tags.map(t => (
        <div key={t.value} className="pract-profile__mode-item">
          <span className="mode-tag"
            style={{ background: t.bg, color: t.color, border: `1px solid ${t.border}` }}>
            {lang === 'fr' ? t.fr : t.en}
          </span>
          <p className="pract-profile__mode-desc">
            {lang === 'fr' ? t.descFr : t.descEn}
          </p>
        </div>
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

      // Récupérer les infos spécifiques à la pratique visitée
      const { data: ppData } = await supabase
        .from('praticien_pratiques')
        .select('*, pratiques(*)')
        .eq('praticien_id', data.id)
        .then(({ data: allPP }) => ({
          data: allPP?.find(pp => pp.pratiques?.slug === practiceSlug) || null
        }))

        // Charger les offres de cette pratique
        let offres = []
        if (ppData?.id) {
          const { data: offresData } = await supabase
            .from('praticien_offres')
            .select('*')
            .eq('praticien_pratique_id', ppData.id)
            .order('ordre')
          offres = offresData || []
        }

      setPraticien({
        ...data,
        photo_url: ppData?.photo_url || data.photo_url, 
        photo_position: ppData?.photo_position || data.photo_position || 'center center', 
        bio_fr: data.bio_fr,
        bio_en: data.bio_en,
        bio_complete_fr: ppData?.bio_fr || data.bio_complete_fr || '',
        bio_complete_en: ppData?.bio_en || data.bio_complete_en || '',
        prix: ppData?.prix,
        duree_seance: ppData?.duree_seance,
        mode_exercice_pratique: ppData?.mode_exercice || '',
        type_seance: ppData?.type_seance || '',
        public_cible: ppData?.public_cible || '',
        offres,
      })
      setPratique(ppData?.pratiques || data.pratiques)
      setLoading(false)
    }
    fetchData()
  }, [practitionerSlug, practiceSlug])

  if (loading) return (
    <div className="pract-profile">
      <div className="pract-profile__card">
        <div className="pract-profile__hero">
          <div className="skeleton-circle skeleton-circle--lg" />
          <div className="pract-profile__info" style={{ flex: 1 }}>
            <div className="skeleton-line skeleton-line--lg" />
            <div className="skeleton-line" />
            <div className="skeleton-line skeleton-line--sm" />
          </div>
        </div>
      </div>
    </div>
  )

const pratiqueSlug = pratique?.slug
const pratiqueFromConst = PRATIQUES.find(p => p.value === pratiqueSlug)
const practiceName = pratiqueFromConst
  ? (lang === 'fr' ? pratiqueFromConst.fr : pratiqueFromConst.en)
  : pratique?.nom

  return (
    <>
      <Helmet>
        <title>{`${praticien.prenom || ''} ${praticien.nom?.charAt(0) || ''}. — ${practiceName || ''} — The Idala Family`}</title>
        <meta name="description"
          content={praticien.bio_fr || praticien.bio || `Book a session with ${praticien.prenom} ${praticien.nom?.charAt(0)}.`} />
      </Helmet>

      <div className="pract-profile">

        <div className="pract-profile__breadcrumb">
          <button onClick={() => navigate('/')} className="pract-profile__breadcrumb-link">
            {lang === 'fr' ? 'Accueil' : 'Home'}
          </button>
          <span className="pract-profile__breadcrumb-sep">›</span>
          <button onClick={() => navigate('/practitioners')} className="pract-profile__breadcrumb-link">
            {lang === 'fr' ? 'Praticiens' : 'Practitioners'}
          </button>
          <span className="pract-profile__breadcrumb-sep">›</span>
          <button onClick={() => navigate(`/practices/${practiceSlug}`)} className="pract-profile__breadcrumb-link">
            {practiceName}
          </button>
          <span className="pract-profile__breadcrumb-sep">›</span>
          <span className="pract-profile__breadcrumb-current">
            {praticien.prenom} {praticien.nom?.charAt(0)}.
          </span>
        </div>

        <div className="pract-profile__card">

          {/* Bloc haut : photo + infos identité */}
          <div className="pract-profile__hero">
            <div className="pract-profile__photo">
              {praticien.photo_url
                ? <OptimizedImage 
                    src={praticien.photo_url} 
                    alt={praticien.slug}
                    style={{ objectPosition: praticien.photo_position || 'center center' }}
                  />
                : <div className="pract-profile__photo-placeholder" />
              }
            </div>
            <div className="pract-profile__info">
              <p className="pract-profile__practice">{practiceName}</p>
              <h1 className="pract-profile__name">
                {praticien.prenom} {praticien.nom?.charAt(0)}.
              </h1>
              {(praticien.ville || praticien.localisation) && (
                <p className="pract-profile__location">
                  {praticien.ville
                    ? [praticien.ville, praticien.region, praticien.pays].filter(Boolean).join(', ')
                    : praticien.localisation}
                </p>
              )}
              {/* {(praticien.prix || praticien.duree_seance) && (
                  <p className="pract-profile__session-info">
                    {praticien.duree_seance && <span>{praticien.duree_seance}</span>}
                    {praticien.duree_seance && praticien.prix && <span> · </span>}
                    {praticien.prix && <span>{praticien.prix} €</span>}
                  </p>
                )} */}
              {praticien.langues && (
                <p className="pract-profile__langues">{praticien.langues}</p>
              )}
              <ModeTags mode={praticien.mode_exercice_pratique || praticien.mode_exercice} lang={lang} />
              {lang === 'en' && praticien.langues && 
                !praticien.langues.toLowerCase().includes('english') && (
                <p className="pract-profile__lang-warning">
                  ⚠️ This practitioner only offers sessions in French
                </p>
              )}
            </div>
          </div>

          {/* Séparateur */}
          <div className="pract-profile__divider" />

          {/* Bloc bas : bios + bouton sur toute la largeur */}
          <div className="pract-profile__content">
            {(praticien.bio_fr || praticien.bio_en || praticien.bio) && (
              <p className="pract-profile__bio pract-profile__bio--intro">
                {lang === 'fr'
                  ? (praticien.bio_fr || praticien.bio)
                  : (praticien.bio_en || praticien.bio)}
              </p>
            )}
            {/* {(praticien.bio_complete_fr || praticien.bio_complete_en || praticien.bio_complete) && (
              <p className="pract-profile__bio">
                {lang === 'fr'
                  ? (praticien.bio_complete_fr || praticien.bio_complete)
                  : (praticien.bio_complete_en || praticien.bio_complete)}
              </p>
            )} */}

              {praticien.offres?.length > 0 && (
                <div className="pract-profile__offres">
                  <p className="pract-profile__offres-title">
                    {lang === 'fr' ? 'Offres & tarifs' : 'Offers & pricing'}
                  </p>
                  {praticien.offres.map((offre, i) => (
                    <div key={i} className="pract-profile__offre">
                      <div className="pract-profile__offre-header">
                        <h4 className="pract-profile__offre-titre">
                          {lang === 'fr' ? offre.titre_fr : offre.titre_en}
                        </h4>
                        <div className="pract-profile__offre-meta">
                          {offre.duree && <span>{offre.duree} {lang === 'fr' ? 'min' : 'min'}</span>}
                          {offre.prix && <span>{offre.prix} €</span>}
                        </div>
                      </div>
                      {(lang === 'fr' ? offre.description_fr : offre.description_en) && (
                        <p className="pract-profile__offre-desc">
                          {lang === 'fr' ? offre.description_fr : offre.description_en}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
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
      <Footer />
    </>
  )
}