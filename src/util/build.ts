import fs from 'fs';
import path from 'path';

// TODO: Figure out how to use this for import statements across the library. For now, manually leep strings in sync.
export const ZEYON_ROOT_ALIAS = 'zeyonRootAlias';

// TODO: Can we handle all alias-related imports from this file (or dedicated location) and reexport for general library consumption?

export function findProjectRoot(): string {
  const cwd = process.cwd();
  const zeyonConfig = path.join(cwd, '.Zeyon', 'zeyon.config.json');

  if (fs.existsSync(zeyonConfig)) {
    const config = JSON.parse(fs.readFileSync(zeyonConfig, 'utf8'));
    return config.projectRoot || cwd;
  }

  return cwd;
}
