import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import AdminPractitionerForm from '../../components/AdminPractitionerForm'
import Toast from '../../components/Toast'

export default function PractitionersList() {
  const [toast, setToast] = useState(null)
  const [praticiens, setPraticiens] = useState([])
  const [pratiques, setPratiques]   = useState([])
  const [editing, setEditing]       = useState(null)
  const [showForm, setShowForm]     = useState(false)
  const [filterPratique, setFilter] = useState('')
  const [loading, setLoading]       = useState(true)
  const navigate                    = useNavigate()
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  async function fetchAll() {
    const [{ data: prats }, { data: practiciens }] = await Promise.all([
      supabase.from('pratiques').select('*').order('nom'),
      supabase.from('praticiens').select('*, praticien_pratiques(pratiques(nom, id))').order('nom')
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
    // eslint-disable-next-line no-unused-vars
    const { pratiques: _pratiques, pratiques_associees, praticien_pratiques, ...cleanForm } = form
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
          public_cible: pa.public_cible || '',
          type_seance: pa.type_seance || '',
          mode_exercice: pa.mode_exercice || '',
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
    setToast({ 
      message: editing ? 'Praticien modifié' : 'Praticien ajouté', 
      type: 'success' 
    })
  }

  async function handleDelete(id) {
     if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce praticien ? Cette action est irréversible.')) {
      return
    }
    if (!confirm('Supprimer ce praticien ?')) return
    const { error } = await supabase.from('praticiens').delete().eq('id', id)
    if (error) {
      setToast({ message: 'Erreur lors de la suppression', type: 'error' })
      return
    }
    fetchAll()
    setToast({ message: 'Praticien supprimé', type: 'success' })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  const filtered = praticiens.filter(p => {
    if (filterPratique && !p.praticien_pratiques?.some(pp => pp.pratiques?.id === filterPratique)) {
      return false
    }
    if (search) {
      const fullName = `${p.prenom} ${p.nom}`.toLowerCase()
      if (!fullName.includes(search.toLowerCase())) return false
    }
    return true
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage)

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

      {/* Liste */}
      <div className="admin-table-block">
        <div className="admin-table-block__header">
          <h2>Liste ({filtered.length})</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Rechercher par nom..."
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #C5B8F0',
                fontSize: '13px',
              }}
            />
            <select 
              value={filterPratique}
              onChange={e => {
                setFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="admin-select">
              <option value="">Toutes les pratiques</option>
              {pratiques.map(p => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Photo</th><th>Nom</th><th>Pratique</th>
                <th>Localisation</th><th>Actif</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map(i => (
                <tr key={i}>
                  <td><div style={{ width: 40, height: 40, background: '#F0EAFA', borderRadius: 4 }} /></td>
                  <td><div style={{ width: 120, height: 14, background: '#F0EAFA', borderRadius: 4 }} /></td>
                  <td><div style={{ width: 80, height: 14, background: '#F0EAFA', borderRadius: 4 }} /></td>
                  <td><div style={{ width: 100, height: 14, background: '#F0EAFA', borderRadius: 4 }} /></td>
                  <td><div style={{ width: 20, height: 14, background: '#F0EAFA', borderRadius: 4 }} /></td>
                  <td><div style={{ width: 140, height: 28, background: '#F0EAFA', borderRadius: 4 }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Photo</th><th>Nom</th><th>Pratique</th>
                  <th>Localisation</th><th>Actif</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(p => (
                  <tr key={p.id} style={{ opacity: p.actif ? 1 : 0.45 }}>
                    <td>
                      {p.photo_url
                        ? <img src={p.photo_url} alt={`${p.prenom} ${p.nom}`} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 2 }} />
                        : <div style={{ width: 40, height: 40, background: 'var(--pale)', borderRadius: 2 }} />
                      }
                    </td>
                    <td>{p.prenom} {p.nom}</td>
                    <td>
                      {p.praticien_pratiques?.length > 0
                        ? p.praticien_pratiques.map(pp => pp.pratiques?.nom).filter(Boolean).join(', ')
                        : '—'}
                    </td>
                    <td>
                      {[p.ville, p.pays].filter(Boolean).join(', ') || p.localisation || '—'}
                    </td>
                    <td>{p.actif ? '✓' : '—'}</td>
                    <td>
                      <button className="admin-btn admin-btn--sm"
                        onClick={async () => {
                          const { data } = await supabase
                            .from('praticiens')
                            .select('*')
                            .eq('id', p.id)
                            .single()
                          setEditing(data)
                          setShowForm(true)
                        }}>
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

            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginTop: '24px',
              }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="admin-btn admin-btn--ghost admin-btn--sm"
                >
                  ‹ Précédent
                </button>
                <span style={{ fontSize: '13px', color: '#6B5B7E' }}>
                  Page {currentPage} sur {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="admin-btn admin-btn--ghost admin-btn--sm"
                >
                  Suivant ›
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}