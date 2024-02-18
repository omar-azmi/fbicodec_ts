import { BinaryInput, BinaryLengthedDataPureStep, BinaryOutput, BinaryPureStep, LengthedArgs, ObjectToEntries_Mapped, OptionalNeverKeys, PureStep } from "./typedefs.js";
export interface ArrayArgs<ITEM_ARGS> extends LengthedArgs {
    item: ITEM_ARGS;
}
export declare class BinaryArrayStep<ITEM_STEP extends BinaryPureStep<any, any>, OUT_ITEM = (ITEM_STEP extends BinaryPureStep<infer T, unknown> ? T : never), ITEM_ARGS extends Record<string, any> = (ITEM_STEP extends BinaryPureStep<OUT_ITEM, infer T> ? T : never)> extends BinaryPureStep<OUT_ITEM[], ArrayArgs<ITEM_ARGS>> implements BinaryLengthedDataPureStep {
    protected readonly item_step: ITEM_STEP;
    constructor(item_step: ITEM_STEP);
    forward(input: BinaryInput<ArrayArgs<ITEM_ARGS>>): BinaryOutput<OUT_ITEM[]>;
    protected next_forward(bin: Uint8Array, pos: number, item_args: ITEM_ARGS): BinaryOutput<OUT_ITEM>;
    backward(input: Omit<BinaryOutput<OUT_ITEM[]>, "len">): BinaryInput<ArrayArgs<ITEM_ARGS>>;
}
export interface HeaderLengthedArgs<HEAD_ARGS, BODY_ARGS extends LengthedArgs> {
    head: HEAD_ARGS;
    body: Exclude<BODY_ARGS, LengthedArgs>;
}
export declare class BinaryHeaderLengthedStep<HEAD_STEP extends BinaryPureStep<number>, BODY_STEP extends BinaryPureStep<any, LengthedArgs>, HEAD_ARGS extends Record<string, any> = (HEAD_STEP extends BinaryPureStep<number, infer T> ? T : never), BODY_ARGS extends LengthedArgs = (BODY_STEP extends BinaryPureStep<any, infer T> ? T : never)> extends BinaryPureStep<BODY_STEP extends BinaryPureStep<infer T, BODY_ARGS> ? T : never, OptionalNeverKeys<HeaderLengthedArgs<HEAD_ARGS, BODY_ARGS>>> {
    protected readonly head_step: HEAD_STEP;
    protected readonly body_step: BODY_STEP;
    constructor(head_step: HEAD_STEP, body_step: BODY_STEP);
    forward(input: BinaryInput<OptionalNeverKeys<HeaderLengthedArgs<HEAD_ARGS, BODY_ARGS>>>): BinaryOutput<BODY_STEP extends BinaryPureStep<infer T, BODY_ARGS> ? T : never>;
    backward(input: Omit<BinaryOutput<BODY_STEP extends BinaryPureStep<infer T, BODY_ARGS> ? T : never>, "len">): BinaryInput<OptionalNeverKeys<HeaderLengthedArgs<HEAD_ARGS, BODY_ARGS>>>;
}
export type RecordArgs<RECORD_ARGS_MAP extends {
    [key: string]: any;
}> = RECORD_ARGS_MAP;
type RecordEntry_KeyStepTuple<RECORD> = ObjectToEntries_Mapped<RECORD, "BinaryPureStep_Of">;
export declare class BinaryRecordStep<RECORD, ENTRY_ARGS extends {
    [K in keyof RECORD]?: any;
} = {
    [K in keyof RECORD]?: any;
}, ENTRY_TYPE extends RecordEntry_KeyStepTuple<RECORD> = RecordEntry_KeyStepTuple<RECORD>> extends BinaryPureStep<RECORD, RecordArgs<ENTRY_ARGS>> {
    protected readonly entry_steps: Array<ENTRY_TYPE>;
    constructor(entries: Array<ENTRY_TYPE>);
    forward(input: BinaryInput<RecordArgs<ENTRY_ARGS>>): BinaryOutput<RECORD>;
    protected partial_forward(bin: Uint8Array, pos: number, args: Partial<ENTRY_ARGS>, start?: number, end?: number | undefined): BinaryOutput<Partial<RECORD>>;
    backward(input: Omit<BinaryOutput<RECORD>, "len">): BinaryInput<RecordArgs<ENTRY_ARGS>>;
    protected partial_backward(val: Partial<RECORD>, start?: number, end?: number | undefined): {
        bins: Array<Uint8Array>;
        args: Partial<ENTRY_ARGS>;
    };
}
export declare class SequentialSteps<FROM, TO, FIRST extends PureStep<FROM, any> = PureStep<FROM, any>, LAST extends PureStep<any, TO> = PureStep<any, TO>, STEPS extends [first: FIRST, ...intermediate_steps: PureStep<any, any>[], last: LAST] = [first: FIRST, ...intermediate_steps: PureStep<any, any>[], last: LAST]> extends PureStep<FROM, TO> {
    protected readonly steps: STEPS;
    constructor(...steps: STEPS);
    forward(input: FROM): TO;
    protected next_forward(input: any | FROM, step_index: number): any | TO;
    backward(input: TO): FROM;
    protected next_backward(input: any | TO, step_reverse_index: number): any | FROM;
}
export {};
