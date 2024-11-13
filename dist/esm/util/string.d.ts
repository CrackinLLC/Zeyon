export declare const enum Case {
    Camel = 0,
    Hyphen = 1,
    Pascal = 2,
    Snake = 3,
    Space = 4,
    Unknown = 5
}
export declare const toUpperCaseFirst: (str: string) => string;
export declare const convertObjectKeys: (object: object, casing: Case) => any;
export declare const toHyphenCase: (str: string) => string;
export declare const toSnakeCase: (str: string) => string;
export declare const toCamelCase: (str: string) => string;
export declare const toPascalCase: (str: string) => string;
export declare const toSpaceCase: (str: string) => string;
export declare const getUniqueId: () => string;
//# sourceMappingURL=string.d.ts.map