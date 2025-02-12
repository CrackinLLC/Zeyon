export const enum Case {
  Camel,
  Hyphen,
  Pascal,
  Snake,
  Space,
  Unknown,
}

export const toUpperCaseFirst = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);

export const convertObjectKeys = (object: object, casing: Case): any => {
  if (Array.isArray(object)) {
    // If the input is an array, test each element in the array without modifying the array itself
    return object.map((item) => convertObjectKeys(item, casing));
  } else if (object !== null && typeof object === 'object') {
    // If the input is an object, convert its keys
    return Object.fromEntries(
      Object.entries(object).map(([k, v]) => {
        const newKey = (() => {
          switch (casing) {
            case Case.Pascal:
              return toPascalCase(k);
            case Case.Camel:
              return toCamelCase(k);
            case Case.Snake:
              return toSnakeCase(k);
            case Case.Hyphen:
              return toHyphenCase(k);
            case Case.Space:
              return toSpaceCase(k);
            default:
              return k;
          }
        })();

        if (typeof v === 'object' && v !== null) {
          v = convertObjectKeys(v, casing);
        }

        return [newKey, v];
      }),
    );
  } else {
    // If the input is neither an object nor an array, return it as-is
    return object;
  }
};

export const toHyphenCase = (str: string): string => {
  switch (determineCase(str)) {
    case Case.Pascal:
      return str
        .replace(/([A-Z])/g, (match, offset) => (offset > 0 ? '-' : '') + match.toLowerCase())
        .replace(/([a-zA-Z])(\d+)/g, '$1-$2');
    case Case.Camel:
      return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/([a-zA-Z])(\d+)/g, '$1-$2')
        .toLowerCase();
    case Case.Snake:
      return str.replace(/_/g, '-');
    case Case.Hyphen:
      return str; // Already in hyphen-case
    default:
      console.info(`Could not determine current case of "${str}"`);
      return str;
  }
};

export const toSnakeCase = (str: string): string => {
  switch (determineCase(str)) {
    case Case.Pascal:
      return str
        .replace(/([A-Z])/g, (match, offset) => (offset > 0 ? '_' : '') + match.toLowerCase())
        .replace(/([a-zA-Z])(\d+)/g, '$1_$2');
    case Case.Camel:
      return str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/([a-zA-Z])(\d+)/g, '$1_$2')
        .toLowerCase();
    case Case.Hyphen:
      return str.replace(/-/g, '_');
    case Case.Snake:
      return str; // Already in snake_case
    default:
      console.info(`Could not determine current case of "${str}"`);
      return str;
  }
};

export const toCamelCase = (str: string): string => {
  const convertToCamel = (word: string, i: number) =>
    i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

  switch (determineCase(str)) {
    case Case.Pascal:
      return str.charAt(0).toLowerCase() + str.slice(1);
    case Case.Snake:
      return str.split('_').map(convertToCamel).join('');
    case Case.Hyphen:
      return str.split('-').map(convertToCamel).join('');
    case Case.Camel:
      return str; // Already in camelCase
    default:
      console.info(`Could not determine current case of "${str}"`);
      return str;
  }
};

export const toPascalCase = (str: string): string => {
  const convertToPascal = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  switch (determineCase(str)) {
    case Case.Camel:
      return str.charAt(0).toUpperCase() + str.slice(1);
    case Case.Snake:
      return str.split('_').map(convertToPascal).join('');
    case Case.Hyphen:
      return str.split('-').map(convertToPascal).join('');
    case Case.Pascal:
      return str; // Already in PascalCase
    default:
      console.info(`Could not determine current case of "${str}"`);
      return str;
  }
};

export const toSpaceCase = (str: string): string => {
  switch (determineCase(str)) {
    case Case.Pascal:
      return str
        .replace(/([A-Z])/g, (match, offset) => (offset > 0 ? ' ' : '') + match.toLowerCase())
        .replace(/([a-zA-Z])(\d+)/g, '$1 $2');
    case Case.Camel:
      return str
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([a-zA-Z])(\d+)/g, '$1 $2')
        .toLowerCase();
    case Case.Snake:
      return str.replace(/_/g, ' ').toLowerCase();
    case Case.Hyphen:
      return str.replace(/-/g, ' ').toLowerCase();
    case Case.Space:
      return str; // Already in SpaceCase
    default:
      console.info(`Could not determine current case of "${str}"`);
      return str;
  }
};

export const getUniqueId = () => {
  if (window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < 36 /** UUID Length */) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }

  return result;
};

export function random({ len, toUpper }: { len?: number; toUpper?: boolean } = {}) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < (len || 8); i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  if (!!toUpper) {
    return result.toUpperCase();
  }

  return result;
}

const determineCase = (str: string): Case => {
  if (/^[A-Z][a-zA-Z0-9]*$/.test(str)) {
    return Case.Pascal;
  }
  if (/^[a-z][a-zA-Z0-9]*$/.test(str)) {
    return Case.Camel;
  }
  if (/^[a-z0-9]+(-[a-z0-9]+)*$/.test(str)) {
    return Case.Hyphen;
  }
  if (/^[a-z0-9]+(_[a-z0-9]+)*$/.test(str)) {
    return Case.Snake;
  }
  if (/^[a-z0-9]+( +[a-z0-9]+)*$/.test(str)) {
    return Case.Space;
  }
  return Case.Unknown;
};
