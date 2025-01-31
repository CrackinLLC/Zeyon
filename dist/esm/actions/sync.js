import fs from 'fs';
import path from 'path';
import { Project, SyntaxKind } from 'ts-morph';
import { getRandomAlphaNumeric } from '../util/string';
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
    const transformDetails = [];
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
        const hash = getRandomAlphaNumeric({ toUpper: true });
        const parsed = path.parse(file.getBaseName());
        const newName = `${parsed.name}_${hash}${parsed.ext}`;
        const clonedFilePath = path.join(genDir, newName);
        const newFile = file.copy(clonedFilePath);
        newFile.getImportDeclarations().forEach((imp) => {
            const updatedImportPath = calculateNewImportPath(filePath, clonedFilePath, imp.getModuleSpecifierValue());
            imp.setModuleSpecifier(updatedImportPath);
        });
        newFile.insertStatements(0, '// @ts-nocheck');
        newFile.getClasses().forEach((cls) => {
            const dec = cls.getDecorators().find((d) => DECORATOR_TO_CLASS_CATEGORY.hasOwnProperty(d.getName()));
            const filePath = path.relative(zeyonDir, clonedFilePath).replace(/\.ts$/g, '').replace(/\\/g, '/');
            if (dec) {
                transformDetails.push({
                    file: newFile,
                    cls,
                    hash,
                    filePath,
                });
            }
        });
    });
    return transformDetails;
}
function applyTransformToClass(transformDetails, projectRoot) {
    const fullTransformDetails = [];
    transformDetails.forEach(({ file, cls, hash, filePath }) => {
        if (!file || !cls || !hash || !filePath)
            return;
        const decorator = cls.getDecorators().find((d) => DECORATOR_TO_CLASS_CATEGORY.hasOwnProperty(d.getName()));
        const [registrationIdArg, propsArg] = decorator.getArguments();
        const registrationId = registrationIdArg.getText().replace(/'/g, '');
        const category = DECORATOR_TO_CLASS_CATEGORY[decorator.getName()];
        const callExpr = decorator.getCallExpression();
        const typeArgs = callExpr?.getTypeArguments() || [];
        cls.addProperty({
            isStatic: true,
            name: 'registrationId',
            initializer: `'${registrationId}'`,
        });
        if (propsArg) {
            const propsObject = propsArg.asKind(SyntaxKind.ObjectLiteralExpression);
            if (propsObject) {
                propsObject.getProperties().forEach((prop) => {
                    if (prop.isKind(SyntaxKind.PropertyAssignment)) {
                        const name = prop.getName();
                        const initializer = prop.getInitializer()?.getText() || 'undefined';
                        cls.addProperty({
                            isStatic: true,
                            name,
                            initializer,
                        });
                    }
                });
            }
        }
        if (typeArgs.length > 0) {
            const optionsTypeText = typeArgs[0].getText();
            cls.addProperty({
                name: 'options',
                hasDeclareKeyword: true,
                type: optionsTypeText,
            });
        }
        cls.rename(`${cls.getName()}_${hash}`);
        decorator.remove();
        file.saveSync();
        fullTransformDetails.push({
            file,
            cls,
            hash,
            category,
            registrationId,
            filePath,
        });
    });
    return fullTransformDetails;
}
function writeClassMapDataFile(details, projectRoot) {
    const imports = details.map((d) => `import { ${d.cls.getName()} } from './${d.filePath}';`).join('\n');
    const classMapEntries = details
        .map((d) => `
    '${d.registrationId}': {
      classRef: ${d.cls.getName()},
      type: '${d.category}'
    }`)
        .join(',');
    const content = `
    ${imports}

    export const classMapData = {
      ${classMapEntries}
    };
  `;
    fs.writeFileSync(path.join(projectRoot, '.Zeyon/classMapData.ts'), content);
}
function writeZeyonTypesFile(details, projectRoot) {
    const typeDeclarations = details.reduce((acc, d) => {
        const typeInterface = `ClassMapType${d.category}`;
        return `${acc}
    interface ${typeInterface} {
      '${d.registrationId}': {
        classRef: typeof import('./${d.filePath}').${d.cls.getName()};
        options: unknown;
      };
    }`;
    }, '');
    const content = `
    declare module 'zeyon/src/_maps' {
    ${typeDeclarations}
  }`;
    fs.writeFileSync(path.join(projectRoot, '.Zeyon/ZeyonTypes.d.ts'), content);
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
    const partialTransformDetails = writeClonesAndGetClassRefs(files, projectRoot);
    const transformDetails = applyTransformToClass(partialTransformDetails, projectRoot);
    writeClassMapDataFile(transformDetails, projectRoot);
    writeZeyonTypesFile(transformDetails, projectRoot);
}
//# sourceMappingURL=sync.js.map