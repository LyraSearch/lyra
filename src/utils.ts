const baseId = Date.now().toString().slice(5);
let lastId = 0;

const k = 1024;
const nano = BigInt(1e3);
const milli = BigInt(1e6);
const second = BigInt(1e9);

export const isServer = typeof window === "undefined";

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) {
    return "0 Bytes";
  }
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatNanoseconds(value: number | bigint): string {
  if (typeof value === "number") {
    value = BigInt(value);
  }

  if (value < nano) {
    return `${value}ns`;
  } else if (value < milli) {
    return `${value / nano}μs`;
  } else if (value < second) {
    return `${value / milli}ms`;
  }

  return `${value / second}s`;
}

export function getNanosecondsTime(): bigint {
  if (typeof process !== "undefined" && process.hrtime !== undefined) {
    return process.hrtime.bigint();
  }

  if (typeof performance !== "undefined") {
    return BigInt(Math.floor(performance.now() * 1e6));
  }

  // @todo: fallback to V8 native method to get microtime
  return BigInt(0);
}

export function uniqueId(): string {
  return `${baseId}-${lastId++}`;
}

export const reservedPropertyNames = ["id"];

export function getOwnProperty<T = unknown>(object: any, property: string): T | undefined {
  return Object.hasOwn(object, property) ? object[property] : undefined;
}

// Implemented following https://github.com/lovasoa/fast_array_intersect
// MIT Licensed (https://github.com/lovasoa/fast_array_intersect/blob/master/LICENSE)
// while on tag https://github.com/lovasoa/fast_array_intersect/tree/v1.1.0
export function intersectMany<T>(arrays: T[][]): T[] {
  if (arrays.length === 0) return [];

  for (let i = 1; i < arrays.length; i++) {
    if (arrays[i].length < arrays[0].length) {
      const tmp = arrays[0];
      arrays[0] = arrays[i];
      arrays[i] = tmp;
    }
  }

  const set = new Map();
  for (const elem of arrays[0]) {
    set.set(elem, 1);
  }

  for (let i = 1; i < arrays.length; i++) {
    let found = 0;
    for (const elem of arrays[i]) {
      const count = set.get(elem);
      if (count === 1) {
        set.set(elem, count + 1);
        found++;
      }
    }

    if (found === 0) {
      return [];
    }
  }

  return arrays[0].filter(elem => {
    const count = set.get(elem);
    if (count !== undefined) {
      set.set(elem, 0);
    }
    return count === arrays.length;
  });
}
