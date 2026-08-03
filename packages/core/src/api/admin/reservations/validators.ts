import { z } from "zod"
import { AdminGetReservationsParams as MedusaAdminGetReservationsParams } from "@medusajs/medusa/api/admin/reservations/validators"

export type AdminGetReservationsParamsType = z.infer<
  typeof AdminGetReservationsParams
>

// Extend the native reservation list params with the marketplace filters the
// Figma list exposes: free-text SKU and a Store (seller) select.
export const AdminGetReservationsParams =
  MedusaAdminGetReservationsParams.merge(
    z.object({
      sku: z.string().optional(),
      seller_id: z.union([z.string(), z.array(z.string())]).optional(),
    })
  )
