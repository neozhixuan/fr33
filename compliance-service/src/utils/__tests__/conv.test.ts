import { describe, expect, it } from "@jest/globals";

import { subtractHours, subtractMinutes, sumBigInt, toBigInt } from "../conv";

describe("conv utils", () => {
  it("subtractHours returns expected timestamp", () => {
    const base = new Date("2026-01-01T10:00:00.000Z");
    const result = subtractHours(base, 2);

    expect(result.toISOString()).toBe("2026-01-01T08:00:00.000Z");
  });

  it("subtractMinutes returns expected timestamp", () => {
    const base = new Date("2026-01-01T10:00:00.000Z");
    const result = subtractMinutes(base, 30);

    expect(result.toISOString()).toBe("2026-01-01T09:30:00.000Z");
  });

  it("sumBigInt and toBigInt handle missing and numeric values", () => {
    const values = [toBigInt("5"), toBigInt(null), toBigInt("7")];

    expect(sumBigInt(values)).toBe(12n);
  });
});
