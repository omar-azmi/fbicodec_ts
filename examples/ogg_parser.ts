import { FileParser } from "https://deno.land/x/kitchensink_ts@v0.7.3/devdebug.ts"
import { AllOggPages, AllStreamPages } from "./ogg_page_parser.ts"
import { OpusStream, Opus_type } from "./ogg_stream_parsers.ts"


const ogg_file_step = new AllOggPages()
const ogg_streams_step = new AllStreamPages()
const opus_stream_step = new OpusStream()

const file_step_adapter = {
	encode: (value: Opus_type): Uint8Array => {
		const first_stream = opus_stream_step.backward(value)
		const random_serial_number = 123456789.
		const all_streams = new Map([[random_serial_number, first_stream],])
		const all_pages = ogg_streams_step.backward(all_streams)
		const bin = ogg_file_step.backward(all_pages).bin
		return bin
	},
	decode: (buffer: Uint8Array, offset: number, ...args: any[]): [value: Opus_type, bytesize: number] => {
		const all_pages = ogg_file_step.forward({ bin: buffer, pos: 0, args: {} })
		const all_streams = ogg_streams_step.forward(all_pages)
		const [first_stream_serial_number, first_stream] = [...all_streams][0]
		const opus_stream = opus_stream_step.forward(first_stream)
		return [opus_stream, 0]
	}
}

const ogg_file_parser = new FileParser(file_step_adapter)
Object.assign(window, { ogg_file_parser })


