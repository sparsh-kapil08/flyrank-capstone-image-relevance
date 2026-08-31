# System Design Document: AI Image Matching Engine

An AI-driven backend service with multimodal understanding, semantic vector search, a safety-critical mismatch guard, and a human-in-the-loop review workflow.

---

## 1. System Architecture

```
+-----------------------------------------------------------------------------------+
|                              INGESTION PIPELINE                                   |
|                                                                                   |
|  Image Corpus (42 assets) ---> Async Batch Processor ---> Gemini Flash Vision     |
|                                                                |                  |
|                                                    Structured JSON Extraction     |
|                                                                |                  |
|                                                     Zod Schema Validation         |
|                                                                |                  |
|                  +---------------------------------------------+                  |
|                  |                                             |                  |
|         [Confidence >= 0.70]                          [Confidence < 0.70]         |
|                  |                                             |                  |
|          Generate Embedding                            Flagged Ingest Record      |
|         (text-embedding-004)                                   |                  |
|                  |                                             |                  |
|                  v                                             v                  |
|        SQLite: `image_embeddings`                       SQLite: `images`          |
+-----------------------------------------------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------------+
|                              MATCHING & SAFETY GUARD                              |
|                                                                                   |
|  Blog Post ---> Post Embedding ---> Vector Cosine Search (Top-5 Candidates)       |
|                                                    |                              |
|                                                    v                              |
|                                      +---------------------------+                |
|                                      |   MISMATCH GUARD LAYER    |                |
|                                      |---------------------------|                |
|                                      | 1. Vision Confidence Check|                |
|                                      | 2. Cosine Sim Threshold   |                |
|                                      | 3. Entity & Concept Check |                |
|                                      +---------------------------+                |
|                                                    |                              |
|                        +---------------------------+---------------------------+  |
|                        |                                                       |  |
|                        v                                                       v  |
|               [STATUS: ACCEPTED]                                      [STATUS: REJECTED]  |
|               Best image suggestion                                   Human-readable      |
|               with match score & proof                                rejection reason    |
+-----------------------------------------------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------------+
|                        REVIEW API & ADMIN INTERFACE                               |
|                                                                                   |
|  - GET  /api/posts/:id/images  (Ranked suggestions + guard analysis)              |
|  - POST /api/reviews/:id       (Approve / Reject pairing with reviewer notes)     |
|  - GET  /api/reviews           (Audit trail of all human review decisions)        |
|  - GET  /api/batch/costs       (Per-call token usage & USD cost breakdown)        |
|  - HTML/CSS Dashboard          (Visual dashboard at http://localhost:3000)        |
+-----------------------------------------------------------------------------------+
```

---

## 2. Image Metadata Schema

Every ingested image is processed through Gemini Flash with structured schema output enforced via Zod:

```json
{
  "subject": "red fox",
  "category": "animal",
  "attributes": ["orange fur", "bushy tail", "pointed ears", "wild", "forest"],
  "caption": "A red fox with vibrant orange fur standing alert in a forest",
  "confidence": 0.96
}
```

### Schema Rules:
- `subject` *(string, required)*: The primary detected entity.
- `category` *(string, required)*: Broad classification domain (`animal`, `food`, `nature`, `vehicle`, `technology`).
- `attributes` *(array of strings, min 1)*: Visual traits and salient descriptors.
- `caption` *(string, required)*: Descriptive natural language summary.
- `confidence` *(number, 0.0 - 1.0)*: Vision detection certainty. Values `< 0.70` trigger automatic flagging (`is_flagged = 1`).

---

## 3. Semantic Matching Strategy

1. **Embedding Generation**:
   - Image text representations (`${subject} ${category} ${caption} ${attributes.join(' ')}`) are converted to dense vector embeddings using Google's `text-embedding-004` (128-768 dimensions).
   - Blog post content (`${title} ${content} ${category}`) is converted into post vectors on creation.
2. **Vector Cosine Similarity Search**:
   $$\text{similarity}(\vec{u}, \vec{v}) = \frac{\vec{u} \cdot \vec{v}}{\|\vec{u}\|_2 \|\vec{v}\|_2}$$
3. **Conceptual Generalization**:
   - Matches related concepts without literal keyword overlap (e.g., *"Vulpes vulpes"*, *"wild fox species"*, and *"red fox"* map into overlapping vector neighborhoods).

---

## 4. The Mismatch Guard Safety Rules

The safety guard evaluates all candidate recommendations against 3 sequential gates:

1. **Confidence Gate**:
   - Rule: Image vision confidence $\ge 0.70$ and `is_flagged == false`.
   - Failure Reason: `"Low vision classification confidence: <score> (minimum required: 0.70)"`.
2. **Semantic Similarity Gate**:
   - Rule: Cosine similarity score $\ge 0.60$.
   - Failure Reason: `"Semantic similarity <score> is below threshold 0.60"`.
3. **Entity & Concept Contradiction Gate**:
   - Rule: Checks for domain and species contradictions between post intent and image content.
   - Example 1: Post about foxes matched to wolf candidate $\rightarrow$ `"Animal category mismatch: expected fox, detected wolf"`.
   - Example 2: Post about pizza matched to burger candidate $\rightarrow$ `"Food subject mismatch: expected pizza, detected burger"`.
   - Example 3: Post about wildlife matched to car candidate $\rightarrow$ `"Category mismatch: expected animal, detected vehicle"`.

---

## 5. Database Architecture

SQLite with `node:sqlite` provides zero-latency local storage and transactional integrity:

- **`images`**: `(id, filename, filepath, subject, category, caption, confidence, is_flagged, status, created_at)`
- **`tags`**: `(id, image_id, tag)`
- **`image_embeddings`**: `(image_id, embedding, dimensions, created_at)`
- **`posts`**: `(id, title, content, category, created_at)`
- **`post_embeddings`**: `(post_id, embedding, dimensions, created_at)`
- **`batch_jobs`**: `(id, status, total_items, processed_items, failed_items, total_cost, created_at, completed_at)`
- **`batch_tasks`**: `(id, job_id, item_id, item_type, status, retry_count, error_message, cost, updated_at)`
- **`cost_logs`**: `(id, operation, model, input_tokens, output_tokens, image_count, cost_usd, reference_id, created_at)`
- **`suggestions`**: `(id, post_id, image_id, similarity_score, guard_status, guard_reason, created_at)`
- **`reviews`**: `(id, suggestion_id, status, reviewer_notes, reviewed_at)`
