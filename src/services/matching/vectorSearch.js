import { db } from "../../db/database.js";
import { cosineSimilarity, deserializeVector } from "../../db/vectorUtils.js";

export function rankImagesForPostVector(postVector, limit = 5) {
  const images = db.prepare(`
    SELECT i.id, i.filename, i.filepath, i.subject, i.category, i.caption, i.confidence, i.is_flagged,
           ie.embedding
    FROM images i
    JOIN image_embeddings ie ON i.id = ie.image_id
    WHERE i.status != 'FAILED'
  `).all();

  const candidates = [];

  for (let img of images) {
    const vector = deserializeVector(img.embedding);
    const score = cosineSimilarity(postVector, vector);

    const tags = db.prepare(`SELECT tag FROM tags WHERE image_id = ?`).all(img.id).map(t => t.tag);

    candidates.push({
      id: img.id,
      filename: img.filename,
      filepath: img.filepath,
      subject: img.subject,
      category: img.category,
      caption: img.caption,
      confidence: img.confidence,
      isFlagged: Boolean(img.is_flagged),
      tags: tags,
      similarityScore: score
    });
  }

  candidates.sort((a, b) => b.similarityScore - a.similarityScore);
  return candidates.slice(0, limit);
}
