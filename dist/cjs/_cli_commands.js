#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCommand = initCommand;
exports.syncCommand = syncCommand;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const typescript_1 = __importDefault(require("typescript"));
async function initCommand() {
    const projectRoot = process.cwd();
    const zeyonDir = path_1.default.join(projectRoot, '.Zeyon');
    const configPath = path_1.default.join(zeyonDir, 'zeyon.config.json');
    if (!fs_1.default.existsSync(zeyonDir)) {
        fs_1.default.mkdirSync(zeyonDir);
        console.log(`Created directory: ${zeyonDir}`);
    }
    if (!fs_1.default.existsSync(configPath)) {
        const defaultConfig = {
            projectRoot,
        };
        fs_1.default.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    }
    else {
        console.log(`Config already exists at ${configPath}, skipping creation.`);
    }
    await syncCommand();
    console.log('Zeyon initialization complete.');
}
async function syncCommand() {
    const DECORATOR_TYPE_MAP = {
        defineModel: 'Model',
        defineCollection: 'Collection',
        defineView: 'View',
        defineRouteView: 'RouteView',
        defineCollectionView: 'CollectionView',
    };
    const projectRoot = process.cwd();
    const zeyonDir = path_1.default.join(projectRoot, '.Zeyon');
    const typesFile = path_1.default.join(zeyonDir, 'ZeyonTypes.d.ts');
    const dataFile = path_1.default.join(zeyonDir, 'classMapData.ts');
    if (fs_1.default.existsSync(typesFile))
        fs_1.default.unlinkSync(typesFile);
    if (fs_1.default.existsSync(dataFile))
        fs_1.default.unlinkSync(dataFile);
    const tsconfigPath = path_1.default.join(projectRoot, 'tsconfig.json');
    if (!fs_1.default.existsSync(tsconfigPath)) {
        console.error('No tsconfig.json found at project root');
        return;
    }
    const parsed = typescript_1.default.parseConfigFileTextToJson(tsconfigPath, fs_1.default.readFileSync(tsconfigPath, 'utf-8'));
    const hostConfig = typescript_1.default.parseJsonConfigFileContent(parsed.config, typescript_1.default.sys, projectRoot);
    const program = typescript_1.default.createProgram({
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
            typescript_1.default.forEachChild(sourceFile, (node) => {
                if (typescript_1.default.isClassDeclaration(node) && node.name && typescript_1.default.canHaveDecorators(node)) {
                    const decorators = typescript_1.default.getDecorators(node);
                    if (decorators) {
                        for (const dec of decorators) {
                            if (typescript_1.default.isDecorator(dec)) {
                                const expr = dec.expression;
                                if (typescript_1.default.isCallExpression(expr)) {
                                    const decoratorName = getDecoratorIdentifier(expr.expression);
                                    if (decoratorName && DECORATOR_TYPE_MAP[decoratorName]) {
                                        const [registrationIdArg] = expr.arguments;
                                        if (registrationIdArg && typescript_1.default.isStringLiteral(registrationIdArg)) {
                                            entriesByType[DECORATOR_TYPE_MAP[decoratorName]].push({
                                                registrationId: registrationIdArg.text,
                                                className: node.name.text,
                                                filePath: path_1.default.relative(zeyonDir, sourceFile.fileName.replace(/\.(ts|tsx)$/, '')),
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
    let dtsContent = `declare module 'zeyon/src/_index.d' {\n`;
    for (const key of Object.keys(entriesByType)) {
        const arr = entriesByType[key];
        if (arr.length === 0)
            continue;
        dtsContent += `  interface ClassMapType${key} {\n`;
        for (const entry of arr) {
            dtsContent += `    '${entry.registrationId}': {\n`;
            dtsContent += `      definition: typeof import('${entry.filePath}').${entry.className};\n`;
            dtsContent += `      options: unknown;\n`;
            dtsContent += `    };\n`;
        }
        dtsContent += `  }\n`;
    }
    dtsContent += `}\n`;
    fs_1.default.writeFileSync(typesFile, dtsContent, 'utf-8');
    let dataContent = `export const classMapData = {\n`;
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
    dataContent += `};\n`;
    fs_1.default.writeFileSync(dataFile, dataContent, 'utf-8');
    console.log(`Generated:\n - ${typesFile}\n - ${dataFile}`);
}
function getDecoratorIdentifier(expr) {
    if (typescript_1.default.isIdentifier(expr))
        return expr.text;
    if (typescript_1.default.isPropertyAccessExpression(expr))
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
//# sourceMappingURL=_cli_commands.js.map