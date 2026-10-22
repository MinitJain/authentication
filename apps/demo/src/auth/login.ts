import { pool } from "../db.js";
import { hashPassword, verifyPassword } from "./password.js";
import { createSession } from "./sessions.js";

const dummyHash = hashPassword("dummy-password-for-timing");

export class InvalidCredentialsError extends Error {
  constructor() {
    super(`Invalid email or password`);
    this.name = "InvalidCredentialsError";
  }
}

export async function loginUser(email: string, password: string) {
  // Normalize the email (trim + lowercase)
  const normalizedEmail = email.trim().toLowerCase();

  // Query the database for the user
  const result = await pool.query(
    "SELECT id, email, password_hash FROM users WHERE lower(email) = $1",
    [normalizedEmail],
  );

  if (result.rowCount === 0) {
    await verifyPassword(password, await dummyHash);
    throw new InvalidCredentialsError();
  }

  const valid = await verifyPassword(password, result.rows[0].password_hash);
  if (!valid) throw new InvalidCredentialsError();

  const user = {
    id: result.rows[0].id,
    email: result.rows[0].email,
  };

  const session = await createSession(user.id);

  return { user, session };
}
