type DebounceOptions = {
    wait?: number;
    shouldAggregate?: boolean;
};
export declare function debounce<T extends (...args: any[]) => any>(func: T, options?: DebounceOptions): T;
export {};
//# sourceMappingURL=debounce.d.ts.map