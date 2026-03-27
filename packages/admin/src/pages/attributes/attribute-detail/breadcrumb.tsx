import { UIMatch } from "react-router-dom"
import { useAttribute } from "../../../hooks/api"

type AttributeDetailBreadcrumbProps = UIMatch<unknown>

export const AttributeDetailBreadcrumb = (
  props: AttributeDetailBreadcrumbProps
) => {
  const { id } = props.params || {}

  const { attribute } = useAttribute(id!, undefined, {
    initialData: props.data as any,
    enabled: Boolean(id),
  })

  if (!attribute) {
    return null
  }

  return <span>{attribute.name}</span>
}
