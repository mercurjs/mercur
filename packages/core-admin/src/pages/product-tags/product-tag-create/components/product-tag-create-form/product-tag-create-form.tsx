import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, Text, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { Form } from "../../../../../components/common/form"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useCreateProductTag } from "../../../../../hooks/api"

const ProductTagCreateSchema = z.object({
  value: z.string().min(1),
})

export const ProductTagCreateForm = () => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<z.infer<typeof ProductTagCreateSchema>>({
    defaultValues: {
      value: "",
    },
    resolver: zodResolver(ProductTagCreateSchema),
  })

  const { mutateAsync, isPending } = useCreateProductTag()

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data, {
      onSuccess: ({ product_tag }) => {
        toast.success(
          t("productTags.create.successToast", {
            value: product_tag.value,
          })
        )
        handleSuccess(`../${product_tag.id}`)
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  })

  return (
    <RouteFocusModal.Form form={form} data-testid="product-tag-create-form">
      <KeyboundForm
        className="flex size-full flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteFocusModal.Header data-testid="product-tag-create-form-header" />
        <RouteFocusModal.Body className="flex flex-1 justify-center overflow-auto px-6 py-16" data-testid="product-tag-create-form-body">
          <div className="flex w-full max-w-[720px] flex-col gap-y-8">
            <div className="flex flex-col gap-y-1" data-testid="product-tag-create-form-header-section">
              <RouteFocusModal.Title asChild>
                <Heading data-testid="product-tag-create-form-heading">{t("productTags.create.header")}</Heading>
              </RouteFocusModal.Title>
              <RouteFocusModal.Description asChild>
                <Text size="small" className="text-ui-fg-subtle" data-testid="product-tag-create-form-subtitle">
                  {t("productTags.create.subtitle")}
                </Text>
              </RouteFocusModal.Description>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Form.Field
                control={form.control}
                name="value"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="product-tag-create-form-value-item">
                      <Form.Label data-testid="product-tag-create-form-value-label">{t("productTags.fields.value")}</Form.Label>
                      <Form.Control data-testid="product-tag-create-form-value-control">
                        <Input {...field} data-testid="product-tag-create-form-value-input" />
                      </Form.Control>
                      <Form.ErrorMessage data-testid="product-tag-create-form-value-error" />
                    </Form.Item>
                  )
                }}
              />
            </div>
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer data-testid="product-tag-create-form-footer">
          <div className="flex items-center justify-end gap-2">
            <RouteFocusModal.Close asChild>
              <Button size="small" variant="secondary" type="button" data-testid="product-tag-create-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button size="small" type="submit" isLoading={isPending} data-testid="product-tag-create-form-save-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
