/* eslint-env node */
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const ASSETS_DIR = 'src/assets'
const MAX_WIDTH = 800
const QUALITY = 80

function listFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  const items = fs.readdirSync(dir, { withFileTypes: true })
  for (const item of items) {
    const fullPath = path.join(dir, item.name)
    if (item.isDirectory()) {
      listFiles(fullPath, files)
    } else if (item.name.toLowerCase().endsWith('.webp')) {
      files.push(fullPath)
    }
  }
  return files
}

async function main() {
  console.log('\n=== REDIMENSIONNEMENT WEBP ===\n')
  console.log(`Largeur max : ${MAX_WIDTH}px`)
  console.log(`Qualite : ${QUALITY}\n`)

  const images = listFiles(ASSETS_DIR)
  console.log(`${images.length} image(s) WebP a verifier.\n`)

  let totalBefore = 0
  let totalAfter = 0
  let resizedCount = 0

  for (const img of images) {
    try {
      const sizeBefore = fs.statSync(img).size
      totalBefore += sizeBefore

      const metadata = await sharp(img).metadata()

      if (metadata.width <= MAX_WIDTH) {
        totalAfter += sizeBefore
        console.log(`⏭️  ${img} (${metadata.width}px, deja OK)`)
        continue
      }

      // Lire en buffer pour pouvoir ecraser le fichier source
      const buffer = await sharp(img)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toBuffer()

      fs.writeFileSync(img, buffer)
      const sizeAfter = buffer.length
      totalAfter += sizeAfter
      resizedCount++

      const gain = (100 - (sizeAfter / sizeBefore) * 100).toFixed(0)
      const koBefore = (sizeBefore / 1024).toFixed(0)
      const koAfter = (sizeAfter / 1024).toFixed(0)
      console.log(`✅ ${img}`)
      console.log(`   ${metadata.width}px -> ${MAX_WIDTH}px : ${koBefore} Ko -> ${koAfter} Ko (-${gain}%)`)
    } catch (err) {
      console.error(`❌ ${img} : ${err.message}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('RESUME')
  console.log('='.repeat(60))
  console.log(`Images redimensionnees : ${resizedCount}`)
  console.log(`Poids avant : ${(totalBefore / 1024 / 1024).toFixed(2)} Mo`)
  console.log(`Poids apres : ${(totalAfter / 1024 / 1024).toFixed(2)} Mo`)
  if (totalBefore > 0) {
    console.log(`Gain        : ${((totalBefore - totalAfter) / 1024 / 1024).toFixed(2)} Mo (-${(100 - (totalAfter / totalBefore) * 100).toFixed(0)}%)`)
  }
}

main()