import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Input } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { HttpTypes } from "@medusajs/types"
import { Form } from "../../../../../components/common/form"
import { ChipInput } from "../../../../../components/inputs/chip-input"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useUpdateProductOption } from "../../../../../hooks/api/products"

type EditProductOptionFormProps = {
  option: HttpTypes.AdminProductOption
}

const CreateProductOptionSchema = z.object({
  title: z.string().min(1),
  values: z.array(z.string()).optional(),
})

export const CreateProductOptionForm = ({
  option,
}: EditProductOptionFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<z.infer<typeof CreateProductOptionSchema>>({
    defaultValues: {
      title: option.title,
      values: option.values.map((v: any) => v.value),
    },
    resolver: zodResolver(CreateProductOptionSchema),
  })

  const { mutateAsync, isPending } = useUpdateProductOption(
    option.product_id!,
    option.id
  )

  const handleSubmit = form.handleSubmit(async (values) => {
    mutateAsync(
      {
        id: option.id,
        ...values,
      },
      {
        onSuccess: () => {
          handleSuccess()
        },
      }
    )
  })

  return (
    <RouteDrawer.Form form={form} data-testid="product-edit-option-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
        data-testid="product-edit-option-keybound-form"
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-4 overflow-auto" data-testid="product-edit-option-form-body">
          <Form.Field
            control={form.control}
            name="title"
            render={({ field }) => {
              return (
                <Form.Item data-testid="product-edit-option-form-title-item">
                  <Form.Label data-testid="product-edit-option-form-title-label">
                    {t("products.fields.options.optionTitle")}
                  </Form.Label>
                  <Form.Control data-testid="product-edit-option-form-title-control">
                    <div data-testid="product-edit-option-form-title-input-wrapper">
                      <Input
                        {...field}
                        placeholder={t(
                          "products.fields.options.optionTitlePlaceholder"
                        )}
                        data-testid="product-edit-option-form-title-input"
                      />
                    </div>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="product-edit-option-form-title-error" />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="values"
            render={({ field: { ...field } }) => {
              return (
                <Form.Item data-testid="product-edit-option-form-values-item">
                  <Form.Label data-testid="product-edit-option-form-values-label">
                    {t("products.fields.options.variations")}
                  </Form.Label>
                  <Form.Control data-testid="product-edit-option-form-values-control">
                    <div data-testid="product-edit-option-form-values-chip-input-wrapper">
                      <ChipInput
                        {...field}
                        placeholder={t(
                          "products.fields.options.variantionsPlaceholder"
                        )}
                        data-testid="product-edit-option-form-values-chip-input"
                      />
                    </div>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="product-edit-option-form-values-error" />
                </Form.Item>
              )
            }}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer data-testid="product-edit-option-form-footer">
          <div className="flex items-center justify-end gap-x-2" data-testid="product-edit-option-form-footer-actions">
            <RouteDrawer.Close asChild data-testid="product-edit-option-form-cancel-button-wrapper">
              <Button variant="secondary" size="small" data-testid="product-edit-option-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button type="submit" size="small" isLoading={isPending} data-testid="product-edit-option-form-save-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
