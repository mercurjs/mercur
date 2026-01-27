import { z } from "zod"
import { createSelectParams } from "@medusajs/medusa/api/utils/validators"

export type StoreCheckoutCartParamsType = z.infer<typeof StoreCheckoutCartParams>
export const StoreCheckoutCartParams = createSelectParams()
