import express from "express";
import { env } from "./config.js";
import { pool } from "./db.js";
import { authRouter } from "./routes/auth.js";

const app = express();

app.use(express.json());

app.use("/auth", authRouter);

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", db: "up" });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({ status: "error", db: "down" });
  }
});

// Error handler: must be registered after all routes. Express identifies it by its 4 arguments.
// Replaces Express's default error page, which exposes stack traces.
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (err.type === "entity.parse.failed") {
      return res.status(400).json({ error: "Invalid JSON" });
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  },
);

app.listen(env.PORT, () => {
  console.log(`Server is running on http://localhost:${env.PORT}`);
});
