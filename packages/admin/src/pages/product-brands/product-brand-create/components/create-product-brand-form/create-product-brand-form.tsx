import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, Switch, Text, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { Form } from "../../../../../components/common/form"
import { HandleInput } from "../../../../../components/inputs/handle-input"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useCreateProductBrand } from "../../../../../hooks/api/product-brands"

const CreateProductBrandSchema = z.object({
  name: z.string().min(1),
  handle: z.string().optional(),
  is_restricted: z.boolean().optional(),
})

export const CreateProductBrandForm = () => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<z.infer<typeof CreateProductBrandSchema>>({
    defaultValues: {
      name: "",
      handle: "",
      is_restricted: false,
    },
    resolver: zodResolver(CreateProductBrandSchema),
  })

  const { mutateAsync, isPending } = useCreateProductBrand()

  const handleSubmit = form.handleSubmit(
    async (values: z.infer<typeof CreateProductBrandSchema>) => {
      await mutateAsync(
        {
          name: values.name,
          handle: values.handle ? values.handle : undefined,
          is_restricted: values.is_restricted,
        },
        {
          onSuccess: ({ product_brand }) => {
            toast.success(
              t("productBrands.create.successToast", {
                name: product_brand.name.trim(),
              })
            )

            handleSuccess(`/settings/product-brands/${product_brand.id}`)
          },
          onError: (e) => {
            toast.error(e.message)
          },
        }
      )
    }
  )

  return (
    <RouteFocusModal.Form form={form} data-testid="product-brand-create-form">
      <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col">
        <RouteFocusModal.Body
          className="flex flex-col items-center overflow-auto p-16"
          data-testid="product-brand-create-form-body"
        >
          <div className="flex w-full max-w-[720px] flex-col gap-y-8">
            <div data-testid="product-brand-create-form-header-section">
              <Heading data-testid="product-brand-create-form-heading">
                {t("productBrands.create.header")}
              </Heading>
              <Text
                size="small"
                className="text-ui-fg-subtle"
                data-testid="product-brand-create-form-hint"
              >
                {t("productBrands.create.hint")}
              </Text>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Field
                control={form.control}
                name="name"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="product-brand-create-form-name-item">
                      <Form.Label data-testid="product-brand-create-form-name-label">
                        {t("fields.name")}
                      </Form.Label>
                      <Form.Control data-testid="product-brand-create-form-name-control">
                        <Input
                          {...field}
                          data-testid="product-brand-create-form-name-input"
                        />
                      </Form.Control>
                      <Form.ErrorMessage data-testid="product-brand-create-form-name-error" />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="handle"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="product-brand-create-form-handle-item">
                      <Form.Label
                        optional
                        data-testid="product-brand-create-form-handle-label"
                      >
                        {t("fields.handle")}
                      </Form.Label>
                      <Form.Control data-testid="product-brand-create-form-handle-control">
                        <HandleInput
                          {...field}
                          data-testid="product-brand-create-form-handle-input"
                        />
                      </Form.Control>
                      <Form.ErrorMessage data-testid="product-brand-create-form-handle-error" />
                    </Form.Item>
                  )
                }}
              />
            </div>
            <Form.Field
              control={form.control}
              name="is_restricted"
              render={({ field: { value, onChange, ...field } }) => {
                return (
                  <Form.Item data-testid="product-brand-create-form-is-restricted-item">
                    <div className="bg-ui-bg-component shadow-elevation-card-rest flex gap-x-3 rounded-lg p-4">
                      <Form.Control data-testid="product-brand-create-form-is-restricted-control">
                        <Switch
                          dir="ltr"
                          className="mt-[2px] rtl:rotate-180"
                          checked={value}
                          onCheckedChange={(checked) => onChange(!!checked)}
                          {...field}
                          data-testid="product-brand-create-form-is-restricted-switch"
                        />
                      </Form.Control>
                      <div className="flex flex-col">
                        <Form.Label data-testid="product-brand-create-form-is-restricted-label">
                          {t("productBrands.fields.isRestricted")}
                        </Form.Label>
                        <Form.Hint data-testid="product-brand-create-form-is-restricted-hint">
                          {t("productBrands.fields.isRestrictedHint")}
                        </Form.Hint>
                      </div>
                    </div>
                    <Form.ErrorMessage data-testid="product-brand-create-form-is-restricted-error" />
                  </Form.Item>
                )
              }}
            />
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer data-testid="product-brand-create-form-footer">
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button
                size="small"
                variant="secondary"
                data-testid="product-brand-create-form-cancel-button"
              >
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              size="small"
              variant="primary"
              type="submit"
              isLoading={isPending}
              data-testid="product-brand-create-form-create-button"
            >
              {t("actions.create")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
