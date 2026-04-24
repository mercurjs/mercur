import { UIMatch } from "react-router-dom"
import { useProductAttribute } from "../../../hooks/api"

type AttributeDetailBreadcrumbProps = UIMatch<unknown>

export const AttributeDetailBreadcrumb = (
  props: AttributeDetailBreadcrumbProps
) => {
  const { id } = props.params || {}

  const { product_attribute: attribute } = useProductAttribute(id!, undefined, {
    initialData: props.data as any,
    enabled: Boolean(id),
  })

  if (!attribute) {
    return null
  }

  return <span>{attribute.name}</span>
}
