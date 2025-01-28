import fs from 'fs';
import path from 'path';
import { ClassDeclaration, Project, SourceFile } from 'ts-morph';
import { getRandomAlphaNumeric } from '../util/string';

/**
 * Maps a decorator name to the category of class it belongs to
 */
const DECORATOR_TO_CLASS_CATEGORY: Record<string, string> = {
  registerModel: 'Model',
  registerCollection: 'Collection',
  registerView: 'View',
  registerRouteView: 'RouteView',
  registerCollectionView: 'CollectionView',
};

/**
 * Traverses the full set of sourcefiles in the project and filters them down based on the existance
 * of classes that include any of our "register" decorators.
 * @returns files
 */
function filterSourceFiles(project: Project): SourceFile[] {
  const files: SourceFile[] = [];

  project.getSourceFiles().forEach((file: SourceFile) => {
    if (!file.isDeclarationFile()) {
      let pushed = false;
      for (const cls of file.getClasses()) {
        for (const decorator of cls.getDecorators()) {
          if (DECORATOR_TO_CLASS_CATEGORY.hasOwnProperty(decorator.getName())) {
            // TODO: Merge filter and clone steps together here
            files.push(file);
            pushed = true;
          }
          if (pushed) break;
        }
        if (pushed) break;
      }
    }
  });

  return files;
}

/**
 *
 * @param files
 * @param projectRoot
 * @returns
 */
function writeClonesAndGetClasses(files: SourceFile[], projectRoot: string): ClassDeclaration[] {
  const classes: ClassDeclaration[] = [];

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

function calculateNewImportPath(originalFilePath: string, clonedFilePath: string, importPath: string): string {
  // Non-relative imports remain unchanged
  if (!importPath.startsWith('.')) {
    return importPath;
  }

  // Resolve the absolute path of the original import
  const originalDir = path.dirname(originalFilePath);
  const absoluteImportPath = path.resolve(originalDir, importPath);

  // Compute new relative path from cloned file to the imported module
  const clonedDir = path.dirname(clonedFilePath);
  let newRelativePath = path.relative(clonedDir, absoluteImportPath).replace(/\\/g, '/');

  if (!newRelativePath.startsWith('.')) {
    newRelativePath = './' + newRelativePath;
  }

  return newRelativePath;
}

interface MutationDetails {
  hash: string;
  className: string;
  category: string;
  registrationId: string;
  path: string;
}

function mutateClassesAndRecordDetails(classes: ClassDeclaration[], projectRoot: string): MutationDetails[] {
  // TODO: Use this to rename argument keys to different class property keys
  // const propRenameMap: { [category: string]: { [key: string]: string } } = {
  //   Emitter: {},
  //   Model: {
  //     attributes: 'definition',
  //   },
  //   Collection: {},
  //   View: {},
  //   RouteView: {},
  //   CollectionView: {},
  // };

  const mutationDetails: MutationDetails[] = [];

  classes.forEach((cls: ClassDeclaration) => {
    const details: Partial<MutationDetails> = {
      hash: getRandomAlphaNumeric({ len: 14, toUpper: true }),
    };

    // TODO: Pull our options interface and argument nodes from the decorator
    // TODO: Apply pulled nodes to our class
    // TODO: Wipe decorator reference
    // TODO: Compile details of the change and push to mutationDetails to facilitate map creation

    mutationDetails.push(details as MutationDetails);
  });

  return mutationDetails;
}

function writeClassMapDataFile(details: MutationDetails[], projectRoot: string): void {
  // TODO: Use the details array to write our classMapData file
}

function writeZeyonTypesFile(details: MutationDetails[], projectRoot: string): void {
  // TODO: Use the details array to write our ZeyonTypes file
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

  let config: any = null;
  const configPath = path.join(zeyonRoot, 'zeyon.config.json');
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }

  // TODO: Introduce any valid properties into our config that would affect file generation
  if (config) {
    // Read config if it exists (Currently unused)
  }

  if (fs.existsSync(typesFile)) fs.unlinkSync(typesFile);
  if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  if (fs.existsSync(generatedClassesFile)) fs.unlinkSync(generatedClassesFile);

  // Load and parse user's tsconfig
  const tsConfigFilePath = path.join(projectRoot, 'tsconfig.json');
  if (!fs.existsSync(tsConfigFilePath)) {
    console.error('No tsconfig.json found at project root');
    return;
  }

  const files = filterSourceFiles(new Project({ tsConfigFilePath }));

  // TODO: Can we nuke our clones before writing new ones? Maybe use a subdirectory and empty it?
  const classes = writeClonesAndGetClasses(files, projectRoot);
  const details = mutateClassesAndRecordDetails(classes, projectRoot);

  writeClassMapDataFile(details, projectRoot);
  writeZeyonTypesFile(details, projectRoot);
}
