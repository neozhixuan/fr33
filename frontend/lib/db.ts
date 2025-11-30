import postgres from "postgres";

type PostgreSql = ReturnType<typeof postgres>; // TODO: move to types.ts

// TODO: set ssl in production
const CONNECTION_STRING = process.env.POSTGRES_URL!;
const CONNECTION_OPTIONS = undefined; // Asserts read-only property, and enforces that ssl must be "require"

// Cache the client across hot reloads in dev (singleton)
declare global {
  var __sql: PostgreSql | undefined;
}

const initialiseDB = (): PostgreSql => {
  if (global.__sql) {
    return global.__sql;
  }

  try {
    const sql = postgres(CONNECTION_STRING, CONNECTION_OPTIONS);
    return sql;
  } catch (error) {
    console.error("[initialiseDB] Failed to initialise DB, check env", error);
    throw new Error("[initialiseDB] Failed to initialise DB, check env");
  }
};

const sql = initialiseDB();

if (process.env.NODE_ENV !== "production") {
  global.__sql = sql;
}

export default sql;
