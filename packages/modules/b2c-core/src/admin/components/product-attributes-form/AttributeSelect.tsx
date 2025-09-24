import { Select } from "@medusajs/ui"

export const AttributeSelect = ({
  values,
  field,
}: {
  values: any[]
  field: any
}) => {
  const handleChange = (value: string) => {
    field.onChange({
      target: {
        name: field.name,
        value: value,
      },
    })
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
