declare global {
  declare module '*.hbs' {
    const content: string;
    export default content;
  }
}

declare module 'zeyonRootAlias/classMapData' {
  import type { ClassMapData } from './imports/classRegistry';

  export const classMapData: ClassMapData;
}
