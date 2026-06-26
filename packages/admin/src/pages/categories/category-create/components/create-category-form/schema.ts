import i18n from "i18next"
import { z } from "zod"

export const CategoryMediaSchema = z.object({
  url: z.string(),
  file: z.any().nullable(), // File
  is_thumbnail: z.boolean(),
  is_banner: z.boolean(),
  field_id: z.string().optional(),
})

export const CategoryIconSchema = z.object({
  url: z.string(),
  file: z.any().nullable(), // File
})

export const CreateCategoryDetailsSchema = z.object({
  name: z.string().min(1, { message: i18n.t("categories.validation.titleRequired") }),
  description: z.string().optional(),
  handle: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  visibility: z.enum(["public", "internal"]),
  media: z.array(CategoryMediaSchema).optional(),
  icon: CategoryIconSchema.nullable().optional(),
})

export type CreateCategorySchema = z.infer<typeof CreateCategorySchema>
export const CreateCategorySchema = z
  .object({
    rank: z.number().nullable(),
    parent_category_id: z.string().nullable(),
  })
  .merge(CreateCategoryDetailsSchema)
