import {
  getTimeoutReleasePollMs,
  isTimeoutWorkerEnabled,
} from "@/utils/disputeUtils";
import { triggerTimeoutAutoReleaseSweepAction } from "@/lib/disputeActions";

// Typescript syntax to add types to the global scope
declare global {
  var __timeoutReleaseWorkerStarted: boolean | undefined;
  var __timeoutReleaseWorkerRunning: boolean | undefined;
}

// Worker function that periodically triggers the timeout auto-release sweep action
// to check for any jobs that have reached their timeout and automatically release funds if necessary.
export function startTimeoutReleaseWorker() {
  if (!isTimeoutWorkerEnabled()) {
    return;
  }

  // Singleton Pattern - Ensure we only start one instance of the worker, even if this module is imported multiple times
  if (global.__timeoutReleaseWorkerStarted) {
    return;
  }
  const pollMs = getTimeoutReleasePollMs();
  global.__timeoutReleaseWorkerStarted = true;

  // Function to run the sweep, with a guard to prevent overlapping runs if the previous one is still in progress
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
