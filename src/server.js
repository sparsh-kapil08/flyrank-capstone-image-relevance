import dotenv from "dotenv";
dotenv.config();

import { app } from "./app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`AI Image Matching Engine server running on port ${PORT}`);
  console.log(`Admin UI accessible at http://localhost:${PORT}`);
});
