import { pool } from "../db.js";
import { hashPassword } from "./password.js";

export class EmailTakenError extends Error {
  constructor() {
    super(`Email already registered`);
    this.name = "EmailTakenError";
  }
}

export async function registerUser(email: string, password: string) {
  email = email.trim().toLowerCase();
  const hashedPassword = await hashPassword(password);

  try {
    const result = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at",
      [email, hashedPassword],
    );
    const { id, email: userEmail, created_at: createdAt } = result.rows[0];
    return { id, email: userEmail, createdAt };
  } catch (error: any) {
    if (error.code === "23505") {
      throw new EmailTakenError();
    }
    throw error;
  }
}
