#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import ts from 'typescript';

import { getRandomAlphaNumeric } from './util/string';

export async function initCommand() {
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

  await syncCommand();
  console.log('Zeyon initialization complete.');
}

export async function syncCommand() {
  // Maps a decorator name to the interface suffix we'd like to augment.
  const DECORATOR_TYPE_MAP: Record<string, string> = {
    registerModel: 'Model',
    registerCollection: 'Collection',
    registerView: 'View',
    registerRouteView: 'RouteView',
    registerCollectionView: 'CollectionView',
  };

  const projectRoot = process.cwd();
  const zeyonDir = path.join(projectRoot, '.Zeyon');

  // TODO: Introduce any valid properties into our config that would affect file generation
  // 1) Read config if it exists
  // let config: any = {};
  // const configPath = path.join(zeyonDir, 'zeyon.config.json');
  // if (fs.existsSync(configPath)) {
  //   config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  // }

  const typesFile = path.join(zeyonDir, 'ZeyonTypes.d.ts');
  const dataFile = path.join(zeyonDir, 'classMapData.ts');
  if (fs.existsSync(typesFile)) fs.unlinkSync(typesFile);
  if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

  // 2) Load and parse the user's tsconfig
  const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) {
    console.error('No tsconfig.json found at project root');
    return;
  }
  const parsed = ts.parseConfigFileTextToJson(tsconfigPath, fs.readFileSync(tsconfigPath, 'utf-8'));
  const hostConfig = ts.parseJsonConfigFileContent(parsed.config, ts.sys, projectRoot);

  // 3) Create a program from discovered TS files
  const program = ts.createProgram({
    rootNames: hostConfig.fileNames,
    options: hostConfig.options,
  });

  const entriesByType: Record<
    string,
    Array<{
      registrationId: string;
      filePath: string;
      className: string;
    }>
  > = {
    Model: [],
    Collection: [],
    View: [],
    RouteView: [],
    CollectionView: [],
  };

  // 4) Walk the AST, find all decorators of interest
  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile) {
      ts.forEachChild(sourceFile, (node) => {
        // We only care about class declarations with decorators
        if (ts.isClassDeclaration(node) && node.name && ts.canHaveDecorators(node)) {
          const decorators = ts.getDecorators(node);
          if (decorators) {
            for (const dec of decorators) {
              if (ts.isDecorator(dec)) {
                // Each decorator has a .expression we can parse
                const expr = dec.expression;
                if (ts.isCallExpression(expr)) {
                  const decoratorName = getDecoratorIdentifier(expr.expression);
                  if (decoratorName && DECORATOR_TYPE_MAP[decoratorName]) {
                    const [registrationIdArg] = expr.arguments;
                    if (registrationIdArg && ts.isStringLiteral(registrationIdArg)) {
                      entriesByType[DECORATOR_TYPE_MAP[decoratorName]].push({
                        registrationId: registrationIdArg.text,
                        className: node.name.text,
                        filePath: path.relative(zeyonDir, sourceFile.fileName.replace(/\.(ts|tsx)$/, '')),
                      });
                    }
                  }
                }
              }
            }
          }
        }
      });
    }
  }

  // 5) Generate our ZeyonTypes.d.ts file (type augmentation module)
  let dtsContent = `declare module 'zeyon/src/_maps' {\n`; // START FILE
  for (const key of Object.keys(entriesByType)) {
    const arr = entriesByType[key];

    if (arr.length === 0) continue;

    dtsContent += `  interface ClassMapType${key} {\n`;

    for (const entry of arr) {
      let relativePath = path
        .relative(projectRoot, entry.filePath)
        .replace(/\.(ts|tsx)$/, '')
        .replace(/\\/g, '/');

      if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
      }

      dtsContent += `    '${entry.registrationId}': {\n`;
      dtsContent += `      classRef: typeof import('${relativePath}').${entry.className};\n`;
      dtsContent += `      options: unknown;\n`; // TODO: Update with parsed options interface
      dtsContent += `    };\n`;
    }

    dtsContent += `  }\n`;
  }
  dtsContent += `}\n`; // END FILE
  fs.writeFileSync(typesFile, dtsContent, 'utf-8');

  // 6) Generate our classMapData.ts file for runtime data for our registry class
  interface ClassEntry {
    filePath: string;
    alias: string;
    className: string;
    registrationId: string;
    type: string;
  }
  const importsByFile: Record<string, ClassEntry[]> = {};
  const allEntries: ClassEntry[] = [];

  // Repackage entriesByType for importsByFile
  for (const type of Object.keys(entriesByType)) {
    const arr = entriesByType[type];
    for (const entry of arr) {
      const hash = getRandomAlphaNumeric({ len: 10, toUpper: true });
      const alias = `${entry.className}_${hash}`;

      // Notify if we detected a registrationId collision
      const existing = allEntries.find((e) => e.registrationId === entry.registrationId);
      if (existing) {
        console.warn(
          `Warning: Duplicate registrationId "${entry.registrationId}". Overwriting previous class ${existing.className}.`,
        );
      }

      allEntries.push({
        filePath: entry.filePath,
        alias,
        className: entry.className,
        registrationId: entry.registrationId,
        type,
      });
    }
  }
  for (const entry of allEntries) {
    if (!importsByFile[entry.filePath]) {
      importsByFile[entry.filePath] = [];
    }
    importsByFile[entry.filePath].push(entry);
  }

  let dataContent = `// AUTO-GENERATED by Zeyon sync\n\n`; // START FILE

  // Use importsByFile to construct entries for classMapData output
  Object.keys(importsByFile).forEach((filePath) => {
    const entries = importsByFile[filePath];

    // import { MyClass as MyClass_abc123, OtherClass as OtherClass_def456 } from 'filePath';
    const importList = entries.map((obj) => `${obj.className} as ${obj.alias}`).join(', ');

    dataContent += `import { ${importList} } from '${filePath.replace(/\\/g, '/')}';\n`;
  });
  dataContent += `\nexport const classMapData = {\n`;

  allEntries.forEach((entry) => {
    dataContent += `  '${entry.registrationId}': {\n`;
    dataContent += `    classRef: ${entry.alias},\n`;
    dataContent += `    type: '${entry.type}',\n`;
    dataContent += `  },\n`;
  });

  dataContent += `};\n`; // END FILE
  fs.writeFileSync(dataFile, dataContent, 'utf-8');

  console.log(`Generated:\n - ${typesFile}\n - ${dataFile}`);
}

/**
 * Helper to get the name of the decorator function:
 * e.g. defineView, defineRouteView, etc.
 */
function getDecoratorIdentifier(expr: ts.Expression): string | undefined {
  if (ts.isIdentifier(expr)) return expr.text;
  if (ts.isPropertyAccessExpression(expr)) return expr.name.text;
  return undefined;
}

async function main() {
  const args = process.argv.slice(2);
  const subcommand = args[0];

  switch (subcommand) {
    case 'init':
      await initCommand();
      break;
    case 'sync':
      await syncCommand();
      break;
    // TODO: implement 'watch'
    default:
      console.log(`Unknown subcommand: ${subcommand}`);
      console.log(`Usage: zeyon [init|sync]`); // `Usage: zeyon [init|sync|watch]`
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
