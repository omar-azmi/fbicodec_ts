/** @module */
/////// Step classes definition
/** a single step consists a {@link forward | `forward`} transformation {@link FROM | from a type} to a {@link TO | different type},
 * and a {@link backward | `backward`} transformation that does the reverse. <br>
 * if information is lost during the forward transformation, it should be stored in the {@link lost | `lost`} member,
 * and then rejoined when the backward transformation is carried out. this will ensure full invertibility of the data. <br>
 * if no information is lost during the forward transformation, it would be a good idea to use the {@link PureStep | `PureStep`} subclass instead.
*/
export class Step {
}
/** a pure step never loses any invertibility information. this formally provides us with two great benefits:
 * - we may utilize the {@link backward | `backward`} method before ever using the {@link forward | `forward`} method prior.
 * - we may reuse the same instance of a pure step for many forward and backward transformations, however many times we want, in any order we want.
*/
export class PureStep extends Step {
    lost;
}
/** a binary step is a class capable of encoding and decoding binary data. <br>
 * - the {@link forward | `forward`} method behaves like a decoder
 * - the {@link backward | `backward`} method behaves like an encoder
 *
 * if a certain kind of `BinaryStep` does not lose data when decoding, it is considered to be _pure_.
 * if that is the case, you should instead use the {@link BinaryPureStep | `BinaryPureStep`}, which offers much more benefits.
 *
 * @typeParam OUT the value type of the decoded object
 * @typeParam ARGS the input argument interface needed for decoding in the {@link forward | `forward`} method (could be empty)
 * @typeParam LOST the interface of any potential lost data. if it exists, it should be used inside of the {@link backward | `backward`} method when reconstructing the binary data
*/
export class BinaryStep extends Step {
}
/** a pure binary step is a class capable of encoding and decoding binary data without the lose of invertibility information during either transformations. <br>
 * - the {@link forward | `forward`} method behaves like a decoder
 * - the {@link backward | `backward`} method behaves like an encoder
 *
 * @typeParam OUT the value type of the decoded object
 * @typeParam ARGS the input argument interface needed for decoding in the {@link forward | `forward`} method (could be empty)
*/
export class BinaryPureStep extends PureStep {
}
/*

export type Entries_Mapped<ENTRIES extends Array<[string, any]>, HOTAlias extends keyof HOTKindMap<any> = "none"> = {
    [K in keyof ENTRIES as number]: [K, ApplyHOT<HOTAlias, ENTRIES[K][1]>]
}[number]


// Define the ObjectToMappedEntries type
type ObjectToMappedEntries<OBJ, HOTAlias extends keyof HOTKindMap<any> = "none"> = {
    [K in keyof OBJ as number]: [K, ApplyHOT<HOTAlias, OBJ[K]>]
}[number]
*/
