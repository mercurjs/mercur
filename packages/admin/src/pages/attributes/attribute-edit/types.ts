import { z } from "zod"
import {
  CreateAttributeSchema,
  UpdateAttributeSchema,
  UpdatePossibleValueSchema,
} from "./schema"

export type CreateAttributeFormValues = z.infer<typeof CreateAttributeSchema>
export type UpdateAttributeFormValues = z.infer<typeof UpdateAttributeSchema>
export type UpdatePossibleValueFormValues = z.infer<
  typeof UpdatePossibleValueSchema
>
