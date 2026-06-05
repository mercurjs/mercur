import { z } from "zod"
import { createSelectParams } from "@medusajs/medusa/api/utils/validators"

export type StoreCompleteCartParamsType = z.infer<typeof StoreCompleteCartParams>
export const StoreCompleteCartParams = createSelectParams()
