import { env } from "./config.js";
import { app } from "./app.js";

app.listen(env.PORT, () => {
  console.log(`Server is running on http://localhost:${env.PORT}`);
});
