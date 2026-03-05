import { RadioGroup } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { Form } from "../../../../../components/common/form"
import { useTabbedForm } from "../../../../../components/tabbed-form/tabbed-form"
import { defineTabMeta } from "../../../../../components/tabbed-form/types"
import { useDocumentDirection } from "../../../../../hooks/use-document-direction"
import { CreatePromotionSchemaType } from "./form-schema"
import { templates } from "./templates"

const Root = () => {
  const { t } = useTranslation()
  const direction = useDocumentDirection()
  const form = useTabbedForm<CreatePromotionSchemaType>()

  return (
    <div className="flex size-full flex-col items-center">
      <div className="w-full max-w-[720px] py-16">
        <Form.Field
          control={form.control}
          name="template_id"
          render={({ field }) => {
            return (
              <Form.Item data-testid="promotion-create-form-template-item">
                <Form.Label data-testid="promotion-create-form-template-label">
                  {t("promotions.fields.type")}
                </Form.Label>

                <Form.Control data-testid="promotion-create-form-template-control">
                  <RadioGroup
                    dir={direction}
                    key="template_id"
                    className="flex-col gap-y-3"
                    {...field}
                    onValueChange={field.onChange}
                    data-testid="promotion-create-form-template-radio-group"
                  >
                    {templates.map((template) => {
                      return (
                        <RadioGroup.ChoiceBox
                          key={template.id}
                          value={template.id}
                          label={template.title}
                          description={template.description}
                          data-testid={`promotion-create-form-template-option-${template.id}`}
                        />
                      )
                    })}
                  </RadioGroup>
                </Form.Control>
                <Form.ErrorMessage data-testid="promotion-create-form-template-error" />
              </Form.Item>
            )
          }}
        />
      </div>
    </div>
  )
}

Root._tabMeta = defineTabMeta<CreatePromotionSchemaType>({
  id: "type",
  labelKey: "promotions.tabs.template",
  validationFields: ["template_id"],
})

export const PromotionTemplateTab = Root
