"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureReferenceIsExported = ensureReferenceIsExported;
exports.default = default_1;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ts_morph_1 = require("ts-morph");
const string_1 = require("../util/string");
const DECORATOR_TO_CLASS_CATEGORY = {
    registerModel: 'Model',
    registerCollection: 'Collection',
    registerView: 'View',
    registerRouteView: 'RouteView',
    registerCollectionView: 'CollectionView',
};
function filterSourceFiles(project) {
    const files = [];
    project.getSourceFiles().forEach((file) => {
        if (!file.isDeclarationFile() &&
            !file.getFilePath().includes('.Zeyon') &&
            file.getClasses().some((cls) => cls.getDecorators().some((d) => DECORATOR_TO_CLASS_CATEGORY[d.getName()]))) {
            files.push(file);
        }
    });
    return files;
}
function writeClonesAndGetClassRefs(files, projectRoot) {
    const clones = [];
    function calculateNewImportPath(originalFilePath, clonedFilePath, importPath) {
        if (!importPath.startsWith('.')) {
            return importPath;
        }
        const originalDir = path_1.default.dirname(originalFilePath);
        const absoluteImportPath = path_1.default.resolve(originalDir, importPath);
        const clonedDir = path_1.default.dirname(clonedFilePath);
        let newRelativePath = path_1.default.relative(clonedDir, absoluteImportPath).replace(/\\/g, '/');
        if (!newRelativePath.startsWith('.')) {
            newRelativePath = `./${newRelativePath}`;
        }
        return newRelativePath;
    }
    const zeyonDir = path_1.default.join(projectRoot, '.Zeyon');
    const genDir = path_1.default.join(zeyonDir, 'gen');
    if (fs_1.default.existsSync(genDir)) {
        fs_1.default.rmSync(genDir, { recursive: true, force: true });
    }
    fs_1.default.mkdirSync(genDir, { recursive: true });
    files.forEach((file) => {
        const filePath = file.getFilePath();
        const hash = (0, string_1.getRandomAlphaNumeric)({ toUpper: true });
        const parsed = path_1.default.parse(file.getBaseName());
        const newName = `${parsed.name}_${hash}${parsed.ext}`;
        const clonedFilePath = path_1.default.join(genDir, newName);
        const newFile = file.copy(clonedFilePath);
        newFile.getImportDeclarations().forEach((imp) => {
            const updatedImportPath = calculateNewImportPath(filePath, clonedFilePath, imp.getModuleSpecifierValue());
            imp.setModuleSpecifier(updatedImportPath);
        });
        newFile.getClasses().forEach((cls) => {
            const dec = cls.getDecorators().find((d) => DECORATOR_TO_CLASS_CATEGORY.hasOwnProperty(d.getName()));
            const filePath = path_1.default.relative(zeyonDir, clonedFilePath).replace(/\.ts$/g, '').replace(/\\/g, '/');
            if (dec) {
                clones.push({
                    file: newFile,
                    cls,
                    hash,
                    filePath,
                });
            }
        });
    });
    return clones;
}
function ensureReferenceIsExported(file, name, type) {
    const exportedDeclarations = file.getExportedDeclarations();
    const importedDeclarations = file.getImportDeclarations();
    if (exportedDeclarations.has(name))
        return;
    if (name.includes('.')) {
        return;
    }
    const isImportedByName = () => {
        for (const imp of importedDeclarations) {
            for (const namedImport of imp.getNamedImports()) {
                if (namedImport.getName() === name)
                    return true;
                if (namedImport.getAliasNode()?.getText() === name)
                    return true;
            }
        }
        return false;
    };
    if (isImportedByName()) {
        for (const imp of importedDeclarations) {
            for (const namedImport of imp.getNamedImports()) {
                if (namedImport.getName() === name) {
                    const fromPath = imp.getModuleSpecifierValue();
                    file.addStatements(`export { ${name} } from '${fromPath}';`);
                    return;
                }
                if (namedImport.getAliasNode()?.getText() === name) {
                }
            }
        }
        return;
    }
    switch (type) {
        case 'interface':
            const iface = file.getInterface(name);
            const ifaceName = iface?.getName();
            if (iface && (ifaceName ? !exportedDeclarations.has(ifaceName) : !iface.isExported())) {
                iface.setIsExported(true);
                return;
            }
            break;
        case 'class':
            const cls = file.getClass(name);
            const clsName = cls?.getName();
            if (cls && (clsName ? !exportedDeclarations.has(clsName) : !cls.isExported())) {
                cls.setIsExported(true);
                return;
            }
            break;
    }
    file.addStatements(`export type ${name} = ${name};`);
}
function applyTransformsToClasses(clones) {
    const transformDetails = [];
    clones.forEach(({ file, cls, hash, filePath }) => {
        const decorator = cls.getDecorators().find((d) => DECORATOR_TO_CLASS_CATEGORY.hasOwnProperty(d.getName()));
        const callExpr = decorator.getCallExpression();
        const [registrationIdArg, propsArg] = decorator.getArguments();
        const category = DECORATOR_TO_CLASS_CATEGORY[decorator.getName()];
        const registrationId = registrationIdArg.getText().replace(/'/g, '');
        registrationIdArg?.forget();
        const typeArgs = callExpr?.getTypeArguments() || [];
        const optionsTypeName = typeArgs.length > 0 ? typeArgs[0].getText() : '';
        const clsOldName = cls.getName() || '';
        const clsNewName = `${clsOldName || 'UNNAMED_CLASS'}_${hash}`;
        cls.rename(clsNewName);
        if (propsArg) {
            propsArg
                .asKind(ts_morph_1.SyntaxKind.ObjectLiteralExpression)
                ?.getProperties()
                .forEach((prop) => {
                if (prop.isKind(ts_morph_1.SyntaxKind.PropertyAssignment)) {
                    const name = prop.getName();
                    const initializer = prop.getInitializer()?.getText() || 'undefined';
                    cls.addProperty({
                        isStatic: true,
                        name,
                        initializer,
                    });
                }
                else if (prop.isKind(ts_morph_1.SyntaxKind.ShorthandPropertyAssignment)) {
                    const name = prop.getName();
                    cls.addProperty({
                        isStatic: true,
                        name,
                        initializer: name,
                    });
                }
            });
            propsArg.forget();
        }
        callExpr?.forget();
        cls.addProperty({
            isStatic: true,
            name: 'registrationId',
            initializer: `'${registrationId}'`,
        });
        cls.addProperty({
            isStatic: true,
            name: 'originalName',
            initializer: `'${clsOldName}'`,
        });
        if (optionsTypeName) {
            cls.addProperty({
                name: 'options',
                hasDeclareKeyword: true,
                type: optionsTypeName,
            });
            ensureReferenceIsExported(file, optionsTypeName, 'interface');
        }
        ensureReferenceIsExported(file, clsNewName, 'class');
        decorator.remove();
        decorator.forget();
        const printer = ts_morph_1.ts.createPrinter({ removeComments: true });
        const cleanText = printer.printFile(file.compilerNode).replace(/^\s*[\r\n]/gm, '');
        file.replaceWithText(cleanText);
        file.insertStatements(0, '// @ts-nocheck');
        file.saveSync();
        transformDetails.push({
            clsName: clsNewName,
            hash,
            category,
            registrationId,
            filePath,
            optionsTypeName,
        });
    });
    return transformDetails;
}
function writeClassMapDataFile(details, projectRoot) {
    const imports = details.map((d) => `import {${d.clsName}} from './${d.filePath}';`).join('\n');
    const classMapEntries = details
        .map((d) => ` '${d.registrationId}': {\n  classRef: ${d.clsName},\n  type: '${d.category}'\n }`)
        .join(',\n');
    const content = `${imports}\n\nexport const classMapData = {\n${classMapEntries}\n};\n`;
    fs_1.default.writeFileSync(path_1.default.join(projectRoot, '.Zeyon/classMapData.ts'), content);
}
function writeZeyonTypesFile(details, projectRoot) {
    const createEntry = (d) => {
        const importFrom = `import('./${d.filePath}')`;
        const optionsType = d.optionsTypeName ? `${importFrom}.${d.optionsTypeName}` : 'never';
        return `  '${d.registrationId}': {\n   classRef: typeof ${importFrom}.${d.clsName};\n   options: ${optionsType};\n  }`;
    };
    const maps = {
        Model: [],
        Collection: [],
        View: [],
        RouteView: [],
        CollectionView: [],
    };
    details.forEach((detail) => {
        maps[detail.category].push(createEntry(detail));
    });
    let entriesString = '';
    Object.entries(maps).forEach(([category, lines], i) => {
        entriesString += ` interface ClassMapType${category} {`;
        if (!lines.length) {
            entriesString += '}';
        }
        else {
            entriesString += '\n' + lines.join('\n') + '\n }';
        }
        if (i + 1 < Object.keys(maps).length) {
            entriesString += '\n';
        }
    });
    const content = [`declare module 'zeyon/_maps' {`, entriesString, '}'];
    fs_1.default.writeFileSync(path_1.default.join(projectRoot, '.Zeyon/ZeyonTypes.d.ts'), content.join('\n'));
}
async function default_1() {
    const projectRoot = process.cwd();
    const zeyonRoot = path_1.default.join(projectRoot, '.Zeyon');
    const typesFile = path_1.default.join(zeyonRoot, 'ZeyonTypes.d.ts');
    const dataFile = path_1.default.join(zeyonRoot, 'classMapData.ts');
    const generatedClassesFile = path_1.default.join(zeyonRoot, 'GenClasses.ts');
    if (!fs_1.default.existsSync(zeyonRoot)) {
        fs_1.default.mkdirSync(zeyonRoot, { recursive: true });
    }
    let config = null;
    const configPath = path_1.default.join(zeyonRoot, 'zeyon.config.json');
    if (fs_1.default.existsSync(configPath)) {
        config = JSON.parse(fs_1.default.readFileSync(configPath, 'utf-8'));
    }
    if (config) {
    }
    if (fs_1.default.existsSync(typesFile))
        fs_1.default.unlinkSync(typesFile);
    if (fs_1.default.existsSync(dataFile))
        fs_1.default.unlinkSync(dataFile);
    if (fs_1.default.existsSync(generatedClassesFile))
        fs_1.default.unlinkSync(generatedClassesFile);
    const tsConfigFilePath = path_1.default.join(projectRoot, 'tsconfig.json');
    if (!fs_1.default.existsSync(tsConfigFilePath)) {
        console.error('No tsconfig.json found at project root');
        return;
    }
    const files = filterSourceFiles(new ts_morph_1.Project({ tsConfigFilePath }));
    const clonesAndClasses = writeClonesAndGetClassRefs(files, projectRoot);
    const transformDetails = applyTransformsToClasses(clonesAndClasses);
    writeClassMapDataFile(transformDetails, projectRoot);
    writeZeyonTypesFile(transformDetails, projectRoot);
}
//# sourceMappingURL=sync.js.map