import { AgentAttributes, agentAttributes } from '../model/_imports/agent';
import { ApplicationAttributes, applicationAttributes } from '../model/_imports/application';
import { DocumentAttributes, documentAttributes } from '../model/_imports/document';
import { FlowAttributes, flowAttributes } from '../model/_imports/flow';
import { LeaseAttributes, leaseAttributes } from '../model/_imports/lease';
import { PropertyAttributes, propertyAttributes } from '../model/_imports/property';
import { SessionUserAttributes, sessionUserAttributes } from '../model/_imports/sessionUser';
import { StepAttributes, stepAttributes } from '../model/_imports/step';
import { TeamAttributes, teamAttributes } from '../model/_imports/team';
import { TenantAttributes, tenantAttributes } from '../model/_imports/tenant';
import { TicketAttributes, ticketAttributes } from '../model/_imports/ticket';
import { TodoAttributes, todoAttributes } from '../model/_imports/todo';
import { UserAttributes, userAttributes } from '../model/_imports/user';
import { VendorAttributes, vendorAttributes } from '../model/_imports/vendor';
import { AttributeType } from './types';

export type Attributes =
  | AgentAttributes
  | ApplicationAttributes
  | DocumentAttributes
  | FlowAttributes
  | LeaseAttributes
  | PropertyAttributes
  | SessionUserAttributes
  | StepAttributes
  | TeamAttributes
  | TenantAttributes
  | TicketAttributes
  | TodoAttributes
  | UserAttributes
  | VendorAttributes;

const typeMap: { [string: string]: Attributes } = {
  agent: agentAttributes,
  application: applicationAttributes,
  document: documentAttributes,
  flow: flowAttributes,
  lease: leaseAttributes,
  property: propertyAttributes,
  sessionUser: sessionUserAttributes,
  step: stepAttributes,
  team: teamAttributes,
  tenant: tenantAttributes,
  ticket: ticketAttributes,
  todo: todoAttributes,
  user: userAttributes,
  vendor: vendorAttributes,
};

export function getDefaultsFromDefinition<T extends Attributes>(
  attributeDefinitions: T,
  prefill?: Partial<T>,
): Partial<T> {
  const result: Partial<T> = {};

  for (const key in attributeDefinitions) {
    const definition = attributeDefinitions[key];

    // Ensure the key exists on the object and the definition has a default value
    if (prefill && key in prefill && prefill[key as keyof T] !== undefined && prefill[key as keyof T] !== null) {
      result[key as keyof T] = prefill[key as keyof T];
    } else if (definition && typeof definition === 'object' && 'default' in definition) {
      result[key as keyof T] = definition.default as T[keyof T];
    } else {
      result[key as keyof T] = undefined;
    }
  }

  return result;
}

export function validateAndCoerceAttributes<A extends Attributes>(
  attributes: Partial<A>,
  attributeDefinitions: A,
  silent = false,
): Partial<A> {
  if (!attributes) return attributes;

  const coercedAttributes: Partial<A> = {};

  for (const [key, value] of Object.entries(attributes)) {
    const definition = attributeDefinitions[key as keyof A];

    if (!definition) {
      throw new Error(`INVALID: '${key}' is not a recognized attribute.`);
    }

    try {
      const coercedValue = coerceAttributeValue(key, value, definition, silent);
      coercedAttributes[key as keyof A] = coercedValue as A[keyof A];
    } catch (error) {
      console.error(error.message);
      throw error;
    }
  }

  return coercedAttributes;
}

export function coerceAttributeValue(key: string, value: any, definition: any, silent = false): any {
  const expectedType = definition.type;
  let coercedValue = value;
  let wasCoerced = false;

  if (value === undefined || value === null) {
    if (!('default' in definition) && !definition.optional) {
      throw new Error(`INVALID: '${key}' is required but not provided and has no default value.`);
    }
    return value;
  }

  switch (expectedType) {
    case AttributeType.String:
      if (typeof value !== 'string') {
        coercedValue = String(value);
        wasCoerced = true;
      }
      if (typeof coercedValue !== 'string') {
        throw new Error(`INVALID: '${key}' could not be coerced to a string.`);
      }
      break;

    case AttributeType.Number:
      if (typeof value !== 'number') {
        const parsedNumber = Number(value);
        if (!isNaN(parsedNumber)) {
          coercedValue = parsedNumber;
          wasCoerced = true;
        } else {
          throw new Error(`INVALID: '${key}' could not be coerced to a number.`);
        }
      }
      break;

    case AttributeType.Boolean:
      if (typeof value !== 'boolean') {
        if (typeof value === 'string') {
          if (value.toLowerCase() === 'true') {
            coercedValue = true;
            wasCoerced = true;
          } else if (value.toLowerCase() === 'false') {
            coercedValue = false;
            wasCoerced = true;
          } else {
            throw new Error(`INVALID: '${key}' could not be coerced to a boolean.`);
          }
        } else if (typeof value === 'number') {
          coercedValue = value !== 0;
          wasCoerced = true;
        } else {
          throw new Error(`INVALID: '${key}' could not be coerced to a boolean.`);
        }
      }
      break;

    case AttributeType.Date:
      if (!(value instanceof Date) || isNaN(value.getTime())) {
        const parsedDate = new Date(value);
        if (!isNaN(parsedDate.getTime())) {
          coercedValue = parsedDate;
          wasCoerced = true;
        } else {
          // throw new Error(`INVALID: '${key}' could not be coerced to a Date.`);
          // Temporarily allow invalid date values through
          console.warn(`INVALID: '${key}' could not be coerced to a Date.`);
          coercedValue = null; // Or handle as per your needs
        }
      }
      break;

    case AttributeType.ArrayString:
      if (!Array.isArray(value)) {
        if (typeof value === 'string') {
          coercedValue = [value];
          wasCoerced = true;
        } else {
          throw new Error(`INVALID: '${key}' could not be coerced to an array of strings.`);
        }
      }
      coercedValue = coercedValue.map((item: any) => {
        if (typeof item !== 'string') {
          wasCoerced = true;
          return String(item);
        }
        return item;
      });
      break;

    case AttributeType.ArrayNumber:
      if (!Array.isArray(value)) {
        const parsedNumber = Number(value);
        if (!isNaN(parsedNumber)) {
          coercedValue = [parsedNumber];
          wasCoerced = true;
        } else {
          throw new Error(`INVALID: '${key}' could not be coerced to an array of numbers.`);
        }
      } else {
        coercedValue = coercedValue.map((item: any) => {
          if (typeof item !== 'number') {
            const parsedNumber = Number(item);
            if (!isNaN(parsedNumber)) {
              wasCoerced = true;
              return parsedNumber;
            } else {
              throw new Error(`INVALID: '${key}' array contains values that could not be coerced to numbers.`);
            }
          }
          return item;
        });
      }
      break;

    case AttributeType.ArrayObject:
      if (!Array.isArray(value)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          coercedValue = [value];
          wasCoerced = true;
        } else {
          throw new Error(`INVALID: '${key}' could not be coerced to an array of objects.`);
        }
      }
      if (!coercedValue.every((item: any) => typeof item === 'object' && item !== null && !Array.isArray(item))) {
        throw new Error(`INVALID: '${key}' array contains values that are not objects.`);
      }
      break;

    case AttributeType.Object:
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error(`INVALID: '${key}' could not be coerced to an object.`);
      }
      break;

    default:
      throw new Error(`INVALID: '${key}' has an unrecognized attribute type '${expectedType}'.`);
  }

  if (wasCoerced && !silent) {
    // TODO: Log here can help in debugging, but is a bit noisy. Consider removing or making optional.
    // console.warn(`Attribute '${key}' was coerced from type '${originalType}' to type '${expectedType}'.`);
  }

  return coercedValue;
}

// Checks the attribute keys against our list of defined data types to determine which type this is.
// For incomplete attribute objects, we can return an array of all possible types.
export function getAttributesType(attributes: unknown): string | string[] | undefined {
  if (typeof attributes !== 'object' || attributes === null) return undefined;

  const potentialMatches: string[] = [];
  const providedKeys = Object.keys(attributes);

  for (const [type, attributeList] of Object.entries(typeMap)) {
    const attributeKeys = Object.keys(attributeList);

    // Check if all keys in the provided attributes are valid keys in the attribute definition
    const hasAllValidKeys = providedKeys.every((key) => attributeKeys.includes(key));

    if (hasAllValidKeys) {
      potentialMatches.push(type);
    }
  }

  if (potentialMatches.length === 1) {
    return potentialMatches[0];
  }

  return potentialMatches.length > 0 ? potentialMatches : undefined;
}

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
  if (typeof a === 'object' && typeof b === 'object') {
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

function compareObjects(a: Record<string, any>, b: Record<string, any>): boolean {
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

// Returns a copy of the provided value, including deep copies for arrays and objects
export function getCopy<T>(value: T): T {
  // Handle null or undefined values
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => getCopy(item)) as unknown as T;
  }

  if (typeof value === 'object') {
    const clone = {} as Record<string, any>;
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        clone[key] = getCopy((value as Record<string, any>)[key]);
      }
    }
    return clone as T;
  }

  // Handle primitives (string, number, boolean, etc.)
  return value;
}
