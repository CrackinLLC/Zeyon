import Handlebars from 'handlebars';
import { loaderTemplate } from './loader';
export const getCompiledTemplate = (template) => {
    return Handlebars.compile(template);
};
export const registerPartialTemplate = (name, template) => {
    Handlebars.registerPartial(name, template);
};
Handlebars.registerHelper('eq', function (a, b) {
    return a === b;
});
Handlebars.registerHelper('math', function (lvalue, operator, rvalue) {
    return {
        '+': lvalue + rvalue,
        '-': lvalue - rvalue,
        '*': lvalue * rvalue,
        '/': lvalue / rvalue,
        '%': lvalue % rvalue,
    }[operator];
});
Handlebars.registerHelper('if', function (v1, operator, v2, options) {
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
Handlebars.registerHelper('any', function (...args) {
    const actualArgs = args.slice(0, -1);
    return actualArgs.some((arg) => Boolean(arg));
});
Handlebars.registerHelper('all', function (...args) {
    const actualArgs = args.slice(0, -1);
    return actualArgs.every((arg) => Boolean(arg));
});
Handlebars.registerHelper('ifOr', function (value1, value2) {
    return value1 || value2;
});
Handlebars.registerHelper('log', function (...args) {
    console.log(...args);
});
Handlebars.registerHelper('getLoader', function (type, classes) {
    return new Handlebars.SafeString(type ? JSON.stringify(loaderTemplate({ type, classes })) : '');
});
//# sourceMappingURL=template.js.map