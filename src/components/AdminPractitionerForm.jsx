import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import PhotoPositioner from './PhotoPositioner'
import OptimizedImage from "./OptimizedImage"

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

function SortableOffre({ index, pa, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${pa.pratique_id}-${index}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'default',
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        {...attributes}
        {...listeners}
        style={{
          cursor: 'grab',
          padding: '4px 8px',
          background: '#F0EAFA',
          borderRadius: '4px',
          fontSize: '11px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: '#9B6EBF',
          marginBottom: '8px',
          userSelect: 'none',
          display: 'inline-block',
        }}
      >
        ⋮⋮ Glisser pour réorganiser
      </div>
      {children}
    </div>
  )
}

export default function AdminPractitionerForm({ initial, pratiques, onSave, onCancel }) {

  const emptyForm = {
    prenom: '', nom: '',
    email: '', telephone: '', localisation: '',
    actif: true,
    photo_url: '', photos_urls: [], slug: '',
    photo_position: 'center center',
    mode_exercice: '',
    langues: '', ville: '', region: '', pays: '',
    bio_fr: '', bio_en: '',
    pratiques_associees: [],
    instagram: '', site_web: '',
    siret: '',
    cabinet_adresse: '', cabinet_code_postal: '', cabinet_ville: '',
    cabinet_digicode: '', cabinet_interphone: '', cabinet_etage: '', cabinet_complement: '',
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

  const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: { distance: 8 },
      })
    )

    function handleDragEnd(event, pa) {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = parseInt(active.id.split('-').pop())
      const newIndex = parseInt(over.id.split('-').pop())

      setForm(f => ({
        ...f,
        pratiques_associees: f.pratiques_associees.map(p =>
          p.pratique_id === pa.pratique_id
            ? { ...p, offres: arrayMove(p.offres, oldIndex, newIndex) }
            : p
        )
      }))
    }
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
      const { praticien_pratiques: _pp, pratiques: _pratiques, ...cleanInitial } = initial || {}
      const base = {
        ...(initial ? cleanInitial : emptyForm),
        photo_url: form.photo_url || initial?.photo_url || '',
        photos_urls: (initial?.photos_urls && initial.photos_urls.length > 0)
          ? initial.photos_urls
          : (initial?.photo_url ? [initial.photo_url] : []),
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
              public_cible: pp.public_cible || '',
              type_seance: pp.type_seance || '',
              photo_url: pp.photo_url || null,
              photo_position: pp.photo_position || 'center center',
              offres: (offres || []).map(o => ({
                titre_fr: o.titre_fr || '',
                titre_en: o.titre_en || '',
                description_fr: o.description_fr || '',
                description_en: o.description_en || '',
                prix: o.prix || '',
                duree: o.duree || '',
                mode_seance: o.mode_seance || '',
                max_participants: o.max_participants || 1,
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
          bio_fr: '', bio_en: '',
          public_cible: '', type_seance: '',
          photo_url: null, photo_position: 'center center',
          offres: [],
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

    async function handlePhotos(e) {
      const files = Array.from(e.target.files)
      if (!files.length) return

      if (!form.slug?.trim()) {
        alert('Veuillez d\'abord renseigner le slug du praticien avant d\'uploader des photos.')
        return
      }

      // Vérification taille : 10 MB max par fichier
      const maxSize = 10 * 1024 * 1024
      const oversized = files.filter(f => f.size > maxSize)
      if (oversized.length > 0) {
        alert('Certaines photos dépassent 10 MB. Veuillez les compresser avant l\'upload.')
        return
      }

      setUploading(true)
      const urls = []
      for (const file of files) {
        const compressed = await compressImage(file)
        const ext = 'jpg'
        const filename = `praticiens/${form.slug}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
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
        photos_urls: [...(f.photos_urls || []), ...urls],
        photo_url: f.photo_url || urls[0] || ''
      }))
      setUploading(false)
    }

    function removePhoto(url) {
      setForm(f => {
        const newPhotos = (f.photos_urls || []).filter(u => u !== url)
        return {
          ...f,
          photos_urls: newPhotos,
          photo_url: f.photo_url === url ? (newPhotos[0] || '') : f.photo_url
        }
      })
    }

function handleSubmit(e) {
  e.preventDefault()
  const offreSansMode = form.pratiques_associees
    .flatMap(p => p.offres || [])
    .find(o => o.prix && !o.mode_seance)
  if (offreSansMode) {
    alert('Chaque offre avec un prix doit avoir un mode de séance.')
    return
  }

  // Le format (mode d'exercice) n'est plus saisi à la main : on le déduit des modes
  // des offres. Chaque pratique reçoit les modes distincts de ses offres, et le
  // niveau praticien reçoit l'union de tous les modes. Les colonnes existantes
  // restent alimentées, donc tous les affichages en aval continuent de fonctionner.
  const pratiquesAvecMode = form.pratiques_associees.map(pa => {
    const modes = [...new Set((pa.offres || []).map(o => o.mode_seance).filter(Boolean))]
    return { ...pa, mode_exercice: modes.join(', ') }
  })
  const modesGlobaux = [...new Set(
    pratiquesAvecMode.flatMap(pa => pa.mode_exercice ? pa.mode_exercice.split(', ') : [])
  )]

  onSave({
    ...form,
    mode_exercice: modesGlobaux.join(', '),
    pratiques_associees: pratiquesAvecMode,
  })
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
        <div>
          <label>SIRET</label>
          <input
            type="text"
            value={form.siret || ''}
            onChange={e => setForm({ ...form, siret: e.target.value })}
          />
        </div>
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

      <label>
        <span>Slug</span> <span className="admin-hint">(ex: marie-bru)</span>
        <input value={form.slug || ''}
          readOnly={Boolean(initial)}
          onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s/g, '-') })}
          style={initial ? { background: '#f5f2fa', color: '#9B6EBF', cursor: 'not-allowed' } : undefined} />
      </label>

      {/* Adresse du cabinet */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>        
        <p className="admin-pratiques-section__title" style={{ margin: 0 }}>Adresse du cabinet</p>
        <label>Adresse
          <input value={form.cabinet_adresse || ''}
            placeholder="ex : 123 rue des bois"
            onChange={e => setForm({ ...form, cabinet_adresse: e.target.value })} />
        </label>
        <div className="admin-form__row">
          <label>Code postal
            <input value={form.cabinet_code_postal || ''}
              onChange={e => setForm({ ...form, cabinet_code_postal: e.target.value })} />
          </label>
          <label>Ville
            <input value={form.cabinet_ville || ''}
              onChange={e => setForm({ ...form, cabinet_ville: e.target.value })} />
          </label>
        </div>
        <div className="admin-form__row">
          <label>Digicode
            <input value={form.cabinet_digicode || ''}
              onChange={e => setForm({ ...form, cabinet_digicode: e.target.value })} />
          </label>
          <label>Interphone
            <input value={form.cabinet_interphone || ''}
              onChange={e => setForm({ ...form, cabinet_interphone: e.target.value })} />
          </label>
        </div>
        <div className="admin-form__row">
          <label>Étage
            <input value={form.cabinet_etage || ''}
              onChange={e => setForm({ ...form, cabinet_etage: e.target.value })} />
          </label>
          <label>Complément
            <input value={form.cabinet_complement || ''}
              onChange={e => setForm({ ...form, cabinet_complement: e.target.value })} />
          </label>
        </div>
      </div>

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

                <div className="admin-form__row">

                {/* Photo spécifique à cette pratique */}
                  <div style={{ marginTop: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px' }}>
                      Photo pour cette pratique (optionnel)
                    </label>
                    <label
                      htmlFor={`photo-upload-${pa.pratique_id}`}
                      style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        background: '#F0EAFA',
                        border: '1px solid #C5B8F0',
                        borderRadius: '6px',
                        color: '#9B6EBF',
                        fontSize: '12px',
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#E4D8F5'
                        e.target.style.borderColor = '#9B6EBF'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#F0EAFA'
                        e.target.style.borderColor = '#C5B8F0'
                      }}
                    >
                      Choisir une photo
                    </label>
                    <input
                      id={`photo-upload-${pa.pratique_id}`}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return

                        if (!form.slug?.trim()) {
                        alert('Veuillez d\'abord renseigner le slug du praticien avant d\'uploader une photo.')
                        return
                      }

                        const ext = file.name.split('.').pop()
                        const fileName = `praticiens/${form.slug}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`

                        const { data, error } = await supabase.storage
                          .from('photos-praticiens')
                          .upload(fileName, file)

                        if (error) {
                          alert('Erreur upload')
                          console.error(error)
                          return
                        }

                        const { data: { publicUrl } } = supabase.storage
                          .from('photos-praticiens')
                          .getPublicUrl(data.path)

                        const updated = form.pratiques_associees.map(p =>
                          p.pratique_id === pa.pratique_id
                            ? { ...p, photo_url: publicUrl, photo_position: 'center center' }
                            : p
                        )
                        setForm({ ...form, pratiques_associees: updated })
                      }}
                    />

                    {pa.photo_url && (
                      <div style={{ marginTop: '16px' }}>
                        <PhotoPositioner
                          src={pa.photo_url}
                          position={pa.photo_position || 'center center'}
                          onChange={(value) => {
                            const updated = form.pratiques_associees.map(p =>
                              p.pratique_id === pa.pratique_id
                                ? { ...p, photo_position: value }
                                : p
                            )
                            setForm({ ...form, pratiques_associees: updated })
                          }}
                        />
                        <img
                          src={pa.photo_url}
                          alt="Photo pratique"
                          style={{
                            width: 80,
                            height: 80,
                            objectFit: 'cover',
                            borderRadius: 4,
                            objectPosition: pa.photo_position || 'center center',
                            marginTop: '8px'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = form.pratiques_associees.map(p =>
                              p.pratique_id === pa.pratique_id
                                ? { ...p, photo_url: null, photo_position: 'center center' }
                                : p
                            )
                            setForm({ ...form, pratiques_associees: updated })
                          }}
                          style={{
                            marginLeft: '8px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            background: 'transparent',
                            border: '1px solid #C5B8F0',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          Retirer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Public cible */}
                    <div style={{ marginTop: '12px' }}>
                      <label>Public cible</label>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '4px' }}>
                        {[
                          { value: 'adults', label: 'Adultes' },
                          { value: 'children', label: 'Enfants' },
                          { value: 'seniors', label: 'Seniors' },
                          { value: 'all', label: 'Tous publics' },
                        ].map(opt => {
                          const current = pa.public_cible ? pa.public_cible.split(',').map(s => s.trim()) : []
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
                                  updatePratiqueDetail(pa.pratique_id, 'public_cible', updated.join(', '))
                                }}
                              />
                              {opt.label}
                            </label>
                          )
                        })}
                      </div>
                    </div>

                    {/* Type de séance */}
                    <div style={{ marginTop: '12px' }}>
                      <label>Type de séance</label>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '4px' }}>
                        {[
                          { value: 'individual', label: 'Individuelle' },
                          { value: 'group', label: 'Groupe' },
                          { value: 'both', label: 'Les deux' },
                        ].map(opt => (
                          <label key={opt.value} className="admin-pratique-check">
                            <input
                              type="radio"
                              name={`type_seance_${pa.pratique_id}`}
                              checked={pa.type_seance === opt.value}
                              onChange={() => updatePratiqueDetail(pa.pratique_id, 'type_seance', opt.value)}
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>
                </div>

                {/* Offres */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(event, pa)}
                >
                  <SortableContext
                    items={(pa.offres || []).map((_, i) => `${pa.pratique_id}-${i}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    {(pa.offres || []).map((offre, i) => (
                      <SortableOffre
                        key={`${pa.pratique_id}-${i}`}
                        index={i}
                        pa={pa}
                      >
                        <div className="join-offre-block">
                          <div className="join-offre-block__header">
                            <span className="join-offre-block__num">Offre {i + 1}</span>
                            <button type="button" className="join-offre-remove" aria-label="Supprimer cette offre"
                              onClick={() => {
                                const updated = form.pratiques_associees.map(p =>
                                  p.pratique_id === pa.pratique_id
                                    ? { ...p, offres: p.offres.filter((_, j) => j !== i) }
                                    : p
                                )
                          setForm(f => ({ ...f, pratiques_associees: updated }))
                        }}>✕</button>
                    </div>

                    {/* Intitulé */}
                    <p className="admin-hint" style={{ marginTop: '4px', marginBottom: '4px' }}>Intitulé</p>
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

                    {/* Descriptions */}
                    <p className="admin-hint" style={{ marginTop: '12px', marginBottom: '4px' }}>Descriptions</p>
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

                    {/* Tarif et durée */}
                    <p className="admin-hint" style={{ marginTop: '12px', marginBottom: '4px' }}>Tarif et durée</p>
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
                          }} onWheel={(e) => e.target.blur()} />
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
                          }} onWheel={(e) => e.target.blur()} />
                      </label>
                    </div>

                    {/* Modalités */}
                    <p className="admin-hint" style={{ marginTop: '12px', marginBottom: '4px' }}>Modalités</p>
                    <div className="admin-form__row">
                      <label>Mode de séance
                        <select value={offre.mode_seance || ''}
                          onChange={e => {
                            const updated = form.pratiques_associees.map(p =>
                              p.pratique_id === pa.pratique_id
                                ? { ...p, offres: p.offres.map((o, j) => j === i ? { ...o, mode_seance: e.target.value } : o) }
                                : p
                            )
                            setForm(f => ({ ...f, pratiques_associees: updated }))
                          }}>
                          <option value="">Choisir un mode</option>
                          <option value="in-person">Au cabinet</option>
                          <option value="home">À domicile</option>
                          <option value="visio">En visio</option>
                        </select>
                      </label>
                      <label>Participants max
                        <input
                          type="number"
                          min="1"
                          value={offre.max_participants || ''}
                          placeholder="ex: 1"
                          onChange={e => {
                            const updated = form.pratiques_associees.map(p =>
                              p.pratique_id === pa.pratique_id
                                ? { ...p, offres: p.offres.map((o, j) => j === i ? { ...o, max_participants: e.target.value } : o) }
                                : p
                            )
                            setForm(f => ({ ...f, pratiques_associees: updated }))
                          }} onWheel={(e) => e.target.blur()} />
                      </label>
                    </div>
                  </div>
                    </SortableOffre>
                ))}
              </SortableContext>
            </DndContext>

                <button type="button" className="join-offre-add"
                  onClick={() => {
                    const updated = form.pratiques_associees.map(p =>
                      p.pratique_id === pa.pratique_id
                        ? { ...p, offres: [...(p.offres || []), { titre_fr: '', titre_en: '', description_fr: '', description_en: '', prix: '', duree: '', mode_seance: '', max_participants: 1 }] }
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


      {/* Photos */}
      <div className="admin-photos-section">
        <p className="admin-pratiques-section__title">Photos</p>

        <input
          id="admin-photo-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotos}
          style={{ display: 'none' }}
        />
        <label htmlFor="admin-photo-upload" className="join-file-btn">
          {uploading ? 'Upload en cours...' : '+ Ajouter des photos'}
        </label>

        {form.photos_urls?.length > 0 && (
          <>
            <p className="admin-hint" style={{ marginTop: 12 }}>
              Cliquez sur une photo pour la définir comme photo principale
            </p>
            {form.photo_url && (
              <PhotoPositioner
                src={form.photo_url}
                position={form.photo_position}
                onChange={(value) => setForm(f => ({ ...f, photo_position: value }))}
              />
            )}
            <div className="join-photos-select" style={{ marginTop: 8 }}>
              {form.photos_urls.map((url, i) => (
                <div
                  key={i}
                  className={`join-photo-item ${form.photo_url === url ? 'join-photo-item--selected' : ''}`}
                  style={{ position: 'relative' }}
                >
                  <OptimizedImage src={url} alt={`Photo ${i + 1}/${form.photos_urls.length}`}
                    onClick={() => setForm(f => ({ ...f, photo_url: url }))}
                    style={{ cursor: 'pointer' }}
                  />
                  {form.photo_url === url && (
                    <div className="join-photo-item__badge">Principale</div>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(url)}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: 12,
                      lineHeight: '22px',
                      padding: 0,
                    }}
                    title="Supprimer cette photo"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

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