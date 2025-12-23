import { z } from 'zod'

export const IdAssociation = z.object({
  id: z.string()
})

/**
 * Schema for date filtering with operator support.
 * Handles JSON string parsing for query parameters.
 */
export const dateFilterSchema = z
  .preprocess(
    (val) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val)
        } catch {
          return val
        }
      }
      return val
    },
    z
      .object({
        $gte: z.string().optional(),
        $lte: z.string().optional(),
        $gt: z.string().optional(),
        $lt: z.string().optional(),
        $eq: z.string().optional(),
        $ne: z.string().optional()
      })
      .optional()
  )
  .optional()