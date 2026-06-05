import { Select, Textarea } from "@medusajs/ui"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "@components/common/form"
import { SwitchBox } from "@components/common/switch-box"
import { Combobox } from "@components/inputs/combobox"
import { MultiSelect } from "../../../../components/inputs/multi-select"
import { NumericInput } from "../../../../components/inputs/numeric-input"
import { ProductCreateSchemaType } from "../types"

type RequiredAttributesListProps = {
  form: UseFormReturn<ProductCreateSchemaType>
  fields: any[]
  validationRules: Record<string, any>
}

export const RequiredAttributesList = ({
  form,
  fields,
  validationRules,
}: RequiredAttributesListProps) => {
  const { t } = useTranslation()

  return (
    <>
      {fields.map((field: any) => (
        <div key={field.id} className="flex flex-col gap-y-4">
          {field.ui_component === "select" && (
            <Form.Field
              control={form.control}
              name={field.handle as any}
              rules={validationRules[field.handle] || {}}
              render={({ field: formField, fieldState }) => (
                <Form.Item>
                  <Form.Label optional={!field.is_required}>
                    {field.name}
                  </Form.Label>
                  {field.description && (
                    <p className="txt-compact-small !my-1 text-ui-fg-subtle">
                      {field.description}
                    </p>
                  )}
                  <Form.Control>
                    <Combobox
                      {...formField}
                      options={field.possible_values}
                      aria-invalid={!!fieldState.error}
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          )}

          {field.ui_component === "multivalue" && (
            <div className="flex flex-col gap-y-2">
              <Form.Field
                control={form.control}
                name={field.handle as any}
                rules={validationRules[field.handle] || {}}
                render={({ field: formField, fieldState }) => (
                  <Form.Item>
                    <Form.Label optional={!field.is_required}>
                      {field.name}
                    </Form.Label>
                    {field.description && (
                      <p className="txt-compact-small mb-1 text-ui-fg-subtle">
                        {field.description}
                      </p>
                    )}
                    <Form.Control>
                      <MultiSelect
                        value={formField.value}
                        onChange={formField.onChange}
                        name={formField.name}
                        options={field.possible_values}
                        showSearch={true}
                        aria-invalid={!!fieldState.error}
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <SwitchBox
                control={form.control as any}
                name={`${field.handle}UseForVariants` as any}
                label={t(
                  "products.fields.attributes.useForVariants.label"
                )}
                description={t(
                  "products.fields.attributes.useForVariants.description"
                )}
              />
            </div>
          )}

          {field.ui_component === "text_area" && (
            <Form.Field
              control={form.control}
              name={field.handle as any}
              rules={validationRules[field.handle] || {}}
              render={({ field: formField, fieldState }) => (
                <Form.Item>
                  <Form.Label optional={!field.is_required}>
                    {field.name}
                  </Form.Label>
                  {field.description && (
                    <p className="txt-compact-small !my-1 text-ui-fg-subtle">
                      {field.description}
                    </p>
                  )}
                  <Form.Control>
                    <Textarea
                      {...formField}
                      placeholder={t(
                        "products.fields.attributes.enterValuePlaceholder"
                      )}
                      aria-invalid={!!fieldState.error}
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          )}

          {field.ui_component === "toggle" && (
            <Form.Field
              control={form.control}
              name={field.handle as any}
              rules={validationRules[field.handle] || {}}
              render={({ field: formField, fieldState }) => (
                <Form.Item>
                  <Form.Label optional={!field.is_required}>
                    {field.name}
                  </Form.Label>
                  {field.description && (
                    <p className="txt-compact-small !my-1 text-ui-fg-subtle">
                      {field.description}
                    </p>
                  )}
                  <Form.Control>
                    <Select
                      {...formField}
                      onValueChange={formField.onChange}
                      value={formField.value}
                    >
                      <Select.Trigger
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
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          )}

          {field.ui_component === "unit" && (
            <Form.Field
              control={form.control}
              name={field.handle as any}
              rules={validationRules[field.handle] || {}}
              render={({ field: formField, fieldState }) => (
                <Form.Item>
                  <Form.Label optional={!field.is_required}>
                    {field.name}
                  </Form.Label>
                  {field.description && (
                    <p className="txt-compact-small !my-1 text-ui-fg-subtle">
                      {field.description}
                    </p>
                  )}
                  <Form.Control>
                    <NumericInput
                      value={formField.value}
                      onChange={formField.onChange}
                      onBlur={formField.onBlur}
                      name={formField.name}
                      placeholder={t(
                        "products.fields.attributes.enterValuePlaceholder"
                      )}
                      aria-invalid={!!fieldState.error}
                      hideControls
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          )}
        </div>
      ))}
    </>
  )
}
