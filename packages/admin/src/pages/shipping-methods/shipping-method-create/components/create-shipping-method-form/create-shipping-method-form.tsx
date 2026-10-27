import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, Select, Text, Textarea, toast } from "@medusajs/ui"
import type { TFunction } from "i18next"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Form } from "../../../../../components/common/form"
import { SwitchBox } from "../../../../../components/common/switch-box"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useFulfillmentProviders } from "../../../../../hooks/api/fulfillment-providers"
import { useCreateShippingMethod } from "../../../../../hooks/api/shipping-methods"
import { useShippingOptionTypes } from "../../../../../hooks/api/shipping-option-types"
import { useDocumentDirection } from "../../../../../hooks/use-document-direction"
import { formatProvider } from "../../../../../lib/format-provider"
import { generateCode } from "../../../../shipping-zones/common/utils"
import { cutoffTimeSchema, toCutoffTimePayload } from "../../../common/utils"

const createShippingMethodSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    description: z.string().optional(),
    provider_id: z.string().min(1),
    shipping_option_type_id: z.string().min(1),
    cutoff_time: cutoffTimeSchema(t),
    is_active: z.boolean(),
  })

type CreateShippingMethodValues = z.infer<
  ReturnType<typeof createShippingMethodSchema>
>

export const CreateShippingMethodForm = () => {
  const { t } = useTranslation()
  const direction = useDocumentDirection()
  const { handleSuccess } = useRouteModal()

  const schema = useMemo(() => createShippingMethodSchema(t), [t])

  const form = useForm<CreateShippingMethodValues>({
    defaultValues: {
      name: "",
      code: "",
      description: "",
      provider_id: "",
      shipping_option_type_id: "",
      cutoff_time: "",
      is_active: true,
    },
    resolver: zodResolver(schema),
  })

  const { fulfillment_providers } = useFulfillmentProviders({
    is_enabled: true,
    limit: 1000,
  })
  const { shipping_option_types } = useShippingOptionTypes({ limit: 1000 })

  const { mutateAsync, isPending } = useCreateShippingMethod()

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      {
        name: values.name,
        code: values.code,
        description: values.description || null,
        provider_id: values.provider_id,
        shipping_option_type_id: values.shipping_option_type_id,
        cutoff_time: toCutoffTimePayload(values.cutoff_time),
        is_active: values.is_active,
      },
      {
        onSuccess: ({ shipping_method }) => {
          toast.success(
            t("shippingMethods.create.successToast", {
              name: shipping_method.name,
            })
          )
          handleSuccess("/settings/locations/shipping-methods")
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  })

  return (
    <RouteFocusModal.Form form={form} data-testid="shipping-method-create-form">
      <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col">
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex flex-col items-center overflow-auto p-16">
          <div className="flex w-full max-w-[720px] flex-col gap-y-8">
            <div>
              <RouteFocusModal.Title asChild>
                <Heading data-testid="shipping-method-create-form-heading">
                  {t("shippingMethods.create.header")}
                </Heading>
              </RouteFocusModal.Title>
              <RouteFocusModal.Description asChild>
                <Text size="small" className="text-ui-fg-subtle">
                  {t("shippingMethods.create.hint")}
                </Text>
              </RouteFocusModal.Description>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                        onChange={(e) => {
                          if (!form.getFieldState("code").isDirty) {
                            form.setValue("code", generateCode(e.target.value))
                          }
                          field.onChange(e)
                        }}
                        data-testid="shipping-method-create-form-name-input"
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="code"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label tooltip={t("shippingMethods.fields.codeHint")}>
                      {t("shippingMethods.fields.code")}
                    </Form.Label>
                    <Form.Control>
                      <Input
                        autoComplete="off"
                        {...field}
                        data-testid="shipping-method-create-form-code-input"
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="provider_id"
                render={({ field: { onChange, ref, ...field } }) => (
                  <Form.Item>
                    <Form.Label>{t("shippingMethods.fields.provider")}</Form.Label>
                    <Form.Control>
                      <Select dir={direction} {...field} onValueChange={onChange}>
                        <Select.Trigger
                          ref={ref}
                          data-testid="shipping-method-create-form-provider-select"
                        >
                          <Select.Value
                            placeholder={t(
                              "shippingMethods.fields.providerPlaceholder"
                            )}
                          />
                        </Select.Trigger>
                        <Select.Content>
                          {(fulfillment_providers ?? []).map((provider) => (
                            <Select.Item
                              key={provider.id}
                              value={provider.id}
                              data-testid={`shipping-method-create-form-provider-option-${provider.id}`}
                            >
                              {formatProvider(provider.id)}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select>
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="shipping_option_type_id"
                render={({ field: { onChange, ref, ...field } }) => (
                  <Form.Item>
                    <Form.Label>
                      {t("shippingMethods.fields.optionType")}
                    </Form.Label>
                    <Form.Control>
                      <Select dir={direction} {...field} onValueChange={onChange}>
                        <Select.Trigger
                          ref={ref}
                          data-testid="shipping-method-create-form-option-type-select"
                        >
                          <Select.Value
                            placeholder={t(
                              "shippingMethods.fields.optionTypePlaceholder"
                            )}
                          />
                        </Select.Trigger>
                        <Select.Content>
                          {(shipping_option_types ?? []).map((type) => (
                            <Select.Item
                              key={type.id}
                              value={type.id}
                              data-testid={`shipping-method-create-form-option-type-option-${type.id}`}
                            >
                              {type.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select>
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            </div>
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
                      data-testid="shipping-method-create-form-description-input"
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="cutoff_time"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label
                    optional
                    tooltip={t("shippingMethods.fields.cutoffTimeHint")}
                  >
                    {t("shippingMethods.fields.cutoffTime")}
                  </Form.Label>
                  <Form.Control>
                    <Input
                      type="time"
                      {...field}
                      data-testid="shipping-method-create-form-cutoff-time-input"
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
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button
                size="small"
                variant="secondary"
                data-testid="shipping-method-create-form-cancel-button"
              >
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isPending}
              data-testid="shipping-method-create-form-submit-button"
            >
              {t("actions.create")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
