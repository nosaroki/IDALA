import { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../../lib/supabaseClient'
import { LangCtx } from '../../components/LangContext'
import Footer from '../../components/Footer'

function ModeTags({ mode, lang }) {
  const modes = mode ? mode.split(',').map(m => m.trim()) : []
  const tags = []
  if (modes.includes('in-person')) {
    tags.push({ fr: 'En personne', en: 'In person', bg: '#3DCC7022', color: '#1a8844', border: '#3DCC7044' })
  }
  if (modes.includes('home')) {
    tags.push({ fr: 'À domicile', en: 'Home visit', bg: '#FF9A3C22', color: '#cc6600', border: '#FF9A3C44' })
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
        bio_fr: data.bio_fr,
        bio_en: data.bio_en,
        bio_complete_fr: ppData?.bio_fr || '',
        bio_complete_en: ppData?.bio_en || '',
        prix: ppData?.prix,
        duree_seance: ppData?.duree_seance,
        offres,
      })
      setPratique(ppData?.pratiques || data.pratiques)
      setLoading(false)
    }
    fetchData()
  }, [practitionerSlug])

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

 const PRACTS_MAP = {
  'yoga':                { fr: 'Yoga',                  en: 'Yoga' },
  'osteotherapy':          { fr: 'Ostéothérapie',           en: 'Osteotherapy' },
  'therapeutic-massage': { fr: 'Massage Thérapeutique', en: 'Therapeutic Massage' },
  'acupuncture':         { fr: 'Acupuncture',           en: 'Acupuncture' },
  'tai-chi':             { fr: 'Tai Chi',               en: 'Tai Chi' },
  'qi-gong':             { fr: 'Qi Gong',               en: 'Qi Gong' },
  'meditation':          { fr: 'Méditation',            en: 'Meditation' },
  'breathwork':          { fr: 'Breathwork',            en: 'Breathwork' },
  'coaching':            { fr: 'Coaching',              en: 'Coaching' },
  'hypnotherapy':        { fr: 'Hypnothérapie',         en: 'Hypnotherapy' },
  'reiki':               { fr: 'Reiki',                 en: 'Reiki' },
  'sound-healing':       { fr: 'Sound Healing',         en: 'Sound Healing' },
  'naturopathy':         { fr: 'Naturopathie',          en: 'Naturopathy' },
}

const pratiqueSlug = pratique?.slug
const practiceName = lang === 'fr'
  ? (PRACTS_MAP[pratiqueSlug]?.fr || pratique?.nom)
  : (PRACTS_MAP[pratiqueSlug]?.en || pratique?.nom)

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
                ? <img src={praticien.photo_url} alt={`${praticien.prenom} ${praticien.nom}`} />
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
              {(praticien.prix || praticien.duree_seance) && (
                  <p className="pract-profile__session-info">
                    {praticien.duree_seance && <span>{praticien.duree_seance}</span>}
                    {praticien.duree_seance && praticien.prix && <span> · </span>}
                    {praticien.prix && <span>{praticien.prix} €</span>}
                  </p>
                )}
              {praticien.langues && (
                <p className="pract-profile__langues">{praticien.langues}</p>
              )}
              <ModeTags mode={praticien.mode_exercice} lang={lang} />
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
            {(praticien.bio_complete_fr || praticien.bio_complete_en || praticien.bio_complete) && (
              <p className="pract-profile__bio">
                {lang === 'fr'
                  ? (praticien.bio_complete_fr || praticien.bio_complete)
                  : (praticien.bio_complete_en || praticien.bio_complete)}
              </p>
            )}

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