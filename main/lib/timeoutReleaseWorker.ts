import {
  getTimeoutReleasePollMs,
  isTimeoutWorkerEnabled,
} from "@/utils/dispute";
import { triggerTimeoutAutoReleaseSweepAction } from "@/lib/disputeActions";

declare global {
  var __timeoutReleaseWorkerStarted: boolean | undefined;
  var __timeoutReleaseWorkerRunning: boolean | undefined;
}

export function startTimeoutReleaseWorker() {
  if (!isTimeoutWorkerEnabled()) {
    return;
  }

  if (global.__timeoutReleaseWorkerStarted) {
    return;
  }

  const pollMs = getTimeoutReleasePollMs();
  global.__timeoutReleaseWorkerStarted = true;

  const runSweep = async () => {
    if (global.__timeoutReleaseWorkerRunning) {
      return;
    }

    global.__timeoutReleaseWorkerRunning = true;

    try {
      const result = await triggerTimeoutAutoReleaseSweepAction();
      if (result.processed.length > 0) {
        console.log("[timeout-release-worker] sweep result:", result);
      }
    } catch (error) {
      console.error("[timeout-release-worker] sweep failed:", error);
    } finally {
      global.__timeoutReleaseWorkerRunning = false;
    }
  };

  // Run once on startup then schedule
  void runSweep();
  setInterval(() => {
    void runSweep();
  }, pollMs);

  console.log(
    `[timeout-release-worker] started with polling interval ${pollMs}ms`,
  );
}
