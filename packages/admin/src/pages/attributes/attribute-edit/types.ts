import { z } from "zod"
import {
  createAttributeSchema,
  UpdateAttributeSchema,
  UpdatePossibleValueSchema,
} from "./schema"

export type CreateAttributeFormValues = z.infer<
  ReturnType<typeof createAttributeSchema>
>
export type UpdateAttributeFormValues = z.infer<typeof UpdateAttributeSchema>
export type UpdatePossibleValueFormValues = z.infer<
  typeof UpdatePossibleValueSchema
>
