import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

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

export default function AdminPractitionerForm({ initial, pratiques, onSave, onCancel }) {

  const emptyForm = {
    prenom: '', nom: '', 
    email: '', telephone: '', localisation: '',
    lien_reservation: '', actif: true,
    photo_url: '', slug: '',
    mode_exercice: 'in-person',
    iban: '', langues: '', ville: '', region: '', pays: '',
    bio_fr: '', bio_en: '',
    pratiques_associees: [],
    instagram: '', site_web: ''
  }

  const [langDropOpen, setLangDropOpen] = useState(false)
  const [langues_list, setLanguesList] = useState(
    initial?.langues ? initial.langues.split(', ').map(l => 
      LANGUAGES.find(lang => lang.label === l)?.code
    ).filter(Boolean) : []
  )
  const langRef = useRef(null)

  useEffect(() => {
  function handleClickOutside(e) {
    if (langRef.current && !langRef.current.contains(e.target)) {
      setLangDropOpen(false)
    }
  }
  document.addEventListener('mousedown', handleClickOutside)
  return () => document.removeEventListener('mousedown', handleClickOutside)
}, [])

  const [form, setForm]               = useState(initial || emptyForm)
  const [uploading, setUploading]     = useState(false)
  const [loadingPratiques, setLoadingPratiques] = useState(false)
  const [locSuggestions, setLocSuggestions] = useState([])
  const [locLoading, setLocLoading]   = useState(false)
  const locRef                        = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (locRef.current && !locRef.current.contains(e.target)) {
        setLocSuggestions([])
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setTimeout(async () => {
      const base = {
        ...(initial || emptyForm),
        photo_url: form.photo_url || initial?.photo_url || '',
        pratiques_associees: []
      }

      if (initial?.id) {
        setLoadingPratiques(true)
        const { data } = await supabase
          .from('praticien_pratiques')
          .select('*, pratiques(id, nom, slug)')
          .eq('praticien_id', initial.id)
        
        base.pratiques_associees = await Promise.all((data || []).map(async pp => {
            const { data: offres } = await supabase
              .from('praticien_offres')
              .select('*')
              .eq('praticien_pratique_id', pp.id)
              .order('ordre')

            return {
              pratique_id: pp.pratique_id,
              pratique_nom: pp.pratiques?.nom || '',
              pratique_slug: pp.pratiques?.slug || '',
              bio_fr: pp.bio_fr || '',
              bio_en: pp.bio_en || '',
              pp_id: pp.id,
              offres: (offres || []).map(o => ({
                titre_fr: o.titre_fr || '',
                titre_en: o.titre_en || '',
                description_fr: o.description_fr || '',
                description_en: o.description_en || '',
                prix: o.prix || '',
                duree: o.duree || '',
              }))
            }
          }))
        setLoadingPratiques(false)
      }

      setForm(base)
    }, 0)
  }, [initial?.id])

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

  function togglePratique(pratique) {
    const exists = form.pratiques_associees.find(p => p.pratique_id === pratique.id)
    if (exists) {
      setForm(f => ({
        ...f,
        pratiques_associees: f.pratiques_associees.filter(p => p.pratique_id !== pratique.id)
      }))
    } else {
      setForm(f => ({
        ...f,
        pratiques_associees: [...f.pratiques_associees, {
          pratique_id: pratique.id,
          pratique_nom: pratique.nom,
          pratique_slug: pratique.slug,
          bio_fr: '', bio_en: '', prix: '', duree_seance: ''
        }]
      }))
    }
  }

  function updatePratiqueDetail(pratique_id, field, value) {
    setForm(f => ({
      ...f,
      pratiques_associees: f.pratiques_associees.map(p =>
        p.pratique_id === pratique_id ? { ...p, [field]: value } : p
      )
    }))
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

async function handlePhoto(e) {
  const file = e.target.files[0]
  if (!file) return
  setUploading(true)
  const compressed = await compressImage(file)
  const filename = `${Date.now()}.jpg`
  const { data, error } = await supabase.storage
    .from('photos-praticiens')
    .upload(filename, compressed, { upsert: true })
  if (!error) {
    const { data: urlData } = supabase.storage
      .from('photos-praticiens')
      .getPublicUrl(data.path)
    setForm(f => ({ ...f, photo_url: urlData.publicUrl }))
  }
  setUploading(false)
}

function handleSubmit(e) {
  e.preventDefault()
  onSave(form)
}

  return (
    <form onSubmit={handleSubmit} className="admin-form">

      {/* Infos générales */}
      <div className="admin-form__row">
        <label>Prénom *
          <input required value={form.prenom}
            onChange={e => setForm({ ...form, prenom: e.target.value })} />
        </label>
        <label>Nom *
          <input required value={form.nom}
            onChange={e => setForm({ ...form, nom: e.target.value })} />
        </label>
      </div>

      <div className="admin-form__row">
        <label>Email
          <input type="email" value={form.email || ''}
            onChange={e => setForm({ ...form, email: e.target.value })} />
        </label>
        <label>Téléphone
          <input value={form.telephone || ''}
            placeholder="ex: +33612345678"
            onChange={e => setForm({ ...form, telephone: e.target.value })} />
        </label>
      </div>

      {/* Localisation avec autocomplétion */}
      <div className="admin-form__row">
        <label>Ville
          <div style={{ position: 'relative' }} ref={locRef}>
            <input
              value={form.ville || ''}
              placeholder="Rechercher une ville..."
              autoComplete="off"
              onChange={e => handleLocSearch(e.target.value)}
            />
            {locLoading && <span className="admin-hint">...</span>}
            {locSuggestions.length > 0 && (
              <ul className="join-loc-suggestions">
                {locSuggestions.map((r, i) => (
                  <li key={i} onClick={() => selectLocation(r)} className="join-loc-suggestion">
                    {[r.city || r.name, r.state, r.country].filter(Boolean).join(', ')}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </label>
        <label>Région
          <input value={form.region || ''} readOnly
            placeholder="Rempli automatiquement" />
        </label>
      </div>

      <div className="admin-form__row">
        <label>Pays
          <input value={form.pays || ''} readOnly
            placeholder="Rempli automatiquement" />
        </label>
       <label>Langues parlées
  <div style={{ position: 'relative' }} ref={langRef}>
    <div
      className="join-lang-trigger"
      onClick={() => setLangDropOpen(o => !o)}
    >
      {langues_list.length > 0
        ? langues_list.map(c => LANGUAGES.find(l => l.code === c)?.flag).join(' ')
          + ' ' + langues_list.map(c => LANGUAGES.find(l => l.code === c)?.label).join(', ')
        : 'Sélectionner les langues...'}
      <span className="join-lang-arrow">▾</span>
    </div>
    {langDropOpen && (
      <div className="join-lang-dropdown">
        {LANGUAGES.map(l => (
          <label key={l.code} className={`join-lang-option ${langues_list.includes(l.code) ? 'join-lang-option--selected' : ''}`}>
            <input
              type="checkbox"
              style={{ display: 'none' }}
              checked={langues_list.includes(l.code)}
              onChange={() => {
                const updated = langues_list.includes(l.code)
                  ? langues_list.filter(c => c !== l.code)
                  : [...langues_list, l.code]
                setLanguesList(updated)
                const labels = updated.map(c => LANGUAGES.find(ll => ll.code === c)?.label).filter(Boolean)
                setForm(f => ({ ...f, langues: labels.join(', ') }))
              }}
            />
            <span>{l.flag}</span>
            <span>{l.label}</span>
            {langues_list.includes(l.code) && <span className="join-lang-check">✓</span>}
          </label>
        ))}
      </div>
    )}
  </div>
</label>
      </div>

      <label>Lien de réservation
        <input value={form.lien_reservation || ''}
          onChange={e => setForm({ ...form, lien_reservation: e.target.value })} />
      </label>

      <label>IBAN
        <input value={form.iban || ''}
          placeholder="FR76..."
          onChange={e => setForm({ ...form, iban: e.target.value })} />
      </label>

      <div className="admin-form__row">
        <label>Instagram
          <input value={form.instagram || ''}
            placeholder="@handle"
            onChange={e => setForm({ ...form, instagram: e.target.value })} />
        </label>
        <label>Site web
          <input value={form.site_web || ''}
            placeholder="https://"
            onChange={e => setForm({ ...form, site_web: e.target.value })} />
        </label>
      </div>

      {/* Bios générales */}
      <div className="admin-form__row">
        <label>Bio générale FR
          <textarea rows={3} value={form.bio_fr || ''}
            placeholder="Présentation générale en français"
            onChange={e => setForm({ ...form, bio_fr: e.target.value })} />
        </label>
        <label>Bio générale EN
          <textarea rows={3} value={form.bio_en || ''}
            placeholder="General presentation in English"
            onChange={e => setForm({ ...form, bio_en: e.target.value })} />
        </label>
      </div>

     <label>Mode d'exercice</label>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {[
          { value: 'in-person', label: 'En personne' },
          { value: 'home', label: 'À domicile' },
          { value: 'visio', label: 'En visio' },
        ].map(opt => {
          const current = form.mode_exercice ? form.mode_exercice.split(',').map(s => s.trim()) : []
          const checked = current.includes(opt.value)
          return (
            <label key={opt.value} className="admin-pratique-check">
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
              {opt.label}
            </label>
          )
        })}
      </div>

      <label>
        <span>Slug</span> <span className="admin-hint">(ex: marie-bru)</span>
        <input value={form.slug || ''}
          onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s/g, '-') })} />
      </label>

      {/* Pratiques associées */}
      <div className="admin-pratiques-section">
        <p className="admin-pratiques-section__title">Pratiques</p>
        {loadingPratiques ? <p className="admin-hint">Chargement...</p> : (
          <>
            <div className="admin-pratiques-checkboxes">
              {pratiques.map(p => (
                <label key={p.id} className="admin-pratique-check">
                  <input
                    type="checkbox"
                    checked={(form.pratiques_associees || []).some(pa => pa.pratique_id === p.id)}
                    onChange={() => togglePratique(p)}
                  />
                  {p.nom}
                </label>
              ))}
            </div>

            {(form.pratiques_associees || []).map(pa => (
              <div key={pa.pratique_id} className="admin-pratique-block">
                <p className="admin-pratique-block__title">{pa.pratique_nom}</p>
                
                {/* Bio spécifique */}
                <div className="admin-form__row">
                  <label>Bio FR
                    <textarea rows={3} value={pa.bio_fr || ''}
                      placeholder="Description spécifique à cette pratique en français"
                      onChange={e => updatePratiqueDetail(pa.pratique_id, 'bio_fr', e.target.value)} />
                  </label>
                  <label>Bio EN
                    <textarea rows={3} value={pa.bio_en || ''}
                      placeholder="Practice-specific description in English"
                      onChange={e => updatePratiqueDetail(pa.pratique_id, 'bio_en', e.target.value)} />
                  </label>
                </div>

                {/* Offres */}
                <p className="join-offres-label">Offres & tarifs</p>
                {(pa.offres || []).map((offre, i) => (
                  <div key={i} className="join-offre-block">
                    <div className="join-offre-block__header">
                      <span className="join-offre-block__num">Offre {i + 1}</span>
                      <button type="button" className="join-offre-remove"
                        onClick={() => {
                          const updated = form.pratiques_associees.map(p =>
                            p.pratique_id === pa.pratique_id
                              ? { ...p, offres: p.offres.filter((_, j) => j !== i) }
                              : p
                          )
                          setForm(f => ({ ...f, pratiques_associees: updated }))
                        }}>✕</button>
                    </div>
                    <div className="admin-form__row">
                      <label>Titre FR
                        <input value={offre.titre_fr || ''}
                          placeholder="ex: Séance Reiki adulte 1h"
                          onChange={e => {
                            const updated = form.pratiques_associees.map(p =>
                              p.pratique_id === pa.pratique_id
                                ? { ...p, offres: p.offres.map((o, j) => j === i ? { ...o, titre_fr: e.target.value } : o) }
                                : p
                            )
                            setForm(f => ({ ...f, pratiques_associees: updated }))
                          }} />
                      </label>
                      <label>Titre EN
                        <input value={offre.titre_en || ''}
                          placeholder="e.g. Adult Reiki session 1h"
                          onChange={e => {
                            const updated = form.pratiques_associees.map(p =>
                              p.pratique_id === pa.pratique_id
                                ? { ...p, offres: p.offres.map((o, j) => j === i ? { ...o, titre_en: e.target.value } : o) }
                                : p
                            )
                            setForm(f => ({ ...f, pratiques_associees: updated }))
                          }} />
                      </label>
                    </div>
                    <div className="admin-form__row">
                      <label>Description FR
                        <textarea rows={2} value={offre.description_fr || ''}
                          onChange={e => {
                            const updated = form.pratiques_associees.map(p =>
                              p.pratique_id === pa.pratique_id
                                ? { ...p, offres: p.offres.map((o, j) => j === i ? { ...o, description_fr: e.target.value } : o) }
                                : p
                            )
                            setForm(f => ({ ...f, pratiques_associees: updated }))
                          }} />
                      </label>
                      <label>Description EN
                        <textarea rows={2} value={offre.description_en || ''}
                          onChange={e => {
                            const updated = form.pratiques_associees.map(p =>
                              p.pratique_id === pa.pratique_id
                                ? { ...p, offres: p.offres.map((o, j) => j === i ? { ...o, description_en: e.target.value } : o) }
                                : p
                            )
                            setForm(f => ({ ...f, pratiques_associees: updated }))
                          }} />
                      </label>
                    </div>
                    <div className="admin-form__row">
                      <label>Prix (€)
                        <input type="number" min="0" value={offre.prix || ''}
                          placeholder="ex: 80"
                          onChange={e => {
                            const updated = form.pratiques_associees.map(p =>
                              p.pratique_id === pa.pratique_id
                                ? { ...p, offres: p.offres.map((o, j) => j === i ? { ...o, prix: e.target.value } : o) }
                                : p
                            )
                            setForm(f => ({ ...f, pratiques_associees: updated }))
                          }} />
                      </label>
                      <label>Durée (minutes)
                        <input
                          type="number"
                          min="1"
                          value={offre.duree || ''}
                          placeholder="ex: 60"
                          onChange={e => {
                            const updated = form.pratiques_associees.map(p =>
                              p.pratique_id === pa.pratique_id
                                ? { ...p, offres: p.offres.map((o, j) => j === i ? { ...o, duree: e.target.value } : o) }
                                : p
                            )
                            setForm(f => ({ ...f, pratiques_associees: updated }))
                          }} />
                      </label>
                    </div>
                  </div>
                ))}

                <button type="button" className="join-offre-add"
                  onClick={() => {
                    const updated = form.pratiques_associees.map(p =>
                      p.pratique_id === pa.pratique_id
                        ? { ...p, offres: [...(p.offres || []), { titre_fr: '', titre_en: '', description_fr: '', description_en: '', prix: '', duree: '' }] }
                        : p
                    )
                    setForm(f => ({ ...f, pratiques_associees: updated }))
                  }}>
                  + Ajouter une offre
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Photo */}
      <label>Photo
        <input type="file" accept="image/*" onChange={handlePhoto} />
        {uploading && <span className="admin-hint">Upload en cours...</span>}
        {form.photo_url && (
          <img src={form.photo_url} alt="preview"
            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '50%', marginTop: 8 }} />
        )}
      </label>

      <label className="admin-form__checkbox">
        <input type="checkbox" checked={form.actif}
          onChange={e => setForm({ ...form, actif: e.target.checked })} />
        Praticien actif (visible sur le site)
      </label>

      <div className="admin-form__actions">
        <button type="submit" className="admin-btn admin-btn--primary">
          {initial ? 'Enregistrer' : 'Ajouter'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="admin-btn admin-btn--ghost">
            Annuler
          </button>
        )}
      </div>
    </form>
  )
}