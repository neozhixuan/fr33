import postgres from "postgres";
import { DB_CONNECTION_STRING, DB_CONNECTION_OPTIONS } from "./constants";
type PostgreSql = ReturnType<typeof postgres>; // TODO: move to types.ts

// Cache the client across hot reloads in dev (singleton)
declare global {
  var __sql: PostgreSql | undefined;
}

const initialiseDB = (): PostgreSql => {
  if (global.__sql) {
    return global.__sql;
  }

  try {
    const sql = postgres(DB_CONNECTION_STRING, DB_CONNECTION_OPTIONS);
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
