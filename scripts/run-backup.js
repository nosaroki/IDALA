/* eslint-env node */
import 'dotenv/config'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const date = new Date().toISOString().split('T')[0]
const backupDir = path.join('backups', date)
fs.mkdirSync(backupDir, { recursive: true })

console.log(`\n🗂️  Backup Idala du ${date}\n${'='.repeat(40)}`)

// 1. Backup base de données avec pg_dump
try {
  console.log('\n💾 Sauvegarde de la base de données...')
  const dbUrl = `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.qpdevexolzjqeyjjehjf.supabase.co:5432/postgres`
  const outFile = path.join(backupDir, 'db-backup.sql')
  execSync(`pg_dump "${dbUrl}" -f "${outFile}" --no-owner --no-privileges`, {
    stdio: 'inherit'
  })
  const sizeKo = (fs.statSync(outFile).size / 1024).toFixed(1)
  console.log(`✅ Base de données sauvegardée (${sizeKo} Ko)`)
} catch (e) {
  console.error('❌ Erreur backup base de données:', e.message)
}

// 2. Backup photos
try {
  console.log('\n📸 Sauvegarde des photos...')
  execSync('node scripts/backup-photos.js', { stdio: 'inherit' })
} catch (e) {
  console.error('❌ Erreur backup photos:', e.message)
}

console.log(`\n${'='.repeat(40)}\n✨ Backup terminé : ${backupDir}\n`)