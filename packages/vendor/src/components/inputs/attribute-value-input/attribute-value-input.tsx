import { Input, Select, Textarea } from "@medusajs/ui"
import { AttributeType } from "@mercurjs/types"
import { useTranslation } from "react-i18next"

import { Combobox } from "../combobox"

type AttributeValueInputProps = {
  type: AttributeType | string
  value: string | string[]
  onChange: (value: string | string[]) => void
  availableValues?: { id: string; name: string }[]
  placeholder?: string
}

export const AttributeValueInput = ({
  type,
  value,
  onChange,
  availableValues = [],
  placeholder,
}: AttributeValueInputProps) => {
  const { t } = useTranslation()
  const ph = placeholder ?? t("products.create.attributes.valuePlaceholder")

  switch (type) {
    case AttributeType.MULTI_SELECT:
      return (
        <Combobox
          value={Array.isArray(value) ? value : []}
          onChange={(val) => onChange(val ?? [])}
          options={availableValues.map((v) => ({
            value: v.name,
            label: v.name,
          }))}
          placeholder={t("products.create.attributes.selectValues")}
        />
      )

    case AttributeType.SINGLE_SELECT:
      return (
        <Select
          value={typeof value === "string" ? value : value?.[0] ?? ""}
          onValueChange={onChange}
        >
          <Select.Trigger>
            <Select.Value
              placeholder={t("products.create.attributes.selectValues")}
            />
          </Select.Trigger>
          <Select.Content>
            {availableValues.map((v) => (
              <Select.Item key={v.id} value={v.name}>
                {v.name}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      )

    case AttributeType.TOGGLE:
      return (
        <Select
          value={typeof value === "string" ? value : value?.[0] ?? ""}
          onValueChange={onChange}
        >
          <Select.Trigger>
            <Select.Value
              placeholder={t("products.create.attributes.selectValues")}
            />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="true">{t("filters.radio.yes")}</Select.Item>
            <Select.Item value="false">{t("filters.radio.no")}</Select.Item>
          </Select.Content>
        </Select>
      )

    case AttributeType.TEXT:
      return (
        <Textarea
          className="bg-ui-bg-field-component hover:bg-ui-bg-field-component-hover"
          value={typeof value === "string" ? value : value?.[0] ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={ph}
        />
      )

    default:
      return (
        <Input
          className="bg-ui-bg-field-component hover:bg-ui-bg-field-component-hover"
          value={typeof value === "string" ? value : value?.[0] ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={ph}
        />
      )
  }
}
