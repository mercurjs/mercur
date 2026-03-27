import { z } from "zod"

export const AttributeUIComponent = {
  SELECT: "select",
  MULTIVALUE: "multivalue",
  UNIT: "unit",
  TOGGLE: "toggle",
  TEXTAREA: "text_area",
} as const

export const CreateAttributeSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().max(250).optional(),
    handle: z.string().optional(),
    is_filterable: z.boolean().default(false),
    is_required: z.boolean().default(false),
    ui_component: z
      .enum(["select", "multivalue", "unit", "toggle", "text_area"])
      .default("select"),
    possible_values: z
      .array(
        z.object({
          value: z.string().min(1),
          rank: z.number(),
          metadata: z.record(z.string()).optional(),
        })
      )
      .optional(),
    product_category_ids: z.array(z.string()).optional(),
    metadata: z.record(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      ["select", "multivalue"].includes(data.ui_component) &&
      (!data.possible_values || data.possible_values.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one possible value is required for this type.",
        path: ["possible_values"],
      })
    }
  })

export const UpdateAttributeSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().max(250).optional(),
  handle: z.string().optional(),
  is_filterable: z.boolean().optional(),
  is_required: z.boolean().optional(),
  ui_component: z
    .enum(["select", "multivalue", "unit", "toggle", "text_area"])
    .optional(),
  possible_values: z
    .array(
      z.object({
        id: z.string().optional(),
        value: z.string().min(1),
        rank: z.number(),
        metadata: z.record(z.string()).optional(),
      })
    )
    .optional(),
  product_category_ids: z.array(z.string()).optional(),
  metadata: z.record(z.string()).optional(),
})

export const UpdatePossibleValueSchema = z.object({
  value: z.string().min(1),
  rank: z.number().min(0).optional(),
  metadata: z.record(z.string()).optional(),
})
