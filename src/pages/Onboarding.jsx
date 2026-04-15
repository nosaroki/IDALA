import { useEffect, useState, useContext } from 'react'
import { useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabaseClient'
import { LangCtx } from '../components/LangContext'
import Footer from '../components/Footer'

export default function Onboarding() {
  const { token }             = useParams()
  const { lang }              = useContext(LangCtx)
  const [praticien, setPraticien] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState({
    bio_fr: '', bio_en: '',
    bio_complete_fr: '', bio_complete_en: '',
    ville: '', region: '', pays: '',
    langues: '', lien_reservation: '',
    iban: '', photo_url: ''
  })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function fetchPraticien() {
      const { data, error } = await supabase
        .from('praticiens')
        .select('*')
        .eq('onboarding_token', token)
        .single()

      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setPraticien(data)
      setForm({
        bio_fr: data.bio_fr || '',
        bio_en: data.bio_en || '',
        bio_complete_fr: data.bio_complete_fr || '',
        bio_complete_en: data.bio_complete_en || '',
        ville: data.ville || '',
        region: data.region || '',
        pays: data.pays || '',
        langues: data.langues || '',
        lien_reservation: data.lien_reservation || '',
        iban: data.iban || '',
        photo_url: data.photo_url || ''
      })
      setLoading(false)
    }
    fetchPraticien()
  }, [token])

  async function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const filename = `${Date.now()}.${ext}`
    const { data, error } = await supabase.storage
      .from('photos-praticiens')
      .upload(filename, file, { upsert: true })
    if (!error) {
      const { data: urlData } = supabase.storage
        .from('photos-praticiens')
        .getPublicUrl(data.path)
      setForm(f => ({ ...f, photo_url: urlData.publicUrl }))
    }
    setUploading(false)
  }

    async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase.functions.invoke('complete-onboarding', {
        body: { token, ...form }
    })

    if (!error) setSubmitted(true)
    setSaving(false)
    }

  if (loading) return <div className="practice-page__loader">...</div>

  if (notFound) return (
    <div className="join-success">
      <div className="join-success__card">
        <p className="join-success__icon">✦</p>
        <h1 className="join-success__title">
          {lang === 'fr' ? 'Lien invalide' : 'Invalid link'}
        </h1>
        <p className="join-success__text">
          {lang === 'fr'
            ? 'Ce lien est invalide ou a déjà été utilisé.'
            : 'This link is invalid or has already been used.'}
        </p>
      </div>
    </div>
  )

  if (submitted) return (
    <div className="join-success">
      <div className="join-success__card">
        <p className="join-success__icon">✦</p>
        <h1 className="join-success__title">
          {lang === 'fr' ? 'Profil complété !' : 'Profile completed!'}
        </h1>
        <p className="join-success__text">
          {lang === 'fr'
            ? 'Votre profil est maintenant actif sur The Idala Family. Bienvenue !'
            : 'Your profile is now live on The Idala Family. Welcome!'}
        </p>
      </div>
    </div>
  )

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? 'Compléter mon profil — The Idala Family' : 'Complete my profile — The Idala Family'}</title>
      </Helmet>

      <div className="join-page">
        <section className="join-hero">
          <p className="join-hero__eyebrow">
            {lang === 'fr' ? 'Bienvenue' : 'Welcome'}
          </p>
          <h1 className="join-hero__title">
            {lang === 'fr'
              ? `${praticien.prenom}, complétez votre profil`
              : `${praticien.prenom}, complete your profile`}
          </h1>
          <p className="join-hero__intro">
            {lang === 'fr'
              ? 'Ces informations seront affichées sur votre fiche publique. Prenez le temps de les soigner.'
              : 'This information will be displayed on your public profile. Take the time to make it shine.'}
          </p>
        </section>

        <form onSubmit={handleSubmit} className="join-form">

          {/* Localisation */}
          <div className="join-section">
            <h2 className="join-section__title">
              {lang === 'fr' ? 'Localisation' : 'Location'}
            </h2>
            <div className="join-row">
              <div className="join-field">
                <label>{lang === 'fr' ? 'Ville *' : 'City *'}</label>
                <input required value={form.ville}
                  onChange={e => setForm({ ...form, ville: e.target.value })} />
              </div>
              <div className="join-field">
                <label>{lang === 'fr' ? 'Région' : 'Region'}</label>
                <input value={form.region}
                  onChange={e => setForm({ ...form, region: e.target.value })} />
              </div>
            </div>
            <div className="join-row">
              <div className="join-field">
                <label>{lang === 'fr' ? 'Pays *' : 'Country *'}</label>
                <input required value={form.pays}
                  onChange={e => setForm({ ...form, pays: e.target.value })} />
              </div>
              <div className="join-field">
                <label>{lang === 'fr' ? 'Langues parlées *' : 'Languages spoken *'}</label>
                <input required value={form.langues}
                  placeholder={lang === 'fr' ? 'ex: Français, Anglais' : 'e.g. French, English'}
                  onChange={e => setForm({ ...form, langues: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Biographies */}
          <div className="join-section">
            <h2 className="join-section__title">
              {lang === 'fr' ? 'Présentation' : 'About you'}
            </h2>
            <div className="join-row">
              <div className="join-field">
                <label>{lang === 'fr' ? 'Bio courte FR *' : 'Short bio FR *'}</label>
                <textarea required rows={3} value={form.bio_fr}
                  placeholder="2-3 phrases en français"
                  onChange={e => setForm({ ...form, bio_fr: e.target.value })} />
              </div>
              <div className="join-field">
                <label>{lang === 'fr' ? 'Bio courte EN *' : 'Short bio EN *'}</label>
                <textarea required rows={3} value={form.bio_en}
                  placeholder="2-3 sentences in English"
                  onChange={e => setForm({ ...form, bio_en: e.target.value })} />
              </div>
            </div>
            <div className="join-row">
              <div className="join-field">
                <label>{lang === 'fr' ? 'Bio complète FR' : 'Full bio FR'}</label>
                <textarea rows={6} value={form.bio_complete_fr}
                  placeholder="Présentation détaillée en français"
                  onChange={e => setForm({ ...form, bio_complete_fr: e.target.value })} />
              </div>
              <div className="join-field">
                <label>{lang === 'fr' ? 'Bio complète EN' : 'Full bio EN'}</label>
                <textarea rows={6} value={form.bio_complete_en}
                  placeholder="Detailed presentation in English"
                  onChange={e => setForm({ ...form, bio_complete_en: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Réservation & paiement */}
          <div className="join-section">
            <h2 className="join-section__title">
              {lang === 'fr' ? 'Réservation & paiement' : 'Booking & payment'}
            </h2>
            <div className="join-field">
              <label>{lang === 'fr' ? 'Lien de réservation' : 'Booking link'}</label>
              <input value={form.lien_reservation}
                placeholder="https://calendly.com/..."
                onChange={e => setForm({ ...form, lien_reservation: e.target.value })} />
            </div>
            <div className="join-field">
              <label>IBAN *</label>
              <input required value={form.iban}
                placeholder="FR76..."
                onChange={e => setForm({ ...form, iban: e.target.value })} />
            </div>
          </div>

          {/* Photo */}
          <div className="join-section">
            <h2 className="join-section__title">
              {lang === 'fr' ? 'Photo de profil' : 'Profile photo'}
            </h2>
            <div className="join-field">
              <label>
                {lang === 'fr' ? 'Photo *' : 'Photo *'}
              </label>
              <input
                id="onboarding-photo"
                type="file"
                accept="image/*"
                onChange={handlePhoto}
                style={{ display: 'none' }}
              />
              <label htmlFor="onboarding-photo" className="join-file-btn">
                {uploading
                  ? (lang === 'fr' ? 'Upload en cours...' : 'Uploading...')
                  : (lang === 'fr' ? 'Choisir une photo' : 'Choose a photo')}
              </label>
              {form.photo_url && (
                <img src={form.photo_url} alt="preview"
                  style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: '50%', marginTop: 12 }} />
              )}
            </div>
          </div>

          <div className="join-submit">
            <button type="submit" className="btn btn--violet-mid" disabled={saving}>
              {saving
                ? (lang === 'fr' ? 'Enregistrement...' : 'Saving...')
                : (lang === 'fr' ? 'Finaliser mon profil' : 'Complete my profile')}
            </button>
          </div>

        </form>

        <Footer />
      </div>
    </>
  )
}