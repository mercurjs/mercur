import { z } from "zod";

enum AttributeUIComponent {
  SELECT = "select",
  MULTIVALUE = "multivalue",
  UNIT = "unit",
  TOGGLE = "toggle",
  TEXTAREA = "text_area",
  COLOR_PICKER = "color_picker",
}

export type AdminUpdateAttributeValueType = z.infer<
  typeof AdminUpdateAttributeValue
>;
export const AdminUpdateAttributeValue = z.object({
  id: z.string().optional(),
  value: z.string().optional(),
  rank: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type AdminCreateAttributeValueType = z.infer<
  typeof AdminCreateAttributeValue
>;
export const AdminCreateAttributeValue = z.object({
  value: z.string().min(1),
  rank: z.number(),
  metadata: z.record(z.unknown()).optional(),
});

export type AdminUpdateAttributeType = z.infer<typeof AdminUpdateAttribute>;
export const AdminUpdateAttribute = z
  .object({
    name: z.string().optional(),
    description: z.string().max(250, { message: "Description must be at most 250 characters" }).optional(),
    handle: z.string().optional(),
    is_filterable: z.boolean().optional(),
    is_required: z.boolean().optional(),
    metadata: z.record(z.unknown()).optional(),
    ui_component: z.nativeEnum(AttributeUIComponent).optional(),
    product_category_ids: z.array(z.string()).optional(),
    possible_values: z.array(AdminUpdateAttributeValue).optional(),
  })
  .strict();

export type AdminCreateAttributeType = z.infer<typeof CreateAttribute>;
export const CreateAttribute = z
  .object({
    name: z.string().min(1),
    description: z.string().max(250, { message: "Description must be at most 250 characters" }).optional(),
    is_filterable: z.boolean().optional(),
    is_required: z.boolean().optional(),
    ui_component: z
      .nativeEnum(AttributeUIComponent)
      .default(AttributeUIComponent.SELECT),
    handle: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
    possible_values: z.array(AdminCreateAttributeValue).optional(),
    product_category_ids: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    // Require possible_values for SELECT and MULTIVALUE ui_components
    if (
      (data.ui_component === AttributeUIComponent.SELECT ||
        data.ui_component === AttributeUIComponent.MULTIVALUE) &&
      (!data.possible_values || data.possible_values.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one possible value is required for this type",
        path: ["possible_values"],
      });
    }
  });

export const CreateAttributeFormSchema = CreateAttribute;
