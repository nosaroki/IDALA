/* eslint-env node */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import readline from 'readline'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BUCKET = 'photos-praticiens'

// ============================================================
// LISTE DE PROTECTION : ces fichiers ne seront JAMAIS supprimes,
// meme s'ils apparaissent comme orphelins (ils sont utilises
// via du code en dur, pas via la base de donnees).
// ============================================================
const PROTECTED = [
  'banners/banner_entreprise.jpg',
  'banners/banner_retraite.jpg',
]

// --- Lister tous les fichiers du Storage (recursif) ---
async function listAllFiles(prefix = '') {
  const files = []
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(prefix, { limit: 1000 })
  if (error) {
    console.error(`Erreur listing ${prefix}:`, error.message)
    return files
  }
  for (const item of data) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name
    if (item.id === null) {
      const sub = await listAllFiles(fullPath)
      files.push(...sub)
    } else {
      files.push(fullPath)
    }
  }
  return files
}

// --- Recolter toutes les URLs de photos referencees en base ---
async function getReferencedPaths() {
  const urls = new Set()
  const addUrl = (u) => { if (u && typeof u === 'string') urls.add(u.trim()) }
  const addArray = (arr) => { if (Array.isArray(arr)) arr.forEach(addUrl) }

  const { data: praticiens } = await supabase
    .from('praticiens').select('photo_url, photos_urls')
  praticiens?.forEach(p => { addUrl(p.photo_url); addArray(p.photos_urls) })

  const { data: pp } = await supabase
    .from('praticien_pratiques').select('photo_url')
  pp?.forEach(x => addUrl(x.photo_url))

  const { data: cand } = await supabase
    .from('candidatures').select('photos_urls, main_photo')
  cand?.forEach(c => { addArray(c.photos_urls); addUrl(c.main_photo) })

  const { data: prat } = await supabase
    .from('pratiques').select('banner_image_url')
  prat?.forEach(p => addUrl(p.banner_image_url))

  const paths = new Set()
  for (const url of urls) {
    const marker = `/object/public/${BUCKET}/`
    const idx = url.indexOf(marker)
    if (idx === -1) continue
    let path = url.substring(idx + marker.length).split('?')[0]
    paths.add(decodeURIComponent(path))
  }
  return paths
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans) }))
}

async function main() {
  console.log('Analyse en cours...\n')

  const allFiles = await listAllFiles()
  const referencedPaths = await getReferencedPaths()

  // Orphelines = pas referencees en base ET pas dans la liste protegee
  const orphans = allFiles.filter(f =>
    !referencedPaths.has(f) && !PROTECTED.includes(f)
  )

  // Verification de securite : afficher les fichiers proteges trouves
  const protectedFound = allFiles.filter(f => PROTECTED.includes(f))

  console.log('='.repeat(60))
  console.log('FICHIERS PROTEGES (ne seront PAS supprimes)')
  console.log('='.repeat(60))
  protectedFound.forEach(f => console.log('  PROTEGE  ' + f))

  console.log('\n' + '='.repeat(60))
  console.log(`FICHIERS A SUPPRIMER : ${orphans.length}`)
  console.log('='.repeat(60))
  orphans.forEach(f => console.log('  SUPPRIMER  ' + f))

  console.log('\n' + '='.repeat(60))
  console.log(`Total Storage : ${allFiles.length}`)
  console.log(`A supprimer   : ${orphans.length}`)
  console.log(`Restera       : ${allFiles.length - orphans.length}`)
  console.log('='.repeat(60))

  if (orphans.length === 0) {
    console.log('\nRien a supprimer.')
    return
  }

  const answer = await ask('\nTape OUI (en majuscules) pour confirmer la suppression : ')
  if (answer !== 'OUI') {
    console.log('Annule. Aucune photo supprimee.')
    return
  }

  console.log('\nSuppression en cours...')
  // Supabase supprime par lots
  const { data, error } = await supabase.storage.from(BUCKET).remove(orphans)
  if (error) {
    console.error('Erreur lors de la suppression :', error.message)
    return
  }
  console.log(`\nTermine. ${data.length} fichiers supprimes.`)
}

main()