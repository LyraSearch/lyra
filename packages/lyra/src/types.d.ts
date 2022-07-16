import type { PropertiesSchema } from "./lyra";
export type Nullable<T> = T | null;

type ResolveTypes<TType> = TType extends "string"
	? string
	: TType extends "boolean"
	? boolean
	: TType extends "number"
	? number
	: TType extends PropertiesSchema
	? { [P in keyof TType]: ResolveTypes<TType[P]> }
	: never;

export type ResolveSchema<T extends PropertiesSchema> = {
	[P in keyof T]: ResolveTypes<T[P]>;
};
