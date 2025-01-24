import fs from 'fs';
import path from 'path';
export const ZEYON_ROOT_ALIAS = 'zeyonRootAlias';
export function findProjectRoot() {
    const cwd = process.cwd();
    const zeyonConfig = path.join(cwd, '.Zeyon', 'zeyon.config.json');
    if (fs.existsSync(zeyonConfig)) {
        const config = JSON.parse(fs.readFileSync(zeyonConfig, 'utf8'));
        return config.projectRoot || cwd;
    }
    return cwd;
}
//# sourceMappingURL=build.js.map