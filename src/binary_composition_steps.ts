import { DEBUG, concatBytes, number_NEGATIVE_INFINITY } from "./deps.ts"
import { BinaryInput, BinaryLengthedDataPureStep, BinaryOutput, BinaryPureStep, LengthedArgs, ObjectToEntries_Mapped, OptionalNeverKeys, PureStep } from "./typedefs.ts"


export interface ArrayArgs<ITEM_ARGS> extends LengthedArgs {
	item: ITEM_ARGS
}
export class BinaryArrayStep<
	ITEM_STEP extends BinaryPureStep<any, any>,
	OUT_ITEM = (ITEM_STEP extends BinaryPureStep<infer T, unknown> ? T : never),
	ITEM_ARGS extends Record<string, any> = (ITEM_STEP extends BinaryPureStep<OUT_ITEM, infer T> ? T : never)
> extends BinaryPureStep<OUT_ITEM[], ArrayArgs<ITEM_ARGS>> implements BinaryLengthedDataPureStep {
	protected readonly item_step: ITEM_STEP

	constructor(item_step: ITEM_STEP) {
		super()
		this.item_step = item_step
	}
	forward(input: BinaryInput<ArrayArgs<ITEM_ARGS>>): BinaryOutput<OUT_ITEM[]> {
		// TODO: move the functionality of infinitely parsing an array to a subclass of its own, where the `args.length` parameter becomes optional
		const
			{ bin, pos, args: { length, item } } = input,
			bin_length = bin.byteLength,
			out_arr: OUT_ITEM[] = []
		let
			bytelength = 0,
			i = length < 0 ? number_NEGATIVE_INFINITY : 0
		// a negative length will let the forward parsing continue until the end of the binary data is reached
		while (i < length && pos + bytelength < bin_length) {
			const { val, len } = this.next_forward(bin, pos + bytelength, item)
			bytelength += len
			out_arr.push(val)
			i++
		}
		return { val: out_arr, len: bytelength }
	}
	protected next_forward(bin: Uint8Array, pos: number, item_args: ITEM_ARGS): BinaryOutput<OUT_ITEM> {
		return this.item_step.forward({ bin, pos, args: item_args })
	}
	backward(input: Omit<BinaryOutput<OUT_ITEM[]>, "len">): BinaryInput<ArrayArgs<ITEM_ARGS>> {
		const
			item_step = this.item_step,
			out_bins: Uint8Array[] = [],
			val = input.val
		let item_args: ITEM_ARGS
		for (const item of val) {
			const { bin, args } = item_step.backward({ val: item })
			out_bins.push(bin)
			item_args ??= args
			if (DEBUG.ASSERT) {
				for (const key in args) {
					console.assert(
						item_args[key] === args[key],
						"`item_args` key's value mismatches with the current encoded item's `args`.",
						"\n\t a key-value pair mismatch should not occur between each element of the array, otherwise it is not invertible in theory.",
						"\n\t`key`:", key,
						"\n\t`item_args[key]`:", item_args[key],
						"\n\t`args[key]`:", args[key],
					)
				}
			}
		}
		return {
			bin: concatBytes(...out_bins),
			pos: 0,
			args: {
				length: out_bins.length,
				item: item_args!
			}
		}
	}
	// TODO: create `protected next_backward` method, but I can't think of a way to also include the
	// `if (DEBUG.ASSERT)` block in it, without making it look like an eyesore.
}


export interface HeaderLengthedArgs<HEAD_ARGS, BODY_ARGS extends LengthedArgs> {
	head: HEAD_ARGS
	// do not include the `length` key in your body, for it will be inserted by forward step automatically
	body: Exclude<BODY_ARGS, LengthedArgs>
}
export class BinaryHeaderLengthedStep<
	HEAD_STEP extends BinaryPureStep<number>,
	BODY_STEP extends BinaryPureStep<any, LengthedArgs>,
	HEAD_ARGS extends Record<string, any> = (HEAD_STEP extends BinaryPureStep<number, infer T> ? T : never),
	BODY_ARGS extends LengthedArgs = (BODY_STEP extends BinaryPureStep<any, infer T> ? T : never),
> extends BinaryPureStep<
	BODY_STEP extends BinaryPureStep<infer T, BODY_ARGS> ? T : never,
	OptionalNeverKeys<HeaderLengthedArgs<HEAD_ARGS, BODY_ARGS>>
> {
	protected readonly head_step: HEAD_STEP
	protected readonly body_step: BODY_STEP

	constructor(head_step: HEAD_STEP, body_step: BODY_STEP) {
		super()
		this.head_step = head_step
		this.body_step = body_step
	}
	forward(input: BinaryInput<OptionalNeverKeys<HeaderLengthedArgs<HEAD_ARGS, BODY_ARGS>>>): BinaryOutput<BODY_STEP extends BinaryPureStep<infer T, BODY_ARGS> ? T : never> {
		const
			{ bin, pos, args: { head: head_args, body: body_args } = {} } = input,
			head_step = this.head_step,
			body_step = this.body_step,
			{ val: length, len: head_bytelength } = head_step.forward({ bin, pos, args: head_args }),
			{ val, len: body_bytelength } = body_step.forward({ bin, pos: pos + head_bytelength, args: { length, ...body_args } })
		return {
			val,
			len: head_bytelength + body_bytelength,
		}
	}
	backward(input: Omit<BinaryOutput<BODY_STEP extends BinaryPureStep<infer T, BODY_ARGS> ? T : never>, "len">): BinaryInput<OptionalNeverKeys<HeaderLengthedArgs<HEAD_ARGS, BODY_ARGS>>> {
		const
			{ bin: body_bin, args: all_body_args } = this.body_step.backward(input),
			{ length, ...body_args } = all_body_args,
			{ bin: head_bin, args: head_args } = this.head_step.backward({ val: length })
		return {
			bin: concatBytes(head_bin, body_bin),
			pos: 0,
			args: {
				head: head_args,
				body: body_args,
			} as any
		}
	}
}


export type RecordArgs<RECORD_ARGS_MAP extends { [key: string]: any }> = RECORD_ARGS_MAP
type RecordEntry_KeyStepTuple<RECORD> = ObjectToEntries_Mapped<RECORD, "BinaryPureStep_Of">
// TODO: cleanup the line below, as inference of RECORD entries' ARGS will probably not be implemented
// type RecordEntry_KeyArgsTuple<RecordEntryBinaryStep extends [name: string, step: BinaryPureStep<any>]> = Entries_Mapped<Array<RecordEntryBinaryStep>, "ArgsOf_BinaryPureStep">

export class BinaryRecordStep<
	RECORD,
	// TODO: ARGS is extremely difficult to model with a provided set of `entries`. therefore, it is better to have to user fill it out manually
	// if we were to somehow be able to infer the args from `entries: Array<ENTRY_TYPE>`, then the `ARGS` typeparam will have to move down to become the last generic typeparameter.
	// alternatively, we may actually narrow down `ENTRY_TYPE` based on what our `ARGS` is set to be. but I think that's a stretch, and will make the typescript LSP even slower while inferring
	ENTRY_ARGS extends { [K in keyof RECORD]?: any } = { [K in keyof RECORD]?: any },
	ENTRY_TYPE extends RecordEntry_KeyStepTuple<RECORD> = RecordEntry_KeyStepTuple<RECORD>,
> extends BinaryPureStep<RECORD, RecordArgs<ENTRY_ARGS>> {
	// protected readonly entry_steps: ObjectFromEntries<Array<ENTRY_TYPE & [string, unknown]>>
	protected readonly entry_steps: Array<ENTRY_TYPE>

	constructor(entries: Array<ENTRY_TYPE>) {
		super()
		this.entry_steps = entries
	}
	forward(input: BinaryInput<RecordArgs<ENTRY_ARGS>>): BinaryOutput<RECORD> {
		const { bin, pos, args = {} as ENTRY_ARGS } = input
		return this.partial_forward(bin, pos, args) as any
	}
	protected partial_forward(bin: Uint8Array, pos: number, args: Partial<ENTRY_ARGS>, start: number = 0, end?: number | undefined): BinaryOutput<Partial<RECORD>> {
		const
			steps = this.entry_steps.slice(start, end) as unknown as Array<[key: keyof RECORD, step: BinaryPureStep<any, any>]>,
			out_record = {} as RECORD
		let bytelength = 0
		for (const [key, step] of steps) {
			const { val, len } = step.forward({ bin, pos: pos + bytelength, args: args[key] })
			bytelength += len
			out_record[key] = val
		}
		return {
			val: out_record,
			len: bytelength,
		}
	}
	backward(input: Omit<BinaryOutput<RECORD>, "len">): BinaryInput<RecordArgs<ENTRY_ARGS>> {
		const { bins, args } = this.partial_backward(input.val)
		return {
			bin: concatBytes(...bins),
			pos: 0,
			args: args as RecordArgs<ENTRY_ARGS>,
		}
	}
	protected partial_backward(val: Partial<RECORD>, start: number = 0, end?: number | undefined): { bins: Array<Uint8Array>, args: Partial<ENTRY_ARGS> } {
		const
			steps = this.entry_steps.slice(start, end) as unknown as Array<[key: keyof RECORD, step: BinaryPureStep<any, any>]>,
			out_bins: Uint8Array[] = [],
			entry_args = {} as ENTRY_ARGS
		for (const [key, step] of steps) {
			const { bin, args } = step.backward({ val: val[key] })
			entry_args[key] = args
			out_bins.push(bin)
		}
		return {
			bins: out_bins,
			args: entry_args,
		}
	}
}


export class SequentialSteps<
	FROM,
	TO,
	FIRST extends PureStep<FROM, any> = PureStep<FROM, any>,
	LAST extends PureStep<any, TO> = PureStep<any, TO>,
	STEPS extends [first: FIRST, ...intermediate_steps: PureStep<any, any>[], last: LAST] = [first: FIRST, ...intermediate_steps: PureStep<any, any>[], last: LAST],
> extends PureStep<FROM, TO> {
	protected readonly steps: STEPS

	constructor(...steps: STEPS) {
		super()
		this.steps = steps
	}
	forward(input: FROM): TO {
		const steps_len = this.steps.length
		let output: any = input
		for (let i = 0; i < steps_len; i++) {
			output = this.next_forward(output, i)
		}
		return output
	}
	protected next_forward(input: any | FROM, step_index: number): any | TO {
		const step = this.steps[step_index]
		return step.forward(input)
	}
	backward(input: TO,): FROM {
		const steps_len = this.steps.length
		let output: any = input
		for (let i = 0; i < steps_len; i++) {
			output = this.next_backward(output, i)
		}
		return output
	}
	protected next_backward(input: any | TO, step_reverse_index: number): any | FROM {
		const step = this.steps.at(- 1 - step_reverse_index)!
		return step.backward(input)
	}
}
