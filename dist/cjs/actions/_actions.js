#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const init_1 = __importDefault(require("./init"));
const sync_1 = __importDefault(require("./sync"));
async function main() {
    const args = process.argv.slice(2);
    const subcommand = args[0];
    switch (subcommand) {
        case 'init':
            await (0, init_1.default)();
            await (0, sync_1.default)();
            break;
        case 'sync':
            await (0, sync_1.default)();
            break;
        default:
            console.log(`Unknown subcommand: ${subcommand}`);
            console.log(`Usage: zeyon [init|sync]`);
            process.exit(1);
    }
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=_actions.js.map