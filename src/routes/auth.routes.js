import express from "express";
import userModal from "../models/user.model.js";
import jwt from "jsonwebtoken";
const authRouter = express.Router();

authRouter.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(409).json({ message: "All fields are required" });
  }

  const emailAlreadyExists = await userModal.findOne({ email });

  if (emailAlreadyExists) {
    return res.status(400).json({ message: "Email already exists" });
  }

  const user = await userModal.create({ name, email, password });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  res.cookie("jwt_token", token);

  res
    .status(201)
    .json({ message: "User registered successfully", user, token });
});

export default authRouter;
