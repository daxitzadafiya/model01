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

/**
 * Manual certificate images on the certificates block, plus the footer link label.
 * Script widgets stay on their existing tables.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await addColumnIfMissing(db, 'pages_blocks_certificates_block_locales', 'manual_title', 'text')
  await addColumnIfMissing(
    db,
    '_pages_v_blocks_certificates_block_locales',
    'manual_title',
    'text',
  )
  await addColumnIfMissing(db, 'footer_locales', 'manual_certificates_label', 'text')
  await addColumnIfMissing(
    db,
    '_footer_v_locales',
    'version_manual_certificates_label',
    'text',
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`pages_blocks_certificates_block_manual_certificates\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`image_id\` integer,
      FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_certificates_block\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`pages_blocks_certificates_block_manual_certificates_order_idx\` ON \`pages_blocks_certificates_block_manual_certificates\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`pages_blocks_certificates_block_manual_certificates_parent_id_idx\` ON \`pages_blocks_certificates_block_manual_certificates\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`pages_blocks_certificates_block_manual_certificates_image_idx\` ON \`pages_blocks_certificates_block_manual_certificates\` (\`image_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`pages_blocks_certificates_block_manual_certificates_locales\` (
      \`title\` text,
      \`subtitle\` text,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` text NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_certificates_block_manual_certificates\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`pages_blocks_certificates_block_manual_certs_locales_idx\` ON \`pages_blocks_certificates_block_manual_certificates_locales\` (\`_locale\`, \`_parent_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_pages_v_blocks_certificates_block_manual_certificates\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`image_id\` integer,
      \`_uuid\` text,
      FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_certificates_block\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_pages_v_blocks_certificates_block_manual_certificates_order_idx\` ON \`_pages_v_blocks_certificates_block_manual_certificates\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_pages_v_blocks_certificates_block_manual_certificates_parent_id_idx\` ON \`_pages_v_blocks_certificates_block_manual_certificates\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_pages_v_blocks_certificates_block_manual_certificates_image_idx\` ON \`_pages_v_blocks_certificates_block_manual_certificates\` (\`image_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_pages_v_blocks_certificates_block_manual_certificates_locales\` (
      \`title\` text,
      \`subtitle\` text,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`_locale\` text NOT NULL,
      \`_parent_id\` integer NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_certificates_block_manual_certificates\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`_pages_v_blocks_certificates_block_manual_certs_locales_idx\` ON \`_pages_v_blocks_certificates_block_manual_certificates_locales\` (\`_locale\`, \`_parent_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(
    sql`DROP TABLE IF EXISTS \`_pages_v_blocks_certificates_block_manual_certificates_locales\`;`,
  )
  await db.run(sql`DROP TABLE IF EXISTS \`_pages_v_blocks_certificates_block_manual_certificates\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`pages_blocks_certificates_block_manual_certificates_locales\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`pages_blocks_certificates_block_manual_certificates\`;`)

  try {
    await db.run(
      sql`ALTER TABLE \`pages_blocks_certificates_block_locales\` DROP COLUMN \`manual_title\`;`,
    )
  } catch {
    // ignore
  }
  try {
    await db.run(
      sql`ALTER TABLE \`_pages_v_blocks_certificates_block_locales\` DROP COLUMN \`manual_title\`;`,
    )
  } catch {
    // ignore
  }
  try {
    await db.run(sql`ALTER TABLE \`footer_locales\` DROP COLUMN \`manual_certificates_label\`;`)
  } catch {
    // ignore
  }
  try {
    await db.run(
      sql`ALTER TABLE \`_footer_v_locales\` DROP COLUMN \`version_manual_certificates_label\`;`,
    )
  } catch {
    // ignore
  }
}
