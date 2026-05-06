import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import Toast from '../../components/Toast'

const STATUTS = [
  { value: 'en_attente', labelFr: 'En attente', color: '#FF9A3C' },
  { value: 'validé',     labelFr: 'Validé',     color: '#3DCC70' },
  { value: 'refusé',     labelFr: 'Refusé',     color: '#FF6B6B' },
]

const FORMAT_LABELS = {
  'in-person': 'Au cabinet',
  'home': 'À domicile',
  'visio': 'En visio',
}

const TYPE_SEANCE_LABELS = {
  'individual': 'Individuelle',
  'group': 'Groupe',
  'both': 'Les deux',
}

const PUBLIC_CIBLE_LABELS = {
  'adults': 'Adultes',
  'children': 'Enfants',
  'seniors': 'Seniors',
  'all': 'Tous publics',
}

const PRATIQUES_LABELS = {
  'yoga': 'Yoga',
  'osteotherapy': 'Ostéothérapie',
  'therapeutic-massage': 'Massage Thérapeutique',
  'acupuncture': 'Acupuncture',
  'tai-chi': 'Tai Chi',
  'qi-gong': 'Qi Gong',
  'meditation': 'Méditation',
  'breathwork': 'Breathwork',
  'coaching': 'Coaching',
  'hypnotherapy': 'Hypnothérapie',
  'reiki': 'Reiki',
  'sound-healing': 'Sound Healing',
  'naturopathy': 'Naturopathie',
}

function formatList(value, labels) {
  if (!value) return '—'
  return value.split(',')
    .map(v => v.trim())
    .map(v => labels[v] || v)
    .join(', ')
}

export default function Candidatures() {
  const [candidatures, setCandidatures] = useState([])
  const [selected, setSelected]         = useState(null)
  const [loading, setLoading]           = useState(true)
  const [filter, setFilter]             = useState('all')
  const navigate                        = useNavigate()
  const [toast, setToast] = useState(null)

  async function fetchCandidatures() {
    const { data } = await supabase
      .from('candidatures')
      .select('*')
      .order('created_at', { ascending: false })
    setCandidatures(data || [])
    setLoading(false)
  }

  useEffect(() => {
    async function load() { await fetchCandidatures() }
    load()
  }, [])

  async function handleStatut(id, statut) {
    await supabase.from('candidatures').update({ statut }).eq('id', id)
    setCandidatures(prev => prev.map(c => c.id === id ? { ...c, statut } : c))
    if (selected?.id === id) setSelected(prev => ({ ...prev, statut }))

    if (statut === 'validé' && !selected?.onboarding_sent) {
      const { data: { session } } = await supabase.auth.getSession()
      const { error } = await supabase.functions.invoke('send-onboarding', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        },
        body: {
          candidature_id: selected.id,
          prenom: selected.prenom,
          nom: selected.nom,
          email: selected.email,
        }
      })
      if (!error) {
        setCandidatures(prev => prev.map(c =>
          c.id === id ? { ...c, onboarding_sent: true } : c
        ))
        if (selected?.id === id) setSelected(prev => ({ ...prev, onboarding_sent: true }))
        setToast({ message: 'Email onboarding envoyé', type: 'success' })
      } else {
        setToast({ message: 'Erreur lors de l\'envoi', type: 'error' })
      }
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cette candidature ?')) return
    await supabase.from('candidatures').delete().eq('id', id)
    setCandidatures(prev => prev.filter(c => c.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  const filtered = filter === 'all'
    ? candidatures
    : candidatures.filter(c => c.statut === filter)

  const statutInfo = (statut) => STATUTS.find(s => s.value === statut) || STATUTS[0]

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Candidatures</h1>
        <div className="admin-header__nav">
          <button onClick={() => navigate('/admin/praticiens')} className="admin-btn admin-btn--ghost">Praticiens</button>
          <button onClick={() => navigate('/admin/pratiques')} className="admin-btn admin-btn--ghost">Pratiques</button>
          <button onClick={handleLogout} className="admin-btn admin-btn--ghost">Déconnexion</button>
        </div>
      </div>

      <div className="cand-layout">

        {/* Liste */}
        <div className="cand-list">
          <div className="cand-list__header">
            <span className="cand-count">{filtered.length} candidature{filtered.length > 1 ? 's' : ''}</span>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="admin-select">
              <option value="all">Tous les statuts</option>
              {STATUTS.map(s => (
                <option key={s.value} value={s.value}>{s.labelFr}</option>
              ))}
            </select>
          </div>

          {loading ? <p>Chargement...</p> : filtered.map(c => (
            <div
              key={c.id}
              className={`cand-item ${selected?.id === c.id ? 'cand-item--active' : ''}`}
              onClick={() => setSelected(c)}
            >
              <div className="cand-item__top">
                <span className="cand-item__name">{c.prenom} {c.nom}</span>
                <span
                  className="cand-item__statut"
                  style={{ color: statutInfo(c.statut).color, background: statutInfo(c.statut).color + '18' }}
                >
                  {statutInfo(c.statut).labelFr}
                </span>
              </div>
              <p className="cand-item__pratique">{formatList(c.pratique, PRATIQUES_LABELS)}</p>
              <p className="cand-item__date">
                {new Date(c.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
          ))}
        </div>

        {/* Détail */}
        {selected ? (
          <div className="cand-detail">
            <div className="cand-detail__header">
              <div>
                <h2 className="cand-detail__name">{selected.prenom} {selected.nom}</h2>
                <p className="cand-detail__email">{selected.email}</p>
              </div>
              <div className="cand-detail__actions">
                {STATUTS.map(s => (
                  <button
                    key={s.value}
                    className={`admin-btn admin-btn--sm ${selected.statut === s.value ? 'cand-btn--active' : ''}`}
                    style={selected.statut === s.value
                      ? { background: s.color + '22', color: s.color, border: `1px solid ${s.color}44` }
                      : {}}
                    onClick={() => handleStatut(selected.id, s.value)}
                  >
                    {s.labelFr}
                  </button>
                ))}
                <button
                  className="admin-btn admin-btn--sm admin-btn--danger"
                  onClick={() => handleDelete(selected.id)}
                >
                  Supprimer
                </button>
              </div>
            </div>

            <div className="cand-detail__body">

              {/* Informations générales */}
              <div className="cand-section">
                <h3>Informations générales</h3>
                <div className="cand-grid">
                  <div><span>Téléphone</span><p>{selected.telephone || '—'}</p></div>
                  <div><span>Ville</span><p>{selected.ville || '—'}</p></div>
                  <div><span>Pays</span><p>{selected.pays || '—'}</p></div>
                  <div><span>Langues</span><p>{selected.langues || '—'}</p></div>
                </div>
              </div>

              {/* Profil & expertise */}
              <div className="cand-section">
                <h3>Profil & expertise</h3>
                <div className="cand-grid">
                  <div><span>Spécialités</span><p>{formatList(selected.pratique, PRATIQUES_LABELS)}</p></div>
                  <div><span>Public cible</span><p>{formatList(selected.public_cible, PUBLIC_CIBLE_LABELS)}</p></div>
                  <div><span>Expérience</span><p>{selected.experience || '—'}</p></div>
                </div>
                <div><span className="cand-label">Certifications</span><p className="cand-text">{selected.certifications || '—'}</p></div>
                <div><span className="cand-label">Bio générale FR</span><p className="cand-text" style={{ whiteSpace: 'pre-wrap' }}>{selected.bio_fr || selected.motivation || '—'}</p></div>
                <div><span className="cand-label">Bio générale EN</span><p className="cand-text" style={{ whiteSpace: 'pre-wrap' }}>{selected.bio_en || '—'}</p></div>
              </div>

              {/* Pratiques détaillées */}
              {selected.pratiques_details && Object.keys(selected.pratiques_details).length > 0 && (
                <div className="cand-section">
                  <h3>Détail par pratique</h3>
                  {Object.entries(selected.pratiques_details).map(([slug, details]) => (
                    <div key={slug} className="cand-pratique-block">
                      <h4 className="cand-pratique-title">{PRATIQUES_LABELS[slug] || slug}</h4>

                      <div className="cand-grid" style={{ marginBottom: '16px' }}>
                        <div>
                          <span>Description FR</span>
                          <p style={{ whiteSpace: 'pre-wrap' }}>{details.bio_fr || '—'}</p>
                        </div>
                        <div>
                          <span>Description EN</span>
                          <p style={{ whiteSpace: 'pre-wrap' }}>{details.bio_en || '—'}</p>
                        </div>
                      </div>

                      {details.offres?.length > 0 && (
                        <div>
                          <span className="cand-label">Offres</span>
                          {details.offres.map((offre, i) => (
                            <div key={i} className="cand-offre-block" style={{
                              border: '1px solid #E4D8F5',
                              borderRadius: '8px',
                              padding: '12px',
                              marginTop: '8px',
                              background: '#FAF7FE'
                            }}>
                              <p style={{ fontWeight: 500, marginBottom: '8px' }}>
                                Offre {i + 1} : {offre.titre_fr || '—'}
                                {offre.titre_en && ` / ${offre.titre_en}`}
                              </p>
                              <div className="cand-grid">
                                <div><span>Durée</span><p>{offre.duree ? `${offre.duree} min` : '—'}</p></div>
                                <div><span>Prix</span><p>{offre.prix ? `${offre.prix} €` : '—'}</p></div>
                              </div>
                              {(offre.description_fr || offre.description_en) && (
                                <div className="cand-grid" style={{ marginTop: '8px' }}>
                                  {offre.description_fr && (
                                    <div><span>Description FR</span><p style={{ whiteSpace: 'pre-wrap' }}>{offre.description_fr}</p></div>
                                  )}
                                  {offre.description_en && (
                                    <div><span>Description EN</span><p style={{ whiteSpace: 'pre-wrap' }}>{offre.description_en}</p></div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Offres & séances (général) */}
              <div className="cand-section">
                <h3>Offres & séances</h3>
                <div className="cand-grid">
                  <div><span>Type de séance</span><p>{TYPE_SEANCE_LABELS[selected.type_seance] || '—'}</p></div>
                  <div><span>Format</span><p>{formatList(selected.mode_exercice, FORMAT_LABELS)}</p></div>
                </div>
              </div>

              {/* Présence en ligne */}
              {(selected.instagram || selected.site_web) && (
                <div className="cand-section">
                  <h3>Présence en ligne</h3>
                  <div className="cand-grid">
                    {selected.instagram && <div><span>Instagram</span><p>{selected.instagram}</p></div>}
                    {selected.site_web && <div><span>Site web</span><p><a href={selected.site_web} target="_blank" rel="noopener noreferrer">{selected.site_web}</a></p></div>}
                  </div>
                </div>
              )}

              {/* Photos */}
              {selected.photos_urls?.length > 0 && (
                <div className="cand-section">
                  <h3>Photos ({selected.photos_urls.length})</h3>
                  <div className="cand-photos">
                    {selected.photos_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`photo ${i + 1}`} />
                        {selected.main_photo === url && (
                          <span style={{
                            position: 'absolute',
                            bottom: '4px',
                            left: '4px',
                            background: '#9B6EBF',
                            color: 'white',
                            fontSize: '10px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                          }}>Principal</span>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        ) : (
          <div className="cand-empty">
            <p>{candidatures.length === 0
              ? 'Aucune candidature reçue.'
              : 'Sélectionnez une candidature pour voir le détail.'
            }</p>
          </div>
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