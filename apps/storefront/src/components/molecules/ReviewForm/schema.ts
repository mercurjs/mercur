import { z } from "zod"

export const reviewSchema = z.object({
  sellerId: z.string(),
  rating: z.number().min(1, "Please rate this seller").max(5),
  opinion: z
    .string()
    .max(300, "Opinion must be less than 300 characters")
    .optional(),
})

export type ReviewFormData = z.infer<typeof reviewSchema>
