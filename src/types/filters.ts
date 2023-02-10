import type { PropertiesSchema } from "src/types/index.js";

type ComparisonOperator = {
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
  eq?: number;
  between?: [number, number];
}

type PickOne<T> = { [P in keyof T]: Record<P, T[P]> & Partial<Record<Exclude<keyof T, P>, undefined>> }[keyof T]

export type WhereFilter<
  S extends PropertiesSchema,
  P extends string = "",
  K extends keyof S = keyof S> = K extends string
  ? S[K] extends PropertiesSchema
    ? WhereFilter<S[K], `${P}${K}.`>
    : S[K] extends "number"
      ? { [key in `${P}${K}`]?: PickOne<ComparisonOperator> }
      : never
  : never;