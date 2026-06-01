/* eslint-env node */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BUCKET = 'photos-praticiens'

// Extrait le chemin Storage depuis une URL Supabase
function urlToStoragePath(url) {
  if (!url || typeof url !== 'string') return null
  const marker = `/object/public/${BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.substring(idx + marker.length).split('?')[0]
}

// Indique si un chemin est deja a destination (praticiens/{slug}/...)
function isAlreadyMigrated(path, slug) {
  if (!path || !slug) return false
  return path.startsWith(`praticiens/${slug}/`)
}

async function main() {
  console.log('\n=== ANALYSE MIGRATION PHOTOS (DRY RUN - aucun changement) ===\n')

  // Recuperer tous les praticiens
  const { data: praticiens, error: pErr } = await supabase
    .from('praticiens')
    .select('id, prenom, nom, slug, photo_url, photos_urls')
    .order('prenom')

  if (pErr) {
    console.error('Erreur recuperation praticiens:', pErr.message)
    return
  }

  // Recuperer toutes les pratiques associees pour avoir leurs photos
  const { data: pratiques } = await supabase
    .from('praticien_pratiques')
    .select('id, praticien_id, photo_url')

  // Indexer les pratiques par praticien
  const pratiquesByPraticien = {}
  for (const pp of (pratiques || [])) {
    if (!pratiquesByPraticien[pp.praticien_id]) {
      pratiquesByPraticien[pp.praticien_id] = []
    }
    pratiquesByPraticien[pp.praticien_id].push(pp)
  }

  let totalAMigrer = 0
  let totalDejaOk = 0
  let totalSansSlug = 0
  const operations = []

  for (const p of praticiens) {
    const slug = p.slug
    if (!slug) {
      console.log(`\n⚠️  ${p.prenom} ${p.nom} : pas de slug, IGNORE`)
      totalSansSlug++
      continue
    }

    const opsThisPraticien = []

    // 1. photo_url principale
    if (p.photo_url) {
      const path = urlToStoragePath(p.photo_url)
      if (path && !isAlreadyMigrated(path, slug)) {
        const filename = path.split('/').pop()
        const newPath = `praticiens/${slug}/${filename}`
        opsThisPraticien.push({
          type: 'photo_url (principale)',
          from: path,
          to: newPath,
          updateField: 'photo_url',
          tableId: p.id,
          table: 'praticiens',
        })
      }
    }

    // 2. photos_urls (galerie)
    if (Array.isArray(p.photos_urls)) {
      for (const url of p.photos_urls) {
        const path = urlToStoragePath(url)
        if (path && !isAlreadyMigrated(path, slug)) {
          const filename = path.split('/').pop()
          const newPath = `praticiens/${slug}/${filename}`
          opsThisPraticien.push({
            type: 'photos_urls (galerie)',
            from: path,
            to: newPath,
            updateField: 'photos_urls',
            tableId: p.id,
            table: 'praticiens',
            originalUrl: url,
          })
        }
      }
    }

    // 3. praticien_pratiques.photo_url
    const pps = pratiquesByPraticien[p.id] || []
    for (const pp of pps) {
      if (pp.photo_url) {
        const path = urlToStoragePath(pp.photo_url)
        if (path && !isAlreadyMigrated(path, slug)) {
          const filename = path.split('/').pop()
          const newPath = `praticiens/${slug}/${filename}`
          opsThisPraticien.push({
            type: 'praticien_pratiques.photo_url',
            from: path,
            to: newPath,
            updateField: 'photo_url',
            tableId: pp.id,
            table: 'praticien_pratiques',
          })
        }
      }
    }

    if (opsThisPraticien.length === 0) {
      totalDejaOk++
      console.log(`\n✅ ${p.prenom} ${p.nom} (${slug}) : deja a jour, rien a faire`)
    } else {
      totalAMigrer++
      console.log(`\n📦 ${p.prenom} ${p.nom} (${slug}) : ${opsThisPraticien.length} photo(s) a migrer`)
      for (const op of opsThisPraticien) {
        console.log(`   ${op.type}`)
        console.log(`     DE : ${op.from}`)
        console.log(`     A  : ${op.to}`)
      }
      operations.push(...opsThisPraticien)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('RESUME')
  console.log('='.repeat(60))
  console.log(`Praticiens deja a jour       : ${totalDejaOk}`)
  console.log(`Praticiens a migrer          : ${totalAMigrer}`)
  console.log(`Praticiens sans slug (ignor) : ${totalSansSlug}`)
  console.log(`TOTAL operations a faire     : ${operations.length}`)
  console.log(`\nAUCUNE modification effectuee. Verifiez la liste ci-dessus.`)
  console.log(`Si tout est correct, on lancera ensuite le script de migration reelle.`)
}

main()