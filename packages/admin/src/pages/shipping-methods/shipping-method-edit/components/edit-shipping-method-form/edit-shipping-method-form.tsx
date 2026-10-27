import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Input, Text, Textarea, toast } from "@medusajs/ui"
import type { MarketplaceShippingMethodDTO } from "@mercurjs/types"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Form } from "../../../../../components/common/form"
import { SectionRow } from "../../../../../components/common/section"
import { SwitchBox } from "../../../../../components/common/switch-box"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useUpdateShippingMethod } from "../../../../../hooks/api/shipping-methods"
import { useShippingOptionType } from "../../../../../hooks/api/shipping-option-types"
import { formatProvider } from "../../../../../lib/format-provider"

const EditShippingMethodSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  is_active: z.boolean(),
})

type EditShippingMethodValues = z.infer<typeof EditShippingMethodSchema>

export const EditShippingMethodForm = ({
  method,
}: {
  method: MarketplaceShippingMethodDTO
}) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const { shipping_option_type } = useShippingOptionType(
    method.shipping_option_type_id
  )

  const form = useForm<EditShippingMethodValues>({
    defaultValues: {
      name: method.name,
      description: method.description ?? "",
      is_active: method.is_active,
    },
    resolver: zodResolver(EditShippingMethodSchema),
  })

  const { mutateAsync, isPending } = useUpdateShippingMethod(method.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      {
        name: values.name,
        description: values.description || null,
        is_active: values.is_active,
      },
      {
        onSuccess: ({ shipping_method }) => {
          toast.success(
            t("shippingMethods.edit.successToast", {
              name: shipping_method.name,
            })
          )
          handleSuccess()
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="name"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("shippingMethods.fields.name")}</Form.Label>
                  <Form.Control>
                    <Input
                      autoComplete="off"
                      {...field}
                      data-testid="shipping-method-edit-form-name-input"
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="description"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>
                    {t("shippingMethods.fields.description")}
                  </Form.Label>
                  <Form.Control>
                    <Textarea
                      {...field}
                      data-testid="shipping-method-edit-form-description-input"
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <SwitchBox
              control={form.control}
              name="is_active"
              label={t("shippingMethods.fields.active")}
              description={t("shippingMethods.fields.activeHint")}
            />
            <div className="bg-ui-bg-subtle shadow-elevation-card-rest divide-y rounded-lg">
              <SectionRow
                title={t("shippingMethods.fields.code")}
                value={method.code}
              />
              <SectionRow
                title={t("shippingMethods.fields.provider")}
                value={formatProvider(method.provider_id)}
              />
              <SectionRow
                title={t("shippingMethods.fields.optionType")}
                value={shipping_option_type?.label ?? method.shipping_option_type_id}
              />
            </div>
            <Text size="small" className="text-ui-fg-subtle">
              {t("shippingMethods.fields.immutableHint")}
            </Text>
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button
                size="small"
                variant="secondary"
                data-testid="shipping-method-edit-form-cancel-button"
              >
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isPending}
              data-testid="shipping-method-edit-form-save-button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
