/**
 * Repairs a corrupted local SQLite database (SQLITE_CORRUPT / broken indexes).
 *
 * Stop the dev server before running:
 *   npm run db:repair
 *   npm run dev
 */
import { copyFileSync, existsSync, renameSync, unlinkSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createClient } from '@libsql/client'

const dbPath = 'roumpos.db'

function removeWalSidecars() {
  for (const sidecar of [`${dbPath}-wal`, `${dbPath}-shm`]) {
    if (existsSync(sidecar)) unlinkSync(sidecar)
  }
}

function hasSqliteCli() {
  const result = spawnSync('sqlite3', ['-version'], { encoding: 'utf8' })
  return !result.error && result.status === 0
}

function runSqlite(args, { input, allowFailure = false } = {}) {
  const result = spawnSync('sqlite3', args, {
    input,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })

  if (result.error) {
    throw result.error
  }

  const output = (result.stdout || '').trim()

  if (result.status !== 0 && !allowFailure) {
    const message = (result.stderr || output).trim()
    throw new Error(message || `sqlite3 exited with code ${result.status}`)
  }

  return output
}

async function integrityCheckLibsql() {
  const client = createClient({ url: `file:${dbPath}` })
  try {
    const result = await client.execute('PRAGMA integrity_check')
    return String(result.rows[0]?.integrity_check ?? '')
  } finally {
    client.close()
  }
}

async function reindexLibsql() {
  const client = createClient({ url: `file:${dbPath}` })
  try {
    await client.execute('REINDEX')
  } finally {
    client.close()
  }
}

async function integrityCheck() {
  if (hasSqliteCli()) {
    return runSqlite([dbPath, 'PRAGMA integrity_check;'], { allowFailure: true })
  }
  return integrityCheckLibsql()
}

async function reindexDatabase() {
  if (hasSqliteCli()) {
    runSqlite([dbPath, 'REINDEX;'])
    return
  }
  await reindexLibsql()
}

async function recoverWithSqliteCli() {
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
  removeWalSidecars()

  console.log(`Replaced ${dbPath} with recovered copy.`)
  console.log('Run migrations: npx payload migrate')
  console.log('Then start the app: npm run dev')
}

if (!existsSync(dbPath)) {
  console.error(`No ${dbPath} found.`)
  process.exit(1)
}

removeWalSidecars()

let integrity = await integrityCheck()
if (integrity === 'ok') {
  console.log(`${dbPath} integrity check: ok (no repair needed)`)
  process.exit(0)
}

console.log(`${dbPath} integrity check failed: ${integrity}`)

const backupPath = `${dbPath}.bak-${Date.now()}`
copyFileSync(dbPath, backupPath)
console.log(`Backed up database to ${backupPath}`)

console.log('Attempting REINDEX...')
try {
  await reindexDatabase()
} catch (error) {
  console.error('REINDEX failed:', error instanceof Error ? error.message : error)
}

integrity = await integrityCheck()
if (integrity === 'ok') {
  removeWalSidecars()
  console.log(`${dbPath} repaired with REINDEX.`)
  console.log('Start the app: npm run dev')
  process.exit(0)
}

console.log('REINDEX did not fix the database.')

if (!hasSqliteCli()) {
  console.error(
    'Install sqlite3 for full recovery: sudo apt install sqlite3\nThen run: npm run db:repair',
  )
  process.exit(1)
}

await recoverWithSqliteCli()
