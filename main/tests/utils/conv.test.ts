import test from "node:test";
import assert from "node:assert/strict";

import { convertBirthdateToAgeOver, stringToInt } from "../../utils/conv";

test("stringToInt parses base-10 numbers", () => {
  assert.equal(stringToInt("42"), 42);
  assert.equal(stringToInt("08"), 8);
});

test("convertBirthdateToAgeOver returns true when minimum age is met", () => {
  const now = new Date();
  const birth = new Date(
    now.getFullYear() - 20,
    now.getMonth(),
    now.getDate(),
  ).toISOString();

  assert.equal(convertBirthdateToAgeOver(birth, 18), true);
});

test("convertBirthdateToAgeOver returns false when minimum age is not met", () => {
  const now = new Date();
  const birth = new Date(
    now.getFullYear() - 17,
    now.getMonth(),
    now.getDate(),
  ).toISOString();

  assert.equal(convertBirthdateToAgeOver(birth, 18), false);
});
