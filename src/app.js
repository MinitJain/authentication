import express from "express";
import authRouter from "./routes/auth.routes.js";
import CookieParser from "cookieparser";
const app = express();

app.use(express.json());
app.use(CookieParser);

// /api/auth/register
app.use("/api/auth", authRouter);

export default app;
