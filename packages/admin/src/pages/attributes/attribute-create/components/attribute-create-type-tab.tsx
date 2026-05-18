import { Heading, Select, Text } from "@medusajs/ui"
import { useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { AttributeType } from "@mercurjs/types"
import { Form } from "../../../../components/common/form"
import { SwitchBox } from "../../../../components/common/switch-box"
import { useTabbedForm } from "../../../../components/tabbed-form/tabbed-form"
import { defineTabMeta } from "../../../../components/tabbed-form/types"
import { ATTRIBUTE_TYPE_OPTIONS } from "../../attribute-edit/schema"
import { PossibleValuesList } from "./possible-values-list"

type AttributeCreateFormValues = {
  type: string
  is_variant_axis: boolean
  values?: { name: string; rank: number }[]
}

const ATTRIBUTE_TYPE_LABELS: Record<string, string> = {
  [AttributeType.SINGLE_SELECT]: "attributes.type.select",
  [AttributeType.MULTI_SELECT]: "attributes.type.multivalue",
  [AttributeType.UNIT]: "attributes.type.unit",
  [AttributeType.TOGGLE]: "attributes.type.toggle",
  [AttributeType.TEXT]: "attributes.type.text_area",
}

const Root = () => {
  const { t } = useTranslation()
  const form = useTabbedForm<AttributeCreateFormValues>()

  const type = useWatch({ control: form.control, name: "type" })

  const showValues =
    type === AttributeType.SINGLE_SELECT ||
    type === AttributeType.MULTI_SELECT

  return (
    <div
      className="flex flex-col items-center p-16"
      data-testid="attribute-create-type-tab"
    >
      <div className="flex w-full max-w-[720px] flex-col gap-y-8">
        <div>
          <Heading level="h2">{t("attributes.fields.type")}</Heading>
          <Text size="small" className="text-ui-fg-subtle mt-1">
            {t(
              "attributes.create.typeDescription",
              "Select the type of this attribute and define its values."
            )}
          </Text>
        </div>

        <Form.Field
          control={form.control}
          name="type"
          render={({ field }) => (
            <Form.Item data-testid="attribute-create-type-field">
              <Form.Label>{t("attributes.fields.type")}</Form.Label>
              <Form.Control>
                <Select
                  value={field.value as string}
                  onValueChange={field.onChange}
                  data-testid="attribute-create-type-select"
                >
                  <Select.Trigger data-testid="attribute-create-type-trigger">
                    <Select.Value
                      placeholder={t(
                        "attributes.fields.typePlaceholder",
                        "Select Type"
                      )}
                    />
                  </Select.Trigger>
                  <Select.Content>
                    {ATTRIBUTE_TYPE_OPTIONS.map((option) => (
                      <Select.Item
                        key={option}
                        value={option}
                        data-testid={`attribute-create-type-option-${option}`}
                      >
                        {t(ATTRIBUTE_TYPE_LABELS[option] ?? option)}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />

        {showValues && (
          <div data-testid="attribute-create-values-section">
            <PossibleValuesList />
          </div>
        )}

        {type === AttributeType.MULTI_SELECT && (
          <SwitchBox
            control={form.control}
            name="is_variant_axis"
            label={t("attributes.fields.isVariantAxis", "Use for Variants")}
            description={t(
              "attributes.fields.isVariantAxisHint",
              "If checked, this attribute can be used to create product variants."
            )}
            data-testid="attribute-create-variant-axis-switch"
          />
        )}
      </div>
    </div>
  )
}

Root._tabMeta = defineTabMeta<AttributeCreateFormValues>({
  id: "type",
  labelKey: "attributes.create.tabs.type",
  validationFields: ["type", "values"],
})

export const AttributeCreateTypeTab = Root
