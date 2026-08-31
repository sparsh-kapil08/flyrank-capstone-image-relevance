import { DatabaseSync } from "node:sqlite";
import path from "path";
import fs from "fs";

const dbDir = path.resolve("data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "app.sqlite");
export const db = new DatabaseSync(dbPath);

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      subject TEXT,
      category TEXT,
      caption TEXT,
      confidence REAL,
      is_flagged INTEGER DEFAULT 0,
      status TEXT DEFAULT 'PENDING',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      FOREIGN KEY (image_id) REFERENCES images(id)
    );

    CREATE TABLE IF NOT EXISTS image_embeddings (
      image_id TEXT PRIMARY KEY,
      embedding TEXT NOT NULL,
      dimensions INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (image_id) REFERENCES images(id)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS post_embeddings (
      post_id TEXT PRIMARY KEY,
      embedding TEXT NOT NULL,
      dimensions INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (post_id) REFERENCES posts(id)
    );

    CREATE TABLE IF NOT EXISTS batch_jobs (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      total_items INTEGER NOT NULL,
      processed_items INTEGER DEFAULT 0,
      failed_items INTEGER DEFAULT 0,
      total_cost REAL DEFAULT 0,
      created_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS batch_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      status TEXT NOT NULL,
      retry_count INTEGER DEFAULT 0,
      error_message TEXT,
      cost REAL DEFAULT 0,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (job_id) REFERENCES batch_jobs(id)
    );

    CREATE TABLE IF NOT EXISTS cost_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT NOT NULL,
      model TEXT NOT NULL,
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      image_count INTEGER DEFAULT 0,
      cost_usd REAL NOT NULL,
      reference_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS suggestions (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      image_id TEXT NOT NULL,
      similarity_score REAL NOT NULL,
      guard_status TEXT NOT NULL,
      guard_reason TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      suggestion_id TEXT NOT NULL,
      status TEXT NOT NULL,
      reviewer_notes TEXT,
      reviewed_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tags_image ON tags(image_id);
    CREATE INDEX IF NOT EXISTS idx_suggestions_post ON suggestions(post_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_sug ON reviews(suggestion_id);
    CREATE INDEX IF NOT EXISTS idx_batch_tasks_job ON batch_tasks(job_id);
    CREATE INDEX IF NOT EXISTS idx_cost_logs_ref ON cost_logs(reference_id);
  `);
}

export function saveCostLog(log) {
  const stmt = db.prepare(`
    INSERT INTO cost_logs (operation, model, input_tokens, output_tokens, image_count, cost_usd, reference_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    log.operation,
    log.model,
    log.inputTokens || 0,
    log.outputTokens || 0,
    log.imageCount || 0,
    log.totalCost || 0,
    log.referenceId || "",
    new Date().toISOString()
  );
}

export function getTotalCost() {
  const result = db.prepare(`SELECT SUM(cost_usd) as total_usd, COUNT(*) as total_calls FROM cost_logs`).get();
  return {
    totalUsd: Number((result.total_usd || 0).toFixed(6)),
    totalCalls: result.total_calls || 0
  };
}

export function getCostBreakdown() {
  return db.prepare(`
    SELECT model, operation, COUNT(*) as call_count, SUM(input_tokens) as total_input_tokens,
           SUM(output_tokens) as total_output_tokens, SUM(cost_usd) as total_usd
    FROM cost_logs
    GROUP BY model, operation
  `).all();
}
