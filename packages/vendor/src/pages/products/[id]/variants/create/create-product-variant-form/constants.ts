import i18next from "i18next"
import { z } from "zod"

export const CreateProductVariantSchema = z.object({
  title: z.string().min(1, i18next.t("products.variant.validation.titleRequired")),
  sku: z.string().optional(),
  options: z
    .record(z.string().min(1, i18next.t("products.variant.validation.optionRequired")))
    .optional(),
})
