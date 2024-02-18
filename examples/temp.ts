import { ArrayArgs, BinaryArrayStep, BinaryHeaderLengthedStep, BinaryRecordStep, RecordArgs } from "../src/binary_composition_steps.ts"
import { BinaryCStringStep, BinaryNumberArrayStep, BinaryNumberStep, BinaryStringStep } from "../src/binary_primitive_steps.ts"
import { LengthedArgs } from "../src/typedefs.ts"


const c = new BinaryArrayStep(new BinaryNumberArrayStep("u1"))
const c_out = c.forward({ bin: Uint8Array.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10), pos: 0, args: { length: 5, item: { length: 2 } } })
const c_in = c.backward(c_out)
console.log(c_out)
console.log(c_in)

const d = new BinaryHeaderLengthedStep(new BinaryNumberStep("u1"), new BinaryNumberArrayStep("u4b"))
const d_out = d.forward({ bin: Uint8Array.of(3, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3), pos: 0, args: {} })
const d_in = d.backward(d_out)
console.log(d_out)
console.log(d_in)

type MySchema = {
	a: number
	b: Record<string, any>
	c?: string
	d: {
		kill: string
		your: { self: number[] }
		headless: string[]
	}
}

type MySchemaArgs = {
	b: {},
	c: LengthedArgs,
	d: RecordArgs<{
		your: RecordArgs<{}>,
		headless: ArrayArgs<{}>
	}>
}

const MySchemaCodec = new BinaryRecordStep<MySchema, MySchemaArgs>([
	["a", new BinaryNumberStep("f8b")],
	["b", new BinaryRecordStep<MySchema["b"]>([])],
	["c", new BinaryStringStep()],
	["d", new BinaryRecordStep<MySchema["d"]>([
		["kill", new BinaryCStringStep()],
		["your", new BinaryRecordStep<MySchema["d"]["your"]>([
			["self", new BinaryHeaderLengthedStep(
				new BinaryNumberStep("u4l"),
				new BinaryNumberArrayStep("u1"),
			)]
		])],
		["headless", new BinaryArrayStep(
			new BinaryCStringStep()
		)],
	])]
])

const my_data: MySchema = {
	a: 1948.123,
	b: {},
	c: "hello world",
	d: {
		kill: "zis is null terminated",
		your: {
			self: [0xFF, 0xFE, 0xFD, 0xFC, 0xFB, 0xFA, 0xF9]
		},
		headless: ["a", "bc", "def", "ghij", "klmno"]
	}
}
const my_data_binaried = MySchemaCodec.backward({ val: my_data })
console.log(my_data_binaried)
const my_data_reconstructed = MySchemaCodec.forward(my_data_binaried)
console.log(my_data_reconstructed.val)

// sample usage with args
MySchemaCodec.forward({
	bin: my_data_binaried.bin,
	pos: 0,
	args: {
		b: {},
		c: { length: 11 },
		d: {
			your: {
				self: {
					body: {}
				}

			},
			headless: { length: 5, item: {} }
		}
	}
})
