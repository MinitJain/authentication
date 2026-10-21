import pg from "pg";

import { env } from "./config.js";
const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

// An idle client can lose its connection (e.g. Postgres restarts).
// Without this listener, Node treats the unhandled 'error' event as fatal.
pool.on("error", (err) => {
  console.error("Idle database client error:", err.message);
});
