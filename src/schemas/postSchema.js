import { z } from "zod";

export const postSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  content: z.string().min(3),
  category: z.string().optional(),
  tags: z.array(z.string()).default([])
});

export function validatePost(data) {
  const result = postSchema.safeParse(data);
  if (!result.success) {
    const errors = [];
    for (let err of result.error.errors) {
      errors.push(err.path.join(".") + ": " + err.message);
    }
    return { isValid: false, errors: errors, data: null };
  }
  return { isValid: true, errors: [], data: result.data };
}
