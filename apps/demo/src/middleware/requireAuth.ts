import { getSessionUser } from "../auth/sessions.js";
import type { Request, Response, NextFunction } from "express";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies.session_id;
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const user = await getSessionUser(token);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  req.user = user;
  next();
}
