import express from "express";
import { env } from "./config.js";
import { pool } from "./db.js";

const app = express();

app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", db: "up" });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({ status: "error", db: "down" });
  }
});

app.listen(env.PORT, () => {
  console.log(`Server is running on http://localhost:${env.PORT}`);
});
