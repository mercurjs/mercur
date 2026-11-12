import { Input } from "@medusajs/ui"
import { useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "../../../../components/common/form"

type AttributeValidationFieldValues = {
  validation_pattern?: string
  validation_message?: string
}

export const AttributeValidationFields = () => {
  const { t } = useTranslation()
  const form = useFormContext<AttributeValidationFieldValues>()

  return (
    <div
      className="flex flex-col gap-y-4"
      data-testid="attribute-validation-fields"
    >
      <Form.Field
        control={form.control}
        name="validation_pattern"
        render={({ field }) => (
          <Form.Item>
            <Form.Label optional>{t("attributes.fields.pattern")}</Form.Label>
            <Form.Control>
              <Input
                {...field}
                value={field.value ?? ""}
                className="font-mono"
                autoComplete="off"
                data-testid="attribute-validation-pattern-input"
              />
            </Form.Control>
            <Form.Hint>{t("attributes.fields.patternHint")}</Form.Hint>
            <Form.ErrorMessage />
          </Form.Item>
        )}
      />
      <Form.Field
        control={form.control}
        name="validation_message"
        render={({ field }) => (
          <Form.Item>
            <Form.Label optional>
              {t("attributes.fields.patternMessage")}
            </Form.Label>
            <Form.Control>
              <Input
                {...field}
                value={field.value ?? ""}
                autoComplete="off"
                data-testid="attribute-validation-message-input"
              />
            </Form.Control>
            <Form.Hint>{t("attributes.fields.patternMessageHint")}</Form.Hint>
            <Form.ErrorMessage />
          </Form.Item>
        )}
      />
    </div>
  )
}
