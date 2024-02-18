import { NumericType } from "./deps.js";
import { BinaryInput, BinaryLengthedDataPureStep, BinaryOutput, BinaryPureStep, LengthedArgs, PureStep, SubtractSubset } from "./typedefs.js";
export declare class BinaryCStringStep extends BinaryPureStep<string, never> {
    forward(input: BinaryInput<never>): BinaryOutput<string>;
    backward(input: Omit<BinaryOutput<string>, "len">): BinaryInput<never>;
}
export declare class BinaryNumberStep<ENCODING extends NumericType> extends BinaryPureStep<number, never> {
    protected readonly kind: ENCODING;
    constructor(kind: ENCODING);
    forward(input: BinaryInput<never>): BinaryOutput<number>;
    backward(input: Omit<BinaryOutput<number>, "len">): BinaryInput<never>;
}
export declare class BinaryStringStep extends BinaryPureStep<string, LengthedArgs> implements BinaryLengthedDataPureStep {
    forward(input: BinaryInput<LengthedArgs>): BinaryOutput<string>;
    backward(input: Omit<BinaryOutput<string>, "len">): BinaryInput<LengthedArgs>;
}
export declare class BinaryNumberArrayStep<ENCODING extends NumericType> extends BinaryPureStep<number[], LengthedArgs> implements BinaryLengthedDataPureStep {
    protected readonly kind: ENCODING;
    constructor(kind: ENCODING);
    forward(input: BinaryInput<LengthedArgs>): BinaryOutput<number[]>;
    backward(input: Omit<BinaryOutput<number[]>, "len">): BinaryInput<LengthedArgs>;
}
export declare class BinaryBytesStep extends BinaryPureStep<Uint8Array, LengthedArgs> implements BinaryLengthedDataPureStep {
    forward(input: BinaryInput<LengthedArgs>): BinaryOutput<Uint8Array>;
    backward(input: Omit<BinaryOutput<Uint8Array>, "len">): BinaryInput<LengthedArgs>;
}
export declare class BinaryDefaultArgs<STEP extends BinaryPureStep<any>, OUT extends (STEP extends BinaryPureStep<infer T> ? T : unknown) = (STEP extends BinaryPureStep<infer T> ? T : unknown), ARGS extends (STEP extends BinaryPureStep<OUT, infer T> ? T : unknown) = (STEP extends BinaryPureStep<OUT, infer T> ? T : unknown), DEFAULT_ARGS extends Partial<ARGS> = Partial<ARGS>, REQUIRED_ARGS extends SubtractSubset<DEFAULT_ARGS, ARGS> = SubtractSubset<DEFAULT_ARGS, ARGS>> extends BinaryPureStep<OUT, ARGS> {
    protected readonly step: STEP;
    protected readonly args: DEFAULT_ARGS;
    protected readonly priority: -1 | 1;
    constructor(step: STEP, default_args: DEFAULT_ARGS, priority?: -1 | 1);
    forward(input: BinaryInput<REQUIRED_ARGS & Partial<DEFAULT_ARGS>>): BinaryOutput<OUT>;
    backward(input: Omit<BinaryOutput<OUT>, "len">): BinaryInput<ARGS>;
}
export declare class BinaryOutputUnwrapStep<T> extends PureStep<Omit<BinaryOutput<T>, "len">, T> {
    forward(input: BinaryOutput<T>): T;
    backward(input: T): Omit<BinaryOutput<T>, "len">;
}
export declare class BinaryOutputWrapStep<T> extends PureStep<T, BinaryOutput<T>> {
    forward(input: T): BinaryOutput<T>;
    backward(input: BinaryOutput<T>): T;
}
export declare class BinaryInputUnwrapStep extends PureStep<BinaryInput, Uint8Array> {
    forward(input: BinaryInput): Uint8Array;
    backward(input: Uint8Array): BinaryInput;
}
export declare class BinaryInputWrapStep extends PureStep<Uint8Array, BinaryInput> {
    forward(input: Uint8Array): BinaryInput;
    backward(input: BinaryInput): Uint8Array;
}
