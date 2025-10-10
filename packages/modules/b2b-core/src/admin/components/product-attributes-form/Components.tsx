import { Input, Switch, Textarea } from "@medusajs/ui"
import { AttributeSelect } from "./AttributeSelect"


export const Components = ({
  attribute,
  field,
}: {
  attribute: any
  field: any
}) => {
  const { ui_component, possible_values } = attribute



  if (ui_component === "select")
    return <AttributeSelect values={possible_values} field={field} />

  if (ui_component === "toggle")
    return (
      <Switch
        name={field.name}
        onCheckedChange={(value) => {
          field.onChange({
            target: {
              name: field.name,
              value: value,
            },
          })
        }}
        checked={field.value === "true" || field.value === true}
      />
    )

  if (ui_component === "text_area") return <Textarea {...field} rows={4} />

  if (ui_component === "unit") return <Input type="number" {...field} />

  if (ui_component === "text") return <Input {...field} />

  return <Input {...field} />
}
