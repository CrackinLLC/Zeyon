import fs from 'fs';
import path from 'path';
import { Project } from 'ts-morph';
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
        const zeyonRoot = path.join(projectRoot, '.Zeyon');
        const newName = `${getRandomAlphaNumeric({ toUpper: true })}-${file.getBaseName()}`;
        const newFile = file.copy(path.join(zeyonRoot, newName));
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
    const originalDir = path.dirname(originalFilePath);
    const absoluteImportPath = path.resolve(originalDir, importPath);
    const clonedDir = path.dirname(clonedFilePath);
    let newRelativePath = path.relative(clonedDir, absoluteImportPath).replace(/\\/g, '/');
    if (!newRelativePath.startsWith('.')) {
        newRelativePath = './' + newRelativePath;
    }
    return newRelativePath;
}
function mutateClassesAndRecordDetails(classes, projectRoot) {
    const mutationDetails = [];
    classes.forEach((cls) => {
        const details = {
            hash: getRandomAlphaNumeric({ len: 14, toUpper: true }),
        };
        mutationDetails.push(details);
    });
    return mutationDetails;
}
function writeClassMapDataFile(details, projectRoot) {
}
function writeZeyonTypesFile(details, projectRoot) {
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
    const classes = writeClonesAndGetClasses(files, projectRoot);
    const details = mutateClassesAndRecordDetails(classes, projectRoot);
    writeClassMapDataFile(details, projectRoot);
    writeZeyonTypesFile(details, projectRoot);
}
//# sourceMappingURL=sync.js.map