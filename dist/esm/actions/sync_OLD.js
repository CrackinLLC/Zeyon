import fs from 'fs';
import path from 'path';
import ts from 'typescript';
const propRenameMap = {
    Emitter: {},
    Model: {
        attributes: 'definition',
    },
    Collection: {},
    View: {},
    RouteView: {},
    CollectionView: {},
};
const propExtractionMap = {
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
        const result = { val: null };
        if (ts.isStringLiteral(prop.initializer) || ts.isNoSubstitutionTemplateLiteral(prop.initializer)) {
            result.val = prop.initializer.text;
        }
        else if (ts.isTemplateExpression(prop.initializer)) {
            console.log('is template literal with a variable in it!', prop);
        }
        else if (ts.isIdentifier(prop.initializer)) {
            console.log('Is a passed in identifier');
            const identifierName = prop.initializer.getText(prop.initializer.getSourceFile());
            console.log({ identifierName });
        }
        else {
            throw new Error(`Unsupported template initializer kind: ${ts.SyntaxKind[prop.initializer.kind]} for property: ${JSON.stringify(prop.name)}`);
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
function simpleExtractor(prop) {
    const result = { val: null };
    const init = prop.initializer;
    if (ts.isStringLiteral(init)) {
        result.val = JSON.stringify(init.text);
    }
    else {
        throw new Error(`Unsupported simple property for ${prop.name.getText()}`);
    }
    return result;
}
const DECORATOR_TO_CLASS_CATEGORY = {
    registerModel: 'Model',
    registerCollection: 'Collection',
    registerView: 'View',
    registerRouteView: 'RouteView',
    registerCollectionView: 'CollectionView',
};
function filterSourcefiles(program, zeyonRoot) {
    function getDecoratorIdentifier(expr) {
        if (ts.isIdentifier(expr))
            return expr.text;
        if (ts.isPropertyAccessExpression(expr))
            return expr.name.text;
        return undefined;
    }
    const entries = [];
    for (const sourceFile of program.getSourceFiles()) {
        if (!sourceFile.isDeclarationFile) {
            ts.forEachChild(sourceFile, (node) => {
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
function writeGeneratedClassesFile(entries, projectRoot) {
    let content = `// ZEYON AUTO-GENERATED classes\n\n`;
    const byFile = {};
    for (const c of entries) {
        if (!byFile[c.filePath])
            byFile[c.filePath] = [];
        byFile[c.filePath].push(c);
    }
    Object.keys(byFile).forEach((originalFile) => {
        const classes = byFile[originalFile];
        const importList = classes.map((cls) => `${cls.className} as ${cls.className}_orig`).join(', ');
        let relPath = path.relative(projectRoot, originalFile).replace(/\\/g, '/');
        if (!relPath.startsWith('.'))
            relPath = './' + relPath;
        content += `import { ${importList} } from '${relPath}';\n`;
    });
    content += '\n';
    for (const c of entries) {
        const newClassName = `${c.className}_Gen_${c.randomHash}`;
        content += `export class ${newClassName} extends ${c.className}_orig {\n`;
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
function writeClassMapDataFile(entries, zeyonRoot) {
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
function writeZeyonTypesFile(entries, projectRoot) {
    const entriesByType = {
        Model: [],
        Collection: [],
        View: [],
        RouteView: [],
        CollectionView: [],
    };
    entries.forEach((entry) => {
        entriesByType[entry.classCategory].push(entry);
    });
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
    let config = {};
    const configPath = path.join(zeyonRoot, 'zeyon.config.json');
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    if (fs.existsSync(typesFile))
        fs.unlinkSync(typesFile);
    if (fs.existsSync(dataFile))
        fs.unlinkSync(dataFile);
    if (fs.existsSync(generatedClassesFile))
        fs.unlinkSync(generatedClassesFile);
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
    const program = filterSourcefiles(ts.createProgram({
        rootNames: hostConfig.fileNames,
        options: hostConfig.options,
    }), zeyonRoot);
}
//# sourceMappingURL=sync_OLD.js.map