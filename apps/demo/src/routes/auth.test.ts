import { randomBytes, createHash } from "node:crypto";
import request from "supertest";
import { afterAll, describe, expect, test } from "vitest";
import { app } from "../app.js";
import { pool } from "../db.js";

// shortcut: runs against the dev database with unique emails, switch to a separate test database if leftover rows become a problem.
const uniqueEmail = () => `test-${randomBytes(6).toString("hex")}@example.com`;
const password = "correct-horse-battery";

async function registerAndLogin() {
  const email = uniqueEmail();
  await request(app).post("/auth/register").send({ email, password }).expect(201);
  const res = await request(app).post("/auth/login").send({ email, password }).expect(200);
  const cookie = res.headers["set-cookie"] as unknown as string[];
  return { email, cookie, res };
}

afterAll(async () => {
  await pool.query("DELETE FROM users WHERE email LIKE 'test-%@example.com'");
  await pool.end();
});

describe("POST /auth/register", () => {
  test("creates a user and never returns the password hash", async () => {
    const email = uniqueEmail();
    const res = await request(app).post("/auth/register").send({ email, password }).expect(201);
    expect(res.body.email).toBe(email);
    expect(res.body).not.toHaveProperty("password_hash");
  });

  test("rejects a duplicate email, ignoring case", async () => {
    const email = uniqueEmail();
    await request(app).post("/auth/register").send({ email, password }).expect(201);
    await request(app)
      .post("/auth/register")
      .send({ email: email.toUpperCase(), password })
      .expect(409);
  });

  test("rejects invalid input with field errors", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "not-an-email", password: "short" })
      .expect(400);
    const fields = res.body.fields.map((f: { field: string }) => f.field);
    expect(fields).toEqual(expect.arrayContaining(["email", "password"]));
  });

  test("rejects malformed JSON", async () => {
    await request(app)
      .post("/auth/register")
      .set("Content-Type", "application/json")
      .send("{bad json")
      .expect(400);
  });
});

describe("POST /auth/login", () => {
  test("sets an httpOnly session cookie", async () => {
    const { cookie } = await registerAndLogin();
    expect(cookie[0]).toMatch(/^session_id=/);
    expect(cookie[0]).toMatch(/HttpOnly/i);
  });

  test("wrong password and unknown email return the same 401", async () => {
    const { email } = await registerAndLogin();
    const wrong = await request(app)
      .post("/auth/login")
      .send({ email, password: "wrong-password" })
      .expect(401);
    const unknown = await request(app)
      .post("/auth/login")
      .send({ email: uniqueEmail(), password })
      .expect(401);
    expect(wrong.body).toEqual(unknown.body);
  });
});

describe("GET /auth/me", () => {
  test("returns the logged-in user", async () => {
    const { email, cookie } = await registerAndLogin();
    const res = await request(app).get("/auth/me").set("Cookie", cookie).expect(200);
    expect(res.body.user.email).toBe(email);
  });

  test("rejects a request with no cookie", async () => {
    await request(app).get("/auth/me").expect(401);
  });

  test("rejects a made-up session token", async () => {
    await request(app).get("/auth/me").set("Cookie", "session_id=forged").expect(401);
  });

  test("rejects an expired session", async () => {
    const { res } = await registerAndLogin();
    const token = randomBytes(32).toString("base64url");
    await pool.query(
      "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() - INTERVAL '1 minute')",
      [res.body.user.id, createHash("sha256").update(token).digest("hex")],
    );
    await request(app).get("/auth/me").set("Cookie", `session_id=${token}`).expect(401);
  });
});

describe("POST /auth/logout", () => {
  test("invalidates the session on the server, not just the cookie", async () => {
    const { cookie } = await registerAndLogin();
    await request(app).post("/auth/logout").set("Cookie", cookie).expect(204);
    // Replaying the old cookie must fail: the session row is gone.
    await request(app).get("/auth/me").set("Cookie", cookie).expect(401);
  });

  test("succeeds even without a session", async () => {
    await request(app).post("/auth/logout").expect(204);
  });
});
