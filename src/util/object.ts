// Generalized equality function with deep comparison for objects and arrays
export function isEqual(a: any, b: any): boolean {
  // Check if both are strictly equal (covers primitives and same-reference objects/arrays)
  if (a === b) return true;

  // Handle case where either value is null or undefined
  if (a == null || b == null) return a === b;

  // Handle Arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    return compareArrays(a, b);
  }

  // Handle Objects (but not arrays or functions)
  if (typeof a === "object" && typeof b === "object") {
    return compareObjects(a, b);
  }

  // For everything else (including functions), use strict equality
  return false;
}

function compareArrays(a: any[], b: any[]): boolean {
  // Different lengths mean the arrays are not equal
  if (a.length !== b.length) return false;

  // Compare elements recursively
  for (let i = 0; i < a.length; i++) {
    if (!isEqual(a[i], b[i])) return false;
  }

  return true;
}

function compareObjects(
  a: Record<string, any>,
  b: Record<string, any>
): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  // Different numbers of keys mean the objects are not equal
  if (keysA.length !== keysB.length) return false;

  // Compare values for each key, recursively
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!isEqual(a[key], b[key])) return false;
  }

  return true;
}

// Returns a copy of the provided value, including deep copies for object types
export function getDeepCopy<T>(value: T): T {
  // Handle null or undefined values
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => getDeepCopy(item)) as unknown as T;
  }

  if (typeof value === "object") {
    const clone = {} as Record<string, any>;
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        clone[key] = getDeepCopy((value as Record<string, any>)[key]);
      }
    }
    return clone as T;
  }

  // Handle primitives (string, number, boolean, etc.)
  return value;
}
