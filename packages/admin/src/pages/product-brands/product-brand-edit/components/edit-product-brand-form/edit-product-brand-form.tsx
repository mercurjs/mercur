import { zodResolver } from "@hookform/resolvers/zod"
import { ProductBrandDTO } from "@mercurjs/types"
import { Button, Input, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { Form } from "../../../../../components/common/form"
import { HandleInput } from "../../../../../components/inputs/handle-input"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useUpdateProductBrand } from "../../../../../hooks/api/product-brands"

const EditProductBrandSchema = z.object({
  name: z.string().min(1),
  handle: z.string().optional(),
})

type EditProductBrandFormProps = {
  productBrand: ProductBrandDTO
}

export const EditProductBrandForm = ({
  productBrand,
}: EditProductBrandFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<z.infer<typeof EditProductBrandSchema>>({
    defaultValues: {
      name: productBrand.name,
      handle: productBrand.handle,
    },
    resolver: zodResolver(EditProductBrandSchema),
  })

  const { mutateAsync, isPending } = useUpdateProductBrand(productBrand.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      {
        name: data.name,
        handle: data.handle ? data.handle : undefined,
      },
      {
        onSuccess: ({ product_brand }) => {
          toast.success(
            t("productBrands.edit.successToast", {
              name: product_brand.name,
            })
          )
          handleSuccess()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  return (
    <RouteDrawer.Form form={form} data-testid="product-brand-edit-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <RouteDrawer.Body
          className="flex flex-1 flex-col gap-y-8 overflow-y-auto"
          data-testid="product-brand-edit-form-body"
        >
          <Form.Field
            control={form.control}
            name="name"
            render={({ field }) => {
              return (
                <Form.Item data-testid="product-brand-edit-form-name-item">
                  <Form.Label data-testid="product-brand-edit-form-name-label">
                    {t("fields.name")}
                  </Form.Label>
                  <Form.Control data-testid="product-brand-edit-form-name-control">
                    <Input
                      {...field}
                      data-testid="product-brand-edit-form-name-input"
                    />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="product-brand-edit-form-name-error" />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="handle"
            render={({ field }) => {
              return (
                <Form.Item data-testid="product-brand-edit-form-handle-item">
                  <Form.Label
                    optional
                    data-testid="product-brand-edit-form-handle-label"
                  >
                    {t("fields.handle")}
                  </Form.Label>
                  <Form.Control data-testid="product-brand-edit-form-handle-control">
                    <HandleInput
                      {...field}
                      data-testid="product-brand-edit-form-handle-input"
                    />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="product-brand-edit-form-handle-error" />
                </Form.Item>
              )
            }}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer data-testid="product-brand-edit-form-footer">
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button
                size="small"
                variant="secondary"
                data-testid="product-brand-edit-form-cancel-button"
              >
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isPending}
              data-testid="product-brand-edit-form-save-button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
