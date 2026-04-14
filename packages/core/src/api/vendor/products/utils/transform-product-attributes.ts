import {
  AttributeSource,
  AttributeUIComponent,
  InformationalAttributeDTO,
  InformationalAttributeValueDTO,
} from "@mercurjs/types"

interface AttributeValueWithAttribute {
  id: string
  value: string
  source: AttributeSource
  attribute: {
    id: string
    name: string
    ui_component: string
    source: AttributeSource
    is_filterable: boolean
    is_required: boolean
  }
}

interface ProductOption {
  id: string
  title: string
  values?: { id: string; value: string }[]
}

interface ProductWithAttributes {
  attribute_values?: AttributeValueWithAttribute[]
  options?: ProductOption[]
  [key: string]: unknown
}

interface AttributeAccumulator {
  attribute_id: string
  name: string
  ui_component: AttributeUIComponent
  attribute_source: AttributeSource
  is_filterable: boolean
  is_required: boolean
  values: InformationalAttributeValueDTO[]
}

function transformAttributeValues(
  attributeValues: AttributeValueWithAttribute[]
): InformationalAttributeDTO[] {
  const existingAttributeValues = attributeValues.filter(
    (av) => av && av.attribute
  )
  if (existingAttributeValues.length === 0) {
    return []
  }

  const attributeMap = new Map<string, AttributeAccumulator>()

  for (const av of existingAttributeValues) {
    const attributeId = av.attribute.id
    const existing = attributeMap.get(attributeId)

    const isValueFilterable =
      av.attribute.source === AttributeSource.ADMIN &&
      av.attribute.is_filterable &&
      av.source === AttributeSource.ADMIN

    const isEditable = av.source === AttributeSource.VENDOR

    const valueDto: InformationalAttributeValueDTO = {
      value: av.value,
      source: av.source,
      attribute_value_id: av.id,
      is_filterable: isValueFilterable,
      is_editable: isEditable,
    }

    if (existing) {
      existing.values.push(valueDto)
    } else {
      attributeMap.set(attributeId, {
        attribute_id: attributeId,
        name: av.attribute.name,
        ui_component: av.attribute.ui_component as AttributeUIComponent,
        attribute_source: av.attribute.source,
        is_filterable: av.attribute.is_filterable,
        is_required: av.attribute.is_required,
        values: [valueDto],
      })
    }
  }

  const result: InformationalAttributeDTO[] = []

  for (const acc of attributeMap.values()) {
    const isDefinitionEditable =
      acc.attribute_source === AttributeSource.VENDOR

    result.push({
      attribute_id: acc.attribute_id,
      name: acc.name,
      ui_component: acc.ui_component,
      attribute_source: acc.attribute_source,
      is_filterable: acc.is_filterable,
      is_required: acc.is_required,
      is_definition_editable: isDefinitionEditable,
      values: acc.values,
    })
  }

  return result
}

export function transformProductWithInformationalAttributes<
  T extends ProductWithAttributes,
>(
  product: T
): T & { informational_attributes: InformationalAttributeDTO[] } {
  const optionTitles = new Set(
    (product.options ?? []).map((option) => option.title.toLowerCase())
  )

  const filteredAttributeValues = (product.attribute_values ?? []).filter(
    (av) =>
      av &&
      av.attribute &&
      !optionTitles.has(av.attribute.name.toLowerCase())
  )

  const informationalAttributes =
    transformAttributeValues(filteredAttributeValues)

  return {
    ...product,
    informational_attributes: informationalAttributes,
  }
}

export function transformProductsWithInformationalAttributes<
  T extends ProductWithAttributes,
>(
  products: T[]
): (T & { informational_attributes: InformationalAttributeDTO[] })[] {
  return products.map((product) =>
    transformProductWithInformationalAttributes(product)
  )
}
