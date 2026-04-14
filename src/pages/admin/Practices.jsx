import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Practices() {
  const [pratiques, setPratiques] = useState([])
  const [form, setForm]           = useState({
    slug: '', nom: '', banner_message: '',
    banner_image_url: '', meta_title: '', meta_description: ''
  })
  const [editing, setEditing]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const navigate                  = useNavigate()

  async function fetchPratiques() {
    const { data } = await supabase.from('pratiques').select('*').order('nom')
    setPratiques(data || [])
    setLoading(false)
  }

useEffect(() => {
  async function load() {
    await fetchPratiques()
  }
  load()
}, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (editing) {
      await supabase.from('pratiques').update(form).eq('id', editing)
    } else {
      await supabase.from('pratiques').insert(form)
    }
    setForm({ slug: '', nom: '', banner_message: '', banner_image_url: '', meta_title: '', meta_description: '' })
    setEditing(null)
    fetchPratiques()
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cette pratique ?')) return
    await supabase.from('pratiques').delete().eq('id', id)
    fetchPratiques()
  }

  function handleEdit(p) {
    setEditing(p.id)
    setForm({
      slug: p.slug, nom: p.nom,
      banner_message: p.banner_message || '',
      banner_image_url: p.banner_image_url || '',
      meta_title: p.meta_title || '',
      meta_description: p.meta_description || ''
    })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Pratiques</h1>
        <div className="admin-header__nav">
          <button onClick={() => navigate('/admin/candidatures')} className="admin-btn admin-btn--ghost">
            Candidatures
          </button>
          <button onClick={() => navigate('/admin/praticiens')} className="admin-btn admin-btn--ghost">
            Praticiens
          </button>
          <button onClick={handleLogout} className="admin-btn admin-btn--ghost">
            Déconnexion
          </button>
        </div>
      </div>

      {/* Formulaire */}
      <div className="admin-form-block">
        <h2>{editing ? 'Modifier la pratique' : 'Ajouter une pratique'}</h2>
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-form__row">
            <label>Nom *
              <input required value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })} />
            </label>
            <label>
              <span>Slug * <span className="admin-hint">(ex: yoga, osteopathie)</span></span>
              <input required value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s/g, '-') })} />
            </label>
          </div>
          <label>Message bannière
            <input value={form.banner_message}
              onChange={e => setForm({ ...form, banner_message: e.target.value })} />
          </label>
          <label>URL image bannière
            <input value={form.banner_image_url}
              onChange={e => setForm({ ...form, banner_image_url: e.target.value })} />
          </label>
          <label>Meta title
            <input value={form.meta_title}
              onChange={e => setForm({ ...form, meta_title: e.target.value })} />
          </label>
          <label>Meta description
            <textarea value={form.meta_description} rows={3}
              onChange={e => setForm({ ...form, meta_description: e.target.value })} />
          </label>
          <div className="admin-form__actions">
            <button type="submit" className="admin-btn admin-btn--primary">
              {editing ? 'Enregistrer' : 'Ajouter'}
            </button>
            {editing && (
              <button type="button" className="admin-btn admin-btn--ghost"
                onClick={() => { setEditing(null); setForm({ slug: '', nom: '', banner_message: '', banner_image_url: '', meta_title: '', meta_description: '' }) }}>
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Liste */}
      <div className="admin-table-block">
        <h2>Liste ({pratiques.length})</h2>
        {loading ? <p>Chargement...</p> : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nom</th><th>Slug</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pratiques.map(p => (
                <tr key={p.id}>
                  <td>{p.nom}</td>
                  <td><code>{p.slug}</code></td>
                  <td>
                    <button onClick={() => handleEdit(p)} className="admin-btn admin-btn--sm">Modifier</button>
                    <button onClick={() => handleDelete(p.id)} className="admin-btn admin-btn--sm admin-btn--danger">Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}