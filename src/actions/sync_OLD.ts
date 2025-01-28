import fs from 'fs';
import path from 'path';
import ts from 'typescript';

interface CollectedClass {
  decoratorName: string;
  registrationId: string;
  filePath: string;
  className: string;
  classCategory: string;
  randomHash: string;
  props?: Record<string, unknown>;
}

const propRenameMap: { [category: string]: { [key: string]: string } } = {
  Emitter: {},
  Model: {
    attributes: 'definition',
  },
  Collection: {},
  View: {},
  RouteView: {},
  CollectionView: {},
};

type propExtractionResult = { val: unknown; instruction?: unknown };
const propExtractionMap: {
  [category: string]: { [key: string]: (prop: ts.PropertyAssignment) => propExtractionResult };
} = {
  Emitter: {},
};
propExtractionMap.Model = {
  ...propExtractionMap.Emitter,
};
propExtractionMap.Collection = {
  ...propExtractionMap.Emitter,
};
propExtractionMap.View = {
  ...propExtractionMap.Emitter,
  template: (prop) => {
    const result: propExtractionResult = { val: null };

    if (ts.isStringLiteral(prop.initializer) || ts.isNoSubstitutionTemplateLiteral(prop.initializer)) {
      result.val = prop.initializer.text;
    } else if (ts.isTemplateExpression(prop.initializer)) {
      console.log('is template literal with a variable in it!', prop);
      // result.val = prop.initializer.getText(prop.initializer.getSourceFile()); // THIS DOESN'T WORK

      // TODO: Use instruction to handle the case where the variable was an imported value
    } else if (ts.isIdentifier(prop.initializer)) {
      console.log('Is a passed in identifier');

      const identifierName = prop.initializer.getText(prop.initializer.getSourceFile());

      console.log({ identifierName });
      // "val" equals name of import
      // "instruction" indicates that an import is needed
    } else {
      throw new Error(
        `Unsupported template initializer kind: ${ts.SyntaxKind[prop.initializer.kind]} for property: ${JSON.stringify(
          prop.name,
        )}`,
      );
    }

    return result;
  },
};
propExtractionMap.View.templateWrapper = propExtractionMap.View.template;
propExtractionMap.RouteView = {
  ...propExtractionMap.View,
};
propExtractionMap.CollectionView = {
  ...propExtractionMap.View,
};
function simpleExtractor(prop: ts.PropertyAssignment): propExtractionResult {
  const result: propExtractionResult = { val: null };
  const init = prop.initializer;

  // If we only allow booleans or string-literals:
  // if (ts.isBooleanLiteral(init)) {
  //   result.val = init.getText(); // "true" or "false"
  // }
  if (ts.isStringLiteral(init)) {
    result.val = JSON.stringify(init.text); // quoted
  } else {
    throw new Error(`Unsupported simple property for ${prop.name.getText()}`);
  }

  return result;
}

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

function filterSourcefiles(program: ts.Program, zeyonRoot: string): ts.Program {
  /**
   * Helper to get the name of the decorator function.
   */
  function getDecoratorIdentifier(expr: ts.Expression): string | undefined {
    if (ts.isIdentifier(expr)) return expr.text;
    if (ts.isPropertyAccessExpression(expr)) return expr.name.text;
    return undefined;
  }

  // function getEntryPropsFromPropsArg(props: ts.Expression, category: string) {
  //   const entryProps: Record<string, any> = {};

  //   if (props && ts.isObjectLiteralExpression(props)) {
  //     props.properties.forEach((prop) => {
  //       if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.initializer) {
  //         const key = prop.name.escapedText;
  //         if (key) {
  //           const extractionFn = propExtractionMap[category][key] ?? simpleExtractor;
  //           const { val, instruction } = extractionFn(prop);
  //           if (val != null) {
  //             const rename = propRenameMap[category][key] || key;
  //             entryProps[rename] = { val, instruction };
  //           }
  //         }
  //       }
  //     });
  //   }

  //   return entryProps;
  // }

  const entries: CollectedClass[] = [];

  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile) {
      ts.forEachChild(sourceFile, (node) => {
        // We only care about class declarations with decorators
        if (ts.isClassDeclaration(node) && node.name && ts.canHaveDecorators(node)) {
          const decorators = ts.getDecorators(node);
          if (decorators) {
            for (const dec of decorators) {
              if (ts.isDecorator(dec) && ts.isCallExpression(dec.expression)) {
                const decoratorName = getDecoratorIdentifier(dec.expression.expression);
                const classCategory = DECORATOR_TO_CLASS_CATEGORY[decoratorName || ''];
                if (decoratorName && classCategory) {
                  const [registrationIdArg, propsArg] = dec.expression.arguments;
                  if (registrationIdArg && ts.isStringLiteral(registrationIdArg)) {
                    //   let props: Record<string, any> = getEntryPropsFromPropsArg(propsArg, classCategory);
                    //   entries.push({
                    //     decoratorName: decoratorName,
                    //     registrationId: registrationIdArg.text,
                    //     className: node.name.text,
                    //     classCategory,
                    //     filePath: path.relative(zeyonRoot, sourceFile.fileName.replace(/\.(ts|tsx)$/, '')),
                    //     randomHash: getRandomAlphaNumeric({ len: 6, toUpper: true }),
                    //     ...(Object.keys(props).length ? { props } : {}),
                    //   });
                  }
                }
              }
            }
          }
        }
      });
    }
  }

  return entries;
}

function writeGeneratedClassesFile(entries: CollectedClass[], projectRoot: string) {
  let content = `// ZEYON AUTO-GENERATED classes\n\n`;

  // Group by original file
  const byFile: Record<string, CollectedClass[]> = {};
  for (const c of entries) {
    if (!byFile[c.filePath]) byFile[c.filePath] = [];
    byFile[c.filePath].push(c);
  }

  // For each original file, import the classes
  Object.keys(byFile).forEach((originalFile) => {
    const classes = byFile[originalFile];

    // we create unique aliases
    const importList = classes.map((cls) => `${cls.className} as ${cls.className}_orig`).join(', ');

    let relPath = path.relative(projectRoot, originalFile).replace(/\\/g, '/');
    if (!relPath.startsWith('.')) relPath = './' + relPath;

    // TODO: Need to modify to handle default and non-default exports

    content += `import { ${importList} } from '${relPath}';\n`;
    // TODO: Figure out if user’s props need import, e.g. template references, and do that too
    // TODO: Formulate a map of every potential prop by class type, and define rules for each to be referenced here
  });

  content += '\n';

  // Re-declare an extended instance of the original classes and attach the props passed to decorator
  for (const c of entries) {
    // TODO: Implement a strategy for chunking content across multiple files
    const newClassName = `${c.className}_Gen_${c.randomHash}`;

    content += `export class ${newClassName} extends ${c.className}_orig {\n`;

    // TODO: Formulate a map of every potential prop by class type, and define rules for each to be referenced here
    content += `  static registrationId = "${c.registrationId}";\n`;
    if (c.props) {
      for (const [key, valText] of Object.entries(c.props)) {
        content += `  static ${key} = ${valText};\n`;
      }
    }
    content += `}\n\n`;
  }

  const filePath = path.join(projectRoot, '.Zeyon', 'ZeyonGeneratedClasses.ts');
  fs.writeFileSync(filePath, content, 'utf-8');
}

function writeClassMapDataFile(entries: CollectedClass[], zeyonRoot: string) {
  let content = `import * as Gen from './ZeyonGeneratedClasses';\n\n`;

  content += `export const classMapData = {\n`;
  for (const c of entries) {
    const newClassName = `${c.className}_Gen_${c.randomHash}`;

    content += `  '${c.registrationId}': {\n`;
    content += `    classRef: Gen.${newClassName},\n`;
    content += `    type: '${c.classCategory}',\n`;
    content += `  },\n`;
  }
  content += `};\n`;

  fs.writeFileSync(path.join(zeyonRoot, 'classMapData.ts'), content, 'utf-8');
}

function writeZeyonTypesFile(entries: CollectedClass[], projectRoot: string) {
  const entriesByType: { [key: string]: CollectedClass[] } = {
    Model: [],
    Collection: [],
    View: [],
    RouteView: [],
    CollectionView: [],
  };
  entries.forEach((entry) => {
    entriesByType[entry.classCategory].push(entry);
  });

  let dtsContent = `declare module 'zeyon/src/_maps' {\n`; // START FILE
  for (const key of Object.keys(entriesByType)) {
    const arr = entriesByType[key];

    if (arr.length === 0) continue;

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
      dtsContent += `      options: unknown;\n`; // TODO: Update with parsed options interface
      dtsContent += `    };\n`;
    }

    dtsContent += `  }\n`;
  }
  dtsContent += `}\n`; // END FILE

  fs.writeFileSync(path.join(projectRoot, '.Zeyon', 'ZeyonTypes.d.ts'), dtsContent, 'utf-8');
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

  let config: any = {};
  const configPath = path.join(zeyonRoot, 'zeyon.config.json');
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }

  // TODO: Introduce any valid properties into our config that would affect file generation
  // Read config if it exists (Currently unused)

  if (fs.existsSync(typesFile)) fs.unlinkSync(typesFile);
  if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  if (fs.existsSync(generatedClassesFile)) fs.unlinkSync(generatedClassesFile);

  // Load and parse user's tsconfig
  const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) {
    console.error('No tsconfig.json found at project root');
    return;
  }
  const parsed = ts.parseConfigFileTextToJson(tsconfigPath, fs.readFileSync(tsconfigPath, 'utf-8'));
  if (parsed.error) {
    console.error('Error parsing tsconfig.json:', parsed.error);
    return;
  }
  const hostConfig = ts.parseJsonConfigFileContent(parsed.config, ts.sys, projectRoot);

  // Create a program from discovered TS files
  const program = filterSourcefiles(
    ts.createProgram({
      rootNames: hostConfig.fileNames,
      options: hostConfig.options,
    }),
    zeyonRoot,
  );

  // const log = entries.map((entry) => entry.props || undefined);
  // console.log('ENTRIES:', log);

  // writeGeneratedClassesFile(entries, projectRoot);
  // writeClassMapDataFile(entries, zeyonRoot);
  // writeZeyonTypesFile(entries, projectRoot);
}
