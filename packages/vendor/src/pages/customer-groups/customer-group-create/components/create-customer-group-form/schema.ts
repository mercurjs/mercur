import * as zod from "zod"

export const CreateCustomerGroupSchema = zod.object({
  name: zod.string().min(1),
})

export type CreateCustomerGroupSchemaType = zod.infer<
  typeof CreateCustomerGroupSchema
>
