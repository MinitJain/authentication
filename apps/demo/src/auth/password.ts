import { hash, verify, Algorithm } from "@node-rs/argon2";

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, { algorithm: Algorithm.Argon2id });
}

export async function verifyPassword(
  plain: string,
  hashed: string,
): Promise<boolean> {
  return verify(hashed, plain);
}
