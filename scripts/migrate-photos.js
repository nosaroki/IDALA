/* eslint-env node */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import readline from 'readline'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BUCKET = 'photos-praticiens'

function urlToStoragePath(url) {
  if (!url || typeof url !== 'string') return null
  const marker = `/object/public/${BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.substring(idx + marker.length).split('?')[0]
}

function isAlreadyMigrated(path, slug) {
  if (!path || !slug) return false
  return path.startsWith(`praticiens/${slug}/`)
}

// Construit la nouvelle URL publique depuis un chemin
function pathToPublicUrl(path) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans) }))
}

// Copie un fichier dans le Storage (gere "already exists" comme un succes)
async function copyFile(fromPath, toPath) {
  const { error } = await supabase.storage.from(BUCKET).copy(fromPath, toPath)
  if (error) {
    if (error.message?.includes('already exists')) {
      return { ok: true, already: true }
    }
    return { ok: false, error: error.message }
  }
  return { ok: true, already: false }
}

async function main() {
  console.log('\n=== MIGRATION PHOTOS PRATICIENS ===\n')

  const { data: praticiens } = await supabase
    .from('praticiens')
    .select('id, prenom, nom, slug, photo_url, photos_urls')
    .order('prenom')

  const { data: pratiques } = await supabase
    .from('praticien_pratiques')
    .select('id, praticien_id, photo_url')

  const pratiquesByPraticien = {}
  for (const pp of (pratiques || [])) {
    if (!pratiquesByPraticien[pp.praticien_id]) pratiquesByPraticien[pp.praticien_id] = []
    pratiquesByPraticien[pp.praticien_id].push(pp)
  }

  // Construit le plan d'operations
  const plan = []
  for (const p of praticiens) {
    if (!p.slug) continue

    // photo_url principale
    if (p.photo_url) {
      const path = urlToStoragePath(p.photo_url)
      if (path && !isAlreadyMigrated(path, p.slug)) {
        const filename = path.split('/').pop()
        plan.push({
          praticien: `${p.prenom} ${p.nom}`,
          slug: p.slug,
          type: 'photo_url',
          tableId: p.id,
          fromPath: path,
          toPath: `praticiens/${p.slug}/${filename}`,
        })
      }
    }

    // photos_urls (galerie)
    if (Array.isArray(p.photos_urls)) {
      const newUrls = []
      let hasChange = false
      for (const url of p.photos_urls) {
        const path = urlToStoragePath(url)
        if (path && !isAlreadyMigrated(path, p.slug)) {
          const filename = path.split('/').pop()
          const newPath = `praticiens/${p.slug}/${filename}`
          plan.push({
            praticien: `${p.prenom} ${p.nom}`,
            slug: p.slug,
            type: 'photos_urls_item',
            tableId: p.id,
            fromPath: path,
            toPath: newPath,
            originalUrl: url,
          })
          newUrls.push(pathToPublicUrl(newPath))
          hasChange = true
        } else {
          newUrls.push(url)
        }
      }
      if (hasChange) {
        plan.push({
          praticien: `${p.prenom} ${p.nom}`,
          type: 'photos_urls_update',
          tableId: p.id,
          newUrls,
        })
      }
    }

    // praticien_pratiques.photo_url
    const pps = pratiquesByPraticien[p.id] || []
    for (const pp of pps) {
      if (pp.photo_url) {
        const path = urlToStoragePath(pp.photo_url)
        if (path && !isAlreadyMigrated(path, p.slug)) {
          const filename = path.split('/').pop()
          plan.push({
            praticien: `${p.prenom} ${p.nom}`,
            slug: p.slug,
            type: 'praticien_pratiques_photo',
            tableId: pp.id,
            fromPath: path,
            toPath: `praticiens/${p.slug}/${filename}`,
          })
        }
      }
    }
  }

  const copies = plan.filter(o => o.fromPath).length
  const updates = plan.filter(o => o.type === 'photos_urls_update').length
  const pratiquesUpdates = plan.filter(o => o.type === 'praticien_pratiques_photo').length
  const photoUrlUpdates = plan.filter(o => o.type === 'photo_url').length

  console.log(`Plan d'execution :`)
  console.log(`  Copies de fichiers       : ${copies}`)
  console.log(`  Mises a jour photo_url   : ${photoUrlUpdates}`)
  console.log(`  Mises a jour photos_urls : ${updates}`)
  console.log(`  Mises a jour par pratique: ${pratiquesUpdates}`)

  const answer = await ask('\nTape OUI (en majuscules) pour lancer la migration : ')
  if (answer !== 'OUI') {
    console.log('Annule.')
    return
  }

  console.log('\nExecution...\n')
  let okCount = 0
  let errCount = 0

  for (const op of plan) {
    // Operations de copie de fichier + update photo_url ou par pratique
    if (op.fromPath && op.toPath) {
      const result = await copyFile(op.fromPath, op.toPath)
      if (!result.ok) {
        console.error(`❌ Copie ${op.fromPath} → ${op.toPath} : ${result.error}`)
        errCount++
        continue
      }

      const newUrl = pathToPublicUrl(op.toPath)

      if (op.type === 'photo_url') {
        const { error } = await supabase
          .from('praticiens')
          .update({ photo_url: newUrl })
          .eq('id', op.tableId)
        if (error) {
          console.error(`❌ Update praticiens.photo_url (${op.praticien}) : ${error.message}`)
          errCount++
        } else {
          console.log(`✅ ${op.praticien} : photo_url migree`)
          okCount++
        }
      } else if (op.type === 'praticien_pratiques_photo') {
        const { error } = await supabase
          .from('praticien_pratiques')
          .update({ photo_url: newUrl })
          .eq('id', op.tableId)
        if (error) {
          console.error(`❌ Update praticien_pratiques (${op.praticien}) : ${error.message}`)
          errCount++
        } else {
          console.log(`✅ ${op.praticien} : photo par pratique migree`)
          okCount++
        }
      } else if (op.type === 'photos_urls_item') {
        // Pas d'update ici, on attend l'op 'photos_urls_update'
        console.log(`✅ ${op.praticien} : fichier galerie copie`)
        okCount++
      }
    }

    // Mise a jour du tableau complet photos_urls
    if (op.type === 'photos_urls_update') {
      const { error } = await supabase
        .from('praticiens')
        .update({ photos_urls: op.newUrls })
        .eq('id', op.tableId)
      if (error) {
        console.error(`❌ Update photos_urls (${op.praticien}) : ${error.message}`)
        errCount++
      } else {
        console.log(`✅ ${op.praticien} : tableau photos_urls mis a jour`)
        okCount++
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`RESUME : ${okCount} succes, ${errCount} erreurs`)
  console.log('='.repeat(60))
  console.log('\nLes anciens fichiers sont toujours en place (non supprimes).')
  console.log('Tu pourras les nettoyer plus tard avec le script d\'orphelines.')
}

main()