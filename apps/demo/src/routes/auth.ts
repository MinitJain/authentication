import express from "express";
import { z } from "zod";
import { registerUser, EmailTakenError } from "../auth/register.js";

export const authRouter = express.Router();

const UserSchema = z.object({
  email: z
    .email({ message: "Invalid email address" })
    .max(254, { message: "Email must be at most 254 characters" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(128, { message: "Password must be at most 128 characters" }),
});

authRouter.post("/register", async (req, res) => {
  try {
    const parsed = UserSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid input",

        fields: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const { email, password } = parsed.data;

    const user = await registerUser(email, password);

    res.status(201).json(user);
  } catch (error: any) {
    if (error instanceof EmailTakenError) {
      return res.status(409).json({ error: error.message });
    }
    console.error("Unexpected error during registration:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
