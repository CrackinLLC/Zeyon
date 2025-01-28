"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function default_1() {
    const projectRoot = process.cwd();
    const zeyonDir = path_1.default.join(projectRoot, '.Zeyon');
    const configPath = path_1.default.join(zeyonDir, 'zeyon.config.json');
    if (!fs_1.default.existsSync(zeyonDir)) {
        fs_1.default.mkdirSync(zeyonDir);
        console.log(`Created directory: ${zeyonDir}`);
    }
    if (!fs_1.default.existsSync(configPath)) {
        const defaultConfig = {
            projectRoot,
        };
        fs_1.default.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    }
    else {
        console.log(`Config already exists at ${configPath}, skipping creation.`);
    }
    console.log('Zeyon initialization complete.');
}
//# sourceMappingURL=init.js.map