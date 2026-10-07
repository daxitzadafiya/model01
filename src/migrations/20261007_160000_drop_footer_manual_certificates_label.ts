import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

async function dropColumnIfExists(
  db: MigrateUpArgs['db'],
  table: string,
  column: string,
): Promise<void> {
  const columns = await db.all<{ name: string }>(sql.raw(`PRAGMA table_info(\`${table}\`)`))
  if (!columns.some((entry) => entry.name === column)) return
  await db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``))
}

async function addColumnIfMissing(
  db: MigrateDownArgs['db'],
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  try {
    await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`))
  } catch {
    // Already present.
  }
}

/** The footer no longer stores a separate manual-certificates link label. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await dropColumnIfExists(db, 'footer_locales', 'manual_certificates_label')
  await dropColumnIfExists(db, '_footer_v_locales', 'version_manual_certificates_label')
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await addColumnIfMissing(db, 'footer_locales', 'manual_certificates_label', 'text')
  await addColumnIfMissing(db, '_footer_v_locales', 'version_manual_certificates_label', 'text')
}
