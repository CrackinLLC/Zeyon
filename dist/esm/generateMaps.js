import fs from 'fs';
import path from 'path';
import ts from 'typescript';
const projectDir = path.resolve(__dirname);
const srcDir = path.join(projectDir, 'src');
const generatedDir = path.join(srcDir, 'generated');
if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir);
}
const dynamic = process.argv.includes('--dynamic');
function getAllTsFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const fp = path.join(dir, f);
        const stat = fs.statSync(fp);
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
        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
            if (ts.isStringLiteral(prop.initializer)) {
                record[prop.name.text] = prop.initializer.text;
            }
            else if (ts.isNumericLiteral(prop.initializer)) {
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
    const source = ts.createSourceFile(file, fs.readFileSync(file).toString(), ts.ScriptTarget.Latest, true);
    ts.forEachChild(source, (node) => {
        if (ts.isClassDeclaration(node)) {
            const decorators = ts.getDecorators(node);
            if (decorators) {
                for (const dec of decorators) {
                    if (ts.isCallExpression(dec.expression)) {
                        const decName = dec.expression.expression.getText(source);
                        if (decName === 'Zeyon.registerClass') {
                            const regIdArg = dec.expression.arguments[0];
                            if (!regIdArg || !ts.isStringLiteral(regIdArg))
                                continue;
                            const registrationId = regIdArg.text;
                            const metaArg = dec.expression.arguments[1];
                            let meta = {};
                            if (metaArg && ts.isObjectLiteralExpression(metaArg)) {
                                meta = objectLiteralToRecord(metaArg, source);
                            }
                            const className = node.name?.getText(source) || 'UnnamedClass';
                            const filePathRelative = path.relative(srcDir, file).replace(/\\/g, '/');
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
fs.writeFileSync(path.join(generatedDir, 'ClassMapType.ts'), classMapTypeContent);
const classMapDataContent = generateClassMapData(finalEntries, dynamic);
fs.writeFileSync(path.join(generatedDir, 'classMapData.ts'), classMapDataContent);
console.log('Zeyon build complete.');
//# sourceMappingURL=generateMaps.js.map