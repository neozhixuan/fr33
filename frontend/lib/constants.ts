export const UNAUTHORISED_REDIRECT_URL =
  "/login?error=unauthorised&from=/job-portal";

// TODO: set ssl in production
export const DB_CONNECTION_STRING = process.env.POSTGRES_URL!;
export const DB_CONNECTION_OPTIONS = undefined; // Asserts read-only property, and enforces that ssl must be "require"
