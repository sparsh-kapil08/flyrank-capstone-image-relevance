import express from "express";
import { db } from "../../db/database.js";
import { validateReview } from "../../schemas/reviewSchema.js";

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const reviews = db.prepare(`
      SELECT r.id as review_id, r.status as review_status, r.reviewer_notes, r.reviewed_at,
             s.similarity_score, s.guard_reason,
             p.title as post_title,
             i.id as image_id, i.subject as image_subject
      FROM reviews r
      JOIN suggestions s ON r.suggestion_id = s.id
      JOIN posts p ON s.post_id = p.id
      JOIN images i ON s.image_id = i.id
      ORDER BY r.reviewed_at DESC
    `).all();

    res.json({ success: true, count: reviews.length, reviews: reviews });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/:suggestionId", (req, res) => {
  try {
    const payload = {
      suggestionId: req.params.suggestionId,
      status: req.body.status,
      reviewerNotes: req.body.reviewerNotes || ""
    };

    const validation = validateReview(payload);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, error: "Validation failed" });
    }

    const reviewId = "rev_" + Date.now();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT OR REPLACE INTO reviews (id, suggestion_id, status, reviewer_notes, reviewed_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(reviewId, payload.suggestionId, payload.status, payload.reviewerNotes, now);

    res.json({
      success: true,
      message: `Suggestion marked as ${payload.status}`,
      review: { id: reviewId, status: payload.status, notes: payload.reviewerNotes }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
