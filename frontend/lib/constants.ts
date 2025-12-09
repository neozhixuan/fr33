// TODO: set ssl in production
export const DB_CONNECTION_STRING = process.env.POSTGRES_URL!;
export const DB_CONNECTION_OPTIONS = undefined; // Asserts read-only property, and enforces that ssl must be "require"
