export class CostTracker {
  static calculateCost(model, inputTokens = 0, outputTokens = 0, imageCount = 0) {
    let inputRate = 0.075;
    let outputRate = 0.30;
    let imageTokens = 258;

    if (model === "text-embedding-004") {
      inputRate = 0.02;
      outputRate = 0.0;
      imageTokens = 0;
    }

    const totalInputTokens = inputTokens + (imageCount * imageTokens);
    const inputCost = (totalInputTokens / 1000000) * inputRate;
    const outputCost = (outputTokens / 1000000) * outputRate;
    const totalCost = inputCost + outputCost;

    return {
      model: model,
      inputTokens: totalInputTokens,
      outputTokens: outputTokens,
      imageCount: imageCount,
      inputCost: Number(inputCost.toFixed(8)),
      outputCost: Number(outputCost.toFixed(8)),
      totalCost: Number(totalCost.toFixed(8))
    };
  }

  static estimateTokenCount(text) {
    if (!text) return 0;
    return Math.max(1, Math.ceil(text.length / 4));
  }
}
