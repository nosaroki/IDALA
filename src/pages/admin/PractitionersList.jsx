import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import AdminPractitionerForm from '../../components/AdminPractitionerForm'

export default function PractitionersList() {
  const [praticiens, setPraticiens] = useState([])
  const [pratiques, setPratiques]   = useState([])
  const [editing, setEditing]       = useState(null)
  const [showForm, setShowForm]     = useState(false)
  const [filterPratique, setFilter] = useState('')
  const [loading, setLoading]       = useState(true)
  const navigate                    = useNavigate()

  async function fetchAll() {
    const [{ data: prats }, { data: practiciens }] = await Promise.all([
      supabase.from('pratiques').select('*').order('nom'),
      supabase.from('praticiens').select('*, pratiques(nom)').order('nom')
    ])
    setPratiques(prats || [])
    setPraticiens(practiciens || [])
    setLoading(false)
  }

useEffect(() => {
  async function load() {
    await fetchAll()
  }
  load()
}, [])

async function handleSave(form) {
  const { pratiques: _pratiques, pratiques_associees, ...cleanForm } = form
  const { id: _id, ...insertForm } = cleanForm

  let praticienId = editing?.id

  if (editing) {
    const { error } = await supabase
      .from('praticiens')
      .update(cleanForm)
      .eq('id', editing.id)
    console.log('update error:', error)
  } else {
    const { data, error } = await supabase
      .from('praticiens')
      .insert(insertForm)
      .select()
      .single()
    console.log('insert error:', error)
    praticienId = data?.id
  }

  if (praticienId && pratiques_associees) {
    const { data: oldPP } = await supabase
      .from('praticien_pratiques')
      .select('id')
      .eq('praticien_id', praticienId)

    if (oldPP) {
      for (const pp of oldPP) {
        await supabase.from('praticien_offres').delete().eq('praticien_pratique_id', pp.id)
      }
    }
    await supabase.from('praticien_pratiques').delete().eq('praticien_id', praticienId)

    for (const pa of pratiques_associees) {
      const { data: newPP } = await supabase.from('praticien_pratiques').insert({
        praticien_id: praticienId,
        pratique_id: pa.pratique_id,
        bio_fr: pa.bio_fr || '',
        bio_en: pa.bio_en || '',
      }).select().single()

      if (newPP && pa.offres?.length > 0) {
        for (let i = 0; i < pa.offres.length; i++) {
          const offre = pa.offres[i]
          await supabase.from('praticien_offres').insert({
            praticien_pratique_id: newPP.id,
            titre_fr: offre.titre_fr || '',
            titre_en: offre.titre_en || '',
            description_fr: offre.description_fr || '',
            description_en: offre.description_en || '',
            prix: offre.prix ? parseFloat(offre.prix) : null,
            duree: offre.duree || '',
            ordre: i,
          })
        }
      }
    }
  }

  setEditing(null)
  setShowForm(false)
  fetchAll()
}

  async function handleDelete(id) {
    if (!confirm('Supprimer ce praticien ?')) return
    await supabase.from('praticiens').delete().eq('id', id)
    fetchAll()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  const filtered = filterPratique
    ? praticiens.filter(p => p.pratique_id === filterPratique)
    : praticiens

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Praticiens</h1>
        <div className="admin-header__nav">
          <button onClick={() => navigate('/admin/candidatures')} className="admin-btn admin-btn--ghost">
            Candidatures
          </button>
          <button onClick={() => navigate('/admin/pratiques')} className="admin-btn admin-btn--ghost">
            Pratiques
          </button>
          <button onClick={handleLogout} className="admin-btn admin-btn--ghost">
            Déconnexion
          </button>
        </div>
      </div>

      {/* Bouton ajout */}
      {!showForm && (
        <button className="admin-btn admin-btn--primary"
          onClick={() => { setEditing(null); setShowForm(true) }}>
          + Ajouter un praticien
        </button>
      )}

      {/* Formulaire */}
      {showForm && (
        <div className="admin-form-block">
          <h2>{editing ? 'Modifier le praticien' : 'Nouveau praticien'}</h2>
          <AdminPractitionerForm
            initial={editing}
            pratiques={pratiques}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(null) }}
          />
        </div>
      )}

      {/* Filtre */}
      <div className="admin-table-block">
        <div className="admin-table-block__header">
          <h2>Liste ({filtered.length})</h2>
          <select value={filterPratique}
            onChange={e => setFilter(e.target.value)}
            className="admin-select">
            <option value="">Toutes les pratiques</option>
            {pratiques.map(p => (
              <option key={p.id} value={p.id}>{p.nom}</option>
            ))}
          </select>
        </div>

        {loading ? <p>Chargement...</p> : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Photo</th><th>Nom</th><th>Pratique</th>
                <th>Localisation</th><th>Actif</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ opacity: p.actif ? 1 : 0.45 }}>
                  <td>
                    {p.photo_url
                      ? <img src={p.photo_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 2 }} />
                      : <div style={{ width: 40, height: 40, background: 'var(--pale)', borderRadius: 2 }} />
                    }
                  </td>
                  <td>{p.prenom} {p.nom}</td>
                  <td>{p.pratiques?.nom || '—'}</td>
                  <td>{p.localisation || '—'}</td>
                  <td>{p.actif ? '✓' : '—'}</td>
                  <td>
                    <button className="admin-btn admin-btn--sm"
                      onClick={() => { setEditing(p); setShowForm(true) }}>
                      Modifier
                    </button>
                    <button className="admin-btn admin-btn--sm admin-btn--danger"
                      onClick={() => handleDelete(p.id)}>
                      Supprimer
                    </button>
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