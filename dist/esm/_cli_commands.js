#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { getRandomAlphaNumeric } from './util/string';
export async function initCommand() {
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
    await syncCommand();
    console.log('Zeyon initialization complete.');
}
export async function syncCommand() {
    const DECORATOR_TYPE_MAP = {
        registerModel: 'Model',
        registerCollection: 'Collection',
        registerView: 'View',
        registerRouteView: 'RouteView',
        registerCollectionView: 'CollectionView',
    };
    const projectRoot = process.cwd();
    const zeyonDir = path.join(projectRoot, '.Zeyon');
    const typesFile = path.join(zeyonDir, 'ZeyonTypes.d.ts');
    const dataFile = path.join(zeyonDir, 'classMapData.ts');
    if (fs.existsSync(typesFile))
        fs.unlinkSync(typesFile);
    if (fs.existsSync(dataFile))
        fs.unlinkSync(dataFile);
    const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
    if (!fs.existsSync(tsconfigPath)) {
        console.error('No tsconfig.json found at project root');
        return;
    }
    const parsed = ts.parseConfigFileTextToJson(tsconfigPath, fs.readFileSync(tsconfigPath, 'utf-8'));
    const hostConfig = ts.parseJsonConfigFileContent(parsed.config, ts.sys, projectRoot);
    const program = ts.createProgram({
        rootNames: hostConfig.fileNames,
        options: hostConfig.options,
    });
    const entriesByType = {
        Model: [],
        Collection: [],
        View: [],
        RouteView: [],
        CollectionView: [],
    };
    for (const sourceFile of program.getSourceFiles()) {
        if (!sourceFile.isDeclarationFile) {
            ts.forEachChild(sourceFile, (node) => {
                if (ts.isClassDeclaration(node) && node.name && ts.canHaveDecorators(node)) {
                    const decorators = ts.getDecorators(node);
                    if (decorators) {
                        for (const dec of decorators) {
                            if (ts.isDecorator(dec)) {
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
    let dtsContent = `declare module 'zeyon/src/_maps' {\n`;
    for (const key of Object.keys(entriesByType)) {
        const arr = entriesByType[key];
        if (arr.length === 0)
            continue;
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
            dtsContent += `      options: unknown;\n`;
            dtsContent += `    };\n`;
        }
        dtsContent += `  }\n`;
    }
    dtsContent += `}\n`;
    fs.writeFileSync(typesFile, dtsContent, 'utf-8');
    const importsByFile = {};
    const allEntries = [];
    for (const type of Object.keys(entriesByType)) {
        const arr = entriesByType[type];
        for (const entry of arr) {
            const hash = getRandomAlphaNumeric({ len: 10, toUpper: true });
            const alias = `${entry.className}_${hash}`;
            const existing = allEntries.find((e) => e.registrationId === entry.registrationId);
            if (existing) {
                console.warn(`Warning: Duplicate registrationId "${entry.registrationId}". Overwriting previous class ${existing.className}.`);
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
    let dataContent = `// AUTO-GENERATED by Zeyon sync\n\n`;
    Object.keys(importsByFile).forEach((filePath) => {
        const entries = importsByFile[filePath];
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
    dataContent += `};\n`;
    fs.writeFileSync(dataFile, dataContent, 'utf-8');
    console.log(`Generated:\n - ${typesFile}\n - ${dataFile}`);
}
function getDecoratorIdentifier(expr) {
    if (ts.isIdentifier(expr))
        return expr.text;
    if (ts.isPropertyAccessExpression(expr))
        return expr.name.text;
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
        default:
            console.log(`Unknown subcommand: ${subcommand}`);
            console.log(`Usage: zeyon [init|sync]`);
            process.exit(1);
    }
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
import { classMapData } from 'zeyonRootAlias/classMapData';
export { classMapData };
//# sourceMappingURL=_cli_commands.js.map