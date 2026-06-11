import * as migration_20260529_072521_kb_short_names from './20260529_072521_kb_short_names'
import * as migration_20260605_104900_post_subtitle from './20260605_104900_post_subtitle'
import * as migration_20260605_150500_header_nav_dropdown from './20260605_150500_header_nav_dropdown'
import * as migration_20260608_161200_translations_collection from './20260608_161200_translations_collection'
import * as migration_20260608_161500_translations_rels from './20260608_161500_translations_rels'
import * as migration_20260609_095300_property_map_global from './20260609_095300_property_map_global'
import * as migration_20260609_120000_property_list_block_show_map_version from './20260609_120000_property_list_block_show_map_version'
import * as migration_20260609_150000_property_filters_global from './20260609_150000_property_filters_global'
import * as migration_20260609_124500_email_settings from './20260609_124500_email_settings';
import * as migration_20260610_120000_integration_settings_globals from './20260610_120000_integration_settings_globals'
import * as migration_20260610_170500_email_template_fields from './20260610_170500_email_template_fields'
import * as migration_20260610_180000_client_confirmation_contact_fields from './20260610_180000_client_confirmation_contact_fields'
import * as migration_20260611_100700_hero_block_media from './20260611_100700_hero_block_media'

export const migrations = [
  {
    up: migration_20260529_072521_kb_short_names.up,
    down: migration_20260529_072521_kb_short_names.down,
    name: '20260529_072521_kb_short_names',
  },
  {
    up: migration_20260605_104900_post_subtitle.up,
    down: migration_20260605_104900_post_subtitle.down,
    name: '20260605_104900_post_subtitle',
  },
  {
    up: migration_20260605_150500_header_nav_dropdown.up,
    down: migration_20260605_150500_header_nav_dropdown.down,
    name: '20260605_150500_header_nav_dropdown',
  },
  {
    up: migration_20260608_161200_translations_collection.up,
    down: migration_20260608_161200_translations_collection.down,
    name: '20260608_161200_translations_collection',
  },
  {
    up: migration_20260608_161500_translations_rels.up,
    down: migration_20260608_161500_translations_rels.down,
    name: '20260608_161500_translations_rels',
  },
  {
    up: migration_20260609_095300_property_map_global.up,
    down: migration_20260609_095300_property_map_global.down,
    name: '20260609_095300_property_map_global',
  },
  {
    up: migration_20260609_120000_property_list_block_show_map_version.up,
    down: migration_20260609_120000_property_list_block_show_map_version.down,
    name: '20260609_120000_property_list_block_show_map_version',
  },
  {
    up: migration_20260609_150000_property_filters_global.up,
    down: migration_20260609_150000_property_filters_global.down,
    name: '20260609_150000_property_filters_global',
  },
  {
    up: migration_20260609_124500_email_settings.up,
    down: migration_20260609_124500_email_settings.down,
    name: '20260609_124500_email_settings'
  },
  {
    up: migration_20260610_120000_integration_settings_globals.up,
    down: migration_20260610_120000_integration_settings_globals.down,
    name: '20260610_120000_integration_settings_globals',
  },
  {
    up: migration_20260610_170500_email_template_fields.up,
    down: migration_20260610_170500_email_template_fields.down,
    name: '20260610_170500_email_template_fields',
  },
  {
    up: migration_20260610_180000_client_confirmation_contact_fields.up,
    down: migration_20260610_180000_client_confirmation_contact_fields.down,
    name: '20260610_180000_client_confirmation_contact_fields',
  },
  {
    up: migration_20260611_100700_hero_block_media.up,
    down: migration_20260611_100700_hero_block_media.down,
    name: '20260611_100700_hero_block_media',
  },
]
