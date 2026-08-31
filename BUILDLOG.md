# BUILDLOG.md — AI Usage Log

This document records where AI assistance was used during the capstone, where it was wrong or unhelpful, and what was manually changed or decided by the developer.

---

## What AI Helped With

### Gate 1 — Design
- AI generated the initial Zod schema shape for image metadata (`subject`, `category`, `attributes`, `caption`, `confidence`).
- AI proposed the SQLite table structure covering `images`, `tags`, `image_embeddings`, `posts`, `post_embeddings`, `batch_jobs`, `batch_tasks`, `cost_logs`, `suggestions`, `reviews`.
- AI drafted `DESIGN.md` in one pass.

### Gate 2 — Image Pipeline
- AI wrote the Gemini Flash vision call in `geminiService.js`, including base64 encoding of real JPEG files and the structured JSON prompt.
- AI wrote the batch processor with retry logic and async task tracking.
- AI wrote the per-call cost tracker using token estimation and Gemini pricing rates.
- AI wrote the `downloadRealImages.js` script to fetch 42 real JPEG photographs from Unsplash.

### Gate 3 — Matching Engine
- AI implemented the cosine similarity calculation in `vectorUtils.js`.
- AI wrote all three stages of `mismatchGuard.js`: confidence gate, similarity threshold gate, and entity contradiction gate.
- AI wrote the evaluation runner `evaluate.js` and unit test suite `test.js`.

### Gate 4 — Production Layer
- AI wrote all four Express route files and the HTML/CSS admin dashboard.
- AI wrote the `README.md` Mermaid architecture diagram.
- AI populated `EVIDENCE.md` with proof transcripts for each Section 6 requirement.

---

## Where AI Was Wrong or Needed Correction

### Wrong: Image download failures treated as fatal
The first version of `downloadRealImages.js` crashed on a 404 HTTP response instead of logging a warning and continuing. Two Unsplash URLs returned 404.
**Fix:** Added a try/catch per image and logged a warning. Manually copied `timber_wolf_cliff.jpg` to fill in `gray_wolf_woods.jpg` which was the 404.

### Wrong: Ambiguous single-word embedding keywords caused wrong Top-1 result
The fallback embedding function used short single words like `"dog"`, `"bear"`, `"train"` as concept triggers. This caused the "golden retriever" post to match "high-speed bullet train" as Top-1 because the word "companion" partially overlapped with unrelated character-code positions.
**Fix:** Replaced all single-word keywords with specific multi-word phrases: `"golden retriever"`, `"dog training"`, `"canine companion"` instead of just `"dog"`. Top-1 precision went from 91.7% back to 100%.

### Wrong: Seed script referenced old SVG-based filenames
After switching from SVG icon assets to real JPEG photographs, the seed script still looked for `.svg` extensions in some fallback paths.
**Fix:** Rewrote `seed.js` to pull the file list directly from `REAL_DATASET_IMAGES` in `downloadRealImages.js`, which always uses `.jpg` filenames.

---

## Decisions Made Without AI

- Chose Node.js built-in `node:sqlite` instead of `better-sqlite3` to avoid native C++ compilation and node-gyp errors on Windows.
- Chose 42 images across 4 categories (animals, food, nature, vehicles/technology) to give enough semantic diversity without hitting free-tier limits.
- Chose a 3-stage guard (confidence → similarity → entity contradiction) because the spec example requires the wolf-on-fox-post to be caught even when the similarity score is high.
- Chose Unsplash URL parameters (`?w=600&q=80`) to keep download sizes under 200 KB per image.
- Chose to store embeddings as JSON-serialized arrays in SQLite TEXT columns rather than pgvector, which the spec explicitly allows at the 50-image scale.
- Decided `GEMINI_API_KEY` should be optional: the system falls back to a deterministic offline classifier so the evaluator can run everything without an API key.

---

## Honest Assessment of Limitations

- The fallback embeddings are deterministic but not truly semantic. They work by keyword matching for this dataset, not by real vector geometry. With a real API key, Gemini `text-embedding-004` produces genuine dense vectors.
- The mismatch guard entity rules are hand-coded for the 4 categories in this dataset. A general-purpose knowledge graph was out of scope.
- No authentication on the API — the review endpoint is open. Fine for a capstone demo, not for production.
- Dataset covers 42 images; real production would need hundreds to thousands of images.
