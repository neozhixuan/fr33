import { initConfig } from "./config/config";
import { startTimeoutReleaseWorker } from "./lib/timeoutReleaseWorker";

// Function that is run on server startup
export function register() {
  initConfig();
  startTimeoutReleaseWorker();
}
