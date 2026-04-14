import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AdminPractitionerForm({ initial, pratiques, onSave, onCancel }) {
  const emptyForm = {
  prenom: '', nom: '', localisation: '',
  lien_reservation: '', pratique_id: '', actif: true, photo_url: '',
  bio: '', slug: ''
}
const [form, setForm]           = useState(initial || emptyForm)
const [uploading, setUploading] = useState(false)

useEffect(() => {
  setTimeout(() => {
    setForm(prev => ({
      ...(initial || emptyForm),
      photo_url: prev.photo_url || initial?.photo_url || ''
    }))
  }, 0)
}, [initial?.id])
  
  async function handlePhoto(e) {
    console.log('handlePhoto déclenché', e.target.files)
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const ext      = file.name.split('.').pop()
    const filename = `${Date.now()}.${ext}`
    const { data, error } = await supabase.storage
      .from('photos-praticiens')
      .upload(filename, file, { upsert: true })

       console.log('upload data:', data)
  console.log('upload error:', error)

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
    console.log('form soumis:', form)
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="admin-form">
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
        <label>Localisation
          <input value={form.localisation}
            onChange={e => setForm({ ...form, localisation: e.target.value })} />
        </label>
        <label>Pratique *
          <select required value={form.pratique_id}
            onChange={e => setForm({ ...form, pratique_id: e.target.value })}>
            <option value="">Sélectionner...</option>
            {pratiques.map(p => (
              <option key={p.id} value={p.id}>{p.nom}</option>
            ))}
          </select>
        </label>
      </div>
      <label>Lien de réservation
        <input value={form.lien_reservation}
          onChange={e => setForm({ ...form, lien_reservation: e.target.value })} />
      </label>
      <label>Bio courte
        <textarea
          value={form.bio || ''}
          rows={3}
          placeholder="Présentation courte du praticien (2-3 phrases max)"
          onChange={e => setForm({ ...form, bio: e.target.value })}
        />
      </label>
      <label>Bio complète
        <textarea
          value={form.bio_complete || ''}
          rows={6}
          placeholder="Présentation détaillée, parcours, approche, spécialités..."
          onChange={e => setForm({ ...form, bio_complete: e.target.value })}
        />
      </label>
      <label>Mode d'exercice
        <select
          value={form.mode_exercice || 'in-person'}
          onChange={e => setForm({ ...form, mode_exercice: e.target.value })}>
          <option value="in-person">En personne</option>
          <option value="online">En ligne</option>
          <option value="both">En personne & en ligne</option>
        </select>
      </label>
      <label>Slug <span className="admin-hint">(ex: marie-dupont — généré auto si vide)</span>
        <input
          value={form.slug || ''}
          onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s/g, '-') })}
        />
      </label>
      <label>Photo
        <input type="file" accept="image/*" onChange={handlePhoto} />
        {uploading && <span className="admin-hint">Upload en cours...</span>}
        {form.photo_url && (
          <img src={form.photo_url} alt="preview"
            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 2, marginTop: 8 }} />
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