"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const view_1 = __importDefault(require("./view"));
class RouteView extends view_1.default {
    async beforeNavigate(nextPath) {
        return !!nextPath || true;
    }
}
exports.default = RouteView;
RouteView.isRoute = true;
//# sourceMappingURL=route.js.map