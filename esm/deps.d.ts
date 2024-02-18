export * from "kitchensink_ts/builtin_aliases_deps";
export * from "kitchensink_ts/eightpack";
export { concatBytes, concatTyped } from "kitchensink_ts/typedbuffer";
export type * from "kitchensink_ts/typedefs";
export declare const enum DEBUG {
    LOG = 0,
    ASSERT = 0,
    PRODUCTION = 1,
    MINIFY = 1
}
export declare const number_isFinite: (number: unknown) => boolean, number_parseInt: (string: string, radix?: number | undefined) => number;
export declare const math_ceil: (x: number) => number;
