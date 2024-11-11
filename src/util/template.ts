import Handlebars, { HelperOptions } from 'handlebars'; // TODO: Research and Consider moving to Template7
import { loaderTemplate, LoaderType } from './loader';

// Create functions to assist working with Handlebars
export const getCompiledTemplate = (template: string) => {
  return Handlebars.compile(template);
};

export const registerPartialTemplate = (name: string, template: string) => {
  Handlebars.registerPartial(name, template);
};

/**
 * Render content if two values are equivelant
 */
Handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});

/**
 * Basic support for common math operators
 */
Handlebars.registerHelper('math', function (lvalue: number, operator: string, rvalue: number) {
  return {
    '+': lvalue + rvalue,
    '-': lvalue - rvalue,
    '*': lvalue * rvalue,
    '/': lvalue / rvalue,
    '%': lvalue % rvalue,
  }[operator];
});

///////////////////////////
// Conditional helpers

/**
 * If helper with support for multiple operators
 */
Handlebars.registerHelper(
  'if',
  function (this: any, v1: unknown, operator: string, v2: unknown, options: HelperOptions) {
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
        result = (v1 as number) < (v2 as number);
        break;
      case '<=':
        result = (v1 as number) <= (v2 as number);
        break;
      case '>':
        result = (v1 as number) > (v2 as number);
        break;
      case '>=':
        result = (v1 as number) >= (v2 as number);
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
  },
);

/**
 * Render content if any one of multiple values are truthy
 */
Handlebars.registerHelper('any', function (...args) {
  // The last argument is a Handlebars options object
  const actualArgs = args.slice(0, -1);

  // Return true if any argument is truthy
  return actualArgs.some((arg) => Boolean(arg));
});

/**
 * Render content if all of multiple values are truthy
 */
Handlebars.registerHelper('all', function (...args) {
  // The last argument is a Handlebars options object
  const actualArgs = args.slice(0, -1);

  // Return true if all arguments are truthy
  return actualArgs.every((arg) => Boolean(arg));
});

/**
 * Render content if one of two values is truthy
 */
Handlebars.registerHelper('ifOr', function (value1, value2) {
  return value1 || value2;
});

///////////////////////////
// Misc helpers

/**
 * Console log input from the template
 */
Handlebars.registerHelper('log', function (...args) {
  console.log(...args);
});

Handlebars.registerHelper('getLoader', function (type: LoaderType, classes?: string) {
  return new Handlebars.SafeString(type ? JSON.stringify(loaderTemplate({ type, classes })) : '');
});
