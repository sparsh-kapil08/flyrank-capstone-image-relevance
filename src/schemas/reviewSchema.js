import { z } from "zod";

export const reviewSchema = z.object({
  suggestionId: z.string().min(1),
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewerNotes: z.string().optional().default("")
});

export function validateReview(data) {
  const result = reviewSchema.safeParse(data);
  if (!result.success) {
    const errors = [];
    for (let err of result.error.errors) {
      errors.push(err.path.join(".") + ": " + err.message);
    }
    return { isValid: false, errors: errors, data: null };
  }
  return { isValid: true, errors: [], data: result.data };
}
