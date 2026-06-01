/* eslint-env node */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BUCKET = 'photos-praticiens'

// --- 1. Lister tous les fichiers du Storage (recursif) ---
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

// --- 2. Recolter toutes les URLs de photos referencees en base ---
async function getReferencedUrls() {
  const urls = new Set()

  const addUrl = (u) => {
    if (u && typeof u === 'string') urls.add(u.trim())
  }
  const addArray = (arr) => {
    if (Array.isArray(arr)) arr.forEach(addUrl)
  }

  // praticiens : photo_url + photos_urls
  const { data: praticiens } = await supabase
    .from('praticiens')
    .select('photo_url, photos_urls')
  praticiens?.forEach(p => {
    addUrl(p.photo_url)
    addArray(p.photos_urls)
  })

  // praticien_pratiques : photo_url
  const { data: pp } = await supabase
    .from('praticien_pratiques')
    .select('photo_url')
  pp?.forEach(x => addUrl(x.photo_url))

  // candidatures : photos_urls + main_photo
  const { data: cand } = await supabase
    .from('candidatures')
    .select('photos_urls, main_photo')
  cand?.forEach(c => {
    addArray(c.photos_urls)
    addUrl(c.main_photo)
  })

  // pratiques : banner_image_url
  const { data: prat } = await supabase
    .from('pratiques')
    .select('banner_image_url')
  prat?.forEach(p => addUrl(p.banner_image_url))

  return urls
}

// --- 3. Extraire le chemin de fichier depuis une URL Supabase ---
// URL type: https://xxx.supabase.co/storage/v1/object/public/photos-praticiens/candidatures/abc.jpg
// On veut: candidatures/abc.jpg
function urlToPath(url) {
  const marker = `/object/public/${BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  let path = url.substring(idx + marker.length)
  // Retirer les parametres (?format=webp&quality=90)
  path = path.split('?')[0]
  return decodeURIComponent(path)
}

async function main() {
  console.log('Analyse en cours...\n')

  const allFiles = await listAllFiles()
  console.log(`Fichiers dans le Storage : ${allFiles.length}`)

  const referencedUrls = await getReferencedUrls()
  const referencedPaths = new Set()
  for (const url of referencedUrls) {
    const p = urlToPath(url)
    if (p) referencedPaths.add(p)
  }
  console.log(`Photos referencees en base : ${referencedPaths.size}\n`)

  // Comparaison
  const used = []
  const orphans = []
  for (const file of allFiles) {
    if (referencedPaths.has(file)) {
      used.push(file)
    } else {
      orphans.push(file)
    }
  }

  console.log('='.repeat(60))
  console.log(`PHOTOS UTILISEES (a garder) : ${used.length}`)
  console.log('='.repeat(60))
  used.forEach(f => console.log('  GARDER  ' + f))

  console.log('\n' + '='.repeat(60))
  console.log(`PHOTOS ORPHELINES (supprimables) : ${orphans.length}`)
  console.log('='.repeat(60))
  orphans.forEach(f => console.log('  ORPHELIN  ' + f))

  console.log('\n' + '='.repeat(60))
  console.log('RESUME')
  console.log('='.repeat(60))
  console.log(`  Total Storage    : ${allFiles.length}`)
  console.log(`  Utilisees        : ${used.length}`)
  console.log(`  Orphelines       : ${orphans.length}`)
  console.log('\nAucune photo n\'a ete supprimee. Ce script ne fait que detecter.')
}

main()