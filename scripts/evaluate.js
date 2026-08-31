import fs from "fs";
import path from "path";
import { db } from "../src/db/database.js";
import { deserializeVector } from "../src/db/vectorUtils.js";
import { rankImagesForPostVector } from "../src/services/matching/vectorSearch.js";
import { MismatchGuard } from "../src/services/matching/mismatchGuard.js";

function evaluateSystem() {
  console.log("=== EVALUATION BENCHMARK ===");

  const evalPosts = JSON.parse(fs.readFileSync(path.resolve("data/evalPosts.json"), "utf-8"));
  let top1Correct = 0;
  let top3Correct = 0;
  let guardTested = 0;
  let guardPassed = 0;

  for (let post of evalPosts) {
    const embedRow = db.prepare(`SELECT embedding FROM post_embeddings WHERE post_id = ?`).get(post.id);
    const postVector = deserializeVector(embedRow.embedding);
    const candidates = rankImagesForPostVector(postVector, 5);

    const evaluated = candidates.map(cand => {
      const guard = MismatchGuard.evaluateRecommendation(post, cand);
      return { ...cand, guard };
    });

    const top1 = evaluated[0];
    if (top1 && top1.id === post.expectedImageId) {
      top1Correct++;
    }

    if (evaluated.slice(0, 3).some(c => c.id === post.expectedImageId)) {
      top3Correct++;
    }

    if (post.negativeTrapImageId) {
      guardTested++;
      const trapImage = db.prepare(`SELECT * FROM images WHERE id = ?`).get(post.negativeTrapImageId);
      const trapCand = {
        id: trapImage.id,
        subject: trapImage.subject,
        category: trapImage.category,
        caption: trapImage.caption,
        confidence: trapImage.confidence,
        isFlagged: Boolean(trapImage.is_flagged),
        similarityScore: 0.75
      };

      const trapGuard = MismatchGuard.evaluateRecommendation(post, trapCand);
      if (trapGuard.status === "REJECTED") {
        guardPassed++;
      }
    }

    console.log(`Post: ${post.title} -> Top-1: ${top1.subject} (${top1.guard.status})`);
  }

  const total = evalPosts.length;
  const top1Precision = ((top1Correct / total) * 100).toFixed(1);
  const top3Recall = ((top3Correct / total) * 100).toFixed(1);
  const guardAccuracy = ((guardPassed / guardTested) * 100).toFixed(1);

  console.log("\n--- Results ---");
  console.log(`Top-1 Precision:          ${top1Precision}% (${top1Correct}/${total})`);
  console.log(`Top-3 Retrieval Accuracy: ${top3Recall}% (${top3Correct}/${total})`);
  console.log(`Mismatch Guard Accuracy:  ${guardAccuracy}% (${guardPassed}/${guardTested})`);
}

evaluateSystem();
