import Handlebars, { HelperOptions } from 'handlebars'; // TODO: Research and Consider moving to Template7

// Create functions to assist working with Handlebars
export const getCompiledTemplate = (template: string) => {
  return Handlebars.compile(template);
};

Handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});

Handlebars.registerHelper(
  'ifCond',
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

Handlebars.registerHelper('any', function (...args) {
  // The last argument is a Handlebars options object
  const actualArgs = args.slice(0, -1);

  // Return true if any argument is truthy
  return actualArgs.some((arg) => Boolean(arg));
});

Handlebars.registerHelper('all', function (...args) {
  // The last argument is a Handlebars options object
  const actualArgs = args.slice(0, -1);

  // Return true if all arguments are truthy
  return actualArgs.every((arg) => Boolean(arg));
});

Handlebars.registerHelper('ifOr', function (value1, value2) {
  return value1 || value2;
});

Handlebars.registerHelper('log', function (...args) {
  console.log(...args);
});

Handlebars.registerHelper('math', function (lvalue: number, operator: string, rvalue: number) {
  return {
    '+': lvalue + rvalue,
    '-': lvalue - rvalue,
    '*': lvalue * rvalue,
    '/': lvalue / rvalue,
    '%': lvalue % rvalue,
  }[operator];
});

export const enum LoaderType {
  Slosh = 'slosh-loader',
}

export const LoaderMarkup = {
  'slosh-loader': '<div class="inner"></div>',
};

Handlebars.registerHelper('getLoader', function (loader: LoaderType, classes?: string) {
  const list = ['loader', loader];

  if (classes && typeof classes === 'string') {
    list.push(...classes.split(' '));
  }

  return new Handlebars.SafeString(
    loader ? `<span class="${list.join(' ')}" aria-hidden="true">${LoaderMarkup[loader]}</span>` : '',
  );
});
