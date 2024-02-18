# FBIcodec

FBIcodec is so cleanly invertible, it's the last thing the FBI would investigate!

This is a typescript library for building bidirectional (encoding and decoding) codecs using composable steps.
The "FBI" part in the name stands for "Forward-Backward-Interfaced", and Codec stands for an invertible data transformation.

The main building block of the library is its general purpose `Step` interface, which ensures the ability for a forward transformation to be reversed.
The forward and backward methods take a single argument, allowing Steps to be composed into more complex Codecs.


### Features

- Composable steps for encoding and decoding binary data
- Steps for primitive types like numbers, strings, bytes
- Steps for composing records, arrays, sequences
- Invertible - encoding and decoding are symmetric
- Type safe


### Overview

The main abstractions are:
- `Step` - encodes `forward` and decodes `backward` between a source and target type.
- `Binarystep` - a `Step` for encoding/decoding binary data.

To work with binary data of primitive types, such as: numbers, strings, bytes etc..., you can use the the `BinaryPureStep`s inside the file [`binary_primitive_steps.ts`](/src/binary_primitive_steps.ts).
- `BinaryNumberStep` - supports signed/unsigned integers of 8, 16, 32 and 64 bits, and floats of 32 and 64 bits, in both little-endian and big-endian formats.
- `BinaryStringStep` - for strings with varying lengths (based on the `args.length` parameter).
- `BinaryCStringStep` - for NUL (`"\x00"`) terminated strings.
- `BinaryBytesStep` - for sequence of bytes (based on the `args.length` parameter).
- `BinaryNumberArrayStep` - for numeric array of numbers (based on the `args.length` parameter).

To work with binary data of composite types, such as: records, arrays, sequences etc..., you can use the the `BinaryPureStep`s inside the file [`binary_composition_steps`](/src/binary_composition_steps.ts).
- `BinaryRecordStep` - encodes a record with named fields, when provided with a sequence of `Steps` for each field.
- `BinaryArrayStep` - encodes an array of items, when provided with a single `Step` for the item type.
- `SequentialSteps` - chains multiple `Step`s.


For example, here is a step that decode and then repack PNG image file's metadata blocks:
```ts
class PNG_Codec_Step extends PureStep<Uint8Array, GeneralChunk_schema[]> {
	forward(input: Uint8Array): GeneralChunk_schema[] {
		// parse input into chunks
	}
	backward(input: GeneralChunk_schema[]): Uint8Array {
		// encode chunks into binary
	}
}
```


## Theory

The key components that enable building robust bidirectional transformations are:

- `Step<FROM, TO, LOST>`
  - Defines symmetric forward and backward methods between source `FROM` and target `TO` types.
  Any lost information should be stored in the `LOST` private property.

- `PureStep<FROM, TO> extends Step<FROM, TO, never>`
  - This is a `Step` that is guaranteed to not lose information during forward transformation, allowing backward transformation to fully reconstruct the original value.
It also means that one may reuse a single instance of this kind of step for multiple forward and backward transformations, in whatever order it is deemed convenient.
Hence, these kind of steps are suitable for being applied repeatdly by larger compositional steps.

- `BinaryStep<OUT, ARGS, LOST> extends Step<{ bin: Uint8Array, pos: number, args: ARGS }, { val: OUT, len: number }, LOST>`
  - A step that specialized for parsing binary data.
backward encodes the wrapped `OUT` value back into a wrapped `Uint8Array` object.

- `BinaryPureStep<OUT, ARGS> extends PureStep<{ bin: Uint8Array, pos: number, args: ARGS }>`
  - Similar to `BinaryStep`, but is guaranteed not to lose data during forward transformation.
This is the class that is basically used by all implementations of `BinaryStep`s.


These simple interfaces allow `Step`s to be composed in a type-safe way.

Moreover, the compositions form a tree structure that preserves invertibility - as long as each `Step` inside implements their `forward` and `backward` methods correctly, the entire composition will be robustly reversible.

It also makes diagnosing issues easier - if there is a decoding error, it must be within one of the composed Steps.
The composition tree narrows down where the issue lies.
