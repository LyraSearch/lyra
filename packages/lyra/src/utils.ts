const baseId = Date.now().toString().slice(5);
let lastId = 0;

export const isServer = typeof window === "undefined";

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) {
    return "0 Bytes";
  }
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatNanoseconds(unit: bigint): string {
  const nano = 1_000_000n;
  const micro = 1000n;

  if (unit < nano) {
    return `${unit / micro}μs`;
  }

  return `${unit / nano}ms`;
}

export function getNanosecondsTime(): bigint {
  if (isServer) {
    return process.hrtime.bigint();
  }

  return BigInt(Math.floor(performance.now()) * 1000);
}

export function uniqueId(): string {
  return `${baseId}-${lastId++}`;
}
