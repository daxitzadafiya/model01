import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

const TABLES = [
  'footer_certifications',
  '_footer_v_version_certifications',
  'pages_blocks_certificates_block_certificates',
  '_pages_v_blocks_certificates_block_certificates',
] as const

async function columnExists(
  db: MigrateUpArgs['db'],
  table: string,
  column: string,
): Promise<boolean> {
  const columns = await db.all<{ name: string }>(sql.raw(`PRAGMA table_info(\`${table}\`)`))
  return columns.some((entry) => entry.name === column)
}

/**
 * Each certificate row can be a script or an uploaded image.
 * Existing rows stay on Using Script.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of TABLES) {
    if (!(await columnExists(db, table, 'certificate_type'))) {
      await db.run(
        sql.raw(
          `ALTER TABLE \`${table}\` ADD COLUMN \`certificate_type\` text DEFAULT 'script'`,
        ),
      )
    }
    if (!(await columnExists(db, table, 'image_id'))) {
      await db.run(
        sql.raw(
          `ALTER TABLE \`${table}\` ADD COLUMN \`image_id\` integer REFERENCES \`media\`(\`id\`) ON DELETE set null`,
        ),
      )
    }
    await db.run(
      sql.raw(
        `UPDATE \`${table}\` SET \`certificate_type\` = 'script' WHERE \`certificate_type\` IS NULL OR TRIM(\`certificate_type\`) = ''`,
      ),
    )
    await db.run(
      sql.raw(
        `CREATE INDEX IF NOT EXISTS \`${table}_image_idx\` ON \`${table}\` (\`image_id\`)`,
      ),
    )
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of TABLES) {
    if (await columnExists(db, table, 'image_id')) {
      try {
        await db.run(sql.raw(`DROP INDEX IF EXISTS \`${table}_image_idx\``))
        await db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`image_id\``))
      } catch {
        // This SQLite build cannot drop the column.
      }
    }
    if (await columnExists(db, table, 'certificate_type')) {
      try {
        await db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`certificate_type\``))
      } catch {
        // This SQLite build cannot drop the column.
      }
    }
  }
}
