export type FormField = {
  key: string
  id: string
  name: string
  handle: string
  ui_component:
    | "select"
    | "multivalue"
    | "unit"
    | "toggle"
    | "text"
    | "text_area"
    | "color_picker"
  is_required: boolean
  description?: string
  possible_values: Array<{ value: string; label: string }>
}

export type ProcessedAttributes = {
  required: {
    categorySpecific: FormField[]
    global: FormField[]
    all: FormField[]
  }
}

export const processAttributes = (
  allAttributes:
    | Array<{
        id: string
        name: string
        handle: string
        ui_component: string
        is_required: boolean
        description?: string
        product_categories?: Array<{ id: string; name: string }>
        possible_values?: Array<{ id: string; value: string }>
      }>
    | undefined,
  primaryCategoryId: string | undefined
): ProcessedAttributes => {
  if (!allAttributes || allAttributes.length === 0) {
    return {
      required: {
        categorySpecific: [],
        global: [],
        all: [],
      },
    }
  }

  const globalAttributes = allAttributes.filter(
    (attr) =>
      !attr.product_categories ||
      attr.product_categories.length === 0
  )

  const categorySpecificAttributes = allAttributes.filter(
    (attr) =>
      attr.product_categories && attr.product_categories.length > 0
  )

  const applicableCategoryAttributes =
    categorySpecificAttributes.filter((attr) =>
      attr.product_categories?.some(
        (cat) => cat.id === primaryCategoryId
      )
    )

  const mapToFormField = (attr: (typeof allAttributes)[number]): FormField => ({
    key: attr.id,
    id: attr.id,
    name: attr.name,
    handle: attr.handle || attr.id,
    ui_component: attr.ui_component as FormField["ui_component"],
    is_required: attr.is_required,
    description: attr.description,
    possible_values:
      attr.possible_values?.map((value) => ({
        value: value.id,
        label: value.value,
      })) || [],
  })

  const requiredCategorySpecificFormFields: FormField[] =
    applicableCategoryAttributes
      .filter((attr) => attr.is_required)
      .map(mapToFormField)

  const requiredGlobalFormFields: FormField[] = globalAttributes
    .filter((attr) => attr.is_required)
    .map(mapToFormField)

  return {
    required: {
      categorySpecific: requiredCategorySpecificFormFields,
      global: requiredGlobalFormFields,
      all: [
        ...requiredCategorySpecificFormFields,
        ...requiredGlobalFormFields,
      ],
    },
  }
}
