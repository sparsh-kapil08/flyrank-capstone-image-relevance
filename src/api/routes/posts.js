import express from "express";
import { db } from "../../db/database.js";
import { validatePost } from "../../schemas/postSchema.js";
import { GeminiService } from "../../services/ai/geminiService.js";
import { rankImagesForPostVector } from "../../services/matching/vectorSearch.js";
import { MismatchGuard } from "../../services/matching/mismatchGuard.js";
import { serializeVector, deserializeVector } from "../../db/vectorUtils.js";

const router = express.Router();
const geminiService = new GeminiService();

router.get("/", (req, res) => {
  try {
    const posts = db.prepare(`SELECT * FROM posts ORDER BY created_at DESC`).all();
    res.json({ success: true, count: posts.length, posts: posts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:id", (req, res) => {
  try {
    const post = db.prepare(`SELECT * FROM posts WHERE id = ?`).get(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }
    res.json({ success: true, post: post });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const validation = validatePost(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, error: "Validation failed" });
    }

    const { title, content, category } = validation.data;
    const id = validation.data.id || "post_" + Date.now();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO posts (id, title, content, category, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, title, content, category || "general", now);

    const embedText = title + " " + content + " " + (category || "");
    const embedResult = await geminiService.generateEmbedding(embedText);

    db.prepare(`
      INSERT OR REPLACE INTO post_embeddings (post_id, embedding, dimensions, created_at)
      VALUES (?, ?, ?, ?)
    `).run(id, serializeVector(embedResult.vector), embedResult.dimensions, now);

    res.status(201).json({
      success: true,
      post: { id: id, title: title, content: content, category: category }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:id/images", async (req, res) => {
  try {
    const post = db.prepare(`SELECT * FROM posts WHERE id = ?`).get(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    let embedRow = db.prepare(`SELECT embedding FROM post_embeddings WHERE post_id = ?`).get(req.params.id);
    let postVector;

    if (!embedRow) {
      const embedResult = await geminiService.generateEmbedding(post.title + " " + post.content);
      db.prepare(`
        INSERT OR REPLACE INTO post_embeddings (post_id, embedding, dimensions, created_at)
        VALUES (?, ?, ?, ?)
      `).run(post.id, serializeVector(embedResult.vector), embedResult.dimensions, new Date().toISOString());
      postVector = embedResult.vector;
    } else {
      postVector = deserializeVector(embedRow.embedding);
    }

    const candidates = rankImagesForPostVector(postVector, 5);
    const evaluatedList = [];
    let bestAccepted = null;

    for (let cand of candidates) {
      const guard = MismatchGuard.evaluateRecommendation(post, cand);
      const suggestionId = "sug_" + post.id + "_" + cand.id;

      db.prepare(`
        INSERT OR REPLACE INTO suggestions (id, post_id, image_id, similarity_score, guard_status, guard_reason, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(suggestionId, post.id, cand.id, cand.similarityScore, guard.status, guard.explanation, new Date().toISOString());

      const item = {
        suggestionId: suggestionId,
        image: cand,
        similarityScore: cand.similarityScore,
        confidence: cand.confidence,
        guardStatus: guard.status,
        guardReason: guard.explanation
      };

      evaluatedList.push(item);

      if (guard.status === "ACCEPTED" && !bestAccepted) {
        bestAccepted = item;
      }
    }

    res.json({
      success: true,
      postId: post.id,
      postTitle: post.title,
      matchFound: Boolean(bestAccepted),
      bestMatch: bestAccepted,
      statusMessage: bestAccepted
        ? `Found confident match: "${bestAccepted.image.subject}"`
        : "No confident match: all candidates failed safety guard checks",
      candidates: evaluatedList
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
