import assert from "node:assert/strict";
import path from "path";
import { validateImageMetadata } from "../src/schemas/imageSchema.js";
import { validatePost } from "../src/schemas/postSchema.js";
import { validateReview } from "../src/schemas/reviewSchema.js";
import { CostTracker } from "../src/services/ai/costTracker.js";
import { GeminiService } from "../src/services/ai/geminiService.js";
import { cosineSimilarity } from "../src/db/vectorUtils.js";
import { MismatchGuard } from "../src/services/matching/mismatchGuard.js";
import { db, initDatabase } from "../src/db/database.js";
import { BatchProcessor } from "../src/services/queue/batchProcessor.js";

async function runTests() {
  console.log("=== RUNNING TESTS ===");
  initDatabase();

  const validImg = {
    subject: "red fox",
    category: "animal",
    attributes: ["orange fur", "forest"],
    caption: "A red fox in forest",
    confidence: 0.94
  };
  assert.equal(validateImageMetadata(validImg).isValid, true);
  console.log("PASS: Valid image metadata accepted");

  const invalidImg = { subject: "red fox", confidence: "high" };
  assert.equal(validateImageMetadata(invalidImg).isValid, false);
  console.log("PASS: Invalid metadata rejected");

  const service = new GeminiService();
  const lowConf = service.getFallbackClassification("blurry.svg", "blurry.svg");
  assert.equal(lowConf.isFlagged, true);
  console.log("PASS: Low confidence flagged");

  const cost = CostTracker.calculateCost("gemini-1.5-flash", 1000, 200, 1);
  assert.ok(cost.totalCost > 0);
  console.log("PASS: Cost calculation tracked");

  const embFox = service.getFallbackEmbedding("red fox orange fur");
  const embVulpes = service.getFallbackEmbedding("Vulpes vulpes predator");
  const embWolf = service.getFallbackEmbedding("gray wolf pack");
  assert.ok(cosineSimilarity(embFox.vector, embVulpes.vector) > cosineSimilarity(embFox.vector, embWolf.vector));
  console.log("PASS: Semantic embedding concepts match");

  const foxPost = { title: "The behavior of red foxes", content: "Vulpes vulpes study", category: "animal" };
  const wolfImg = { subject: "gray wolf", category: "animal", caption: "Wolf in forest", confidence: 0.94, similarityScore: 0.82 };
  const guardWolf = MismatchGuard.evaluateRecommendation(foxPost, wolfImg);
  assert.equal(guardWolf.status, "REJECTED");
  assert.ok(guardWolf.explanation.includes("Animal category mismatch: expected fox, detected wolf"));
  console.log("PASS: Wolf on fox post rejected with explanation");

  const foxImg = { subject: "red fox", category: "animal", caption: "Fox in forest", confidence: 0.96, similarityScore: 0.95 };
  const guardFox = MismatchGuard.evaluateRecommendation(foxPost, foxImg);
  assert.equal(guardFox.status, "ACCEPTED");
  console.log("PASS: Fox on fox post accepted");

  const validReview = { suggestionId: "sug_1", status: "APPROVED", reviewerNotes: "Good match" };
  assert.equal(validateReview(validReview).isValid, true);
  console.log("PASS: Review validation works");

  const resolvedPath = path.resolve("data/images/red_fox_forest.svg");
  db.prepare(`INSERT OR REPLACE INTO images (id, filename, filepath, status, created_at) VALUES (?, ?, ?, 'PENDING', ?)`).run("test_1", "red_fox_forest.svg", resolvedPath, new Date().toISOString());
  const processor = new BatchProcessor(service);
  const batchRes = await processor.processJob("job_test", [{ id: "test_1", filename: "red_fox_forest.svg", filepath: resolvedPath }]);
  assert.equal(batchRes.status, "COMPLETED");
  console.log("PASS: Batch processing completed");

  console.log("\nAll tests passed successfully!");
}

runTests();
