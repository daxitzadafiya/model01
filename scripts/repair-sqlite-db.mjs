/**
 * Repairs a corrupted local SQLite database (SQLITE_CORRUPT).
 *
 * Stop the dev server before running:
 *   npm run db:repair
 *   npm run dev
 */
import { copyFileSync, existsSync, renameSync, unlinkSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const dbPath = 'roumpos.db'

function runSqlite(args, { input, allowFailure = false } = {}) {
  const result = spawnSync('sqlite3', args, {
    input,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })

  if (result.error) {
    console.error(result.error.message)
    process.exit(1)
  }

  const output = (result.stdout || '').trim()

  if (result.status !== 0 && !allowFailure) {
    const message = (result.stderr || output).trim()
    console.error(message || `sqlite3 exited with code ${result.status}`)
    process.exit(result.status ?? 1)
  }

  return output
}

if (!existsSync(dbPath)) {
  console.error(`No ${dbPath} found.`)
  process.exit(1)
}

for (const sidecar of [`${dbPath}-wal`, `${dbPath}-shm`]) {
  if (existsSync(sidecar)) unlinkSync(sidecar)
}

const integrity = runSqlite([dbPath, 'PRAGMA integrity_check;'], { allowFailure: true })
if (integrity === 'ok') {
  console.log(`${dbPath} integrity check: ok (no repair needed)`)
  process.exit(0)
}

console.log(`${dbPath} integrity check failed — attempting recovery...`)

const backupPath = `${dbPath}.corrupt-${Date.now()}`
copyFileSync(dbPath, backupPath)
console.log(`Backed up corrupt database to ${backupPath}`)

const recoverSql = runSqlite([dbPath, '.recover'], { allowFailure: true })
if (!recoverSql) {
  console.error('Recovery produced no SQL. Restore from backup manually.')
  process.exit(1)
}

const recoveredPath = `${dbPath}.recovered`
runSqlite([recoveredPath], { input: recoverSql })

const recoveredIntegrity = runSqlite([recoveredPath, 'PRAGMA integrity_check;'])
if (recoveredIntegrity !== 'ok') {
  console.error(`Recovered database failed integrity check: ${recoveredIntegrity}`)
  unlinkSync(recoveredPath)
  process.exit(1)
}

renameSync(recoveredPath, dbPath)
for (const sidecar of [`${dbPath}-wal`, `${dbPath}-shm`]) {
  if (existsSync(sidecar)) unlinkSync(sidecar)
}

console.log(`Replaced ${dbPath} with recovered copy.`)
console.log('Run migrations: npx payload migrate')
console.log('Then start the app: npm run dev')
