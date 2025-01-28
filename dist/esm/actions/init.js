import fs from 'fs';
import path from 'path';
export default async function () {
    const projectRoot = process.cwd();
    const zeyonDir = path.join(projectRoot, '.Zeyon');
    const configPath = path.join(zeyonDir, 'zeyon.config.json');
    if (!fs.existsSync(zeyonDir)) {
        fs.mkdirSync(zeyonDir);
        console.log(`Created directory: ${zeyonDir}`);
    }
    if (!fs.existsSync(configPath)) {
        const defaultConfig = {
            projectRoot,
        };
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    }
    else {
        console.log(`Config already exists at ${configPath}, skipping creation.`);
    }
    console.log('Zeyon initialization complete.');
}
//# sourceMappingURL=init.js.map