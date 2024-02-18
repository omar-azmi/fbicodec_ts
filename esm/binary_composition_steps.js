import { DEBUG, concatBytes, number_NEGATIVE_INFINITY } from "./deps.js";
import { BinaryPureStep, PureStep } from "./typedefs.js";
export class BinaryArrayStep extends BinaryPureStep {
    item_step;
    constructor(item_step) {
        super();
        this.item_step = item_step;
    }
    forward(input) {
        // TODO: move the functionality of infinitely parsing an array to a subclass of its own, where the `args.length` parameter becomes optional
        const { bin, pos, args: { length, item } } = input, bin_length = bin.byteLength, out_arr = [];
        let bytelength = 0, i = length < 0 ? number_NEGATIVE_INFINITY : 0;
        // a negative length will let the forward parsing continue until the end of the binary data is reached
        while (i < length && pos + bytelength < bin_length) {
            const { val, len } = this.next_forward(bin, pos + bytelength, item);
            bytelength += len;
            out_arr.push(val);
            i++;
        }
        return { val: out_arr, len: bytelength };
    }
    next_forward(bin, pos, item_args) {
        return this.item_step.forward({ bin, pos, args: item_args });
    }
    backward(input) {
        const item_step = this.item_step, out_bins = [], val = input.val;
        let item_args;
        for (const item of val) {
            const { bin, args } = item_step.backward({ val: item });
            out_bins.push(bin);
            item_args ??= args;
            if (DEBUG.ASSERT) {
                for (const key in args) {
                    console.assert(item_args[key] === args[key], "`item_args` key's value mismatches with the current encoded item's `args`.", "\n\t a key-value pair mismatch should not occur between each element of the array, otherwise it is not invertible in theory.", "\n\t`key`:", key, "\n\t`item_args[key]`:", item_args[key], "\n\t`args[key]`:", args[key]);
                }
            }
        }
        return {
            bin: concatBytes(...out_bins),
            pos: 0,
            args: {
                length: out_bins.length,
                item: item_args
            }
        };
    }
}
export class BinaryHeaderLengthedStep extends BinaryPureStep {
    head_step;
    body_step;
    constructor(head_step, body_step) {
        super();
        this.head_step = head_step;
        this.body_step = body_step;
    }
    forward(input) {
        const { bin, pos, args: { head: head_args, body: body_args } = {} } = input, head_step = this.head_step, body_step = this.body_step, { val: length, len: head_bytelength } = head_step.forward({ bin, pos, args: head_args }), { val, len: body_bytelength } = body_step.forward({ bin, pos: pos + head_bytelength, args: { length, ...body_args } });
        return {
            val,
            len: head_bytelength + body_bytelength,
        };
    }
    backward(input) {
        const { bin: body_bin, args: all_body_args } = this.body_step.backward(input), { length, ...body_args } = all_body_args, { bin: head_bin, args: head_args } = this.head_step.backward({ val: length });
        return {
            bin: concatBytes(head_bin, body_bin),
            pos: 0,
            args: {
                head: head_args,
                body: body_args,
            }
        };
    }
}
// TODO: cleanup the line below, as inference of RECORD entries' ARGS will probably not be implemented
// type RecordEntry_KeyArgsTuple<RecordEntryBinaryStep extends [name: string, step: BinaryPureStep<any>]> = Entries_Mapped<Array<RecordEntryBinaryStep>, "ArgsOf_BinaryPureStep">
export class BinaryRecordStep extends BinaryPureStep {
    // protected readonly entry_steps: ObjectFromEntries<Array<ENTRY_TYPE & [string, unknown]>>
    entry_steps;
    constructor(entries) {
        super();
        this.entry_steps = entries;
    }
    forward(input) {
        const { bin, pos, args = {} } = input;
        return this.partial_forward(bin, pos, args);
    }
    partial_forward(bin, pos, args, start = 0, end) {
        const steps = this.entry_steps.slice(start, end), out_record = {};
        let bytelength = 0;
        for (const [key, step] of steps) {
            const { val, len } = step.forward({ bin, pos: pos + bytelength, args: args[key] });
            bytelength += len;
            out_record[key] = val;
        }
        return {
            val: out_record,
            len: bytelength,
        };
    }
    backward(input) {
        const { bins, args } = this.partial_backward(input.val);
        return {
            bin: concatBytes(...bins),
            pos: 0,
            args: args,
        };
    }
    partial_backward(val, start = 0, end) {
        const steps = this.entry_steps.slice(start, end), out_bins = [], entry_args = {};
        for (const [key, step] of steps) {
            const { bin, args } = step.backward({ val: val[key] });
            entry_args[key] = args;
            out_bins.push(bin);
        }
        return {
            bins: out_bins,
            args: entry_args,
        };
    }
}
export class SequentialSteps extends PureStep {
    steps;
    constructor(...steps) {
        super();
        this.steps = steps;
    }
    forward(input) {
        const steps_len = this.steps.length;
        let output = input;
        for (let i = 0; i < steps_len; i++) {
            output = this.next_forward(output, i);
        }
        return output;
    }
    next_forward(input, step_index) {
        const step = this.steps[step_index];
        return step.forward(input);
    }
    backward(input) {
        const steps_len = this.steps.length;
        let output = input;
        for (let i = 0; i < steps_len; i++) {
            output = this.next_backward(output, i);
        }
        return output;
    }
    next_backward(input, step_reverse_index) {
        const step = this.steps.at(-1 - step_reverse_index);
        return step.backward(input);
    }
}
