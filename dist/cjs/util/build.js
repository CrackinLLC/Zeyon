"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZEYON_ROOT_ALIAS = void 0;
exports.findProjectRoot = findProjectRoot;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
exports.ZEYON_ROOT_ALIAS = 'zeyonRootAlias';
function findProjectRoot() {
    const cwd = process.cwd();
    const zeyonConfig = path_1.default.join(cwd, '.Zeyon', 'zeyon.config.json');
    if (fs_1.default.existsSync(zeyonConfig)) {
        const config = JSON.parse(fs_1.default.readFileSync(zeyonConfig, 'utf8'));
        return config.projectRoot || cwd;
    }
    return cwd;
}
//# sourceMappingURL=build.js.map