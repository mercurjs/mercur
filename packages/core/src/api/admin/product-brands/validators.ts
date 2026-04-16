import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
  WithAdditionalData,
} from "@medusajs/medusa/api/utils/validators"
import {
  applyAndAndOrOperators,
  booleanString,
} from "@medusajs/medusa/api/utils/common-validators/common"
import { AdditionalData } from "@medusajs/framework/types"

export type AdminGetProductBrandParamsType = z.infer<
  typeof AdminGetProductBrandParams
>
export const AdminGetProductBrandParams = createSelectParams()

const AdminProductBrandsParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  name: z.union([z.string(), z.array(z.string())]).optional(),
  handle: z.union([z.string(), z.array(z.string())]).optional(),
  is_restricted: booleanString().optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
})

export type AdminGetProductBrandsParamsType = z.infer<
  typeof AdminGetProductBrandsParams
>
export const AdminGetProductBrandsParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(AdminProductBrandsParamsFields)
  .merge(applyAndAndOrOperators(AdminProductBrandsParamsFields))

export type AdminCreateProductBrandType = z.infer<
  typeof CreateProductBrand
> & AdditionalData
const CreateProductBrand = z.object({
  name: z.string(),
  handle: z.string().optional(),
  is_restricted: z.boolean().optional().default(false),
  metadata: z.record(z.unknown()).nullish(),
})
export const AdminCreateProductBrand = WithAdditionalData(CreateProductBrand)

export type AdminUpdateProductBrandType = z.infer<
  typeof UpdateProductBrand
> & AdditionalData
const UpdateProductBrand = z.object({
  name: z.string().optional(),
  handle: z.string().optional(),
  is_restricted: z.boolean().optional(),
  metadata: z.record(z.unknown()).nullish(),
})
export const AdminUpdateProductBrand = WithAdditionalData(UpdateProductBrand)
