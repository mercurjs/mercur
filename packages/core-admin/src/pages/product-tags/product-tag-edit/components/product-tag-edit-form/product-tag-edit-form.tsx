import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { Button, Input, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Form } from "../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useUpdateProductTag } from "../../../../../hooks/api"

type ProductTagEditFormProps = {
  productTag: HttpTypes.AdminProductTag
}

const ProductTagEditSchema = z.object({
  value: z.string().min(1),
})

export const ProductTagEditForm = ({ productTag }: ProductTagEditFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<z.infer<typeof ProductTagEditSchema>>({
    defaultValues: {
      value: productTag.value,
    },
    resolver: zodResolver(ProductTagEditSchema),
  })

  const { mutateAsync, isPending } = useUpdateProductTag(productTag.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data, {
      onSuccess: ({ product_tag }) => {
        toast.success(
          t("productTags.edit.successToast", {
            value: product_tag.value,
          })
        )
        handleSuccess()
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  })

  return (
    <RouteDrawer.Form form={form} data-testid="product-tag-edit-form">
      <KeyboundForm
        className="flex size-full flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteDrawer.Body className="flex flex-1 flex-col overflow-auto" data-testid="product-tag-edit-form-body">
          <Form.Field
            control={form.control}
            name="value"
            render={({ field }) => {
              return (
                <Form.Item data-testid="product-tag-edit-form-value-item">
                  <Form.Label data-testid="product-tag-edit-form-value-label">{t("productTags.fields.value")}</Form.Label>
                  <Form.Control data-testid="product-tag-edit-form-value-control">
                    <Input {...field} data-testid="product-tag-edit-form-value-input" />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="product-tag-edit-form-value-error" />
                </Form.Item>
              )
            }}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer data-testid="product-tag-edit-form-footer">
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button variant="secondary" size="small" type="button" data-testid="product-tag-edit-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending} data-testid="product-tag-edit-form-save-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
