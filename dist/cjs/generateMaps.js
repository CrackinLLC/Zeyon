"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const typescript_1 = __importDefault(require("typescript"));
const projectDir = path_1.default.resolve(__dirname);
const srcDir = path_1.default.join(projectDir, 'src');
const generatedDir = path_1.default.join(srcDir, 'generated');
if (!fs_1.default.existsSync(generatedDir)) {
    fs_1.default.mkdirSync(generatedDir);
}
const dynamic = process.argv.includes('--dynamic');
function getAllTsFiles(dir, fileList = []) {
    const files = fs_1.default.readdirSync(dir);
    for (const f of files) {
        const fp = path_1.default.join(dir, f);
        const stat = fs_1.default.statSync(fp);
        if (stat.isDirectory()) {
            getAllTsFiles(fp, fileList);
        }
        else if (fp.endsWith('.ts') && !fp.endsWith('.d.ts')) {
            fileList.push(fp);
        }
    }
    return fileList;
}
function objectLiteralToRecord(obj, source) {
    const record = {};
    for (const prop of obj.properties) {
        if (typescript_1.default.isPropertyAssignment(prop) && typescript_1.default.isIdentifier(prop.name)) {
            if (typescript_1.default.isStringLiteral(prop.initializer)) {
                record[prop.name.text] = prop.initializer.text;
            }
            else if (typescript_1.default.isNumericLiteral(prop.initializer)) {
                record[prop.name.text] = Number(prop.initializer.text);
            }
            else {
                record[prop.name.text] = prop.initializer.getText(source);
            }
        }
    }
    return record;
}
const classEntries = [];
for (const file of getAllTsFiles(srcDir)) {
    const source = typescript_1.default.createSourceFile(file, fs_1.default.readFileSync(file).toString(), typescript_1.default.ScriptTarget.Latest, true);
    typescript_1.default.forEachChild(source, (node) => {
        if (typescript_1.default.isClassDeclaration(node)) {
            const decorators = typescript_1.default.getDecorators(node);
            if (decorators) {
                for (const dec of decorators) {
                    if (typescript_1.default.isCallExpression(dec.expression)) {
                        const decName = dec.expression.expression.getText(source);
                        if (decName === 'Zeyon.registerClass') {
                            const regIdArg = dec.expression.arguments[0];
                            if (!regIdArg || !typescript_1.default.isStringLiteral(regIdArg))
                                continue;
                            const registrationId = regIdArg.text;
                            const metaArg = dec.expression.arguments[1];
                            let meta = {};
                            if (metaArg && typescript_1.default.isObjectLiteralExpression(metaArg)) {
                                meta = objectLiteralToRecord(metaArg, source);
                            }
                            const className = node.name?.getText(source) || 'UnnamedClass';
                            const filePathRelative = path_1.default.relative(srcDir, file).replace(/\\/g, '/');
                            classEntries.push({
                                registrationId,
                                className,
                                filePath: './' + filePathRelative.replace(/\.ts$/, ''),
                                meta,
                            });
                        }
                    }
                }
            }
        }
    });
}
const processedIds = new Set();
const finalEntries = [];
for (let i = classEntries.length - 1; i >= 0; i--) {
    const { registrationId } = classEntries[i];
    if (!processedIds.has(registrationId)) {
        processedIds.add(registrationId);
        finalEntries.unshift(classEntries[i]);
    }
    else {
        console.warn(`Warning: Duplicate registrationId "${registrationId}" found. Using the latest definition.`);
    }
}
function generateClassMapType(entries) {
    const lines = ['export interface ClassMapType {'];
    for (const e of entries) {
        lines.push(`  '${e.registrationId}': ${e.className};`);
    }
    lines.push('}');
    return lines.join('\n');
}
function generateClassMapData(entries, dynamic) {
    const lines = ['export const classMapData = {'];
    for (const e of entries) {
        if (dynamic) {
            lines.push(`  '${e.registrationId}': { path: '${e.filePath}', meta: ${JSON.stringify(e.meta)} },`);
        }
        else {
            lines.push(`  '${e.registrationId}': { meta: ${JSON.stringify(e.meta)} },`);
        }
    }
    lines.push('};');
    return lines.join('\n');
}
const classMapTypeContent = generateClassMapType(finalEntries);
fs_1.default.writeFileSync(path_1.default.join(generatedDir, 'ClassMapType.ts'), classMapTypeContent);
const classMapDataContent = generateClassMapData(finalEntries, dynamic);
fs_1.default.writeFileSync(path_1.default.join(generatedDir, 'classMapData.ts'), classMapDataContent);
console.log('Zeyon build complete.');
//# sourceMappingURL=generateMaps.js.map