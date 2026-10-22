import express from "express";
import { z } from "zod";
import { registerUser, EmailTakenError } from "../auth/register.js";
import { loginUser, InvalidCredentialsError } from "../auth/login.js";
import { env } from "../config.js";
import { requireAuth } from "../middleware/requireAuth.js";

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

const LoginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
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

authRouter.post("/login", async (req, res) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);

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

    const { user, session } = await loginUser(email, password);

    res.cookie("session_id", session.token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      expires: session.expiresAt,
      path: "/",
    });

    res.status(200).json({ user });
  } catch (error: any) {
    if (error instanceof InvalidCredentialsError) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    console.error("Unexpected error during login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
