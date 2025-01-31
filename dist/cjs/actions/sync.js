"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
    const transformDetails = [];
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
        newFile.insertStatements(0, '// @ts-nocheck');
        newFile.getClasses().forEach((cls) => {
            const dec = cls.getDecorators().find((d) => DECORATOR_TO_CLASS_CATEGORY.hasOwnProperty(d.getName()));
            const filePath = path_1.default.relative(zeyonDir, clonedFilePath).replace(/\.ts$/g, '').replace(/\\/g, '/');
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
            const propsObject = propsArg.asKind(ts_morph_1.SyntaxKind.ObjectLiteralExpression);
            if (propsObject) {
                propsObject.getProperties().forEach((prop) => {
                    if (prop.isKind(ts_morph_1.SyntaxKind.PropertyAssignment)) {
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
    fs_1.default.writeFileSync(path_1.default.join(projectRoot, '.Zeyon/classMapData.ts'), content);
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
    fs_1.default.writeFileSync(path_1.default.join(projectRoot, '.Zeyon/ZeyonTypes.d.ts'), content);
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
    const partialTransformDetails = writeClonesAndGetClassRefs(files, projectRoot);
    const transformDetails = applyTransformToClass(partialTransformDetails, projectRoot);
    writeClassMapDataFile(transformDetails, projectRoot);
    writeZeyonTypesFile(transformDetails, projectRoot);
}
//# sourceMappingURL=sync.js.map