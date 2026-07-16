import { useState, useContext, useRef, useEffect  } from 'react'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabaseClient'
import { LangCtx } from '../components/LangContext'
import { PRATIQUES } from '../constants/pratiques'
import { PUBLIC_CIBLE, TYPE_SEANCE } from '../constants/audiences'
import { MODES_EXERCICE } from '../constants/modes'
import OptimizedImage from "../components/OptimizedImage"

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

const emptyForm = {
  prenom: '', nom: '', email: '', telephone: '', siret: '',
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
  const [candidatureId] = useState(() => crypto.randomUUID())
  const [existingPraticien, setExistingPraticien] = useState(null)
  const [checkingEmail, setCheckingEmail] = useState(false)
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

      async function checkExistingEmail(email) {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setExistingPraticien(null)
        return
      }
      setCheckingEmail(true)
      const { data } = await supabase
        .from('praticiens')
        .select('id, prenom, nom, email, slug')
        .ilike('email', email.trim().toLowerCase())

      if (data?.[0]) {
        setExistingPraticien(data[0])
      } else {
        setExistingPraticien(null)
      }
      setCheckingEmail(false)
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

    async function handlePhotoPratique(e, slug) {
      const file = e.target.files?.[0]
      if (!file) return

      const maxSize = 10 * 1024 * 1024 // 10 MB
      if (file.size > maxSize) {
        setError(lang === 'fr'
          ? `La photo dépasse 10 MB. Veuillez la compresser avant l'upload.`
          : `The photo exceeds 10 MB. Please compress it before upload.`)
        return
      }

      setUploading(true)
      setError(null)

      const compressed = await compressImage(file)
      const filename = `candidatures/${candidatureId}/${slug}-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
      const { data, error } = await supabase.storage
        .from('photos-praticiens')
        .upload(filename, compressed, { upsert: true })

      if (!error) {
        const { data: urlData } = supabase.storage
          .from('photos-praticiens')
          .getPublicUrl(data.path)
        setForm(f => ({
          ...f,
          pratiques_details: {
            ...f.pratiques_details,
            [slug]: { ...f.pratiques_details[slug], photo_url: urlData.publicUrl }
          }
        }))
      } else {
        setError(lang === 'fr' ? 'Erreur lors de l\'upload.' : 'Upload error.')
      }
      setUploading(false)
    }

  function validate() {
      // Mode allégé pour praticien existant : vérifier uniquement les pratiques
        if (existingPraticien) {
          if (form.specialites.length === 0) {
            return lang === 'fr' ? 'Veuillez sélectionner au moins une spécialité.' : 'Please select at least one specialty.'
          }
          for (const slug of form.specialites) {
            const details = form.pratiques_details[slug] || {}
            if (!details.offres || details.offres.length === 0) {
              return lang === 'fr'
                ? 'Veuillez ajouter au moins une offre par spécialité.'
                : 'Please add at least one offer per specialty.'
            }
            if (!details.public_cible) {
              return lang === 'fr'
                ? 'Veuillez sélectionner un public cible pour chaque spécialité.'
                : 'Please select a target audience for each specialty.'
            }
            if (!details.type_seance) {
              return lang === 'fr'
                ? 'Veuillez sélectionner un type de séance pour chaque spécialité.'
                : 'Please select a session type for each specialty.'
            }
            if (!details.mode_exercice) {
              return lang === 'fr'
                ? 'Veuillez sélectionner un format pour chaque spécialité.'
                : 'Please select a format for each specialty.'
            }
            if (!details.public_cible) {
              return lang === 'fr'
                ? 'Veuillez sélectionner un public cible pour chaque spécialité.'
                : 'Please select a target audience for each specialty.'
            }
            if (!details.type_seance) {
              return lang === 'fr'
                ? 'Veuillez sélectionner un type de séance pour chaque spécialité.'
                : 'Please select a session type for each specialty.'
            }
            if (!details.mode_exercice) {
              return lang === 'fr'
                ? 'Veuillez sélectionner un format pour chaque spécialité.'
                : 'Please select a format for each specialty.'
            }
            for (const offre of details.offres) {
            if (!offre.titre_fr?.trim() || !offre.titre_en?.trim() || !offre.duree || !offre.mode_seance) {
                  return lang === 'fr'
                  ? 'Veuillez compléter le titre (FR/EN) et la durée pour chaque offre.'
                  : 'Please complete title (FR/EN) and duration for each offer.'
              }
            }
            if (!details.photo_url) {
              return lang === 'fr'
                ? 'Veuillez ajouter une photo pour chaque spécialité.'
                : 'Please add a photo for each specialty.'
            }
          }
          return null
        }

        // Validation complète pour nouveau praticien
    // Téléphone
    if (form.telephone) {
      const phoneClean = form.telephone.replace(/[^\d]/g, '')
      if (phoneClean.length < 8 || phoneClean.length > 15) {
        return lang === 'fr' ? 'Numéro de téléphone invalide.' : 'Invalid phone number.'
      }
    }

    // Email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return lang === 'fr' ? 'Adresse email invalide.' : 'Invalid email address.'
    }

   // SIRET
    if (!form.siret || form.siret.replace(/\s/g, '').length !== 14) {
      return lang === 'fr' 
        ? 'Veuillez entrer un numéro SIRET valide (14 chiffres).' 
        : 'Please enter a valid SIRET number (14 digits).'
    }

    // Localisation
    if (!form.ville || !form.pays) {
      return lang === 'fr' ? 'Veuillez sélectionner une ville dans la liste.' : 'Please select a city from the list.'
    }

    // Langues
    if (!form.langues_list || form.langues_list.length === 0) {
      return lang === 'fr' ? 'Veuillez sélectionner au moins une langue.' : 'Please select at least one language.'
    }

    // Spécialités
    if (form.specialites.length === 0) {
      return lang === 'fr' ? 'Veuillez sélectionner au moins une spécialité.' : 'Please select at least one specialty.'
    }

    // Détails par pratique : descriptions FR/EN + au moins une offre complète
    for (const slug of form.specialites) {
      const details = form.pratiques_details[slug] || {}
      if (!details.offres || details.offres.length === 0) {
        return lang === 'fr'
          ? `Veuillez ajouter au moins une offre par spécialité.`
          : `Please add at least one offer per specialty.`
      }
      for (const offre of details.offres) {
      if (!offre.titre_fr?.trim() || !offre.titre_en?.trim() || !offre.duree || !offre.mode_seance) {
            return lang === 'fr'
            ? 'Veuillez compléter le titre (FR/EN) et la durée pour chaque offre.'
            : 'Please complete title (FR/EN) and duration for each offer.'
        }
      }

      if (!details.photo_url) {
        return lang === 'fr'
          ? 'Veuillez ajouter une photo pour chaque spécialité.'
          : 'Please add a photo for each specialty.'
      }
    }

    // if (form.photos.length < 2) {
    //   return lang === 'fr' ? 'Veuillez uploader au moins 2 photos.' : 'Please upload at least 2 photos.'
    // }

    // // Photo principale sélectionnée
    // if (!form.main_photo) {
    //   return lang === 'fr' ? 'Veuillez sélectionner une photo principale.' : 'Please select a main photo.'
    // }

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

    const firstSlug = form.specialites[0]
    const fallbackPhoto = form.pratiques_details[firstSlug]?.photo_url || ''

    const { error } = await supabase.from('candidatures').insert({
      prenom:             form.prenom,
      nom:                form.nom,
      email:              form.email,
      telephone:          form.telephone,
      siret:              form.siret,
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
      photos_urls: form.specialites.map(s => form.pratiques_details[s]?.photo_url).filter(Boolean),
      main_photo: fallbackPhoto,
      candidature_uuid: candidatureId,
      langue_interface: lang
    })

    if (error) {     
      console.log('ERREUR INSERT CANDIDATURE:', error)
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
              : <>Thank you for your interest.<br /> We will carefully review your profile and get back to you as soon as possible.</>
            }
          </p>
          <button
            type="button"
            className="btn btn--violet-mid"
            onClick={() => {
              setForm(emptyForm)
              setSubmitted(false)
              setError(null)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            style={{ marginTop: '24px' }}
          >
            {lang === 'fr' ? 'Soumettre une autre candidature' : 'Submit another application'}
          </button>
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
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => {
                    setForm({ ...form, email: e.target.value })
                    setExistingPraticien(null)
                  }}
                  onBlur={e => checkExistingEmail(e.target.value)}
                />
                {checkingEmail && (
                  <p className="join-hint">Vérification en cours...</p>
                )}
              </div>
              {!existingPraticien && (
                <>
              <div className="join-field">
                <label>{lang === 'fr' ? 'Téléphone *' : 'Phone *'}</label>
                <input
                  required
                  value={form.telephone}
                  placeholder={lang === 'fr' ? 'ex : +33612345678' : 'e.g. +33612345678'}
                  onChange={e => {
                    let value = e.target.value
                    const hasPlus = value.startsWith('+')
                    const cleaned = value.replace(/[^\d]/g, '')
                    setForm({ ...form, telephone: hasPlus ? `+${cleaned}` : cleaned })
                  }}
                />
              </div>
              
                <div className="join-field">
                  <label>{lang === 'fr' ? 'Numéro SIRET' : 'SIRET number'}</label>
                  <input required
                    type="text"
                    value={form.siret || ''}
                    placeholder={lang === 'fr' ? 'Ex: 123 456 789 00010' : 'E.g. 123 456 789 00010'}
                    onChange={e => setForm({ ...form, siret: e.target.value })}
                  />
                </div>
                </>
              )}
            </div>
            {/* Praticien existant détecté */}
              {existingPraticien && (
                <div className="join-section" style={{
                  background: '#F0EAFA',
                  borderRadius: '12px',
                  padding: '24px',
                  marginTop: '16px',
                  marginBottom: '16px',
                }}>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '1.2rem',
                    color: '#3e295d',
                    marginBottom: '12px',
                  }}>
                    {lang === 'fr'
                      ? `Bonjour ${existingPraticien.prenom} ! Nous avons détecté que vous êtes déjà praticien chez Idala.`
                      : `Hello ${existingPraticien.prenom}! We detected that you are already a practitioner at Idala.`}
                  </p>
                  <p style={{
                    fontSize: '14px',
                    color: '#6B5B7E',
                    lineHeight: 1.6,
                    marginBottom: '16px',
                  }}>
                    {lang === 'fr'
                      ? 'Sélectionnez la ou les nouvelles pratiques que vous souhaitez ajouter à votre profil, puis remplissez les détails associés.'
                      : 'Select the new practice(s) you would like to add to your profile, then fill in the associated details.'}
                  </p>
                  <p style={{
                    fontSize: '12px',
                    color: '#9B6EBF',
                    fontStyle: 'italic',
                  }}>
                    {lang === 'fr'
                      ? 'Pour modifier vos informations personnelles, contactez-nous à contact@theidalafamily.com'
                      : 'To update your personal information, contact us at contact@theidalafamily.com'}
                  </p>
                </div>
              )}

          {!existingPraticien && (
            <>
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
           </>  
        )}
          </div>
     

          {/* ── Profil & expertise ── */}
            <div className="join-section">
              <h2 className="join-section__title">
                {lang === 'fr' ? 'Profil & expertise' : 'Profile & expertise'}
              </h2>

          {/* Bios générales */}
          {!existingPraticien && (
            <>
              <div className="join-row">
                <div className="join-field">
                  <label>{lang === 'fr' ? 'Bio générale FR *' : 'General bio FR *'}</label>
                  <textarea required rows={3} value={form.bio_fr}
                    placeholder={lang === 'fr' ? '1-2 phrases de présentation générale en français à rédiger à la première personne' : '1-2 general introduction sentences in French in the first person'}
                    onChange={e => setForm({ ...form, bio_fr: e.target.value })} />
                </div>
                <div className="join-field">
                  <label>{lang === 'fr' ? 'Bio générale EN *' : 'General bio EN *'}</label>
                  <textarea required rows={3} value={form.bio_en}
                    placeholder={lang === 'fr' ? '1-2 phrases de présentation générale en anglais à rédiger à la première personne' : '1-2 general introduction sentences in English in the first person'}
                    onChange={e => setForm({ ...form, bio_en: e.target.value })} />
                </div>
              </div>
              </>
            )}

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

                        {/* Photo de cette pratique */}
                        <div className="join-field">
                          <label>
                            {lang === 'fr'
                              ? 'Photo pour cette pratique *'
                              : 'Photo for this practice *'}
                          </label>
                          <input
                            id={`photo-${slug}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoPratique(e, slug)}
                            style={{ display: 'none' }}
                          />
                          <label htmlFor={`photo-${slug}`} className="join-file-btn">
                            {uploading
                              ? (lang === 'fr' ? 'Upload en cours...' : 'Uploading...')
                              : details.photo_url
                                ? (lang === 'fr' ? 'Changer la photo' : 'Change photo')
                                : (lang === 'fr' ? 'Choisir une photo' : 'Choose a photo')}
                          </label>
                          {details.photo_url && (
                            <div style={{ marginTop: '12px' }}>
                              <OptimizedImage
                                src={details.photo_url}
                                alt={lang === 'fr' ? 'Photo de la pratique' : 'Practice photo'}
                                style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8 }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Bio spécifique */}
                        {/* <div className="join-row">
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
                        </div> */}

                        {/* Public cible */}
                        <div className="join-field">
                          <label>{lang === 'fr' ? 'Public cible *' : 'Target audience *'}</label>
                          <div className="join-checkboxes join-checkboxes--row">
                            {PUBLIC_CIBLE.map(p => {
                              const current = details.public_cible ? details.public_cible.split(',').map(s => s.trim()) : []
                              const checked = current.includes(p.value)
                              return (
                                <label key={p.value} className="join-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      const updated = checked
                                        ? current.filter(v => v !== p.value)
                                        : [...current, p.value]
                                      setForm(f => ({
                                        ...f,
                                        pratiques_details: {
                                          ...f.pratiques_details,
                                          [slug]: { ...f.pratiques_details[slug], public_cible: updated.join(', ') }
                                        }
                                      }))
                                    }}
                                  />
                                  {lang === 'fr' ? p.fr : p.en}
                                </label>
                              )
                            })}
                          </div>
                        </div>

                        {/* Type de séance */}
                        <div className="join-field">
                          <label>{lang === 'fr' ? 'Type de séance *' : 'Session type *'}</label>
                          <div className="join-checkboxes join-checkboxes--row">
                            {TYPE_SEANCE.map(t => (
                              <label key={t.value} className="join-checkbox">
                                <input
                                  type="radio"
                                  name={`type_seance_${slug}`}
                                  value={t.value}
                                  checked={details.type_seance === t.value}
                                  onChange={() => setForm(f => ({
                                    ...f,
                                    pratiques_details: {
                                      ...f.pratiques_details,
                                      [slug]: { ...f.pratiques_details[slug], type_seance: t.value }
                                    }
                                  }))}
                                />
                                {lang === 'fr' ? t.fr : t.en}
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Mode d'exercice */}
                        {/* <div className="join-field">
                          <label>{lang === 'fr' ? 'Format *' : 'Format *'}</label>
                          <div className="join-checkboxes join-checkboxes--row">
                            {MODES_EXERCICE.map(opt => {
                              const current = details.mode_exercice ? details.mode_exercice.split(',').map(s => s.trim()) : []
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
                                      setForm(f => ({
                                        ...f,
                                        pratiques_details: {
                                          ...f.pratiques_details,
                                          [slug]: { ...f.pratiques_details[slug], mode_exercice: updated.join(', ') }
                                        }
                                      }))
                                    }}
                                  />
                                  {lang === 'fr' ? opt.fr : opt.en}
                                </label>
                              )
                            })}
                          </div>
                        </div> */}

                        {/* Offres */}
                        <p className="join-offres-label">
                          {lang === 'fr' ? 'Offres & tarifs' : 'Offers & pricing'}
                        </p>
                        {(details.offres || []).map((offre, i) => (
                          <div key={i} className="join-offre-block">
                            <div className="join-offre-block__header">
                              <span className="join-offre-block__num">Offre {i + 1}</span>
                              <button type="button" className="join-offre-remove"
                                aria-label="Supprimer cette offre"
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
                                placeholder={lang === 'fr' ? '2-3 phrases en français' : '2-3 sentences in French'}
                                  onChange={e => setForm(f => {
                                    const offres = [...f.pratiques_details[slug].offres]
                                    offres[i] = { ...offres[i], description_fr: e.target.value }
                                    return { ...f, pratiques_details: { ...f.pratiques_details, [slug]: { ...f.pratiques_details[slug], offres } } }
                                  })} />
                              </div>
                              <div className="join-field">
                                <label>{lang === 'fr' ? 'Description EN' : 'Description EN'}</label>
                                <textarea rows={2} value={offre.description_en || ''} 
                                placeholder={lang === 'fr' ? '2-3 phrases en anglais' : '2-3 sentences in English'}
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
                                <label>{lang === 'fr' ? 'Durée *' : 'Duration *'}</label>
                                <input
                                  type="number"
                                  min="1"
                                  required
                                  value={offre.duree || ''}
                                  placeholder={lang === 'fr' ? 'ex : 60' : 'e.g. 60'}
                                  onChange={e => setForm(f => {
                                    const offres = [...f.pratiques_details[slug].offres]
                                    offres[i] = { ...offres[i], duree: e.target.value }
                                    return { ...f, pratiques_details: { ...f.pratiques_details, [slug]: { ...f.pratiques_details[slug], offres } } }
                                  })} />
                              </div>
                            </div>
                            <div className="join-row">
                              <div className="join-field">
                                <label>{lang === 'fr' ? 'Mode de séance *' : 'Session mode *'}</label>
                                <select
                                  value={offre.mode_seance || ''}
                                  required
                                  onChange={e => setForm(f => {
                                    const offres = [...f.pratiques_details[slug].offres]
                                    offres[i] = { ...offres[i], mode_seance: e.target.value }
                                    return { ...f, pratiques_details: { ...f.pratiques_details, [slug]: { ...f.pratiques_details[slug], offres } } }
                                  })}>
                                  <option value="">{lang === 'fr' ? 'Choisir...' : 'Select...'}</option>
                                  <option value="visio">{lang === 'fr' ? 'En visio' : 'Online'}</option>
                                  <option value="home">{lang === 'fr' ? 'À domicile' : 'Home visit'}</option>
                                  <option value="in-person">{lang === 'fr' ? 'Au cabinet' : 'In-person'}</option>
                                </select>
                              </div>
                              <div className="join-field">
                                <label>{lang === 'fr' ? 'Participants max' : 'Max participants'}</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={offre.max_participants || 1}
                                  placeholder="1"
                                  onChange={e => setForm(f => {
                                    const offres = [...f.pratiques_details[slug].offres]
                                    offres[i] = { ...offres[i], max_participants: parseInt(e.target.value, 10) || 1 }
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
                                offres: [...(f.pratiques_details[slug]?.offres || []), { titre_fr: '', titre_en: '', description_fr: '', description_en: '', prix: '', duree: '', mode_seance: '', max_participants: 1 }]                                     }
                            }
                          }))}>
                          {lang === 'fr' ? '+ Ajouter une offre' : '+ Add an offer'}
                        </button>
                      </div>
                    )
                      
                  })}
                </div>
              )}
            {!existingPraticien && (
             <>     
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

              </>
          )}

            </div>

          {/* ── Présence en ligne ── */}
          {!existingPraticien && (
          <>
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
           </>
          )}

          {error && <p className="join-error">{error}</p>}

          <div className="join-submit">
            <button type="submit" className="btn btn--violet-mid" disabled={loading}>
              {loading
              ? (lang === 'fr' ? 'Envoi en cours...' : 'Sending...')
              : existingPraticien
                ? (lang === 'fr' ? 'Ajouter cette pratique' : 'Add this practice')
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
