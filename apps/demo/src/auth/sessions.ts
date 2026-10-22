import { randomBytes, createHash } from "node:crypto";
import { pool } from "../db.js";

export async function createSession(
  userId: string,
): Promise<{ token: string; expiresAt: Date }> {
  // Generate a random session token
  const sessionToken = randomBytes(32).toString("base64url");

  const tokenHash = createHash("sha256").update(sessionToken).digest("hex");

  const result = await pool.query(
    "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days') RETURNING expires_at",
    [userId, tokenHash],
  );

  return {
    token: sessionToken,
    expiresAt: result.rows[0].expires_at,
  };
}

export async function getSessionUser(
  token: string,
): Promise<{ id: string; email: string } | null> {
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const result = await pool.query(
    `SELECT u.id, u.email FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
    [tokenHash],
  );

  const row = result.rows[0];
  if (!row) return null;
  return { id: row.id, email: row.email };
}
