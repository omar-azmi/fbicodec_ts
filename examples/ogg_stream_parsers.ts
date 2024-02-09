import { BinaryArrayStep, BinaryRecordStep, BinaryHeaderLengthedStep } from "../src/binary_composition_steps.ts"
import { BinaryDefaultArgs, BinaryStringStep, BinaryNumberStep, BinaryNumberArrayStep } from "../src/binary_primitive_steps.ts"
import { StreamPages_type, OggStreamPage_type } from "./ogg_page_parser.ts"
import { BinaryInput, BinaryOutput, PureStep, LengthedArgs } from "../src/typedefs.ts"
import { concatBytes } from "https://deno.land/x/kitchensink_ts@v0.7.3/typedbuffer.ts"


export type Opus_type = {
	head: OpusHead_packet
	tags?: OpusTags_packet
	audio: Array<OggStreamPage_type>
}

/** see the following resource for specifications:
 * [wiki.xiph.org](https://wiki.xiph.org/OggOpus#ID_Header)
 * [opus-codec.org](https://opus-codec.org/docs/opusfile_api-0.7/structOpusHead.html)
*/
type OpusHead_packet = {
	/** `type: "str"` <br> the magic 8_bytes associated with the opus header block. */
	kind: "OpusHead"
	/** `type: "u1"` <br> generally `1` in all modern encodings. */
	version: 0x00 | 0x01
	/** `type: "u1"` <br> specifies channel count, must be at least `1`. */
	channels: number
	/** `type: "u2l"` <br> number of samples that should be discarded from the beginning of the stream. a pre skip of at least `3840` (80ms) is recommended. */
	pre_skip: number
	/** `type: "u4l"` <br> sampling rate of the original input. all opus audio is encoded at 48khz. */
	sample_rate: 48000
	/** `type: "i2l"` <br> the gain to apply to the decoded output in units of decibles (dB). */
	output_gain: number
	channel_table: OpusChannelTable_type
}

type OpusChannelTable_type = {
	/** `type: "u1"` <br>
	 * channel mapping family 0 covers mono or stereo in a single stream. channel mapping family 1 covers 1 to 8 channels in one or more streams. <br>
	 * if `family > 0`, then the remaining 3 fields following must be parsed, otherwise they shouldn't be parsed.
	*/
	family: 0 | 1 | 255
	/** `type: "u1"` <br> number of opus streams in each ogg packet. must be greater than `1`. */
	stream_count?: number
	/** `type: "u1"` <br> number of coupled opus streams in each ogg packet, in `range(0, 128)`. */
	coupled_count?: number
	/** `type: "u1[]"` <br> length of this u1_array is equal to the {@link OpusHead_packet.channels | channel count}. specifies which output device should be playing which channel. */
	mapping?: number[]
}

type OpusTags_packet = {
	/** `type: "str"` <br> the magic 8_bytes associated with the opus comment block. */
	kind: "OpusTags"
	comment: VorbisComment_type
}

interface PacketBinaryInput {
	stream: StreamPages_type
	/** which page to begin the parsing from */
	pos: number
}

interface PacketBinaryOutput {
	/** the content of all the page of a specific packet, all concatenated */
	val: Uint8Array
	/** number of pages that were parsed */
	len: number
}

/** parses the next packet in a stream */
class PacketBinary extends PureStep<PacketBinaryInput, PacketBinaryOutput> {
	forward(input: PacketBinaryInput): PacketBinaryOutput {
		const
			{ stream, pos } = input,
			number_of_pages = stream.length,
			out_contents: Uint8Array[] = []
		let len = 0
		while (pos + len < number_of_pages) {
			const page = stream[pos]
			if (page.fresh && len > 0) {
				// we have reached the next packet's page, and the previous packet's collection of pages has ended.
				// time to break out and return
				break
			}
			out_contents.push(page.content)
			len++
		}
		return {
			val: concatBytes(...out_contents),
			len
		}
	}
	backward(input: PacketBinaryOutput): PacketBinaryInput {
		throw new Error("Method not implemented.")
	}
}


export class OpusStream extends PureStep<StreamPages_type, Opus_type>{
	forward(input: StreamPages_type): Opus_type {
		const
			packet_parser = new PacketBinary(),
			{ val: packet1, len: len1 } = packet_parser.forward({ stream: input, pos: 0 }),
			{ val: packet2, len: len2 } = packet_parser.forward({ stream: input, pos: len1 })
		return {
			head: (new OpusHead()).forward({ bin: packet1, pos: 0, args: {} }).val,
			tags: (new OpusTags()).forward({ bin: packet2, pos: 0, args: {} }).val,
			audio: input.slice(len1 + len2),
		}
	}
	backward(input: Opus_type): StreamPages_type {
		throw new Error("Method not implemented.")
	}
}

class OpusHead extends BinaryRecordStep<OpusHead_packet> {
	constructor() {
		super([
			["kind", new BinaryDefaultArgs(new BinaryStringStep(), { length: 8 }, 1) as any],
			["version", new BinaryNumberStep("u1") as any],
			["channels", new BinaryNumberStep("u1")],
			["pre_skip", new BinaryNumberStep("u2l")],
			["sample_rate", new BinaryNumberStep("u4l") as any],
			["output_gain", new BinaryNumberStep("i2l")],
			["channel_table", new OpusChannelTable()],
		])
	}
	forward(input: BinaryInput): BinaryOutput<OpusHead_packet> {
		const
			{ bin, pos } = input,
			{ val: val_a, len: len_a } = super.partial_forward(bin, pos, {}, 0, 6) as BinaryOutput<Omit<OpusHead_packet, "channel_table">>,
			{ val: val_b, len: len_b } = super.partial_forward(bin, pos + len_a, { channel_table: { mapping: { length: val_a.channels } } }, 6) as BinaryOutput<Pick<OpusHead_packet, "channel_table">>
		return {
			val: { ...val_a, ...val_b },
			len: len_a + len_b
		}
	}
	backward(input: BinaryOutput<OpusHead_packet>): BinaryInput {
		input.val.channels = (input.val.channel_table.mapping?.length ?? 0)
		return super.backward(input)
	}
}

class OpusChannelTable extends BinaryRecordStep<OpusChannelTable_type, { mapping: LengthedArgs }> {
	constructor() {
		super([
			["family", new BinaryNumberStep("u1") as any],
			["stream_count", new BinaryNumberStep("u1")],
			["coupled_count", new BinaryNumberStep("u1")],
			["mapping", new BinaryNumberArrayStep("u1")],
		])
	}
}

class OpusTags extends BinaryRecordStep<OpusTags_packet> {
	constructor() {
		super([
			["kind", new BinaryDefaultArgs(new BinaryStringStep(), { length: 8 }, 1) as any],
			["comment", new VorbisComment()],
		])
	}
}

class VorbisComment extends BinaryRecordStep<VorbisComment_type> {
	constructor() {
		super([
			["vendor_name", new BinaryHeaderLengthedStep(new BinaryNumberStep("u4l"), new BinaryStringStep())],
			["entries", new BinaryHeaderLengthedStep(
				new BinaryNumberStep("u4l"),
				new BinaryArrayStep(
					new BinaryHeaderLengthedStep(
						new BinaryNumberStep("u4l"),
						new BinaryStringStep()
					)
				)
			)]
		])
	}
}

/** see the following resource for specifications:
 * [wiki.xiph.org](https://wiki.xiph.org/OggOpus#ID_Header)
 * [opus-codec.org](https://opus-codec.org/docs/opusfile_api-0.7/structOpusTags.html)
*/
type VorbisComment_type = {
	/** `type: "u4l"` <br> indicates the bytelength of the `vendor_name` string. */
	// vendor_name_length: number
	vendor_name: string
	/** `type: "u4l"` <br> indicates the number of `entries` in the comment. */
	// entries_length: number
	entries: VorbisCommentEntry_type[]

}

/** `type: "u4l"` <br> indicates the string length the comment entry.
 * length: number
 * content: string
*/
type VorbisCommentEntry_type = string


type VorbisCommentEntry_object_type = {

}

/** this here is the format of the decoded picture stream.
 * the specification of the decoded stream lies here: [xiph.org](https://xiph.org/flac/format.html#metadata_block_picture).
 * this format is encoded via base64 encoding, and then the resulting string is embedded into the ogg file as a comment proceeding "metadata_block_picture".
 * note that in the embdded format, the stream of the base64 string may get broken in between due to {@link OggPage_type}.
 * the bytes occupied by these annoying in-between headers do not count towards the bytelength specified before the "metadata_block_picture" ({@link VorbisCommentEntry_type})
*/
interface VorbisCommentEntry_Picture_type extends VorbisCommentEntry_object_type {
	/** `type: "u4b"` <br> the type of picture. must be in `range(0,21)`. */
	cover_type: number
	/** `type: "u4b"` <br> bytelength of `mime` string. */
	// mime_length: number
	/** `type: "str"` <br> dictates the mime string of the encoded picture data. */
	mime: string
	/** `type: "u4b"` <br> bytelength of `description` string. */
	// description_length: number
	/** `type: "str"` <br> description of this picture. */
	description: string
	/** `type: "u4b"` <br> width of picture. */
	width: number
	/** `type: "u4b"` <br> height of picture. */
	height: number
	/** `type: "u4b"` <br> color depth of picture in "bits per pixel" units. so it's "24" for RGB and "32" for RGBA images. */
	depth: number
	/** `type: "u4b"` <br> number of colors used for indexed images (such as ".gif"). if the image is not color indexed (which is likely), then it should be `0`. */
	colors: number
	/** `type: "u4b"` <br> bytelength of `data`. */
	// data_length: number
	/** `type: "u1[]"` <br> binary data of the image. */
	data: Uint8Array
}
