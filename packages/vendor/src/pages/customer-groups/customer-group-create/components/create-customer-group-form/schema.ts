import i18n from "i18next"
import * as zod from "zod"

export const CreateCustomerGroupSchema = zod.object({
  name: zod
    .string()
    .min(1, { message: i18n.t("customerGroups.validation.nameRequired") }),
})

export type CreateCustomerGroupSchemaType = zod.infer<
  typeof CreateCustomerGroupSchema
>
