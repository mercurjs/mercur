import { z } from "zod"
import {
  createAttributeSchema,
  createUpdateAttributeSchema,
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
export type EditAttributeFormValues = z.infer<
  ReturnType<typeof createUpdateAttributeSchema>
>
