import { Input, Textarea } from "@medusajs/ui"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "../../../../../../../components/common/form"
import { HandleInput } from "../../../../../../../components/inputs/handle-input"
import { ProductCreateSchemaType } from "../../../../types"

type ProductCreateGeneralSectionProps = {
  form: UseFormReturn<ProductCreateSchemaType>
}

export const ProductCreateGeneralSection = ({
  form,
}: ProductCreateGeneralSectionProps) => {
  const { t } = useTranslation()

  return (
    <div id="general" className="flex flex-col gap-y-6" data-testid="product-create-general-section">
      <div className="flex flex-col gap-y-2" data-testid="product-create-general-section-fields">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3" data-testid="product-create-general-section-title-fields">
          <Form.Field
            control={form.control}
            name="title"
            render={({ field }) => {
              return (
                <Form.Item data-testid="product-create-general-section-title-item">
                  <Form.Label data-testid="product-create-general-section-title-label">{t("products.fields.title.label")}</Form.Label>
                  <Form.Control data-testid="product-create-general-section-title-control">
                    <Input {...field} placeholder={t("products.fields.title.placeholder")} data-testid="product-create-general-section-title-input" />
                  </Form.Control>
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="subtitle"
            render={({ field }) => {
              return (
                <Form.Item data-testid="product-create-general-section-subtitle-item">
                  <Form.Label optional data-testid="product-create-general-section-subtitle-label">
                    {t("products.fields.subtitle.label")}
                  </Form.Label>
                  <Form.Control data-testid="product-create-general-section-subtitle-control">
                    <Input {...field} placeholder={t("products.fields.subtitle.placeholder")} data-testid="product-create-general-section-subtitle-input" />
                  </Form.Control>
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="handle"
            render={({ field }) => {
              return (
                <Form.Item data-testid="product-create-general-section-handle-item">
                  <Form.Label
                    tooltip={t("products.fields.handle.tooltip")}
                    optional
                    data-testid="product-create-general-section-handle-label"
                  >
                    {t("fields.handle")}
                  </Form.Label>
                  <Form.Control data-testid="product-create-general-section-handle-control">
                    <HandleInput {...field} placeholder={t("products.fields.handle.placeholder")} data-testid="product-create-general-section-handle-input" />
                  </Form.Control>
                </Form.Item>
              )
            }}
          />
        </div>
      </div>
      <Form.Field
        control={form.control}
        name="description"
        render={({ field }) => {
          return (
            <Form.Item data-testid="product-create-general-section-description-item">
              <Form.Label optional data-testid="product-create-general-section-description-label">
                {t("products.fields.description.label")}
              </Form.Label>
              <Form.Control data-testid="product-create-general-section-description-control">
                <Textarea {...field} placeholder={t("products.fields.description.placeholder")} data-testid="product-create-general-section-description-input" />
              </Form.Control>
            </Form.Item>
          )
        }}
      />
    </div>
  )
}
