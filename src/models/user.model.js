import mongoose from "mongoose";

const userScheama = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: [true, "Email already exists"],
  },
  password: {
    type: String,
    required: true,
  },
});

const User = mongoose.model("User", userScheama);
export default User;
