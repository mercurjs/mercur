import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
  WithAdditionalData,
} from "@medusajs/medusa/api/utils/validators"
import { AdditionalData } from "@medusajs/framework/types"

export type AdminCollectionParamsType = z.infer<typeof AdminCollectionParams>
export const AdminCollectionParams = createSelectParams()

const AdminCollectionsParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  title: z.union([z.string(), z.array(z.string())]).optional(),
  handle: z.union([z.string(), z.array(z.string())]).optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
  deleted_at: createOperatorMap().optional(),
})

export type AdminCollectionsParamsType = z.infer<typeof AdminCollectionsParams>
export const AdminCollectionsParams = createFindParams({
  offset: 0,
  limit: 20,
}).merge(AdminCollectionsParamsFields)

const CollectionMedia = z.object({
  url: z.string(),
  is_thumbnail: z.boolean().optional(),
  is_banner: z.boolean().optional(),
  rank: z.number().optional(),
})

export type AdminCreateCollectionType = z.infer<typeof CreateCollection> &
  AdditionalData
const CreateCollection = z.object({
  title: z.string(),
  handle: z.string().optional(),
  metadata: z.record(z.unknown()).nullish(),
  media: z.array(CollectionMedia).optional(),
  icon: z.string().nullish(),
})
export const AdminCreateCollection = WithAdditionalData(CreateCollection)

export type AdminUpdateCollectionType = z.infer<typeof UpdateCollection> &
  AdditionalData
const UpdateCollection = z.object({
  title: z.string().optional(),
  handle: z.string().optional(),
  metadata: z.record(z.unknown()).nullish(),
  media: z.array(CollectionMedia).optional(),
  icon: z.string().nullish(),
})
export const AdminUpdateCollection = WithAdditionalData(UpdateCollection)
