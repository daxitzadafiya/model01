import * as migration_20260529_072521_kb_short_names from './20260529_072521_kb_short_names';
import * as migration_20260605_104900_post_subtitle from './20260605_104900_post_subtitle';

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
];
