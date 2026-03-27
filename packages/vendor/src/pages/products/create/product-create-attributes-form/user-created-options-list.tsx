import { XMarkMini } from "@medusajs/icons"
import { IconButton, Input, Select, Textarea } from "@medusajs/ui"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "@components/common/form"
import { SwitchBox } from "@components/common/switch-box"
import { ChipInput } from "@components/inputs/chip-input"
import { Combobox } from "@components/inputs/combobox"
import { NumericInput } from "../../../../components/inputs/numeric-input"
import { ProductAttribute } from "../../types"
import { ProductCreateSchemaType } from "../types"

type UserCreatedOptionsListProps = {
  form: UseFormReturn<ProductCreateSchemaType>
  options: {
    fields: Array<{ id: string }>
    append: (option: {
      title: string
      values: string[]
      metadata?: Record<string, unknown>
      attributeId?: string
    }) => void
    remove: (index: number) => void
  }
  allowRemove?: boolean
  availableAttributes: ProductAttribute[]
  allNonRequiredAttributes?: ProductAttribute[]
  isExistingProduct?: boolean
  allowCreate?: boolean
}

export const UserCreatedOptionsList = ({
  form,
  options,
  allowRemove = true,
  availableAttributes,
  allNonRequiredAttributes,
  isExistingProduct = false,
  allowCreate = true,
}: UserCreatedOptionsListProps) => {
  const { t } = useTranslation()

  if (options?.fields?.length === 0) {
    return null
  }

  return (
    <ul className="flex flex-col gap-y-4">
      {options.fields.map(({ id }, index) => {
        const attributeLookup =
          allNonRequiredAttributes || availableAttributes
        const selectedAttribute = attributeLookup?.find(
          (attribute) =>
            attribute.id ===
            form.watch(`options.${index}.attributeId`)
        )
        const uiComponent = selectedAttribute?.ui_component
        const possibleValueOptions =
          selectedAttribute?.possible_values.map(({ value }) => ({
            label: value,
            value: value,
          })) ?? []
        const showUseForVariants =
          !selectedAttribute || uiComponent === "multivalue"

        return (
          <li
            className="flex flex-col gap-y-2 rounded-xl border bg-ui-bg-component p-1.5"
            key={id}
          >
            <div className="flex items-center gap-1.5">
              <div className="flex grow flex-col gap-y-2">
                <Form.Field
                  control={form.control}
                  name={`options.${index}.title`}
                  render={({
                    field: { onChange, ...field },
                    fieldState,
                  }) => {
                    return (
                      <Form.Item className="flex flex-row items-start gap-x-1.5 space-y-0 [&>div:last-child]:w-full">
                        <Form.Label className="min-w-[60px] px-2 py-1.5">
                          {t(
                            "products.fields.attributes.add.title.label"
                          )}
                        </Form.Label>
                        <Form.Control>
                          <div className="flex flex-col gap-y-1.5">
                            <Combobox
                              {...field}
                              placeholder={t(
                                "products.fields.attributes.add.title.placeholder"
                              )}
                              aria-invalid={!!fieldState.error}
                              options={[
                                ...(availableAttributes || []).map(
                                  (attribute) => ({
                                    label: attribute.name,
                                    value: attribute.id,
                                  })
                                ),
                              ]}
                              onChange={(v) => {
                                const foundAttribute =
                                  availableAttributes?.find(
                                    (attribute) =>
                                      attribute.id === v
                                  )
                                if (foundAttribute) {
                                  form.setValue(
                                    `options.${index}.values`,
                                    []
                                  )
                                  form.setValue(
                                    `options.${index}.attributeId`,
                                    v as string
                                  )
                                  form.setValue(
                                    `options.${index}.title`,
                                    foundAttribute.name || ""
                                  )
                                  form.setValue(
                                    `options.${index}.metadata`,
                                    { author: "admin" }
                                  )
                                  form.setValue(
                                    `options.${index}.useForVariants`,
                                    false
                                  )
                                  return
                                }
                                form.setValue(
                                  `options.${index}.values`,
                                  []
                                )
                                form.setValue(
                                  `options.${index}.attributeId`,
                                  ""
                                )
                                form.setValue(
                                  `options.${index}.metadata`,
                                  { author: "vendor" }
                                )
                                onChange(v)
                              }}
                              onCreateOption={
                                allowCreate
                                  ? (value) => {
                                      form.setValue(
                                        `options.${index}.title`,
                                        value
                                      )
                                      form.setValue(
                                        `options.${index}.attributeId`,
                                        ""
                                      )
                                      form.setValue(
                                        `options.${index}.metadata`,
                                        { author: "vendor" }
                                      )
                                      form.setValue(
                                        `options.${index}.values`,
                                        []
                                      )
                                    }
                                  : undefined
                              }
                              hideCreateOption
                              className="w-full bg-ui-bg-base hover:bg-ui-bg-base-hover [&>div>input]:px-0 [&>div>input]:placeholder:text-ui-fg-muted"
                              multiple={false}
                              showCheck={false}
                            />
                            <Form.ErrorMessage />
                          </div>
                        </Form.Control>
                      </Form.Item>
                    )
                  }}
                />
                <Form.Field
                  control={form.control}
                  name={`options.${index}.values`}
                  render={({ field: { ...field }, fieldState }) => {
                    const renderInput = () => {
                      if (!selectedAttribute) {
                        return (
                          <ChipInput
                            {...field}
                            variant="contrast"
                            placeholder={t(
                              "products.fields.attributes.add.values.placeholder"
                            )}
                            className="w-full"
                            aria-invalid={!!fieldState.error}
                          />
                        )
                      }

                      if (uiComponent === "select") {
                        return (
                          <Combobox
                            value={field.value[0] ?? ""}
                            onChange={(val) =>
                              field.onChange(
                                val ? [val as string] : []
                              )
                            }
                            options={possibleValueOptions}
                            multiple={false}
                            showCheck={false}
                            aria-invalid={!!fieldState.error}
                            className="w-full bg-ui-bg-base hover:bg-ui-bg-base-hover"
                          />
                        )
                      }

                      if (uiComponent === "text") {
                        return (
                          <Input
                            value={field.value[0] ?? ""}
                            onChange={(e) =>
                              field.onChange([e.target.value])
                            }
                            placeholder={t(
                              "products.fields.attributes.add.values.placeholder"
                            )}
                            className="w-full"
                            aria-invalid={!!fieldState.error}
                          />
                        )
                      }

                      if (uiComponent === "text_area") {
                        return (
                          <Textarea
                            value={field.value[0] ?? ""}
                            onChange={(e) =>
                              field.onChange([e.target.value])
                            }
                            placeholder={t(
                              "products.fields.attributes.add.values.placeholder"
                            )}
                            className="w-full"
                            aria-invalid={!!fieldState.error}
                          />
                        )
                      }

                      if (uiComponent === "toggle") {
                        return (
                          <Select
                            value={field.value[0] ?? ""}
                            onValueChange={(val) =>
                              field.onChange([val])
                            }
                          >
                            <Select.Trigger
                              className="w-full"
                              aria-invalid={!!fieldState.error}
                            >
                              <Select.Value
                                placeholder={t(
                                  "products.fields.attributes.selectValuePlaceholder"
                                )}
                              />
                            </Select.Trigger>
                            <Select.Content>
                              <Select.Item value="true">
                                {t("general.true")}
                              </Select.Item>
                              <Select.Item value="false">
                                {t("general.false")}
                              </Select.Item>
                            </Select.Content>
                          </Select>
                        )
                      }

                      if (uiComponent === "unit") {
                        return (
                          <NumericInput
                            value={
                              field.value[0] !== undefined
                                ? parseFloat(field.value[0])
                                : undefined
                            }
                            onChange={(val) =>
                              field.onChange([
                                String(val ?? ""),
                              ])
                            }
                            placeholder={t(
                              "products.fields.attributes.add.values.placeholder"
                            )}
                            aria-invalid={!!fieldState.error}
                            hideControls
                          />
                        )
                      }

                      return (
                        <Combobox
                          {...field}
                          options={possibleValueOptions}
                          onCreateOption={
                            allowCreate
                              ? (value) => {
                                  form.setValue(
                                    `options.${index}.values`,
                                    [...field.value, value]
                                  )
                                }
                              : undefined
                          }
                          aria-invalid={!!fieldState.error}
                          className="w-full bg-ui-bg-base hover:bg-ui-bg-base-hover"
                        />
                      )
                    }

                    return (
                      <Form.Item className="flex flex-row items-start gap-x-1.5 space-y-0">
                        <Form.Label className="min-w-[60px] px-2 py-1.5">
                          {t(
                            "products.fields.attributes.add.values.label"
                          )}
                        </Form.Label>
                        <Form.Control>
                          <div className="flex w-full flex-col gap-y-1.5">
                            {renderInput()}
                            <Form.ErrorMessage />
                          </div>
                        </Form.Control>
                      </Form.Item>
                    )
                  }}
                />
              </div>
              {allowRemove && (
                <IconButton
                  type="button"
                  size="small"
                  variant="transparent"
                  className="text-ui-fg-muted"
                  onClick={() => options.remove(index)}
                >
                  <XMarkMini />
                </IconButton>
              )}
            </div>
            {showUseForVariants && (
              <SwitchBox
                control={form.control as any}
                name={`options.${index}.useForVariants` as any}
                label={t(
                  "products.fields.attributes.useForVariants.label"
                )}
                description={
                  isExistingProduct
                    ? t(
                        "products.fields.attributes.useForVariants.editDescription"
                      )
                    : t(
                        "products.fields.attributes.useForVariants.description"
                      )
                }
                className="pl-14 [&>*]:shadow-none"
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}
