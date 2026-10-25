import request from "supertest";
import { afterAll, expect, test } from "vitest";
import { app } from "../app.js";
import { pool } from "../db.js";

// Separate file: Vitest gives each file a fresh module, so the limiter's counter starts at zero here.
afterAll(async () => {
  await pool.end();
});

test("blocks login after 10 failed attempts", async () => {
  const attempt = () =>
    request(app)
      .post("/auth/login")
      .send({ email: "nobody@example.com", password: "wrong-password" });

  for (let i = 0; i < 10; i++) {
    await attempt().expect(401);
  }
  const blocked = await attempt().expect(429);
  expect(blocked.body.error).toMatch(/too many/i);
});
