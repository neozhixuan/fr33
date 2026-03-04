import { initConfig } from "./config/config";

// Function that is run on server startup
export function register() {
  initConfig();
}
