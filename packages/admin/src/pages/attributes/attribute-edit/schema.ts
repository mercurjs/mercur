import { z } from "zod"
import { AttributeType } from "@mercurjs/types"

export const ATTRIBUTE_TYPE_OPTIONS = [
  AttributeType.SINGLE_SELECT,
  AttributeType.MULTI_SELECT,
  AttributeType.UNIT,
  AttributeType.TOGGLE,
  AttributeType.TEXT,
] as const

export const CreateAttributeSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().max(250).optional(),
    handle: z.string().optional(),
    is_filterable: z.boolean().default(false),
    is_required: z.boolean().default(false),
    is_variant_axis: z.boolean().default(false),
    is_global: z.boolean().default(true),
    type: z
      .enum([
        AttributeType.SINGLE_SELECT,
        AttributeType.MULTI_SELECT,
        AttributeType.UNIT,
        AttributeType.TOGGLE,
        AttributeType.TEXT,
      ])
      .default(AttributeType.SINGLE_SELECT),
    values: z
      .array(
        z.object({
          name: z.string(),
          rank: z.number(),
          metadata: z.record(z.string()).optional(),
        })
      )
      .optional(),
    category_ids: z.array(z.string()).optional(),
    metadata: z.record(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      [AttributeType.SINGLE_SELECT, AttributeType.MULTI_SELECT].includes(
        data.type
      ) &&
      !(data.values ?? []).some((value) => value.name.trim().length > 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "attributes.create.possibleValuesRequired",
        path: ["values"],
      })
    }
    if (!data.is_global && (data.category_ids ?? []).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "attributes.create.categoriesRequired",
        path: ["category_ids"],
      })
    }
  })

export const UpdateAttributeSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().max(250).optional(),
  handle: z.string().optional(),
  is_filterable: z.boolean().optional(),
  is_required: z.boolean().optional(),
  values: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        rank: z.number(),
        metadata: z.record(z.string()).optional(),
      })
    )
    .optional(),
  category_ids: z.array(z.string()).optional(),
  metadata: z.record(z.string()).optional(),
})

export const UpdatePossibleValueSchema = z.object({
  name: z.string().min(1),
  rank: z.number().min(0).optional(),
})
