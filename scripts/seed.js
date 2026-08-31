import fs from "fs";
import path from "path";
import { db, initDatabase, getTotalCost } from "../src/db/database.js";
import { REAL_DATASET_IMAGES } from "./downloadRealImages.js";
import { BatchProcessor } from "../src/services/queue/batchProcessor.js";
import { GeminiService } from "../src/services/ai/geminiService.js";
import { serializeVector } from "../src/db/vectorUtils.js";

async function runSeed() {
  console.log("--- Starting Seeding Real Images ---");
  initDatabase();

  db.prepare(`DELETE FROM reviews`).run();
  db.prepare(`DELETE FROM suggestions`).run();
  db.prepare(`DELETE FROM post_embeddings`).run();
  db.prepare(`DELETE FROM posts`).run();
  db.prepare(`DELETE FROM image_embeddings`).run();
  db.prepare(`DELETE FROM tags`).run();
  db.prepare(`DELETE FROM batch_tasks`).run();
  db.prepare(`DELETE FROM batch_jobs`).run();
  db.prepare(`DELETE FROM cost_logs`).run();
  db.prepare(`DELETE FROM images`).run();

  const insertImage = db.prepare(`
    INSERT INTO images (id, filename, filepath, status, created_at)
    VALUES (?, ?, ?, 'PENDING', ?)
  `);

  const now = new Date().toISOString();
  const imageItems = [];

  for (let img of REAL_DATASET_IMAGES) {
    const fullPath = path.resolve("data/images", img.filename);
    insertImage.run(img.id, img.filename, fullPath, now);
    imageItems.push({ id: img.id, filename: img.filename, filepath: fullPath });
  }

  const geminiService = new GeminiService();
  const batchProcessor = new BatchProcessor(geminiService);

  const job = batchProcessor.createBatchJob(imageItems, false);
  const jobSummary = await batchProcessor.processJob(job.jobId, imageItems);

  console.log(`Batch Completed: ${jobSummary.status} (${jobSummary.processedItems}/${imageItems.length} images)`);

  const evalPosts = JSON.parse(fs.readFileSync(path.resolve("data/evalPosts.json"), "utf-8"));
  const insertPost = db.prepare(`
    INSERT INTO posts (id, title, content, category, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertPostEmbed = db.prepare(`
    INSERT INTO post_embeddings (post_id, embedding, dimensions, created_at)
    VALUES (?, ?, ?, ?)
  `);

  for (let p of evalPosts) {
    insertPost.run(p.id, p.title, p.content, p.category, now);
    const textToEmbed = p.title + " " + p.content + " " + (p.category || "");
    const embedResult = await geminiService.generateEmbedding(textToEmbed);
    insertPostEmbed.run(p.id, serializeVector(embedResult.vector), embedResult.dimensions, now);
  }

  const costs = getTotalCost();
  console.log(`Total Cost: $${costs.totalUsd} over ${costs.totalCalls} calls.`);
  console.log("--- Seeding Done ---");
}

runSeed();
