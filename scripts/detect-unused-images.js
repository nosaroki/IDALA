/* eslint-env node */
import fs from 'fs'
import path from 'path'

const ASSETS_DIR = 'src/assets'
const SEARCH_DIR = 'src'
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']

// Liste recursive tous les fichiers d'un dossier
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

// Trouve les images
const allFiles = listFiles(ASSETS_DIR)
const images = allFiles.filter(f => IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase()))

// Lit tout le code source pour chercher les references
const sourceFiles = listFiles(SEARCH_DIR).filter(f =>
  ['.js', '.jsx', '.ts', '.tsx', '.css', '.html'].includes(path.extname(f))
)

let allSourceCode = ''
for (const file of sourceFiles) {
  try {
    allSourceCode += fs.readFileSync(file, 'utf8') + '\n'
  } catch {
    // ignore
  }
}

// Pour chaque image, regarde si son nom apparait dans le code
const used = []
const unused = []
let totalUnusedSize = 0

for (const img of images) {
  const filename = path.basename(img)
  // On cherche le nom de fichier OU le chemin depuis src/assets/
  const relPath = img.replace(/^src\//, '').replace(/^\.\//, '')
  const possibleRefs = [
    filename,                          // ex: newlogo.png
    relPath,                           // ex: assets/newlogo.png
    img.replace(/^src\//, ''),         // ex: assets/practitioners/acu.jpg
  ]
  const isUsed = possibleRefs.some(ref => allSourceCode.includes(ref))
  if (isUsed) {
    used.push(img)
  } else {
    unused.push(img)
    const stats = fs.statSync(img)
    totalUnusedSize += stats.size
  }
}

console.log('\n' + '='.repeat(60))
console.log(`IMAGES UTILISEES : ${used.length}`)
console.log('='.repeat(60))
used.forEach(f => {
  const size = (fs.statSync(f).size / 1024).toFixed(0)
  console.log(`  GARDER  ${f} (${size} Ko)`)
})

console.log('\n' + '='.repeat(60))
console.log(`IMAGES NON UTILISEES : ${unused.length}`)
console.log('='.repeat(60))
unused.forEach(f => {
  const size = (fs.statSync(f).size / 1024).toFixed(0)
  console.log(`  SUPPRIMER  ${f} (${size} Ko)`)
})

console.log('\n' + '='.repeat(60))
console.log('RESUME')
console.log('='.repeat(60))
console.log(`Images utilisees    : ${used.length}`)
console.log(`Images non utilisees: ${unused.length}`)
console.log(`Espace recuperable  : ${(totalUnusedSize / 1024 / 1024).toFixed(1)} Mo`)
console.log('\nAucune suppression effectuee. Verifiez la liste avant suppression.')