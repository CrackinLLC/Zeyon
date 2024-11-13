export const toUpperCaseFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);
export const convertObjectKeys = (object, casing) => {
    if (Array.isArray(object)) {
        return object.map((item) => convertObjectKeys(item, casing));
    }
    else if (object !== null && typeof object === 'object') {
        return Object.fromEntries(Object.entries(object).map(([k, v]) => {
            const newKey = (() => {
                switch (casing) {
                    case 2:
                        return toPascalCase(k);
                    case 0:
                        return toCamelCase(k);
                    case 3:
                        return toSnakeCase(k);
                    case 1:
                        return toHyphenCase(k);
                    case 4:
                        return toSpaceCase(k);
                    default:
                        return k;
                }
            })();
            if (typeof v === 'object' && v !== null) {
                v = convertObjectKeys(v, casing);
            }
            return [newKey, v];
        }));
    }
    else {
        return object;
    }
};
export const toHyphenCase = (str) => {
    switch (determineCase(str)) {
        case 2:
            return str
                .replace(/([A-Z])/g, (match, offset) => (offset > 0 ? '-' : '') + match.toLowerCase())
                .replace(/([a-zA-Z])(\d+)/g, '$1-$2');
        case 0:
            return str
                .replace(/([a-z])([A-Z])/g, '$1-$2')
                .replace(/([a-zA-Z])(\d+)/g, '$1-$2')
                .toLowerCase();
        case 3:
            return str.replace(/_/g, '-');
        case 1:
            return str;
        default:
            console.info(`Could not determine current case of "${str}"`);
            return str;
    }
};
export const toSnakeCase = (str) => {
    switch (determineCase(str)) {
        case 2:
            return str
                .replace(/([A-Z])/g, (match, offset) => (offset > 0 ? '_' : '') + match.toLowerCase())
                .replace(/([a-zA-Z])(\d+)/g, '$1_$2');
        case 0:
            return str
                .replace(/([a-z])([A-Z])/g, '$1_$2')
                .replace(/([a-zA-Z])(\d+)/g, '$1_$2')
                .toLowerCase();
        case 1:
            return str.replace(/-/g, '_');
        case 3:
            return str;
        default:
            console.info(`Could not determine current case of "${str}"`);
            return str;
    }
};
export const toCamelCase = (str) => {
    const convertToCamel = (word, i) => i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    switch (determineCase(str)) {
        case 2:
            return str.charAt(0).toLowerCase() + str.slice(1);
        case 3:
            return str.split('_').map(convertToCamel).join('');
        case 1:
            return str.split('-').map(convertToCamel).join('');
        case 0:
            return str;
        default:
            console.info(`Could not determine current case of "${str}"`);
            return str;
    }
};
export const toPascalCase = (str) => {
    const convertToPascal = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    switch (determineCase(str)) {
        case 0:
            return str.charAt(0).toUpperCase() + str.slice(1);
        case 3:
            return str.split('_').map(convertToPascal).join('');
        case 1:
            return str.split('-').map(convertToPascal).join('');
        case 2:
            return str;
        default:
            console.info(`Could not determine current case of "${str}"`);
            return str;
    }
};
export const toSpaceCase = (str) => {
    switch (determineCase(str)) {
        case 2:
            return str
                .replace(/([A-Z])/g, (match, offset) => (offset > 0 ? ' ' : '') + match.toLowerCase())
                .replace(/([a-zA-Z])(\d+)/g, '$1 $2');
        case 0:
            return str
                .replace(/([a-z])([A-Z])/g, '$1 $2')
                .replace(/([a-zA-Z])(\d+)/g, '$1 $2')
                .toLowerCase();
        case 3:
            return str.replace(/_/g, ' ').toLowerCase();
        case 1:
            return str.replace(/-/g, ' ').toLowerCase();
        case 4:
            return str;
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
    while (counter < 36) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
};
const determineCase = (str) => {
    if (/^[A-Z][a-zA-Z0-9]*$/.test(str)) {
        return 2;
    }
    if (/^[a-z][a-zA-Z0-9]*$/.test(str)) {
        return 0;
    }
    if (/^[a-z0-9]+(-[a-z0-9]+)*$/.test(str)) {
        return 1;
    }
    if (/^[a-z0-9]+(_[a-z0-9]+)*$/.test(str)) {
        return 3;
    }
    if (/^[a-z0-9]+( +[a-z0-9]+)*$/.test(str)) {
        return 4;
    }
    return 5;
};
//# sourceMappingURL=string.js.map