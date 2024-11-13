export declare function debounce<T>(func: (aggregatedArgs: T, collectedPrimitives?: T[]) => void, { wait, shouldAggregate, }?: {
    wait?: number;
    shouldAggregate?: boolean;
}): (...args: T[]) => void;
//# sourceMappingURL=debounce.d.ts.map