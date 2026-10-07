import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

const ROW_TABLES = [
  'footer_certifications',
  '_footer_v_version_certifications',
  'pages_blocks_certificates_block_certificates',
  '_pages_v_blocks_certificates_block_certificates',
] as const

const LOCALE_TABLES = [
  'pages_blocks_certificates_block_certificates_locales',
  '_pages_v_blocks_certificates_block_certificates_locales',
] as const

async function columnExists(
  db: MigrateUpArgs['db'],
  table: string,
  column: string,
): Promise<boolean> {
  const columns = await db.all<{ name: string }>(sql.raw(`PRAGMA table_info(\`${table}\`)`))
  return columns.some((entry) => entry.name === column)
}

async function addColumnIfMissing(
  db: MigrateUpArgs['db'],
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  if (await columnExists(db, table, column)) return
  await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`))
}

/**
 * Optional page link on each certificate row. Shown in the admin only for Manual Upload.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of ROW_TABLES) {
    await addColumnIfMissing(db, table, 'link_type', "text DEFAULT 'reference'")
    await addColumnIfMissing(db, table, 'link_new_tab', 'integer')
  }

  for (const table of LOCALE_TABLES) {
    await addColumnIfMissing(db, table, 'link_url', 'text')
  }

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`footer_certifications_locales\` (
      \`link_url\` text,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer_certifications\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`footer_certifications_locales_locale_parent_idx\` ON \`footer_certifications_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_footer_v_version_certifications_locales\` (
      \`link_url\` text,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_footer_v_version_certifications\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_footer_v_version_certifications_locales_loc_parent_idx\` ON \`_footer_v_version_certifications_locales\` (\`_locale\`, \`_parent_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`_footer_v_version_certifications_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`footer_certifications_locales\`;`)

  for (const table of [...ROW_TABLES, ...LOCALE_TABLES]) {
    for (const column of table.endsWith('_locales')
      ? ['link_url']
      : ['link_new_tab', 'link_type']) {
      if (!(await columnExists(db, table, column))) continue
      try {
        await db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``))
      } catch {
        // This SQLite build cannot drop the column.
      }
    }
  }
}
