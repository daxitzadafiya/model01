import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

async function addColumnIfMissing(
  db: MigrateUpArgs['db'],
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

async function columnExists(
  db: MigrateUpArgs['db'],
  table: string,
  column: string,
): Promise<boolean> {
  const columns = await db.all<{ name: string }>(sql.raw(`PRAGMA table_info(\`${table}\`)`))
  return columns.some((entry) => entry.name === column)
}

/**
 * SQLite 3.37 cannot DROP COLUMN when a table-level FOREIGN KEY names that
 * column. Rebuild the table without image_id and keep the remaining rows.
 */
async function dropImageIdColumn(
  db: MigrateUpArgs['db'],
  table: string,
  createWithoutImage: string,
  copySql: string,
  indexes: string[],
): Promise<void> {
  if (!(await columnExists(db, table, 'image_id'))) return

  try {
    await db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`image_id\``))
    return
  } catch {
    // Table-level foreign key still names image_id after the rewrite.
  }

  const temp = `${table}__script_tmp`
  await db.run(sql`PRAGMA foreign_keys = OFF;`)
  await db.run(sql.raw(`DROP TABLE IF EXISTS \`${temp}\``))
  await db.run(sql.raw(createWithoutImage.replaceAll('__TABLE__', temp)))
  await db.run(sql.raw(copySql.replaceAll('__TABLE__', temp)))
  await db.run(sql.raw(`DROP TABLE \`${table}\``))
  await db.run(sql.raw(`ALTER TABLE \`${temp}\` RENAME TO \`${table}\``))
  for (const indexSql of indexes) {
    await db.run(sql.raw(indexSql))
  }
  await db.run(sql`PRAGMA foreign_keys = ON;`)
}

async function dropColumnIfExists(
  db: MigrateUpArgs['db'],
  table: string,
  column: string,
): Promise<void> {
  if (!(await columnExists(db, table, column))) return
  try {
    await db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``))
  } catch {
    // Column is still referenced or this SQLite build cannot drop it.
  }
}

async function dropIndexIfExists(db: MigrateUpArgs['db'], index: string): Promise<void> {
  try {
    await db.run(sql.raw(`DROP INDEX IF EXISTS \`${index}\``))
  } catch {
    // ignore
  }
}

const CERTIFICATE_TABLES = [
  'footer_certifications',
  '_footer_v_version_certifications',
  'pages_blocks_certificates_block_certificates',
  '_pages_v_blocks_certificates_block_certificates',
] as const

const IMAGE_INDEXES = [
  'footer_certifications_image_idx',
  '_footer_v_version_certifications_image_idx',
  'pages_blocks_certificates_block_certificates_image_idx',
  '_pages_v_blocks_certificates_block_certificates_image_idx',
] as const

/**
 * Certificate rows store a widget script tag instead of a media upload.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of CERTIFICATE_TABLES) {
    await addColumnIfMissing(db, table, 'script', 'text')
  }

  for (const index of IMAGE_INDEXES) {
    await dropIndexIfExists(db, index)
  }

  await dropImageIdColumn(
    db,
    'footer_certifications',
    `CREATE TABLE \`__TABLE__\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`label\` text,
      \`is_deleted\` integer DEFAULT 0,
      \`deleted_at\` text,
      \`script\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer\`(\`id\`) ON UPDATE no action ON DELETE cascade
    )`,
    `INSERT INTO \`__TABLE__\` (\`_order\`, \`_parent_id\`, \`id\`, \`label\`, \`is_deleted\`, \`deleted_at\`, \`script\`)
     SELECT \`_order\`, \`_parent_id\`, \`id\`, \`label\`, \`is_deleted\`, \`deleted_at\`, \`script\` FROM \`footer_certifications\``,
    [
      'CREATE INDEX IF NOT EXISTS `footer_certifications_order_idx` ON `footer_certifications` (`_order`)',
      'CREATE INDEX IF NOT EXISTS `footer_certifications_parent_id_idx` ON `footer_certifications` (`_parent_id`)',
    ],
  )

  await dropImageIdColumn(
    db,
    '_footer_v_version_certifications',
    `CREATE TABLE \`__TABLE__\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`label\` text,
      \`_uuid\` text,
      \`is_deleted\` integer DEFAULT 0,
      \`deleted_at\` text,
      \`script\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_footer_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    )`,
    `INSERT INTO \`__TABLE__\` (\`_order\`, \`_parent_id\`, \`id\`, \`label\`, \`_uuid\`, \`is_deleted\`, \`deleted_at\`, \`script\`)
     SELECT \`_order\`, \`_parent_id\`, \`id\`, \`label\`, \`_uuid\`, \`is_deleted\`, \`deleted_at\`, \`script\` FROM \`_footer_v_version_certifications\``,
    [
      'CREATE INDEX IF NOT EXISTS `_footer_v_version_certifications_order_idx` ON `_footer_v_version_certifications` (`_order`)',
      'CREATE INDEX IF NOT EXISTS `_footer_v_version_certifications_parent_id_idx` ON `_footer_v_version_certifications` (`_parent_id`)',
    ],
  )

  await dropImageIdColumn(
    db,
    'pages_blocks_certificates_block_certificates',
    `CREATE TABLE \`__TABLE__\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`script\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_certificates_block\`(\`id\`) ON UPDATE no action ON DELETE cascade
    )`,
    `INSERT INTO \`__TABLE__\` (\`_order\`, \`_parent_id\`, \`id\`, \`script\`)
     SELECT \`_order\`, \`_parent_id\`, \`id\`, \`script\` FROM \`pages_blocks_certificates_block_certificates\``,
    [
      'CREATE INDEX IF NOT EXISTS `pages_blocks_certificates_block_certificates_order_idx` ON `pages_blocks_certificates_block_certificates` (`_order`)',
      'CREATE INDEX IF NOT EXISTS `pages_blocks_certificates_block_certificates_parent_id_idx` ON `pages_blocks_certificates_block_certificates` (`_parent_id`)',
    ],
  )

  await dropImageIdColumn(
    db,
    '_pages_v_blocks_certificates_block_certificates',
    `CREATE TABLE \`__TABLE__\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_uuid\` text,
      \`script\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_certificates_block\`(\`id\`) ON UPDATE no action ON DELETE cascade
    )`,
    `INSERT INTO \`__TABLE__\` (\`_order\`, \`_parent_id\`, \`id\`, \`_uuid\`, \`script\`)
     SELECT \`_order\`, \`_parent_id\`, \`id\`, \`_uuid\`, \`script\` FROM \`_pages_v_blocks_certificates_block_certificates\``,
    [
      'CREATE INDEX IF NOT EXISTS `_pages_v_blocks_certificates_block_certificates_order_idx` ON `_pages_v_blocks_certificates_block_certificates` (`_order`)',
      'CREATE INDEX IF NOT EXISTS `_pages_v_blocks_certificates_block_certificates_parent_id_idx` ON `_pages_v_blocks_certificates_block_certificates` (`_parent_id`)',
    ],
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of CERTIFICATE_TABLES) {
    await addColumnIfMissing(
      db,
      table,
      'image_id',
      'integer REFERENCES media(id) ON DELETE set null',
    )
  }

  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`footer_certifications_image_idx\` ON \`footer_certifications\` (\`image_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_footer_v_version_certifications_image_idx\` ON \`_footer_v_version_certifications\` (\`image_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`pages_blocks_certificates_block_certificates_image_idx\` ON \`pages_blocks_certificates_block_certificates\` (\`image_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_pages_v_blocks_certificates_block_certificates_image_idx\` ON \`_pages_v_blocks_certificates_block_certificates\` (\`image_id\`);`,
  )

  for (const table of CERTIFICATE_TABLES) {
    await dropColumnIfExists(db, table, 'script')
  }
}
