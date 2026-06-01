/* eslint-env node */
import fs from 'fs'
import path from 'path'

const SEARCH_DIR = 'src'
const FILE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx']
const ASSETS_EXTENSIONS = ['jpg', 'jpeg', 'png', 'JPG', 'JPEG', 'PNG']

function listFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  const items = fs.readdirSync(dir, { withFileTypes: true })
  for (const item of items) {
    const fullPath = path.join(dir, item.name)
    if (item.isDirectory()) {
      listFiles(fullPath, files)
    } else {
      files.push(fullPath)
    }
  }
  return files
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  const originalContent = content
  const changes = []

  // Cible uniquement les imports/require depuis '../assets/' ou './assets/' ou 'assets/'
  // Pattern : assets/...quelque-chose.jpg|jpeg|png (avec ou sans guillemets)
  for (const ext of ASSETS_EXTENSIONS) {
    const regex = new RegExp(`(assets/[^'"\\s\\)]+)\\.${ext}`, 'g')
    content = content.replace(regex, (match, p1) => {
      const newRef = `${p1}.webp`
      changes.push(`${match} -> ${newRef}`)
      return newRef
    })
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8')
    return changes
  }
  return null
}

function main() {
  console.log('\n=== MISE A JOUR DES IMPORTS VERS WEBP ===\n')

  const files = listFiles(SEARCH_DIR).filter(f =>
    FILE_EXTENSIONS.includes(path.extname(f))
  )

  let totalChanges = 0
  let filesModified = 0

  for (const file of files) {
    const changes = processFile(file)
    if (changes && changes.length > 0) {
      filesModified++
      totalChanges += changes.length
      console.log(`✅ ${file}`)
      for (const change of changes) {
        console.log(`   ${change}`)
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('RESUME')
  console.log('='.repeat(60))
  console.log(`Fichiers modifies : ${filesModified}`)
  console.log(`Changements total : ${totalChanges}`)
  console.log('\nVerifiez ensuite que le site fonctionne (npm run dev).')
}

main()