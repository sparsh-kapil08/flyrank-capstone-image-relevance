import { z } from "zod";

export const imageMetadataSchema = z.object({
  subject: z.string().min(1),
  category: z.string().min(1),
  attributes: z.array(z.string()).min(1),
  caption: z.string().min(1),
  confidence: z.number().min(0).max(1)
});

export const imageIngestSchema = z.object({
  id: z.string().optional(),
  filename: z.string().min(1),
  filepath: z.string().min(1),
  mimetype: z.string().default("image/jpeg")
});

export function validateImageMetadata(data) {
  const result = imageMetadataSchema.safeParse(data);
  if (!result.success) {
    const errors = [];
    for (let err of result.error.errors) {
      errors.push(err.path.join(".") + ": " + err.message);
    }
    return { isValid: false, errors: errors, data: null };
  }
  return { isValid: true, errors: [], data: result.data };
}
