import test from "node:test";
import assert from "node:assert/strict";

import {
  getFundReleaseTimeoutSeconds,
  getSessionUserId,
  getTimeoutReleasePollMs,
} from "../../utils/disputeUtils";

function withEnv<T>(key: string, value: string | undefined, fn: () => T): T {
  const previous = process.env[key];
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }

  try {
    return fn();
  } finally {
    if (previous === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = previous;
    }
  }
}

test("getFundReleaseTimeoutSeconds uses default value", () => {
  const timeout = withEnv("NEXT_FUND_RELEASE_TIMEOUT_SECONDS", undefined, () =>
    getFundReleaseTimeoutSeconds(),
  );

  assert.equal(timeout, 172800);
});

test("getFundReleaseTimeoutSeconds rejects invalid values", () => {
  assert.throws(
    () =>
      withEnv("NEXT_FUND_RELEASE_TIMEOUT_SECONDS", "0", () =>
        getFundReleaseTimeoutSeconds(),
      ),
    /Invalid NEXT_FUND_RELEASE_TIMEOUT_SECONDS value/,
  );
});

test("getTimeoutReleasePollMs enforces minimum interval", () => {
  assert.throws(
    () =>
      withEnv("NEXT_TIMEOUT_RELEASE_POLL_MS", "4000", () =>
        getTimeoutReleasePollMs(),
      ),
    /Invalid NEXT_TIMEOUT_RELEASE_POLL_MS value/,
  );
});

test("getSessionUserId returns a valid integer id", () => {
  const userId = getSessionUserId({ user: { id: "7" } });
  assert.equal(userId, 7);
});

test("getSessionUserId throws for missing or invalid user", () => {
  assert.throws(() => getSessionUserId(null), /Unauthorized/);
  assert.throws(
    () => getSessionUserId({ user: { id: "abc" } }),
    /Unauthorized/,
  );
});
