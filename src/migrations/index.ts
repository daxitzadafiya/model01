import * as migration_20260529_072521_kb_short_names from './20260529_072521_kb_short_names';

export const migrations = [
  {
    up: migration_20260529_072521_kb_short_names.up,
    down: migration_20260529_072521_kb_short_names.down,
    name: '20260529_072521_kb_short_names'
  },
];
