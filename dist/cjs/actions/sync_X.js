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
        if (!file.isDeclarationFile()) {
            let pushed = false;
            for (const cls of file.getClasses()) {
                for (const decorator of cls.getDecorators()) {
                    if (DECORATOR_TO_CLASS_CATEGORY.hasOwnProperty(decorator.getName())) {
                        files.push(file);
                        pushed = true;
                    }
                    if (pushed)
                        break;
                }
                if (pushed)
                    break;
            }
        }
    });
    return files;
}
function writeClonesAndGetClasses(files, projectRoot) {
    const classes = [];
    files.forEach((file) => {
        const filePath = file.getFilePath();
        const zeyonRoot = path_1.default.join(projectRoot, '.Zeyon');
        const newName = `${(0, string_1.getRandomAlphaNumeric)({ toUpper: true })}-${file.getBaseName()}`;
        const newFile = file.copy(path_1.default.join(zeyonRoot, newName));
        for (const imp of newFile.getImportDeclarations()) {
            imp.setModuleSpecifier(calculateNewImportPath(filePath, zeyonRoot, imp.getModuleSpecifierValue()));
        }
        newFile.getClasses().forEach((cls) => {
            for (const dec of cls.getDecorators()) {
                if (DECORATOR_TO_CLASS_CATEGORY.hasOwnProperty(dec.getName())) {
                    classes.push(cls);
                    break;
                }
            }
        });
        newFile.saveSync();
    });
    return classes;
}
function calculateNewImportPath(originalFilePath, clonedFilePath, importPath) {
    if (!importPath.startsWith('.')) {
        return importPath;
    }
    const originalDir = path_1.default.dirname(originalFilePath);
    const absoluteImportPath = path_1.default.resolve(originalDir, importPath);
    const clonedDir = path_1.default.dirname(clonedFilePath);
    let newRelativePath = path_1.default.relative(clonedDir, absoluteImportPath).replace(/\\/g, '/');
    if (!newRelativePath.startsWith('.')) {
        newRelativePath = './' + newRelativePath;
    }
    return newRelativePath;
}
function mutateClassesAndRecordDetails(classes, projectRoot) {
    const mutationDetails = [];
    classes.forEach((cls) => {
        const details = {
            hash: (0, string_1.getRandomAlphaNumeric)({ len: 14, toUpper: true }),
        };
        mutationDetails.push(details);
    });
    return mutationDetails;
}
function writeClassMapDataFile(details, projectRoot) {
}
function writeZeyonTypesFile(details, projectRoot) {
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
    const classes = writeClonesAndGetClasses(files, projectRoot);
    const details = mutateClassesAndRecordDetails(classes, projectRoot);
    writeClassMapDataFile(details, projectRoot);
    writeZeyonTypesFile(details, projectRoot);
}
//# sourceMappingURL=sync_X.js.map