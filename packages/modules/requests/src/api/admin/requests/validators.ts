import { z } from 'zod';

import { createFindParams } from '@medusajs/medusa/api/utils/validators';

/**
 * Schema for date filtering with operator support.
 * Handles JSON string parsing for query parameters.
 */
const dateFilterSchema = z
  .preprocess(
    (val) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return val;
        }
      }
      return val;
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
  .optional();

const orderSchema = z
  .enum(['created_at', '-created_at', 'updated_at', '-updated_at'])
  .optional();

export type AdminGetRequestsParamsType = z.infer<typeof AdminGetRequestsParams>;
export const AdminGetRequestsParams = createFindParams({
  offset: 0,
  limit: 50,
  order: '-created_at'
}).extend({
  type: z
    .enum([
      'product_collection',
      'product_collection_update',
      'product_category',
      'product',
      'product_import',
      'seller',
      'review_remove',
      'product_type',
      'product_tag',
      'product_update'
    ])
    .optional(),
  status: z.enum(['accepted', 'rejected', 'pending']).optional(),
  seller_id: z.string().optional(),
  created_at: dateFilterSchema,
  order: orderSchema,
  q: z.string().optional()
});

/**
 * @schema AdminReviewRequest
 * title: "Update Request"
 * description: "A schema for the admin review of request."
 * x-resourceId: AdminReviewRequest
 * type: object
 * properties:
 *   reviewer_note:
 *     type: string
 *     description: Reviewer note.
 *   status:
 *     type: string
 *     enum: [accepted,rejected]
 *     description: A status of the request
 */
export type AdminReviewRequestType = z.infer<typeof AdminReviewRequest>;
export const AdminReviewRequest = z.object({
  status: z.enum(['accepted', 'rejected']),
  reviewer_note: z.string()
});
