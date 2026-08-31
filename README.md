# AI Image Matching Engine (FlyRank Capstone)

A production-grade backend service that automates multimodal image understanding, semantic vector search, safety-critical mismatch rejection, and human-in-the-loop review.

---

## Architecture Overview

```mermaid
flowchart TD
    subgraph Ingestion["1. Batch Ingestion & Vision Pipeline"]
        IMG["Image Dataset (42 images)"] --> BATCH["Async Batch Job Worker"]
        BATCH -->|"Vision Prompt"| GEMINI_V["Gemini Flash Vision"]
        GEMINI_V -->|"Structured JSON"| ZOD_V["Schema Validation (Zod)"]
        ZOD_V -->|"Low Confidence (<0.7)"| FLAGGED["Flagged Ingest Record"]
        ZOD_V -->|"Valid & High Confidence"| EMBED_IMG["Gemini Embedding Model"]
        EMBED_IMG --> DB_IMG[("SQLite: images & image_embeddings")]
    end

    subgraph Posts["2. Post Ingestion"]
        POSTS["Blog Posts"] --> EMBED_POST["Gemini Embedding Model"]
        EMBED_POST --> DB_POST[("SQLite: posts & post_embeddings")]
    end

    subgraph Matching["3. Matching & Safety Engine"]
        REQ["GET /api/posts/:id/images"] --> SIM["Cosine Vector Similarity Search"]
        DB_IMG --> SIM
        DB_POST --> SIM
        SIM -->|"Top Candidates"| GUARD["Mismatch Guard Safety Layer"]
        GUARD -->|"1. Confidence Check"| G1{"Conf >= 0.70"}
        GUARD -->|"2. Semantic Similarity"| G2{"Sim >= 0.60"}
        GUARD -->|"3. Entity/Species Check"| G3{"Concept Match?"}
        G1 & G2 & G3 -->|"Pass"| ACCEPTED["Suggested Image (ACCEPTED)"]
        G1 & G2 & G3 -->|"Fail"| REJECTED["Rejection Reason (REJECTED)"]
    end

    subgraph Review["4. Review & Inspection (HTML/CSS UI)"]
        ACCEPTED --> API_REV["Review API & HTML/CSS Dashboard"]
        REJECTED --> API_REV
        API_REV -->|"Approve / Reject"| DB_REV[("SQLite: reviews")]
    end
```

---

## Key Components

### 1. Image Ingestion & Classification
- Analyzes images with Gemini Flash and produces validated structured metadata:
  ```json
  {
    "subject": "red fox",
    "category": "animal",
    "attributes": ["orange fur", "bushy tail", "pointed ears", "wild", "forest"],
    "caption": "A red fox with vibrant orange fur standing alert in a forest",
    "confidence": 0.96
  }
  ```
- **Schema Validation**: Verified with Zod; invalid schemas are discarded.
- **Low-Confidence Flagging**: Detections below `0.70` confidence are marked as `FLAGGED`.

### 2. Semantic Image Matching
- Converts text representations into dense vector embeddings.
- Vector cosine similarity matches equivalent concepts without exact keyword overlap (e.g., *"Vulpes vulpes"* $\leftrightarrow$ *"red fox"*).

### 3. The Mismatch Guard
- Production-critical safety layer that rejects false positives:
  - **Post**: *"The behavior of red foxes"*
  - **Candidate**: *"A gray wolf in the forest"*
  - **Result**: `REJECTED`
  - **Reason**: `"Animal category mismatch: expected fox, detected wolf"`
- Returns `"no confident match"` with human-readable explanations when no candidate clears the safety threshold.

### 4. Background Processing System
- Asynchronous batch processor handles large workloads without blocking HTTP requests.
- Exponential backoff retries on failure.
- Progress monitoring and per-call USD cost calculation based on token consumption.

### 5. Review API & HTML/CSS UI
- Review workflow allowing humans to approve or reject suggestions with notes.
- Embedded responsive dashboard served at `http://localhost:3000`.

---

## Evaluation Benchmark

Measured on 12 labeled ground-truth evaluation posts across 4 distinct categories (Animals, Food, Nature, Vehicles/Tech):

| Metric | Score | Details |
|---|---|---|
| **Top-1 Precision** | **100.0%** | 12/12 ground-truth matches retrieved as Top-1 |
| **Top-3 Retrieval Accuracy** | **100.0%** | 12/12 ground-truth matches in Top-3 |
| **Mismatch Guard Accuracy** | **100.0%** | Zero false-positive recommendations accepted |

---

## Quickstart — Exact Steps

### Prerequisites
- Node.js v20 or v24 (no other runtime required)
- npm (comes with Node.js)
- A free Google Gemini API key from [aistudio.google.com](https://aistudio.google.com) — **optional**. The app runs fully offline without it using a deterministic fallback classifier.

### 1. Install dependencies
```bash
npm install
```

### 2. Set environment variables (optional)
```bash
copy .env.example .env
# Open .env and paste your GEMINI_API_KEY value
```
If you skip this step the app still works — vision and embeddings use the offline fallback.

### 3. Download real images
```bash
node scripts/downloadRealImages.js
```
Downloads 42 real JPEG photographs from Unsplash into `data/images/`.

### 4. Seed the database
```bash
node scripts/seed.js
```
Runs every image through the vision pipeline (Gemini Flash or offline fallback), stores structured metadata, generates embeddings for images and posts, and records costs.

Expected output:
```
--- Starting Seeding Real Images ---
Batch Completed: COMPLETED (42/42 images)
Total Cost: $0.002259 over 84 calls.
--- Seeding Done ---
```

### 5. Run tests
```bash
node scripts/test.js
```

### 6. Run evaluation benchmark
```bash
node scripts/evaluate.js
```

Expected results:
```
Top-1 Precision:          100.0% (12/12)
Top-3 Retrieval Accuracy: 100.0% (12/12)
Mismatch Guard Accuracy:  100.0% (2/2)
```

### 7. Start the server
```bash
node src/server.js
```
Open **http://localhost:3000** in your browser to access the dashboard.

---

## Limitations

- **Offline fallback embeddings are keyword-based, not truly semantic.** Without a `GEMINI_API_KEY`, the embedding function uses multi-word keyword matching rather than real dense vectors. Results are accurate for the 42-image dataset but would not generalise to unseen subjects without a real API key.
- **Mismatch guard rules are hand-coded for 4 categories.** The entity contradiction check covers animals, food, nature, and vehicles. It does not cover arbitrary new domains without adding new rules.
- **No authentication on the API.** The review and ingestion endpoints are open. This is intentional for the capstone demo but is not production-safe.
- **42-image dataset.** The system is designed and tested at this scale. Larger datasets would benefit from a proper vector database (e.g., pgvector) instead of in-memory cosine comparisons.

---

## API Reference

### 1. Ingestion & Images
- `GET /api/images` — List all ingested images and metadata tags.
- `GET /api/images/:id` — Retrieve image details and embedding status.
- `POST /api/images` — Register new image for ingestion.

### 2. Matching & Posts
- `GET /api/posts` — List all blog posts.
- `POST /api/posts` — Create a post and compute embeddings.
- `GET /api/posts/:id/images` — Rank candidate images and evaluate through Mismatch Guard.

### 3. Human Review
- `POST /api/reviews/:suggestionId` — Submit review (`APPROVED` / `REJECTED`) with notes.
- `GET /api/reviews` — Retrieve history of all human review decisions.

### 4. Batch & Costs
- `POST /api/batch/process-all` — Trigger batch processing for images.
- `GET /api/batch/jobs/:id` — Get batch job status and progress.
- `GET /api/batch/costs` — Get token usage and USD cost breakdown.

---

## Deliverables Checklist
- [x] `DESIGN.md` (1-page design and architecture doc)
- [x] `EVIDENCE.md` (Verified proofs for all Section 6 requirements)
- [x] `README.md` (Architecture, diagrams, API reference, eval metrics)
- [x] 42-image corpus across 4 categories
- [x] 12-post evaluation benchmark set
