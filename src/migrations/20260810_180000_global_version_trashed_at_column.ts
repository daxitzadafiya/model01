import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Align global version tables with trashedAt rename on main global tables.
 * Collection version tables (_pages_v, _posts_v) keep version_deleted_at.
 */
const GLOBAL_VERSION_TABLES = [
  '_header_v',
  '_footer_v',
  '_theme_v',
  '_localization_v',
  '_logo_v',
  '_cookie_consent_v',
  '_property_map_v',
  '_property_filters_v',
  '_email_settings_v',
  '_optima_crm_v',
  '_deepl_settings_v',
  '_integrations_settings_v',
  '_weather_settings_v',
] as const

async function tableHasColumn(
  db: MigrateUpArgs['db'],
  table: string,
  column: string,
): Promise<boolean> {
  const columns = await db.all<{ name: string }>(sql.raw(`PRAGMA table_info(\`${table}\`)`))
  return columns.some((entry) => entry.name === column)
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of GLOBAL_VERSION_TABLES) {
    const hasTrashedAt = await tableHasColumn(db, table, 'version_trashed_at')
    if (hasTrashedAt) continue

    const hasDeletedAt = await tableHasColumn(db, table, 'version_deleted_at')
    if (hasDeletedAt) {
      await db.run(
        sql.raw(
          `ALTER TABLE \`${table}\` RENAME COLUMN \`version_deleted_at\` TO \`version_trashed_at\``,
        ),
      )
    } else {
      await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD COLUMN \`version_trashed_at\` text`))
    }

    try {
      await db.run(sql.raw(`DROP INDEX IF EXISTS \`${table}_version_version_deleted_at_idx\``))
    } catch {
      // ignore
    }

    await db.run(
      sql.raw(
        `CREATE INDEX IF NOT EXISTS \`${table}_version_version_trashed_at_idx\` ON \`${table}\` (\`version_trashed_at\`)`,
      ),
    )
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of GLOBAL_VERSION_TABLES) {
    const hasDeletedAt = await tableHasColumn(db, table, 'version_deleted_at')
    if (hasDeletedAt) continue

    const hasTrashedAt = await tableHasColumn(db, table, 'version_trashed_at')
    if (!hasTrashedAt) continue

    await db.run(
      sql.raw(
        `ALTER TABLE \`${table}\` RENAME COLUMN \`version_trashed_at\` TO \`version_deleted_at\``,
      ),
    )

    try {
      await db.run(sql.raw(`DROP INDEX IF EXISTS \`${table}_version_version_trashed_at_idx\``))
    } catch {
      // ignore
    }

    await db.run(
      sql.raw(
        `CREATE INDEX IF NOT EXISTS \`${table}_version_version_deleted_at_idx\` ON \`${table}\` (\`version_deleted_at\`)`,
      ),
    )
  }
}
