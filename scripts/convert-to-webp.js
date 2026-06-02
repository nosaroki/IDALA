/* eslint-env node */
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const ASSETS_DIR = 'src/assets'
const QUALITY = 80          // 80 = excellent compromis qualite/poids
const MAX_WIDTH = 800       // redimensionne si plus large que 800px
const EXTENSIONS = ['.jpg', '.jpeg', '.png']

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

async function convertImage(inputPath) {
  const ext = path.extname(inputPath).toLowerCase()
  if (!EXTENSIONS.includes(ext)) return null

  const dir = path.dirname(inputPath)
  const basename = path.basename(inputPath, ext)
  const outputPath = path.join(dir, `${basename}.webp`)

  const originalSize = fs.statSync(inputPath).size

  const image = sharp(inputPath)
  const metadata = await image.metadata()

  // Redimensionne si trop large
  if (metadata.width > MAX_WIDTH) {
    image.resize({ width: MAX_WIDTH, withoutEnlargement: true })
  }

  await image.webp({ quality: QUALITY }).toFile(outputPath)
  const newSize = fs.statSync(outputPath).size

  return {
    input: inputPath,
    output: outputPath,
    originalSize,
    newSize,
    width: metadata.width,
    height: metadata.height,
    resized: metadata.width > MAX_WIDTH,
  }
}

async function main() {
  console.log('\n=== CONVERSION WEBP ===\n')
  console.log(`Qualite : ${QUALITY}`)
  console.log(`Largeur max : ${MAX_WIDTH}px`)
  console.log(`Dossier : ${ASSETS_DIR}\n`)

  const allFiles = listFiles(ASSETS_DIR)
  const images = allFiles.filter(f => EXTENSIONS.includes(path.extname(f).toLowerCase()))

  console.log(`${images.length} image(s) a convertir.\n`)

  let totalOriginal = 0
  let totalNew = 0

  for (const img of images) {
    try {
      const result = await convertImage(img)
      if (!result) continue
      totalOriginal += result.originalSize
      totalNew += result.newSize
      const gain = (100 - (result.newSize / result.originalSize) * 100).toFixed(0)
      const origKo = (result.originalSize / 1024).toFixed(0)
      const newKo = (result.newSize / 1024).toFixed(0)
      const resizeFlag = result.resized ? ` [redimensionnee ${result.width}->${MAX_WIDTH}]` : ''
      console.log(`✅ ${result.input}`)
      console.log(`   ${origKo} Ko -> ${newKo} Ko (-${gain}%)${resizeFlag}`)
    } catch (err) {
      console.error(`❌ ${img} : ${err.message}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('RESUME')
  console.log('='.repeat(60))
  console.log(`Poids original total : ${(totalOriginal / 1024 / 1024).toFixed(1)} Mo`)
  console.log(`Poids WebP total     : ${(totalNew / 1024 / 1024).toFixed(1)} Mo`)
  console.log(`Gain                 : ${((totalOriginal - totalNew) / 1024 / 1024).toFixed(1)} Mo (-${(100 - (totalNew / totalOriginal) * 100).toFixed(0)}%)`)
  console.log('\nLes originaux sont conserves. A toi de modifier les imports puis supprimer.')
}

main()