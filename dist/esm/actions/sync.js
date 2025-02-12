import fs from 'fs';
import path from 'path';
import { Project, SyntaxKind, ts } from 'ts-morph';
import { random } from '../util/string';
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
        const originalDir = path.dirname(originalFilePath);
        const absoluteImportPath = path.resolve(originalDir, importPath);
        const clonedDir = path.dirname(clonedFilePath);
        let newRelativePath = path.relative(clonedDir, absoluteImportPath).replace(/\\/g, '/');
        if (!newRelativePath.startsWith('.')) {
            newRelativePath = `./${newRelativePath}`;
        }
        return newRelativePath;
    }
    const zeyonDir = path.join(projectRoot, '.Zeyon');
    const genDir = path.join(zeyonDir, 'gen');
    if (fs.existsSync(genDir)) {
        fs.rmSync(genDir, { recursive: true, force: true });
    }
    fs.mkdirSync(genDir, { recursive: true });
    files.forEach((file) => {
        const filePath = file.getFilePath();
        const hash = random({ toUpper: true });
        const parsed = path.parse(file.getBaseName());
        const newName = `${parsed.name}_${hash}${parsed.ext}`;
        const clonedFilePath = path.join(genDir, newName);
        const newFile = file.copy(clonedFilePath);
        newFile.getImportDeclarations().forEach((imp) => {
            const updatedImportPath = calculateNewImportPath(filePath, clonedFilePath, imp.getModuleSpecifierValue());
            imp.setModuleSpecifier(updatedImportPath);
        });
        newFile.getClasses().forEach((cls) => {
            const dec = cls.getDecorators().find((d) => DECORATOR_TO_CLASS_CATEGORY.hasOwnProperty(d.getName()));
            const filePath = path.relative(zeyonDir, clonedFilePath).replace(/\.ts$/g, '').replace(/\\/g, '/');
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
export function ensureReferenceIsExported(file, name, type) {
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
                .asKind(SyntaxKind.ObjectLiteralExpression)
                ?.getProperties()
                .forEach((prop) => {
                if (prop.isKind(SyntaxKind.PropertyAssignment)) {
                    const name = prop.getName();
                    const initializer = prop.getInitializer()?.getText() || 'undefined';
                    cls.addProperty({
                        isStatic: true,
                        name,
                        initializer,
                    });
                }
                else if (prop.isKind(SyntaxKind.ShorthandPropertyAssignment)) {
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
        const printer = ts.createPrinter({ removeComments: true });
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
    fs.writeFileSync(path.join(projectRoot, '.Zeyon/classMapData.ts'), content);
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
    fs.writeFileSync(path.join(projectRoot, '.Zeyon/ZeyonTypes.d.ts'), content.join('\n'));
}
export default async function () {
    const projectRoot = process.cwd();
    const zeyonRoot = path.join(projectRoot, '.Zeyon');
    const typesFile = path.join(zeyonRoot, 'ZeyonTypes.d.ts');
    const dataFile = path.join(zeyonRoot, 'classMapData.ts');
    const generatedClassesFile = path.join(zeyonRoot, 'GenClasses.ts');
    if (!fs.existsSync(zeyonRoot)) {
        fs.mkdirSync(zeyonRoot, { recursive: true });
    }
    let config = null;
    const configPath = path.join(zeyonRoot, 'zeyon.config.json');
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    if (config) {
    }
    if (fs.existsSync(typesFile))
        fs.unlinkSync(typesFile);
    if (fs.existsSync(dataFile))
        fs.unlinkSync(dataFile);
    if (fs.existsSync(generatedClassesFile))
        fs.unlinkSync(generatedClassesFile);
    const tsConfigFilePath = path.join(projectRoot, 'tsconfig.json');
    if (!fs.existsSync(tsConfigFilePath)) {
        console.error('No tsconfig.json found at project root');
        return;
    }
    const files = filterSourceFiles(new Project({ tsConfigFilePath }));
    const clonesAndClasses = writeClonesAndGetClassRefs(files, projectRoot);
    const transformDetails = applyTransformsToClasses(clonesAndClasses);
    writeClassMapDataFile(transformDetails, projectRoot);
    writeZeyonTypesFile(transformDetails, projectRoot);
}
//# sourceMappingURL=sync.js.map