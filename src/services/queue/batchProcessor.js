import { db, saveCostLog } from "../../db/database.js";
import { GeminiService } from "../ai/geminiService.js";
import { serializeVector } from "../../db/vectorUtils.js";

export class BatchProcessor {
  constructor(geminiService = new GeminiService()) {
    this.geminiService = geminiService;
    this.isProcessing = false;
  }

  createBatchJob(imageItems, autoStart = true) {
    const jobId = "job_" + Date.now();
    const now = new Date().toISOString();

    const insertJob = db.prepare(`
      INSERT INTO batch_jobs (id, status, total_items, processed_items, failed_items, total_cost, created_at)
      VALUES (?, 'QUEUED', ?, 0, 0, 0, ?)
    `);
    insertJob.run(jobId, imageItems.length, now);

    const insertTask = db.prepare(`
      INSERT INTO batch_tasks (job_id, item_id, item_type, status, retry_count, cost, updated_at)
      VALUES (?, ?, 'IMAGE', 'QUEUED', 0, 0, ?)
    `);

    for (let item of imageItems) {
      insertTask.run(jobId, item.id, now);
    }

    if (autoStart) {
      this.isProcessing = true;
      setImmediate(() => {
        this.processJob(jobId, imageItems);
      });
    }

    return {
      jobId: jobId,
      status: "QUEUED",
      totalItems: imageItems.length,
      createdAt: now
    };
  }

  async processJob(jobId, imageItems) {
    this.isProcessing = true;

    db.prepare(`UPDATE batch_jobs SET status = 'PROCESSING' WHERE id = ?`).run(jobId);

    let processedCount = 0;
    let failedCount = 0;
    let totalCost = 0;

    for (let item of imageItems) {
      let success = false;
      let attempts = 0;
      let lastError = "";
      let itemCost = 0;

      while (attempts < 3 && !success) {
        attempts++;
        try {
          db.prepare(`
            UPDATE batch_tasks 
            SET status = 'PROCESSING', retry_count = ?, updated_at = ?
            WHERE job_id = ? AND item_id = ?
          `).run(attempts - 1, new Date().toISOString(), jobId, item.id);

          const classification = await this.geminiService.classifyImage(item.filepath, item.filename);

          const visionCost = classification.cost;
          itemCost = itemCost + visionCost.totalCost;

          saveCostLog({
            operation: "VISION_CLASSIFICATION",
            model: visionCost.model,
            inputTokens: visionCost.inputTokens,
            outputTokens: visionCost.outputTokens,
            imageCount: 1,
            totalCost: visionCost.totalCost,
            referenceId: item.id
          });

          const meta = classification.data;
          const isFlagged = classification.isFlagged ? 1 : 0;
          const status = isFlagged ? "FLAGGED" : "PROCESSED";

          db.prepare(`
            UPDATE images 
            SET subject = ?, category = ?, caption = ?, confidence = ?, is_flagged = ?, status = ?
            WHERE id = ?
          `).run(meta.subject, meta.category, meta.caption, meta.confidence, isFlagged, status, item.id);

          db.prepare(`DELETE FROM tags WHERE image_id = ?`).run(item.id);
          const insertTag = db.prepare(`INSERT INTO tags (image_id, tag) VALUES (?, ?)`);
          for (let attr of meta.attributes) {
            insertTag.run(item.id, attr);
          }

          const textForEmbedding = meta.subject + " " + meta.category + " " + meta.caption + " " + meta.attributes.join(" ");
          const embeddingResult = await this.geminiService.generateEmbedding(textForEmbedding);

          const embedCost = embeddingResult.cost;
          itemCost = itemCost + embedCost.totalCost;

          saveCostLog({
            operation: "IMAGE_EMBEDDING",
            model: embedCost.model,
            inputTokens: embedCost.inputTokens,
            outputTokens: 0,
            imageCount: 0,
            totalCost: embedCost.totalCost,
            referenceId: item.id
          });

          db.prepare(`
            INSERT OR REPLACE INTO image_embeddings (image_id, embedding, dimensions, created_at)
            VALUES (?, ?, ?, ?)
          `).run(item.id, serializeVector(embeddingResult.vector), embeddingResult.dimensions, new Date().toISOString());

          db.prepare(`
            UPDATE batch_tasks
            SET status = 'COMPLETED', cost = ?, updated_at = ?
            WHERE job_id = ? AND item_id = ?
          `).run(itemCost, new Date().toISOString(), jobId, item.id);

          success = true;
          processedCount++;
          totalCost = totalCost + itemCost;
        } catch (err) {
          lastError = err.message;
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      if (!success) {
        failedCount++;
        db.prepare(`
          UPDATE batch_tasks
          SET status = 'FAILED', error_message = ?, updated_at = ?
          WHERE job_id = ? AND item_id = ?
        `).run(lastError, new Date().toISOString(), jobId, item.id);

        db.prepare(`UPDATE images SET status = 'FAILED' WHERE id = ?`).run(item.id);
      }

      db.prepare(`
        UPDATE batch_jobs 
        SET processed_items = ?, failed_items = ?, total_cost = ?
        WHERE id = ?
      `).run(processedCount, failedCount, totalCost, jobId);
    }

    const finalStatus = failedCount === imageItems.length ? "FAILED" : "COMPLETED";
    db.prepare(`
      UPDATE batch_jobs
      SET status = ?, completed_at = ?, total_cost = ?
      WHERE id = ?
    `).run(finalStatus, new Date().toISOString(), totalCost, jobId);

    this.isProcessing = false;
    return {
      jobId: jobId,
      status: finalStatus,
      processedItems: processedCount,
      failedItems: failedCount,
      totalCost: totalCost
    };
  }

  getJobStatus(jobId) {
    const job = db.prepare(`SELECT * FROM batch_jobs WHERE id = ?`).get(jobId);
    if (!job) return null;

    const tasks = db.prepare(`SELECT * FROM batch_tasks WHERE job_id = ?`).all(jobId);

    return {
      id: job.id,
      status: job.status,
      total_items: job.total_items,
      processed_items: job.processed_items,
      failed_items: job.failed_items,
      total_cost: job.total_cost,
      created_at: job.created_at,
      completed_at: job.completed_at,
      progressPercentage: job.total_items > 0 ? Math.round((job.processed_items / job.total_items) * 100) : 0,
      tasks: tasks
    };
  }

  getAllJobs() {
    return db.prepare(`SELECT * FROM batch_jobs ORDER BY created_at DESC`).all();
  }
}
