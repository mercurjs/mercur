import { z } from "zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

export const AdminGetReservationsParamsFields = z.object({
    id: z.union([z.string(), z.array(z.string())]).optional(),
    location_id: z.union([z.string(), z.array(z.string())]).optional(),
    inventory_item_id: z.union([z.string(), z.array(z.string())]).optional(),
    line_item_id: z.union([z.string(), z.array(z.string())]).optional(),
    seller: z.object({
        id: z.union([z.string(), z.array(z.string())]).optional(),
    }).optional()
})

export type AdminGetReservationsParamsType = z.infer<
    typeof AdminGetReservationsParams
>
export const AdminGetReservationsParams = createFindParams({
    limit: 20,
    offset: 0,
}).merge(AdminGetReservationsParamsFields).strict()

