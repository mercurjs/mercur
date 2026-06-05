import { z } from "zod"

type TranslationFunction = (key: string, options?: any) => string

export const createAttributeValidationSchema = (
  attributes: Array<{
    handle: string
    ui_component: string
    is_required: boolean
    name: string
  }>,
  t: TranslationFunction
) => {
  const attributeFields: Record<string, z.ZodTypeAny> = {}

  attributes.forEach((attr) => {
    const fieldName = attr.handle
    const isRequired = attr.is_required

    switch (attr.ui_component) {
      case "select":
        attributeFields[fieldName] = isRequired
          ? z.string().min(1, t("products.fields.attributes.validation.required", { name: attr.name }))
          : z.string().optional()
        break
      case "multivalue":
        attributeFields[fieldName] = isRequired
          ? z.array(z.string()).min(1, t("products.fields.attributes.validation.required", { name: attr.name }))
          : z.array(z.string()).optional()
        attributeFields[`${fieldName}UseForVariants`] = z.boolean().optional()
        break
      case "text":
      case "text_area":
        attributeFields[fieldName] = isRequired
          ? z.string().min(1, t("products.fields.attributes.validation.required", { name: attr.name }))
          : z.string().optional()
        break
      case "toggle":
        attributeFields[fieldName] = isRequired
          ? z.boolean().refine((val) => val === true, {
              message: t("products.fields.attributes.validation.required", { name: attr.name }),
            })
          : z.boolean().optional()
        break
      case "unit":
        attributeFields[fieldName] = isRequired
          ? z.number().min(0, t("products.fields.attributes.validation.required", { name: attr.name }))
          : z.number().optional()
        break
      default:
        attributeFields[fieldName] = isRequired
          ? z.string().min(1, t("products.fields.attributes.validation.required", { name: attr.name }))
          : z.string().optional()
        break
    }
  })

  return z.object(attributeFields)
}

export const createAttributeValidationRules = (
  attributes: Array<{
    handle: string
    ui_component: string
    is_required: boolean
    name: string
  }>,
  t: TranslationFunction
): Record<
  string,
  { required?: string; validate: (value: unknown) => boolean | string }
> => {
  const rules: Record<
    string,
    {
      required?: string
      validate: (value: unknown) => boolean | string
    }
  > = {}

  attributes.forEach((attr) => {
    const fieldName = attr.handle
    const isRequired = attr.is_required

    if (isRequired) {
      switch (attr.ui_component) {
        case "select":
        case "toggle":
          rules[fieldName] = {
            required: t("products.fields.attributes.validation.requiredSelect"),
            validate: (value: unknown) => {
              if (typeof value !== "string" || !value || value === "") {
                return t("products.fields.attributes.validation.requiredSelect")
              }
              return true
            },
          }
          break
        case "text":
        case "text_area":
        case "color_picker":
          rules[fieldName] = {
            required: t("products.fields.attributes.validation.requiredEnter"),
            validate: (value: unknown) => {
              if (typeof value !== "string" || !value || value === "") {
                return t("products.fields.attributes.validation.requiredEnter")
              }
              return true
            },
          }
          break
        case "multivalue":
          rules[fieldName] = {
            required: t("products.fields.attributes.validation.requiredSelectMultiple"),
            validate: (value: unknown) => {
              if (!Array.isArray(value) || value.length === 0) {
                return t("products.fields.attributes.validation.requiredSelectMultiple")
              }
              return true
            },
          }
          break
        case "unit":
          rules[fieldName] = {
            required: t("products.fields.attributes.validation.requiredEnter"),
            validate: (value: unknown) => {
              if (value === undefined || value === null || value === "") {
                return t("products.fields.attributes.validation.requiredEnter")
              }
              return true
            },
          }
          break
        default:
          rules[fieldName] = {
            required: t("products.fields.attributes.validation.requiredEnter"),
            validate: (value: unknown) => {
              if (typeof value !== "string" || !value || value === "") {
                return t("products.fields.attributes.validation.requiredEnter")
              }
              return true
            },
          }
          break
      }
    }
  })

  return rules
}
