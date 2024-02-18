export * from "kitchensink_ts/builtin_aliases_deps"
export * from "kitchensink_ts/eightpack"
export { concatBytes, concatTyped } from "kitchensink_ts/typedbuffer"
export type * from "kitchensink_ts/typedefs"


export const enum DEBUG {
	LOG = 0,
	ASSERT = 0,
	PRODUCTION = 1,
	MINIFY = 1,
}

// TODO: add these to `kitchensink_ts/builtin_aliases_deps.ts` . I am tired of redefining it in half of my repos
export const {
	isFinite: number_isFinite,
	parseInt: number_parseInt,
} = Number

export const {
	ceil: math_ceil,
} = Math

// TODO: document each and every binary step out there
// DONE: implement "bytes" primitive binary step (i.e `BinaryPureStep<Uint8Array, LengthedArgs>`)
// TODO: start thinking about conditional binary steps, such as the ENUM-bytes conditional one
// TODO: consider renaming `BinaryRecordStep` to `BinaryInterfaceStep` or `BinarySchemaStep`, as the word "Record" would imply something like a dictionary, where both the keys and values are encoded in binary.
// NOTPLANNED, turned out to be a bad idea. code inference with schema as first argument is far better than what was suggested here:
//       consider changing `BinaryRecordStep`'s generic signature from `<RECORD_SCHEMA, ARGS, ENTRY_TYPE>` to `<ENTRIES, ARGS, RECORD_SCHEMA>`, where `RECORD_SCHEMA` would be generated through type manipulation of `ENTRIES`, and so will `ARGS`.
//       but if someone would like to go with a certain schema, irrespective of the entries and args types, they'd declare `<any, any, MYSCHEMA>`
// DONE: consider removing `BinaryRecordStep`'s `args.entry_args`, so that it is at the top level. this will actually make your design more compatible/consistent with `BinaryArrayStep` and `BinaryHeaderLengthedStep`,
//       as they too use a single nestedness for their composition components, rather than a nestedness of two, the way it currently is with `BinaryRecordStep`'s args interface.
// TODO: remove Higher-Order-Type (`HOTKind*`) in `typedefs.ts`, as there's literally just a single mapping that we utilize in the codebase.
// TODO: add string-to-number codec, json codec, and a string-to-keyvalue pair (separated by custom delimiter)
// TODO: re-export `kitchensink_ts/eightpack.ts` in `mod.ts`, as library users will probably benift from those utility encoder and decoder functions.
//       although, I wouldn't want anyone confusing it with this library's core functionality (which is the `Step` interface)
