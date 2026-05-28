/* eslint-env node */
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import 'dotenv/config'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BUCKET = 'photos-praticiens'

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
    // Si c'est un dossier (pas de metadata = dossier), on explore récursivement
    if (item.id === null) {
      const sub = await listAllFiles(fullPath)
      files.push(...sub)
    } else {
      files.push(fullPath)
    }
  }
  return files
}

async function backupPhotos() {
  const date = new Date().toISOString().split('T')[0]
  const backupDir = path.join('backups', date, 'photos')
  fs.mkdirSync(backupDir, { recursive: true })

  console.log('📸 Listing des photos...')
  const files = await listAllFiles()
  console.log(`   ${files.length} fichiers trouvés`)

  let ok = 0
  for (const filePath of files) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(filePath)

    if (error) {
      console.error(`   ❌ ${filePath}: ${error.message}`)
      continue
    }

    const localPath = path.join(backupDir, filePath)
    fs.mkdirSync(path.dirname(localPath), { recursive: true })
    const buffer = Buffer.from(await data.arrayBuffer())
    fs.writeFileSync(localPath, buffer)
    ok++
    console.log(`   ${ok}/${files.length} ${filePath}`)

  }

  console.log(`✅ ${ok}/${files.length} photos sauvegardées dans ${backupDir}`)
}

backupPhotos()