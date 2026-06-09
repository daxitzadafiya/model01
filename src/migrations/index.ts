import * as migration_20260529_072521_kb_short_names from './20260529_072521_kb_short_names';
import * as migration_20260605_104900_post_subtitle from './20260605_104900_post_subtitle';
import * as migration_20260605_150500_header_nav_dropdown from './20260605_150500_header_nav_dropdown';
import * as migration_20260608_161200_translations_collection from './20260608_161200_translations_collection';
import * as migration_20260608_161500_translations_rels from './20260608_161500_translations_rels';

export const migrations = [
  {
    up: migration_20260529_072521_kb_short_names.up,
    down: migration_20260529_072521_kb_short_names.down,
    name: '20260529_072521_kb_short_names'
  },
  {
    up: migration_20260605_104900_post_subtitle.up,
    down: migration_20260605_104900_post_subtitle.down,
    name: '20260605_104900_post_subtitle'
  },
  {
    up: migration_20260605_150500_header_nav_dropdown.up,
    down: migration_20260605_150500_header_nav_dropdown.down,
    name: '20260605_150500_header_nav_dropdown'
  },
  {
    up: migration_20260608_161200_translations_collection.up,
    down: migration_20260608_161200_translations_collection.down,
    name: '20260608_161200_translations_collection'
  },
  {
    up: migration_20260608_161500_translations_rels.up,
    down: migration_20260608_161500_translations_rels.down,
    name: '20260608_161500_translations_rels'
  },
];
