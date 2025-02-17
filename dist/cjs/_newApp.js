"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./util/polyfill");
require("./util/template");
const app_1 = __importDefault(require("./app"));
exports.default = {
    create: (options) => {
        options.el.innerHTML = '';
        return new app_1.default(options);
    },
    defineRoutes(routes) {
        return routes;
    },
};
//# sourceMappingURL=_newApp.js.map