let allImages = [];
let allPosts = [];
let currentPostId = null;

window.addEventListener("DOMContentLoaded", () => {
  loadMetrics();
  loadPosts();
  loadImages();
  loadReviews();
  loadBatchJobs();
});

function switchTab(tabId) {
  const buttons = document.querySelectorAll(".tab-btn");
  const tabs = document.querySelectorAll(".tab-content");

  for (let b of buttons) b.classList.remove("active");
  for (let t of tabs) t.classList.remove("active");

  event.target.classList.add("active");
  document.getElementById(tabId).classList.add("active");

  if (tabId === "tab-reviews") loadReviews();
  if (tabId === "tab-images") loadImages();
  if (tabId === "tab-batch") loadBatchJobs();
}

async function loadMetrics() {
  try {
    const imgRes = await fetch("/api/images");
    const imgData = await imgRes.json();
    if (imgData.success) {
      allImages = imgData.images;
      let flaggedCount = 0;
      for (let img of allImages) {
        if (img.isFlagged) flaggedCount++;
      }
      document.getElementById("metric-total-images").innerText = allImages.length;
      document.getElementById("metric-flagged-images").innerText = flaggedCount + " flagged low-confidence";
    }

    const costRes = await fetch("/api/batch/costs");
    const costData = await costRes.json();
    if (costData.success) {
      document.getElementById("metric-total-cost").innerText = "$" + costData.totalUsd.toFixed(6);
      document.getElementById("metric-total-calls").innerText = costData.totalCalls + " API calls tracked";
      renderCostBreakdown(costData.breakdown);
    }
  } catch (err) {
    console.error(err);
  }
}

async function loadPosts() {
  try {
    const res = await fetch("/api/posts");
    const data = await res.json();
    if (data.success) {
      allPosts = data.posts;
      const select = document.getElementById("post-selector");
      select.innerHTML = `<option value="">-- Select an evaluation post --</option>`;
      for (let p of allPosts) {
        select.innerHTML += `<option value="${p.id}">${p.title} (${p.category})</option>`;
      }
    }
  } catch (err) {
    console.error(err);
  }
}

function onPostSelectChange() {
  const selectedId = document.getElementById("post-selector").value;
  if (!selectedId) return;

  const post = allPosts.find(p => p.id === selectedId);
  if (post) {
    currentPostId = post.id;
    document.getElementById("custom-title").value = post.title;
    document.getElementById("custom-content").value = post.content;
  }
}

async function executePostMatching() {
  const title = document.getElementById("custom-title").value.trim();
  const content = document.getElementById("custom-content").value.trim();

  if (!title || !content) {
    alert("Please enter title and content");
    return;
  }

  let postId = currentPostId;

  if (!postId || !allPosts.some(p => p.id === postId && p.title === title)) {
    const createRes = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, category: "general" })
    });
    const createData = await createRes.json();
    if (!createData.success) {
      alert("Failed to create post");
      return;
    }
    postId = createData.post.id;
    await loadPosts();
  }

  const res = await fetch("/api/posts/" + postId + "/images");
  const data = await res.json();
  if (!data.success) {
    alert("Matching failed");
    return;
  }

  renderMatchingResults(data);
}

function renderMatchingResults(data) {
  document.getElementById("matching-results-container").style.display = "block";
  document.getElementById("matching-status-banner").innerText = data.statusMessage;

  const list = document.getElementById("candidates-list");
  list.innerHTML = "";

  for (let cand of data.candidates) {
    const isAccepted = cand.guardStatus === "ACCEPTED";
    const tagsHtml = (cand.image.tags || []).map(t => `<span class="tag-pill">${t}</span>`).join("");

    list.innerHTML += `
      <div class="candidate-card ${isAccepted ? "accepted" : "rejected"}">
        <img class="candidate-img" src="/data/images/${cand.image.filename}" alt="${cand.image.subject}">
        <div class="candidate-body">
          <div class="candidate-header">
            <div class="candidate-subject">${cand.image.subject}</div>
            <span class="badge badge-${isAccepted ? "accepted" : "rejected"}">${cand.guardStatus}</span>
          </div>
          <div class="candidate-caption">${cand.image.caption}</div>
          <div style="margin-bottom: 10px;">${tagsHtml}</div>
          
          <div class="guard-box ${isAccepted ? "accepted" : "rejected"}">
            <div><strong>Similarity:</strong> ${cand.similarityScore} | <strong>Conf:</strong> ${cand.confidence}</div>
            <div style="margin-top: 4px;"><strong>Guard Reason:</strong> ${cand.guardReason}</div>
          </div>

          <div class="review-actions">
            <button class="btn btn-success" style="flex: 1; padding: 6px;" onclick="submitReview('${cand.suggestionId}', 'APPROVED')">Approve</button>
            <button class="btn btn-danger" style="flex: 1; padding: 6px;" onclick="submitReview('${cand.suggestionId}', 'REJECTED')">Reject</button>
          </div>
        </div>
      </div>
    `;
  }
}

async function submitReview(suggestionId, status) {
  const notes = prompt("Enter reviewer notes:", status === "APPROVED" ? "Approved match" : "Rejected mismatch");
  if (notes === null) return;

  const res = await fetch("/api/reviews/" + suggestionId, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: status, reviewerNotes: notes })
  });
  const data = await res.json();
  if (data.success) {
    alert("Review saved: " + status);
    loadReviews();
  }
}

async function loadReviews() {
  const res = await fetch("/api/reviews");
  const data = await res.json();
  const tbody = document.getElementById("reviews-table-body");

  if (!data.success || data.reviews.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No reviews yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  for (let r of data.reviews) {
    const isApproved = r.review_status === "APPROVED";
    tbody.innerHTML += `
      <tr>
        <td><span class="badge badge-${isApproved ? "accepted" : "rejected"}">${r.review_status}</span></td>
        <td><strong>${r.post_title}</strong></td>
        <td>${r.image_subject} (${r.image_id})</td>
        <td>${r.similarity_score}</td>
        <td><small>${r.guard_reason}</small></td>
        <td>${r.reviewer_notes || "-"}</td>
        <td>${new Date(r.reviewed_at).toLocaleTimeString()}</td>
      </tr>
    `;
  }
}

async function loadImages() {
  const res = await fetch("/api/images");
  const data = await res.json();
  if (data.success) {
    allImages = data.images;
    renderImageGallery(allImages);
  }
}

function filterImagesByCategory() {
  const cat = document.getElementById("image-category-filter").value;
  if (cat === "all") {
    renderImageGallery(allImages);
  } else {
    const filtered = allImages.filter(img => img.category?.toLowerCase() === cat);
    renderImageGallery(filtered);
  }
}

function renderImageGallery(images) {
  const container = document.getElementById("image-gallery-container");
  container.innerHTML = "";

  for (let img of images) {
    const tagsHtml = (img.tags || []).map(t => `<span class="tag-pill">${t}</span>`).join("");
    container.innerHTML += `
      <div class="image-item">
        <img src="/data/images/${img.filename}" alt="${img.subject}">
        <div class="image-item-details">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <strong style="text-transform: capitalize;">${img.subject}</strong>
            <span class="badge ${img.isFlagged ? "badge-flagged" : "badge-accepted"}">${img.isFlagged ? "FLAGGED" : "VALIDATED"}</span>
          </div>
          <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">${img.caption}</div>
          <div style="font-size: 11px; margin-bottom: 6px;"><strong>Category:</strong> ${img.category} | <strong>Conf:</strong> ${img.confidence}</div>
          <div>${tagsHtml}</div>
        </div>
      </div>
    `;
  }
}

async function loadBatchJobs() {
  const res = await fetch("/api/batch/jobs");
  const data = await res.json();
  const tbody = document.getElementById("batch-jobs-table-body");

  if (data.success && data.jobs.length > 0) {
    tbody.innerHTML = "";
    for (let j of data.jobs) {
      tbody.innerHTML += `
        <tr>
          <td><code>${j.id}</code></td>
          <td><span class="badge badge-${j.status === "COMPLETED" ? "accepted" : "flagged"}">${j.status}</span></td>
          <td>${j.total_items}</td>
          <td>${j.processed_items}</td>
          <td>${j.failed_items}</td>
          <td>$${Number(j.total_cost || 0).toFixed(6)}</td>
          <td>${new Date(j.created_at).toLocaleTimeString()}</td>
        </tr>
      `;
    }
  }
}

function renderCostBreakdown(breakdown = []) {
  const tbody = document.getElementById("cost-breakdown-table-body");
  tbody.innerHTML = "";

  if (breakdown.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No cost logs recorded yet.</td></tr>`;
    return;
  }

  for (let item of breakdown) {
    tbody.innerHTML += `
      <tr>
        <td><code>${item.model}</code></td>
        <td>${item.operation}</td>
        <td>${item.call_count}</td>
        <td>${item.total_input_tokens || 0}</td>
        <td>${item.total_output_tokens || 0}</td>
        <td>$${Number(item.total_usd || 0).toFixed(6)}</td>
      </tr>
    `;
  }
}

async function triggerBatchProcessing() {
  const res = await fetch("/api/batch/process-all", { method: "POST" });
  const data = await res.json();
  if (data.success) {
    alert("Batch job started: " + data.job.jobId);
    setTimeout(() => {
      loadMetrics();
      loadBatchJobs();
      loadImages();
    }, 1000);
  }
}
