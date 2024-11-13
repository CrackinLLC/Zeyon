"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPartialTemplate = exports.getCompiledTemplate = void 0;
const handlebars_1 = __importDefault(require("handlebars"));
const loader_1 = require("./loader");
const getCompiledTemplate = (template) => {
    return handlebars_1.default.compile(template);
};
exports.getCompiledTemplate = getCompiledTemplate;
const registerPartialTemplate = (name, template) => {
    handlebars_1.default.registerPartial(name, template);
};
exports.registerPartialTemplate = registerPartialTemplate;
handlebars_1.default.registerHelper('eq', function (a, b) {
    return a === b;
});
handlebars_1.default.registerHelper('math', function (lvalue, operator, rvalue) {
    return {
        '+': lvalue + rvalue,
        '-': lvalue - rvalue,
        '*': lvalue * rvalue,
        '/': lvalue / rvalue,
        '%': lvalue % rvalue,
    }[operator];
});
handlebars_1.default.registerHelper('if', function (v1, operator, v2, options) {
    let result = false;
    switch (operator) {
        case '==':
            result = v1 == v2;
            break;
        case '===':
            result = v1 === v2;
            break;
        case '!=':
            result = v1 != v2;
            break;
        case '!==':
            result = v1 !== v2;
            break;
        case '<':
            result = v1 < v2;
            break;
        case '<=':
            result = v1 <= v2;
            break;
        case '>':
            result = v1 > v2;
            break;
        case '>=':
            result = v1 >= v2;
            break;
        case '&&':
            result = !!v1 && !!v2;
            break;
        case '||':
            result = !!v1 || !!v2;
            break;
        default:
            return options.inverse(this);
    }
    return result ? options.fn(this) : options.inverse(this);
});
handlebars_1.default.registerHelper('any', function (...args) {
    const actualArgs = args.slice(0, -1);
    return actualArgs.some((arg) => Boolean(arg));
});
handlebars_1.default.registerHelper('all', function (...args) {
    const actualArgs = args.slice(0, -1);
    return actualArgs.every((arg) => Boolean(arg));
});
handlebars_1.default.registerHelper('ifOr', function (value1, value2) {
    return value1 || value2;
});
handlebars_1.default.registerHelper('log', function (...args) {
    console.log(...args);
});
handlebars_1.default.registerHelper('getLoader', function (type, classes) {
    return new handlebars_1.default.SafeString(type ? JSON.stringify((0, loader_1.loaderTemplate)({ type, classes })) : '');
});
//# sourceMappingURL=template.js.map