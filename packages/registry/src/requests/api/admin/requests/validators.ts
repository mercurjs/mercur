import { z } from "zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import { RequestStatus } from "../../../types"

export type AdminGetRequestsParamsType = z.infer<typeof AdminGetRequestsParams>
export const AdminGetRequestsParams = createFindParams({
  offset: 0,
  limit: 50,
}).extend({
  request_status: z
    .union([z.nativeEnum(RequestStatus), z.array(z.nativeEnum(RequestStatus))])
    .optional(),
  submitter_id: z.union([z.string(), z.array(z.string())]).optional(),
})

export type AdminReviewNoteType = z.infer<typeof AdminReviewNote>
export const AdminReviewNote = z.object({
  reviewer_note: z.string().optional(),
})
