import express from "express";
import { db } from "../../db/database.js";
import { imageIngestSchema } from "../../schemas/imageSchema.js";

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const images = db.prepare(`SELECT * FROM images ORDER BY created_at DESC`).all();
    const allTags = db.prepare(`SELECT image_id, tag FROM tags`).all();

    const tagsMap = {};
    for (let t of allTags) {
      if (!tagsMap[t.image_id]) tagsMap[t.image_id] = [];
      tagsMap[t.image_id].push(t.tag);
    }

    const list = images.map(img => ({
      id: img.id,
      filename: img.filename,
      filepath: img.filepath,
      subject: img.subject,
      category: img.category,
      caption: img.caption,
      confidence: img.confidence,
      isFlagged: Boolean(img.is_flagged),
      status: img.status,
      tags: tagsMap[img.id] || [],
      createdAt: img.created_at
    }));

    res.json({ success: true, count: list.length, images: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:id", (req, res) => {
  try {
    const img = db.prepare(`SELECT * FROM images WHERE id = ?`).get(req.params.id);
    if (!img) {
      return res.status(404).json({ success: false, error: "Image not found" });
    }

    const tags = db.prepare(`SELECT tag FROM tags WHERE image_id = ?`).all(req.params.id).map(t => t.tag);
    const embedInfo = db.prepare(`SELECT dimensions FROM image_embeddings WHERE image_id = ?`).get(req.params.id);

    res.json({
      success: true,
      image: {
        id: img.id,
        filename: img.filename,
        filepath: img.filepath,
        subject: img.subject,
        category: img.category,
        caption: img.caption,
        confidence: img.confidence,
        isFlagged: Boolean(img.is_flagged),
        status: img.status,
        tags: tags,
        hasEmbedding: Boolean(embedInfo),
        embeddingDimensions: embedInfo ? embedInfo.dimensions : null,
        createdAt: img.created_at
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", (req, res) => {
  try {
    const parsed = imageIngestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Validation failed" });
    }

    const { filename, filepath } = parsed.data;
    const id = parsed.data.id || "img_" + Date.now();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO images (id, filename, filepath, status, created_at)
      VALUES (?, ?, ?, 'PENDING', ?)
    `).run(id, filename, filepath, now);

    res.status(201).json({
      success: true,
      image: { id: id, filename: filename, filepath: filepath, status: "PENDING" }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
