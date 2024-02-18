import { decode_bytes, decode_cstr, decode_number, decode_number_array, decode_str, encode_bytes, encode_cstr, encode_number, encode_number_array, encode_str } from "./deps.js";
import { BinaryPureStep, PureStep } from "./typedefs.js";
export class BinaryCStringStep extends BinaryPureStep {
    forward(input) {
        const { bin, pos } = input, [str, bytelength] = decode_cstr(bin, pos);
        return { val: str, len: bytelength };
    }
    backward(input) {
        const bin = encode_cstr(input.val);
        return { bin, pos: 0 };
    }
}
export class BinaryNumberStep extends BinaryPureStep {
    // TODO: later on, add support for the variable sized numeric types `"iv"` and `"uv"`
    kind;
    constructor(kind) {
        super();
        this.kind = kind;
    }
    forward(input) {
        const { bin, pos } = input, [num, bytelength] = decode_number(bin, pos, this.kind);
        return { val: num, len: bytelength };
    }
    backward(input) {
        const bin = encode_number(input.val, this.kind);
        return { bin, pos: 0 };
    }
}
export class BinaryStringStep extends BinaryPureStep {
    forward(input) {
        const { bin, pos, args: { length: str_length } } = input, [str, bytelength] = decode_str(bin, pos, str_length >= 0 ? str_length : undefined);
        return { val: str, len: bytelength };
    }
    backward(input) {
        const bin = encode_str(input.val), str_length = bin.length;
        return { bin, pos: 0, args: { length: str_length } };
    }
}
export class BinaryNumberArrayStep extends BinaryPureStep {
    // TODO: later on, add support for the variable sized numeric types `"iv"` and `"uv"`
    kind;
    constructor(kind) {
        super();
        this.kind = kind;
    }
    forward(input) {
        const { bin, pos, args: { length } } = input, [arr, bytelength] = decode_number_array(bin, pos, this.kind + "[]", length >= 0 ? length : undefined);
        return { val: arr, len: bytelength };
    }
    backward(input) {
        const val = input.val, arr_len = val.length, bin = encode_number_array(val, this.kind + "[]");
        return { bin, pos: 0, args: { length: arr_len } };
    }
}
export class BinaryBytesStep extends BinaryPureStep {
    forward(input) {
        const { bin, pos, args: { length: bytes_length } } = input, [bytes, bytelength] = decode_bytes(bin, pos, bytes_length >= 0 ? bytes_length : undefined);
        return { val: bytes, len: bytelength };
    }
    backward(input) {
        const bin = encode_bytes(input.val), length = bin.length;
        return { bin, pos: 0, args: { length } };
    }
}
export class BinaryDefaultArgs extends BinaryPureStep {
    step;
    args;
    priority;
    constructor(step, default_args, priority = 1) {
        super();
        this.step = step;
        this.args = default_args;
        this.priority = priority;
    }
    forward(input) {
        const { bin, pos, args = {} } = input, step = this.step, default_args = this.args, priority = this.priority, overridden_args = priority > 0 ? { ...args, ...default_args } : { ...default_args, ...args };
        return step.forward({ bin, pos, args: overridden_args });
    }
    backward(input) {
        return this.step.backward(input);
    }
}
export class BinaryOutputUnwrapStep extends PureStep {
    forward(input) { return input.val; }
    backward(input) { return { val: input }; }
}
// TODO: add a warning about forward method's `output.len === undefined`, as it might ruin accumulated
// size computation, and will be hard to debug and come across this as being the culprit
export class BinaryOutputWrapStep extends PureStep {
    forward(input) { return { val: input, len: undefined }; }
    backward(input) { return input.val; }
}
export class BinaryInputUnwrapStep extends PureStep {
    forward(input) { return input.bin; }
    backward(input) { return { bin: input, pos: 0, args: undefined }; }
}
export class BinaryInputWrapStep extends PureStep {
    forward(input) { return { bin: input, pos: 0, args: undefined }; }
    backward(input) { return input.bin; }
}
