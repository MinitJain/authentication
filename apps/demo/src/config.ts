import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const invalidFields = result.error.issues.map((issue) =>
    issue.path.join("."),
  );
  console.error(`Invalid env vars: ${invalidFields.join(", ")}`);
  process.exit(1);
}

export const env = result.data;
