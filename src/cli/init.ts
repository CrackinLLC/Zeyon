import fs from 'fs';
import path from 'path';

export default async function () {
  const projectRoot = process.cwd();
  const zeyonDir = path.join(projectRoot, '.Zeyon');
  const configPath = path.join(zeyonDir, 'zeyon.config.json');

  // 1) Ensure .Zeyon folder
  if (!fs.existsSync(zeyonDir)) {
    fs.mkdirSync(zeyonDir);
    console.log(`Created directory: ${zeyonDir}`);
  }

  // 2) Create a default config if missing
  if (!fs.existsSync(configPath)) {
    const defaultConfig = {
      projectRoot,
      // TODO: Extend editable config values
    };
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
  } else {
    // TODO: Possibly prompt user if they'd like to overwrite or keep existing
    console.log(`Config already exists at ${configPath}, skipping creation.`);
  }

  console.log('Zeyon initialization complete.');
}
