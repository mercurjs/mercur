import { XMarkMini } from "@medusajs/icons"
import {
  Button,
  Heading,
  Hint,
  IconButton,
  Input,
  Label,
  Switch,
  Text,
  Textarea,
} from "@medusajs/ui"
import { Controller, useFieldArray } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "../../../../../components/common/form"
import { ChipInput } from "../../../../../components/inputs/chip-input"
import { useTabbedForm } from "../../../../../components/tabbed-form/tabbed-form"
import { defineTabMeta } from "../../../../../components/tabbed-form/types"
import { ProductCreateSchemaType } from "../../types"

const Root = () => {
  const { t } = useTranslation()
  const form = useTabbedForm<ProductCreateSchemaType>()

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "attributes",
  })

  const handleCreateNew = () => {
    append({
      attribute_id: undefined,
      title: "",
      values: [],
      is_custom: true,
      use_for_variants: false,
    })
  }

  return (
    <div
      className="flex flex-col items-center p-16"
      data-testid="product-create-attributes-form"
    >
      <div className="flex w-full max-w-[720px] flex-col gap-y-8">
        <div>
          <Heading level="h2">
            {t("products.create.attributes.header")}
          </Heading>
          <Text
            size="small"
            className="text-ui-fg-subtle mt-1 whitespace-pre-line"
          >
            {t("products.create.attributes.description")}
          </Text>
        </div>

        <div className="flex items-center gap-x-2">
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={handleCreateNew}
            data-testid="product-create-attributes-create-new"
          >
            {t("products.create.attributes.createNew")}
          </Button>
        </div>

        {fields.length > 0 && (
          <ul
            className="flex flex-col gap-y-4"
            data-testid="product-create-attributes-list"
          >
            {fields.map((field, index) => {
              const useForVariants = form.watch(
                `attributes.${index}.use_for_variants`
              )

              return (
              <li
                key={field.id}
                className="bg-ui-bg-component shadow-elevation-card-rest grid grid-cols-[1fr_28px] items-start gap-1.5 rounded-xl p-1.5"
                data-testid={`product-create-attribute-row-${index}`}
              >
                <div className="grid grid-cols-[min-content,1fr] items-center gap-1.5">
                  <div className="flex items-center px-2 py-1.5">
                    <Label
                      size="xsmall"
                      weight="plus"
                      className="text-ui-fg-subtle"
                      htmlFor={`attributes.${index}.title`}
                    >
                      {t("fields.title")}
                    </Label>
                  </div>
                  <Input
                    className="bg-ui-bg-field-component hover:bg-ui-bg-field-component-hover"
                    {...form.register(
                      `attributes.${index}.title` as const
                    )}
                    placeholder={t(
                      "products.create.attributes.titlePlaceholder"
                    )}
                    data-testid={`product-create-attribute-title-${index}`}
                  />
                  <div className="flex items-center px-2 py-1.5">
                    <Label
                      size="xsmall"
                      weight="plus"
                      className="text-ui-fg-subtle"
                      htmlFor={`attributes.${index}.values`}
                    >
                      {t("fields.values")}
                    </Label>
                  </div>
                  <Controller
                    control={form.control}
                    name={`attributes.${index}.values` as const}
                    render={({ field: { onChange, value, ...field } }) =>
                      useForVariants ? (
                        <ChipInput
                          {...field}
                          variant="contrast"
                          value={Array.isArray(value) ? value : []}
                          onChange={onChange}
                          placeholder={t(
                            "products.create.attributes.valuePlaceholder"
                          )}
                          data-testid={`product-create-attribute-values-${index}`}
                        />
                      ) : (
                        <Textarea
                          {...field}
                          className="bg-ui-bg-field-component hover:bg-ui-bg-field-component-hover"
                          value={
                            Array.isArray(value)
                              ? value[0] ?? ""
                              : value ?? ""
                          }
                          onChange={(e) => onChange(e.target.value)}
                          placeholder={t(
                            "products.create.attributes.valuePlaceholder"
                          )}
                          data-testid={`product-create-attribute-values-${index}`}
                        />
                      )
                    }
                  />
                  <div />
                  <Form.Field
                    control={form.control}
                    name={`attributes.${index}.use_for_variants`}
                    render={({
                      field: { value, onChange, ...field },
                    }) => (
                      <Form.Item>
                        <div
                          className="flex items-start gap-x-3 py-1.5"
                          data-testid={`product-create-attribute-use-for-variants-${index}`}
                        >
                          <Form.Control>
                            <Switch
                              className="rtl:rotate-180"
                              checked={value}
                              onCheckedChange={onChange}
                              {...field}
                            />
                          </Form.Control>
                          <div className="flex flex-col">
                            <Label size="xsmall" weight="plus">
                              {t(
                                "products.create.attributes.useForVariants"
                              )}
                            </Label>
                            <Hint className="!txt-small">
                              {t(
                                "products.create.attributes.useForVariantsDescription"
                              )}
                            </Hint>
                          </div>
                        </div>
                      </Form.Item>
                    )}
                  />
                </div>
                <IconButton
                  type="button"
                  size="small"
                  variant="transparent"
                  className="text-ui-fg-muted"
                  onClick={() => remove(index)}
                  data-testid={`product-create-attribute-remove-${index}`}
                >
                  <XMarkMini />
                </IconButton>
              </li>
              )
            })}
          </ul>
        )}

        <RequiredAttributesHint />
      </div>
    </div>
  )
}

const RequiredAttributesHint = () => {
  const { t } = useTranslation()

  return (
    <div data-testid="product-create-attributes-required-hint">
      <Text size="small" weight="plus">
        {t("products.create.attributes.requiredAttributes")}
      </Text>
      <Text size="small" className="text-ui-fg-subtle">
        {t("products.create.attributes.requiredAttributesHint")}
      </Text>
    </div>
  )
}

Root._tabMeta = defineTabMeta<ProductCreateSchemaType>({
  id: "attributes",
  labelKey: "products.create.tabs.attributes",
  validationFields: ["attributes"],
})

export const ProductCreateAttributesForm = Root
