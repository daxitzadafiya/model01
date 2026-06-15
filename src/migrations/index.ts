import * as migration_20260529_072521_kb_short_names from './20260529_072521_kb_short_names'
import * as migration_20260605_104900_post_subtitle from './20260605_104900_post_subtitle'
import * as migration_20260605_150500_header_nav_dropdown from './20260605_150500_header_nav_dropdown'
import * as migration_20260608_161200_translations_collection from './20260608_161200_translations_collection'
import * as migration_20260608_161500_translations_rels from './20260608_161500_translations_rels'
import * as migration_20260609_095300_property_map_global from './20260609_095300_property_map_global'
import * as migration_20260609_120000_property_list_block_show_map_version from './20260609_120000_property_list_block_show_map_version'
import * as migration_20260609_150000_property_filters_global from './20260609_150000_property_filters_global'
import * as migration_20260609_124500_email_settings from './20260609_124500_email_settings'
import * as migration_20260610_120000_integration_settings_globals from './20260610_120000_integration_settings_globals'
import * as migration_20260610_170500_email_template_fields from './20260610_170500_email_template_fields'
import * as migration_20260610_180000_client_confirmation_contact_fields from './20260610_180000_client_confirmation_contact_fields'
import * as migration_20260611_100700_hero_block_media from './20260611_100700_hero_block_media'
import * as migration_20260611_140000_weather_settings from './20260611_140000_weather_settings'
import * as migration_20260612_100000_hero_search_results_link from './20260612_100000_hero_search_results_link'
import * as migration_20260612_110000_logo_app_name from './20260612_110000_logo_app_name'
import * as migration_20260612_120000_footer_copyright_app_name from './20260612_120000_footer_copyright_app_name'
import * as migration_20260612_160000_posts_localized_content from './20260612_160000_posts_localized_content'
import * as migration_20260612_170000_posts_localized_backfill from './20260612_170000_posts_localized_backfill'
import * as migration_20260615_100000_theme_custom_css from './20260615_100000_theme_custom_css'
import * as migration_20260615_120000_property_filters_sort_options from './20260615_120000_property_filters_sort_options'
import * as migration_20260615_130000_property_filters_sort_params_column from './20260615_130000_property_filters_sort_params_column'
import * as migration_20260615_140000_footer_copyright_localized from './20260615_140000_footer_copyright_localized'
import * as migration_20260615_140000_optima_crm_similar_commercials from './20260615_140000_optima_crm_similar_commercials'

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
    name: '20260609_124500_email_settings',
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
  {
    up: migration_20260611_140000_weather_settings.up,
    down: migration_20260611_140000_weather_settings.down,
    name: '20260611_140000_weather_settings',
  },
  {
    up: migration_20260612_100000_hero_search_results_link.up,
    down: migration_20260612_100000_hero_search_results_link.down,
    name: '20260612_100000_hero_search_results_link',
  },
  {
    up: migration_20260612_110000_logo_app_name.up,
    down: migration_20260612_110000_logo_app_name.down,
    name: '20260612_110000_logo_app_name',
  },
  {
    up: migration_20260612_120000_footer_copyright_app_name.up,
    down: migration_20260612_120000_footer_copyright_app_name.down,
    name: '20260612_120000_footer_copyright_app_name',
  },
  {
    up: migration_20260612_160000_posts_localized_content.up,
    down: migration_20260612_160000_posts_localized_content.down,
    name: '20260612_160000_posts_localized_content',
  },
  {
    up: migration_20260612_170000_posts_localized_backfill.up,
    down: migration_20260612_170000_posts_localized_backfill.down,
    name: '20260612_170000_posts_localized_backfill',
  },
  {
    up: migration_20260615_100000_theme_custom_css.up,
    down: migration_20260615_100000_theme_custom_css.down,
    name: '20260615_100000_theme_custom_css',
  },
  {
    up: migration_20260615_120000_property_filters_sort_options.up,
    down: migration_20260615_120000_property_filters_sort_options.down,
    name: '20260615_120000_property_filters_sort_options',
  },
  {
    up: migration_20260615_130000_property_filters_sort_params_column.up,
    down: migration_20260615_130000_property_filters_sort_params_column.down,
    name: '20260615_130000_property_filters_sort_params_column',
  },
  {
    up: migration_20260615_140000_footer_copyright_localized.up,
    down: migration_20260615_140000_footer_copyright_localized.down,
    name: '20260615_140000_footer_copyright_localized',
  },
  {
    up: migration_20260615_140000_optima_crm_similar_commercials.up,
    down: migration_20260615_140000_optima_crm_similar_commercials.down,
    name: '20260615_140000_optima_crm_similar_commercials',
  },
]
