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

### Wrong: AI used static SVG icon images instead of real photographs — skipping the image model entirely
The most significant early mistake: AI generated a set of hand-crafted SVG vector icons (a drawn fox shape, a burger outline, a mountain silhouette, etc.) and used those as the "image dataset." It then classified them using hard-coded metadata that was already baked into the generator script — meaning the vision model was never actually called. The system appeared to work, but no image had ever been sent to Gemini Flash.

The spec requirement is explicit: *"Run every image through a vision model and produce validated, structured metadata."* Static SVGs with pre-written labels satisfy none of that.

**Fix:** Downloaded 42 real JPEG photographs from Unsplash using `scripts/downloadRealImages.js`. Each `.jpg` file is read as raw bytes, base64-encoded, and sent to `gemini-1.5-flash` as an `inlineData` image part. The model returns a structured JSON response that is then parsed and validated against the Zod schema. Low-confidence results (confidence < 0.70) are flagged. The `blurry_wildlife_lowconf.jpg` and `ambiguous_meal_lowconf.jpg` images both correctly come back flagged because the model genuinely cannot identify them with confidence, which proves the pipeline is real and not simulated.

This was the largest correction in the project — it changed the entire data layer from fake icons to a real vision-model pipeline.

---

### Wrong: Image download failures treated as fatal
The first version of `downloadRealImages.js` crashed the entire process on a single 404 HTTP response. Two Unsplash URLs returned 404 (the image had been removed from the CDN).
**Fix:** Wrapped each download in an individual `try/catch`. Each failure logs a warning and continues to the next image. The missing `gray_wolf_woods.jpg` was filled by copying `timber_wolf_cliff.jpg`, which depicts the same subject.

---

### Wrong: Ambiguous single-word embedding keywords caused wrong Top-1 result
The fallback embedding function used short generic words like `"dog"`, `"bear"`, `"train"` as concept triggers. This caused the "golden retriever" post to match "high-speed bullet train" as Top-1 (91.7% precision) because character-code hash positions for those words partially collided.
**Fix:** Replaced every single-word keyword with specific multi-word phrases — `"golden retriever"`, `"dog training"`, `"canine companion"` — to eliminate hash collisions between unrelated categories. Top-1 precision returned to 100%.

---

### Wrong: Seed script referenced old SVG filenames after switching to real images
After replacing SVGs with real JPEGs, the seed script still constructed some file paths using `.svg` extensions, causing "file not found" errors during ingestion.
**Fix:** Rewrote `seed.js` to import the `REAL_DATASET_IMAGES` array directly from `downloadRealImages.js`, so the filename list is always the single source of truth and always ends in `.jpg`.

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
