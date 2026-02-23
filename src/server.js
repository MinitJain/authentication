import app from "./app.js";
import connectToDatabase from "../config/database.js";

connectToDatabase();

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
