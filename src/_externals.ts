// Using alias to import all of our generated files and export them for library consumption.
// TypeScript complains, so we can silence here rather than in several locations across the library.

// @ts-ignore - References an alias from our build tool to get access to the generated files
import { classMapData } from 'zeyonRootAlias/classMapData';

export { classMapData };
