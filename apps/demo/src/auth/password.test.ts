import { test, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

test("correct password verifies", async () => {
  const password = "my-secret-password";
  const hashed = await hashPassword(password);
  expect(await verifyPassword(password, hashed)).toBe(true);
});

test("wrong password is rejected", async () => {
  const password = "my-secret-password";
  const hashed = await hashPassword(password);
  expect(await verifyPassword("wrong-password", hashed)).toBe(false);
});

test("same password hashes differently each time", async () => {
  const password = "my-secret-password";
  const hashed1 = await hashPassword(password);
  const hashed2 = await hashPassword(password);
  expect(hashed1).not.toBe(hashed2);
});
