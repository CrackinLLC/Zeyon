#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import ts from 'typescript';

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
    defineModel: 'Model',
    defineCollection: 'Collection',
    defineView: 'View',
    defineRouteView: 'RouteView',
    defineCollectionView: 'CollectionView',
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
  let dtsContent = `declare module 'zeyon/src/_index.d' {\n`; // START FILE
  for (const key of Object.keys(entriesByType)) {
    const arr = entriesByType[key];
    if (arr.length === 0) continue;

    dtsContent += `  interface ClassMapType${key} {\n`;

    for (const entry of arr) {
      dtsContent += `    '${entry.registrationId}': {\n`;
      dtsContent += `      definition: typeof import('${entry.filePath}').${entry.className};\n`;
      dtsContent += `      options: unknown;\n`; // TODO: Update with parsed options interface
      dtsContent += `    };\n`;
    }

    dtsContent += `  }\n`;
  }
  dtsContent += `}\n`; // END FILE
  fs.writeFileSync(typesFile, dtsContent, 'utf-8');

  // 6) Generate our classMapData.ts file for runtime data for our registry class
  let dataContent = `export const classMapData = {\n`; // START FILE
  for (const type of Object.keys(entriesByType)) {
    const arr = entriesByType[type];
    for (const entry of arr) {
      dataContent += `  '${entry.registrationId}': {\n`;
      dataContent += `    path: '${entry.filePath}',\n`;
      dataContent += `    className: '${entry.className}',\n`;
      dataContent += `    type: '${type}',\n`;
      dataContent += `  },\n`;
    }
  }
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
