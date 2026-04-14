import { useState, useContext } from 'react'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabaseClient'
import { LangCtx } from '../components/LangContext'

const PRATIQUES = [
  { fr: 'Yoga',                  en: 'Yoga',                value: 'yoga' },
  { fr: 'Ostéopathie',           en: 'Osteopathy',          value: 'osteopathy' },
  { fr: 'Massage Thérapeutique', en: 'Therapeutic Massage', value: 'therapeutic-massage' },
  { fr: 'Acupuncture',           en: 'Acupuncture',         value: 'acupuncture' },
  { fr: 'Tai Chi',               en: 'Tai Chi',             value: 'tai-chi' },
  { fr: 'Qi Gong',               en: 'Qi Gong',             value: 'qi-gong' },
  { fr: 'Méditation',            en: 'Meditation',          value: 'meditation' },
  { fr: 'Breathwork',            en: 'Breathwork',          value: 'breathwork' },
  { fr: 'Coaching',              en: 'Coaching',            value: 'coaching' },
  { fr: 'Hypnothérapie',         en: 'Hypnotherapy',        value: 'hypnotherapy' },
  { fr: 'Reiki',                 en: 'Reiki',               value: 'reiki' },
  { fr: 'Sound Healing',         en: 'Sound Healing',       value: 'sound-healing' },
  { fr: 'Naturopathie',          en: 'Naturopathy',         value: 'naturopathy' },
]

const PUBLIC_CIBLE = [
  { fr: 'Adultes',      en: 'Adults',   value: 'adults' },
  { fr: 'Enfants',      en: 'Children', value: 'children' },
  { fr: 'Seniors',      en: 'Seniors',  value: 'seniors' },
  { fr: 'Tous publics', en: 'All ages', value: 'all' },
]

const TYPE_SEANCE = [
  { fr: 'Individuelle', en: 'Individual', value: 'individual' },
  { fr: 'Groupe',       en: 'Group',      value: 'group' },
  { fr: 'Les deux',     en: 'Both',       value: 'both' },
]

const emptyForm = {
  prenom: '', nom: '', email: '', telephone: '',
  ville: '', pays: '', langues: '',
  specialites: [],
  public_cible: [],
  certifications: '', experience: '', motivation: '',
  type_seance: '',
  description_seance: '', duree_seance: '', prix: '',
  mode_exercice: '',
  instagram: '', site_web: '',
  photos: [],
}

export default function JoinUs() {
  const { lang }          = useContext(LangCtx)
  const [form, setForm]   = useState(emptyForm)
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function toggleCheckbox(field, value) {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter(v => v !== value)
        : [...f[field], value]
    }))
  }

  async function handlePhotos(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    const urls = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const filename = `candidatures/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error } = await supabase.storage
        .from('photos-praticiens')
        .upload(filename, file, { upsert: true })
      if (!error) {
        const { data: urlData } = supabase.storage
          .from('photos-praticiens')
          .getPublicUrl(data.path)
        urls.push(urlData.publicUrl)
      }
    }
    setForm(f => ({ ...f, photos: [...f.photos, ...urls] }))
    setUploading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.from('candidatures').insert({
      prenom:             form.prenom,
      nom:                form.nom,
      email:              form.email,
      telephone:          form.telephone,
      ville:              form.ville,
      pays:               form.pays,
      langues:            form.langues,
      pratique:           form.specialites.join(', '),
      public_cible:       form.public_cible.join(', '),
      certifications:     form.certifications,
      experience:         form.experience,
      motivation:         form.motivation,
      type_seance:        form.type_seance,
      description_seance: form.description_seance,
      duree_seance:       form.duree_seance,
      prix:               parseFloat(form.prix) || null,
      mode_exercice:      form.mode_exercice,
      instagram:          form.instagram,
      site_web:           form.site_web,
      photos_urls:        form.photos,
    })

    if (error) {
      setError(lang === 'fr'
        ? 'Une erreur est survenue. Veuillez réessayer.'
        : 'An error occurred. Please try again.')
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) return (
    <div className="join-success">
      <div className="join-success__card">
        <p className="join-success__icon">✦</p>
        <h1 className="join-success__title">
          {lang === 'fr' ? 'Candidature envoyée' : 'Application received'}
        </h1>
        <p className="join-success__text">
          {lang === 'fr'
            ? <>Merci pour votre intérêt. <br />Nous examinerons votre profil avec soin et reviendrons vers vous dans les meilleurs délais.</>
            : <>Thank you for your interest.<br /> We will carefully review your profile and get back to you as soon as possible.'</>
            }
        </p>
      </div>
    </div>
  )

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? 'Rejoindre la famille — The Idala Family' : 'Join the Family — The Idala Family'}</title>
        <meta name="description" content={lang === 'fr'
          ? 'Vous êtes praticien du bien-être ? Rejoignez The Idala Family et développez votre activité.'
          : 'Are you a wellness practitioner? Join The Idala Family and grow your practice.'} />
      </Helmet>

      <div className="join-page">

        {/* Hero */}
        <section className="join-hero">
          <p className="join-hero__eyebrow">
            {lang === 'fr' ? 'Praticiens' : 'Practitioners'}
          </p>
          <h1 className="join-hero__title">
            {lang === 'fr' ? 'Rejoindre la Famille' : 'Join the Family'}
          </h1>
          <p className="join-hero__intro">
            {lang === 'fr'
              ? 'The Idala Family met à disposition le calendrier de réservation ainsi que le lien de paiement. Nous nous occupons de tout pour vous.'
              : 'The Idala Family provides the booking calendar and payment link. We take care of everything for you.'}
          </p>
        </section>

        <form onSubmit={handleSubmit} className="join-form">

          {/* ── Informations générales ── */}
          <div className="join-section">
            <h2 className="join-section__title">
              {lang === 'fr' ? 'Informations générales' : 'General information'}
            </h2>

            <div className="join-row">
              <div className="join-field">
                <label>{lang === 'fr' ? 'Prénom *' : 'First name *'}</label>
                <input required value={form.prenom}
                  onChange={e => setForm({ ...form, prenom: e.target.value })} />
              </div>
              <div className="join-field">
                <label>{lang === 'fr' ? 'Nom *' : 'Last name *'}</label>
                <input required value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })} />
              </div>
            </div>

            <div className="join-row">
              <div className="join-field">
                <label>Email *</label>
                <input required type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="join-field">
                <label>{lang === 'fr' ? 'Téléphone *' : 'Phone *'}</label>
                <input required value={form.telephone}
                  onChange={e => setForm({ ...form, telephone: e.target.value })} />
              </div>
            </div>

            <div className="join-row">
              <div className="join-field">
                <label>{lang === 'fr' ? 'Ville *' : 'City *'}</label>
                <input required value={form.ville}
                  onChange={e => setForm({ ...form, ville: e.target.value })} />
              </div>
              <div className="join-field">
                <label>{lang === 'fr' ? 'Pays *' : 'Country *'}</label>
                <input required value={form.pays}
                  onChange={e => setForm({ ...form, pays: e.target.value })} />
              </div>
            </div>

            <div className="join-field">
              <label>{lang === 'fr' ? 'Langues parlées *' : 'Languages spoken *'}</label>
              <input required value={form.langues}
                placeholder={lang === 'fr' ? 'ex: Français, Anglais' : 'e.g. French, English'}
                onChange={e => setForm({ ...form, langues: e.target.value })} />
            </div>
          </div>

          {/* ── Profil & expertise ── */}
          <div className="join-section">
            <h2 className="join-section__title">
              {lang === 'fr' ? 'Profil & expertise' : 'Profile & expertise'}
            </h2>

            <div className="join-field">
              <label>{lang === 'fr' ? 'Spécialités *' : 'Specialties *'}</label>
              <div className="join-checkboxes">
                {PRATIQUES.map(p => (
                  <label key={p.value} className="join-checkbox">
                    <input
                      type="checkbox"
                      checked={form.specialites.includes(p.value)}
                      onChange={() => toggleCheckbox('specialites', p.value)}
                    />
                    {lang === 'fr' ? p.fr : p.en}
                  </label>
                ))}
              </div>
            </div>

            <div className="join-field">
              <label>{lang === 'fr' ? 'Public cible *' : 'Target audience *'}</label>
              <div className="join-checkboxes join-checkboxes--row">
                {PUBLIC_CIBLE.map(p => (
                  <label key={p.value} className="join-checkbox">
                    <input
                      type="checkbox"
                      checked={form.public_cible.includes(p.value)}
                      onChange={() => toggleCheckbox('public_cible', p.value)}
                    />
                    {lang === 'fr' ? p.fr : p.en}
                  </label>
                ))}
              </div>
            </div>

            <div className="join-field">
              <label>{lang === 'fr' ? 'Diplômes & certifications *' : 'Diplomas & certifications *'}</label>
              <textarea required rows={3} value={form.certifications}
                onChange={e => setForm({ ...form, certifications: e.target.value })} />
            </div>

            <div className="join-field">
              <label>{lang === 'fr' ? "Années d'expérience *" : 'Years of experience *'}</label>
              <input required value={form.experience}
                placeholder={lang === 'fr' ? 'ex: 5 ans' : 'e.g. 5 years'}
                onChange={e => setForm({ ...form, experience: e.target.value })} />
            </div>

            <div className="join-field">
              <label>{lang === 'fr' ? 'Biographie *' : 'Biography *'}</label>
              <textarea required rows={6} value={form.motivation}
                placeholder={lang === 'fr' ? '5 à 10 lignes' : '5 to 10 lines'}
                onChange={e => setForm({ ...form, motivation: e.target.value })} />
            </div>
          </div>

          {/* ── Offres & séances ── */}
          <div className="join-section">
            <h2 className="join-section__title">
              {lang === 'fr' ? 'Offres & séances' : 'Offers & sessions'}
            </h2>

            <div className="join-field">
              <label>{lang === 'fr' ? 'Type de séance *' : 'Session type *'}</label>
              <div className="join-checkboxes join-checkboxes--row">
                {TYPE_SEANCE.map(t => (
                  <label key={t.value} className="join-checkbox">
                    <input
                      type="radio"
                      name="type_seance"
                      value={t.value}
                      checked={form.type_seance === t.value}
                      onChange={() => setForm({ ...form, type_seance: t.value })}
                    />
                    {lang === 'fr' ? t.fr : t.en}
                  </label>
                ))}
              </div>
            </div>

            <div className="join-field">
              <label>{lang === 'fr' ? 'Description des séances *' : 'Session description *'}</label>
              <textarea required rows={4} value={form.description_seance}
                onChange={e => setForm({ ...form, description_seance: e.target.value })} />
            </div>

            <div className="join-row">
              <div className="join-field">
                <label>{lang === 'fr' ? 'Durée *' : 'Duration *'}</label>
                <input required value={form.duree_seance}
                  placeholder={lang === 'fr' ? 'ex: 1h, 1h30' : 'e.g. 1h, 1h30'}
                  onChange={e => setForm({ ...form, duree_seance: e.target.value })} />
              </div>
              <div className="join-field">
                <label>{lang === 'fr' ? 'Prix (€) *' : 'Price (€) *'}</label>
                <input required type="number" min="0" value={form.prix}
                  onChange={e => setForm({ ...form, prix: e.target.value })} />
              </div>
            </div>

            <div className="join-field">
              <label>{lang === 'fr' ? 'Format *' : 'Format *'}</label>
              <div className="join-checkboxes join-checkboxes--row">
                <label className="join-checkbox">
                  <input type="radio" name="mode_exercice" value="in-person"
                    checked={form.mode_exercice === 'in-person'}
                    onChange={() => setForm({ ...form, mode_exercice: 'in-person' })} />
                  {lang === 'fr' ? 'Présentiel' : 'In person'}
                </label>
                <label className="join-checkbox">
                  <input type="radio" name="mode_exercice" value="online"
                    checked={form.mode_exercice === 'online'}
                    onChange={() => setForm({ ...form, mode_exercice: 'online' })} />
                  {lang === 'fr' ? 'Visio' : 'Online'}
                </label>
                <label className="join-checkbox">
                  <input type="radio" name="mode_exercice" value="both"
                    checked={form.mode_exercice === 'both'}
                    onChange={() => setForm({ ...form, mode_exercice: 'both' })} />
                  {lang === 'fr' ? 'Les deux' : 'Both'}
                </label>
              </div>
            </div>
          </div>

          {/* ── Présence en ligne ── */}
          <div className="join-section">
            <h2 className="join-section__title">
              {lang === 'fr' ? 'Présence en ligne' : 'Online presence'}
            </h2>
            <div className="join-row">
              <div className="join-field">
                <label>Instagram</label>
                <input value={form.instagram}
                  placeholder="@handle"
                  onChange={e => setForm({ ...form, instagram: e.target.value })} />
              </div>
              <div className="join-field">
                <label>{lang === 'fr' ? 'Site web' : 'Website'}</label>
                <input value={form.site_web}
                  placeholder="https://"
                  onChange={e => setForm({ ...form, site_web: e.target.value })} />
              </div>
            </div>
          </div>

          {/* ── Photos ── */}
          <div className="join-section">
            <h2 className="join-section__title">
              {lang === 'fr' ? 'Contenu visuel' : 'Visual content'}
            </h2>
            <div className="join-field">
              <label>
                {lang === 'fr'
                  ? 'Photos * (portrait + en situation, minimum 2)'
                  : 'Photos * (portrait + in action, minimum 2)'}
              </label>
              <input type="file" accept="image/*" multiple onChange={handlePhotos} />
              {uploading && (
                <p className="join-hint">
                  {lang === 'fr' ? 'Upload en cours...' : 'Uploading...'}
                </p>
              )}
              {form.photos.length > 0 && (
                <div className="join-photos-preview">
                  {form.photos.map((url, i) => (
                    <img key={i} src={url} alt={`photo ${i + 1}`} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <p className="join-error">{error}</p>}

          <div className="join-submit">
            <button type="submit" className="btn btn--violet-mid" disabled={loading}>
              {loading
                ? (lang === 'fr' ? 'Envoi en cours...' : 'Sending...')
                : (lang === 'fr' ? 'Envoyer ma candidature' : 'Submit my application')}
            </button>
          </div>

        </form>
      </div>
    </>
  )
}
