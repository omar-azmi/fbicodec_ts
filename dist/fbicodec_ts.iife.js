"use strict";
(() => {
  // node_modules/kitchensink_ts/esm/_dnt.polyfills.js
  if (!Object.hasOwn) {
    Object.defineProperty(Object, "hasOwn", {
      value: function(object, property) {
        if (object == null) {
          throw new TypeError("Cannot convert undefined or null to object");
        }
        return Object.prototype.hasOwnProperty.call(Object(object), property);
      },
      configurable: true,
      enumerable: false,
      writable: true
    });
  }

  // node_modules/kitchensink_ts/esm/builtin_aliases_deps.js
  var array_isEmpty = (array) => array.length === 0;
  var string_fromCharCode = String.fromCharCode;
  var { from: array_from, isArray: array_isArray, of: array_of } = Array;
  var { isInteger: number_isInteger, MAX_VALUE: number_MAX_VALUE, NEGATIVE_INFINITY: number_NEGATIVE_INFINITY, POSITIVE_INFINITY: number_POSITIVE_INFINITY } = Number;
  var { assign: object_assign, defineProperty: object_defineProperty, entries: object_entries, fromEntries: object_fromEntries, keys: object_keys, getPrototypeOf: object_getPrototypeOf, values: object_values } = Object;
  var date_now = Date.now;
  var { iterator: symbol_iterator, toStringTag: symbol_toStringTag } = Symbol;

  // node_modules/kitchensink_ts/esm/typedbuffer.js
  var typed_array_constructor_of = (type) => {
    if (type[2] === "c")
      return Uint8ClampedArray;
    type = type[0] + type[1];
    switch (type) {
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
      default: {
        console.error('an unrecognized typed array type `"${type}"` was provided');
        return Uint8Array;
      }
    }
  };
  var getEnvironmentEndianess = () => new Uint8Array(Uint32Array.of(1).buffer)[0] === 1 ? true : false;
  var env_is_little_endian = /* @__PURE__ */ getEnvironmentEndianess();
  var swapEndianessFast = (buf, bytesize) => {
    const len = buf.byteLength, swapped_buf = new Uint8Array(len), bs = bytesize;
    for (let offset = 0; offset < bs; offset++) {
      const a = bs - 1 - offset * 2;
      for (let i = offset; i < len + offset; i += bs)
        swapped_buf[i] = buf[i + a];
    }
    return swapped_buf;
  };
  var concatBytes = (...arrs) => {
    const offsets = [0];
    for (const arr of arrs)
      offsets.push(offsets[offsets.length - 1] + arr.length);
    const outarr = new Uint8Array(offsets.pop());
    for (const arr of arrs)
      outarr.set(arr, offsets.shift());
    return outarr;
  };

  // node_modules/kitchensink_ts/esm/eightpack.js
  var txt_encoder = /* @__PURE__ */ new TextEncoder();
  var txt_decoder = /* @__PURE__ */ new TextDecoder();
  var encode_cstr = (value) => txt_encoder.encode(value + "\0");
  var decode_cstr = (buf, offset = 0) => {
    const offset_end = buf.indexOf(0, offset), txt_arr = buf.subarray(offset, offset_end), value = txt_decoder.decode(txt_arr);
    return [value, txt_arr.length + 1];
  };
  var encode_str = (value) => txt_encoder.encode(value);
  var decode_str = (buf, offset = 0, bytesize) => {
    const offset_end = bytesize === void 0 ? void 0 : offset + bytesize, txt_arr = buf.subarray(offset, offset_end), value = txt_decoder.decode(txt_arr);
    return [value, txt_arr.length];
  };
  var encode_bytes = (value) => value;
  var decode_bytes = (buf, offset = 0, bytesize) => {
    const offset_end = bytesize === void 0 ? void 0 : offset + bytesize, value = buf.slice(offset, offset_end);
    return [value, value.length];
  };
  var encode_number_array = (value, type) => {
    const [t, s, e] = type, typed_arr_constructor = typed_array_constructor_of(type), bytesize = parseInt(s), is_native_endian = e === "l" && env_is_little_endian || e === "b" && !env_is_little_endian || bytesize === 1 ? true : false, typed_arr = typed_arr_constructor.from(value);
    if (typed_arr instanceof Uint8Array)
      return typed_arr;
    const buf = new Uint8Array(typed_arr.buffer);
    if (is_native_endian)
      return buf;
    else
      return swapEndianessFast(buf, bytesize);
  };
  var decode_number_array = (buf, offset = 0, type, array_length) => {
    const [t, s, e] = type, bytesize = parseInt(s), is_native_endian = e === "l" && env_is_little_endian || e === "b" && !env_is_little_endian || bytesize === 1 ? true : false, bytelength = array_length ? bytesize * array_length : void 0, array_buf = buf.slice(offset, bytelength ? offset + bytelength : void 0), array_bytesize = array_buf.length, typed_arr_constructor = typed_array_constructor_of(type), typed_arr = new typed_arr_constructor(is_native_endian ? array_buf.buffer : swapEndianessFast(array_buf, bytesize).buffer);
    return [Array.from(typed_arr), array_bytesize];
  };
  var encode_number = (value, type) => encode_number_array([value], type);
  var decode_number = (buf, offset = 0, type) => {
    const [value_arr, bytesize] = decode_number_array(buf, offset, type, 1);
    return [value_arr[0], bytesize];
  };

  // src/deps.ts
  var {
    isFinite: number_isFinite,
    parseInt: number_parseInt
  } = Number;
  var {
    ceil: math_ceil
  } = Math;

  // src/typedefs.ts
  var Step = class {
  };
  var PureStep = class extends Step {
    lost;
  };
  var BinaryStep = class extends Step {
  };
  var BinaryPureStep = class extends PureStep {
  };

  // src/binary_composition_steps.ts
  var BinaryArrayStep = class extends BinaryPureStep {
    item_step;
    constructor(item_step) {
      super();
      this.item_step = item_step;
    }
    forward(input) {
      const { bin, pos, args: { length, item } } = input, bin_length = bin.byteLength, out_arr = [];
      let bytelength = 0, i = length < 0 ? number_NEGATIVE_INFINITY : 0;
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
        if (0 /* ASSERT */) {
          for (const key in args) {
            console.assert(
              item_args[key] === args[key],
              "`item_args` key's value mismatches with the current encoded item's `args`.",
              "\n	 a key-value pair mismatch should not occur between each element of the array, otherwise it is not invertible in theory.",
              "\n	`key`:",
              key,
              "\n	`item_args[key]`:",
              item_args[key],
              "\n	`args[key]`:",
              args[key]
            );
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
    // TODO: create `protected next_backward` method, but I can't think of a way to also include the
    // `if (DEBUG.ASSERT)` block in it, without making it look like an eyesore.
  };
  var BinaryHeaderLengthedStep = class extends BinaryPureStep {
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
        len: head_bytelength + body_bytelength
      };
    }
    backward(input) {
      const { bin: body_bin, args: all_body_args } = this.body_step.backward(input), { length, ...body_args } = all_body_args, { bin: head_bin, args: head_args } = this.head_step.backward({ val: length });
      return {
        bin: concatBytes(head_bin, body_bin),
        pos: 0,
        args: {
          head: head_args,
          body: body_args
        }
      };
    }
  };
  var BinaryRecordStep = class extends BinaryPureStep {
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
        len: bytelength
      };
    }
    backward(input) {
      const { bins, args } = this.partial_backward(input.val);
      return {
        bin: concatBytes(...bins),
        pos: 0,
        args
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
        args: entry_args
      };
    }
  };
  var SequentialSteps = class extends PureStep {
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
  };

  // src/binary_conditional_steps.ts
  var BinaryMultiStateStep = class extends BinaryPureStep {
    state;
    states;
    constructor(states, initial_state) {
      super();
      this.state = initial_state;
      this.states = states;
    }
    forward(input) {
      const step = this.states[this.state];
      return step.forward(input);
    }
    backward(input) {
      const step = this.states[this.state];
      return step.backward(input);
    }
  };
  var BinaryStackedStateStep = class extends BinaryPureStep {
    default_state;
    states;
    stack = [];
    constructor(states, default_state) {
      super();
      this.default_state = default_state;
      this.states = states;
    }
    forward(input) {
      const step = this.states[this.pop()];
      return step.forward(input);
    }
    backward(input) {
      const step = this.states[this.pop()];
      return step.backward(input);
    }
    push(...states) {
      this.stack.push(...states);
    }
    pop() {
      const stack = this.stack;
      return array_isEmpty(stack) ? this.default_state : stack.pop();
    }
  };
  var BinaryConditionalStep = class extends BinaryPureStep {
    conditions;
    default_step;
    constructor(conditions, default_step) {
      super();
      this.conditions = conditions;
      this.default_step = default_step;
    }
    forward(input) {
      for (const [forward_condition, , step] of this.conditions) {
        if (forward_condition(input)) {
          return step.forward(input);
        }
      }
      return this.default_step.forward(input);
    }
    backward(input) {
      for (const [, backward_condition, step] of this.conditions) {
        if (backward_condition(input)) {
          return step.backward(input);
        }
      }
      return this.default_step.backward(input);
    }
  };

  // src/binary_primitive_steps.ts
  var BinaryCStringStep = class extends BinaryPureStep {
    forward(input) {
      const { bin, pos } = input, [str, bytelength] = decode_cstr(bin, pos);
      return { val: str, len: bytelength };
    }
    backward(input) {
      const bin = encode_cstr(input.val);
      return { bin, pos: 0 };
    }
  };
  var BinaryNumberStep = class extends BinaryPureStep {
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
  };
  var BinaryStringStep = class extends BinaryPureStep {
    forward(input) {
      const { bin, pos, args: { length: str_length } } = input, [str, bytelength] = decode_str(bin, pos, str_length >= 0 ? str_length : void 0);
      return { val: str, len: bytelength };
    }
    backward(input) {
      const bin = encode_str(input.val), str_length = bin.length;
      return { bin, pos: 0, args: { length: str_length } };
    }
  };
  var BinaryNumberArrayStep = class extends BinaryPureStep {
    // TODO: later on, add support for the variable sized numeric types `"iv"` and `"uv"`
    kind;
    constructor(kind) {
      super();
      this.kind = kind;
    }
    forward(input) {
      const { bin, pos, args: { length } } = input, [arr, bytelength] = decode_number_array(bin, pos, this.kind + "[]", length >= 0 ? length : void 0);
      return { val: arr, len: bytelength };
    }
    backward(input) {
      const val = input.val, arr_len = val.length, bin = encode_number_array(val, this.kind + "[]");
      return { bin, pos: 0, args: { length: arr_len } };
    }
  };
  var BinaryBytesStep = class extends BinaryPureStep {
    forward(input) {
      const { bin, pos, args: { length: bytes_length } } = input, [bytes, bytelength] = decode_bytes(bin, pos, bytes_length >= 0 ? bytes_length : void 0);
      return { val: bytes, len: bytelength };
    }
    backward(input) {
      const bin = encode_bytes(input.val), length = bin.length;
      return { bin, pos: 0, args: { length } };
    }
  };
  var BinaryDefaultArgs = class extends BinaryPureStep {
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
  };
  var BinaryOutputUnwrapStep = class extends PureStep {
    forward(input) {
      return input.val;
    }
    backward(input) {
      return { val: input };
    }
  };
  var BinaryOutputWrapStep = class extends PureStep {
    forward(input) {
      return { val: input, len: void 0 };
    }
    backward(input) {
      return input.val;
    }
  };
  var BinaryInputUnwrapStep = class extends PureStep {
    forward(input) {
      return input.bin;
    }
    backward(input) {
      return { bin: input, pos: 0, args: void 0 };
    }
  };
  var BinaryInputWrapStep = class extends PureStep {
    forward(input) {
      return { bin: input, pos: 0, args: void 0 };
    }
    backward(input) {
      return input.bin;
    }
  };
})();
