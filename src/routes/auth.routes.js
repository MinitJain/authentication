import express from "express";
import userModal from "../models/user.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
const authRouter = express.Router();

// controllers for auth routes
// controllers are special type of callback functions or fat arrow functions which are used to handle the logic of the routes and they are called by the routes when the route is hit by the client

authRouter.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const emailAlreadyExists = await userModal.findOne({ email });

    if (emailAlreadyExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hash = crypto.createHash("md5").update(password).digest("hex");

    const user = await userModal.create({ name, email, password: hash });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.cookie("jwt_token", token);

    res
      .status(201)
      .json({ message: "User registered successfully", user, token });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

authRouter.post("/protected", async (req, res) => {
  console.log(req.cookies);

  res.status(200).json({ message: "Protected route accessed successfully" });
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const user = await userModal.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // const hash =

    const isPasswordValid =
      (user.password === hash) ===
      crypto.createHash("md5").update(password).digest("hex");

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.cookie("jwt_token", token);

    res
      .status(200)
      .json({ message: "User logged in successfully", user, token });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default authRouter;
