import { z } from "zod"

import {
  AdminGetStockLocationsParams as MedusaAdminGetStockLocationsParams,
} from "@medusajs/medusa/api/admin/stock-locations/validators"

export type AdminGetCustomStockLocationsParamsType = z.infer<
  typeof AdminGetCustomStockLocationsParams
>

export const AdminGetCustomStockLocationsParams =
  MedusaAdminGetStockLocationsParams.merge(
    z.object({
      /**
       * Controls whether the endpoint returns only admin stock locations (default),
       * only vendor stock locations, or both.
       */
      stock_location_scope: z.enum(["admin", "vendor", "all"]).optional(),
    })
  )


