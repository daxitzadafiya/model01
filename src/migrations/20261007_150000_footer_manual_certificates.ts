import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Manual certificate images live on the footer, with the same Image upload
 * as the old certification rows. Script widgets stay on footer_certifications.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`footer_manual_certificates\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`image_id\` integer,
      \`label\` text,
      \`is_deleted\` integer DEFAULT 0,
      \`deleted_at\` text,
      FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`footer_manual_certificates_order_idx\` ON \`footer_manual_certificates\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`footer_manual_certificates_parent_id_idx\` ON \`footer_manual_certificates\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`footer_manual_certificates_image_idx\` ON \`footer_manual_certificates\` (\`image_id\`);`,
  )

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`_footer_v_version_manual_certificates\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`image_id\` integer,
      \`label\` text,
      \`_uuid\` text,
      \`is_deleted\` integer DEFAULT 0,
      \`deleted_at\` text,
      FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_footer_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `)
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_footer_v_version_manual_certificates_order_idx\` ON \`_footer_v_version_manual_certificates\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_footer_v_version_manual_certificates_parent_id_idx\` ON \`_footer_v_version_manual_certificates\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`_footer_v_version_manual_certificates_image_idx\` ON \`_footer_v_version_manual_certificates\` (\`image_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`_footer_v_version_manual_certificates\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`footer_manual_certificates\`;`)
}
