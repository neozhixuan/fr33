function subtractHours(from: Date, hours: number): Date {
  return new Date(from.getTime() - hours * 60 * 60 * 1000);
}

function subtractMinutes(from: Date, minutes: number): Date {
  return new Date(from.getTime() - minutes * 60 * 1000);
}

function sumBigInt(values: bigint[]): bigint {
  return values.reduce((acc, current) => acc + current, 0n);
}

function toBigInt(value: string | null | undefined): bigint {
  if (!value) return 0n;
  return BigInt(value);
}

export { subtractHours, subtractMinutes, sumBigInt, toBigInt };
