import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

type SqliteDb = MigrateUpArgs['db'] | MigrateDownArgs['db']

async function tableExists(db: SqliteDb, table: string): Promise<boolean> {
  const rows = await db.all<{ name: string }>(
    sql.raw(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name = '${table.replace(/'/g, "''")}'`,
    ),
  )
  return rows.length > 0
}

async function requireTable(db: SqliteDb, table: string): Promise<void> {
  if (await tableExists(db, table)) return
  throw new Error(
    `[20261116_120000_integrations_google_analytics] Required table "${table}" does not exist. ` +
      'Run the earlier migrations that create the Integrations global tables before this one.',
  )
}

async function tableHasColumn(db: SqliteDb, table: string, column: string): Promise<boolean> {
  const columns = await db.all<{ name: string }>(sql.raw(`PRAGMA table_info(\`${table}\`)`))
  return columns.some((entry) => entry.name === column)
}

async function addColumnIfMissing(
  db: SqliteDb,
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  await requireTable(db, table)
  if (await tableHasColumn(db, table, column)) return
  await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`))
}

async function dropColumnIfExists(db: SqliteDb, table: string, column: string): Promise<void> {
  await requireTable(db, table)
  if (!(await tableHasColumn(db, table, column))) return
  await db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``))
}

/**
 * Google Analytics embed settings on Integrations global.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await addColumnIfMissing(
    db,
    'integrations_settings',
    'google_analytics_enabled',
    'integer DEFAULT 0',
  )
  await addColumnIfMissing(db, 'integrations_settings', 'google_analytics_embed_script', 'text')
  await addColumnIfMissing(
    db,
    '_integrations_settings_v',
    'version_google_analytics_enabled',
    'integer DEFAULT 0',
  )
  await addColumnIfMissing(
    db,
    '_integrations_settings_v',
    'version_google_analytics_embed_script',
    'text',
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await dropColumnIfExists(db, 'integrations_settings', 'google_analytics_enabled')
  await dropColumnIfExists(db, 'integrations_settings', 'google_analytics_embed_script')
  await dropColumnIfExists(db, '_integrations_settings_v', 'version_google_analytics_enabled')
  await dropColumnIfExists(db, '_integrations_settings_v', 'version_google_analytics_embed_script')
}
