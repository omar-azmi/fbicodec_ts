var array_isEmpty = (array) => array.length === 0, string_fromCharCode = String.fromCharCode;
var {
  from: array_from,
  isArray: array_isArray,
  of: array_of
} = Array, {
  isInteger: number_isInteger,
  MAX_VALUE: number_MAX_VALUE,
  NEGATIVE_INFINITY: number_NEGATIVE_INFINITY,
  POSITIVE_INFINITY: number_POSITIVE_INFINITY
} = Number, {
  assign: object_assign,
  defineProperty: object_defineProperty,
  entries: object_entries,
  fromEntries: object_fromEntries,
  keys: object_keys,
  getPrototypeOf: object_getPrototypeOf,
  values: object_values
} = Object, date_now = Date.now, {
  iterator: symbol_iterator,
  toStringTag: symbol_toStringTag
} = Symbol;
var typed_array_constructor_of = (type) => {
  if (type[2] === "c")
    return Uint8ClampedArray;
  switch (type = type[0] + type[1], type) {
    case "u1":
      return Uint8Array;
    case "u2":
      return Uint16Array;
    case "u4":
      return Uint32Array;
    case "i1":
      return Int8Array;
    case "i2":
      return Int16Array;
    case "i4":
      return Int32Array;
    case "f4":
      return Float32Array;
    case "f8":
      return Float64Array;
    default:
      return console.error('an unrecognized typed array type `"${type}"` was provided'), Uint8Array;
  }
}, getEnvironmentEndianess = () => new Uint8Array(Uint32Array.of(1).buffer)[0] === 1, env_is_little_endian = /* @__PURE__ */ getEnvironmentEndianess();
var swapEndianessFast = (buf, bytesize) => {
  let len = buf.byteLength, swapped_buf = new Uint8Array(len), bs = bytesize;
  for (let offset = 0; offset < bs; offset++) {
    let a = bs - 1 - offset * 2;
    for (let i = offset; i < len + offset; i += bs)
      swapped_buf[i] = buf[i + a];
  }
  return swapped_buf;
}, concatBytes = (...arrs) => {
  let offsets = [0];
  for (let arr of arrs)
    offsets.push(offsets[offsets.length - 1] + arr.length);
  let outarr = new Uint8Array(offsets.pop());
  for (let arr of arrs)
    outarr.set(arr, offsets.shift());
  return outarr;
};
var txt_encoder = /* @__PURE__ */ new TextEncoder(), txt_decoder = /* @__PURE__ */ new TextDecoder();
var encode_cstr = (value) => txt_encoder.encode(value + "\0"), decode_cstr = (buf, offset = 0) => {
  let offset_end = buf.indexOf(0, offset), txt_arr = buf.subarray(offset, offset_end);
  return [txt_decoder.decode(txt_arr), txt_arr.length + 1];
}, encode_str = (value) => txt_encoder.encode(value), decode_str = (buf, offset = 0, bytesize) => {
  let offset_end = bytesize === void 0 ? void 0 : offset + bytesize, txt_arr = buf.subarray(offset, offset_end);
  return [txt_decoder.decode(txt_arr), txt_arr.length];
}, encode_bytes = (value) => value, decode_bytes = (buf, offset = 0, bytesize) => {
  let offset_end = bytesize === void 0 ? void 0 : offset + bytesize, value = buf.slice(offset, offset_end);
  return [value, value.length];
}, encode_number_array = (value, type) => {
  let [t, s, e] = type, typed_arr_constructor = typed_array_constructor_of(type), bytesize = parseInt(s), is_native_endian = !!(e === "l" && env_is_little_endian || e === "b" && !env_is_little_endian || bytesize === 1), typed_arr = typed_arr_constructor.from(value);
  if (typed_arr instanceof Uint8Array)
    return typed_arr;
  let buf = new Uint8Array(typed_arr.buffer);
  return is_native_endian ? buf : swapEndianessFast(buf, bytesize);
}, decode_number_array = (buf, offset = 0, type, array_length) => {
  let [t, s, e] = type, bytesize = parseInt(s), is_native_endian = !!(e === "l" && env_is_little_endian || e === "b" && !env_is_little_endian || bytesize === 1), bytelength = array_length ? bytesize * array_length : void 0, array_buf = buf.slice(offset, bytelength ? offset + bytelength : void 0), array_bytesize = array_buf.length, typed_arr_constructor = typed_array_constructor_of(type), typed_arr = new typed_arr_constructor(is_native_endian ? array_buf.buffer : swapEndianessFast(array_buf, bytesize).buffer);
  return [Array.from(typed_arr), array_bytesize];
}, encode_number = (value, type) => encode_number_array([value], type), decode_number = (buf, offset = 0, type) => {
  let [value_arr, bytesize] = decode_number_array(buf, offset, type, 1);
  return [value_arr[0], bytesize];
};
var {
  isFinite: number_isFinite,
  parseInt: number_parseInt
} = Number, {
  ceil: math_ceil
} = Math;
var Step = class {
}, PureStep = class extends Step {
  lost;
}, BinaryStep = class extends Step {
}, BinaryPureStep = class extends PureStep {
};
var BinaryArrayStep = class extends BinaryPureStep {
  item_step;
  constructor(item_step) {
    super(), this.item_step = item_step;
  }
  forward(input) {
    let { bin, pos, args: { length, item } } = input, bin_length = bin.byteLength, out_arr = [], bytelength = 0, i = length < 0 ? number_NEGATIVE_INFINITY : 0;
    for (; i < length && pos + bytelength < bin_length; ) {
      let { val, len } = this.next_forward(bin, pos + bytelength, item);
      bytelength += len, out_arr.push(val), i++;
    }
    return { val: out_arr, len: bytelength };
  }
  next_forward(bin, pos, item_args) {
    return this.item_step.forward({ bin, pos, args: item_args });
  }
  backward(input) {
    let item_step = this.item_step, out_bins = [], val = input.val, item_args;
    for (let item of val) {
      let { bin, args } = item_step.backward({ val: item });
      if (out_bins.push(bin), item_args ??= args, 0)
        for (let key in args)
          console.assert(
            item_args[key] === args[key],
            "`item_args` key's value mismatches with the current encoded item's `args`.",
            `
	 a key-value pair mismatch should not occur between each element of the array, otherwise it is not invertible in theory.`,
            "\n	`key`:",
            key,
            "\n	`item_args[key]`:",
            item_args[key],
            "\n	`args[key]`:",
            args[key]
          );
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
  // TODO: create `protected next_backward` method, but I can't think of a way to also include the
  // `if (DEBUG.ASSERT)` block in it, without making it look like an eyesore.
}, BinaryHeaderLengthedStep = class extends BinaryPureStep {
  head_step;
  body_step;
  constructor(head_step, body_step) {
    super(), this.head_step = head_step, this.body_step = body_step;
  }
  forward(input) {
    let { bin, pos, args: { head: head_args, body: body_args } = {} } = input, head_step = this.head_step, body_step = this.body_step, { val: length, len: head_bytelength } = head_step.forward({ bin, pos, args: head_args }), { val, len: body_bytelength } = body_step.forward({ bin, pos: pos + head_bytelength, args: { length, ...body_args } });
    return {
      val,
      len: head_bytelength + body_bytelength
    };
  }
  backward(input) {
    let { bin: body_bin, args: all_body_args } = this.body_step.backward(input), { length, ...body_args } = all_body_args, { bin: head_bin, args: head_args } = this.head_step.backward({ val: length });
    return {
      bin: concatBytes(head_bin, body_bin),
      pos: 0,
      args: {
        head: head_args,
        body: body_args
      }
    };
  }
}, BinaryRecordStep = class extends BinaryPureStep {
  // protected readonly entry_steps: ObjectFromEntries<Array<ENTRY_TYPE & [string, unknown]>>
  entry_steps;
  constructor(entries) {
    super(), this.entry_steps = entries;
  }
  forward(input) {
    let { bin, pos, args = {} } = input;
    return this.partial_forward(bin, pos, args);
  }
  partial_forward(bin, pos, args, start = 0, end) {
    let steps = this.entry_steps.slice(start, end), out_record = {}, bytelength = 0;
    for (let [key, step] of steps) {
      let { val, len } = step.forward({ bin, pos: pos + bytelength, args: args[key] });
      bytelength += len, out_record[key] = val;
    }
    return {
      val: out_record,
      len: bytelength
    };
  }
  backward(input) {
    let { bins, args } = this.partial_backward(input.val);
    return {
      bin: concatBytes(...bins),
      pos: 0,
      args
    };
  }
  partial_backward(val, start = 0, end) {
    let steps = this.entry_steps.slice(start, end), out_bins = [], entry_args = {};
    for (let [key, step] of steps) {
      let { bin, args } = step.backward({ val: val[key] });
      entry_args[key] = args, out_bins.push(bin);
    }
    return {
      bins: out_bins,
      args: entry_args
    };
  }
}, SequentialSteps = class extends PureStep {
  steps;
  constructor(...steps) {
    super(), this.steps = steps;
  }
  forward(input) {
    let steps_len = this.steps.length, output = input;
    for (let i = 0; i < steps_len; i++)
      output = this.next_forward(output, i);
    return output;
  }
  next_forward(input, step_index) {
    return this.steps[step_index].forward(input);
  }
  backward(input) {
    let steps_len = this.steps.length, output = input;
    for (let i = 0; i < steps_len; i++)
      output = this.next_backward(output, i);
    return output;
  }
  next_backward(input, step_reverse_index) {
    return this.steps.at(-1 - step_reverse_index).backward(input);
  }
};
var BinaryMultiStateStep = class extends BinaryPureStep {
  state;
  states;
  constructor(states, initial_state) {
    super(), this.state = initial_state, this.states = states;
  }
  forward(input) {
    return this.states[this.state].forward(input);
  }
  backward(input) {
    return this.states[this.state].backward(input);
  }
}, BinaryStackedStateStep = class extends BinaryPureStep {
  default_state;
  states;
  stack = [];
  constructor(states, default_state) {
    super(), this.default_state = default_state, this.states = states;
  }
  forward(input) {
    return this.states[this.pop()].forward(input);
  }
  backward(input) {
    return this.states[this.pop()].backward(input);
  }
  push(...states) {
    this.stack.push(...states);
  }
  pop() {
    let stack = this.stack;
    return array_isEmpty(stack) ? this.default_state : stack.pop();
  }
}, BinaryConditionalStep = class extends BinaryPureStep {
  conditions;
  default_step;
  constructor(conditions, default_step) {
    super(), this.conditions = conditions, this.default_step = default_step;
  }
  forward(input) {
    for (let [forward_condition, , step] of this.conditions)
      if (forward_condition(input))
        return step.forward(input);
    return this.default_step.forward(input);
  }
  backward(input) {
    for (let [, backward_condition, step] of this.conditions)
      if (backward_condition(input))
        return step.backward(input);
    return this.default_step.backward(input);
  }
};
var BinaryCStringStep = class extends BinaryPureStep {
  forward(input) {
    let { bin, pos } = input, [str, bytelength] = decode_cstr(bin, pos);
    return { val: str, len: bytelength };
  }
  backward(input) {
    return { bin: encode_cstr(input.val), pos: 0 };
  }
}, BinaryNumberStep = class extends BinaryPureStep {
  // TODO: later on, add support for the variable sized numeric types `"iv"` and `"uv"`
  kind;
  constructor(kind) {
    super(), this.kind = kind;
  }
  forward(input) {
    let { bin, pos } = input, [num, bytelength] = decode_number(bin, pos, this.kind);
    return { val: num, len: bytelength };
  }
  backward(input) {
    return { bin: encode_number(input.val, this.kind), pos: 0 };
  }
}, BinaryStringStep = class extends BinaryPureStep {
  forward(input) {
    let { bin, pos, args: { length: str_length } } = input, [str, bytelength] = decode_str(bin, pos, str_length >= 0 ? str_length : void 0);
    return { val: str, len: bytelength };
  }
  backward(input) {
    let bin = encode_str(input.val), str_length = bin.length;
    return { bin, pos: 0, args: { length: str_length } };
  }
}, BinaryNumberArrayStep = class extends BinaryPureStep {
  // TODO: later on, add support for the variable sized numeric types `"iv"` and `"uv"`
  kind;
  constructor(kind) {
    super(), this.kind = kind;
  }
  forward(input) {
    let { bin, pos, args: { length } } = input, [arr, bytelength] = decode_number_array(bin, pos, this.kind + "[]", length >= 0 ? length : void 0);
    return { val: arr, len: bytelength };
  }
  backward(input) {
    let val = input.val, arr_len = val.length;
    return { bin: encode_number_array(val, this.kind + "[]"), pos: 0, args: { length: arr_len } };
  }
}, BinaryBytesStep = class extends BinaryPureStep {
  forward(input) {
    let { bin, pos, args: { length: bytes_length } } = input, [bytes, bytelength] = decode_bytes(bin, pos, bytes_length >= 0 ? bytes_length : void 0);
    return { val: bytes, len: bytelength };
  }
  backward(input) {
    let bin = encode_bytes(input.val), length = bin.length;
    return { bin, pos: 0, args: { length } };
  }
}, BinaryDefaultArgs = class extends BinaryPureStep {
  step;
  args;
  priority;
  constructor(step, default_args, priority = 1) {
    super(), this.step = step, this.args = default_args, this.priority = priority;
  }
  forward(input) {
    let { bin, pos, args = {} } = input, step = this.step, default_args = this.args, priority = this.priority, overridden_args = priority > 0 ? { ...args, ...default_args } : { ...default_args, ...args };
    return step.forward({ bin, pos, args: overridden_args });
  }
  backward(input) {
    return this.step.backward(input);
  }
}, BinaryOutputUnwrapStep = class extends PureStep {
  forward(input) {
    return input.val;
  }
  backward(input) {
    return { val: input };
  }
}, BinaryOutputWrapStep = class extends PureStep {
  forward(input) {
    return { val: input, len: void 0 };
  }
  backward(input) {
    return input.val;
  }
}, BinaryInputUnwrapStep = class extends PureStep {
  forward(input) {
    return input.bin;
  }
  backward(input) {
    return { bin: input, pos: 0, args: void 0 };
  }
}, BinaryInputWrapStep = class extends PureStep {
  forward(input) {
    return { bin: input, pos: 0, args: void 0 };
  }
  backward(input) {
    return input.bin;
  }
};
export {
  BinaryArrayStep,
  BinaryBytesStep,
  BinaryCStringStep,
  BinaryConditionalStep,
  BinaryDefaultArgs,
  BinaryHeaderLengthedStep,
  BinaryInputUnwrapStep,
  BinaryInputWrapStep,
  BinaryMultiStateStep,
  BinaryNumberArrayStep,
  BinaryNumberStep,
  BinaryOutputUnwrapStep,
  BinaryOutputWrapStep,
  BinaryPureStep,
  BinaryRecordStep,
  BinaryStackedStateStep,
  BinaryStep,
  BinaryStringStep,
  PureStep,
  SequentialSteps,
  Step
};
