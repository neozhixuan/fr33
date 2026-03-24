import { initConfig } from "./config/config";

// Function that is run on server startup
export async function register() {
  initConfig();

  // `register()` runs for both nodejs and edge runtimes.
  // Load worker only in node runtime to avoid bundling Node-only modules (e.g. `crypto`) into edge.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startTimeoutReleaseWorker } = await import(
      "./lib/timeoutReleaseWorker"
    );
    startTimeoutReleaseWorker();
  }
}
