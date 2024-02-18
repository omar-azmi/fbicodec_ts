import { BinaryInput, BinaryOutput, BinaryPureStep } from "./typedefs.js";
export declare class BinaryMultiStateStep<STATES extends {
    [state: PropertyKey]: BinaryPureStep<any>;
}, ARGS_UNION = STATES[keyof STATES] extends BinaryPureStep<any, infer ARGS> ? ARGS : any> extends BinaryPureStep<STATES[keyof STATES], ARGS_UNION> {
    state: keyof STATES;
    protected readonly states: STATES;
    constructor(states: STATES, initial_state: keyof STATES);
    forward(input: BinaryInput<ARGS_UNION>): BinaryOutput<STATES[keyof STATES]>;
    backward(input: Omit<BinaryOutput<STATES[keyof STATES]>, "len">): BinaryInput<ARGS_UNION>;
}
export declare class BinaryStackedStateStep<STATES extends {
    [state: PropertyKey]: BinaryPureStep<any>;
}, ARGS_UNION = STATES[keyof STATES] extends BinaryPureStep<any, infer ARGS> ? ARGS : any> extends BinaryPureStep<STATES[keyof STATES], ARGS_UNION> {
    protected default_state: keyof STATES;
    protected readonly states: STATES;
    protected stack: Array<keyof STATES>;
    constructor(states: STATES, default_state: keyof STATES);
    forward(input: BinaryInput<ARGS_UNION>): BinaryOutput<STATES[keyof STATES]>;
    backward(input: Omit<BinaryOutput<STATES[keyof STATES]>, "len">): BinaryInput<ARGS_UNION>;
    push(...states: Array<keyof STATES>): void;
    pop(): keyof STATES;
}
export type ConditionalStepEntry<OUT = any, ARGS = any> = [
    forward_condition: (current_input: BinaryInput<ARGS>) => boolean,
    backward_condition: (current_input: Omit<BinaryOutput<OUT>, "len">) => boolean,
    step: BinaryPureStep<OUT, ARGS>
];
export declare class BinaryConditionalStep<CONDITIONS extends Array<ConditionalStepEntry>, OUT_UNION extends (CONDITIONS[number] extends ConditionalStepEntry<infer OUT, unknown> ? OUT : unknown) = (CONDITIONS[number] extends ConditionalStepEntry<infer OUT, unknown> ? OUT : unknown), ARGS_UNION extends (CONDITIONS[number] extends ConditionalStepEntry<unknown, infer ARGS> ? ARGS : unknown) = (CONDITIONS[number] extends ConditionalStepEntry<unknown, infer ARGS> ? ARGS : unknown)> extends BinaryPureStep<OUT_UNION, ARGS_UNION> {
    protected readonly conditions: CONDITIONS;
    protected default_step: BinaryPureStep<any>;
    constructor(conditions: CONDITIONS, default_step: BinaryPureStep<any>);
    forward(input: BinaryInput<ARGS_UNION>): BinaryOutput<OUT_UNION>;
    backward(input: Omit<BinaryOutput<OUT_UNION>, "len">): BinaryInput<ARGS_UNION>;
}
