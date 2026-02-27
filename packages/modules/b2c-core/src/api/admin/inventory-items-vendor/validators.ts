import { z } from "zod"
import { booleanString, applyAndAndOrOperators } from "@medusajs/medusa/api/utils/common-validators/common"
import { createSelectParams, createOperatorMap, createFindParams } from "@medusajs/medusa/api/utils/validators"

export type AdminGetInventoryItemParamsType = z.infer<
    typeof AdminGetInventoryItemParams
>
export const AdminGetInventoryItemParams = createSelectParams()

export const AdminGetInventoryItemsParamsFields = z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    sku: z.union([z.string(), z.array(z.string())]).optional(),
    origin_country: z.union([z.string(), z.array(z.string())]).optional(),
    mid_code: z.union([z.string(), z.array(z.string())]).optional(),
    hs_code: z.union([z.string(), z.array(z.string())]).optional(),
    material: z.union([z.string(), z.array(z.string())]).optional(),
    requires_shipping: booleanString().optional(),
    weight: createOperatorMap(z.number(), parseFloat).optional(),
    length: createOperatorMap(z.number(), parseFloat).optional(),
    height: createOperatorMap(z.number(), parseFloat).optional(),
    width: createOperatorMap(z.number(), parseFloat).optional(),
    location_levels: z
        .object({
            location_id: z.union([z.string(), z.array(z.string())]).optional(),
        })
        .optional(),
    seller: z.object({
        id: z.union([z.string(), z.array(z.string())]).optional(),
    }).optional()
})

export type AdminGetInventoryItemsParamsType = z.infer<
    typeof AdminGetInventoryItemsParams
>
export const AdminGetInventoryItemsParams = createFindParams({
    limit: 20,
    offset: 0,
})
    .merge(AdminGetInventoryItemsParamsFields)
    .merge(applyAndAndOrOperators(AdminGetInventoryItemsParamsFields))
    .strict()
