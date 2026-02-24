import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, Text, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { Form } from "../../../../../components/common/form"
import { RouteFocusModal, useRouteModal, } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useCreateShippingOptionType } from "../../../../../hooks/api"

const CreateShippingOptionTypeSchema = z.object({
  label: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
})

export const CreateShippingOptionTypeForm = () => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<z.infer<typeof CreateShippingOptionTypeSchema>>({
    defaultValues: {
      label: "",
      code: "",
      description: undefined,
    },
    resolver: zodResolver(CreateShippingOptionTypeSchema),
  })

  const generateCodeFromLabel = (label: string) => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
  }

  const { mutateAsync, isPending } = useCreateShippingOptionType()

  const handleSubmit = form.handleSubmit(
    async (values: z.infer<typeof CreateShippingOptionTypeSchema>) => {
      await mutateAsync(values, {
        onSuccess: ({ shipping_option_type }) => {
          toast.success(
            t("shippingOptionTypes.create.successToast", {
              label: shipping_option_type.label.trim(),
            })
          )

          handleSuccess(
            `/settings/locations/shipping-option-types/${shipping_option_type.id}`
          )
        },
        onError: (e) => {
          toast.error(e.message)
        },
      })
    }
  )

  return (
    <RouteFocusModal.Form form={form} data-testid="shipping-option-type-create-form">
      <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col">
        <RouteFocusModal.Body className="flex flex-col items-center overflow-auto p-16" data-testid="shipping-option-type-create-form-body">
          <div className="flex w-full max-w-[720px] flex-col gap-y-8">
            <div data-testid="shipping-option-type-create-form-header-section">
              <Heading data-testid="shipping-option-type-create-form-heading">{t("shippingOptionTypes.create.header")}</Heading>
              <Text size="small" className="text-ui-fg-subtle" data-testid="shipping-option-type-create-form-hint">
                {t("shippingOptionTypes.create.hint")}
              </Text>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <Form.Field
                control={form.control}
                name="label"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="shipping-option-type-create-form-label-item">
                      <Form.Label data-testid="shipping-option-type-create-form-label-label">
                        {t("shippingOptionTypes.fields.label")}
                      </Form.Label>
                      <Form.Control data-testid="shipping-option-type-create-form-label-control">
                        <Input
                          {...field}
                          onChange={(e) => {
                            if (
                              !form.getFieldState("code").isTouched ||
                              !form.getValues("code")
                            ) {
                              form.setValue(
                                "code",
                                generateCodeFromLabel(e.target.value)
                              )
                            }
                            field.onChange(e)
                          }}
                          data-testid="shipping-option-type-create-form-label-input"
                        />
                      </Form.Control>
                      <Form.ErrorMessage data-testid="shipping-option-type-create-form-label-error" />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="code"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="shipping-option-type-create-form-code-item">
                      <Form.Label data-testid="shipping-option-type-create-form-code-label">
                        {t("shippingOptionTypes.fields.code")}
                      </Form.Label>
                      <Form.Control data-testid="shipping-option-type-create-form-code-control">
                        <Input {...field} data-testid="shipping-option-type-create-form-code-input" />
                      </Form.Control>
                      <Form.ErrorMessage data-testid="shipping-option-type-create-form-code-error" />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="description"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="shipping-option-type-create-form-description-item">
                      <Form.Label data-testid="shipping-option-type-create-form-description-label">
                        {t("shippingOptionTypes.fields.description")}
                        <Text
                          size="small"
                          leading="compact"
                          className="text-ui-fg-muted ml-1 inline"
                        >
                          ({t("fields.optional")})
                        </Text>
                      </Form.Label>
                      <Form.Control data-testid="shipping-option-type-create-form-description-control">
                        <Input {...field} data-testid="shipping-option-type-create-form-description-input" />
                      </Form.Control>
                      <Form.ErrorMessage data-testid="shipping-option-type-create-form-description-error" />
                    </Form.Item>
                  )
                }}
              />
            </div>
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer data-testid="shipping-option-type-create-form-footer">
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button size="small" variant="secondary" data-testid="shipping-option-type-create-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              size="small"
              variant="primary"
              type="submit"
              isLoading={isPending}
              data-testid="shipping-option-type-create-form-create-button"
            >
              {t("actions.create")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
