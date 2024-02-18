/**
 * This is a typescript library for building bidirectional (encoding and decoding) codecs using composable steps. <br>
 * The "FBI" part in the name stands for "Forward-Backward-Interfaced", and Codec stands for an invertible data transformation.
 *
 * The main building block of the library is its general purpose `Step` interface, which ensures the ability for a forward transformation to be reversed. <br>
 * The forward and backward methods take a single argument, allowing Steps to be composed into more complex Codecs.
 *
 * @module
*/
export * from "./binary_composition_steps.js";
export * from "./binary_conditional_steps.js";
export * from "./binary_primitive_steps.js";
export * from "./typedefs.js";
