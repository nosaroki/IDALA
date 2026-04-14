import { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../../lib/supabaseClient'
import { LangCtx } from '../../components/LangContext'
import PractitionerCard from '../../components/PractitionerCard'
import Footer from '../../components/Footer'


const PRACTS_MAP = {
  'yoga':                { titleFr: 'Yoga',                  titleEn: 'Yoga',               messageFr: 'Renforcez le corps, libérez l\'esprit',          messageEn: 'Strengthen the body, free the mind' },
  'osteopathy':          { titleFr: 'Ostéopathie',           titleEn: 'Osteopathy',          messageFr: 'Retrouvez l\'équilibre par la thérapie manuelle', messageEn: 'Restore balance through manual therapy' },
  'therapeutic-massage': { titleFr: 'Massage Thérapeutique', titleEn: 'Therapeutic Massage', messageFr: 'Relâchez les tensions, invitez le repos profond',  messageEn: 'Release tension, invite deep rest' },
  'acupuncture':         { titleFr: 'Acupuncture',           titleEn: 'Acupuncture',         messageFr: 'Sagesse ancienne pour un équilibre moderne',      messageEn: 'Ancient wisdom for modern balance' },
  'tai-chi':             { titleFr: 'Tai Chi',               titleEn: 'Tai Chi',             messageFr: 'Bougez avec intention, trouvez votre calme',      messageEn: 'Move with intention, find your stillness' },
  'qi-gong':             { titleFr: 'Qi Gong',               titleEn: 'Qi Gong',             messageFr: 'Harmonisez votre énergie vitale',                 messageEn: 'Harmonise your vital energy' },
  'meditation':          { titleFr: 'Méditation',            titleEn: 'Meditation',          messageFr: 'Entraînez votre esprit, cultivez le calme',       messageEn: 'Train your mind, cultivate inner calm' },
  'breathwork':          { titleFr: 'Breathwork',            titleEn: 'Breathwork',          messageFr: 'Respirez plus profond, vivez plus pleinement',    messageEn: 'Breathe deeper, live fuller' },
  'coaching':            { titleFr: 'Coaching',              titleEn: 'Coaching',            messageFr: 'Clarté, direction, changement aligné',            messageEn: 'Clarity, direction, aligned change' },
  'hypnotherapy':        { titleFr: 'Hypnothérapie',         titleEn: 'Hypnotherapy',        messageFr: 'Accédez aux couches profondes du changement',     messageEn: 'Access the deeper layers of change' },
  'reiki':               { titleFr: 'Reiki',                 titleEn: 'Reiki',               messageFr: 'Énergie douce pour une harmonie profonde',        messageEn: 'Gentle energy for deep harmony' },
  'sound-healing':       { titleFr: 'Sound Healing',         titleEn: 'Sound Healing',       messageFr: 'Laissez le son restaurer votre équilibre',        messageEn: 'Let sound restore your inner equilibrium' },
  'naturopathy':         { titleFr: 'Naturopathie',          titleEn: 'Naturopathy',         messageFr: 'Renforcez l\'intelligence naturelle de votre corps', messageEn: 'Strengthen your body\'s natural intelligence' },
}

export default function PracticePage() {
  const { slug }                    = useParams()
  const { lang }                    = useContext(LangCtx)
  const navigate                    = useNavigate()
  const [pratique, setPratique]     = useState(null)
  const [praticiens, setPraticiens] = useState([])
  const [loading, setLoading]       = useState(true)

  const localData = PRACTS_MAP[slug] || {}
  const displayTitle   = lang === 'fr' ? localData.titleFr   : localData.titleEn
  const displayMessage = lang === 'fr' ? localData.messageFr : localData.messageEn

  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      const { data: pratiqueData, error } = await supabase
        .from('pratiques')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error || !pratiqueData) {
        navigate('*')
        return
      }

      const { data: praticiensData } = await supabase
        .from('praticiens')
        .select('*')
        .eq('pratique_id', pratiqueData.id)
        .eq('actif', true)

      setPratique(pratiqueData)
      setPraticiens(praticiensData || [])
      setLoading(false)
    }

    fetchData()
  }, [slug])

  if (loading) return <div className="practice-page__loader">...</div>

  const metaTitle = lang === 'fr'
    ? `${localData.titleFr} — The Idala Family`
    : pratique.meta_title || `${localData.titleEn} — The Idala Family`

  const metaDesc = pratique.meta_description || ''

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
      </Helmet>

      <section
        className="practice-page__banner"
        style={pratique.banner_image_url
          ? { backgroundImage: `url(${pratique.banner_image_url})` }
          : {}
        }
      >
        <div className="practice-page__banner-overlay">
          <h1 className="practice-page__title">{displayTitle}</h1>
          {displayMessage && (
            <p className="practice-page__subtitle">{displayMessage}</p>
          )}
        </div>
      </section>

      <section className="practice-page__practitioners">
        {praticiens.length === 0 ? (
          <p className="practice-page__empty">
            {lang === 'fr'
              ? 'Aucun praticien disponible pour le moment.'
              : 'No practitioners available at the moment.'}
          </p>
        ) : (
          <div className="practice-page__list">
            {praticiens.map(p => (
              <PractitionerCard key={p.id} praticien={p} practiceSlug={slug} />
            ))}
          </div>
        )}

        
      </section>
      {/* CTA rejoindre */}
        <section className="practice-page__cta">
          <p className="practice-page__cta-text">
            {lang === 'fr'
              ? 'Vous êtes praticien ? Rejoignez la famille Idala.'
              : 'Are you a practitioner? Join the Idala Family.'}
          </p>
          
            <a href="/#/join"
            className="btn btn--outline btn home-cta__btn"
          >
            {lang === 'fr' ? 'Devenir praticien' : 'Become a practitioner'}
          </a>
        </section>
        <Footer />
    </>
  )
}