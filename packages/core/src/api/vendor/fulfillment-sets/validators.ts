import { z } from "zod"
import { createSelectParams } from "@medusajs/medusa/api/utils/validators"

export type VendorServiceZoneParamsType = z.infer<typeof VendorServiceZoneParams>
export const VendorServiceZoneParams = createSelectParams()
