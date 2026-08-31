import express from "express";
import { db, getTotalCost, getCostBreakdown } from "../../db/database.js";
import { BatchProcessor } from "../../services/queue/batchProcessor.js";
import { GeminiService } from "../../services/ai/geminiService.js";

const router = express.Router();
const geminiService = new GeminiService();
const batchProcessor = new BatchProcessor(geminiService);

router.post("/process-all", (req, res) => {
  try {
    const images = db.prepare(`SELECT id, filename, filepath FROM images`).all();
    if (images.length === 0) {
      return res.status(400).json({ success: false, error: "No images to process" });
    }

    const job = batchProcessor.createBatchJob(images);
    res.status(202).json({ success: true, job: job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/jobs", (req, res) => {
  try {
    const jobs = batchProcessor.getAllJobs();
    res.json({ success: true, count: jobs.length, jobs: jobs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/jobs/:id", (req, res) => {
  try {
    const job = batchProcessor.getJobStatus(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }
    res.json({ success: true, job: job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/costs", (req, res) => {
  try {
    const total = getTotalCost();
    const breakdown = getCostBreakdown();
    res.json({
      success: true,
      totalUsd: total.totalUsd,
      totalCalls: total.totalCalls,
      breakdown: breakdown
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
