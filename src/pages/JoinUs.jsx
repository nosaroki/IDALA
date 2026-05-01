import { useState, useContext, useRef, useEffect  } from 'react'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabaseClient'
import { LangCtx } from '../components/LangContext'

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
]

const PRATIQUES = [
  { fr: 'Yoga',                  en: 'Yoga',                value: 'yoga' },
  { fr: 'Ostéothérapie',         en: 'Osteotherapy',          value: 'osteotherapy' },
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
  ville: '', region: '', pays: '',
  langues: '', langues_list: [],
  specialites: [],
  pratiques_details: {},
  public_cible: [],
  certifications: '', experience: '',
  bio_fr: '', bio_en: '',
  type_seance: '',
  mode_exercice: '',
  instagram: '', site_web: '',
  photos: [], main_photo: '',
}

export default function JoinUs() {
  const { lang }          = useContext(LangCtx)
  const [form, setForm]   = useState(emptyForm)
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [locSuggestions, setLocSuggestions] = useState([])
  const [locLoading, setLocLoading] = useState(false)
  const [langDropOpen, setLangDropOpen] = useState(false)
  const langDropRef = useRef(null)
      useEffect(() => {
        function handleClickOutside(e) {
          if (langDropRef.current && !langDropRef.current.contains(e.target)) {
            setLangDropOpen(false)
          }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
      }, [])

  function toggleCheckbox(field, value) {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter(v => v !== value)
        : [...f[field], value]
    }))
  }

  async function handleLocSearch(value) {
  setForm(f => ({ ...f, ville: value }))
  if (value.length < 3) { setLocSuggestions([]); return }
  setLocLoading(true)
  const res = await fetch(
    `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(value)}&type=city&format=json&apiKey=${import.meta.env.VITE_GEOAPIFY_KEY}`
  )
  const data = await res.json()
  setLocSuggestions(data.results || [])
  setLocLoading(false)
}

function selectLocation(result) {
  setForm(f => ({
    ...f,
    ville: result.city || result.name || '',
    region: result.state || result.county || '',
    pays: result.country || '',
  }))
  setLocSuggestions([])
}

async function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxSize = 1200
        let width = img.width
        let height = img.height
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        } else if (height > width && height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }))
        }, 'image/jpeg', 0.8)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

 async function handlePhotos(e) {
  const files = Array.from(e.target.files)
  if (!files.length) return
  setUploading(true)
  const urls = []
  for (const file of files) {
    const compressed = await compressImage(file)
    const ext = 'jpg'
    const filename = `candidatures/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await supabase.storage
      .from('photos-praticiens')
      .upload(filename, compressed, { upsert: true })
    if (!error) {
      const { data: urlData } = supabase.storage
        .from('photos-praticiens')
        .getPublicUrl(data.path)
      urls.push(urlData.publicUrl)
    }
  }
  setForm(f => ({
    ...f,
    photos: [...f.photos, ...urls],
    main_photo: f.main_photo || urls[0] || ''
  }))
  setUploading(false)
}

      function validate() {
      // Téléphone : minimum 8 chiffres, pas de suite 0123456789
      if (form.telephone) {
        const phoneClean = form.telephone.replace(/[\s\-+()]/g, '')
        const isSequential = '0123456789'.includes(phoneClean)
        if (!/^\d{8,15}$/.test(phoneClean) || isSequential) {
          return lang === 'fr' ? 'Numéro de téléphone invalide.' : 'Invalid phone number.'
        }
      }

      // Email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        return lang === 'fr' ? 'Adresse email invalide.' : 'Invalid email address.'
      }

      // IBAN (format basique : 2 lettres + 2 chiffres + jusqu'à 30 caractères alphanumériques)
        if (form.iban) {
          const ibanClean = form.iban.replace(/\s/g, '').toUpperCase()
          if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(ibanClean)) {
            return lang === 'fr' ? 'Format IBAN invalide.' : 'Invalid IBAN format.'
          }
        }

      // Spécialités : au moins une cochée
      if (form.specialites.length === 0) {
        return lang === 'fr' ? 'Veuillez sélectionner au moins une spécialité.' : 'Please select at least one specialty.'
      }

      // Photos : minimum 2
      if (form.photos.length < 2) {
        return lang === 'fr' ? 'Veuillez uploader au moins 2 photos.' : 'Please upload at least 2 photos.'
      }

      return null
    }

  async function handleSubmit(e) {
    e.preventDefault()
      const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
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
      pratiques_details:  form.pratiques_details,
      public_cible:       form.public_cible.join(', '),
      certifications:     form.certifications,
      experience:         form.experience,
      motivation: form.bio_fr,
      bio_fr: form.bio_fr,
      bio_en: form.bio_en,
      type_seance:        form.type_seance,
      description_seance: form.description_seance,
      duree_seance:       form.duree_seance,
      prix:               parseFloat(form.prix) || null,
      mode_exercice:      form.mode_exercice,
      instagram:          form.instagram,
      site_web:           form.site_web,
      photos_urls: form.photos,
      main_photo: form.main_photo,
      langue_interface: lang
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
            <div className="join-hero__body">
              <p>
                {lang === 'fr'
                  ? <>Rejoignez IDALA, une communauté de praticiens engagés autour d'une même vision : favoriser le bien-être durable et <strong>l'harmonie entre le corps et l'esprit</strong>.</>
                  : <>Join IDALA, a community of practitioners united around a shared vision: fostering lasting well-being and <strong>harmony between body and mind</strong>.</>}
              </p>
              <p>
                {lang === 'fr'
                  ? <>Que vous proposiez des séances individuelles, des ateliers collectifs ou des interventions en entreprise, <br />IDALA vous aide à développer votre visibilité, élargir votre clientèle et <strong>valoriser votre pratique</strong>.</>
                  : <>Whether you offer individual sessions, group workshops or corporate programmes, <br />IDALA helps you grow your visibility, expand your client base and <strong>showcase your practice</strong>.</>}
              </p>
              <p>
                {lang === 'fr'
                  ? <>Nous croyons que chaque praticien a le <strong>pouvoir</strong> d'accompagner, d'inspirer et de créer un impact positif durable, avec bienveillance et authenticité.</>
                  : <>We believe every practitioner has the <strong>power</strong> to support, inspire and create lasting positive impact, with kindness and authenticity.</>}
              </p>
              <p>
                {lang === 'fr'
                  ? <>En rejoignant IDALA, vous intégrez un réseau humain porté par une conviction forte :<strong> "mens sana in corpore sano"</strong>, un esprit sain dans un corps sain.</>
                  : <>By joining IDALA, you become part of a human network built around a strong conviction: <strong>"mens sana in corpore sano"</strong>, a healthy mind in a healthy body.</>}
              </p>
            </div>
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
             <div className="join-field" style={{ position: 'relative' }}>
              <label>{lang === 'fr' ? 'Ville *' : 'City *'}</label>
              <input
                required
                value={form.ville}
                placeholder={lang === 'fr' ? 'Rechercher une ville...' : 'Search for a city...'}
                onChange={e => handleLocSearch(e.target.value)}
                autoComplete="off"
              />
              {locLoading && <p className="join-hint">...</p>}
              {locSuggestions.length > 0 && (
                <ul className="join-loc-suggestions">
                  {locSuggestions.map((r, i) => (
                    <li key={i} onClick={() => selectLocation(r)} className="join-loc-suggestion">
                      {r.city || r.name}{r.state ? `, ${r.state}` : ''}{r.country ? `, ${r.country}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="join-row">
              <div className="join-field">
                <label>{lang === 'fr' ? 'Région' : 'Region'}</label>
                <input value={form.region} readOnly placeholder={lang === 'fr' ? 'Rempli automatiquement' : 'Auto-filled'} />
              </div>
              <div className="join-field">
                <label>{lang === 'fr' ? 'Pays *' : 'Country *'}</label>
                <input value={form.pays} readOnly placeholder={lang === 'fr' ? 'Rempli automatiquement' : 'Auto-filled'} />
              </div>
            </div>
            </div>

            <div className="join-field" style={{ position: 'relative' }} ref={langDropRef}>
              <label>{lang === 'fr' ? 'Langues parlées *' : 'Languages spoken *'}</label>
              <div
                className="join-lang-trigger"
                onClick={() => setLangDropOpen(o => !o)}
              >
                {form.langues_list?.length > 0
                  ? form.langues_list.map(c => LANGUAGES.find(l => l.code === c)?.flag).join(' ')
                    + ' ' + form.langues_list.map(c => LANGUAGES.find(l => l.code === c)?.label).join(', ')
                  : (lang === 'fr' ? 'Sélectionner les langues...' : 'Select languages...')}
                <span className="join-lang-arrow">▾</span>
              </div>
              {langDropOpen && (
                <div className="join-lang-dropdown">
                  {LANGUAGES.map(l => (
                    <label key={l.code} className={`join-lang-option ${form.langues_list?.includes(l.code) ? 'join-lang-option--selected' : ''}`}>
                      <input
                        type="checkbox"
                        style={{ display: 'none' }}
                        checked={form.langues_list?.includes(l.code) || false}
                        onChange={() => {
                          const current = form.langues_list || []
                          const updated = current.includes(l.code)
                            ? current.filter(c => c !== l.code)
                            : [...current, l.code]
                          const labels = updated.map(c => LANGUAGES.find(ll => ll.code === c)?.label).filter(Boolean)
                          setForm(f => ({ ...f, langues_list: updated, langues: labels.join(', ') }))
                        }}
                      />
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                      {form.langues_list?.includes(l.code) && <span className="join-lang-check">✓</span>}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Profil & expertise ── */}
            <div className="join-section">
              <h2 className="join-section__title">
                {lang === 'fr' ? 'Profil & expertise' : 'Profile & expertise'}
              </h2>

              {/* Spécialités */}
              <div className="join-field">
                <label>{lang === 'fr' ? 'Spécialités *' : 'Specialties *'}</label>
                <div className="join-checkboxes">
                  {PRATIQUES.map(p => (
                    <label key={p.value} className="join-checkbox">
                      <input
                        type="checkbox"
                        checked={form.specialites.includes(p.value)}
                        onChange={() => {
                          const updated = form.specialites.includes(p.value)
                            ? form.specialites.filter(v => v !== p.value)
                            : [...form.specialites, p.value]
                          const newDetails = { ...form.pratiques_details }
                          if (!updated.includes(p.value)) delete newDetails[p.value]
                          else if (!newDetails[p.value]) newDetails[p.value] = { bio_fr: '', bio_en: '', prix: '', duree: '' }
                          setForm(f => ({ ...f, specialites: updated, pratiques_details: newDetails }))
                        }}
                      />
                      {lang === 'fr' ? p.fr : p.en}
                    </label>
                  ))}
                </div>
              </div>

              {/* Blocs dynamiques par pratique */}
              {form.specialites.length > 0 && (
                <div className="join-pratiques-details">
                  {form.specialites.map(slug => {
                    const pratique = PRATIQUES.find(p => p.value === slug)
                    const details = form.pratiques_details[slug] || { bio_fr: '', bio_en: '', offres: [] }
                    return (
                      <div key={slug} className="join-pratique-block">
                        <h3 className="join-pratique-block__title">
                          {lang === 'fr' ? pratique?.fr : pratique?.en}
                        </h3>

                        {/* Bio spécifique */}
                        <div className="join-row">
                          <div className="join-field">
                            <label>{lang === 'fr' ? 'Description FR *' : 'Description FR *'}</label>
                            <textarea rows={3}
                              value={details.bio_fr || ''}
                              placeholder={lang === 'fr' ? '2-3 phrases en français' : '2-3 sentences in French'}
                              onChange={e => setForm(f => ({
                                ...f,
                                pratiques_details: {
                                  ...f.pratiques_details,
                                  [slug]: { ...f.pratiques_details[slug], bio_fr: e.target.value }
                                }
                              }))} />
                          </div>
                          <div className="join-field">
                            <label>{lang === 'fr' ? 'Description EN *' : 'Description EN *'}</label>
                            <textarea rows={3}
                              value={details.bio_en || ''}
                              placeholder={lang === 'fr' ? '2-3 phrases en anglais' : '2-3 sentences in English'}
                              onChange={e => setForm(f => ({
                                ...f,
                                pratiques_details: {
                                  ...f.pratiques_details,
                                  [slug]: { ...f.pratiques_details[slug], bio_en: e.target.value }
                                }
                              }))} />
                          </div>
                        </div>

                        {/* Offres */}
                        <p className="join-offres-label">
                          {lang === 'fr' ? 'Offres & tarifs' : 'Offers & pricing'}
                        </p>
                        {(details.offres || []).map((offre, i) => (
                          <div key={i} className="join-offre-block">
                            <div className="join-offre-block__header">
                              <span className="join-offre-block__num">Offre {i + 1}</span>
                              <button type="button" className="join-offre-remove"
                                onClick={() => setForm(f => ({
                                  ...f,
                                  pratiques_details: {
                                    ...f.pratiques_details,
                                    [slug]: {
                                      ...f.pratiques_details[slug],
                                      offres: f.pratiques_details[slug].offres.filter((_, j) => j !== i)
                                    }
                                  }
                                }))}>
                                ✕
                              </button>
                            </div>
                            <div className="join-row">
                              <div className="join-field">
                                <label>{lang === 'fr' ? 'Titre FR *' : 'Title FR *'}</label>
                                <input value={offre.titre_fr || ''}
                                  placeholder={lang === 'fr' ? 'ex: Séance Reiki adulte 1h' : 'e.g. Adult Reiki session 1h'}
                                  onChange={e => setForm(f => {
                                    const offres = [...f.pratiques_details[slug].offres]
                                    offres[i] = { ...offres[i], titre_fr: e.target.value }
                                    return { ...f, pratiques_details: { ...f.pratiques_details, [slug]: { ...f.pratiques_details[slug], offres } } }
                                  })} />
                              </div>
                              <div className="join-field">
                                <label>{lang === 'fr' ? 'Titre EN *' : 'Title EN *'}</label>
                                <input value={offre.titre_en || ''}
                                  placeholder="e.g. Adult Reiki session 1h"
                                  onChange={e => setForm(f => {
                                    const offres = [...f.pratiques_details[slug].offres]
                                    offres[i] = { ...offres[i], titre_en: e.target.value }
                                    return { ...f, pratiques_details: { ...f.pratiques_details, [slug]: { ...f.pratiques_details[slug], offres } } }
                                  })} />
                              </div>
                            </div>
                            <div className="join-row">
                              <div className="join-field">
                                <label>{lang === 'fr' ? 'Description FR' : 'Description FR'}</label>
                                <textarea rows={2} value={offre.description_fr || ''}
                                  onChange={e => setForm(f => {
                                    const offres = [...f.pratiques_details[slug].offres]
                                    offres[i] = { ...offres[i], description_fr: e.target.value }
                                    return { ...f, pratiques_details: { ...f.pratiques_details, [slug]: { ...f.pratiques_details[slug], offres } } }
                                  })} />
                              </div>
                              <div className="join-field">
                                <label>{lang === 'fr' ? 'Description EN' : 'Description EN'}</label>
                                <textarea rows={2} value={offre.description_en || ''}
                                  onChange={e => setForm(f => {
                                    const offres = [...f.pratiques_details[slug].offres]
                                    offres[i] = { ...offres[i], description_en: e.target.value }
                                    return { ...f, pratiques_details: { ...f.pratiques_details, [slug]: { ...f.pratiques_details[slug], offres } } }
                                  })} />
                              </div>
                            </div>
                            <div className="join-row">
                              <div className="join-field">
                                <label>{lang === 'fr' ? 'Prix (€)' : 'Price (€)'}</label>
                                <input type="number" min="0" value={offre.prix || ''}
                                  placeholder="ex: 80"
                                  onChange={e => setForm(f => {
                                    const offres = [...f.pratiques_details[slug].offres]
                                    offres[i] = { ...offres[i], prix: e.target.value }
                                    return { ...f, pratiques_details: { ...f.pratiques_details, [slug]: { ...f.pratiques_details[slug], offres } } }
                                  })} />
                              </div>
                              <div className="join-field">
                                <label>{lang === 'fr' ? 'Durée (minutes) *' : 'Duration (minutes) *'}</label>
                                <input
                                  type="number"
                                  min="1"
                                  required
                                  value={offre.duree || ''}
                                  placeholder="ex: 60"
                                  onChange={e => setForm(f => {
                                    const offres = [...f.pratiques_details[slug].offres]
                                    offres[i] = { ...offres[i], duree: e.target.value }
                                    return { ...f, pratiques_details: { ...f.pratiques_details, [slug]: { ...f.pratiques_details[slug], offres } } }
                                  })} />
                              </div>
                            </div>
                          </div>
                        ))}

                        <button type="button" className="join-offre-add"
                          onClick={() => setForm(f => ({
                            ...f,
                            pratiques_details: {
                              ...f.pratiques_details,
                              [slug]: {
                                ...f.pratiques_details[slug],
                                offres: [...(f.pratiques_details[slug]?.offres || []), { titre_fr: '', titre_en: '', description_fr: '', description_en: '', prix: '', duree: '' }]
                              }
                            }
                          }))}>
                          {lang === 'fr' ? '+ Ajouter une offre' : '+ Add an offer'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Public cible */}
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

              <div className="join-row">
                <div className="join-field">
                  <label>{lang === 'fr' ? 'Bio générale FR *' : 'General bio FR *'}</label>
                  <textarea required rows={3} value={form.bio_fr}
                    placeholder={lang === 'fr' ? '1-2 phrases de présentation générale en français' : '1-2 general introduction sentences in French'}
                    onChange={e => setForm({ ...form, bio_fr: e.target.value })} />
                </div>
                <div className="join-field">
                  <label>{lang === 'fr' ? 'Bio générale EN *' : 'General bio EN *'}</label>
                  <textarea required rows={3} value={form.bio_en}
                    placeholder={lang === 'fr' ? '1-2 phrases de présentation générale en anglais' : '1-2 general introduction sentences in English'}
                    onChange={e => setForm({ ...form, bio_en: e.target.value })} />
                </div>
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
              <label>{lang === 'fr' ? 'Format *' : 'Format *'}</label>
              <div className="join-checkboxes join-checkboxes--row">
                {[
                  { value: 'in-person', fr: 'En personne', en: 'In person' },
                  { value: 'home', fr: 'À domicile', en: 'Home visit' },
                  { value: 'visio', fr: 'En visio', en: 'Online' },
                ].map(opt => {
                  const current = form.mode_exercice ? form.mode_exercice.split(',').map(s => s.trim()) : []
                  const checked = current.includes(opt.value)
                  return (
                    <label key={opt.value} className="join-checkbox">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const updated = checked
                            ? current.filter(v => v !== opt.value)
                            : [...current, opt.value]
                          setForm(f => ({ ...f, mode_exercice: updated.join(', ') }))
                        }}
                      />
                      {lang === 'fr' ? opt.fr : opt.en}
                    </label>
                  )
                })}
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
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotos}
                style={{ display: 'none' }}
              />
              <label htmlFor="photo-upload" className="join-file-btn">
                {uploading
                  ? (lang === 'fr' ? 'Upload en cours...' : 'Uploading...')
                  : (lang === 'fr' ? 'Choisir des photos' : 'Choose photos')}
              </label>
              {form.photos.length > 0 && (
                <>
                  <p className="join-hint">
                    {lang === 'fr'
                      ? 'Cliquez sur une photo pour la définir comme photo de profil principale'
                      : 'Click on a photo to set it as your main profile picture'}
                  </p>
                  <div className="join-photos-select">
                    {form.photos.map((url, i) => (
                      <div
                        key={i}
                        className={`join-photo-item ${form.main_photo === url ? 'join-photo-item--selected' : ''}`}
                        onClick={() => setForm(f => ({ ...f, main_photo: url }))}
                      >
                        <img src={url} alt={`photo ${i + 1}`} />
                        {form.main_photo === url && (
                          <div className="join-photo-item__badge">
                            {lang === 'fr' ? 'Principal' : 'Main'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
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

          <div className="join-contact">
            <p>
              {lang === 'fr' ? (
                <>Vous avez des questions ? <a href="mailto:contact@theidalafamily.com" className="join-contact__link">Contactez-nous</a></>
              ) : (
                <>Any questions? <a href="mailto:contact@theidalafamily.com" className="join-contact__link">Contact us</a></>
              )}
            </p>
          </div>

        </form>
      </div>
    </>
  )
}
