import { Input, Switch, Textarea } from "@medusajs/ui"
import { AttributeSelect } from "./AttributeSelect"
import { ProductAttribute } from "@custom-types/products"
import { ControllerRenderProps } from "react-hook-form"

export const Components = ({
  attribute,
  field,
}: {
  attribute: ProductAttribute
  field: ControllerRenderProps<any, string>
}) => {
  const { ui_component, possible_values } = attribute

  if (ui_component === "select")
    return <AttributeSelect values={possible_values} field={field} />

  if (ui_component === "toggle")
    return (
      <Switch
        {...field}
        onCheckedChange={field.onChange}
        checked={field.value === "true" || field.value === true}
      />
    )

  if (ui_component === "text_area") return <Textarea {...field} rows={4} />

  if (ui_component === "unit") return <Input type="number" {...field} />

  if (ui_component === "text") return <Input {...field} />

  return <Input {...field} />
}
