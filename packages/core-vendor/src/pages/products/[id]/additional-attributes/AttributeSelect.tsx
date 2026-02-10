import { Select } from "@medusajs/ui"
import { ProductAttributePossibleValue } from "@custom-types/products"
import { ControllerRenderProps } from "react-hook-form"

export const AttributeSelect = ({
  values,
  field,
}: {
  values: ProductAttributePossibleValue[]
  field: ControllerRenderProps<any, string>
}) => {
  const handleChange = (value: string) => {
    field.onChange(value)
  }

  return (
    <Select onValueChange={(value) => handleChange(value)} value={field.value}>
      <Select.Trigger className="bg-ui-bg-base">
        <Select.Value placeholder="Select value" />
      </Select.Trigger>
      <Select.Content>
        {values.map(({ id, attribute_id, value }) => (
          <Select.Item
            key={`select-option-${attribute_id}-${id}`}
            value={value}
          >
            {value}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  )
}
