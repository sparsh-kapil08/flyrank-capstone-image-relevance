export class MismatchGuard {
  static evaluateRecommendation(post, candidate) {
    const minConfidence = 0.70;
    const minSimilarity = 0.60;

    const reasons = [];
    const checks = {
      confidencePassed: true,
      similarityPassed: true,
      conceptPassed: true
    };

    if (candidate.isFlagged || candidate.confidence < minConfidence) {
      checks.confidencePassed = false;
      reasons.push(`Low vision classification confidence: ${candidate.confidence} (minimum required: ${minConfidence})`);
    }

    if (candidate.similarityScore < minSimilarity) {
      checks.similarityPassed = false;
      reasons.push(`Semantic similarity ${candidate.similarityScore} is below threshold ${minSimilarity}`);
    }

    const postText = `${post.title} ${post.content} ${post.category || ""}`.toLowerCase();
    const imageText = `${candidate.subject} ${candidate.category} ${candidate.caption} ${(candidate.tags || []).join(" ")}`.toLowerCase();

    const animals = ["fox", "wolf", "dog", "bear", "deer", "eagle", "lion"];
    let expectedAnimal = null;
    let detectedAnimal = null;

    for (let animal of animals) {
      if (postText.includes(animal) || (animal === "fox" && postText.includes("vulpes"))) {
        expectedAnimal = animal;
        break;
      }
    }

    for (let animal of animals) {
      if (imageText.includes(animal)) {
        detectedAnimal = animal;
        break;
      }
    }

    if (expectedAnimal && detectedAnimal && expectedAnimal !== detectedAnimal) {
      checks.conceptPassed = false;
      reasons.push(`Animal category mismatch: expected ${expectedAnimal}, detected ${detectedAnimal}`);
    }

    const foods = ["pizza", "burger", "sushi", "pasta", "salad", "coffee", "dessert"];
    let expectedFood = null;
    let detectedFood = null;

    for (let food of foods) {
      if (postText.includes(food)) {
        expectedFood = food;
        break;
      }
    }

    for (let food of foods) {
      if (imageText.includes(food)) {
        detectedFood = food;
        break;
      }
    }

    if (expectedFood && detectedFood && expectedFood !== detectedFood) {
      checks.conceptPassed = false;
      reasons.push(`Food subject mismatch: expected ${expectedFood}, detected ${detectedFood}`);
    }

    const categories = ["animal", "food", "nature", "vehicle", "technology"];
    for (let cat of categories) {
      if (postText.includes(cat) && candidate.category && candidate.category !== "unknown" && candidate.category !== "general") {
        if (cat !== candidate.category.toLowerCase()) {
          checks.conceptPassed = false;
          reasons.push(`Category mismatch: expected ${cat}, detected ${candidate.category}`);
          break;
        }
      }
    }

    const isAccepted = checks.confidencePassed && checks.similarityPassed && checks.conceptPassed;

    let explanation = "";
    if (isAccepted) {
      explanation = `Passed safety checks: confidence ${candidate.confidence}, similarity ${candidate.similarityScore}, and concept matches "${candidate.subject}"`;
    } else {
      explanation = reasons.join("; ");
    }

    return {
      status: isAccepted ? "ACCEPTED" : "REJECTED",
      score: candidate.similarityScore,
      confidence: candidate.confidence,
      reasons: reasons,
      explanation: explanation,
      checks: checks
    };
  }
}
