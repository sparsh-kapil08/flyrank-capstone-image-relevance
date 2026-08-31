export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let sumA = 0;
  let sumB = 0;
  const length = Math.min(vecA.length, vecB.length);

  for (let i = 0; i < length; i++) {
    dotProduct += vecA[i] * vecB[i];
    sumA += vecA[i] * vecA[i];
    sumB += vecB[i] * vecB[i];
  }

  const magnitude = Math.sqrt(sumA) * Math.sqrt(sumB);
  if (magnitude === 0) {
    return 0;
  }

  const similarity = dotProduct / magnitude;
  return Number(similarity.toFixed(6));
}

export function serializeVector(vector) {
  return JSON.stringify(vector);
}

export function deserializeVector(vectorStr) {
  if (!vectorStr) return [];
  if (Array.isArray(vectorStr)) return vectorStr;
  try {
    return JSON.parse(vectorStr);
  } catch (e) {
    return [];
  }
}
