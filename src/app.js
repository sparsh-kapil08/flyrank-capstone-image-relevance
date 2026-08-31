import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { initDatabase } from "./db/database.js";
import imagesRouter from "./api/routes/images.js";
import postsRouter from "./api/routes/posts.js";
import reviewsRouter from "./api/routes/reviews.js";
import batchRouter from "./api/routes/batch.js";

initDatabase();

export const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/public", express.static(path.resolve("public")));
app.use("/data/images", express.static(path.resolve("data/images")));
app.use(express.static(path.resolve("public")));

app.use("/api/images", imagesRouter);
app.use("/api/posts", postsRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/batch", batchRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", service: "ai-image-matching-engine", timestamp: new Date().toISOString() });
});

export default app;
