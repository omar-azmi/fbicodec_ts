import { sum } from "jsr:@oazmi/kitchensink@0.7.5/numericmethods"
import { BinaryArrayStep, BinaryHeaderLengthedStep, BinaryRecordStep } from "../src/binary_composition_steps.ts"
import { BinaryBytesStep, BinaryDefaultArgs, BinaryNumberArrayStep, BinaryNumberStep, BinaryStringStep } from "../src/binary_primitive_steps.ts"
import { BinaryInput, BinaryOutput, PureStep } from "../src/typedefs.ts"

/** see "header_type_flag" in following resource:
 * - [xiph.org](https://www.xiph.org/ogg/doc/framing.html#page_header)
 * there are three bitflags, lets say [z, y, x], presented as 0bzyx.
 * each bitflag carries the following meaning when either set (`true`) or unset (`false`):
 * - `x`: "continuation of stream"
 *    - `x == 1`: a continuation of the previous packet in the logical bitstream.
 *    - `x == 0`: a fresh packet.
 * - `y`: "beginning of stream" this flag must be set on the first page of every logical bitstream, and must not be set on any other page.
 *    - `y == 1`: this is the first page of a logical bitstream.
 *    - `y == 0`: not first page of logical bitstream.
 * - `z`: "end of stream". this flag must be set on the final page of every logical bitstream, and must not be set on any other page.
 *    - `z == 1`: this is the last page of logical bitstream.
 *    - `z == 0`: not last page of logical bitstream.
*/
export type HeaderTypeFlag_type =
	| 0b000 | 0b001 | 0b010 | 0b011
	| 0b100 | 0b101 | 0b110 | 0b111

/** see the following resource for specifications:
 * - [wiki.xiph.org](https://wiki.xiph.org/Ogg#Ogg_page_format)
 * - [xiph.org](https://www.xiph.org/ogg/doc/framing.html#page_header)
*/
export type OggPage_type = {
	/** `type: "str"` <br> the magic 4_bytes associated with the ".ogg" file format. always `"OggS"`. */
	magic: string | "OggS"
	/** `type: "u1"` <br> version of the ".ogg" specification. always `0`. */
	version: number | 0x00
	/** `type: "u1"` <br> dictates if the page is a continuation of a previous page. see {@link HeaderTypeFlag_type | `HeaderTypeFlag_type`} */
	flag: number | HeaderTypeFlag_type
	/** `type: "u8"` <br> codec specific instruction */
	granule_position: Uint8Array
	/** `type: "u4l"` <br> */
	serial_number: number
	/** `type: "u4l"` <br> this is a monotonically increasing field within each logical bitstream. the first page is 0, the second 1, etc... */
	page_number: number
	/** `type: "u4l"` <br> checksum of the data in the entire page. read specifics on wikipedia "https://en.wikipedia.org/wiki/Ogg#Metadata:~:text=has%20been%20lost.-,Checksum,-%E2%80%93%2032%20bits" */
	checksum: number
	/** `type: "u1"` <br> indicates the number of segments that exist in this page. it also specifies the size of the `segment_table` u1_array that follows. I think this value should always at least be `1` */
	// segment_table_length: number
	/** `type: "u1[]"` <br> an array of 8-bit values, each indicating the bytelength of the corresponding segments within the current page body.
	 * the values within this array determine the total bytelength of the data segments proceeding.
	 * if a certain segment is said to be of bytelength in `range(0, 255)`, then that packet will end after that many bytes, and the next packet will then begin after it.
	 * if a certain segment is said to be of bytelength `255`, then the segment following it should be a part of the current packet.
	 * if the last segment (last item in the array) has a bytelength of `255`, then it indicates that the last packet continues over to the next page, and so the next page's {@link OggPage_type.flag} will be `0b001` to indicate continuation.
	 * 
	 * - example 1: if `segment_table = [255, 255, 255, 70]`:
	 *    - then it would mean that there is one packet in this page.
	 *    - the total bytes carried in this page is: `255 + 255 + 255 + 70 = 835`, and also equals the packet's bytelength.
	 *    - after `835` bytes, you will encounter the next new fresh page ({@link OggPage_type}), starting with its magic signature "OggS".
	 * - example 2: if `segment_table = [255, 35, 255, 70]`:
	 *    - then it would mean that there are two packets in this page.
	 *      - the first carries `255 + 35 = 290` bytes, and is complete.
	 *      - the second carries `255 + 70 = 325` bytes, and is complete.
	 *    - the total bytes carried in this page is: `255 + 35 + 255 + 70 = 615`.
	 *    - after `615` bytes, you will encounter the next new fresh page ({@link OggPage_type}), starting with its magic signature "OggS".
	 * - example 3: if `segment_table = [255, 35, 255, 255]`:
	 *    - then it would mean that there are two packets in this page.
	 *      - the first carries `255 + 35 = 290` bytes, and is complete.
	 *      - the second carries `255 + 255 = 510` bytes, but is incomplete and will be carried over to the next page.
	 *    - the total bytes carried in this page is: `255 + 35 + 255 + 255 = 800`.
	 *    - after `800` bytes, you will encounter the next continuation page ({@link OggPage_type}). this time, the next page's {@link OggPage_type.flag} will be `0b001` to indicate continuation.
	 * 
	 * see the following for reference: [wikipedia.org](https://en.wikipedia.org/wiki/Ogg#Page_structure:~:text=any%20one%20page.-,Segment,-table)
	*/
	segment_table: number[]
	/** size of the content is known after parsing and summing up {@link OggPage_type.segment_table | this page's segment_table} */
	content: Uint8Array
}

/** parses/unparses a single page inside of an ogg file */
export class OggPage extends BinaryRecordStep<OggPage_type> {
	constructor() {
		super([
			["magic", new BinaryDefaultArgs(new BinaryStringStep(), { length: 4 })],
			["version", new BinaryNumberStep("u1")],
			["flag", new BinaryNumberStep("u1")],
			["granule_position", new BinaryDefaultArgs(new BinaryBytesStep(), { length: 8 })],
			["serial_number", new BinaryNumberStep("u4l")],
			["page_number", new BinaryNumberStep("u4l")],
			["checksum", new BinaryNumberStep("u4l")],
			["segment_table", new BinaryHeaderLengthedStep(
				new BinaryNumberStep("u1"),
				new BinaryNumberArrayStep("u1"),
			)],
			["content", new BinaryBytesStep()],
		])
	}
	forward(input: BinaryInput): BinaryOutput<OggPage_type> {
		const
			{ bin, pos } = input,
			{ val: val_a, len: len_a } = super.partial_forward(bin, pos, {}, 0, 8) as BinaryOutput<Omit<OggPage_type, "content">>,
			content_bytesize = sum(val_a.segment_table),
			{ val: val_b, len: len_b } = super.partial_forward(bin, pos + len_a, { content: { length: content_bytesize } }, 8) as BinaryOutput<Pick<OggPage_type, "content">>
		return {
			val: { ...val_a, ...val_b },
			len: len_a + len_b,
		}
	}
	// TODO: a good backward transformation should take care of ensuring the "magic", "version", and "checksum" are correct, else correct it itself and warn the user
}

/** an array of ogg pages */
export class AllOggPages extends BinaryDefaultArgs<BinaryArrayStep<OggPage>> {
	constructor() {
		super(new BinaryArrayStep<OggPage>(new OggPage()), { length: -1 })
	}
}

export type OggStreamPage_type = Omit<OggPage_type, "magic" | "version" | "flag" | "serial_number" | "checksum"> & { flag?: OggPage_type["flag"], fresh: boolean }

export type StreamPages_type = [
	first_page: OggStreamPage_type & { flag?: 0b100 | 0b110 },
	...(OggStreamPage_type & { flag?: 0b000 | 0b001 })[],
	last_page: OggStreamPage_type & { flag?: 0b010 | 0b110 | 0b011 | 0b111 },
]

/** mapping of each {@link OggPage_type.serial_number | `serial_number`s} with its unique {@link StreamPages_type | stream} */
type AllStream_type = Map<number, StreamPages_type>

/** extract all streams from {@link AllOggPages | all ogg pages} (which is an array of {@link OggPage_type | ogg page})
 * into a {@link AllStream_type | `Map`} with the stream's {@link OggPage_type.serial_number | `serial_number`s} as the keys
*/
export class AllStreamPages extends PureStep<BinaryOutput<OggPage_type[]>, AllStream_type> {
	forward(input: BinaryOutput<OggPage_type[]>): AllStream_type {
		const
			all_pages = input.val,
			all_streams: AllStream_type = new Map()
		let consecutive_page_number = 0
		for (const page of all_pages) {
			const
				{ content, flag, granule_position, page_number, segment_table, serial_number, } = page,
				is_fresh = (flag & 0b001) <= 0
			if (!all_streams.has(serial_number)) {
				all_streams.set(serial_number, [] as any)
			}
			all_streams.get(serial_number)!.push({ content, fresh: is_fresh, granule_position, page_number, segment_table })
			if (consecutive_page_number !== page_number) {
				console.warn("while parsing, `page_number` did not appear in correct order.", "\n\texpected", consecutive_page_number, "but got", page_number)
				consecutive_page_number = page_number
			}
			consecutive_page_number++
		}
		return all_streams
	}
	backward(input: AllStream_type): BinaryOutput<OggPage_type[]> {
		const all_pages: OggPage_type[] = []
		for (const [serial_number, stream_pages] of input) {
			const last_page_idx = stream_pages.length - 1
			all_pages.push(...stream_pages.map(
				(partial_page, page_idx): OggPage_type => {
					const flag =
						(page_idx === last_page_idx ? 0b100 : 0b000) |
						(page_idx === 0 ? 0b010 : 0b000) |
						(partial_page.fresh ? 0b000 : 0b001)
					// convert each partial page (which has its info stripped down only to the important bits), into full page (which is necessary for encoding)
					const page: OggPage_type & { fresh?: boolean } = {
						magic: "OggS",
						version: 0,
						checksum: 0,
						flag,
						serial_number,
						...partial_page,
					}
					delete page.fresh
					return page
				}
			))
		}
		// sort all pages by their `page_number`, which is necessary for ogg files with more than one stream that is also being intertwined with another stream simultaneously
		all_pages.sort((page_a, page_b) => {
			return page_a.page_number - page_b.page_number
		})
		// making sure that all `page_number`s are in increasing order, starting with `0`
		let consecutive_page_number = 0
		for (const { page_number } of all_pages) {
			if (consecutive_page_number !== page_number) {
				console.warn("while packing, `page_number` did not appear in correct order.", "\n\texpected", consecutive_page_number, "but got", page_number)
				consecutive_page_number = page_number
			}
			consecutive_page_number++
		}
		return { val: all_pages, len: 0 }
	}
}


/** general structure of an ogg data stream (which can be a file)
 * ogg_file = Array<ogg_stream> and is encoded in flat pages
 * ogg_stream = codec_packets and is encoded in flat pages such that `page[0].flag.bos === true && page[-1].flag.eos === true`
 * codec_packets = Vorbis | Opus | Flac | Speex | Theora | OggPCM
 * Vorbis = [VorbisIdentification_packet, VorbisComment, VorbisSetup, ...Audio_packet[]] // https://www.xiph.org/vorbis/doc/Vorbis_I_spec.html#x1-620004.2.1
 * Opus = [OpusHead_packet, OpusTags_packet?, ...Audio_packet[]] // https://datatracker.ietf.org/doc/html/rfc7845.html#section-5
 * Flac = [StreamInfo_packet, ...Metadata_packet[], ...Audio_packet[]] // https://www.xiph.org/flac/format.html#stream
 * Theora = [...Metadata_packet[], ...Audio_packet] // https://theora.org/doc/libtheora-1.0alpha6/theora_8h.html
 * Speex = [SpeexInfo_packet, VorbisComment, ...Audio_packet] // https://speex.org/docs/manual/speex-manual/node8.html
 * OggPCM = [OggPCMHeader_packet, VorbisComment, ...Audio_packet] // https://wiki.xiph.org/OggPCM
*/
