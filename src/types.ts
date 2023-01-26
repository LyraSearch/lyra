import { Language, TokenizerConfig } from "./tokenizer/index.js";
import type { Hooks } from "./methods/hooks.js";
import type { Node } from "./radix-tree/node.js";

export type TokenScore = [string, number];
export type Nullable<T> = T | null;

export type IIntersectTokenScores = (arrays: TokenScore[][]) => TokenScore[];

export type ResolveSchema<T extends PropertiesSchema> = {
  [P in keyof T]: ResolveTypes<T[P]>;
};

export type SearchProperties<
  TSchema extends PropertiesSchema,
  TKey extends keyof TSchema = keyof TSchema,
> = TKey extends string
  ? TSchema[TKey] extends PropertiesSchema
    ? `${TKey}.${SearchProperties<TSchema[TKey]>}`
    : TKey
  : never;

export type FacetSorting = "asc" | "desc" | "ASC" | "DESC";

type FacetTypeInterfaces = {
  string: {
    limit?: number;
    offset?: number;
    sort?: FacetSorting;
  };
  number: {
    ranges: {from: number, to: number}[]
    sort?: FacetSorting;
  };
  boolean: {
    true?: boolean;
    false?: boolean;
  };
}

export type NestedValue<
  S extends PropertiesSchema,
  T extends SearchProperties<S> = SearchProperties<S>,
> = T extends keyof S
  ? S[T] extends PropertyType
    ? S[T]
    : never
  : T extends `${infer K}.${string}`
  ? K extends keyof S
    ? S[K] extends PropertiesSchema
      ? NestedValue<S[K]>
      : never
    : never
  : never;

export type FacetsSearch<S extends PropertiesSchema> = {
  [P in FacetsConfig<S>[number]]?: FacetTypeInterfaces[NestedValue<S>];
};

export type FacetsConfig<S extends PropertiesSchema> = SearchProperties<S>[];

export type PropertyType = "string" | "number" | "boolean";

export type PropertiesSchema = {
  [key: string]: PropertyType | PropertiesSchema;
};

export type AlgorithmsConfig = {
  intersectTokenScores: IIntersectTokenScores;
};

export type PropertiesBoost<S extends PropertiesSchema> = {
  [P in keyof S]?: number;
};

export type Configuration<S extends PropertiesSchema> = {
  /**
   * The structure of the document to be inserted into the database.
   */
  schema: S;
  /**
   * The default language analyzer to use.
   */
  defaultLanguage?: Language;
  edge?: boolean;
  hooks?: Hooks;
  components?: Components;
  facets?: FacetsConfig<S>;
};

export type Data<S extends PropertiesSchema> = {
  docs: Record<string, ResolveSchema<S> | undefined>;
  defaultLanguage: Language;
  index: Index;
  schema: S;
  frequencies: FrequencyMap;
  tokenOccurrencies: TokenOccurrency;
  avgFieldLength: Record<string, number>;
  fieldLengths: Record<string, Record<string, number>>;
};

export type Components = {
  tokenizer?: TokenizerConfig;
  algorithms?: AlgorithmsConfig;
};

export interface Lyra<S extends PropertiesSchema> extends Data<S> {
  defaultLanguage: Language;
  schema: S;
  edge: boolean;
  hooks: Hooks;
  facets: FacetsConfig<S>;
  components?: Components;
  frequencies: FrequencyMap;
  docsCount: number;
  avgFieldLength: Record<string, number>;
  fieldLengths: Record<string, Record<string, number>>;
}

export type BM25OptionalParams = {
  k?: number;
  b?: number;
  d?: number;
};

export type BM25Params = {
  k: number;
  b: number;
  d: number;
};

type ResolveTypes<TType> = TType extends "string"
  ? string
  : TType extends "boolean"
  ? boolean
  : TType extends "number"
  ? number
  : TType extends PropertiesSchema
  ? { [P in keyof TType]: ResolveTypes<TType[P]> }
  : never;

type Index = Record<string, Node>;

export type TokenMap = Record<string, TokenScore[]>;

type FrequencyMap = {
  [property: string]: {
    [documentID: string]: {
      [token: string]: number;
    };
  };
};

type TokenOccurrency = {
  [property: string]: {
    [token: string]: number;
  };
};
